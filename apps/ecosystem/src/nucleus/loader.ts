import { loadRemote, registerRemotes } from '@module-federation/runtime';
import { nucleus } from './registry';
import type { RegistrySnapshot } from './registry';
import { releaseSchema } from './schema';
import type { RemoteId } from './schema';
import { RemoteDisabledError } from './errors';
export function createRemoteLoader(
  resolve: () => Promise<RegistrySnapshot> = () => nucleus.load(),
) {
  const verified = new Map<RemoteId, Promise<void>>();
  async function timed<T>(request: Promise<T>) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        request,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Remote loading timed out')),
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
    const { registry } = await resolve();
    const remote = registry.remotes[id];
    if (
      !remote.enabled ||
      (expose === 'cart-service' && !registry.features.cartEvents) ||
      (expose === 'offers-service' && !registry.features.offerEvents)
    )
      throw new RemoteDisabledError();
    if (!verified.has(id)) {
      // No compile-time remote URLs exist. Register the policy-validated runtime entry explicitly.
      registerRemotes([{ name: id, type: 'module', entry: remote.entry }]);
      verified.set(
        id,
        timed(loadRemote<unknown>(`${id}/release`)).then((module) => {
          const release = releaseSchema.parse(
            module && typeof module === 'object' && 'remoteRelease' in module
              ? module.remoteRelease
              : null,
          );
          if (release.id !== id || release.version !== remote.version)
            throw new Error('Remote release does not match the registry');
        }),
      );
    }
    await verified.get(id);
    return timed(loadRemote<T>(`${id}/${expose}`));
  };
}
export const loadRegisteredRemote = createRemoteLoader();
