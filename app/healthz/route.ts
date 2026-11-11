/**
 * Tính năng: Tuyến kiểm tra sức khỏe nền tảng nội bộ GET /healthz (nằm ngoài hợp đồng API công khai).
 * Trường hợp sử dụng: Được Cloud Run / nền tảng gọi định kỳ để kiểm tra tiến trình máy chủ, thực thi dọn dẹp các bản ghi hết hạn (expiresAtMs cleanup) và báo cáo trạng thái tầng lưu trữ (Firestore hoặc Memory Fallback).
 */

import { NextRequest } from 'next/server';
import { getServerEnv } from '@/server/config/env';
import {
  getPersistenceHealthSummary,
  runGlobalPersistenceCleanup,
} from '@/server/persistence/firestoreStores';
import {
  getRawVietnameseEditionsCache,
  getVerifiedBooksCache,
} from '@/server/store/recommendationStore';
import { globalRecommendationRateLimiter } from '@/server/rateLimit/rateLimiter';
import { getGlobalFirestoreEvalStore } from '@/server/adapters/supabaseEvalStub';
import { apiJsonSuccess, resolveRequestId } from '@/server/http/apiResponse';
import { API_VERSION } from '@/src/lib/schemas/apiContract';

export async function GET(req: NextRequest) {
  const requestId = resolveRequestId(req);
  const env = getServerEnv();
  const verifiedBooksCache = getVerifiedBooksCache();
  const editionsCache = getRawVietnameseEditionsCache();
  const evalStore = getGlobalFirestoreEvalStore();

  await runGlobalPersistenceCleanup({
    verifiedBooksCache,
    editionsCache,
    rateLimitStore: globalRecommendationRateLimiter,
    evalRunStore: evalStore,
  });

  const persistence = getPersistenceHealthSummary();

  return apiJsonSuccess(
    {
      status: 'ok' as const,
      version: API_VERSION,
      timestampIso: new Date().toISOString(),
      mode: (env.mockModeEnv ? 'MOCK_MODE' : 'LIVE_PIPELINE') as
        | 'MOCK_MODE'
        | 'LIVE_PIPELINE',
      persistence,
      caches: {
        verifiedBooksCount: verifiedBooksCache.size(),
        editionsCount: editionsCache.size(),
        activeRateLimitBuckets:
          globalRecommendationRateLimiter.getActiveBucketCount(),
        storedEvalRuns: evalStore.getStoredRunCount(),
      },
    },
    { status: 200, requestId },
  );
}
