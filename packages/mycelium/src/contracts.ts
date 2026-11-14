import { z } from 'zod';

export const events = {
  PROFILE_UPDATED: 'microverse:profile:updated',
  CHECKOUT_COMPLETED: 'microverse:checkout:completed',
  PRODUCT_ADDED: 'microverse:product:added',
  PRODUCT_REMOVED: 'microverse:product:removed',
  CART_UPDATED: 'microverse:cart:updated',
  CART_CLEARED: 'microverse:cart:cleared',
  CART_PRICING_UPDATED: 'microverse:cart:pricing-updated',
  CART_REQUESTED: 'microverse:cart:requested',
  OFFER_APPLIED: 'microverse:offer:applied',
  OFFER_REMOVED: 'microverse:offer:removed',
} as const;
const id = z.string().min(1).max(120);
const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
/** Transport snapshot only. Cart rules and pricing calculations live in SYMBIONT. */
export const cartProductSchema = z.strictObject({
  id,
  name: z.string().min(1).max(160),
  description: z.string().max(2000),
  category: z.string().min(1).max(120),
  image: z
    .url()
    .refine((url) => /^https?:\/\//.test(url), 'Expected an HTTP image URL'),
  unitPricePaise: money.max(1_000_000_000),
  stock: z.number().int().min(1).max(999),
});
const metadata = {
  id: z.uuid(),
  timestamp: z.iso.datetime(),
  schemaVersion: z.literal(1),
  correlationId: z.uuid(),
};
export const pricingSchema = z.strictObject({
  itemCount: z.number().int().min(0),
  subtotalPaise: money,
  shippingPaise: money,
  cartRevision: z.number().int().min(0),
  revision: z.number().int().min(0),
  discountPaise: money,
  shippingDiscountPaise: money,
  offerCode: z.string().min(1).max(40).nullable(),
  checkoutPending: z.boolean(),
});
export type CartPricing = z.infer<typeof pricingSchema>;
export const offerQuoteSchema = z.strictObject({
  code: z.string().min(1).max(40),
  cartRevision: z.number().int().min(0),
  discountPaise: money,
  shippingDiscountPaise: money,
  expiresAt: z.iso.datetime(),
});
export type OfferQuote = z.infer<typeof offerQuoteSchema>;
export const eventSchema = z.discriminatedUnion('name', [
  z.strictObject({
    ...metadata,
    name: z.literal(events.PROFILE_UPDATED),
    source: z.literal('commensal'),
    payload: z.strictObject({ scope: z.literal('browser-tab') }),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.CHECKOUT_COMPLETED),
    source: z.literal('symbiont'),
    payload: z.strictObject({
      orderId: id,
      itemCount: z.number().int().min(1),
      totalPaise: money,
      simulated: z.literal(true),
    }),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.CART_PRICING_UPDATED),
    source: z.literal('symbiont'),
    payload: pricingSchema,
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.CART_REQUESTED),
    source: z.literal('mutant'),
    payload: z.strictObject({}),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.OFFER_APPLIED),
    source: z.literal('mutant'),
    payload: offerQuoteSchema,
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.OFFER_REMOVED),
    source: z.literal('mutant'),
    payload: z.strictObject({
      code: z.string().min(1).max(40),
      cartRevision: z.number().int().min(0),
      reason: z.enum([
        'user',
        'ineligible',
        'expired',
        'cart-cleared',
        'replaced',
      ]),
    }),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.PRODUCT_ADDED),
    source: z.literal('parasite'),
    payload: z.strictObject({
      product: cartProductSchema,
      quantity: z.number().int().min(1).max(999),
    }),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.PRODUCT_REMOVED),
    source: z.literal('symbiont'),
    payload: z.strictObject({
      productId: id,
      quantity: z.number().int().min(1).max(999),
    }),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.CART_UPDATED),
    source: z.literal('symbiont'),
    payload: z.strictObject({
      itemCount: z.number().int().min(0),
      subtotalPaise: money,
      discountPaise: money,
      totalPaise: money,
      revision: z.number().int().min(0),
    }),
  }),
  z.strictObject({
    ...metadata,
    name: z.literal(events.CART_CLEARED),
    source: z.literal('symbiont'),
    payload: z.strictObject({
      reason: z.enum(['user', 'checkout']),
      revision: z.number().int().min(0),
    }),
  }),
]);
export type EventEnvelope = z.infer<typeof eventSchema>;
export type EventName = EventEnvelope['name'];
export type EventOf<N extends EventName> = Extract<EventEnvelope, { name: N }>;
export type PayloadOf<N extends EventName> = EventOf<N>['payload'];
export type ApplicationId =
  'ecosystem' | 'parasite' | 'symbiont' | 'commensal' | 'mutant';
export type CartProduct = z.infer<typeof cartProductSchema>;
export type EventCallback<N extends EventName> = (
  event: EventOf<N>,
) => void | Promise<void>;
