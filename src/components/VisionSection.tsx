'use client';

/**
 * Tính năng: Trang Tầm nhìn & Kiến trúc hệ thống (VisionSection) gồm Bài toán cốt lõi, Lộ trình 3 giai đoạn, Sơ đồ kiến trúc SVG 6 bước và Mô hình bền vững.
 * Trường hợp sử dụng: Giúp giám khảo và người dùng hiểu rõ thiết kế chống bịa đặt (Fail-Closed) và khả năng mở rộng qua các Adapter.
 */

import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface VisionSectionProps {
  onTrySampleNow: () => void;
}

export function VisionSection({ onTrySampleNow }: VisionSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-8">
      <div className="pb-5 border-b border-[#E4DEC8] dark:border-[#2A2F3D]">
        <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#181614] dark:text-[#F5F2EB]">
          {t.vision.title}
        </h1>
        <p className="text-sm sm:text-base text-[#57524B] dark:text-[#B8B2A6] mt-1.5 max-w-3xl">
          {t.vision.subtitle}
        </p>
      </div>

      {/* Problem & Sustainability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#E4DEC8] dark:border-[#2A2F3D] bg-[#FFFFFF] dark:bg-[#1D212D] p-6">
          <h2 className="text-lg font-serif-display font-bold text-[#181614] dark:text-[#F5F2EB] mb-2">
            01. {t.vision.problemTitle}
          </h2>
          <p className="text-sm text-[#57524B] dark:text-[#B8B2A6] leading-relaxed">
            {t.vision.problemBody}
          </p>
        </div>

        <div className="rounded-xl border border-[#E4DEC8] dark:border-[#2A2F3D] bg-[#FFFFFF] dark:bg-[#1D212D] p-6">
          <h2 className="text-lg font-serif-display font-bold text-[#181614] dark:text-[#F5F2EB] mb-2">
            02. {t.vision.sustainabilityTitle}
          </h2>
          <p className="text-sm text-[#57524B] dark:text-[#B8B2A6] leading-relaxed">
            {t.vision.sustainabilityBody}
          </p>
        </div>
      </div>

      {/* Inline SVG Architecture Diagram */}
      <div className="rounded-xl border border-[#E4DEC8] dark:border-[#2A2F3D] bg-[#FFFFFF] dark:bg-[#1D212D] p-6">
        <h2 className="text-lg font-serif-display font-bold text-[#181614] dark:text-[#F5F2EB] mb-4">
          03. {t.vision.architectureTitle}
        </h2>
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 920 210"
            role="img"
            aria-label={t.vision.architectureTitle}
            className="w-full min-w-[680px] h-auto"
          >
            <rect
              x="4"
              y="4"
              width="912"
              height="202"
              rx="12"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.18"
            />
            {[
              { x: 24, step: '1. Query', sub: 'Topic + Level' },
              { x: 170, step: '2. Web Search', sub: 'SearchProvider' },
              { x: 316, step: '3. Extraction', sub: 'Zod Validated' },
              { x: 462, step: '4. Verification', sub: 'OpenLib + GBooks' },
              { x: 608, step: '5. MMR Rank', sub: 'Embeddings + λ' },
              { x: 754, step: '6. Roadmap', sub: 'SSE + 3D Shelf' },
            ].map((node, idx) => (
              <g key={node.step}>
                <rect
                  x={node.x}
                  y="45"
                  width="130"
                  height="88"
                  rx="8"
                  fill={idx === 3 ? '#15803D' : '#D97706'}
                  fillOpacity={idx === 3 ? '0.16' : '0.12'}
                  stroke={idx === 3 ? '#15803D' : '#D97706'}
                  strokeWidth="1.5"
                />
                <text
                  x={node.x + 65}
                  y="82"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="13"
                  fontWeight="700"
                >
                  {node.step}
                </text>
                <text
                  x={node.x + 65}
                  y="106"
                  textAnchor="middle"
                  fill="currentColor"
                  fillOpacity="0.75"
                  fontSize="11"
                >
                  {node.sub}
                </text>
                {idx < 5 && (
                  <line
                    x1={node.x + 130}
                    y1="89"
                    x2={node.x + 146}
                    y2="89"
                    stroke="currentColor"
                    strokeOpacity="0.4"
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
            <text
              x="460"
              y="174"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.7"
              fontSize="11"
            >
              Adapter Interfaces: LLMProvider · SearchProvider · BookVerifier (Fail-Closed) · EmbeddingProvider · TTLCache
            </text>
          </svg>
        </div>
      </div>

      {/* 3-Stage Product Roadmap */}
      <div className="rounded-xl border border-[#E4DEC8] dark:border-[#2A2F3D] bg-[#FFFFFF] dark:bg-[#1D212D] p-6">
        <h2 className="text-lg font-serif-display font-bold text-[#181614] dark:text-[#F5F2EB] mb-4">
          04. {t.vision.roadmapTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-lg bg-[#FBF9F5] dark:bg-[#0E1015] border border-[#E4DEC8] dark:border-[#2A2F3D]">
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400">
              {t.vision.phase1Title}
            </h3>
            <p className="text-xs text-[#57524B] dark:text-[#B8B2A6] mt-2 leading-relaxed">
              {t.vision.phase1Desc}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#FBF9F5] dark:bg-[#0E1015] border border-[#E4DEC8] dark:border-[#2A2F3D]">
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400">
              {t.vision.phase2Title}
            </h3>
            <p className="text-xs text-[#57524B] dark:text-[#B8B2A6] mt-2 leading-relaxed">
              {t.vision.phase2Desc}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#FBF9F5] dark:bg-[#0E1015] border border-[#E4DEC8] dark:border-[#2A2F3D]">
            <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400">
              {t.vision.phase3Title}
            </h3>
            <p className="text-xs text-[#57524B] dark:text-[#B8B2A6] mt-2 leading-relaxed">
              {t.vision.phase3Desc}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E4DEC8] dark:border-[#2A2F3D] flex justify-end">
          <button
            type="button"
            onClick={onTrySampleNow}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition-colors"
          >
            {t.nav.trySampleCta}
          </button>
        </div>
      </div>
    </section>
  );
}
