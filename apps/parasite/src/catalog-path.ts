import { createContext, useContext } from 'react';

/** Navigation context only. Product/cart business state is never shared here. */
export const CatalogPathContext = createContext('/');
export function useCatalogPath() {
  return useContext(CatalogPathContext);
}
