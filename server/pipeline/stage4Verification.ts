/**
 * Tính năng: Stage 4 — Verification (Kiểm chứng ứng viên sách theo nguyên tắc Fail-Closed qua Open Library & Google Books kèm bộ nhớ đệm TTL).
 * Trường hợp sử dụng: Đảm bảo chỉ những cuốn sách có bản ghi thật mới được đưa vào lộ trình; phát sự kiện ngay khi từng cuốn được xác thực hoặc bị loại bỏ.
 */

import { AI_CONFIG } from '@/src/config/constants';
import { DESIGN_TOKENS } from '@/src/config/tokens';
import {
  ExtractedCandidate,
  NormalizedQueryProfile,
  RejectedCandidateLog,
  VerificationFailureReason,
  VerifiedBook,
} from '@/src/types/book';
import { buildBookCacheKey, normalizeText } from '@/src/lib/verification';
import { Cache, InMemoryTTLCache } from '../cache/ttlCache';
import {
  BookVerifier,
  GoogleBooksVerifier,
  OpenLibraryVerifier,
  resolveVerificationSourceBadge,
} from '../providers/bookVerifier';
import { getServerEnv } from '../config/env';

export const globalVerifiedBookCache = new InMemoryTTLCache<VerifiedBook>(
  AI_CONFIG.cacheTtlMs,
  AI_CONFIG.cacheMaxEntries,
);

export interface VerificationStageCallbacks {
  onBookVerified?: (book: VerifiedBook) => void;
  onBookRemoved?: (rejected: RejectedCandidateLog) => void;
}

export interface VerificationStageOutput {
  verifiedBooks: VerifiedBook[];
  rejectedCandidates: RejectedCandidateLog[];
  bothSourcesUnavailable: boolean;
}

/**
 * Tạo mô tả lý do loại bỏ song ngữ dựa trên mã lỗi xác thực.
 */
function buildRejectionMessages(
  reason: VerificationFailureReason,
  similarityScore: number,
): { reasonVi: string; reasonEn: string } {
  switch (reason) {
    case 'not_found':
      return {
        reasonVi:
          'Loại bỏ (not_found): Không tìm thấy bản ghi khớp trên Open Library và Google Books.',
        reasonEn:
          'Removed (not_found): No matching catalog record found on Open Library or Google Books.',
      };
    case 'author_mismatch':
      return {
        reasonVi:
          'Loại bỏ (author_mismatch): Nhan đề gần giống nhưng họ tác giả không khớp với hồ sơ danh mục.',
        reasonEn:
          'Removed (author_mismatch): Title matched a record, but mandatory author surname did not match.',
      };
    case 'low_title_similarity':
      return {
        reasonVi: `Loại bỏ (low_title_similarity): Độ tương đồng nhan đề (${Math.round(similarityScore * 100)}%) thấp hơn ngưỡng an toàn.`,
        reasonEn: `Removed (low_title_similarity): Title similarity (${Math.round(similarityScore * 100)}%) fell below verification threshold.`,
      };
    case 'source_unavailable':
      return {
        reasonVi:
          'Loại bỏ (source_unavailable): Nguồn danh mục không phản hồi khi kiểm tra ứng viên này.',
        reasonEn:
          'Removed (source_unavailable): Catalog source was unavailable during verification.',
      };
  }
}

/**
 * Thực thi Stage 4: Xác thực danh sách ứng viên với Open Library (trước) và Google Books (sau), giới hạn tối đa 20 lượt gọi và độ đồng thời (concurrency).
 */
export async function runStage4Verification(
  candidates: readonly ExtractedCandidate[],
  profile: NormalizedQueryProfile,
  callbacks?: VerificationStageCallbacks,
  options?: {
    cache?: Cache<VerifiedBook>;
    openLibraryVerifier?: BookVerifier;
    googleBooksVerifier?: BookVerifier;
    signal?: AbortSignal;
  },
): Promise<VerificationStageOutput> {
  const cache = options?.cache ?? globalVerifiedBookCache;
  const olVerifier = options?.openLibraryVerifier ?? new OpenLibraryVerifier();
  const gbVerifier = options?.googleBooksVerifier ?? new GoogleBooksVerifier();
  const signal = options?.signal;
  const { googleBooksApiKey } = getServerEnv();

  const cappedCandidates = candidates.slice(
    0,
    AI_CONFIG.maxExternalVerifyCallsPerRequest,
  );

  const verifiedBooks: VerifiedBook[] = [];
  const rejectedCandidates: RejectedCandidateLog[] = [];
  let externalLookupsUsed = 0;
  let sourceUnavailableCount = 0;
  let totalNetworkChecked = 0;

  // Xử lý theo lô nhỏ (concurrency limit = 2) để tôn trọng giới hạn tốc độ và phản hồi SSE mượt mà
  const concurrency = AI_CONFIG.verificationConcurrency;

  for (let i = 0; i < cappedCandidates.length; i += concurrency) {
    if (signal?.aborted) {
      throw new Error('ABORTED');
    }

    const batch = cappedCandidates.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (candidate, batchIdx) => {
        const globalIdx = i + batchIdx;
        if (signal?.aborted) return;

        const cacheKey = buildBookCacheKey(candidate.title, candidate.author);
        const cachedBook = cache.get(cacheKey);

        if (cachedBook) {
          const stepNumber = verifiedBooks.length + 1;
          const hydrated: VerifiedBook = {
            ...cachedBook,
            roadmapStepOrder: stepNumber,
            verification: {
              ...cachedBook.verification,
              fromCache: true,
            },
          };
          verifiedBooks.push(hydrated);
          callbacks?.onBookVerified?.(hydrated);
          return;
        }

        if (externalLookupsUsed >= AI_CONFIG.maxExternalVerifyCallsPerRequest) {
          return;
        }

        totalNetworkChecked += 1;
        externalLookupsUsed += 1;

        // 1. Kiểm tra Open Library trước
        const olResult = await olVerifier.verifyCandidate(candidate, signal);

        // 2. Chỉ gọi Google Books khi Open Library chưa khớp HOẶC thiếu số trang/ISBN, và có GOOGLE_BOOKS_API_KEY
        const needsExtraMetadata =
          !olResult.pageCount || !olResult.isbn13;
        const shouldCallGoogleBooks =
          Boolean(googleBooksApiKey) &&
          externalLookupsUsed < AI_CONFIG.maxExternalVerifyCallsPerRequest &&
          (!olResult.matched || needsExtraMetadata);

        let gbResult = null;
        if (shouldCallGoogleBooks) {
          externalLookupsUsed += 1;
          gbResult = await gbVerifier.verifyCandidate(candidate, signal);
        }

        const olDown = olResult.failureReason === 'source_unavailable';
        const gbDown =
          !googleBooksApiKey || gbResult?.failureReason === 'source_unavailable';
        if (olDown && gbDown) {
          sourceUnavailableCount += 1;
        }

        const isVerified = olResult.matched || Boolean(gbResult?.matched);

        if (!isVerified) {
          const primaryFailureReason: VerificationFailureReason =
            olResult.failureReason && olResult.failureReason !== 'source_unavailable'
              ? olResult.failureReason
              : gbResult?.failureReason || olResult.failureReason || 'not_found';

          const bestSim = Math.max(
            olResult.similarityScore,
            gbResult?.similarityScore ?? 0,
          );
          const msgs = buildRejectionMessages(primaryFailureReason, bestSim);
          const rejectedLog: RejectedCandidateLog = {
            candidateTitle: candidate.title,
            candidateAuthor: candidate.author,
            failureReasonCode: primaryFailureReason,
            reasonVi: msgs.reasonVi,
            reasonEn: msgs.reasonEn,
            timestampIso: new Date().toISOString(),
          };
          rejectedCandidates.push(rejectedLog);
          console.info(
            `[INFO][Stage4Verification] Rejected candidate="${candidate.title}" author="${candidate.author}" reason=${primaryFailureReason}`,
          );
          callbacks?.onBookRemoved?.(rejectedLog);
          return;
        }

        const matchedSourcesBadge = resolveVerificationSourceBadge(
          olResult.matched,
          Boolean(gbResult?.matched),
        );
        const matchedSourcesList: Array<'open_library' | 'google_books'> = [];
        if (olResult.matched) matchedSourcesList.push('open_library');
        if (gbResult?.matched) matchedSourcesList.push('google_books');

        const finalTitle =
          (olResult.matched ? olResult.catalogTitle : gbResult?.catalogTitle) ||
          candidate.title;
        const finalAuthors =
          (olResult.matched && olResult.catalogAuthors.length > 0
            ? olResult.catalogAuthors
            : gbResult?.catalogAuthors) || [candidate.author];
        const finalPageCount =
          olResult.pageCount || gbResult?.pageCount || 320;
        const finalSimilarity = Math.max(
          olResult.similarityScore,
          gbResult?.similarityScore ?? 0,
        );
        const finalSurname =
          olResult.matchedSurname || gbResult?.matchedSurname || '';
        const finalIsbn =
          olResult.isbn13 || gbResult?.isbn13 || candidate.isbn;
        const finalPublishYear =
          olResult.firstPublishYear || gbResult?.firstPublishYear;
        const hasViHint = Boolean(
          olResult.hasVietnameseEditionHint || gbResult?.hasVietnameseEditionHint,
        );

        const stepNum = verifiedBooks.length + 1;
        const palette = DESIGN_TOKENS.bookCoverPalette;
        const coverColorHex = palette[globalIdx % palette.length] || '#1E3A5F';

        const verifiedBook: VerifiedBook = {
          id: `verified-${olResult.recordId || gbResult?.recordId || globalIdx}`,
          topicCategory: profile.topics[0]?.toLowerCase() || 'general',
          title: finalTitle,
          subtitle: gbResult?.catalogSubtitle,
          authors: finalAuthors,
          pageCount: finalPageCount,
          language: hasViHint ? 'bilingual' : 'en',
          level: profile.level,
          roadmapStepOrder: stepNum,
          roadmapStageLabelVi: `Bước ${stepNum} · Lộ trình Đã kiểm chứng`,
          roadmapStageLabelEn: `Step ${stepNum} · Verified Milestone`,
          roadmapStepReasonVi: candidate.whyFound,
          roadmapStepReasonEn: candidate.whyFound,
          shortDescriptionVi:
            gbResult?.descriptionSnippet?.slice(0, 220) ||
            candidate.whyFound,
          shortDescriptionEn:
            gbResult?.descriptionSnippet?.slice(0, 220) ||
            candidate.whyFound,
          matchReasonVi: candidate.whyFound,
          matchReasonEn: candidate.whyFound,
          coverColorHex,
          verification: {
            status: 'verified',
            matchedSources: matchedSourcesBadge,
            matchedSourcesList,
            matchConfidence: finalSimilarity,
            normalizedQueryTitle: normalizeText(candidate.title),
            normalizedMatchedTitle: normalizeText(finalTitle),
            titleSimilarityScore: finalSimilarity,
            authorSurnameMatched: finalSurname,
            openLibraryId: olResult.matched ? olResult.recordId : undefined,
            openLibraryUrl: olResult.matched ? olResult.recordUrl : undefined,
            googleBooksId: gbResult?.matched ? gbResult.recordId : undefined,
            googleBooksUrl: gbResult?.matched ? gbResult.recordUrl : undefined,
            isbn13: finalIsbn,
            firstPublishYear: finalPublishYear,
            checkedAtIso: new Date().toISOString(),
            fromCache: false,
          },
          vietnameseEdition: {
            available: hasViHint,
            publisherOrNoteVi: hasViHint
              ? 'Ghi nhận có thông tin ngôn ngữ Tiếng Việt trong danh mục thư viện.'
              : 'Đã xác thực bản gốc tiếng Anh; chưa ghi nhận ấn bản tiếng Việt trong danh mục.',
            publisherOrNoteEn: hasViHint
              ? 'Catalog metadata indicates a Vietnamese language edition exists.'
              : 'Verified English edition; no confirmed Vietnamese translation in catalog.',
          },
          relevanceScore: Math.min(1, Math.max(0.75, finalSimilarity)),
          diversityBonus: Math.round((0.45 + (globalIdx % 5) * 0.1) * 100) / 100,
          groundingSourceUrl: candidate.sourceUrl,
        };

        cache.set(cacheKey, verifiedBook);
        verifiedBooks.push(verifiedBook);
        callbacks?.onBookVerified?.(verifiedBook);
      }),
    );
  }

  const bothSourcesUnavailable =
    totalNetworkChecked > 0 &&
    sourceUnavailableCount === totalNetworkChecked &&
    verifiedBooks.length === 0;

  return {
    verifiedBooks,
    rejectedCandidates,
    bothSourcesUnavailable,
  };
}
