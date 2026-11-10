import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createMycelium, events } from '@microverse/mycelium';
import { server } from './test-setup';
import { getOffers, validateOffer } from './client';
import Routes from '../routes';
import { offersService } from '../offers-service';
const cart = {
  itemCount: 2,
  subtotalPaise: 300000,
  shippingPaise: 9900,
  cartRevision: 1,
  revision: 100,
  discountPaise: 0,
  shippingDiscountPaise: 0,
  offerCode: null,
  checkoutPending: false,
};
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-10T12:00:00Z'));
  sessionStorage.clear();
  offersService.reset();
});
describe('MUTANT mock validation', () => {
  it('serves all seeds and validates percentage/delivery savings', async () => {
    expect((await getOffers()).map((coupon) => coupon.code)).toEqual([
      'WELCOME10',
      'SAVE20',
      'FREESHIP',
    ]);
    expect((await validateOffer('SAVE20', cart)).quote?.discountPaise).toBe(
      60000,
    );
    expect((await validateOffer('WELCOME10', cart)).quote?.discountPaise).toBe(
      30000,
    );
    expect(
      (await validateOffer('FREESHIP', cart)).quote?.shippingDiscountPaise,
    ).toBe(9900);
  });
  it('rejects unknown, ineligible, processing and malformed input', async () => {
    await expect(validateOffer('NOPE', cart)).rejects.toMatchObject({
      status: 404,
    });
    expect(
      (await validateOffer('SAVE20', { ...cart, subtotalPaise: 100000 }))
        .eligible,
    ).toBe(false);
    expect(
      (await validateOffer('SAVE20', { ...cart, checkoutPending: true }))
        .eligible,
    ).toBe(false);
    await expect(
      validateOffer('SAVE20', { ...cart, subtotalPaise: -1 }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it('keeps the selection unchanged when HTTP validation fails', async () => {
    render(<Routes mode="embedded" />);
    await screen.findByRole('button', { name: 'Apply SAVE20' });
    act(() => {
      createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, cart);
    });
    server.use(
      http.post('*/api/offers/validate', () =>
        HttpResponse.json(
          { message: 'Validation unavailable' },
          { status: 503 },
        ),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply SAVE20' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Validation unavailable',
    );
    expect(offersService.getSnapshot().code).toBeNull();
  });
  it('rejects a validation response for a cart that changed while awaiting HTTP', async () => {
    render(<Routes mode="embedded" />);
    await screen.findByRole('button', { name: 'Apply SAVE20' });
    act(() => {
      createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, {
        ...cart,
        revision: 101,
      });
    });
    let markStarted: (() => void) | undefined;
    let release: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const responseGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post('*/api/offers/validate', async () => {
        markStarted?.();
        await responseGate;
        return HttpResponse.json({
          eligible: true,
          reason: 'Eligible',
          quote: {
            code: 'SAVE20',
            cartRevision: 1,
            discountPaise: 60000,
            shippingDiscountPaise: 0,
            expiresAt: '2027-12-31T23:59:59.999Z',
          },
        });
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply SAVE20' }));
    await started;
    act(() => {
      createMycelium('symbiont').publish(events.CART_PRICING_UPDATED, {
        ...cart,
        cartRevision: 2,
        revision: 102,
      });
      release?.();
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cart changed during validation',
    );
    expect(offersService.getSnapshot().code).toBeNull();
  });
  it('shows an empty offers response', async () => {
    server.use(http.get('*/api/offers', () => HttpResponse.json([])));
    render(<Routes />);
    expect(
      await screen.findByRole('heading', { name: 'No offers available' }),
    ).toBeVisible();
  });
});
