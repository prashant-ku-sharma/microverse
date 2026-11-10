import { z } from 'zod';
import {
  acknowledge,
  cartProductSchema,
  createMycelium,
  events,
  pendingEvents,
} from '@microverse/mycelium';
import type { OfferQuote } from '@microverse/mycelium';
import { calculateTotals, cartReducer, createCart } from './cart';
import type { CartAction, CartState } from './cart';

export const CART_STORAGE_KEY = 'microverse:symbiont:v1:cart';
const itemSchema = cartProductSchema
  .extend({ quantity: z.number().int().min(1).max(999) })
  .refine((item) => item.quantity <= item.stock);
const persistedFields = {
  items: z
    .array(itemSchema)
    .max(1000)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
    ),
  appliedEventIds: z.array(z.uuid()).max(1000),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
};
const legacySchema = z.strictObject({
  schemaVersion: z.literal(1),
  ...persistedFields,
});
const persistedSchema = z.strictObject({
  schemaVersion: z.literal(2),
  ...persistedFields,
  cartRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});
const restoredSchema = z.union([persistedSchema, legacySchema]);
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
  let cartRevision = 0;
  let initialized = false;
  let users = 0;
  let draining = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let quoteTimer: ReturnType<typeof setTimeout> | undefined;
  let stopListening: (() => void)[] = [];
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
    if (snapshot.error) return;
    const { cart } = snapshot;
    const totals = calculateTotals(cart.items, cart.offer);
    bus.publish(
      events.CART_UPDATED,
      {
        itemCount: totals.itemCount,
        subtotalPaise: totals.subtotalPaise,
        discountPaise: totals.discountPaise,
        totalPaise: totals.totalPaise,
        revision,
      },
      correlationId ? { correlationId } : {},
    );
    bus.publish(
      events.CART_PRICING_UPDATED,
      {
        itemCount: totals.itemCount,
        subtotalPaise: totals.subtotalPaise,
        shippingPaise: totals.shippingPaise,
        cartRevision,
        revision,
        discountPaise: totals.discountPaise,
        shippingDiscountPaise: totals.shippingDiscountPaise,
        offerCode: cart.offer?.code ?? null,
        checkoutPending: cart.phase === 'processing',
      },
      correlationId ? { correlationId } : {},
    );
  }
  function hydrate() {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    const stored = raw
      ? restoredSchema.parse(JSON.parse(raw) as unknown)
      : null;
    appliedEventIds = stored?.appliedEventIds ?? [];
    revision = stored?.revision ?? 0;
    cartRevision = stored
      ? 'cartRevision' in stored
        ? stored.cartRevision
        : stored.revision
      : 0;
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
      schemaVersion: 2,
      cartRevision:
        cart.items !== snapshot.cart.items ? cartRevision + 1 : cartRevision,
      items: cart.items,
      appliedEventIds: ids.slice(-1000),
      revision: revision + 1,
    });
    // One write commits both cart and deduplication receipt before any delivery acknowledgement.
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(record));
    revision = record.revision;
    cartRevision = record.cartRevision;
    appliedEventIds = record.appliedEventIds;
    snapshot = { cart, error: null };
    scheduleQuoteExpiry();
    notify();
    announce(correlationId);
  }
  function scheduleQuoteExpiry() {
    clearTimeout(quoteTimer);
    quoteTimer = undefined;
    const quote = snapshot.cart.offer;
    if (!quote || !users || snapshot.error) return;
    quoteTimer = setTimeout(
      () => {
        quoteTimer = undefined;
        if (
          snapshot.cart.offer !== quote ||
          snapshot.cart.phase === 'processing'
        )
          return;
        if (Date.parse(quote.expiresAt) <= Date.now()) {
          try {
            commit({ ...snapshot.cart, offer: null });
          } catch {
            fail();
          }
        } else scheduleQuoteExpiry();
      },
      Math.min(
        Math.max(1, Date.parse(quote.expiresAt) - Date.now() + 1),
        2147483647,
      ),
    );
  }
  function receiveOffer(offer: OfferQuote, correlationId: string) {
    if (
      snapshot.error ||
      snapshot.cart.phase === 'processing' ||
      offer.cartRevision !== cartRevision ||
      Date.parse(offer.expiresAt) <= Date.now() ||
      !snapshot.cart.items.length
    )
      return;
    const current = snapshot.cart.offer;
    if (
      current?.code === offer.code &&
      current.discountPaise === offer.discountPaise &&
      current.shippingDiscountPaise === offer.shippingDiscountPaise &&
      current.cartRevision === offer.cartRevision &&
      current.expiresAt === offer.expiresAt
    )
      return;
    try {
      commit({ ...snapshot.cart, offer }, correlationId);
    } catch {
      fail();
    }
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
      if (
        action.type === 'checkout' &&
        snapshot.cart.offer &&
        Date.parse(snapshot.cart.offer.expiresAt) <= Date.now()
      )
        commit({ ...snapshot.cart, offer: null });
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
      stopListening = [
        bus.subscribe(events.PRODUCT_ADDED, () => drain()),
        bus.subscribe(events.CART_REQUESTED, (event) =>
          announce(event.correlationId),
        ),
        bus.subscribe(events.OFFER_APPLIED, (event) =>
          receiveOffer(event.payload, event.correlationId),
        ),
        bus.subscribe(events.OFFER_REMOVED, (event) => {
          if (
            snapshot.cart.phase === 'processing' ||
            event.payload.cartRevision !== cartRevision ||
            snapshot.cart.offer?.code !== event.payload.code
          )
            return;
          try {
            commit({ ...snapshot.cart, offer: null }, event.correlationId);
          } catch {
            fail();
          }
        }),
      ];
      try {
        if (!initialized) hydrate();
        drain();
        scheduleQuoteExpiry();
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
      stopListening.forEach((stop) => stop());
      stopListening = [];
      clearTimeout(timer);
      clearTimeout(quoteTimer);
      quoteTimer = undefined;
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
        scheduleQuoteExpiry();
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
