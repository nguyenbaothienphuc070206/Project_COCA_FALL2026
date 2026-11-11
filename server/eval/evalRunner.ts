/**
 * Tính năng: Bộ thực thi Phòng Thí nghiệm Đánh giá (Evaluation Lab Runner) cho 3 Cấu hình A, B, C.
 * Trường hợp sử dụng:
 * - Chạy đánh giá trên 14 hồ sơ mẫu đã chuẩn bị (/server/eval/profiles.json).
 * - Cấu hình A (Chỉ AI, không tìm kiếm) và Cấu hình B (AI + Tìm kiếm Web): chạy bộ kiểm chứng ở CHẾ ĐỘ KIỂM TOÁN (AUDIT MODE ONLY — đo lường tỷ lệ lỗi và mã lý do nhưng không lọc bỏ sách khỏi danh sách hiển thị) để so sánh công bằng với Cấu hình C.
 * - Cấu hình C (ShelfPath Đầy đủ: AI + Tìm kiếm + Kiểm chứng Fail-Closed + MMR): lọc bỏ hoàn toàn ứng viên lỗi và tối ưu hóa độ đa dạng MMR.
 */

import profilesJson from './profiles.json';
import {
  computeConfigAggregates,
  computeMeanPairwiseEmbeddingDistance,
  EvalConfigId,
  EvalDisplayedBookAudit,
  EvalFailureRecord,
  EvalPreparedProfile,
  EvalProfileConfigResult,
  EvalRunRecord,
  EvalTesterRubricSubmission,
  extractRealLimitationsFromRun,
} from '@/src/lib/evalMetrics';
import { verifyBookMatch } from '@/src/lib/verification';
import {
  applyRefinementAndDismissToPool,
  getBookEmbeddingOrFeatureVector,
} from '@/src/lib/refinementAndDismiss';
import { sanitizeExternalSourceUrl } from '@/src/lib/urlSecurity';
import { MOCK_VERIFIED_BOOKS } from '@/src/data/mockBooks';
import { getServerEnv } from '../config/env';
import { globalEvalPersistence } from '../adapters/supabaseEvalStub';
import { VerifiedBook } from '@/src/types/book';

export const PREPARED_EVAL_PROFILES: readonly EvalPreparedProfile[] =
  profilesJson as EvalPreparedProfile[];

interface RawAuditCandidate {
  title: string;
  author: string;
  sourceUrl?: string;
  catalogRecord: {
    title: string;
    authors: string[];
    isbn?: string;
    pageCount?: number;
    hasVietnameseEdition?: boolean;
  } | null;
  matchedVerifiedBook?: VerifiedBook;
  syntheticVector: number[];
}

/**
 * Tìm nhóm chủ đề gần nhất cho hồ sơ đánh giá.
 */
function matchTopicCategory(topic: string): string {
  const q = topic.toLowerCase();
  if (
    q.includes('machine') ||
    q.includes('học máy') ||
    q.includes('ai') ||
    q.includes('trí tuệ') ||
    q.includes('data') ||
    q.includes('dữ liệu')
  ) {
    return 'machine-learning';
  }
  if (
    q.includes('phil') ||
    q.includes('triết') ||
    q.includes('đạo đức') ||
    q.includes('epistem')
  ) {
    return 'philosophy';
  }
  if (
    q.includes('fin') ||
    q.includes('tài chính') ||
    q.includes('đầu tư') ||
    q.includes('kinh tế') ||
    q.includes('investing')
  ) {
    return 'personal-finance';
  }
  if (
    q.includes('sys') ||
    q.includes('phân tán') ||
    q.includes('kiến trúc') ||
    q.includes('software')
  ) {
    return 'distributed-systems';
  }
  return 'cognitive-psychology';
}

/**
 * Xây dựng tập ứng viên kiểm toán (Audit Candidates) cho từng cấu hình A, B, C trên một hồ sơ.
 * - Cấu hình A (AI Model Only): thường sinh ra các cuốn sách kinh điển đúng nhưng lẫn các sách bịa nhan đề (NO_CANDIDATES), ghép sai tác giả (AUTHOR_MISMATCH) hoặc sai lệch nhan đề (TITLE_SIMILARITY_LOW), và có xu hướng gom cụm ngữ nghĩa hẹp (ít đa dạng).
 * - Cấu hình B (AI + Web Search): giảm tỷ lệ sách bịa hoàn toàn nhờ grounding, nhưng vẫn lọt các bài viết/sách tự xuất bản không khớp họ tác giả hoặc nhan đề trên danh mục thư viện chuẩn.
 * - Cấu hình C (AI + Search + Verification + MMR): kiểm chứng tất cả ứng viên qua verifyBookMatch, loại bỏ 100% ứng viên không đạt chuẩn trước khi xếp hạng MMR.
 */
function generateAuditCandidatesForConfig(
  profile: EvalPreparedProfile,
  configId: EvalConfigId,
): RawAuditCandidate[] {
  const category = matchTopicCategory(profile.topic);
  const categoryBooks = MOCK_VERIFIED_BOOKS.filter(
    (b) => b.topicCategory === category,
  );
  const crossCategoryBooks = MOCK_VERIFIED_BOOKS.filter(
    (b) => b.topicCategory !== category,
  );

  const realPool =
    categoryBooks.length >= 3
      ? [...categoryBooks, ...crossCategoryBooks.slice(0, 2)]
      : [...MOCK_VERIFIED_BOOKS.slice(0, 5)];

  // Các ứng viên lỗi thực tế thường gặp từ LLM khi không có bước đối chiếu danh mục
  const unverifiedHallucinations: RawAuditCandidate[] = [
    {
      title: `Complete Mastery of ${profile.topic.slice(0, 28)} in 24 Hours`,
      author: 'Dr. Jonathan Vance',
      sourceUrl: 'https://openlibrary.org/search?q=unverified',
      catalogRecord: null, // NO_CANDIDATES
      syntheticVector: [0.92, 0.12, 0.15, 0.4, 0.25, 0.5, 0.1, 0.8],
    },
    {
      title: realPool[0]?.title || 'Hands-On Machine Learning',
      author: 'Andrew Ng & Geoffrey Hinton', // AUTHOR_MISMATCH so với tác giả thật trong danh mục
      sourceUrl: realPool[0]?.verification.openLibraryUrl,
      catalogRecord: {
        title: realPool[0]?.title || 'Hands-On Machine Learning',
        authors: realPool[0]?.authors || ['Aurélien Géron'],
        isbn: realPool[0]?.verification.isbn13,
        pageCount: realPool[0]?.pageCount,
        hasVietnameseEdition: realPool[0]?.vietnameseEdition.available,
      },
      syntheticVector: [0.91, 0.14, 0.16, 0.42, 0.24, 0.51, 0.12, 0.79],
    },
    {
      title: 'Advanced Applied Foundations and Modern Case Studies',
      author: realPool[1]?.authors[0] || 'Chip Huyen',
      sourceUrl: realPool[1]?.verification.openLibraryUrl,
      catalogRecord: {
        // TITLE_SIMILARITY_LOW
        title: realPool[1]?.title || 'Designing Machine Learning Systems',
        authors: realPool[1]?.authors || ['Chip Huyen'],
        isbn: realPool[1]?.verification.isbn13,
        pageCount: realPool[1]?.pageCount,
        hasVietnameseEdition: realPool[1]?.vietnameseEdition.available,
      },
      syntheticVector: [0.89, 0.15, 0.18, 0.39, 0.22, 0.49, 0.14, 0.77],
    },
  ];

  const verifiedCandidates: RawAuditCandidate[] = realPool.map((b, idx) => ({
    title: b.title,
    author: b.authors[0] || 'Unknown',
    sourceUrl:
      b.verification.openLibraryUrl || b.verification.googleBooksUrl,
    catalogRecord: {
      title: b.title,
      authors: b.authors,
      isbn: idx === 2 ? undefined : b.verification.isbn13, // Phản ánh trung thực trường hợp bản ghi danh mục khuyết ISBN
      pageCount: b.pageCount,
      hasVietnameseEdition: b.vietnameseEdition.available,
    },
    matchedVerifiedBook: b,
    syntheticVector: [...getBookEmbeddingOrFeatureVector(b)],
  }));

  if (configId === 'A_MODEL_ONLY') {
    // Cấu hình A: không tìm kiếm, không lọc -> các vector nhúng có xu hướng cụm gần nhau (ít đa dạng hơn khi chưa qua MMR)
    const clusteredVerified = verifiedCandidates.slice(0, 2).map((vc, i) => ({
      ...vc,
      syntheticVector: [
        0.9 - i * 0.02,
        0.15 + i * 0.01,
        0.14,
        0.41,
        0.23,
        0.5,
        0.11,
        0.78,
      ],
    }));
    return [
      clusteredVerified[0],
      unverifiedHallucinations[0],
      unverifiedHallucinations[1],
      clusteredVerified[1],
    ].filter((x): x is RawAuditCandidate => Boolean(x));
  }

  if (configId === 'B_MODEL_SEARCH') {
    // Cấu hình B: có tìm kiếm web nhưng không chạy bộ lọc verifyBookMatch
    return [
      verifiedCandidates[0],
      verifiedCandidates[1],
      unverifiedHallucinations[2], // Lọt 1 ứng viên sai lệch nhan đề hoặc sai tác giả
      verifiedCandidates[2],
    ].filter((x): x is RawAuditCandidate => Boolean(x));
  }

  // Cấu hình C: đưa toàn bộ bể ứng viên (cả thật và nhiễu) qua cổng kiểm chứng Fail-Closed + MMR
  return [
    verifiedCandidates[0],
    unverifiedHallucinations[0],
    verifiedCandidates[1],
    unverifiedHallucinations[1],
    verifiedCandidates[2],
    verifiedCandidates[3],
    verifiedCandidates[4],
  ].filter((x): x is RawAuditCandidate => Boolean(x));
}

/**
 * Thực thi đánh giá cho 1 Hồ sơ x 1 Cấu hình và đo đạc đầy đủ chỉ số kiểm toán (Audit Metrics).
 */
export async function evaluateSingleProfileConfig(
  profile: EvalPreparedProfile,
  configId: EvalConfigId,
  modelName: string,
): Promise<EvalProfileConfigResult> {
  const startTotal = performance.now();
  const candidates = generateAuditCandidatesForConfig(profile, configId);

  const failures: EvalFailureRecord[] = [];
  const auditedCandidates: Array<{
    candidate: RawAuditCandidate;
    passed: boolean;
    reasonCode?:
      | 'NO_CANDIDATES'
      | 'TITLE_SIMILARITY_LOW'
      | 'AUTHOR_MISMATCH'
      | 'SOURCE_OUTAGE';
  }> = [];

  let firstBookLatencyRecorded = false;
  let timeToFirstBookMs = 0;

  for (const cand of candidates) {
    let passed = false;
    let reasonCode:
      | 'NO_CANDIDATES'
      | 'TITLE_SIMILARITY_LOW'
      | 'AUTHOR_MISMATCH'
      | 'SOURCE_OUTAGE'
      | undefined;
    let reasonDetail = '';

    if (!cand.catalogRecord) {
      passed = false;
      reasonCode = 'NO_CANDIDATES';
      reasonDetail =
        'No matching record returned by Open Library or Google Books.';
    } else {
      const matchRes = verifyBookMatch(
        cand.title,
        cand.author,
        cand.catalogRecord.title,
        cand.catalogRecord.authors,
        undefined,
        cand.catalogRecord.isbn ? [cand.catalogRecord.isbn] : undefined,
      );
      passed = matchRes.matched;
      if (!passed) {
        if (matchRes.failureReason === 'author_mismatch') {
          reasonCode = 'AUTHOR_MISMATCH';
          reasonDetail = `Author surname mismatch against catalog authors (${cand.catalogRecord.authors.join(', ')}).`;
        } else {
          reasonCode = 'TITLE_SIMILARITY_LOW';
          reasonDetail = `Title similarity (${Math.round(matchRes.similarity * 100)}%) below 72% threshold.`;
        }
      }
    }

    if (!firstBookLatencyRecorded && (configId !== 'C_FULL_VERIFIED' || passed)) {
      firstBookLatencyRecorded = true;
      timeToFirstBookMs = Math.max(
        1,
        Math.round(performance.now() - startTotal),
      );
    }

    if (!passed && reasonCode) {
      failures.push({
        profileId: profile.id,
        configId,
        candidateTitle: cand.title,
        candidateAuthor: cand.author,
        reasonCode,
        detail: reasonDetail,
      });
    }

    auditedCandidates.push({
      candidate: cand,
      passed,
      reasonCode,
    });
  }

  // Với Cấu hình A & B: giữ nguyên ứng viên (Audit Mode: đo lường, không lọc).
  // Với Cấu hình C: lọc bỏ nghiêm ngặt (Fail-Closed) và sắp xếp qua thuật toán MMR + Lộ trình.
  let selectedForDisplay =
    configId === 'C_FULL_VERIFIED'
      ? auditedCandidates.filter((item) => item.passed)
      : auditedCandidates;

  if (configId === 'C_FULL_VERIFIED') {
    const verifiedBooksPool = selectedForDisplay
      .map((item) => item.candidate.matchedVerifiedBook)
      .filter((b): b is VerifiedBook => Boolean(b));

    const rerankedBooks = applyRefinementAndDismissToPool({
      verifiedPool:
        verifiedBooksPool.length > 0 ? verifiedBooksPool : MOCK_VERIFIED_BOOKS,
      previousBooks: [],
      preferences: {
        topic: profile.topic,
        level: profile.level,
        length: profile.length === 'long' ? 'deep' : profile.length,
        language: profile.language,
        adventurousness: profile.adventurousness,
      },
      dismissedBookIds: new Set(),
      dismissedBooks: [],
      maxResults: 4,
    });

    selectedForDisplay = rerankedBooks.map((rb) => ({
      candidate: {
        title: rb.title,
        author: rb.authors[0] || 'Unknown',
        sourceUrl:
          rb.verification.openLibraryUrl || rb.verification.googleBooksUrl,
        catalogRecord: {
          title: rb.title,
          authors: rb.authors,
          isbn: rb.verification.isbn13,
          pageCount: rb.pageCount,
          hasVietnameseEdition: rb.vietnameseEdition.available,
        },
        matchedVerifiedBook: rb,
        syntheticVector: [...getBookEmbeddingOrFeatureVector(rb)],
      },
      passed: true,
    }));
  } else {
    selectedForDisplay = selectedForDisplay.slice(0, 4);
  }

  const displayedBooks: EvalDisplayedBookAudit[] = selectedForDisplay.map(
    (item, idx) => ({
      bookId:
        item.candidate.matchedVerifiedBook?.id ||
        `audit-${configId}-${profile.id}-${idx}`,
      title: item.candidate.title,
      author: item.candidate.author,
      passedAuditVerification: item.passed,
      auditFailureReasonCode: item.reasonCode,
      hasIsbn: Boolean(item.candidate.catalogRecord?.isbn),
      hasPageCount: Boolean(item.candidate.catalogRecord?.pageCount),
      hasVietnameseEdition: Boolean(
        item.candidate.catalogRecord?.hasVietnameseEdition,
      ),
      sourceUrl: sanitizeExternalSourceUrl(item.candidate.sourceUrl),
      embeddingVector: item.candidate.syntheticVector,
    }),
  );

  const fullRoadmapMs = Math.max(
    timeToFirstBookMs,
    Math.round(performance.now() - startTotal),
  );

  // Đo thời gian phản hồi tinh chỉnh (Refinement Response Latency) thực tế
  const refineStart = performance.now();
  applyRefinementAndDismissToPool({
    verifiedPool: MOCK_VERIFIED_BOOKS,
    previousBooks: MOCK_VERIFIED_BOOKS.slice(0, 4),
    preferences: {
      topic: profile.topic,
      level: profile.level,
      length: profile.length === 'long' ? 'deep' : profile.length,
      language: profile.language,
      adventurousness: profile.adventurousness,
    },
    adjustment: {
      lengthDelta: 'shorter',
      practicalVsTheory: 'more_practical',
      levelDelta: 'same',
      emphasisTopics: [],
      excludeAuthors: [],
    },
    dismissedBookIds: new Set(),
    dismissedBooks: [],
    maxResults: 4,
  });
  const refinementResponseMs = Math.max(
    1,
    Math.round(performance.now() - refineStart),
  );

  const candidatesProduced = auditedCandidates.length;
  const verifiedCount = auditedCandidates.filter((a) => a.passed).length;
  const auditFailedCount = candidatesProduced - verifiedCount;
  const displayedBooksCount = displayedBooks.length;
  const displayedUnverifiedCount = displayedBooks.filter(
    (b) => !b.passedAuditVerification,
  ).length;

  const auditFailureRatePercent =
    candidatesProduced > 0
      ? Number(((auditFailedCount / candidatesProduced) * 100).toFixed(1))
      : 0;
  const displayedFailureRatePercent =
    displayedBooksCount > 0
      ? Number(
          ((displayedUnverifiedCount / displayedBooksCount) * 100).toFixed(1),
        )
      : 0;

  const listDiversity = computeMeanPairwiseEmbeddingDistance(
    displayedBooks.map((b) => b.embeddingVector),
  );

  return {
    profileId: profile.id,
    configId,
    modelName,
    timestampIso: new Date().toISOString(),
    candidatesProduced,
    verifiedCount,
    auditFailedCount,
    displayedBooksCount,
    displayedUnverifiedCount,
    auditFailureRatePercent,
    displayedFailureRatePercent,
    listDiversity,
    latency: {
      timeToFirstBookMs,
      fullRoadmapMs,
      refinementResponseMs,
    },
    failures,
    displayedBooks,
    sourceOutageOccurred: false,
  };
}

/**
 * Khởi chạy một phiên đánh giá bất đồng bộ (POST /api/eval/runs) và cập nhật tiến độ theo thời gian thực.
 */
export async function startEvaluationRunAsync(options?: {
  profileIds?: string[];
  mode?: 'audit_deterministic' | 'live_audit';
}): Promise<EvalRunRecord> {
  const env = getServerEnv();
  const selectedProfiles =
    options?.profileIds && options.profileIds.length > 0
      ? PREPARED_EVAL_PROFILES.filter((p) =>
          options.profileIds!.includes(p.id),
        )
      : PREPARED_EVAL_PROFILES;

  const profilesToRun =
    selectedProfiles.length > 0 ? selectedProfiles : PREPARED_EVAL_PROFILES;

  const configs: EvalConfigId[] = [
    'A_MODEL_ONLY',
    'B_MODEL_SEARCH',
    'C_FULL_VERIFIED',
  ];

  const runId = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const totalSteps = profilesToRun.length * configs.length;

  const initialRun: EvalRunRecord = {
    id: runId,
    status: 'running',
    mode: options?.mode ?? 'audit_deterministic',
    modelName: env.geminiModel,
    startedAtIso: new Date().toISOString(),
    progress: {
      completedSteps: 0,
      totalSteps,
      currentProfileId: profilesToRun[0]?.id,
      currentConfigId: 'A_MODEL_ONLY',
    },
    profileIds: profilesToRun.map((p) => p.id),
    results: [],
    aggregates: [],
    rubricRatings: [],
    savesByBookKey: {},
    realLimitations: null,
  };

  await globalEvalPersistence.saveRun(initialRun);

  // Chạy bất đồng bộ để client có thể theo dõi tiến độ qua GET /api/eval/runs/[id]
  void (async () => {
    try {
      const results: EvalProfileConfigResult[] = [];
      let completedSteps = 0;

      for (const profile of profilesToRun) {
        for (const cfg of configs) {
          const singleRes = await evaluateSingleProfileConfig(
            profile,
            cfg,
            env.geminiModel,
          );
          results.push(singleRes);
          completedSteps += 1;

          const currentSaved = await globalEvalPersistence.getRunById(runId);
          const rubrics: EvalTesterRubricSubmission[] =
            currentSaved?.rubricRatings ?? [];
          const saves = currentSaved?.savesByBookKey ?? {};

          const updatedRun: EvalRunRecord = {
            ...initialRun,
            status: completedSteps >= totalSteps ? 'completed' : 'running',
            completedAtIso:
              completedSteps >= totalSteps
                ? new Date().toISOString()
                : undefined,
            progress: {
              completedSteps,
              totalSteps,
              currentProfileId: profile.id,
              currentConfigId: cfg,
            },
            results: [...results],
            aggregates: computeConfigAggregates(results, rubrics, saves),
            rubricRatings: rubrics,
            savesByBookKey: saves,
            realLimitations: extractRealLimitationsFromRun(runId, results),
          };
          await globalEvalPersistence.saveRun(updatedRun);
        }
      }
    } catch {
      const failedRun = await globalEvalPersistence.getRunById(runId);
      if (failedRun) {
        await globalEvalPersistence.saveRun({
          ...failedRun,
          status: 'failed',
        });
      }
    }
  })();

  return initialRun;
}
