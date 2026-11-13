/**
 * Tính năng: Bộ kiểm thử Giai đoạn 11 (Production Configuration, Fail-Fast Startup, Graceful Shutdown, SITE_URL Propagation & Launch Readiness Docs).
 * Trường hợp sử dụng: Xác thực toàn bộ yêu cầu sẵn sàng triển khai sản xuất (Phase 11) bằng Vitest.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertProductionStartupEnv,
  getServerEnv,
} from '@/server/config/env';
import { createGracefulShutdownController } from '@/server/startup/productionServer';
import {
  buildJsonLdForRoute,
  buildPublicRouteMetadata,
  getSiteBaseUrl,
} from '@/src/lib/seo';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';

describe('Phase 11.1 — Production Configuration & Fail-Fast Startup Check', () => {
  it('applies production defaults: NODE_ENV=production, MOCK_MODE=false, EVAL_ENABLED=false, PORT, and TRUST_PROXY_HOPS=1', () => {
    const prodEnv = getServerEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      SITE_URL: 'https://shelfpath.edu.vn/',
      GEMINI_API_KEY: 'AIzaSyTestProdKey123456',
    });

    expect(prodEnv.nodeEnv).toBe('production');
    expect(prodEnv.port).toBe(8080);
    expect(prodEnv.mockModeEnv).toBe(false);
    expect(prodEnv.evalEnabled).toBe(false);
    expect(prodEnv.trustProxyHops).toBe(1);
    expect(prodEnv.siteUrl).toBe('https://shelfpath.edu.vn');
  });

  it('fails fast at startup with a clear message when GEMINI_API_KEY is missing in production (MOCK_MODE=false)', () => {
    expect(() =>
      assertProductionStartupEnv({
        NODE_ENV: 'production',
        MOCK_MODE: 'false',
        GEMINI_API_KEY: '',
      }),
    ).toThrow(/STARTUP_SECRET_CHECK_FAILED[\s\S]*GEMINI_API_KEY/);

    expect(() =>
      assertProductionStartupEnv({
        NODE_ENV: 'production',
        MOCK_MODE: 'false',
        GEMINI_API_KEY: 'MY_GEMINI_API_KEY',
      }),
    ).toThrow(/STARTUP_SECRET_CHECK_FAILED[\s\S]*GEMINI_API_KEY/);
  });

  it('fails fast in production when EVAL_ENABLED=true without EVAL_ADMIN_TOKEN or BOT_PROTECTION_PROVIDER without secret', () => {
    expect(() =>
      assertProductionStartupEnv({
        NODE_ENV: 'production',
        MOCK_MODE: 'false',
        GEMINI_API_KEY: 'AIzaSyValidKey',
        EVAL_ENABLED: 'true',
        EVAL_ADMIN_TOKEN: '',
      }),
    ).toThrow(/EVAL_ADMIN_TOKEN/);

    expect(() =>
      assertProductionStartupEnv({
        NODE_ENV: 'production',
        MOCK_MODE: 'false',
        GEMINI_API_KEY: 'AIzaSyValidKey',
        BOT_PROTECTION_PROVIDER: 'turnstile',
        BOT_PROTECTION_SECRET_KEY: '',
      }),
    ).toThrow(/BOT_PROTECTION_SECRET_KEY/);
  });

  it('starts cleanly in production when required secrets are present and handles graceful shutdown on SIGTERM', async () => {
    let closedServer = false;
    let exitCode: number | null = null;

    const controller = createGracefulShutdownController({
      envSource: {
        NODE_ENV: 'production',
        PORT: '8080',
        MOCK_MODE: 'false',
        EVAL_ENABLED: 'false',
        GEMINI_API_KEY: 'AIzaSyValidProductionKey',
        SHUTDOWN_TIMEOUT_MS: '1000',
      },
      httpServer: {
        close(cb?: (err?: Error) => void) {
          closedServer = true;
          cb?.();
          return this as unknown as ReturnType<
            import('node:http').Server['close']
          >;
        },
      },
      onExit: (code) => {
        exitCode = code;
      },
    });

    expect(controller.port).toBe(8080);
    expect(controller.isShuttingDown()).toBe(false);

    controller.trackRequestStart();
    expect(controller.getInFlightRequests()).toBe(1);
    controller.trackRequestEnd();
    expect(controller.getInFlightRequests()).toBe(0);

    await controller.initiateShutdown('SIGTERM');
    expect(controller.isShuttingDown()).toBe(true);
    expect(closedServer).toBe(true);
    expect(exitCode).toBe(0);
  });
});

describe('Phase 11.2 — Confirm sitemap, canonical, Open Graph, and JSON-LD all use SITE_URL', () => {
  it('propagates SITE_URL consistently across canonical, hreflang, Open Graph, JSON-LD, robots.txt, and sitemap.xml', () => {
    const prevSiteUrl = process.env.SITE_URL;
    process.env.SITE_URL = 'https://shelfpath.production.edu.vn';

    try {
      expect(getSiteBaseUrl()).toBe('https://shelfpath.production.edu.vn');

      // 1. Canonical, hreflang, and Open Graph metadata
      const meta = buildPublicRouteMetadata({
        locale: 'vi',
        slug: 'how-it-works',
      });
      expect(meta.alternates?.canonical).toBe(
        'https://shelfpath.production.edu.vn/vi/how-it-works',
      );
      expect(
        (meta.alternates?.languages as Record<string, string>)?.vi,
      ).toBe('https://shelfpath.production.edu.vn/vi/how-it-works');
      expect(
        (meta.alternates?.languages as Record<string, string>)?.en,
      ).toBe('https://shelfpath.production.edu.vn/en/how-it-works');
      expect(meta.openGraph?.url).toBe(
        'https://shelfpath.production.edu.vn/vi/how-it-works',
      );

      // 2. JSON-LD structured data
      const homeJsonLd = JSON.stringify(
        buildJsonLdForRoute({ locale: 'vi', slug: '' }),
      );
      const faqJsonLd = JSON.stringify(
        buildJsonLdForRoute({ locale: 'en', slug: 'faq' }),
      );
      expect(homeJsonLd).toContain('https://shelfpath.production.edu.vn/vi');
      expect(faqJsonLd).toContain('https://shelfpath.production.edu.vn/en/faq');

      // 3. sitemap.xml & robots.txt
      const sitemapEntries = sitemap();
      expect(sitemapEntries.length).toBeGreaterThanOrEqual(16);
      expect(
        sitemapEntries.every((entry) =>
          entry.url.startsWith('https://shelfpath.production.edu.vn/'),
        ),
      ).toBe(true);

      const robotsConfig = robots();
      expect(robotsConfig.sitemap).toBe(
        'https://shelfpath.production.edu.vn/sitemap.xml',
      );
    } finally {
      process.env.SITE_URL = prevSiteUrl;
    }
  });
});

describe('Phase 11.3 — Deployment & Launch Readiness Documentation Check', () => {
  it('verifies DEPLOY.md and LAUNCH_CHECKLIST.md exist and contain all required sections and status markers', () => {
    const deployPath = path.resolve(process.cwd(), 'DEPLOY.md');
    const checklistPath = path.resolve(process.cwd(), 'LAUNCH_CHECKLIST.md');

    expect(fs.existsSync(deployPath)).toBe(true);
    expect(fs.existsSync(checklistPath)).toBe(true);

    const deployContent = fs.readFileSync(deployPath, 'utf8');
    expect(deployContent).toContain('GEMINI_API_KEY');
    expect(deployContent).toContain('Cloud Run');
    expect(deployContent).toContain('SITE_URL');
    expect(deployContent).toContain('asia-east1');

    const checklistContent = fs.readFileSync(checklistPath, 'utf8');
    expect(checklistContent).toContain('[done in code]');
    expect(checklistContent).toContain('[needs me]');
    expect(checklistContent).toContain('Security');
    expect(checklistContent).toContain('SEO');
    expect(checklistContent).toContain('Accessibility');
    expect(checklistContent).toContain('Devices');
    expect(checklistContent).toContain('Cost');
    expect(checklistContent).toContain('Reliability');
    expect(checklistContent).toContain('Rollback');
  });
});
