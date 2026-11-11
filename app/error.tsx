'use client';

/**
 * Tính năng: Trang lỗi hệ thống 500 (Next.js App Router Error Page) theo thiết kế Phase 3A ở Giai đoạn 8.
 * Trường hợp sử dụng: Bắt các lỗi runtime không mong muốn ở cấp độ route, tuyệt đối không lộ stack trace thô ra màn hình và cung cấp nút Thử lại hoặc Quay về Trang chủ.
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, ArrowLeft, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/src/i18n/useTranslation';
import { SYSTEM_PAGES_CONTENT } from '@/src/data/publicPagesContent';
import { buildLocalizedPath } from '@/src/lib/navigation';
import { SiteFooter } from '@/src/components/SiteFooter';

export default function GlobalRouteErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale, t } = useTranslation();
  const sys = SYSTEM_PAGES_CONTENT[locale];
  const homeHref = buildLocalizedPath(locale, '');

  useEffect(() => {
    console.error('[ShelfPath Route Error Boundary]:', error.digest || 'ERR_500');
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#DCD9CE] dark:bg-[#090B10] text-[#1A1D24] dark:text-[#F5F2EB] lg:p-4 xl:p-6 transition-colors">
      <div className="max-w-[1440px] mx-auto min-h-screen lg:min-h-[calc(100vh-3rem)] lg:rounded-[28px] bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] shadow-[0_24px_60px_-15px_rgba(24,22,20,0.18)] flex flex-col overflow-hidden">
        <header className="min-h-[72px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E2DDD0] dark:border-[#282E3E] flex items-center justify-between">
          <Link
            href={homeHref}
            className="min-h-[44px] inline-flex items-center gap-3 rounded-xl px-1"
          >
            <span className="w-10 h-10 rounded-full border-2 border-[#1A1D24] dark:border-[#F5F2EB] flex items-center justify-center font-serif-display font-bold text-base bg-[#FDFCF9] dark:bg-[#1E2330] shrink-0">
              SP
            </span>
            <span className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.brand.name}
            </span>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center">
          <div
            role="alert"
            className="max-w-xl w-full rounded-[26px] border border-[#C8433C]/40 bg-[#FDFCF9] dark:bg-[#1E2330] p-6 sm:p-10 space-y-5 shadow-xs"
          >
            <div className="w-14 h-14 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] flex items-center justify-center mx-auto">
              <AlertOctagon className="w-7 h-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#C8433C] dark:text-[#DF5A53]">
                {sys.serverError.codeLabel}
              </p>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1D24] dark:text-[#F5F2EB] text-balance">
                {sys.serverError.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                {sys.serverError.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => reset()}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C8433C] dark:bg-[#DF5A53] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{sys.serverError.retryCta}</span>
              </button>

              <Link
                href={homeHref}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{sys.serverError.backHomeCta}</span>
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
