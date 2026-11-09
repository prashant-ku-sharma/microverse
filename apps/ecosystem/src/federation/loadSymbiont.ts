import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { SymbiontRoutesProps } from '@microverse/shared-types';
import { symbiontRemote } from './symbiontRemote';

export interface SymbiontModule {
  default: ComponentType<SymbiontRoutesProps>;
}

/** Uses the plugin-initialized federation runtime; no source import or local fallback. */
export async function loadSymbiont(): Promise<SymbiontModule> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Runtime-only requests must be registered explicitly; the plugin tracks static imports.
    registerRemotes([
      symbiontRemote(import.meta.env.VITE_SYMBIONT_REMOTE_ENTRY),
    ]);
    const remote = await Promise.race([
      loadRemote<SymbiontModule>('symbiont/routes'),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('SYMBIONT loading timed out')),
          12000,
        );
      }),
    ]);
    if (!remote || typeof remote.default !== 'function')
      throw new Error('SYMBIONT does not expose a valid routes component');
    return { default: remote.default };
  } finally {
    clearTimeout(timeout);
  }
}
