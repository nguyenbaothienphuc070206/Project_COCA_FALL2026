'use client';

/**
 * Tính năng: Thanh điều hướng đỉnh (Header) tuân thủ Top Bar Contract 3 vùng: Brand wordmark | Nav links | Primary CTA & Tiện ích ngôn ngữ/giao diện.
 * Trường hợp sử dụng: Cho phép chuyển đổi mượt giữa Khám phá lộ trình, Kệ sách của tôi, Tầm nhìn & Kiến trúc, đổi ngôn ngữ VI/EN và chế độ Sáng/Tối.
 */

import React from 'react';
import { BookMarked, Globe, Moon, Sun } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export type ActiveTab = 'discover' | 'shelf' | 'vision';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  savedCount: number;
  onLoadSampleData: () => void;
}

/**
 * Render thanh điều hướng chính của ShelfPath.
 */
export function Header({
  activeTab,
  onSelectTab,
  savedCount,
  onLoadSampleData,
}: HeaderProps) {
  const { locale, setLocale, t, isDark, toggleTheme } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-[#E4DEC8] dark:border-[#2A2F3D] bg-[#FBF9F5]/95 dark:bg-[#0E1015]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('discover')}
          className="text-xl sm:text-2xl font-serif-display font-bold tracking-tight text-[#181614] dark:text-[#F5F2EB] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 rounded"
        >
          {t.brand.name}
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium text-[#57524B] dark:text-[#B8B2A6] pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#E4DEC8]/60 dark:border-[#2A2F3D]/60"
        >
          <button
            type="button"
            onClick={() => onSelectTab('discover')}
            aria-current={activeTab === 'discover' ? 'page' : undefined}
            className={`min-h-[40px] sm:min-h-[44px] px-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              activeTab === 'discover'
                ? 'border-amber-700 dark:border-amber-400 text-[#181614] dark:text-[#F5F2EB] font-semibold'
                : 'border-transparent hover:text-[#181614] dark:hover:text-[#F5F2EB]'
            }`}
          >
            {t.nav.discover}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('shelf')}
            aria-current={activeTab === 'shelf' ? 'page' : undefined}
            className={`min-h-[40px] sm:min-h-[44px] px-2 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              activeTab === 'shelf'
                ? 'border-amber-700 dark:border-amber-400 text-[#181614] dark:text-[#F5F2EB] font-semibold'
                : 'border-transparent hover:text-[#181614] dark:hover:text-[#F5F2EB]'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span>{t.nav.myShelf}</span>
            <span className="tabular-nums text-xs opacity-80">({savedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('vision')}
            aria-current={activeTab === 'vision' ? 'page' : undefined}
            className={`min-h-[40px] sm:min-h-[44px] px-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              activeTab === 'vision'
                ? 'border-amber-700 dark:border-amber-400 text-[#181614] dark:text-[#F5F2EB] font-semibold'
                : 'border-transparent hover:text-[#181614] dark:hover:text-[#F5F2EB]'
            }`}
          >
            {t.nav.vision}
          </button>
        </nav>

        {/* Zone 3: Language/Theme utilities + 1 Primary Action */}
        <div className="order-2 sm:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
            aria-label={t.nav.languageToggleLabel}
            className="min-h-[40px] sm:min-h-[44px] px-2.5 py-1.5 rounded-lg border border-[#E4DEC8] dark:border-[#2A2F3D] text-xs font-semibold text-[#181614] dark:text-[#F5F2EB] hover:bg-[#F3EFE6] dark:hover:bg-[#161922] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{locale === 'vi' ? 'VI · EN' : 'EN · VI'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t.nav.themeToggleLight : t.nav.themeToggleDark}
            className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-2 rounded-lg border border-[#E4DEC8] dark:border-[#2A2F3D] text-[#181614] dark:text-[#F5F2EB] hover:bg-[#F3EFE6] dark:hover:bg-[#161922] inline-flex items-center justify-center shrink-0 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-[#57524B]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onLoadSampleData}
            className="hidden lg:inline-flex items-center min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.trySampleCta}
          </button>
        </div>
      </div>
    </header>
  );
}
