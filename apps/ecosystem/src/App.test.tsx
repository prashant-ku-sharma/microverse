import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { microverseTheme } from '@microverse/shared-ui';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function renderHost(path = '/', desktop = true) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: desktop && query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  return render(
    <ThemeProvider theme={microverseTheme}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Ecosystem Host', () => {
  it('renders four organism cards and honest status/activity placeholders', () => {
    renderHost();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'A living system.',
    );
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getAllByText('Not connected')).toHaveLength(4);
    expect(screen.getByText(/not a live event feed/)).toBeVisible();
    expect(
      screen.getByRole('img', { name: /One host, four independent organisms/ }),
    ).toBeVisible();
    expect(document.title).toBe('Overview | MICROVERSE');
  });

  it('navigates the sidebar and marks only the current link active', async () => {
    const user = userEvent.setup();
    renderHost();
    const nav = screen.getByRole('navigation', {
      name: 'Application navigation',
    });
    for (const name of [
      'Products',
      'Cart',
      'Profile',
      'Offers',
      'Ecosystem',
      'Overview',
    ]) {
      await user.click(within(nav).getByRole('link', { name }));
      expect(within(nav).getByRole('link', { name })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        within(nav)
          .getAllByRole('link')
          .filter((link) => link.getAttribute('aria-current') === 'page'),
      ).toHaveLength(1);
    }
  });

  it.each([
    ['/products', 'Products', 'PARASITE'],
    ['/cart', 'Cart', 'SYMBIONT'],
    ['/profile', 'Profile', 'COMMENSAL'],
    ['/offers', 'Offers', 'MUTANT'],
  ])('renders %s directly as a Host-owned placeholder', (path, title, name) => {
    renderHost(path);
    expect(
      screen.getByRole('heading', { level: 1, name: title }),
    ).toBeVisible();
    expect(screen.getByText(`${name} / ORGANISM`)).toBeVisible();
    expect(screen.getByText('Host-owned placeholder')).toBeVisible();
    expect(document.title).toBe(`${title} | MICROVERSE`);
  });

  it('renders the ecosystem route and recovers unknown routes', async () => {
    const user = userEvent.setup();
    renderHost('/unknown');
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Back to overview' }));
    await user.click(
      screen.getByRole('link', { name: 'Explore the ecosystem' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Built to grow together.' }),
    ).toBeVisible();
  });

  it('opens organism routes from dashboard shortcuts', async () => {
    const user = userEvent.setup();
    renderHost();
    await user.click(screen.getByRole('link', { name: 'Open products' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Products' }),
    ).toBeVisible();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('opens, dismisses, and closes mobile navigation on selection', async () => {
    const user = userEvent.setup();
    renderHost('/', false);
    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    await user.click(screen.getByRole('link', { name: 'Cart' }));
    expect(
      await screen.findByRole('heading', { name: 'Cart', level: 1 }),
    ).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(
      screen.getByRole('dialog', { name: 'Application navigation panel' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Explore the architecture' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Built to grow together.' }),
    ).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports the Host branding override', () => {
    vi.stubEnv('VITE_APP_LABEL', 'LOCAL HABITAT');
    renderHost();
    expect(screen.getByText('LOCAL HABITAT')).toBeVisible();
  });
});
