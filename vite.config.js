import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
