'use client';

/**
 * Tính năng: Thanh Tinh chỉnh Ngôn ngữ Tự nhiên (Natural-Language Refinement) kèm Chip điều chỉnh có thể gỡ bỏ & Bộ lọc nhanh phía Client (Quick Filters).
 * Trường hợp sử dụng: Gửi POST /api/recommendations/[id]/refine để tái xếp hạng tức thì trên bể sách đã xác thực, hiển thị chip hệ thống đã hiểu ("Shorter", "More practical") và lọc nhanh theo độ dài, trình độ, ngôn ngữ ấn bản.
 */

import React, { useState } from 'react';
import {
  Filter,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  BookLengthPreference,
  ReaderLevel,
  RefinementAdjustment,
} from '../types/book';
import { useTranslation } from '../i18n/useTranslation';

export interface ClientQuickFilters {
  length: BookLengthPreference;
  level: 'all' | ReaderLevel;
  language: 'all' | 'vi' | 'en';
}

interface RefinementAndQuickFiltersBarProps {
  activeAdjustment?: RefinementAdjustment;
  isRefining: boolean;
  keptPreviousNotice: boolean;
  truncatedNotice: boolean;
  onApplyRefinementText: (text: string) => void;
  onRemoveChip: (chipId: string) => void;
  onClearAllAdjustments: () => void;
  quickFilters: ClientQuickFilters;
  onChangeQuickFilters: (next: ClientQuickFilters) => void;
}

export function RefinementAndQuickFiltersBar({
  activeAdjustment,
  isRefining,
  keptPreviousNotice,
  truncatedNotice,
  onApplyRefinementText,
  onRemoveChip,
  onClearAllAdjustments,
  quickFilters,
  onChangeQuickFilters,
}: RefinementAndQuickFiltersBarProps) {
  const { locale, t } = useTranslation();
  const [inputText, setInputText] = useState('');

  const chips = activeAdjustment?.chips ?? [];
  const hasActiveQuickFilter =
    quickFilters.length !== 'any' ||
    quickFilters.level !== 'all' ||
    quickFilters.language !== 'all';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isRefining) return;
    onApplyRefinementText(trimmed);
    setInputText('');
  };

  const presetChips = [
    {
      key: 'shorter',
      query: locale === 'vi' ? 'ngắn gọn hơn' : 'shorter',
      label: t.refinement.presetShorter,
    },
    {
      key: 'practical',
      query: locale === 'vi' ? 'thực hành nhiều hơn' : 'more practical',
      label: t.refinement.presetPractical,
    },
    {
      key: 'theoretical',
      query: locale === 'vi' ? 'thiên về lý thuyết' : 'more theoretical',
      label: t.refinement.presetTheoretical,
    },
    {
      key: 'easier',
      query: locale === 'vi' ? 'dễ tiếp cận hơn' : 'more accessible',
      label: t.refinement.presetEasier,
    },
  ];

  return (
    <div className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-4 sm:p-5 space-y-4 shadow-xs">
      {/* 1. Natural-Language Refinement Input & Preset Triggers */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="nl-refinement-input"
            className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-1.5"
          >
            <Wand2
              className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53]"
              aria-hidden="true"
            />
            <span>{t.refinement.title}</span>
          </label>
          <span className="text-[11px] text-[#6E6A61] dark:text-[#8E887C]">
            {t.refinement.dataOnlySecurityNote}
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <input
            id="nl-refinement-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.refinement.placeholder}
            disabled={isRefining}
            className="flex-1 min-h-[42px] px-4 py-2 rounded-full bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] text-xs sm:text-sm text-[#1A1D24] dark:text-[#F5F2EB] placeholder:text-[#6E6A61] dark:placeholder:text-[#8E887C]"
          />
          <button
            type="submit"
            disabled={isRefining || !inputText.trim()}
            className="min-h-[42px] px-5 py-2 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isRefining ? t.refinement.applyingBtn : t.refinement.applyBtn}
            </span>
          </button>
        </form>

        {/* Quick Natural-Language Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {presetChips.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={isRefining}
              onClick={() => onApplyRefinementText(preset.query)}
              className="min-h-[34px] px-3 py-1 rounded-full bg-[#EFECE3] dark:bg-[#171B26] hover:bg-[#C8433C] hover:text-white dark:hover:bg-[#DF5A53] text-xs font-medium text-[#1A1D24] dark:text-[#F5F2EB] transition-colors cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interpreted Adjustment Removable Chips */}
      {chips.length > 0 && (
        <div
          role="region"
          aria-label={t.refinement.understoodLabel}
          className="pt-2.5 border-t border-[#E2DDD0] dark:border-[#282E3E] flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6]">
              {t.refinement.understoodLabel}
            </span>
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] text-xs font-semibold border border-[#C8433C]/30"
              >
                <span>{locale === 'vi' ? chip.labelVi : chip.labelEn}</span>
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip.id)}
                  aria-label={`${t.refinement.removeChipAria}: ${
                    locale === 'vi' ? chip.labelVi : chip.labelEn
                  }`}
                  className="w-5 h-5 rounded-full hover:bg-[#C8433C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearAllAdjustments}
            className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6] hover:text-[#C8433C] dark:hover:text-[#DF5A53] inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>{t.refinement.clearAllChipsBtn}</span>
          </button>
        </div>
      )}

      {/* Edge-Case Feedback Notices (Truncated input or Narrow refinement fallback) */}
      {(keptPreviousNotice || truncatedNotice) && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-xl bg-[#EFECE3] dark:bg-[#171B26] text-xs text-[#524F49] dark:text-[#B8B2A6] flex items-center gap-2"
        >
          <ShieldAlert
            className="w-4 h-4 text-[#C8433C] dark:text-[#DF5A53] shrink-0"
            aria-hidden="true"
          />
          <span>
            {truncatedNotice ? `${t.refinement.truncatedNotice} ` : ''}
            {keptPreviousNotice ? t.refinement.keptPreviousNotice : ''}
          </span>
        </div>
      )}

      {/* 3. Client-Side Quick Filters (Length Bucket, Level, Language) */}
      <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6] inline-flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.quickFilters.title}</span>
          </span>

          {/* Length Bucket Filter */}
          <select
            aria-label={t.preferences.lengthLabel}
            value={quickFilters.length}
            onChange={(e) =>
              onChangeQuickFilters({
                ...quickFilters,
                length: e.target.value as BookLengthPreference,
              })
            }
            className="min-h-[36px] px-3 py-1 rounded-full bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-medium text-[#1A1D24] dark:text-[#F5F2EB] cursor-pointer"
          >
            <option value="any">{t.quickFilters.allLengths}</option>
            <option value="short">{t.preferences.lengths.short}</option>
            <option value="medium">{t.preferences.lengths.medium}</option>
            <option value="deep">{t.preferences.lengths.deep}</option>
          </select>

          {/* Level Filter */}
          <select
            aria-label={t.preferences.levelLabel}
            value={quickFilters.level}
            onChange={(e) =>
              onChangeQuickFilters({
                ...quickFilters,
                level: e.target.value as 'all' | ReaderLevel,
              })
            }
            className="min-h-[36px] px-3 py-1 rounded-full bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-medium text-[#1A1D24] dark:text-[#F5F2EB] cursor-pointer"
          >
            <option value="all">{t.quickFilters.allLevels}</option>
            <option value="beginner">{t.cards.levelBeginner}</option>
            <option value="intermediate">{t.cards.levelIntermediate}</option>
            <option value="advanced">{t.cards.levelAdvanced}</option>
          </select>

          {/* Language / Vietnamese Edition Filter */}
          <select
            aria-label={t.preferences.languageLabel}
            value={quickFilters.language}
            onChange={(e) =>
              onChangeQuickFilters({
                ...quickFilters,
                language: e.target.value as 'all' | 'vi' | 'en',
              })
            }
            className="min-h-[36px] px-3 py-1 rounded-full bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-medium text-[#1A1D24] dark:text-[#F5F2EB] cursor-pointer"
          >
            <option value="all">{t.quickFilters.allLanguages}</option>
            <option value="vi">{t.quickFilters.langViAvailable}</option>
            <option value="en">{t.quickFilters.langEnOriginal}</option>
          </select>
        </div>

        {hasActiveQuickFilter && (
          <button
            type="button"
            onClick={() =>
              onChangeQuickFilters({
                length: 'any',
                level: 'all',
                language: 'all',
              })
            }
            className="min-h-[34px] px-3 py-1 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold text-[#C8433C] dark:text-[#DF5A53] hover:bg-[#F9E2DF] dark:hover:bg-[#2D1819] inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>{t.quickFilters.resetBtn}</span>
          </button>
        )}
      </div>
    </div>
  );
}
