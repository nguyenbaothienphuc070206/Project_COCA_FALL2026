# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shelfpath.spec.ts >> ShelfPath E2E Suite (External Sources Mocked) >> 7. Source outage: displays Fail-Closed 503 alert and never shows unverified books
- Location: e2e/shelfpath.spec.ts:130:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert')
Expected: visible
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <section role="alert" class="rounded-[22px] border border-[#BE123C]/40 bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4">…</section> aka getByText('Results withheld: Verification sources unreachable (Fail-Closed)Both Open')
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toBeVisible" getByRole('alert') with timeout 15000ms
  - waiting for getByRole('alert')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - link "Skip to main content" [ref=e3] [cursor=pointer]:
      - /url: "#main-workspace-content"
    - generic [ref=e4]:
      - complementary "Primary Sidebar Navigation" [ref=e5]:
        - generic [ref=e6]:
          - button "SP ShelfPath Verified Self-Learning Book Roadmaps" [ref=e7]:
            - generic [ref=e8]: SP
            - generic [ref=e9]:
              - generic [ref=e10]: ShelfPath
              - generic [ref=e11]: Verified Self-Learning Book Roadmaps
          - navigation "Main Menu" [ref=e12]:
            - button "Discover" [ref=e13]
            - button "My Roadmap" [ref=e19]
            - button "My Shelf 0" [ref=e26]:
              - generic [ref=e30]: My Shelf
              - generic [ref=e31]: "0"
            - button "Architecture" [ref=e32]
        - generic [ref=e39]:
          - button "Chuyển sang Tiếng Việt (VI)" [ref=e40]:
            - generic [ref=e45]: English · VI
          - button "Dark Mode" [ref=e46]:
            - generic [ref=e50]: Light Mode
      - generic [ref=e51]:
        - banner [ref=e52]:
          - generic [ref=e54]:
            - generic [ref=e55]: Topic or field you want to learn
            - textbox "Topic or field you want to learn" [ref=e56]:
              - /placeholder: Search topic, field, or skill (e.g., Machine Learning, Stoic Philosophy)...
              - text: Machine Learning
          - generic [ref=e57]:
            - button "Sample data" [ref=e58]
            - button "Sample Data" [ref=e66]
        - main [ref=e71]:
          - generic [ref=e72]: 4 verified books displayed for Machine Learning
          - generic [ref=e73]:
            - generic [ref=e74]:
              - region "Quick 3-Step Guide (Skippable)" [ref=e75]:
                - generic [ref=e76]:
                  - generic [ref=e77]: Quick 3-Step Guide (Skippable)
                  - generic [ref=e79]:
                    - tablist "Quick 3-Step Guide (Skippable)" [ref=e80]:
                      - tab "1/3" [selected] [ref=e81] [cursor=pointer]
                      - tab "2/3" [ref=e82] [cursor=pointer]
                      - tab "3/3" [ref=e83] [cursor=pointer]
                    - button "Skip guide" [ref=e84] [cursor=pointer]
                - generic [ref=e89]:
                  - generic [ref=e90]:
                    - heading "01. Pick a topic, starting level, and preferred book length" [level=2] [ref=e96]
                    - paragraph [ref=e97]: Instead of asking which books you already read, ShelfPath starts from the subject you want to learn (in English or Vietnamese). Set your current level (Beginner, Intermediate, Advanced) and preferred page length.
                  - generic [ref=e98]:
                    - generic [ref=e99]: Key takeaway
                    - paragraph [ref=e104]: "Tip: The \"Adventurousness\" slider lets you balance canonical textbooks with cross-disciplinary perspectives."
                - generic [ref=e105]:
                  - generic [ref=e106]:
                    - generic [ref=e107]: "Or try an example topic right away:"
                    - button "Machine Learning" [ref=e108] [cursor=pointer]
                    - button "Philosophy" [ref=e113] [cursor=pointer]
                    - button "Personal Finance" [ref=e118] [cursor=pointer]
                  - button "Next step" [ref=e124] [cursor=pointer]
              - generic [ref=e128]:
                - paragraph [ref=e129]: START YOUR PATH · 100% CATALOG-VERIFIED BOOKS
                - heading "What should I read first, and what comes next?" [level=1] [ref=e130]
                - paragraph [ref=e131]: Designed for university students teaching themselves a new field from scratch. Every book is verified against Open Library & Google Books, ranked with MMR, and ordered into a clear sequence.
                - generic [ref=e133]:
                  - generic [ref=e134]:
                    - button "Start reading path" [ref=e135] [cursor=pointer]
                    - button "Try with sample data" [ref=e140] [cursor=pointer]
                  - generic [ref=e145]:
                    - generic [ref=e146]: Topic or field you want to learn
                    - textbox "Topic or field you want to learn" [ref=e147]:
                      - /placeholder: Search topic, field, or skill (e.g., Machine Learning, Stoic Philosophy)...
                      - text: Machine Learning
                  - generic [ref=e148]:
                    - generic [ref=e149]: "Starter topics for self-learners:"
                    - generic [ref=e150]:
                      - button "Machine Learning" [ref=e151] [cursor=pointer]
                      - button "Philosophy" [ref=e152] [cursor=pointer]
                      - button "Personal Finance" [ref=e153] [cursor=pointer]
                      - button "Software Architecture" [ref=e154] [cursor=pointer]
                      - button "Cognitive Psychology" [ref=e155] [cursor=pointer]
                  - generic [ref=e157]:
                    - button "Customize level, book length & adventurousness slider" [ref=e158] [cursor=pointer]
                    - generic [ref=e163]:
                      - generic [ref=e164]: Beginner (From scratch)
                      - generic [ref=e165]: Any length
                      - generic [ref=e166]: MMR 30%
              - status [ref=e167]:
                - generic [ref=e172]:
                  - strong [ref=e173]: "Sample data:"
                  - text: Showing pre-verified Sample data (MOCK_MODE) — every book links to a real Open Library & Google Books record.
              - generic [ref=e174]:
                - generic [ref=e175]:
                  - generic [ref=e176]:
                    - generic [ref=e177]: Refine results in plain language
                    - generic [ref=e182]: User text is treated strictly as ranking data and can never bypass catalog verification.
                  - generic [ref=e183]:
                    - textbox "Refine results in plain language" [ref=e184]:
                      - /placeholder: Type how to adjust (e.g., "shorter", "more practical", "more accessible")...
                    - button "Apply refinement" [disabled] [ref=e185] [cursor=pointer]
                  - generic [ref=e190]:
                    - button "+ Shorter" [ref=e191] [cursor=pointer]
                    - button "+ More practical" [ref=e192] [cursor=pointer]
                    - button "+ More theoretical" [ref=e193] [cursor=pointer]
                    - button "+ More accessible" [ref=e194] [cursor=pointer]
                - generic [ref=e196]:
                  - generic [ref=e197]: "Quick client filters on current results:"
                  - combobox "Preferred book length" [ref=e201] [cursor=pointer]:
                    - option "All lengths" [selected]
                    - option "Short (<250 pages)"
                    - option "Medium (250–450 pages)"
                    - option "Deep (>450 pages)"
                  - combobox "Starting level" [ref=e202] [cursor=pointer]:
                    - option "All levels" [selected]
                    - option "Beginner"
                    - option "Intermediate"
                    - option "Advanced"
                  - combobox "Book edition language" [ref=e203] [cursor=pointer]:
                    - option "All editions" [selected]
                    - option "Vietnamese edition found"
                    - option "English original"
              - alert [ref=e204]:
                - 'heading "Results withheld: Verification sources unreachable (Fail-Closed)" [level=2] [ref=e207]'
                - paragraph [ref=e208]: Both Open Library and Google Books verification catalogs are unreachable. Per our Fail-Closed trust rule, unverified results are withheld.
                - button "Retry with verified sample data" [ref=e209] [cursor=pointer]
            - complementary "Verification Stage & Reading Progress" [ref=e214]:
              - status "Loading 3D Verification Shelf" [ref=e215]:
                - generic [ref=e219]: Đang khởi tạo Kệ sách Kiểm chứng 3D / Loading 3D Shelf...
              - region "Transparent Verification & Ranking Pipeline (SSE)" [ref=e221]:
                - generic [ref=e222]:
                  - generic [ref=e228]:
                    - heading "Transparent Verification & Ranking Pipeline (SSE)" [level=2] [ref=e229]
                    - paragraph [ref=e230]: 04 / 06 · 6 found · 4 verified · 2 removed
                  - button "Restore Catalog Connection" [active] [ref=e232] [cursor=pointer]
                - list [ref=e241]:
                  - listitem [ref=e242]:
                    - generic [ref=e246]: Searching web
                  - listitem [ref=e247]:
                    - generic [ref=e251]: Extracting schema
                  - listitem [ref=e252]:
                    - generic [ref=e256]: Verifying catalogs
                  - listitem [ref=e257]:
                    - generic [ref=e261]: Ranking (MMR)
                  - listitem [ref=e262]:
                    - generic [ref=e266]: Building path
                - button "Removed unverified candidates log (2)" [ref=e268] [cursor=pointer]
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - heading "Session Roadmap Progress" [level=2] [ref=e274]
                  - generic [ref=e275]:
                    - strong [ref=e276]: "04"
                    - text: Verified on shelf
                - list [ref=e277]:
                  - listitem [ref=e278]:
                    - generic [ref=e280]: Step 01
                    - button "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow" [ref=e282] [cursor=pointer]
                    - paragraph [ref=e283]: Read this first to build concrete intuition with Scikit-Learn pipelines before diving into deep neural architectures.
                  - listitem [ref=e284]:
                    - generic [ref=e286]: Step 02
                    - button "The Hundred-Page Machine Learning Book" [ref=e288] [cursor=pointer]
                    - paragraph [ref=e289]: Consolidates the core mathematical notation and taxonomy in 160 focused pages before tackling theory-heavy texts.
                  - listitem [ref=e290]:
                    - generic [ref=e292]: Step 03
                    - button "Machine Learning Yearning" [ref=e294] [cursor=pointer]
                    - paragraph [ref=e295]: In just 118 practical pages, Andrew Ng teaches how to structure ML projects, debug error metrics, and make fast engineering decisions.
                  - listitem [ref=e296]:
                    - generic [ref=e298]: Step 04
                    - button "Designing Machine Learning Systems" [ref=e300] [cursor=pointer]
                    - paragraph [ref=e301]: "Bridges classroom modeling with real-world engineering: data pipelines, distribution shift, and deployment."
          - generic "Site footer" [ref=e302]:
            - generic [ref=e303]:
              - generic [ref=e304]:
                - generic [ref=e305]:
                  - generic [ref=e306]: SP
                  - generic [ref=e307]: ShelfPath
                - paragraph [ref=e308]: ShelfPath — Calm, honest, verified reading roadmaps for students.
                - generic [ref=e309]:
                  - generic [ref=e313]: "Contact (Email):"
                  - 'link "[FILL IN: contact@yourdomain.edu]" [ref=e314] [cursor=pointer]':
                    - /url: mailto:contact@example.com?subject=ShelfPath%20Inquiry
                - generic [ref=e315]:
                  - group "Path language:" [ref=e316]:
                    - button "Tiếng Việt (/vi)" [ref=e320] [cursor=pointer]
                    - button "English (/en)" [pressed] [ref=e321] [cursor=pointer]
                  - button "Open 3-step guide" [ref=e322] [cursor=pointer]
              - navigation "Product & Roadmaps" [ref=e327]:
                - heading "Product & Roadmaps" [level=2] [ref=e328]
                - list [ref=e329]:
                  - listitem [ref=e330]:
                    - link "Home" [ref=e331] [cursor=pointer]:
                      - /url: /en
                  - listitem [ref=e332]:
                    - link "How it works" [ref=e333] [cursor=pointer]:
                      - /url: /en/how-it-works
                  - listitem [ref=e334]:
                    - link "About" [ref=e335] [cursor=pointer]:
                      - /url: /en/about
              - navigation "Methodology & Trust" [ref=e336]:
                - heading "Methodology & Trust" [level=2] [ref=e337]
                - list [ref=e338]:
                  - listitem [ref=e339]:
                    - link "Methodology & Data Sources" [ref=e340] [cursor=pointer]:
                      - /url: /en/methodology
                  - listitem [ref=e341]:
                    - link "FAQ" [ref=e342] [cursor=pointer]:
                      - /url: /en/faq
              - navigation "Legal & Accessibility" [ref=e343]:
                - heading "Legal & Accessibility" [level=2] [ref=e344]
                - list [ref=e345]:
                  - listitem [ref=e346]:
                    - link "Privacy" [ref=e347] [cursor=pointer]:
                      - /url: /en/privacy
                  - listitem [ref=e348]:
                    - link "Terms & Disclaimer" [ref=e349] [cursor=pointer]:
                      - /url: /en/terms
                  - listitem [ref=e350]:
                    - link "Accessibility" [ref=e351] [cursor=pointer]:
                      - /url: /en/accessibility
            - generic [ref=e352]:
              - generic [ref=e353]: Bibliographic metadata is verified against Open Library and Google Books. ShelfPath is an independent project and implies no endorsement or partnership with Open Library, Internet Archive, or Google.
              - generic [ref=e357]: No accounts · No tracking · 100% catalog-verified books only.
  - button "Open Next.js Dev Tools" [ref=e363] [cursor=pointer]
  - alert [ref=e367]
```

# Test source

```ts
  42  |     // Click "+ Shorter" preset refinement button
  43  |     const shorterPresetBtn = page.getByRole('button', { name: '+ Shorter' });
  44  |     await expect(shorterPresetBtn).toBeVisible();
  45  |     await shorterPresetBtn.click();
  46  | 
  47  |     // Verify interpreted adjustment region and removable chip appear
  48  |     const understoodRegion = page.getByRole('region', {
  49  |       name: /Interpreted adjustments/i,
  50  |     });
  51  |     await expect(understoodRegion).toBeVisible();
  52  |     await expect(understoodRegion.getByText(/Shorter/i).first()).toBeVisible();
  53  |   });
  54  | 
  55  |   test('3. Dismiss with 8-second undo: removes book, shows undo banner, and restores on Undo', async ({
  56  |     page,
  57  |   }) => {
  58  |     await page.goto('/en');
  59  | 
  60  |     const bookTitle =
  61  |       'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow';
  62  |     const dismissBtn = page.getByRole('button', {
  63  |       name: `Not interested: ${bookTitle}`,
  64  |     });
  65  |     await expect(dismissBtn).toBeVisible();
  66  |     await dismissBtn.click();
  67  | 
  68  |     // Verify 8-second undo banner appears
  69  |     const undoBtn = page.getByRole('button', { name: /Undo \(/i });
  70  |     await expect(undoBtn).toBeVisible();
  71  | 
  72  |     // Click Undo and verify book is restored
  73  |     await undoBtn.click();
  74  |     await expect(page.getByText(bookTitle).first()).toBeVisible();
  75  |   });
  76  | 
  77  |   test('4. Save and export: saves a verified book to My Shelf and verifies export actions', async ({
  78  |     page,
  79  |   }) => {
  80  |     await page.goto('/en');
  81  | 
  82  |     // Save first book to My Shelf
  83  |     const saveBtn = page.getByRole('button', { name: 'Save to shelf' }).first();
  84  |     await expect(saveBtn).toBeVisible();
  85  |     await saveBtn.click();
  86  | 
  87  |     // Navigate to My Shelf tab
  88  |     const myShelfTab = page
  89  |       .getByRole('navigation', { name: 'Main Menu' })
  90  |       .getByRole('button', { name: /My Shelf/i });
  91  |     await myShelfTab.click();
  92  | 
  93  |     // Verify saved book and Export buttons (Markdown, CSV) are visible
  94  |     await expect(
  95  |       page.getByRole('button', { name: /Export Markdown/i }),
  96  |     ).toBeVisible();
  97  |     await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
  98  |   });
  99  | 
  100 |   test('5. Language switch: toggles between /vi and /en while keeping route and state intact', async ({
  101 |     page,
  102 |   }) => {
  103 |     await page.goto('/vi/how-it-works');
  104 |     await expect(page.locator('h1')).toContainText(/Cách ShelfPath Hoạt Động/i);
  105 | 
  106 |     const langToggle = page
  107 |       .getByRole('button', {
  108 |         name: /Chuyển sang Tiếng Anh|Switch to Vietnamese/i,
  109 |       })
  110 |       .first();
  111 |     await langToggle.click();
  112 | 
  113 |     await expect(page).toHaveURL(/\/en\/how-it-works/);
  114 |     await expect(page.locator('h1')).toContainText(/How ShelfPath Works/i);
  115 |   });
  116 | 
  117 |   test('6. 3D fallback to 2D: switches between 3D shelf/path and 2D list fallback cleanly', async ({
  118 |     page,
  119 |   }) => {
  120 |     await page.goto('/en');
  121 | 
  122 |     // Toggle 2D mode on the Hero Shelf (or verify automatic 2D fallback in headless mode)
  123 |     const toggle2DBtn = page.getByRole('button', { name: '2D Map' }).first();
  124 |     await expect(toggle2DBtn).toBeVisible();
  125 |     await toggle2DBtn.click();
  126 | 
  127 |     await expect(page.getByTestId('hero-shelf-2d-fallback')).toBeVisible();
  128 |   });
  129 | 
  130 |   test('7. Source outage: displays Fail-Closed 503 alert and never shows unverified books', async ({
  131 |     page,
  132 |   }) => {
  133 |     await page.goto('/en');
  134 | 
  135 |     const simulateOutageBtn = page.getByRole('button', {
  136 |       name: 'Simulate Source Outage (Fail-Closed)',
  137 |     });
  138 |     await expect(simulateOutageBtn).toBeVisible();
  139 |     await simulateOutageBtn.click();
  140 | 
  141 |     const alertRegion = page.getByRole('alert');
> 142 |     await expect(alertRegion).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  143 |     await expect(alertRegion).toContainText(
  144 |       /Verification Sources Temporarily Unavailable|Both Open Library and Google Books are unreachable/i,
  145 |     );
  146 |   });
  147 | 
  148 |   test('8. Rate limit: intercepts /api/recommendations with 429 RATE_LIMITED and shows retry state', async ({
  149 |     page,
  150 |   }) => {
  151 |     await page.goto('/en');
  152 | 
  153 |     // Mock 429 response on /api/recommendations
  154 |     await page.route('**/api/recommendations**', async (route) => {
  155 |       await route.fulfill({
  156 |         status: 429,
  157 |         contentType: 'application/json',
  158 |         headers: {
  159 |           'X-API-Version': '1',
  160 |           'Retry-After': '45',
  161 |         },
  162 |         body: JSON.stringify({
  163 |           error: {
  164 |             code: 'RATE_LIMITED',
  165 |             message:
  166 |               'Too many requests. Please wait 45 seconds before retrying.',
  167 |             requestId: 'req_e2e_ratelimit_429',
  168 |             retryable: true,
  169 |             retryAfterSeconds: 45,
  170 |           },
  171 |         }),
  172 |       });
  173 |     });
  174 | 
  175 |     // Trigger pipeline search via Simulate Source Outage or Start reading path
  176 |     const simulateBtn = page.getByRole('button', {
  177 |       name: 'Simulate Source Outage (Fail-Closed)',
  178 |     });
  179 |     await expect(simulateBtn).toBeVisible();
  180 |     await simulateBtn.click();
  181 | 
  182 |     const rateLimitAlert = page.getByRole('alert');
  183 |     await expect(rateLimitAlert).toBeVisible();
  184 |     await expect(rateLimitAlert).toContainText(
  185 |       /Request Rate Limit Reached|Too many requests|45 seconds/i,
  186 |     );
  187 |   });
  188 | });
  189 | 
```