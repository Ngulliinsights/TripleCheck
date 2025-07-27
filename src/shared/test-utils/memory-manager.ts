/**
 * Memory management utilities for tests
 */

import { vi } from 'vitest';

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface MemoryLimits {
  maxHeapUsed: number;
  maxHeapTotal: number;
  maxRSS: number;
}

export class TestMemoryManager {
  private static instance: TestMemoryManager;
  private memorySnapshots: MemoryUsage[] = [];
  private limits: MemoryLimits;
  private cleanupCallbacks: (() => void | Promise<void>)[] = [];

  constructor(limits: MemoryLimits = {
    maxHeapUsed: 512 * 1024 * 1024, // 512MB
    maxHeapTotal: 1024 * 1024 * 1024, // 1GB
    maxRSS: 1024 * 1024 * 1024, // 1GB
  }) {
    this.limits = limits;
  }

  static getInstance(limits?: MemoryLimits): TestMemoryManager {
    if (!TestMemoryManager.instance) {
      TestMemoryManager.instance = new TestMemoryManager(limits);
    }
    return TestMemoryManager.instance;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    };
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(label?: string): MemoryUsage {
    const usage = this.getCurrentMemoryUsage();
    this.memorySnapshots.push(usage);
    
    if (label && process.env.DEBUG_MEMORY) {
      console.log(`Memory snapshot [${label}]:`, {
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      });
    }
    
    return usage;
  }

  /**
   * Check if memory usage exceeds limits
   */
  checkMemoryLimits(): { exceeded: boolean; usage: MemoryUsage; violations: string[] } {
    const usage = this.getCurrentMemoryUsage();
    const violations: string[] = [];

    if (usage.heapUsed > this.limits.maxHeapUsed) {
      violations.push(`Heap used (${Math.round(usage.heapUsed / 1024 / 1024)}MB) exceeds limit (${Math.round(this.limits.maxHeapUsed / 1024 / 1024)}MB)`);
    }

    if (usage.heapTotal > this.limits.maxHeapTotal) {
      violations.push(`Heap total (${Math.round(usage.heapTotal / 1024 / 1024)}MB) exceeds limit (${Math.round(this.limits.maxHeapTotal / 1024 / 1024)}MB)`);
    }

    if (usage.rss > this.limits.maxRSS) {
      violations.push(`RSS (${Math.round(usage.rss / 1024 / 1024)}MB) exceeds limit (${Math.round(this.limits.maxRSS / 1024 / 1024)}MB)`);
    }

    return {
      exceeded: violations.length > 0,
      usage,
      violations,
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    } else if (process.env.NODE_ENV === 'test') {
      // Try to trigger GC by creating and releasing memory pressure
      const arr = new Array(1000000).fill(0);
      arr.length = 0;
    }
  }

  /**
   * Register cleanup callback
   */
  registerCleanup(callback: () => void | Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Execute all cleanup callbacks
   */
  async executeCleanup(): Promise<void> {
    for (const callback of this.cleanupCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    }
    this.cleanupCallbacks = [];
  }

  /**
   * Clear memory snapshots
   */
  clearSnapshots(): void {
    this.memorySnapshots = [];
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: MemoryUsage;
    snapshots: MemoryUsage[];
    peak: MemoryUsage;
    average: MemoryUsage;
  } {
    const current = this.getCurrentMemoryUsage();
    const snapshots = [...this.memorySnapshots];
    
    if (snapshots.length === 0) {
      return {
        current,
        snapshots,
        peak: current,
        average: current,
      };
    }

    const peak = snapshots.reduce((max, snapshot) => ({
      heapUsed: Math.max(max.heapUsed, snapshot.heapUsed),
      heapTotal: Math.max(max.heapTotal, snapshot.heapTotal),
      external: Math.max(max.external, snapshot.external),
      rss: Math.max(max.rss, snapshot.rss),
    }), snapshots[0]!);

    const average = snapshots.reduce((sum, snapshot) => ({
      heapUsed: sum.heapUsed + snapshot.heapUsed,
      heapTotal: sum.heapTotal + snapshot.heapTotal,
      external: sum.external + snapshot.external,
      rss: sum.rss + snapshot.rss,
    }), { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 });

    const count = snapshots.length;
    average.heapUsed = Math.round(average.heapUsed / count);
    average.heapTotal = Math.round(average.heapTotal / count);
    average.external = Math.round(average.external / count);
    average.rss = Math.round(average.rss / count);

    return {
      current,
      snapshots,
      peak,
      average,
    };
  }

  /**
   * Monitor memory usage during test execution
   */
  monitorMemoryDuringTest<T>(
    testFn: () => Promise<T> | T,
    options: {
      label?: string;
      checkInterval?: number;
      failOnExceed?: boolean;
    } = {}
  ): Promise<{ result: T; memoryStats: any }> {
    const { label = 'Test', checkInterval = 1000, failOnExceed = false } = options;
    
    return new Promise(async (resolve, reject) => {
      this.takeSnapshot(`${label} - Start`);
      
      // Set up memory monitoring interval
      const monitorInterval = setInterval(() => {
        this.takeSnapshot(`${label} - During`);
        
        if (failOnExceed) {
          const check = this.checkMemoryLimits();
          if (check.exceeded) {
            clearInterval(monitorInterval);
            reject(new Error(`Memory limit exceeded during ${label}: ${check.violations.join(', ')}`));
            return;
          }
        }
      }, checkInterval);

      try {
        const result = await testFn();
        clearInterval(monitorInterval);
        
        this.takeSnapshot(`${label} - End`);
        const memoryStats = this.getMemoryStats();
        
        resolve({ result, memoryStats });
      } catch (error) {
        clearInterval(monitorInterval);
        reject(error);
      }
    });
  }

  /**
   * Clean up test resources and force garbage collection
   */
  async cleanupTestResources(): Promise<void> {
    // Execute registered cleanup callbacks
    await this.executeCleanup();
    
    // Clear vi mocks
    vi.clearAllMocks();
    vi.clearAllTimers();
    
    // Force garbage collection
    this.forceGarbageCollection();
    
    // Clear snapshots
    this.clearSnapshots();
    
    // Small delay to allow GC to complete
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Global memory manager instance
export const memoryManager = TestMemoryManager.getInstance();

// Helper functions for common memory management tasks
export const withMemoryMonitoring = <T>(
  testFn: () => Promise<T> | T,
  options?: Parameters<typeof memoryManager.monitorMemoryDuringTest>[1]
) => memoryManager.monitorMemoryDuringTest(testFn, options);

export const takeMemorySnapshot = (label?: string) => 
  memoryManager.takeSnapshot(label);

export const checkMemoryLimits = () => 
  memoryManager.checkMemoryLimits();

export const forceGC = () => 
  memoryManager.forceGarbageCollection();

export const cleanupTestMemory = () => 
  memoryManager.cleanupTestResources();

// Memory-aware test wrapper
export const memoryAwareTest = (
  name: string,
  testFn: () => Promise<void> | void,
  options: {
    timeout?: number;
    memoryLimit?: Partial<MemoryLimits>;
    skipMemoryCheck?: boolean;
  } = {}
) => {
  const { timeout = 30000, memoryLimit, skipMemoryCheck = false } = options;
  
  return test(name, async () => {
    // Set custom memory limits if provided
    if (memoryLimit) {
      const manager = TestMemoryManager.getInstance({
        maxHeapUsed: memoryLimit.maxHeapUsed || 512 * 1024 * 1024,
        maxHeapTotal: memoryLimit.maxHeapTotal || 1024 * 1024 * 1024,
        maxRSS: memoryLimit.maxRSS || 1024 * 1024 * 1024,
      });
    }
    
    const startSnapshot = takeMemorySnapshot(`${name} - Start`);
    
    try {
      await testFn();
    } finally {
      const endSnapshot = takeMemorySnapshot(`${name} - End`);
      
      if (!skipMemoryCheck) {
        const memoryCheck = checkMemoryLimits();
        if (memoryCheck.exceeded) {
          console.warn(`Memory limits exceeded in test "${name}":`, memoryCheck.violations);
        }
      }
      
      await cleanupTestMemory();
    }
  }, timeout);
};

// Export test wrapper as default test function
export { memoryAwareTest as test };