import { ensureMockApi, requestJson, jsonBody } from '@microverse/mock-utils';
import type { CartItem, CartState } from '../cart';
import { handlers } from './handlers';
export interface CartResponse {
  cart: CartState;
  error: string | null;
}
async function request(path: string, init?: RequestInit) {
  await ensureMockApi('cart', handlers);
  return requestJson<CartResponse>(path, init);
}
export const getCart = () => request('/api/cart');
export const addItem = (
  product: Omit<CartItem, 'quantity'>,
  quantity: number,
) =>
  request('/api/cart/items', {
    method: 'POST',
    ...jsonBody({ product, quantity }),
  });
export const updateItem = (id: string, quantity: number) =>
  request(`/api/cart/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    ...jsonBody({ quantity }),
  });
export const removeItem = (id: string) =>
  request(`/api/cart/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
