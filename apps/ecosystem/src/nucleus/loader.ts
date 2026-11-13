import { immune } from '../immune/store';
import { RemoteFailure, describeFailure } from '../immune/errors';
import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { nucleus } from './registry';
import type { RegistrySnapshot } from './registry';
import { releaseSchema } from './schema';
import type { RemoteId } from './schema';
import { RemoteDisabledError } from './errors';
export function createRemoteLoader(
  resolve: () => Promise<RegistrySnapshot> = () => nucleus.load(),
  observations = immune,
) {
  const verified = new Map<RemoteId, Promise<void>>();
  async function timed<T>(request: Promise<T>, phase: 'release' | 'load') {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        request,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new RemoteFailure(
                  'timed-out',
                  phase,
                  'Remote loading timed out after 12 seconds.',
                ),
              ),
            12000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  return async function load<T>(
    id: RemoteId,
    expose: 'routes' | 'cart-service' | 'offers-service',
  ): Promise<T | null> {
    const token = observations.begin(id, expose, 'load');
    let phase: 'configuration' | 'release' | 'load' = 'configuration';
    try {
      const { registry } = await resolve();
      const remote = registry.remotes[id];
      observations.context(id, {
        version: remote.version,
        entry: remote.entry,
      });
      if (
        !remote.enabled ||
        (expose === 'cart-service' && !registry.features.cartEvents) ||
        (expose === 'offers-service' && !registry.features.offerEvents)
      )
        throw new RemoteDisabledError();
      phase = 'release';
      if (!verified.has(id)) {
        registerRemotes([{ name: id, type: 'module', entry: remote.entry }]);
        verified.set(
          id,
          timed(loadRemote<unknown>(`${id}/release`), 'release').then(
            (module) => {
              const result = releaseSchema.safeParse(
                module &&
                  typeof module === 'object' &&
                  'remoteRelease' in module
                  ? module.remoteRelease
                  : null,
              );
              if (
                !result.success ||
                result.data.id !== id ||
                result.data.version !== remote.version
              )
                throw new RemoteFailure(
                  'incompatible',
                  'release',
                  'Remote identity, version or compatibility does not match the registry.',
                );
            },
          ),
        );
      }
      await verified.get(id);
      phase = 'load';
      const module = await timed(loadRemote<T>(`${id}/${expose}`), 'load');
      const key =
        expose === 'routes'
          ? 'default'
          : expose === 'cart-service'
            ? 'startCartService'
            : 'startOffersService';
      if (
        !module ||
        typeof module !== 'object' ||
        !(key in module) ||
        typeof (module as Record<string, unknown>)[key] !== 'function'
      )
        throw new RemoteFailure(
          'failed',
          'load',
          'The remote does not expose a valid application or service.',
        );
      observations.finish(id, expose, token);
      return module;
    } catch (error) {
      if (error instanceof RemoteDisabledError) {
        observations.disabled(id, expose, token);
        throw error;
      }
      const failure = describeFailure(error, phase);
      observations.fail(id, expose, token, failure, phase);
      throw failure;
    }
  };
}
export const loadRegisteredRemote = createRemoteLoader();
