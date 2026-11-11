/**
 * Tính năng: Bộ lưu trữ tạm thời phía máy chủ cho các bộ gợi ý (RecommendationSet), bể sách đã xác thực (Verified Pool), tín hiệu tránh lặp lại khi Bỏ qua sách (Session Dismiss Avoid Signal) và bộ nhớ đệm Ấn bản Tiếng Việt.
 * Trường hợp sử dụng: Cho phép GET/POST /api/recommendations/[id], /refine, /dismiss và GET /api/books/[bookId]/editions chia sẻ trạng thái nhất quán trên globalThis.
 */

import {
  RecommendationSet,
  RefinementAdjustment,
  VerifiedBook,
  VietnameseEditionInfo,
} from '@/src/types/book';
import {
  MOCK_REJECTED_CANDIDATES,
  MOCK_VERIFIED_BOOKS,
} from '@/src/data/mockBooks';
import { Cache } from '../cache/ttlCache';
import { FirestoreBackedTTLCache } from '../persistence/firestoreStores';

export interface RecommendationSessionState {
  recommendationSet: RecommendationSet;
  verifiedPool: VerifiedBook[];
  dismissedBookIds: Set<string>;
  dismissedBooks: VerifiedBook[];
  activeAdjustment?: RefinementAdjustment;
}

interface ShelfPathGlobalStore {
  sessionsById: Map<string, RecommendationSessionState>;
  verifiedBooksById: Map<string, VerifiedBook>;
  verifiedBooksCache: FirestoreBackedTTLCache<VerifiedBook>;
  editionsCache: FirestoreBackedTTLCache<VietnameseEditionInfo>;
}

const globalForStore = globalThis as unknown as {
  __shelfPathStoreV4?: ShelfPathGlobalStore;
};

function getGlobalStore(): ShelfPathGlobalStore {
  if (!globalForStore.__shelfPathStoreV4) {
    const verifiedMap = new Map<string, VerifiedBook>();
    const verifiedBooksCache = new FirestoreBackedTTLCache<VerifiedBook>(
      'verified_book',
      1000 * 60 * 60 * 24,
      300,
    );
    for (const book of MOCK_VERIFIED_BOOKS) {
      verifiedMap.set(book.id, book);
    }

    const defaultMlBooks = MOCK_VERIFIED_BOOKS.filter(
      (b) => b.topicCategory === 'machine-learning',
    )
      .slice(0, 4)
      .map((b, idx) => ({
        ...b,
        roadmapStepOrder: idx + 1,
        diffStatus: 'unchanged' as const,
      }));

    const initialSampleSet: RecommendationSet = {
      id: 'rec_initial_sample',
      isSampleData: true,
      preferences: {
        topic: 'Machine Learning',
        level: 'beginner',
        length: 'any',
        language: 'any',
        adventurousness: 30,
      },
      books: defaultMlBooks,
      rejectedCandidates: [...MOCK_REJECTED_CANDIDATES],
      stats: {
        candidatesFound: defaultMlBooks.length + MOCK_REJECTED_CANDIDATES.length,
        candidatesVerified: defaultMlBooks.length,
        candidatesRemoved: MOCK_REJECTED_CANDIDATES.length,
        currentStage: 'completed',
        queriesExecuted: ['[MOCK_MODE] Machine Learning (beginner)'],
        warnings: [],
      },
      createdAtIso: '2026-01-01T00:00:00.000Z',
    };

    const sessionsMap = new Map<string, RecommendationSessionState>();
    sessionsMap.set('rec_initial_sample', {
      recommendationSet: initialSampleSet,
      verifiedPool: [...MOCK_VERIFIED_BOOKS],
      dismissedBookIds: new Set<string>(),
      dismissedBooks: [],
      activeAdjustment: undefined,
    });

    globalForStore.__shelfPathStoreV4 = {
      sessionsById: sessionsMap,
      verifiedBooksById: verifiedMap,
      verifiedBooksCache,
      editionsCache: new FirestoreBackedTTLCache<VietnameseEditionInfo>(
        'vn_edition',
        1000 * 60 * 60 * 12,
        300,
      ),
    };
  }
  return globalForStore.__shelfPathStoreV4;
}

/**
 * Xây dựng bể sách đã xác thực (Verified Pool) ban đầu cho phiên, kết hợp các sách vừa xác thực trong luồng chính và các sách đã xác thực cùng nhóm chủ đề dự phòng.
 */
function buildInitialVerifiedPool(recSet: RecommendationSet): VerifiedBook[] {
  const byId = new Map<string, VerifiedBook>();
  for (const b of recSet.books) {
    byId.set(b.id, b);
  }
  // Nạp thêm các sách đã kiểm chứng từ MOCK_VERIFIED_BOOKS vào bể dự phòng để hỗ trợ thay thế tức thì (instant re-ranking / replacement)
  for (const mockBook of MOCK_VERIFIED_BOOKS) {
    if (!byId.has(mockBook.id)) {
      byId.set(mockBook.id, mockBook);
    }
  }
  return Array.from(byId.values());
}

/**
 * Lưu hoặc cập nhật một RecommendationSet trong bộ nhớ tạm của server.
 */
export function saveRecommendationSetState(
  recSet: RecommendationSet,
  extraPoolBooks?: readonly VerifiedBook[],
): void {
  const { sessionsById, verifiedBooksById, verifiedBooksCache } = getGlobalStore();
  if (sessionsById.size >= 100 && !sessionsById.has(recSet.id)) {
    const oldestKey = sessionsById.keys().next().value;
    if (oldestKey) sessionsById.delete(oldestKey);
  }

  const existing = sessionsById.get(recSet.id);
  const poolMap = new Map<string, VerifiedBook>();

  if (existing) {
    for (const b of existing.verifiedPool) {
      poolMap.set(b.id, b);
    }
  } else {
    for (const b of buildInitialVerifiedPool(recSet)) {
      poolMap.set(b.id, b);
    }
  }

  for (const b of recSet.books) {
    poolMap.set(b.id, b);
    verifiedBooksById.set(b.id, b);
    verifiedBooksCache.set(b.id, b);
  }

  if (extraPoolBooks) {
    for (const b of extraPoolBooks) {
      poolMap.set(b.id, b);
      verifiedBooksById.set(b.id, b);
      verifiedBooksCache.set(b.id, b);
    }
  }

  sessionsById.set(recSet.id, {
    recommendationSet: recSet,
    verifiedPool: Array.from(poolMap.values()),
    dismissedBookIds: existing?.dismissedBookIds ?? new Set<string>(),
    dismissedBooks: existing?.dismissedBooks ?? [],
    activeAdjustment: recSet.activeAdjustment ?? existing?.activeAdjustment,
  });
}

/**
 * Lấy RecommendationSet theo ID.
 */
export function getRecommendationSetById(
  id: string,
): RecommendationSet | undefined {
  return getGlobalStore().sessionsById.get(id)?.recommendationSet;
}

/**
 * Lấy toàn bộ trạng thái phiên (gồm cả verifiedPool, dismissedBooks, activeAdjustment) theo ID.
 */
export function getRecommendationSessionById(
  id: string,
): RecommendationSessionState | undefined {
  return getGlobalStore().sessionsById.get(id);
}

/**
 * Cập nhật trạng thái phiên sau khi tinh chỉnh (Refine) hoặc bỏ qua sách (Dismiss / Undo).
 */
export function updateRecommendationSession(
  id: string,
  updater: (session: RecommendationSessionState) => RecommendationSessionState,
): RecommendationSessionState | undefined {
  const { sessionsById, verifiedBooksById } = getGlobalStore();
  const current = sessionsById.get(id);
  if (!current) return undefined;

  const updated = updater(current);
  sessionsById.set(id, updated);
  for (const b of updated.recommendationSet.books) {
    verifiedBooksById.set(b.id, b);
  }
  for (const b of updated.verifiedPool) {
    verifiedBooksById.set(b.id, b);
  }
  return updated;
}

/**
 * Tìm một cuốn sách đã xác thực theo bookId từ cả phiên trực tiếp và bộ mẫu.
 */
export function getVerifiedBookById(bookId: string): VerifiedBook | undefined {
  const store = getGlobalStore();
  return store.verifiedBooksCache.get(bookId) ?? store.verifiedBooksById.get(bookId);
}

/**
 * Truy cập bộ nhớ đệm TTL (Firestore-backed + Memory fallback) cho kết quả tra cứu Ấn bản Tiếng Việt.
 */
export function getVietnameseEditionsCache(): Cache<VietnameseEditionInfo> {
  return getGlobalStore().editionsCache;
}

/**
 * Truy cập bộ nhớ đệm TTL (Firestore-backed + Memory fallback) cho siêu dữ liệu sách đã xác thực.
 */
export function getVerifiedBooksCache(): FirestoreBackedTTLCache<VerifiedBook> {
  return getGlobalStore().verifiedBooksCache;
}

export function getRawVietnameseEditionsCache(): FirestoreBackedTTLCache<VietnameseEditionInfo> {
  return getGlobalStore().editionsCache;
}

