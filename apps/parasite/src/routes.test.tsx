import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ParasiteRoutes from './routes';

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  document.title = 'Products | MICROVERSE';
});
afterEach(() => {
  vi.unstubAllGlobals();
});
function renderEmbedded(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <header>Host shell</header>
      <main>
        <Routes>
          <Route
            path="/products/*"
            element={<ParasiteRoutes mode="embedded" />}
          />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

describe('PARASITE exposed route contract', () => {
  it('uses the Host router and shell without adding another main or standalone header', async () => {
    renderEmbedded('/products');
    expect(
      await screen.findByRole('heading', { name: /Good things/ }),
    ).toBeVisible();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(
      screen.getByRole('region', { name: 'PARASITE products' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Catalog navigation' }),
    ).not.toBeInTheDocument();
    expect(document.title).toBe('Products | MICROVERSE');
    expect(screen.getByText('Host shell')).toBeVisible();
  });

  it('opens details under the Host products route and returns with filters intact', async () => {
    const user = userEvent.setup();
    renderEmbedded('/products?q=moss&category=Workspace');
    await user.click(
      await screen.findByRole('link', {
        name: 'View Moss self-watering planter',
      }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Moss self-watering planter',
        level: 1,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Back to collection' }),
    ).toHaveAttribute('href', '/products?q=moss&category=Workspace');
    await user.click(screen.getByRole('link', { name: 'Back to collection' }));
    expect(
      await screen.findByRole('searchbox', { name: 'Search products' }),
    ).toHaveValue('moss');
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('handles a direct embedded detail URL and keeps unavailable items disabled', async () => {
    renderEmbedded('/products/glasshouse-terrarium');
    expect(
      await screen.findByRole('heading', { name: 'Glasshouse terrarium' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Add Glasshouse terrarium to cart' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('link', { name: 'Back to collection' }),
    ).toHaveAttribute('href', '/products');
  });
});
