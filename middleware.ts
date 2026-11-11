/**
 * Tính năng: Next.js Global Middleware gắn Security Headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), kiểm soát CORS (Phase 7), cùng Chuyển hướng 301 cho URL không chuẩn & X-Robots-Tag noindex cho kết quả cá nhân hóa, /eval và /api/* (Phase 9).
 * Trường hợp sử dụng: Bảo vệ và chuẩn hóa SEO cho toàn bộ trang giao diện (/, /en/*, /vi/*, /eval) và các tuyến /api/*, không sử dụng cookie theo nguyên tắc Privacy by Design.
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_VERSION } from '@/src/lib/schemas/apiContract';
import {
  hasPersonalizedQueryParams,
  resolveCanonicalRedirect,
} from '@/src/lib/seo';

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://hcaptcha.com https://*.hcaptcha.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://covers.openlibrary.org https://books.google.com https://picsum.photos",
  "connect-src 'self' https://challenges.cloudflare.com https://hcaptcha.com https://*.hcaptcha.com",
  "frame-src 'self' https://challenges.cloudflare.com https://*.hcaptcha.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function applyStandardSecurityHeaders(
  res: NextResponse,
  cspValue: string,
  enforceFrameAncestors: boolean,
): void {
  res.headers.set('Content-Security-Policy', cspValue);
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  if (enforceFrameAncestors) {
    res.headers.set('X-Frame-Options', 'DENY');
  }
}

export function middleware(req: NextRequest) {
  const enforceFrameAncestors =
    process.env.ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS === 'true';
  const cspValue = enforceFrameAncestors
    ? `${CSP_DIRECTIVES}; frame-ancestors 'none'`
    : CSP_DIRECTIVES;

  const pathname = req.nextUrl.pathname;

  // 1. Kiểm tra CORS đối với các truy vấn vào /api/* có gắn header Origin
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin')?.trim();
    if (origin) {
      let originHost = '';
      try {
        originHost = new URL(origin).host.toLowerCase();
      } catch {
        originHost = 'invalid';
      }

      const hostHeader = (
        req.headers.get('x-forwarded-host') ||
        req.headers.get('host') ||
        ''
      )
        .split(',')[0]
        ?.trim()
        .toLowerCase();

      const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const isSameHost = Boolean(hostHeader && originHost === hostHeader);
      const isLocalhost =
        originHost === 'localhost' ||
        originHost.startsWith('localhost:') ||
        originHost.startsWith('127.0.0.1:');
      const isExplicitlyAllowed = allowedOrigins.includes(origin);

      if (!isSameHost && !isLocalhost && !isExplicitlyAllowed) {
        const requestId =
          req.headers.get('x-request-id')?.trim() ||
          `req_${Date.now().toString(36)}`;
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN_ORIGIN',
              message: 'Cross-origin request blocked by CORS policy.',
              requestId,
            },
          },
          {
            status: 403,
            headers: {
              'Content-Security-Policy': cspValue,
              'Strict-Transport-Security':
                'max-age=63072000; includeSubDomains; preload',
              'X-Content-Type-Options': 'nosniff',
              'Referrer-Policy': 'strict-origin-when-cross-origin',
              'Permissions-Policy':
                'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
              'X-API-Version': API_VERSION,
              'X-Request-Id': requestId,
              'X-Robots-Tag': 'noindex, nofollow, noarchive',
            },
          },
        );
      }
    }
  }

  // 2. Phase 9: Chuyển hướng 301 (Permanent Redirect) cho các URL không chuẩn (ví dụ: /how-it-works -> /vi/how-it-works, /home -> /vi, /EN/FAQ -> /en/faq)
  const redirectRule = resolveCanonicalRedirect(pathname, req.nextUrl.search);
  if (redirectRule && redirectRule.shouldRedirect) {
    const destinationUrl = new URL(redirectRule.destinationPath, req.url);
    const redirectRes = NextResponse.redirect(destinationUrl, {
      status: redirectRule.statusCode,
    });
    applyStandardSecurityHeaders(redirectRes, cspValue, enforceFrameAncestors);
    return redirectRes;
  }

  const res = NextResponse.next();
  applyStandardSecurityHeaders(res, cspValue, enforceFrameAncestors);

  // 3. Phase 9: Gắn X-Robots-Tag noindex cho /api/*, /eval, và các URL có tham số kết quả cá nhân hóa (?topic=..., ?rec=..., ?view=...)
  const isNoIndexRoute =
    pathname.startsWith('/api/') ||
    pathname === '/eval' ||
    pathname.startsWith('/eval/') ||
    hasPersonalizedQueryParams(req.nextUrl.searchParams);

  if (isNoIndexRoute) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  } else {
    res.headers.set('X-Robots-Tag', 'index, follow');
  }

  // 4. Gắn header Content-Language đồng bộ với đường dẫn ngôn ngữ (/en vs /vi)
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    res.headers.set('Content-Language', 'en');
  } else if (!pathname.startsWith('/api/')) {
    res.headers.set('Content-Language', 'vi');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
