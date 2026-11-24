import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function spaFallbackPlugin() {
  return {
    name: 'spa-fallback-plugin',
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname || '.', 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  base: process.env.GITHUB_ACTIONS ? '/medtec.dz/' : './',
});
