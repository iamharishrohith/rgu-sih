import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'certificate-entry-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/certificate.html';
          }
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    open: false
  },
  build: {
    rollupOptions: {
      input: 'certificate.html'
    }
  }
});
