/**
 * Tính năng: Bộ định tuyến đường dẫn theo ngôn ngữ (/en, /vi) và cấu trúc liên kết trang công khai (Phase 8).
 * Trường hợp sử dụng:
 * - Tách mã ngôn ngữ (en/vi) từ đường dẫn URL hiện tại.
 * - Chuyển đổi qua lại giữa /en và /vi mà vẫn giữ nguyên đường dẫn trang con, tham số truy vấn (query string) và trạng thái ứng dụng.
 * - Xây dựng đường dẫn Breadcrumb cho toàn bộ các trang nội dung công khai.
 * - Đảm bảo tuyến nội bộ /eval tuyệt đối không bao giờ xuất hiện trong bất kỳ thanh điều hướng hay chân trang nào.
 */

import type { Locale } from '../i18n/dictionaries';

export const SUPPORTED_LOCALES: readonly Locale[] = ['vi', 'en'] as const;

export type PublicPageSlug =
  | 'how-it-works'
  | 'methodology'
  | 'about'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'accessibility';

export const PUBLIC_PAGE_SLUGS: readonly PublicPageSlug[] = [
  'how-it-works',
  'methodology',
  'about',
  'faq',
  'privacy',
  'terms',
  'accessibility',
] as const;

export function isValidLocaleParam(value: string): value is Locale {
  return value === 'en' || value === 'vi';
}

export function isValidPublicPageSlug(value: string): value is PublicPageSlug {
  return (PUBLIC_PAGE_SLUGS as readonly string[]).includes(value);
}

/**
 * Trích xuất ngôn ngữ từ đường dẫn URL (ví dụ: '/en/how-it-works' -> 'en', '/vi' -> 'vi', '/faq' -> null).
 * @param pathname - Đường dẫn URL
 * @returns 'en' | 'vi' | null
 */
export function extractLocaleFromPathname(pathname: string): Locale | null {
  const clean = (pathname || '/').trim();
  const segments = clean.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const first = segments[0];
  if (first === 'en' || first === 'vi') {
    return first;
  }
  return null;
}

/**
 * Trích xuất slug trang công khai từ đường dẫn URL nếu có.
 * @param pathname - Đường dẫn URL
 * @returns PublicPageSlug | null
 */
export function extractPublicSlugFromPathname(
  pathname: string,
): PublicPageSlug | null {
  const clean = (pathname || '/').trim();
  const segments = clean.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const first = segments[0];
  if (first === 'en' || first === 'vi') {
    const second = segments[1];
    if (second && isValidPublicPageSlug(second)) {
      return second;
    }
    return null;
  }

  if (first && isValidPublicPageSlug(first)) {
    return first;
  }
  return null;
}

/**
 * Tạo đường dẫn có tiền tố ngôn ngữ (/en hoặc /vi).
 * @param locale - Ngôn ngữ đích ('en' | 'vi')
 * @param subPath - Đường dẫn con (ví dụ: '', 'how-it-works', 'faq')
 * @returns Đường dẫn chuẩn (ví dụ: '/en', '/vi/how-it-works')
 */
export function buildLocalizedPath(
  locale: Locale,
  subPath: '' | PublicPageSlug = '',
): string {
  if (!subPath) {
    return `/${locale}`;
  }
  return `/${locale}/${subPath}`;
}

/**
 * Tạo URL khi người dùng bấm nút chuyển đổi ngôn ngữ (/en <-> /vi) mà vẫn giữ nguyên trang hiện tại và query string.
 * @param currentPathname - Đường dẫn hiện tại (ví dụ: '/vi/how-it-works', '/', '/en')
 * @param currentSearch - Chuỗi query string hiện tại (ví dụ: '?topic=Philosophy' hoặc '')
 * @param targetLocale - Ngôn ngữ muốn chuyển sang ('en' | 'vi')
 * @returns Đường dẫn mới đã gắn mã ngôn ngữ đích kèm query string
 */
export function buildLanguageSwitchUrl(
  currentPathname: string,
  currentSearch: string,
  targetLocale: Locale,
): string {
  const cleanPath = (currentPathname || '/').trim();
  const segments = cleanPath.split('/').filter(Boolean);

  // Không chuyển hướng nếu đang ở trang nội bộ /eval
  if (segments[0] === 'eval') {
    const searchSuffix = currentSearch
      ? currentSearch.startsWith('?')
        ? currentSearch
        : `?${currentSearch}`
      : '';
    return `/eval${searchSuffix}`;
  }

  let remainingSegments = segments;
  if (segments[0] === 'en' || segments[0] === 'vi') {
    remainingSegments = segments.slice(1);
  }

  const normalizedSubPath =
    remainingSegments.length > 0 ? `/${remainingSegments.join('/')}` : '';
  const searchSuffix = currentSearch
    ? currentSearch.startsWith('?')
      ? currentSearch
      : `?${currentSearch}`
    : '';

  return `/${targetLocale}${normalizedSubPath}${searchSuffix}`;
}

export interface PublicNavLinkItem {
  slug: '' | PublicPageSlug;
  labelVi: string;
  labelEn: string;
  category: 'product' | 'trust' | 'legal';
}

/**
 * Danh sách tất cả các liên kết điều hướng công khai (tuyệt đối KHÔNG chứa /eval).
 */
export const PUBLIC_NAV_LINKS: readonly PublicNavLinkItem[] = [
  {
    slug: '',
    labelVi: 'Trang chủ',
    labelEn: 'Home',
    category: 'product',
  },
  {
    slug: 'how-it-works',
    labelVi: 'Cách hoạt động',
    labelEn: 'How it works',
    category: 'product',
  },
  {
    slug: 'methodology',
    labelVi: 'Phương pháp & Nguồn dữ liệu',
    labelEn: 'Methodology & Data Sources',
    category: 'trust',
  },
  {
    slug: 'about',
    labelVi: 'Về dự án',
    labelEn: 'About',
    category: 'product',
  },
  {
    slug: 'faq',
    labelVi: 'Câu hỏi thường gặp (FAQ)',
    labelEn: 'FAQ',
    category: 'trust',
  },
  {
    slug: 'privacy',
    labelVi: 'Quyền riêng tư',
    labelEn: 'Privacy',
    category: 'legal',
  },
  {
    slug: 'terms',
    labelVi: 'Điều khoản & Miễn trừ',
    labelEn: 'Terms & Disclaimer',
    category: 'legal',
  },
  {
    slug: 'accessibility',
    labelVi: 'Khả năng tiếp cận',
    labelEn: 'Accessibility',
    category: 'legal',
  },
] as const;
