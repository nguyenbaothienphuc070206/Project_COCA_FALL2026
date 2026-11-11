'use client';

/**
 * Tính năng: Chân trang biên tập đầy đủ (SiteFooter) cho toàn bộ các trang của ShelfPath (Phase 8).
 * Trường hợp sử dụng:
 * - Cung cấp liên kết tới đầy đủ các trang công khai: Trang chủ, Cách hoạt động, Phương pháp & Nguồn dữ liệu, Về dự án, FAQ, Quyền riêng tư, Điều khoản & Miễn trừ, Khả năng tiếp cận.
 * - Có nút chuyển đổi ngôn ngữ theo đường dẫn (/en <-> /vi) giữ nguyên trạng thái và liên kết mailto liên hệ kèm nhãn [FILL IN].
 * - Tuyệt đối không chứa liên kết tới trang nội bộ /eval.
 */

import React from 'react';
import Link from 'next/link';
import { BookOpen, Globe, HelpCircle, Mail } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import {
  buildLocalizedPath,
  PUBLIC_NAV_LINKS,
} from '../lib/navigation';
import { SYSTEM_PAGES_CONTENT } from '../data/publicPagesContent';

interface SiteFooterProps {
  onReopenOnboarding?: () => void;
  localeOverride?: 'vi' | 'en';
}

export function SiteFooter({
  onReopenOnboarding,
  localeOverride,
}: SiteFooterProps) {
  const { locale: contextLocale, setLocale, t } = useTranslation();
  const locale = localeOverride ?? contextLocale;
  const sys = SYSTEM_PAGES_CONTENT[locale];

  const productLinks = PUBLIC_NAV_LINKS.filter((l) => l.category === 'product');
  const trustLinks = PUBLIC_NAV_LINKS.filter((l) => l.category === 'trust');
  const legalLinks = PUBLIC_NAV_LINKS.filter((l) => l.category === 'legal');

  return (
    <footer
      aria-label={locale === 'vi' ? 'Chân trang thông tin chung' : 'Site footer'}
      className="mt-auto border-t border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] text-[#524F49] dark:text-[#B8B2A6] px-4 sm:px-6 lg:px-8 py-8 space-y-6 no-print"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Col 1: Brand, Tagline, Mailto Contact & Language Switch (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full border border-[#1A1D24] dark:border-[#F5F2EB] flex items-center justify-center font-serif-display font-bold text-xs text-[#1A1D24] dark:text-[#F5F2EB] bg-[#FDFCF9] dark:bg-[#1E2330] shrink-0">
              SP
            </span>
            <span className="font-serif-display font-bold text-base text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.brand.name}
            </span>
          </div>

          <p className="text-xs leading-relaxed max-w-md">{t.footer.tagline}</p>

          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
            <Mail
              className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53] shrink-0"
              aria-hidden="true"
            />
            <span className="font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
              {sys.footer.contactLabel}
            </span>
            <a
              href="mailto:contact@example.com?subject=ShelfPath%20Inquiry"
              className="underline decoration-[#C8433C]/60 hover:text-[#C8433C] dark:hover:text-[#DF5A53] font-mono text-[11px] transition-colors"
            >
              {sys.footer.contactEmailPlaceholder}
            </a>
          </div>

          {/* Path-based Language Switch (/vi <-> /en) + Reopen Onboarding */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label={sys.footer.languageSwitchLabel}
              className="inline-flex items-center rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-1 gap-1"
            >
              <Globe
                className="w-3.5 h-3.5 text-[#6E6A61] dark:text-[#8E887C] ml-2"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setLocale('vi')}
                aria-pressed={locale === 'vi'}
                className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  locale === 'vi'
                    ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                    : 'text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                }`}
              >
                Tiếng Việt (/vi)
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
                className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  locale === 'en'
                    ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                    : 'text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                }`}
              >
                English (/en)
              </button>
            </div>

            {onReopenOnboarding && (
              <button
                type="button"
                onClick={onReopenOnboarding}
                className="min-h-[36px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <HelpCircle
                  className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53]"
                  aria-hidden="true"
                />
                <span>{sys.footer.openOnboardingLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Col 2: Product Links (2 cols) */}
        <nav
          aria-label={sys.footer.productHeading}
          className="lg:col-span-2 space-y-2.5"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-[#F5F2EB]">
            {sys.footer.productHeading}
          </h2>
          <ul className="space-y-2 text-xs">
            {productLinks.map((item) => (
              <li key={item.slug || 'home'}>
                <Link
                  href={buildLocalizedPath(locale, item.slug)}
                  className="hover:text-[#C8433C] dark:hover:text-[#DF5A53] hover:underline transition-colors inline-block py-0.5"
                >
                  {locale === 'vi' ? item.labelVi : item.labelEn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Col 3: Methodology & FAQ Links (2 cols) */}
        <nav
          aria-label={sys.footer.trustHeading}
          className="lg:col-span-2 space-y-2.5"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-[#F5F2EB]">
            {sys.footer.trustHeading}
          </h2>
          <ul className="space-y-2 text-xs">
            {trustLinks.map((item) => (
              <li key={item.slug}>
                <Link
                  href={buildLocalizedPath(locale, item.slug)}
                  className="hover:text-[#C8433C] dark:hover:text-[#DF5A53] hover:underline transition-colors inline-block py-0.5"
                >
                  {locale === 'vi' ? item.labelVi : item.labelEn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Col 4: Legal & Accessibility Links (3 cols) */}
        <nav
          aria-label={sys.footer.legalHeading}
          className="lg:col-span-3 space-y-2.5"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1D24] dark:text-[#F5F2EB]">
            {sys.footer.legalHeading}
          </h2>
          <ul className="space-y-2 text-xs">
            {legalLinks.map((item) => (
              <li key={item.slug}>
                <Link
                  href={buildLocalizedPath(locale, item.slug)}
                  className="hover:text-[#C8433C] dark:hover:text-[#DF5A53] hover:underline transition-colors inline-block py-0.5"
                >
                  {locale === 'vi' ? item.labelVi : item.labelEn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom Data Sources Attribution & Privacy Strip */}
      <div className="pt-4 border-t border-[#E2DDD0] dark:border-[#282E3E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[#6E6A61] dark:text-[#8E887C]">
        <div className="flex items-start gap-2 max-w-3xl">
          <BookOpen
            className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{sys.footer.noEndorsementNotice}</span>
        </div>
        <span className="shrink-0">{t.footer.privacyGuarantee}</span>
      </div>
    </footer>
  );
}
