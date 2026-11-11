/**
 * Tính năng: Trung tâm cấu hình Technical SEO, Metadata theo từng đường dẫn (Per-Route Head), Canonical, Hreflang (en, vi, x-default), Quy tắc Indexing (noindex cho kết quả cá nhân hóa, /eval, /api), Chuyển hướng 301 (Non-Canonical Redirects) và Dữ liệu có cấu trúc JSON-LD (WebApplication, Organization, FAQPage, BreadcrumbList) cho Giai đoạn 9.
 * Trường hợp sử dụng:
 * - Được gọi bởi `generateMetadata` trong các Server Components (`/app/page.tsx`, `/app/[locale]/page.tsx`, `/app/[locale]/[slug]/page.tsx`, `/app/eval/page.tsx`) và bởi `/app/robots.ts`, `/app/sitemap.ts`, `/middleware.ts`.
 * - Đảm bảo mọi tiêu đề (<title>) dưới 60 ký tự, mọi mô tả (<meta name="description">) dưới 160 ký tự, và JSON-LD khớp 100% với nội dung hiển thị trên trang (chỉ dùng sự thật và các thẻ giữ chỗ [FILL IN]).
 */

import type { Metadata } from 'next';
import type { Locale } from '../i18n/dictionaries';
import {
  isValidPublicPageSlug,
  PUBLIC_PAGE_SLUGS,
  PublicPageSlug,
} from './navigation';
import {
  PUBLIC_PAGES_BY_LOCALE,
  SYSTEM_PAGES_CONTENT,
} from '../data/publicPagesContent';

export interface RouteSeoEntry {
  slug: '' | PublicPageSlug;
  locale: Locale;
  title: string;
  description: string;
  canonicalPath: string;
}

/**
 * Lấy SITE_URL chuẩn (không có dấu gạch chéo ở cuối) từ biến môi trường.
 */
export function getSiteBaseUrl(explicitSiteUrl?: string): string {
  const raw = (
    explicitSiteUrl ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  )
    .trim()
    .replace(/\/+$/, '');

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  return 'http://localhost:3000';
}

/**
 * Bảng từ điển Tiêu đề (< 60 ký tự) và Mô tả (< 160 ký tự) riêng biệt cho từng trang và từng ngôn ngữ.
 */
export const SEO_ROUTE_ENTRIES: Record<
  Locale,
  Record<'' | PublicPageSlug, { title: string; description: string }>
> = {
  vi: {
    '': {
      title: 'ShelfPath — Lộ Trình Đọc Sách Tự Học Đã Kiểm Chứng',
      description:
        'Bắt đầu từ một chủ đề và nhận lộ trình đọc sách từ cơ bản đến nâng cao, kiểm chứng 100% qua Open Library và Google Books cho sinh viên tự học.',
    },
    'how-it-works': {
      title: 'Cách ShelfPath Hoạt Động — Quy Trình 6 Bước Minh Bạch',
      description:
        'Tìm hiểu 6 bước tìm kiếm, đối chiếu danh mục Open Library và Google Books, xếp hạng đa dạng MMR cùng những điều cơ chế kiểm chứng đảm bảo.',
    },
    methodology: {
      title: 'Phương Pháp Kiểm Chứng & Nguồn Dữ Liệu — ShelfPath',
      description:
        'Chi tiết quy tắc đối chiếu ISBN, điểm tương đồng tiêu đề và tác giả, thuật toán MMR và ghi nhận nguồn dữ liệu từ Open Library và Google Books.',
    },
    about: {
      title: 'Về Dự Án ShelfPath — Lộ Trình Sách Cho Sinh Viên',
      description:
        'Sứ mệnh giúp sinh viên đại học tự học lĩnh vực mới với sách thật 100%, nguyên tắc không bịa đặt số liệu và thông tin liên hệ chính thức.',
    },
    faq: {
      title: 'Câu Hỏi Thường Gặp (FAQ) — Lộ Trình Đọc Sách ShelfPath',
      description:
        'Giải đáp 9 câu hỏi thực tế về cách ShelfPath ngăn chặn sách giả do AI tự bịa, cơ chế Fail-Closed, tra cứu bản dịch tiếng Việt và bảo mật.',
    },
    privacy: {
      title: 'Chính Sách Quyền Riêng Tư — Không Theo Dõi | ShelfPath',
      description:
        'Cam kết quyền riêng tư ngay từ thiết kế: không cookie theo dõi, không thu thập dữ liệu cá nhân, lưu kệ sách cục bộ và băm IP ẩn danh hàng ngày.',
    },
    terms: {
      title: 'Điều Khoản Sử Dụng & Miễn Trừ Trách Nhiệm | ShelfPath',
      description:
        'Quy định sử dụng công bằng hệ thống ShelfPath, tuyên bố miễn trừ trách nhiệm học thuật và lưu ý về tính sẵn có của dữ liệu thư mục sách.',
    },
    accessibility: {
      title: 'Tuyên Bố Khả Năng Tiếp Cận Chuẩn WCAG 2.2 AA | ShelfPath',
      description:
        'Cam kết tiếp cận WCAG 2.2 AA của ShelfPath: điều hướng bàn phím, trình đọc màn hình, giảm chuyển động và danh sách 2D tương đương cho lộ trình 3D.',
    },
  },
  en: {
    '': {
      title: 'ShelfPath — Verified Self-Learning Reading Roadmaps',
      description:
        'Start from any topic and get a beginner-to-advanced reading roadmap, 100% verified against Open Library and Google Books for university students.',
    },
    'how-it-works': {
      title: 'How ShelfPath Works — 6-Stage Book Verification',
      description:
        'Explore our six-stage search, Open Library and Google Books verification gate, MMR diversity ranking, and what catalog verification guarantees.',
    },
    methodology: {
      title: 'Verification Methodology & Data Sources — ShelfPath',
      description:
        'How ShelfPath matches ISBNs, normalizes title and author similarity scores, applies MMR diversity, and credits Open Library and Google Books.',
    },
    about: {
      title: 'About ShelfPath — Topic-First Book Roadmaps',
      description:
        'Learn why ShelfPath was built to help university students teach themselves a new field using 100% catalog-verified books with zero fabrication.',
    },
    faq: {
      title: 'Frequently Asked Questions (FAQ) — ShelfPath',
      description:
        'Plain-language answers to 9 real questions on how ShelfPath prevents AI-hallucinated books, handles catalog outages, and protects your privacy.',
    },
    privacy: {
      title: 'Privacy Policy — Zero Tracking & No Cookies | ShelfPath',
      description:
        'Privacy by design: zero tracking cookies, zero third-party analytics, local browser storage for My Shelf, and daily-rotating salted IP hashes.',
    },
    terms: {
      title: 'Terms of Use & Educational Disclaimer | ShelfPath',
      description:
        'Plain-language terms for using ShelfPath, including our educational suggestion disclaimer and best-effort bibliographic availability notice.',
    },
    accessibility: {
      title: 'Accessibility Statement (WCAG 2.2 AA) | ShelfPath',
      description:
        'ShelfPath accessibility features for keyboard navigation, screen readers, reduced motion, and complete 2D HTML equivalents for 3D book views.',
    },
  },
};

/**
 * Kiểm tra xem truy vấn URL có chứa tham số kết quả cá nhân hóa hay lộ trình riêng hay không.
 * Nếu có, trang phải được đánh dấu `noindex` để công cụ tìm kiếm không lập chỉ mục các kết quả cá nhân hóa.
 */
export function hasPersonalizedQueryParams(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams,
): boolean {
  if (!searchParams) return false;
  const personalizedKeys = [
    'topic',
    'rec',
    'id',
    'view',
    'tab',
    'level',
    'length',
    'lang',
    'adventurousness',
    'refine',
  ];

  if (searchParams instanceof URLSearchParams) {
    for (const key of personalizedKeys) {
      if (searchParams.has(key)) return true;
    }
    return false;
  }

  for (const key of personalizedKeys) {
    if (searchParams[key] !== undefined) return true;
  }
  return false;
}

/**
 * Tạo đối tượng Next.js `Metadata` đầy đủ cho một route công khai (Unique title < 60 chars, description < 160 chars, canonical, hreflang en/vi/x-default, Open Graph, Twitter Card, robots).
 */
export function buildPublicRouteMetadata(options: {
  locale: Locale;
  slug: '' | PublicPageSlug;
  isPersonalizedView?: boolean;
  explicitSiteUrl?: string;
}): Metadata {
  const { locale, slug, isPersonalizedView = false, explicitSiteUrl } = options;
  const siteUrl = getSiteBaseUrl(explicitSiteUrl);
  const seo = SEO_ROUTE_ENTRIES[locale][slug];

  const suffix = slug ? `/${slug}` : '';
  const canonicalUrl = `${siteUrl}/${locale}${suffix}`;
  const enUrl = `${siteUrl}/en${suffix}`;
  const viUrl = `${siteUrl}/vi${suffix}`;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        vi: viUrl,
        'x-default': enUrl,
      },
    },
    robots: isPersonalizedView
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: 'ShelfPath',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      alternateLocale: locale === 'vi' ? ['en_US'] : ['vi_VN'],
      type: 'website',
      images: [
        {
          url: `${siteUrl}/icon.svg`,
          width: 512,
          height: 512,
          alt: 'ShelfPath — Verified Reading Roadmaps Emblem',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [`${siteUrl}/icon.svg`],
    },
  };
}

/**
 * Tạo Metadata `noindex, nofollow` cho trang nội bộ `/eval`.
 */
export function buildEvalRouteMetadata(explicitSiteUrl?: string): Metadata {
  const siteUrl = getSiteBaseUrl(explicitSiteUrl);
  return {
    title: 'ShelfPath Evaluation Lab — Internal Benchmark',
    description:
      'Internal evaluation harness comparing Configurations A, B, and C across 14 sample profiles. Restricted and excluded from search indexing.',
    alternates: {
      canonical: `${siteUrl}/eval`,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

/**
 * Xác định xem một đường dẫn không chuẩn (non-canonical URL) có cần chuyển hướng 301 Permanent Redirect về URL chuẩn hay không.
 * - Các đường dẫn trang nội dung không có tiền tố ngôn ngữ (`/how-it-works`, `/faq`, ...) -> 301 về `/vi/<slug>`
 * - Các biến thể viết hoa (`/EN/How-It-Works`, `/VI/FAQ`, `/EN`) -> 301 về chữ thường `/en/how-it-works`, `/vi/faq`, `/en`
 * - Các đường dẫn bí danh (`/home`, `/index.html`, `/en/home`, `/vi/home`) -> 301 về `/vi` hoặc `/en`
 */
export function resolveCanonicalRedirect(
  pathname: string,
  search: string = '',
): {
  shouldRedirect: boolean;
  statusCode: 301;
  destinationPath: string;
} | null {
  const rawPath = pathname || '/';
  const searchSuffix = search
    ? search.startsWith('?')
      ? search
      : `?${search}`
    : '';

  // Bỏ qua các tuyến hệ thống và API
  if (
    rawPath.startsWith('/api/') ||
    rawPath.startsWith('/_next/') ||
    rawPath.startsWith('/.well-known/') ||
    rawPath === '/healthz' ||
    rawPath === '/eval' ||
    rawPath === '/robots.txt' ||
    rawPath === '/sitemap.xml' ||
    rawPath === '/manifest.webmanifest' ||
    /\.(svg|png|jpg|jpeg|webp|ico|css|js|txt|xml|json)$/i.test(rawPath)
  ) {
    return null;
  }

  // 1. Bí danh /home hoặc /index.html
  const lower = rawPath.toLowerCase().replace(/\/+$/, '') || '/';
  if (lower === '/home' || lower === '/index.html') {
    return {
      shouldRedirect: true,
      statusCode: 301,
      destinationPath: `/vi${searchSuffix}`,
    };
  }
  if (lower === '/en/home' || lower === '/en/index.html') {
    return {
      shouldRedirect: true,
      statusCode: 301,
      destinationPath: `/en${searchSuffix}`,
    };
  }
  if (lower === '/vi/home' || lower === '/vi/index.html') {
    return {
      shouldRedirect: true,
      statusCode: 301,
      destinationPath: `/vi${searchSuffix}`,
    };
  }

  const segments = rawPath.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const firstLower = segments[0].toLowerCase();

  // 2. Đường dẫn trang nội dung công khai thiếu tiền tố ngôn ngữ (ví dụ: /how-it-works, /faq) -> 301 sang /vi/<slug>
  if (segments.length === 1 && isValidPublicPageSlug(firstLower)) {
    return {
      shouldRedirect: true,
      statusCode: 301,
      destinationPath: `/vi/${firstLower}${searchSuffix}`,
    };
  }

  // 3. Đường dẫn có tiền tố ngôn ngữ nhưng chứa chữ in hoa hoặc dấu gạch chéo dư ở cuối (ví dụ: /EN/How-It-Works hoặc /en/faq/)
  if (firstLower === 'en' || firstLower === 'vi') {
    if (segments.length === 1) {
      const canonical = `/${firstLower}`;
      if (rawPath !== canonical) {
        return {
          shouldRedirect: true,
          statusCode: 301,
          destinationPath: `${canonical}${searchSuffix}`,
        };
      }
      return null;
    }

    const secondLower = segments[1].toLowerCase();
    if (segments.length === 2 && isValidPublicPageSlug(secondLower)) {
      const canonical = `/${firstLower}/${secondLower}`;
      if (rawPath !== canonical) {
        return {
          shouldRedirect: true,
          statusCode: 301,
          destinationPath: `${canonical}${searchSuffix}`,
        };
      }
    }
  }

  return null;
}

/**
 * Tạo dữ liệu có cấu trúc JSON-LD (Schema.org) trung thực 100% với nội dung hiển thị trên trang:
 * - `WebApplication` + `Organization` (kèm các thẻ giữ chỗ [FILL IN] từ PLACEHOLDER_INVENTORY)
 * - `FAQPage` (trên trang /faq, khớp chính xác từng câu hỏi & câu trả lời hiển thị)
 * - `BreadcrumbList` (trên toàn bộ 7 trang nội dung công khai, khớp chính xác với thanh Breadcrumb hiển thị)
 */
export function buildJsonLdForRoute(options: {
  locale: Locale;
  slug: '' | PublicPageSlug;
  explicitSiteUrl?: string;
}): Array<Record<string, unknown>> {
  const { locale, slug, explicitSiteUrl } = options;
  const siteUrl = getSiteBaseUrl(explicitSiteUrl);
  const seo = SEO_ROUTE_ENTRIES[locale][slug];
  const suffix = slug ? `/${slug}` : '';
  const canonicalUrl = `${siteUrl}/${locale}${suffix}`;

  const schemas: Array<Record<string, unknown>> = [];

  // 1. Organization & WebApplication trên Trang chủ ('') và trang Về dự án ('about')
  if (slug === '' || slug === 'about') {
    const orgSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ShelfPath',
      legalName: '[FILL IN: Data Controller / Operator Full Legal Name]',
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      email: '[FILL IN: contact@yourdomain.edu]',
      description: seo.description,
    };

    const webAppSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ShelfPath',
      url: canonicalUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      inLanguage: ['vi', 'en'],
      description: seo.description,
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Organization',
        name: 'ShelfPath',
        legalName: '[FILL IN: Data Controller / Operator Full Legal Name]',
        email: '[FILL IN: contact@yourdomain.edu]',
      },
    };

    schemas.push(webAppSchema, orgSchema);
  }

  // 2. BreadcrumbList trên mọi trang nội dung công khai (khớp 100% với <nav aria-label="Breadcrumb"> hiển thị)
  if (slug !== '') {
    const pageData = PUBLIC_PAGES_BY_LOCALE[locale][slug];
    const sys = SYSTEM_PAGES_CONTENT[locale];
    const homeUrl = `${siteUrl}/${locale}`;

    const breadcrumbSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: sys.breadcrumbs.homeLabel,
          item: homeUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageData.breadcrumbCategory,
          item: `${homeUrl}#${slug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: pageData.title,
          item: canonicalUrl,
        },
      ],
    };
    schemas.push(breadcrumbSchema);
  }

  // 3. FAQPage trên trang /faq (khớp 100% với 9 câu hỏi & câu trả lời hiển thị trên giao diện)
  if (slug === 'faq') {
    const faqItems = PUBLIC_PAGES_BY_LOCALE[locale].faq.faqItems ?? [];
    const faqSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    schemas.push(faqSchema);
  }

  return schemas;
}

/**
 * Trả về danh sách toàn bộ 16 đường dẫn công khai chuẩn (8 trang x 2 ngôn ngữ) kèm thông tin kiểm toán SEO để phục vụ sitemap.xml và báo cáo tự kiểm tra.
 */
export function getAllPublicSeoAuditRows(explicitSiteUrl?: string): Array<{
  route: string;
  locale: Locale;
  slug: '' | PublicPageSlug;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  canonical: string;
  robots: string;
  hreflangEn: string;
  hreflangVi: string;
  hreflangXDefault: string;
}> {
  const siteUrl = getSiteBaseUrl(explicitSiteUrl);
  const allSlugs: Array<'' | PublicPageSlug> = ['', ...PUBLIC_PAGE_SLUGS];
  const rows: Array<{
    route: string;
    locale: Locale;
    slug: '' | PublicPageSlug;
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    canonical: string;
    robots: string;
    hreflangEn: string;
    hreflangVi: string;
    hreflangXDefault: string;
  }> = [];

  for (const locale of ['vi', 'en'] as const) {
    for (const slug of allSlugs) {
      const suffix = slug ? `/${slug}` : '';
      const route = `/${locale}${suffix}`;
      const seo = SEO_ROUTE_ENTRIES[locale][slug];
      rows.push({
        route,
        locale,
        slug,
        title: seo.title,
        titleLength: seo.title.length,
        description: seo.description,
        descriptionLength: seo.description.length,
        canonical: `${siteUrl}${route}`,
        robots: 'index, follow',
        hreflangEn: `${siteUrl}/en${suffix}`,
        hreflangVi: `${siteUrl}/vi${suffix}`,
        hreflangXDefault: `${siteUrl}/en${suffix}`,
      });
    }
  }

  return rows;
}
