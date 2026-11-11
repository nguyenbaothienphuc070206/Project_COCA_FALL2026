/**
 * Tính năng: Middleware & Helper chuẩn hóa HTTP Response, Security Headers (Helmet CSP/HSTS), Header X-API-Version: 1, Request-ID, Error Envelope (không lộ stack trace) và Timeout/AbortSignal cho mọi API Route.
 * Trường hợp sử dụng: Đảm bảo 100% endpoint tuân thủ OpenAPI 3.1 contract, trả về cấu trúc lỗi { error: { code, message, requestId, retryAfterSeconds? } } và gắn đầy đủ Security Headers của Phase 7.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  API_VERSION,
  ApiErrorCode,
  ApiErrorEnvelope,
} from '@/src/lib/schemas/apiContract';
import {
  buildSecurityHeaders,
  sanitizePublicErrorMessage,
  verifyCorsOrigin,
} from '../security/securityControls';

/**
 * Tạo hoặc trích xuất mã định danh yêu cầu (Request ID) từ header X-Request-Id.
 */
export function resolveRequestId(req?: NextRequest | Request): string {
  const existing = req?.headers?.get('x-request-id')?.trim();
  if (existing && /^[a-zA-Z0-9_\-.]{4,64}$/.test(existing)) {
    return existing;
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Tạo bộ HTTP headers chuẩn bao gồm Security Headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), X-API-Version: 1 và X-Request-Id.
 */
export function buildStandardApiHeaders(
  requestId: string,
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    ...buildSecurityHeaders(),
    'X-API-Version': API_VERSION,
    'X-Request-Id': requestId,
    ...(extraHeaders ?? {}),
  };
}

/**
 * Kiểm tra CORS cho API route; nếu nguồn (Origin) không được phép thì trả về ngay phản hồi lỗi 403 FORBIDDEN_ORIGIN.
 */
export function enforceApiCors(
  req: NextRequest | Request,
  requestId: string,
): NextResponse<ApiErrorEnvelope> | null {
  const check = verifyCorsOrigin(req);
  if (!check.allowed) {
    return apiJsonError({
      code: 'FORBIDDEN_ORIGIN',
      message: 'Cross-origin request blocked by same-origin CORS policy.',
      status: 403,
      requestId,
    });
  }
  return null;
}

/**
 * Trả về phản hồi JSON thành công kèm Security Headers, X-API-Version: 1 và X-Request-Id.
 */
export function apiJsonSuccess<T>(
  data: T,
  options?: {
    status?: number;
    requestId?: string;
    headers?: Record<string, string>;
  },
): NextResponse<T> {
  const requestId = options?.requestId ?? resolveRequestId();
  return NextResponse.json(data, {
    status: options?.status ?? 200,
    headers: buildStandardApiHeaders(requestId, options?.headers),
  });
}

/**
 * Trả về phản hồi lỗi JSON theo đúng Error Envelope chuẩn:
 * { error: { code, message, requestId, retryAfterSeconds? } }
 * Tuyệt đối không lộ stack trace hay đường dẫn nội bộ.
 */
export function apiJsonError(params: {
  code: ApiErrorCode;
  message: string;
  status: number;
  requestId?: string;
  retryAfterSeconds?: number;
  headers?: Record<string, string>;
}): NextResponse<ApiErrorEnvelope> {
  const requestId = params.requestId ?? resolveRequestId();
  const extraHeaders: Record<string, string> = {
    ...(params.headers ?? {}),
  };
  if (
    typeof params.retryAfterSeconds === 'number' &&
    params.retryAfterSeconds > 0
  ) {
    extraHeaders['Retry-After'] = String(Math.ceil(params.retryAfterSeconds));
  }

  const safeMessage = sanitizePublicErrorMessage(params.message);

  const envelope: ApiErrorEnvelope = {
    error: {
      code: params.code,
      message: safeMessage,
      requestId,
      ...(typeof params.retryAfterSeconds === 'number'
        ? { retryAfterSeconds: Math.ceil(params.retryAfterSeconds) }
        : {}),
    },
  };

  return NextResponse.json(envelope, {
    status: params.status,
    headers: buildStandardApiHeaders(requestId, extraHeaders),
  });
}

/**
 * Kết hợp AbortSignal của client request với bộ đếm timeout mỗi lệnh gọi (per-call timeout).
 */
export function createScopedAbortSignal(
  clientSignal?: AbortSignal,
  timeoutMs: number = 25_000,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error('REQUEST_TIMEOUT'));
  }, timeoutMs);

  const onClientAbort = () => {
    clearTimeout(timer);
    controller.abort(clientSignal?.reason ?? new Error('CLIENT_ABORTED'));
  };

  if (clientSignal) {
    if (clientSignal.aborted) {
      clearTimeout(timer);
      controller.abort(clientSignal.reason ?? new Error('CLIENT_ABORTED'));
    } else {
      clientSignal.addEventListener('abort', onClientAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (clientSignal) {
        clientSignal.removeEventListener('abort', onClientAbort);
      }
    },
  };
}
