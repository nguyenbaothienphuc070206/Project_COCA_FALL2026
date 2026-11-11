'use client';

/**
 * Tính năng: Tờ Hồ sơ Kiểm chứng & Chi tiết Sách (TrustDrawer) lấy cảm hứng trực tiếp từ Màn hình 3 của thiết kế E-Book Dashboard, tích hợp tra cứu Ấn bản Tiếng Việt (GET /api/books/[bookId]/editions).
 * Trường hợp sử dụng: Hiển thị bìa sách đứng lớn bên trái, tiêu đề Serif, lý do gợi ý in nghiêng, nút pill đen mở danh mục gốc (Open Library / Google Books), lưới thông số 2 cột và trạng thái ấn bản Tiếng Việt có liên kết nguồn.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Globe2,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  VerificationDetail,
  VerifiedBook,
  VietnameseEditionInfo,
} from '../types/book';
import { useTranslation } from '../i18n/useTranslation';
import {
  fetchBookVerificationDetail,
  fetchBookVietnameseEditions,
} from '../lib/api';
import { sanitizeExternalSourceUrl } from '../lib/urlSecurity';
import { ProceduralBookCover } from './ProceduralBookCover';

interface TrustDrawerProps {
  book: VerifiedBook | null;
  onClose: () => void;
}

export function TrustDrawer({ book, onClose }: TrustDrawerProps) {
  const { locale, t } = useTranslation();
  const [loadedEditionRecord, setLoadedEditionRecord] = useState<{
    bookId: string;
    verification: VerificationDetail | null;
    info: VietnameseEditionInfo | null;
  } | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const bookId = book?.id ?? null;

  useEffect(() => {
    if (!bookId) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 30);

    const controller = new AbortController();
    let active = true;
    Promise.all([
      fetchBookVerificationDetail(bookId, controller.signal),
      fetchBookVietnameseEditions(bookId, controller.signal),
    ]).then(([verification, info]) => {
      if (active) {
        setLoadedEditionRecord({ bookId, verification, info });
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [bookId, onClose]);

  if (!book) return null;

  const checkingEdition = loadedEditionRecord?.bookId !== book.id;
  const liveEditionInfo =
    loadedEditionRecord?.bookId === book.id ? loadedEditionRecord.info : null;
  const liveVerification =
    loadedEditionRecord?.bookId === book.id
      ? loadedEditionRecord.verification
      : null;
  const verification = liveVerification ?? book.verification;
  const editionToUse = liveEditionInfo ?? book.vietnameseEdition;
  const similarityPercent = Math.round(verification.titleSimilarityScore * 100);
  const matchReason = locale === 'vi' ? book.matchReasonVi : book.matchReasonEn;
  const descriptionText =
    locale === 'vi' ? book.shortDescriptionVi : book.shortDescriptionEn;
  const stepReason =
    locale === 'vi' ? book.roadmapStepReasonVi : book.roadmapStepReasonEn;
  const viEditionNote =
    locale === 'vi'
      ? editionToUse.publisherOrNoteVi
      : editionToUse.publisherOrNoteEn;

  const safeOpenLibraryUrl = sanitizeExternalSourceUrl(
    verification.openLibraryUrl,
  );
  const safeGoogleBooksUrl = sanitizeExternalSourceUrl(
    verification.googleBooksUrl,
  );

  const viEditionUrl = sanitizeExternalSourceUrl(
    editionToUse.sourceUrl ||
      (editionToUse.available
        ? verification.openLibraryUrl || verification.googleBooksUrl
        : undefined),
  );

  const matchedSourceLabel =
    verification.matchedSources === 'both'
      ? 'Open Library & Google Books'
      : verification.matchedSources === 'open_library'
        ? 'Open Library'
        : 'Google Books';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trust-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-[28px] bg-[#EFECE3] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cream Band: Standing Cover + Serif Title & Primary Pill CTAs (Reference Screen 3 layout) */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t.trustDrawer.closeBtn}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E] flex items-center justify-center text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Left Large Standing Book Cover */}
          <div className="shrink-0">
            <ProceduralBookCover book={book} size="lg" />
          </div>

          {/* Right Header Info */}
          <div className="flex-1 space-y-4 text-center md:text-left pr-0 md:pr-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>{t.trustDrawer.verifiedStatusText}</span>
            </div>

            <h2
              id="trust-drawer-title"
              className="font-serif-display text-2xl sm:text-4xl font-bold text-[#1A1D24] dark:text-[#F5F2EB] leading-tight"
            >
              {book.title}
            </h2>

            <p className="text-sm sm:text-base font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {book.authors.join(', ')}
            </p>

            <p className="text-sm italic text-[#524F49] dark:text-[#B8B2A6] leading-relaxed max-w-xl">
              &ldquo;{matchReason}&rdquo;
            </p>

            {/* Primary Pill CTA + External Record Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {safeOpenLibraryUrl && (
                <a
                  href={safeOpenLibraryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <span>{t.trustDrawer.openInOpenLibrary}</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}

              {safeGoogleBooksUrl && (
                <a
                  href={safeGoogleBooksUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-[#1A1D24] dark:text-[#F5F2EB] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:border-[#C8433C] transition-colors"
                >
                  <span>{t.trustDrawer.openInGoogleBooks}</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Lower White Sheet: 2-Column Editorial Specification Grid (Reference Screen 3 lower sheet) */}
        <div className="bg-[#FDFCF9] dark:bg-[#1E2330] p-6 sm:p-8 border-t border-[#E2DDD0] dark:border-[#282E3E] grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column (7 cols): Description, Step Rationale & Fail-Closed Guarantee */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.trustDrawer.descriptionHeader}
            </h3>
            <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
              {descriptionText}
            </p>
            <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
              <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                {t.cards.roadmapOrderReasonLabel}
              </strong>{' '}
              {stepReason}
            </p>

            <div className="p-3.5 rounded-2xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] flex items-start gap-2.5 text-xs text-[#524F49] dark:text-[#B8B2A6]">
              <CheckCircle2
                className="w-4 h-4 text-[#146C43] dark:text-[#4ADE80] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{t.trustDrawer.failClosedNote}</span>
            </div>
          </div>

          {/* Right Column (5 cols): Catalog Verification Metadata, Language, Paperback/ISBN & Vietnamese Edition */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.trustDrawer.editionMetadataHeader}
            </h3>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2 py-1.5 border-b border-[#E2DDD0] dark:border-[#282E3E]">
                <dt className="text-[#6E6A61] dark:text-[#8E887C]">
                  {t.trustDrawer.matchedSourcesLabel}
                </dt>
                <dd className="font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                  {matchedSourceLabel}
                </dd>
              </div>

              <div className="flex justify-between gap-2 py-1.5 border-b border-[#E2DDD0] dark:border-[#282E3E]">
                <dt className="text-[#6E6A61] dark:text-[#8E887C]">
                  {t.trustDrawer.titleSimilarityLabel}
                </dt>
                <dd className="font-mono font-bold text-[#146C43] dark:text-[#4ADE80]">
                  {similarityPercent}%
                </dd>
              </div>

              <div className="flex justify-between gap-2 py-1.5 border-b border-[#E2DDD0] dark:border-[#282E3E]">
                <dt className="text-[#6E6A61] dark:text-[#8E887C]">
                  {t.trustDrawer.authorSurnameLabel}
                </dt>
                <dd className="font-mono font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                  {verification.authorSurnameMatched}
                </dd>
              </div>

              <div className="flex justify-between gap-2 py-1.5 border-b border-[#E2DDD0] dark:border-[#282E3E]">
                <dt className="text-[#6E6A61] dark:text-[#8E887C]">
                  {t.trustDrawer.isbnLabel}
                </dt>
                <dd className="font-mono text-[#1A1D24] dark:text-[#F5F2EB]">
                  {verification.isbn13 ?? '—'} · {book.pageCount}{' '}
                  {t.cards.pagesUnit}
                </dd>
              </div>

              <div className="pt-2 p-3 rounded-xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] space-y-1.5">
                <dt className="font-semibold text-[#1A1D24] dark:text-[#F5F2EB] flex items-center gap-1.5">
                  <Globe2
                    className={`w-4 h-4 ${
                      editionToUse.available
                        ? 'text-[#146C43] dark:text-[#4ADE80]'
                        : 'text-[#6E6A61] dark:text-[#8E887C]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {checkingEdition
                      ? t.trustDrawer.checkingEditionText
                      : editionToUse.available
                        ? t.cards.vietnameseEditionAvailable
                        : t.cards.vietnameseEditionNotKnown}
                  </span>
                </dt>
                <dd className="text-[#524F49] dark:text-[#B8B2A6]">
                  {viEditionNote}
                </dd>
                {editionToUse.available && viEditionUrl && (
                  <div className="pt-1">
                    <a
                      href={viEditionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#146C43] dark:text-[#4ADE80] hover:underline"
                    >
                      <span>{t.cards.vietnameseEditionSourceLink}</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
