import { createImmuneSystem } from '../immune/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { createRemoteLoader } from './loader';
import { RemoteDisabledError } from './errors';
import { registrySchema } from './schema';
import remotes from '../../public/nucleus/remotes.json';
import type { RegistrySnapshot } from './registry';
vi.mock('@module-federation/runtime', () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}));
const makeLoader = (resolve: () => Promise<RegistrySnapshot>) =>
  createRemoteLoader(resolve, createImmuneSystem());
const snapshot = (): RegistrySnapshot => ({
  registry: registrySchema.parse(remotes),
  environment: 'development',
  source: 'primary',
  warning: null,
});
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(loadRemote).mockReset();
  vi.mocked(registerRemotes).mockClear();
});
afterEach(() => vi.useRealTimers());
describe('NUCLEUS supported federation runtime integration', () => {
  it.each(['parasite', 'symbiont', 'commensal', 'mutant'] as const)(
    'registers %s from the registry, checks release, then loads routes',
    async (id) => {
      const data = snapshot();
      const Routes = () => null;
      vi.mocked(loadRemote)
        .mockResolvedValueOnce({
          remoteRelease: {
            id,
            version: '1.0.0',
            compatibility: data.registry.remotes[id].compatibility,
          },
        })
        .mockResolvedValueOnce({ default: Routes });
      const load = makeLoader(async () => data);
      expect(await load(id, 'routes')).toEqual({ default: Routes });
      expect(registerRemotes).toHaveBeenCalledWith([
        { name: id, type: 'module', entry: data.registry.remotes[id].entry },
      ]);
      expect(loadRemote).toHaveBeenNthCalledWith(1, `${id}/release`);
      expect(loadRemote).toHaveBeenNthCalledWith(2, `${id}/routes`);
    },
  );
  it('shares one metadata handshake across concurrent routes and background services', async () => {
    const data = snapshot();
    vi.mocked(loadRemote).mockImplementation(async (name) =>
      name === 'symbiont/release'
        ? {
            remoteRelease: {
              id: 'symbiont',
              version: '1.0.0',
              compatibility: data.registry.remotes.symbiont.compatibility,
            },
          }
        : { default: () => null, startCartService: () => () => {} },
    );
    const load = makeLoader(async () => data);
    await Promise.all([
      load('symbiont', 'routes'),
      load('symbiont', 'cart-service'),
    ]);
    expect(registerRemotes).toHaveBeenCalledOnce();
    expect(
      vi
        .mocked(loadRemote)
        .mock.calls.filter(([name]) => name === 'symbiont/release'),
    ).toHaveLength(1);
  });
  it.each(['version', 'id', 'compatibility', 'missing'])(
    'blocks application code after a %s release mismatch',
    async (kind) => {
      const data = snapshot();
      const release = {
        id: kind === 'id' ? 'mutant' : 'symbiont',
        version: kind === 'version' ? '9.0.0' : '1.0.0',
        compatibility: {
          ...data.registry.remotes.symbiont.compatibility,
          hostApi: kind === 'compatibility' ? 2 : 1,
        },
      };
      vi.mocked(loadRemote).mockResolvedValue(
        kind === 'missing' ? null : { remoteRelease: release },
      );
      await expect(
        makeLoader(async () => data)('symbiont', 'routes'),
      ).rejects.toThrow();
      expect(loadRemote).toHaveBeenCalledOnce();
    },
  );
  it('blocks disabled remotes and background feature flags before registration', async () => {
    const data = snapshot();
    data.registry.remotes.commensal.enabled = false;
    data.registry.features.cartEvents = false;
    data.registry.features.offerEvents = false;
    const load = makeLoader(async () => data);
    await expect(load('commensal', 'routes')).rejects.toBeInstanceOf(
      RemoteDisabledError,
    );
    await expect(load('symbiont', 'cart-service')).rejects.toBeInstanceOf(
      RemoteDisabledError,
    );
    await expect(load('mutant', 'offers-service')).rejects.toBeInstanceOf(
      RemoteDisabledError,
    );
    expect(registerRemotes).not.toHaveBeenCalled();
    expect(loadRemote).not.toHaveBeenCalled();
  });
  it('never registers or loads after configuration failure', async () => {
    await expect(
      makeLoader(async () => {
        throw new Error('No policy');
      })('symbiont', 'routes'),
    ).rejects.toThrow('Trusted runtime configuration');
    expect(registerRemotes).not.toHaveBeenCalled();
    expect(loadRemote).not.toHaveBeenCalled();
  });
  it('bounds stalled module loading and propagates network rejection', async () => {
    vi.useFakeTimers();
    vi.mocked(loadRemote).mockReturnValue(new Promise(() => {}));
    const failure = expect(
      makeLoader(async () => snapshot())('symbiont', 'routes'),
    ).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(12000);
    await failure;
    expect(vi.getTimerCount()).toBe(0);
    vi.mocked(loadRemote).mockRejectedValue(new Error('Offline'));
    await expect(
      makeLoader(async () => snapshot())('symbiont', 'routes'),
    ).rejects.toThrow('remote module');
  });
  it('uses a changed runtime URL in a new document loader without build-time configuration', async () => {
    for (const version of ['1.0.0', '1.1.0']) {
      const data = snapshot();
      data.registry.remotes.symbiont.version = version;
      data.registry.remotes.symbiont.entry = `http://127.0.0.1:5002/releases/${version}/remoteEntry.js`;
      vi.mocked(loadRemote)
        .mockResolvedValueOnce({
          remoteRelease: {
            id: 'symbiont',
            version,
            compatibility: data.registry.remotes.symbiont.compatibility,
          },
        })
        .mockResolvedValueOnce({ version, default: () => null });
      expect(
        await makeLoader(async () => data)('symbiont', 'routes'),
      ).toMatchObject({ version });
      expect(registerRemotes).toHaveBeenLastCalledWith([
        {
          name: 'symbiont',
          type: 'module',
          entry: data.registry.remotes.symbiont.entry,
        },
      ]);
    }
  });
  it('records timeout/incompatible states and ignores a late metadata completion', async () => {
    vi.useFakeTimers();
    const data = snapshot();
    const observations = createImmuneSystem();
    let finish: ((value: unknown) => void) | undefined;
    vi.mocked(loadRemote).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const failure = expect(
      createRemoteLoader(async () => data, observations)('parasite', 'routes'),
    ).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(12000);
    await failure;
    expect(observations.getSnapshot().remotes.parasite.status).toBe(
      'timed-out',
    );
    finish?.({
      remoteRelease: {
        id: 'parasite',
        version: '1.0.0',
        compatibility: data.registry.remotes.parasite.compatibility,
      },
    });
    await Promise.resolve();
    expect(observations.getSnapshot().remotes.parasite.status).toBe(
      'timed-out',
    );
    vi.mocked(loadRemote).mockResolvedValue({
      remoteRelease: {
        id: 'parasite',
        version: '99.0.0',
        compatibility: data.registry.remotes.parasite.compatibility,
      },
    });
    await expect(
      createRemoteLoader(async () => data, observations)('parasite', 'routes'),
    ).rejects.toThrow('does not match');
    expect(observations.getSnapshot().remotes.parasite.status).toBe(
      'incompatible',
    );
  });
});
