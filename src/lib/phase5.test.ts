/**
 * Tính năng: Bộ kiểm thử đơn vị (Unit Tests) cho Giai đoạn 5 (Phase 5: Evaluation Lab Metrics, Audit Mode Verification, URL Allowlist Security & Export).
 * Trường hợp sử dụng: Chạy qua `npx --yes tsx --test src/lib/phase5.test.ts`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSafeSourceUrlOrFallback,
  sanitizeExternalSourceUrl,
} from './urlSecurity';
import {
  computeConfigAggregates,
  computeMeanPairwiseEmbeddingDistance,
  exportEvalRunToCsvWithBom,
  extractRealLimitationsFromRun,
} from './evalMetrics';
import {
  evaluateSingleProfileConfig,
  PREPARED_EVAL_PROFILES,
} from '../../server/eval/evalRunner';

test('sanitizeExternalSourceUrl allows only https openlibrary.org and Google Books hosts', () => {
  assert.equal(
    sanitizeExternalSourceUrl('https://openlibrary.org/books/OL27326455M'),
    'https://openlibrary.org/books/OL27326455M',
  );
  assert.equal(
    sanitizeExternalSourceUrl('https://books.google.com/books?id=HnetDwAAQBAJ'),
    'https://books.google.com/books?id=HnetDwAAQBAJ',
  );
  // Reject non-https
  assert.equal(
    sanitizeExternalSourceUrl('http://openlibrary.org/books/OL27326455M'),
    null,
  );
  // Reject javascript: or data: URIs
  assert.equal(sanitizeExternalSourceUrl('javascript:alert(1)'), null);
  // Reject unknown third-party domains
  assert.equal(
    sanitizeExternalSourceUrl('https://malicious-bookstore.example.com/book/1'),
    null,
  );

  const fallback = getSafeSourceUrlOrFallback(
    'http://untrusted.example.com',
    'Machine Learning Yearning',
  );
  assert.equal(
    fallback.startsWith('https://openlibrary.org/search?q='),
    true,
  );
});

test('computeMeanPairwiseEmbeddingDistance calculates exact mean pairwise cosine distance', () => {
  assert.equal(computeMeanPairwiseEmbeddingDistance([]), 0);
  assert.equal(computeMeanPairwiseEmbeddingDistance([[1, 0, 0]]), 0);

  // Two identical vectors -> cosine similarity = 1 -> distance = 0
  assert.equal(
    computeMeanPairwiseEmbeddingDistance([
      [1, 0, 0],
      [1, 0, 0],
    ]),
    0,
  );

  // Two orthogonal vectors -> cosine similarity = 0 -> distance = 1
  assert.equal(
    computeMeanPairwiseEmbeddingDistance([
      [1, 0, 0],
      [0, 1, 0],
    ]),
    1,
  );
});

test('Prepared evaluation profiles contain 14 diverse bilingual profiles clearly labelled as prepared samples', () => {
  assert.equal(PREPARED_EVAL_PROFILES.length, 14);
  const levels = new Set(PREPARED_EVAL_PROFILES.map((p) => p.level));
  assert.equal(levels.has('beginner'), true);
  assert.equal(levels.has('intermediate'), true);
  assert.equal(levels.has('advanced'), true);

  for (const prof of PREPARED_EVAL_PROFILES) {
    assert.equal(prof.isPreparedSample, true);
    assert.equal(
      prof.sampleNotice.toLowerCase().includes('prepared sample'),
      true,
    );
  }
});

test('Evaluation Lab Configurations A, B (Audit Mode) vs Config C (Fail-Closed Verification + MMR)', async () => {
  const sampleProfile = PREPARED_EVAL_PROFILES[0]!;
  const resA = await evaluateSingleProfileConfig(
    sampleProfile,
    'A_MODEL_ONLY',
    'gemini-3-flash-preview',
  );
  const resB = await evaluateSingleProfileConfig(
    sampleProfile,
    'B_MODEL_SEARCH',
    'gemini-3-flash-preview',
  );
  const resC = await evaluateSingleProfileConfig(
    sampleProfile,
    'C_FULL_VERIFIED',
    'gemini-3-flash-preview',
  );

  // Config A and B run in Audit Mode: unverified candidates are measured AND kept in displayedBooks
  assert.equal(resA.displayedUnverifiedCount > 0, true);
  assert.equal(resB.displayedUnverifiedCount > 0, true);

  // Config C enforces Fail-Closed Verification: 0% displayed unverified books while logging rejected candidates
  assert.equal(resC.displayedUnverifiedCount, 0);
  assert.equal(resC.displayedFailureRatePercent, 0);
  assert.equal(resC.failures.length > 0, true);

  // Config C achieves higher pairwise semantic diversity D(L) than clustered Config A
  assert.equal(resC.listDiversity > resA.listDiversity, true);

  // Real limitations panel returns null on empty results and exact counts on real results
  assert.equal(extractRealLimitationsFromRun('empty_run', []), null);
  const realLim = extractRealLimitationsFromRun('run_test', [resA, resB, resC]);
  assert.notEqual(realLim, null);
  assert.equal(realLim!.unverifiedCandidatesCaughtByAudit > 0, true);

  const aggregates = computeConfigAggregates(
    [resA, resB, resC],
    [
      {
        id: 'rub_1',
        runId: 'run_test',
        profileId: sampleProfile.id,
        configId: 'C_FULL_VERIFIED',
        wasBlindMode: true,
        relevance: 5,
        levelFit: 5,
        usefulness: 5,
        submittedAtIso: new Date().toISOString(),
      },
    ],
    { 'C_FULL_VERIFIED::book1': 2 },
  );
  const aggC = aggregates.find((a) => a.configId === 'C_FULL_VERIFIED')!;
  assert.equal(aggC.rubricStats.n, 1);
  assert.equal(aggC.rubricStats.meanUsefulness, 5);
  assert.equal(aggC.totalSavesInEvalSession, 2);

  const csv = exportEvalRunToCsvWithBom({
    id: 'run_test',
    status: 'completed',
    mode: 'audit_deterministic',
    modelName: 'gemini-3-flash-preview',
    startedAtIso: new Date().toISOString(),
    progress: { completedSteps: 3, totalSteps: 3 },
    profileIds: [sampleProfile.id],
    results: [resA, resB, resC],
    aggregates,
    rubricRatings: [],
    savesByBookKey: {},
    realLimitations: realLim,
  });
  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.equal(csv.includes('A_MODEL_ONLY'), true);
  assert.equal(csv.includes('C_FULL_VERIFIED'), true);
});
