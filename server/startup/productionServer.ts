/**
 * Tính năng: Bộ điều phối Khởi động Máy chủ Sản xuất & Đóng kết nối Êm ái (Graceful Shutdown Controller — Phase 11).
 * Trường hợp sử dụng:
 * - Xác thực cấu hình sản xuất ngay khi khởi động (Fail-Fast qua `assertProductionStartupEnv`).
 * - Lắng nghe trên biến môi trường `PORT` (tương thích Google Cloud Run).
 * - Xử lý tín hiệu `SIGTERM` và `SIGINT` từ Cloud Run: ngừng nhận kết nối mới, chờ các yêu cầu SSE/API đang chạy hoàn tất trong khoảng `SHUTDOWN_TIMEOUT_MS`, dọn dẹp bộ nhớ đệm hết hạn và thoát sạch với mã 0.
 */

import type { Server as HttpServer } from 'node:http';
import {
  assertProductionStartupEnv,
  ServerEnvironmentConfig,
} from '../config/env';
import { runGlobalPersistenceCleanup } from '../persistence/firestoreStores';
import { logStructuredEvent } from '../observability/logger';

export interface GracefulShutdownController {
  readonly port: number;
  readonly config: ServerEnvironmentConfig;
  isShuttingDown(): boolean;
  trackRequestStart(): void;
  trackRequestEnd(): void;
  getInFlightRequests(): number;
  initiateShutdown(signal: 'SIGTERM' | 'SIGINT' | 'MANUAL'): Promise<void>;
}

/**
 * Tạo bộ điều khiển Graceful Shutdown và kiểm tra Fail-Fast cấu hình Production.
 */
export function createGracefulShutdownController(options?: {
  envSource?: NodeJS.ProcessEnv;
  httpServer?: Pick<HttpServer, 'close'>;
  onExit?: (code: number) => void;
}): GracefulShutdownController {
  const config = assertProductionStartupEnv(options?.envSource ?? process.env);
  let shuttingDown = false;
  let inFlightRequests = 0;
  let shutdownPromise: Promise<void> | null = null;

  const trackRequestStart = () => {
    if (!shuttingDown) {
      inFlightRequests += 1;
    }
  };

  const trackRequestEnd = () => {
    inFlightRequests = Math.max(0, inFlightRequests - 1);
  };

  const initiateShutdown = async (
    signal: 'SIGTERM' | 'SIGINT' | 'MANUAL',
  ): Promise<void> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }
    shuttingDown = true;
    const startedAt = Date.now();

    shutdownPromise = (async () => {
      logStructuredEvent({
        severity: 'INFO',
        event: 'PIPELINE_STAGE_OUTCOME',
        requestId: `shutdown_${signal.toLowerCase()}`,
        stage: 'http_ingress',
        durationMs: 0,
        outcome: 'success',
        metrics: {
          signal,
          inFlightRequests,
          port: config.port,
        },
      });

      // 1. Đóng cổng nhận kết nối HTTP mới nếu có tham chiếu httpServer
      if (options?.httpServer) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, config.shutdownTimeoutMs);
          options.httpServer?.close(() => {
            clearTimeout(timer);
            resolve();
          });
        });
      }

      // 2. Chờ các yêu cầu đang xử lý hoàn tất (tối đa shutdownTimeoutMs)
      const deadline = Date.now() + config.shutdownTimeoutMs;
      while (inFlightRequests > 0 && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 50));
      }

      // 3. Dọn dẹp bộ nhớ đệm hết hạn trước khi tắt
      try {
        await runGlobalPersistenceCleanup({});
      } catch {
        // Không chặn quá trình tắt máy chủ nếu Firestore không phản hồi
      }

      logStructuredEvent({
        severity: 'INFO',
        event: 'PIPELINE_STAGE_OUTCOME',
        requestId: `shutdown_complete_${signal.toLowerCase()}`,
        stage: 'pipeline_complete',
        durationMs: Date.now() - startedAt,
        outcome: 'success',
        metrics: {
          signal,
          remainingInFlight: inFlightRequests,
        },
      });

      options?.onExit?.(0);
    })();

    return shutdownPromise;
  };

  return {
    port: config.port,
    config,
    isShuttingDown: () => shuttingDown,
    trackRequestStart,
    trackRequestEnd,
    getInFlightRequests: () => inFlightRequests,
    initiateShutdown,
  };
}

let globalProcessSignalsRegistered = false;

/**
 * Đăng ký trình xử lý SIGTERM / SIGINT một lần cho tiến trình Node.js hiện tại.
 */
export function registerProcessGracefulShutdown(
  controller: GracefulShutdownController,
): void {
  if (globalProcessSignalsRegistered || typeof process === 'undefined') {
    return;
  }
  globalProcessSignalsRegistered = true;

  process.once('SIGTERM', () => {
    void controller.initiateShutdown('SIGTERM');
  });

  process.once('SIGINT', () => {
    void controller.initiateShutdown('SIGINT');
  });
}
