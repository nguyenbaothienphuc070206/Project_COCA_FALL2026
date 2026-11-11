# ShelfPath — 5-Minute Live Demo Script (`DEMO_SCRIPT.md`)

**Target Duration**: 5 minutes (300 seconds)  
**Primary URL**: `http://localhost:3000`  
**Evaluation Lab URL**: `http://localhost:3000/eval`

---

## Minute 0:00 – 0:45 | The Problem & 5-Second Editorial Impression
1. **Open `http://localhost:3000`**.
2. **Highlight the core value proposition**:
   - *"Most book recommenders start from books you already read. ShelfPath starts from a topic you want to learn from scratch and answers: **What should I read first, and what comes next?**"*
   - Point out the warm editorial **E-Book Dashboard** split layout: the primary reading roadmap on the left (`#F7F5EE`), and the interactive **3D Shelf + SSE Verification Pipeline Tracker** on the right (`#EFECE3`).
   - Show the 1-click **Tiếng Việt / English** toggle and **Light / Dark** theme toggle in the left sidebar—state is preserved seamlessly.

---

## Minute 0:45 – 2:15 | User Flow A: "Learn Machine Learning" (Beginner, Refinement, Dismiss & Vietnamese Editions)
1. **Topic & Preferences**:
   - With topic set to **Machine Learning** (*Beginner*, *MMR 30%*), point to the 4 verified books ordered from **Step 1** (*Hands-On Machine Learning* by Aurélien Géron) to **Step 4** (*Designing Machine Learning Systems* by Chip Huyen).
2. **Inspect Fail-Closed Verification & Vietnamese Edition Info**:
   - Click **Inspect Verification (`Hồ sơ kiểm chứng`)** on *Designing Machine Learning Systems* or *Machine Learning Yearning*.
   - Point out the **100% Title Similarity Score**, matched author surname, ISBN-13, direct links to **Open Library** and **Google Books**, and the **Vietnamese Edition Found** badge with its catalog record link (contrasted with *"No Vietnamese edition found in our sources"* when none is found—never claiming an edition does not exist).
   - Expand the **Rejected Candidates Log** in the right panel to show how fabricated or mismatched books (`NO_CANDIDATES`, `AUTHOR_MISMATCH`) were caught and dropped.
3. **Natural-Language Refinement (`POST /api/recommendations/{id}/refine`)**:
   - Click the **`+ Shorter` (`+ Ngắn gọn hơn`)** pill or type `"shorter and more practical"` into the Refinement Bar.
   - Show the removable chip **`Shorter (<320 pages)`** and point out how **Andrew Ng's *Machine Learning Yearning* (118 pages)** and **Andriy Burkov's *The Hundred-Page Machine Learning Book* (160 pages)** immediately move to **Step 1 (`↑ Moved up #3 → #1`)** and **Step 2**.
4. **Dismiss & 8-Second Undo (`POST /api/recommendations/{id}/dismiss`)**:
   - Click **Not interested (`Không quan tâm`)** on one card.
   - Point to the dark banner at the top showing the **8-second countdown**, the newly promoted verified replacement book (`✦ New replacement`), and the session avoid penalty. Click **Undo (`Hoàn tác`)** to restore the book immediately.

---

## Minute 2:15 – 3:30 | User Flow B: "Explore Philosophy with High Adventurousness" & The 3D Path
1. **High Adventurousness MMR Search**:
   - Click the starter chip **Philosophy & Critical Thinking (`Triết học & Tư duy phản biện`)**.
   - Open the preference controls, slide **Adventurousness (MMR)** up to **85%**, and click **Start Reading Path**.
   - Explain how the **MMR formula** ($\lambda \cdot \text{Rel} + (1 - \lambda) \cdot \text{Novelty}$) balances foundational philosophy (*Think* by Simon Blackburn, *Justice* by Michael Sandel) with cross-disciplinary cognitive epistemology (*Thinking, Fast and Slow* by Daniel Kahneman).
2. **Walk Through "The Path" (3D Stage & 2D List)**:
   - Click **My Roadmap (The Path)** in the left sidebar.
   - Interact with the full-width **3D Stepping-Stone Path**—hover and click Step 1 $\rightarrow$ Step 4 nodes, then toggle **2D List View** (`Sơ đồ 2D`) to show identical pedagogical information for accessibility and mobile users.

---

## Minute 3:30 – 4:15 | My Shelf & Metadata-Only Export
1. **Save & Organize in My Shelf**:
   - Save 2–3 books and switch to the **My Shelf (`Kệ sách của tôi`)** tab.
   - Reorder books with **`↑` / `↓`** and change a step status from **To Read (`Sắp đọc`)** to **Reading (`Đang đọc`)** and **Done (`Đã xong`)**.
2. **Export Metadata & Links Only**:
   - Click **Export Markdown (`.md`)**, **Export CSV (`.csv` with UTF-8 BOM)**, and **Print / Save PDF (`window.print()`)**, noting that exports contain only verified bibliographic metadata, step reasons, and catalog URLs—never copyrighted book content.

---

## Minute 4:15 – 5:00 | Evaluation Lab (`/eval`) & Fail-Closed Resilience
1. **Open `http://localhost:3000/eval`**:
   - Click **Quick Run (5 Profiles)** to run **Config A (AI Only — Audit Mode)**, **Config B (AI + Search — Audit Mode)**, and **Config C (ShelfPath Full Verified + MMR)** on the same prepared sample profiles.
   - Point to the **Recharts** comparison charts: Config C achieves **0% Displayed Unverified Books** and higher **Pairwise Embedding Diversity $D(L)$**.
   - Toggle **Blind Mode** in the Tester Rubric section to show how human evaluators score Relevance, Level Fit, and Usefulness without knowing which column is Config A, B, or C.
   - Point to the **Known Limitations Panel**, populated 100% from real run counts.
