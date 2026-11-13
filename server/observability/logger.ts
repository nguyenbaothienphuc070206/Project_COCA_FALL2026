/**
 * Tính năng: Bộ ghi nhật ký JSON có cấu trúc (Structured JSON Observability Logger) tương thích Google Cloud Logging (Giai đoạn 10).
 * Trường hợp sử dụng:
 * - Ghi nhận các sự kiện vận hành quan trọng kèm `requestId`, `stage`, `durationMs`, `outcome` và siêu dữ liệu định lượng.
 * - TUYỆT ĐỐI KHÔNG ghi văn bản đầu vào của người dùng (`topic`, `refinementText`, `notes`) hay thông tin định danh cá nhân (PII / địa chỉ IP thô).
 * - Định nghĩa đầy đủ các sự kiện chuẩn cho Cloud Logging & Log-based Alerts:
 *   1. `BOOK_VERIFICATION_SUCCESS` & `BOOK_VERIFICATION_FAILURE` (kèm `failureReason`: `not_found`, `low_title_similarity`, `author_mismatch`, `source_unavailable`)
 *   2. `EXTERNAL_SOURCE_OUTAGE` (Open Library / Google Books / cả hai nguồn không phản hồi)
 *   3. `RATE_LIMIT_429` (vượt ngưỡng tần suất theo IP băm hoặc toàn cục)
 *   4. `BUDGET_CIRCUIT_BREAKER_TRIP` (`DAILY_BUDGET_EXHAUSTED` hoặc `CIRCUIT_BREAKER_OPEN`)
 *   5. `LLM_CALL_LATENCY` (thời gian phản hồi của mô hình Gemini ở Stage 1, 2, 3, 5)
 *   6. `TIME_TO_FIRST_BOOK` (độ trễ từ lúc bắt đầu yêu cầu đến khi cuốn sách đầu tiên vượt qua kiểm chứng)
 *   7. `PIPELINE_STAGE_OUTCOME` (tổng kết thời gian và kết quả từng giai đoạn pipeline)
 */

import { redactSecretsInLog } from '../security/securityControls';

export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type ObservabilityEventName =
  | 'BOOK_VERIFICATION_SUCCESS'
  | 'BOOK_VERIFICATION_FAILURE'
  | 'EXTERNAL_SOURCE_OUTAGE'
  | 'RATE_LIMIT_429'
  | 'BUDGET_CIRCUIT_BREAKER_TRIP'
  | 'LLM_CALL_LATENCY'
  | 'TIME_TO_FIRST_BOOK'
  | 'PIPELINE_STAGE_OUTCOME';

export type ObservabilityStage =
  | 'http_ingress'
  | 'stage1_query_understanding'
  | 'stage2_search_grounding'
  | 'stage3_candidate_extraction'
  | 'stage4_verification'
  | 'stage5_mmr_ranking'
  | 'stage6_roadmap_ordering'
  | 'pipeline_complete';

export type ObservabilityOutcome =
  | 'success'
  | 'failure'
  | 'rejected'
  | 'rate_limited'
  | 'circuit_open'
  | 'budget_exhausted'
  | 'outage_fail_closed'
  | 'fallback';

/**
 * Các khóa bị cấm tuyệt đối trong mọi bản ghi log để bảo vệ quyền riêng tư (không lưu văn bản người dùng hay IP thô).
 */
const FORBIDDEN_PII_OR_USER_TEXT_KEYS = new Set<string>([
  'topic',
  'rawTopic',
  'query',
  'queries',
  'searchQueries',
  'refinementText',
  'userText',
  'rawText',
  'ip',
  'clientIp',
  'rawIp',
  'email',
  'notes',
  'prompt',
]);

export interface StructuredLogEntry {
  severity: LogSeverity;
  timestamp: string;
  service: 'shelfpath-server';
  event: ObservabilityEventName;
  requestId: string;
  stage: ObservabilityStage;
  durationMs: number;
  outcome: ObservabilityOutcome;
  metrics?: Record<string, string | number | boolean | null>;
}

const MAX_RECENT_LOGS_BUFFER = 250;
const recentStructuredLogsBuffer: StructuredLogEntry[] = [];

/**
 * Lọc bỏ mọi trường nhạy cảm/PII hoặc văn bản tự do khỏi đối tượng metrics trước khi xuất JSON log.
 */
function sanitizeLogMetrics(
  rawMetrics?: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean | null> | undefined {
  if (!rawMetrics) return undefined;
  const clean: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(rawMetrics)) {
    if (FORBIDDEN_PII_OR_USER_TEXT_KEYS.has(key)) {
      continue;
    }
    if (value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      clean[key] = redactSecretsInLog(value).slice(0, 120);
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      clean[key] = value;
    }
  }

  return Object.keys(clean).length > 0 ? clean : undefined;
}

/**
 * Phát một dòng nhật ký JSON có cấu trúc (Structured JSON Log) chuẩn Cloud Logging và lưu vào bộ đệm kiểm thử.
 */
export function logStructuredEvent(params: {
  severity?: LogSeverity;
  event: ObservabilityEventName;
  requestId: string;
  stage: ObservabilityStage;
  durationMs: number;
  outcome: ObservabilityOutcome;
  metrics?: Record<string, string | number | boolean | null | undefined>;
}): StructuredLogEntry {
  const safeDurationMs = Math.max(0, Math.round(params.durationMs));
  const cleanMetrics = sanitizeLogMetrics(params.metrics);

  const entry: StructuredLogEntry = {
    severity: params.severity ?? 'INFO',
    timestamp: new Date().toISOString(),
    service: 'shelfpath-server',
    event: params.event,
    requestId: redactSecretsInLog(params.requestId || 'req_unknown').slice(0, 64),
    stage: params.stage,
    durationMs: safeDurationMs,
    outcome: params.outcome,
    ...(cleanMetrics ? { metrics: cleanMetrics } : {}),
  };

  recentStructuredLogsBuffer.push(entry);
  if (recentStructuredLogsBuffer.length > MAX_RECENT_LOGS_BUFFER) {
    recentStructuredLogsBuffer.shift();
  }

  // Xuất đúng 1 dòng JSON (single-line JSON) cho bộ thu thập log của Cloud Run / Cloud Logging
  const serialized = JSON.stringify(entry);
  if (entry.severity === 'ERROR' || entry.severity === 'CRITICAL') {
    console.error(serialized);
  } else if (entry.severity === 'WARNING') {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }

  return entry;
}

/**
 * Helper: Ghi log khi xác thực thành công 1 cuốn sách qua Open Library hoặc Google Books.
 */
export function logBookVerificationSuccess(params: {
  requestId: string;
  durationMs: number;
  source: 'open_library' | 'google_books' | 'open_library+google_books' | 'cache';
  titleSimilarity: number;
  authorMatched: boolean;
  hasIsbn13: boolean;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: 'INFO',
    event: 'BOOK_VERIFICATION_SUCCESS',
    requestId: params.requestId,
    stage: 'stage4_verification',
    durationMs: params.durationMs,
    outcome: 'success',
    metrics: {
      catalogSource: params.source,
      titleSimilarity: Number(params.titleSimilarity.toFixed(3)),
      authorMatched: params.authorMatched,
      hasIsbn13: params.hasIsbn13,
    },
  });
}

/**
 * Helper: Ghi log khi loại bỏ 1 ứng viên sách không vượt qua kiểm chứng (kèm mã lý do).
 */
export function logBookVerificationFailure(params: {
  requestId: string;
  durationMs: number;
  failureReason:
    | 'not_found'
    | 'low_title_similarity'
    | 'author_mismatch'
    | 'source_unavailable';
  titleSimilarity: number;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: params.failureReason === 'source_unavailable' ? 'WARNING' : 'INFO',
    event: 'BOOK_VERIFICATION_FAILURE',
    requestId: params.requestId,
    stage: 'stage4_verification',
    durationMs: params.durationMs,
    outcome: 'rejected',
    metrics: {
      failureReason: params.failureReason,
      titleSimilarity: Number(params.titleSimilarity.toFixed(3)),
    },
  });
}

/**
 * Helper: Ghi log khi nguồn danh mục bên ngoài (Open Library / Google Books) bị gián đoạn.
 */
export function logExternalSourceOutage(params: {
  requestId: string;
  durationMs: number;
  provider: 'open_library' | 'google_books' | 'both_catalogs';
  failClosedTriggered: boolean;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: params.failClosedTriggered ? 'ERROR' : 'WARNING',
    event: 'EXTERNAL_SOURCE_OUTAGE',
    requestId: params.requestId,
    stage: 'stage4_verification',
    durationMs: params.durationMs,
    outcome: params.failClosedTriggered ? 'outage_fail_closed' : 'failure',
    metrics: {
      provider: params.provider,
      failClosedTriggered: params.failClosedTriggered,
    },
  });
}

/**
 * Helper: Ghi log khi từ chối yêu cầu với mã 429 Rate Limit.
 */
export function logRateLimit429(params: {
  requestId: string;
  limiterScope: 'per_ip_recommendations' | 'global_recommendations' | 'verification_anti_scrape' | 'refine_or_dismiss';
  retryAfterSeconds: number;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: 'WARNING',
    event: 'RATE_LIMIT_429',
    requestId: params.requestId,
    stage: 'http_ingress',
    durationMs: 0,
    outcome: 'rate_limited',
    metrics: {
      limiterScope: params.limiterScope,
      retryAfterSeconds: params.retryAfterSeconds,
    },
  });
}

/**
 * Helper: Ghi log khi Ngân sách Gemini hàng ngày cạn kiệt hoặc Cầu dao bảo vệ (Circuit Breaker) mở.
 */
export function logBudgetCircuitBreakerTrip(params: {
  requestId: string;
  tripReason: 'DAILY_BUDGET_EXHAUSTED' | 'CIRCUIT_BREAKER_OPEN';
  callsUsedToday: number;
  dailyBudgetLimit: number;
  consecutiveFailures: number;
  retryAfterSeconds: number;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: 'CRITICAL',
    event: 'BUDGET_CIRCUIT_BREAKER_TRIP',
    requestId: params.requestId,
    stage: 'http_ingress',
    durationMs: 0,
    outcome:
      params.tripReason === 'CIRCUIT_BREAKER_OPEN'
        ? 'circuit_open'
        : 'budget_exhausted',
    metrics: {
      tripReason: params.tripReason,
      callsUsedToday: params.callsUsedToday,
      dailyBudgetLimit: params.dailyBudgetLimit,
      consecutiveFailures: params.consecutiveFailures,
      retryAfterSeconds: params.retryAfterSeconds,
    },
  });
}

/**
 * Helper: Ghi log độ trễ của mỗi lệnh gọi mô hình Gemini (không bao giờ ghi nội dung prompt).
 */
export function logLlmCallLatency(params: {
  requestId: string;
  stage: ObservabilityStage;
  model: string;
  durationMs: number;
  outcome: 'success' | 'failure' | 'fallback';
  inputCharCount: number;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: params.outcome === 'failure' ? 'WARNING' : 'INFO',
    event: 'LLM_CALL_LATENCY',
    requestId: params.requestId,
    stage: params.stage,
    durationMs: params.durationMs,
    outcome: params.outcome,
    metrics: {
      model: params.model,
      inputCharCount: params.inputCharCount,
    },
  });
}

/**
 * Helper: Ghi log thời gian từ khi bắt đầu pipeline đến khi cuốn sách đã kiểm chứng đầu tiên sẵn sàng (`TIME_TO_FIRST_BOOK`).
 */
export function logTimeToFirstBook(params: {
  requestId: string;
  durationMs: number;
  isMockMode: boolean;
}): StructuredLogEntry {
  return logStructuredEvent({
    severity: 'INFO',
    event: 'TIME_TO_FIRST_BOOK',
    requestId: params.requestId,
    stage: 'stage4_verification',
    durationMs: params.durationMs,
    outcome: 'success',
    metrics: {
      isMockMode: params.isMockMode,
    },
  });
}

/**
 * Lấy danh sách các bản ghi log có cấu trúc gần nhất (phục vụ kiểm thử tự động Phase 10).
 */
export function getRecentStructuredLogs(): ReadonlyArray<StructuredLogEntry> {
  return [...recentStructuredLogsBuffer];
}

/**
 * Xóa bộ đệm log trong bộ nhớ (phục vụ kiểm thử tự động Phase 10).
 */
export function clearRecentStructuredLogsForTests(): void {
  recentStructuredLogsBuffer.length = 0;
}
