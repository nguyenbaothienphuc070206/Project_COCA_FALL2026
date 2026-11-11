/**
 * Tính năng: Trang chủ gốc (`/`) của ShelfPath (Server Component Giai đoạn 9).
 * Trường hợp sử dụng:
 * - Xuất `generateMetadata` để gắn đầy đủ `<title>`, `<meta name="description">`, `canonical` (`/vi`), `hreflang` (`en`, `vi`, `x-default`), Open Graph, Twitter Card và tự động gắn `noindex, nofollow` khi URL chứa tham số kết quả cá nhân hóa (`?topic=...`, `?rec=...`, `?view=...`).
 * - Nhúng dữ liệu có cấu trúc JSON-LD (`WebApplication` và `Organization`) trực tiếp vào HTML trả về từ máy chủ.
 */

import React from 'react';
import type { Metadata } from 'next';
import { HomeWorkspace } from '@/src/components/HomeWorkspace';
import { JsonLdScript } from '@/src/components/JsonLdScript';
import {
  buildJsonLdForRoute,
  buildPublicRouteMetadata,
  hasPersonalizedQueryParams,
} from '@/src/lib/seo';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedSearch = await searchParams;
  const isPersonalized = hasPersonalizedQueryParams(resolvedSearch);

  return buildPublicRouteMetadata({
    locale: 'vi',
    slug: '',
    isPersonalizedView: isPersonalized,
  });
}

export default function HomePage() {
  const schemas = buildJsonLdForRoute({ locale: 'vi', slug: '' });

  return (
    <>
      <JsonLdScript schemas={schemas} />
      <HomeWorkspace initialLocale="vi" />
    </>
  );
}
