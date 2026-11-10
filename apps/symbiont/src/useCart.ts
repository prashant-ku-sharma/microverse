import { useEffect, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cartService } from './cart-service';
import { getCart, updateItem, removeItem, addItem } from './api/client';
import { queryClient } from './api/query';
import type { CartAction } from './cart';

export function useCart() {
  const snapshot = useSyncExternalStore(
    cartService.subscribe,
    cartService.getSnapshot,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['cart'], queryFn: getCart });
  useEffect(() => cartService.start(), []);
  useEffect(
    () =>
      cartService.subscribe(() => {
        // Owner facts update this remote's cache, including headless MYCELIUM changes.
        queryClient.setQueryData(['cart'], cartService.getSnapshot());
      }),
    [],
  );
  const mutation = useMutation({
    mutationFn: async (action: CartAction) => {
      if (action.type === 'quantity')
        return updateItem(action.id, action.quantity);
      if (action.type === 'remove') return removeItem(action.id);
      if (action.type === 'add')
        return addItem(action.product, action.quantity);
      // Clear/sample/checkout are local demo workflows, not invented HTTP endpoints.
      cartService.dispatch(action);
      return cartService.getSnapshot();
    },
    onSuccess: () => {
      setApiError(null);
      queryClient.setQueryData(['cart'], cartService.getSnapshot());
    },
    onError: (error) => setApiError(error.message),
  });
  return {
    cart: query.data?.cart ?? snapshot.cart,
    error: apiError ?? query.error?.message ?? snapshot.error,
    loading: query.isPending,
    pending: mutation.isPending,
    dispatch: (action: CartAction) => mutation.mutate(action),
    retry: () => {
      setApiError(null);
      cartService.retry();
      void query.refetch();
    },
    reset: cartService.reset,
  };
}
