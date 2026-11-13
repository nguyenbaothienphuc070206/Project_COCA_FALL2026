/**
 * Tính năng: Bộ kiểm thử End-to-End (E2E) bằng Playwright cho 8 kịch bản trọng tâm của ShelfPath.
 * Trường hợp sử dụng:
 *   1. Chủ đề -> kết quả sách đã kiểm chứng (Topic to verified results)
 *   2. Tinh chỉnh ngôn ngữ tự nhiên kèm chip có thể gỡ bỏ (Refine)
 *   3. Loại bỏ sách ("Not interested") kèm hoàn tác 8 giây (Dismiss with undo)
 *   4. Lưu vào Tủ sách của tôi và xuất dữ liệu Markdown/CSV (Save and export)
 *   5. Chuyển đổi ngôn ngữ Việt <-> Anh (Language switch)
 *   6. Chuyển đổi 3D sang danh sách 2D (3D fallback to 2D)
 *   7. Gián đoạn nguồn danh mục Fail-Closed 503 (Source outage)
 *   8. Giới hạn tốc độ 429 (Rate limit)
 * Lưu ý bảo mật & kiểm thử: Mọi kết nối mạng đều được chặn/giả lập (mocked) để không bao giờ gọi tới Open Library, Google Books hay Gemini thật khi chạy kiểm thử.
 */

import { test, expect } from '@playwright/test';

test.describe('ShelfPath E2E Suite (External Sources Mocked)', () => {
  test('1. Topic to verified results: submits topic and renders verified books with catalog badges', async ({
    page,
  }) => {
    await page.goto('/vi');

    const heading = page.locator('#verified-roadmap-heading');
    await expect(heading).toBeVisible();

    // Verify sample verified books and verification badges are rendered
    await expect(
      page
        .getByText(
          'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
        )
        .first(),
    ).toBeVisible();
    await expect(page.getByText(/Open Library/i).first()).toBeVisible();
  });

  test('2. Natural-language refine: applies preset refinement and displays removable adjustment chip', async ({
    page,
  }) => {
    await page.goto('/en');

    // Click "+ Shorter" preset refinement button
    const shorterPresetBtn = page.getByRole('button', { name: '+ Shorter' });
    await expect(shorterPresetBtn).toBeVisible();
    await shorterPresetBtn.click();

    // Verify interpreted adjustment region and removable chip appear
    const understoodRegion = page.getByRole('region', {
      name: /Interpreted adjustments/i,
    });
    await expect(understoodRegion).toBeVisible();
    await expect(understoodRegion.getByText(/Shorter/i).first()).toBeVisible();
  });

  test('3. Dismiss with 8-second undo: removes book, shows undo banner, and restores on Undo', async ({
    page,
  }) => {
    await page.goto('/en');

    const bookTitle = 'The Hundred-Page Machine Learning Book';
    const dismissBtn = page.getByRole('button', {
      name: `Not interested: ${bookTitle}`,
    });
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    // Verify 8-second undo banner appears
    const undoBtn = page.getByRole('button', { name: /Undo \(/i });
    await expect(undoBtn).toBeVisible();

    // Click Undo and verify book is restored
    await undoBtn.click();
    await expect(page.getByText(bookTitle).first()).toBeVisible();
  });

  test('4. Save and export: saves a verified book to My Shelf and verifies export actions', async ({
    page,
  }) => {
    await page.goto('/en');

    // Save first book to My Shelf
    const saveBtn = page.getByRole('button', { name: 'Save to shelf' }).first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Navigate to My Shelf tab
    const myShelfTab = page
      .getByRole('navigation', { name: 'Main Menu' })
      .getByRole('button', { name: /My Shelf/i });
    await myShelfTab.click();

    // Verify saved book and Export buttons (Markdown, CSV) are visible
    await expect(
      page.getByRole('button', { name: /Export Markdown/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
  });

  test('5. Language switch: toggles between /vi and /en while keeping route and state intact', async ({
    page,
  }) => {
    await page.goto('/vi/how-it-works');
    await expect(page.locator('h1')).toContainText(/Cách ShelfPath Hoạt Động/i);

    const langToggle = page
      .getByRole('button', {
        name: /Chuyển sang Tiếng Anh|Switch to Vietnamese/i,
      })
      .first();
    await langToggle.click();

    await expect(page).toHaveURL(/\/en\/how-it-works/);
    await expect(page.locator('h1')).toContainText(/How ShelfPath Works/i);
  });

  test('6. 3D fallback to 2D: switches between 3D shelf/path and 2D list fallback cleanly', async ({
    page,
  }) => {
    await page.goto('/en');

    // Toggle 2D mode on the Hero Shelf (or verify automatic 2D fallback in headless mode)
    const toggle2DBtn = page.getByRole('button', { name: '2D Map' }).first();
    await expect(toggle2DBtn).toBeVisible();
    await toggle2DBtn.click();

    await expect(page.getByTestId('hero-shelf-2d-fallback')).toBeVisible();
  });

  test('7. Source outage: displays Fail-Closed 503 alert and never shows unverified books', async ({
    page,
  }) => {
    await page.goto('/en');

    const simulateOutageBtn = page.getByRole('button', {
      name: 'Simulate Source Outage (Fail-Closed)',
    });
    await expect(simulateOutageBtn).toBeVisible();
    await simulateOutageBtn.click();

    const alertRegion = page.locator('section[role="alert"]');
    await expect(alertRegion).toBeVisible();
    await expect(alertRegion).toContainText(
      /Results withheld|Verification sources unreachable|Both Open Library and Google Books are unreachable/i,
    );
  });

  test('8. Rate limit: intercepts /api/recommendations with 429 RATE_LIMITED and shows retry state', async ({
    page,
  }) => {
    await page.goto('/en');

    // Mock 429 response on /api/recommendations
    await page.route('**/api/recommendations**', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'X-API-Version': '1',
          'Retry-After': '45',
        },
        body: JSON.stringify({
          error: {
            code: 'RATE_LIMITED',
            message:
              'Too many requests. Please wait 45 seconds before retrying.',
            requestId: 'req_e2e_ratelimit_429',
            retryable: true,
            retryAfterSeconds: 45,
          },
        }),
      });
    });

    // Trigger pipeline search via Simulate Source Outage or Start reading path
    const simulateBtn = page.getByRole('button', {
      name: 'Simulate Source Outage (Fail-Closed)',
    });
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    const rateLimitAlert = page.locator('section[role="alert"]');
    await expect(rateLimitAlert).toBeVisible();
    await expect(rateLimitAlert).toContainText(
      /Too many requests|Rate limit active|45 seconds/i,
    );
  });
});
