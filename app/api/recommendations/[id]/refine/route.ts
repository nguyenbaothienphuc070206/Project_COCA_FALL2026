/**
 * Tính năng: REST API Endpoint POST /api/recommendations/[id]/refine.
 * Trường hợp sử dụng: Kiểm tra kích thước body (<= 8 KB), Content-Type, giới hạn tần suất, chuyển văn bản ngôn ngữ tự nhiên của người dùng thành đối tượng điều chỉnh (Zod-validated), tái xếp hạng bể sách đã xác thực (instant) và trả về các chip tinh chỉnh có thể gỡ bỏ kèm trạng thái diff.
 */

import { NextRequest } from 'next/server';
import { refineRecommendationSession } from '@/server/pipeline/refinementAndEditionService';
import { RefineRecommendationRequestSchema } from '@/src/lib/schemas/apiContract';
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
  const rateCheck = globalRecommendationRateLimiter.check(`refine_${clientIp}`);
  if (!rateCheck.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(rateCheck.retryAfterMs / 1000),
    );
    return apiJsonError({
      code: 'RATE_LIMITED',
      message: `Too many refinement requests. Please wait ${retryAfterSeconds} seconds.`,
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

    const parsed = RefineRecommendationRequestSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return apiJsonError({
        code: 'INVALID_REFINE_PAYLOAD',
        message: 'Invalid refinement request body.',
        status: 400,
        requestId,
      });
    }

    const result = await refineRecommendationSession({
      recommendationId: id,
      refinementText: parsed.data.text,
      removeChipId: parsed.data.removeChipId,
      clearAllAdjustments: parsed.data.clearAllAdjustments,
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
      code: 'REFINE_ERROR',
      message: 'Could not apply refinement at this time.',
      status: 500,
      requestId,
    });
  }
}
