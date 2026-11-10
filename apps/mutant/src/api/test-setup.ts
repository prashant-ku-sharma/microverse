import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { setMockLatency } from '@microverse/mock-utils';
import { handlers } from './handlers';
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
