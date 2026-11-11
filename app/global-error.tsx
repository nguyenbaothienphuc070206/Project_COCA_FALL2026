'use client';

/**
 * Tính năng: Trang lỗi 500 cấp gốc (Global Error Boundary) cho Next.js App Router (Phase 8).
 * Trường hợp sử dụng: Dự phòng khi xảy ra lỗi ở tầng RootLayout; hiển thị thông báo song ngữ Tiếng Việt / Tiếng Anh rõ ràng, không lộ stack trace.
 */

import React from 'react';
import Link from 'next/link';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#F7F5EE] text-[#1A1D24] flex items-center justify-center p-6 font-sans">
        <div
          role="alert"
          className="max-w-lg w-full rounded-[24px] border border-[#E2DDD0] bg-[#FDFCF9] p-8 text-center space-y-5 shadow-md"
        >
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#C8433C]">
            Error 500 · Lỗi hệ thống tạm thời
          </p>
          <h1 className="text-2xl font-bold text-[#1A1D24]">
            Đã xảy ra sự cố ngoài ý muốn / Something went wrong
          </h1>
          <p className="text-sm text-[#524F49] leading-relaxed">
            Chi tiết kỹ thuật nội bộ đã được ẩn để bảo mật. Vui lòng bấm Thử lại hoặc quay về Trang chủ ShelfPath. / Internal stack traces are hidden for security. Please try again or return to ShelfPath Home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C8433C] text-white text-xs font-semibold cursor-pointer"
            >
              Thử lại / Try again
            </button>
            <Link
              href="/vi"
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#1D212A] text-white text-xs font-semibold inline-flex items-center"
            >
              Về Trang chủ / Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
