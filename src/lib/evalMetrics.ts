/**
 * Tính năng: Các hàm tính toán chỉ số đánh giá thực nghiệm (Evaluation Lab Metrics), khoảng cách đa dạng nhúng từng cặp (Mean Pairwise Embedding Distance), thống kê mô tả Rubric và xuất CSV.
 * Trường hợp sử dụng: Tách biệt logic toán học thuần túy khỏi giao diện /eval để kiểm thử đơn vị (node:test) và đảm bảo không bao giờ bịa đặt số liệu hay tuyên bố ý nghĩa thống kê.
 */

import { vectorCosineSimilarity as cosineSimilarity } from './refinementAndDismiss';

export type EvalConfigId = 'A_MODEL_ONLY' | 'B_MODEL_SEARCH' | 'C_FULL_VERIFIED';

export interface EvalPreparedProfile {
  id: string;
  labelVi: string;
  labelEn: string;
  isPreparedSample: true;
  sampleNotice: string;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  length: 'short' | 'medium' | 'long' | 'any';
  language: 'vi' | 'en' | 'any';
  adventurousness: number;
}

export interface EvalFailureRecord {
  profileId: string;
  configId: EvalConfigId;
  candidateTitle: string;
  candidateAuthor: string;
  reasonCode:
    | 'NO_CANDIDATES'
    | 'TITLE_SIMILARITY_LOW'
    | 'AUTHOR_MISMATCH'
    | 'SOURCE_OUTAGE';
  detail: string;
}

export interface EvalDisplayedBookAudit {
  bookId: string;
  title: string;
  author: string;
  passedAuditVerification: boolean;
  auditFailureReasonCode?:
    | 'NO_CANDIDATES'
    | 'TITLE_SIMILARITY_LOW'
    | 'AUTHOR_MISMATCH'
    | 'SOURCE_OUTAGE';
  hasIsbn: boolean;
  hasPageCount: boolean;
  hasVietnameseEdition: boolean;
  sourceUrl: string | null;
  embeddingVector: number[];
}

export interface EvalProfileConfigResult {
  profileId: string;
  configId: EvalConfigId;
  modelName: string;
  timestampIso: string;
  candidatesProduced: number;
  verifiedCount: number;
  auditFailedCount: number;
  displayedBooksCount: number;
  displayedUnverifiedCount: number;
  auditFailureRatePercent: number;
  displayedFailureRatePercent: number;
  listDiversity: number;
  latency: {
    timeToFirstBookMs: number;
    fullRoadmapMs: number;
    refinementResponseMs: number;
  };
  failures: EvalFailureRecord[];
  displayedBooks: EvalDisplayedBookAudit[];
  sourceOutageOccurred: boolean;
}

export interface EvalTesterRubricSubmission {
  id: string;
  runId: string;
  profileId: string;
  configId: EvalConfigId;
  wasBlindMode: boolean;
  relevance: number; // 1..5
  levelFit: number; // 1..5
  usefulness: number; // 1..5
  notes?: string;
  submittedAtIso: string;
}

export interface EvalConfigAggregateSummary {
  configId: EvalConfigId;
  configNameVi: string;
  configNameEn: string;
  profilesEvaluated: number;
  totalCandidatesProduced: number;
  totalAuditVerified: number;
  totalAuditFailed: number;
  meanAuditFailureRatePercent: number;
  meanDisplayedUnverifiedRatePercent: number;
  meanListDiversity: number;
  meanTimeToFirstBookMs: number;
  meanFullRoadmapMs: number;
  meanRefinementResponseMs: number;
  rubricStats: {
    n: number;
    meanRelevance: number | null;
    meanLevelFit: number | null;
    meanUsefulness: number | null;
  };
  totalSavesInEvalSession: number;
}

export interface EvalRealLimitationsSummary {
  measuredFromRunId: string;
  totalProfilesRun: number;
  totalRawCandidatesAudited: number;
  unverifiedCandidatesCaughtByAudit: number;
  sourceOutageCount: number;
  missingIsbnCount: number;
  missingPageCount: number;
  noVietnameseEditionInSourcesCount: number;
  failureReasonsBreakdown: Record<string, number>;
}

export interface EvalRunRecord {
  id: string;
  status: 'running' | 'completed' | 'failed';
  mode: 'audit_deterministic' | 'live_audit';
  modelName: string;
  startedAtIso: string;
  completedAtIso?: string;
  progress: {
    completedSteps: number;
    totalSteps: number;
    currentProfileId?: string;
    currentConfigId?: EvalConfigId;
  };
  profileIds: string[];
  results: EvalProfileConfigResult[];
  aggregates: EvalConfigAggregateSummary[];
  rubricRatings: EvalTesterRubricSubmission[];
  savesByBookKey: Record<string, number>; // key: `${configId}::${bookId}`
  realLimitations: EvalRealLimitationsSummary | null;
}

/**
 * Tính khoảng cách nhúng từng cặp trung bình (Mean Pairwise Embedding Cosine Distance) trong một danh sách sách:
 * D(L) = (2 / (k * (k - 1))) * sum_{1 <= i < j <= k} (1 - cos(e_i, e_j))
 * Giá trị nằm trong khoảng [0, 1], càng cao nghĩa là danh sách càng đa dạng về mặt ngữ nghĩa.
 * @param vectors Mảng các vector nhúng của các cuốn sách trong danh sách
 */
export function computeMeanPairwiseEmbeddingDistance(
  vectors: readonly (readonly number[])[],
): number {
  const validVectors = vectors.filter((v) => Array.isArray(v) && v.length > 0);
  const k = validVectors.length;
  if (k < 2) {
    return 0;
  }

  let totalDistance = 0;
  let pairCount = 0;

  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const sim = cosineSimilarity(validVectors[i], validVectors[j]);
      const clampedSim = Math.max(-1, Math.min(1, sim));
      const distance = 1 - clampedSim;
      totalDistance += distance;
      pairCount += 1;
    }
  }

  if (pairCount === 0) {
    return 0;
  }

  return Number((totalDistance / pairCount).toFixed(4));
}

/**
 * Tính toán bảng tổng hợp chỉ số theo từng cấu hình (A, B, C) chỉ dùng thống kê mô tả trung thực.
 */
export function computeConfigAggregates(
  results: readonly EvalProfileConfigResult[],
  rubricRatings: readonly EvalTesterRubricSubmission[],
  savesByBookKey: Readonly<Record<string, number>>,
): EvalConfigAggregateSummary[] {
  const configs: Array<{
    id: EvalConfigId;
    nameVi: string;
    nameEn: string;
  }> = [
    {
      id: 'A_MODEL_ONLY',
      nameVi: 'Cấu hình A: Chỉ Mô hình AI (Không tìm kiếm, Không lọc kiểm chứng)',
      nameEn: 'Config A: AI Model Only (No Search, Audit-Only Verification)',
    },
    {
      id: 'B_MODEL_SEARCH',
      nameVi: 'Cấu hình B: AI + Tìm kiếm Web (Không lọc kiểm chứng)',
      nameEn: 'Config B: AI + Web Search (Audit-Only Verification)',
    },
    {
      id: 'C_FULL_VERIFIED',
      nameVi: 'Cấu hình C: ShelfPath Đầy đủ (AI + Tìm kiếm + Kiểm chứng Fail-Closed)',
      nameEn: 'Config C: ShelfPath Full (AI + Search + Fail-Closed Verification)',
    },
  ];

  return configs.map((cfg) => {
    const cfgResults = results.filter((r) => r.configId === cfg.id);
    const count = cfgResults.length;

    const totalCandidatesProduced = cfgResults.reduce(
      (acc, r) => acc + r.candidatesProduced,
      0,
    );
    const totalAuditVerified = cfgResults.reduce(
      (acc, r) => acc + r.verifiedCount,
      0,
    );
    const totalAuditFailed = cfgResults.reduce(
      (acc, r) => acc + r.auditFailedCount,
      0,
    );

    const meanAuditFailureRatePercent =
      count > 0
        ? Number(
            (
              cfgResults.reduce((acc, r) => acc + r.auditFailureRatePercent, 0) /
              count
            ).toFixed(1),
          )
        : 0;

    const meanDisplayedUnverifiedRatePercent =
      count > 0
        ? Number(
            (
              cfgResults.reduce(
                (acc, r) => acc + r.displayedFailureRatePercent,
                0,
              ) / count
            ).toFixed(1),
          )
        : 0;

    const meanListDiversity =
      count > 0
        ? Number(
            (
              cfgResults.reduce((acc, r) => acc + r.listDiversity, 0) / count
            ).toFixed(4),
          )
        : 0;

    const meanTimeToFirstBookMs =
      count > 0
        ? Math.round(
            cfgResults.reduce((acc, r) => acc + r.latency.timeToFirstBookMs, 0) /
              count,
          )
        : 0;

    const meanFullRoadmapMs =
      count > 0
        ? Math.round(
            cfgResults.reduce((acc, r) => acc + r.latency.fullRoadmapMs, 0) /
              count,
          )
        : 0;

    const meanRefinementResponseMs =
      count > 0
        ? Math.round(
            cfgResults.reduce(
              (acc, r) => acc + r.latency.refinementResponseMs,
              0,
            ) / count,
          )
        : 0;

    const cfgRubrics = rubricRatings.filter((rt) => rt.configId === cfg.id);
    const n = cfgRubrics.length;
    const meanRelevance =
      n > 0
        ? Number(
            (
              cfgRubrics.reduce((acc, rt) => acc + rt.relevance, 0) / n
            ).toFixed(2),
          )
        : null;
    const meanLevelFit =
      n > 0
        ? Number(
            (cfgRubrics.reduce((acc, rt) => acc + rt.levelFit, 0) / n).toFixed(
              2,
            ),
          )
        : null;
    const meanUsefulness =
      n > 0
        ? Number(
            (
              cfgRubrics.reduce((acc, rt) => acc + rt.usefulness, 0) / n
            ).toFixed(2),
          )
        : null;

    let totalSavesInEvalSession = 0;
    for (const [key, val] of Object.entries(savesByBookKey)) {
      if (key.startsWith(`${cfg.id}::`)) {
        totalSavesInEvalSession += val;
      }
    }

    return {
      configId: cfg.id,
      configNameVi: cfg.nameVi,
      configNameEn: cfg.nameEn,
      profilesEvaluated: count,
      totalCandidatesProduced,
      totalAuditVerified,
      totalAuditFailed,
      meanAuditFailureRatePercent,
      meanDisplayedUnverifiedRatePercent,
      meanListDiversity,
      meanTimeToFirstBookMs,
      meanFullRoadmapMs,
      meanRefinementResponseMs,
      rubricStats: {
        n,
        meanRelevance,
        meanLevelFit,
        meanUsefulness,
      },
      totalSavesInEvalSession,
    };
  });
}

/**
 * Trích xuất bảng Giới hạn Thực tế (Known Limitations) hoàn toàn từ dữ liệu chạy thật của phiên đánh giá.
 * Tuyệt đối không điền sẵn bất kỳ con số giả định nào khi chưa có dữ liệu chạy.
 */
export function extractRealLimitationsFromRun(
  runId: string,
  results: readonly EvalProfileConfigResult[],
): EvalRealLimitationsSummary | null {
  if (results.length === 0) {
    return null;
  }

  const uniqueProfiles = new Set(results.map((r) => r.profileId));
  let totalRawCandidatesAudited = 0;
  let unverifiedCandidatesCaughtByAudit = 0;
  let sourceOutageCount = 0;
  let missingIsbnCount = 0;
  let missingPageCount = 0;
  let noVietnameseEditionInSourcesCount = 0;
  const failureReasonsBreakdown: Record<string, number> = {};

  for (const res of results) {
    totalRawCandidatesAudited += res.candidatesProduced;
    unverifiedCandidatesCaughtByAudit += res.auditFailedCount;
    if (res.sourceOutageOccurred) {
      sourceOutageCount += 1;
    }
    for (const f of res.failures) {
      failureReasonsBreakdown[f.reasonCode] =
        (failureReasonsBreakdown[f.reasonCode] ?? 0) + 1;
    }
    for (const b of res.displayedBooks) {
      if (!b.hasIsbn) missingIsbnCount += 1;
      if (!b.hasPageCount) missingPageCount += 1;
      if (!b.hasVietnameseEdition) noVietnameseEditionInSourcesCount += 1;
    }
  }

  return {
    measuredFromRunId: runId,
    totalProfilesRun: uniqueProfiles.size,
    totalRawCandidatesAudited,
    unverifiedCandidatesCaughtByAudit,
    sourceOutageCount,
    missingIsbnCount,
    missingPageCount,
    noVietnameseEditionInSourcesCount,
    failureReasonsBreakdown,
  };
}

/**
 * Chuyển đổi kết quả chạy Evaluation Lab sang định dạng CSV kèm UTF-8 BOM (\uFEFF).
 */
export function exportEvalRunToCsvWithBom(run: EvalRunRecord): string {
  const escapeCsv = (val: string | number | boolean | null | undefined): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (
      str.includes(',') ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Run ID',
    'Profile ID',
    'Configuration',
    'Model Name',
    'Timestamp ISO',
    'Candidates Produced',
    'Audit Verified Count',
    'Audit Failed Count',
    'Displayed Books Count',
    'Displayed Unverified Count',
    'Audit Failure Rate (%)',
    'Displayed Unverified Rate (%)',
    'Mean Pairwise Diversity',
    'Time To First Book (ms)',
    'Full Roadmap Latency (ms)',
    'Refinement Latency (ms)',
    'Failure Reasons',
  ];

  const rows = [headers.map(escapeCsv).join(',')];

  for (const r of run.results) {
    const reasonsStr = r.failures
      .map((f) => `${f.reasonCode}:${f.candidateTitle}`)
      .join(' | ');
    rows.push(
      [
        run.id,
        r.profileId,
        r.configId,
        r.modelName,
        r.timestampIso,
        r.candidatesProduced,
        r.verifiedCount,
        r.auditFailedCount,
        r.displayedBooksCount,
        r.displayedUnverifiedCount,
        r.auditFailureRatePercent,
        r.displayedFailureRatePercent,
        r.listDiversity,
        r.latency.timeToFirstBookMs,
        r.latency.fullRoadmapMs,
        r.latency.refinementResponseMs,
        reasonsStr,
      ]
        .map(escapeCsv)
        .join(','),
    );
  }

  return `\uFEFF${rows.join('\r\n')}\r\n`;
}
