import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/public/mockServiceWorker.js',
    'deployment/.local/**',
  ]),
  js.configs.recommended,
  {
    files: ['deployment/scripts/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
  prettier,
]);
