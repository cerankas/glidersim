import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: true },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toLocaleString())
  },
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
});