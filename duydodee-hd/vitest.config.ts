
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '@testing-library/jest-dom',
    server: {
      deps: {
        inline: ['@exodus/bytes', 'html-encoding-sniffer'],
      },
    },
  },
});
