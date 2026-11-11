/**
 * Tính năng: Tạo tệp `/sitemap.xml` động từ danh sách đường dẫn công khai và biến môi trường `SITE_URL` (Giai đoạn 9: Technical SEO & Indexing Rules).
 * Trường hợp sử dụng:
 * - Liệt kê đầy đủ 16 URL công khai chuẩn (8 trang x 2 ngôn ngữ `/vi` và `/en`) kèm liên kết thay thế đa ngôn ngữ (`hreflang` cho `en`, `vi`, và `x-default`).
 * - Tuyệt đối không đưa `/eval`, `/api/*`, hoặc các URL kết quả cá nhân hóa vào sơ đồ trang web.
 */

import type { MetadataRoute } from 'next';
import { getAllPublicSeoAuditRows } from '@/src/lib/seo';

const SITEMAP_LAST_MODIFIED = new Date('2026-03-01T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const rows = getAllPublicSeoAuditRows();

  return rows.map((row) => ({
    url: row.canonical,
    lastModified: SITEMAP_LAST_MODIFIED,
    changeFrequency: row.slug === '' ? 'weekly' : 'monthly',
    priority: row.slug === '' ? 1.0 : 0.8,
    alternates: {
      languages: {
        en: row.hreflangEn,
        vi: row.hreflangVi,
        'x-default': row.hreflangXDefault,
      },
    },
  }));
}
