import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Base path for GitHub Pages deployment
  // Matches repository name: Wealth-Defender
  // Use root path for dev, repo path for production
  base: process.env.NODE_ENV === 'production' ? '/Wealth-Defender/' : '/',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});

