'use client';

/**
 * Tính năng: Không gian làm việc chính của ShelfPath (HomeWorkspace) lắp ghép trên khung DashboardShell (Phase 3A "E-Book Dashboard"), tích hợp Embeddings + MMR & Không gian Lộ trình 3D "The Path" (Phase 3B), Tinh chỉnh Ngôn ngữ Tự nhiên, Bộ lọc nhanh, Bỏ qua sách kèm Hoàn tác 8 giây, Kệ sách Cá nhân & Xuất dữ liệu (Phase 4), và Tối ưu hóa Core Web Vitals (Phase 9: Lazy-load 3D với khung giữ chỗ chống lệch bố cục CLS = 0 & startTransition tối ưu INP).
 * Trường hợp sử dụng: Quản lý đầy đủ các tab (Discover, My Roadmap / The Path, My Shelf, Vision) và mọi trạng thái bất đồng bộ + trường hợp biên (Offline, Không còn sách thay thế, Tinh chỉnh hẹp, Lỗi 429, Lỗi Fail-Closed 503).
 */

import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import {
  AlertOctagon,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Info,
  RotateCcw,
  Route,
  Sparkles,
  Undo2,
  WifiOff,
} from 'lucide-react';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { ActiveTab, DashboardShell } from '@/src/components/DashboardShell';
import { TopicPreferencesForm } from '@/src/components/TopicPreferencesForm';
import { PipelineTracker } from '@/src/components/PipelineTracker';
import { BookCard } from '@/src/components/BookCard';
import { TrustDrawer } from '@/src/components/TrustDrawer';
import { MyShelfView } from '@/src/components/MyShelfView';
import { VisionSection } from '@/src/components/VisionSection';
import {
  ClientQuickFilters,
  RefinementAndQuickFiltersBar,
} from '@/src/components/RefinementAndQuickFiltersBar';
import { useTranslation } from '@/src/i18n/useTranslation';
import type { Locale } from '@/src/i18n/dictionaries';
import { safeGetStorage, safeSetStorage } from '@/src/lib/storage';
import { STORAGE_KEYS, SUGGESTED_TOPICS } from '@/src/config/constants';
import { OnboardingBanner } from '@/src/components/OnboardingBanner';
import { SiteFooter } from '@/src/components/SiteFooter';
import {
  MOCK_REJECTED_CANDIDATES,
  MOCK_VERIFIED_BOOKS,
} from '@/src/data/mockBooks';
import {
  applyRefinementAndDismissToPool,
  mergeRefinementAdjustments,
  parseRefinementTextDeterministic,
  removeChipFromAdjustment,
  sanitizeRefinementInput,
} from '@/src/lib/refinementAndDismiss';
import {
  dedupeShelfItems,
  reorderShelfItems,
  toggleShelfBookImmutable,
} from '@/src/lib/exportFormatters';
import {
  PipelineSSEEvent,
  PipelineStageKey,
  RecommendationSet,
  RefinementAdjustment,
  RejectedCandidateLog,
  SavedShelfItem,
  UserPreferences,
  VerifiedBook,
} from '@/src/types/book';
import {
  ApiClientError,
  dismissRecommendationBook,
  fetchRecommendationById,
  fetchServerStatus,
  RateLimitError,
  refineRecommendations,
  SourceOutageError,
  streamRecommendations,
} from '@/src/lib/api';

const HeroShelf3D = dynamic(
  () => import('@/src/components/HeroShelf3D').then((m) => m.HeroShelf3D),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading 3D Verification Shelf"
        className="min-h-[340px] rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-44 rounded bg-[#EFECE3] dark:bg-[#171B26]" />
          <div className="h-6 w-24 rounded-full bg-[#EFECE3] dark:bg-[#171B26]" />
        </div>
        <div className="h-[220px] rounded-2xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] flex items-center justify-center text-xs text-[#6E6A61] dark:text-[#8E887C]">
          Đang khởi tạo Kệ sách Kiểm chứng 3D / Loading 3D Shelf...
        </div>
        <div className="h-4 w-3/4 rounded bg-[#EFECE3] dark:bg-[#171B26]" />
      </div>
    ),
  },
);

const RoadmapPath3D = dynamic(
  () => import('@/src/components/RoadmapPath3D').then((m) => m.RoadmapPath3D),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading 3D Reading Path"
        className="min-h-[520px] rounded-[24px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 flex flex-col justify-center items-center gap-3 text-xs text-[#6E6A61] dark:text-[#8E887C]"
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#C8433C] border-t-transparent animate-spin" />
        <span>Đang tải Không gian Lộ trình 3D / Loading 3D Path...</span>
      </div>
    ),
  },
);

type AsyncStatus =
  | 'empty'
  | 'loading'
  | 'success'
  | 'error'
  | 'rate_limited'
  | 'cancelled';

interface DismissUndoBannerState {
  dismissedBook: VerifiedBook;
  replacementBook: VerifiedBook | null;
  previousBooksSnapshot: VerifiedBook[];
  secondsLeft: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  topic: 'Machine Learning',
  level: 'beginner',
  length: 'any',
  language: 'any',
  adventurousness: 30,
};

const DEFAULT_QUICK_FILTERS: ClientQuickFilters = {
  length: 'any',
  level: 'all',
  language: 'all',
};

function buildInitialSampleRecommendationSet(
  prefs: UserPreferences,
): RecommendationSet {
  const initialBooks = applyRefinementAndDismissToPool({
    verifiedPool: MOCK_VERIFIED_BOOKS,
    previousBooks: [],
    preferences: prefs,
    dismissedBookIds: new Set(),
    dismissedBooks: [],
    maxResults: 4,
  }).map((b) => ({
    ...b,
    diffStatus: 'unchanged' as const,
  }));

  return {
    id: 'rec_initial_sample',
    isSampleData: true,
    preferences: prefs,
    books: initialBooks,
    rejectedCandidates: [...MOCK_REJECTED_CANDIDATES],
    stats: {
      candidatesFound: initialBooks.length + MOCK_REJECTED_CANDIDATES.length,
      candidatesVerified: initialBooks.length,
      candidatesRemoved: MOCK_REJECTED_CANDIDATES.length,
      currentStage: 'completed',
      queriesExecuted: [`[MOCK_MODE] ${prefs.topic} (${prefs.level})`],
      warnings: [],
    },
    createdAtIso: '2026-01-01T00:00:00.000Z',
  };
}

export function HomeWorkspace({
  initialLocale: _initialLocale,
}: {
  initialLocale?: Locale;
}) {
  const { locale, t } = useTranslation();

  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('autostart') === '1' ||
      safeGetStorage<boolean>(STORAGE_KEYS.onboardingSeen, false)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOnboarding(false);
    }
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    safeSetStorage(STORAGE_KEYS.onboardingSeen, true);
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const handleSelectTab = useCallback((nextTab: ActiveTab) => {
    startTransition(() => {
      setActiveTab(nextTab);
    });
  }, []);

  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_PREFERENCES,
  );
  const [status, setStatus] = useState<AsyncStatus>('success');
  const [activeStage, setActiveStage] = useState<PipelineStageKey>('completed');
  const [recommendationSet, setRecommendationSet] =
    useState<RecommendationSet | null>(() =>
      buildInitialSampleRecommendationSet(DEFAULT_PREFERENCES),
    );
  const [streamingBooks, setStreamingBooks] = useState<VerifiedBook[]>([]);
  const [streamingRejected, setStreamingRejected] = useState<
    RejectedCandidateLog[]
  >([]);
  const [streamingFoundCount, setStreamingFoundCount] = useState<number>(0);
  const [selectedBookForTrust, setSelectedBookForTrust] =
    useState<VerifiedBook | null>(null);
  const [savedShelf, setSavedShelf] = useState<SavedShelfItem[]>(() =>
    dedupeShelfItems(
      safeGetStorage<SavedShelfItem[]>(STORAGE_KEYS.savedShelf, []),
    ),
  );
  const [simulateOutage, setSimulateOutage] = useState<boolean>(false);
  const [useMockMode, setUseMockMode] = useState<boolean>(true);
  const [serverWarnings, setServerWarnings] = useState<string[]>([]);
  const [errorDetailMessage, setErrorDetailMessage] = useState<string | null>(
    null,
  );

  // Phase 4 states: Refinement, Quick Filters, Session Dismiss Avoid Pool, 8s Undo, Offline detection
  const [activeAdjustment, setActiveAdjustment] = useState<
    RefinementAdjustment | undefined
  >(undefined);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [keptPreviousNotice, setKeptPreviousNotice] = useState<boolean>(false);
  const [truncatedNotice, setTruncatedNotice] = useState<boolean>(false);
  const [quickFilters, setQuickFilters] = useState<ClientQuickFilters>(
    DEFAULT_QUICK_FILTERS,
  );
  const handleQuickFiltersChange = useCallback((next: ClientQuickFilters) => {
    startTransition(() => {
      setQuickFilters(next);
    });
  }, []);

  const [dismissUndoState, setDismissUndoState] =
    useState<DismissUndoBannerState | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const sessionDismissedIdsRef = useRef<Set<string>>(new Set());
  const sessionDismissedBooksRef = useRef<VerifiedBook[]>([]);
  const sessionVerifiedPoolRef = useRef<VerifiedBook[]>([
    ...MOCK_VERIFIED_BOOKS,
  ]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Theo dõi trạng thái mạng (Offline / Online)
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    };
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Đếm ngược 8 giây cho thanh Hoàn tác (Undo) khi bấm "Not interested"
  useEffect(() => {
    if (!dismissUndoState) return;
    const timer = window.setTimeout(() => {
      setDismissUndoState((prev) => {
        if (!prev || prev.secondsLeft <= 1) return null;
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [dismissUndoState]);

  const mergeIntoClientVerifiedPool = useCallback(
    (newBooks: readonly VerifiedBook[]) => {
      const map = new Map<string, VerifiedBook>();
      for (const b of sessionVerifiedPoolRef.current) {
        map.set(b.id, b);
      }
      for (const b of newBooks) {
        map.set(b.id, b);
      }
      sessionVerifiedPoolRef.current = Array.from(map.values());
    },
    [],
  );

  const executePipelineSearch = useCallback(
    async (
      prefsToRun: UserPreferences,
      options?: { outageFlag?: boolean; mockFlag?: boolean },
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Đảm bảo chủ đề quá dài (>160 ký tự) được cắt gọn an toàn trước khi gửi
      const safeTopic =
        prefsToRun.topic.trim().slice(0, 160) || 'Machine Learning';
      const normalizedPrefs: UserPreferences = {
        ...prefsToRun,
        topic: safeTopic,
      };

      const outageToUse = options?.outageFlag ?? false;
      const mockToUse = options?.mockFlag ?? false;

      setStatus('loading');
      setActiveStage('searching');
      setErrorDetailMessage(null);
      setStreamingBooks([]);
      setStreamingRejected([]);
      setStreamingFoundCount(0);
      setActiveAdjustment(undefined);
      setKeptPreviousNotice(false);
      setTruncatedNotice(false);
      setQuickFilters(DEFAULT_QUICK_FILTERS);

      const handleEvent = (event: PipelineSSEEvent) => {
        if (abortControllerRef.current !== controller) return;
        if (event.type === 'stage') {
          setActiveStage(event.stage);
          setStreamingFoundCount(event.stats.candidatesFound);
        } else if (event.type === 'candidate_found') {
          setStreamingFoundCount(event.stats.candidatesFound);
        } else if (event.type === 'book_verified') {
          if (sessionDismissedIdsRef.current.has(event.book.id)) return;
          mergeIntoClientVerifiedPool([event.book]);
          setStreamingBooks((prev) => {
            if (prev.some((b) => b.id === event.book.id)) return prev;
            return [...prev, event.book];
          });
        } else if (event.type === 'book_removed') {
          setStreamingRejected((prev) => [...prev, event.rejected]);
        } else if (event.type === 'done') {
          mergeIntoClientVerifiedPool(event.recommendationSet.books);
          const filteredBooks = event.recommendationSet.books.filter(
            (b) => !sessionDismissedIdsRef.current.has(b.id),
          );
          const cleanSet: RecommendationSet = {
            ...event.recommendationSet,
            books: filteredBooks.map((b, i) => ({
              ...b,
              roadmapStepOrder: i + 1,
            })),
          };
          setRecommendationSet(cleanSet);
          if (event.recommendationSet.stats.warnings?.length) {
            setServerWarnings(event.recommendationSet.stats.warnings);
          }
          setActiveStage('completed');
          setStatus(cleanSet.books.length > 0 ? 'success' : 'empty');
        }
      };

      try {
        const finalSet = await streamRecommendations(
          normalizedPrefs,
          { onEvent: handleEvent },
          {
            useMockMode: mockToUse,
            simulateOutage: outageToUse,
            signal: controller.signal,
          },
        );
        if (abortControllerRef.current !== controller) return;
        if (finalSet) {
          mergeIntoClientVerifiedPool(finalSet.books);
          const filteredBooks = finalSet.books.filter(
            (b) => !sessionDismissedIdsRef.current.has(b.id),
          );
          const cleanSet: RecommendationSet = {
            ...finalSet,
            books: filteredBooks.map((b, i) => ({
              ...b,
              roadmapStepOrder: i + 1,
            })),
          };
          setRecommendationSet(cleanSet);
          setActiveStage('completed');
          setStatus(cleanSet.books.length > 0 ? 'success' : 'empty');
        }
      } catch (err) {
        if (abortControllerRef.current !== controller) return;
        if ((err as Error)?.name === 'AbortError') {
          setStatus('cancelled');
          return;
        }
        if (err instanceof RateLimitError) {
          setErrorDetailMessage(err.getLocalizedMessage(locale));
          setStatus('rate_limited');
          return;
        }
        if (err instanceof SourceOutageError) {
          setErrorDetailMessage(err.getLocalizedMessage(locale));
          setStatus('error');
          return;
        }
        if (err instanceof ApiClientError) {
          setErrorDetailMessage(err.getLocalizedMessage(locale));
          setStatus('error');
          return;
        }
        setErrorDetailMessage(err instanceof Error ? err.message : null);
        setStatus('error');
      }
    },
    [locale, mergeIntoClientVerifiedPool],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const [serverInfo, initialServerSession] = await Promise.all([
        fetchServerStatus(controller.signal),
        fetchRecommendationById('rec_initial_sample', controller.signal),
      ]);
      setServerWarnings(serverInfo.warnings);
      if (initialServerSession && initialServerSession.books.length > 0) {
        mergeIntoClientVerifiedPool(initialServerSession.books);
      }
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [mergeIntoClientVerifiedPool]);

  const handleCancelStream = () => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
  };

  const handleUpdatePreferences = (next: UserPreferences) => {
    const cleanNext: UserPreferences = {
      ...next,
      topic: next.topic.slice(0, 160),
    };
    setPreferences(cleanNext);
    safeSetStorage(STORAGE_KEYS.preferences, cleanNext);
  };

  const handleLoadSampleData = () => {
    handleSelectTab('discover');
    setSimulateOutage(false);
    setUseMockMode(true);
    const samplePrefs: UserPreferences = {
      ...preferences,
      topic: preferences.topic.trim() || 'Machine Learning',
    };
    handleUpdatePreferences(samplePrefs);
    void executePipelineSearch(samplePrefs, {
      outageFlag: false,
      mockFlag: true,
    });
  };

  const handleTogglePipelineMode = () => {
    const nextMock = !useMockMode;
    setUseMockMode(nextMock);
    setSimulateOutage(false);
    void executePipelineSearch(preferences, {
      outageFlag: false,
      mockFlag: nextMock,
    });
  };

  const handleToggleSimulateOutage = () => {
    const nextOutage = !simulateOutage;
    setSimulateOutage(nextOutage);
    void executePipelineSearch(preferences, {
      outageFlag: nextOutage,
      mockFlag: useMockMode,
    });
  };

  // === PHASE 4: NATURAL-LANGUAGE REFINEMENT HANDLERS ===
  const applyLocalRefinementFallback = useCallback(
    (nextAdj: RefinementAdjustment, wasTrunc: boolean) => {
      setRecommendationSet((prev) => {
        if (!prev) return null;
        const reranked = applyRefinementAndDismissToPool({
          verifiedPool: sessionVerifiedPoolRef.current,
          previousBooks: prev.books,
          preferences: prev.preferences,
          adjustment: nextAdj,
          dismissedBookIds: sessionDismissedIdsRef.current,
          dismissedBooks: sessionDismissedBooksRef.current,
          maxResults: 4,
        });
        const keptPrev = reranked.length === 0;
        setKeptPreviousNotice(keptPrev);
        setTruncatedNotice(wasTrunc);
        setActiveAdjustment(nextAdj);
        const booksToUse = keptPrev ? prev.books : reranked;
        return {
          ...prev,
          books: booksToUse,
          activeAdjustment: nextAdj,
          stats: {
            ...prev.stats,
            candidatesVerified: booksToUse.length,
          },
        };
      });
    },
    [],
  );

  const handleApplyRefinementText = async (rawText: string) => {
    if (!recommendationSet) return;
    setIsRefining(true);
    try {
      const apiRes = await refineRecommendations(recommendationSet.id, {
        text: rawText,
        useMockMode,
      });
      if (apiRes) {
        const filtered = apiRes.recommendationSet.books.filter(
          (b) => !sessionDismissedIdsRef.current.has(b.id),
        );
        setRecommendationSet({
          ...apiRes.recommendationSet,
          books: filtered,
        });
        setActiveAdjustment(apiRes.adjustment);
        setKeptPreviousNotice(apiRes.keptPreviousBecauseEmpty);
        setTruncatedNotice(apiRes.wasTruncated);
        return;
      }
    } catch {
      // Fallback sang bộ tái xếp hạng cục bộ nếu offline
    } finally {
      setIsRefining(false);
    }

    const { wasTruncated } = sanitizeRefinementInput(rawText);
    const parsed = parseRefinementTextDeterministic(rawText);
    const merged = mergeRefinementAdjustments(activeAdjustment, parsed);
    applyLocalRefinementFallback(merged, wasTruncated);
  };

  const handleRemoveRefinementChip = async (chipId: string) => {
    if (!recommendationSet || !activeAdjustment) return;
    setIsRefining(true);
    try {
      const apiRes = await refineRecommendations(recommendationSet.id, {
        removeChipId: chipId,
        useMockMode,
      });
      if (apiRes) {
        setRecommendationSet(apiRes.recommendationSet);
        setActiveAdjustment(apiRes.adjustment);
        setKeptPreviousNotice(false);
        return;
      }
    } catch {
      // Fallback cục bộ bên dưới
    } finally {
      setIsRefining(false);
    }

    const nextAdj = removeChipFromAdjustment(activeAdjustment, chipId);
    applyLocalRefinementFallback(nextAdj, false);
  };

  const handleClearAllAdjustments = async () => {
    if (!recommendationSet) return;
    setIsRefining(true);
    try {
      const apiRes = await refineRecommendations(recommendationSet.id, {
        clearAllAdjustments: true,
        useMockMode,
      });
      if (apiRes) {
        setRecommendationSet(apiRes.recommendationSet);
        setActiveAdjustment(apiRes.adjustment);
        setKeptPreviousNotice(false);
        setTruncatedNotice(false);
        return;
      }
    } catch {
      // Fallback cục bộ
    } finally {
      setIsRefining(false);
    }

    const emptyAdj: RefinementAdjustment = {
      lengthDelta: 'none',
      practicalVsTheory: 'balanced',
      levelDelta: 'same',
      emphasisTopics: [],
      excludeAuthors: [],
      chips: [],
    };
    applyLocalRefinementFallback(emptyAdj, false);
  };

  // === PHASE 4: DISMISS ("NOT INTERESTED") WITH SESSION AVOID SIGNAL & 8s UNDO ===
  const handleDismissBook = async (bookId: string) => {
    const currentBooks = recommendationSet?.books ?? streamingBooks;
    const targetBook = currentBooks.find((b) => b.id === bookId);
    if (!targetBook) return;

    const previousSnapshot = [...currentBooks];
    sessionDismissedIdsRef.current.add(bookId);
    sessionDismissedBooksRef.current = [
      ...sessionDismissedBooksRef.current.filter((b) => b.id !== bookId),
      targetBook,
    ];

    let replacementFound: VerifiedBook | null = null;

    if (recommendationSet) {
      try {
        const apiRes = await dismissRecommendationBook(recommendationSet.id, {
          bookId,
          useMockMode,
        });
        if (apiRes) {
          replacementFound = apiRes.replacementBook ?? null;
          setRecommendationSet(apiRes.recommendationSet);
          if (apiRes.recommendationSet.books.length === 0) {
            setStatus('empty');
          }
          setDismissUndoState({
            dismissedBook: targetBook,
            replacementBook: replacementFound,
            previousBooksSnapshot: previousSnapshot,
            secondsLeft: 8,
          });
          return;
        }
      } catch {
        // Fallback cục bộ bên dưới
      }
    }

    const prevIds = new Set(previousSnapshot.map((b) => b.id));
    const reranked = applyRefinementAndDismissToPool({
      verifiedPool: sessionVerifiedPoolRef.current,
      previousBooks: previousSnapshot.filter((b) => b.id !== bookId),
      preferences,
      adjustment: activeAdjustment,
      dismissedBookIds: sessionDismissedIdsRef.current,
      dismissedBooks: sessionDismissedBooksRef.current,
      maxResults: Math.max(1, previousSnapshot.length),
    });

    replacementFound = reranked.find((b) => !prevIds.has(b.id)) ?? null;

    setRecommendationSet((prev) => {
      if (!prev) return null;
      if (reranked.length === 0) {
        setStatus('empty');
      }
      return {
        ...prev,
        books: reranked,
        stats: {
          ...prev.stats,
          candidatesVerified: reranked.length,
        },
      };
    });

    setDismissUndoState({
      dismissedBook: targetBook,
      replacementBook: replacementFound,
      previousBooksSnapshot: previousSnapshot,
      secondsLeft: 8,
    });
  };

  const handleUndoDismiss = async () => {
    if (!dismissUndoState) return;
    const { dismissedBook, previousBooksSnapshot } = dismissUndoState;

    sessionDismissedIdsRef.current.delete(dismissedBook.id);
    sessionDismissedBooksRef.current = sessionDismissedBooksRef.current.filter(
      (b) => b.id !== dismissedBook.id,
    );
    setDismissUndoState(null);

    if (recommendationSet) {
      try {
        const apiRes = await dismissRecommendationBook(recommendationSet.id, {
          bookId: dismissedBook.id,
          undo: true,
          useMockMode,
        });
        if (apiRes?.recommendationSet) {
          setRecommendationSet(apiRes.recommendationSet);
          setStatus('success');
          return;
        }
      } catch {
        // Fallback khôi phục từ snapshot
      }
    }

    setRecommendationSet((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        books: previousBooksSnapshot,
        stats: {
          ...prev.stats,
          candidatesVerified: previousBooksSnapshot.length,
        },
      };
    });
    setStatus('success');
  };

  // === PHASE 4: MY SHELF HANDLERS (NO DUPLICATES + REORDERING) ===
  const handleToggleSaveBook = (book: VerifiedBook) => {
    setSavedShelf((prev) => {
      const next = toggleShelfBookImmutable(prev, book);
      safeSetStorage(STORAGE_KEYS.savedShelf, next);
      return next;
    });
  };

  const handleReorderShelfBook = (
    bookId: string,
    direction: 'up' | 'down',
  ) => {
    setSavedShelf((prev) => {
      const next = reorderShelfItems(prev, bookId, direction);
      safeSetStorage(STORAGE_KEYS.savedShelf, next);
      return next;
    });
  };

  const rawDisplayedBooks = useMemo(
    () =>
      status === 'loading' || status === 'cancelled'
        ? streamingBooks.length > 0
          ? streamingBooks
          : (recommendationSet?.books ?? [])
        : (recommendationSet?.books ?? []),
    [status, streamingBooks, recommendationSet],
  );

  // Áp dụng Bộ lọc nhanh phía Client (Quick Filters: Length, Level, Language)
  const displayedBooks = useMemo(() => {
    return rawDisplayedBooks.filter((book) => {
      if (quickFilters.length !== 'any') {
        if (quickFilters.length === 'short' && book.pageCount > 260) {
          return false;
        }
        if (
          quickFilters.length === 'medium' &&
          (book.pageCount <= 250 || book.pageCount > 460)
        ) {
          return false;
        }
        if (quickFilters.length === 'deep' && book.pageCount <= 450) {
          return false;
        }
      }
      if (quickFilters.level !== 'all' && book.level !== quickFilters.level) {
        return false;
      }
      if (quickFilters.language === 'vi' && !book.vietnameseEdition.available) {
        return false;
      }
      if (quickFilters.language === 'en' && book.language !== 'en') {
        return false;
      }
      return true;
    });
  }, [rawDisplayedBooks, quickFilters]);

  const displayedRejected =
    status === 'loading' || status === 'cancelled'
      ? streamingRejected.length > 0
        ? streamingRejected
        : (recommendationSet?.rejectedCandidates ?? [])
      : (recommendationSet?.rejectedCandidates ?? []);

  const displayedStats =
    status === 'loading'
      ? {
          candidatesFound: streamingFoundCount,
          candidatesVerified: streamingBooks.length,
          candidatesRemoved: streamingRejected.length,
          currentStage: activeStage,
        }
      : (recommendationSet?.stats ?? {
          candidatesFound: streamingFoundCount,
          candidatesVerified: rawDisplayedBooks.length,
          candidatesRemoved: streamingRejected.length,
          currentStage: activeStage,
        });

  const savedBookIds = useMemo(
    () => new Set(savedShelf.map((item) => item.book.id)),
    [savedShelf],
  );

  return (
    <ErrorBoundary>
      <DashboardShell
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        savedCount={savedShelf.length}
        topicQuery={preferences.topic}
        onChangeTopicQuery={(val) =>
          handleUpdatePreferences({ ...preferences, topic: val })
        }
        onSubmitTopicSearch={() => {
          setSimulateOutage(false);
          void executePipelineSearch(preferences, {
            outageFlag: false,
            mockFlag: useMockMode,
          });
        }}
        useMockMode={useMockMode}
        onTogglePipelineMode={handleTogglePipelineMode}
        onLoadSampleData={handleLoadSampleData}
        isLoading={status === 'loading'}
      >
        {/* Screen-Reader Live Region for Streaming, Refinement, and Filter Updates (WCAG 4.1.3) */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'loading'
            ? `${t.states.loadingTitle} — ${displayedStats.candidatesVerified} verified`
            : `${displayedBooks.length} verified books displayed for ${preferences.topic}`}
        </div>

        {/* Offline Edge-Case Banner */}
        {isOffline && (
          <div
            role="status"
            className="bg-[#F9E2DF] dark:bg-[#2D1819] border-b border-[#C8433C]/30 px-6 py-2.5 text-xs font-semibold text-[#C8433C] dark:text-[#DF5A53] flex items-center gap-2 no-print"
          >
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.states.offlineBanner}</span>
          </div>
        )}

        {/* 8-Second Undo Banner after Dismissing a Book ("Not interested") */}
        {dismissUndoState && (
          <div
            role="status"
            aria-live="polite"
            className="bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md no-print"
          >
            <div className="text-xs sm:text-sm space-x-1.5">
              <span>
                {t.dismissBanner.dismissedPrefix}{' '}
                <strong>
                  &ldquo;{dismissUndoState.dismissedBook.title}&rdquo;
                </strong>
                .
              </span>
              {dismissUndoState.replacementBook ? (
                <span className="text-[#4ADE80] dark:text-[#146C43] font-semibold">
                  {t.dismissBanner.replacementAddedPrefix}{' '}
                  &ldquo;{dismissUndoState.replacementBook.title}&rdquo;
                </span>
              ) : (
                <span className="opacity-85">
                  {t.dismissBanner.noReplacementAvailable}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleUndoDismiss()}
              className="min-h-[36px] px-4 py-1.5 rounded-full bg-[#C8433C] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-95 cursor-pointer shrink-0"
            >
              <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {t.dismissBanner.undoBtnTemplate.replace(
                  '{sec}',
                  String(dismissUndoState.secondsLeft),
                )}
              </span>
            </button>
          </div>
        )}

        {/* TAB 1: DISCOVER (Two-Tone Split Layout from E-Book Dashboard Reference) */}
        {activeTab === 'discover' && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
            {/* LEFT PRIMARY CANVAS (7 Cols on XL — Warm Alabaster #F7F5EE) */}
            <div className="xl:col-span-7 p-4 sm:p-6 lg:p-8 space-y-6 bg-[#F7F5EE] dark:bg-[#11141C]">
              {/* Phase 8: 3-Step Skippable Onboarding Banner on First Visit */}
              <OnboardingBanner
                isOpen={showOnboarding}
                onDismiss={handleDismissOnboarding}
                onTryExampleTopic={(topicQuery) => {
                  const nextPrefs: UserPreferences = {
                    ...preferences,
                    topic: topicQuery,
                  };
                  handleUpdatePreferences(nextPrefs);
                  setSimulateOutage(false);
                  void executePipelineSearch(nextPrefs, {
                    outageFlag: false,
                    mockFlag: useMockMode,
                  });
                }}
              />

              {/* Editorial Greeting & Start Your Path Hero */}
              <section className="space-y-3">
                <p className="text-xs font-bold tracking-wider uppercase text-[#C8433C] dark:text-[#DF5A53]">
                  {t.hero.kicker}
                </p>
                <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#1A1D24] dark:text-[#F5F2EB] leading-[1.15] text-balance">
                  {t.hero.headline}
                </h1>
                <p className="text-sm sm:text-base text-[#524F49] dark:text-[#B8B2A6] leading-relaxed max-w-2xl">
                  {t.hero.subheadline}
                </p>

                <div className="pt-2">
                  <TopicPreferencesForm
                    preferences={preferences}
                    onChangePreferences={(nextPrefs) => {
                      handleUpdatePreferences(nextPrefs);
                      // Khi người dùng đổi ngôn ngữ ấn bản (vi/en/any) hoặc độ dài, tái xếp hạng tức thì trên bể sách đã xác thực
                      if (
                        recommendationSet &&
                        (nextPrefs.language !== preferences.language ||
                          nextPrefs.length !== preferences.length ||
                          nextPrefs.level !== preferences.level ||
                          nextPrefs.adventurousness !==
                            preferences.adventurousness)
                      ) {
                        const reranked = applyRefinementAndDismissToPool({
                          verifiedPool: sessionVerifiedPoolRef.current,
                          previousBooks: recommendationSet.books,
                          preferences: nextPrefs,
                          adjustment: activeAdjustment,
                          dismissedBookIds: sessionDismissedIdsRef.current,
                          dismissedBooks: sessionDismissedBooksRef.current,
                          maxResults: 4,
                        });
                        if (reranked.length > 0) {
                          setRecommendationSet({
                            ...recommendationSet,
                            preferences: nextPrefs,
                            books: reranked,
                          });
                        }
                      }
                    }}
                    onSubmitSearch={(prefs) => {
                      setSimulateOutage(false);
                      void executePipelineSearch(prefs, {
                        outageFlag: false,
                        mockFlag: useMockMode,
                      });
                    }}
                    onLoadSampleData={handleLoadSampleData}
                    isLoading={status === 'loading'}
                  />
                </div>
              </section>

              {/* Pipeline Status & Missing Secrets Notice Strip */}
              <div
                role="status"
                className="px-4 py-3 rounded-[18px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#EFECE3]/80 dark:bg-[#171B26] space-y-1.5 text-xs text-[#524F49] dark:text-[#B8B2A6]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4 text-[#C8433C] dark:text-[#DF5A53] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                      {useMockMode
                        ? t.hero.sampleDataBadge
                        : t.hero.livePipelineBadge}
                      :
                    </strong>{' '}
                    {useMockMode
                      ? t.hero.sampleDataNotice
                      : t.hero.livePipelineNotice}
                  </span>
                </div>
                {serverWarnings.length > 0 && (
                  <div className="flex items-start gap-2 pt-1 border-t border-[#E2DDD0] dark:border-[#282E3E] text-[11px]">
                    <Info
                      className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{serverWarnings.join(' · ')}</span>
                  </div>
                )}
              </div>

              {/* Phase 4: Natural-Language Refinement & Quick Filters Bar */}
              {rawDisplayedBooks.length > 0 && (
                <RefinementAndQuickFiltersBar
                  activeAdjustment={activeAdjustment}
                  isRefining={isRefining}
                  keptPreviousNotice={keptPreviousNotice}
                  truncatedNotice={truncatedNotice}
                  onApplyRefinementText={(txt) =>
                    void handleApplyRefinementText(txt)
                  }
                  onRemoveChip={(chipId) =>
                    void handleRemoveRefinementChip(chipId)
                  }
                  onClearAllAdjustments={() => void handleClearAllAdjustments()}
                  quickFilters={quickFilters}
                  onChangeQuickFilters={handleQuickFiltersChange}
                />
              )}

              {/* LOADING SKELETON */}
              {status === 'loading' && rawDisplayedBooks.length === 0 && (
                <section
                  aria-busy="true"
                  className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 space-y-4"
                >
                  <p className="text-sm font-bold text-[#C8433C] dark:text-[#DF5A53]">
                    {t.states.loadingTitle}
                  </p>
                  <p className="text-xs text-[#524F49] dark:text-[#B8B2A6]">
                    {t.states.loadingSubtitle}
                  </p>
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    {[1, 2].map((sk) => (
                      <div
                        key={sk}
                        className="h-44 rounded-2xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] p-4 flex gap-4"
                      >
                        <div className="w-28 h-full rounded-lg bg-[#EFECE3] dark:bg-[#171B26]" />
                        <div className="flex-1 space-y-3 py-2">
                          <div className="h-4 w-1/3 bg-[#EFECE3] dark:bg-[#171B26] rounded" />
                          <div className="h-6 w-3/4 bg-[#EFECE3] dark:bg-[#171B26] rounded" />
                          <div className="h-12 w-full bg-[#EFECE3] dark:bg-[#171B26] rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* RATE LIMIT 429 STATE */}
              {status === 'rate_limited' && (
                <section
                  role="alert"
                  className="rounded-[22px] border border-[#C8433C]/40 bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4"
                >
                  <Clock
                    className="w-10 h-10 text-[#C8433C] dark:text-[#DF5A53] mx-auto"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-serif-display font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                    {t.states.rateLimitTitle}
                  </h2>
                  <p className="text-sm text-[#524F49] dark:text-[#B8B2A6] max-w-xl mx-auto">
                    {errorDetailMessage || t.states.rateLimitMessage}
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{t.states.retryBtn}</span>
                  </button>
                </section>
              )}

              {/* FAIL-CLOSED ERROR 503 STATE */}
              {status === 'error' && (
                <section
                  role="alert"
                  className="rounded-[22px] border border-[#BE123C]/40 bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4"
                >
                  <AlertOctagon
                    className="w-10 h-10 text-[#BE123C] dark:text-[#FB7185] mx-auto"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-serif-display font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                    {t.states.errorTitle}
                  </h2>
                  <p className="text-sm text-[#524F49] dark:text-[#B8B2A6] max-w-xl mx-auto leading-relaxed">
                    {errorDetailMessage || t.states.errorOutageMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulateOutage(false);
                      void executePipelineSearch(preferences, {
                        outageFlag: false,
                        mockFlag: useMockMode,
                      });
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{t.states.retryBtn}</span>
                  </button>
                </section>
              )}

              {/* CANCELLED OR EMPTY STATE (with Friendly "Try an example" Topic Buttons) */}
              {(status === 'empty' ||
                (status === 'cancelled' && rawDisplayedBooks.length === 0)) && (
                <section className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4">
                  <BookOpenCheck
                    className="w-10 h-10 text-[#C8433C] dark:text-[#DF5A53] mx-auto"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-serif-display font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                    {status === 'cancelled'
                      ? t.states.cancelledMessage
                      : t.states.emptyTitle}
                  </h2>
                  <p className="text-sm text-[#524F49] dark:text-[#B8B2A6] max-w-lg mx-auto">
                    {t.states.emptyDescription}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {SUGGESTED_TOPICS.slice(0, 3).map((preset) => {
                      const label =
                        locale === 'vi' ? preset.labelVi : preset.labelEn;
                      const query =
                        locale === 'vi' ? preset.queryVi : preset.queryEn;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            sessionDismissedIdsRef.current.clear();
                            sessionDismissedBooksRef.current = [];
                            const nextPrefs: UserPreferences = {
                              ...preferences,
                              topic: query,
                            };
                            handleUpdatePreferences(nextPrefs);
                            void executePipelineSearch(nextPrefs, {
                              outageFlag: false,
                              mockFlag: useMockMode,
                            });
                          }}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#EFECE3] dark:bg-[#171B26] hover:bg-[#C8433C] hover:text-white text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sessionDismissedIdsRef.current.clear();
                      sessionDismissedBooksRef.current = [];
                      handleLoadSampleData();
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-sm font-semibold cursor-pointer"
                  >
                    {t.states.emptyActionBtn}
                  </button>
                </section>
              )}

              {/* QUICK FILTERS RETURNED ZERO MATCHES */}
              {rawDisplayedBooks.length > 0 && displayedBooks.length === 0 && (
                <section className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-3">
                  <h2 className="text-lg font-serif-display font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                    {t.quickFilters.noFilterMatchTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] max-w-md mx-auto">
                    {t.quickFilters.noFilterMatchDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleQuickFiltersChange(DEFAULT_QUICK_FILTERS)}
                    className="min-h-[42px] px-5 py-2 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold cursor-pointer"
                  >
                    {t.quickFilters.resetBtn}
                  </button>
                </section>
              )}

              {/* VERIFIED BOOK CARDS LIST */}
              {(status === 'success' ||
                status === 'loading' ||
                status === 'cancelled') &&
                displayedBooks.length > 0 && (
                  <section
                    aria-labelledby="verified-roadmap-heading"
                    className="space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2
                          id="verified-roadmap-heading"
                          className="font-serif-display text-2xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]"
                        >
                          {t.cards.sectionTitle}
                        </h2>
                        <p className="text-xs text-[#524F49] dark:text-[#B8B2A6]">
                          {t.cards.sectionSubtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('roadmap')}
                        className="min-h-[42px] px-4 py-1.5 rounded-full bg-[#C8433C] dark:bg-[#DF5A53] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs hover:opacity-92 transition-opacity cursor-pointer"
                      >
                        <Route className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.cards.roadmapTogglePath}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {displayedBooks.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          isSaved={savedBookIds.has(book.id)}
                          onToggleSave={handleToggleSaveBook}
                          onDismiss={(id) => void handleDismissBook(id)}
                          onOpenTrustDrawer={(b) => setSelectedBookForTrust(b)}
                        />
                      ))}
                    </div>
                  </section>
                )}
            </div>

            {/* RIGHT SECONDARY SPLIT PANEL (5 Cols on XL — Warm Cream #EFECE3 from E-Book Dashboard Reference) */}
            <aside
              aria-label={t.hero.spotlightHeader}
              className="xl:col-span-5 p-4 sm:p-6 lg:p-8 bg-[#EFECE3] dark:bg-[#171B26] border-t xl:border-t-0 xl:border-l border-[#E2DDD0] dark:border-[#282E3E] space-y-6"
            >
              {/* 1. Interactive 3D Hero Shelf */}
              <HeroShelf3D
                books={displayedBooks}
                rejectedCandidates={displayedRejected}
                pipelineStage={
                  status === 'loading'
                    ? activeStage
                    : displayedStats.currentStage
                }
                selectedBookId={selectedBookForTrust?.id ?? null}
                onSelectBook={(book) => setSelectedBookForTrust(book)}
              />

              {/* 2. 5-Stage Pipeline Tracker ("Schedule Reading" Pill Strip Style) */}
              <PipelineTracker
                stats={displayedStats}
                rejectedCandidates={displayedRejected}
                isSimulatingOutage={simulateOutage}
                onToggleSimulateOutage={handleToggleSimulateOutage}
                isStreaming={status === 'loading'}
                onCancelStream={handleCancelStream}
              />

              {/* 3. Session Roadmap Progress Timeline ("Reader Friends" Vertical Dashed Timeline Mapped to Session Roadmap Steps) */}
              <section className="rounded-[20px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-serif-display text-base font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                    {t.hero.sessionTimelineTitle}
                  </h2>
                  <span className="text-xs font-mono text-[#524F49] dark:text-[#B8B2A6]">
                    <strong className="text-[#C8433C] dark:text-[#DF5A53]">
                      {String(displayedBooks.length).padStart(2, '0')}
                    </strong>{' '}
                    {t.hero.shelfCaptionVerified}
                  </span>
                </div>

                {displayedBooks.length > 0 ? (
                  <ol className="relative border-l-2 border-dashed border-[#E2DDD0] dark:border-[#282E3E] ml-3 space-y-4 pl-5">
                    {displayedBooks.map((book, idx) => {
                      const savedEntry = savedShelf.find(
                        (s) => s.book.id === book.id,
                      );
                      return (
                        <li key={book.id} className="relative space-y-1">
                          <span
                            className={`w-3.5 h-3.5 rounded-full absolute -left-[27px] top-1 border-2 border-[#FDFCF9] dark:border-[#1E2330] ${
                              savedEntry
                                ? 'bg-[#146C43] dark:bg-[#4ADE80]'
                                : 'bg-[#C8433C] dark:bg-[#DF5A53]'
                            }`}
                            aria-hidden="true"
                          />
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-[#C8433C] dark:text-[#DF5A53]">
                              {t.cards.stepPrefix} 0{idx + 1}
                            </span>
                            {savedEntry && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C43] dark:text-[#4ADE80]">
                                <CheckCircle2
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                <span>
                                  {savedEntry.status === 'done'
                                    ? t.myShelf.statusDone
                                    : savedEntry.status === 'reading'
                                      ? t.myShelf.statusReading
                                      : t.myShelf.statusToRead}
                                </span>
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedBookForTrust(book)}
                            className="text-left font-serif-display text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB] hover:text-[#C8433C] dark:hover:text-[#DF5A53] transition-colors cursor-pointer block"
                          >
                            {book.title}
                          </button>
                          <p className="text-xs text-[#524F49] dark:text-[#B8B2A6] line-clamp-2">
                            {locale === 'vi'
                              ? book.roadmapStepReasonVi
                              : book.roadmapStepReasonEn}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
                    {t.hero.sessionTimelineEmpty}
                  </p>
                )}
              </section>
            </aside>
          </div>
        )}

        {/* TAB 2: MY ROADMAP — FULL-WIDTH 3D & 2D PATH STAGE PANEL (Phase 3B Override) */}
        {activeTab === 'roadmap' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <RoadmapPath3D
              books={displayedBooks}
              savedBookIds={savedBookIds}
              onToggleSave={handleToggleSaveBook}
              onOpenTrustDrawer={(b) => setSelectedBookForTrust(b)}
            />
          </div>
        )}

        {/* TAB 3: MY SHELF */}
        {activeTab === 'shelf' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <MyShelfView
              items={savedShelf}
              topicTitle={preferences.topic}
              onUpdateStatus={(bookId, newStatus) => {
                setSavedShelf((prev) => {
                  const next = prev.map((item) =>
                    item.book.id === bookId
                      ? { ...item, status: newStatus }
                      : item,
                  );
                  safeSetStorage(STORAGE_KEYS.savedShelf, next);
                  return next;
                });
              }}
              onReorderBook={handleReorderShelfBook}
              onRemoveBook={(bookId) => {
                setSavedShelf((prev) => {
                  const next = prev.filter((item) => item.book.id !== bookId);
                  safeSetStorage(STORAGE_KEYS.savedShelf, next);
                  return next;
                });
              }}
              onClearShelf={() => {
                setSavedShelf([]);
                safeSetStorage(STORAGE_KEYS.savedShelf, []);
              }}
              onOpenTrustDrawer={(b) => setSelectedBookForTrust(b)}
              onSwitchToDiscover={() => handleSelectTab('discover')}
            />
          </div>
        )}

        {/* TAB 4: VISION & ARCHITECTURE */}
        {activeTab === 'vision' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <VisionSection onTrySampleNow={handleLoadSampleData} />
          </div>
        )}

        {/* Phase 8 Full Editorial Footer with Links, Mailto Contact, and Language Switch */}
        <SiteFooter onReopenOnboarding={() => setShowOnboarding(true)} />

        {/* Trust Drawer Modal (Reference Screen 3 Book Detail Sheet) */}
        <TrustDrawer
          book={selectedBookForTrust}
          onClose={() => setSelectedBookForTrust(null)}
        />
      </DashboardShell>
    </ErrorBoundary>
  );
}
