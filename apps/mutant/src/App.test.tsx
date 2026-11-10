import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMycelium, events, subscribe } from '@microverse/mycelium';
import App from './App';
import Routes from './routes';
import { offersService } from './offers-service';
const cart = {
  itemCount: 2,
  subtotalPaise: 400000,
  shippingPaise: 9900,
  cartRevision: 1,
  revision: 1,
  offerCode: null,
  discountPaise: 0,
  shippingDiscountPaise: 0,
  checkoutPending: false,
};
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-10T12:00:00Z'));
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  sessionStorage.clear();
  offersService.reset();
  const stop = offersService.start();
  createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, {
    ...cart,
    itemCount: 0,
    subtotalPaise: 0,
  });
  stop();
});
afterEach(() => vi.unstubAllEnvs());
describe('MUTANT offers UI', () => {
  it('shows all seeded coupons, details, and standalone preview controls', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Preview this cart' });
    expect(screen.getByRole('banner')).toHaveTextContent('MUTANT');
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Apply SAVE20' })).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: 'Details for SAVE20' }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Minimum product subtotal: ₹3,000.00',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('20% off products');
    await user.click(
      screen.getByRole('button', { name: 'Close coupon details' }),
    );
  });
  it('applies and removes a coupon in its independent local preview', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Preview this cart' });
    await user.click(screen.getByRole('button', { name: 'Preview this cart' }));
    await user.click(screen.getByRole('button', { name: 'Apply WELCOME10' }));
    expect(
      await screen.findByText(/WELCOME10 · Preview applied/),
    ).toBeVisible();
    expect(screen.getByText('₹250.00 saved in this estimate')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Remove coupon' }));
    expect(screen.getByRole('status')).toHaveTextContent('WELCOME10 removed');
  });
  it('consumes real cart facts and publishes a quote without claiming unconfirmed application', async () => {
    const applied = vi.fn();
    const stop = subscribe(events.OFFER_APPLIED, applied);
    document.title = 'Offers | MICROVERSE';
    render(
      <main>
        <Routes mode="embedded" />
      </main>,
    );
    await screen.findByRole('button', { name: 'Apply SAVE20' });
    act(() => {
      createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, {
        ...cart,
        revision: 3,
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply SAVE20' }));
    await waitFor(() =>
      expect(applied.mock.calls.at(-1)?.[0].payload.discountPaise).toBe(80000),
    );
    expect(screen.getByText(/Awaiting Cart confirmation/)).toBeVisible();
    expect(
      screen.queryByText('Standalone cart preview'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(document.title).toBe('Offers | MICROVERSE');
    stop();
  });
  it('blocks applying during checkout and responds to changing eligibility', async () => {
    render(<Routes mode="embedded" />);
    await screen.findByRole('button', { name: 'Apply SAVE20' });
    act(() => {
      createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, {
        ...cart,
        checkoutPending: true,
        revision: 5,
      });
    });
    expect(screen.getByRole('button', { name: 'Apply SAVE20' })).toBeDisabled();
    act(() => {
      createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, {
        ...cart,
        subtotalPaise: 200000,
        revision: 6,
      });
    });
    expect(screen.getByRole('button', { name: 'Apply SAVE20' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Apply WELCOME10' }),
    ).toBeEnabled();
  });
  it('supports standalone branding override', async () => {
    vi.stubEnv('VITE_APP_LABEL', 'Local offers');
    render(<App />);
    await screen.findByRole('button', { name: 'Preview this cart' });
    expect(screen.getByRole('banner')).toHaveTextContent('Local offers');
  });
});
