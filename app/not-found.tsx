'use client';

/**
 * Tính năng: Trang lỗi 404 được thiết kế theo hệ thống giao diện Phase 3A (Warm Paper / Dark Ink) ở Giai đoạn 8.
 * Trường hợp sử dụng: Hiển thị khi người dùng truy cập đường dẫn không tồn tại; hỗ trợ song ngữ Tiếng Việt & Tiếng Anh, chuyển đổi giao diện Sáng/Tối và liên kết nhanh về các trang công khai (tuyệt đối không lộ /eval).
 */

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpenCheck,
  Compass,
  Globe,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useTranslation } from '@/src/i18n/useTranslation';
import { SYSTEM_PAGES_CONTENT } from '@/src/data/publicPagesContent';
import {
  buildLocalizedPath,
  PUBLIC_NAV_LINKS,
} from '@/src/lib/navigation';
import { SiteFooter } from '@/src/components/SiteFooter';

export default function NotFoundPage() {
  const { locale, setLocale, t, isDark, toggleTheme } = useTranslation();
  const sys = SYSTEM_PAGES_CONTENT[locale];
  const theme = isDark ? 'dark' : 'light';
  const homeHref = buildLocalizedPath(locale, '');

  return (
    <div className="min-h-screen w-full bg-[#DCD9CE] dark:bg-[#090B10] text-[#1A1D24] dark:text-[#F5F2EB] lg:p-4 xl:p-6 transition-colors">
      <div className="max-w-[1440px] mx-auto min-h-screen lg:min-h-[calc(100vh-3rem)] lg:rounded-[28px] bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] shadow-[0_24px_60px_-15px_rgba(24,22,20,0.18)] flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="min-h-[72px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE]/95 dark:bg-[#11141C]/95 flex items-center justify-between gap-4">
          <Link
            href={homeHref}
            className="min-h-[44px] inline-flex items-center gap-3 group rounded-xl px-1"
          >
            <span className="w-10 h-10 rounded-full border-2 border-[#1A1D24] dark:border-[#F5F2EB] flex items-center justify-center font-serif-display font-bold text-base bg-[#FDFCF9] dark:bg-[#1E2330] shrink-0">
              SP
            </span>
            <span className="font-serif-display text-lg sm:text-xl font-bold tracking-tight text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.brand.name}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
              aria-label={t.nav.languageToggleLabel}
              className="min-h-[42px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'vi' ? 'VI · /en' : 'EN · /vi'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? t.nav.themeToggleDark
                  : t.nav.themeToggleLight
              }
              className="min-h-[42px] min-w-[42px] rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] flex items-center justify-center cursor-pointer"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#1A1D24]" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        {/* Main 404 Body */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center">
          <div className="max-w-2xl w-full rounded-[26px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-6 sm:p-10 space-y-6 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#EFECE3] dark:bg-[#171B26] text-[#C8433C] dark:text-[#DF5A53] flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#C8433C] dark:text-[#DF5A53]">
                {sys.notFound.codeLabel}
              </p>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1D24] dark:text-[#F5F2EB] text-balance">
                {sys.notFound.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed max-w-lg mx-auto">
                {sys.notFound.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={homeHref}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C8433C] dark:bg-[#DF5A53] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{sys.notFound.backHomeCta}</span>
              </Link>

              <Link
                href={`${homeHref}?autostart=1`}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{sys.notFound.trySampleCta}</span>
              </Link>
            </div>

            {/* Helpful Public Links */}
            <div className="pt-5 border-t border-[#E2DDD0] dark:border-[#282E3E] space-y-3">
              <p className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6]">
                {sys.notFound.helpfulLinksTitle}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {PUBLIC_NAV_LINKS.filter((l) => l.slug !== '').map((item) => (
                  <Link
                    key={item.slug}
                    href={buildLocalizedPath(locale, item.slug)}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#EFECE3] dark:bg-[#171B26] hover:border-[#C8433C] border border-transparent text-xs font-medium text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <BookOpenCheck className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53]" aria-hidden="true" />
                    <span>{locale === 'vi' ? item.labelVi : item.labelEn}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
