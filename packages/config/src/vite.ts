import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export function createAppConfig(port: number) {
  return defineConfig({
    plugins: [react()],
    server: { port, strictPort: true, host: '127.0.0.1' },
    preview: { port, strictPort: true, host: '127.0.0.1' },
    test: {
      environment: 'jsdom',
      setupFiles: ['@microverse/config/test-setup'],
      restoreMocks: true,
    },
  });
}
