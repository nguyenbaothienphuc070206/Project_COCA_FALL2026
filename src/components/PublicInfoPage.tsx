'use client';

/**
 * Tính năng: Khung hiển thị chuẩn cho 7 trang thông tin công khai của ShelfPath (Phase 8):
 * - Cách hoạt động (/how-it-works), Phương pháp & Nguồn dữ liệu (/methodology), Về dự án (/about),
 *   Câu hỏi thường gặp (/faq), Quyền riêng tư (/privacy), Điều khoản & Miễn trừ (/terms), Khả năng tiếp cận (/accessibility).
 * Trường hợp sử dụng:
 * - Đồng bộ hệ thống thiết kế Phase 3A (Giấy ấm #F7F5EE / Mực tối #11141C, điểm nhấn Đỏ san hô #C8433C).
 * - Có thanh đường dẫn phân cấp (Breadcrumbs) trên mọi trang nội dung.
 * - Hỗ trợ chuyển đổi ngôn ngữ theo đường dẫn (/en <-> /vi) giữ nguyên trạng thái.
 * - Tuyệt đối không hiển thị đường dẫn /eval trong thanh điều hướng.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Compass,
  Globe,
  Info,
  Mail,
  Moon,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import type { Locale } from '../i18n/dictionaries';
import {
  buildLocalizedPath,
  PUBLIC_NAV_LINKS,
  PublicPageSlug,
} from '../lib/navigation';
import {
  PUBLIC_PAGES_BY_LOCALE,
  SYSTEM_PAGES_CONTENT,
} from '../data/publicPagesContent';
import { SiteFooter } from './SiteFooter';

interface PublicInfoPageProps {
  slug: PublicPageSlug;
  initialLocale?: Locale;
}

/**
 * Làm nổi bật các thẻ giữ chỗ [FILL IN: ...] trong văn bản để chủ dự án dễ nhận diện.
 */
function renderTextWithPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\[FILL IN:[^\]]+\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('[FILL IN:') && part.endsWith(']')) {
      return (
        <mark
          key={idx}
          className="px-2 py-0.5 rounded bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] font-mono text-xs font-semibold border border-[#C8433C]/40"
        >
          {part}
        </mark>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function PublicInfoPage({ slug, initialLocale }: PublicInfoPageProps) {
  const { locale, setLocale, t, isDark, toggleTheme } = useTranslation();
  const [faqQuery, setFaqQuery] = useState<string>('');
  const [faqCategory, setFaqCategory] = useState<
    'all' | 'pipeline' | 'verification' | 'features' | 'privacy'
  >('all');

  const activeLocale: Locale = locale || initialLocale || 'vi';
  const pageData = PUBLIC_PAGES_BY_LOCALE[activeLocale][slug];
  const sys = SYSTEM_PAGES_CONTENT[activeLocale];
  const theme = isDark ? 'dark' : 'light';

  const filteredFaqItems = useMemo(() => {
    const items = pageData.faqItems ?? [];
    return items.filter((item) => {
      if (faqCategory !== 'all' && item.category !== faqCategory) {
        return false;
      }
      if (!faqQuery.trim()) return true;
      const q = faqQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [pageData.faqItems, faqCategory, faqQuery]);

  const homeHref = buildLocalizedPath(activeLocale, '');

  return (
    <div
      lang={activeLocale}
      className="min-h-screen w-full bg-[#DCD9CE] dark:bg-[#090B10] text-[#1A1D24] dark:text-[#F5F2EB] lg:p-4 xl:p-6 transition-colors"
    >
      {/* Skip Link for Keyboard Accessibility */}
      <a
        href="#public-page-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-[#C8433C] focus:text-white focus:text-xs focus:font-bold focus:shadow-lg"
      >
        {activeLocale === 'vi'
          ? 'Bỏ qua thanh điều hướng để tới nội dung chính'
          : 'Skip to main content'}
      </a>

      <div className="max-w-[1440px] mx-auto min-h-screen lg:min-h-[calc(100vh-3rem)] lg:rounded-[28px] bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] shadow-[0_24px_60px_-15px_rgba(24,22,20,0.18)] flex flex-col overflow-hidden">
        {/* TOP HEADER (Phase 3A Editorial Shell Style — Strict Single Row) */}
        <header className="min-h-[72px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE]/95 dark:bg-[#11141C]/95 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={homeHref}
              className="min-h-[44px] inline-flex items-center gap-3 group rounded-xl px-1"
            >
              <span className="w-10 h-10 rounded-full border-2 border-[#1A1D24] dark:border-[#F5F2EB] flex items-center justify-center font-serif-display font-bold text-base tracking-tighter bg-[#FDFCF9] dark:bg-[#1E2330] shrink-0 group-hover:border-[#C8433C] dark:group-hover:border-[#DF5A53] transition-colors">
                SP
              </span>
              <span className="font-serif-display text-lg sm:text-xl font-bold tracking-tight text-[#1A1D24] dark:text-[#F5F2EB] whitespace-nowrap">
                {t.brand.name}
              </span>
            </Link>
          </div>

          {/* Primary Public Page Navigation Links (5 concise single-line links in top bar; full 7-page directory in left sidebar & footer) */}
          <nav
            aria-label={
              activeLocale === 'vi'
                ? 'Điều hướng trang thông tin'
                : 'Public pages navigation'
            }
            className="hidden xl:flex items-center gap-6 text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6]"
          >
            {PUBLIC_NAV_LINKS.slice(0, 5).map((item) => {
              const isCurrent = item.slug === slug;
              return (
                <Link
                  key={item.slug || 'home'}
                  href={buildLocalizedPath(activeLocale, item.slug)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'text-[#C8433C] dark:text-[#DF5A53] underline underline-offset-4 font-bold'
                      : 'hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                  }`}
                >
                  {activeLocale === 'vi' ? item.labelVi : item.labelEn}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language Switch (/vi <-> /en), Theme Switch, Back to Workspace CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLocale(activeLocale === 'vi' ? 'en' : 'vi')}
              aria-label={t.nav.languageToggleLabel}
              className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-1.5 hover:border-[#C8433C] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{activeLocale === 'vi' ? 'VI · /en' : 'EN · /vi'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? t.nav.themeToggleDark
                  : t.nav.themeToggleLight
              }
              className="min-h-[44px] min-w-[44px] rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] flex items-center justify-center hover:border-[#C8433C] transition-colors cursor-pointer"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#1A1D24]" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              )}
            </button>

            <Link
              href={homeHref}
              className="min-h-[44px] px-4 py-1.5 rounded-full bg-[#C8433C] dark:bg-[#DF5A53] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {activeLocale === 'vi' ? 'Mở Lộ trình Sách' : 'Open Workspace'}
              </span>
            </Link>
          </div>
        </header>

        {/* MAIN CONTENT AREA WITH BREADCRUMBS & TWO-COLUMN EDITORIAL GRID */}
        <main
          id="public-page-main-content"
          tabIndex={-1}
          className="flex-1 grid grid-cols-1 lg:grid-cols-12 focus:outline-none"
        >
          {/* LEFT SIDEBAR: PUBLIC DIRECTORY & QUICK JUMP (4 Cols on LG — Warm Cream #EFECE3) */}
          <aside
            aria-label={
              activeLocale === 'vi'
                ? 'Danh mục trang thông tin'
                : 'Documentation menu'
            }
            className="lg:col-span-4 p-4 sm:p-6 lg:p-8 bg-[#EFECE3] dark:bg-[#171B26] border-b lg:border-b-0 lg:border-r border-[#E2DDD0] dark:border-[#282E3E] space-y-6"
          >
            <div className="space-y-2">
              <Link
                href={homeHref}
                className="min-h-[40px] inline-flex items-center gap-2 text-xs font-semibold text-[#C8433C] dark:text-[#DF5A53] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {activeLocale === 'vi'
                    ? 'Quay lại Không gian Lộ trình đọc sách'
                    : 'Return to Reading Roadmap Workspace'}
                </span>
              </Link>
              <h2 className="font-serif-display text-lg font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                {activeLocale === 'vi'
                  ? 'Tài liệu & Minh bạch'
                  : 'Documentation & Trust'}
              </h2>
            </div>

            <nav
              aria-label={
                activeLocale === 'vi'
                  ? 'Các trang công khai'
                  : 'Public pages list'
              }
              className="space-y-1.5"
            >
              {PUBLIC_NAV_LINKS.filter((item) => item.slug !== '').map(
                (item) => {
                  const isCurrent = item.slug === slug;
                  return (
                    <Link
                      key={item.slug}
                      href={buildLocalizedPath(activeLocale, item.slug)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`min-h-[44px] w-full px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white font-semibold shadow-xs'
                          : 'bg-[#FDFCF9] dark:bg-[#1E2330] text-[#1A1D24] dark:text-[#F5F2EB] border border-[#E2DDD0] dark:border-[#282E3E] hover:border-[#C8433C]'
                      }`}
                    >
                      <span>
                        {activeLocale === 'vi' ? item.labelVi : item.labelEn}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 shrink-0 opacity-75"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                },
              )}
            </nav>

            {/* Try an Example Callout Box */}
            <div className="rounded-[20px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C8433C] dark:text-[#DF5A53]">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {activeLocale === 'vi'
                    ? 'Trải nghiệm thực tế ngay'
                    : 'Try it in action'}
                </span>
              </div>
              <p className="text-xs text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                {activeLocale === 'vi'
                  ? 'Khám phá ngay lộ trình đọc sách mẫu đã được kiểm chứng 100% qua Open Library và Google Books.'
                  : 'Explore a 100% catalog-verified sample reading roadmap right in the interactive workspace.'}
              </p>
              <Link
                href={`${homeHref}?autostart=1`}
                className="min-h-[42px] w-full px-4 py-2 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <BookOpenCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {activeLocale === 'vi'
                    ? 'Dùng thử với dữ liệu mẫu'
                    : 'Try with sample roadmap'}
                </span>
              </Link>
            </div>
          </aside>

          {/* RIGHT MAIN EDITORIAL READING COLUMN (8 Cols on LG — Warm Alabaster #F7F5EE) */}
          <div className="lg:col-span-8 p-4 sm:p-6 lg:p-10 space-y-8 bg-[#F7F5EE] dark:bg-[#11141C]">
            {/* 1. BREADCRUMB NAVIGATION (Mandatory on all content pages) */}
            <nav
              aria-label={sys.breadcrumbs.ariaLabel}
              className="text-xs text-[#6E6A61] dark:text-[#8E887C]"
            >
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link
                    href={homeHref}
                    className="hover:text-[#C8433C] dark:hover:text-[#DF5A53] hover:underline font-medium"
                  >
                    {sys.breadcrumbs.homeLabel}
                  </Link>
                </li>
                <li aria-hidden="true" className="px-1">
                  /
                </li>
                <li>
                  <span>{pageData.breadcrumbCategory}</span>
                </li>
                <li aria-hidden="true" className="px-1">
                  /
                </li>
                <li
                  aria-current="page"
                  className="font-semibold text-[#1A1D24] dark:text-[#F5F2EB]"
                >
                  {pageData.title}
                </li>
              </ol>
            </nav>

            {/* 2. PAGE HERO HEADER */}
            <header className="space-y-3 border-b border-[#E2DDD0] dark:border-[#282E3E] pb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C8433C] dark:text-[#DF5A53]">
                {pageData.kicker}
              </p>
              <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#1A1D24] dark:text-[#F5F2EB] leading-tight text-balance">
                {pageData.title}
              </h1>
              <p className="text-sm sm:text-base text-[#524F49] dark:text-[#B8B2A6] leading-relaxed max-w-2xl">
                {pageData.subtitle}
              </p>
              <p className="text-xs text-[#6E6A61] dark:text-[#8E887C] pt-1">
                {pageData.lastUpdated}
              </p>
            </header>

            {/* 3. LEGAL REVIEW NOTICE BANNER (On Privacy & Terms pages) */}
            {pageData.requiresLegalReviewBanner &&
              pageData.legalReviewBannerText && (
                <div
                  role="note"
                  className="rounded-[20px] border border-[#C8433C]/40 bg-[#F9E2DF]/60 dark:bg-[#2D1819]/70 p-4 sm:p-5 flex items-start gap-3"
                >
                  <AlertTriangle
                    className="w-5 h-5 text-[#C8433C] dark:text-[#DF5A53] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1 text-xs sm:text-sm text-[#1A1D24] dark:text-[#F5F2EB] leading-relaxed">
                    <p className="font-semibold">
                      {pageData.legalReviewBannerText}
                    </p>
                  </div>
                </div>
              )}

            {/* 4. WHAT VERIFICATION GUARANTEES VS. DOES NOT GUARANTEE (On How It Works page) */}
            {pageData.sixStagesGuarantees && (
              <section
                aria-label={
                  activeLocale === 'vi'
                    ? 'Phạm vi đảm bảo của cơ chế kiểm chứng'
                    : 'Verification guarantees and limitations'
                }
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div className="rounded-[22px] border border-[#146C43]/35 bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#146C43] dark:text-[#4ADE80]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <h2>
                      {
                        pageData.sixStagesGuarantees
                          .whatVerificationGuaranteesTitle
                      }
                    </h2>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                    {pageData.sixStagesGuarantees.whatVerificationGuarantees.map(
                      (item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="font-mono text-xs font-bold text-[#146C43] dark:text-[#4ADE80] mt-0.5"
                          >
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="rounded-[22px] border border-[#C8433C]/35 bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#C8433C] dark:text-[#DF5A53]">
                    <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <h2>
                      {
                        pageData.sixStagesGuarantees
                          .whatVerificationDoesNotGuaranteeTitle
                      }
                    </h2>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                    {pageData.sixStagesGuarantees.whatVerificationDoesNotGuarantee.map(
                      (item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="font-mono text-xs font-bold text-[#C8433C] dark:text-[#DF5A53] mt-0.5"
                          >
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </section>
            )}

            {/* 5. STRUCTURED PROSE SECTIONS */}
            {pageData.sections.length > 0 && (
              <div className="space-y-6">
                {pageData.sections.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 sm:p-6 space-y-3"
                  >
                    <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                      {sec.heading}
                    </h2>
                    <div className="space-y-3 text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed max-w-prose">
                      {sec.paragraphs.map((p, idx) => (
                        <p key={idx}>{renderTextWithPlaceholders(p)}</p>
                      ))}
                    </div>
                    {sec.bullets && sec.bullets.length > 0 && (
                      <ul className="pt-2 space-y-2 text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                        {sec.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span
                              aria-hidden="true"
                              className="text-[#C8433C] dark:text-[#DF5A53] font-bold"
                            >
                              ·
                            </span>
                            <span>{renderTextWithPlaceholders(b)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            )}

            {/* 6. INTERACTIVE FAQ LIST (When slug === 'faq') */}
            {pageData.faqItems && pageData.faqItems.length > 0 && (
              <section
                aria-label={pageData.title}
                className="space-y-5"
              >
                {/* Search & Category Filter Bar */}
                <div className="rounded-[20px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-4 space-y-3">
                  <div className="relative">
                    <label htmlFor="faq-search-input" className="sr-only">
                      {activeLocale === 'vi'
                        ? 'Tìm kiếm câu hỏi thường gặp'
                        : 'Search FAQ questions'}
                    </label>
                    <Search
                      className="w-4 h-4 text-[#6E6A61] dark:text-[#8E887C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="faq-search-input"
                      type="search"
                      value={faqQuery}
                      onChange={(e) => setFaqQuery(e.target.value)}
                      placeholder={
                        activeLocale === 'vi'
                          ? 'Tìm câu hỏi (ví dụ: ISBN, tiếng Việt, quyền riêng tư)...'
                          : 'Filter questions (e.g., ISBN, Vietnamese, privacy)...'
                      }
                      className="min-h-[42px] w-full pl-10 pr-4 py-2 rounded-full bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] text-xs sm:text-sm text-[#1A1D24] dark:text-[#F5F2EB]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        {
                          id: 'all',
                          labelVi: 'Tất cả (9)',
                          labelEn: 'All (9)',
                        },
                        {
                          id: 'verification',
                          labelVi: 'Kiểm chứng sách',
                          labelEn: 'Verification',
                        },
                        {
                          id: 'pipeline',
                          labelVi: 'Quy trình & Chủ đề',
                          labelEn: 'Pipeline',
                        },
                        {
                          id: 'features',
                          labelVi: 'Tinh chỉnh & Xuất file',
                          labelEn: 'Features',
                        },
                        {
                          id: 'privacy',
                          labelVi: 'Quyền riêng tư',
                          labelEn: 'Privacy',
                        },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFaqCategory(cat.id)}
                        className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          faqCategory === cat.id
                            ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                            : 'bg-[#EFECE3] dark:bg-[#171B26] text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                        }`}
                      >
                        {activeLocale === 'vi' ? cat.labelVi : cat.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ Accordion Items */}
                <div className="space-y-3">
                  {filteredFaqItems.map((faq) => (
                    <details
                      key={faq.id}
                      open
                      className="group rounded-[20px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5"
                    >
                      <summary className="font-serif-display text-base sm:text-lg font-bold text-[#1A1D24] dark:text-[#F5F2EB] cursor-pointer list-none flex items-center justify-between gap-3">
                        <span>{faq.question}</span>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#EFECE3] dark:bg-[#171B26] text-[#C8433C] dark:text-[#DF5A53] shrink-0">
                          {faq.category}
                        </span>
                      </summary>
                      <p className="mt-3 pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* 7. MAILTO CONTACT CARD (No contact form or new endpoint per Phase 8 rules) */}
            <section
              aria-label={
                activeLocale === 'vi' ? 'Liên hệ qua email' : 'Email contact'
              }
              className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#EFECE3]/75 dark:bg-[#171B26] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h2 className="font-serif-display text-base font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                  {activeLocale === 'vi'
                    ? 'Cần trao đổi thêm hoặc báo cáo thông tin?'
                    : 'Have a question or need to report an issue?'}
                </h2>
                <p className="text-xs text-[#524F49] dark:text-[#B8B2A6]">
                  {activeLocale === 'vi'
                    ? 'Liên hệ trực tiếp qua ứng dụng email của bạn (không qua biểu mẫu thu thập dữ liệu):'
                    : 'Reach out directly via your email client (no tracking form or server endpoint):'}{' '}
                  {renderTextWithPlaceholders(pageData.contactPlaceholderLabel)}
                </p>
              </div>

              <a
                href={pageData.contactMailtoHref}
                className="min-h-[42px] px-4 py-2 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0 self-start sm:self-auto"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {activeLocale === 'vi' ? 'Gửi Email (mailto)' : 'Send Email (mailto)'}
                </span>
              </a>
            </section>
          </div>
        </main>

        {/* SITE FOOTER */}
        <SiteFooter />
      </div>
    </div>
  );
}
