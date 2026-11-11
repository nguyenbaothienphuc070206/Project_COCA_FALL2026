/**
 * Tính năng: Layout máy chủ cho tuyến nội bộ `/eval` (Giai đoạn 9).
 * Trường hợp sử dụng: Đảm bảo `/eval` luôn gắn thẻ `<meta name="robots" content="noindex, nofollow">` trong `<head>` để ngăn các công cụ tìm kiếm lập chỉ mục.
 */

import React from 'react';
import type { Metadata } from 'next';
import { buildEvalRouteMetadata } from '@/src/lib/seo';

export function generateMetadata(): Metadata {
  return buildEvalRouteMetadata();
}

export default function EvalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
