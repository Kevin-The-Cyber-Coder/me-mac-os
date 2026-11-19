import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'npm --workspace server run dev',
          url: 'http://localhost:5000/api/health',
          reuseExistingServer: !CI,
          timeout: 120_000,
        },
        {
          command: 'npm --workspace client run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !CI,
          timeout: 120_000,
        },
      ],
})
