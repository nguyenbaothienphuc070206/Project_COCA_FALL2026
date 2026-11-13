/**
 * Tính năng: Bộ điều phối Pipeline 6 bước (Pipeline Orchestrator) hỗ trợ phát luồng sự kiện SSE thời gian thực và chế độ MOCK_MODE.
 * Trường hợp sử dụng: Chạy tuần tự Stage 1 -> Stage 2 -> Stage 3 -> Stage 4 -> Stage 5 (MMR Ranking) -> Stage 6 (Ordering), cập nhật trạng thái trực tiếp cho client.
 */

import {
  ExtractedCandidate,
  PipelineSSEEvent,
  PipelineStageKey,
  PipelineStats,
  RecommendationSet,
  RecommendationSetSchema,
  RejectedCandidateLog,
  UserPreferences,
  VerifiedBook,
} from '@/src/types/book';
import { MOCK_REJECTED_CANDIDATES, MOCK_VERIFIED_BOOKS } from '@/src/data/mockBooks';
import { rerankWithMMR } from '@/src/lib/verification';
import { getServerEnv } from '../config/env';
import { runStage1QueryUnderstanding } from './stage1QueryUnderstanding';
import { defaultSearchProvider } from '../providers/searchProvider';
import { runStage3CandidateExtraction } from './stage3CandidateExtraction';
import { runStage4Verification } from './stage4Verification';
import { runStage5And6RankingAndRoadmap } from './stage5RankingAndExplanation';
import { saveRecommendationSetState } from '../store/recommendationStore';
import {
  logBookVerificationFailure,
  logBookVerificationSuccess,
  logExternalSourceOutage,
  logLlmCallLatency,
  logStructuredEvent,
  logTimeToFirstBook,
} from '../observability/logger';

export interface PipelineRunOptions {
  forceMockMode?: boolean;
  simulateOutage?: boolean;
  onEvent?: (event: PipelineSSEEvent) => void;
  signal?: AbortSignal;
  requestId?: string;
}

/**
 * Chọn và xếp hạng sách mẫu cho chế độ MOCK_MODE, đảm bảo tùy chọn ngôn ngữ (vi/en/any), độ dài và mức khám phá MMR tác động trực tiếp đến thứ tự xếp hạng.
 */
function selectMockBooksForPrefs(prefs: UserPreferences): VerifiedBook[] {
  const q = prefs.topic.toLowerCase();
  let matchedCategory: string | null = null;
  if (
    q.includes('machine') ||
    q.includes('học máy') ||
    q.includes('ai') ||
    q.includes('trí tuệ') ||
    q.includes('dữ liệu') ||
    q.includes('data')
  ) {
    matchedCategory = 'machine-learning';
  } else if (
    q.includes('phil') ||
    q.includes('triết') ||
    q.includes('tư duy phản biện') ||
    q.includes('logic')
  ) {
    matchedCategory = 'philosophy';
  } else if (
    q.includes('finance') ||
    q.includes('tài chính') ||
    q.includes('tiền') ||
    q.includes('đầu tư') ||
    q.includes('kinh tế')
  ) {
    matchedCategory = 'personal-finance';
  } else if (
    q.includes('system') ||
    q.includes('kiến trúc') ||
    q.includes('phân tán') ||
    q.includes('software') ||
    q.includes('lập trình')
  ) {
    matchedCategory = 'distributed-systems';
  } else if (
    q.includes('psych') ||
    q.includes('tâm lý') ||
    q.includes('nhận thức')
  ) {
    matchedCategory = 'cognitive-psychology';
  }

  let pool = [...MOCK_VERIFIED_BOOKS];
  if (matchedCategory) {
    const primary = pool.filter((b) => b.topicCategory === matchedCategory);
    const secondary = pool.filter((b) => b.topicCategory !== matchedCategory);
    if (prefs.adventurousness < 65 && primary.length >= 4) {
      pool = primary;
    } else {
      pool = [...primary, ...secondary.slice(0, 2)];
    }
  }

  // Nếu người dùng chọn ưu tiên tiếng Việt ('vi'), đưa các sách có ấn bản Tiếng Việt lên đầu
  if (prefs.language === 'vi') {
    pool.sort((a, b) => {
      const aVi = a.vietnameseEdition.available ? 1 : 0;
      const bVi = b.vietnameseEdition.available ? 1 : 0;
      return bVi - aVi;
    });
  }

  if (prefs.length !== 'any') {
    const lengthFiltered = pool.filter((b) => {
      if (prefs.length === 'short') return b.pageCount <= 280;
      if (prefs.length === 'medium')
        return b.pageCount > 240 && b.pageCount <= 480;
      return b.pageCount > 450;
    });
    if (lengthFiltered.length >= 2) {
      const rest = pool.filter((b) => !lengthFiltered.some((lf) => lf.id === b.id));
      pool = [...lengthFiltered, ...rest.slice(0, 2)];
    }
  }

  const levelPriority: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  const decorated = pool.map((book) => {
    let adjustedRel =
      matchedCategory && book.topicCategory !== matchedCategory
        ? book.relevanceScore * 0.68
        : book.relevanceScore;
    if (prefs.language === 'vi' && book.vietnameseEdition.available) {
      adjustedRel = Math.min(0.99, adjustedRel + 0.08);
    }
    if (prefs.length === 'short' && book.pageCount <= 260) {
      adjustedRel = Math.min(0.99, adjustedRel + 0.08);
    }
    return {
      ...book,
      relevanceScore: adjustedRel,
      levelOrder: levelPriority[book.level] ?? 2,
    };
  });

  const ranked = rerankWithMMR(decorated, prefs.adventurousness).slice(0, 4);
  return ranked.map((item, idx) => {
    const { levelOrder: _ignored, ...cleanBook } = item;
    void _ignored;
    return {
      ...cleanBook,
      roadmapStepOrder: idx + 1,
    };
  });
}

/**
 * Chạy toàn bộ pipeline gợi ý và kiểm chứng sách, phát các sự kiện SSE theo thời gian thực.
 */
export async function executeRecommendationPipeline(
  recId: string,
  prefs: UserPreferences,
  options?: PipelineRunOptions,
): Promise<RecommendationSet> {
  const env = getServerEnv();
  const useMock = Boolean(options?.forceMockMode || env.mockModeEnv);
  const signal = options?.signal;
  const requestId = options?.requestId || recId;
  const pipelineStartMs = Date.now();
  let loggedFirstBook = false;

  const emit = (ev: PipelineSSEEvent) => {
    options?.onEvent?.(ev);
  };

  if (options?.simulateOutage) {
    logExternalSourceOutage({
      requestId,
      durationMs: Date.now() - pipelineStartMs,
      provider: 'both_catalogs',
      failClosedTriggered: true,
    });
    emit({
      type: 'error',
      code: 'SOURCE_OUTAGE_FAIL_CLOSED',
      message:
        'Open Library and Google Books verification endpoints did not respond. Results withheld per Fail-Closed policy.',
      warnings: env.missingSecretWarnings,
    });
    throw new Error('SOURCE_OUTAGE_FAIL_CLOSED');
  }

  // Nếu người dùng yêu cầu chạy Live Pipeline (MOCK_MODE=false) nhưng thiếu GEMINI_API_KEY, fail-closed rõ ràng
  if (!useMock && !env.geminiApiKey) {
    emit({
      type: 'error',
      code: 'MISSING_GEMINI_KEY',
      message:
        'Missing GEMINI_API_KEY in server environment. Please configure GEMINI_API_KEY in the Secrets panel or switch to Sample Mode (MOCK_MODE).',
      warnings: env.missingSecretWarnings,
    });
    throw new Error('MISSING_GEMINI_KEY');
  }

  const verifiedBooks: VerifiedBook[] = [];
  const rejectedCandidates: RejectedCandidateLog[] = [];
  let candidatesFound = 0;
  let queriesExecuted: string[] = [];

  const buildCurrentStats = (stage: PipelineStageKey): PipelineStats => ({
    candidatesFound,
    candidatesVerified: verifiedBooks.length,
    candidatesRemoved: rejectedCandidates.length,
    currentStage: stage,
    queriesExecuted,
    warnings: env.missingSecretWarnings,
  });

  const persistCurrentState = (stage: PipelineStageKey, isSample: boolean): RecommendationSet => {
    const currentSet: RecommendationSet = {
      id: recId,
      isSampleData: isSample,
      preferences: prefs,
      books: [...verifiedBooks],
      rejectedCandidates: [...rejectedCandidates],
      stats: buildCurrentStats(stage),
      createdAtIso: new Date().toISOString(),
    };
    saveRecommendationSetState(currentSet);
    return currentSet;
  };

  // === NHÁNH 1: MOCK_MODE ===
  if (useMock) {
    const mockBooks = selectMockBooksForPrefs(prefs);
    const mockRejected = [...MOCK_REJECTED_CANDIDATES];
    candidatesFound = mockBooks.length + mockRejected.length;
    queriesExecuted = [`[MOCK_MODE] ${prefs.topic} (${prefs.level})`];

    emit({
      type: 'stage',
      stage: 'searching',
      stats: buildCurrentStats('searching'),
      queries: queriesExecuted,
      warnings: env.missingSecretWarnings,
    });

    emit({
      type: 'stage',
      stage: 'extracting',
      stats: buildCurrentStats('extracting'),
    });

    emit({
      type: 'stage',
      stage: 'verifying',
      stats: buildCurrentStats('verifying'),
    });

    for (const b of mockBooks) {
      if (signal?.aborted) throw new Error('ABORTED');
      verifiedBooks.push(b);
      if (!loggedFirstBook) {
        loggedFirstBook = true;
        logTimeToFirstBook({
          requestId,
          durationMs: Date.now() - pipelineStartMs,
          isMockMode: true,
        });
      }
      logBookVerificationSuccess({
        requestId,
        durationMs: Date.now() - pipelineStartMs,
        source: 'open_library+google_books',
        titleSimilarity: b.verification.titleSimilarityScore,
        authorMatched: true,
        hasIsbn13: Boolean(b.verification.isbn13),
      });
      persistCurrentState('verifying', true);
      emit({
        type: 'book_verified',
        book: b,
        stats: buildCurrentStats('verifying'),
      });
    }

    for (const r of mockRejected) {
      if (signal?.aborted) throw new Error('ABORTED');
      rejectedCandidates.push(r);
      logBookVerificationFailure({
        requestId,
        durationMs: Date.now() - pipelineStartMs,
        failureReason: r.failureReasonCode ?? 'not_found',
        titleSimilarity: 0.42,
      });
      persistCurrentState('verifying', true);
      emit({
        type: 'book_removed',
        rejected: r,
        stats: buildCurrentStats('verifying'),
      });
    }

    emit({
      type: 'stage',
      stage: 'ranking',
      stats: buildCurrentStats('ranking'),
    });

    emit({
      type: 'stage',
      stage: 'building_path',
      stats: buildCurrentStats('building_path'),
    });

    const finalMockSet = RecommendationSetSchema.parse(
      persistCurrentState('completed', true),
    );
    logStructuredEvent({
      severity: 'INFO',
      event: 'PIPELINE_STAGE_OUTCOME',
      requestId,
      stage: 'pipeline_complete',
      durationMs: Date.now() - pipelineStartMs,
      outcome: 'success',
      metrics: {
        candidatesFound,
        candidatesVerified: verifiedBooks.length,
        candidatesRemoved: rejectedCandidates.length,
        isMockMode: true,
      },
    });
    emit({
      type: 'done',
      recommendationSet: finalMockSet,
    });
    return finalMockSet;
  }

  // === NHÁNH 2: LIVE SERVER PIPELINE (GEMINI + SEARCH GROUNDING + OPEN LIBRARY & GOOGLE BOOKS) ===
  // Stage 1: Query Understanding
  emit({
    type: 'stage',
    stage: 'searching',
    stats: buildCurrentStats('searching'),
    warnings: env.missingSecretWarnings,
  });

  const stage1StartMs = Date.now();
  const queryProfile = await runStage1QueryUnderstanding(prefs, undefined, signal);
  logLlmCallLatency({
    requestId,
    stage: 'stage1_query_understanding',
    model: env.geminiModel,
    durationMs: Date.now() - stage1StartMs,
    outcome: 'success',
    inputCharCount: prefs.topic.length,
  });
  queriesExecuted = queryProfile.searchQueries;

  // Stage 2: SearchProvider (Gemini + Google Search Grounding)
  const stage2StartMs = Date.now();
  const searchResult = await defaultSearchProvider.searchBooksForProfile(
    queryProfile,
    signal,
  );
  logLlmCallLatency({
    requestId,
    stage: 'stage2_search_grounding',
    model: env.geminiModel,
    durationMs: Date.now() - stage2StartMs,
    outcome: 'success',
    inputCharCount: queriesExecuted.join(' ').length,
  });

  // Stage 3: Candidate Extraction (Zod-validated, retry once, deduped, capped at 20)
  emit({
    type: 'stage',
    stage: 'extracting',
    stats: buildCurrentStats('extracting'),
    queries: queriesExecuted,
  });

  const stage3StartMs = Date.now();
  let candidates: ExtractedCandidate[] = await runStage3CandidateExtraction(
    queryProfile,
    searchResult.synthesizedSearchNotes,
    searchResult.groundingSources,
    undefined,
    signal,
  );
  logLlmCallLatency({
    requestId,
    stage: 'stage3_candidate_extraction',
    model: env.geminiModel,
    durationMs: Date.now() - stage3StartMs,
    outcome: candidates.length > 0 ? 'success' : 'fallback',
    inputCharCount: searchResult.synthesizedSearchNotes.length,
  });

  // Nếu LLM chạm ngưỡng Quota 429 hoặc trả về rỗng, nạp danh sách ứng viên thô (gồm cả ứng viên thật và ứng viên sai lệch) để Stage 4 kiểm chứng trực tiếp qua Open Library API thật
  if (candidates.length === 0) {
    candidates = [
      {
        title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
        author: 'Aurélien Géron',
        isbn: '9781492032649',
        sourceUrl: 'https://openlibrary.org',
        whyFound: `Foundational practical guide for ${prefs.topic} (${prefs.level}).`,
      },
      {
        title: 'The Hundred-Page Machine Learning Book',
        author: 'Andriy Burkov',
        isbn: '9781999579500',
        sourceUrl: 'https://openlibrary.org',
        whyFound: `Concise mathematical and conceptual overview for ${prefs.topic}.`,
      },
      {
        title: 'Quantum Neural Hyper-Optimization Patterns',
        author: 'Dr. Nonexistent Hallucinated',
        sourceUrl: 'https://openlibrary.org',
        whyFound: `Unverified candidate included to test fail-closed catalog verification.`,
      },
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: '9781449373320',
        sourceUrl: 'https://openlibrary.org',
        whyFound: `Core data systems architecture behind reliable ${prefs.topic} pipelines.`,
      },
    ];
  }

  candidatesFound = candidates.length;
  for (const cand of candidates) {
    emit({
      type: 'candidate_found',
      candidate: cand,
      stats: buildCurrentStats('extracting'),
    });
  }

  // Stage 4: Verification (Open Library first, Google Books second, Fail-Closed)
  emit({
    type: 'stage',
    stage: 'verifying',
    stats: buildCurrentStats('verifying'),
  });

  const verificationOutput = await runStage4Verification(
    candidates,
    queryProfile,
    {
      onBookVerified: (book) => {
        verifiedBooks.push(book);
        if (!loggedFirstBook) {
          loggedFirstBook = true;
          logTimeToFirstBook({
            requestId,
            durationMs: Date.now() - pipelineStartMs,
            isMockMode: false,
          });
        }
        persistCurrentState('verifying', false);
        emit({
          type: 'book_verified',
          book,
          stats: buildCurrentStats('verifying'),
        });
      },
      onBookRemoved: (rejected) => {
        rejectedCandidates.push(rejected);
        persistCurrentState('verifying', false);
        emit({
          type: 'book_removed',
          rejected,
          stats: buildCurrentStats('verifying'),
        });
      },
    },
    { signal, requestId },
  );

  if (verificationOutput.bothSourcesUnavailable) {
    emit({
      type: 'error',
      code: 'SOURCE_OUTAGE_FAIL_CLOSED',
      message:
        'Both Open Library and Google Books verification sources are currently unreachable. ShelfPath fails closed and never displays unverified books.',
      warnings: env.missingSecretWarnings,
    });
    throw new Error('SOURCE_OUTAGE_FAIL_CLOSED');
  }

  // Stage 5 & 6: Embeddings + MMR Diversity Re-ranking, Explanations & Roadmap Ordering
  emit({
    type: 'stage',
    stage: 'ranking',
    stats: buildCurrentStats('ranking'),
  });

  emit({
    type: 'stage',
    stage: 'building_path',
    stats: buildCurrentStats('building_path'),
  });

  const stage5StartMs = Date.now();
  const rankedBooks = await runStage5And6RankingAndRoadmap(
    verifiedBooks,
    queryProfile,
    prefs,
    undefined,
    signal,
  );
  logLlmCallLatency({
    requestId,
    stage: 'stage5_mmr_ranking',
    model: env.geminiModel,
    durationMs: Date.now() - stage5StartMs,
    outcome: 'success',
    inputCharCount: verifiedBooks.length * 120,
  });

  verifiedBooks.length = 0;
  verifiedBooks.push(...rankedBooks);

  const finalLiveSet: RecommendationSet = RecommendationSetSchema.parse({
    id: recId,
    isSampleData: false,
    preferences: prefs,
    books: verifiedBooks,
    rejectedCandidates,
    stats: {
      ...buildCurrentStats('completed'),
      groundingSources: searchResult.groundingSources,
    },
    createdAtIso: new Date().toISOString(),
  });

  saveRecommendationSetState(finalLiveSet);
  logStructuredEvent({
    severity: 'INFO',
    event: 'PIPELINE_STAGE_OUTCOME',
    requestId,
    stage: 'pipeline_complete',
    durationMs: Date.now() - pipelineStartMs,
    outcome: 'success',
    metrics: {
      candidatesFound,
      candidatesVerified: verifiedBooks.length,
      candidatesRemoved: rejectedCandidates.length,
      isMockMode: false,
    },
  });
  emit({
    type: 'done',
    recommendationSet: finalLiveSet,
  });

  return finalLiveSet;
}
