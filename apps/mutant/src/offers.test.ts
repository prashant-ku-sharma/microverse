import { describe, expect, it } from 'vitest';
import { coupons, evaluateCoupon } from './offers';
import type { CartPricing } from '@microverse/mycelium';
const now = Date.parse('2026-11-10T12:00:00Z');
const cart: CartPricing = {
  itemCount: 2,
  subtotalPaise: 300000,
  shippingPaise: 9900,
  cartRevision: 4,
  revision: 5,
  discountPaise: 0,
  shippingDiscountPaise: 0,
  offerCode: null,
  checkoutPending: false,
};
describe('MUTANT owns offer rules', () => {
  it.each([
    ['WELCOME10', 30000],
    ['SAVE20', 60000],
    ['FREESHIP', 0],
  ])('calculates %s against pre-discount subtotal', (code, discountPaise) => {
    const result = evaluateCoupon(
      coupons.find((coupon) => coupon.code === code)!,
      cart,
      now,
    );
    expect(result.eligible).toBe(true);
    expect(result.quote).toMatchObject({
      code,
      discountPaise,
      cartRevision: 4,
      shippingDiscountPaise: code === 'FREESHIP' ? 9900 : 0,
    });
  });
  it('handles minimum boundaries and rounds percentage savings once to paise', () => {
    const coupon = coupons[0]!;
    expect(
      evaluateCoupon(coupon, { ...cart, subtotalPaise: 99999 }, now).eligible,
    ).toBe(false);
    expect(
      evaluateCoupon(coupon, { ...cart, subtotalPaise: 100000 }, now).eligible,
    ).toBe(true);
    expect(
      evaluateCoupon(coupon, { ...cart, subtotalPaise: 100005 }, now).quote
        ?.discountPaise,
    ).toBe(10001);
  });
  it('requires cart context, items, and a delivery charge for free shipping', () => {
    expect(evaluateCoupon(coupons[0]!, null, now).eligible).toBe(false);
    expect(
      evaluateCoupon(coupons[0]!, { ...cart, itemCount: 0 }, now).eligible,
    ).toBe(false);
    expect(
      evaluateCoupon(coupons[2]!, { ...cart, shippingPaise: 0 }, now).eligible,
    ).toBe(false);
  });
  it('uses explicit inclusive UTC validity boundaries', () => {
    const coupon = coupons[0]!;
    expect(
      evaluateCoupon(coupon, cart, Date.parse(coupon.startsAt) - 1).eligible,
    ).toBe(false);
    expect(
      evaluateCoupon(coupon, cart, Date.parse(coupon.startsAt)).eligible,
    ).toBe(true);
    expect(
      evaluateCoupon(coupon, cart, Date.parse(coupon.expiresAt)).eligible,
    ).toBe(true);
    expect(
      evaluateCoupon(coupon, cart, Date.parse(coupon.expiresAt) + 1).eligible,
    ).toBe(false);
  });
});
