import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        instructions: resolve(__dirname, 'instructions.html')
      }
    }
  }
});
