import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { SymbiontRoutesProps } from '@microverse/shared-types';
import { symbiontRemote } from './symbiontRemote';

export interface SymbiontModule {
  default: ComponentType<SymbiontRoutesProps>;
}

async function loadExpose<T>(
  expose: 'routes' | 'cart-service',
): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    registerRemotes([
      symbiontRemote(import.meta.env.VITE_SYMBIONT_REMOTE_ENTRY),
    ]);
    return await Promise.race([
      loadRemote<T>(`symbiont/${expose}`),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('SYMBIONT loading timed out')),
          12000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
/** Uses the plugin-initialized federation runtime; no source import or local fallback. */
export async function loadSymbiont(): Promise<SymbiontModule> {
  const remote = await loadExpose<SymbiontModule>('routes');
  if (!remote || typeof remote.default !== 'function')
    throw new Error('SYMBIONT does not expose a valid routes component');
  return { default: remote.default };
}
export interface CartServiceModule {
  startCartService: () => () => void;
}
export async function loadCartService(): Promise<CartServiceModule> {
  const remote = await loadExpose<CartServiceModule>('cart-service');
  if (!remote || typeof remote.startCartService !== 'function')
    throw new Error('SYMBIONT does not expose a valid cart service');
  return remote;
}
