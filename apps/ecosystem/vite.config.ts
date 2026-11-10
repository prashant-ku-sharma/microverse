import { defineConfig, loadEnv, mergeConfig } from 'vite';
import { federation } from '@module-federation/vite';
import { createAppConfig } from '@microverse/config/vite';
import { federationShared } from '@microverse/config/federation';
import { symbiontRemote } from './src/federation/symbiontRemote.ts';
import {
  commensalRemote,
  mutantRemote,
} from './src/federation/additionalRemotes.ts';
import { parasiteRemote } from './src/federation/parasiteRemote.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return mergeConfig(createAppConfig(5000), {
    server: { origin: 'http://127.0.0.1:5000' },
    plugins:
      mode === 'test'
        ? []
        : [
            federation({
              name: 'ecosystem',
              remotes: {
                commensal: commensalRemote(env.VITE_COMMENSAL_REMOTE_ENTRY),
                mutant: mutantRemote(env.VITE_MUTANT_REMOTE_ENTRY),
                parasite: parasiteRemote(env.VITE_PARASITE_REMOTE_ENTRY),
                symbiont: symbiontRemote(env.VITE_SYMBIONT_REMOTE_ENTRY),
              },
              shared: federationShared,
              shareStrategy: 'loaded-first',
              dts: false,
            }),
          ],
  });
});
