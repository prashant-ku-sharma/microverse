import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRegisteredRemote } from '../nucleus/loader';
import { loadParasite } from './loadParasite';
vi.mock('../nucleus/loader', () => ({ loadRegisteredRemote: vi.fn() }));
beforeEach(() => {
  vi.mocked(loadRegisteredRemote).mockReset();
});
describe('Parasite entry adapter', () => {
  it('loads the well-defined routes through NUCLEUS', async () => {
    const Routes = () => null;
    vi.mocked(loadRegisteredRemote).mockResolvedValue({ default: Routes });
    expect(await loadParasite()).toEqual({ default: Routes });
    expect(loadRegisteredRemote).toHaveBeenCalledWith('parasite', 'routes');
  });
  it.each([null, {}, { default: 42 }])(
    'rejects malformed routes %s',
    async (module) => {
      vi.mocked(loadRegisteredRemote).mockResolvedValue(module);
      await expect(loadParasite()).rejects.toThrow('valid routes component');
    },
  );
  it('propagates NUCLEUS/remote failure', async () => {
    vi.mocked(loadRegisteredRemote).mockRejectedValue(new Error('Unavailable'));
    await expect(loadParasite()).rejects.toThrow('Unavailable');
  });
});
