import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import themePlugin from '@replit/vite-plugin-shadcn-theme-json'
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'

export const baseConfig = defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      include: "**/*.{jsx,tsx}",
    }),
    runtimeErrorOverlay(),
    themePlugin(),
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@shared': resolve(__dirname, '../../src/shared'),
      '@property': resolve(__dirname, '../../src/property'),
      '@trust': resolve(__dirname, '../../src/trust'),
      '@auth': resolve(__dirname, '../../src/auth'),
      '@user': resolve(__dirname, '../../src/user'),
      '@search': resolve(__dirname, '../../src/search'),
      '@communication': resolve(__dirname, '../../src/communication'),
      '@analytics': resolve(__dirname, '../../src/analytics'),
      '@infrastructure': resolve(__dirname, '../../src/infrastructure'),
      '@components': resolve(__dirname, '../../src/shared/components'),
      '@hooks': resolve(__dirname, '../../src/shared/hooks'),
      '@utils': resolve(__dirname, '../../src/shared/utils'),
      '@types': resolve(__dirname, '../../src/shared/types'),
      '@assets': resolve(__dirname, '../../src/assets'),
      '@server': resolve(__dirname, '../../server'),
      '@tests': resolve(__dirname, '../../server/land-verification/tests')
    }
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/shared/test-utils/setup.ts'],
    
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
        isolate: true,
      },
    },
    
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    maxConcurrency: 4,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    
    watch: false,
    cache: {
      dir: 'node_modules/.vitest',
    },
    
    reporter: ['verbose'],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      clean: true,
      cleanOnRerun: true,
      include: ['src/**/*.{js,ts,jsx,tsx}', 'server/**/*.{js,ts}'],
      exclude: [
        'node_modules/',
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'server/**/*.{test,spec}.{js,ts}',
        'src/**/*.d.ts',
        'server/**/*.d.ts',
        'src/**/types.ts',
        'server/**/types.ts',
        'src/**/__tests__/**',
        'server/**/__tests__/**',
        'src/**/test-utils/**',
        'server/**/test-utils/**',
        'src/**/*.config.*',
        'server/**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    
    env: {
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:3001',
      VITE_APP_ENV: 'test',
    },
  }
})