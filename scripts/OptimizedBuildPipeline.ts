/**
 * Optimized Build Pipeline - Fast, efficient builds with intelligent caching
 * Implements parallel processing and build optimization for Kenya Land Platform
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from './cleanup-redundancies';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';

interface BuildTask {
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  dependencies?: string[];
}

interface BuildResult {
  success: boolean;
  duration: number;
  output: string;
  error?: string;
  cacheHit?: boolean;
}

interface BuildCache {
  [taskName: string]: {
    hash: string;
    result: BuildResult;
    timestamp: number;
  };
}

export class OptimizedBuildPipeline {
  private cacheFile = '.build-cache.json';
  private cache: BuildCache = {};
  private maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadCache();
  }

  /**
   * Execute optimized build with parallel processing and caching
   */
  async executeBuild(buildType: 'development' | 'production' | 'test' = 'production'): Promise<BuildResult> {
    console.log(`🚀 Starting optimized ${buildType} build...`);
    const startTime = performance.now();

    try {
      // Define build tasks based on build type
      const tasks = this.getBuildTasks(buildType);
      
      // Execute tasks with dependency resolution and parallelization
      const results = await this.executeTasksInParallel(tasks);
      
      // Combine results
      const overallSuccess = results.every(result => result.success);
      const totalDuration = performance.now() - startTime;
      
      // Update cache
      await this.saveCache();
      
      const buildResult: BuildResult = {
        success: overallSuccess,
        duration: totalDuration,
        output: results.map(r => r.output).join('\n'),
        error: results.find(r => !r.success)?.error
      };

      if (overallSuccess) {
        console.log(`✅ Build completed successfully in ${(totalDuration / 1000).toFixed(2)}s`);
        await this.generateBuildReport(buildResult, results);
      } else {
        console.error(`❌ Build failed after ${(totalDuration / 1000).toFixed(2)}s`);
      }

      return buildResult;
    } catch (error) {
      const totalDuration = performance.now() - startTime;
      console.error(`💥 Build pipeline error:`, error);
      
      return {
        success: false,
        duration: totalDuration,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get build tasks based on build type
   */
  private getBuildTasks(buildType: string): BuildTask[] {
    const commonTasks: BuildTask[] = [
      {
        name: 'clean',
        command: 'rm',
        args: ['-rf', 'dist', '.vite'],
        dependencies: []
      },
      {
        name: 'type-check',
        command: 'npx',
        args: ['tsc', '--noEmit', '--skipLibCheck'],
        dependencies: []
      }
    ];

    const developmentTasks: BuildTask[] = [
      ...commonTasks,
      {
        name: 'vite-build-dev',
        command: 'npx',
        args: ['vite', 'build', '--mode', 'development'],
        dependencies: ['clean', 'type-check']
      }
    ];

    const productionTasks: BuildTask[] = [
      ...commonTasks,
      {
        name: 'lint',
        command: 'npx',
        args: ['eslint', '.', '--ext', '.ts,.tsx,.js,.jsx', '--max-warnings', '0'],
        dependencies: []
      },
      {
        name: 'vite-build',
        command: 'npx',
        args: ['vite', 'build', '--mode', 'production'],
        dependencies: ['clean', 'type-check', 'lint']
      },
      {
        name: 'bundle-analysis',
        command: 'npx',
        args: ['vite-bundle-analyzer', 'dist/stats.json'],
        dependencies: ['vite-build']
      },
      {
        name: 'security-scan',
        command: 'npm',
        args: ['audit', '--audit-level', 'moderate'],
        dependencies: []
      }
    ];

    const testTasks: BuildTask[] = [
      {
        name: 'test-unit',
        command: 'npx',
        args: ['vitest', 'run', '--coverage'],
        dependencies: ['type-check']
      },
      {
        name: 'test-integration',
        command: 'npx',
        args: ['vitest', 'run', 'tests/integration'],
        dependencies: ['type-check']
      }
    ];

    switch (buildType) {
      case 'development':
        return developmentTasks;
      case 'production':
        return productionTasks;
      case 'test':
        return [...commonTasks, ...testTasks];
      default:
        return productionTasks;
    }
  }

  /**
   * Execute tasks in parallel while respecting dependencies
   */
  private async executeTasksInParallel(tasks: BuildTask[]): Promise<BuildResult[]> {
    const results: BuildResult[] = [];
    const completed = new Set<string>();
    const running = new Map<string, Promise<BuildResult>>();

    // Helper function to check if task dependencies are met
    const canExecute = (task: BuildTask): boolean => {
      return task.dependencies?.every(dep => completed.has(dep)) ?? true;
    };

    // Execute tasks in waves based on dependencies
    while (completed.size < tasks.length) {
      const readyTasks = tasks.filter(task => 
        !completed.has(task.name) && 
        !running.has(task.name) && 
        canExecute(task)
      );

      if (readyTasks.length === 0 && running.size === 0) {
        throw new Error('Circular dependency detected in build tasks');
      }

      // Start ready tasks
      for (const task of readyTasks) {
        const promise = this.executeTask(task);
        running.set(task.name, promise);
      }

      // Wait for at least one task to complete
      if (running.size > 0) {
        const [taskName, result] = await Promise.race(
          Array.from(running.entries()).map(async ([name, promise]) => {
            const result = await promise;
            return [name, result] as const;
          })
        );

        results.push(result);
        completed.add(taskName);
        running.delete(taskName);

        if (!result.success) {
          // Cancel remaining tasks on failure
          console.error(`❌ Task ${taskName} failed, cancelling remaining tasks`);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single build task with caching
   */
  private async executeTask(task: BuildTask): Promise<BuildResult> {
    const taskHash = await this.calculateTaskHash(task);
    const cached = this.getCachedResult(task.name, taskHash);

    if (cached) {
      console.log(`📦 Using cached result for ${task.name}`);
      return { ...cached, cacheHit: true };
    }

    console.log(`🔨 Executing ${task.name}...`);
    const startTime = performance.now();

    try {
      const output = await this.runCommand(task.command, task.args, {
        cwd: task.cwd || process.cwd(),
        env: { ...process.env, ...task.env }
      });

      const duration = performance.now() - startTime;
      const result: BuildResult = {
        success: true,
        duration,
        output,
        cacheHit: false
      };

      // Cache successful results
      this.setCachedResult(task.name, taskHash, result);
      
      console.log(`✅ ${task.name} completed in ${(duration / 1000).toFixed(2)}s`);
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ ${task.name} failed after ${(duration / 1000).toFixed(2)}s:`, errorMessage);
      
      return {
        success: false,
        duration,
        output: '',
        error: errorMessage,
        cacheHit: false
      };
    }
  }

  /**
   * Run a command and return its output
   */
  private runCommand(command: string, args: string[], options: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Calculate hash for task to determine if cache is valid
   */
  private async calculateTaskHash(task: BuildTask): Promise<string> {
    const hash = createHash('sha256');
    
    // Hash task definition
    hash.update(JSON.stringify({
      name: task.name,
      command: task.command,
      args: task.args,
      dependencies: task.dependencies
    }));

    // Hash relevant file contents for cache invalidation
    const relevantFiles = await this.getRelevantFiles(task.name);
    for (const file of relevantFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        hash.update(content);
      } catch (error) {
        // File might not exist, skip
      }
    }

    return hash.digest('hex');
  }

  /**
   * Get files relevant to a task for cache invalidation
   */
  private async getRelevantFiles(taskName: string): Promise<string[]> {
    const filePatterns: Record<string, string[]> = {
      'type-check': ['tsconfig.json', 'src/**/*.ts', 'src/**/*.tsx'],
      'lint': ['.eslintrc.js', 'eslint.config.js', 'src/**/*.ts', 'src/**/*.tsx'],
      'vite-build': ['vite.config.ts', 'package.json', 'src/**/*'],
      'vite-build-dev': ['vite.config.ts', 'package.json', 'src/**/*']
    };

    const patterns = filePatterns[taskName] || [];
    const files: string[] = [];

    for (const pattern of patterns) {
      try {
        const { glob } = await import('glob');
        const matches = await glob(pattern, { ignore: ['node_modules/**', 'dist/**'] });
        files.push(...matches);
      } catch (error) {
        // Pattern might not match anything
      }
    }

    return files.slice(0, 50); // Limit to prevent excessive hashing
  }

  /**
   * Load build cache from disk
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheContent = await fs.readFile(this.cacheFile, 'utf-8');
      this.cache = JSON.parse(cacheContent);
      
      // Clean expired cache entries
      const now = Date.now();
      for (const [taskName, entry] of Object.entries(this.cache)) {
        if (now - entry.timestamp > this.maxCacheAge) {
          delete this.cache[taskName];
        }
      }
    } catch (error) {
      // Cache file doesn't exist or is invalid, start fresh
      this.cache = {};
    }
  }

  /**
   * Save build cache to disk
   */
  private async saveCache(): Promise<void> {
    try {
      await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.warn('Could not save build cache:', error);
    }
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult(taskName: string, hash: string): BuildResult | null {
    const cached = this.cache[taskName];
    if (cached && cached.hash === hash) {
      return cached.result;
    }
    return null;
  }

  /**
   * Cache a task result
   */
  private setCachedResult(taskName: string, hash: string, result: BuildResult): void {
    this.cache[taskName] = {
      hash,
      result,
      timestamp: Date.now()
    };
  }

  /**
   * Generate build report
   */
  private async generateBuildReport(overallResult: BuildResult, taskResults: BuildResult[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      success: overallResult.success,
      totalDuration: overallResult.duration,
      tasks: taskResults.map(result => ({
        duration: result.duration,
        success: result.success,
        cacheHit: result.cacheHit || false
      })),
      cacheHitRate: taskResults.filter(r => r.cacheHit).length / taskResults.length,
      performance: {
        totalTime: `${(overallResult.duration / 1000).toFixed(2)}s`,
        averageTaskTime: `${(taskResults.reduce((sum, r) => sum + r.duration, 0) / taskResults.length / 1000).toFixed(2)}s`,
        cacheEfficiency: `${(taskResults.filter(r => r.cacheHit).length / taskResults.length * 100).toFixed(1)}%`
      }
    };

    await fs.writeFile('build-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 Build Performance Report:');
    console.log(`   Total Time: ${report.performance.totalTime}`);
    console.log(`   Cache Hit Rate: ${report.performance.cacheEfficiency}`);
    console.log(`   Tasks Completed: ${taskResults.length}`);
    console.log(`   Report saved to: build-report.json`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const buildType = (process.argv[2] as any) || 'production';
  const pipeline = new OptimizedBuildPipeline();
  
  pipeline.executeBuild(buildType)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Build pipeline error:', error);
      process.exit(1);
    });
}