import { test, expect } from '@playwright/test';
test('Pages subpath: four real remotes, mock APIs, events and hash-route refresh', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  const nav = page.getByRole('navigation', { name: 'Application navigation' });
  await nav.getByRole('link', { name: 'Products', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Add Moss self-watering planter to cart',
      exact: true,
    })
    .click();
  await expect(
    nav.getByRole('link', { name: 'Cart (1 item)', exact: true }),
  ).toBeVisible();
  const hero = page.getByRole('img', {
    name: 'Self-watering planter with sculptural green leaves',
    exact: true,
  });
  await expect(hero).toBeVisible();
  await expect
    .poll(() =>
      hero.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page
    .getByRole('link', { name: 'Explore the collection', exact: true })
    .click();
  expect(page.url()).toContain('/microverse/#/products');
  await page
    .getByRole('link', { name: 'Skip to content', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  expect(page.url()).toContain('/microverse/#/products');
  await expect(page.locator('#main-content')).toBeFocused();

  await nav.getByRole('link', { name: /^Cart/ }).click();
  await page
    .getByRole('button', {
      name: 'Increase Moss self-watering planter quantity',
      exact: true,
    })
    .click();
  await expect(page.getByTestId('subtotal')).toContainText('₹2,980.00');
  await nav.getByRole('link', { name: 'Offers', exact: true }).click();
  await page
    .getByRole('button', { name: 'Apply WELCOME10', exact: true })
    .click();
  await expect(
    page.getByText('Confirmed in Cart', { exact: false }),
  ).toBeVisible();
  await nav.getByRole('link', { name: /^Cart/ }).click();
  await expect(page.getByTestId('discount')).toContainText('₹298.00');
  await expect(page.getByTestId('total')).toContainText('₹2,781.00');
  await nav.getByRole('link', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Pages verification');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Profile saved');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Pages verification',
  );
  expect(page.url()).toContain('/microverse/#/profile');
  expect(errors).toEqual([]);
});
test('Pages standalone entry points load independently', async ({
  page,
  request,
  baseURL,
}) => {
  const registry = await (
    await request.get(new URL('nucleus/remotes.json', baseURL).href)
  ).json();
  for (const [id, heading] of [
    ['parasite', 'The collection'],
    ['symbiont', 'Good things, better together.'],
    ['commensal', 'Make yourself at home.'],
    ['mutant', 'Available coupons'],
  ] as const) {
    const entry = new URL(registry.remotes[id].entry);
    const versionPath = entry.pathname.slice(
      entry.pathname.indexOf('/remotes/'),
      -'remoteEntry.js'.length,
    );
    await page.goto(new URL(`.${versionPath}`, baseURL).href);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
});

test('habitat navigation shows a full-page loader immediately through module and data loading', async ({
  page,
}, testInfo) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/remotes/parasite/**/remoteEntry.js', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('./?mock-products=slow');
  await page
    .getByRole('navigation', { name: 'Application navigation' })
    .getByRole('link', { name: 'Products', exact: true })
    .click();
  try {
    const status = page.getByRole('status');
    await expect(status).toContainText('Connecting to PARASITE', {
      timeout: 1500,
    });
    await expect(status).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    const overlay = page.getByLabel('Page loading', { exact: true });
    const box = await overlay.boundingBox();
    expect(box).toEqual({ x: 0, y: 0, ...page.viewportSize() });
    await page.screenshot({
      path: testInfo.outputPath('full-page-loading.png'),
    });
  } finally {
    release();
  }
  await expect(page.getByRole('status')).toContainText('Loading collection');
  await expect(
    page.getByRole('heading', { name: 'The collection', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Page loading', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Application navigation' }),
  ).toBeVisible();
});
