# ShelfPath — Verified Self-Learning Book Roadmaps

**ShelfPath** (*Lộ Trình Đọc Sách Đã Kiểm Chứng*) helps university students and independent learners teach themselves a new field from scratch. Instead of starting from books you have already read, ShelfPath starts from a **topic** and answers: **"What should I read first, and what comes next?"**

Every book shown in ShelfPath is verified against **Open Library** and **Google Books** under a strict **Fail-Closed Trust Policy**: if a candidate book fails title similarity or author surname verification—or if catalog sources are unreachable—it is never shown to the user.

---

## 1. Environment Variables & Secrets Setup

Copy `.env.example` to `.env.local` (or configure secrets via the **Secrets** panel in Google AI Studio):

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yes (for Live mode) | — | Server-side only API key for `@google/genai` (Query understanding, Google Search grounding, extraction, embeddings, roadmap explanations). Never exposed to client bundles. |
| `GEMINI_MODEL` | No | `gemini-3-flash-preview` | Gemini model used for structured extraction, grounding, and roadmap synthesis. |
| `GEMINI_EMBEDDING_MODEL` | No | `gemini-embedding-2-preview` | Multilingual embedding model used for semantic similarity and MMR diversity ranking. |
| `OPENLIBRARY_CONTACT_EMAIL` | Recommended | `""` | Sent in `User-Agent: ShelfPath (<email>)` to Open Library `/search.json`. Unlocks the polite **3 req/s** tier; falls back to **1 req/s** with a logged warning when omitted. |
| `GOOGLE_BOOKS_API_KEY` | Optional | `""` | Used for secondary verification and metadata enrichment on Google Books `/books/v1/volumes`. |
| `MOCK_MODE` | No | `"false"` | Set to `"true"` to force deterministic verified catalog records without external API calls. Users can also toggle Sample Data vs. Live Verified mode in the top bar. |
| `EVAL_ENABLED` | No | `"true"` | Guards the internal `/eval` Evaluation Lab route and `/api/eval/*` endpoints. Set to `"false"` to disable in public deployments. |
| `RATE_LIMIT_PER_MINUTE` | No | `"10"` | Maximum `/api/recommendations` requests per IP per minute before returning HTTP `429` with `Retry-After`. |

---

## 2. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Next.js development server on port 3000
npm run dev
```

Open `http://localhost:3000` for the main application, or `http://localhost:3000/eval` for the internal Evaluation Lab (when `EVAL_ENABLED="true"`).

---

## 3. Running Unit Tests & Static Checks

All pure verification math, MMR ranking, natural-language refinement sanitization, dismiss avoid-signal penalties, export formatters, URL allowlist sanitization, and Evaluation Lab metrics are covered by deterministic `node:test` suites:

```bash
# Run all unit test suites (Phase 2, Phase 4, Phase 5)
npx --yes tsx --test src/lib/verification.test.ts src/lib/phase4.test.ts src/lib/phase5.test.ts

# Run ESLint & TypeScript build verification
npm run lint
npm run build
```

---

## 4. Building & Deploying

ShelfPath is configured with `output: 'standalone'` in `next.config.ts` and standard security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).

```bash
# Build production bundle
npm run build

# Start production server on port 3000
npm run start
```

---

## 5. Documentation Index

- [`USER_GUIDE.md`](./USER_GUIDE.md) — Bilingual (English & Vietnamese) guide for learners.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System layers, 6 pipeline stages, MMR formula, performance analysis, and production mapping table (Next.js + FastAPI + Claude adapter + Supabase).
- [`EVALUATION.md`](./EVALUATION.md) — Evaluation Lab methodology (`/eval`), 14 prepared profiles, Config A/B/C audit comparison, pairwise embedding diversity formula, and rubric definitions.
- [`ROADMAP.md`](./ROADMAP.md) — Out-of-scope v2 and v3 ideas.
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — 5-minute live walkthrough script covering User Flow A (Machine Learning) and User Flow B (Philosophy with high adventurousness).
- [`docs/DESIGN_SPEC.md`](./docs/DESIGN_SPEC.md) — Visual specification derived from the E-Book Dashboard reference.
