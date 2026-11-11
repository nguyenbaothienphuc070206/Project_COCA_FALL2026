/**
 * Tính năng: Bộ kiểm thử đơn vị (Unit Tests) cho logic chuẩn hóa nhan đề, đối sánh tác giả ("Last, First"), xếp hạng MMR, bộ nhớ đệm TTL (InMemoryTTLCache) và bộ giới hạn tần suất (PerIpRateLimiter).
 * Trường hợp sử dụng: Chạy qua `npx --yes tsx --test src/lib/verification.test.ts` để đảm bảo chất lượng thuật toán cốt lõi của Phase 1 & Phase 2.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  extractAuthorSurname,
  computeTitleSimilarity,
  verifyBookMatch,
  rerankWithMMR,
} from './verification';
import { InMemoryTTLCache } from '../../server/cache/ttlCache';
import { PerIpRateLimiter } from '../../server/rateLimit/rateLimiter';

test('normalizeText strips subtitles, parentheticals, punctuation, and Vietnamese diacritics', () => {
  assert.equal(
    normalizeText('Tư Duy Nhanh Và Chậm: Daniel Kahneman'),
    'tu duy nhanh va cham',
  );
  assert.equal(
    normalizeText('Designing Data-Intensive Applications: The Big Ideas Behind Reliable Systems'),
    'designing data intensive applications',
  );
  assert.equal(
    normalizeText('Deep Learning (Adaptive Computation and Machine Learning series)'),
    'deep learning',
  );
});

test('extractAuthorSurname supports both "First Last" and "Last, First" formats with diacritics', () => {
  assert.equal(extractAuthorSurname('Martin Kleppmann'), 'kleppmann');
  assert.equal(extractAuthorSurname('Kleppmann, Martin'), 'kleppmann');
  assert.equal(extractAuthorSurname('Géron, Aurélien'), 'geron');
  assert.equal(extractAuthorSurname('Nguyễn Nhật Ánh'), 'anh');
  assert.equal(extractAuthorSurname('Nguyễn, Nhật Ánh'), 'nguyen');
});

test('verifyBookMatch enforces title similarity, "Last, First" surname matching, and failure reason codes', () => {
  const validMatch = verifyBookMatch(
    'Designing Data-Intensive Applications: The Big Ideas',
    'Kleppmann, Martin',
    'Designing Data-Intensive Applications',
    ['Martin Kleppmann'],
  );
  assert.equal(validMatch.matched, true);
  assert.equal(validMatch.similarity, 1);
  assert.equal(validMatch.matchedSurname, 'kleppmann');

  const wrongAuthor = verifyBookMatch(
    'Designing Data-Intensive Applications',
    'Andrew Ng',
    'Designing Data-Intensive Applications',
    ['Martin Kleppmann'],
  );
  assert.equal(wrongAuthor.matched, false);
  assert.equal(wrongAuthor.failureReason, 'author_mismatch');

  const lowSimilarity = verifyBookMatch(
    'Quantum Mechanics and Path Integrals',
    'Richard Feynman',
    'Surely You Are Joking Mr Feynman',
    ['Richard P. Feynman'],
  );
  assert.equal(lowSimilarity.matched, false);
  assert.equal(lowSimilarity.failureReason, 'low_title_similarity');
  assert.equal(computeTitleSimilarity('Deep Learning', 'Deep Learning: A Practitioner Approach'), 1);
});

test('rerankWithMMR shifts top results from high relevance to high diversity as adventurousness increases', () => {
  const candidates = [
    { id: 'canonical', relevanceScore: 0.96, diversityBonus: 0.2, levelOrder: 1 },
    { id: 'surprising', relevanceScore: 0.78, diversityBonus: 0.98, levelOrder: 2 },
  ];

  const focusedOrder = rerankWithMMR(candidates, 10);
  assert.equal(focusedOrder[0].id, 'canonical');

  const exploratoryOrder = rerankWithMMR(candidates, 95);
  assert.equal(exploratoryOrder[0].id, 'surprising');
});

test('InMemoryTTLCache enforces TTL expiration and max-entries size cap eviction', async () => {
  const cache = new InMemoryTTLCache<string>(40, 2);
  cache.set('book-1', 'val-1');
  cache.set('book-2', 'val-2');
  assert.equal(cache.get('book-1'), 'val-1');

  // Thêm phần tử thứ 3 khi maxEntries = 2 sẽ đẩy 'book-2' (ít được truy cập gần nhất vì 'book-1' vừa được get)
  cache.set('book-3', 'val-3');
  assert.equal(cache.get('book-2'), undefined);
  assert.equal(cache.get('book-1'), 'val-1');
  assert.equal(cache.get('book-3'), 'val-3');

  // Chờ hết hạn TTL (40ms)
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(cache.get('book-1'), undefined);
  assert.equal(cache.size(), 0);
});

test('PerIpRateLimiter allows up to maxRequests within window and returns retryAfterMs when exceeded', () => {
  const limiter = new PerIpRateLimiter(3, 60_000);
  const t0 = 1_000_000;

  assert.equal(limiter.check('192.168.1.10', t0).allowed, true);
  assert.equal(limiter.check('192.168.1.10', t0 + 100).allowed, true);
  assert.equal(limiter.check('192.168.1.10', t0 + 200).allowed, true);

  const blocked = limiter.check('192.168.1.10', t0 + 300);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterMs, 59_700);

  // IP khác không bị ảnh hưởng
  assert.equal(limiter.check('192.168.1.99', t0 + 300).allowed, true);

  // Sau khi cửa sổ 60s trôi qua, IP đầu tiên được phép trở lại
  assert.equal(limiter.check('192.168.1.10', t0 + 60_001).allowed, true);
});
