import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addItem, getCart, removeItem, updateItem } from './client';
import {
  CART_STORAGE_KEY,
  cartService,
  createCartService,
} from '../cart-service';
const product = {
  id: 'moss',
  name: 'Moss planter',
  category: 'Workspace',
  description: 'A considered planter.',
  image: 'http://127.0.0.1:5001/images/products/moss-planter.svg',
  unitPricePaise: 149000,
  stock: 3,
};
beforeEach(() => {
  sessionStorage.clear();
  cartService.reset();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
describe('SYMBIONT mock cart API', () => {
  it('supports GET/POST/PATCH/DELETE and persists quantities', async () => {
    expect((await getCart()).cart.items).toEqual([]);
    expect((await addItem(product, 1)).cart.items[0]?.quantity).toBe(1);
    expect((await updateItem('moss', 2)).cart.items[0]?.quantity).toBe(2);
    const restored = createCartService();
    expect(restored.read().cart.items[0]?.quantity).toBe(2);
    expect(
      JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!).schemaVersion,
    ).toBe(2);
    await removeItem('moss');
    expect((await getCart()).cart.items).toEqual([]);
  });
  it('rejects missing items, invalid quantities and stock excess without mutation', async () => {
    await expect(updateItem('missing', 1)).rejects.toMatchObject({
      status: 404,
    });
    await addItem(product, 1);
    await expect(updateItem('moss', 4)).rejects.toMatchObject({ status: 409 });
    await expect(updateItem('moss', 0)).rejects.toMatchObject({ status: 400 });
    expect((await getCart()).cart.items[0]?.quantity).toBe(1);
  });
  it('simulates failure without changing persisted cart data', async () => {
    await addItem(product, 1);
    const prior = sessionStorage.getItem(CART_STORAGE_KEY);
    const response = await fetch('http://localhost:3000/api/cart/items/moss', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-mock-scenario': 'error',
      },
      body: JSON.stringify({ quantity: 2 }),
    });
    expect(response.status).toBe(503);
    expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBe(prior);
  });
});
