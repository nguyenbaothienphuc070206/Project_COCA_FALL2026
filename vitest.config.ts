/**
 * Tính năng: Cấu hình Vitest cho bộ kiểm thử đơn vị và tích hợp (Unit & Integration Tests).
 * Trường hợp sử dụng: Chạy `npm run test` để xác thực toàn bộ 6 giai đoạn pipeline, khớp sách, MMR, hợp đồng API, bảo mật, nhật ký quan sát (Observability) và cấu hình triển khai sản xuất (Phase 11).
 */

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/lib/phase10.vitest.test.ts',
      'src/lib/phase11.deployment.test.ts',
    ],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
