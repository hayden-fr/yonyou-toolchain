import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import multiPage from 'vite-plugin-ncc-multi-page';

export default defineConfig({
  plugins: [multiPage({}), react()],
  server: {
    port: 3006,
    proxy: {},
  },
});
