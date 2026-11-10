import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { setMockLatency } from '@microverse/mock-utils';
import { createProductHandlers } from './handlers';
import { products } from '../data/products';
const handlers = createProductHandlers(
  products.map((product) => ({
    ...product,
    image: new URL(new URL(product.image).pathname, 'http://127.0.0.1:5001')
      .href,
  })),
);
import { queryClient } from './query';
export const server = setupServer(...handlers);
beforeAll(() => {
  setMockLatency(0);
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});
afterAll(() => server.close());
