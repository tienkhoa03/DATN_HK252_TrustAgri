/**
 * Golden path E2E (Phase C4) — kiểm chuỗi nghiệp vụ chính của TrustAgri MVP.
 *
 * Kịch bản (theo `.claude/plan/2026-05-08-mvp-polish-and-feature-completion.md` §4.3):
 *   1. Guest scan QR → trang traceability render OK.
 *   2. Buyer login (mode `dev-seeded`) → đăng nhu cầu mua.
 *   3. Trader login → tạo proposal cho buying request đó.
 *   4. Buyer accept proposal → contract created.
 *   5. Farmer login → log care, sync, acknowledge alert giả.
 *
 * Yêu cầu trước khi chạy:
 *   - Backend services 3001–3005 + Gateway 3000 + Postgres/Redis/Influx running.
 *   - Seed dev users: `psql -f be/scripts/seed-dev-users.sql`.
 *   - FE chạy với `VITE_AUTH_MODE=dev-seeded` + `VITE_DEV_LOGIN_SECRET` + `VITE_DEV_LOGIN_ZALO_ID=zalo_dev_<role>_001`.
 *
 * Chạy: `npm run test:visual -- --project=mobile-375-safari src/tests/e2e/golden-path.spec.ts`
 *
 * GHI CHÚ: spec này là SKELETON — selectors cần được verify với UI thật trước khi enable trong CI.
 * Đánh dấu `test.skip()` để CI không fail. Bỏ skip khi chạy thủ công.
 */

import { test, expect } from '@playwright/test';

const FAKE_TRACE_CODE = 'TR-fakeabc12345';

test.describe('Golden path — luồng nghiệp vụ TrustAgri MVP', () => {
  test.skip(true, 'Skeleton — bật khi backend stack + seed data sẵn sàng');

  test('Guest scan QR — traceability render', async ({ page }) => {
    await page.goto(`/guest/trace/${FAKE_TRACE_CODE}`);
    // Page hiển thị thông tin truy xuất (header + farm name OR friendly 404)
    await expect(page.locator('text=/Truy xuất|Không tìm thấy/')).toBeVisible({ timeout: 10000 });
  });

  test('Buyer post buying request → trader proposal → buyer accept → contract', async ({ browser }) => {
    // Buyer flow
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await buyer.goto('/');
    // dev-seeded mode auto-bootstrap → buyer home
    await expect(buyer.locator('text=/Marketplace|Chợ|Mua/')).toBeVisible({ timeout: 15000 });
    await buyer.goto('/buyer/request');
    // Fill form
    await buyer.locator('input[name="cropType"], select[name="cropType"]').first().selectOption('dragon_fruit').catch(() => {});
    await buyer.locator('input[name="quantity"]').fill('100');
    await buyer.locator('button:has-text("Đăng")').click();
    await expect(buyer.locator('text=/Đã đăng|thành công/')).toBeVisible({ timeout: 5000 });

    // Trader flow (separate context to avoid auth conflict)
    const traderCtx = await browser.newContext();
    const trader = await traderCtx.newPage();
    // Override env for trader is handled at app boot — for E2E we'd typically use a separate origin
    // or programmatic login. SKELETON: just navigate.
    await trader.goto('/trader/trading');
    // Tab "Nhu cầu công khai"
    await trader.locator('button:has-text("Nhu cầu")').click();
    await trader.locator('button:has-text("Đề xuất")').first().click();
    await trader.locator('input[name="price"]').fill('25000');
    await trader.locator('button:has-text("Gửi")').click();

    // Buyer accept
    await buyer.goto('/buyer/orders');
    await buyer.locator('button:has-text("Chấp nhận")').first().click();
    await expect(buyer.locator('text=/hợp đồng|contract/i')).toBeVisible({ timeout: 5000 });

    await buyerCtx.close();
    await traderCtx.close();
  });

  test('Farmer care log + acknowledge alert', async ({ page }) => {
    await page.goto('/farmer');
    await expect(page.locator('text=/Trang chủ|Dashboard|Cảnh báo/')).toBeVisible({ timeout: 15000 });

    // Care log create
    await page.goto('/farmer/process');
    await page.locator('button:has-text("Nhật ký")').click();
    await page.locator('button[aria-label="Thêm nhật ký chăm sóc"]').click();
    await page.locator('textarea').fill('E2E test note');
    await page.locator('button:has-text("Lưu")').click();
    await expect(page.locator('text=/Đã lưu|thành công/')).toBeVisible({ timeout: 5000 });

    // Acknowledge alert (nếu có)
    await page.goto('/farmer/alerts');
    const ackButton = page.locator('button:has-text("Xác nhận")').first();
    if (await ackButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ackButton.click();
      await expect(page.locator('text=/Đã xác nhận|acknowledged/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
