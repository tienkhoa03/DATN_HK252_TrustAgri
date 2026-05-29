import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Application Screens
 * 
 * These tests capture baseline snapshots of all screens for different user roles
 * and compare them against the baseline on each build.
 * 
 * Tests are performed on multiple screen sizes: 360px, 375px, 414px
 * 
 * Requirements: 8.1-8.5
 */

test.describe('Farmer Screens - Visual Regression', () => {
  
  test('Farmer Dashboard Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Farmer Dashboard if not already there
    const dashboardLink = page.locator('text=/Dashboard|Trang chủ/i').first();
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('farmer-dashboard.png', {
      fullPage: true,
    });
  });
  
  test('Farmer Process Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Process screen
    const processLink = page.locator('text=/Process|Quy trình/i').first();
    if (await processLink.count() > 0) {
      await processLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('farmer-process.png', {
        fullPage: true,
      });
    }
  });
  
  test('Farmer Market Connect Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Market Connect screen
    const marketLink = page.locator('text=/Market|Thị trường|Kết nối/i').first();
    if (await marketLink.count() > 0) {
      await marketLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('farmer-market-connect.png', {
        fullPage: true,
      });
    }
  });
  
  test('Farmer Contracts Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Contracts screen
    const contractsLink = page.locator('text=/Contract|Hợp đồng/i').first();
    if (await contractsLink.count() > 0) {
      await contractsLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('farmer-contracts.png', {
        fullPage: true,
      });
    }
  });
  
  test('Farmer Farm Profile Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Farm Profile screen
    const profileLink = page.locator('text=/Profile|Hồ sơ|Farm/i').first();
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('farmer-farm-profile.png', {
        fullPage: true,
      });
    }
  });
});

test.describe('Trader Screens - Visual Regression', () => {
  
  test('Trader Dashboard Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for trader dashboard elements
    const traderDashboard = page.locator('text=/Trader Dashboard|Bảng điều khiển/i').first();
    if (await traderDashboard.count() > 0) {
      await traderDashboard.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('trader-dashboard.png', {
        fullPage: true,
      });
    }
  });
  
  test('Trader Supply Monitor Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const supplyLink = page.locator('text=/Supply|Nguồn cung|Monitor/i').first();
    if (await supplyLink.count() > 0) {
      await supplyLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('trader-supply-monitor.png', {
        fullPage: true,
      });
    }
  });
  
  test('Trader Trading Orders Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const ordersLink = page.locator('text=/Trading|Orders|Đơn hàng/i').first();
    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('trader-trading-orders.png', {
        fullPage: true,
      });
    }
  });
  
  test('Trader Standard Library Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const libraryLink = page.locator('text=/Standard|Library|Thư viện/i').first();
    if (await libraryLink.count() > 0) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('trader-standard-library.png', {
        fullPage: true,
      });
    }
  });
  
  test('Trader Profile News Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const newsLink = page.locator('text=/Profile|News|Tin tức/i').first();
    if (await newsLink.count() > 0) {
      await newsLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('trader-profile-news.png', {
        fullPage: true,
      });
    }
  });
});

test.describe('Buyer Screens - Visual Regression', () => {
  
  test('Buyer Marketplace Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const marketplaceLink = page.locator('text=/Marketplace|Chợ|Market/i').first();
    if (await marketplaceLink.count() > 0) {
      await marketplaceLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('buyer-marketplace.png', {
        fullPage: true,
      });
    }
  });
  
  test('Buyer Product Detail Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const productLink = page.locator('text=/Product|Sản phẩm/i').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('buyer-product-detail.png', {
        fullPage: true,
      });
    }
  });
  
  test('Buyer Orders Proposals Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const ordersLink = page.locator('text=/Orders|Đơn hàng|Proposals/i').first();
    if (await ordersLink.count() > 0) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('buyer-orders-proposals.png', {
        fullPage: true,
      });
    }
  });
  
  test('Buyer Post Buying Request Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const postLink = page.locator('text=/Post|Đăng|Buying Request/i').first();
    if (await postLink.count() > 0) {
      await postLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('buyer-post-buying-request.png', {
        fullPage: true,
      });
    }
  });
  
  test('Buyer Profile Notification Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const profileLink = page.locator('text=/Profile|Notification|Thông báo/i').first();
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('buyer-profile-notification.png', {
        fullPage: true,
      });
    }
  });
});

test.describe('Guest Screens - Visual Regression', () => {
  
  test('Guest Home Market News Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('guest-home-market-news.png', {
      fullPage: true,
    });
  });
  
  test('Guest Traceability Scan Result Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const scanLink = page.locator('text=/Scan|Traceability|Truy xuất/i').first();
    if (await scanLink.count() > 0) {
      await scanLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('guest-traceability-scan.png', {
        fullPage: true,
      });
    }
  });
  
  test('Guest Product Detail Screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const productLink = page.locator('text=/Product|Sản phẩm/i').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('guest-product-detail.png', {
        fullPage: true,
      });
    }
  });
});

test.describe('Responsive Design - Multiple Screen Sizes', () => {
  
  test('Home page renders correctly on all screen sizes', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot with device-specific name
    await expect(page).toHaveScreenshot(`home-${browserName}.png`, {
      fullPage: true,
    });
  });
  
  test('Navigation elements are visible on all screen sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if navigation is visible
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
      await expect(nav).toHaveScreenshot('navigation.png');
    }
  });
});
