import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledge,
  createMycelium,
  eventSchema,
  events,
  getEventLog,
  MyceliumError,
  pendingEvents,
  publish,
  subscribe,
  unsubscribe,
} from './index';

const product = {
  id: 'moss',
  name: 'Moss planter',
  category: 'Workspace',
  description: 'A considered planter.',
  image: 'http://127.0.0.1:5001/images/moss.svg',
  unitPricePaise: 149000,
  stock: 2,
};
const stops: (() => void)[] = [];
beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
});
describe('MYCELIUM typed transport', () => {
  it('publishes a real CustomEvent with validated metadata and durable intent', () => {
    const native = vi.fn();
    window.addEventListener(events.PRODUCT_ADDED, native, { once: true });
    const event = createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    expect(native).toHaveBeenCalledOnce();
    expect(native.mock.calls[0]?.[0]).toBeInstanceOf(CustomEvent);
    expect(native.mock.calls[0]?.[0].detail).toEqual(event);
    expect(eventSchema.parse(event)).toMatchObject({
      name: events.PRODUCT_ADDED,
      source: 'parasite',
      schemaVersion: 1,
    });
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
    expect(event.id).not.toBe(event.correlationId);
    expect(pendingEvents()).toEqual([event]);
    acknowledge(event.id);
    expect(pendingEvents()).toEqual([]);
  });
  it('subscribes once per callback and supports explicit and returned cleanup', () => {
    const callback = vi.fn();
    stops.push(subscribe(events.PRODUCT_ADDED, callback));
    subscribe(events.PRODUCT_ADDED, callback);
    createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    expect(callback).toHaveBeenCalledOnce();
    unsubscribe(events.PRODUCT_ADDED, callback);
    createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    expect(callback).toHaveBeenCalledOnce();
    const stop = subscribe(events.PRODUCT_ADDED, callback);
    stop();
    stop();
    createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    expect(callback).toHaveBeenCalledOnce();
  });
  it('propagates correlations to cart facts and logs metadata without payloads', () => {
    const callback = vi.fn();
    stops.push(subscribe(events.CART_UPDATED, callback));
    const correlationId = crypto.randomUUID();
    const event = createMycelium('symbiont').publish(
      events.CART_UPDATED,
      {
        itemCount: 1,
        subtotalPaise: 100,
        discountPaise: 10,
        totalPaise: 90,
        revision: 1,
      },
      { correlationId },
    );
    expect(callback).toHaveBeenCalledWith(event);
    expect(event.correlationId).toBe(correlationId);
    expect(pendingEvents()).toEqual([]);
    expect(getEventLog().at(-1)).toMatchObject({
      phase: 'received',
      eventId: event.id,
      correlationId,
    });
    expect(getEventLog().at(-1)).not.toHaveProperty('payload');
  });
  it.each([0, -1, 1.5, 1000])(
    'rejects invalid outgoing quantities %s without dispatch or storage',
    (quantity) => {
      const callback = vi.fn();
      stops.push(subscribe(events.PRODUCT_ADDED, callback));
      expect(() =>
        createMycelium('parasite').publish(events.PRODUCT_ADDED, {
          product,
          quantity,
        }),
      ).toThrow(MyceliumError);
      expect(callback).not.toHaveBeenCalled();
      expect(pendingEvents()).toEqual([]);
    },
  );
  it('rejects malformed, unsupported-version, wrong-source and mismatched native envelopes', () => {
    const event = createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    const callback = vi.fn();
    stops.push(subscribe(events.CART_UPDATED, callback));
    for (const detail of [
      {},
      { ...event, schemaVersion: 2 },
      { ...event, source: 'symbiont' },
      event,
    ])
      window.dispatchEvent(new CustomEvent(events.CART_UPDATED, { detail }));
    expect(callback).not.toHaveBeenCalled();
    expect(() =>
      publish(
        events.PRODUCT_ADDED,
        { product, quantity: 1 },
        { source: 'parasite', correlationId: 'not-a-uuid' },
      ),
    ).toThrow(MyceliumError);
  });
  it('isolates broken listeners and supplies independently parsed payloads', () => {
    stops.push(
      subscribe(events.PRODUCT_ADDED, (event) => {
        event.payload.product.name = 'mutated';
        throw new Error('consumer failed');
      }),
    );
    const callback = vi.fn();
    stops.push(subscribe(events.PRODUCT_ADDED, callback));
    createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    expect(callback.mock.calls[0]?.[0].payload.product.name).toBe(
      'Moss planter',
    );
    expect(product.name).toBe('Moss planter');
  });
  it('contains rejected async subscribers without unhandled rejections', async () => {
    stops.push(
      subscribe(events.PRODUCT_ADDED, async () => {
        throw new Error('async consumer failed');
      }),
    );
    const event = createMycelium('parasite').publish(events.PRODUCT_ADDED, {
      product,
      quantity: 1,
    });
    await Promise.resolve();
    expect(getEventLog().at(-1)).toMatchObject({
      phase: 'error',
      eventId: event.id,
    });
  });

  it('does not claim delivery when persistence is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    const callback = vi.fn();
    stops.push(subscribe(events.PRODUCT_ADDED, callback));
    expect(() =>
      createMycelium('parasite').publish(events.PRODUCT_ADDED, {
        product,
        quantity: 1,
      }),
    ).toThrow('Unable to save');
    expect(callback).not.toHaveBeenCalled();
  });
  it('retains a bounded inbox without silently dropping older requests', () => {
    for (let i = 0; i < 100; i++)
      createMycelium('parasite').publish(events.PRODUCT_ADDED, {
        product,
        quantity: 1,
      });
    expect(() =>
      createMycelium('parasite').publish(events.PRODUCT_ADDED, {
        product,
        quantity: 1,
      }),
    ).toThrow('inbox is full');
    expect(pendingEvents()).toHaveLength(100);
    expect(getEventLog().length).toBeLessThanOrEqual(100);
  });
  it('reports corrupt persisted envelopes without deleting them', () => {
    sessionStorage.setItem('microverse:mycelium:v1:pending:bad', '{invalid');
    expect(() => pendingEvents()).toThrow(MyceliumError);
    expect(sessionStorage.length).toBe(1);
  });
});
