/**
 * Tính năng: REST API Endpoint GET /api/eval/runs & POST /api/eval/runs.
 * Trường hợp sử dụng:
 * - Bảo vệ bằng biến môi trường EVAL_ENABLED và EVAL_ADMIN_TOKEN (so sánh thời gian hằng số crypto.timingSafeEqual).
 * - GET: trả về danh sách 14 hồ sơ mẫu đã chuẩn bị, danh sách các phiên đánh giá đã chạy, và trạng thái tầng lưu trữ.
 * - POST: khởi chạy bất đồng bộ một phiên đánh giá mới (A, B, C) hoặc nhập (Import) một tệp JSON phiên đánh giá đã lưu trước đó.
 */

import { NextRequest } from 'next/server';
import { getServerEnv } from '@/server/config/env';
import {
  PREPARED_EVAL_PROFILES,
  startEvaluationRunAsync,
} from '@/server/eval/evalRunner';
import { globalEvalPersistence } from '@/server/adapters/supabaseEvalStub';
import {
  computeConfigAggregates,
  EvalRunRecord,
  extractRealLimitationsFromRun,
} from '@/src/lib/evalMetrics';
import {
  apiJsonError,
  apiJsonSuccess,
  enforceApiCors,
  resolveRequestId,
} from '@/server/http/apiResponse';
import {
  parseAndValidateJsonBody,
  verifyEvalAdminAccess,
} from '@/server/security/securityControls';

export async function GET(req: NextRequest) {
  const requestId = resolveRequestId(req);
  const corsError = enforceApiCors(req, requestId);
  if (corsError) return corsError;

  const access = verifyEvalAdminAccess(req);
  if (!access.allowed) {
    return apiJsonError({
      code: access.errorCode,
      message: access.message,
      status: access.status,
      requestId,
    });
  }

  const env = getServerEnv();
  const runs = await globalEvalPersistence.listRuns();
  return apiJsonSuccess(
    {
      evalEnabled: true as const,
      modelName: env.geminiModel,
      persistence: globalEvalPersistence.getConnectionStatus(),
      profiles: PREPARED_EVAL_PROFILES,
      runs,
    },
    { status: 200, requestId },
  );
}

export async function POST(req: NextRequest) {
  const requestId = resolveRequestId(req);
  const corsError = enforceApiCors(req, requestId);
  if (corsError) return corsError;

  const access = verifyEvalAdminAccess(req);
  if (!access.allowed) {
    return apiJsonError({
      code: access.errorCode,
      message: access.message,
      status: access.status,
      requestId,
    });
  }

  const parsedBody = await parseAndValidateJsonBody(req, 512_000);
  const body: Record<string, unknown> = parsedBody.ok ? parsedBody.data : {};
  if (
    !parsedBody.ok &&
    (parsedBody.errorCode === 'PAYLOAD_TOO_LARGE' ||
      parsedBody.errorCode === 'UNSUPPORTED_MEDIA_TYPE')
  ) {
    return apiJsonError({
      code: parsedBody.errorCode,
      message: parsedBody.message,
      status: parsedBody.status,
      requestId,
    });
  }

  // Hỗ trợ nhập (Import) một phiên đánh giá từ JSON đã tải xuống trước đó
  if (body.action === 'import_run') {
    if (body.run && typeof body.run === 'object') {
      const rawRun = body.run as EvalRunRecord;
      if (typeof rawRun.id === 'string' && Array.isArray(rawRun.results)) {
        const rubrics = Array.isArray(rawRun.rubricRatings)
          ? rawRun.rubricRatings
          : [];
        const saves =
          rawRun.savesByBookKey && typeof rawRun.savesByBookKey === 'object'
            ? rawRun.savesByBookKey
            : {};
        const normalizedRun: EvalRunRecord = {
          ...rawRun,
          status: 'completed',
          aggregates: computeConfigAggregates(rawRun.results, rubrics, saves),
          rubricRatings: rubrics,
          savesByBookKey: saves,
          realLimitations: extractRealLimitationsFromRun(
            rawRun.id,
            rawRun.results,
          ),
        };
        await globalEvalPersistence.saveRun(normalizedRun);
        return apiJsonSuccess(
          {
            imported: true,
            run: normalizedRun,
          },
          { status: 200, requestId },
        );
      }
    }
    return apiJsonError({
      code: 'INVALID_IMPORT_RUN_FORMAT',
      message: 'Imported file is not a valid EvalRunRecord JSON payload.',
      status: 400,
      requestId,
    });
  }

  const profileIds = Array.isArray(body.profileIds)
    ? body.profileIds.filter((id): id is string => typeof id === 'string')
    : undefined;
  const mode =
    body.mode === 'live_audit' ? 'live_audit' : 'audit_deterministic';

  const startedRun = await startEvaluationRunAsync({
    profileIds,
    mode,
  });

  return apiJsonSuccess(startedRun, { status: 202, requestId });
}
