/**
 * Tính năng: Bộ kiểm thử tự động Giai đoạn 9 (Technical SEO, Per-Route Head Metadata, Sitemap & Robots.txt, 301 Canonical Redirects, Noindex Rules, và Dữ liệu có cấu trúc JSON-LD).
 * Trường hợp sử dụng: Chạy qua `npx --yes tsx --test src/lib/phase9.seo.test.ts` để xác minh toàn bộ yêu cầu Giai đoạn 9.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvalRouteMetadata,
  buildJsonLdForRoute,
  buildPublicRouteMetadata,
  getAllPublicSeoAuditRows,
  getSiteBaseUrl,
  hasPersonalizedQueryParams,
  resolveCanonicalRedirect,
} from './seo';
import { PUBLIC_PAGE_SLUGS } from './navigation';
import { PUBLIC_PAGES_BY_LOCALE } from '../data/publicPagesContent';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';

test('Phase 9.1: All 16 public routes (/vi, /en, and 7 content pages x 2 locales) have unique titles (<= 60 chars), unique descriptions (<= 160 chars), canonical URLs, and hreflang (en, vi, x-default)', () => {
  const testSiteUrl = 'https://shelfpath.example.edu';
  const rows = getAllPublicSeoAuditRows(testSiteUrl);

  assert.equal(rows.length, 16, 'Expected 16 localized public routes (8 pages x 2 locales)');

  const seenTitles = new Set<string>();
  const seenDescriptions = new Set<string>();

  for (const row of rows) {
    assert.ok(
      row.titleLength > 15 && row.titleLength <= 60,
      `Route ${row.route} title length must be <= 60 chars, got ${row.titleLength} ("${row.title}")`,
    );
    assert.ok(
      row.descriptionLength >= 70 && row.descriptionLength <= 160,
      `Route ${row.route} description length must be <= 160 chars, got ${row.descriptionLength} ("${row.description}")`,
    );

    assert.equal(
      seenTitles.has(row.title),
      false,
      `Duplicate title found on ${row.route}: "${row.title}"`,
    );
    seenTitles.add(row.title);

    assert.equal(
      seenDescriptions.has(row.description),
      false,
      `Duplicate description found on ${row.route}: "${row.description}"`,
    );
    seenDescriptions.add(row.description);

    assert.equal(row.canonical, `${testSiteUrl}${row.route}`);
    assert.ok(row.hreflangEn.startsWith(`${testSiteUrl}/en`));
    assert.ok(row.hreflangVi.startsWith(`${testSiteUrl}/vi`));
    assert.equal(row.hreflangXDefault, row.hreflangEn);

    const metadata = buildPublicRouteMetadata({
      locale: row.locale,
      slug: row.slug,
      explicitSiteUrl: testSiteUrl,
    });
    assert.equal(metadata.title, row.title);
    assert.equal(metadata.description, row.description);
    assert.equal(metadata.alternates?.canonical, row.canonical);
    assert.equal(
      (metadata.alternates?.languages as Record<string, string>)?.en,
      row.hreflangEn,
    );
    assert.equal(
      (metadata.alternates?.languages as Record<string, string>)?.vi,
      row.hreflangVi,
    );
    assert.equal(
      (metadata.alternates?.languages as Record<string, string>)?.['x-default'],
      row.hreflangXDefault,
    );
    assert.equal(metadata.openGraph?.title, row.title);
    assert.equal(metadata.twitter?.title, row.title);
  }
});

test('Phase 9.2: Indexing rules — robots.txt and sitemap.xml cover all public pages in both languages and disallow /eval, /api, and personalized views', () => {
  const siteUrl = getSiteBaseUrl();
  const robotsConfig = robots();
  assert.equal(robotsConfig.sitemap, `${siteUrl}/sitemap.xml`);

  const rulesArray = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules
    : [robotsConfig.rules];
  const primaryRule = rulesArray[0];
  assert.ok(primaryRule);

  const disallowList = Array.isArray(primaryRule.disallow)
    ? primaryRule.disallow
    : [primaryRule.disallow];
  assert.ok(disallowList.includes('/api/'));
  assert.ok(disallowList.includes('/eval'));
  assert.ok(disallowList.includes('/*?topic=*'));
  assert.ok(disallowList.includes('/*?rec=*'));

  const sitemapEntries = sitemap();
  assert.equal(
    sitemapEntries.length,
    16,
    'Sitemap must contain all 16 public routes in vi and en',
  );

  for (const entry of sitemapEntries) {
    assert.equal(entry.url.includes('/eval'), false);
    assert.equal(entry.url.includes('/api'), false);
    const langs = entry.alternates?.languages as Record<string, string>;
    assert.ok(langs?.en);
    assert.ok(langs?.vi);
    assert.ok(langs?.['x-default']);
  }

  // Personalized views and /eval must have noindex metadata
  assert.equal(hasPersonalizedQueryParams({ topic: 'Machine Learning' }), true);
  assert.equal(hasPersonalizedQueryParams({ rec: 'rec_123' }), true);
  assert.equal(hasPersonalizedQueryParams({}), false);

  const personalizedMeta = buildPublicRouteMetadata({
    locale: 'vi',
    slug: '',
    isPersonalizedView: true,
  });
  assert.equal(
    (personalizedMeta.robots as { index?: boolean })?.index,
    false,
  );

  const evalMeta = buildEvalRouteMetadata();
  assert.equal((evalMeta.robots as { index?: boolean })?.index, false);
  assert.equal((evalMeta.robots as { follow?: boolean })?.follow, false);
});

test('Phase 9.3: Non-canonical URLs return 301 Permanent Redirects to canonical URLs', () => {
  // Unprefixed content slugs -> 301 to /vi/<slug>
  for (const slug of PUBLIC_PAGE_SLUGS) {
    const redirect = resolveCanonicalRedirect(`/${slug}`);
    assert.ok(redirect, `Expected 301 redirect for /${slug}`);
    assert.equal(redirect.statusCode, 301);
    assert.equal(redirect.destinationPath, `/vi/${slug}`);
  }

  // Preserves query string on 301 redirect
  const faqWithQuery = resolveCanonicalRedirect('/faq', '?q=isbn');
  assert.deepEqual(faqWithQuery, {
    shouldRedirect: true,
    statusCode: 301,
    destinationPath: '/vi/faq?q=isbn',
  });

  // Uppercase or trailing-slash variants -> 301 to lowercase canonical
  assert.deepEqual(resolveCanonicalRedirect('/EN/How-It-Works'), {
    shouldRedirect: true,
    statusCode: 301,
    destinationPath: '/en/how-it-works',
  });
  assert.deepEqual(resolveCanonicalRedirect('/home'), {
    shouldRedirect: true,
    statusCode: 301,
    destinationPath: '/vi',
  });

  // Already canonical URLs return null
  assert.equal(resolveCanonicalRedirect('/vi'), null);
  assert.equal(resolveCanonicalRedirect('/en'), null);
  assert.equal(resolveCanonicalRedirect('/en/how-it-works'), null);
  assert.equal(resolveCanonicalRedirect('/vi/faq'), null);
  assert.equal(resolveCanonicalRedirect('/eval'), null);
  assert.equal(resolveCanonicalRedirect('/api/recommendations'), null);
});

test('Phase 9.4: Structured data (JSON-LD) matches visible page content 100% and uses only truthful facts & [FILL IN] placeholders', () => {
  // 1. Home & About include WebApplication and Organization with [FILL IN] placeholders
  const homeSchemas = buildJsonLdForRoute({
    locale: 'vi',
    slug: '',
    explicitSiteUrl: 'https://shelfpath.example.edu',
  });
  assert.equal(homeSchemas.length, 2);
  assert.equal(homeSchemas[0]['@type'], 'WebApplication');
  assert.equal(homeSchemas[1]['@type'], 'Organization');
  assert.equal(
    homeSchemas[1].legalName,
    '[FILL IN: Data Controller / Operator Full Legal Name]',
  );

  // 2. All 7 content pages include BreadcrumbList matching visible breadcrumbs
  for (const locale of ['vi', 'en'] as const) {
    for (const slug of PUBLIC_PAGE_SLUGS) {
      const schemas = buildJsonLdForRoute({
        locale,
        slug,
        explicitSiteUrl: 'https://shelfpath.example.edu',
      });
      const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      assert.ok(breadcrumb, `Missing BreadcrumbList for /${locale}/${slug}`);
      const items = breadcrumb.itemListElement as Array<{
        position: number;
        name: string;
      }>;
      assert.equal(items.length, 3);
      assert.equal(items[2].name, PUBLIC_PAGES_BY_LOCALE[locale][slug].title);
    }
  }

  // 3. FAQ page JSON-LD matches visible FAQ items 100%
  for (const locale of ['vi', 'en'] as const) {
    const schemas = buildJsonLdForRoute({ locale, slug: 'faq' });
    const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage');
    assert.ok(faqSchema, `Missing FAQPage schema for /${locale}/faq`);
    const entities = faqSchema.mainEntity as Array<{
      name: string;
      acceptedAnswer: { text: string };
    }>;
    const visibleFaqs = PUBLIC_PAGES_BY_LOCALE[locale].faq.faqItems ?? [];
    assert.equal(entities.length, visibleFaqs.length);
    for (let i = 0; i < visibleFaqs.length; i++) {
      assert.equal(entities[i].name, visibleFaqs[i].question);
      assert.equal(entities[i].acceptedAnswer.text, visibleFaqs[i].answer);
    }
  }
});
