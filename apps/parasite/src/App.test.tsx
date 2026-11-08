import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { microverseTheme } from '@microverse/shared-ui';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

async function renderCatalog(path = '/') {
  const view = render(
    <ThemeProvider theme={microverseTheme}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>,
  );
  await screen.findByRole('heading', { level: 1 });
  return view;
}
function productCard(name: string) {
  return screen.getByRole('article', { name });
}
function visibleProductNames() {
  return screen
    .getAllByRole('article')
    .map((article) => within(article).getByRole('heading').textContent);
}

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('PARASITE standalone catalog', () => {
  it('lists local products with prices, ratings, category, image, and stock', async () => {
    await renderCatalog();
    expect(screen.getAllByRole('article')).toHaveLength(12);
    const moss = productCard('Moss self-watering planter');
    expect(within(moss).getByText('₹1,490')).toBeVisible();
    expect(
      within(moss).getByRole('img', { name: '4.8 out of 5 stars' }),
    ).toBeVisible();
    expect(
      within(moss).getByRole('img', { name: 'Moss self-watering planter' }),
    ).toHaveAttribute(
      'src',
      expect.stringContaining('/images/products/moss-planter.svg'),
    );
    expect(within(moss).getByText('Workspace')).toBeVisible();
    expect(within(moss).getByText('In stock')).toBeVisible();
    expect(
      screen.getByRole('navigation', { name: 'Catalog navigation' }),
    ).toBeVisible();
  });

  it('searches and resets a no-results state', async () => {
    const user = userEvent.setup();
    await renderCatalog();
    const search = screen.getByRole('searchbox', { name: 'Search products' });
    await user.type(search, '  HERB  ');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(productCard('Canopy herb grow kit')).toBeVisible();
    await user.clear(search);
    await user.type(search, 'does not exist');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText('No products found')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(screen.getAllByRole('article')).toHaveLength(12);
    expect(search).toHaveValue('');
  });

  it('combines category and in-stock filtering and resets the controls', async () => {
    const user = userEvent.setup();
    await renderCatalog();
    await user.click(screen.getByRole('button', { name: 'Grow kits' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Grow kits' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('checkbox', { name: 'In stock only' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(
      screen.queryByRole('article', { name: 'Glasshouse terrarium' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(
      screen.getByRole('checkbox', { name: 'In stock only' }),
    ).not.toBeChecked();
    expect(screen.getAllByRole('article')).toHaveLength(12);
  });

  it('sorts the rendered catalog by price, rating, and name', async () => {
    const user = userEvent.setup();
    await renderCatalog();
    const sort = screen.getByRole('combobox', { name: 'Sort by' });
    for (const [value, first] of [
      ['price-asc', 'Seed pocket tin'],
      ['price-desc', 'Fern task lamp'],
      ['rating', 'Field insulated bottle'],
      ['name', 'Canopy herb grow kit'],
      ['featured', 'Moss self-watering planter'],
    ]) {
      await user.selectOptions(sort, value ?? 'featured');
      expect(visibleProductNames()[0]).toBe(first);
    }
  });

  it.each(['View Moss self-watering planter', 'Take a closer look'])(
    'preserves catalog choices when entering details through %s',
    async (linkName) => {
      const user = userEvent.setup();
      await renderCatalog(
        '/?category=Workspace&q=moss&sort=price-desc&stock=available',
      );
      await user.click(screen.getByRole('link', { name: linkName }));
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Moss self-watering planter',
        }),
      ).toBeVisible();
      expect(screen.getByText('Glazed stoneware, cotton wick')).toBeVisible();
      expect(screen.getByText('Fits a 10 cm nursery pot')).toBeVisible();
      expect(screen.getByRole('main')).toHaveFocus();
      expect(document.title).toBe('Moss self-watering planter | PARASITE');
      await user.click(
        screen.getByRole('link', { name: 'Back to collection' }),
      );
      await screen.findAllByRole('article');
      expect(
        screen.getByRole('searchbox', { name: 'Search products' }),
      ).toHaveValue('moss');
      expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue(
        'price-desc',
      );
      expect(
        screen.getByRole('checkbox', { name: 'In stock only' }),
      ).toBeChecked();
      expect(screen.getByRole('button', { name: 'Workspace' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getAllByRole('article')).toHaveLength(1);
    },
  );

  it('renders unavailable products directly and disables their cart action', async () => {
    await renderCatalog('/products/glasshouse-terrarium');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Glasshouse terrarium' }),
    ).toBeVisible();
    expect(screen.getByText('Out of stock')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Add Glasshouse terrarium to cart' }),
    ).toBeDisabled();
  });

  it('labels low stock and disables unavailable actions in the listing', async () => {
    await renderCatalog();
    expect(
      within(productCard('Spore oyster mushroom kit')).getByText('Only 2 left'),
    ).toBeVisible();
    expect(
      within(productCard('Strata desk tray')).getByRole('button', {
        name: 'Add Strata desk tray to cart',
      }),
    ).toBeDisabled();
  });

  it('acknowledges cart intent honestly without publishing an event or changing stock', async () => {
    const user = userEvent.setup();
    const added = vi.fn();
    window.addEventListener('microverse:product:added', added);
    try {
      await renderCatalog('/products/moss-planter');
      await user.click(
        screen.getByRole('button', {
          name: 'Add Moss self-watering planter to cart',
        }),
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No item has been added.',
      );
      expect(screen.getByText(/18 units in sample inventory/)).toBeVisible();
      expect(added).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Close' }));
    } finally {
      window.removeEventListener('microverse:product:added', added);
    }
  });

  it('opens standalone category navigation', async () => {
    const user = userEvent.setup();
    await renderCatalog();
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Everyday carry',
      }),
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Everyday carry' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([
    ['/products/missing', 'Product not found'],
    ['/missing', 'Page not found'],
  ])('recovers %s with a catalog link', async (path, heading) => {
    const user = userEvent.setup();
    await renderCatalog(path);
    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Back to collection' }));
    await screen.findAllByRole('article');
    expect(screen.getAllByRole('article')).toHaveLength(12);
  });

  it('supports the standalone storefront branding override', async () => {
    vi.stubEnv('VITE_APP_LABEL', 'LOCAL PARASITE');
    await renderCatalog();
    expect(
      screen.getByRole('link', { name: 'LOCAL PARASITE catalog home' }),
    ).toBeVisible();
  });
});
