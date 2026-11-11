/**
 * Tính năng: REST API Endpoint GET /api/eval/runs/[id] & POST /api/eval/runs/[id] (& PATCH).
 * Trường hợp sử dụng:
 * - Bảo vệ bằng EVAL_ENABLED và EVAL_ADMIN_TOKEN (constant-time comparison).
 * - GET: trả về tiến độ và toàn bộ chỉ số của một phiên đánh giá theo ID.
 * - POST/PATCH: lưu phiếu chấm Rubric của người kiểm thử (Relevance, Level Fit, Usefulness trên thang 1..5, hỗ trợ Blind Mode) hoặc ghi nhận lượt lưu sách (Save Count) chỉ trong phiên đánh giá.
 */

import { NextRequest } from 'next/server';
import { globalEvalPersistence } from '@/server/adapters/supabaseEvalStub';
import {
  computeConfigAggregates,
  EvalConfigId,
  EvalTesterRubricSubmission,
} from '@/src/lib/evalMetrics';
import {
  apiJsonError,
  apiJsonSuccess,
  enforceApiCors,
  resolveRequestId,
} from '@/server/http/apiResponse';
import {
  parseAndValidateJsonBody,
  sanitizePlainTextOutput,
  verifyEvalAdminAccess,
} from '@/server/security/securityControls';

const VALID_CONFIG_IDS = new Set<EvalConfigId>([
  'A_MODEL_ONLY',
  'B_MODEL_SEARCH',
  'C_FULL_VERIFIED',
]);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  const run = await globalEvalPersistence.getRunById(id);
  if (!run) {
    return apiJsonError({
      code: 'EVAL_RUN_NOT_FOUND',
      message: `Evaluation run '${id}' was not found.`,
      status: 404,
      requestId,
    });
  }

  return apiJsonSuccess(run, { status: 200, requestId });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  const run = await globalEvalPersistence.getRunById(id);
  if (!run) {
    return apiJsonError({
      code: 'EVAL_RUN_NOT_FOUND',
      message: `Evaluation run '${id}' was not found.`,
      status: 404,
      requestId,
    });
  }

  const parsedBody = await parseAndValidateJsonBody(req, 16_384);
  if (!parsedBody.ok) {
    return apiJsonError({
      code: parsedBody.errorCode,
      message: parsedBody.message,
      status: parsedBody.status,
      requestId,
    });
  }

  const body = parsedBody.data;
  const action = body.action;

  if (action === 'submit_rubric') {
    const profileId = String(body.profileId || '').trim();
    const configId = String(body.configId || '').trim() as EvalConfigId;
    const relevance = Number(body.relevance);
    const levelFit = Number(body.levelFit);
    const usefulness = Number(body.usefulness);
    const wasBlindMode = Boolean(body.wasBlindMode);
    const notes =
      typeof body.notes === 'string'
        ? sanitizePlainTextOutput(body.notes, 300)
        : undefined;

    if (
      !profileId ||
      !VALID_CONFIG_IDS.has(configId) ||
      !Number.isInteger(relevance) ||
      relevance < 1 ||
      relevance > 5 ||
      !Number.isInteger(levelFit) ||
      levelFit < 1 ||
      levelFit > 5 ||
      !Number.isInteger(usefulness) ||
      usefulness < 1 ||
      usefulness > 5
    ) {
      return apiJsonError({
        code: 'INVALID_RUBRIC_VALUES',
        message: 'Rubric scores must be integers from 1 to 5.',
        status: 400,
        requestId,
      });
    }

    const submission: EvalTesterRubricSubmission = {
      id: `rubric_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      runId: run.id,
      profileId,
      configId,
      wasBlindMode,
      relevance,
      levelFit,
      usefulness,
      notes,
      submittedAtIso: new Date().toISOString(),
    };

    const nextRubrics = [...run.rubricRatings, submission];
    const updatedRun = {
      ...run,
      rubricRatings: nextRubrics,
      aggregates: computeConfigAggregates(
        run.results,
        nextRubrics,
        run.savesByBookKey,
      ),
    };
    await globalEvalPersistence.saveRun(updatedRun);
    return apiJsonSuccess(updatedRun, { status: 200, requestId });
  }

  if (action === 'record_save') {
    const configId = String(body.configId || '').trim() as EvalConfigId;
    const bookId = String(body.bookId || '').trim();
    if (!VALID_CONFIG_IDS.has(configId) || !bookId) {
      return apiJsonError({
        code: 'INVALID_SAVE_PAYLOAD',
        message: 'Valid configId and bookId are required to record a save.',
        status: 400,
        requestId,
      });
    }

    const key = `${configId}::${bookId}`;
    const nextSaves = {
      ...run.savesByBookKey,
      [key]: (run.savesByBookKey[key] ?? 0) + 1,
    };

    const updatedRun = {
      ...run,
      savesByBookKey: nextSaves,
      aggregates: computeConfigAggregates(
        run.results,
        run.rubricRatings,
        nextSaves,
      ),
    };
    await globalEvalPersistence.saveRun(updatedRun);
    return apiJsonSuccess(updatedRun, { status: 200, requestId });
  }

  return apiJsonError({
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action '${String(action)}'.`,
    status: 400,
    requestId,
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return POST(req, context);
}
