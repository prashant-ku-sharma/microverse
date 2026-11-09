import { useEffect, useSyncExternalStore } from 'react';
import { cartService } from './cart-service';

export function useCart() {
  const snapshot = useSyncExternalStore(
    cartService.subscribe,
    cartService.getSnapshot,
  );
  useEffect(() => cartService.start(), []);
  return {
    ...snapshot,
    dispatch: cartService.dispatch,
    retry: cartService.retry,
    reset: cartService.reset,
  };
}
