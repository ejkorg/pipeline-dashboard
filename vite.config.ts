import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/pipeline-dashboard/';
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8001';
  // Some upstreams are mounted under "/pipeline-service" and require preserving the prefix.
  // Control whether we strip the prefix when proxying in dev via env:
  // - VITE_DEV_PROXY_STRIP_PREFIX=true  (default) -> strip "/pipeline-service"
  // - VITE_DEV_PROXY_STRIP_PREFIX=false -> preserve "/pipeline-service" in upstream request
  const stripPrefix = env.VITE_DEV_PROXY_STRIP_PREFIX !== 'false';
  return {
  base,
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      dts: 'src/components.d.ts'
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'chart.js']
        }
      }
    }
  },
  server: {
    proxy: {
      // In dev, proxy API calls to avoid CORS
      '/pipeline-service': {
        target: devProxyTarget,
        changeOrigin: true,
        // Conditionally strip the prefix; when false, preserve /pipeline-service for upstreams
        ...(stripPrefix ? { rewrite: (path: string) => path.replace(/^\/pipeline-service/, '') } : {}),
        // keep headers simple; upstream nginx handles auth/headers if needed
      }
    }
  }
};
});