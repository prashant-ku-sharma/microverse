import { loadRemote, registerRemotes } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type {
  CommensalRoutesProps,
  MutantRoutesProps,
} from '@microverse/shared-types';
import { commensalRemote, mutantRemote } from './additionalRemotes';
async function load(
  name: 'commensal' | 'mutant',
  expose: 'routes' | 'offers-service',
) {
  registerRemotes([
    name === 'commensal'
      ? commensalRemote(import.meta.env.VITE_COMMENSAL_REMOTE_ENTRY)
      : mutantRemote(import.meta.env.VITE_MUTANT_REMOTE_ENTRY),
  ]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const module = await Promise.race([
      loadRemote<Record<string, unknown>>(`${name}/${expose}`),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${name} loading timed out`)),
          12000,
        );
      }),
    ]);
    if (!module || typeof module !== 'object')
      throw new Error(`Invalid ${name} module`);
    return module;
  } finally {
    clearTimeout(timer);
  }
}
async function routes<P>(name: 'commensal' | 'mutant') {
  const module = await load(name, 'routes');
  if (typeof module.default !== 'function')
    throw new Error(`Invalid ${name} routes`);
  return { default: module.default as ComponentType<P> };
}
export const loadCommensal = () => routes<CommensalRoutesProps>('commensal');
export const loadMutant = () => routes<MutantRoutesProps>('mutant');
export async function loadOffersService() {
  const module = await load('mutant', 'offers-service');
  if (typeof module.startOffersService !== 'function')
    throw new Error('Invalid MUTANT offers service');
  return { startOffersService: module.startOffersService as () => () => void };
}
