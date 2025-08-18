/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_API_POLL_SECONDS?: string;
  readonly VITE_REALTIME?: string;
  readonly VITE_API_TOKEN?: string;
  readonly VITE_WS_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}