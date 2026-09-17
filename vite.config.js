import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Essential for GitHub Pages relative asset paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
