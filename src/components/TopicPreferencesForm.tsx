'use client';

/**
 * Tính năng: Bảng "Start your path" (TopicPreferencesForm) theo thiết kế E-Book Dashboard (Phase 3A).
 * Trường hợp sử dụng: Nút CTA chính hình viên thuốc màu than đậm ("Bắt đầu lộ trình đọc ↗"), các thẻ chủ đề gợi ý, và bảng tùy chọn Trình độ, Độ dài, Ngôn ngữ, Thanh trượt Khám phá MMR.
 */

import React, { useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  BookLanguagePreference,
  BookLengthPreference,
  ReaderLevel,
  UserPreferences,
} from '../types/book';
import { SUGGESTED_TOPICS } from '../config/constants';
import { useTranslation } from '../i18n/useTranslation';

interface TopicPreferencesFormProps {
  preferences: UserPreferences;
  onChangePreferences: (next: UserPreferences) => void;
  onSubmitSearch: (prefs: UserPreferences) => void;
  onLoadSampleData: () => void;
  isLoading: boolean;
}

export function TopicPreferencesForm({
  preferences,
  onChangePreferences,
  onSubmitSearch,
  onLoadSampleData,
  isLoading,
}: TopicPreferencesFormProps) {
  const { locale, t } = useTranslation();
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTopicChange = (value: string) => {
    if (validationError) setValidationError(null);
    onChangePreferences({
      ...preferences,
      topic: value,
    });
  };

  const handleSelectChip = (queryText: string) => {
    setValidationError(null);
    const updated: UserPreferences = {
      ...preferences,
      topic: queryText,
    };
    onChangePreferences(updated);
    onSubmitSearch(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = preferences.topic.trim();
    if (!cleaned) {
      setValidationError(t.states.validationEmptyTopic);
      return;
    }
    setValidationError(null);
    onSubmitSearch({
      ...preferences,
      topic: cleaned,
    });
  };

  const getAdventurousnessExplanation = (val: number): string => {
    if (val < 34) return t.preferences.adventurousnessExplanations.focused;
    if (val < 68) return t.preferences.adventurousnessExplanations.balanced;
    return t.preferences.adventurousnessExplanations.exploratory;
  };

  const levelOptions: readonly ReaderLevel[] = [
    'beginner',
    'intermediate',
    'advanced',
  ];
  const lengthOptions: readonly BookLengthPreference[] = [
    'any',
    'short',
    'medium',
    'deep',
  ];
  const languageOptions: readonly BookLanguagePreference[] = ['any', 'en', 'vi'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Primary Pill CTA Row ("Start reading ↗" style from Reference Screens 1, 2, 4, 5) */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="min-h-[48px] px-6 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-[#FFFFFF] dark:text-[#11141C] font-semibold text-sm inline-flex items-center gap-2.5 shadow-[0_12px_24px_-8px_rgba(29,33,42,0.45)] hover:opacity-92 disabled:opacity-60 transition-all cursor-pointer"
        >
          <span>{t.hero.primarySearchCta}</span>
          <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onLoadSampleData}
          disabled={isLoading}
          className="min-h-[48px] px-5 py-2.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs sm:text-sm font-semibold text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] dark:hover:border-[#DF5A53] inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles
            className="w-4 h-4 text-[#C8433C] dark:text-[#DF5A53]"
            aria-hidden="true"
          />
          <span>{t.hero.secondarySampleCta}</span>
        </button>
      </div>

      {/* Accessible Inline Topic Input synced with Top Search Bar */}
      <div className="space-y-1.5">
        <label
          htmlFor="hero-topic-input"
          className="block text-xs font-semibold uppercase tracking-wider text-[#6E6A61] dark:text-[#8E887C]"
        >
          {t.hero.topicInputLabel}
        </label>
        <input
          id="hero-topic-input"
          type="text"
          value={preferences.topic}
          onChange={(e) => handleTopicChange(e.target.value)}
          placeholder={t.hero.topicPlaceholder}
          maxLength={140}
          aria-invalid={Boolean(validationError)}
          className="min-h-[46px] w-full px-4 py-2.5 rounded-2xl bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E] text-sm sm:text-base text-[#1A1D24] dark:text-[#F5F2EB] placeholder:text-[#6E6A61] dark:placeholder:text-[#8E887C] focus:border-[#C8433C] transition-colors"
        />
        {validationError && (
          <p role="alert" className="text-xs font-medium text-[#BE123C] dark:text-[#FB7185]">
            {validationError}
          </p>
        )}
      </div>

      {/* Category / Topic Starter Chips */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#6E6A61] dark:text-[#8E887C]">
          {t.hero.suggestedTopicsLabel}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {SUGGESTED_TOPICS.map((preset) => {
            const label = locale === 'vi' ? preset.labelVi : preset.labelEn;
            const query = locale === 'vi' ? preset.queryVi : preset.queryEn;
            const isSelected =
              preferences.topic.toLowerCase() === query.toLowerCase() ||
              preferences.topic.toLowerCase() === preset.labelEn.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectChip(query)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white shadow-xs'
                    : 'bg-[#EFECE3] dark:bg-[#171B26] text-[#1A1D24] dark:text-[#F5F2EB] hover:bg-[#E2DDD0] dark:hover:bg-[#282E3E]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progressive Disclosure Toggle for Level, Length, Language & Adventurousness */}
      <div className="pt-2 border-t border-[#E2DDD0] dark:border-[#282E3E]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            aria-expanded={showCustomize}
            onClick={() => setShowCustomize((prev) => !prev)}
            className="min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#C8433C] dark:text-[#DF5A53] hover:opacity-85 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {showCustomize
                ? t.hero.customizeToggleHide
                : t.hero.customizeToggleShow}
            </span>
            {showCustomize ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#524F49] dark:text-[#B8B2A6]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFECE3] dark:bg-[#171B26]">
              {t.preferences.levels[preferences.level]}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFECE3] dark:bg-[#171B26]">
              {t.preferences.lengths[preferences.length]}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] font-mono">
              MMR {preferences.adventurousness}%
            </span>
          </div>
        </div>

        {showCustomize && (
          <div className="mt-3 p-4 sm:p-5 rounded-[20px] bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E] space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Starting Level */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                  {t.preferences.levelLabel}
                </span>
                <div className="flex flex-col gap-1.5">
                  {levelOptions.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        onChangePreferences({ ...preferences, level: lvl })
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                        preferences.level === lvl
                          ? 'bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] font-semibold'
                          : 'bg-[#F7F5EE] dark:bg-[#11141C] text-[#524F49] dark:text-[#B8B2A6]'
                      }`}
                    >
                      {t.preferences.levels[lvl]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Preferred Length */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                  {t.preferences.lengthLabel}
                </span>
                <div className="flex flex-col gap-1.5">
                  {lengthOptions.map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() =>
                        onChangePreferences({ ...preferences, length: len })
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                        preferences.length === len
                          ? 'bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] font-semibold'
                          : 'bg-[#F7F5EE] dark:bg-[#11141C] text-[#524F49] dark:text-[#B8B2A6]'
                      }`}
                    >
                      {t.preferences.lengths[len]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Book Language */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                  {t.preferences.languageLabel}
                </span>
                <div className="flex flex-col gap-1.5">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        onChangePreferences({ ...preferences, language: lang })
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-left text-xs font-medium transition-colors ${
                        preferences.language === lang
                          ? 'bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] font-semibold'
                          : 'bg-[#F7F5EE] dark:bg-[#11141C] text-[#524F49] dark:text-[#B8B2A6]'
                      }`}
                    >
                      {t.preferences.languages[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Adventurousness Slider (MMR Diversity Control) */}
            <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="adventurousness-slider"
                  className="text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] flex items-center gap-1.5"
                >
                  <Compass
                    className="w-4 h-4 text-[#C8433C] dark:text-[#DF5A53]"
                    aria-hidden="true"
                  />
                  <span>{t.preferences.adventurousnessLabel}</span>
                </label>
                <span className="text-xs font-mono font-bold text-[#C8433C] dark:text-[#DF5A53]">
                  {preferences.adventurousness}%
                </span>
              </div>

              <input
                id="adventurousness-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={preferences.adventurousness}
                onChange={(e) =>
                  onChangePreferences({
                    ...preferences,
                    adventurousness: Number(e.target.value),
                  })
                }
                className="w-full accent-[#C8433C] cursor-pointer h-2 rounded-lg"
              />

              <div className="flex justify-between text-[11px] font-medium text-[#6E6A61] dark:text-[#8E887C]">
                <span>{t.preferences.adventurousnessLow}</span>
                <span>{t.preferences.adventurousnessHigh}</span>
              </div>

              <p className="text-xs text-[#524F49] dark:text-[#B8B2A6] bg-[#F7F5EE] dark:bg-[#11141C] p-3 rounded-xl border border-[#E2DDD0] dark:border-[#282E3E]">
                {getAdventurousnessExplanation(preferences.adventurousness)}
              </p>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
