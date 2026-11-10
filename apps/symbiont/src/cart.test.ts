import { describe, expect, it } from 'vitest';
import { calculateTotals, cartReducer, createCart } from './cart';
import { sampleCart } from './data/sample-cart';

const order = {
  type: 'checkout',
  id: 'DEMO-test',
  createdAt: '2026-11-09T12:00:00Z',
} as const;

describe('SYMBIONT cart rules', () => {
  it('calculates line quantities, integer-paise discount and final total', () => {
    expect(calculateTotals(sampleCart)).toEqual({
      itemCount: 4,
      subtotalPaise: 534600,
      discountPaise: 0,
      shippingPaise: 9900,
      shippingDiscountPaise: 0,
      totalPaise: 544500,
    });
    expect(
      calculateTotals([
        { ...sampleCart[0]!, unitPricePaise: 105, quantity: 1 },
      ]),
    ).toMatchObject({
      subtotalPaise: 105,
      discountPaise: 0,
      totalPaise: 10005,
    });
    expect(calculateTotals([])).toEqual({
      itemCount: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      totalPaise: 0,
      shippingPaise: 0,
      shippingDiscountPaise: 0,
    });
  });
  it('updates only the selected item without mutating fixtures', () => {
    const initial = createCart(sampleCart);
    const updated = cartReducer(initial, {
      type: 'quantity',
      id: 'arc-mug',
      quantity: 3,
    });
    expect(calculateTotals(updated.items)).toMatchObject({
      itemCount: 5,
      subtotalPaise: 614500,
      totalPaise: 624400,
    });
    expect(initial.items[1]?.quantity).toBe(2);
    expect(sampleCart[1]?.quantity).toBe(2);
  });
  it.each([0, -1, 7, 1.5, NaN, Infinity])(
    'rejects invalid or out-of-stock quantity %s',
    (quantity) => {
      const state = createCart(sampleCart);
      expect(
        cartReducer(state, { type: 'quantity', id: 'arc-mug', quantity }),
      ).toBe(state);
    },
  );
  it('handles removal, clear, restore, and unknown item actions', () => {
    const initial = createCart(sampleCart);
    const removed = cartReducer(initial, { type: 'remove', id: 'arc-mug' });
    expect(calculateTotals(removed.items)).toMatchObject({
      itemCount: 2,
      subtotalPaise: 374800,
      totalPaise: 384700,
    });
    const empty = cartReducer(removed, { type: 'clear' });
    expect(empty.items).toHaveLength(0);
    expect(cartReducer(empty, order)).toBe(empty);
    expect(cartReducer(initial, { type: 'remove', id: 'missing' })).toBe(
      initial,
    );
    expect(
      cartReducer(initial, { type: 'quantity', id: 'missing', quantity: 2 }),
    ).toBe(initial);
    expect(
      cartReducer(empty, { type: 'restore', items: sampleCart }).items,
    ).toEqual(sampleCart);
  });
  it('locks a checkout snapshot, prevents duplicate completion, and clears the active cart', () => {
    const initial = createCart(sampleCart);
    expect(cartReducer(initial, { type: 'complete' })).toBe(initial);
    const pending = cartReducer(initial, order);
    for (const action of [
      order,
      { type: 'quantity', id: 'arc-mug', quantity: 3 },
      { type: 'remove', id: 'arc-mug' },
      { type: 'clear' },
      { type: 'restore', items: sampleCart },
    ] as const) {
      expect(cartReducer(pending, action)).toBe(pending);
    }
    const confirmed = cartReducer(pending, { type: 'complete' });
    expect(confirmed.items).toHaveLength(0);
    expect(confirmed.order?.items).toEqual(sampleCart);
    expect(confirmed.order?.items).not.toBe(initial.items);
    expect(confirmed.order?.totals.totalPaise).toBe(544500);
    expect(confirmed.order?.id).toBe('DEMO-test');
    expect(cartReducer(confirmed, { type: 'complete' })).toBe(confirmed);
    expect(cartReducer(confirmed, order)).toBe(confirmed);
    const restored = cartReducer(confirmed, {
      type: 'restore',
      items: sampleCart,
    });
    expect(restored.phase).toBe('cart');
    expect(restored.order).toBeNull();
  });
});
