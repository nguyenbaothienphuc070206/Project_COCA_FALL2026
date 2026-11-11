/**
 * Tính năng: Bộ giới hạn tần suất theo IP đã băm muối xoay vòng theo ngày (Sliding Window Per-IP & Global Rate Limiter) và Bộ điều tiết nhịp gọi API bên ngoài (Paced Rate Gate cho Open Library & Google Books).
 * Trường hợp sử dụng:
 * - Bảo vệ endpoint /api/recommendations (10 yêu cầu/phút/IP + 60 yêu cầu/phút toàn cục).
 * - Chống cào dữ liệu (anti-scraping) trên /api/books/[bookId]/verification và /api/books/[bookId]/editions (30 yêu cầu/phút/IP).
 * - Điều tiết nhịp gọi ra ngoài tới Open Library (3 req/s có email, 1 req/s không email) và Google Books (2 req/s) để tránh bị khóa IP.
 */

import { FirestoreBackedRateLimitStore } from '../persistence/firestoreStores';
import { hashClientIpTransiently } from '../security/securityControls';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Bộ giới hạn số lượng yêu cầu theo cửa sổ trượt (Sliding Window) sử dụng khóa IP đã băm muối theo ngày.
 */
export class PerIpRateLimiter {
  private readonly hitsByIp = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Kiểm tra và ghi nhận một yêu cầu từ địa chỉ IP (tự động băm với muối xoay vòng theo ngày).
   * @param ipKey - Địa chỉ IP hoặc khóa định danh client
   * @param nowMs - Thời điểm hiện tại (mặc định Date.now())
   * @returns Kết quả cho phép hoặc từ chối kèm thời gian chờ retryAfterMs
   */
  check(ipKey: string, nowMs: number = Date.now()): RateLimitResult {
    const key = hashClientIpTransiently(ipKey.trim() || 'anonymous-ip');
    const windowStart = nowMs - this.windowMs;
    const prevHits = this.hitsByIp.get(key) ?? [];
    const activeHits = prevHits.filter((timestamp) => timestamp > windowStart);

    if (activeHits.length >= this.maxRequests) {
      const oldestActive = activeHits[0] ?? nowMs;
      const retryAfterMs = Math.max(250, oldestActive + this.windowMs - nowMs);
      this.hitsByIp.set(key, activeHits);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }

    activeHits.push(nowMs);
    this.hitsByIp.set(key, activeHits);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - activeHits.length),
      retryAfterMs: 0,
    };
  }

  /**
   * Xóa lịch sử giới hạn (dùng trong kiểm thử).
   */
  reset(): void {
    this.hitsByIp.clear();
  }
}

/**
 * Bộ điều tiết khoảng cách tối thiểu giữa các lệnh gọi mạng tới Open Library (3 req/s hoặc 1 req/s) và Google Books (2 req/s).
 */
export class IntervalPacer {
  private nextAvailableTimeMs = 0;

  /**
   * Chờ đến lượt gọi hợp lệ tiếp theo theo khoảng cách minIntervalMs.
   * @param minIntervalMs - Khoảng cách tối thiểu giữa 2 lệnh gọi (VD: 340ms cho 3 req/s, 500ms cho 2 req/s, 1000ms cho 1 req/s)
   * @param signal - AbortSignal để hủy sớm nếu client ngắt kết nối
   */
  async waitTurn(minIntervalMs: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new Error('ABORTED');
    }
    const now = Date.now();
    const scheduled = Math.max(now, this.nextAvailableTimeMs);
    this.nextAvailableTimeMs = scheduled + minIntervalMs;
    const waitMs = scheduled - now;

    if (waitMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, waitMs);
        if (signal) {
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              reject(new Error('ABORTED'));
            },
            { once: true },
          );
        }
      });
    }
  }

  reset(): void {
    this.nextAvailableTimeMs = 0;
  }
}

// Per-IP limiter cho /api/recommendations (10 req / phút / IP)
export const globalRecommendationRateLimiter =
  new FirestoreBackedRateLimitStore(10, 60_000);

// Global burst limiter trên toàn bộ máy chủ (60 req / phút tổng cộng)
export const globalAggregateRateLimiter = new FirestoreBackedRateLimitStore(
  60,
  60_000,
);

// Anti-scraping limiter cho /api/books/[bookId]/verification và /editions (30 req / phút / IP)
export const globalVerificationScrapeRateLimiter =
  new FirestoreBackedRateLimitStore(30, 60_000);

// Pacer điều tiết nhịp gọi đi ra ngoài tới Open Library (340ms hoặc 1000ms) và Google Books (500ms = 2 req/s)
export const globalOpenLibraryPacer = new IntervalPacer();
export const globalGoogleBooksPacer = new IntervalPacer();
