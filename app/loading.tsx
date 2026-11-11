/**
 * Tính năng: Khung xương tải tức thì (Instant Cold-Start & Route Skeleton) cho Giai đoạn 9 (Core Web Vitals: LCP & CLS = 0).
 * Trường hợp sử dụng: Hiển thị ngay lập tức bố cục 2 cột chuẩn Phase 3A ("E-Book Dashboard") với kích thước giữ chỗ cố định trong khi chờ Cloud Run khởi động nguội hoặc tải đoạn dữ liệu máy chủ, tránh màn hình trắng và giữ CLS = 0.
 */

import React from 'react';

export default function GlobalRouteLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Đang tải không gian đọc sách ShelfPath / Loading ShelfPath workspace"
      className="min-h-screen w-full bg-[#DCD9CE] dark:bg-[#090B10] text-[#1A1D24] dark:text-[#F5F2EB] lg:p-4 xl:p-6"
    >
      <div className="max-w-[1440px] mx-auto min-h-screen lg:min-h-[calc(100vh-3rem)] lg:rounded-[28px] bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <aside className="hidden md:flex flex-col justify-between shrink-0 md:w-20 lg:w-60 border-r border-[#E2DDD0] dark:border-[#282E3E] py-6 px-3 lg:px-5">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#EFECE3] dark:bg-[#1E2330] shrink-0" />
              <div className="hidden lg:block space-y-2 flex-1">
                <div className="h-5 w-28 rounded bg-[#EFECE3] dark:bg-[#1E2330]" />
                <div className="h-3 w-36 rounded bg-[#EFECE3] dark:bg-[#1E2330]" />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-12 w-full rounded-full bg-[#EFECE3] dark:bg-[#1E2330]"
                />
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-6 border-t border-[#E2DDD0] dark:border-[#282E3E]">
            <div className="h-11 w-full rounded-full bg-[#EFECE3] dark:bg-[#1E2330]" />
            <div className="h-11 w-full rounded-full bg-[#EFECE3] dark:bg-[#1E2330]" />
          </div>
        </aside>

        {/* Main Column Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="min-h-[72px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E2DDD0] dark:border-[#282E3E] flex items-center justify-between gap-4">
            <div className="h-11 flex-1 max-w-xl rounded-full bg-[#EFECE3] dark:bg-[#171B26]" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-32 rounded-full bg-[#EFECE3] dark:bg-[#1E2330]" />
              <div className="h-10 w-36 rounded-full bg-[#1D212A]/20 dark:bg-[#F5F2EB]/20" />
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
            <div className="xl:col-span-7 p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="space-y-3">
                <div className="h-4 w-48 rounded bg-[#EFECE3] dark:bg-[#171B26]" />
                <div className="h-10 w-4/5 rounded-xl bg-[#EFECE3] dark:bg-[#171B26]" />
                <div className="h-5 w-2/3 rounded bg-[#EFECE3] dark:bg-[#171B26]" />
              </div>
              <div className="h-48 rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]" />
              <div className="h-56 rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]" />
            </div>

            <div className="xl:col-span-5 p-4 sm:p-6 lg:p-8 bg-[#EFECE3] dark:bg-[#171B26] border-t xl:border-t-0 xl:border-l border-[#E2DDD0] dark:border-[#282E3E] space-y-6">
              <div className="min-h-[340px] rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]" />
              <div className="h-44 rounded-[20px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
