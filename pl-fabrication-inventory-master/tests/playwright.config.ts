import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'https://jarvis.vipmedicalgroup.ai/pl-inventory',
    headless: true,
    screenshot: 'only-on-failure',
  },
});
