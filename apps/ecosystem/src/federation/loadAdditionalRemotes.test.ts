import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import {
  loadCommensal,
  loadMutant,
  loadOffersService,
} from './loadAdditionalRemotes';
vi.mock('@module-federation/runtime', () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(loadRemote).mockReset();
});
afterEach(() => vi.useRealTimers());
describe('Remaining remote federation adapters', () => {
  it.each([
    [loadCommensal, 'commensal', 5003],
    [loadMutant, 'mutant', 5004],
  ] as const)(
    'loads the documented routes using the actual runtime adapter',
    async (loader, name, port) => {
      const Entry = () => null;
      vi.mocked(loadRemote).mockResolvedValue({ default: Entry });
      const loaded = await loader();
      expect(loaded.default).toBe(Entry);
      expect(loadRemote).toHaveBeenCalledWith(`${name}/routes`);
      expect(registerRemotes).toHaveBeenCalledWith([
        {
          name,
          type: 'module',
          entry: `http://127.0.0.1:${port}/remoteEntry.js`,
        },
      ]);
    },
  );
  it('loads the separate offers lifetime contract', async () => {
    const startOffersService = vi.fn(() => vi.fn());
    vi.mocked(loadRemote).mockResolvedValue({ startOffersService });
    expect(await loadOffersService()).toEqual({ startOffersService });
    expect(loadRemote).toHaveBeenCalledWith('mutant/offers-service');
  });
  it('rejects malformed routes and service exports', async () => {
    vi.mocked(loadRemote).mockResolvedValue({ default: 42 });
    await expect(loadCommensal()).rejects.toThrow('Invalid commensal routes');
    vi.mocked(loadRemote).mockResolvedValue(null);
    await expect(loadMutant()).rejects.toThrow('Invalid mutant module');
    vi.mocked(loadRemote).mockResolvedValue({});
    await expect(loadOffersService()).rejects.toThrow(
      'Invalid MUTANT offers service',
    );
  });
  it('bounds stalled remote loads and cleans up the timeout', async () => {
    vi.useFakeTimers();
    vi.mocked(loadRemote).mockReturnValue(new Promise(() => {}));
    const result = expect(loadMutant()).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(12000);
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});
