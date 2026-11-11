/**
 * Tính năng: REST API Endpoint POST /api/recommendations & GET /api/recommendations.
 * Trường hợp sử dụng:
 * - Kiểm tra CORS, kích thước body (<= 16 KB), Content-Type: application/json, xác thực chống Bot tùy chọn (Turnstile/hCaptcha).
 * - Kiểm tra giới hạn tần suất theo IP đã băm muối theo ngày (10 yêu cầu/phút/IP) và toàn cục (60 yêu cầu/phút).
 * - Kiểm tra Ngân sách gọi Gemini hàng ngày & Cầu dao bảo vệ (Circuit Breaker) khi chạy Live Pipeline.
 * - Khi header Accept chứa "text/event-stream": truyền phát Server-Sent Events (stage, candidate_found, book_verified, book_removed, done, error) theo thời gian thực và hỗ trợ hủy (AbortSignal).
 * - Khi gọi JSON thông thường: trả về đối tượng JSON RecommendationSet kèm Security Headers, X-API-Version: 1 và X-Request-Id.
 */

import { NextRequest } from 'next/server';
import { PipelineSSEEvent, UserPreferencesSchema } from '@/src/types/book';
import { getServerEnv } from '@/server/config/env';
import {
  globalAggregateRateLimiter,
  globalRecommendationRateLimiter,
} from '@/server/rateLimit/rateLimiter';
import { executeRecommendationPipeline } from '@/server/pipeline/orchestrator';
import { getRecommendationSetById } from '@/server/store/recommendationStore';
import { MOCK_VERIFIED_BOOKS } from '@/src/data/mockBooks';
import {
  apiJsonError,
  apiJsonSuccess,
  buildStandardApiHeaders,
  createScopedAbortSignal,
  enforceApiCors,
  resolveRequestId,
} from '@/server/http/apiResponse';
import { getPersistenceHealthSummary } from '@/server/persistence/firestoreStores';
import {
  extractTrustedClientIp,
  globalGeminiBudgetCircuitBreaker,
  parseAndValidateJsonBody,
  verifyBotProtectionToken,
} from '@/server/security/securityControls';

export async function POST(req: NextRequest) {
  const requestId = resolveRequestId(req);

  const corsError = enforceApiCors(req, requestId);
  if (corsError) return corsError;

  const clientIp = extractTrustedClientIp(req);
  const ipRateCheck = globalRecommendationRateLimiter.check(clientIp);
  if (!ipRateCheck.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(ipRateCheck.retryAfterMs / 1000),
    );
    return apiJsonError({
      code: 'RATE_LIMITED',
      message: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before requesting another reading roadmap.`,
      status: 429,
      requestId,
      retryAfterSeconds,
    });
  }

  const globalRateCheck = globalAggregateRateLimiter.check('global_recommendations');
  if (!globalRateCheck.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(globalRateCheck.retryAfterMs / 1000),
    );
    return apiJsonError({
      code: 'RATE_LIMITED',
      message: `Server is experiencing high traffic. Please wait ${retryAfterSeconds} seconds before retrying.`,
      status: 429,
      requestId,
      retryAfterSeconds,
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

  const botCheck = await verifyBotProtectionToken(req, body.botToken);
  if (!botCheck.allowed) {
    return apiJsonError({
      code: 'BOT_CHALLENGE_FAILED',
      message: botCheck.reason || 'Bot verification challenge failed.',
      status: 403,
      requestId,
    });
  }

  const parsedPrefs = UserPreferencesSchema.safeParse(body?.preferences ?? body);
  if (!parsedPrefs.success) {
    return apiJsonError({
      code: 'INVALID_PREFERENCES',
      message: 'Invalid user preferences in request body.',
      status: 400,
      requestId,
    });
  }

  const prefs = parsedPrefs.data;
  const simulateOutage = body?.simulateOutage === true;
  const forceMockMode =
    typeof body?.useMockMode === 'boolean' ? body.useMockMode : undefined;

  const env = getServerEnv();
  const isMockRun = forceMockMode ?? env.mockModeEnv;

  // Kiểm tra Ngân sách Gemini hàng ngày & Cầu dao bảo vệ khi chạy ở chế độ Live Pipeline
  if (!isMockRun && !simulateOutage) {
    const budgetStatus = globalGeminiBudgetCircuitBreaker.getStatus();
    if (!budgetStatus.allowed) {
      const code = budgetStatus.reason || 'DAILY_BUDGET_EXHAUSTED';
      const friendlyMsg =
        code === 'CIRCUIT_BREAKER_OPEN'
          ? 'The AI service is temporarily busy (circuit breaker open). Please try again in a moment or switch to Sample Mode.'
          : 'Daily AI call budget reached — service is busy, please try again later or switch to Sample Mode.';
      return apiJsonError({
        code,
        message: friendlyMsg,
        status: 503,
        requestId,
        retryAfterSeconds: budgetStatus.retryAfterSeconds,
      });
    }
  }

  const recId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const acceptHeader = req.headers.get('accept') || '';
  const wantsEventStream = acceptHeader.includes('text/event-stream');

  // === PHẢN HỒI DẠNG SERVER-SENT EVENTS (SSE STREAMING) ===
  if (wantsEventStream) {
    const encoder = new TextEncoder();
    const { signal: scopedSignal, cleanup } = createScopedAbortSignal(
      req.signal,
      45_000,
    );

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: PipelineSSEEvent) => {
          if (scopedSignal.aborted) return;
          try {
            const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Stream closed by client
          }
        };

        try {
          await executeRecommendationPipeline(recId, prefs, {
            forceMockMode,
            simulateOutage,
            onEvent: sendEvent,
            signal: scopedSignal,
          });
        } catch (err) {
          if (!scopedSignal.aborted) {
            const msg = err instanceof Error ? err.message : 'PIPELINE_ERROR';
            if (
              msg !== 'SOURCE_OUTAGE_FAIL_CLOSED' &&
              msg !== 'MISSING_GEMINI_KEY'
            ) {
              sendEvent({
                type: 'error',
                code: 'PIPELINE_ERROR',
                message: 'Failed to generate recommendation roadmap.',
              });
            }
          }
        } finally {
          cleanup();
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: buildStandardApiHeaders(requestId, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Recommendation-Id': recId,
      }),
    });
  }

  // === PHẢN HỒI DẠNG JSON THÔNG THƯỜNG ===
  const { signal: scopedSignal, cleanup } = createScopedAbortSignal(
    req.signal,
    30_000,
  );
  try {
    const finalSet = await executeRecommendationPipeline(recId, prefs, {
      forceMockMode,
      simulateOutage,
      signal: scopedSignal,
    });
    return apiJsonSuccess(finalSet, { status: 200, requestId });
  } catch (err) {
    const code = err instanceof Error ? err.message : 'PIPELINE_ERROR';
    if (code === 'SOURCE_OUTAGE_FAIL_CLOSED') {
      return apiJsonError({
        code: 'SOURCE_OUTAGE_FAIL_CLOSED',
        message:
          'Open Library and Google Books verification endpoints did not respond. Results withheld per Fail-Closed policy.',
        status: 503,
        requestId,
      });
    }
    if (code === 'MISSING_GEMINI_KEY') {
      return apiJsonError({
        code: 'MISSING_GEMINI_KEY',
        message:
          'Missing GEMINI_API_KEY in server environment. Please add GEMINI_API_KEY in the Secrets panel.',
        status: 503,
        requestId,
      });
    }
    if (code === 'DAILY_BUDGET_EXHAUSTED' || code === 'CIRCUIT_BREAKER_OPEN') {
      return apiJsonError({
        code,
        message: 'Service is currently busy, please try again later.',
        status: 503,
        requestId,
        retryAfterSeconds: 60,
      });
    }
    return apiJsonError({
      code: 'PIPELINE_ERROR',
      message: 'Failed to generate recommendation roadmap.',
      status: 500,
      requestId,
    });
  } finally {
    cleanup();
  }
}

export async function GET(req: NextRequest) {
  const requestId = resolveRequestId(req);
  const corsError = enforceApiCors(req, requestId);
  if (corsError) return corsError;

  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const stored = getRecommendationSetById(id);
    if (stored) {
      return apiJsonSuccess(stored, { status: 200, requestId });
    }
    return apiJsonError({
      code: 'RECOMMENDATION_SET_NOT_FOUND',
      message: `Recommendation set '${id}' was not found.`,
      status: 404,
      requestId,
    });
  }

  const env = getServerEnv();
  const persistence = getPersistenceHealthSummary();
  return apiJsonSuccess(
    {
      mode: (env.mockModeEnv ? 'MOCK_MODE' : 'LIVE_PIPELINE') as
        | 'MOCK_MODE'
        | 'LIVE_PIPELINE',
      hasGeminiKey: Boolean(env.geminiApiKey),
      hasGoogleBooksKey: Boolean(env.googleBooksApiKey),
      hasOpenLibraryEmail: Boolean(env.openLibraryContactEmail),
      warnings: env.missingSecretWarnings,
      availableSampleBooks: MOCK_VERIFIED_BOOKS.length,
      persistenceBackend: persistence.backend,
    },
    { status: 200, requestId },
  );
}
