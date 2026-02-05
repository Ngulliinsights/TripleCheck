#!/usr/bin/env tsx

/**
 * Master test runner for chunked execution
 */

import { spawn } from 'child_process';
import { join } from 'path';

const chunks = [
  "chunk-1",
  "chunk-2",
  "chunk-3",
  "chunk-4",
  "chunk-5",
  "chunk-6",
  "chunk-7",
  "chunk-8",
  "chunk-9",
  "chunk-10",
  "chunk-11",
  "chunk-12",
  "chunk-13",
  "chunk-14",
  "chunk-15",
  "chunk-16",
  "chunk-17",
  "chunk-18",
  "chunk-19"
];

async function runChunk(chunkId: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['vitest', 'run', '--config', `vitest.${chunkId}.config.ts`, '--reporter=json'], {
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
  console.log(`🧪 Running ${chunks.length} test chunks ${sequential ? 'sequentially' : 'in parallel'}...`);
  
  const startTime = Date.now();
  const results: Array<{ chunkId: string; success: boolean; duration: number }> = [];
  
  if (sequential) {
    for (const chunkId of chunks) {
      console.log(`\n📦 Running chunk: ${chunkId}`);
      const chunkStart = Date.now();
      
      const result = await runChunk(chunkId);
      const duration = Date.now() - chunkStart;
      
      results.push({
        chunkId,
        success: result.success,
        duration,
      });
      
      console.log(`${result.success ? '✅' : '❌'} Chunk ${chunkId} completed in ${duration}ms`);
      
      if (!result.success) {
        console.error(`Error in chunk ${chunkId}:`, result.output);
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
  
  console.log(`\n📊 Test Results Summary:`);
  console.log(`Total chunks: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Total duration: ${totalDuration}ms`);
  console.log(`Average chunk duration: ${Math.round(totalDuration / results.length)}ms`);
  
  if (failureCount > 0) {
    console.log(`\n❌ Failed chunks:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.chunkId} (${r.duration}ms)`);
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All chunks passed!`);
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const sequential = !args.includes('--parallel');
const chunkId = args.find(arg => arg.startsWith('--chunk='))?.split('=')[1];

if (chunkId) {
  console.log(`🧪 Running single chunk: ${chunkId}`);
  runChunk(chunkId).then(result => {
    console.log(`${result.success ? '✅' : '❌'} Chunk ${chunkId} ${result.success ? 'passed' : 'failed'}`);
    if (!result.success) {
      console.error(result.output);
    }
    process.exit(result.success ? 0 : 1);
  });
} else {
  runAllChunks(sequential);
}
