import { defineConfig, devices } from 'playwright/test';

const chromiumPath = process.env.NEXA_E2E_CHROMIUM_PATH;

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  workers: 1,
  reporter: process.env.CI ? 'dot' : 'list',
  outputDir: 'test-results',
  use: { baseURL: process.env.NEXA_PORTAL_URL ?? 'http://localhost:4300', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure', ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}), ...devices['Desktop Chrome'] }
});
