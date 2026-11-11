/**
 * Tính năng: REST API Endpoint POST /api/recommendations/[id]/dismiss.
 * Trường hợp sử dụng: Kiểm tra kích thước body (<= 8 KB), Content-Type, giới hạn tần suất, loại bỏ sách người dùng không quan tâm, lưu tín hiệu tránh lặp lại (embedding avoid signal) trong phiên, bổ sung sách thay thế đã kiểm chứng từ bể dự phòng và hỗ trợ Hoàn tác (Undo trong 8 giây).
 */

import { NextRequest } from 'next/server';
import {
  dismissBookInSession,
  undoDismissBookInSession,
} from '@/server/pipeline/refinementAndEditionService';
import { DismissRecommendationRequestSchema } from '@/src/lib/schemas/apiContract';
import {
  apiJsonError,
  apiJsonSuccess,
  enforceApiCors,
  resolveRequestId,
} from '@/server/http/apiResponse';
import { globalRecommendationRateLimiter } from '@/server/rateLimit/rateLimiter';
import {
  extractTrustedClientIp,
  parseAndValidateJsonBody,
} from '@/server/security/securityControls';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = resolveRequestId(request);
  const corsError = enforceApiCors(request, requestId);
  if (corsError) return corsError;

  const clientIp = extractTrustedClientIp(request);
  const rateCheck = globalRecommendationRateLimiter.check(`dismiss_${clientIp}`);
  if (!rateCheck.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(rateCheck.retryAfterMs / 1000),
    );
    return apiJsonError({
      code: 'RATE_LIMITED',
      message: `Too many dismiss requests. Please wait ${retryAfterSeconds} seconds.`,
      status: 429,
      requestId,
      retryAfterSeconds,
    });
  }

  try {
    const { id } = await context.params;
    const parsedBody = await parseAndValidateJsonBody(request, 8_192);
    if (!parsedBody.ok) {
      return apiJsonError({
        code: parsedBody.errorCode,
        message: parsedBody.message,
        status: parsedBody.status,
        requestId,
      });
    }

    const parsed = DismissRecommendationRequestSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return apiJsonError({
        code: 'INVALID_DISMISS_PAYLOAD',
        message: 'bookId is required to dismiss or undo.',
        status: 400,
        requestId,
      });
    }

    if (parsed.data.undo) {
      const restoredSet = undoDismissBookInSession({
        recommendationId: id,
        bookId: parsed.data.bookId,
      });

      if (!restoredSet) {
        return apiJsonError({
          code: 'SESSION_NOT_FOUND',
          message: `Recommendation session '${id}' not found.`,
          status: 404,
          requestId,
        });
      }

      return apiJsonSuccess(
        {
          recommendationSet: restoredSet,
          undone: true,
        },
        { status: 200, requestId },
      );
    }

    const result = await dismissBookInSession({
      recommendationId: id,
      bookId: parsed.data.bookId,
      useMockMode: parsed.data.useMockMode,
    });

    if (!result) {
      return apiJsonError({
        code: 'SESSION_NOT_FOUND',
        message: `Recommendation session '${id}' not found.`,
        status: 404,
        requestId,
      });
    }

    return apiJsonSuccess(result, { status: 200, requestId });
  } catch {
    return apiJsonError({
      code: 'DISMISS_ERROR',
      message: 'Could not dismiss book at this time.',
      status: 500,
      requestId,
    });
  }
}
