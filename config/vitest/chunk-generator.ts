import path from 'path'

import { glob } from 'glob'
import { defineConfig, mergeConfig } from 'vitest/config'

import { baseConfig } from './vitest.base.config'

export interface ChunkConfig {
  chunkId: number
  testFiles: string[]
  priority: 'high' | 'medium' | 'low'
  environment?: 'jsdom' | 'node'
  maxThreads?: number
  testTimeout?: number
}

export function createChunkConfig(config: ChunkConfig) {
  const { chunkId, testFiles, priority, environment = 'jsdom', maxThreads = 2, testTimeout = 30000 } = config
  
  return mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        name: `chunk-${chunkId}`,
        environment,
        include: testFiles,
        
        poolOptions: {
          threads: {
            maxThreads,
            minThreads: 1,
            isolate: true,
          },
        },
        
        testTimeout,
        maxConcurrency: maxThreads,
        
        env: {
          ...baseConfig.test?.env,
          TEST_CHUNK_ID: `chunk-${chunkId}`,
          TEST_CHUNK_PRIORITY: priority,
          TEST_CHUNK_SIZE: testFiles.length.toString(),
        },
        
        coverage: {
          ...baseConfig.test?.coverage,
          reportsDirectory: `./coverage/chunk-${chunkId}`,
        },
        
        cache: {
          dir: `node_modules/.vitest/chunk-${chunkId}`,
        },
      },
    })
  )
}

export async function generateChunkConfigs() {
  // Get all test files
  const testFiles = await glob([
    'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    'server/**/*.{test,spec}.{js,ts}',
    '!src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}',
    '!server/**/*.e2e.{test,spec}.{js,ts}'
  ])
  
  // Categorize tests by type and priority
  const unitTests = testFiles.filter(file => 
    !file.includes('.integration.') && 
    !file.includes('.performance.') && 
    !file.includes('.security.')
  )
  
  const integrationTests = testFiles.filter(file => file.includes('.integration.'))
  const performanceTests = testFiles.filter(file => file.includes('.performance.'))
  const securityTests = testFiles.filter(file => file.includes('.security.'))
  
  // Create chunks
  const chunks: ChunkConfig[] = []
  const chunkSize = 10
  
  // High priority: Unit tests (smaller chunks for faster feedback)
  for (let i = 0; i < unitTests.length; i += chunkSize) {
    chunks.push({
      chunkId: chunks.length + 1,
      testFiles: unitTests.slice(i, i + chunkSize).map(f => path.resolve(f)),
      priority: 'high',
      environment: f => f.includes('server/') ? 'node' : 'jsdom',
      maxThreads: 4,
      testTimeout: 15000
    })
  }
  
  // Medium priority: Integration tests
  for (let i = 0; i < integrationTests.length; i += Math.ceil(chunkSize / 2)) {
    chunks.push({
      chunkId: chunks.length + 1,
      testFiles: integrationTests.slice(i, i + Math.ceil(chunkSize / 2)).map(f => path.resolve(f)),
      priority: 'medium',
      environment: f => f.includes('server/') ? 'node' : 'jsdom',
      maxThreads: 2,
      testTimeout: 45000
    })
  }
  
  // Low priority: Performance and security tests
  const specialTests = [...performanceTests, ...securityTests]
  for (let i = 0; i < specialTests.length; i += Math.ceil(chunkSize / 3)) {
    chunks.push({
      chunkId: chunks.length + 1,
      testFiles: specialTests.slice(i, i + Math.ceil(chunkSize / 3)).map(f => path.resolve(f)),
      priority: 'low',
      environment: f => f.includes('server/') ? 'node' : 'jsdom',
      maxThreads: 1,
      testTimeout: 60000
    })
  }
  
  return chunks
}

export function createDomainSpecificConfig(domain: string) {
  return mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        name: domain,
        include: [
          `src/${domain}/**/*.{test,spec}.{js,ts,jsx,tsx}`,
          `server/${domain}/**/*.{test,spec}.{js,ts}`
        ],
        coverage: {
          ...baseConfig.test?.coverage,
          reportsDirectory: `./coverage/${domain}`,
          include: [
            `src/${domain}/**/*.{js,ts,jsx,tsx}`,
            `server/${domain}/**/*.{js,ts}`
          ]
        },
        cache: {
          dir: `node_modules/.vitest/${domain}`,
        },
      },
    })
  )
}