import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRegisteredRemote } from '../nucleus/loader';
import { loadSymbiont } from './loadSymbiont';
vi.mock('../nucleus/loader', () => ({ loadRegisteredRemote: vi.fn() }));
beforeEach(() => {
  vi.mocked(loadRegisteredRemote).mockReset();
});
describe('Symbiont entry adapter', () => {
  it('loads the well-defined routes through NUCLEUS', async () => {
    const Routes = () => null;
    vi.mocked(loadRegisteredRemote).mockResolvedValue({ default: Routes });
    expect(await loadSymbiont()).toEqual({ default: Routes });
    expect(loadRegisteredRemote).toHaveBeenCalledWith('symbiont', 'routes');
  });
  it.each([null, {}, { default: 42 }])(
    'rejects malformed routes %s',
    async (module) => {
      vi.mocked(loadRegisteredRemote).mockResolvedValue(module);
      await expect(loadSymbiont()).rejects.toThrow('valid routes component');
    },
  );
  it('propagates NUCLEUS/remote failure', async () => {
    vi.mocked(loadRegisteredRemote).mockRejectedValue(new Error('Unavailable'));
    await expect(loadSymbiont()).rejects.toThrow('Unavailable');
  });
});

describe('Cart background facade', () => {
  it('validates the separate lifecycle expose', async () => {
    const { loadCartService } = await import('./loadSymbiont');
    const startCartService = () => () => {};
    vi.mocked(loadRegisteredRemote).mockResolvedValue({ startCartService });
    expect(await loadCartService()).toEqual({ startCartService });
    expect(loadRegisteredRemote).toHaveBeenCalledWith(
      'symbiont',
      'cart-service',
    );
    vi.mocked(loadRegisteredRemote).mockResolvedValue({});
    await expect(loadCartService()).rejects.toThrow('valid cart service');
  });
});
