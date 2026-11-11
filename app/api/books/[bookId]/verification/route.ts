/**
 * Tính năng: REST API Endpoint GET /api/books/[bookId]/verification trả về hồ sơ xác thực chi tiết của từng cuốn sách.
 * Trường hợp sử dụng: Được gọi khi người dùng mở Ngăn kéo Minh bạch ("Cách chúng tôi kiểm chứng" / Trust Drawer), được bảo vệ bởi bộ giới hạn chống cào dữ liệu (globalVerificationScrapeRateLimiter).
 */

import { NextRequest } from 'next/server';
import { getVerifiedBookById } from '@/server/store/recommendationStore';
import {
  apiJsonError,
  apiJsonSuccess,
  enforceApiCors,
  resolveRequestId,
} from '@/server/http/apiResponse';
import { globalVerificationScrapeRateLimiter } from '@/server/rateLimit/rateLimiter';
import { extractTrustedClientIp } from '@/server/security/securityControls';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bookId: string }> },
) {
  const requestId = resolveRequestId(req);
  const corsError = enforceApiCors(req, requestId);
  if (corsError) return corsError;

  const clientIp = extractTrustedClientIp(req);
  const scrapeCheck = globalVerificationScrapeRateLimiter.check(
    `verify_${clientIp}`,
  );
  if (!scrapeCheck.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(scrapeCheck.retryAfterMs / 1000),
    );
    return apiJsonError({
      code: 'RATE_LIMITED',
      message: `Too many verification queries. Please wait ${retryAfterSeconds} seconds.`,
      status: 429,
      requestId,
      retryAfterSeconds,
    });
  }

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

  const matchedBook = getVerifiedBookById(decodedBookId);

  if (!matchedBook) {
    return apiJsonError({
      code: 'BOOK_VERIFICATION_NOT_FOUND',
      message: `Verification record for book '${decodedBookId}' was not found.`,
      status: 404,
      requestId,
    });
  }

  return apiJsonSuccess(
    {
      bookId: matchedBook.id,
      title: matchedBook.title,
      authors: matchedBook.authors,
      verification: matchedBook.verification,
      vietnameseEdition: matchedBook.vietnameseEdition,
    },
    { status: 200, requestId },
  );
}
