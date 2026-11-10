import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMycelium, events, subscribe } from '@microverse/mycelium';
import type { CartPricing } from '@microverse/mycelium';
import { createOffersService, OFFERS_KEY } from './offers-service';
import { coupons } from './offers';
const bus = createMycelium('symbiont');
const cart: CartPricing = {
  itemCount: 2,
  subtotalPaise: 300000,
  shippingPaise: 9900,
  cartRevision: 1,
  revision: 1,
  offerCode: null,
  discountPaise: 0,
  shippingDiscountPaise: 0,
  checkoutPending: false,
};
const stops: (() => void)[] = [];
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime('2026-11-10T12:00:00Z');
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  vi.useRealTimers();
});
describe('MUTANT event-owned selection', () => {
  it('requests current pricing on startup and calculates/applies a quote', () => {
    const requested = vi.fn(() => {
      bus.publish(events.CART_PRICING_UPDATED, cart);
    });
    stops.push(subscribe(events.CART_REQUESTED, requested));
    const applied = vi.fn();
    stops.push(subscribe(events.OFFER_APPLIED, applied));
    const service = createOffersService();
    stops.push(service.start());
    service.apply('SAVE20');
    expect(requested).toHaveBeenCalledOnce();
    expect(applied.mock.calls[0]?.[0].payload).toMatchObject({
      code: 'SAVE20',
      discountPaise: 60000,
      shippingDiscountPaise: 0,
      cartRevision: 1,
    });
    expect(JSON.parse(sessionStorage.getItem(OFFERS_KEY)!).code).toBe('SAVE20');
  });
  it('waits for a cart and rejects unknown/ineligible selections', () => {
    const applied = vi.fn();
    stops.push(subscribe(events.OFFER_APPLIED, applied));
    const service = createOffersService();
    stops.push(service.start());
    service.apply('WELCOME10');
    service.apply('UNKNOWN');
    bus.publish(events.CART_PRICING_UPDATED, { ...cart, subtotalPaise: 50000 });
    service.apply('SAVE20');
    expect(applied).not.toHaveBeenCalled();
    expect(service.getSnapshot().code).toBeNull();
  });
  it('replaces rather than stacks coupons and emits removal facts', () => {
    const removed = vi.fn(),
      applied = vi.fn();
    stops.push(
      subscribe(events.OFFER_REMOVED, removed),
      subscribe(events.OFFER_APPLIED, applied),
    );
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    service.apply('WELCOME10');
    service.apply('FREESHIP');
    expect(removed.mock.calls[0]?.[0].payload).toMatchObject({
      code: 'WELCOME10',
      reason: 'replaced',
    });
    expect(applied.mock.calls.at(-1)?.[0].payload).toMatchObject({
      code: 'FREESHIP',
      discountPaise: 0,
      shippingDiscountPaise: 9900,
    });
    service.remove();
    expect(service.getSnapshot().code).toBeNull();
    expect(removed.mock.calls.at(-1)?.[0].payload.reason).toBe('user');
  });
  it('revalidates minimums, empty carts, and changed cart revisions while the UI is absent', () => {
    const applied = vi.fn(),
      removed = vi.fn();
    stops.push(
      subscribe(events.OFFER_APPLIED, applied),
      subscribe(events.OFFER_REMOVED, removed),
    );
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    service.apply('SAVE20');
    bus.publish(events.CART_PRICING_UPDATED, {
      ...cart,
      subtotalPaise: 400000,
      cartRevision: 2,
      revision: 2,
    });
    expect(applied.mock.calls.at(-1)?.[0].payload).toMatchObject({
      discountPaise: 80000,
      cartRevision: 2,
    });
    bus.publish(events.CART_PRICING_UPDATED, {
      ...cart,
      subtotalPaise: 100000,
      cartRevision: 3,
      revision: 3,
    });
    expect(service.getSnapshot().code).toBeNull();
    expect(removed.mock.calls.at(-1)?.[0].payload.reason).toBe('ineligible');
    service.apply('WELCOME10');
    bus.publish(events.CART_PRICING_UPDATED, {
      ...cart,
      itemCount: 0,
      subtotalPaise: 0,
      cartRevision: 4,
      revision: 4,
    });
    expect(service.getSnapshot().code).toBeNull();
  });
  it('does not create feedback loops when Cart acknowledges a quote', () => {
    const applied = vi.fn((event) => {
      bus.publish(events.CART_PRICING_UPDATED, {
        ...cart,
        offerCode: event.payload.code,
        discountPaise: event.payload.discountPaise,
        shippingDiscountPaise: event.payload.shippingDiscountPaise,
        revision: 2,
      });
    });
    stops.push(subscribe(events.OFFER_APPLIED, applied));
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    service.apply('WELCOME10');
    expect(applied).toHaveBeenCalledOnce();
    expect(service.getSnapshot().cart?.offerCode).toBe('WELCOME10');
  });
  it('restores a selection and reconciles it against new cart facts after restart', () => {
    sessionStorage.setItem(
      OFFERS_KEY,
      JSON.stringify({ schemaVersion: 1, code: 'WELCOME10' }),
    );
    const applied = vi.fn();
    stops.push(subscribe(events.OFFER_APPLIED, applied));
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    expect(applied).toHaveBeenCalledOnce();
    service.remove();
    // A quote whose remove notification was missed is reconciled against the persisted null selection.
    bus.publish(events.CART_PRICING_UPDATED, {
      ...cart,
      offerCode: 'WELCOME10',
      discountPaise: 30000,
      revision: 3,
    });
    expect(service.getSnapshot().code).toBeNull();
  });
  it('expires an applied selection on its validity deadline', async () => {
    vi.setSystemTime(Date.parse(coupons[0]!.expiresAt) - 1);
    const removed = vi.fn();
    stops.push(subscribe(events.OFFER_REMOVED, removed));
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    service.apply('WELCOME10');
    await vi.advanceTimersByTimeAsync(3);
    expect(service.getSnapshot().code).toBeNull();
    expect(removed.mock.calls.at(-1)?.[0].payload.reason).toBe('expired');
  });
  it('stops expiry retries when saving the expired selection fails', async () => {
    vi.setSystemTime(Date.parse(coupons[0]!.expiresAt) - 1);
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    service.apply('WELCOME10');
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Blocked');
      });
    await vi.advanceTimersByTimeAsync(10);
    expect(service.getSnapshot().error).not.toBeNull();
    const attempts = write.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(write).toHaveBeenCalledTimes(attempts);
  });
  it('does not publish a new selection if persistence fails', () => {
    const applied = vi.fn();
    stops.push(subscribe(events.OFFER_APPLIED, applied));
    const service = createOffersService();
    stops.push(service.start());
    bus.publish(events.CART_PRICING_UPDATED, cart);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    service.apply('SAVE20');
    expect(applied).not.toHaveBeenCalled();
    expect(service.getSnapshot().error).not.toBeNull();
  });
  it('ignores stale facts and cleans up its listener/expiry lifetime', () => {
    const service = createOffersService();
    const stop = service.start();
    bus.publish(events.CART_PRICING_UPDATED, { ...cart, revision: 5 });
    bus.publish(events.CART_PRICING_UPDATED, {
      ...cart,
      subtotalPaise: 1,
      revision: 1,
    });
    expect(service.getSnapshot().cart?.subtotalPaise).toBe(300000);
    stop();
    stop();
    bus.publish(events.CART_PRICING_UPDATED, {
      ...cart,
      subtotalPaise: 400000,
      revision: 6,
    });
    expect(service.getSnapshot().cart?.subtotalPaise).toBe(300000);
  });
  it('preserves corrupt saved data until an explicit reset', () => {
    sessionStorage.setItem(OFFERS_KEY, '{bad');
    const service = createOffersService();
    stops.push(service.start());
    expect(service.getSnapshot().error).not.toBeNull();
    expect(sessionStorage.getItem(OFFERS_KEY)).toBe('{bad');
    service.reset();
    expect(service.getSnapshot().error).toBeNull();
  });
});
