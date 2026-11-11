/**
 * Tính năng: Trang chủ theo đường dẫn ngôn ngữ (`/en`, `/vi`) ở Giai đoạn 8 & 9.
 * Trường hợp sử dụng:
 * - Kết xuất HTML từ máy chủ (`react-dom/server` qua Next.js App Router) và hydrate ở trình duyệt.
 * - Xuất `generateMetadata` với tiêu đề riêng (< 60 ký tự), mô tả (< 160 ký tự), `canonical`, `hreflang` (`en`, `vi`, `x-default`), Open Graph, Twitter Card và `noindex` khi có tham số kết quả cá nhân hóa.
 * - Nhúng JSON-LD (`WebApplication`, `Organization`) vào trang.
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HomeWorkspace } from '@/src/components/HomeWorkspace';
import { JsonLdScript } from '@/src/components/JsonLdScript';
import { isValidLocaleParam } from '@/src/lib/navigation';
import {
  buildJsonLdForRoute,
  buildPublicRouteMetadata,
  hasPersonalizedQueryParams,
} from '@/src/lib/seo';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocaleParam(locale)) {
    return {
      title: '404 — Page Not Found | ShelfPath',
      robots: { index: false, follow: false },
    };
  }

  const resolvedSearch = await searchParams;
  const isPersonalized = hasPersonalizedQueryParams(resolvedSearch);

  return buildPublicRouteMetadata({
    locale,
    slug: '',
    isPersonalizedView: isPersonalized,
  });
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocaleParam(locale)) {
    notFound();
  }

  const schemas = buildJsonLdForRoute({ locale, slug: '' });

  return (
    <>
      <JsonLdScript schemas={schemas} />
      <HomeWorkspace initialLocale={locale} />
    </>
  );
}
