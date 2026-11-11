/**
 * Tính năng: Bộ kiểm thử tự động Giai đoạn 8 (Site Completeness: Public Pages, Onboarding, Placeholders, Path-Based Languages, Error Pages, Icons & Manifest).
 * Trường hợp sử dụng: Chạy qua `npx --yes tsx --test src/lib/phase8.completeness.test.ts` để xác minh toàn bộ yêu cầu Giai đoạn 8.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildLanguageSwitchUrl,
  buildLocalizedPath,
  extractLocaleFromPathname,
  extractPublicSlugFromPathname,
  isValidLocaleParam,
  isValidPublicPageSlug,
  PUBLIC_NAV_LINKS,
  PUBLIC_PAGE_SLUGS,
} from './navigation';
import {
  ONBOARDING_CONTENT,
  PLACEHOLDER_INVENTORY,
  PUBLIC_PAGES_BY_LOCALE,
  SYSTEM_PAGES_CONTENT,
} from '../data/publicPagesContent';
import manifest from '../../app/manifest';

test('Phase 8.1: All 7 public content page slugs exist in both English and Vietnamese with complete sections and mailto contact', () => {
  for (const locale of ['vi', 'en'] as const) {
    const pages = PUBLIC_PAGES_BY_LOCALE[locale];
    for (const slug of PUBLIC_PAGE_SLUGS) {
      const page = pages[slug];
      assert.ok(page, `Missing page ${slug} for locale ${locale}`);
      assert.equal(page.slug, slug);
      assert.ok(page.title.length > 3);
      assert.ok(page.subtitle.length > 10);
      assert.ok(page.breadcrumbCategory.length > 2);
      assert.ok(
        page.contactMailtoHref.startsWith('mailto:'),
        `Page ${slug} must use a mailto: contact link`,
      );
      assert.ok(
        page.contactPlaceholderLabel.includes('[FILL IN:'),
        `Page ${slug} contact label must mark placeholder with [FILL IN: ...]`,
      );
    }
  }
});

test('Phase 8.1: How It Works explains all 6 stages plus what verification guarantees and does NOT guarantee', () => {
  for (const locale of ['vi', 'en'] as const) {
    const howItWorks = PUBLIC_PAGES_BY_LOCALE[locale]['how-it-works'];
    assert.equal(
      howItWorks.sections.length,
      6,
      `How It Works (${locale}) must explain all 6 stages`,
    );
    assert.ok(howItWorks.sixStagesGuarantees);
    assert.ok(
      howItWorks.sixStagesGuarantees.whatVerificationGuarantees.length >= 3,
    );
    assert.ok(
      howItWorks.sixStagesGuarantees.whatVerificationDoesNotGuarantee.length >=
        3,
    );
  }
});

test('Phase 8.1: Methodology credits Open Library and Google Books and explicitly states no endorsement or partnership', () => {
  const enText = JSON.stringify(PUBLIC_PAGES_BY_LOCALE.en.methodology);
  const viText = JSON.stringify(PUBLIC_PAGES_BY_LOCALE.vi.methodology);

  assert.ok(enText.includes('Open Library'));
  assert.ok(enText.includes('Google Books'));
  assert.ok(enText.toLowerCase().includes('no endorsement'));

  assert.ok(viText.includes('Open Library'));
  assert.ok(viText.includes('Google Books'));
  assert.ok(viText.toLowerCase().includes('độc lập'));
});

test('Phase 8.1: FAQ contains at least 8 real questions and answers in both English and Vietnamese', () => {
  for (const locale of ['vi', 'en'] as const) {
    const faq = PUBLIC_PAGES_BY_LOCALE[locale].faq;
    assert.ok(faq.faqItems, `FAQ items missing for ${locale}`);
    assert.ok(
      faq.faqItems.length >= 8,
      `Expected at least 8 FAQ items for ${locale}, got ${faq.faqItems.length}`,
    );
    for (const item of faq.faqItems) {
      assert.ok(item.question.length > 15);
      assert.ok(item.answer.length > 40);
    }
  }
});

test('Phase 8.2: Legal pages (Privacy, Terms & Disclaimer) include legal review notices and all [FILL IN] placeholders are listed in docs/PLACEHOLDERS.md', () => {
  for (const locale of ['vi', 'en'] as const) {
    assert.equal(
      PUBLIC_PAGES_BY_LOCALE[locale].privacy.requiresLegalReviewBanner,
      true,
    );
    assert.ok(
      PUBLIC_PAGES_BY_LOCALE[locale].privacy.legalReviewBannerText?.length,
    );
    assert.equal(
      PUBLIC_PAGES_BY_LOCALE[locale].terms.requiresLegalReviewBanner,
      true,
    );
    assert.ok(
      PUBLIC_PAGES_BY_LOCALE[locale].terms.legalReviewBannerText?.length,
    );
  }

  const placeholdersDocPath = path.join(
    process.cwd(),
    'docs',
    'PLACEHOLDERS.md',
  );
  assert.equal(
    fs.existsSync(placeholdersDocPath),
    true,
    'docs/PLACEHOLDERS.md must exist',
  );
  const placeholdersDoc = fs.readFileSync(placeholdersDocPath, 'utf8');

  for (const item of PLACEHOLDER_INVENTORY) {
    assert.ok(
      placeholdersDoc.includes(item.token),
      `Placeholder token ${item.token} must be documented in docs/PLACEHOLDERS.md`,
    );
  }
});

test('Phase 8.3: Onboarding has 3 skippable steps in both languages and Try an example support', () => {
  for (const locale of ['vi', 'en'] as const) {
    const ob = ONBOARDING_CONTENT[locale];
    assert.equal(ob.steps.length, 3);
    assert.equal(ob.steps[0].stepNumber, 1);
    assert.equal(ob.steps[1].stepNumber, 2);
    assert.equal(ob.steps[2].stepNumber, 3);
    assert.ok(ob.skipBtn.length > 0);
    assert.ok(ob.tryExampleHeading.length > 0);
  }
});

test('Phase 8.4: System pages (404, 500), SVG icons, Web Manifest exist, and NO service worker exists', () => {
  const root = process.cwd();
  assert.equal(fs.existsSync(path.join(root, 'app', 'not-found.tsx')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'error.tsx')), true);
  assert.equal(fs.existsSync(path.join(root, 'app', 'global-error.tsx')), true);
  assert.equal(fs.existsSync(path.join(root, 'public', 'icon.svg')), true);
  assert.equal(
    fs.existsSync(path.join(root, 'public', 'apple-icon.svg')),
    true,
  );
  assert.equal(fs.existsSync(path.join(root, 'public', 'favicon.svg')), true);

  // Verify no service worker was added
  assert.equal(fs.existsSync(path.join(root, 'public', 'sw.js')), false);
  assert.equal(
    fs.existsSync(path.join(root, 'public', 'service-worker.js')),
    false,
  );

  const webManifest = manifest();
  assert.equal(webManifest.short_name, 'ShelfPath');
  assert.equal(webManifest.theme_color, '#C8433C');
  assert.ok((webManifest.icons ?? []).length >= 3);
  for (const icon of webManifest.icons ?? []) {
    assert.equal(icon.type, 'image/svg+xml');
  }

  for (const locale of ['vi', 'en'] as const) {
    assert.ok(SYSTEM_PAGES_CONTENT[locale].notFound.title.length > 5);
    assert.ok(SYSTEM_PAGES_CONTENT[locale].serverError.title.length > 5);
  }
});

test('Phase 8.5: Path-based language routing (/en, /vi) preserves page path and query state, and /eval is excluded from all navigation', () => {
  assert.equal(isValidLocaleParam('en'), true);
  assert.equal(isValidLocaleParam('vi'), true);
  assert.equal(isValidLocaleParam('fr'), false);

  assert.equal(isValidPublicPageSlug('how-it-works'), true);
  assert.equal(isValidPublicPageSlug('faq'), true);
  assert.equal(isValidPublicPageSlug('eval'), false);

  assert.equal(extractLocaleFromPathname('/en/how-it-works'), 'en');
  assert.equal(extractLocaleFromPathname('/vi/faq'), 'vi');
  assert.equal(extractLocaleFromPathname('/faq'), null);

  assert.equal(
    extractPublicSlugFromPathname('/en/methodology'),
    'methodology',
  );
  assert.equal(extractPublicSlugFromPathname('/privacy'), 'privacy');

  assert.equal(buildLocalizedPath('en', ''), '/en');
  assert.equal(buildLocalizedPath('vi', 'how-it-works'), '/vi/how-it-works');

  // Switching language preserves sub-path and query string state
  assert.equal(
    buildLanguageSwitchUrl('/vi/how-it-works', '?topic=Philosophy', 'en'),
    '/en/how-it-works?topic=Philosophy',
  );
  assert.equal(
    buildLanguageSwitchUrl('/en', '?autostart=1', 'vi'),
    '/vi?autostart=1',
  );
  assert.equal(buildLanguageSwitchUrl('/faq', '', 'en'), '/en/faq');

  // Ensure /eval never appears in PUBLIC_NAV_LINKS
  for (const navItem of PUBLIC_NAV_LINKS) {
    assert.notEqual(navItem.slug, 'eval' as unknown);
    assert.equal(navItem.labelEn.toLowerCase().includes('eval'), false);
    assert.equal(navItem.labelVi.toLowerCase().includes('eval'), false);
  }
});
