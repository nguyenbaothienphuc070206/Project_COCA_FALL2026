# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shelfpath.spec.ts >> ShelfPath E2E Suite (External Sources Mocked) >> 8. Rate limit: intercepts /api/recommendations with 429 RATE_LIMITED and shows retry state
- Location: e2e/shelfpath.spec.ts:148:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert')
Expected: visible
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <section role="alert" class="rounded-[22px] border border-[#C8433C]/40 bg-[#FDFCF9] dark:bg-[#1E2330] p-8 text-center space-y-4">…</section> aka getByText('Too many requests (Rate limit active)Too many requests in a short window.')
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
                - heading "Too many requests (Rate limit active)" [level=2] [ref=e208]
                - paragraph [ref=e209]: Too many requests in a short window. Please wait 45 seconds before retrying.
                - button "Retry with verified sample data" [ref=e210] [cursor=pointer]
            - complementary "Verification Stage & Reading Progress" [ref=e215]:
              - status "Loading 3D Verification Shelf" [ref=e216]:
                - generic [ref=e220]: Đang khởi tạo Kệ sách Kiểm chứng 3D / Loading 3D Shelf...
              - region "Transparent Verification & Ranking Pipeline (SSE)" [ref=e222]:
                - generic [ref=e223]:
                  - generic [ref=e229]:
                    - heading "Transparent Verification & Ranking Pipeline (SSE)" [level=2] [ref=e230]
                    - paragraph [ref=e231]: 04 / 06 · 6 found · 4 verified · 2 removed
                  - button "Restore Catalog Connection" [active] [ref=e233] [cursor=pointer]
                - list [ref=e242]:
                  - listitem [ref=e243]:
                    - generic [ref=e247]: Searching web
                  - listitem [ref=e248]:
                    - generic [ref=e252]: Extracting schema
                  - listitem [ref=e253]:
                    - generic [ref=e257]: Verifying catalogs
                  - listitem [ref=e258]:
                    - generic [ref=e262]: Ranking (MMR)
                  - listitem [ref=e263]:
                    - generic [ref=e267]: Building path
                - button "Removed unverified candidates log (2)" [ref=e269] [cursor=pointer]
              - generic [ref=e273]:
                - generic [ref=e274]:
                  - heading "Session Roadmap Progress" [level=2] [ref=e275]
                  - generic [ref=e276]:
                    - strong [ref=e277]: "04"
                    - text: Verified on shelf
                - list [ref=e278]:
                  - listitem [ref=e279]:
                    - generic [ref=e281]: Step 01
                    - button "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow" [ref=e283] [cursor=pointer]
                    - paragraph [ref=e284]: Read this first to build concrete intuition with Scikit-Learn pipelines before diving into deep neural architectures.
                  - listitem [ref=e285]:
                    - generic [ref=e287]: Step 02
                    - button "The Hundred-Page Machine Learning Book" [ref=e289] [cursor=pointer]
                    - paragraph [ref=e290]: Consolidates the core mathematical notation and taxonomy in 160 focused pages before tackling theory-heavy texts.
                  - listitem [ref=e291]:
                    - generic [ref=e293]: Step 03
                    - button "Machine Learning Yearning" [ref=e295] [cursor=pointer]
                    - paragraph [ref=e296]: In just 118 practical pages, Andrew Ng teaches how to structure ML projects, debug error metrics, and make fast engineering decisions.
                  - listitem [ref=e297]:
                    - generic [ref=e299]: Step 04
                    - button "Designing Machine Learning Systems" [ref=e301] [cursor=pointer]
                    - paragraph [ref=e302]: "Bridges classroom modeling with real-world engineering: data pipelines, distribution shift, and deployment."
          - generic "Site footer" [ref=e303]:
            - generic [ref=e304]:
              - generic [ref=e305]:
                - generic [ref=e306]:
                  - generic [ref=e307]: SP
                  - generic [ref=e308]: ShelfPath
                - paragraph [ref=e309]: ShelfPath — Calm, honest, verified reading roadmaps for students.
                - generic [ref=e310]:
                  - generic [ref=e314]: "Contact (Email):"
                  - 'link "[FILL IN: contact@yourdomain.edu]" [ref=e315] [cursor=pointer]':
                    - /url: mailto:contact@example.com?subject=ShelfPath%20Inquiry
                - generic [ref=e316]:
                  - group "Path language:" [ref=e317]:
                    - button "Tiếng Việt (/vi)" [ref=e321] [cursor=pointer]
                    - button "English (/en)" [pressed] [ref=e322] [cursor=pointer]
                  - button "Open 3-step guide" [ref=e323] [cursor=pointer]
              - navigation "Product & Roadmaps" [ref=e328]:
                - heading "Product & Roadmaps" [level=2] [ref=e329]
                - list [ref=e330]:
                  - listitem [ref=e331]:
                    - link "Home" [ref=e332] [cursor=pointer]:
                      - /url: /en
                  - listitem [ref=e333]:
                    - link "How it works" [ref=e334] [cursor=pointer]:
                      - /url: /en/how-it-works
                  - listitem [ref=e335]:
                    - link "About" [ref=e336] [cursor=pointer]:
                      - /url: /en/about
              - navigation "Methodology & Trust" [ref=e337]:
                - heading "Methodology & Trust" [level=2] [ref=e338]
                - list [ref=e339]:
                  - listitem [ref=e340]:
                    - link "Methodology & Data Sources" [ref=e341] [cursor=pointer]:
                      - /url: /en/methodology
                  - listitem [ref=e342]:
                    - link "FAQ" [ref=e343] [cursor=pointer]:
                      - /url: /en/faq
              - navigation "Legal & Accessibility" [ref=e344]:
                - heading "Legal & Accessibility" [level=2] [ref=e345]
                - list [ref=e346]:
                  - listitem [ref=e347]:
                    - link "Privacy" [ref=e348] [cursor=pointer]:
                      - /url: /en/privacy
                  - listitem [ref=e349]:
                    - link "Terms & Disclaimer" [ref=e350] [cursor=pointer]:
                      - /url: /en/terms
                  - listitem [ref=e351]:
                    - link "Accessibility" [ref=e352] [cursor=pointer]:
                      - /url: /en/accessibility
            - generic [ref=e353]:
              - generic [ref=e354]: Bibliographic metadata is verified against Open Library and Google Books. ShelfPath is an independent project and implies no endorsement or partnership with Open Library, Internet Archive, or Google.
              - generic [ref=e358]: No accounts · No tracking · 100% catalog-verified books only.
  - button "Open Next.js Dev Tools" [ref=e364] [cursor=pointer]
  - alert [ref=e368]
```

# Test source

```ts
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
  142 |     await expect(alertRegion).toBeVisible();
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
> 183 |     await expect(rateLimitAlert).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  184 |     await expect(rateLimitAlert).toContainText(
  185 |       /Request Rate Limit Reached|Too many requests|45 seconds/i,
  186 |     );
  187 |   });
  188 | });
  189 | 
```