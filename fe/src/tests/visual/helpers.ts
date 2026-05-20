import { Page } from '@playwright/test';

/**
 * Helper utilities for visual regression testing
 */

/**
 * Wait for all images to load on the page
 */
export async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });
}

/**
 * Wait for all animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(
      document.getAnimations().map(animation => animation.finished)
    );
  });
}

/**
 * Hide dynamic content that changes between test runs
 * (e.g., timestamps, random IDs)
 */
export async function hideDynamicContent(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"],
      [data-testid="random-id"],
      .timestamp,
      .dynamic-content {
        visibility: hidden !important;
      }
    `
  });
}

/**
 * Navigate to a screen and wait for it to be ready for screenshot
 */
export async function navigateAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await waitForImages(page);
  await page.waitForTimeout(500); // Additional buffer for any transitions
}

/**
 * Get viewport dimensions
 */
export function getViewportInfo(page: Page): { width: number; height: number } | null {
  return page.viewportSize();
}

/**
 * Scroll to element before taking screenshot
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  if (await element.count() > 0) {
    await element.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // Wait for scroll animation
  }
}

/**
 * Take screenshot of specific component with padding
 */
export async function screenshotComponent(
  page: Page,
  selector: string,
  filename: string,
  padding: number = 20
): Promise<void> {
  const element = page.locator(selector);
  if ((await element.count()) === 0) return;
  // locator.screenshot() crops tightly to the bounding box and has no `clip` option,
  // so route the padded crop through page.screenshot when padding is requested.
  const box = await element.boundingBox();
  if (!box) {
    await element.screenshot({ path: filename });
    return;
  }
  await page.screenshot({
    path: filename,
    clip: {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
  });
}

/**
 * Check if element exists on page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Wait for specific component to be rendered
 */
export async function waitForComponent(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}
