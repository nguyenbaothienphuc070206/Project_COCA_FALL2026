/**
 * Tính năng: Nguồn chân lý duy nhất (Single Source of Truth) bằng Zod cho toàn bộ Hợp đồng REST API (OpenAPI 3.1) và luồng sự kiện SSE của ShelfPath.
 * Trường hợp sử dụng: Kiểm tra hợp lệ dữ liệu đầu vào/đầu ra ở cả phía Server Route Handlers, Typed API Client (/src/lib/api) và bộ Kiểm thử Hợp đồng (Contract Tests).
 */

import { z } from 'zod';
import {
  ExtractedCandidateSchema,
  PipelineStageKeySchema,
  PipelineStatsSchema,
  ReaderLevelSchema,
  RecommendationSetSchema,
  RefinementAdjustmentSchema,
  RejectedCandidateLogSchema,
  UserPreferencesSchema,
  VerificationDetailSchema,
  VerifiedBookSchema,
  VietnameseEditionInfoSchema,
} from '@/src/types/book';

export const API_VERSION = '1' as const;

export const ApiErrorCodeSchema = z.enum([
  'INVALID_JSON_BODY',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'FORBIDDEN_ORIGIN',
  'BOT_CHALLENGE_FAILED',
  'INVALID_PREFERENCES',
  'INVALID_REFINE_PAYLOAD',
  'INVALID_DISMISS_PAYLOAD',
  'INVALID_EVAL_PAYLOAD',
  'INVALID_RUBRIC_VALUES',
  'INVALID_SAVE_PAYLOAD',
  'INVALID_IMPORT_RUN_FORMAT',
  'UNKNOWN_ACTION',
  'RECOMMENDATION_SET_NOT_FOUND',
  'SESSION_NOT_FOUND',
  'BOOK_VERIFICATION_NOT_FOUND',
  'EVAL_RUN_NOT_FOUND',
  'EVAL_DISABLED',
  'EVAL_UNAUTHORIZED',
  'RATE_LIMITED',
  'DAILY_BUDGET_EXHAUSTED',
  'CIRCUIT_BREAKER_OPEN',
  'SOURCE_OUTAGE_FAIL_CLOSED',
  'MISSING_GEMINI_KEY',
  'PIPELINE_ERROR',
  'REFINE_ERROR',
  'DISMISS_ERROR',
  'EDITION_LOOKUP_ERROR',
  'INTERNAL_SERVER_ERROR',
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/**
 * Cấu trúc Error Envelope chuẩn cho toàn bộ API:
 * { error: { code, message, requestId, retryAfterSeconds? } }
 */
export const ApiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string().min(1),
    requestId: z.string().min(1),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
  }),
});
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;

/**
 * POST /api/recommendations — Request & Response
 */
export const CreateRecommendationRequestSchema = z.object({
  preferences: UserPreferencesSchema,
  useMockMode: z.boolean().optional(),
  simulateOutage: z.boolean().optional(),
});
export type CreateRecommendationRequest = z.infer<
  typeof CreateRecommendationRequestSchema
>;

export const CreateRecommendationResponseSchema = RecommendationSetSchema;
export type CreateRecommendationResponse = z.infer<
  typeof CreateRecommendationResponseSchema
>;

/**
 * GET /api/recommendations — Server Status & Secrets Configuration Response
 */
export const ServerStatusResponseSchema = z.object({
  mode: z.enum(['MOCK_MODE', 'LIVE_PIPELINE']),
  hasGeminiKey: z.boolean(),
  hasGoogleBooksKey: z.boolean(),
  hasOpenLibraryEmail: z.boolean(),
  warnings: z.array(z.string()),
  availableSampleBooks: z.number().int().nonnegative(),
  persistenceBackend: z.enum(['firestore', 'memory_fallback']).optional(),
});
export type ServerStatusResponse = z.infer<typeof ServerStatusResponseSchema>;

/**
 * GET /api/recommendations/{id} — Response
 */
export const GetRecommendationByIdResponseSchema = RecommendationSetSchema;
export type GetRecommendationByIdResponse = z.infer<
  typeof GetRecommendationByIdResponseSchema
>;

/**
 * POST /api/recommendations/{id}/refine — Request & Response
 */
export const RefineRecommendationRequestSchema = z.object({
  text: z.string().max(500).optional(),
  removeChipId: z.string().max(120).optional(),
  clearAllAdjustments: z.boolean().optional(),
  useMockMode: z.boolean().optional(),
});
export type RefineRecommendationRequest = z.infer<
  typeof RefineRecommendationRequestSchema
>;

export const RefineRecommendationResponseSchema = z.object({
  recommendationSet: RecommendationSetSchema,
  adjustment: RefinementAdjustmentSchema,
  keptPreviousBecauseEmpty: z.boolean(),
  wasTruncated: z.boolean(),
  blockedInjectionAttempt: z.boolean(),
});
export type RefineRecommendationResponse = z.infer<
  typeof RefineRecommendationResponseSchema
>;

/**
 * POST /api/recommendations/{id}/dismiss — Request & Response
 */
export const DismissRecommendationRequestSchema = z.object({
  bookId: z.string().min(1).max(160),
  undo: z.boolean().optional(),
  useMockMode: z.boolean().optional(),
});
export type DismissRecommendationRequest = z.infer<
  typeof DismissRecommendationRequestSchema
>;

export const DismissRecommendationResponseSchema = z.object({
  recommendationSet: RecommendationSetSchema,
  dismissedBook: VerifiedBookSchema.nullable().optional(),
  replacementBook: VerifiedBookSchema.nullable().optional(),
  undone: z.boolean().optional(),
});
export type DismissRecommendationResponse = z.infer<
  typeof DismissRecommendationResponseSchema
>;

/**
 * GET /api/books/{bookId}/verification — Response
 */
export const BookVerificationResponseSchema = z.object({
  bookId: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string()).min(1),
  verification: VerificationDetailSchema,
  vietnameseEdition: VietnameseEditionInfoSchema,
});
export type BookVerificationResponse = z.infer<
  typeof BookVerificationResponseSchema
>;

/**
 * GET /api/books/{bookId}/editions — Response
 */
export const BookEditionsResponseSchema = z.object({
  bookId: z.string().min(1),
  vietnameseEdition: VietnameseEditionInfoSchema,
});
export type BookEditionsResponse = z.infer<typeof BookEditionsResponseSchema>;

/**
 * SSE Event Schemas (stage, candidate_found, book_verified, book_removed, done, error)
 */
export const PipelineSSEStageEventSchema = z.object({
  type: z.literal('stage'),
  stage: PipelineStageKeySchema,
  stats: PipelineStatsSchema,
  queries: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export const PipelineSSECandidateFoundEventSchema = z.object({
  type: z.literal('candidate_found'),
  candidate: ExtractedCandidateSchema,
  stats: PipelineStatsSchema,
});

export const PipelineSSEBookVerifiedEventSchema = z.object({
  type: z.literal('book_verified'),
  book: VerifiedBookSchema,
  stats: PipelineStatsSchema,
});

export const PipelineSSEBookRemovedEventSchema = z.object({
  type: z.literal('book_removed'),
  rejected: RejectedCandidateLogSchema,
  stats: PipelineStatsSchema,
});

export const PipelineSSEDoneEventSchema = z.object({
  type: z.literal('done'),
  recommendationSet: RecommendationSetSchema,
});

export const PipelineSSEErrorEventSchema = z.object({
  type: z.literal('error'),
  code: z.enum([
    'SOURCE_OUTAGE_FAIL_CLOSED',
    'RATE_LIMITED',
    'DAILY_BUDGET_EXHAUSTED',
    'CIRCUIT_BREAKER_OPEN',
    'MISSING_GEMINI_KEY',
    'PIPELINE_ERROR',
  ]),
  message: z.string().min(1),
  retryAfterMs: z.number().int().nonnegative().optional(),
  warnings: z.array(z.string()).optional(),
});

export const PipelineSSEEventSchema = z.discriminatedUnion('type', [
  PipelineSSEStageEventSchema,
  PipelineSSECandidateFoundEventSchema,
  PipelineSSEBookVerifiedEventSchema,
  PipelineSSEBookRemovedEventSchema,
  PipelineSSEDoneEventSchema,
  PipelineSSEErrorEventSchema,
]);

/**
 * Evaluation Lab (/api/eval/runs & /api/eval/runs/{id}) Schemas
 */
export const EvalConfigIdSchema = z.enum([
  'A_MODEL_ONLY',
  'B_MODEL_SEARCH',
  'C_FULL_VERIFIED',
]);

export const PreparedEvalProfileSchema = z.object({
  id: z.string().min(1),
  labelVi: z.string().min(1),
  labelEn: z.string().min(1),
  isPreparedSample: z.literal(true),
  sampleNotice: z.string(),
  topic: z.string().min(1),
  level: ReaderLevelSchema,
  length: z.enum(['any', 'short', 'medium', 'long']),
  language: z.enum(['any', 'en', 'vi']),
  adventurousness: z.number().min(0).max(100),
});

export const EvalFailureRecordSchema = z.object({
  profileId: z.string(),
  configId: EvalConfigIdSchema,
  candidateTitle: z.string(),
  candidateAuthor: z.string(),
  reasonCode: z.enum([
    'NO_CANDIDATES',
    'TITLE_SIMILARITY_LOW',
    'AUTHOR_MISMATCH',
    'SOURCE_OUTAGE',
  ]),
  detail: z.string(),
});

export const EvalDisplayedBookAuditSchema = z.object({
  bookId: z.string(),
  title: z.string(),
  author: z.string(),
  passedAuditVerification: z.boolean(),
  auditFailureReasonCode: z
    .enum([
      'NO_CANDIDATES',
      'TITLE_SIMILARITY_LOW',
      'AUTHOR_MISMATCH',
      'SOURCE_OUTAGE',
    ])
    .optional(),
  hasIsbn: z.boolean(),
  hasPageCount: z.boolean(),
  hasVietnameseEdition: z.boolean(),
  sourceUrl: z.string().nullable(),
  embeddingVector: z.array(z.number()),
});

export const EvalProfileConfigResultSchema = z.object({
  profileId: z.string(),
  configId: EvalConfigIdSchema,
  modelName: z.string(),
  timestampIso: z.string(),
  candidatesProduced: z.number().int().nonnegative(),
  verifiedCount: z.number().int().nonnegative(),
  auditFailedCount: z.number().int().nonnegative(),
  displayedBooksCount: z.number().int().nonnegative(),
  displayedUnverifiedCount: z.number().int().nonnegative(),
  auditFailureRatePercent: z.number().min(0).max(100),
  displayedFailureRatePercent: z.number().min(0).max(100),
  listDiversity: z.number().min(0).max(2),
  latency: z.object({
    timeToFirstBookMs: z.number().nonnegative(),
    fullRoadmapMs: z.number().nonnegative(),
    refinementResponseMs: z.number().nonnegative(),
  }),
  failures: z.array(EvalFailureRecordSchema),
  displayedBooks: z.array(EvalDisplayedBookAuditSchema),
  sourceOutageOccurred: z.boolean(),
});

export const EvalTesterRubricSubmissionSchema = z.object({
  id: z.string(),
  runId: z.string(),
  profileId: z.string(),
  configId: EvalConfigIdSchema,
  wasBlindMode: z.boolean(),
  relevance: z.number().int().min(1).max(5),
  levelFit: z.number().int().min(1).max(5),
  usefulness: z.number().int().min(1).max(5),
  notes: z.string().optional(),
  submittedAtIso: z.string(),
});

export const EvalConfigAggregateMetricsSchema = z.object({
  configId: EvalConfigIdSchema,
  configNameVi: z.string(),
  configNameEn: z.string(),
  profilesEvaluated: z.number().int().nonnegative(),
  totalCandidatesProduced: z.number().int().nonnegative(),
  totalAuditVerified: z.number().int().nonnegative(),
  totalAuditFailed: z.number().int().nonnegative(),
  meanAuditFailureRatePercent: z.number().min(0).max(100),
  meanDisplayedUnverifiedRatePercent: z.number().min(0).max(100),
  meanListDiversity: z.number().min(0).max(2),
  meanTimeToFirstBookMs: z.number().nonnegative(),
  meanFullRoadmapMs: z.number().nonnegative(),
  meanRefinementResponseMs: z.number().nonnegative(),
  rubricStats: z.object({
    n: z.number().int().nonnegative(),
    meanRelevance: z.number().nullable(),
    meanLevelFit: z.number().nullable(),
    meanUsefulness: z.number().nullable(),
  }),
  totalSavesInEvalSession: z.number().int().nonnegative(),
});

export const EvalRealLimitationsSummarySchema = z.object({
  measuredFromRunId: z.string(),
  totalProfilesRun: z.number().int().nonnegative(),
  totalRawCandidatesAudited: z.number().int().nonnegative(),
  unverifiedCandidatesCaughtByAudit: z.number().int().nonnegative(),
  sourceOutageCount: z.number().int().nonnegative(),
  missingIsbnCount: z.number().int().nonnegative(),
  missingPageCount: z.number().int().nonnegative(),
  noVietnameseEditionInSourcesCount: z.number().int().nonnegative(),
  failureReasonsBreakdown: z.record(z.string(), z.number().int().nonnegative()),
});

export const EvalRunRecordSchema = z.object({
  id: z.string(),
  status: z.enum(['running', 'completed', 'failed']),
  mode: z.enum(['audit_deterministic', 'live_audit']),
  modelName: z.string(),
  startedAtIso: z.string(),
  completedAtIso: z.string().optional(),
  progress: z.object({
    completedSteps: z.number().int().nonnegative(),
    totalSteps: z.number().int().nonnegative(),
    currentProfileId: z.string().optional(),
    currentConfigId: EvalConfigIdSchema.optional(),
  }),
  profileIds: z.array(z.string()),
  results: z.array(EvalProfileConfigResultSchema),
  aggregates: z.array(EvalConfigAggregateMetricsSchema),
  rubricRatings: z.array(EvalTesterRubricSubmissionSchema),
  savesByBookKey: z.record(z.string(), z.number().int().nonnegative()),
  realLimitations: EvalRealLimitationsSummarySchema.nullable(),
});

export const EvalRunsListResponseSchema = z.object({
  evalEnabled: z.literal(true),
  modelName: z.string(),
  persistence: z.object({
    adapter: z.string().optional(),
    backend: z.enum(['firestore', 'memory_fallback']).optional(),
    configuredUrl: z.boolean().optional(),
    configured: z.boolean().optional(),
    note: z.string().optional(),
  }),
  profiles: z.array(PreparedEvalProfileSchema),
  runs: z.array(EvalRunRecordSchema),
});
export type EvalRunsListResponse = z.infer<typeof EvalRunsListResponseSchema>;

export const StartEvalRunRequestSchema = z.object({
  action: z.enum(['start_run', 'import_run']).optional(),
  profileIds: z.array(z.string().min(1)).max(20).optional(),
  mode: z.enum(['audit_deterministic', 'live_audit']).optional(),
  run: z.unknown().optional(),
});
export type StartEvalRunRequest = z.infer<typeof StartEvalRunRequestSchema>;

export const EvalRunActionRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('submit_rubric'),
    profileId: z.string().min(1).max(80),
    configId: EvalConfigIdSchema,
    relevance: z.number().int().min(1).max(5),
    levelFit: z.number().int().min(1).max(5),
    usefulness: z.number().int().min(1).max(5),
    wasBlindMode: z.boolean().optional(),
    notes: z.string().max(300).optional(),
  }),
  z.object({
    action: z.literal('record_save'),
    configId: EvalConfigIdSchema,
    bookId: z.string().min(1).max(160),
  }),
]);
export type EvalRunActionRequest = z.infer<typeof EvalRunActionRequestSchema>;

/**
 * GET /healthz — Internal Platform Health Check Schema
 */
export const HealthzResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  version: z.string(),
  timestampIso: z.string(),
  mode: z.enum(['MOCK_MODE', 'LIVE_PIPELINE']),
  persistence: z.object({
    backend: z.enum(['firestore', 'memory_fallback']),
    healthy: z.boolean(),
    warning: z.string().optional(),
  }),
  caches: z.object({
    verifiedBooksCount: z.number().int().nonnegative(),
    editionsCount: z.number().int().nonnegative(),
    activeRateLimitBuckets: z.number().int().nonnegative(),
    storedEvalRuns: z.number().int().nonnegative(),
  }),
});
export type HealthzResponse = z.infer<typeof HealthzResponseSchema>;

/**
 * Trả về thông báo lỗi thân thiện đã bản địa hóa (Tiếng Việt & Tiếng Anh) cho từng mã lỗi chuẩn.
 */
export function getLocalizedApiErrorMessage(
  code: ApiErrorCode,
  locale: 'vi' | 'en',
  retryAfterSeconds?: number,
): string {
  const waitSec = retryAfterSeconds ?? 15;
  const messages: Record<ApiErrorCode, { vi: string; en: string }> = {
    INVALID_JSON_BODY: {
      vi: 'Dữ liệu yêu cầu gửi lên không đúng định dạng JSON hợp lệ.',
      en: 'The request payload is not valid JSON.',
    },
    PAYLOAD_TOO_LARGE: {
      vi: 'Kích thước dữ liệu gửi lên vượt quá giới hạn an toàn cho phép.',
      en: 'Request payload size exceeds the maximum allowed limit.',
    },
    UNSUPPORTED_MEDIA_TYPE: {
      vi: 'Header Content-Type phải là application/json.',
      en: 'Content-Type header must be application/json.',
    },
    FORBIDDEN_ORIGIN: {
      vi: 'Truy vấn từ nguồn (Origin) không nằm trong danh sách cho phép của CORS.',
      en: 'Cross-origin request blocked by CORS policy.',
    },
    BOT_CHALLENGE_FAILED: {
      vi: 'Xác thực chống bot (Turnstile/hCaptcha) không hợp lệ hoặc bị thiếu.',
      en: 'Bot protection verification (Turnstile/hCaptcha) failed or was missing.',
    },
    INVALID_PREFERENCES: {
      vi: 'Vui lòng nhập chủ đề tự học hợp lệ (1–140 ký tự) và kiểm tra lại tùy chọn trình độ.',
      en: 'Please enter a valid learning topic (1–140 characters) and check your preference selections.',
    },
    INVALID_REFINE_PAYLOAD: {
      vi: 'Yêu cầu tinh chỉnh lộ trình không hợp lệ. Vui lòng thử lại với câu ngắn gọn hơn (tối đa 260 ký tự).',
      en: 'Invalid refinement request. Please try again with a concise phrase (max 260 characters).',
    },
    INVALID_DISMISS_PAYLOAD: {
      vi: 'Thiếu mã định danh sách cần bỏ qua hoặc hoàn tác.',
      en: 'Missing book identifier to dismiss or undo.',
    },
    INVALID_EVAL_PAYLOAD: {
      vi: 'Tham số khởi chạy phiên đánh giá không hợp lệ.',
      en: 'Invalid evaluation run parameters.',
    },
    INVALID_RUBRIC_VALUES: {
      vi: 'Điểm chấm Rubric phải là số nguyên từ 1 đến 5 cho cả 3 tiêu chí.',
      en: 'Rubric scores must be integers between 1 and 5 across all three dimensions.',
    },
    INVALID_SAVE_PAYLOAD: {
      vi: 'Thông tin ghi nhận lượt lưu sách trong phiên đánh giá không hợp lệ.',
      en: 'Invalid evaluation book save payload.',
    },
    INVALID_IMPORT_RUN_FORMAT: {
      vi: 'Tệp JSON nhập vào không khớp với cấu trúc phiên đánh giá của ShelfPath.',
      en: 'The imported JSON file does not match the ShelfPath evaluation run schema.',
    },
    UNKNOWN_ACTION: {
      vi: 'Thao tác yêu cầu không được hỗ trợ.',
      en: 'The requested action is not supported.',
    },
    RECOMMENDATION_SET_NOT_FOUND: {
      vi: 'Không tìm thấy bộ lộ trình đọc theo mã phiên này.',
      en: 'Could not find the requested reading roadmap session.',
    },
    SESSION_NOT_FOUND: {
      vi: 'Phiên gợi ý đã hết hạn hoặc không tồn tại. Vui lòng tạo lại lộ trình.',
      en: 'Recommendation session expired or was not found. Please generate a new roadmap.',
    },
    BOOK_VERIFICATION_NOT_FOUND: {
      vi: 'Không tìm thấy hồ sơ kiểm chứng cho mã sách này.',
      en: 'Verification record not found for this book ID.',
    },
    EVAL_RUN_NOT_FOUND: {
      vi: 'Không tìm thấy phiên chạy thực nghiệm theo mã ID này.',
      en: 'Evaluation run not found for the specified ID.',
    },
    EVAL_DISABLED: {
      vi: 'Phòng thí nghiệm Đánh giá (/eval) đang tắt qua cờ môi trường EVAL_ENABLED=false.',
      en: 'Evaluation Lab (/eval) is disabled via the EVAL_ENABLED=false environment flag.',
    },
    EVAL_UNAUTHORIZED: {
      vi: 'Thiếu hoặc sai mã xác thực quản trị viên (EVAL_ADMIN_TOKEN) để truy cập Phòng thí nghiệm Đánh giá.',
      en: 'Missing or invalid EVAL_ADMIN_TOKEN required to access the Evaluation Lab.',
    },
    RATE_LIMITED: {
      vi: `Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi ${waitSec} giây rồi thử lại.`,
      en: `Too many requests in a short window. Please wait ${waitSec} seconds before retrying.`,
    },
    DAILY_BUDGET_EXHAUSTED: {
      vi: `Hệ thống đang bận do đã chạm ngân sách gọi AI trong ngày. Vui lòng thử lại sau ${waitSec} giây hoặc dùng Chế độ Dữ liệu mẫu.`,
      en: `Service is currently busy (daily AI call budget reached). Please try again later or switch to Sample Mode.`,
    },
    CIRCUIT_BREAKER_OPEN: {
      vi: `Hệ thống AI tạm thời quá tải (cầu dao bảo vệ đang mở). Vui lòng thử lại sau ${waitSec} giây.`,
      en: `Service is temporarily busy (AI circuit breaker open). Please try again in ${waitSec} seconds.`,
    },
    SOURCE_OUTAGE_FAIL_CLOSED: {
      vi: 'Không thể kết nối tới cả Open Library và Google Books để xác thực danh mục. Theo nguyên tắc An toàn Đóng (Fail-Closed), ShelfPath tạm dừng hiển thị kết quả.',
      en: 'Both Open Library and Google Books verification catalogs are unreachable. Per our Fail-Closed trust rule, unverified results are withheld.',
    },
    MISSING_GEMINI_KEY: {
      vi: 'Thiếu khóa GEMINI_API_KEY trên máy chủ. Vui lòng mở bảng Secrets của AI Studio để cấu hình khóa hoặc bật Chế độ Dữ liệu mẫu.',
      en: 'Missing GEMINI_API_KEY in server environment. Please add your key in the AI Studio Secrets panel or switch to Sample Mode.',
    },
    PIPELINE_ERROR: {
      vi: 'Quá trình xây dựng lộ trình gặp sự cố tạm thời. Vui lòng thử lại.',
      en: 'The recommendation pipeline encountered a temporary error. Please try again.',
    },
    REFINE_ERROR: {
      vi: 'Không thể áp dụng tinh chỉnh lúc này. Vui lòng thử lại.',
      en: 'Could not apply refinement at this time. Please try again.',
    },
    DISMISS_ERROR: {
      vi: 'Không thể cập nhật trạng thái bỏ qua sách lúc này.',
      en: 'Could not dismiss or restore the book at this time.',
    },
    EDITION_LOOKUP_ERROR: {
      vi: 'Không thể tra cứu thông tin ấn bản Tiếng Việt từ nguồn danh mục lúc này.',
      en: 'Could not look up Vietnamese edition metadata from catalog sources right now.',
    },
    INTERNAL_SERVER_ERROR: {
      vi: 'Lỗi hệ thống nội bộ. Vui lòng thử lại sau giây lát.',
      en: 'Internal server error. Please try again in a moment.',
    },
  };

  return messages[code]?.[locale] ?? messages.INTERNAL_SERVER_ERROR[locale];
}
