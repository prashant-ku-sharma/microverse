import { defineConfig, mergeConfig } from 'vite';
import { federation } from '@module-federation/vite';
import { createAppConfig } from '@microverse/config/vite';
import { federationShared } from '@microverse/config/federation';

export default defineConfig(({ mode }) =>
  mergeConfig(createAppConfig(5004), {
    test: { setupFiles: ['./src/api/test-setup.ts'] },
    server: {
      origin: 'http://127.0.0.1:5004',
      cors: { origin: 'http://127.0.0.1:5000' },
    },
    preview: { cors: { origin: 'http://127.0.0.1:5000' } },
    plugins:
      mode === 'test'
        ? []
        : [
            federation({
              name: 'mutant',
              filename: 'remoteEntry.js',
              exposes: {
                './release': './src/release.ts',
                './routes': './src/routes.tsx',
                './offers-service': './src/offers-entry.ts',
              },
              shared: federationShared,
              shareStrategy: 'loaded-first',
              dts: false,
            }),
          ],
  }),
);
