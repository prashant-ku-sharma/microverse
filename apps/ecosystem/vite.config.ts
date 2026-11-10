import { defineConfig, mergeConfig } from 'vite';
import { federation } from '@module-federation/vite';
import { createAppConfig } from '@microverse/config/vite';
import { federationShared } from '@microverse/config/federation';
export default defineConfig(({ mode }) =>
  mergeConfig(createAppConfig(5000), {
    server: { origin: 'http://127.0.0.1:5000' },
    plugins:
      mode === 'test'
        ? []
        : [
            federation({
              name: 'ecosystem',
              remotes: {},
              shared: federationShared,
              shareStrategy: 'loaded-first',
              dts: false,
            }),
          ],
  }),
);
