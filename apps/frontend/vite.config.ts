import { sentryVitePlugin } from "@sentry/vite-plugin";
import 'dotenv/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sentryVitePlugin({
    org: "trawa",
    project: "portal-api"
  })],

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  build: {
    sourcemap: true,
  },
});