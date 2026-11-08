import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteProducts } from './RemoteProducts';
import { loadParasite } from './loadParasite';

vi.mock('./loadParasite', () => ({ loadParasite: vi.fn() }));
beforeEach(() => {
  vi.mocked(loadParasite).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
function renderRemote() {
  return render(
    <MemoryRouter initialEntries={['/products']}>
      <nav aria-label="Host navigation">
        <Link to="/">Overview</Link>
        <Link to="/cart">Cart</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/products/*" element={<RemoteProducts />} />
          <Route path="/" element={<h1>Host overview</h1>} />
          <Route path="/cart" element={<h1>Host cart</h1>} />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

describe('Host remote failure isolation', () => {
  it('provides loading feedback while the runtime promise is pending', () => {
    vi.mocked(loadParasite).mockReturnValue(new Promise(() => {}));
    renderRemote();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Connecting to PARASITE',
    );
    expect(
      screen.getByRole('navigation', { name: 'Host navigation' }),
    ).toBeVisible();
  });

  it('renders the exposed component in embedded mode', async () => {
    vi.mocked(loadParasite).mockResolvedValue({
      default: ({ mode }) => <h1>PARASITE {mode}</h1>,
    });
    renderRemote();
    expect(
      await screen.findByRole('heading', { name: 'PARASITE embedded' }),
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('contains rejected remote loads and leaves other Host navigation usable', async () => {
    const user = userEvent.setup();
    vi.mocked(loadParasite).mockRejectedValue(new Error('Remote offline'));
    renderRemote();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Products are resting.',
    );
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Cart' }));
    expect(screen.getByRole('heading', { name: 'Host cart' })).toBeVisible();
  });

  it('contains remote render failures as well as loading failures', async () => {
    const Broken = () => {
      throw new Error('Remote render failed');
    };
    vi.mocked(loadParasite).mockResolvedValue({ default: Broken });
    const user = userEvent.setup();
    renderRemote();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Products are resting.',
    );
    await user.click(screen.getByRole('link', { name: 'Back to overview' }));
    expect(
      screen.getByRole('heading', { name: 'Host overview' }),
    ).toBeVisible();
  });
});
