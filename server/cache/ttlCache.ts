/**
 * Tính năng: Giao diện Cache<T> và bộ nhớ đệm TTL giới hạn kích thước (InMemoryTTLCache) cho siêu dữ liệu sách đã xác thực.
 * Trường hợp sử dụng: Tránh gọi lặp lại Open Library / Google Books cho cùng một cặp (normalizedTitle::authorSurname) trong thời gian TTL.
 */

import { AI_CONFIG } from '@/src/config/constants';

export interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, customTtlMs?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  size(): number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Bộ nhớ đệm trong RAM có kiểm soát thời gian sống (TTL) và giới hạn số lượng phần tử tối đa (FIFO/LRU eviction).
 */
export class InMemoryTTLCache<T> implements Cache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;
  private readonly maxEntries: number;

  constructor(
    defaultTtlMs: number = AI_CONFIG.cacheTtlMs,
    maxEntries: number = AI_CONFIG.cacheMaxEntries,
  ) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Lấy giá trị từ bộ nhớ đệm nếu tồn tại và chưa hết hạn TTL.
   * @param key - Khóa chuẩn hóa (normalizedTitle::authorSurname)
   * @returns Giá trị lưu trữ hoặc undefined
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Làm mới vị trí LRU bằng cách xóa và chèn lại
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /**
   * Lưu giá trị vào bộ nhớ đệm với TTL và tự động đẩy phần tử cũ nhất ra nếu vượt maxEntries.
   * @param key - Khóa chuẩn hóa
   * @param value - Dữ liệu đã xác thực
   * @param customTtlMs - Thời gian sống tùy chỉnh (mili-giây)
   */
  set(key: string, value: T, customTtlMs?: number): void {
    const ttl = customTtlMs ?? this.defaultTtlMs;
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    // Dọn các mục đã hết hạn trước khi trả về kích thước thực
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      if (now > v.expiresAt) {
        this.store.delete(k);
      }
    }
    return this.store.size;
  }
}

/**
 * EXTENSION POINT (STUB ONLY — DO NOT IMPLEMENT IN MVP):
 * Stub tài liệu hóa cho bộ nhớ đệm phân tán trên Supabase hoặc Cloud Firestore ở phiên bản v2.
 * Giữ nguyên chữ ký giao diện Cache<T> để có thể hoán đổi qua Dependency Injection mà không sửa logic pipeline.
 */
export class PersistentDatabaseCacheStub<T> implements Cache<T> {
  get(_key: string): T | undefined {
    throw new Error('PersistentDatabaseCacheStub is an unimplemented v2 extension point.');
  }
  set(_key: string, _value: T): void {
    throw new Error('PersistentDatabaseCacheStub is an unimplemented v2 extension point.');
  }
  has(_key: string): boolean {
    return false;
  }
  delete(_key: string): void {
    // Stub
  }
  clear(): void {
    // Stub
  }
  size(): number {
    return 0;
  }
}
