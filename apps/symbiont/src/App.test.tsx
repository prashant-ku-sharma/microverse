import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { cartService } from './cart-service';
import SymbiontRoutes from './routes';

vi.mock('./data/sample-cart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./data/sample-cart')>();
  return {
    sampleCart: actual.sampleCart.map((item) => ({
      ...item,
      image: new URL(new URL(item.image).pathname, 'http://127.0.0.1:5002')
        .href,
    })),
  };
});

beforeEach(() => {
  sessionStorage.clear();
  cartService.reset();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

function renderSampleCart() {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Load sample cart' }));
  return view;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
describe('SYMBIONT application', () => {
  it('shows its standalone shell, products, quantities, discount and total', () => {
    renderSampleCart();
    expect(screen.getByRole('banner')).toHaveTextContent('SYMBIONT');
    expect(screen.getByRole('main')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByTestId('subtotal')).toHaveTextContent('₹5,346.00');
    expect(screen.getByTestId('discount')).toHaveTextContent('₹534.60');
    expect(screen.getByTestId('total')).toHaveTextContent('₹4,811.40');
    expect(screen.getByText('Cart saved in this tab')).toBeVisible();
    expect(
      screen.getByRole('img', { name: 'Lumen task light' }),
    ).toHaveAttribute(
      'src',
      expect.stringContaining('/images/lumen-light.svg'),
    );
  });
  it('updates quantities and totals and enforces minimum and stock limits', async () => {
    const user = userEvent.setup();
    renderSampleCart();
    const increase = screen.getByRole('button', {
      name: 'Increase Lumen task light quantity',
    });
    const decrease = screen.getByRole('button', {
      name: 'Decrease Lumen task light quantity',
    });
    expect(decrease).toBeDisabled();
    await user.click(increase);
    expect(
      screen.getByLabelText('Lumen task light quantity'),
    ).toHaveTextContent('2');
    expect(screen.getByTestId('total')).toHaveTextContent('₹7,780.50');
    await user.click(increase);
    await user.click(increase);
    expect(increase).toBeDisabled();
    await user.click(decrease);
    expect(
      screen.getByLabelText('Lumen task light quantity'),
    ).toHaveTextContent('3');
  });
  it('removes items, reaches an empty state, and restores sample data', async () => {
    const user = userEvent.setup();
    renderSampleCart();
    for (const name of [
      'Arc ceramic mug',
      'Lumen task light',
      'Seed pocket notebook',
    ])
      await user.click(screen.getByRole('button', { name: `Remove ${name}` }));
    expect(
      screen.getByRole('heading', { name: 'Room for something good.' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Simulate checkout' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load sample cart' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Clear cart' }));
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
  it('simulates checkout once, locks editing, and confirms an accurate immutable receipt', async () => {
    vi.useFakeTimers();
    renderSampleCart();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Arc ceramic mug' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simulate checkout' }));
    expect(
      screen.getByRole('button', { name: 'Simulating checkout…' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear cart' })).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'Increase Lumen task light quantity',
      }),
    ).toBeDisabled();
    await act(() => vi.advanceTimersByTimeAsync(900));
    const heading = screen.getByRole('heading', {
      name: 'Demo order confirmed',
    });
    expect(heading).toHaveFocus();
    expect(screen.getByText('₹3,373.20')).toBeVisible();
    expect(
      screen.getByText('2 items in your receipt. Your cart is now empty.'),
    ).toBeVisible();
    expect(screen.getByText(/No payment was taken/)).toBeVisible();
    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', { name: 'Start another sample cart' }),
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.queryByText('Demo order confirmed')).not.toBeInTheDocument();
  });
  it('uses the Host shell and theme without adding a main, header, or changing its title', () => {
    document.title = 'Cart | MICROVERSE';
    render(
      <main>
        <SymbiontRoutes mode="embedded" />
      </main>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'SYMBIONT cart' })).toBeVisible();
    expect(document.title).toBe('Cart | MICROVERSE');
  });
  it('cleans up pending checkout on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderSampleCart();
    fireEvent.click(screen.getByRole('button', { name: 'Simulate checkout' }));
    unmount();
    expect(cartService.getSnapshot().cart.phase).toBe('cart');
    expect(cartService.getSnapshot().cart.order).toBeNull();
  });
  it('supports the standalone branding override', () => {
    vi.stubEnv('VITE_APP_LABEL', 'Local organism');
    renderSampleCart();
    expect(screen.getByRole('banner')).toHaveTextContent('Local organism');
    expect(document.title).toBe('Local organism | Cart & checkout');
  });
});
