/**
 * Tính năng: Web App Manifest chuẩn W3C cho ShelfPath (Phase 8).
 * Trường hợp sử dụng: Cung cấp thông tin biểu tượng SVG, màu chủ đề (theme_color), màu nền (background_color) cho trình duyệt mà KHÔNG đăng ký Service Worker.
 */

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShelfPath — Verified Reading Roadmaps',
    short_name: 'ShelfPath',
    description:
      'Topic-first reading roadmaps for self-learners, 100% verified against Open Library and Google Books.',
    start_url: '/vi',
    display: 'standalone',
    background_color: '#F7F5EE',
    theme_color: '#C8433C',
    icons: [
      {
        src: '/favicon.svg',
        sizes: '64x64',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '128x128 512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
