#!/usr/bin/env tsx

import { writeFileSync } from 'fs'
import path from 'path'

import { generateChunkConfigs, createChunkConfig } from '../config/vitest/chunk-generator'

async function generateChunkFiles() {
  console.log('🔄 Generating test chunk configurations...')
  
  try {
    const chunks = await generateChunkConfigs()
    console.log(`📊 Found ${chunks.length} test chunks to generate`)
    
    for (const chunk of chunks) {
      const config = createChunkConfig(chunk)
      const configContent = `
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import path from 'path';

export default defineConfig({
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
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@property": path.resolve(__dirname, "src/property"),
      "@trust": path.resolve(__dirname, "src/trust"),
      "@user": path.resolve(__dirname, "src/user"),
      "@auth": path.resolve(__dirname, "src/auth"),
      "@search": path.resolve(__dirname, "src/search"),
      "@communication": path.resolve(__dirname, "src/communication"),
      "@analytics": path.resolve(__dirname, "src/analytics"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@components": path.resolve(__dirname, "src/shared/components"),
      "@hooks": path.resolve(__dirname, "src/shared/hooks"),
      "@utils": path.resolve(__dirname, "src/shared/utils"),
      "@types": path.resolve(__dirname, "src/shared/types"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  
  test: {
    globals: true,
    environment: "${chunk.environment || 'jsdom'}",
    setupFiles: ["src/shared/test-utils/setup.ts"],
    include: [
${chunk.testFiles.map(file => `      "${file}",`).join('\n')}
    ],
    
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: ${chunk.maxThreads || 2},
        minThreads: 1,
        isolate: true,
      },
    },
    
    testTimeout: ${chunk.testTimeout || 30000},
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    maxConcurrency: ${chunk.maxThreads || 2},
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
      provider: "v8",
      reporter: ["text", "json"],
      clean: true,
      cleanOnRerun: true,
    },
    
    env: {
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:3001',
      VITE_APP_ENV: 'test',
      TEST_CHUNK_ID: 'chunk-${chunk.chunkId}',
      TEST_CHUNK_PRIORITY: '${chunk.priority}',
      TEST_CHUNK_SIZE: '${chunk.testFiles.length}',
    },
  },
});
`
      
      const filename = `vitest.chunk-${chunk.chunkId}.config.ts`
      writeFileSync(filename, configContent.trim())
      console.log(`✅ Generated ${filename} (${chunk.testFiles.length} tests, ${chunk.priority} priority)`)
    }
    
    // Generate summary
    const summary = {
      totalChunks: chunks.length,
      totalTests: chunks.reduce((sum, chunk) => sum + chunk.testFiles.length, 0),
      priorityBreakdown: {
        high: chunks.filter(c => c.priority === 'high').length,
        medium: chunks.filter(c => c.priority === 'medium').length,
        low: chunks.filter(c => c.priority === 'low').length,
      }
    }
    
    console.log('\n📈 Generation Summary:')
    console.log(`   Total chunks: ${summary.totalChunks}`)
    console.log(`   Total tests: ${summary.totalTests}`)
    console.log(`   High priority: ${summary.priorityBreakdown.high} chunks`)
    console.log(`   Medium priority: ${summary.priorityBreakdown.medium} chunks`)
    console.log(`   Low priority: ${summary.priorityBreakdown.low} chunks`)
    
    // Update package.json scripts
    console.log('\n🔧 Consider adding these scripts to package.json:')
    console.log('   "test:chunks": "npm run test:chunk-1 && npm run test:chunk-2 && ..."')
    console.log('   "test:high-priority": "npm run test:chunk-[high-priority-chunks]"')
    console.log('   "test:parallel": "concurrently \\"npm run test:chunk-1\\" \\"npm run test:chunk-2\\" ..."')
    
  } catch (error) {
    console.error('❌ Error generating chunk configurations:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  generateChunkFiles()
}

export { generateChunkFiles }