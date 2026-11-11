/**
 * Tính năng: Tạo tệp `/robots.txt` động từ danh sách đường dẫn và biến môi trường `SITE_URL` (Giai đoạn 9: Technical SEO & Indexing Rules).
 * Trường hợp sử dụng:
 * - Cho phép các công cụ tìm kiếm thu thập dữ liệu toàn bộ trang công khai ở cả hai ngôn ngữ (`/en`, `/vi`, và 7 trang nội dung).
 * - Chặn (`Disallow`) các tuyến nội bộ `/eval`, `/api/`, và các URL chứa tham số kết quả cá nhân hóa hoặc lộ trình riêng (`?topic=*`, `?rec=*`, `?id=*`, `?view=*`, `?tab=*`, `?refine=*`).
 * - Chỉ định đường dẫn tuyệt đối tới `/sitemap.xml` dựa trên `SITE_URL`.
 */

import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/src/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/vi', '/en'],
        disallow: [
          '/api/',
          '/eval',
          '/eval/',
          '/*?topic=*',
          '/*?rec=*',
          '/*?id=*',
          '/*?view=*',
          '/*?tab=*',
          '/*?refine=*',
          '/*&topic=*',
          '/*&rec=*',
          '/*&id=*',
          '/*&view=*',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
