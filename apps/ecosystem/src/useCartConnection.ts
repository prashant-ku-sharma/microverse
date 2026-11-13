import { startObservedService } from './immune/recovery';
import { RemoteDisabledError } from './nucleus/errors';
import { useEffect, useState } from 'react';
import { events, subscribe } from '@microverse/mycelium';
import { loadCartService } from './federation/loadSymbiont';

/** Host observes facts; it never reads SYMBIONT's state or persistence keys. */
export function useCartConnection() {
  const [connection, setConnection] = useState<{
    count: number | null;
    status: 'connecting' | 'ready' | 'unavailable' | 'disabled';
  }>({ count: null, status: 'connecting' });
  useEffect(() => {
    let disposed = false;
    let lastRevision = -1;
    let stopService: (() => void) | undefined;
    // Subscribe first: startCartService emits its restored state, including an empty cart.
    const stopUpdated = subscribe(events.CART_UPDATED, (event) => {
      if (event.payload.revision < lastRevision) return;
      lastRevision = event.payload.revision;
      setConnection({ count: event.payload.itemCount, status: 'ready' });
    });
    const stopCleared = subscribe(events.CART_CLEARED, (event) => {
      if (event.payload.revision < lastRevision) return;
      lastRevision = event.payload.revision;
      setConnection({ count: 0, status: 'ready' });
    });
    loadCartService()
      .then((service) => {
        if (!disposed)
          stopService = startObservedService(
            'symbiont',
            service.startCartService,
          );
      })
      .catch((error: unknown) => {
        if (!disposed)
          setConnection({
            count: null,
            status:
              error instanceof RemoteDisabledError ? 'disabled' : 'unavailable',
          });
      });
    return () => {
      disposed = true;
      stopUpdated();
      stopCleared();
      stopService?.();
    };
  }, []);
  return connection;
}
