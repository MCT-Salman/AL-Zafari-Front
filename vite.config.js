import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'analyze'
      ? [
          visualizer({
            filename: 'dist/stats.json',
            template: 'raw-data',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('node_modules')) {
            if (normalizedId.includes('/xlsx/')) {
              return 'xlsx-vendor';
            }
            if (
              normalizedId.includes('/@radix-ui/') ||
              normalizedId.includes('/@floating-ui/')
            ) {
              return 'ui-vendor';
            }
            if (normalizedId.includes('/axios/')) {
              return 'api-vendor';
            }
            if (
              normalizedId.includes('/react-router/') ||
              normalizedId.includes('/react-router-dom/') ||
              normalizedId.includes('/@remix-run/router/')
            ) {
              return 'router-vendor';
            }
            if (normalizedId.includes('/lucide-react/')) {
              return 'icons-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
}))
