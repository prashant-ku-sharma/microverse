import { useEffect } from 'react';
import { loadOffersService } from './federation/loadAdditionalRemotes';
/** Orchestration only: the remote owns selection, eligibility, and quote calculation. */
export function useOffersConnection() {
  useEffect(() => {
    let disposed = false;
    let stop: (() => void) | undefined;
    loadOffersService()
      .then((module) => {
        if (disposed) return;
        const cleanup = module.startOffersService();
        if (typeof cleanup !== 'function')
          throw new Error('Invalid offer lifetime cleanup');
        stop = cleanup;
      })
      .catch(() => {
        console.info(
          '[ECOSYSTEM] Offers unavailable; cart remains independently usable.',
        );
      });
    return () => {
      disposed = true;
      stop?.();
    };
  }, []);
}
