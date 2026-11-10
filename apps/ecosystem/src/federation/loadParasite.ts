import { loadRegisteredRemote } from '../nucleus/loader';
import type { ComponentType } from 'react';
import type { ParasiteRoutesProps } from '@microverse/shared-types';

export interface ParasiteModule {
  default: ComponentType<ParasiteRoutesProps>;
}

/** Uses the plugin-initialized federation runtime; no source import or local fallback. */
export async function loadParasite(): Promise<ParasiteModule> {
  const remote = await loadRegisteredRemote<ParasiteModule>(
    'parasite',
    'routes',
  );
  if (!remote || typeof remote.default !== 'function')
    throw new Error('PARASITE does not expose a valid routes component');
  return { default: remote.default };
}
