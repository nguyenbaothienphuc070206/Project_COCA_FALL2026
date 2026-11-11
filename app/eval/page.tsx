'use client';

/**
 * Tính năng: Phòng Thí nghiệm Đánh giá Thực nghiệm (/eval — Evaluation Lab).
 * Trường hợp sử dụng:
 * - Tuyến ẩn khỏi thanh điều hướng chính, được bảo vệ bởi cờ môi trường EVAL_ENABLED.
 * - Chạy và so sánh 3 cấu hình:
 *   A = Chỉ Mô hình AI (Audit Mode: đo lỗi, không lọc)
 *   B = AI + Tìm kiếm Web (Audit Mode: đo lỗi, không lọc)
 *   C = AI + Tìm kiếm + Kiểm chứng Fail-Closed + MMR (ShelfPath)
 * - Tích hợp Biểu mẫu Chấm điểm Rubric (Relevance, Level Fit, Usefulness thang 1..5 kèm định nghĩa rõ ràng), Chế độ Ẩn danh (Blind Mode) xáo trộn thứ tự cột, bộ đếm lượt lưu sách trong phiên đánh giá, xuất/nhập JSON & CSV, và bảng Giới hạn Thực tế (Known Limitations) chỉ hiển thị số liệu đo được từ lần chạy thật.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  Globe,
  Moon,
  Play,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Upload,
} from 'lucide-react';
import {
  EvalConfigId,
  EvalPreparedProfile,
  EvalRunRecord,
  exportEvalRunToCsvWithBom,
} from '@/src/lib/evalMetrics';
import {
  ApiClientError,
  fetchEvalLabOverview,
  fetchEvalLabRunById,
  importEvalLabRun,
  recordEvalLabBookSave,
  setClientEvalAdminToken,
  startEvalLabRun,
  submitEvalLabRubric,
} from '@/src/lib/api';
import { useTranslation } from '@/src/i18n/useTranslation';

const EvalChartsPanel = dynamic(
  () =>
    import('@/src/components/EvalChartsPanel').then(
      (mod) => mod.EvalChartsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 flex items-center justify-center text-xs text-[#6E6A61] dark:text-[#8E887C]">
        Đang tải mô-đun biểu đồ Recharts...
      </div>
    ),
  },
);

const CONFIG_ORDER: readonly EvalConfigId[] = [
  'A_MODEL_ONLY',
  'B_MODEL_SEARCH',
  'C_FULL_VERIFIED',
];

/**
 * Tạo thứ tự xáo trộn tất định theo profileId khi bật Chế độ Ẩn danh (Blind Mode).
 */
function getBlindShuffledConfigs(profileId: string): EvalConfigId[] {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    hash = (hash * 31 + profileId.charCodeAt(i)) >>> 0;
  }
  const permutations: EvalConfigId[][] = [
    ['B_MODEL_SEARCH', 'C_FULL_VERIFIED', 'A_MODEL_ONLY'],
    ['C_FULL_VERIFIED', 'A_MODEL_ONLY', 'B_MODEL_SEARCH'],
    ['A_MODEL_ONLY', 'C_FULL_VERIFIED', 'B_MODEL_SEARCH'],
    ['C_FULL_VERIFIED', 'B_MODEL_SEARCH', 'A_MODEL_ONLY'],
  ];
  return permutations[hash % permutations.length]!;
}

export default function EvaluationLabPage() {
  const { locale, setLocale, isDark, toggleTheme } = useTranslation();
  const toggleLocale = () => setLocale(locale === 'vi' ? 'en' : 'vi');
  const theme = isDark ? 'dark' : 'light';

  const [evalEnabled, setEvalEnabled] = useState<boolean | null>(null);
  const [requiresAdminToken, setRequiresAdminToken] = useState<boolean>(false);
  const [adminTokenInput, setAdminTokenInput] = useState<string>('');
  const [modelName, setModelName] = useState<string>('gemini-3-flash-preview');
  const [profiles, setProfiles] = useState<EvalPreparedProfile[]>([]);
  const [runs, setRuns] = useState<EvalRunRecord[]>([]);
  const [activeRun, setActiveRun] = useState<EvalRunRecord | null>(null);
  const [isStartingRun, setIsStartingRun] = useState<boolean>(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [blindMode, setBlindMode] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // State biểu mẫu chấm điểm Rubric (1..5) cho từng cấu hình trên hồ sơ đang chọn
  const [rubricScores, setRubricScores] = useState<
    Record<
      EvalConfigId,
      { relevance: number; levelFit: number; usefulness: number; notes: string }
    >
  >({
    A_MODEL_ONLY: { relevance: 3, levelFit: 3, usefulness: 2, notes: '' },
    B_MODEL_SEARCH: { relevance: 4, levelFit: 4, usefulness: 3, notes: '' },
    C_FULL_VERIFIED: { relevance: 5, levelFit: 5, usefulness: 5, notes: '' },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadEvalInitialData = useCallback(async () => {
    try {
      const data = await fetchEvalLabOverview();
      setRequiresAdminToken(false);
      setEvalEnabled(Boolean(data.evalEnabled));
      setModelName(data.modelName || 'gemini-3-flash-preview');
      setProfiles(data.profiles || []);
      if (data.profiles?.length > 0) {
        setSelectedProfileId((prev) => prev || data.profiles[0]!.id);
      }
      setRuns(data.runs || []);
      if (data.runs && data.runs.length > 0) {
        setActiveRun(data.runs[0]!);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'EVAL_UNAUTHORIZED') {
        setRequiresAdminToken(true);
        setEvalEnabled(true);
      } else {
        setEvalEnabled(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvalInitialData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvalInitialData]);

  // Theo dõi tiến độ khi activeRun.status === 'running'
  useEffect(() => {
    if (!activeRun || activeRun.status !== 'running') return;
    const timer = window.setInterval(async () => {
      try {
        const updated = await fetchEvalLabRunById(activeRun.id);
        setActiveRun(updated);
        if (updated.status !== 'running') {
          setRuns((prev) => {
            const exists = prev.some((r) => r.id === updated.id);
            if (exists) {
              return prev.map((r) => (r.id === updated.id ? updated : r));
            }
            return [updated, ...prev];
          });
        }
      } catch {
        // Ignore transient poll errors
      }
    }, 350);

    return () => window.clearInterval(timer);
  }, [activeRun]);

  const handleStartEvaluationRun = async (subsetOnly: boolean) => {
    setIsStartingRun(true);
    setStatusBanner(null);
    try {
      const targetIds = subsetOnly
        ? profiles.slice(0, 5).map((p) => p.id)
        : profiles.map((p) => p.id);

      const started = await startEvalLabRun({
        profileIds: targetIds,
        mode: 'audit_deterministic',
      });
      setActiveRun(started);
      setRuns((prev) => [started, ...prev]);
      setStatusBanner(
        locale === 'vi'
          ? `Đã khởi chạy phiên đánh giá ${started.id} trên ${targetIds.length} hồ sơ mẫu (Cấu hình A, B, C).`
          : `Started evaluation run ${started.id} across ${targetIds.length} prepared profiles (Configs A, B, C).`,
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setStatusBanner(err.getLocalizedMessage(locale));
      }
    } finally {
      setIsStartingRun(false);
    }
  };

  const handleSubmitRubric = async (configId: EvalConfigId) => {
    if (!activeRun || !selectedProfileId) return;
    const score = rubricScores[configId];
    try {
      const updated = await submitEvalLabRubric(activeRun.id, {
        profileId: selectedProfileId,
        configId,
        wasBlindMode: blindMode,
        relevance: score.relevance,
        levelFit: score.levelFit,
        usefulness: score.usefulness,
        notes: score.notes,
      });
      setActiveRun(updated);
      setStatusBanner(
        locale === 'vi'
          ? `Đã ghi nhận phiếu chấm Rubric (${blindMode ? 'Chế độ Ẩn danh' : configId}) cho hồ sơ ${selectedProfileId}.`
          : `Recorded Rubric rating (${blindMode ? 'Blind Mode' : configId}) for profile ${selectedProfileId}.`,
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setStatusBanner(err.getLocalizedMessage(locale));
      }
    }
  };

  const handleRecordEvalBookSave = async (
    configId: EvalConfigId,
    bookId: string,
  ) => {
    if (!activeRun) return;
    try {
      const updated = await recordEvalLabBookSave(activeRun.id, {
        configId,
        bookId,
      });
      setActiveRun(updated);
    } catch {
      // Ignore save counter error
    }
  };

  const handleDownloadJson = () => {
    if (!activeRun) return;
    const blob = new Blob([JSON.stringify(activeRun, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelfpath-eval-${activeRun.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!activeRun) return;
    const csvContent = exportEvalRunToCsvWithBom(activeRun);
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelfpath-eval-${activeRun.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as EvalRunRecord;
      const data = await importEvalLabRun(parsed);
      setActiveRun(data.run);
      setRuns((prev) => [
        data.run,
        ...prev.filter((r) => r.id !== data.run.id),
      ]);
      setStatusBanner(
        locale === 'vi'
          ? `Đã nhập thành công phiên đánh giá ${data.run.id} (${data.run.results.length} bản ghi).`
          : `Successfully imported evaluation run ${data.run.id} (${data.run.results.length} records).`,
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setStatusBanner(err.getLocalizedMessage(locale));
      } else {
        setStatusBanner(
          locale === 'vi'
            ? 'Không thể đọc tệp JSON. Vui lòng kiểm tra định dạng tệp.'
            : 'Failed to parse JSON file.',
        );
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayedConfigsForProfile = useMemo(() => {
    if (!selectedProfileId) return [...CONFIG_ORDER];
    return blindMode
      ? getBlindShuffledConfigs(selectedProfileId)
      : [...CONFIG_ORDER];
  }, [blindMode, selectedProfileId]);

  const currentProfileResults = useMemo(() => {
    if (!activeRun || !selectedProfileId) return [];
    return activeRun.results.filter((r) => r.profileId === selectedProfileId);
  }, [activeRun, selectedProfileId]);

  if (requiresAdminToken) {
    return (
      <div className="min-h-screen bg-[#E9E6DD] dark:bg-[#0B0D13] text-[#1A1D24] dark:text-[#F5F2EB] flex items-center justify-center p-6">
        <main className="max-w-lg w-full rounded-[24px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-[#C8433C] mx-auto" aria-hidden="true" />
          <h1 className="font-serif-display text-2xl font-bold">
            {locale === 'vi'
              ? 'Yêu cầu Mã Quản trị viên (EVAL_ADMIN_TOKEN)'
              : 'Admin Token Required (EVAL_ADMIN_TOKEN)'}
          </h1>
          <p className="text-sm text-[#524F49] dark:text-[#B8B2A6]">
            {locale === 'vi'
              ? 'Tuyến /eval được bảo vệ bằng EVAL_ADMIN_TOKEN (so sánh thời gian hằng số). Vui lòng nhập mã quản trị viên để tiếp tục.'
              : 'The /eval route is protected by EVAL_ADMIN_TOKEN (constant-time verification). Enter your admin token to continue.'}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setClientEvalAdminToken(adminTokenInput);
              void loadEvalInitialData();
            }}
            className="space-y-3"
          >
            <label htmlFor="eval-admin-token-input" className="sr-only">
              EVAL_ADMIN_TOKEN
            </label>
            <input
              id="eval-admin-token-input"
              type="password"
              value={adminTokenInput}
              onChange={(e) => setAdminTokenInput(e.target.value)}
              placeholder="EVAL_ADMIN_TOKEN"
              className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#141822] text-sm"
            />
            <div className="flex items-center justify-center gap-3">
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C8433C] text-white text-xs font-semibold"
              >
                {locale === 'vi' ? 'Mở khóa Phòng thí nghiệm' : 'Unlock Evaluation Lab'}
              </button>
              <Link
                href="/"
                className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{locale === 'vi' ? 'Quay về' : 'Back'}</span>
              </Link>
            </div>
          </form>
        </main>
      </div>
    );
  }

  if (evalEnabled === false) {
    return (
      <div className="min-h-screen bg-[#E9E6DD] dark:bg-[#0B0D13] text-[#1A1D24] dark:text-[#F5F2EB] flex items-center justify-center p-6">
        <main className="max-w-lg w-full rounded-[24px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-[#C8433C] mx-auto" aria-hidden="true" />
          <h1 className="font-serif-display text-2xl font-bold">
            {locale === 'vi'
              ? 'Phòng Thí nghiệm Đánh giá đang tắt (EVAL_ENABLED=false)'
              : 'Evaluation Lab is Disabled (EVAL_ENABLED=false)'}
          </h1>
          <p className="text-sm text-[#524F49] dark:text-[#B8B2A6]">
            {locale === 'vi'
              ? 'Tuyến /eval được bảo vệ bởi biến môi trường EVAL_ENABLED. Đặt EVAL_ENABLED="true" trong cấu hình máy chủ để mở công cụ đánh giá thực nghiệm.'
              : 'The /eval route is guarded by EVAL_ENABLED. Set EVAL_ENABLED="true" in server environment to access the Evaluation Lab.'}
          </p>
          <Link
            href="/"
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>
              {locale === 'vi' ? 'Quay về trang chính ShelfPath' : 'Back to ShelfPath'}
            </span>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9E6DD] dark:bg-[#0B0D13] text-[#1A1D24] dark:text-[#F5F2EB] p-3 sm:p-5 lg:p-6">
      {/* Skip Link cho điều hướng bàn phím WCAG 2.2 AA */}
      <a
        href="#eval-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-[#C8433C] focus:text-white focus:text-xs focus:font-bold focus:shadow-lg"
      >
        {locale === 'vi'
          ? 'Bỏ qua điều hướng để tới nội dung Phòng thí nghiệm'
          : 'Skip to Evaluation Lab main content'}
      </a>

      <div className="max-w-[1540px] mx-auto rounded-[28px] bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] shadow-xl overflow-hidden">
        {/* TOP HEADER */}
        <header className="px-6 py-4 border-b border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#171B26] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="min-h-[44px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#1E2330] text-xs font-semibold inline-flex items-center gap-2 hover:border-[#C8433C] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>
                {locale === 'vi' ? 'Về Ứng dụng chính' : 'Back to Main App'}
              </span>
            </Link>

            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] flex items-center justify-center">
                <FlaskConical className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-serif-display text-lg sm:text-xl font-bold leading-tight">
                  {locale === 'vi'
                    ? 'ShelfPath Evaluation Lab — Đánh giá Thực nghiệm (A / B / C)'
                    : 'ShelfPath Evaluation Lab — Empirical Benchmark (A / B / C)'}
                </h1>
                <p className="text-[11px] text-[#6E6A61] dark:text-[#8E887C]">
                  {locale === 'vi'
                    ? `Tuyến nội bộ (/eval · EVAL_ENABLED=true) · Model: ${modelName} · ${profiles.length} hồ sơ mẫu chuẩn bị sẵn`
                    : `Internal route (/eval · EVAL_ENABLED=true) · Model: ${modelName} · ${profiles.length} prepared sample profiles`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleLocale}
              className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#1E2330] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'vi' ? 'Tiếng Việt · EN' : 'English · VI'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#1E2330] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              )}
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </header>

        <main id="eval-main-content" className="p-6 lg:p-8 space-y-8">
          {/* ARIA-LIVE STATUS REGION */}
          <div aria-live="polite" className="sr-only">
            {statusBanner ||
              (activeRun
                ? `Run ${activeRun.id} status ${activeRun.status}, step ${activeRun.progress.completedSteps} of ${activeRun.progress.totalSteps}`
                : 'No evaluation run started yet')}
          </div>

          {statusBanner && (
            <div
              role="status"
              className="px-4 py-3 rounded-2xl border border-[#146C43]/30 bg-[#DCFCE7]/60 dark:bg-[#0D2818] text-xs font-semibold text-[#146C43] dark:text-[#4ADE80] flex items-center justify-between gap-3"
            >
              <span>{statusBanner}</span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="min-h-[36px] px-2.5 rounded-lg hover:bg-black/5 text-[11px]"
              >
                ×
              </button>
            </div>
          )}

          {/* SECTION 1: RUN CONTROLS + EXPORT / IMPORT + PREPARED PROFILES */}
          <section className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] text-[11px] font-bold uppercase tracking-wider">
                  {locale === 'vi'
                    ? 'Hồ sơ mẫu chuẩn bị sẵn (Không phải dữ liệu người dùng thật)'
                    : 'Prepared Sample Profiles (Not Real User Data)'}
                </span>
                <h2 className="font-serif-display text-2xl font-bold text-[#1A1D24] dark:text-[#F5F2EB] pt-1">
                  {locale === 'vi'
                    ? 'Thực thi & Đối sánh 3 Cấu hình trên cùng Tập Hồ sơ'
                    : 'Run & Compare Three Configurations on Identical Prepared Profiles'}
                </h2>
                <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                  {locale === 'vi'
                    ? 'Với Cấu hình A (Chỉ AI) và Cấu hình B (AI + Tìm kiếm Web), bộ kiểm chứng chạy ở Chế độ Kiểm toán (Audit Mode: đo tỷ lệ lỗi và mã nguyên nhân nhưng không lọc bỏ sách) để so sánh trực tiếp với Cấu hình C (ShelfPath có lọc Fail-Closed + MMR).'
                    : 'For Config A (AI Only) and Config B (AI + Web Search), the verifier runs in AUDIT MODE ONLY (measures failure rate and reason codes without filtering) so verification failure rates are directly comparable against Config C (Fail-Closed + MMR).'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  data-testid="eval-run-all-btn"
                  disabled={isStartingRun || activeRun?.status === 'running'}
                  onClick={() => void handleStartEvaluationRun(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C8433C] hover:bg-[#B23831] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {locale === 'vi'
                      ? `Chạy toàn bộ ${profiles.length} Hồ sơ (A, B, C)`
                      : `Run All ${profiles.length} Profiles (A, B, C)`}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="eval-run-quick-btn"
                  disabled={isStartingRun || activeRun?.status === 'running'}
                  onClick={() => void handleStartEvaluationRun(true)}
                  className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {locale === 'vi'
                      ? 'Chạy nhanh 5 Hồ sơ tiêu biểu'
                      : 'Quick Run (5 Profiles)'}
                  </span>
                </button>

                {activeRun && (
                  <>
                    <button
                      type="button"
                      data-testid="eval-export-json-btn"
                      onClick={handleDownloadJson}
                      className="min-h-[44px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#C8433C] cursor-pointer"
                    >
                      <FileJson className="w-3.5 h-3.5 text-[#C8433C]" aria-hidden="true" />
                      <span>{locale === 'vi' ? 'Tải JSON' : 'Export JSON'}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="eval-export-csv-btn"
                      onClick={handleDownloadCsv}
                      className="min-h-[44px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#C8433C] cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#146C43]" aria-hidden="true" />
                      <span>{locale === 'vi' ? 'Tải CSV' : 'Export CSV'}</span>
                    </button>
                  </>
                )}

                <label className="min-h-[44px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#C8433C] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {locale === 'vi' ? 'Nhập JSON phiên cũ' : 'Import Run JSON'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => void handleImportJsonFile(e)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Danh sách 14 Hồ sơ mẫu chuẩn bị sẵn */}
            <details className="pt-2 border-t border-[#E2DDD0] dark:border-[#282E3E]">
              <summary className="cursor-pointer text-xs font-bold text-[#1A1D24] dark:text-[#F5F2EB] py-1">
                {locale === 'vi'
                  ? `Xem danh sách ${profiles.length} Hồ sơ mẫu đã chuẩn bị (/server/eval/profiles.json)`
                  : `View all ${profiles.length} Prepared Sample Profiles (/server/eval/profiles.json)`}
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-3">
                {profiles.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-3 rounded-xl border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                        {prof.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EFECE3] dark:bg-[#1E2330] text-[10px] font-semibold">
                        {prof.sampleNotice}
                      </span>
                    </div>
                    <p className="text-[#524F49] dark:text-[#B8B2A6] font-medium">
                      {locale === 'vi' ? prof.labelVi : prof.labelEn}
                    </p>
                    <p className="text-[11px] text-[#6E6A61] dark:text-[#8E887C]">
                      Topic: “{prof.topic}” · Level: {prof.level} · Length:{' '}
                      {prof.length} · Lang: {prof.language} · MMR:{' '}
                      {prof.adventurousness}%
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          {/* SECTION 2: AGGREGATE METRICS TABLE & RECHARTS (ONLY WHEN A RUN EXISTS) */}
          {!activeRun ? (
            <section
              data-testid="eval-empty-state"
              className="rounded-[22px] border border-dashed border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-10 text-center space-y-4"
            >
              <FlaskConical
                className="w-10 h-10 text-[#C8433C] mx-auto"
                aria-hidden="true"
              />
              <h2 className="font-serif-display text-xl font-bold">
                {locale === 'vi'
                  ? 'Chưa có phiên chạy đánh giá nào trong bộ nhớ'
                  : 'No Evaluation Run Executed Yet'}
              </h2>
              <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] max-w-xl mx-auto">
                {locale === 'vi'
                  ? 'Bấm "Chạy toàn bộ 14 Hồ sơ (A, B, C)" hoặc "Chạy nhanh 5 Hồ sơ tiêu biểu" ở trên để đo lường tỷ lệ lỗi kiểm chứng, khoảng cách đa dạng nhúng D(L), độ trễ và trích xuất bảng Giới hạn Thực tế.'
                  : 'Click "Run All 14 Profiles (A, B, C)" or "Quick Run (5 Profiles)" above to measure verification failure rates, pairwise embedding diversity D(L), latency, and populate the Known Limitations panel from real run data.'}
              </p>
            </section>
          ) : (
            <>
              {/* AGGREGATE SUMMARY TABLE */}
              <section
                aria-label="Configuration Aggregate Table"
                className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif-display text-xl font-bold">
                      {locale === 'vi'
                        ? `Bảng Tổng hợp Thực nghiệm — Phiên ${activeRun.id}`
                        : `Aggregate Empirical Summary — Run ${activeRun.id}`}
                    </h2>
                    <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
                      {locale === 'vi'
                        ? `Trạng thái: ${activeRun.status.toUpperCase()} · Tiến độ: ${activeRun.progress.completedSteps}/${activeRun.progress.totalSteps} bước · Model: ${activeRun.modelName}`
                        : `Status: ${activeRun.status.toUpperCase()} · Progress: ${activeRun.progress.completedSteps}/${activeRun.progress.totalSteps} steps · Model: ${activeRun.modelName}`}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E2DDD0] dark:border-[#282E3E] text-[#6E6A61] dark:text-[#8E887C]">
                        <th className="py-3 pr-4 font-bold">
                          {locale === 'vi' ? 'Cấu hình' : 'Configuration'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi' ? 'Số hồ sơ' : 'Profiles'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi'
                            ? 'Ứng viên / Xác thực'
                            : 'Produced / Verified'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi'
                            ? 'Lỗi Audit (%)'
                            : 'Audit Failure (%)'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi'
                            ? 'Sách lỗi hiển thị (%)'
                            : 'Displayed Unverified (%)'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi'
                            ? 'Độ đa dạng D(L)'
                            : 'Diversity D(L)'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi'
                            ? 'Độ trễ (Cuốn 1 / Đầy đủ / Tinh chỉnh)'
                            : 'Latency (First / Full / Refine)'}
                        </th>
                        <th className="py-3 px-3 font-bold">
                          {locale === 'vi'
                            ? 'Điểm Rubric TB (n)'
                            : 'Mean Rubric (n)'}
                        </th>
                        <th className="py-3 pl-3 font-bold">
                          {locale === 'vi'
                            ? 'Lượt lưu (Eval)'
                            : 'Eval Saves'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD0] dark:divide-[#282E3E]">
                      {activeRun.aggregates.map((agg) => (
                        <tr key={agg.configId}>
                          <td className="py-3.5 pr-4 font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                            {locale === 'vi'
                              ? agg.configNameVi
                              : agg.configNameEn}
                          </td>
                          <td className="py-3.5 px-3">
                            {agg.profilesEvaluated}
                          </td>
                          <td className="py-3.5 px-3">
                            {agg.totalCandidatesProduced} /{' '}
                            <span className="text-[#146C43] dark:text-[#4ADE80] font-semibold">
                              {agg.totalAuditVerified}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold">
                            {agg.meanAuditFailureRatePercent}%
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                agg.meanDisplayedUnverifiedRatePercent === 0
                                  ? 'bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80]'
                                  : 'bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53]'
                              }`}
                            >
                              {agg.meanDisplayedUnverifiedRatePercent}%
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-semibold">
                            {agg.meanListDiversity.toFixed(4)}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            {agg.meanTimeToFirstBookMs}ms /{' '}
                            {agg.meanFullRoadmapMs}ms /{' '}
                            {agg.meanRefinementResponseMs}ms
                          </td>
                          <td className="py-3.5 px-3">
                            {agg.rubricStats.n > 0 ? (
                              <span>
                                R:{agg.rubricStats.meanRelevance} · L:
                                {agg.rubricStats.meanLevelFit} · U:
                                {agg.rubricStats.meanUsefulness}{' '}
                                <strong>(n={agg.rubricStats.n})</strong>
                              </span>
                            ) : (
                              <span className="text-[#6E6A61] dark:text-[#8E887C]">
                                n=0
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pl-3 font-bold">
                            {agg.totalSavesInEvalSession}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* RECHARTS VISUALIZATION PANEL */}
              <EvalChartsPanel
                aggregates={activeRun.aggregates}
                locale={locale}
              />

              {/* SECTION 3: TESTER RUBRIC FORM & BLIND MODE SIDE-BY-SIDE COMPARISON */}
              <section
                aria-label="Tester Rubric & Blind Mode Evaluation"
                className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2DDD0] dark:border-[#282E3E] pb-4">
                  <div>
                    <h2 className="font-serif-display text-xl font-bold">
                      {locale === 'vi'
                        ? 'Biểu mẫu Chấm điểm của Người Kiểm thử (Tester Rubric 1–5 & Blind Mode)'
                        : 'Tester Rubric Form (1–5 Scale & Blind Mode Comparison)'}
                    </h2>
                    <p className="text-xs text-[#524F49] dark:text-[#B8B2A6]">
                      {locale === 'vi'
                        ? 'Đếm lượt lưu sách chỉ trong phiên đánh giá (không thu thập dữ liệu cá nhân, không gắn analytics vào ứng dụng chính).'
                        : 'Counts book saves in evaluation sessions only (no personal data, no analytics in the normal application).'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="eval-profile-selector"
                      className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6]"
                    >
                      {locale === 'vi' ? 'Chọn hồ sơ:' : 'Select Profile:'}
                    </label>
                    <select
                      id="eval-profile-selector"
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] text-xs font-semibold"
                    >
                      {profiles
                        .filter((p) => activeRun.profileIds.includes(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} — {locale === 'vi' ? p.labelVi : p.labelEn}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      data-testid="eval-blind-mode-toggle"
                      onClick={() => setBlindMode((prev) => !prev)}
                      aria-pressed={blindMode}
                      className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                        blindMode
                          ? 'bg-[#C8433C] text-white'
                          : 'border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] text-[#1A1D24] dark:text-[#F5F2EB]'
                      }`}
                    >
                      {blindMode ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {blindMode
                          ? locale === 'vi'
                            ? 'Chế độ Ẩn danh: ĐANG BẬT (Đã ẩn nhãn & xáo trộn cột)'
                            : 'Blind Mode: ON (Labels Hidden & Order Randomized)'
                          : locale === 'vi'
                            ? 'Bật Chế độ Ẩn danh (Blind Mode)'
                            : 'Enable Blind Mode'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Định nghĩa thang đo Rubric 1..5 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#F7F5EE] dark:bg-[#171B26] p-4 rounded-2xl border border-[#E2DDD0] dark:border-[#282E3E]">
                  <div>
                    <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                      {locale === 'vi'
                        ? '1. Độ liên quan (Relevance 1–5):'
                        : '1. Relevance (1–5 Scale):'}
                    </strong>
                    <p className="text-[#524F49] dark:text-[#B8B2A6] mt-0.5">
                      {locale === 'vi'
                        ? '1 = Lạc chủ đề hoặc sách bịa; 3 = Đúng lĩnh vực nhưng chung chung; 5 = Bám sát chính xác chủ đề và mục tiêu tự học.'
                        : '1 = Off-topic or hallucinated; 3 = Broadly related; 5 = Directly targets the exact learning topic and subfields.'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                      {locale === 'vi'
                        ? '2. Độ khớp trình độ (Level Fit 1–5):'
                        : '2. Level Fit (1–5 Scale):'}
                    </strong>
                    <p className="text-[#524F49] dark:text-[#B8B2A6] mt-0.5">
                      {locale === 'vi'
                        ? '1 = Quá khó hoặc quá sơ sài so với hồ sơ; 3 = Tương đối vừa sức; 5 = Trình tự từ dễ đến nâng cao khớp hoàn hảo với người học.'
                        : '1 = Inappropriate difficulty or page length; 3 = Acceptable match; 5 = Ideal pedagogical progression for the target level.'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                      {locale === 'vi'
                        ? '3. Tính hữu ích của lộ trình (Usefulness 1–5):'
                        : '3. Roadmap Usefulness (1–5 Scale):'}
                    </strong>
                    <p className="text-[#524F49] dark:text-[#B8B2A6] mt-0.5">
                      {locale === 'vi'
                        ? '1 = Không thể dùng để học thật; 3 = Có vài cuốn đáng đọc; 5 = Giải thích rõ vì sao đọc cuốn 1 trước cuốn 2, có nguồn xác thực.'
                        : '1 = Unusable roadmap; 3 = Moderately helpful list; 5 = Actionable step-by-step sequence with verified catalog links.'}
                    </p>
                  </div>
                </div>

                {/* 3 Cột So sánh Cấu hình */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {displayedConfigsForProfile.map((cfgId, colIdx) => {
                    const resItem = currentProfileResults.find(
                      (r) => r.configId === cfgId,
                    );
                    if (!resItem) return null;

                    const displayHeader = blindMode
                      ? locale === 'vi'
                        ? `Phương án Ẩn danh #${colIdx + 1}`
                        : `Blind Option #${colIdx + 1}`
                      : cfgId === 'A_MODEL_ONLY'
                        ? 'Config A: AI Model Only'
                        : cfgId === 'B_MODEL_SEARCH'
                          ? 'Config B: AI + Web Search'
                          : 'Config C: ShelfPath (Verified + MMR)';

                    return (
                      <div
                        key={cfgId}
                        className="rounded-2xl border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#171B26] p-4 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-[#E2DDD0] dark:border-[#282E3E] pb-2.5">
                            <h3 className="font-serif-display font-bold text-base">
                              {displayHeader}
                            </h3>
                            {!blindMode && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFECE3] dark:bg-[#1E2330]">
                                D(L) = {resItem.listDiversity.toFixed(3)}
                              </span>
                            )}
                          </div>

                          {/* Danh sách sách hiển thị của cấu hình */}
                          <ul className="space-y-2.5">
                            {resItem.displayedBooks.map((b, bIdx) => {
                              const saveKey = `${cfgId}::${b.bookId}`;
                              const saveCount =
                                activeRun.savesByBookKey[saveKey] ?? 0;
                              return (
                                <li
                                  key={b.bookId}
                                  className="p-3 rounded-xl bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E] text-xs space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                                      #{bIdx + 1}. {b.title}
                                    </span>
                                    {!blindMode && (
                                      <span
                                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                          b.passedAuditVerification
                                            ? 'bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80]'
                                            : 'bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53]'
                                        }`}
                                      >
                                        {b.passedAuditVerification ? (
                                          <CheckCircle2
                                            className="w-3 h-3"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <AlertTriangle
                                            className="w-3 h-3"
                                            aria-hidden="true"
                                          />
                                        )}
                                        <span>
                                          {b.passedAuditVerification
                                            ? 'Verified'
                                            : b.auditFailureReasonCode}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#6E6A61] dark:text-[#8E887C]">
                                    {b.author}
                                  </p>
                                  <div className="flex items-center justify-between pt-1">
                                    {b.sourceUrl ? (
                                      <a
                                        href={b.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-semibold text-[#C8433C] hover:underline"
                                      >
                                        {locale === 'vi'
                                          ? 'Nguồn danh mục ↗'
                                          : 'Catalog record ↗'}
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-[#6E6A61]">
                                        —
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleRecordEvalBookSave(
                                          cfgId,
                                          b.bookId,
                                        )
                                      }
                                      className="min-h-[36px] px-2.5 py-1 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] hover:border-[#C8433C] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <BookmarkPlus
                                        className="w-3 h-3 text-[#C8433C]"
                                        aria-hidden="true"
                                      />
                                      <span>
                                        {locale === 'vi'
                                          ? `Lưu (${saveCount})`
                                          : `Save (${saveCount})`}
                                      </span>
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {/* Form chấm Rubric 1..5 cho cột này */}
                        <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] space-y-2.5 text-xs">
                          <div className="grid grid-cols-3 gap-2">
                            <label className="space-y-1">
                              <span className="block text-[11px] font-semibold">
                                Relevance (1-5)
                              </span>
                              <select
                                value={rubricScores[cfgId].relevance}
                                onChange={(e) =>
                                  setRubricScores((prev) => ({
                                    ...prev,
                                    [cfgId]: {
                                      ...prev[cfgId],
                                      relevance: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="min-h-[40px] w-full px-2 rounded-lg border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]"
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-1">
                              <span className="block text-[11px] font-semibold">
                                Level Fit (1-5)
                              </span>
                              <select
                                value={rubricScores[cfgId].levelFit}
                                onChange={(e) =>
                                  setRubricScores((prev) => ({
                                    ...prev,
                                    [cfgId]: {
                                      ...prev[cfgId],
                                      levelFit: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="min-h-[40px] w-full px-2 rounded-lg border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]"
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-1">
                              <span className="block text-[11px] font-semibold">
                                Usefulness (1-5)
                              </span>
                              <select
                                value={rubricScores[cfgId].usefulness}
                                onChange={(e) =>
                                  setRubricScores((prev) => ({
                                    ...prev,
                                    [cfgId]: {
                                      ...prev[cfgId],
                                      usefulness: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="min-h-[40px] w-full px-2 rounded-lg border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]"
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <button
                            type="button"
                            data-testid={`submit-rubric-${cfgId}`}
                            onClick={() => void handleSubmitRubric(cfgId)}
                            className="min-h-[44px] w-full px-4 py-2 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold hover:opacity-90 cursor-pointer"
                          >
                            {locale === 'vi'
                              ? `Lưu điểm Rubric cho ${displayHeader}`
                              : `Submit Rubric Score for ${displayHeader}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 4: KNOWN LIMITATIONS PANEL (FILLED STRICTLY FROM REAL RUN DATA) */}
              <section
                aria-label="Known Limitations from Real Run Data"
                data-testid="eval-known-limitations-panel"
                className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className="w-5 h-5 text-[#C8433C]"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="font-serif-display text-xl font-bold">
                      {locale === 'vi'
                        ? 'Bảng Giới hạn Thực tế (Known Limitations — Trích xuất 100% từ Dữ liệu Chạy Thật)'
                        : 'Known Limitations Panel (Populated Strictly from Real Run Data)'}
                    </h2>
                    <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
                      {locale === 'vi'
                        ? `Đo trực tiếp từ phiên chạy ${activeRun.realLimitations?.measuredFromRunId ?? activeRun.id}. Không bao giờ điền sẵn số liệu giả định.`
                        : `Measured directly from run ${activeRun.realLimitations?.measuredFromRunId ?? activeRun.id}. Never pre-filled with static numbers.`}
                    </p>
                  </div>
                </div>

                {activeRun.realLimitations ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl bg-[#F7F5EE] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E]">
                      <span className="text-[11px] text-[#6E6A61] dark:text-[#8E887C] block">
                        {locale === 'vi'
                          ? 'Ứng viên thô bị phát hiện lỗi (Audit)'
                          : 'Unverified Candidates Caught in Audit'}
                      </span>
                      <strong className="font-serif-display text-2xl font-bold text-[#C8433C]">
                        {
                          activeRun.realLimitations
                            .unverifiedCandidatesCaughtByAudit
                        }{' '}
                        / {activeRun.realLimitations.totalRawCandidatesAudited}
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F5EE] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E]">
                      <span className="text-[11px] text-[#6E6A61] dark:text-[#8E887C] block">
                        {locale === 'vi'
                          ? 'Bản ghi thiếu mã ISBN-13'
                          : 'Catalog Records Missing ISBN-13'}
                      </span>
                      <strong className="font-serif-display text-2xl font-bold">
                        {activeRun.realLimitations.missingIsbnCount}
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F5EE] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E]">
                      <span className="text-[11px] text-[#6E6A61] dark:text-[#8E887C] block">
                        {locale === 'vi'
                          ? 'Bản ghi thiếu số trang'
                          : 'Records Missing Page Count'}
                      </span>
                      <strong className="font-serif-display text-2xl font-bold">
                        {activeRun.realLimitations.missingPageCount}
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F5EE] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E]">
                      <span className="text-[11px] text-[#6E6A61] dark:text-[#8E887C] block">
                        {locale === 'vi'
                          ? 'Chưa có bản Tiếng Việt trong nguồn'
                          : 'No Vietnamese Edition in Sources'}
                      </span>
                      <strong className="font-serif-display text-2xl font-bold">
                        {
                          activeRun.realLimitations
                            .noVietnameseEditionInSourcesCount
                        }
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F5EE] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E]">
                      <span className="text-[11px] text-[#6E6A61] dark:text-[#8E887C] block">
                        {locale === 'vi'
                          ? 'Số lần gián đoạn nguồn (Outages)'
                          : 'Source Outages Encountered'}
                      </span>
                      <strong className="font-serif-display text-2xl font-bold">
                        {activeRun.realLimitations.sourceOutageCount}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {activeRun.realLimitations && (
                  <div className="text-xs text-[#524F49] dark:text-[#B8B2A6] pt-2">
                    <strong>
                      {locale === 'vi'
                        ? 'Phân rã nguyên nhân lỗi kiểm chứng thực tế: '
                        : 'Actual verification failure reason breakdown: '}
                    </strong>
                    {Object.entries(
                      activeRun.realLimitations.failureReasonsBreakdown,
                    )
                      .map(([code, cnt]) => `${code}: ${cnt}`)
                      .join(' · ')}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
