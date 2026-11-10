import { loadRegisteredRemote } from '../nucleus/loader';
import type { ComponentType } from 'react';
import type {
  CommensalRoutesProps,
  MutantRoutesProps,
} from '@microverse/shared-types';
async function load(
  name: 'commensal' | 'mutant',
  expose: 'routes' | 'offers-service',
) {
  const module = await loadRegisteredRemote<Record<string, unknown>>(
    name,
    expose,
  );
  if (!module || typeof module !== 'object')
    throw new Error(`Invalid ${name} module`);
  return module;
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
