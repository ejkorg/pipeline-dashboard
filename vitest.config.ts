import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts']
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, 'src') }
    }
});