import { defineConfig, devices } from '@playwright/test';

/**
 * M.A.T.E. Method — Standalone & Integrated Playwright Configuration
 * Supports multi-layer execution: Smoke (@smoke/@p0), E2E UI, API Contracts, and Pillar T Threats.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      Accept: 'application/json, text/plain, */*',
    },
  },
  projects: [
    {
      name: 'smoke',
      testDir: './tests/e2e',
      grep: /@smoke|@p0/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: API_BASE_URL,
      },
    },
    {
      name: 'threats',
      testDir: './tests/threats',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
