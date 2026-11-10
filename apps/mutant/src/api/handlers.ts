import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { pricingSchema } from '@microverse/mycelium';
import { mockResponse, ApiError } from '@microverse/mock-utils';
import { coupons, evaluateCoupon } from '../offers';
const validationSchema = z.strictObject({
  code: z.string().min(1).max(40),
  cart: pricingSchema.nullable(),
});
export const handlers = [
  http.get('*/api/offers', ({ request }) =>
    mockResponse(
      'offers',
      request,
      () => HttpResponse.json(coupons),
      () => HttpResponse.json([]),
    ),
  ),
  http.post('*/api/offers/validate', ({ request }) =>
    mockResponse('offers', request, async () => {
      const { code, cart } = validationSchema.parse(
        (await request.json()) as unknown,
      );
      const coupon = coupons.find((item) => item.code === code);
      if (!coupon) throw new ApiError('Coupon not found.', 404);
      if (cart?.checkoutPending)
        return HttpResponse.json({
          eligible: false,
          reason: 'Checkout is in progress.',
          quote: null,
        });
      return HttpResponse.json(evaluateCoupon(coupon, cart));
    }),
  ),
];
