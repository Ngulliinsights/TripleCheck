#!/usr/bin/env tsx

/**
 * Generate test chunks to prevent memory overflow
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { testChunker } from '../../src/shared/test-utils/test-chunking';

async function generateTestChunks() {
  console.log('🔍 Discovering test files...');
  
  // Discover all test files (excluding E2E tests)
  const files = await testChunker.discoverTestFiles([
    'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
    'server/**/*.{test,spec}.{js,ts,jsx,tsx}',
    // Exclude E2E tests as they should run with Playwright
    '!tests/e2e/**/*',
    '!**/*.e2e.*',
  ]);
  
  console.log(`Found ${files.length} test files`);
  
  // Create chunks
  const chunks = testChunker.createChunks(files);
  
  console.log(`Created ${chunks.length} test chunks`);
  console.log(testChunker.generateChunkSummary(chunks));
  
  // Ensure test-results directory exists
  mkdirSync('test-results', { recursive: true });
  
  // Generate chunk configurations
  chunks.forEach(chunk => {
    const config = testChunker.generateChunkedConfig([chunk], chunk.id);
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
    environment: "jsdom",
    setupFiles: ["src/shared/test-utils/setup.ts"],
    include: ${JSON.stringify(chunk.files, null, 2)},
    
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: ${Math.min(2, Math.max(1, chunk.files.length))},
        minThreads: 1,
        isolate: true,
      },
    },
    
    testTimeout: ${chunk.priority === 'low' ? 60000 : 30000},
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    maxConcurrency: ${Math.min(2, chunk.files.length)},
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
      TEST_CHUNK_ID: '${chunk.id}',
      TEST_CHUNK_PRIORITY: '${chunk.priority}',
      TEST_CHUNK_SIZE: '${chunk.files.length}',
    },
  },
});
`;
    
    writeFileSync(`vitest.${chunk.id}.config.ts`, configContent);
  });
  
  // Generate npm scripts
  const scripts = testChunker.generateNpmScripts(chunks);
  
  // Write scripts to a file for easy copying to package.json
  const scriptsContent = `
// Add these scripts to your package.json:
${JSON.stringify(scripts, null, 2)}

// Or run individual chunks:
${chunks.map(chunk => `// npm run vitest -- --config vitest.${chunk.id}.config.ts`).join('\n')}
`;
  
  writeFileSync('test-chunks-scripts.txt', scriptsContent);
  
  // Generate a master test runner script
  const masterRunnerContent = `#!/usr/bin/env tsx

/**
 * Master test runner for chunked execution
 */

import { spawn } from 'child_process';
import { join } from 'path';

const chunks = ${JSON.stringify(chunks.map(c => c.id), null, 2)};

async function runChunk(chunkId: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['vitest', 'run', '--config', \`vitest.\${chunkId}.config.ts\`, '--reporter=json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + errorOutput,
      });
    });
  });
}

async function runAllChunks(sequential = true) {
  console.log(\`🧪 Running \${chunks.length} test chunks \${sequential ? 'sequentially' : 'in parallel'}...\`);
  
  const startTime = Date.now();
  const results: Array<{ chunkId: string; success: boolean; duration: number }> = [];
  
  if (sequential) {
    for (const chunkId of chunks) {
      console.log(\`\\n📦 Running chunk: \${chunkId}\`);
      const chunkStart = Date.now();
      
      const result = await runChunk(chunkId);
      const duration = Date.now() - chunkStart;
      
      results.push({
        chunkId,
        success: result.success,
        duration,
      });
      
      console.log(\`\${result.success ? '✅' : '❌'} Chunk \${chunkId} completed in \${duration}ms\`);
      
      if (!result.success) {
        console.error(\`Error in chunk \${chunkId}:\`, result.output);
      }
    }
  } else {
    const promises = chunks.map(async (chunkId) => {
      const chunkStart = Date.now();
      const result = await runChunk(chunkId);
      const duration = Date.now() - chunkStart;
      
      return {
        chunkId,
        success: result.success,
        duration,
      };
    });
    
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }
  
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(\`\\n📊 Test Results Summary:\`);
  console.log(\`Total chunks: \${results.length}\`);
  console.log(\`Successful: \${successCount}\`);
  console.log(\`Failed: \${failureCount}\`);
  console.log(\`Total duration: \${totalDuration}ms\`);
  console.log(\`Average chunk duration: \${Math.round(totalDuration / results.length)}ms\`);
  
  if (failureCount > 0) {
    console.log(\`\\n❌ Failed chunks:\`);
    results.filter(r => !r.success).forEach(r => {
      console.log(\`- \${r.chunkId} (\${r.duration}ms)\`);
    });
    process.exit(1);
  } else {
    console.log(\`\\n✅ All chunks passed!\`);
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const sequential = !args.includes('--parallel');
const chunkId = args.find(arg => arg.startsWith('--chunk='))?.split('=')[1];

if (chunkId) {
  console.log(\`🧪 Running single chunk: \${chunkId}\`);
  runChunk(chunkId).then(result => {
    console.log(\`\${result.success ? '✅' : '❌'} Chunk \${chunkId} \${result.success ? 'passed' : 'failed'}\`);
    if (!result.success) {
      console.error(result.output);
    }
    process.exit(result.success ? 0 : 1);
  });
} else {
  runAllChunks(sequential);
}
`;
  
  writeFileSync('scripts/run-chunked-tests.ts', masterRunnerContent);
  
  console.log('\n✅ Test chunking configuration generated!');
  console.log('\nGenerated files:');
  console.log(`- ${chunks.length} chunk config files (vitest.chunk-*.config.ts)`);
  console.log('- test-chunks-scripts.txt (npm scripts)');
  console.log('- scripts/run-chunked-tests.ts (master runner)');
  
  console.log('\nTo run chunked tests:');
  console.log('1. Sequential: tsx scripts/run-chunked-tests.ts');
  console.log('2. Parallel: tsx scripts/run-chunked-tests.ts --parallel');
  console.log('3. Single chunk: tsx scripts/run-chunked-tests.ts --chunk=chunk-1');
}

// Run if called directly
generateTestChunks().catch(console.error);

export { generateTestChunks };