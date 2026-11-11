/**
 * Tính năng: REST API Endpoint GET /api/books/[bookId]/editions.
 * Trường hợp sử dụng: Tra cứu ấn bản Tiếng Việt qua Open Library (language:vie) và Google Books (langRestrict=vi) có bộ nhớ đệm TTL và bảo vệ chống cào dữ liệu (globalVerificationScrapeRateLimiter).
 */

import { NextRequest } from 'next/server';
import { lookupVietnameseEditionForBook } from '@/server/pipeline/refinementAndEditionService';
import {
  apiJsonError,
  apiJsonSuccess,
  createScopedAbortSignal,
  enforceApiCors,
  resolveRequestId,
} from '@/server/http/apiResponse';
import { globalVerificationScrapeRateLimiter } from '@/server/rateLimit/rateLimiter';
import { extractTrustedClientIp } from '@/server/security/securityControls';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> },
) {
  const requestId = resolveRequestId(request);
  const corsError = enforceApiCors(request, requestId);
  if (corsError) return corsError;

  const clientIp = extractTrustedClientIp(request);
  const scrapeCheck = globalVerificationScrapeRateLimiter.check(
    `edition_${clientIp}`,
  );
  if (!scrapeCheck.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(scrapeCheck.retryAfterMs / 1000),
    );
    return apiJsonError({
      code: 'RATE_LIMITED',
      message: `Too many edition lookup queries. Please wait ${retryAfterSeconds} seconds.`,
      status: 429,
      requestId,
      retryAfterSeconds,
    });
  }

  const { signal: scopedSignal, cleanup } = createScopedAbortSignal(
    request.signal,
    12_000,
  );
  try {
    const { bookId } = await context.params;
    const decodedBookId = decodeURIComponent(bookId || '').trim();
    if (!decodedBookId || decodedBookId.length > 120) {
      return apiJsonError({
        code: 'BOOK_VERIFICATION_NOT_FOUND',
        message: 'Invalid bookId format.',
        status: 404,
        requestId,
      });
    }

    const vietnameseEdition = await lookupVietnameseEditionForBook(
      decodedBookId,
      scopedSignal,
    );

    return apiJsonSuccess(
      {
        bookId: decodedBookId,
        vietnameseEdition,
      },
      { status: 200, requestId },
    );
  } catch {
    return apiJsonError({
      code: 'EDITION_LOOKUP_ERROR',
      message: 'Could not check Vietnamese edition records.',
      status: 500,
      requestId,
    });
  } finally {
    cleanup();
  }
}
