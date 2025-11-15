import { defineConfig, devices } from '@playwright/test';

const defaultPort = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const defaultBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${defaultPort}`;
const defaultDatabaseUrl = process.env.PLAYWRIGHT_DATABASE_URL ?? 'file:../data/app.db';

// Always force the SQLite-backed URL when Playwright owns the dev server so we
// don't accidentally reuse a developer's Postgres/Redis stack.
if (!process.env.PLAYWRIGHT_BASE_URL) {
  process.env.DATABASE_URL = defaultDatabaseUrl;
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: defaultBaseUrl,
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --hostname 127.0.0.1 --port ${defaultPort}`,
        url: `http://127.0.0.1:${defaultPort}`,
        reuseExistingServer: false,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          DATABASE_URL: defaultDatabaseUrl,
          NEXTAUTH_URL: defaultBaseUrl,
          SITE_URL: defaultBaseUrl,
        },
      },
});
