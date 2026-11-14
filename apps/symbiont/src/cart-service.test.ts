import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMycelium,
  events,
  pendingEvents,
  subscribe,
} from '@microverse/mycelium';
import { CART_STORAGE_KEY, createCartService } from './cart-service';

const product = {
  id: 'moss',
  name: 'Moss planter',
  category: 'Workspace',
  description: 'A considered planter.',
  image: 'http://127.0.0.1:5001/images/moss.svg',
  unitPricePaise: 149000,
  stock: 2,
};
const producer = createMycelium('parasite');
const stops: (() => void)[] = [];
beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  vi.useRealTimers();
});
describe('Product → SYMBIONT → cart facts', () => {
  it('reconciles requests received before the service/UI exists and propagates totals/correlation', () => {
    const event = producer.publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    expect(pendingEvents()).toHaveLength(1);
    const updates = vi.fn();
    stops.push(subscribe(events.CART_UPDATED, updates));
    const service = createCartService();
    stops.push(service.start());
    expect(service.getSnapshot().cart.items[0]).toMatchObject({
      id: 'moss',
      quantity: 1,
    });
    expect(
      updates.mock.calls.some(
        ([update]) =>
          update.correlationId === event.correlationId &&
          update.payload.itemCount === 1 &&
          update.payload.totalPaise === 158900,
      ),
    ).toBe(true);
    expect(pendingEvents()).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!)).toMatchObject(
      { appliedEventIds: [event.id] },
    );
  });
  it('consumes while the Cart UI is absent, merges repeated adds, and respects stock', () => {
    const service = createCartService();
    stops.push(service.start());
    for (let i = 0; i < 3; i++)
      producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    expect(service.getSnapshot().cart.items).toHaveLength(1);
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(2);
    expect(service.getSnapshot().cart.notice).toContain('available quantity');
    expect(pendingEvents()).toEqual([]);
  });
  it('restores state and does not double-apply a replay after commit-before-ack interruption', () => {
    const service = createCartService();
    const stop = service.start();
    const event = producer.publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    stop();
    sessionStorage.setItem(
      `microverse:mycelium:v1:pending:${event.id}`,
      JSON.stringify(event),
    );
    const restored = createCartService();
    stops.push(restored.start());
    expect(restored.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(pendingEvents()).toEqual([]);
  });
  it('leaves failed writes pending and retries them without changing the in-memory cart first', () => {
    const service = createCartService();
    stops.push(service.start());
    const setItem = Storage.prototype.setItem;
    const failing = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(function (this: Storage, key, value) {
        if (key === CART_STORAGE_KEY)
          throw new DOMException('Full', 'QuotaExceededError');
        setItem.call(this, key, value);
      });
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    expect(service.getSnapshot().cart.items).toHaveLength(0);
    expect(service.getSnapshot().error).not.toBeNull();
    expect(pendingEvents()).toHaveLength(1);
    failing.mockRestore();
    service.retry();
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(service.getSnapshot().error).toBeNull();
    expect(pendingEvents()).toEqual([]);
  });
  it('retries acknowledgement failures after the cart commit without applying the add twice', () => {
    const service = createCartService();
    stops.push(service.start());
    const failing = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {
        throw new Error('Unavailable');
      });
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(pendingEvents()).toHaveLength(1);
    failing.mockRestore();
    service.retry();
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(pendingEvents()).toEqual([]);
    expect(service.getSnapshot().error).toBeNull();
  });
  it('cancels a simulation only when its final service owner stops, preserving the saved cart', async () => {
    vi.useFakeTimers();
    const service = createCartService();
    const stop = service.start();
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    service.dispatch({
      type: 'checkout',
      id: 'DEMO-stop',
      createdAt: new Date().toISOString(),
    });
    stop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(service.getSnapshot().cart.phase).toBe('cart');
    const restored = createCartService();
    stops.push(restored.start());
    expect(restored.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(restored.getSnapshot().cart.order).toBeNull();
  });

  it('publishes removed/cleared facts after committing its own cart', () => {
    const removed = vi.fn(),
      cleared = vi.fn(),
      updated = vi.fn();
    stops.push(
      subscribe(events.PRODUCT_REMOVED, removed),
      subscribe(events.CART_CLEARED, cleared),
      subscribe(events.CART_UPDATED, updated),
    );
    const service = createCartService();
    stops.push(service.start());
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 2 });
    service.dispatch({ type: 'quantity', id: 'moss', quantity: 1 });
    expect(updated.mock.calls.at(-1)?.[0].payload.itemCount).toBe(1);
    service.dispatch({ type: 'remove', id: 'moss' });
    expect(removed.mock.calls[0]?.[0].payload).toEqual({
      productId: 'moss',
      quantity: 1,
    });
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    service.dispatch({ type: 'clear' });
    expect(cleared.mock.calls[0]?.[0].payload.reason).toBe('user');
    expect(updated.mock.calls.at(-1)?.[0].payload.itemCount).toBe(0);
    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!).items).toEqual(
      [],
    );
  });
  it('defers in-flight requests during checkout, then reconciles them after confirmation', async () => {
    vi.useFakeTimers();
    const service = createCartService();
    stops.push(service.start());
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    service.dispatch({
      type: 'checkout',
      id: 'DEMO-test',
      createdAt: new Date().toISOString(),
    });
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    expect(pendingEvents()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(900);
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(service.getSnapshot().cart.phase).toBe('cart');
    expect(pendingEvents()).toEqual([]);
  });
  it('cleans up subscriptions with reference-counted/idempotent lifetime disposal', () => {
    const service = createCartService();
    const stop1 = service.start(),
      stop2 = service.start();
    stop1();
    stop1();
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    stop2();
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    expect(pendingEvents()).toHaveLength(1);
  });
  it('does not announce an uninitialized cart when another owner starts after failed restoration', () => {
    sessionStorage.setItem(CART_STORAGE_KEY, '{bad');
    const updated = vi.fn();
    stops.push(subscribe(events.CART_UPDATED, updated));
    const service = createCartService();
    stops.push(service.start(), service.start());
    expect(service.getSnapshot().error).not.toBeNull();
    expect(updated).not.toHaveBeenCalled();
    service.reset();
    expect(updated.mock.calls.at(-1)?.[0].payload.itemCount).toBe(0);
  });

  it('applies only fresh MUTANT quotes, preserves the cart basis, and bounds monetary adjustments', () => {
    const pricing = vi.fn();
    stops.push(subscribe(events.CART_PRICING_UPDATED, pricing));
    const service = createCartService();
    stops.push(service.start());
    producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
    const basis = pricing.mock.calls.at(-1)?.[0].payload.cartRevision;
    const quote = {
      code: 'EXTERNAL_QUOTE',
      cartRevision: basis,
      discountPaise: 14900,
      shippingDiscountPaise: 0,
      expiresAt: '2027-12-31T23:59:59.999Z',
    };
    createMycelium('mutant').publish(events.OFFER_APPLIED, quote);
    expect(service.getSnapshot().cart.offer?.code).toBe('EXTERNAL_QUOTE');
    expect(pricing.mock.calls.at(-1)?.[0].payload.cartRevision).toBe(basis);
    service.dispatch({ type: 'quantity', id: 'moss', quantity: 2 });
    expect(service.getSnapshot().cart.offer).toBeNull();
    createMycelium('mutant').publish(events.OFFER_APPLIED, quote);
    expect(service.getSnapshot().cart.offer).toBeNull();
    const fresh = {
      ...quote,
      cartRevision: basis + 1,
      discountPaise: 9999999,
      shippingDiscountPaise: 999999,
    };
    createMycelium('mutant').publish(events.OFFER_APPLIED, fresh);
    expect(pricing.mock.calls.at(-1)?.[0].payload.discountPaise).toBe(298000);
    expect(pricing.mock.calls.at(-1)?.[0].payload.shippingDiscountPaise).toBe(
      9900,
    );
    createMycelium('mutant').publish(events.OFFER_REMOVED, {
      code: 'EXTERNAL_QUOTE',
      cartRevision: basis + 1,
      reason: 'user',
    });
    expect(service.getSnapshot().cart.offer).toBeNull();
  });
  it('responds to pricing requests and migrates a version-1 persisted cart without losing items', () => {
    sessionStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        items: [{ ...product, quantity: 1 }],
        appliedEventIds: [],
        revision: 7,
      }),
    );
    const pricing = vi.fn();
    stops.push(subscribe(events.CART_PRICING_UPDATED, pricing));
    const service = createCartService();
    stops.push(service.start());
    createMycelium('mutant').publish(events.CART_REQUESTED, {});
    expect(pricing.mock.calls.at(-1)?.[0].payload.cartRevision).toBe(7);
    expect(service.getSnapshot().cart.items[0]?.quantity).toBe(1);
    service.dispatch({ type: 'quantity', id: 'moss', quantity: 2 });
    expect(
      JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!).schemaVersion,
    ).toBe(2);
  });

  it('does not overwrite invalid persisted cart data until an explicit reset', () => {
    sessionStorage.setItem(CART_STORAGE_KEY, '{bad');
    const service = createCartService();
    stops.push(service.start());
    expect(service.getSnapshot().error).not.toBeNull();
    expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBe('{bad');
    service.reset();
    expect(service.getSnapshot().error).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!).items).toEqual(
      [],
    );
  });
});

it('expires a monetary quote lease even when the offers consumer is absent', async () => {
  vi.useFakeTimers();
  const service = createCartService();
  stops.push(service.start());
  producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
  createMycelium('mutant').publish(events.OFFER_APPLIED, {
    code: 'LEASE',
    cartRevision: 1,
    discountPaise: 100,
    shippingDiscountPaise: 0,
    expiresAt: new Date(Date.now() + 10).toISOString(),
  });
  expect(service.getSnapshot().cart.offer?.code).toBe('LEASE');
  await vi.advanceTimersByTimeAsync(12);
  expect(service.getSnapshot().cart.offer).toBeNull();
});

it('publishes a simulated checkout fact only after the committed confirmation', async () => {
  vi.useFakeTimers();
  const completed = vi.fn(),
    service = createCartService();
  stops.push(subscribe(events.CHECKOUT_COMPLETED, completed), service.start());
  producer.publish(events.PRODUCT_ADDED, { product, quantity: 1 });
  service.dispatch({
    type: 'checkout',
    id: 'DEMO-verified',
    createdAt: new Date().toISOString(),
  });
  expect(completed).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(900);
  expect(service.getSnapshot().cart.phase).toBe('confirmed');
  expect(completed).toHaveBeenCalledOnce();
  expect(completed.mock.calls[0]?.[0].payload).toEqual({
    orderId: 'DEMO-verified',
    itemCount: 1,
    totalPaise: 158900,
    simulated: true,
  });
});
