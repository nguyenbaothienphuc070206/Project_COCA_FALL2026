/**
 * Tính năng: Thuật toán thuần túy (Pure Logic) cho Tinh chỉnh ngôn ngữ tự nhiên (Refinement), Tín hiệu tránh lặp lại khi Bỏ qua sách (Dismiss Avoid Penalty) và Tính toán hiệu ứng thay đổi vị trí (Diff Status).
 * Trường hợp sử dụng: Dùng chung cho POST /api/recommendations/[id]/refine, POST /api/recommendations/[id]/dismiss và bộ kiểm thử đơn vị (node:test).
 */

import {
  BookDiffStatus,
  BookLanguagePreference,
  InterpretedRefinementChip,
  ReaderLevel,
  RefinementAdjustment,
  RefinementAdjustmentSchema,
  UserPreferences,
  VerifiedBook,
} from '../types/book';
import { extractAuthorSurname, normalizeText } from './verification';

export const MAX_REFINEMENT_INPUT_CHARS = 260;

/**
 * Làm sạch đầu vào văn bản của người dùng: giới hạn độ dài an toàn và vô hiệu hóa mọi nỗ lực can thiệp quy tắc hệ thống (Prompt Injection).
 * @param rawInput - Chuỗi người dùng nhập vào ô tinh chỉnh
 * @returns Chuỗi đã làm sạch kèm cờ báo nếu bị cắt ngắn hoặc phát hiện cú pháp điều khiển
 */
export function sanitizeRefinementInput(rawInput: string): {
  sanitizedText: string;
  wasTruncated: boolean;
  blockedInjectionAttempt: boolean;
} {
  const trimmed = (rawInput || '').trim();
  const wasTruncated = trimmed.length > MAX_REFINEMENT_INPUT_CHARS;
  const sliced = trimmed.slice(0, MAX_REFINEMENT_INPUT_CHARS);

  const injectionPattern =
    /(ignore\s+(all\s+)?(previous|prior|above|system|developer)\s+(instructions|prompts|rules|directions)|disregard\s+(all\s+)?(previous|prior|system|above)\s+(instructions|rules|prompts)|forget\s+(everything|all\s+instructions|your\s+rules)|bypass\s+(stage\s*4\s*|book\s*)?verification|disable\s+(fail[-\s]?closed|verification|catalog\s+check)|unverified\s+books|reveal\s+(your\s+|secret\s+)?(system\s+prompt|api\s+key|secret\s+instructions|instructions)|print\s+(your\s+)?(system\s+prompt|GEMINI_API_KEY|environment\s+variables)|developer\s+mode|dan\s+mode|unrestricted\s+terminal|system\s*override\s*:|new\s+system\s+instruction\s*:|<\s*\/?\s*(untrusted_user_topic|untrusted_refinement_text|untrusted_web_search_notes|script)\s*>|system\s*prompt|bỏ\s+qua\s+(mọi\s+|tất\s+cả\s+)?(hướng\s+dẫn|quy\s+tắc|kiểm\s+chứng)|tắt\s+(chế\s+độ\s+)?kiểm\s+chứng|bịa\s+(ra\s+)?sách|tiết\s+lộ\s+(system\s+prompt|khóa\s+bí\s+mật|api\s+key))/gi;
  const blockedInjectionAttempt = injectionPattern.test(sliced);
  injectionPattern.lastIndex = 0;

  const sanitizedText = sliced
    .replace(injectionPattern, ' ')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/[<>`{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    sanitizedText,
    wasTruncated,
    blockedInjectionAttempt,
  };
}

/**
 * Sinh danh sách các thẻ chip có thể gỡ bỏ (Removable Chips) từ đối tượng RefinementAdjustment.
 */
export function buildChipsFromAdjustment(
  adj: Omit<RefinementAdjustment, 'chips'>,
): InterpretedRefinementChip[] {
  const chips: InterpretedRefinementChip[] = [];

  if (adj.lengthDelta === 'shorter') {
    chips.push({
      id: 'lengthDelta:shorter',
      dimension: 'lengthDelta',
      value: 'shorter',
      labelVi: 'Ngắn gọn hơn (<320 trang)',
      labelEn: 'Shorter (<320 pages)',
    });
  } else if (adj.lengthDelta === 'longer') {
    chips.push({
      id: 'lengthDelta:longer',
      dimension: 'lengthDelta',
      value: 'longer',
      labelVi: 'Chuyên khảo dày hơn (>400 trang)',
      labelEn: 'Deeper / Longer (>400 pages)',
    });
  }

  if (adj.practicalVsTheory === 'more_practical') {
    chips.push({
      id: 'practicalVsTheory:more_practical',
      dimension: 'practicalVsTheory',
      value: 'more_practical',
      labelVi: 'Thực hành & Ứng dụng nhiều hơn',
      labelEn: 'More practical & hands-on',
    });
  } else if (adj.practicalVsTheory === 'more_theoretical') {
    chips.push({
      id: 'practicalVsTheory:more_theoretical',
      dimension: 'practicalVsTheory',
      value: 'more_theoretical',
      labelVi: 'Thiên về Lý thuyết & Toán học',
      labelEn: 'More theoretical & rigorous',
    });
  }

  if (adj.levelDelta === 'easier') {
    chips.push({
      id: 'levelDelta:easier',
      dimension: 'levelDelta',
      value: 'easier',
      labelVi: 'Dễ tiếp cận hơn (Nhập môn)',
      labelEn: 'More accessible (Beginner-friendly)',
    });
  } else if (adj.levelDelta === 'harder') {
    chips.push({
      id: 'levelDelta:harder',
      dimension: 'levelDelta',
      value: 'harder',
      labelVi: 'Nâng cao độ khó học thuật',
      labelEn: 'More advanced depth',
    });
  }

  for (const topic of adj.emphasisTopics) {
    const clean = topic.trim();
    if (!clean) continue;
    chips.push({
      id: `emphasisTopic:${clean.toLowerCase()}`,
      dimension: 'emphasisTopic',
      value: clean,
      labelVi: `Nhấn mạnh: ${clean}`,
      labelEn: `Focus: ${clean}`,
    });
  }

  for (const author of adj.excludeAuthors) {
    const clean = author.trim();
    if (!clean) continue;
    chips.push({
      id: `excludeAuthor:${clean.toLowerCase()}`,
      dimension: 'excludeAuthor',
      value: clean,
      labelVi: `Tránh tác giả: ${clean}`,
      labelEn: `Exclude author: ${clean}`,
    });
  }

  return chips;
}

/**
 * Xóa một chip tinh chỉnh khỏi RefinementAdjustment hiện tại.
 */
export function removeChipFromAdjustment(
  current: RefinementAdjustment,
  chipId: string,
): RefinementAdjustment {
  const next: RefinementAdjustment = {
    lengthDelta: current.lengthDelta,
    practicalVsTheory: current.practicalVsTheory,
    levelDelta: current.levelDelta,
    emphasisTopics: [...current.emphasisTopics],
    excludeAuthors: [...current.excludeAuthors],
  };

  if (chipId.startsWith('lengthDelta:')) {
    next.lengthDelta = 'none';
  } else if (chipId.startsWith('practicalVsTheory:')) {
    next.practicalVsTheory = 'balanced';
  } else if (chipId.startsWith('levelDelta:')) {
    next.levelDelta = 'same';
  } else if (chipId.startsWith('emphasisTopic:')) {
    const target = chipId.slice('emphasisTopic:'.length).toLowerCase();
    next.emphasisTopics = next.emphasisTopics.filter(
      (t) => t.toLowerCase() !== target,
    );
  } else if (chipId.startsWith('excludeAuthor:')) {
    const target = chipId.slice('excludeAuthor:'.length).toLowerCase();
    next.excludeAuthors = next.excludeAuthors.filter(
      (a) => a.toLowerCase() !== target,
    );
  }

  next.chips = buildChipsFromAdjustment(next);
  return RefinementAdjustmentSchema.parse(next);
}

/**
 * Gộp hai đối tượng RefinementAdjustment (khi người dùng tinh chỉnh liên tiếp nhiều lần).
 */
export function mergeRefinementAdjustments(
  base: RefinementAdjustment | undefined,
  incoming: RefinementAdjustment,
): RefinementAdjustment {
  if (!base) {
    const withChips = {
      ...incoming,
      chips: buildChipsFromAdjustment(incoming),
    };
    return RefinementAdjustmentSchema.parse(withChips);
  }

  const mergedTopics = Array.from(
    new Set([...base.emphasisTopics, ...incoming.emphasisTopics]),
  ).slice(0, 5);
  const mergedAuthors = Array.from(
    new Set([...base.excludeAuthors, ...incoming.excludeAuthors]),
  ).slice(0, 5);

  const combined: RefinementAdjustment = {
    lengthDelta:
      incoming.lengthDelta !== 'none' ? incoming.lengthDelta : base.lengthDelta,
    practicalVsTheory:
      incoming.practicalVsTheory !== 'balanced'
        ? incoming.practicalVsTheory
        : base.practicalVsTheory,
    levelDelta:
      incoming.levelDelta !== 'same' ? incoming.levelDelta : base.levelDelta,
    emphasisTopics: mergedTopics,
    excludeAuthors: mergedAuthors,
  };
  combined.chips = buildChipsFromAdjustment(combined);
  return RefinementAdjustmentSchema.parse(combined);
}

/**
 * Bộ phân tích ngôn ngữ tự nhiên tất định (Deterministic Fallback & Fast-Path Parser) hỗ trợ cả Tiếng Việt và Tiếng Anh.
 * Luôn trả về đối tượng hợp lệ theo RefinementAdjustmentSchema.
 */
export function parseRefinementTextDeterministic(
  rawText: string,
): RefinementAdjustment {
  const { sanitizedText } = sanitizeRefinementInput(rawText);
  const lower = sanitizedText.toLowerCase();

  let lengthDelta: RefinementAdjustment['lengthDelta'] = 'none';
  if (
    /\b(shorter|concise|brief|compact|quick|fast|under 300|small|less pages)\b/i.test(
      lower,
    ) ||
    /(ngắn hơn|ngắn gọn|mỏng hơn|ít trang|đọc nhanh|cô đọng|dưới 300)/i.test(
      lower,
    )
  ) {
    lengthDelta = 'shorter';
  } else if (
    /\b(longer|deeper|comprehensive|thorough|thick|textbook|encyclopedic)\b/i.test(
      lower,
    ) ||
    /(dài hơn|dày hơn|toàn diện|sâu hơn|chi tiết hơn|giáo trình lớn)/i.test(
      lower,
    )
  ) {
    lengthDelta = 'longer';
  }

  let practicalVsTheory: RefinementAdjustment['practicalVsTheory'] = 'balanced';
  if (
    /\b(practical|hands-on|applied|project|code|coding|engineering|real-world|actionable)\b/i.test(
      lower,
    ) ||
    /(thực hành|ứng dụng|thực tế|dự án|lập trình|kỹ thuật|làm được ngay)/i.test(
      lower,
    )
  ) {
    practicalVsTheory = 'more_practical';
  } else if (
    /\b(theoretical|theory|math|mathematical|proofs|academic|rigorous|foundational theory)\b/i.test(
      lower,
    ) ||
    /(lý thuyết|học thuật|toán học|chứng minh|nghiên cứu|nền tảng lý thuyết)/i.test(
      lower,
    )
  ) {
    practicalVsTheory = 'more_theoretical';
  }

  let levelDelta: RefinementAdjustment['levelDelta'] = 'same';
  if (
    /\b(easier|beginner|introductory|simple|simpler|accessible|from scratch|gentle)\b/i.test(
      lower,
    ) ||
    /(dễ hơn|nhập môn|cơ bản hơn|dễ hiểu|cho người mới|bắt đầu từ đầu)/i.test(
      lower,
    )
  ) {
    levelDelta = 'easier';
  } else if (
    /\b(harder|advanced|expert|graduate|phd|senior|complex)\b/i.test(lower) ||
    /(khó hơn|nâng cao|chuyên sâu|cao học|chuyên gia)/i.test(lower)
  ) {
    levelDelta = 'harder';
  }

  const excludeAuthors: string[] = [];
  const authorExcludeMatchEn = sanitizedText.match(
    /(?:no|without|exclude|not\s+by)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)?)/,
  );
  const authorExcludeMatchVi = sanitizedText.match(
    /(?:tránh|bỏ|không\s+lấy\s+tác\s+giả)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)?)/i,
  );
  if (authorExcludeMatchEn?.[1]) {
    excludeAuthors.push(authorExcludeMatchEn[1].trim());
  }
  if (authorExcludeMatchVi?.[1]) {
    excludeAuthors.push(authorExcludeMatchVi[1].trim());
  }

  const emphasisTopics: string[] = [];
  const focusMatch = sanitizedText.match(
    /(?:focus\s+on|more\s+about|emphasis\s+on|tập\s+trung\s+vào|nhấn\s+mạnh|thêm\s+về)\s+([a-zA-Z0-9À-ỹ\s-]{2,36})/i,
  );
  if (focusMatch?.[1]) {
    emphasisTopics.push(focusMatch[1].trim());
  } else if (
    lengthDelta === 'none' &&
    practicalVsTheory === 'balanced' &&
    levelDelta === 'same' &&
    excludeAuthors.length === 0 &&
    sanitizedText.length >= 2
  ) {
    emphasisTopics.push(sanitizedText.slice(0, 45));
  }

  const base: RefinementAdjustment = {
    lengthDelta,
    practicalVsTheory,
    levelDelta,
    emphasisTopics: emphasisTopics.slice(0, 5),
    excludeAuthors: excludeAuthors.slice(0, 5),
  };
  base.chips = buildChipsFromAdjustment(base);

  return RefinementAdjustmentSchema.parse(base);
}

/**
 * Kiểm tra xem một cuốn sách có mang tính thực hành cao hay thiên về lý thuyết dựa trên mô tả và nhan đề.
 */
export function classifyBookPracticality(book: VerifiedBook): {
  practicalScore: number;
  theoryScore: number;
} {
  const combined =
    `${book.title} ${book.subtitle || ''} ${book.shortDescriptionEn} ${book.shortDescriptionVi} ${book.matchReasonEn}`.toLowerCase();

  let practicalHits = 0;
  if (
    /\b(hands-on|practical|designing|building|applications|production|strategy|engineering|applied|habit|real-world|scikit|keras|tensorflow)\b/i.test(
      combined,
    ) ||
    /(thực hành|ứng dụng|thiết kế|triển khai|dự án|thực tế)/i.test(combined)
  ) {
    practicalHits += 2;
  }

  let theoryHits = 0;
  if (
    /\b(theory|mathematical|proofs|textbook|canonical|philosophy|epistemology|metaphysics|formal|mit press)\b/i.test(
      combined,
    ) ||
    /(lý thuyết|toán học|học thuật|triết học|giáo trình)/i.test(combined)
  ) {
    theoryHits += 2;
  }

  return {
    practicalScore: Math.min(1, 0.4 + practicalHits * 0.25),
    theoryScore: Math.min(1, 0.4 + theoryHits * 0.25),
  };
}

/**
 * Tạo vector đặc trưng ngữ nghĩa / siêu dữ liệu cho một cuốn sách (dùng embeddingVector từ Gemini nếu có, hoặc vector 8 chiều tất định).
 */
export function getBookEmbeddingOrFeatureVector(
  book: VerifiedBook,
): readonly number[] {
  if (book.embeddingVector && book.embeddingVector.length > 0) {
    return book.embeddingVector;
  }
  const { practicalScore, theoryScore } = classifyBookPracticality(book);
  const normPages = Math.min(1, book.pageCount / 900);
  const isBeg = book.level === 'beginner' ? 1 : 0;
  const isInt = book.level === 'intermediate' ? 1 : 0;
  const isAdv = book.level === 'advanced' ? 1 : 0;
  const hasVi = book.vietnameseEdition.available ? 1 : 0;
  return [
    normPages,
    isBeg,
    isInt,
    isAdv,
    practicalScore,
    theoryScore,
    hasVi,
    book.relevanceScore,
  ];
}

/**
 * Tính độ tương đồng Cosine giữa hai vector.
 */
export function vectorCosineSimilarity(
  a: readonly number[],
  b: readonly number[],
): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : Math.max(0, Math.min(1, dot / denom));
}

/**
 * Tính điểm phạt "Avoid Signal" (0..0.45) cho một ứng viên dựa trên tập hợp các cuốn sách mà người dùng đã bấm "Không quan tâm (Dismiss)" trong phiên.
 * Phạt nặng các cuốn sách có cùng tác giả hoặc có vector ngữ nghĩa/độ dài/loại hình quá giống sách vừa bị loại.
 */
export function computeDismissPenalty(
  candidate: VerifiedBook,
  dismissedBooks: readonly VerifiedBook[],
): number {
  if (dismissedBooks.length === 0) return 0;

  const candVec = getBookEmbeddingOrFeatureVector(candidate);
  const candSurnames = new Set(
    candidate.authors.map(extractAuthorSurname).filter(Boolean),
  );

  let maxPenalty = 0;

  for (const dismissed of dismissedBooks) {
    if (dismissed.id === candidate.id) {
      return 1; // Tuyệt đối loại bỏ nếu trùng ID
    }

    const disVec = getBookEmbeddingOrFeatureVector(dismissed);
    const vecSim =
      candVec.length === disVec.length
        ? vectorCosineSimilarity(candVec, disVec)
        : 0.5;

    const sameAuthor = dismissed.authors
      .map(extractAuthorSurname)
      .some((s) => s && candSurnames.has(s));

    const sameSubtopicAndLevel =
      dismissed.topicCategory === candidate.topicCategory &&
      dismissed.level === candidate.level &&
      Math.abs(dismissed.pageCount - candidate.pageCount) < 110;

    let penalty = 0;
    if (sameAuthor) penalty += 0.25;
    if (sameSubtopicAndLevel) penalty += 0.14;
    if (vecSim > 0.85) penalty += (vecSim - 0.85) * 0.9;

    if (penalty > maxPenalty) {
      maxPenalty = penalty;
    }
  }

  return Math.round(Math.min(0.45, maxPenalty) * 1000) / 1000;
}

/**
 * Tái xếp hạng và lọc bể sách đã xác thực (Verified Pool) dựa trên:
 * 1. Tinh chỉnh ngôn ngữ tự nhiên (RefinementAdjustment)
 * 2. Tùy chọn người dùng (Trình độ, Độ dài, Ngôn ngữ: vi/en/any, Mức độ khám phá MMR)
 * 3. Tập sách đã bị loại bỏ (Dismissed IDs + Avoid Signal Penalty)
 * 4. Gắn nhãn hiệu ứng thay đổi vị trí (diffStatus: moved_up, moved_down, new, unchanged)
 */
export function applyRefinementAndDismissToPool(params: {
  verifiedPool: readonly VerifiedBook[];
  previousBooks: readonly VerifiedBook[];
  preferences: UserPreferences;
  adjustment?: RefinementAdjustment;
  dismissedBookIds?: ReadonlySet<string>;
  dismissedBooks?: readonly VerifiedBook[];
  maxResults?: number;
}): VerifiedBook[] {
  const {
    verifiedPool,
    previousBooks,
    preferences,
    adjustment,
    dismissedBookIds = new Set<string>(),
    dismissedBooks = [],
    maxResults = 4,
  } = params;

  const excludedAuthorSurnames = new Set(
    (adjustment?.excludeAuthors ?? []).map(extractAuthorSurname).filter(Boolean),
  );

  // 1. Loại bỏ toàn bộ sách đã bị Dismiss trong phiên hoặc thuộc tác giả bị loại trừ
  let candidates = verifiedPool.filter((book) => {
    if (dismissedBookIds.has(book.id)) return false;
    if (excludedAuthorSurnames.size > 0) {
      const bookSurnames = book.authors
        .map(extractAuthorSurname)
        .filter(Boolean);
      if (bookSurnames.some((s) => excludedAuthorSurnames.has(s))) {
        return false;
      }
    }
    return true;
  });

  if (candidates.length === 0) return [];

  // Xác định trình độ mục tiêu sau khi áp dụng levelDelta
  const levelOrderMap: Record<ReaderLevel, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };
  let targetLevelNum = levelOrderMap[preferences.level] ?? 1;
  if (adjustment?.levelDelta === 'easier') {
    targetLevelNum = Math.max(1, targetLevelNum - 1);
  } else if (adjustment?.levelDelta === 'harder') {
    targetLevelNum = Math.min(3, targetLevelNum + 1);
  }

  // Xác định topicCategory mục tiêu từ preferences.topic để giữ đúng chuyên ngành khi tái xếp hạng
  const qLower = preferences.topic.toLowerCase();
  let targetCategory: string | null = null;
  if (
    qLower.includes('machine') ||
    qLower.includes('học máy') ||
    qLower.includes('ai') ||
    qLower.includes('trí tuệ')
  ) {
    targetCategory = 'machine-learning';
  } else if (
    qLower.includes('phil') ||
    qLower.includes('triết') ||
    qLower.includes('tư duy phản biện')
  ) {
    targetCategory = 'philosophy';
  } else if (
    qLower.includes('finance') ||
    qLower.includes('tài chính') ||
    qLower.includes('tiền') ||
    qLower.includes('đầu tư')
  ) {
    targetCategory = 'personal-finance';
  } else if (
    qLower.includes('system') ||
    qLower.includes('kiến trúc') ||
    qLower.includes('phân tán') ||
    qLower.includes('software')
  ) {
    targetCategory = 'distributed-systems';
  } else if (
    qLower.includes('psych') ||
    qLower.includes('tâm lý') ||
    qLower.includes('nhận thức')
  ) {
    targetCategory = 'cognitive-psychology';
  }

  // Nếu có từ 3 cuốn trở lên thuộc đúng chuyên ngành mục tiêu và mức độ khám phá < 75, ưu tiên giữ chuyên ngành chính
  if (targetCategory && preferences.adventurousness < 75) {
    const inCategory = candidates.filter(
      (b) => b.topicCategory === targetCategory,
    );
    if (inCategory.length >= 2) {
      const crossCategory = candidates.filter(
        (b) => b.topicCategory !== targetCategory,
      );
      candidates = [...inCategory, ...crossCategory.slice(0, 1)];
    }
  }

  // Nếu người dùng yêu cầu "shorter" (ngắn gọn hơn) hoặc preferences.length === 'short',
  // kiểm tra xem trong bể đã xác thực có đủ sách <= 420 trang không
  const wantsShorter =
    adjustment?.lengthDelta === 'shorter' || preferences.length === 'short';
  if (wantsShorter) {
    const conciseCandidates = candidates.filter((b) => b.pageCount <= 420);
    if (conciseCandidates.length >= 2) {
      const longOnes = candidates
        .filter((b) => b.pageCount > 420)
        .sort((a, b) => a.pageCount - b.pageCount);
      candidates = [
        ...conciseCandidates,
        ...longOnes.slice(0, Math.max(0, 4 - conciseCandidates.length)),
      ];
    }
  }

  const clampedAdv = Math.max(0, Math.min(100, preferences.adventurousness)) / 100;
  const lambda = 1 - clampedAdv * 0.6;

  // 2. Tính điểm tổng hợp cho từng cuốn sách
  const scored = candidates.map((book) => {
    const baseMmr =
      lambda * book.relevanceScore + (1 - lambda) * book.diversityBonus;
    let deltaScore = 0;

    // Ưu tiên mạnh cho sách đúng chuyên ngành mục tiêu
    if (targetCategory && book.topicCategory === targetCategory) {
      deltaScore += 0.48;
    }

    // Ưu tiên khớp từ khóa chủ đề hiện tại
    const normTopic = normalizeText(preferences.topic);
    const bookText = normalizeText(
      `${book.title} ${book.topicCategory} ${book.shortDescriptionEn} ${book.shortDescriptionVi}`,
    );
    if (
      normTopic &&
      normTopic
        .split(' ')
        .filter((w) => w.length > 2)
        .some((w) => bookText.includes(w))
    ) {
      deltaScore += 0.16;
    }

    // Độ khớp trình độ (Level Fit) — luôn giữ vững độ phù hợp trình độ
    const bookLevelNum = levelOrderMap[book.level] ?? 2;
    const levelDiff = Math.abs(bookLevelNum - targetLevelNum);
    if (levelDiff === 0) {
      deltaScore += 0.22;
    } else if (levelDiff === 1) {
      deltaScore += 0.06;
    } else {
      deltaScore -= 0.14;
    }

    // Tác động của Length Refinement ("shorter" vs "longer")
    if (adjustment?.lengthDelta === 'shorter' || preferences.length === 'short') {
      if (book.pageCount <= 220) {
        deltaScore += 0.42;
      } else if (book.pageCount <= 340) {
        deltaScore += 0.28;
      } else if (book.pageCount <= 450) {
        deltaScore += 0.08;
      } else {
        deltaScore -= 0.35;
      }
    } else if (
      adjustment?.lengthDelta === 'longer' ||
      preferences.length === 'deep'
    ) {
      if (book.pageCount >= 450) {
        deltaScore += 0.28;
      } else if (book.pageCount < 250) {
        deltaScore -= 0.18;
      }
    }

    // Tác động của Practical vs Theoretical Refinement
    const { practicalScore, theoryScore } = classifyBookPracticality(book);
    if (adjustment?.practicalVsTheory === 'more_practical') {
      deltaScore += practicalScore * 0.26 - theoryScore * 0.08;
    } else if (adjustment?.practicalVsTheory === 'more_theoretical') {
      deltaScore += theoryScore * 0.26 - practicalScore * 0.08;
    }

    // Tác động của Emphasis Topics
    if (adjustment?.emphasisTopics && adjustment.emphasisTopics.length > 0) {
      for (const emp of adjustment.emphasisTopics) {
        const cleanEmp = normalizeText(emp);
        if (cleanEmp && bookText.includes(cleanEmp)) {
          deltaScore += 0.2;
        }
      }
    }

    // Tác động thực sự của Tùy chọn Ngôn ngữ (Language Preference: vi | en | any)
    const langPref: BookLanguagePreference = preferences.language;
    if (langPref === 'vi') {
      if (book.vietnameseEdition.available || book.language === 'vi') {
        deltaScore += 0.28;
      } else {
        deltaScore -= 0.14;
      }
    } else if (langPref === 'en') {
      if (book.language === 'en') {
        deltaScore += 0.08;
      }
    }

    // Điểm phạt Avoid Signal từ các cuốn sách đã bị Dismiss trong phiên
    const avoidPenalty = computeDismissPenalty(book, dismissedBooks);
    deltaScore -= avoidPenalty;

    const finalScore = baseMmr + deltaScore;
    return {
      book,
      finalScore,
      bookLevelNum,
    };
  });

  // 3. Sắp xếp theo điểm tổng hợp
  scored.sort((a, b) => {
    if (Math.abs(b.finalScore - a.finalScore) > 0.015) {
      return b.finalScore - a.finalScore;
    }
    if (wantsShorter && a.book.pageCount !== b.book.pageCount) {
      return a.book.pageCount - b.book.pageCount;
    }
    return a.bookLevelNum - b.bookLevelNum;
  });

  const selected = scored.slice(0, maxResults);

  // 4. Tính toán diffStatus (moved_up, moved_down, new, unchanged) và đồng bộ số Bước trên nhãn chặng
  const prevOrderById = new Map<string, number>();
  previousBooks.forEach((b, idx) => {
    prevOrderById.set(b.id, idx + 1);
  });

  return selected.map((entry, idx) => {
    const newStepOrder = idx + 1;
    const prevOrder = prevOrderById.get(entry.book.id);
    let diffStatus: BookDiffStatus = 'unchanged';

    if (prevOrder === undefined) {
      diffStatus = previousBooks.length > 0 ? 'new' : 'unchanged';
    } else if (newStepOrder < prevOrder) {
      diffStatus = 'moved_up';
    } else if (newStepOrder > prevOrder) {
      diffStatus = 'moved_down';
    }

    let updatedMatchVi = entry.book.matchReasonVi;
    let updatedMatchEn = entry.book.matchReasonEn;

    if (
      adjustment?.lengthDelta === 'shorter' &&
      entry.book.pageCount <= 390 &&
      !updatedMatchEn.includes('Prioritized for concise length')
    ) {
      updatedMatchVi = `[Ưu tiên ngắn gọn: ${entry.book.pageCount} trang] ${updatedMatchVi}`;
      updatedMatchEn = `[Prioritized for concise length: ${entry.book.pageCount} pages] ${updatedMatchEn}`;
    } else if (
      adjustment?.practicalVsTheory === 'more_practical' &&
      !updatedMatchEn.includes('Practical focus')
    ) {
      updatedMatchVi = `[Ưu tiên tính thực hành] ${updatedMatchVi}`;
      updatedMatchEn = `[Practical focus] ${updatedMatchEn}`;
    }

    const cleanStageVi = entry.book.roadmapStageLabelVi.replace(
      /^Bước\s+\d+\s*·\s*/i,
      '',
    );
    const cleanStageEn = entry.book.roadmapStageLabelEn.replace(
      /^Step\s+\d+\s*·\s*/i,
      '',
    );

    return {
      ...entry.book,
      roadmapStepOrder: newStepOrder,
      roadmapStageLabelVi: `Bước ${newStepOrder} · ${cleanStageVi}`,
      roadmapStageLabelEn: `Step ${newStepOrder} · ${cleanStageEn}`,
      previousStepOrder: prevOrder,
      diffStatus,
      matchReasonVi: updatedMatchVi,
      matchReasonEn: updatedMatchEn,
      relevanceScore:
        Math.round(
          Math.max(0.65, Math.min(0.99, entry.finalScore - 0.35)) * 100,
        ) / 100,
    };
  });
}
