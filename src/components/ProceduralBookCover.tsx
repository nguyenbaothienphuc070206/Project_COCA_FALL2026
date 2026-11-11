'use client';

/**
 * Tính năng: Bộ tạo Bìa sách Thủ tục (Procedural Book Cover Generator) theo phong cách E-Book Dashboard.
 * Trường hợp sử dụng: Sinh bìa sách 3D/2D độc bản dựa trên nhan đề, tác giả và màu sắc mà không sao chép ảnh bìa có bản quyền.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { VerifiedBook } from '../types/book';

interface ProceduralBookCoverProps {
  book: VerifiedBook;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showStepBadge?: boolean;
}

/**
 * Băm chuỗi thành số nguyên tất định để chọn họa tiết hình học cho bìa sách.
 */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function ProceduralBookCover({
  book,
  size = 'md',
  className = '',
  showStepBadge = true,
}: ProceduralBookCoverProps) {
  const seed = hashString(`${book.title}-${book.authors[0] || ''}`);
  const patternVariant = seed % 4;
  const baseColor = book.coverColorHex || '#1D2D44';

  const sizeClasses =
    size === 'lg'
      ? 'w-48 sm:w-56 aspect-[2/3] p-5'
      : size === 'sm'
        ? 'w-24 sm:w-28 aspect-[2/3] p-2.5'
        : 'w-32 sm:w-36 aspect-[2/3] p-3.5';

  const titleClasses =
    size === 'lg'
      ? 'text-base sm:text-lg leading-snug line-clamp-3'
      : size === 'sm'
        ? 'text-[10px] leading-tight line-clamp-3'
        : 'text-xs sm:text-[13px] leading-snug line-clamp-3';

  const authorClasses =
    size === 'lg'
      ? 'text-xs'
      : size === 'sm'
        ? 'text-[9px]'
        : 'text-[10px]';

  return (
    <div
      className={`relative select-none overflow-hidden rounded-l-[4px] rounded-r-[12px] book-cover-shadow flex flex-col justify-between text-[#FDFCF9] shrink-0 transition-transform duration-300 ${sizeClasses} ${className}`}
      style={{
        background: `linear-gradient(145deg, ${baseColor} 0%, #10141D 100%)`,
      }}
      aria-hidden="true"
    >
      {/* Realistic Left Hardcover Spine Crease & Highlight */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3.5 z-10"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(0,0,0,0.38) 45%, rgba(255,255,255,0.12) 75%, transparent 100%)',
        }}
      />

      {/* Inner Gold Foil Editorial Frame */}
      <div className="pointer-events-none absolute inset-2.5 left-4 rounded-r-[7px] border border-[#F5E6C8]/25" />

      {/* Procedural Geometric Emblem (SVG) */}
      <svg
        viewBox="0 0 120 120"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
      >
        <defs>
          <radialGradient id={`glow-${book.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="64" cy="64" r="46" fill={`url(#glow-${book.id})`} />
        {patternVariant === 0 && (
          <g stroke="#FDE68A" strokeWidth="1" fill="none">
            <circle cx="64" cy="64" r="34" />
            <circle cx="64" cy="64" r="22" strokeDasharray="3 3" />
            <polygon points="64,24 98,64 64,104 30,64" />
          </g>
        )}
        {patternVariant === 1 && (
          <g stroke="#FDE68A" strokeWidth="1" fill="none">
            <rect x="34" y="34" width="60" height="60" rx="6" />
            <rect
              x="34"
              y="34"
              width="60"
              height="60"
              rx="6"
              transform="rotate(45 64 64)"
            />
            <circle cx="64" cy="64" r="14" />
          </g>
        )}
        {patternVariant === 2 && (
          <g stroke="#FDE68A" strokeWidth="1" fill="none">
            <path d="M 32 92 L 64 28 L 96 92 Z" />
            <path d="M 32 44 L 64 100 L 96 44 Z" opacity="0.65" />
            <circle cx="64" cy="64" r="28" />
          </g>
        )}
        {patternVariant === 3 && (
          <g stroke="#FDE68A" strokeWidth="1" fill="none">
            <ellipse cx="64" cy="64" rx="38" ry="18" transform="rotate(30 64 64)" />
            <ellipse cx="64" cy="64" rx="38" ry="18" transform="rotate(-30 64 64)" />
            <circle cx="64" cy="64" r="8" fill="#FDE68A" fillOpacity="0.35" />
          </g>
        )}
      </svg>

      {/* Top Row: Step Medallion & Verification Seal */}
      <div className="relative z-20 pl-2 flex items-center justify-between gap-1">
        {showStepBadge ? (
          <span className="px-1.5 py-0.5 rounded bg-[#FDFCF9]/15 backdrop-blur-xs text-[9px] font-mono uppercase tracking-wider text-[#FDE68A] border border-[#FDE68A]/30">
            #{book.roadmapStepOrder}
          </span>
        ) : (
          <span />
        )}
        <span
          className="w-4 h-4 rounded-full bg-[#146C43] text-white flex items-center justify-center shadow-xs"
          title="Verified Catalog Record"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Center Editorial Book Title */}
      <div className="relative z-20 pl-2 my-auto py-1">
        <p
          className={`font-serif-display font-semibold tracking-tight text-[#FDFCF9] drop-shadow-xs ${titleClasses}`}
        >
          {book.title}
        </p>
      </div>

      {/* Bottom Author & Page Count */}
      <div className="relative z-20 pl-2 pt-1.5 border-t border-white/15 flex items-center justify-between gap-1">
        <span className={`font-medium text-[#E6DFD3] truncate ${authorClasses}`}>
          {book.authors[0]}
        </span>
        {size !== 'sm' && (
          <span className="text-[9px] font-mono text-[#FDE68A]/90 shrink-0">
            {book.pageCount}p
          </span>
        )}
      </div>
    </div>
  );
}
