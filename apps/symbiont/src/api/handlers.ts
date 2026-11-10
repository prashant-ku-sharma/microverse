import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { cartProductSchema } from '@microverse/mycelium';
import { mockResponse, ApiError } from '@microverse/mock-utils';
import { cartService } from '../cart-service';
import { createCart } from '../cart';
const addSchema = z.strictObject({
  product: cartProductSchema,
  quantity: z.number().int().min(1).max(999),
});
const quantitySchema = z.strictObject({
  quantity: z.number().int().min(1).max(999),
});
function snapshot() {
  const state = cartService.read();
  if (state.error) throw new ApiError(state.error, 500);
  return state;
}
export const handlers = [
  http.get('*/api/cart', ({ request }) =>
    mockResponse(
      'cart',
      request,
      () => HttpResponse.json(snapshot()),
      () => HttpResponse.json({ cart: createCart([]), error: null }),
    ),
  ),
  http.post('*/api/cart/items', ({ request }) =>
    mockResponse('cart', request, async () => {
      const input = addSchema.parse((await request.json()) as unknown);
      const current = snapshot().cart;
      if (current.phase === 'processing')
        throw new ApiError('Checkout is in progress.', 409);
      const existing = current.items.find(
        (item) => item.id === input.product.id,
      );
      if (
        (existing?.quantity ?? 0) + input.quantity >
        (existing?.stock ?? input.product.stock)
      )
        throw new ApiError('Requested quantity exceeds stock.', 409);
      cartService.dispatch({ type: 'add', ...input });
      return HttpResponse.json(snapshot(), { status: 201 });
    }),
  ),
  http.patch('*/api/cart/items/:id', ({ request, params }) =>
    mockResponse('cart', request, async () => {
      const { quantity } = quantitySchema.parse(
        (await request.json()) as unknown,
      );
      const current = snapshot().cart;
      const item = current.items.find((line) => line.id === params.id);
      if (!item) throw new ApiError('Cart item not found.', 404);
      if (current.phase === 'processing' || quantity > item.stock)
        throw new ApiError('Quantity update is not available.', 409);
      cartService.dispatch({ type: 'quantity', id: item.id, quantity });
      return HttpResponse.json(snapshot());
    }),
  ),
  http.delete('*/api/cart/items/:id', ({ request, params }) =>
    mockResponse('cart', request, () => {
      const current = snapshot().cart;
      const item = current.items.find((line) => line.id === params.id);
      if (!item) throw new ApiError('Cart item not found.', 404);
      if (current.phase === 'processing')
        throw new ApiError('Checkout is in progress.', 409);
      cartService.dispatch({ type: 'remove', id: item.id });
      return HttpResponse.json(snapshot());
    }),
  ),
];
