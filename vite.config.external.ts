import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for External Dependencies
 * 
 * This configuration externalizes large dependencies to CDN
 * to reduce bundle size significantly
 */
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@property': path.resolve(__dirname, './src/property'),
      '@trust': path.resolve(__dirname, './src/trust'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@user': path.resolve(__dirname, './src/user'),
      '@communication': path.resolve(__dirname, './src/communication'),
      '@analytics': path.resolve(__dirname, './src/analytics'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@server': path.resolve(__dirname, './server'),
    },
  },

  // Externalize large dependencies to CDN
  build: {
    rollupOptions: {
      external: [
        // UI Components (load from CDN)
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-popover',
        '@radix-ui/react-select',
        
        // Icons (load from CDN)
        'lucide-react',
        'react-icons',
        
        // Animation (load from CDN)
        'framer-motion',
        
        // Charts (load from CDN)
        'recharts',
        
        // Utilities (load from CDN)
        '@tanstack/react-query',
        'axios',
        'date-fns',
        
        // Form libraries (load from CDN)
        'react-hook-form',
        '@hookform/resolvers',
      ],
      
      output: {
        globals: {
          // Map external dependencies to global variables
          '@radix-ui/react-dialog': 'RadixDialog',
          '@radix-ui/react-dropdown-menu': 'RadixDropdown',
          'lucide-react': 'Lucide',
          'framer-motion': 'FramerMotion',
          'recharts': 'Recharts',
          '@tanstack/react-query': 'ReactQuery',
          'axios': 'axios',
          'react-hook-form': 'ReactHookForm',
        },
      },
    },
    
    // Optimize chunk splitting
    chunkSizeWarningLimit: 500,
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // CSS optimization
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('cssnano')({
          preset: 'default',
        }),
      ],
    },
  },

  // Development server configuration
  server: {
    port: 3003,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // Preview server configuration
  preview: {
    port: 3003,
    host: true,
  },
});