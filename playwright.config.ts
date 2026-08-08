import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e/tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    browserName: 'chromium',
    headless: true,
    actionTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
    },
  ],
});
