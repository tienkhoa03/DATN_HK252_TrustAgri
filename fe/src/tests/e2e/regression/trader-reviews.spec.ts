/**
 * Smoke E2E — trader trust score & reviews (Phase buyer-review).
 *
 * Kịch bản: buyer mở lịch sử đơn hàng → tìm đơn hoàn tất → click "Đánh giá thương lái"
 * → chọn 5 sao → gửi → snackbar thành công xuất hiện.
 *
 * Yêu cầu: Backend stack + seed data với ít nhất 1 completed order.
 * Skip trong CI; bật khi chạy thủ công với E2E_STAGING=true.
 */

import { test, expect } from '@playwright/test';

test.describe.skip('Trader reviews — buyer smoke flow', () => {
  test('buyer can rate a completed order and sees success snackbar', async ({ page }) => {
    await page.goto('/buyer/history', { waitUntil: 'domcontentloaded' });

    // Wait for order list to load
    await page.waitForSelector('.buyer-transaction-history-screen', { timeout: 10000 });

    // Make sure we are on orders tab (default)
    const ordersTab = page.locator('button:has-text("Đơn hàng")');
    await ordersTab.click();

    // Find the "Đánh giá thương lái" button on a completed order card
    const reviewBtn = page.locator('button:has-text("Đánh giá thương lái")').first();
    await expect(reviewBtn).toBeVisible({ timeout: 8000 });
    await reviewBtn.click();

    // Modal should appear
    await expect(page.locator('text=Đánh giá thương lái')).toBeVisible({ timeout: 3000 });

    // Click 5th star
    const stars = page.locator('button[aria-label="5 sao"]');
    await stars.click();

    // Submit
    const submitBtn = page.locator('button:has-text("Gửi đánh giá")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Snackbar success message
    await expect(page.locator('text=/Đã gửi đánh giá thành công/')).toBeVisible({ timeout: 5000 });
  });
});
