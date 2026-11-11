import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Lora } from 'next/font/google';
import './globals.css';
import { AppPreferencesProvider } from '@/src/i18n/useTranslation';
import { getSiteBaseUrl } from '@/src/lib/seo';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5EE' },
    { media: '(prefers-color-scheme: dark)', color: '#11141C' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  title: 'ShelfPath — Lộ Trình Đọc Sách Tự Học Đã Kiểm Chứng',
  description:
    'Bắt đầu từ một chủ đề và nhận lộ trình đọc sách từ cơ bản đến nâng cao, kiểm chứng 100% qua Open Library và Google Books cho sinh viên tự học.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'ShelfPath — Lộ Trình Đọc Sách Tự Học Đã Kiểm Chứng',
    description:
      'Bắt đầu từ một chủ đề và nhận lộ trình đọc sách từ cơ bản đến nâng cao, kiểm chứng 100% qua Open Library và Google Books cho sinh viên tự học.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShelfPath — Lộ Trình Đọc Sách Tự Học Đã Kiểm Chứng',
    description:
      'Bắt đầu từ một chủ đề và nhận lộ trình đọc sách từ cơ bản đến nâng cao, kiểm chứng 100% qua Open Library và Google Books cho sinh viên tự học.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <noscript>
          <div className="bg-[#F9E2DF] text-[#1A1D24] border-b border-[#C8433C] px-6 py-5 text-sm leading-relaxed">
            <div className="max-w-4xl mx-auto space-y-2">
              <p className="font-bold text-[#C8433C]">
                Trình duyệt đang tắt JavaScript / JavaScript is disabled in your browser
              </p>
              <p>
                <strong>Tiếng Việt:</strong> ShelfPath cần JavaScript để kết nối trực tiếp với luồng kiểm chứng sách theo thời gian thực (Open Library &amp; Google Books) và hiển thị lộ trình đọc tương tác. Vui lòng bật JavaScript trong trình duyệt để sử dụng đầy đủ tính năng. Liên hệ hỗ trợ:{' '}
                <a
                  href="mailto:contact@example.com?subject=ShelfPath%20NoJS%20Support"
                  className="underline font-mono"
                >
                  [FILL IN: contact@yourdomain.edu]
                </a>
                .
              </p>
              <p>
                <strong>English:</strong> ShelfPath requires JavaScript to stream live bibliographic verification from Open Library and Google Books and to render interactive reading roadmaps. Please enable JavaScript in your browser settings. Contact:{' '}
                <a
                  href="mailto:contact@example.com?subject=ShelfPath%20NoJS%20Support"
                  className="underline font-mono"
                >
                  [FILL IN: contact@yourdomain.edu]
                </a>
                .
              </p>
            </div>
          </div>
        </noscript>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  );
}
