import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { ParasiteRoutesProps } from '@microverse/shared-types';
import { parasiteRemote } from './parasiteRemote';

export interface ParasiteModule {
  default: ComponentType<ParasiteRoutesProps>;
}

/** Uses the plugin-initialized federation runtime; no source import or local fallback. */
export async function loadParasite(): Promise<ParasiteModule> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Runtime-only requests must be registered explicitly; the plugin tracks static imports.
    registerRemotes([
      parasiteRemote(import.meta.env.VITE_PARASITE_REMOTE_ENTRY),
    ]);
    const remote = await Promise.race([
      loadRemote<ParasiteModule>('parasite/routes'),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('PARASITE loading timed out')),
          12000,
        );
      }),
    ]);
    if (!remote || typeof remote.default !== 'function')
      throw new Error('PARASITE does not expose a valid routes component');
    return { default: remote.default };
  } finally {
    clearTimeout(timeout);
  }
}
