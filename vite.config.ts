import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/pipeline-dashboard/';
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://usaz15ls088:8001';
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
        rewrite: (path) => path.replace(/^\/pipeline-service/, ''),
        // keep headers simple; upstream nginx handles auth/headers if needed
      }
    }
  }
};
});