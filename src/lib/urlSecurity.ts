/**
 * Tính năng: Kiểm tra và làm sạch liên kết nguồn bên ngoài (URL Allowlist Security).
 * Trường hợp sử dụng: Đảm bảo mọi liên kết nguồn hiển thị trên thẻ sách, ngăn kéo kiểm chứng và trang xuất dữ liệu chỉ sử dụng giao thức HTTPS và thuộc danh sách máy chủ hợp lệ (Open Library và Google Books).
 */

const ALLOWED_SOURCE_HOSTS = new Set<string>([
  'openlibrary.org',
  'www.openlibrary.org',
  'covers.openlibrary.org',
  'books.google.com',
  'books.google.com.vn',
  'www.google.com',
  'play.google.com',
]);

/**
 * Kiểm tra xem một URL có hợp lệ, dùng HTTPS và thuộc danh sách tên miền nguồn sách đáng tin cậy hay không.
 * @param rawUrl Chuỗi URL đầu vào
 * @returns Chuỗi URL an toàn hoặc null nếu không hợp lệ
 */
export function sanitizeExternalSourceUrl(
  rawUrl: string | undefined | null,
): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      ALLOWED_SOURCE_HOSTS.has(hostname) ||
      hostname.endsWith('.openlibrary.org')
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Trả về liên kết nguồn an toàn hoặc liên kết tra cứu Open Library mặc định nếu URL bị từ chối.
 * @param rawUrl URL cần kiểm tra
 * @param fallbackTitle Nhan đề sách để tạo truy vấn tìm kiếm an toàn trên Open Library
 */
export function getSafeSourceUrlOrFallback(
  rawUrl: string | undefined | null,
  fallbackTitle: string,
): string {
  const safe = sanitizeExternalSourceUrl(rawUrl);
  if (safe) {
    return safe;
  }
  const cleanQuery = encodeURIComponent(
    (fallbackTitle || 'book').replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 80),
  );
  return `https://openlibrary.org/search?q=${cleanQuery}`;
}
