/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_RESILIENCE_TESTS?: string;
  readonly VITE_REMOTE_VERSION?: string;
  readonly VITE_APP_LABEL?: string;
}
