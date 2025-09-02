/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_ENDPOINT_PATH?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_API_POLL_SECONDS?: string;
  readonly VITE_OFFLINE_MODE?: string;
  readonly VITE_STRICT_NO_FALLBACK?: string;
  readonly VITE_API_TOKEN?: string;
  readonly VITE_DEBUG_SCHEMA?: string;
  readonly VITE_API_SUMMARY_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
