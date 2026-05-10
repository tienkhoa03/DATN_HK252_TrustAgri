import { test, expect } from '@playwright/test';

/**
 * Smoke regression Phase 1–19: mỗi route SPA phải tải được (HTTP < 400, có DOM).
 * Không xác thực end-to-end Zalo ở đây; màn cần JWT có thể hiển thị lỗi/snackbar nhưng không crash.
 *
 * Chạy với Gateway thật: build .env staging (VITE_API_BASE_URL → gateway), E2E_STAGING=true.
 */
const REGRESSION_ROUTES: readonly string[] = [
  '/',
  '/login',
  '/guest',
  '/guest/products/preview',
  '/guest/trace/demo',
  '/buyer',
  '/buyer/history',
  '/buyer/orders',
  '/buyer/request',
  '/buyer/monitor',
  '/buyer/me',
  '/farmer',
  '/farmer/garden',
  '/farmer/trade',
  '/farmer/me',
  '/farmer/connections',
  '/farmer/alerts',
  // Legacy farmer redirects
  '/farmer/farm',
  '/farmer/process',
  '/farmer/connect',
  '/farmer/contracts',
  '/trader',
  '/trader/market',
  '/trader/transactions',
  '/trader/monitor',
  '/trader/standards',
  '/trader/connections',
  '/trader/me',
  // Legacy redirect paths — still valid routes
  '/trader/supply',
  '/trader/trading',
  '/trader/library',
  '/trader/news',
];

for (const path of REGRESSION_ROUTES) {
  test(`smoke route ${path}`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    const status = res?.status() ?? 0;
    expect(status, `HTTP status for ${path}`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });
}
