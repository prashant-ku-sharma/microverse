import { z } from 'zod';
import {
  acknowledge,
  cartProductSchema,
  createMycelium,
  events,
  pendingEvents,
} from '@microverse/mycelium';
import { calculateTotals, cartReducer, createCart } from './cart';
import type { CartAction, CartState } from './cart';

export const CART_STORAGE_KEY = 'microverse:symbiont:v1:cart';
const itemSchema = cartProductSchema
  .extend({ quantity: z.number().int().min(1).max(999) })
  .refine((item) => item.quantity <= item.stock);
const persistedSchema = z.strictObject({
  schemaVersion: z.literal(1),
  items: z
    .array(itemSchema)
    .max(1000)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
    ),
  appliedEventIds: z.array(z.uuid()).max(1000),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});
const bus = createMycelium('symbiont');
interface Snapshot {
  cart: CartState;
  error: string | null;
}

/** Remote-owned state/service. No business state is exported by MYCELIUM or imported by the Host. */
export function createCartService() {
  let snapshot: Snapshot = { cart: createCart([]), error: null };
  let appliedEventIds: string[] = [];
  let revision = 0;
  let initialized = false;
  let users = 0;
  let draining = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopListening: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  function fail() {
    snapshot = {
      ...snapshot,
      error:
        'A cart update could not finish. The last saved cart is kept and saved product requests will be retried. Retry, or reset this tab’s saved cart if its data is invalid.',
    };
    notify();
  }
  function announce(correlationId?: string) {
    bus.publish(
      events.CART_UPDATED,
      { ...calculateTotals(snapshot.cart.items), revision },
      correlationId ? { correlationId } : {},
    );
  }
  function hydrate() {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    const stored = raw
      ? persistedSchema.parse(JSON.parse(raw) as unknown)
      : null;
    appliedEventIds = stored?.appliedEventIds ?? [];
    revision = stored?.revision ?? 0;
    snapshot = { cart: createCart(stored?.items ?? []), error: null };
    initialized = true;
    notify();
  }
  function commit(
    cart: CartState,
    correlationId?: string,
    ids = appliedEventIds,
  ) {
    const record = persistedSchema.parse({
      schemaVersion: 1,
      items: cart.items,
      appliedEventIds: ids.slice(-1000),
      revision: revision + 1,
    });
    // One write commits both cart and deduplication receipt before any delivery acknowledgement.
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(record));
    revision = record.revision;
    appliedEventIds = record.appliedEventIds;
    snapshot = { cart, error: null };
    notify();
    announce(correlationId);
  }
  function drain() {
    if (draining || snapshot.cart.phase === 'processing') return;
    draining = true;
    try {
      if (!initialized) hydrate();
      for (const event of pendingEvents()) {
        if (!appliedEventIds.includes(event.id)) {
          const next = cartReducer(snapshot.cart, {
            type: 'add',
            ...event.payload,
          });
          commit(next, event.correlationId, [...appliedEventIds, event.id]);
        }
        acknowledge(event.id);
      }
    } catch {
      fail();
    } finally {
      draining = false;
    }
  }
  function dispatch(action: CartAction) {
    try {
      if (!initialized) hydrate();
      const previous = snapshot.cart;
      const next = cartReducer(previous, action);
      if (next === previous) return;
      const correlationId = crypto.randomUUID();
      commit(next, correlationId);
      if (action.type === 'remove') {
        const removed = previous.items.find((item) => item.id === action.id);
        if (removed)
          bus.publish(
            events.PRODUCT_REMOVED,
            { productId: removed.id, quantity: removed.quantity },
            { correlationId },
          );
      }
      if (
        (action.type === 'clear' || action.type === 'complete') &&
        previous.items.length
      ) {
        bus.publish(
          events.CART_CLEARED,
          {
            reason: action.type === 'complete' ? 'checkout' : 'user',
            revision,
          },
          { correlationId },
        );
      }
      if (action.type === 'checkout')
        timer = setTimeout(() => {
          timer = undefined;
          dispatch({ type: 'complete' });
        }, 900);
      if (action.type === 'complete' || action.type === 'restore') drain();
    } catch {
      fail();
    }
  }
  function start() {
    users++;
    if (users === 1) {
      stopListening = bus.subscribe(events.PRODUCT_ADDED, () => drain());
      try {
        if (!initialized) hydrate();
        drain();
        if (!snapshot.error) announce();
      } catch {
        fail();
      }
    } else {
      try {
        announce();
      } catch {
        fail();
      }
    }
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      if (--users !== 0) return;
      stopListening?.();
      stopListening = undefined;
      clearTimeout(timer);
      timer = undefined;
      // A cancelled simulation keeps its persisted cart, never a stuck processing phase.
      if (snapshot.cart.phase === 'processing') {
        snapshot = {
          ...snapshot,
          cart: {
            ...snapshot.cart,
            phase: 'cart',
            order: null,
            notice: 'Checkout simulation cancelled.',
          },
        };
        notify();
      }
    };
  }
  return {
    start,
    dispatch,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    retry() {
      try {
        hydrate();
        drain();
        if (!snapshot.error) announce();
      } catch {
        fail();
      }
    },
    reset() {
      try {
        commit(createCart([]), undefined, appliedEventIds);
        initialized = true;
        drain();
      } catch {
        fail();
      }
    },
  };
}
export const cartService = createCartService();
/** Federation service contract: lifetime only; cart state stays in this remote. */
export function startCartService(): () => void {
  const stop = cartService.start();
  if (cartService.getSnapshot().error) {
    stop();
    throw new Error('SYMBIONT cart persistence unavailable');
  }
  return stop;
}
