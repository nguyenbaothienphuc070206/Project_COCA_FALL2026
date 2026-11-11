/**
 * Tính năng: Các trang thông tin công khai theo đường dẫn ngôn ngữ (`/en/[slug]`, `/vi/[slug]`) ở Giai đoạn 8 & 9.
 * Trường hợp sử dụng:
 * - Hiển thị 7 trang nội dung công khai (`how-it-works`, `methodology`, `about`, `faq`, `privacy`, `terms`, `accessibility`) bằng Tiếng Anh hoặc Tiếng Việt dưới dạng HTML ngữ nghĩa được kết xuất từ máy chủ (SSR) và hydrate ở trình duyệt.
 * - Xuất `generateMetadata` riêng cho từng trang và ngôn ngữ (Title < 60 ký tự, Description < 160 ký tự, Canonical, Hreflang `en`/`vi`/`x-default`, Open Graph, Twitter Card).
 * - Nhúng dữ liệu có cấu trúc JSON-LD (`BreadcrumbList` trên cả 7 trang, `FAQPage` trên `/faq`, `Organization` + `WebApplication` trên `/about`).
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicInfoPage } from '@/src/components/PublicInfoPage';
import { JsonLdScript } from '@/src/components/JsonLdScript';
import {
  isValidLocaleParam,
  isValidPublicPageSlug,
} from '@/src/lib/navigation';
import {
  buildJsonLdForRoute,
  buildPublicRouteMetadata,
  hasPersonalizedQueryParams,
} from '@/src/lib/seo';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocaleParam(locale) || !isValidPublicPageSlug(slug)) {
    return {
      title: '404 — Page Not Found | ShelfPath',
      robots: { index: false, follow: false },
    };
  }

  const resolvedSearch = await searchParams;
  const isPersonalized = hasPersonalizedQueryParams(resolvedSearch);

  return buildPublicRouteMetadata({
    locale,
    slug,
    isPersonalizedView: isPersonalized,
  });
}

export default async function LocalizedPublicSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocaleParam(locale) || !isValidPublicPageSlug(slug)) {
    notFound();
  }

  const schemas = buildJsonLdForRoute({ locale, slug });

  return (
    <>
      <JsonLdScript schemas={schemas} />
      <PublicInfoPage slug={slug} initialLocale={locale} />
    </>
  );
}
