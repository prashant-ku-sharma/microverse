import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
const nav = (page: Page) =>
  page.getByRole('navigation', { name: 'Application navigation' });
async function addPlanter(page: Page) {
  await page.goto('/');
  await nav(page).getByRole('link', { name: 'Products', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Add Moss self-watering planter to cart',
      exact: true,
    })
    .click();
  await expect(
    nav(page).getByRole('link', { name: 'Cart (1 item)', exact: true }),
  ).toBeVisible();
}
async function cart(page: Page) {
  await nav(page).getByRole('link', { name: /^Cart/ }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Good things, better together.',
      exact: true,
    }),
  ).toBeVisible();
}
async function summary(page: Page, label: string, amount: string) {
  const key =
    label === 'Subtotal'
      ? 'subtotal'
      : label === 'Total'
        ? 'total'
        : 'discount';
  await expect(
    page.getByRole('complementary', { name: 'Order summary' }).getByTestId(key),
  ).toContainText(amount);
}
interface ArtifactEvidence {
  mode: string;
  hostArtifact: string;
  hostArtifactNow: string;
  hostFileCount: number;
  symbiontEntries: Record<string, string>;
}
async function artifactEvidence(
  request: APIRequestContext,
): Promise<ArtifactEvidence> {
  const response = await request.get('/__e2e/evidence');
  expect(response.ok()).toBeTruthy();
  const body: unknown = await response.json();
  const sha = expect.stringMatching(/^[a-f0-9]{64}$/);
  expect(body).toEqual(
    expect.objectContaining({
      mode: 'local-static-publication-not-Netlify',
      hostArtifact: sha,
      hostArtifactNow: sha,
      hostFileCount: expect.any(Number),
      symbiontEntries: expect.objectContaining({ '1.0.0': sha, '1.0.1': sha }),
    }),
  );
  const evidence = body as ArtifactEvidence;
  expect(evidence.hostFileCount).toBeGreaterThan(0);
  expect(evidence.symbiontEntries['1.0.0']).not.toBe(
    evidence.symbiontEntries['1.0.1'],
  );
  return evidence;
}
test.beforeEach(async ({ request }) => {
  const response = await request.post('/__e2e/control', {
    data: { reset: true },
  });
  expect(response.ok()).toBeTruthy();
});
test('A: real Product → Cart → Host count, quantity and total', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await addPlanter(page);
  await cart(page);
  await expect(
    page.getByRole('heading', {
      name: 'Moss self-watering planter',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Increase Moss self-watering planter quantity',
      exact: true,
    })
    .click();
  await expect(
    nav(page).getByRole('link', { name: 'Cart (2 items)', exact: true }),
  ).toBeVisible();
  await summary(page, 'Subtotal', '₹2,980.00');
  await summary(page, 'Total', '₹3,079.00');
  await nav(page).getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Mycelium event activity' }),
  ).toContainText('microverse:product:added');
  await expect(
    page.getByRole('region', { name: 'Mycelium event activity' }),
  ).toContainText('microverse:cart:updated');
  expect(errors).toEqual([]);
});
test('B: Cart → Offers eligibility, apply/remove coupon and confirmed totals', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-14T12:00:00Z'));
  await addPlanter(page);
  await cart(page);
  await page
    .getByRole('button', {
      name: 'Increase Moss self-watering planter quantity',
      exact: true,
    })
    .click();
  await expect(
    nav(page).getByRole('link', { name: 'Cart (2 items)', exact: true }),
  ).toBeVisible();
  await nav(page).getByRole('link', { name: 'Offers', exact: true }).click();
  await page
    .getByRole('button', { name: 'Apply WELCOME10', exact: true })
    .click();
  await expect(
    page.getByText('Confirmed in Cart', { exact: false }),
  ).toBeVisible();
  await cart(page);
  await summary(page, 'Coupon discount', '₹298.00');
  await summary(page, 'Total', '₹2,781.00');
  await nav(page).getByRole('link', { name: 'Offers', exact: true }).click();
  await page
    .getByRole('button', { name: 'Remove coupon', exact: true })
    .click();
  await cart(page);
  await summary(page, 'Coupon discount', '₹0.00');
  await summary(page, 'Total', '₹3,079.00');
});
test('C: Profile saves through its API, persists on refresh and announces a private fact', async ({
  page,
}) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Jordan Integration Rao');
  await page.getByLabel('City', { exact: true }).fill('Pune');
  await page
    .getByRole('switch', { name: 'Offers and coupons', exact: true })
    .check();
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Profile saved');
  await nav(page).getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Mycelium event activity' }),
  ).toContainText('microverse:profile:updated');
  await page.goto('/profile');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Jordan Integration Rao',
  );
  await expect(page.getByLabel('City', { exact: true })).toHaveValue('Pune');
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Jordan Integration Rao',
  );
  await page.goto('http://127.0.0.1:5003/');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Avery Rao',
  );
  await page.goto('/profile');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Jordan Integration Rao',
  );
});
test('D: unavailable Products is isolated; Cart, Profile and Offers stay usable; retry recovers', async ({
  page,
  request,
}) => {
  await request.post('/__e2e/control', { data: { offline: ['parasite'] } });
  await page.goto('/products');
  await expect(
    page.getByRole('heading', { name: 'Products are resting.', exact: true }),
  ).toBeVisible();
  for (const [label, heading] of [
    ['Profile', 'Make yourself at home.'],
    ['Offers', 'Available coupons'],
  ] as const) {
    await nav(page).getByRole('link', { name: label, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
  await cart(page);
  await expect(
    page.getByText('Room for something good.', { exact: true }),
  ).toBeVisible();
  await request.post('/__e2e/control', { data: { offline: [] } });
  await nav(page).getByRole('link', { name: 'Products', exact: true }).click();
  await page.getByRole('button', { name: 'Retry remote', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'The collection', exact: true }),
  ).toBeVisible();
});
test('E: independently publish a local Cart artifact, promote and roll back without a Host rebuild', async ({
  page,
  request,
}, testInfo) => {
  await page.goto('/cart');
  await expect(
    page.getByText('SYMBIONT v1.0.0', { exact: true }),
  ).toBeVisible();
  const before = await artifactEvidence(request);
  const publication = await (
    await request.post('/__e2e/control', { data: { publish: '1.0.1' } })
  ).json();
  expect(publication.published).toContain('1.0.1');
  expect(
    (
      await request.get('http://127.0.0.1:5002/releases/1.0.1/remoteEntry.js')
    ).ok(),
  ).toBeTruthy();
  await request.post('/__e2e/control', { data: { symbiontVersion: '1.0.1' } });
  await page.reload();
  await expect(
    page.getByText('SYMBIONT v1.0.1', { exact: true }),
  ).toBeVisible();
  const promoted = await artifactEvidence(request);
  expect(promoted.hostArtifactNow).toBe(before.hostArtifact);
  expect(promoted.hostArtifact).toBe(before.hostArtifact);
  await request.post('/__e2e/control', { data: { symbiontVersion: '1.0.0' } });
  await page.reload();
  await expect(
    page.getByText('SYMBIONT v1.0.0', { exact: true }),
  ).toBeVisible();
  const rolledBack = await artifactEvidence(request);
  expect(rolledBack.hostArtifactNow).toBe(before.hostArtifact);
  expect(
    (
      await request.get('http://127.0.0.1:5002/releases/1.0.1/remoteEntry.js')
    ).ok(),
  ).toBeTruthy();
  await testInfo.attach('local-publication-evidence', {
    body: JSON.stringify({ before, promoted, rolledBack }, null, 2),
    contentType: 'application/json',
  });
});
test('F: incompatible Cart is gracefully rejected while Products and Profile work', async ({
  page,
  request,
}) => {
  await request.post('/__e2e/control', { data: { incompatible: true } });
  await page.goto('/cart');
  await expect(
    page.getByRole('heading', {
      name: 'SYMBIONT needs a compatible release.',
      exact: true,
    }),
  ).toBeVisible();
  await nav(page).getByRole('link', { name: 'Products', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'The collection', exact: true }),
  ).toBeVisible();
  await nav(page).getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Edit profile', exact: true }),
  ).toBeVisible();
});
test('invalid registry selects a validated fallback and leaves actual remote loading functional', async ({
  page,
  request,
}) => {
  await request.post('/__e2e/control', { data: { invalidRegistry: true } });
  await page.goto('/products');
  await expect(
    page.getByText(/Primary configuration was unavailable or invalid/).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The collection', exact: true }),
  ).toBeVisible();
});
test('loading, empty and API error states keep navigation usable', async ({
  page,
}) => {
  await page.goto('/products?mock-products=slow');
  await expect(
    page.getByText('Loading collection', { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The collection', exact: true }),
  ).toBeVisible();
  await page.goto('/products?mock-products=empty');
  await expect(page.getByText(/No products/).first()).toBeVisible();
  await page.goto('/products?mock-products=error');
  await expect(page.getByText(/could not|unavailable/i).first()).toBeVisible();
  await expect(
    nav(page).getByRole('link', { name: 'Profile', exact: true }),
  ).toBeVisible();
});
test('keyboard navigation, phone layout and all five standalone applications', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Skip to content', exact: true })
    .focus();
  await expect(
    page.getByRole('link', { name: 'Skip to content', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click();
  await nav(page).getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Make yourself at home.', exact: true }),
  ).toBeVisible();
  for (const [port, heading] of [
    [5000, 'A living system.'],
    [5001, 'Good things.'],
    [5002, 'Good things, better together.'],
    [5003, 'Make yourself at home.'],
    [5004, 'Available coupons'],
  ] as const) {
    await page.goto(`http://127.0.0.1:${port}/`);
    await expect(
      page
        .getByRole('heading', {
          name: new RegExp(heading.replace(/[.]/g, '\\.')),
        })
        .first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test('checkout commits a simulated receipt, clears Cart count and emits its completion fact', async ({
  page,
}) => {
  await addPlanter(page);
  await cart(page);
  await page
    .getByRole('button', { name: 'Simulate checkout', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'A little good, on its way.',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    nav(page).getByRole('link', { name: 'Cart (0 items)', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('₹1,589.00', { exact: true })).toBeVisible();
  await nav(page).getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Mycelium event activity' }),
  ).toContainText('microverse:checkout:completed');
  await page.goto('/cart');
  await expect(
    page.getByText('Room for something good.', { exact: true }),
  ).toBeVisible();
});
