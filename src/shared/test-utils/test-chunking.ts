/**
 * Test chunking utilities to prevent memory overflow
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { glob } from 'glob';

export interface TestChunk {
  id: string;
  files: string[];
  estimatedMemory: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ChunkingOptions {
  maxFilesPerChunk: number;
  maxMemoryPerChunk: number; // in bytes
  prioritizeByType: boolean;
  excludePatterns: string[];
}

export class TestChunker {
  private options: ChunkingOptions;

  constructor(options: Partial<ChunkingOptions> = {}) {
    this.options = {
      maxFilesPerChunk: 10,
      maxMemoryPerChunk: 100 * 1024 * 1024, // 100MB
      prioritizeByType: true,
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.config.*',
        'tests/e2e/**/*',
        '**/*.e2e.*',
      ],
      ...options,
    };
  }

  /**
   * Discover all test files in the project
   */
  async discoverTestFiles(patterns: string[] = ['**/*.{test,spec}.{js,ts,jsx,tsx}']): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          ignore: this.options.excludePatterns,
          absolute: true,
        });
        allFiles.push(...files);
      } catch (error) {
        console.warn(`Failed to glob pattern ${pattern}:`, error);
      }
    }
    
    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Estimate memory usage of a test file based on its content
   */
  estimateFileMemoryUsage(filePath: string): number {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const size = Buffer.byteLength(content, 'utf-8');
      
      // Base memory estimation
      let estimatedMemory = size * 2; // Content + parsing overhead
      
      // Add memory for test complexity
      const testCount = (content.match(/\b(test|it|describe)\s*\(/g) || []).length;
      estimatedMemory += testCount * 1024 * 10; // 10KB per test
      
      // Add memory for imports and dependencies
      const importCount = (content.match(/^import\s+/gm) || []).length;
      estimatedMemory += importCount * 1024 * 5; // 5KB per import
      
      // Add memory for mock data
      if (content.includes('mock') || content.includes('fixture')) {
        estimatedMemory *= 1.5; // 50% overhead for mocks
      }
      
      // Add memory for DOM testing
      if (content.includes('@testing-library') || content.includes('render')) {
        estimatedMemory *= 2; // 100% overhead for DOM testing
      }
      
      // Add memory for integration tests
      if (content.includes('integration') || content.includes('e2e')) {
        estimatedMemory *= 3; // 200% overhead for integration tests
      }
      
      return Math.round(estimatedMemory);
    } catch (error) {
      console.warn(`Failed to estimate memory for ${filePath}:`, error);
      return 1024 * 1024; // Default 1MB
    }
  }

  /**
   * Determine test file priority based on type and content
   */
  determineFilePriority(filePath: string): 'high' | 'medium' | 'low' {
    const fileName = filePath.toLowerCase();
    
    // High priority: Critical functionality tests
    if (
      fileName.includes('auth') ||
      fileName.includes('security') ||
      fileName.includes('payment') ||
      fileName.includes('critical') ||
      fileName.includes('integration')
    ) {
      return 'high';
    }
    
    // Low priority: Performance, visual, or large test files
    if (
      fileName.includes('performance') ||
      fileName.includes('visual') ||
      fileName.includes('load') ||
      fileName.includes('stress') ||
      fileName.includes('e2e')
    ) {
      return 'low';
    }
    
    // Medium priority: Everything else
    return 'medium';
  }

  /**
   * Create test chunks from discovered files
   */
  createChunks(files: string[]): TestChunk[] {
    const chunks: TestChunk[] = [];
    const fileData = files.map(file => ({
      path: file,
      memory: this.estimateFileMemoryUsage(file),
      priority: this.determineFilePriority(file),
    }));

    // Sort files by priority and memory usage
    if (this.options.prioritizeByType) {
      fileData.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.memory - b.memory; // Smaller files first within same priority
      });
    } else {
      fileData.sort((a, b) => a.memory - b.memory);
    }

    let currentChunk: TestChunk = {
      id: `chunk-1`,
      files: [],
      estimatedMemory: 0,
      priority: 'medium',
    };

    let chunkIndex = 1;

    for (const file of fileData) {
      // Check if adding this file would exceed limits
      const wouldExceedFileLimit = currentChunk.files.length >= this.options.maxFilesPerChunk;
      const wouldExceedMemoryLimit = currentChunk.estimatedMemory + file.memory > this.options.maxMemoryPerChunk;
      
      if ((wouldExceedFileLimit || wouldExceedMemoryLimit) && currentChunk.files.length > 0) {
        // Finalize current chunk
        chunks.push(currentChunk);
        
        // Start new chunk
        chunkIndex++;
        currentChunk = {
          id: `chunk-${chunkIndex}`,
          files: [],
          estimatedMemory: 0,
          priority: file.priority,
        };
      }
      
      // Add file to current chunk
      currentChunk.files.push(file.path);
      currentChunk.estimatedMemory += file.memory;
      
      // Update chunk priority to highest priority of its files
      if (file.priority === 'high' || (file.priority === 'medium' && currentChunk.priority === 'low')) {
        currentChunk.priority = file.priority;
      }
    }

    // Add the last chunk if it has files
    if (currentChunk.files.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Generate Vitest configuration for chunked execution
   */
  generateChunkedConfig(chunks: TestChunk[], chunkId?: string): any {
    const targetChunk = chunkId ? chunks.find(c => c.id === chunkId) : null;
    
    if (chunkId && !targetChunk) {
      throw new Error(`Chunk ${chunkId} not found`);
    }

    return {
      test: {
        // Include only files from the target chunk, or all files if no chunk specified
        include: targetChunk ? targetChunk.files : chunks.flatMap(c => c.files),
        
        // Adjust memory settings based on chunk size
        poolOptions: {
          threads: {
            maxThreads: targetChunk ? Math.min(2, Math.max(1, targetChunk.files.length)) : 4,
            minThreads: 1,
            isolate: true,
          },
        },
        
        // Adjust timeout based on chunk complexity
        testTimeout: targetChunk?.priority === 'low' ? 60000 : 30000,
        
        // Memory-specific settings
        maxConcurrency: targetChunk ? Math.min(2, targetChunk.files.length) : 4,
        
        // Chunk-specific environment variables
        env: {
          TEST_CHUNK_ID: chunkId || 'all',
          TEST_CHUNK_PRIORITY: targetChunk?.priority || 'medium',
          TEST_CHUNK_SIZE: targetChunk?.files.length.toString() || chunks.length.toString(),
        },
      },
    };
  }

  /**
   * Generate npm scripts for chunked test execution
   */
  generateNpmScripts(chunks: TestChunk[]): Record<string, string> {
    const scripts: Record<string, string> = {};
    
    // Individual chunk scripts
    chunks.forEach(chunk => {
      scripts[`test:${chunk.id}`] = `vitest run --config vitest.chunk.config.ts --reporter=json --outputFile=test-results/${chunk.id}-results.json`;
    });
    
    // Priority-based scripts
    const highPriorityChunks = chunks.filter(c => c.priority === 'high');
    const mediumPriorityChunks = chunks.filter(c => c.priority === 'medium');
    const lowPriorityChunks = chunks.filter(c => c.priority === 'low');
    
    if (highPriorityChunks.length > 0) {
      scripts['test:high-priority'] = highPriorityChunks
        .map(c => `npm run test:${c.id}`)
        .join(' && ');
    }
    
    if (mediumPriorityChunks.length > 0) {
      scripts['test:medium-priority'] = mediumPriorityChunks
        .map(c => `npm run test:${c.id}`)
        .join(' && ');
    }
    
    if (lowPriorityChunks.length > 0) {
      scripts['test:low-priority'] = lowPriorityChunks
        .map(c => `npm run test:${c.id}`)
        .join(' && ');
    }
    
    // Sequential execution script
    scripts['test:chunked'] = chunks
      .map(c => `npm run test:${c.id}`)
      .join(' && ');
    
    // Parallel execution script (for CI with more resources)
    scripts['test:chunked-parallel'] = `${chunks
      .map(c => `npm run test:${c.id}`)
      .join(' & ')  } && wait`;
    
    return scripts;
  }

  /**
   * Generate summary report of chunks
   */
  generateChunkSummary(chunks: TestChunk[]): string {
    const totalFiles = chunks.reduce((sum, chunk) => sum + chunk.files.length, 0);
    const totalMemory = chunks.reduce((sum, chunk) => sum + chunk.estimatedMemory, 0);
    
    const priorityCounts = chunks.reduce((counts, chunk) => {
      counts[chunk.priority] = (counts[chunk.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    let summary = `Test Chunking Summary\n`;
    summary += `=====================\n`;
    summary += `Total files: ${totalFiles}\n`;
    summary += `Total chunks: ${chunks.length}\n`;
    summary += `Estimated total memory: ${Math.round(totalMemory / 1024 / 1024)}MB\n`;
    summary += `Average files per chunk: ${Math.round(totalFiles / chunks.length)}\n`;
    summary += `Average memory per chunk: ${Math.round(totalMemory / chunks.length / 1024 / 1024)}MB\n\n`;
    
    summary += `Priority distribution:\n`;
    summary += `- High priority: ${priorityCounts.high || 0} chunks\n`;
    summary += `- Medium priority: ${priorityCounts.medium || 0} chunks\n`;
    summary += `- Low priority: ${priorityCounts.low || 0} chunks\n\n`;
    
    summary += `Chunk details:\n`;
    chunks.forEach(chunk => {
      summary += `- ${chunk.id}: ${chunk.files.length} files, ${Math.round(chunk.estimatedMemory / 1024 / 1024)}MB, ${chunk.priority} priority\n`;
    });
    
    return summary;
  }
}

// Helper function to create and configure test chunker
export const createTestChunker = (options?: Partial<ChunkingOptions>) => 
  new TestChunker(options);

// Helper function to run chunked tests
export const runChunkedTests = async (
  patterns?: string[],
  options?: Partial<ChunkingOptions>
) => {
  const chunker = createTestChunker(options);
  const files = await chunker.discoverTestFiles(patterns);
  const chunks = chunker.createChunks(files);
  
  console.log(chunker.generateChunkSummary(chunks));
  
  return chunks;
};

// Export default chunker instance
export const testChunker = createTestChunker();