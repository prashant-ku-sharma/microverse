import { z } from 'zod';
import { createMycelium, events } from '@microverse/mycelium';
import type { CartPricing, OfferQuote } from '@microverse/mycelium';
import { coupons, evaluateCoupon } from './offers';

export const OFFERS_KEY = 'microverse:mutant:v1:selection';
const selectionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  code: z.string().nullable(),
});
const bus = createMycelium('mutant');
interface OfferState {
  cart: CartPricing | null;
  code: string | null;
  preview: boolean;
  error: string | null;
  notice: string;
}
export function createOffersService() {
  let state: OfferState = {
    cart: null,
    code: null,
    preview: false,
    error: null,
    notice: '',
  };
  let initialized = false,
    users = 0,
    reconciling = false;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  let disposers: (() => void)[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  function fail() {
    state = {
      ...state,
      error:
        'Offer selection could not be read or saved. Your previous saved selection is kept. Retry or reset the selection.',
    };
    notify();
  }
  function hydrate() {
    const raw = sessionStorage.getItem(OFFERS_KEY);
    const code = raw
      ? selectionSchema.parse(JSON.parse(raw) as unknown).code
      : null;
    if (code && !coupons.some((coupon) => coupon.code === code))
      throw new Error('Unknown saved coupon');
    state = { ...state, code, error: null };
    initialized = true;
    notify();
  }
  function persist(code: string | null) {
    sessionStorage.setItem(
      OFFERS_KEY,
      JSON.stringify({ schemaVersion: 1, code }),
    );
    state = { ...state, code, error: null };
    notify();
  }
  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
    const coupon = coupons.find((coupon) => coupon.code === state.code);
    if (coupon && users && !state.error)
      expiryTimer = setTimeout(
        () => {
          expiryTimer = undefined;
          reconcile();
          scheduleExpiry();
        },
        Math.min(
          Math.max(1, Date.parse(coupon.expiresAt) - Date.now() + 1),
          2147483647,
        ),
      );
  }
  function publishQuote(quote: OfferQuote, correlationId?: string) {
    if (state.preview && state.cart)
      state = {
        ...state,
        cart: {
          ...state.cart,
          offerCode: quote.code,
          discountPaise: quote.discountPaise,
          shippingDiscountPaise: quote.shippingDiscountPaise,
        },
      };
    bus.publish(
      events.OFFER_APPLIED,
      quote,
      correlationId ? { correlationId } : {},
    );
    notify();
  }
  function remove(
    reason:
      'user' | 'ineligible' | 'expired' | 'cart-cleared' | 'replaced' = 'user',
    correlationId?: string,
  ) {
    if (!state.code) return;
    const code = state.code;
    persist(null);
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
    state = {
      ...state,
      notice: `${code} removed.`,
      cart:
        state.preview && state.cart
          ? {
              ...state.cart,
              offerCode: null,
              discountPaise: 0,
              shippingDiscountPaise: 0,
            }
          : state.cart,
    };
    bus.publish(
      events.OFFER_REMOVED,
      { code, reason, cartRevision: state.cart?.cartRevision ?? 0 },
      correlationId ? { correlationId } : {},
    );
    notify();
  }
  function reconcile(correlationId?: string) {
    if (reconciling || state.error) return;
    reconciling = true;
    try {
      const coupon = coupons.find((coupon) => coupon.code === state.code);
      if (coupon && Date.now() > Date.parse(coupon.expiresAt)) {
        remove('expired', correlationId);
        return;
      }
      if (!state.cart || state.cart.checkoutPending) return;
      if (!state.code) {
        if (state.cart.offerCode)
          bus.publish(
            events.OFFER_REMOVED,
            {
              code: state.cart.offerCode,
              cartRevision: state.cart.cartRevision,
              reason: 'user',
            },
            correlationId ? { correlationId } : {},
          );
        return;
      }
      if (!coupon) return;
      const result = evaluateCoupon(coupon, state.cart);
      if (!result.eligible || !result.quote) {
        remove(
          !state.cart.itemCount ? 'cart-cleared' : 'ineligible',
          correlationId,
        );
        return;
      }
      if (
        state.cart.offerCode !== coupon.code ||
        state.cart.discountPaise !== result.quote.discountPaise ||
        state.cart.shippingDiscountPaise !== result.quote.shippingDiscountPaise
      )
        publishQuote(result.quote, correlationId);
    } catch {
      fail();
    } finally {
      reconciling = false;
    }
  }
  function start() {
    users++;
    if (users === 1) {
      disposers = [
        bus.subscribe(events.CART_PRICING_UPDATED, (event) => {
          if (
            !state.preview &&
            state.cart &&
            event.payload.revision < state.cart.revision
          )
            return;
          state = { ...state, cart: event.payload, preview: false };
          notify();
          reconcile(event.correlationId);
        }),
        bus.subscribe(events.CART_CLEARED, (event) => {
          if (state.cart && event.payload.revision < state.cart.revision)
            return;
          try {
            if (state.code) remove('cart-cleared', event.correlationId);
          } catch {
            fail();
          }
        }),
      ];
      try {
        if (!initialized) hydrate();
        bus.publish(events.CART_REQUESTED, {});
        reconcile();
        scheduleExpiry();
      } catch {
        fail();
      }
    }
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      if (--users === 0) {
        disposers.forEach((stop) => stop());
        disposers = [];
        clearTimeout(expiryTimer);
        expiryTimer = undefined;
      }
    };
  }
  return {
    start,
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    apply(code: string) {
      try {
        if (!initialized) hydrate();
        const coupon = coupons.find((coupon) => coupon.code === code);
        if (!coupon || state.cart?.checkoutPending) return;
        const result = evaluateCoupon(coupon, state.cart);
        if (!result.eligible || !result.quote) {
          state = { ...state, notice: result.reason };
          notify();
          return;
        }
        const previousCode = state.code;
        persist(code);
        state = {
          ...state,
          notice: `${code} selected. ${state.preview ? 'Preview only.' : 'Cart confirms the final amount.'}`,
        };
        const correlationId = crypto.randomUUID();
        reconciling = true;
        try {
          if (previousCode && previousCode !== code)
            bus.publish(
              events.OFFER_REMOVED,
              {
                code: previousCode,
                reason: 'replaced',
                cartRevision: result.quote.cartRevision,
              },
              { correlationId },
            );
          publishQuote(result.quote, correlationId);
        } finally {
          reconciling = false;
        }
        scheduleExpiry();
      } catch {
        fail();
      }
    },
    remove() {
      try {
        remove();
      } catch {
        fail();
      }
    },
    preview(subtotalPaise: number, shippingPaise: number) {
      if (
        ![subtotalPaise, shippingPaise].every(
          (value) =>
            Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000,
        )
      )
        return;
      state = {
        ...state,
        preview: true,
        cart: {
          itemCount: subtotalPaise ? 1 : 0,
          subtotalPaise,
          shippingPaise,
          cartRevision: (state.cart?.cartRevision ?? 0) + 1,
          revision: (state.cart?.revision ?? 0) + 1,
          offerCode: null,
          discountPaise: 0,
          shippingDiscountPaise: 0,
          checkoutPending: false,
        },
        notice: 'Standalone cart preview updated.',
      };
      notify();
      reconcile();
    },
    retry() {
      try {
        hydrate();
        bus.publish(events.CART_REQUESTED, {});
        reconcile();
        scheduleExpiry();
      } catch {
        fail();
      }
    },
    reset() {
      try {
        if (state.code) remove();
        else persist(null);
        initialized = true;
        state = { ...state, error: null };
        bus.publish(events.CART_REQUESTED, {});
        notify();
      } catch {
        fail();
      }
    },
  };
}
export const offersService = createOffersService();
export function startOffersService() {
  const stop = offersService.start();
  if (offersService.getSnapshot().error) {
    stop();
    throw new Error('Offer storage unavailable');
  }
  return stop;
}
