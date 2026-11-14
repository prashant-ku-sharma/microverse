import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
/** CI-only browser acceptance against the existing Host. No Host build/deploy API is called. */
export async function smokeRegistry(host, registry, mode = 'candidate') {
  const browserEnv = { ...process.env };
  delete browserEnv.NETLIFY_AUTH_TOKEN;
  const browser = await chromium.launch({ env: browserEnv });
  const directory = `deployment/.local/smoke/${mode}`;
  await mkdir(directory, { recursive: true });
  const paths = {
    parasite: '/products',
    symbiont: '/cart',
    commensal: '/profile',
    mutant: '/offers',
  };
  const labels = {
    parasite: 'PARASITE products',
    symbiont: 'SYMBIONT cart',
    commensal: 'COMMENSAL profile',
    mutant: 'MUTANT offers',
  };
  const headings = {
    parasite: 'The collection',
    symbiont: 'Good things, better together.',
    commensal: 'Make yourself at home.',
    mutant: 'Available coupons',
  };
  try {
    const context = await browser.newContext();
    if (mode === 'candidate')
      await context.route(host + '/nucleus/remotes.json', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(registry),
        }),
      );
    const page = await context.newPage();
    for (const [id, path] of Object.entries(paths)) {
      const [configuration] = await Promise.all([
        page.waitForResponse(
          (response) => response.url() === host + '/nucleus/remotes.json',
          { timeout: 30000 },
        ),
        page.goto(host + path, { waitUntil: 'domcontentloaded' }),
      ]);
      expect(await configuration.json()).toEqual(registry);
      if (!registry.remotes[id].enabled) {
        await expect(
          page.getByRole('heading', {
            name: `${id.toUpperCase()} is disabled.`,
            exact: true,
          }),
        ).toBeVisible({ timeout: 30000 });
      } else {
        await expect(page.locator(`[aria-label="${labels[id]}"]`)).toBeVisible({
          timeout: 30000,
        });
        await expect(
          page.getByRole('heading', { name: headings[id], exact: true }),
        ).toBeVisible({ timeout: 30000 });
        // The Host validates every selected release expose before this route can render.
        if (id === 'symbiont')
          await expect(
            page.getByText(`SYMBIONT v${registry.remotes.symbiont.version}`, {
              exact: true,
            }),
          ).toBeVisible();
      }
      await page.screenshot({ path: `${directory}/${id}.png`, fullPage: true });
    }
    await context.close();
    return {
      mode,
      routes: Object.values(paths),
      symbiontVersion: registry.remotes.symbiont.version,
    };
  } finally {
    await browser.close();
  }
}
