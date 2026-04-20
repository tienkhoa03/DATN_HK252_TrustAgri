import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration for Zalo UI Design System
 * 
 * This configuration sets up visual regression testing for:
 * - All design system components
 * - All screen implementations
 * - Multiple screen sizes (360px, 375px, 414px)
 * - Both iOS and Android viewports
 */
export default defineConfig({
  testDir: './src/tests/visual',
  
  // Timeout for each test
  timeout: 30 * 1000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      // Maximum pixel difference threshold
      maxDiffPixels: 100,
      // Threshold for pixel color difference (0-1)
      threshold: 0.2,
    },
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for the dev server
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers and screen sizes
  projects: [
    // Mobile screen sizes - 360px (small Android)
    {
      name: 'mobile-360-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 },
      },
    },
    
    // Mobile screen sizes - 375px (iPhone SE, iPhone 12/13 mini)
    {
      name: 'mobile-375-safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    // Mobile screen sizes - 414px (iPhone 12 Pro Max, iPhone 13 Pro Max)
    {
      name: 'mobile-414-safari',
      use: {
        ...devices['iPhone 12 Pro Max'],
        viewport: { width: 414, height: 896 },
      },
    },
    
    // Additional Android device for testing
    {
      name: 'mobile-360-android',
      use: {
        ...devices['Galaxy S9+'],
        viewport: { width: 360, height: 740 },
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
