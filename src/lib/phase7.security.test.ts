/**
 * Tính năng: Bộ Kiểm thử Bảo mật, Chống Lạm dụng, Bảo vệ Chi phí & Quyền riêng tư (Phase 7 Security Test Suite).
 * Trường hợp sử dụng:
 * 1. Kiểm tra Security Headers (Helmet CSP tương thích 3D bundle, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors) & /.well-known/security.txt.
 * 2. Kiểm tra hành vi 429 (Per-IP Rate Limit, Anti-Scraping trên verification endpoint) và 503 Ngân sách Gemini hàng ngày / Cầu dao bảo vệ (DailyGeminiBudgetCircuitBreaker).
 * 3. Kiểm tra giới hạn kích thước body (413 PAYLOAD_TOO_LARGE), Content-Type (415 UNSUPPORTED_MEDIA_TYPE) và chính sách CORS (403 FORBIDDEN_ORIGIN).
 * 4. Kiểm tra bộ 16 chuỗi tấn công Prompt Injection (trực tiếp từ người dùng & gián tiếp từ kết quả tìm kiếm web).
 * 5. Kiểm tra danh sách cho phép chống SSRF (assertAllowedOutboundUrl & sanitizeExternalSourceUrl).
 * 6. Kiểm tra khóa bảo vệ /eval (EVAL_ENABLED & so sánh thời gian hằng số EVAL_ADMIN_TOKEN).
 * 7. Kiểm tra quét rò rỉ khóa bí mật trong bundle/code phía client, kiểm tra cấm dangerouslySetInnerHTML và xoay vòng băm IP theo ngày.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  assertAllowedOutboundUrl,
  buildHelmetCspHeader,
  buildSecurityHeaders,
  constantTimeTokenEquals,
  detectAndNeutralizePromptInjection,
  extractTrustedClientIp,
  globalGeminiBudgetCircuitBreaker,
  hashClientIpTransiently,
  PROMPT_INJECTION_TEST_CORPUS,
  redactSecretsInLog,
  sanitizeExternalSourceUrl,
  sanitizePlainTextOutput,
  scanClientBundleForSecrets,
  verifyEvalAdminAccess,
  wrapUntrustedDataForPrompt,
} from '@/server/security/securityControls';
import { ApiErrorEnvelopeSchema } from './schemas/apiContract';
import { sanitizeRefinementInput } from './refinementAndDismiss';
import {
  globalAggregateRateLimiter,
  globalRecommendationRateLimiter,
  globalVerificationScrapeRateLimiter,
} from '@/server/rateLimit/rateLimiter';
import {
  GET as getRecommendationsRoute,
  POST as postRecommendationsRoute,
} from '@/app/api/recommendations/route';
import { POST as postRefineRoute } from '@/app/api/recommendations/[id]/refine/route';
import { GET as getBookVerificationRoute } from '@/app/api/books/[bookId]/verification/route';
import { GET as getSecurityTxtRoute } from '@/app/.well-known/security.txt/route';

function makeNextRequest(
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | unknown;
  },
): NextRequest {
  const method = init?.method ?? 'GET';
  const headers = new Headers({
    ...(init?.headers ?? {}),
  });
  if (
    init?.body !== undefined &&
    typeof init.body !== 'string' &&
    !headers.has('content-type')
  ) {
    headers.set('content-type', 'application/json');
  }
  const rawBody =
    init?.body === undefined
      ? undefined
      : typeof init.body === 'string'
        ? init.body
        : JSON.stringify(init.body);

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers,
    body: rawBody,
  });
}

test('Phase 7 Security — Helmet CSP, Security Headers, No Cookies & /.well-known/security.txt', async () => {
  const devHeaders = buildSecurityHeaders({ enforceFrameAncestorsNone: false });
  assert.ok(devHeaders['Content-Security-Policy'].includes("default-src 'self'"));
  assert.ok(devHeaders['Content-Security-Policy'].includes("object-src 'none'"));
  assert.ok(
    devHeaders['Content-Security-Policy'].includes(
      'https://covers.openlibrary.org',
    ),
  );
  assert.equal(devHeaders['X-Content-Type-Options'], 'nosniff');
  assert.equal(
    devHeaders['Referrer-Policy'],
    'strict-origin-when-cross-origin',
  );
  assert.ok(
    devHeaders['Strict-Transport-Security'].includes('max-age=63072000'),
  );
  assert.ok(devHeaders['Permissions-Policy'].includes('camera=()'));

  // Kiểm tra chế độ Production độc lập có frame-ancestors 'none'
  const prodCsp = buildHelmetCspHeader({ enforceFrameAncestorsNone: true });
  assert.ok(prodCsp.includes("frame-ancestors 'none'"));

  // Kiểm tra route /.well-known/security.txt
  const secTxtRes = await getSecurityTxtRoute();
  assert.equal(secTxtRes.status, 200);
  assert.ok(
    (secTxtRes.headers.get('content-type') || '').includes('text/plain'),
  );
  const secTxtBody = await secTxtRes.text();
  assert.ok(secTxtBody.includes('Contact: mailto:'));
  assert.ok(secTxtBody.includes('Preferred-Languages: en, vi'));

  // Kiểm tra API response có đầy đủ security headers và tuyệt đối không phát sinh Set-Cookie
  const statusReq = makeNextRequest('http://localhost:3000/api/recommendations');
  const statusRes = await getRecommendationsRoute(statusReq);
  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(statusRes.headers.get('content-security-policy'));
  assert.equal(statusRes.headers.get('set-cookie'), null);
});

test('Phase 7 Security — Oversized Bodies (413), Unsupported Content-Type (415) & CORS (403)', async () => {
  globalRecommendationRateLimiter.reset();
  globalAggregateRateLimiter.reset();

  // 1. Oversized Body (> 16 KB) -> 413 PAYLOAD_TOO_LARGE
  const hugeString = 'A'.repeat(20_000);
  const oversizedReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({
        preferences: {
          topic: hugeString,
          level: 'beginner',
          length: 'any',
          language: 'any',
          adventurousness: 30,
        },
      }),
    },
  );
  const oversizedRes = await postRecommendationsRoute(oversizedReq);
  assert.equal(oversizedRes.status, 413);
  const oversizedErr = ApiErrorEnvelopeSchema.parse(await oversizedRes.json());
  assert.equal(oversizedErr.error.code, 'PAYLOAD_TOO_LARGE');

  // 2. Wrong Content-Type -> 415 UNSUPPORTED_MEDIA_TYPE
  const wrongTypeReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'x-forwarded-for': '203.0.113.11',
      },
      body: 'plain text payload',
    },
  );
  const wrongTypeRes = await postRecommendationsRoute(wrongTypeReq);
  assert.equal(wrongTypeRes.status, 415);
  const wrongTypeErr = ApiErrorEnvelopeSchema.parse(await wrongTypeRes.json());
  assert.equal(wrongTypeErr.error.code, 'UNSUPPORTED_MEDIA_TYPE');

  // 3. Cross-Origin request from untrusted domain -> 403 FORBIDDEN_ORIGIN
  const crossOriginReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://malicious-attacker-site.example.com',
        host: 'shelfpath.app',
      },
      body: {
        preferences: {
          topic: 'Machine Learning',
          level: 'beginner',
          length: 'any',
          language: 'any',
          adventurousness: 30,
        },
      },
    },
  );
  const crossOriginRes = await postRecommendationsRoute(crossOriginReq);
  assert.equal(crossOriginRes.status, 403);
  const corsErr = ApiErrorEnvelopeSchema.parse(await crossOriginRes.json());
  assert.equal(corsErr.error.code, 'FORBIDDEN_ORIGIN');
});

test('Phase 7 Security — 429 Rate Limiting, Verification Anti-Scraping & Daily Gemini Budget Circuit Breaker', async () => {
  globalRecommendationRateLimiter.reset();
  globalAggregateRateLimiter.reset();
  globalVerificationScrapeRateLimiter.reset();
  globalGeminiBudgetCircuitBreaker.resetForTests();

  // 1. Per-IP 429 trên POST /api/recommendations sau 10 yêu cầu/phút
  const testClientIp = '198.51.100.42';
  for (let i = 0; i < 10; i++) {
    const check = globalRecommendationRateLimiter.check(testClientIp);
    assert.equal(check.allowed, true);
  }
  const eleventhReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      headers: {
        'x-forwarded-for': `10.0.0.1, ${testClientIp}`, // Cloud Run trusted hop = rightmost
      },
      body: {
        preferences: {
          topic: 'Machine Learning',
          level: 'beginner',
          length: 'any',
          language: 'any',
          adventurousness: 30,
        },
        useMockMode: true,
      },
    },
  );
  const rateLimitedRes = await postRecommendationsRoute(eleventhReq);
  assert.equal(rateLimitedRes.status, 429);
  assert.ok(Number(rateLimitedRes.headers.get('retry-after')) >= 1);
  const rlBody = ApiErrorEnvelopeSchema.parse(await rateLimitedRes.json());
  assert.equal(rlBody.error.code, 'RATE_LIMITED');

  // 2. Anti-scraping 429 trên GET /api/books/{bookId}/verification sau 30 yêu cầu/phút
  const scraperIp = '198.51.100.99';
  for (let i = 0; i < 30; i++) {
    globalVerificationScrapeRateLimiter.check(`verify_${scraperIp}`);
  }
  const scrapeReq = makeNextRequest(
    'http://localhost:3000/api/books/mock-ml-1/verification',
    {
      headers: { 'x-forwarded-for': scraperIp },
    },
  );
  const scrapeRes = await getBookVerificationRoute(scrapeReq, {
    params: Promise.resolve({ bookId: 'mock-ml-1' }),
  });
  assert.equal(scrapeRes.status, 429);

  // 3. Daily Global Gemini Budget Exhausted -> 503 DAILY_BUDGET_EXHAUSTED ("busy, try again later")
  globalRecommendationRateLimiter.reset();
  globalAggregateRateLimiter.reset();
  globalGeminiBudgetCircuitBreaker.configureForTests({
    dailyBudgetLimit: 5,
    callsUsedToday: 5,
  });

  const budgetReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.77' },
      body: {
        preferences: {
          topic: 'Distributed Systems',
          level: 'intermediate',
          length: 'any',
          language: 'any',
          adventurousness: 35,
        },
        useMockMode: false,
      },
    },
  );
  const budgetRes = await postRecommendationsRoute(budgetReq);
  assert.equal(budgetRes.status, 503);
  const budgetErr = ApiErrorEnvelopeSchema.parse(await budgetRes.json());
  assert.equal(budgetErr.error.code, 'DAILY_BUDGET_EXHAUSTED');
  assert.ok(budgetErr.error.message.toLowerCase().includes('busy'));

  // 4. Circuit Breaker Open -> 503 CIRCUIT_BREAKER_OPEN
  globalGeminiBudgetCircuitBreaker.configureForTests({
    dailyBudgetLimit: 250,
    callsUsedToday: 2,
    consecutiveFailures: 5,
    circuitOpenUntilMs: Date.now() + 30_000,
  });
  const breakerReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.78' },
      body: {
        preferences: {
          topic: 'Distributed Systems',
          level: 'intermediate',
          length: 'any',
          language: 'any',
          adventurousness: 35,
        },
        useMockMode: false,
      },
    },
  );
  const breakerRes = await postRecommendationsRoute(breakerReq);
  assert.equal(breakerRes.status, 503);
  const breakerErr = ApiErrorEnvelopeSchema.parse(await breakerRes.json());
  assert.equal(breakerErr.error.code, 'CIRCUIT_BREAKER_OPEN');

  globalGeminiBudgetCircuitBreaker.resetForTests();
  globalRecommendationRateLimiter.reset();
  globalVerificationScrapeRateLimiter.reset();
});

test('Phase 7 Security — 16-String Prompt Injection Defense Suite (Direct & Indirect)', async () => {
  assert.ok(
    PROMPT_INJECTION_TEST_CORPUS.length >= 15,
    `Expected at least 15 injection strings, got ${PROMPT_INJECTION_TEST_CORPUS.length}`,
  );

  // Kiểm tra toàn bộ 16 chuỗi tấn công trên bộ lọc trung tâm và bộ lọc tinh chỉnh
  for (const [idx, attackString] of PROMPT_INJECTION_TEST_CORPUS.entries()) {
    const check = detectAndNeutralizePromptInjection(attackString, 500);
    assert.equal(
      check.detectedInjection,
      true,
      `Injection string #${idx + 1} was not flagged by detectAndNeutralizePromptInjection: "${attackString}"`,
    );

    const refineCheck = sanitizeRefinementInput(attackString);
    assert.equal(
      refineCheck.blockedInjectionAttempt,
      true,
      `Injection string #${idx + 1} was not flagged by sanitizeRefinementInput: "${attackString}"`,
    );

    // Đảm bảo bọc trong thẻ <untrusted_...> không bao giờ bị đóng thẻ sớm (delimiter breakout)
    const wrapped = wrapUntrustedDataForPrompt(
      'untrusted_web_search_notes',
      attackString,
      500,
    );
    const innerContent = wrapped.wrappedPromptBlock
      .replace(/^<untrusted_web_search_notes>/, '')
      .replace(/<\/untrusted_web_search_notes>$/, '');
    assert.equal(
      innerContent.includes('<') || innerContent.includes('>'),
      false,
      `Delimiter breakout characters survived in string #${idx + 1}`,
    );
  }

  // Kiểm tra tích hợp trực tiếp trên endpoint POST /api/recommendations/{id}/refine
  const createReq = makeNextRequest(
    'http://localhost:3000/api/recommendations',
    {
      method: 'POST',
      body: {
        preferences: {
          topic: 'Machine Learning',
          level: 'beginner',
          length: 'any',
          language: 'any',
          adventurousness: 30,
        },
        useMockMode: true,
      },
    },
  );
  const createRes = await postRecommendationsRoute(createReq);
  const createdSet = (await createRes.json()) as { id: string };

  const injectionRefineReq = makeNextRequest(
    `http://localhost:3000/api/recommendations/${createdSet.id}/refine`,
    {
      method: 'POST',
      body: {
        text: PROMPT_INJECTION_TEST_CORPUS[0],
        useMockMode: true,
      },
    },
  );
  const injectionRefineRes = await postRefineRoute(injectionRefineReq, {
    params: Promise.resolve({ id: createdSet.id }),
  });
  assert.equal(injectionRefineRes.status, 200);
  const refineData = (await injectionRefineRes.json()) as {
    blockedInjectionAttempt: boolean;
    recommendationSet: { books: Array<{ verification: { status: string } }> };
  };
  assert.equal(refineData.blockedInjectionAttempt, true);
  assert.ok(
    refineData.recommendationSet.books.every(
      (b) => b.verification.status === 'verified',
    ),
  );
});

test('Phase 7 Security — SSRF Outbound Allowlist & User-Facing Source URL Sanitizer', () => {
  // 1. Các máy chủ hợp lệ được phép gọi
  assert.doesNotThrow(() =>
    assertAllowedOutboundUrl('https://openlibrary.org/search.json?title=test'),
  );
  assert.doesNotThrow(() =>
    assertAllowedOutboundUrl('https://www.googleapis.com/books/v1/volumes?q=test'),
  );

  // 2. Các địa chỉ tấn công SSRF bị chặn tuyệt đối
  const blockedUrls = [
    'http://openlibrary.org/search.json', // Không phải https
    'http://169.254.169.254/latest/meta-data/', // AWS/GCP cloud metadata
    'https://metadata.google.internal/computeMetadata/v1/', // GCP metadata
    'https://127.0.0.1/admin', // Loopback
    'https://localhost:3000/api/eval/runs', // Localhost
    'https://10.0.0.1/internal', // RFC1918 Private
    'https://192.168.1.1/router', // RFC1918 Private
    'https://172.16.0.5/secret', // RFC1918 Private
    'https://[::1]/loopback', // IPv6 loopback
    'https://admin:secret@openlibrary.org/search.json', // Credentials in URL
    'https://openlibrary.org:8080/search.json', // Non-443 port
    'https://evil-attacker.example.com/search.json', // Arbitrary domain
  ];

  for (const badUrl of blockedUrls) {
    assert.throws(
      () => assertAllowedOutboundUrl(badUrl),
      /SSRF_BLOCKED/,
      `Expected SSRF guard to block ${badUrl}`,
    );
  }

  // 3. Kiểm tra làm sạch liên kết nguồn hiển thị cho người dùng (sanitizeExternalSourceUrl)
  assert.equal(
    sanitizeExternalSourceUrl('https://openlibrary.org/works/OL123W'),
    'https://openlibrary.org/works/OL123W',
  );
  assert.equal(
    sanitizeExternalSourceUrl('javascript:alert(document.domain)'),
    'https://openlibrary.org',
  );
  assert.equal(
    sanitizeExternalSourceUrl('http://169.254.169.254/latest/meta-data/'),
    'https://openlibrary.org',
  );
  assert.equal(
    sanitizeExternalSourceUrl('https://untrusted-tracker.example.org/book'),
    'https://openlibrary.org',
  );

  // 4. Kiểm tra loại bỏ XSS trong văn bản đầu ra
  assert.equal(
    sanitizePlainTextOutput('Clean Book <script>alert(1)</script> Title'),
    'Clean Book  Title',
  );
});

test('Phase 7 Security — /eval Guard (EVAL_ENABLED & Constant-Time EVAL_ADMIN_TOKEN)', () => {
  // 1. Constant-time comparison
  assert.equal(
    constantTimeTokenEquals('super_secret_admin_token_123', 'super_secret_admin_token_123'),
    true,
  );
  assert.equal(
    constantTimeTokenEquals('super_secret_admin_token_124', 'super_secret_admin_token_123'),
    false,
  );
  assert.equal(
    constantTimeTokenEquals('short', 'super_secret_admin_token_123'),
    false,
  );

  // 2. EVAL_ENABLED=false -> 403 EVAL_DISABLED
  const reqNoAuth = makeNextRequest('http://localhost:3000/api/eval/runs');
  const disabledCheck = verifyEvalAdminAccess(reqNoAuth, {
    evalEnabled: false,
    evalAdminToken: 'secret_token',
  });
  assert.equal(disabledCheck.allowed, false);
  if (!disabledCheck.allowed) {
    assert.equal(disabledCheck.status, 403);
    assert.equal(disabledCheck.errorCode, 'EVAL_DISABLED');
  }

  // 3. EVAL_ENABLED=true + EVAL_ADMIN_TOKEN configured -> 401 when missing or invalid, 200 when valid
  const missingTokenCheck = verifyEvalAdminAccess(reqNoAuth, {
    evalEnabled: true,
    evalAdminToken: 'my_admin_secret_2026',
  });
  assert.equal(missingTokenCheck.allowed, false);
  if (!missingTokenCheck.allowed) {
    assert.equal(missingTokenCheck.status, 401);
    assert.equal(missingTokenCheck.errorCode, 'EVAL_UNAUTHORIZED');
  }

  const reqWithValidToken = makeNextRequest(
    'http://localhost:3000/api/eval/runs',
    {
      headers: { 'x-eval-admin-token': 'my_admin_secret_2026' },
    },
  );
  const validTokenCheck = verifyEvalAdminAccess(reqWithValidToken, {
    evalEnabled: true,
    evalAdminToken: 'my_admin_secret_2026',
  });
  assert.equal(validTokenCheck.allowed, true);
});

test('Phase 7 Security — Privacy by Design (Daily Rotating IP Hash, Cloud Run Trust Proxy, Secret Redaction & Client Bundle Scan)', () => {
  // 1. Cloud Run X-Forwarded-For extraction (lấy hop tin cậy từ bên phải, chống giả mạo hop bên trái)
  const spoofedReq = makeNextRequest('http://localhost:3000/api/recommendations', {
    headers: {
      'x-forwarded-for': '1.2.3.4, 203.0.113.55',
    },
  });
  assert.equal(extractTrustedClientIp(spoofedReq), '203.0.113.55');

  // 2. Daily Rotating Salted Hash không chứa IP thô và thay đổi hoàn toàn khi sang ngày mới
  const rawIp = '203.0.113.55';
  const hashDay1 = hashClientIpTransiently(rawIp, '2026-11-09');
  const hashDay2 = hashClientIpTransiently(rawIp, '2026-11-10');
  assert.equal(hashDay1.includes(rawIp), false);
  assert.notEqual(hashDay1, hashDay2);
  assert.equal(hashDay1, hashClientIpTransiently(rawIp, '2026-11-09'));

  // 3. Redact secrets in logs
  const sampleLog =
    'Failed request to https://www.googleapis.com/books/v1/volumes?key=AIzaSyDa12345678901234567890123456789 with Authorization: Bearer ya29.secret_token_value';
  const redacted = redactSecretsInLog(sampleLog);
  assert.equal(redacted.includes('AIzaSyDa12345678901234567890123456789'), false);
  assert.equal(redacted.includes('ya29.secret_token_value'), false);
  assert.ok(redacted.includes('***REDACTED***'));

  // 4. Quét toàn bộ mã nguồn client & bundle đảm bảo 0 secret leaks và 0 dangerouslySetInnerHTML
  const scanResult = scanClientBundleForSecrets();
  assert.ok(scanResult.filesScanned > 10);
  assert.deepEqual(scanResult.secretViolations, []);
  assert.deepEqual(scanResult.xssViolations, []);
  assert.equal(scanResult.passed, true);
});
