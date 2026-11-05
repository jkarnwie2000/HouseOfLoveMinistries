import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // One shared .env lives at the project root. Only VITE_* values reach the browser.
  const env = loadEnv(mode, '..', '');
  const apiTarget = `http://localhost:${env.PORT || 4242}`;
  const proxy = {
    '/api': { target: apiTarget, changeOrigin: false },
    '/uploads': { target: apiTarget, changeOrigin: false },
  };
  return {
    plugins: [react()],
    envDir: '..',
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
            if (id.includes('node_modules/lucide-react')) return 'icons';
            return undefined;
          },
        },
      },
    },
  };
});
