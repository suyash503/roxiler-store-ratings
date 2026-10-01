import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    // Same-origin in dev, so the httpOnly session cookie just works.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:4100' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
