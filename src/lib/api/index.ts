/**
 * Tính năng: Typed API Client duy nhất (/src/lib/api) cho toàn bộ trình duyệt, được định kiểu trực tiếp từ bộ schema Zod (/src/lib/schemas/apiContract).
 * Trường hợp sử dụng:
 * - Tập trung 100% lệnh gọi HTTP/SSE của ứng dụng vào một module duy nhất (không có lệnh fetch rời rạc trong các component).
 * - Hỗ trợ SSE streaming kèm hủy giữa chừng (AbortSignal) và tự động thử lại (retry with backoff) khi gặp lỗi mạng tạm thời.
 * - Giải mã Error Envelope chuẩn { error: { code, message, requestId, retryAfterSeconds? } } và cung cấp thông báo lỗi song ngữ thân thiện.
 */

import { z } from 'zod';
import {
  API_VERSION,
  ApiErrorCode,
  ApiErrorEnvelopeSchema,
  BookEditionsResponseSchema,
  BookVerificationResponseSchema,
  CreateRecommendationResponseSchema,
  DismissRecommendationRequest,
  DismissRecommendationResponse,
  DismissRecommendationResponseSchema,
  EvalConfigIdSchema,
  EvalRunsListResponse,
  EvalRunsListResponseSchema,
  EvalRunRecordSchema,
  GetRecommendationByIdResponseSchema,
  getLocalizedApiErrorMessage,
  PipelineSSEEventSchema,
  RefineRecommendationRequest,
  RefineRecommendationResponse,
  RefineRecommendationResponseSchema,
  ServerStatusResponse,
  ServerStatusResponseSchema,
} from '@/src/lib/schemas/apiContract';
import {
  PipelineSSEEvent,
  RecommendationSet,
  UserPreferences,
  VerificationDetail,
  VietnameseEditionInfo,
} from '@/src/types/book';
import { EvalRunRecord } from '@/src/lib/evalMetrics';

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId: string;
  readonly retryAfterSeconds?: number;

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    status: number;
    requestId?: string;
    retryAfterSeconds?: number;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId || 'req_client_unknown';
    this.retryAfterSeconds = params.retryAfterSeconds;
  }

  getLocalizedMessage(locale: 'vi' | 'en'): string {
    return getLocalizedApiErrorMessage(
      this.code,
      locale,
      this.retryAfterSeconds,
    );
  }
}

export class SourceOutageError extends ApiClientError {
  constructor(
    message: string,
    code: ApiErrorCode = 'SOURCE_OUTAGE_FAIL_CLOSED',
    requestId?: string,
  ) {
    super({
      code,
      message,
      status: 503,
      requestId,
    });
    this.name = 'SourceOutageError';
  }
}

export class RateLimitError extends ApiClientError {
  readonly retryAfterMs: number;
  constructor(
    message: string,
    retryAfterMs: number = 10_000,
    requestId?: string,
  ) {
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    super({
      code: 'RATE_LIMITED',
      message,
      status: 429,
      requestId,
      retryAfterSeconds,
    });
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export interface StreamRecommendationsCallbacks {
  onEvent: (event: PipelineSSEEvent) => void;
}

function createClientRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createScopedTimeoutSignal(
  externalSignal?: AbortSignal,
  timeoutMs: number = 20_000,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error('CLIENT_REQUEST_TIMEOUT'));
  }, timeoutMs);

  const onAbort = () => {
    clearTimeout(timer);
    controller.abort(externalSignal?.reason ?? new Error('CLIENT_ABORTED'));
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      controller.abort(externalSignal.reason ?? new Error('CLIENT_ABORTED'));
    } else {
      externalSignal.addEventListener('abort', onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onAbort);
      }
    },
  };
}

async function parseErrorResponse(res: Response): Promise<ApiClientError> {
  const headerReqId = res.headers.get('x-request-id') || undefined;
  let rawJson: unknown = null;
  try {
    rawJson = await res.json();
  } catch {
    rawJson = null;
  }

  const parsedEnvelope = ApiErrorEnvelopeSchema.safeParse(rawJson);
  if (parsedEnvelope.success) {
    const { code, message, requestId, retryAfterSeconds } =
      parsedEnvelope.data.error;
    if (res.status === 429 || code === 'RATE_LIMITED') {
      return new RateLimitError(
        message,
        (retryAfterSeconds ?? 15) * 1000,
        requestId,
      );
    }
    if (
      res.status === 503 ||
      code === 'SOURCE_OUTAGE_FAIL_CLOSED' ||
      code === 'MISSING_GEMINI_KEY' ||
      code === 'DAILY_BUDGET_EXHAUSTED' ||
      code === 'CIRCUIT_BREAKER_OPEN'
    ) {
      return new SourceOutageError(message, code, requestId);
    }
    return new ApiClientError({
      code,
      message,
      status: res.status,
      requestId,
      retryAfterSeconds,
    });
  }

  if (res.status === 429) {
    return new RateLimitError(
      'Rate limit exceeded. Please wait before retrying.',
      15_000,
      headerReqId,
    );
  }
  if (res.status === 503) {
    return new SourceOutageError(
      'Verification catalog sources are unreachable.',
      'SOURCE_OUTAGE_FAIL_CLOSED',
      headerReqId,
    );
  }

  return new ApiClientError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Request failed with HTTP ${res.status}`,
    status: res.status,
    requestId: headerReqId,
  });
}

let inMemoryEvalAdminToken = '';

/**
 * Lưu tạm thời mã EVAL_ADMIN_TOKEN trong bộ nhớ phiên làm việc của tab trình duyệt (không dùng cookie).
 */
export function setClientEvalAdminToken(token: string): void {
  inMemoryEvalAdminToken = token.trim();
}

export function getClientEvalAdminToken(): string {
  return inMemoryEvalAdminToken;
}

async function requestTypedJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const reqId = createClientRequestId();
  const { signal, cleanup } = createScopedTimeoutSignal(
    init?.signal ?? undefined,
    init?.timeoutMs ?? 20_000,
  );

  const authHeaders: Record<string, string> = {};
  if (inMemoryEvalAdminToken && path.startsWith('/api/eval')) {
    authHeaders['X-Eval-Admin-Token'] = inMemoryEvalAdminToken;
  }

  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': API_VERSION,
        'X-Request-Id': reqId,
        ...authHeaders,
        ...(init?.headers ?? {}),
      },
      signal,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    const rawData = await res.json();
    return schema.parse(rawData);
  } finally {
    cleanup();
  }
}

/**
 * 1. Truyền phát SSE (POST /api/recommendations với Accept: text/event-stream) kèm hỗ trợ AbortSignal và tự động thử lại (retry) 1 lần nếu lỗi mạng thoáng qua trước khi nhận dữ liệu.
 */
export async function streamRecommendations(
  preferences: UserPreferences,
  callbacks: StreamRecommendationsCallbacks,
  options?: {
    useMockMode?: boolean;
    simulateOutage?: boolean;
    botToken?: string;
    signal?: AbortSignal;
    maxRetries?: number;
  },
): Promise<RecommendationSet | null> {
  const maxRetries = options?.maxRetries ?? 1;
  let attempt = 0;

  while (attempt <= maxRetries) {
    if (options?.signal?.aborted) {
      return null;
    }

    const reqId = createClientRequestId();
    const { signal: scopedSignal, cleanup } = createScopedTimeoutSignal(
      options?.signal,
      45_000,
    );

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'X-API-Version': API_VERSION,
          'X-Request-Id': reqId,
        },
        body: JSON.stringify({
          preferences,
          useMockMode: options?.useMockMode,
          simulateOutage: options?.simulateOutage ?? false,
        }),
        signal: scopedSignal,
      });

      if (!response.ok) {
        throw await parseErrorResponse(response);
      }

      if (!response.body) {
        throw new ApiClientError({
          code: 'PIPELINE_ERROR',
          message: 'Empty response stream from server.',
          status: 500,
          requestId: reqId,
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalSet: RecommendationSet | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          const lines = block.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              const rawEvent = JSON.parse(jsonStr);
              const parsedEvent = PipelineSSEEventSchema.safeParse(rawEvent);
              const event = (
                parsedEvent.success ? parsedEvent.data : rawEvent
              ) as PipelineSSEEvent;

              callbacks.onEvent(event);
              if (event.type === 'done') {
                finalSet = CreateRecommendationResponseSchema.parse(
                  event.recommendationSet,
                );
              } else if (event.type === 'error') {
                if (
                  event.code === 'SOURCE_OUTAGE_FAIL_CLOSED' ||
                  event.code === 'MISSING_GEMINI_KEY'
                ) {
                  throw new SourceOutageError(
                    event.message,
                    event.code,
                    reqId,
                  );
                }
              }
            }
          }
        }
      }

      cleanup();
      return finalSet;
    } catch (err) {
      cleanup();
      if (options?.signal?.aborted) {
        return null;
      }
      if (
        err instanceof RateLimitError ||
        err instanceof SourceOutageError ||
        (err instanceof ApiClientError && err.status < 500)
      ) {
        throw err;
      }
      if (attempt < maxRetries) {
        attempt += 1;
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw err;
    }
  }

  return null;
}

/**
 * 2. Gọi POST /api/recommendations (chế độ JSON đồng bộ)
 */
export async function createRecommendationSet(
  preferences: UserPreferences,
  options?: {
    useMockMode?: boolean;
    simulateOutage?: boolean;
    signal?: AbortSignal;
  },
): Promise<RecommendationSet> {
  return requestTypedJson(
    '/api/recommendations',
    CreateRecommendationResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        preferences,
        useMockMode: options?.useMockMode,
        simulateOutage: options?.simulateOutage ?? false,
      }),
      signal: options?.signal,
      timeoutMs: 30_000,
    },
  );
}

/**
 * 3. Truy vấn trạng thái máy chủ & cảnh báo thiếu khóa (GET /api/recommendations)
 */
export async function fetchServerStatus(
  signal?: AbortSignal,
): Promise<ServerStatusResponse> {
  try {
    return await requestTypedJson(
      '/api/recommendations',
      ServerStatusResponseSchema,
      {
        method: 'GET',
        signal,
        timeoutMs: 10_000,
      },
    );
  } catch {
    return {
      mode: 'MOCK_MODE',
      hasGeminiKey: false,
      hasGoogleBooksKey: false,
      hasOpenLibraryEmail: false,
      warnings: [],
      availableSampleBooks: 0,
      persistenceBackend: 'memory_fallback',
    };
  }
}

/**
 * 4. Truy vấn một bộ gợi ý theo ID (GET /api/recommendations/{id})
 */
export async function fetchRecommendationById(
  recommendationId: string,
  signal?: AbortSignal,
): Promise<RecommendationSet | null> {
  try {
    return await requestTypedJson(
      `/api/recommendations/${encodeURIComponent(recommendationId)}`,
      GetRecommendationByIdResponseSchema,
      {
        method: 'GET',
        signal,
        timeoutMs: 10_000,
      },
    );
  } catch {
    return null;
  }
}

/**
 * 5. Tinh chỉnh lộ trình bằng ngôn ngữ tự nhiên (POST /api/recommendations/{id}/refine)
 */
export async function refineRecommendations(
  recommendationId: string,
  payload: RefineRecommendationRequest,
  signal?: AbortSignal,
): Promise<RefineRecommendationResponse | null> {
  try {
    return await requestTypedJson(
      `/api/recommendations/${encodeURIComponent(recommendationId)}/refine`,
      RefineRecommendationResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        signal,
        timeoutMs: 15_000,
      },
    );
  } catch {
    return null;
  }
}

/**
 * 6. Bỏ qua sách ("Not interested") hoặc hoàn tác (POST /api/recommendations/{id}/dismiss)
 */
export async function dismissRecommendationBook(
  recommendationId: string,
  payload: DismissRecommendationRequest,
  signal?: AbortSignal,
): Promise<DismissRecommendationResponse | null> {
  try {
    return await requestTypedJson(
      `/api/recommendations/${encodeURIComponent(recommendationId)}/dismiss`,
      DismissRecommendationResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        signal,
        timeoutMs: 15_000,
      },
    );
  } catch {
    return null;
  }
}

/**
 * 7. Truy vấn hồ sơ kiểm chứng chi tiết của sách (GET /api/books/{bookId}/verification)
 */
export async function fetchBookVerificationDetail(
  bookId: string,
  signal?: AbortSignal,
): Promise<VerificationDetail | null> {
  try {
    const res = await requestTypedJson(
      `/api/books/${encodeURIComponent(bookId)}/verification`,
      BookVerificationResponseSchema,
      {
        method: 'GET',
        signal,
        timeoutMs: 10_000,
      },
    );
    return res.verification;
  } catch {
    return null;
  }
}

/**
 * 8. Tra cứu thông tin ấn bản Tiếng Việt (GET /api/books/{bookId}/editions)
 */
export async function fetchBookVietnameseEditions(
  bookId: string,
  signal?: AbortSignal,
): Promise<VietnameseEditionInfo | null> {
  try {
    const res = await requestTypedJson(
      `/api/books/${encodeURIComponent(bookId)}/editions`,
      BookEditionsResponseSchema,
      {
        method: 'GET',
        signal,
        timeoutMs: 12_000,
      },
    );
    return res.vietnameseEdition;
  } catch {
    return null;
  }
}

/**
 * 9. Danh sách phiên chạy thực nghiệm & 14 hồ sơ mẫu (GET /api/eval/runs)
 */
export async function fetchEvalLabOverview(
  signal?: AbortSignal,
): Promise<EvalRunsListResponse> {
  return requestTypedJson('/api/eval/runs', EvalRunsListResponseSchema, {
    method: 'GET',
    cache: 'no-store',
    signal,
    timeoutMs: 12_000,
  });
}

/**
 * 10. Khởi chạy bất đồng bộ một phiên đánh giá mới (POST /api/eval/runs)
 */
export async function startEvalLabRun(
  payload: {
    profileIds?: string[];
    mode?: 'audit_deterministic' | 'live_audit';
  },
  signal?: AbortSignal,
): Promise<EvalRunRecord> {
  return requestTypedJson('/api/eval/runs', EvalRunRecordSchema, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
    timeoutMs: 15_000,
  });
}

/**
 * 11. Nhập (Import) một tệp JSON phiên đánh giá đã lưu trước đó (POST /api/eval/runs)
 */
export async function importEvalLabRun(
  run: unknown,
  signal?: AbortSignal,
): Promise<{ imported: boolean; run: EvalRunRecord }> {
  return requestTypedJson(
    '/api/eval/runs',
    z.object({
      imported: z.boolean(),
      run: EvalRunRecordSchema,
    }),
    {
      method: 'POST',
      body: JSON.stringify({
        action: 'import_run',
        run,
      }),
      signal,
      timeoutMs: 15_000,
    },
  );
}

/**
 * 12. Truy vấn tiến độ và chỉ số của một phiên đánh giá (GET /api/eval/runs/{id})
 */
export async function fetchEvalLabRunById(
  runId: string,
  signal?: AbortSignal,
): Promise<EvalRunRecord> {
  return requestTypedJson(
    `/api/eval/runs/${encodeURIComponent(runId)}`,
    EvalRunRecordSchema,
    {
      method: 'GET',
      cache: 'no-store',
      signal,
      timeoutMs: 12_000,
    },
  );
}

/**
 * 13. Gửi phiếu chấm Rubric của người kiểm thử (POST /api/eval/runs/{id})
 */
export async function submitEvalLabRubric(
  runId: string,
  payload: {
    profileId: string;
    configId: z.infer<typeof EvalConfigIdSchema>;
    relevance: number;
    levelFit: number;
    usefulness: number;
    wasBlindMode: boolean;
    notes?: string;
  },
  signal?: AbortSignal,
): Promise<EvalRunRecord> {
  return requestTypedJson(
    `/api/eval/runs/${encodeURIComponent(runId)}`,
    EvalRunRecordSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        action: 'submit_rubric',
        ...payload,
      }),
      signal,
      timeoutMs: 12_000,
    },
  );
}

/**
 * 14. Ghi nhận lượt lưu sách trong phiên đánh giá (POST /api/eval/runs/{id})
 */
export async function recordEvalLabBookSave(
  runId: string,
  payload: {
    configId: z.infer<typeof EvalConfigIdSchema>;
    bookId: string;
  },
  signal?: AbortSignal,
): Promise<EvalRunRecord> {
  return requestTypedJson(
    `/api/eval/runs/${encodeURIComponent(runId)}`,
    EvalRunRecordSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        action: 'record_save',
        ...payload,
      }),
      signal,
      timeoutMs: 12_000,
    },
  );
}
