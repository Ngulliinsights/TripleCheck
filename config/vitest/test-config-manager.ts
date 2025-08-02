import { defineConfig, mergeConfig } from 'vitest/config'
import { baseConfig } from './vitest.base.config'

export type TestSuite = 
  | 'unit' 
  | 'integration' 
  | 'performance' 
  | 'security' 
  | 'e2e' 
  | 'land-verification' 
  | 'fraud-detection'
  | 'document-auth'

export interface TestEnvironmentConfig {
  suite: TestSuite
  environment: 'jsdom' | 'node'
  include: string[]
  exclude?: string[]
  setupFiles?: string[]
  testTimeout?: number
  hookTimeout?: number
  maxThreads?: number
  coverage?: {
    threshold?: number
    include?: string[]
    exclude?: string[]
  }
  env?: Record<string, string>
}

const testSuiteConfigs: Record<TestSuite, TestEnvironmentConfig> = {
  unit: {
    suite: 'unit',
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      '!src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
      '!src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
      '!src/**/*.performance.{test,spec}.{js,ts,jsx,tsx}',
      '!src/**/*.security.{test,spec}.{js,ts,jsx,tsx}'
    ],
    testTimeout: 15000,
    maxThreads: 4,
    coverage: {
      threshold: 80,
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/*.d.ts']
    }
  },
  
  integration: {
    suite: 'integration',
    environment: 'jsdom',
    include: [
      'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
      'server/**/*.integration.{test,spec}.{js,ts}'
    ],
    testTimeout: 45000,
    hookTimeout: 15000,
    maxThreads: 2,
    coverage: {
      threshold: 70,
    }
  },
  
  performance: {
    suite: 'performance',
    environment: 'jsdom',
    include: [
      'src/**/*.performance.{test,spec}.{js,ts,jsx,tsx}',
      'server/**/*.performance.{test,spec}.{js,ts}',
      'tests/performance/**/*.{test,spec}.{js,ts}'
    ],
    testTimeout: 120000,
    hookTimeout: 30000,
    maxThreads: 1,
    coverage: {
      threshold: 60,
    }
  },
  
  security: {
    suite: 'security',
    environment: 'node',
    include: [
      'src/**/*.security.{test,spec}.{js,ts,jsx,tsx}',
      'server/**/*.security.{test,spec}.{js,ts}',
      'tests/security/**/*.{test,spec}.{js,ts}'
    ],
    testTimeout: 60000,
    hookTimeout: 20000,
    maxThreads: 1,
    coverage: {
      threshold: 85,
    },
    env: {
      SECURITY_TEST_MODE: 'true',
      NODE_ENV: 'test'
    }
  },
  
  e2e: {
    suite: 'e2e',
    environment: 'jsdom',
    include: [
      'src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
      'tests/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: ['tests/e2e/playwright/**/*'],
    testTimeout: 180000,
    hookTimeout: 60000,
    maxThreads: 1,
    coverage: {
      threshold: 50,
    }
  },
  
  'land-verification': {
    suite: 'land-verification',
    environment: 'node',
    include: [
      'server/land-verification/**/*.{test,spec}.ts',
      'src/land-verification/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    setupFiles: ['server/land-verification/tests/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 20000,
    maxThreads: 2,
    coverage: {
      threshold: 85,
      include: [
        'server/land-verification/**/*.ts',
        'src/land-verification/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
        'server/land-verification/**/*.{test,spec}.ts',
        'server/land-verification/**/*.d.ts',
        'server/land-verification/**/types.ts'
      ]
    },
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'test-database-url',
      REDIS_URL: 'test-redis-url',
      LAND_VERIFICATION_ENV: 'test'
    }
  },
  
  'fraud-detection': {
    suite: 'fraud-detection',
    environment: 'node',
    include: [
      'server/fraud-detection/**/*.{test,spec}.ts',
      'src/trust/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    testTimeout: 90000,
    hookTimeout: 30000,
    maxThreads: 2,
    coverage: {
      threshold: 80,
      include: [
        'server/fraud-detection/**/*.ts',
        'src/trust/**/*.{js,ts,jsx,tsx}'
      ]
    },
    env: {
      NODE_ENV: 'test',
      ML_MODEL_PATH: './test-models',
      FRAUD_DETECTION_ENV: 'test'
    }
  },
  
  'document-auth': {
    suite: 'document-auth',
    environment: 'node',
    include: [
      'server/document-auth/**/*.{test,spec}.ts'
    ],
    testTimeout: 75000,
    hookTimeout: 25000,
    maxThreads: 2,
    coverage: {
      threshold: 82,
      include: ['server/document-auth/**/*.ts']
    },
    env: {
      NODE_ENV: 'test',
      DOCUMENT_AUTH_ENV: 'test'
    }
  }
}

export function createTestSuiteConfig(suite: TestSuite) {
  const suiteConfig = testSuiteConfigs[suite]
  
  if (!suiteConfig) {
    throw new Error(`Unknown test suite: ${suite}`)
  }
  
  return mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        name: suite,
        environment: suiteConfig.environment,
        include: suiteConfig.include,
        exclude: suiteConfig.exclude,
        setupFiles: suiteConfig.setupFiles,
        
        testTimeout: suiteConfig.testTimeout || 30000,
        hookTimeout: suiteConfig.hookTimeout || 10000,
        
        poolOptions: {
          threads: {
            maxThreads: suiteConfig.maxThreads || 2,
            minThreads: 1,
            isolate: true,
          },
        },
        
        maxConcurrency: suiteConfig.maxThreads || 2,
        
        coverage: {
          ...baseConfig.test?.coverage,
          reportsDirectory: `./coverage/${suite}`,
          include: suiteConfig.coverage?.include || baseConfig.test?.coverage?.include,
          exclude: [
            ...(baseConfig.test?.coverage?.exclude || []),
            ...(suiteConfig.coverage?.exclude || [])
          ],
          thresholds: {
            global: {
              branches: suiteConfig.coverage?.threshold || 70,
              functions: suiteConfig.coverage?.threshold || 70,
              lines: suiteConfig.coverage?.threshold || 70,
              statements: suiteConfig.coverage?.threshold || 70,
            },
          },
        },
        
        cache: {
          dir: `node_modules/.vitest/${suite}`,
        },
        
        env: {
          ...baseConfig.test?.env,
          ...suiteConfig.env,
          TEST_SUITE: suite,
        },
      },
    })
  )
}

export function getAllTestSuites(): TestSuite[] {
  return Object.keys(testSuiteConfigs) as TestSuite[]
}

export function getTestSuiteConfig(suite: TestSuite): TestEnvironmentConfig {
  return testSuiteConfigs[suite]
}