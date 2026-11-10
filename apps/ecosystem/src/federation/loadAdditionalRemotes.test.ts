import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRegisteredRemote } from '../nucleus/loader';
import {
  loadCommensal,
  loadMutant,
  loadOffersService,
} from './loadAdditionalRemotes';
vi.mock('../nucleus/loader', () => ({ loadRegisteredRemote: vi.fn() }));
beforeEach(() => {
  vi.mocked(loadRegisteredRemote).mockReset();
});
describe('Remaining remote adapters', () => {
  it.each([
    [loadCommensal, 'commensal'],
    [loadMutant, 'mutant'],
  ] as const)('uses NUCLEUS for routes', async (loader, id) => {
    const Routes = () => null;
    vi.mocked(loadRegisteredRemote).mockResolvedValue({ default: Routes });
    expect(await loader()).toEqual({ default: Routes });
    expect(loadRegisteredRemote).toHaveBeenCalledWith(id, 'routes');
  });
  it('loads the well-defined offers lifetime export', async () => {
    const startOffersService = () => () => {};
    vi.mocked(loadRegisteredRemote).mockResolvedValue({ startOffersService });
    expect(await loadOffersService()).toEqual({ startOffersService });
    expect(loadRegisteredRemote).toHaveBeenCalledWith(
      'mutant',
      'offers-service',
    );
  });
  it('rejects malformed routes and services', async () => {
    vi.mocked(loadRegisteredRemote).mockResolvedValue({ default: 42 });
    await expect(loadCommensal()).rejects.toThrow('Invalid commensal routes');
    vi.mocked(loadRegisteredRemote).mockResolvedValue(null);
    await expect(loadMutant()).rejects.toThrow('Invalid mutant module');
    vi.mocked(loadRegisteredRemote).mockResolvedValue({});
    await expect(loadOffersService()).rejects.toThrow(
      'Invalid MUTANT offers service',
    );
  });
});
