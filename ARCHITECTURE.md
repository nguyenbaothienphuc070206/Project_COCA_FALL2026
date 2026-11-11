# ShelfPath System Architecture & Production Migration Plan

---

## 1. High-Level Layered Architecture

ShelfPath is structured into four strictly decoupled layers:

1. **Presentation & Interaction Layer (`/app`, `/src/components`, `/src/i18n`)**:
   - Next.js 15 App Router UI built on the warm editorial **"E-Book Dashboard"** design system (`#F7F5EE` alabaster canvas, `#EFECE3` stone verification panel, `#C8433C` terracotta accent, `Newsreader` + `Plus Jakarta Sans`).
   - Progressive **Server-Sent Events (SSE)** client (`streamRecommendations`) with cancellation (`AbortController`), client-side quick filters, session shelf persistence, and WCAG 2.2 AA keyboard/screen-reader support.
   - Code-split **Three.js** scenes (`HeroShelf3D`, `RoadmapPath3D`) and **Recharts** evaluation charts (`EvalChartsPanel`) via `next/dynamic` (`ssr: false`).
2. **Pure Domain & Verification Logic Layer (`/src/lib`)**:
   - Zero framework or I/O dependencies; 100% unit-tested via `node:test`.
   - Text normalization (`normalizeText`, `extractAuthorSurname`), fuzzy Dice bigrams + token overlap (`computeTitleSimilarity`, `verifyBookMatch`), cosine similarity and **Maximal Marginal Relevance (`rerankWithMMR`)**, natural-language refinement parser & prompt-injection sanitizer (`refinementAndDismiss.ts`), CSV/Markdown formatters (`exportFormatters.ts`), HTTPS host allowlist (`urlSecurity.ts`), and evaluation math (`evalMetrics.ts`).
3. **Server Pipeline & Orchestration Layer (`/server/pipeline`, `/app/api`)**:
   - Executes the 6-stage recommendation pipeline, streams SSE progress events, handles pool re-ranking (`/refine`), session avoid-signal penalties (`/dismiss`), Vietnamese edition lookups (`/api/books/[bookId]/editions`), and the `/eval` benchmark runner.
4. **Adapter, Cache & Rate-Limit Layer (`/server/cache`, `/server/rateLimit`, `/server/adapters`)**:
   - Pluggable interfaces (`SearchProvider`, `BookVerifier`, `EmbeddingProvider`, `EvalPersistenceAdapter`) backed by `InMemoryTTLCache` (with max-entries eviction) and `PerIpRateLimiter`.

---

## 2. The Six Pipeline Stages

```
[User Topic & Preferences]
        │
        ▼
Stage 1: Query Understanding (queryUnderstanding.ts)
        │  Normalizes profile + generates 3–5 EN/VI search queries (Zod-validated)
        ▼
Stage 2: Web Search Grounding (searchProvider.ts)
        │  Gemini + Google Search Grounding (retains grounding source URLs)
        ▼
Stage 3: Candidate Extraction (candidateExtractor.ts)
        │  Extracts {title, author, isbn?, sourceUrl, whyFound} (deduped, capped at 20)
        ▼
Stage 4: Fail-Closed Catalog Verification (bookVerifier.ts)
        │  OpenLibraryVerifier (3 req/s or 1 req/s) + GoogleBooksVerifier fallback
        │  Requires titleSimilarity >= 0.72 AND exact normalized author surname match
        ▼
Stage 5: Multilingual Embedding & MMR Re-Ranking (embeddingAndMmr.ts)
        │  gemini-embedding-2-preview vectors + Maximal Marginal Relevance
        ▼
Stage 6: Pedagogical Roadmap Sequencing (orchestrator.ts)
        │  Orders 3–5 verified books from foundational to advanced with step reasons
```

---

## 3. Mathematical Formulation of MMR Diversity Ranking

In Stage 5, given user query/profile embedding $q$, a candidate pool of verified books $V$, already selected set $S$, and user adventurousness $a \in [0, 100]$:

$$\lambda = \max\left(0.15,\; 1 - 0.85 \times \frac{a}{100}\right)$$

At each step, ShelfPath selects the next verified book $b^* \in V \setminus S$ that maximizes:

$$\text{MMR}(b) = \lambda \cdot \text{Rel}(b, q) + (1 - \lambda) \cdot \left(1 - \max_{s \in S} \cos(e_b, e_s)\right)$$

- When **Adventurousness = 0%** ($\lambda = 1.0$), ranking is purely relevance-driven.
- When **Adventurousness = 100%** ($\lambda = 0.15$), the second term strongly penalizes books whose embedding vector $e_b$ is close to already selected books $s \in S$, surfacing verified cross-disciplinary books.

---

## 4. Production Architecture Mapping Table

The current Google AI Studio prototype runs self-contained within Next.js App Router + Node.js API Routes. All core services are built behind clean TypeScript interfaces so they map 1-to-1 to the planned production stack (**Next.js Frontend + FastAPI Backend + Claude LLM Adapter + Supabase PostgreSQL/pgvector Cache**):

| Prototype Module / Endpoint | Current Prototype Implementation (AI Studio) | Planned Production Equivalent | Migration Path & Adapter Contract |
| :--- | :--- | :--- | :--- |
| **Frontend UI & 3D Shell** (`/app/page.tsx`, `/src/components/*`) | Next.js 15 App Router + Tailwind CSS v4 + Three.js (`next/dynamic`) | **Next.js 15 Frontend** (deployed on Vercel / Cloud Run) | Unchanged UI components; point `fetch('/api/*')` base URL to FastAPI gateway. |
| **`POST /api/recommendations`** (SSE & JSON) | Next.js Route Handler streaming `text/event-stream` | **FastAPI `POST /v1/recommendations`** (`StreamingResponse` SSE) | Identical SSE event schema (`stage`, `candidate_found`, `book_verified`, `book_removed`, `done`, `error`). |
| **`POST /api/recommendations/{id}/refine`** | Next.js Route Handler + `refineRecommendationSession` | **FastAPI `POST /v1/recommendations/{id}/refine`** | Pydantic equivalent of `RefinementAdjustmentSchema`; re-ranks cached verified pool in Redis/Supabase. |
| **`POST /api/recommendations/{id}/dismiss`** | Next.js Route Handler + session avoid vector penalty | **FastAPI `POST /v1/recommendations/{id}/dismiss`** | Persists session avoid embeddings in Redis/Supabase session table. |
| **`GET /api/books/{bookId}/editions`** | Next.js Route Handler querying Open Library (`vie`) + Google Books (`vi`) | **FastAPI `GET /v1/books/{book_id}/editions`** | Cached in **Supabase PostgreSQL** `book_editions_cache` table with 7-day TTL. |
| **LLM Query, Extraction & Explanations** (`/server/pipeline/queryUnderstanding.ts`, `candidateExtractor.ts`) | `@google/genai` SDK (`GoogleGenAI`) with `responseSchema` | **Claude LLM Adapter (`AnthropicClaudeAdapter`)** + Gemini fallback in FastAPI | Replace `ai.models.generateContent` call inside the service adapter with Anthropic Messages API structured tool-use while keeping identical Zod/Pydantic schemas. |
| **`SearchProvider` Interface** (`/server/pipeline/searchProvider.ts`) | `GeminiGroundingSearchProvider` | **`BraveSearchProvider` / `TavilySearchProvider` + Claude synthesis** | Implement `SearchProvider.search(queries)` in FastAPI without touching Stage 3 or Stage 4. |
| **`BookVerifier` Interface** (`/server/pipeline/bookVerifier.ts`) | `OpenLibraryVerifier` + `GoogleBooksVerifier` | **FastAPI Async `httpx` Verifier Pool + Supabase Verified Catalog Cache** | Shared distributed rate-limiter in Redis; pre-verified ISBN/Work records cached in **Supabase**. |
| **`EmbeddingProvider` Interface** (`/server/pipeline/embeddingAndMmr.ts`) | `GeminiEmbeddingProvider` (`gemini-embedding-2-preview`) | **Supabase `pgvector` + Multilingual Embedding Service** | Store book vectors in `public.verified_books` (`vector(768)`) for sub-10ms similarity + MMR. |
| **Cache & Evaluation Persistence** (`/server/cache/ttlCache.ts`, `/server/adapters/supabaseEvalStub.ts`) | `InMemoryTTLCache` + `SupabaseEvalPersistenceStub` | **Supabase PostgreSQL (`eval_runs`, `eval_rubric_ratings`, `catalog_cache`)** | Swap `InMemoryEvalPersistenceAdapter` with live `@supabase/supabase-js` client using the SQL schema documented in `supabaseEvalStub.ts`. |

---

## 5. Performance Engineering & Top 5 Performance Risks

### Code-Splitting Implemented
1. **3D WebGL Scenes (`HeroShelf3D` and `RoadmapPath3D`)**: Loaded asynchronously via `next/dynamic(..., { ssr: false })` in `app/page.tsx`, keeping `three` out of the critical SSR/initial HTML hydration path.
2. **Evaluation Lab (`/eval` & `EvalChartsPanel`)**: Route-level split at `/app/eval/page.tsx` plus `next/dynamic` for `recharts`.

### Top 5 Performance Risks Identified & Mitigation Status
1. **Risk #1 (Fixed): Heavy Three.js bundle blocking initial page hydration** — Mitigated by splitting `HeroShelf3D` and `RoadmapPath3D` with `next/dynamic({ ssr: false })` and rendering an instant initial verified roadmap state on first paint.
2. **Risk #2 (Fixed): Continuous 60fps WebGL rendering on CPU/SwiftShader in headless or low-power devices** — Mitigated by pausing `requestAnimationFrame` when off-screen (`IntersectionObserver`) or when `document.hidden` is true, capping `devicePixelRatio` at `1.5`, and honoring `prefers-reduced-motion`.
3. **Risk #3 (Fixed): Stale SSE stream race conditions when switching modes or topics rapidly** — Mitigated by guarding `executePipelineSearch` callbacks with `abortControllerRef.current === controller` checks so aborted streams never overwrite newer state.
4. **Risk #4 (Fixed): Re-running full web search & catalog verification on every natural-language refinement** — Mitigated by applying refinements (`"shorter"`, `"more practical"`) as an instant in-memory re-ranking of the already verified pool (`<5ms`), running extra search only if the verified pool is too small.
5. **Risk #5 (Documented Limitation): Cold Live Pipeline latency bound by Open Library polite rate limits (1 req/s without contact email, 3 req/s with email)** — Mitigated via progressive SSE (`book_verified` streams each card as soon as it passes verification) and `InMemoryTTLCache` (24-hour TTL for verified books).
