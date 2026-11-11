'use client';

/**
 * Tính năng: Bộ biểu đồ trực quan hóa kết quả Phòng Thí nghiệm Đánh giá (Evaluation Lab Recharts Panel).
 * Trường hợp sử dụng:
 * - Được tải bất đồng bộ (code-split qua next/dynamic) chỉ trên tuyến /eval.
 * - Hiển thị 4 biểu đồ thống kê mô tả bằng Recharts:
 *   1) Tỷ lệ lỗi kiểm chứng theo cấu hình (Failure Rate by Configuration)
 *   2) Độ đa dạng danh sách trung bình (Mean Pairwise Embedding Distance by Configuration)
 *   3) Độ trễ phản hồi (Latency: Time to First Book, Full Roadmap, Refinement)
 *   4) Điểm chấm Rubric trung bình kèm cỡ mẫu n (Mean Ratings with n shown — chỉ thống kê mô tả, không tuyên bố ý nghĩa thống kê).
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EvalConfigAggregateSummary } from '@/src/lib/evalMetrics';

interface EvalChartsPanelProps {
  aggregates: readonly EvalConfigAggregateSummary[];
  locale: 'vi' | 'en';
}

export function EvalChartsPanel({ aggregates, locale }: EvalChartsPanelProps) {
  const shortLabel = (configId: string): string => {
    if (configId === 'A_MODEL_ONLY') {
      return locale === 'vi' ? 'A: Chỉ AI' : 'A: AI Only';
    }
    if (configId === 'B_MODEL_SEARCH') {
      return locale === 'vi' ? 'B: AI + Tìm kiếm' : 'B: AI + Search';
    }
    return locale === 'vi'
      ? 'C: ShelfPath (Kiểm chứng)'
      : 'C: ShelfPath (Verified)';
  };

  const chartData = aggregates.map((agg) => ({
    name: shortLabel(agg.configId),
    configId: agg.configId,
    auditFailureRate: agg.meanAuditFailureRatePercent,
    displayedUnverifiedRate: agg.meanDisplayedUnverifiedRatePercent,
    diversity: agg.meanListDiversity,
    firstBookMs: agg.meanTimeToFirstBookMs,
    fullRoadmapMs: agg.meanFullRoadmapMs,
    refinementMs: agg.meanRefinementResponseMs,
    nameWithN: `${shortLabel(agg.configId)} (n=${agg.rubricStats.n})`,
    relevance: agg.rubricStats.meanRelevance ?? 0,
    levelFit: agg.rubricStats.meanLevelFit ?? 0,
    usefulness: agg.rubricStats.meanUsefulness ?? 0,
    rubricN: agg.rubricStats.n,
  }));

  return (
    <section
      aria-label={
        locale === 'vi'
          ? 'Biểu đồ thống kê mô tả kết quả đánh giá'
          : 'Descriptive Evaluation Charts'
      }
      className="space-y-4"
      data-testid="eval-charts-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif-display text-xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
            {locale === 'vi'
              ? 'Biểu đồ Thống kê Thực nghiệm (A vs. B vs. C)'
              : 'Empirical Comparison Charts (Config A vs. B vs. C)'}
          </h2>
          <p className="text-xs text-[#524F49] dark:text-[#B8B2A6]">
            {locale === 'vi'
              ? 'Chỉ trình bày thống kê mô tả (Descriptive Statistics) từ dữ liệu chạy thật. Không tuyên bố kiểm định ý nghĩa thống kê (p-value).'
              : 'Descriptive statistics only from actual run measurements. No statistical significance claims are made.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: FAILURE RATE BY CONFIGURATION */}
        <article className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {locale === 'vi'
                ? '1. Tỷ lệ Lỗi Kiểm chứng theo Cấu hình (%)'
                : '1. Verification Failure Rate by Configuration (%)'}
            </h3>
            <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
              {locale === 'vi'
                ? 'So sánh tỷ lệ ứng viên thô bị lỗi (Audit Mode) và tỷ lệ sách chưa xác thực bị lọt ra màn hình.'
                : 'Compares raw candidate audit failure rate vs. unverified books shown to the user.'}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="auditFailureRate"
                  name={
                    locale === 'vi'
                      ? 'Lỗi ứng viên thô (Audit %)'
                      : 'Raw Audit Failure (%)'
                  }
                  fill="#6E6A61"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="displayedUnverifiedRate"
                  name={
                    locale === 'vi'
                      ? 'Sách chưa xác thực hiển thị (%)'
                      : 'Displayed Unverified (%)'
                  }
                  fill="#C8433C"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* CHART 2: DIVERSITY BY CONFIGURATION */}
        <article className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {locale === 'vi'
                ? '2. Độ Đa dạng Ngữ nghĩa Trung bình D(L)'
                : '2. Mean Pairwise Embedding Diversity D(L)'}
            </h3>
            <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
              {locale === 'vi'
                ? 'Khoảng cách cosine trung bình từng cặp vector nhúng (1 - cos(e_i, e_j)) trong danh sách 4 cuốn.'
                : 'Mean pairwise cosine distance (1 - cos(e_i, e_j)) across displayed books in each list.'}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="diversity"
                  name={
                    locale === 'vi'
                      ? 'Khoảng cách đa dạng D(L)'
                      : 'Pairwise Diversity D(L)'
                  }
                  fill="#146C43"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* CHART 3: LATENCY BY CONFIGURATION */}
        <article className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {locale === 'vi'
                ? '3. Độ trễ Thực thi Trung bình (ms)'
                : '3. Mean Execution Latency Breakdown (ms)'}
            </h3>
            <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
              {locale === 'vi'
                ? 'Thời gian tới cuốn sách đầu tiên, hoàn tất toàn bộ lộ trình và phản hồi tinh chỉnh tức thì.'
                : 'Time to first book, full roadmap completion, and instant pool refinement response.'}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="ms" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="firstBookMs"
                  name={
                    locale === 'vi' ? 'Cuốn đầu tiên (ms)' : 'First Book (ms)'
                  }
                  fill="#6E6A61"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="fullRoadmapMs"
                  name={
                    locale === 'vi' ? 'Toàn lộ trình (ms)' : 'Full Roadmap (ms)'
                  }
                  fill="#1D212A"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="refinementMs"
                  name={
                    locale === 'vi' ? 'Tinh chỉnh (ms)' : 'Refinement (ms)'
                  }
                  fill="#C8433C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* CHART 4: TESTER RUBRIC MEAN RATINGS WITH N SHOWN */}
        <article className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {locale === 'vi'
                ? '4. Điểm Đánh giá Rubric Trung bình (Thang 1–5, kèm cỡ mẫu n)'
                : '4. Mean Tester Rubric Ratings (1–5 Scale, with n shown)'}
            </h3>
            <p className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
              {locale === 'vi'
                ? 'Độ liên quan (Relevance), Độ khớp trình độ (Level Fit) và Tính hữu ích (Usefulness).'
                : 'Relevance, Level Fit, and Usefulness scored by human testers (with sample count n).'}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD0" />
                <XAxis dataKey="nameWithN" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="relevance"
                  name={locale === 'vi' ? 'Độ liên quan' : 'Relevance'}
                  fill="#C8433C"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="levelFit"
                  name={locale === 'vi' ? 'Khớp trình độ' : 'Level Fit'}
                  fill="#146C43"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="usefulness"
                  name={locale === 'vi' ? 'Tính hữu ích' : 'Usefulness'}
                  fill="#1D212A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
