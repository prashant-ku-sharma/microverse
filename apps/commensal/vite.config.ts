import { defineConfig, mergeConfig } from 'vite';
import { federation } from '@module-federation/vite';
import { createAppConfig } from '@microverse/config/vite';
import { federationShared } from '@microverse/config/federation';

export default defineConfig(({ mode }) =>
  mergeConfig(createAppConfig(5003), {
    server: {
      origin: 'http://127.0.0.1:5003',
      cors: { origin: 'http://127.0.0.1:5000' },
    },
    preview: { cors: { origin: 'http://127.0.0.1:5000' } },
    plugins:
      mode === 'test'
        ? []
        : [
            federation({
              name: 'commensal',
              filename: 'remoteEntry.js',
              exposes: {
                './routes': './src/routes.tsx',
              },
              shared: federationShared,
              shareStrategy: 'loaded-first',
              dts: false,
            }),
          ],
  }),
);
