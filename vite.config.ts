import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

export default defineConfig({
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
  }
});