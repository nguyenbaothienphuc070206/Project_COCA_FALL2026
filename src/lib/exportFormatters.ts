/**
 * Tính năng: Bộ định dạng xuất dữ liệu Kệ sách & Lộ trình (Markdown & CSV chuẩn UTF-8 BOM) và hàm sắp xếp lại thứ tự Kệ sách (My Shelf).
 * Trường hợp sử dụng: Xuất siêu dữ liệu sách và liên kết nguồn xác thực (tuyệt đối không chứa nội dung sách có bản quyền), bảo toàn 100% dấu Tiếng Việt khi mở bằng Excel/Numbers.
 */

import { SavedShelfItem, VerifiedBook } from '../types/book';

export const UTF8_BOM = '\uFEFF';

/**
 * Làm sạch và bọc chuỗi theo chuẩn RFC 4180 cho một ô dữ liệu CSV, đồng thời chặn công thức độc hại (CSV Formula Injection).
 */
export function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  let str = String(value).replace(/\r?\n/g, ' ').trim();
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Lấy đường dẫn nguồn xác thực chính thức (Open Library hoặc Google Books) của một cuốn sách.
 */
export function getPrimaryVerificationUrl(book: VerifiedBook): string {
  return (
    book.verification.openLibraryUrl ||
    book.verification.googleBooksUrl ||
    `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`
  );
}

/**
 * Định dạng danh sách sách sang Markdown (chỉ gồm siêu dữ liệu: nhan đề, tác giả, lý do phù hợp, trạng thái đọc, thông tin bản Tiếng Việt và liên kết nguồn xác thực).
 * @param items - Danh sách mục trên kệ sách hoặc lộ trình
 * @param locale - Ngôn ngữ xuất ('vi' | 'en')
 * @param topicTitle - Chủ đề lộ trình (tùy chọn)
 * @returns Chuỗi văn bản Markdown hoàn chỉnh (UTF-8)
 */
export function formatShelfAsMarkdown(
  items: readonly SavedShelfItem[],
  locale: 'vi' | 'en' = 'vi',
  topicTitle?: string,
): string {
  const isVi = locale === 'vi';
  const headerTitle = isVi
    ? `# Lộ Trình Đọc Sách Đã Kiểm Chứng — ShelfPath${topicTitle ? ` (${topicTitle})` : ''}`
    : `# Verified Reading Roadmap — ShelfPath${topicTitle ? ` (${topicTitle})` : ''}`;

  const disclaimer = isVi
    ? `> Chỉ xuất siêu dữ liệu và liên kết nguồn xác thực (Open Library / Google Books). Không lưu trữ hay trích xuất nội dung sách.`
    : `> Exports verified metadata and catalog links only (Open Library / Google Books). Never includes copyrighted book content.`;

  if (items.length === 0) {
    return `${headerTitle}\n\n${disclaimer}\n\n${
      isVi ? '_Chưa có cuốn sách nào trong danh sách._' : '_No books in shelf._'
    }\n`;
  }

  const statusMapVi: Record<SavedShelfItem['status'], string> = {
    to_read: 'Sắp đọc',
    reading: 'Đang đọc',
    done: 'Đã đọc xong',
  };
  const statusMapEn: Record<SavedShelfItem['status'], string> = {
    to_read: 'To read',
    reading: 'Reading',
    done: 'Done',
  };

  const lines: string[] = [headerTitle, '', disclaimer, ''];

  items.forEach((item, index) => {
    const { book, status } = item;
    const stepNum = index + 1;
    const reason = isVi ? book.matchReasonVi : book.matchReasonEn;
    const stepReason = isVi
      ? book.roadmapStepReasonVi
      : book.roadmapStepReasonEn;
    const statusLabel = isVi ? statusMapVi[status] : statusMapEn[status];
    const sourceUrl = getPrimaryVerificationUrl(book);
    const viEditionStatus = book.vietnameseEdition.available
      ? isVi
        ? `Đã tìm thấy bản Tiếng Việt${book.vietnameseEdition.vietnameseTitle ? ` (${book.vietnameseEdition.vietnameseTitle})` : ''}`
        : `Vietnamese edition found${book.vietnameseEdition.vietnameseTitle ? ` (${book.vietnameseEdition.vietnameseTitle})` : ''}`
      : isVi
        ? 'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu'
        : 'No Vietnamese edition found in our sources';

    lines.push(`## ${stepNum}. ${book.title}`);
    lines.push(
      `- **${isVi ? 'Tác giả' : 'Author'}**: ${book.authors.join(', ')}`,
    );
    lines.push(
      `- **${isVi ? 'Trạng thái đọc' : 'Reading Status'}**: ${statusLabel} | **${isVi ? 'Độ dài' : 'Length'}**: ${book.pageCount} ${isVi ? 'trang' : 'pages'} | **ISBN-13**: ${book.verification.isbn13 || '—'}`,
    );
    lines.push(`- **${isVi ? 'Lý do phù hợp' : 'Why it matches'}**: ${reason}`);
    lines.push(
      `- **${isVi ? 'Lý do thứ tự đọc' : 'Step rationale'}**: ${stepReason}`,
    );
    lines.push(
      `- **${isVi ? 'Ấn bản Tiếng Việt' : 'Vietnamese Edition'}**: ${viEditionStatus}${book.vietnameseEdition.sourceUrl ? ` ([Link](${book.vietnameseEdition.sourceUrl}))` : ''}`,
    );
    lines.push(
      `- **${isVi ? 'Liên kết nguồn xác thực' : 'Verified Source Link'}**: [${sourceUrl}](${sourceUrl})`,
    );
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Định dạng danh sách sách sang CSV có đính kèm UTF-8 BOM (\uFEFF) ở đầu file để hiển thị nguyên vẹn dấu Tiếng Việt trong Excel.
 * Chỉ bao gồm siêu dữ liệu và liên kết nguồn, không bao giờ chứa nội dung sách.
 */
export function formatShelfAsCsvWithBom(
  items: readonly SavedShelfItem[],
  locale: 'vi' | 'en' = 'vi',
): string {
  const isVi = locale === 'vi';
  const headers = isVi
    ? [
        'Thứ tự',
        'Nhan đề',
        'Tác giả',
        'Trạng thái đọc',
        'Trình độ',
        'Số trang',
        'ISBN-13',
        'Lý do phù hợp',
        'Ấn bản Tiếng Việt',
        'Liên kết nguồn xác thực',
      ]
    : [
        'Step',
        'Title',
        'Authors',
        'Reading Status',
        'Level',
        'Pages',
        'ISBN-13',
        'Match Reason',
        'Vietnamese Edition',
        'Verified Source URL',
      ];

  const statusMapVi: Record<SavedShelfItem['status'], string> = {
    to_read: 'Sắp đọc',
    reading: 'Đang đọc',
    done: 'Đã đọc xong',
  };
  const statusMapEn: Record<SavedShelfItem['status'], string> = {
    to_read: 'To read',
    reading: 'Reading',
    done: 'Done',
  };

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  items.forEach((item, idx) => {
    const { book, status } = item;
    const reason = isVi ? book.matchReasonVi : book.matchReasonEn;
    const statusLabel = isVi ? statusMapVi[status] : statusMapEn[status];
    const viEditionLabel = book.vietnameseEdition.available
      ? isVi
        ? 'Đã tìm thấy bản Tiếng Việt'
        : 'Vietnamese edition found'
      : isVi
        ? 'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu'
        : 'No Vietnamese edition found in our sources';
    const sourceUrl = getPrimaryVerificationUrl(book);

    const row = [
      idx + 1,
      book.title,
      book.authors.join('; '),
      statusLabel,
      book.level,
      book.pageCount,
      book.verification.isbn13 || '',
      reason,
      viEditionLabel,
      sourceUrl,
    ].map(escapeCsvCell);

    rows.push(row.join(','));
  });

  return `${UTF8_BOM}${rows.join('\r\n')}\r\n`;
}

/**
 * Thêm hoặc bỏ lưu một cuốn sách vào Kệ sách cá nhân, đảm bảo không bao giờ phát sinh bản ghi trùng lặp (duplicate saves).
 */
export function toggleShelfBookImmutable(
  currentShelf: readonly SavedShelfItem[],
  book: VerifiedBook,
  nowIso: string = new Date().toISOString(),
): SavedShelfItem[] {
  const deduped = dedupeShelfItems(currentShelf);
  const exists = deduped.some((item) => item.book.id === book.id);
  if (exists) {
    return deduped.filter((item) => item.book.id !== book.id);
  }
  return [
    ...deduped,
    {
      book,
      status: 'to_read',
      savedAtIso: nowIso,
    },
  ];
}

/**
 * Khử trùng lặp danh sách Kệ sách theo book.id (giữ bản ghi đầu tiên).
 */
export function dedupeShelfItems(
  items: readonly SavedShelfItem[],
): SavedShelfItem[] {
  const seen = new Set<string>();
  const result: SavedShelfItem[] = [];
  for (const item of items) {
    if (!item?.book?.id || seen.has(item.book.id)) continue;
    seen.add(item.book.id);
    result.push(item);
  }
  return result;
}

/**
 * Di chuyển vị trí một cuốn sách lên ('up') hoặc xuống ('down') trong Kệ sách và cập nhật lại số thứ tự bước đọc.
 */
export function reorderShelfItems(
  items: readonly SavedShelfItem[],
  bookId: string,
  direction: 'up' | 'down',
): SavedShelfItem[] {
  const clean = dedupeShelfItems(items);
  const index = clean.findIndex((item) => item.book.id === bookId);
  if (index === -1) return clean;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= clean.length) {
    return clean;
  }

  const swapped = [...clean];
  const temp = swapped[index];
  swapped[index] = swapped[targetIndex];
  swapped[targetIndex] = temp;

  return swapped.map((entry, idx) => ({
    ...entry,
    book: {
      ...entry.book,
      roadmapStepOrder: idx + 1,
    },
  }));
}
