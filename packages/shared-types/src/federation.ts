/** Host supplies the router and theme; the remote owns all product behavior. */
export interface ParasiteRoutesProps {
  mode?: 'standalone' | 'embedded';
}

/** SYMBIONT keeps cart state local in either execution context. */
export interface SymbiontRoutesProps {
  mode?: 'standalone' | 'embedded';
}

export interface CommensalRoutesProps {
  mode?: 'standalone' | 'embedded';
}
export interface MutantRoutesProps {
  mode?: 'standalone' | 'embedded';
}

export interface RemoteRelease {
  id: 'parasite' | 'symbiont' | 'commensal' | 'mutant';
  version: string;
  compatibility: { hostApi: 1; mycelium: 1; reactMajor: 19; muiMajor: 9 };
}
