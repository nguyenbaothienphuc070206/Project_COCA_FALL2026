'use client';

/**
 * Tính năng: Kệ sách phiên làm việc cá nhân (My Shelf — Phase 4) lưu trữ hoàn toàn trên trình duyệt.
 * Trường hợp sử dụng: Quản lý sách đã lưu, sắp xếp lại thứ tự đọc (Move Up / Move Down), cập nhật trạng thái (Sắp đọc, Đang đọc, Đã xong), thống kê số lượng và Xuất dữ liệu (Markdown UTF-8, CSV UTF-8 BOM, Bản in / Lưu PDF).
 */

import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Printer,
  Shield,
  Trash2,
} from 'lucide-react';
import { ReadingStatus, SavedShelfItem, VerifiedBook } from '../types/book';
import { useTranslation } from '../i18n/useTranslation';
import {
  formatShelfAsCsvWithBom,
  formatShelfAsMarkdown,
  getPrimaryVerificationUrl,
} from '../lib/exportFormatters';
import { ProceduralBookCover } from './ProceduralBookCover';

interface MyShelfViewProps {
  items: SavedShelfItem[];
  topicTitle?: string;
  onUpdateStatus: (bookId: string, status: ReadingStatus) => void;
  onReorderBook: (bookId: string, direction: 'up' | 'down') => void;
  onRemoveBook: (bookId: string) => void;
  onClearShelf: () => void;
  onOpenTrustDrawer: (book: VerifiedBook) => void;
  onSwitchToDiscover: () => void;
}

export function MyShelfView({
  items,
  topicTitle,
  onUpdateStatus,
  onReorderBook,
  onRemoveBook,
  onClearShelf,
  onOpenTrustDrawer,
  onSwitchToDiscover,
}: MyShelfViewProps) {
  const { locale, t } = useTranslation();

  const totalCount = items.length;
  const toReadCount = items.filter((i) => i.status === 'to_read').length;
  const readingCount = items.filter((i) => i.status === 'reading').length;
  const doneCount = items.filter((i) => i.status === 'done').length;
  const totalPages = items.reduce((acc, i) => acc + i.book.pageCount, 0);

  const statsSummary = t.myShelf.statsSummaryTemplate
    .replace('{total}', String(totalCount))
    .replace('{toRead}', String(toReadCount))
    .replace('{reading}', String(readingCount))
    .replace('{done}', String(doneCount))
    .replace('{pages}', String(totalPages));

  const triggerBrowserDownload = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = formatShelfAsMarkdown(items, locale, topicTitle);
    triggerBrowserDownload(
      md,
      'shelfpath-verified-roadmap.md',
      'text/markdown;charset=utf-8',
    );
  };

  const handleExportCsv = () => {
    const csvWithBom = formatShelfAsCsvWithBom(items, locale);
    triggerBrowserDownload(
      csvWithBom,
      'shelfpath-verified-roadmap.csv',
      'text/csv;charset=utf-8',
    );
  };

  const handlePrintPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <section className="space-y-6">
      {/* Header + Counts + Export & Clear Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E2DDD0] dark:border-[#282E3E]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
            {t.myShelf.title}
          </h1>
          <p className="text-sm text-[#524F49] dark:text-[#B8B2A6]">
            {t.myShelf.subtitle}
          </p>
          {items.length > 0 && (
            <p className="text-xs font-mono font-semibold text-[#C8433C] dark:text-[#DF5A53] pt-1">
              {statsSummary}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Export Markdown (.md) */}
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="min-h-[42px] px-4 py-2 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.myShelf.exportMarkdownBtn}</span>
            </button>

            {/* Export CSV (UTF-8 with BOM) */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[42px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet
                className="w-3.5 h-3.5 text-[#146C43] dark:text-[#4ADE80]"
                aria-hidden="true"
              />
              <span>{t.myShelf.exportCsvBtn}</span>
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrintPdf}
              className="min-h-[42px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer
                className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53]"
                aria-hidden="true"
              />
              <span>{t.myShelf.printPdfBtn}</span>
            </button>

            {/* Clear All */}
            <button
              type="button"
              onClick={onClearShelf}
              className="min-h-[42px] px-4 py-2 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold text-[#BE123C] dark:text-[#FB7185] hover:bg-[#F9E2DF]/40 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.myShelf.clearShelfBtn}</span>
            </button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="px-4 py-2.5 rounded-xl bg-[#EFECE3] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E] flex items-center gap-2 text-xs text-[#524F49] dark:text-[#B8B2A6]">
          <Download
            className="w-3.5 h-3.5 text-[#C8433C] dark:text-[#DF5A53] shrink-0"
            aria-hidden="true"
          />
          <span>{t.myShelf.exportDisclaimer}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-8 sm:p-12 text-center">
          <BookOpen
            className="w-10 h-10 text-[#C8433C] dark:text-[#DF5A53] mx-auto mb-3"
            aria-hidden="true"
          />
          <h2 className="text-lg font-serif-display font-semibold text-[#1A1D24] dark:text-[#F5F2EB]">
            {t.myShelf.emptyStateTitle}
          </h2>
          <p className="text-sm text-[#524F49] dark:text-[#B8B2A6] max-w-md mx-auto mt-2 mb-6">
            {t.myShelf.emptyStateGuide}
          </p>
          <button
            type="button"
            onClick={onSwitchToDiscover}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-sm font-semibold cursor-pointer"
          >
            {t.nav.discover}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ book, status }, idx) => {
            const reason =
              locale === 'vi' ? book.matchReasonVi : book.matchReasonEn;
            const sourceUrl = getPrimaryVerificationUrl(book);

            return (
              <div
                key={book.id}
                className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 print-card"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                  <div className="shrink-0 no-print">
                    <ProceduralBookCover
                      book={{ ...book, roadmapStepOrder: idx + 1 }}
                      size="sm"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#C8433C] dark:text-[#DF5A53]">
                      <span className="tabular-nums">
                        {t.cards.stepPrefix} {idx + 1}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums text-[#524F49] dark:text-[#B8B2A6]">
                        {book.pageCount} {t.cards.pagesUnit}
                      </span>
                      {book.verification.isbn13 && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono text-[#6E6A61] dark:text-[#8E887C]">
                            ISBN {book.verification.isbn13}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-serif-display font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                      {book.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6]">
                      {book.authors.join(', ')}
                    </p>
                    <p className="text-xs italic text-[#524F49] dark:text-[#B8B2A6] leading-relaxed">
                      &ldquo;{reason}&rdquo;
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#146C43] dark:text-[#4ADE80] inline-flex items-center gap-1 hover:underline"
                      >
                        <span>{sourceUrl}</span>
                        <ExternalLink className="w-3 h-3 no-print" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Controls: Reorder Up/Down + Reading Status + Trust Drawer + Remove */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
                  {/* Reorder Up / Down */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onReorderBook(book.id, 'up')}
                      aria-label={`${t.myShelf.moveUpBtn}: ${book.title}`}
                      title={t.myShelf.moveUpBtn}
                      className="w-9 h-9 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] flex items-center justify-center text-[#1A1D24] dark:text-[#F5F2EB] disabled:opacity-35 hover:border-[#C8433C] cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => onReorderBook(book.id, 'down')}
                      aria-label={`${t.myShelf.moveDownBtn}: ${book.title}`}
                      title={t.myShelf.moveDownBtn}
                      className="w-9 h-9 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] flex items-center justify-center text-[#1A1D24] dark:text-[#F5F2EB] disabled:opacity-35 hover:border-[#C8433C] cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Segmented reading status buttons */}
                  <div className="flex items-center gap-1 p-1 rounded-full bg-[#EFECE3] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E]">
                    {(['to_read', 'reading', 'done'] as ReadingStatus[]).map(
                      (st) => {
                        const label =
                          st === 'to_read'
                            ? t.myShelf.statusToRead
                            : st === 'reading'
                              ? t.myShelf.statusReading
                              : t.myShelf.statusDone;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onUpdateStatus(book.id, st)}
                            className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              status === st
                                ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                                : 'text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTrustDrawer(book)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] hover:border-[#C8433C] cursor-pointer"
                  >
                    {t.cards.howWeCheckedBtn}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveBook(book.id)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold text-[#BE123C] dark:text-[#FB7185] hover:border-[#BE123C] cursor-pointer"
                  >
                    {t.myShelf.removeBookBtn}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 rounded-[18px] bg-[#EFECE3] dark:bg-[#171B26] border border-[#E2DDD0] dark:border-[#282E3E] flex items-center gap-3 text-xs text-[#524F49] dark:text-[#B8B2A6]">
        <Shield
          className="w-4 h-4 text-[#C8433C] dark:text-[#DF5A53] shrink-0"
          aria-hidden="true"
        />
        <span>{t.myShelf.privacyNotice}</span>
      </div>
    </section>
  );
}
