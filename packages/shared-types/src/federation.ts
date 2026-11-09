/** Host supplies the router and theme; the remote owns all product behavior. */
export interface ParasiteRoutesProps {
  mode?: 'standalone' | 'embedded';
}

/** SYMBIONT keeps cart state local in either execution context. */
export interface SymbiontRoutesProps {
  mode?: 'standalone' | 'embedded';
}
