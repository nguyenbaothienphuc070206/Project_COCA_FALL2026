'use client';

/**
 * Tính năng: Khối hướng dẫn người dùng mới 3 bước có thể bỏ qua (OnboardingBanner) kèm các nút "Thử chủ đề mẫu" (Phase 8).
 * Trường hợp sử dụng:
 * - Hiển thị ở lần truy cập đầu tiên (hoặc khi người dùng bấm "Mở hướng dẫn 3 bước" ở chân trang).
 * - Cho phép bỏ qua ngay lập tức (Skip) hoặc đi qua từng bước 1 -> 2 -> 3.
 * - Có các nút "Thử ngay chủ đề mẫu" để tải lộ trình sách đã kiểm chứng chỉ với 1 cú nhấp.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Compass,
  Route,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { ONBOARDING_CONTENT } from '../data/publicPagesContent';
import { SUGGESTED_TOPICS } from '../config/constants';

interface OnboardingBannerProps {
  isOpen: boolean;
  onDismiss: () => void;
  onTryExampleTopic: (topicQuery: string) => void;
}

export function OnboardingBanner({
  isOpen,
  onDismiss,
  onTryExampleTopic,
}: OnboardingBannerProps) {
  const { locale } = useTranslation();
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);

  if (!isOpen) return null;

  const content = ONBOARDING_CONTENT[locale];
  const activeStepData = content.steps[currentStep];

  const StepIcon =
    currentStep === 0
      ? Compass
      : currentStep === 1
        ? BookOpenCheck
        : Route;

  return (
    <section
      aria-label={content.badgeLabel}
      className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 sm:p-6 space-y-5 shadow-xs no-print"
    >
      {/* Top Bar: Step Indicator Tabs + Skip Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C8433C] dark:text-[#DF5A53]">
            {content.badgeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Step 1 / 2 / 3 Selector Buttons */}
          <div
            role="tablist"
            aria-label={content.badgeLabel}
            className="inline-flex items-center rounded-full bg-[#EFECE3] dark:bg-[#171B26] p-1 gap-1"
          >
            {([0, 1, 2] as const).map((idx) => {
              const isSelected = currentStep === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setCurrentStep(idx)}
                  className={`min-h-[30px] px-3 py-0.5 rounded-full text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                      : 'text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                  }`}
                >
                  {idx + 1}/3
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[36px] px-3 py-1 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB] hover:border-[#C8433C] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{content.skipBtn}</span>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Active Step Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[#EFECE3] dark:bg-[#171B26] flex items-center justify-center text-[#C8433C] dark:text-[#DF5A53] shrink-0">
              <StepIcon className="w-4 h-4" aria-hidden="true" />
            </span>
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {activeStepData.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
            {activeStepData.description}
          </p>
        </div>

        <div className="md:col-span-4 rounded-2xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#146C43] dark:text-[#4ADE80]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {locale === 'vi' ? 'Điểm cốt lõi' : 'Key takeaway'}
            </span>
          </div>
          <p className="text-xs text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
            {activeStepData.highlightNote}
          </p>
        </div>
      </div>

      {/* Bottom Controls: "Try an Example" Buttons + Step Navigation */}
      <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6]">
            {content.tryExampleHeading}
          </span>
          {SUGGESTED_TOPICS.slice(0, 3).map((preset) => {
            const label = locale === 'vi' ? preset.labelVi : preset.labelEn;
            const query = locale === 'vi' ? preset.queryVi : preset.queryEn;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onTryExampleTopic(query);
                  onDismiss();
                }}
                className="min-h-[36px] px-3 py-1 rounded-full bg-[#EFECE3] dark:bg-[#171B26] hover:bg-[#C8433C] hover:text-white dark:hover:bg-[#DF5A53] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() =>
                setCurrentStep((prev) => (prev > 0 ? ((prev - 1) as 0 | 1) : 0))
              }
              className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-1.5 hover:border-[#C8433C] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{content.prevBtn}</span>
            </button>
          )}

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={() =>
                setCurrentStep((prev) => (prev < 2 ? ((prev + 1) as 1 | 2) : 2))
              }
              className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>{content.nextBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#C8433C] dark:bg-[#DF5A53] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>{content.finishBtn}</span>
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
