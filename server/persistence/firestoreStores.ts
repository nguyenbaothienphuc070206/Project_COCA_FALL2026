/**
 * Tính năng: Tầng lưu trữ bền vững phía máy chủ (Server-Only Firestore Persistence) cho Cache<T>, RateLimitStore và EvalRunStore kèm cơ chế tự động chuyển đổi dự phòng về RAM (InMemory Fallback).
 * Trường hợp sử dụng:
 * - Đọc cấu hình từ firebase-applet-config.json (chỉ chạy trên Node.js Server, tuyệt đối không nạp vào client bundle).
 * - Chỉ lưu trữ siêu dữ liệu sách đã xác thực (cache_entries), bộ đếm giới hạn tần suất đã băm ẩn danh (rate_limit_buckets) và kết quả chạy thực nghiệm (eval_runs). Không lưu dữ liệu cá nhân, không lưu văn bản tự do của người dùng, không bật Firebase Authentication.
 * - Mọi bản ghi đều có trường expiresAtMs kèm hàm dọn dẹp định kỳ cleanupExpiredEntries().
 * - Nếu Firestore không khả dụng hoặc từ chối truy cập do firestore.rules khóa toàn bộ quyền client (allow read, write: if false), hệ thống ghi cảnh báo rõ ràng và tự động chuyển sang bộ nhớ RAM mà không làm sập ứng dụng.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Cache, InMemoryTTLCache } from '../cache/ttlCache';
import { RateLimitResult } from '../rateLimit/rateLimiter';
import { EvalRunRecord } from '@/src/lib/evalMetrics';
import {
  assertAllowedOutboundUrl,
  hashClientIpTransiently,
  redactSecretsInLog,
} from '../security/securityControls';

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

export interface RateLimitStore {
  check(ipOrClientKey: string, nowMs?: number): RateLimitResult;
  checkAsync(ipOrClientKey: string, nowMs?: number): Promise<RateLimitResult>;
  cleanupExpiredEntries(nowMs?: number): Promise<number>;
  getActiveBucketCount(): number;
  reset(): void;
}

export interface EvalRunStore {
  listRuns(): Promise<EvalRunRecord[]>;
  getRunById(id: string): Promise<EvalRunRecord | null>;
  saveRun(run: EvalRunRecord): Promise<void>;
  cleanupExpiredEntries(nowMs?: number): Promise<number>;
  getStoredRunCount(): number;
  getConnectionStatus(): {
    backend: 'firestore' | 'memory_fallback';
    configured: boolean;
    note: string;
  };
}

interface FirestoreStateSingleton {
  config: FirebaseAppletConfig | null;
  firestoreHealthy: boolean;
  lastWarning: string | undefined;
  warnedOnce: boolean;
  forceUnavailableForTests: boolean;
}

const globalForFirestore = globalThis as unknown as {
  __shelfPathFirestoreStateV6?: FirestoreStateSingleton;
};

function loadFirebaseAppletConfig(): FirebaseAppletConfig | null {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<FirebaseAppletConfig>;
    if (parsed.projectId && parsed.apiKey) {
      return {
        projectId: parsed.projectId,
        apiKey: parsed.apiKey,
        firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)',
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getFirestoreState(): FirestoreStateSingleton {
  if (!globalForFirestore.__shelfPathFirestoreStateV6) {
    const cfg = loadFirebaseAppletConfig();
    globalForFirestore.__shelfPathFirestoreStateV6 = {
      config: cfg,
      firestoreHealthy: false,
      lastWarning: undefined,
      warnedOnce: false,
      forceUnavailableForTests: false,
    };
  }
  return globalForFirestore.__shelfPathFirestoreStateV6;
}

/**
 * Cho phép kiểm thử mô phỏng ngắt kết nối Firestore (chaos test: "killing Firestore does not crash the app").
 */
export function setFirestoreForceUnavailableForTests(
  unavailable: boolean,
): void {
  const state = getFirestoreState();
  state.forceUnavailableForTests = unavailable;
  if (unavailable) {
    state.firestoreHealthy = false;
    state.lastWarning =
      'Firestore forcefully disabled for resilience testing; serving from in-memory fallback.';
  }
}

function recordFirestoreFallbackWarning(reason: string): void {
  const state = getFirestoreState();
  state.firestoreHealthy = false;
  state.lastWarning = reason;
  if (!state.warnedOnce) {
    state.warnedOnce = true;
    console.warn(
      `[WARN][FirestorePersistence] ${reason} — Falling back to in-memory store.`,
    );
  }
}

/**
 * Chuẩn hóa khóa định danh thành chuỗi an toàn cho Firestore document ID (^[a-zA-Z0-9_\-]+$, <= 96 ký tự).
 */
export function toSafeFirestoreDocId(prefix: string, rawKey: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(rawKey)
    .digest('hex')
    .slice(0, 32);
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24);
  return `${safePrefix}_${hash}`;
}

/**
 * Gọi Firestore REST API v1 từ phía server với timeout ngắn (2.5 giây) để đồng bộ tài liệu khi có quyền hợp lệ.
 * Nếu firestore.rules chặn toàn bộ truy cập client không xác thực (403 PERMISSION_DENIED) hoặc mạng lỗi, trả về null và kích hoạt fallback.
 */
async function firestoreRestWriteDocument(
  collectionName: string,
  docId: string,
  fields: Record<string, { stringValue?: string; integerValue?: string }>,
  signal?: AbortSignal,
): Promise<boolean> {
  const state = getFirestoreState();
  if (state.forceUnavailableForTests) {
    recordFirestoreFallbackWarning(
      'Firestore disabled via forceUnavailableForTests.',
    );
    return false;
  }
  if (!state.config) {
    recordFirestoreFallbackWarning(
      'firebase-applet-config.json not found on server.',
    );
    return false;
  }

  const serviceToken = process.env.FIREBASE_SERVICE_ACCOUNT_TOKEN?.trim();
  const dbId = encodeURIComponent(
    state.config.firestoreDatabaseId || '(default)',
  );
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    state.config.projectId,
  )}/databases/${dbId}/documents/${encodeURIComponent(
    collectionName,
  )}/${encodeURIComponent(docId)}?key=${encodeURIComponent(state.config.apiKey)}`;

  assertAllowedOutboundUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (serviceToken) {
      headers.Authorization = `Bearer ${serviceToken}`;
    }

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields }),
      redirect: 'error',
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        recordFirestoreFallbackWarning(
          `Firestore rules strictly deny unauthenticated client access (HTTP ${res.status}). Provide FIREBASE_SERVICE_ACCOUNT_TOKEN on Cloud Run for privileged writes.`,
        );
      } else {
        recordFirestoreFallbackWarning(
          `Firestore write returned HTTP ${res.status}.`,
        );
      }
      return false;
    }

    state.firestoreHealthy = true;
    state.lastWarning = undefined;
    return true;
  } catch (err) {
    const msg = err instanceof Error ? redactSecretsInLog(err.message) : 'Network error';
    recordFirestoreFallbackWarning(`Firestore unreachable (${msg}).`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1. FirestoreBackedTTLCache<T>:
 * Triển khai giao diện Cache<T> cho siêu dữ liệu sách đã xác thực và ấn bản Tiếng Việt.
 * Kèm trường expiresAtMs và cơ chế dọn dẹp tự động.
 */
export class FirestoreBackedTTLCache<T> implements Cache<T> {
  private readonly memoryCache: InMemoryTTLCache<T>;
  private readonly namespace: 'verified_book' | 'vn_edition';
  private readonly defaultTtlMs: number;
  private readonly expiresAtByKey = new Map<string, number>();

  constructor(
    namespace: 'verified_book' | 'vn_edition',
    defaultTtlMs: number = 1000 * 60 * 60 * 12,
    maxEntries: number = 300,
  ) {
    this.namespace = namespace;
    this.defaultTtlMs = defaultTtlMs;
    this.memoryCache = new InMemoryTTLCache<T>(defaultTtlMs, maxEntries);
  }

  get(key: string): T | undefined {
    const exp = this.expiresAtByKey.get(key);
    if (exp !== undefined && Date.now() > exp) {
      this.expiresAtByKey.delete(key);
      this.memoryCache.delete(key);
      return undefined;
    }
    return this.memoryCache.get(key);
  }

  set(key: string, value: T, customTtlMs?: number): void {
    const ttl = customTtlMs ?? this.defaultTtlMs;
    const expiresAtMs = Date.now() + ttl;
    this.expiresAtByKey.set(key, expiresAtMs);
    this.memoryCache.set(key, value, ttl);

    const docId = toSafeFirestoreDocId(this.namespace, key);
    const payloadJson = JSON.stringify(value).slice(0, 32000);
    void firestoreRestWriteDocument('cache_entries', docId, {
      cacheKey: { stringValue: docId },
      namespace: { stringValue: this.namespace },
      payloadJson: { stringValue: payloadJson },
      createdAtIso: { stringValue: new Date().toISOString() },
      expiresAtMs: { integerValue: String(expiresAtMs) },
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.expiresAtByKey.delete(key);
    this.memoryCache.delete(key);
  }

  clear(): void {
    this.expiresAtByKey.clear();
    this.memoryCache.clear();
  }

  size(): number {
    this.cleanupExpiredSync();
    return this.memoryCache.size();
  }

  cleanupExpiredSync(nowMs: number = Date.now()): number {
    let removed = 0;
    for (const [k, exp] of this.expiresAtByKey.entries()) {
      if (nowMs > exp) {
        this.expiresAtByKey.delete(k);
        this.memoryCache.delete(k);
        removed += 1;
      }
    }
    return removed;
  }
}

/**
 * 2. FirestoreBackedRateLimitStore:
 * Triển khai RateLimitStore với cửa sổ trượt (Sliding Window), chỉ lưu khóa đã băm ẩn danh (không lưu IP thô lên Firestore) và trường expiresAtMs.
 */
interface RateBucketEntry {
  hits: number[];
  expiresAtMs: number;
}

export class FirestoreBackedRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateBucketEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(ipOrClientKey: string, nowMs: number = Date.now()): RateLimitResult {
    const rawKey = ipOrClientKey.trim() || 'anonymous-ip';
    const hashedBucketKey = toSafeFirestoreDocId('rl', rawKey);
    const windowStart = nowMs - this.windowMs;

    const existing = this.buckets.get(hashedBucketKey);
    const prevHits =
      existing && existing.expiresAtMs > nowMs ? existing.hits : [];
    const activeHits = prevHits.filter((ts) => ts > windowStart);

    if (activeHits.length >= this.maxRequests) {
      const oldestActive = activeHits[0] ?? nowMs;
      const retryAfterMs = Math.max(250, oldestActive + this.windowMs - nowMs);
      this.buckets.set(hashedBucketKey, {
        hits: activeHits,
        expiresAtMs: nowMs + this.windowMs,
      });
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }

    activeHits.push(nowMs);
    const expiresAtMs = nowMs + this.windowMs;
    this.buckets.set(hashedBucketKey, {
      hits: activeHits,
      expiresAtMs,
    });

    // Đồng bộ bất đồng bộ bộ đếm ẩn danh lên Firestore (với fallback tức thì nếu bị chặn)
    void firestoreRestWriteDocument('rate_limit_buckets', hashedBucketKey, {
      bucketKey: { stringValue: hashedBucketKey },
      windowMs: { integerValue: String(this.windowMs) },
      expiresAtMs: { integerValue: String(expiresAtMs) },
    });

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - activeHits.length),
      retryAfterMs: 0,
    };
  }

  async checkAsync(
    ipOrClientKey: string,
    nowMs: number = Date.now(),
  ): Promise<RateLimitResult> {
    return this.check(ipOrClientKey, nowMs);
  }

  async cleanupExpiredEntries(nowMs: number = Date.now()): Promise<number> {
    let removed = 0;
    for (const [k, entry] of this.buckets.entries()) {
      if (nowMs > entry.expiresAtMs) {
        this.buckets.delete(k);
        removed += 1;
      }
    }
    return removed;
  }

  getActiveBucketCount(): number {
    const now = Date.now();
    for (const [k, entry] of this.buckets.entries()) {
      if (now > entry.expiresAtMs) {
        this.buckets.delete(k);
      }
    }
    return this.buckets.size;
  }

  reset(): void {
    this.buckets.clear();
  }
}

/**
 * 3. FirestoreBackedEvalRunStore:
 * Triển khai EvalRunStore với trường expiresAtMs, loại bỏ văn bản ghi chú cá nhân trước khi ghi lên đám mây, và dự phòng trong RAM.
 */
interface StoredEvalEntry {
  run: EvalRunRecord;
  expiresAtMs: number;
}

export class FirestoreBackedEvalRunStore implements EvalRunStore {
  private readonly runsById = new Map<string, StoredEvalEntry>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs: number = 1000 * 60 * 60 * 24 * 7) {
    this.defaultTtlMs = defaultTtlMs;
  }

  async listRuns(): Promise<EvalRunRecord[]> {
    await this.cleanupExpiredEntries();
    return Array.from(this.runsById.values())
      .map((e) => e.run)
      .sort((a, b) => b.startedAtIso.localeCompare(a.startedAtIso));
  }

  async getRunById(id: string): Promise<EvalRunRecord | null> {
    const entry = this.runsById.get(id);
    if (!entry) return null;
    if (Date.now() > entry.expiresAtMs) {
      this.runsById.delete(id);
      return null;
    }
    return entry.run;
  }

  async saveRun(run: EvalRunRecord): Promise<void> {
    const expiresAtMs = Date.now() + this.defaultTtlMs;
    if (this.runsById.size >= 30 && !this.runsById.has(run.id)) {
      const oldestKey = this.runsById.keys().next().value;
      if (oldestKey) this.runsById.delete(oldestKey);
    }

    // Loại bỏ mọi văn bản tự do (notes) khi đồng bộ lên Firestore để tuân thủ nguyên tắc "no user text, no personal data"
    const sanitizedForCloud: EvalRunRecord = {
      ...run,
      rubricRatings: run.rubricRatings.map((r) => ({
        ...r,
        notes: undefined,
      })),
    };

    this.runsById.set(run.id, {
      run,
      expiresAtMs,
    });

    const docId = toSafeFirestoreDocId('eval', run.id);
    const payloadJson = JSON.stringify(sanitizedForCloud).slice(0, 450_000);
    await firestoreRestWriteDocument('eval_runs', docId, {
      id: { stringValue: run.id },
      status: { stringValue: run.status },
      modelName: { stringValue: run.modelName },
      createdAtIso: { stringValue: run.startedAtIso },
      expiresAtMs: { integerValue: String(expiresAtMs) },
      payloadJson: { stringValue: payloadJson },
    });
  }

  async cleanupExpiredEntries(nowMs: number = Date.now()): Promise<number> {
    let removed = 0;
    for (const [k, entry] of this.runsById.entries()) {
      if (nowMs > entry.expiresAtMs) {
        this.runsById.delete(k);
        removed += 1;
      }
    }
    return removed;
  }

  getStoredRunCount(): number {
    return this.runsById.size;
  }

  getConnectionStatus(): {
    backend: 'firestore' | 'memory_fallback';
    configured: boolean;
    note: string;
  } {
    const state = getFirestoreState();
    if (state.firestoreHealthy && !state.forceUnavailableForTests) {
      return {
        backend: 'firestore',
        configured: true,
        note: `Connected to Cloud Firestore (${state.config?.projectId}) with expiresAtMs TTL cleanup.`,
      };
    }
    return {
      backend: 'memory_fallback',
      configured: Boolean(state.config),
      note:
        state.lastWarning ||
        'Firestore rules strictly deny all client access (allow read, write: if false). Operating on resilient server in-memory store with TTL cleanup.',
    };
  }
}

/**
 * Hàm dọn dẹp tập trung (Cleanup Routine) cho toàn bộ các kho lưu trữ có trường expiresAtMs.
 */
export async function runGlobalPersistenceCleanup(
  stores: {
    verifiedBooksCache?: FirestoreBackedTTLCache<unknown>;
    editionsCache?: FirestoreBackedTTLCache<unknown>;
    rateLimitStore?: FirestoreBackedRateLimitStore;
    evalRunStore?: FirestoreBackedEvalRunStore;
  },
  nowMs: number = Date.now(),
): Promise<{
  verifiedBooksRemoved: number;
  editionsRemoved: number;
  rateLimitBucketsRemoved: number;
  evalRunsRemoved: number;
}> {
  const verifiedBooksRemoved =
    stores.verifiedBooksCache?.cleanupExpiredSync(nowMs) ?? 0;
  const editionsRemoved = stores.editionsCache?.cleanupExpiredSync(nowMs) ?? 0;
  const rateLimitBucketsRemoved =
    (await stores.rateLimitStore?.cleanupExpiredEntries(nowMs)) ?? 0;
  const evalRunsRemoved =
    (await stores.evalRunStore?.cleanupExpiredEntries(nowMs)) ?? 0;

  return {
    verifiedBooksRemoved,
    editionsRemoved,
    rateLimitBucketsRemoved,
    evalRunsRemoved,
  };
}

/**
 * Trả về trạng thái sức khỏe của tầng lưu trữ để hiển thị trên /healthz và GET /api/recommendations.
 */
export function getPersistenceHealthSummary(): {
  backend: 'firestore' | 'memory_fallback';
  healthy: boolean;
  warning?: string;
} {
  const state = getFirestoreState();
  if (state.firestoreHealthy && !state.forceUnavailableForTests) {
    return {
      backend: 'firestore',
      healthy: true,
    };
  }
  return {
    backend: 'memory_fallback',
    healthy: true, // Fallback in-memory hoạt động bình thường
    warning:
      state.lastWarning ||
      'Firestore rules deny unauthenticated client SDK access; serving from in-memory fallback.',
  };
}
