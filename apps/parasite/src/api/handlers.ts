import { http, HttpResponse } from 'msw';
import { mockResponse } from '@microverse/mock-utils';
import type { Product } from '@microverse/shared-types';
import { products } from '../data/products';
export const createProductHandlers = (inventory: readonly Product[]) => [
  http.get('*/api/products', ({ request }) =>
    mockResponse(
      'products',
      request,
      () => HttpResponse.json(inventory),
      () => HttpResponse.json([]),
    ),
  ),
  http.get('*/api/products/:id', ({ request, params }) =>
    mockResponse('products', request, () => {
      const product = inventory.find((item) => item.id === params.id);
      return product
        ? HttpResponse.json(product)
        : HttpResponse.json({ message: 'Product not found.' }, { status: 404 });
    }),
  ),
];

export const handlers = createProductHandlers(products);
