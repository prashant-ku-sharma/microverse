import type { CartPricing, OfferQuote } from '@microverse/mycelium';
export interface Coupon {
  code: string;
  name: string;
  description: string;
  kind: 'percentage' | 'shipping';
  percentage: number;
  minimumPaise: number;
  startsAt: string;
  expiresAt: string;
}
const validity = {
  startsAt: '2026-11-01T00:00:00.000Z',
  expiresAt: '2027-12-31T23:59:59.999Z',
};
export const coupons: readonly Coupon[] = [
  {
    code: 'WELCOME10',
    name: 'A little welcome.',
    description: '10% off your collection when your subtotal reaches ₹1,000.',
    kind: 'percentage',
    percentage: 10,
    minimumPaise: 100000,
    ...validity,
  },
  {
    code: 'SAVE20',
    name: 'Room for more good.',
    description: '20% off your collection on a subtotal of ₹3,000 or more.',
    kind: 'percentage',
    percentage: 20,
    minimumPaise: 300000,
    ...validity,
  },
  {
    code: 'FREESHIP',
    name: 'The journey is on us.',
    description: 'Waive the delivery charge when your subtotal reaches ₹1,500.',
    kind: 'shipping',
    percentage: 0,
    minimumPaise: 150000,
    ...validity,
  },
];
export function money(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(paise / 100);
}
/** All eligibility and promotional calculation rules live here, never in Cart or MYCELIUM. */
export function evaluateCoupon(
  coupon: Coupon,
  cart: CartPricing | null,
  now = Date.now(),
): { eligible: boolean; reason: string; quote: OfferQuote | null } {
  if (now < Date.parse(coupon.startsAt))
    return {
      eligible: false,
      reason: 'This coupon is not active yet.',
      quote: null,
    };
  if (now > Date.parse(coupon.expiresAt))
    return { eligible: false, reason: 'This coupon has expired.', quote: null };
  if (!cart)
    return {
      eligible: false,
      reason: 'Waiting for your cart. Open Cart or use the standalone preview.',
      quote: null,
    };
  if (!cart.itemCount)
    return {
      eligible: false,
      reason: 'Add a product to your cart first.',
      quote: null,
    };
  if (cart.subtotalPaise < coupon.minimumPaise)
    return {
      eligible: false,
      reason: `Add ${money(coupon.minimumPaise - cart.subtotalPaise)} more to qualify.`,
      quote: null,
    };
  if (coupon.kind === 'shipping' && cart.shippingPaise === 0)
    return {
      eligible: false,
      reason: 'There is no delivery charge to waive.',
      quote: null,
    };
  const quote = {
    code: coupon.code,
    cartRevision: cart.cartRevision,
    discountPaise:
      coupon.kind === 'percentage'
        ? Math.round((cart.subtotalPaise * coupon.percentage) / 100)
        : 0,
    shippingDiscountPaise: coupon.kind === 'shipping' ? cart.shippingPaise : 0,
    expiresAt: coupon.expiresAt,
  };
  return { eligible: true, reason: 'Eligible for your cart.', quote };
}
