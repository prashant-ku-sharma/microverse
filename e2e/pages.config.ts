import { defineConfig, devices } from '@playwright/test';
const live = process.env.PAGES_URL;
export default defineConfig({
  testDir: '.',
  testMatch: 'pages.smoke.ts',
  workers: 1,
  timeout: 60000,
  expect: { timeout: 20000 },
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: live ?? 'http://127.0.0.1:5010/microverse/',
    trace: 'retain-on-failure',
  },
  ...(live
    ? {}
    : {
        webServer: {
          command: 'node e2e/pages-server.mjs',
          cwd: new URL('..', import.meta.url).pathname,
          url: 'http://127.0.0.1:5010/microverse/',
          timeout: 10000,
        },
      }),
});
