import { immune } from './store';
import type { RemoteId } from '../nucleus/schema';
export const remotePaths: Record<RemoteId, string> = {
  parasite: '/products',
  symbiont: '/cart',
  commensal: '/profile',
  mutant: '/offers',
};
export function retryRemote(id: RemoteId) {
  immune.retry(id, 'page');
  // A fresh document clears native ESM/federation failures and repins trusted configuration.
  window.location.assign(remotePaths[id]);
}
export function startObservedService(id: RemoteId, start: () => () => void) {
  const token = immune.begin(id, 'background-start', 'service');
  try {
    const stop = start();
    if (typeof stop !== 'function') throw new Error('Invalid lifetime cleanup');
    immune.finish(id, 'background-start', token);
    return stop;
  } catch (error) {
    immune.fail(id, 'background-start', token, error, 'service');
    throw error;
  }
}
