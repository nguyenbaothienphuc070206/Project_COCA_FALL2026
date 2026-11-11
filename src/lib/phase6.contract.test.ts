/**
 * Tính năng: Bộ Kiểm thử Hợp đồng API (Phase 6 Contract Tests) & Kiểm thử Chịu lỗi Tầng Lưu trữ Firestore (Resilience Tests).
 * Trường hợp sử dụng:
 * - Kiểm tra 100% endpoint REST & SSE đối chiếu trực tiếp request/response với schema Zod (/src/lib/schemas/apiContract.ts) trong MOCK_MODE.
 * - Xác nhận mọi phản hồi đều có header X-API-Version: 1 và X-Request-Id.
 * - Xác nhận Error Envelope chuẩn { error: { code, message, requestId, retryAfterSeconds? } } cho các mã lỗi 400, 404, 429, 503.
 * - Xác nhận việc ngắt kết nối Firestore (setFirestoreForceUnavailableForTests(true)) không làm sập ứng dụng và cơ chế dọn dẹp expiresAtMs hoạt động chính xác.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  API_VERSION,
  ApiErrorEnvelopeSchema,
  BookEditionsResponseSchema,
  BookVerificationResponseSchema,
  CreateRecommendationRequestSchema,
  CreateRecommendationResponseSchema,
  DismissRecommendationRequestSchema,
  DismissRecommendationResponseSchema,
  EvalRunsListResponseSchema,
  EvalRunRecordSchema,
  GetRecommendationByIdResponseSchema,
  getLocalizedApiErrorMessage,
  HealthzResponseSchema,
  PipelineSSEEventSchema,
  RefineRecommendationRequestSchema,
  RefineRecommendationResponseSchema,
  ServerStatusResponseSchema,
} from './schemas/apiContract';
import {
  GET as getRecommendationsRoute,
  POST as postRecommendationsRoute,
} from '@/app/api/recommendations/route';
import { GET as getRecommendationByIdRoute } from '@/app/api/recommendations/[id]/route';
import { POST as postRefineRoute } from '@/app/api/recommendations/[id]/refine/route';
import { POST as postDismissRoute } from '@/app/api/recommendations/[id]/dismiss/route';
import { GET as getBookVerificationRoute } from '@/app/api/books/[bookId]/verification/route';
import { GET as getBookEditionsRoute } from '@/app/api/books/[bookId]/editions/route';
import {
  GET as getEvalRunsRoute,
  POST as postEvalRunsRoute,
} from '@/app/api/eval/runs/route';
import {
  GET as getEvalRunByIdRoute,
  POST as postEvalRunByIdRoute,
} from '@/app/api/eval/runs/[id]/route';
import { GET as getHealthzRoute } from '@/app/healthz/route';
import { globalRecommendationRateLimiter } from '@/server/rateLimit/rateLimiter';
import {
  FirestoreBackedEvalRunStore,
  FirestoreBackedRateLimitStore,
  FirestoreBackedTTLCache,
  setFirestoreForceUnavailableForTests,
} from '@/server/persistence/firestoreStores';

function makeJsonRequest(
  url: string,
  method: 'GET' | 'POST',
  body?: unknown,
  extraHeaders?: Record<string, string>,
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req_contract_test_01',
      ...(extraHeaders ?? {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

test('Contract Test 1: GET /api/recommendations & POST /api/recommendations (JSON + SSE) match schemas and return X-API-Version: 1', async () => {
  globalRecommendationRateLimiter.reset();

  // 1a. GET /api/recommendations (Server Status)
  const getReq = makeJsonRequest('http://localhost:3000/api/recommendations', 'GET');
  const getRes = await getRecommendationsRoute(getReq);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.headers.get('X-API-Version'), API_VERSION);
  assert.equal(getRes.headers.get('X-Request-Id'), 'req_contract_test_01');
  const statusJson = await getRes.json();
  const parsedStatus = ServerStatusResponseSchema.parse(statusJson);
  assert.ok(parsedStatus.availableSampleBooks >= 4);

  // 1b. POST /api/recommendations (JSON mode)
  const reqPayload = CreateRecommendationRequestSchema.parse({
    preferences: {
      topic: 'Machine Learning',
      level: 'beginner',
      length: 'any',
      language: 'any',
      adventurousness: 30,
    },
    useMockMode: true,
    simulateOutage: false,
  });

  const postReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations',
    'POST',
    reqPayload,
  );
  const postRes = await postRecommendationsRoute(postReq);
  assert.equal(postRes.status, 200);
  assert.equal(postRes.headers.get('X-API-Version'), API_VERSION);
  const recJson = await postRes.json();
  const parsedRec = CreateRecommendationResponseSchema.parse(recJson);
  assert.ok(parsedRec.books.length >= 3);

  // 1c. POST /api/recommendations (SSE mode: Accept: text/event-stream)
  const sseReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations',
    'POST',
    reqPayload,
    { accept: 'text/event-stream' },
  );
  const sseRes = await postRecommendationsRoute(sseReq);
  assert.equal(sseRes.status, 200);
  assert.equal(sseRes.headers.get('X-API-Version'), API_VERSION);
  assert.ok(sseRes.headers.get('content-type')?.includes('text/event-stream'));

  const sseText = await sseRes.text();
  const dataLines = sseText
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice(6)));
  assert.ok(dataLines.length >= 4);
  for (const rawEv of dataLines) {
    const validatedEv = PipelineSSEEventSchema.parse(rawEv);
    assert.ok(validatedEv.type);
  }
  assert.ok(dataLines.some((e) => e.type === 'done'));
});

test('Contract Test 2: GET /api/recommendations/{id}, POST /refine, and POST /dismiss (including Undo) match schemas', async () => {
  globalRecommendationRateLimiter.reset();

  // Retrieve initial sample session via GET /api/recommendations/{id}
  const getByIdReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations/rec_initial_sample',
    'GET',
  );
  const getByIdRes = await getRecommendationByIdRoute(getByIdReq, {
    params: Promise.resolve({ id: 'rec_initial_sample' }),
  });
  assert.equal(getByIdRes.status, 200);
  assert.equal(getByIdRes.headers.get('X-API-Version'), API_VERSION);
  const sessionData = GetRecommendationByIdResponseSchema.parse(
    await getByIdRes.json(),
  );
  assert.equal(sessionData.id, 'rec_initial_sample');

  // POST /api/recommendations/{id}/refine
  const refineReqPayload = RefineRecommendationRequestSchema.parse({
    text: 'shorter and more practical',
    useMockMode: true,
  });
  const refineReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations/rec_initial_sample/refine',
    'POST',
    refineReqPayload,
  );
  const refineRes = await postRefineRoute(refineReq, {
    params: Promise.resolve({ id: 'rec_initial_sample' }),
  });
  assert.equal(refineRes.status, 200);
  assert.equal(refineRes.headers.get('X-API-Version'), API_VERSION);
  const refineData = RefineRecommendationResponseSchema.parse(
    await refineRes.json(),
  );
  assert.equal(refineData.adjustment.lengthDelta, 'shorter');

  // POST /api/recommendations/{id}/dismiss
  const targetBookId = refineData.recommendationSet.books[0]!.id;
  const dismissPayload = DismissRecommendationRequestSchema.parse({
    bookId: targetBookId,
    useMockMode: true,
  });
  const dismissReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations/rec_initial_sample/dismiss',
    'POST',
    dismissPayload,
  );
  const dismissRes = await postDismissRoute(dismissReq, {
    params: Promise.resolve({ id: 'rec_initial_sample' }),
  });
  assert.equal(dismissRes.status, 200);
  assert.equal(dismissRes.headers.get('X-API-Version'), API_VERSION);
  const dismissData = DismissRecommendationResponseSchema.parse(
    await dismissRes.json(),
  );
  assert.ok(
    !dismissData.recommendationSet.books.some((b) => b.id === targetBookId),
  );

  // POST /api/recommendations/{id}/dismiss (undo: true)
  const undoReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations/rec_initial_sample/dismiss',
    'POST',
    { bookId: targetBookId, undo: true, useMockMode: true },
  );
  const undoRes = await postDismissRoute(undoReq, {
    params: Promise.resolve({ id: 'rec_initial_sample' }),
  });
  assert.equal(undoRes.status, 200);
  const undoData = DismissRecommendationResponseSchema.parse(
    await undoRes.json(),
  );
  assert.equal(undoData.undone, true);
});

test('Contract Test 3: GET /api/books/{bookId}/verification & GET /api/books/{bookId}/editions match schemas', async () => {
  const getByIdReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations/rec_initial_sample',
    'GET',
  );
  const getByIdRes = await getRecommendationByIdRoute(getByIdReq, {
    params: Promise.resolve({ id: 'rec_initial_sample' }),
  });
  const sessionData = GetRecommendationByIdResponseSchema.parse(
    await getByIdRes.json(),
  );
  const sampleBookId = sessionData.books[0]!.id;

  // GET /api/books/{bookId}/verification
  const verReq = makeJsonRequest(
    `http://localhost:3000/api/books/${sampleBookId}/verification`,
    'GET',
  );
  const verRes = await getBookVerificationRoute(verReq, {
    params: Promise.resolve({ bookId: sampleBookId }),
  });
  assert.equal(verRes.status, 200);
  assert.equal(verRes.headers.get('X-API-Version'), API_VERSION);
  const verData = BookVerificationResponseSchema.parse(await verRes.json());
  assert.equal(verData.bookId, sampleBookId);
  assert.equal(verData.verification.status, 'verified');

  // GET /api/books/{bookId}/editions (in MOCK_MODE / cached book record)
  const edReq = makeJsonRequest(
    `http://localhost:3000/api/books/${sampleBookId}/editions`,
    'GET',
  );
  const edRes = await getBookEditionsRoute(edReq, {
    params: Promise.resolve({ bookId: sampleBookId }),
  });
  assert.equal(edRes.status, 200);
  assert.equal(edRes.headers.get('X-API-Version'), API_VERSION);
  const edData = BookEditionsResponseSchema.parse(await edRes.json());
  assert.equal(edData.bookId, sampleBookId);
  assert.equal(typeof edData.vietnameseEdition.available, 'boolean');
});

test('Contract Test 4: /api/eval/runs and /api/eval/runs/{id} match schemas', async () => {
  // GET /api/eval/runs
  const listReq = makeJsonRequest('http://localhost:3000/api/eval/runs', 'GET');
  const listRes = await getEvalRunsRoute(listReq);
  assert.equal(listRes.status, 200);
  assert.equal(listRes.headers.get('X-API-Version'), API_VERSION);
  const listData = EvalRunsListResponseSchema.parse(await listRes.json());
  assert.equal(listData.profiles.length, 14);

  // POST /api/eval/runs (start quick 1-profile run)
  const startReq = makeJsonRequest(
    'http://localhost:3000/api/eval/runs',
    'POST',
    {
      profileIds: [listData.profiles[0]!.id],
      mode: 'audit_deterministic',
    },
  );
  const startRes = await postEvalRunsRoute(startReq);
  assert.equal(startRes.status, 202);
  assert.equal(startRes.headers.get('X-API-Version'), API_VERSION);
  const startedRun = EvalRunRecordSchema.parse(await startRes.json());

  // Wait briefly for the 1-profile async run to complete
  await new Promise((r) => setTimeout(r, 150));

  // GET /api/eval/runs/{id}
  const getRunReq = makeJsonRequest(
    `http://localhost:3000/api/eval/runs/${startedRun.id}`,
    'GET',
  );
  const getRunRes = await getEvalRunByIdRoute(getRunReq, {
    params: Promise.resolve({ id: startedRun.id }),
  });
  assert.equal(getRunRes.status, 200);
  const runDetail = EvalRunRecordSchema.parse(await getRunRes.json());
  assert.equal(runDetail.id, startedRun.id);

  // POST /api/eval/runs/{id} (submit_rubric)
  const rubricReq = makeJsonRequest(
    `http://localhost:3000/api/eval/runs/${startedRun.id}`,
    'POST',
    {
      action: 'submit_rubric',
      profileId: listData.profiles[0]!.id,
      configId: 'C_FULL_VERIFIED',
      relevance: 5,
      levelFit: 5,
      usefulness: 5,
      wasBlindMode: true,
    },
  );
  const rubricRes = await postEvalRunByIdRoute(rubricReq, {
    params: Promise.resolve({ id: startedRun.id }),
  });
  assert.equal(rubricRes.status, 200);
  const afterRubric = EvalRunRecordSchema.parse(await rubricRes.json());
  assert.equal(afterRubric.rubricRatings.length, 1);
});

test('Contract Test 5: Standardized Error Envelope (400, 404, 429, 503) & Bilingual Error Localization', async () => {
  globalRecommendationRateLimiter.reset();

  // 400 Bad Request
  const badReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations',
    'POST',
    { preferences: { topic: '', level: 'invalid' } },
  );
  const badRes = await postRecommendationsRoute(badReq);
  assert.equal(badRes.status, 400);
  assert.equal(badRes.headers.get('X-API-Version'), API_VERSION);
  const badEnv = ApiErrorEnvelopeSchema.parse(await badRes.json());
  assert.equal(badEnv.error.code, 'INVALID_PREFERENCES');
  assert.equal(badEnv.error.requestId, 'req_contract_test_01');

  // 404 Not Found
  const notFoundReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations/non_existent_id',
    'GET',
  );
  const notFoundRes = await getRecommendationByIdRoute(notFoundReq, {
    params: Promise.resolve({ id: 'non_existent_id' }),
  });
  assert.equal(notFoundRes.status, 404);
  const notFoundEnv = ApiErrorEnvelopeSchema.parse(await notFoundRes.json());
  assert.equal(notFoundEnv.error.code, 'RECOMMENDATION_SET_NOT_FOUND');

  // 503 Source Outage (Fail-Closed)
  const outageReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations',
    'POST',
    {
      preferences: {
        topic: 'Machine Learning',
        level: 'beginner',
        length: 'any',
        language: 'any',
        adventurousness: 20,
      },
      useMockMode: true,
      simulateOutage: true,
    },
  );
  const outageRes = await postRecommendationsRoute(outageReq);
  assert.equal(outageRes.status, 503);
  const outageEnv = ApiErrorEnvelopeSchema.parse(await outageRes.json());
  assert.equal(outageEnv.error.code, 'SOURCE_OUTAGE_FAIL_CLOSED');

  // 429 Rate Limited
  for (let i = 0; i < 10; i++) {
    globalRecommendationRateLimiter.check('198.51.100.77');
  }
  const rateReq = makeJsonRequest(
    'http://localhost:3000/api/recommendations',
    'POST',
    {
      preferences: {
        topic: 'Philosophy',
        level: 'beginner',
        length: 'any',
        language: 'any',
        adventurousness: 50,
      },
      useMockMode: true,
    },
    { 'x-forwarded-for': '198.51.100.77' },
  );
  const rateRes = await postRecommendationsRoute(rateReq);
  assert.equal(rateRes.status, 429);
  assert.ok(Number(rateRes.headers.get('Retry-After')) >= 1);
  const rateEnv = ApiErrorEnvelopeSchema.parse(await rateRes.json());
  assert.equal(rateEnv.error.code, 'RATE_LIMITED');
  assert.ok((rateEnv.error.retryAfterSeconds ?? 0) >= 1);

  // Localized messages
  const viMsg = getLocalizedApiErrorMessage('RATE_LIMITED', 'vi', 12);
  const enMsg = getLocalizedApiErrorMessage('RATE_LIMITED', 'en', 12);
  assert.ok(viMsg.includes('12 giây'));
  assert.ok(enMsg.includes('12 seconds'));

  globalRecommendationRateLimiter.reset();
});

test('Contract Test 6: Killing Firestore does not crash the app, /healthz passes, and expiresAtMs cleanup works', async () => {
  setFirestoreForceUnavailableForTests(true);

  try {
    // 1. Test Cache with short TTL expiration
    const cache = new FirestoreBackedTTLCache<{ title: string }>('verified_book', 50, 10);
    cache.set('book-1', { title: 'Test Book' }, 30);
    assert.deepEqual(cache.get('book-1'), { title: 'Test Book' });
    await new Promise((r) => setTimeout(r, 45));
    assert.equal(cache.cleanupExpiredSync(), 1);
    assert.equal(cache.get('book-1'), undefined);

    // 2. Test RateLimitStore with short window expiration
    const rlStore = new FirestoreBackedRateLimitStore(2, 40);
    assert.equal(rlStore.check('203.0.113.5').allowed, true);
    assert.equal(rlStore.check('203.0.113.5').allowed, true);
    assert.equal(rlStore.check('203.0.113.5').allowed, false);
    await new Promise((r) => setTimeout(r, 55));
    const removedBuckets = await rlStore.cleanupExpiredEntries();
    assert.equal(removedBuckets, 1);
    assert.equal(rlStore.check('203.0.113.5').allowed, true);

    // 3. Test EvalRunStore with short TTL expiration
    const evalStore = new FirestoreBackedEvalRunStore(35);
    await evalStore.saveRun({
      id: 'eval_temp_ttl_test',
      status: 'completed',
      mode: 'audit_deterministic',
      modelName: 'gemini-3-flash-preview',
      startedAtIso: new Date().toISOString(),
      progress: { completedSteps: 3, totalSteps: 3 },
      profileIds: ['prof-01'],
      results: [],
      aggregates: [],
      rubricRatings: [],
      savesByBookKey: {},
      realLimitations: null,
    });
    assert.ok(await evalStore.getRunById('eval_temp_ttl_test'));
    await new Promise((r) => setTimeout(r, 50));
    const removedRuns = await evalStore.cleanupExpiredEntries();
    assert.equal(removedRuns, 1);
    assert.equal(await evalStore.getRunById('eval_temp_ttl_test'), null);

    // 4. Test /healthz endpoint while Firestore is killed
    const healthReq = makeJsonRequest('http://localhost:3000/healthz', 'GET');
    const healthRes = await getHealthzRoute(healthReq);
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.headers.get('X-API-Version'), API_VERSION);
    const healthData = HealthzResponseSchema.parse(await healthRes.json());
    assert.equal(healthData.status, 'ok');
    assert.equal(healthData.persistence.backend, 'memory_fallback');
    assert.equal(healthData.persistence.healthy, true);
  } finally {
    setFirestoreForceUnavailableForTests(false);
  }
});
