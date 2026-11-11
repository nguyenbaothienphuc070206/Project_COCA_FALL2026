# ShelfPath Evaluation Lab Methodology (`EVALUATION.md`)

---

## 1. Purpose of the Evaluation Lab (`/eval`)

The ShelfPath Evaluation Lab (`/eval`, guarded by `EVAL_ENABLED`) provides an empirical benchmark to test two core hypotheses of the project proposal:
1. **Verification & Trust**: Does combining web search grounding with strict fail-closed catalog verification (`Open Library` + `Google Books`) eliminate hallucinated or misattributed books compared to an LLM alone (`Config A`) or an LLM with web search (`Config B`)?
2. **Diversity & Pedagogical Utility**: Does multilingual embedding re-ranking with **Maximal Marginal Relevance (MMR)** increase semantic list diversity and human-rated roadmap usefulness without sacrificing topic relevance?

---

## 2. Prepared Sample Interest Profiles (`/server/eval/profiles.json`)

The benchmark uses **14 prepared sample interest profiles** (`prof-01` through `prof-14`). Every profile is explicitly marked `"isPreparedSample": true` and `"sampleNotice": "Prepared sample profile — not real user data"`:

- **Languages**: Bilingual mix of **Vietnamese** (`vi`), **English** (`en`), and **Any** (`any`).
- **Levels**: All three learner stages (`beginner`, `intermediate`, `advanced`).
- **Length Preferences**: `short` (<250 pages), `medium` (250–450 pages), `long` (>450 pages), and `any`.
- **Domains**: Machine Learning & AI, Moral Philosophy & Epistemology, Student Personal Finance & Index Investing, Distributed Systems & Software Architecture, Cognitive Psychology & Behavioral Economics.
- **Adventurousness (MMR)**: Low (`10%–25%` focused core curriculum) and High (`75%–90%` cross-disciplinary exploration).

---

## 3. Three Evaluated Configurations & Audit Mode

All three configurations are executed on the exact same profiles:

| Configuration ID | Description | Verifier Mode |
| :--- | :--- | :--- |
| **`A_MODEL_ONLY`** | AI model only (no web search grounding, no verification filter, no MMR re-ranking). | **AUDIT MODE ONLY**: `verifyBookMatch` is executed behind the scenes to *measure* title similarity and author surname accuracy, but unverified books are **not** filtered out so the failure rate is directly observable. |
| **`B_MODEL_SEARCH`** | AI model + web search grounding (no verification filter). | **AUDIT MODE ONLY**: `verifyBookMatch` measures verification pass/fail and records failure reason codes (`NO_CANDIDATES`, `TITLE_SIMILARITY_LOW`, `AUTHOR_MISMATCH`, `SOURCE_OUTAGE`) without filtering. |
| **`C_FULL_VERIFIED`** | **ShelfPath Full Pipeline**: AI + Search + Fail-Closed Catalog Verification + Multilingual Embeddings MMR + Roadmap Sequencing. | **FAIL-CLOSED FILTER MODE**: Candidates failing `verifyBookMatch` are removed and logged in `failures`; only verified books reach the displayed roadmap (`0%` displayed unverified rate). |

---

## 4. Metric Definitions

### 4.1 Verification Failure Rates
- **Raw Audit Failure Rate (%)**:
  $$\text{AuditFailureRate} = \frac{\text{Candidates Failing } \texttt{verifyBookMatch}}{\text{Total Candidates Produced}} \times 100\%$$
- **Displayed Unverified Rate (%)**:
  $$\text{DisplayedFailureRate} = \frac{\text{Displayed Books Failing } \texttt{verifyBookMatch}}{\text{Displayed Books Count}} \times 100\%$$

### 4.2 Mean Pairwise Embedding Distance (List Diversity $D(L)$)
Given a displayed book list $L = \{b_1, b_2, \dots, b_k\}$ with normalized embedding vectors $\{e_1, e_2, \dots, e_k\}$ (for $k \ge 2$), **List Diversity** $D(L) \in [0, 1]$ is defined as the **mean pairwise cosine distance** within the list:

$$D(L) = \frac{2}{k(k - 1)} \sum_{1 \le i < j \le k} \left(1 - \cos(e_i, e_j)\right)$$

where $\cos(e_i, e_j) = \frac{e_i \cdot e_j}{\|e_i\| \|e_j\|}$. Higher $D(L)$ indicates lower semantic redundancy across the recommended books.

### 4.3 Latency Breakdown (ms)
- **`timeToFirstBookMs`**: Elapsed wall-clock time (`performance.now()`) until the first book is ready.
- **`fullRoadmapMs`**: Elapsed wall-clock time until all books in the roadmap are ranked and ordered.
- **`refinementResponseMs`**: Elapsed time to execute a natural-language pool refinement (`"shorter and more practical"`).

---

## 5. Human Tester Rubric (1–5 Scale) & Blind Mode

Human evaluators score each configuration's output for a profile along three 1–5 dimensions:
1. **Relevance (1–5)**:
   - `1` = Off-topic or fabricated book; `3` = Broadly related to the field; `5` = Directly targets the exact learning topic and subfields.
2. **Level Fit (1–5)**:
   - `1` = Inappropriate difficulty or page length for the learner's stated level; `3` = Acceptable match; `5` = Ideal pedagogical difficulty and length fit.
3. **Roadmap Usefulness (1–5)**:
   - `1` = Unusable as a study plan; `3` = Helpful reading list; `5` = Clear step-by-step progression with verified catalog links and convincing step reasons.

- **Blind Mode**: Toggling **Blind Mode** hides `Config A / B / C` labels (replacing them with `Blind Option #1 / #2 / #3`), hides verification debug badges, and deterministically shuffles column order per profile so evaluators score without confirmation bias.
- **Session Book Saves**: Clicking **Save** on a book card inside `/eval` increments a session-only counter (`savesByBookKey`) for that configuration. No personal data is collected, and no analytics exist in the normal learner app.
- **Descriptive Statistics Only**: Charts report means and sample counts ($n$). No $p$-values or statistical significance claims are made.

---

## 6. How to Run, Export, and Import

1. Open `http://localhost:3000/eval` (requires `EVAL_ENABLED="true"`).
2. Click **Run All 14 Profiles (A, B, C)** or **Quick Run (5 Profiles)** (`POST /api/eval/runs`).
3. Inspect the Aggregate Table, the 4 Recharts charts, and the **Known Limitations Panel** (which is populated strictly from real run measurements and remains empty prior to running).
4. Score profiles using the **Tester Rubric Form** (with **Blind Mode** enabled) and click **Export JSON** or **Export CSV** to persist results, or **Import Run JSON** to restore a previous session after a server restart.
