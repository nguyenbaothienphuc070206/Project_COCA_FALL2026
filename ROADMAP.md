# ShelfPath Product Roadmap (`v2` & `v3` — Out of Current MVP Scope)

> **Scope Notice**: All items listed in this document are **explicitly out of scope** for the current ShelfPath v1.0 release. The current v1.0 release intentionally excludes user accounts, social features, commercial bookstore pricing, and copyrighted book content to focus 100% on verified, explainable self-learning roadmaps.

---

## Version 2.0 (`v2` — Planned Production Architecture Migration)
*Status: Out of Current Scope (Architecture & Adapters Prepared in v1.0)*

1. **FastAPI + Supabase PostgreSQL (`pgvector`) Backend Migration**:
   - Migrate the Next.js in-memory TTL cache and session store to **FastAPI** + **Supabase PostgreSQL** using the adapter contracts documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`/server/adapters/supabaseEvalStub.ts`](./server/adapters/supabaseEvalStub.ts).
   - Persist pre-verified Open Library Work/Edition records and 768-dimensional multilingual embeddings in `pgvector` for sub-10ms candidate lookup.
2. **Additional Search Providers (`BraveSearchProvider` & `TavilySearchProvider`)**:
   - Plug Brave Search API and Tavily Search API into the existing `SearchProvider` interface (`/server/pipeline/searchProvider.ts`) alongside Gemini Google Search Grounding.
3. **Additional Catalog Verifiers (`WorldCat` / University Library OPAC)**:
   - Extend the `BookVerifier` interface (`/server/pipeline/bookVerifier.ts`) with university library catalog lookups so students can check whether a verified book is physically available in their campus library.
4. **Pre-Verified Curated Topic Pages ("Best Books for X" — Explicitly Deferred from v1 SEO)**:
   - Programmatic `"best books for X"` landing pages are intentionally excluded from v1.0 because generating uncurated topic pages on the fly would risk thin content and unreviewed bibliographic sets. In `v2`, once the PostgreSQL + `pgvector` catalog store is populated with human-audited, dual-catalog-verified reading roadmaps for core university subjects, static pre-verified subject guides can be published with periodic catalog re-verification.

---

## Version 3.0 (`v3` — Future Exploration)
*Status: Out of Current Scope*

1. **Prerequisite Concept Graph Visualization**:
   - Map chapter-level prerequisite concepts (e.g., *Linear Algebra* $\rightarrow$ *Convex Optimization* $\rightarrow$ *Deep Learning*) onto the 3D Path nodes using public table-of-contents metadata from Open Library.
2. **Opt-In Local File Sync (Bring Your Own Markdown Vault)**:
   - Allow learners to sync their exported `.md` roadmap directly with a local Obsidian or Logseq folder via the browser File System Access API—still requiring zero cloud accounts or tracking.
3. **Syllabus-to-Roadmap Alignment**:
   - Allow university students to paste a public university course syllabus topic list and verify every cited textbook against Open Library and Google Books.

