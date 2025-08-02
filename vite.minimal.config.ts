
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/minimal',
    rollupOptions: {
      external: [
        // Externalize heavy dependencies for minimal build
        'recharts',
        'd3',
        'framer-motion',
        '@dnd-kit/core',
        'react-window'
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'utils': ['date-fns', 'clsx']
        }
      }
    },
    minify: 'esbuild',
    target: 'es2020'
  }
});
