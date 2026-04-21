import { defineConfig, devices } from '@playwright/test';

/**
 * Regression E2E (Phase 20.2): chạy trên dev local hoặc bản deploy staging.
 *
 * Local (mặc định): tự khởi động `npm run start`, baseURL http://localhost:3000
 * Staging: đặt E2E_STAGING=true và E2E_BASE_URL=https://… (HTTPS); không spawn webServer.
 *
 * Ví dụ staging:
 *   cross-env E2E_STAGING=true E2E_BASE_URL=https://your-staging-host npm run test:e2e:regression
 */
const useStaging =
  process.env.E2E_STAGING === '1' ||
  process.env.E2E_STAGING === 'true';

const baseURL = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default defineConfig({
  testDir: './src/tests/e2e/regression',
  timeout: 90 * 1000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-regression' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-regression',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 },
      },
    },
  ],
  webServer: useStaging
    ? undefined
    : {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
      },
});
