import { ensureMockApi, requestJson, jsonBody } from '@microverse/mock-utils';
import type { CartPricing } from '@microverse/mycelium';
import type { Coupon, evaluateCoupon } from '../offers';
import { handlers } from './handlers';
export async function getOffers() {
  await ensureMockApi('offers', handlers);
  return requestJson<Coupon[]>('/api/offers');
}
export async function validateOffer(code: string, cart: CartPricing | null) {
  await ensureMockApi('offers', handlers);
  return requestJson<ReturnType<typeof evaluateCoupon>>(
    '/api/offers/validate',
    { method: 'POST', ...jsonBody({ code, cart }) },
  );
}
