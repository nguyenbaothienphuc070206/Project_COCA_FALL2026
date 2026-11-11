/**
 * Tính năng: Thuật toán chuẩn hóa nhan đề, khử dấu tiếng Việt, đối sánh mờ (fuzzy match), kiểm tra họ tác giả (hỗ trợ cả "First Last" và "Last, First"), đối sánh ISBN và tái xếp hạng đa dạng hóa MMR.
 * Trường hợp sử dụng: Xác thực ứng viên sách với dữ liệu Open Library / Google Books và điều chỉnh thứ tự gợi ý theo mức độ khám phá.
 */

import { VERIFICATION_CONFIG } from '../config/constants';
import { VerificationFailureReason } from '../types/book';

/**
 * Chuẩn hóa chuỗi văn bản: chuyển chữ thường, bỏ phụ đề sau dấu hai chấm/gạch ngang có khoảng trắng, khử dấu Unicode (bao gồm chữ đ/Đ tiếng Việt) và loại bỏ ký tự đặc biệt.
 * @param input - Chuỗi nhan đề hoặc tên tác giả gốc
 * @returns Chuỗi đã chuẩn hóa sạch
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  const withoutSubtitle = input.split(/[:—–]|\s-\s|\(/)[0] || input;
  return withoutSubtitle
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Trích xuất họ của tác giả sau khi chuẩn hóa, hỗ trợ cả thứ tự "First Middle Last" lẫn "Last, First".
 * @param authorName - Tên đầy đủ của tác giả (VD: "Martin Kleppmann" hoặc "Kleppmann, Martin")
 * @returns Họ/từ định danh chính đã chuẩn hóa
 */
export function extractAuthorSurname(authorName: string): string {
  if (!authorName) return '';
  const trimmed = authorName.trim();
  // Nếu ở định dạng "Last, First" (có dấu phẩy), phần trước dấu phẩy là họ tác giả
  if (trimmed.includes(',')) {
    const beforeComma = trimmed.split(',')[0] || '';
    const cleanedBefore = beforeComma
      .toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const tokens = cleanedBefore.split(' ').filter(Boolean);
    return tokens.length > 0 ? tokens[tokens.length - 1] : '';
  }

  const cleaned = trimmed
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned.split(' ').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/**
 * Chuẩn hóa chuỗi ISBN (chỉ giữ chữ số và chữ X ở cuối ISBN-10).
 * @param isbn - Mã ISBN đầu vào
 * @returns Chuỗi ISBN đã làm sạch
 */
export function normalizeIsbn(isbn?: string): string {
  if (!isbn) return '';
  return isbn.toUpperCase().replace(/[^0-9X]/g, '');
}

/**
 * Tạo khóa khử trùng lặp và khóa bộ nhớ đệm (Cache Key) từ nhan đề và tác giả.
 * @param title - Nhan đề sách
 * @param author - Tên tác giả
 * @returns Khóa chuẩn hóa dạng "normalizedTitle::authorSurname"
 */
export function buildBookCacheKey(title: string, author: string): string {
  return `${normalizeText(title)}::${extractAuthorSurname(author)}`;
}

/**
 * Tính điểm tương đồng Sørensen–Dice theo tập từ khóa giữa hai nhan đề đã chuẩn hóa.
 * @param titleA - Nhan đề ứng viên
 * @param titleB - Nhan đề trong danh mục thư viện
 * @returns Điểm tương đồng từ 0 đến 1
 */
export function computeTitleSimilarity(titleA: string, titleB: string): number {
  const normA = normalizeText(titleA);
  const normB = normalizeText(titleB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  // Nếu nhan đề chính chứa trọn vẹn nhan đề kia (ví dụ có hậu tố ấn bản), tính độ phủ cao
  const tokensA = new Set(normA.split(' ').filter((w) => w.length > 1 || /\d/.test(w)));
  const tokensB = new Set(normB.split(' ').filter((w) => w.length > 1 || /\d/.test(w)));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection += 1;
    }
  }
  const diceScore = (2 * intersection) / (tokensA.size + tokensB.size);
  return Math.round(diceScore * 100) / 100;
}

/**
 * Kiểm tra xem ứng viên sách có khớp với bản ghi danh mục (nhan đề đạt ngưỡng >= minTitleSimilarity và trùng họ tác giả, hoặc khớp ISBN + họ tác giả).
 * @param candidateTitle - Nhan đề ứng viên
 * @param candidateAuthor - Tác giả ứng viên
 * @param catalogTitle - Nhan đề trên Open Library / Google Books
 * @param catalogAuthors - Danh sách tác giả trên Open Library / Google Books
 * @param candidateIsbn - ISBN ứng viên (nếu có)
 * @param catalogIsbns - Danh sách ISBN trong bản ghi danh mục (nếu có)
 * @returns Kết quả xác thực kèm điểm tương đồng, họ tác giả khớp và mã lý do nếu thất bại
 */
export function verifyBookMatch(
  candidateTitle: string,
  candidateAuthor: string,
  catalogTitle: string,
  catalogAuthors: string[],
  candidateIsbn?: string,
  catalogIsbns?: string[],
): {
  matched: boolean;
  similarity: number;
  matchedSurname: string;
  isbnMatched: boolean;
  failureReason?: VerificationFailureReason;
} {
  const similarity = computeTitleSimilarity(candidateTitle, catalogTitle);
  const targetSurname = extractAuthorSurname(candidateAuthor);
  const catalogSurnames = catalogAuthors.map(extractAuthorSurname).filter(Boolean);

  // Cho phép khớp họ tác giả chính xác hoặc nằm trong chuỗi tên tác giả đã chuẩn hóa
  const normalizedCatalogAuthorsJoined = catalogAuthors
    .map((a) => normalizeText(a))
    .join(' ');
  const surnameMatched =
    targetSurname.length > 0 &&
    (catalogSurnames.includes(targetSurname) ||
      normalizedCatalogAuthorsJoined.split(' ').includes(targetSurname));

  const cleanCandidateIsbn = normalizeIsbn(candidateIsbn);
  const cleanCatalogIsbns = (catalogIsbns ?? []).map(normalizeIsbn).filter(Boolean);
  const isbnMatched =
    cleanCandidateIsbn.length >= 10 &&
    cleanCatalogIsbns.some(
      (catIsbn) =>
        catIsbn === cleanCandidateIsbn ||
        catIsbn.endsWith(cleanCandidateIsbn) ||
        cleanCandidateIsbn.endsWith(catIsbn),
    );

  const effectiveSimilarity = isbnMatched ? Math.max(similarity, 0.95) : similarity;
  const titlePasses = effectiveSimilarity >= VERIFICATION_CONFIG.minTitleSimilarity;

  if (titlePasses && surnameMatched) {
    return {
      matched: true,
      similarity: effectiveSimilarity,
      matchedSurname: targetSurname,
      isbnMatched,
    };
  }

  const failureReason: VerificationFailureReason = !titlePasses
    ? 'low_title_similarity'
    : 'author_mismatch';

  return {
    matched: false,
    similarity: effectiveSimilarity,
    matchedSurname: surnameMatched ? targetSurname : '',
    isbnMatched,
    failureReason,
  };
}

export interface RankableItem {
  id: string;
  relevanceScore: number;
  diversityBonus: number;
  levelOrder: number;
}

/**
 * Tái xếp hạng danh sách sách bằng Maximal Marginal Relevance (MMR) dựa trên mức độ khám phá (adventurousness 0..100).
 * @param items - Danh sách ứng viên đã xác thực
 * @param adventurousness - Giá trị từ 0 (bám sát nhu cầu) đến 100 (ưu tiên khám phá đa dạng)
 * @returns Danh sách đã sắp xếp theo điểm kết hợp MMR
 */
export function rerankWithMMR<T extends RankableItem>(
  items: readonly T[],
  adventurousness: number,
): T[] {
  const clampedAdv = Math.max(0, Math.min(100, adventurousness)) / 100;
  const lambda = 1 - clampedAdv * 0.65;

  return [...items].sort((a, b) => {
    const scoreA = lambda * a.relevanceScore + (1 - lambda) * a.diversityBonus;
    const scoreB = lambda * b.relevanceScore + (1 - lambda) * b.diversityBonus;
    if (Math.abs(scoreB - scoreA) > 0.001) {
      return scoreB - scoreA;
    }
    return a.levelOrder - b.levelOrder;
  });
}
