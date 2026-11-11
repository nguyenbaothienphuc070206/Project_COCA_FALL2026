'use client';

/**
 * Tính năng: Thanh theo dõi tiến trình Pipeline 5 bước (PipelineTracker) theo phong cách thanh viên thuốc "Schedule Reading" của E-Book Dashboard.
 * Trường hợp sử dụng: Hiển thị trực tiếp các sự kiện SSE, bộ đếm 2 tông màu (đỏ san hô cho số đã xác thực), nguồn Google Search Grounding, nút Dừng (Cancel) và nhật ký loại bỏ ứng viên.
 */

import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Square,
  WifiOff,
} from 'lucide-react';
import {
  PipelineStageKey,
  PipelineStats,
  RejectedCandidateLog,
} from '../types/book';
import { useTranslation } from '../i18n/useTranslation';

interface PipelineTrackerProps {
  stats: PipelineStats;
  rejectedCandidates: RejectedCandidateLog[];
  isSimulatingOutage: boolean;
  onToggleSimulateOutage: () => void;
  isStreaming: boolean;
  onCancelStream?: () => void;
}

const ORDERED_STAGES: readonly PipelineStageKey[] = [
  'searching',
  'extracting',
  'verifying',
  'ranking',
  'building_path',
];

export function PipelineTracker({
  stats,
  rejectedCandidates,
  isSimulatingOutage,
  onToggleSimulateOutage,
  isStreaming,
  onCancelStream,
}: PipelineTrackerProps) {
  const { locale, t } = useTranslation();
  const [showRejectedLog, setShowRejectedLog] = useState<boolean>(false);

  const currentIdx =
    stats.currentStage === 'completed'
      ? ORDERED_STAGES.length
      : ORDERED_STAGES.indexOf(stats.currentStage);

  const counterText = t.pipeline.liveCounterTemplate
    .replace('{found}', String(stats.candidatesFound))
    .replace('{verified}', String(stats.candidatesVerified))
    .replace('{removed}', String(stats.candidatesRemoved));

  return (
    <section
      aria-label={t.pipeline.title}
      className="rounded-[20px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif-display text-base font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.pipeline.title}
            </h2>
            <p className="text-xs font-mono tabular-nums text-[#524F49] dark:text-[#B8B2A6]">
              <span className="font-bold text-[#C8433C] dark:text-[#DF5A53]">
                {String(stats.candidatesVerified).padStart(2, '0')}
              </span>{' '}
              / {String(stats.candidatesFound).padStart(2, '0')} · {counterText}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isStreaming && onCancelStream && (
            <button
              type="button"
              onClick={onCancelStream}
              className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#C8433C] hover:opacity-90 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-opacity cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>{t.pipeline.cancelStreamBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSimulateOutage}
            className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] text-xs font-medium text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isSimulatingOutage
                ? t.pipeline.restoreServiceBtn
                : t.pipeline.simulateOutageBtn}
            </span>
          </button>
        </div>
      </div>

      {/* 5-Stage Pill Strip (Inspired by Reference "Schedule Reading" pill strip) */}
      <ol className="flex flex-wrap gap-2">
        {ORDERED_STAGES.map((stageKey, index) => {
          const isDone = index < currentIdx || stats.currentStage === 'completed';
          const isCurrent = index === currentIdx && stats.currentStage !== 'completed';
          return (
            <li
              key={stageKey}
              className={`px-3 py-2 rounded-full border text-xs inline-flex items-center gap-2 transition-all ${
                isCurrent
                  ? 'border-[#C8433C] bg-[#EFECE3] dark:bg-[#171B26] text-[#1A1D24] dark:text-[#F5F2EB] font-semibold shadow-xs'
                  : isDone
                    ? 'border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] text-[#1A1D24] dark:text-[#F5F2EB]'
                    : 'border-transparent bg-[#F7F5EE]/60 dark:bg-[#11141C]/50 text-[#6E6A61] dark:text-[#8E887C]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-[#C8433C] text-white'
                    : isDone
                      ? 'bg-[#146C43] text-white'
                      : 'bg-[#EFECE3] dark:bg-[#1E2330] text-[#6E6A61] dark:text-[#8E887C]'
                }`}
                aria-hidden="true"
              >
                {isDone ? <Check className="w-3 h-3" /> : index + 1}
              </span>
              <span className="whitespace-nowrap">{t.pipeline.stages[stageKey]}</span>
            </li>
          );
        })}
      </ol>

      {/* Google Search Grounding Sources Display */}
      {stats.groundingSources && stats.groundingSources.length > 0 && (
        <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] flex flex-wrap items-center gap-2 text-xs text-[#524F49] dark:text-[#B8B2A6]">
          <span className="font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
            {t.pipeline.groundingSourcesTitle}
          </span>
          {stats.groundingSources.slice(0, 5).map((src, i) => (
            <React.Fragment key={src.uri}>
              {i > 0 && <span aria-hidden="true">·</span>}
              <a
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#C8433C] dark:hover:text-[#DF5A53]"
              >
                <span className="truncate max-w-[200px]">{src.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
              </a>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Expandable Rejection Log */}
      {rejectedCandidates.length > 0 && (
        <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E]">
          <button
            type="button"
            aria-expanded={showRejectedLog}
            onClick={() => setShowRejectedLog((prev) => !prev)}
            className="min-h-[38px] text-xs font-semibold text-[#C8433C] dark:text-[#DF5A53] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>
              {t.pipeline.removedLogTitle} ({rejectedCandidates.length})
            </span>
            {showRejectedLog ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {showRejectedLog && (
            <ul className="mt-2 space-y-1.5 text-xs text-[#524F49] dark:text-[#B8B2A6]">
              {rejectedCandidates.map((item, idx) => (
                <li
                  key={`${item.candidateTitle}-${idx}`}
                  className="py-2 px-3.5 rounded-xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                >
                  <span className="font-medium line-through opacity-80">
                    {item.candidateTitle} — {item.candidateAuthor}
                  </span>
                  <span className="text-[#BE123C] dark:text-[#FB7185] font-medium">
                    {locale === 'vi' ? item.reasonVi : item.reasonEn}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
