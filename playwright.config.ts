/**
 * Tính năng: Cấu hình Playwright End-to-End Testing (E2E).
 * Trường hợp sử dụng: Kiểm thử tự động 8 luồng người dùng chính trên trình duyệt với các nguồn bên ngoài được giả lập (mocked) hoàn toàn.
 */

import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const LOCAL_HEADLESS_SHELL =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const executablePath = fs.existsSync(LOCAL_HEADLESS_SHELL)
  ? LOCAL_HEADLESS_SHELL
  : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 45000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    headless: true,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
