import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteCart } from './RemoteCart';
import { loadSymbiont } from './loadSymbiont';

vi.mock('./loadSymbiont', () => ({ loadSymbiont: vi.fn() }));
beforeEach(() => {
  vi.mocked(loadSymbiont).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
function renderRemote() {
  return render(
    <MemoryRouter initialEntries={['/cart']}>
      <nav aria-label="Host navigation">
        <Link to="/">Overview</Link>
        <Link to="/profile">Profile</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/cart" element={<RemoteCart />} />
          <Route path="/" element={<h1>Host overview</h1>} />
          <Route path="/profile" element={<h1>Host profile</h1>} />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

describe('Host remote failure isolation', () => {
  it('provides loading feedback while the runtime promise is pending', () => {
    vi.mocked(loadSymbiont).mockReturnValue(new Promise(() => {}));
    renderRemote();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Connecting to SYMBIONT',
    );
    expect(
      screen.getByRole('navigation', { name: 'Host navigation' }),
    ).toBeVisible();
  });

  it('renders the exposed component in embedded mode', async () => {
    vi.mocked(loadSymbiont).mockResolvedValue({
      default: ({ mode }) => <h1>SYMBIONT {mode}</h1>,
    });
    renderRemote();
    expect(
      await screen.findByRole('heading', { name: 'SYMBIONT embedded' }),
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('contains rejected remote loads and leaves other Host navigation usable', async () => {
    const user = userEvent.setup();
    vi.mocked(loadSymbiont).mockRejectedValue(new Error('Remote offline'));
    renderRemote();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your cart is resting.',
    );
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Profile' }));
    expect(screen.getByRole('heading', { name: 'Host profile' })).toBeVisible();
  });

  it('contains remote render failures as well as loading failures', async () => {
    const Broken = () => {
      throw new Error('Remote render failed');
    };
    vi.mocked(loadSymbiont).mockResolvedValue({ default: Broken });
    const user = userEvent.setup();
    renderRemote();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your cart is resting.',
    );
    await user.click(screen.getByRole('link', { name: 'Back to overview' }));
    expect(
      screen.getByRole('heading', { name: 'Host overview' }),
    ).toBeVisible();
  });
});
