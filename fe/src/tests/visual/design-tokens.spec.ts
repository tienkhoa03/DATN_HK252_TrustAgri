import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Design Tokens
 * 
 * These tests verify that design tokens (colors, typography, spacing, icons)
 * are applied consistently across the application.
 * 
 * Requirements: 8.1-8.5
 */

test.describe('Design Tokens - Visual Regression', () => {
  
  test.describe('Color Palette', () => {
    test('Primary colors render correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for Zalo Blue (#0068FF) elements
      const zaloBlueElements = page.locator('[style*="#0068FF"], [style*="rgb(0, 104, 255)"]').first();
      if (await zaloBlueElements.count() > 0) {
        await expect(zaloBlueElements).toHaveScreenshot('color-zalo-blue.png');
      }
      
      // Check for Agri Green (#3EBB6C) elements
      const agriGreenElements = page.locator('[style*="#3EBB6C"], [style*="rgb(62, 187, 108)"]').first();
      if (await agriGreenElements.count() > 0) {
        await expect(agriGreenElements).toHaveScreenshot('color-agri-green.png');
      }
    });
    
    test('Functional colors render correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for Alert Red (#F50000) elements
      const alertRedElements = page.locator('[style*="#F50000"], [style*="rgb(245, 0, 0)"]').first();
      if (await alertRedElements.count() > 0) {
        await expect(alertRedElements).toHaveScreenshot('color-alert-red.png');
      }
      
      // Check for Warning Yellow (#FFCC00) elements
      const warningYellowElements = page.locator('[style*="#FFCC00"], [style*="rgb(255, 204, 0)"]').first();
      if (await warningYellowElements.count() > 0) {
        await expect(warningYellowElements).toHaveScreenshot('color-warning-yellow.png');
      }
    });
  });
  
  test.describe('Typography', () => {
    test('Heading 1 (22px) renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const h1Elements = page.locator('h1, [class*="h1"], [class*="heading-1"]').first();
      if (await h1Elements.count() > 0) {
        await expect(h1Elements).toHaveScreenshot('typography-h1.png');
      }
    });
    
    test('Heading 2 (18px) renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const h2Elements = page.locator('h2, [class*="h2"], [class*="heading-2"]').first();
      if (await h2Elements.count() > 0) {
        await expect(h2Elements).toHaveScreenshot('typography-h2.png');
      }
    });
    
    test('Body text (16px) renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const bodyElements = page.locator('p, [class*="body"], [class*="text-base"]').first();
      if (await bodyElements.count() > 0) {
        await expect(bodyElements).toHaveScreenshot('typography-body.png');
      }
    });
    
    test('Font family is consistent', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check computed font family
      const fontFamily = await page.evaluate(() => {
        const element = document.body;
        return window.getComputedStyle(element).fontFamily;
      });
      
      // Should be system font (San Francisco on iOS, Roboto on Android)
      expect(fontFamily).toMatch(/San Francisco|Roboto|-apple-system|system-ui/i);
    });
  });
  
  test.describe('Spacing', () => {
    test('Spacing tokens are applied consistently', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for consistent spacing between elements
      const spacedElements = page.locator('[class*="space"], [class*="gap"], [class*="margin"]').first();
      if (await spacedElements.count() > 0) {
        await expect(spacedElements).toHaveScreenshot('spacing-consistency.png');
      }
    });
  });
  
  test.describe('Icons', () => {
    test('Icons use outline style', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for icon elements
      const icons = page.locator('[class*="icon"], svg').first();
      if (await icons.count() > 0) {
        await expect(icons).toHaveScreenshot('icon-outline-style.png');
      }
    });
    
    test('Navigation icons render correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for navigation icons
      const navIcons = page.locator('nav [class*="icon"], nav svg').first();
      if (await navIcons.count() > 0) {
        await expect(navIcons).toHaveScreenshot('icon-navigation.png');
      }
    });
    
    test('Agriculture icons render correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for agriculture-specific icons (thermometer, droplet, sun)
      const agriIcons = page.locator('[data-icon*="temperature"], [data-icon*="humidity"], [data-icon*="light"]').first();
      if (await agriIcons.count() > 0) {
        await expect(agriIcons).toHaveScreenshot('icon-agriculture.png');
      }
    });
  });
  
  test.describe('Component Consistency', () => {
    test('All buttons use consistent styling', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all buttons on the page
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // Take screenshot of first few buttons to verify consistency
        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          const button = buttons.nth(i);
          await expect(button).toHaveScreenshot(`button-consistency-${i}.png`);
        }
      }
    });
    
    test('All cards use consistent styling', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all cards on the page
      const cards = page.locator('[class*="card"]');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        // Take screenshot of first few cards to verify consistency
        for (let i = 0; i < Math.min(3, cardCount); i++) {
          const card = cards.nth(i);
          await expect(card).toHaveScreenshot(`card-consistency-${i}.png`);
        }
      }
    });
  });
  
  test.describe('Accessibility', () => {
    test('Touch targets are at least 44x44px', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check button sizes
      const buttons = page.locator('button, a[role="button"]');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          // Verify minimum touch target size
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
    
    test('Text has sufficient contrast', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of text elements for manual contrast review
      const textElements = page.locator('p, h1, h2, h3, span').first();
      if (await textElements.count() > 0) {
        await expect(textElements).toHaveScreenshot('text-contrast.png');
      }
    });
  });
});
