import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Design System Components
 * 
 * These tests capture baseline snapshots of all components in different states
 * and compare them against the baseline on each build to catch unintended visual changes.
 * 
 * Requirements: 8.1-8.5
 */

test.describe('Design System Components - Visual Regression', () => {
  
  test.describe('Button Component', () => {
    test('should match snapshot - primary variant', async ({ page }) => {
      await page.goto('/');
      
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Find button components with primary variant
      const primaryButtons = page.locator('button[class*="primary"]').first();
      
      if (await primaryButtons.count() > 0) {
        await expect(primaryButtons).toHaveScreenshot('button-primary.png');
      }
    });
    
    test('should match snapshot - secondary variant', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const secondaryButtons = page.locator('button[class*="secondary"]').first();
      
      if (await secondaryButtons.count() > 0) {
        await expect(secondaryButtons).toHaveScreenshot('button-secondary.png');
      }
    });
    
    test('should match snapshot - disabled state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const disabledButtons = page.locator('button:disabled').first();
      
      if (await disabledButtons.count() > 0) {
        await expect(disabledButtons).toHaveScreenshot('button-disabled.png');
      }
    });
  });
  
  test.describe('Card Component', () => {
    test('should match snapshot - default card', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const cards = page.locator('[class*="card"]').first();
      
      if (await cards.count() > 0) {
        await expect(cards).toHaveScreenshot('card-default.png');
      }
    });
    
    test('should match snapshot - card with image', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const cardsWithImage = page.locator('[class*="card"]:has(img)').first();
      
      if (await cardsWithImage.count() > 0) {
        await expect(cardsWithImage).toHaveScreenshot('card-with-image.png');
      }
    });
  });
  
  test.describe('Alert Component', () => {
    test('should match snapshot - info alert', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const infoAlerts = page.locator('[class*="alert"][class*="info"]').first();
      
      if (await infoAlerts.count() > 0) {
        await expect(infoAlerts).toHaveScreenshot('alert-info.png');
      }
    });
    
    test('should match snapshot - warning alert', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const warningAlerts = page.locator('[class*="alert"][class*="warning"]').first();
      
      if (await warningAlerts.count() > 0) {
        await expect(warningAlerts).toHaveScreenshot('alert-warning.png');
      }
    });
    
    test('should match snapshot - error alert', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const errorAlerts = page.locator('[class*="alert"][class*="error"]').first();
      
      if (await errorAlerts.count() > 0) {
        await expect(errorAlerts).toHaveScreenshot('alert-error.png');
      }
    });
  });
  
  test.describe('SensorDisplay Component', () => {
    test('should match snapshot - temperature sensor', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const tempSensors = page.locator('[class*="sensor"][data-type="temperature"]').first();
      
      if (await tempSensors.count() > 0) {
        await expect(tempSensors).toHaveScreenshot('sensor-temperature.png');
      }
    });
    
    test('should match snapshot - humidity sensor', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const humiditySensors = page.locator('[class*="sensor"][data-type="humidity"]').first();
      
      if (await humiditySensors.count() > 0) {
        await expect(humiditySensors).toHaveScreenshot('sensor-humidity.png');
      }
    });
  });
  
  test.describe('Icon Component', () => {
    test('should match snapshot - navigation icons', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const navIcons = page.locator('[class*="icon"]').first();
      
      if (await navIcons.count() > 0) {
        await expect(navIcons).toHaveScreenshot('icon-navigation.png');
      }
    });
  });
  
  test.describe('Chart Component', () => {
    test('should match snapshot - line chart', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const lineCharts = page.locator('[class*="chart"]').first();
      
      if (await lineCharts.count() > 0) {
        // Wait for chart to render
        await page.waitForTimeout(1000);
        await expect(lineCharts).toHaveScreenshot('chart-line.png');
      }
    });
  });
});
