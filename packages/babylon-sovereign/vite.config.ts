import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './src/client',
  server: {
    port: 8085,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3005',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  }
});
