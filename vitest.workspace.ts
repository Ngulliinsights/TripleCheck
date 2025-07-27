import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Main frontend application tests
  {
    extends: './vite.config.ts',
    test: {
      name: 'frontend',
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
        'src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}'
      ],
      environment: 'jsdom',
      setupFiles: ['src/shared/test-utils/setup.ts'],
      globals: true,
      testTimeout: 30000,
      hookTimeout: 10000,
      teardownTimeout: 10000,
      pool: 'threads',
      poolOptions: {
        threads: {
          maxThreads: 4,
          minThreads: 1,
          isolate: true,
        },
      },
      maxConcurrency: 4,
      sequence: {
        concurrent: false,
        shuffle: false,
      },
      watch: false,
      cache: {
        dir: 'node_modules/.vitest/frontend',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage/frontend',
        include: ['src/**/*.{js,ts,jsx,tsx}'],
        exclude: [
          'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
          'src/**/*.d.ts',
          'src/**/types.ts',
          'src/**/__tests__/**',
          'src/**/test-utils/**',
          'src/**/*.config.*',
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
    },
  },
  
  // Server-side land verification tests
  {
    test: {
      name: 'land-verification',
      include: ['server/land-verification/**/*.{test,spec}.ts'],
      environment: 'node',
      setupFiles: ['server/land-verification/tests/setup.ts'],
      globals: true,
      testTimeout: 30000,
      hookTimeout: 10000,
      teardownTimeout: 10000,
      pool: 'threads',
      poolOptions: {
        threads: {
          maxThreads: 2,
          minThreads: 1,
          isolate: true,
        },
      },
      maxConcurrency: 2,
      sequence: {
        concurrent: true,
        shuffle: false,
      },
      watch: false,
      cache: {
        dir: 'node_modules/.vitest/land-verification',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage/land-verification',
        include: ['server/land-verification/**/*.ts'],
        exclude: [
          'server/land-verification/**/*.{test,spec}.ts',
          'server/land-verification/**/*.d.ts',
          'server/land-verification/**/types.ts',
          'server/land-verification/__tests__/**',
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': './src',
        '@server': './server',
        '@tests': './server/land-verification/tests',
      },
    },
    define: {
      'process.env.NODE_ENV': '"test"',
      'process.env.DATABASE_URL': '"test-database-url"',
      'process.env.REDIS_URL': '"test-redis-url"',
    },
  },
  
  // Integration tests
  {
    extends: './vite.config.ts',
    test: {
      name: 'integration',
      include: ['src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}'],
      environment: 'jsdom',
      setupFiles: ['src/shared/test-utils/setup.ts'],
      globals: true,
      testTimeout: 60000,
      hookTimeout: 20000,
      teardownTimeout: 20000,
      pool: 'threads',
      poolOptions: {
        threads: {
          maxThreads: 2,
          minThreads: 1,
          isolate: true,
        },
      },
      maxConcurrency: 1, // Run integration tests sequentially
      sequence: {
        concurrent: false,
        shuffle: false,
      },
      watch: false,
      cache: {
        dir: 'node_modules/.vitest/integration',
      },
    },
  },
]);