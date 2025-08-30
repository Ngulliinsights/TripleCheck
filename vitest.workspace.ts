/**
 * CONSOLIDATED VITEST WORKSPACE - CRITICAL CONFIGURATION FIX
 * =========================================================
 * 
 * Addresses the configuration sprawl issue identified in the audit.
 * Previously had 15+ separate Vitest configurations causing conflicts.
 * Now consolidated into a single, manageable workspace configuration.
 */

import { defineWorkspace } from 'vitest/config';

// Shared test configuration to reduce duplication
const sharedTestConfig = {
  globals: true,
  testTimeout: 30000,
  hookTimeout: 10000,
  teardownTimeout: 10000,
  pool: 'threads' as const,
  watch: false,
  sequence: {
    shuffle: false,
  },
};

// Shared coverage configuration
const sharedCoverageConfig = {
  provider: 'v8' as const,
  reporter: ['text', 'json', 'html'] as const,
  exclude: [
    '**/*.{test,spec}.{js,ts,jsx,tsx}',
    '**/*.d.ts',
    '**/types.ts',
    '**/__tests__/**',
    '**/*.config.*',
  ],
};

export default defineWorkspace([
  // Frontend tests - consolidated from multiple configs
  {
    extends: './vite.config.ts',
    test: {
      ...sharedTestConfig,
      name: 'frontend',
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
        'src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}'
      ],
      environment: 'jsdom',
      setupFiles: ['src/shared/test-utils/setup.ts'],
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
      cache: {
        dir: 'node_modules/.vitest/frontend',
      },
      coverage: {
        ...sharedCoverageConfig,
        reportsDirectory: './coverage/frontend',
        include: ['src/**/*.{js,ts,jsx,tsx}'],
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
  
  // Backend tests - consolidated from land-verification + infrastructure configs
  {
    test: {
      ...sharedTestConfig,
      name: 'backend',
      include: ['server/**/*.{test,spec}.ts'],
      environment: 'node',
      setupFiles: ['server/tests/setup.ts'],
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
      cache: {
        dir: 'node_modules/.vitest/backend',
      },
      coverage: {
        ...sharedCoverageConfig,
        reportsDirectory: './coverage/backend',
        include: ['server/**/*.ts'],
        thresholds: {
          global: {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75,
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': './src',
        '@server': './server',
      },
    },
    define: {
      'process.env.NODE_ENV': '"test"',
      'process.env.DATABASE_URL': '"test-database-url"',
      'process.env.REDIS_URL': '"test-redis-url"',
    },
  },

  // Integration tests - simplified configuration
  {
    extends: './vite.config.ts',
    test: {
      ...sharedTestConfig,
      name: 'integration',
      include: [
        'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
        'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}'
      ],
      environment: 'jsdom',
      setupFiles: ['src/shared/test-utils/setup.ts'],
      testTimeout: 60000,
      hookTimeout: 20000,
      teardownTimeout: 20000,
      poolOptions: {
        threads: {
          maxThreads: 1,
          minThreads: 1,
          isolate: true,
        },
      },
      maxConcurrency: 1, // Run integration tests sequentially
      sequence: {
        concurrent: false,
        shuffle: false,
      },
      cache: {
        dir: 'node_modules/.vitest/integration',
      },
    },
  },
]);