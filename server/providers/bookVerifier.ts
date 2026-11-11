/**
 * Tính năng: Giao diện BookVerifier cùng hai bộ kiểm chứng thực tế OpenLibraryVerifier (ưu tiên 1) và GoogleBooksVerifier (ưu tiên 2 / làm giàu dữ liệu).
 * Trường hợp sử dụng:
 * - Kiểm tra từng ứng viên sách ở Stage 4 theo nguyên tắc Fail-Closed.
 * - Điều tiết tốc độ gọi ra ngoài tới Open Library (3 req/s có email, 1 req/s không email) và Google Books (2 req/s) để tránh bị khóa IP.
 * - Kiểm tra chống SSRF (assertAllowedOutboundUrl), chặn chuyển hướng (redirect: 'error') và làm sạch văn bản/URL từ catalog.
 */

import { VERIFICATION_CONFIG } from '@/src/config/constants';
import {
  ExtractedCandidate,
  VerificationFailureReason,
  VerificationSource,
} from '@/src/types/book';
import {
  normalizeIsbn,
  normalizeText,
  verifyBookMatch,
} from '@/src/lib/verification';
import { getServerEnv } from '../config/env';
import {
  globalGoogleBooksPacer,
  globalOpenLibraryPacer,
} from '../rateLimit/rateLimiter';
import {
  assertAllowedOutboundUrl,
  sanitizeExternalSourceUrl,
  sanitizePlainTextOutput,
} from '../security/securityControls';

export interface CatalogMatchRecord {
  matched: boolean;
  source: 'open_library' | 'google_books';
  catalogTitle: string;
  catalogSubtitle?: string;
  catalogAuthors: string[];
  matchedSurname: string;
  similarityScore: number;
  isbn13?: string;
  pageCount?: number;
  firstPublishYear?: number;
  recordId: string;
  recordUrl: string;
  languageCode?: string;
  descriptionSnippet?: string;
  hasVietnameseEditionHint?: boolean;
  failureReason?: VerificationFailureReason;
}

export interface BookVerifier {
  readonly sourceName: 'open_library' | 'google_books';
  verifyCandidate(
    candidate: ExtractedCandidate,
    signal?: AbortSignal,
  ): Promise<CatalogMatchRecord>;
}

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  language?: string[];
  edition_key?: string[];
  cover_i?: number;
}

/**
 * Bộ xác thực trực tiếp qua Open Library Search API (/search.json).
 * Gửi header User-Agent: "ShelfPath (<OPENLIBRARY_CONTACT_EMAIL>)" khi có email (3 req/s), hoặc giới hạn 1 req/s khi thiếu email.
 */
export class OpenLibraryVerifier implements BookVerifier {
  readonly sourceName = 'open_library' as const;

  async verifyCandidate(
    candidate: ExtractedCandidate,
    signal?: AbortSignal,
  ): Promise<CatalogMatchRecord> {
    const { openLibraryContactEmail } = getServerEnv();
    const minIntervalMs = openLibraryContactEmail
      ? VERIFICATION_CONFIG.openLibraryIdentifiedIntervalMs
      : VERIFICATION_CONFIG.openLibraryAnonymousIntervalMs;

    await globalOpenLibraryPacer.waitTurn(minIntervalMs, signal);

    const userAgentHeader = openLibraryContactEmail
      ? `ShelfPath (${openLibraryContactEmail})`
      : 'ShelfPath (unidentified-client; configure OPENLIBRARY_CONTACT_EMAIL)';

    const cleanTitle = normalizeText(candidate.title);
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('title', cleanTitle || candidate.title);
    url.searchParams.set('limit', '5');
    url.searchParams.set(
      'fields',
      'key,title,author_name,first_publish_year,isbn,number_of_pages_median,language,edition_key,cover_i',
    );

    const safeOutboundUrl = assertAllowedOutboundUrl(url);

    let lastStatus = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        VERIFICATION_CONFIG.externalFetchTimeoutMs,
      );
      try {
        const res = await fetch(safeOutboundUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': userAgentHeader,
            Accept: 'application/json',
          },
          redirect: 'error',
          signal: signal ?? controller.signal,
        });
        clearTimeout(timeoutId);
        lastStatus = res.status;

        if (res.status === 429 || res.status === 403) {
          console.warn(
            `[WARN][OpenLibraryVerifier] Received HTTP ${res.status} on catalog lookup. Backing off...`,
          );
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          return {
            matched: false,
            source: 'open_library',
            catalogTitle: '',
            catalogAuthors: [],
            matchedSurname: '',
            similarityScore: 0,
            recordId: '',
            recordUrl: '',
            failureReason: 'source_unavailable',
          };
        }

        if (!res.ok) {
          return {
            matched: false,
            source: 'open_library',
            catalogTitle: '',
            catalogAuthors: [],
            matchedSurname: '',
            similarityScore: 0,
            recordId: '',
            recordUrl: '',
            failureReason: 'source_unavailable',
          };
        }

        const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
        const docs = Array.isArray(data.docs) ? data.docs : [];
        if (docs.length === 0) {
          return {
            matched: false,
            source: 'open_library',
            catalogTitle: '',
            catalogAuthors: [],
            matchedSurname: '',
            similarityScore: 0,
            recordId: '',
            recordUrl: '',
            failureReason: 'not_found',
          };
        }

        let bestFailureReason: VerificationFailureReason = 'low_title_similarity';
        let bestSimilarity = 0;

        for (const doc of docs) {
          const docTitle = sanitizePlainTextOutput(doc.title || '', 240);
          const docAuthors = Array.isArray(doc.author_name)
            ? doc.author_name.map((a) => sanitizePlainTextOutput(a, 120))
            : [];
          const docIsbns = Array.isArray(doc.isbn) ? doc.isbn : [];

          const check = verifyBookMatch(
            candidate.title,
            candidate.author,
            docTitle,
            docAuthors,
            candidate.isbn,
            docIsbns,
          );

          if (check.similarity > bestSimilarity) {
            bestSimilarity = check.similarity;
            if (check.failureReason) {
              bestFailureReason = check.failureReason;
            }
          }

          if (check.matched) {
            const editionOrWorkKey =
              (Array.isArray(doc.edition_key) && doc.edition_key[0]) ||
              (doc.key ? doc.key.replace(/^\/works\//, '') : 'OL-verified');
            const rawRecordPath =
              Array.isArray(doc.edition_key) && doc.edition_key[0]
                ? `https://openlibrary.org/books/${encodeURIComponent(doc.edition_key[0])}`
                : doc.key && doc.key.startsWith('/')
                  ? `https://openlibrary.org${doc.key}`
                  : `https://openlibrary.org/search?q=${encodeURIComponent(docTitle)}`;

            const recordPath = sanitizeExternalSourceUrl(
              rawRecordPath,
              docTitle,
            );

            const isbn13 = docIsbns
              .map(normalizeIsbn)
              .find(
                (code) =>
                  code.length === 13 &&
                  (code.startsWith('978') || code.startsWith('979')),
              );

            const langs = Array.isArray(doc.language) ? doc.language : [];
            const hasVi = langs.some((l) => l === 'vie' || l === 'vi');

            return {
              matched: true,
              source: 'open_library',
              catalogTitle: docTitle,
              catalogAuthors:
                docAuthors.length > 0 ? docAuthors : [candidate.author],
              matchedSurname: check.matchedSurname,
              similarityScore: check.similarity,
              isbn13,
              pageCount: doc.number_of_pages_median,
              firstPublishYear: doc.first_publish_year,
              recordId: editionOrWorkKey,
              recordUrl: recordPath,
              hasVietnameseEditionHint: hasVi,
            };
          }
        }

        return {
          matched: false,
          source: 'open_library',
          catalogTitle: sanitizePlainTextOutput(docs[0]?.title || '', 240),
          catalogAuthors: (docs[0]?.author_name || []).map((a) =>
            sanitizePlainTextOutput(a, 120),
          ),
          matchedSurname: '',
          similarityScore: bestSimilarity,
          recordId: '',
          recordUrl: '',
          failureReason: bestFailureReason,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        if (
          signal?.aborted ||
          (err instanceof Error && err.message === 'ABORTED')
        ) {
          throw new Error('ABORTED');
        }
        if (attempt === 1) {
          return {
            matched: false,
            source: 'open_library',
            catalogTitle: '',
            catalogAuthors: [],
            matchedSurname: '',
            similarityScore: 0,
            recordId: '',
            recordUrl: '',
            failureReason: 'source_unavailable',
          };
        }
      }
    }

    return {
      matched: false,
      source: 'open_library',
      catalogTitle: '',
      catalogAuthors: [],
      matchedSurname: '',
      similarityScore: 0,
      recordId: '',
      recordUrl: '',
      failureReason: lastStatus >= 400 ? 'source_unavailable' : 'not_found',
    };
  }
}

interface GoogleBooksVolume {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    language?: string;
    infoLink?: string;
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
  };
}

/**
 * Bộ xác thực thứ cấp qua Google Books API (/books/v1/volumes).
 * Chỉ gọi khi Open Library không kết luận được hoặc khi cần làm giàu siêu dữ liệu; được điều tiết tốc độ (2 req/s) qua globalGoogleBooksPacer.
 */
export class GoogleBooksVerifier implements BookVerifier {
  readonly sourceName = 'google_books' as const;

  async verifyCandidate(
    candidate: ExtractedCandidate,
    signal?: AbortSignal,
  ): Promise<CatalogMatchRecord> {
    const { googleBooksApiKey } = getServerEnv();
    // Nếu không cấu hình GOOGLE_BOOKS_API_KEY, không gọi hoặc báo bỏ qua an toàn để fallback về Open Library
    if (!googleBooksApiKey) {
      return {
        matched: false,
        source: 'google_books',
        catalogTitle: '',
        catalogAuthors: [],
        matchedSurname: '',
        similarityScore: 0,
        recordId: '',
        recordUrl: '',
        failureReason: 'source_unavailable',
      };
    }

    // Điều tiết nhịp gọi Google Books (500ms = tối đa 2 req/s) để tránh bị khóa IP
    await globalGoogleBooksPacer.waitTurn(500, signal);

    const cleanTitle = normalizeText(candidate.title);
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set(
      'q',
      `intitle:${cleanTitle || candidate.title} inauthor:${candidate.author}`,
    );
    url.searchParams.set('maxResults', '4');
    url.searchParams.set('key', googleBooksApiKey);

    const safeOutboundUrl = assertAllowedOutboundUrl(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      VERIFICATION_CONFIG.externalFetchTimeoutMs,
    );

    try {
      const res = await fetch(safeOutboundUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: signal ?? controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          matched: false,
          source: 'google_books',
          catalogTitle: '',
          catalogAuthors: [],
          matchedSurname: '',
          similarityScore: 0,
          recordId: '',
          recordUrl: '',
          failureReason: 'source_unavailable',
        };
      }

      const data = (await res.json()) as { items?: GoogleBooksVolume[] };
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) {
        return {
          matched: false,
          source: 'google_books',
          catalogTitle: '',
          catalogAuthors: [],
          matchedSurname: '',
          similarityScore: 0,
          recordId: '',
          recordUrl: '',
          failureReason: 'not_found',
        };
      }

      let bestFailureReason: VerificationFailureReason = 'low_title_similarity';
      let bestSimilarity = 0;

      for (const item of items) {
        const info = item.volumeInfo;
        if (!info || !info.title) continue;

        const cleanVolTitle = sanitizePlainTextOutput(info.title, 240);
        const volAuthors = Array.isArray(info.authors)
          ? info.authors.map((a) => sanitizePlainTextOutput(a, 120))
          : [];
        const volIsbns = (info.industryIdentifiers ?? [])
          .map((idObj) => idObj.identifier || '')
          .filter(Boolean);

        const check = verifyBookMatch(
          candidate.title,
          candidate.author,
          cleanVolTitle,
          volAuthors,
          candidate.isbn,
          volIsbns,
        );

        if (check.similarity > bestSimilarity) {
          bestSimilarity = check.similarity;
          if (check.failureReason) {
            bestFailureReason = check.failureReason;
          }
        }

        if (check.matched) {
          const isbn13 = volIsbns
            .map(normalizeIsbn)
            .find((c) => c.length === 13);
          const pubYearMatch = (info.publishedDate || '').match(/\d{4}/);
          const firstPublishYear = pubYearMatch
            ? Number.parseInt(pubYearMatch[0], 10)
            : undefined;
          const volId = item.id || 'gb-verified';
          const rawRecordUrl =
            info.infoLink ||
            `https://books.google.com/books?id=${encodeURIComponent(volId)}`;
          const recordUrl = sanitizeExternalSourceUrl(
            rawRecordUrl,
            cleanVolTitle,
          );

          return {
            matched: true,
            source: 'google_books',
            catalogTitle: cleanVolTitle,
            catalogSubtitle: info.subtitle
              ? sanitizePlainTextOutput(info.subtitle, 240)
              : undefined,
            catalogAuthors:
              volAuthors.length > 0 ? volAuthors : [candidate.author],
            matchedSurname: check.matchedSurname,
            similarityScore: check.similarity,
            isbn13,
            pageCount: info.pageCount,
            firstPublishYear,
            recordId: volId,
            recordUrl,
            languageCode: info.language,
            descriptionSnippet: info.description
              ? sanitizePlainTextOutput(info.description, 600)
              : undefined,
            hasVietnameseEditionHint: info.language === 'vi',
          };
        }
      }

      return {
        matched: false,
        source: 'google_books',
        catalogTitle: sanitizePlainTextOutput(
          items[0]?.volumeInfo?.title || '',
          240,
        ),
        catalogAuthors: (items[0]?.volumeInfo?.authors || []).map((a) =>
          sanitizePlainTextOutput(a, 120),
        ),
        matchedSurname: '',
        similarityScore: bestSimilarity,
        recordId: '',
        recordUrl: '',
        failureReason: bestFailureReason,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (
        signal?.aborted ||
        (err instanceof Error && err.message === 'ABORTED')
      ) {
        throw new Error('ABORTED');
      }
      return {
        matched: false,
        source: 'google_books',
        catalogTitle: '',
        catalogAuthors: [],
        matchedSurname: '',
        similarityScore: 0,
        recordId: '',
        recordUrl: '',
        failureReason: 'source_unavailable',
      };
    }
  }
}

/**
 * Hợp nhất nhãn nguồn xác thực từ danh sách nguồn khớp.
 */
export function resolveVerificationSourceBadge(
  olMatched: boolean,
  gbMatched: boolean,
): VerificationSource {
  if (olMatched && gbMatched) return 'both';
  if (gbMatched) return 'google_books';
  return 'open_library';
}
