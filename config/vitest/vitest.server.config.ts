import { defineConfig, mergeConfig } from 'vitest/config'
import { baseConfig } from './vitest.base.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'server',
      environment: 'node',
      include: [
        'server/**/*.{test,spec}.{js,ts}',
        '!server/**/*.integration.{test,spec}.{js,ts}',
        '!server/land-verification/**/*.{test,spec}.{js,ts}',
        '!server/fraud-detection/**/*.{test,spec}.{js,ts}',
        '!server/document-auth/**/*.{test,spec}.{js,ts}'
      ],
      setupFiles: ['./server/test-setup.ts'],
      testTimeout: 15000,
      
      coverage: {
        ...baseConfig.test?.coverage,
        reportsDirectory: './coverage/server',
        include: ['server/**/*.{js,ts}'],
        exclude: [
          'server/**/*.{test,spec}.{js,ts}',
          'server/**/*.d.ts',
          'server/**/types.ts',
          'server/land-verification/**/*',
          'server/fraud-detection/**/*',
          'server/document-auth/**/*'
        ]
      }
    }
  })
)