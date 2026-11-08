import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { loadParasite } from './loadParasite';

vi.mock('@module-federation/runtime', () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(loadRemote).mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('PARASITE runtime loader', () => {
  it('loads the documented remote expose using the real runtime API adapter', async () => {
    const Routes = () => null;
    vi.mocked(loadRemote).mockResolvedValue({ default: Routes });
    expect(await loadParasite()).toEqual({ default: Routes });
    expect(registerRemotes).toHaveBeenCalledWith([
      {
        name: 'parasite',
        type: 'module',
        entry: 'http://127.0.0.1:5001/remoteEntry.js',
      },
    ]);
    expect(loadRemote).toHaveBeenCalledWith('parasite/routes');
  });

  it.each([null, {}, { default: 42 }])(
    'rejects an invalid exposed module (%s)',
    async (module) => {
      vi.mocked(loadRemote).mockResolvedValue(module);
      await expect(loadParasite()).rejects.toThrow('valid routes component');
    },
  );

  it('propagates remote network failures to the route boundary', async () => {
    vi.mocked(loadRemote).mockRejectedValue(
      new Error('Remote server unavailable'),
    );
    await expect(loadParasite()).rejects.toThrow('Remote server unavailable');
  });

  it('bounds a stalled load and clears its timeout', async () => {
    vi.useFakeTimers();
    vi.mocked(loadRemote).mockReturnValue(new Promise(() => {}));
    const failure = expect(loadParasite()).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(12000);
    await failure;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timer after a successful load', async () => {
    vi.useFakeTimers();
    vi.mocked(loadRemote).mockResolvedValue({ default: () => null });
    await loadParasite();
    expect(vi.getTimerCount()).toBe(0);
  });
});
