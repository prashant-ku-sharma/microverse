import type { RemoteRelease } from '@microverse/shared-types';
export const remoteRelease = {
  id: 'mutant',
  version: import.meta.env.VITE_REMOTE_VERSION?.trim() || '1.0.0',
  compatibility: { hostApi: 1, mycelium: 1, reactMajor: 19, muiMajor: 9 },
} as const satisfies RemoteRelease;
