'use client';

/**
 * Tính năng: Thẻ sách Đã kiểm chứng (BookCard) theo phong cách E-Book Dashboard (Phase 3A, 3B & Phase 4).
 * Trường hợp sử dụng: Kết hợp bìa sách thủ tục đứng (ProceduralBookCover) đổ bóng sâu, hiệu ứng chuyển dịch vị trí (diffStatus: moved_up, new), điểm Embeddings + MMR, huy hiệu xác thực Open Library / Google Books và thông tin Ấn bản Tiếng Việt kèm liên kết nguồn.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Globe2,
  Info,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { VerifiedBook } from '../types/book';
import { useTranslation } from '../i18n/useTranslation';
import {
  getSafeSourceUrlOrFallback,
  sanitizeExternalSourceUrl,
} from '../lib/urlSecurity';
import { ProceduralBookCover } from './ProceduralBookCover';

interface BookCardProps {
  book: VerifiedBook;
  isSaved: boolean;
  onToggleSave: (book: VerifiedBook) => void;
  onDismiss: (bookId: string) => void;
  onOpenTrustDrawer: (book: VerifiedBook) => void;
}

export function BookCard({
  book,
  isSaved,
  onToggleSave,
  onDismiss,
  onOpenTrustDrawer,
}: BookCardProps) {
  const { locale, t } = useTranslation();

  const stageLabel =
    locale === 'vi' ? book.roadmapStageLabelVi : book.roadmapStageLabelEn;
  const matchReason = locale === 'vi' ? book.matchReasonVi : book.matchReasonEn;
  const stepReason =
    locale === 'vi' ? book.roadmapStepReasonVi : book.roadmapStepReasonEn;
  const viNote =
    locale === 'vi'
      ? book.vietnameseEdition.publisherOrNoteVi
      : book.vietnameseEdition.publisherOrNoteEn;

  const badgeLabel =
    book.verification.matchedSources === 'both'
      ? t.cards.verifiedBoth
      : book.verification.matchedSources === 'open_library'
        ? t.cards.verifiedOpenLibrary
        : t.cards.verifiedGoogleBooks;

  const primaryExternalUrl = getSafeSourceUrlOrFallback(
    book.verification.openLibraryUrl || book.verification.googleBooksUrl,
    book.title,
  );

  const viEditionUrl = sanitizeExternalSourceUrl(
    book.vietnameseEdition.sourceUrl ||
      (book.vietnameseEdition.available ? primaryExternalUrl : undefined),
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group rounded-[22px] border bg-[#FDFCF9] dark:bg-[#1E2330] p-4 sm:p-5 flex flex-col justify-between gap-4 hover:border-[#C8433C]/50 dark:hover:border-[#DF5A53]/50 transition-all shadow-[0_10px_28px_-12px_rgba(24,22,20,0.08)] ${
        book.diffStatus === 'new' || book.diffStatus === 'moved_up'
          ? 'border-[#C8433C]/60 dark:border-[#DF5A53]/60 ring-1 ring-[#C8433C]/20'
          : 'border-[#E2DDD0] dark:border-[#282E3E]'
      }`}
    >
      <div className="space-y-4">
        {/* Top Row: Step Pill, Diff Status Animation Badge, Verification Badge & MMR Score */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#EFECE3] dark:bg-[#171B26] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
              {stageLabel}
            </span>

            {/* Diff Animation Badge (moved_up / moved_down / new) */}
            {book.diffStatus === 'moved_up' && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80] text-[11px] font-bold inline-flex items-center gap-1 animate-pulse">
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                <span>
                  {t.cards.diffMovedUp}
                  {book.previousStepOrder
                    ? ` (#${book.previousStepOrder} → #${book.roadmapStepOrder})`
                    : ''}
                </span>
              </span>
            )}
            {book.diffStatus === 'moved_down' && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#EFECE3] dark:bg-[#171B26] text-[#524F49] dark:text-[#B8B2A6] text-[11px] font-semibold inline-flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
                <span>{t.cards.diffMovedDown}</span>
              </span>
            )}
            {book.diffStatus === 'new' && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] text-[11px] font-bold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span>{t.cards.diffNewReplacement}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80] text-[11px] font-semibold inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{badgeLabel}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#F9E2DF] dark:bg-[#2D1819] text-[#C8433C] dark:text-[#DF5A53] text-[11px] font-mono font-semibold">
              {t.cards.relevanceBadge} {Math.round(book.relevanceScore * 100)}%
            </span>
          </div>
        </div>

        {/* Main Split: Standing Procedural Book Cover + Editorial Book Info */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <button
            type="button"
            onClick={() => onOpenTrustDrawer(book)}
            aria-label={`${t.cards.howWeCheckedBtn}: ${book.title}`}
            className="mx-auto sm:mx-0 shrink-0 rounded-r-[12px] cursor-pointer group-hover:-translate-y-1 transition-transform"
          >
            <ProceduralBookCover book={book} size="md" />
          </button>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1D24] dark:text-[#F5F2EB] leading-snug">
                {book.title}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#524F49] dark:text-[#B8B2A6] mt-0.5">
                {book.authors.join(', ')} ·{' '}
                <span className="font-mono text-[#C8433C] dark:text-[#DF5A53]">
                  {book.pageCount}
                </span>{' '}
                {t.cards.pagesUnit}
                {book.verification.firstPublishYear
                  ? ` · ${book.verification.firstPublishYear}`
                  : ''}
              </p>
            </div>

            {/* Plain-language Match Reason (Italic Editorial Quote Style from Reference) */}
            <div className="p-3 rounded-2xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] space-y-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#C8433C] dark:text-[#DF5A53]">
                {t.cards.whyMatchLabel}
              </span>
              <p className="text-xs sm:text-[13px] italic text-[#1A1D24] dark:text-[#F5F2EB] leading-relaxed">
                &ldquo;{matchReason}&rdquo;
              </p>
            </div>

            {/* Roadmap Step Order Explanation */}
            <p className="text-xs text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
              <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                {t.cards.roadmapOrderReasonLabel}
              </strong>{' '}
              {stepReason}
            </p>
          </div>
        </div>

        {/* Vietnamese Edition Indicator Strip with Direct Source Link when Found */}
        <div className="px-3.5 py-2.5 rounded-xl bg-[#EFECE3]/65 dark:bg-[#171B26] flex flex-wrap items-center justify-between gap-2 text-xs text-[#524F49] dark:text-[#B8B2A6]">
          <div className="flex items-start gap-2">
            <Globe2
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                book.vietnameseEdition.available
                  ? 'text-[#146C43] dark:text-[#4ADE80]'
                  : 'text-[#6E6A61] dark:text-[#8E887C]'
              }`}
              aria-hidden="true"
            />
            <div>
              <span className="font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
                {book.vietnameseEdition.available
                  ? `${t.cards.vietnameseEditionAvailable}:`
                  : t.cards.vietnameseEditionNotKnown}
              </span>{' '}
              {book.vietnameseEdition.available ? (
                <span>{viNote}</span>
              ) : (
                <span className="text-[11px] opacity-85">
                  ({book.vietnameseEdition.sourceName || 'Open Library & Google Books'})
                </span>
              )}
            </div>
          </div>

          {book.vietnameseEdition.available && viEditionUrl && (
            <a
              href={viEditionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-full bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80] text-[11px] font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
            >
              <span>{t.cards.vietnameseEditionSourceLink}</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      {/* Bottom Action Bar (Pill CTAs + Circular Icon Actions matching Reference Screen 3) */}
      <div className="pt-3 border-t border-[#E2DDD0] dark:border-[#282E3E] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(book)}
            className={`min-h-[44px] px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white shadow-xs'
                : 'bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] hover:opacity-90'
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {isSaved ? t.cards.savedInShelfBtn : t.cards.saveToShelfBtn}
            </span>
          </button>

          <button
            type="button"
            aria-label={`${t.cards.howWeCheckedBtn}: ${book.title}`}
            onClick={() => onOpenTrustDrawer(book)}
            className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info
              className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53]"
              aria-hidden="true"
            />
            <span>{t.cards.howWeCheckedBtn}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={primaryExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-3 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-medium text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB] inline-flex items-center gap-1 transition-colors"
          >
            <span>
              {book.verification.openLibraryUrl
                ? t.cards.sourceLinkOpenLibrary
                : t.cards.sourceLinkGoogleBooks}
            </span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => onDismiss(book.id)}
            title={t.cards.notInterestedBtn}
            aria-label={`${t.cards.notInterestedBtn}: ${book.title}`}
            className="min-h-[44px] px-3 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] text-xs font-medium text-[#524F49] dark:text-[#B8B2A6] hover:text-[#BE123C] hover:border-[#BE123C] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t.cards.notInterestedBtn}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
