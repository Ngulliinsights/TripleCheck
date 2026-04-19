/**
 * Enhanced Global Cleanup Manager
 * Optimized for resource-intensive applications with memory leak prevention
 * ESLint compliant with proper logging abstraction
 */

// Logger abstraction to handle ESLint no-console restrictions
interface Logger {
    debug(message: string, ...args: unknown[]): void;
    log(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  }
  
  // Default logger implementation - can be replaced with your app's logger
  class DefaultLogger implements Logger {
    private isDevelopment = process.env.NODE_ENV !== 'production';
  
    debug(message: string, ...args: unknown[]): void {
      if (this.isDevelopment) {
        // eslint-disable-next-line no-console
        console.debug(message, ...args);
      }
    }
  
    log(message: string, ...args: unknown[]): void {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  
    warn(message: string, ...args: unknown[]): void {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  
    error(message: string, ...args: unknown[]): void {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  }
  
  interface CleanupTask {
    name: string;
    cleanup: () => void | Promise<void>; // Support both sync and async cleanup
    priority: number; // Higher numbers = higher priority (cleaned up first)
    timeout?: number; // Maximum time allowed for cleanup task
  }
  
  interface CleanupOptions {
    timeout?: number;
    priority?: number;
  }
  
  class CleanupManager {
    private tasks: Map<string, CleanupTask> = new Map(); // Use Map for O(1) lookups
    private intervals: Set<NodeJS.Timeout> = new Set(); // Use Set to prevent duplicates
    private timeouts: Set<NodeJS.Timeout> = new Set(); // Track timeouts separately
    private isShuttingDown = false;
    private shutdownPromise: Promise<void> | null = null;
    private readonly DEFAULT_CLEANUP_TIMEOUT = 5000; // 5 seconds per task
    private readonly TOTAL_SHUTDOWN_TIMEOUT = 30000; // 30 seconds total
    private logger: Logger;
  
    constructor(logger?: Logger) {
      this.logger = logger || new DefaultLogger();
    }
  
    /**
     * Replace the default logger with your application's logger
     * This allows integration with your existing logging infrastructure
     */
    setLogger(logger: Logger): void {
      this.logger = logger;
    }
  
    /**
     * Register a cleanup task with optional priority and timeout
     * Higher priority tasks are cleaned up first
     */
    register(
      name: string, 
      cleanup: () => void | Promise<void>, 
      options: CleanupOptions = {}
    ): void {
      if (this.isShuttingDown) {
        this.logger.warn(`⚠️ Cannot register task "${name}" during shutdown`);
        return;
      }
  
      // Remove existing task if it exists (allows for re-registration)
      this.unregister(name);
  
      const task: CleanupTask = {
        name,
        cleanup,
        priority: options.priority ?? 0,
        timeout: options.timeout ?? this.DEFAULT_CLEANUP_TIMEOUT
      };
  
      this.tasks.set(name, task);
      this.logger.debug(`📝 Registered cleanup task: ${name} (priority: ${task.priority})`);
    }
  
    /**
     * Unregister a specific cleanup task
     */
    unregister(name: string): boolean {
      const removed = this.tasks.delete(name);
      if (removed) {
        this.logger.debug(`🗑️ Unregistered cleanup task: ${name}`);
      }
      return removed;
    }
  
    /**
     * Register an interval with automatic deduplication
     */
    registerInterval(interval: NodeJS.Timeout): void {
      if (this.isShuttingDown) {
        clearInterval(interval);
        return;
      }
      this.intervals.add(interval);
    }
  
    /**
     * Register a timeout with automatic deduplication
     */
    registerTimeout(timeout: NodeJS.Timeout): void {
      if (this.isShuttingDown) {
        clearTimeout(timeout);
        return;
      }
      this.timeouts.add(timeout);
    }
  
    /**
     * Create a managed interval that will be automatically cleaned up
     * Includes error handling to prevent callback crashes
     */
    createInterval(callback: () => void, ms: number): NodeJS.Timeout {
      const interval = setInterval(() => {
        // Wrap callback to handle errors and prevent crashes
        try {
          callback();
        } catch (error) {
          this.logger.error('❌ Error in managed interval:', { error: error });
        }
      }, ms);
      
      this.registerInterval(interval);
      return interval;
    }
  
    /**
     * Create a managed timeout that will be automatically cleaned up
     * Includes error handling to prevent callback crashes
     */
    createTimeout(callback: () => void, ms: number): NodeJS.Timeout {
      const timeout = setTimeout(() => {
        // Remove from tracking set when it fires naturally
        this.timeouts.delete(timeout);
        try {
          callback();
        } catch (error) {
          this.logger.error('❌ Error in managed timeout:', { error: error });
        }
      }, ms);
      
      this.registerTimeout(timeout);
      return timeout;
    }
  
    /**
     * Clear a specific interval and remove from tracking
     */
    clearInterval(interval: NodeJS.Timeout): void {
      clearInterval(interval);
      this.intervals.delete(interval);
    }
  
    /**
     * Clear a specific timeout and remove from tracking
     */
    clearTimeout(timeout: NodeJS.Timeout): void {
      clearTimeout(timeout);
      this.timeouts.delete(timeout);
    }
  
    /**
     * Execute a cleanup task with timeout protection
     * Uses proper async/await pattern instead of promise-in-callback
     */
    private async executeCleanupTask(task: CleanupTask): Promise<void> {
      // Create timeout promise that resolves after the specified timeout
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          this.logger.error(`⏰ Cleanup task "${task.name}" timed out after ${task.timeout}ms`);
          resolve();
        }, task.timeout);
      });
  
      // Create cleanup promise
      const cleanupPromise = this.performTaskCleanup(task);
  
      // Race between cleanup completion and timeout
      await Promise.race([cleanupPromise, timeoutPromise]);
    }
  
    /**
     * Separate method for performing the actual cleanup task
     * This avoids the promise-in-callback ESLint issue
     */
    private async performTaskCleanup(task: CleanupTask): Promise<void> {
      try {
        this.logger.log(`🧹 Cleaning up: ${task.name}`);
        const result = task.cleanup();
        
        // Handle both sync and async cleanup functions
        if (result instanceof Promise) {
          await result;
        }
        
        this.logger.log(`✅ Completed cleanup: ${task.name}`);
      } catch (error) {
        this.logger.error(`❌ Failed to cleanup ${task.name}:`, { error: error });
      }
    }
  
    /**
     * Enhanced cleanup with priority ordering and timeout protection
     */
    async cleanup(): Promise<void> {
      // Prevent multiple concurrent cleanup attempts
      if (this.shutdownPromise) {
        return this.shutdownPromise;
      }
  
      if (this.isShuttingDown) {
        return;
      }
  
      this.isShuttingDown = true;
  
      this.shutdownPromise = this.performCleanup();
      return this.shutdownPromise;
    }
  
    private async performCleanup(): Promise<void> {
      this.logger.log('🧹 Starting enhanced cleanup process...');
      
      // Set a hard timeout for the entire cleanup process
      const overallTimeoutId = setTimeout(() => {
        this.logger.error(`⏰ Overall cleanup process timed out after ${this.TOTAL_SHUTDOWN_TIMEOUT}ms`);
        process.exit(1);
      }, this.TOTAL_SHUTDOWN_TIMEOUT);
  
      try {
        // Step 1: Clear all intervals and timeouts immediately
        this.logger.log(`🔄 Clearing ${this.intervals.size} intervals and ${this.timeouts.size} timeouts...`);
        
        this.intervals.forEach(interval => clearInterval(interval));
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        
        this.intervals.clear();
        this.timeouts.clear();
  
        // Step 2: Sort cleanup tasks by priority (higher priority first)
        const sortedTasks = Array.from(this.tasks.values())
          .sort((a, b) => b.priority - a.priority);
  
        this.logger.log(`🎯 Executing ${sortedTasks.length} cleanup tasks in priority order...`);
  
        // Step 3: Execute cleanup tasks with individual timeouts
        const cleanupPromises = sortedTasks.map(task => this.executeCleanupTask(task));
        await Promise.allSettled(cleanupPromises); // Wait for all but don't fail if one fails
  
        // Step 4: Clear the tasks map
        this.tasks.clear();
        
        this.logger.log('✅ Enhanced cleanup completed successfully');
      } catch (error) {
        this.logger.error('❌ Error during cleanup process:', { error: error });
      } finally {
        clearTimeout(overallTimeoutId);
      }
    }
  
    /**
     * Get current status for debugging
     */
    getStatus(): {
      taskCount: number;
      intervalCount: number;
      timeoutCount: number;
      isShuttingDown: boolean;
      taskNames: string[];
    } {
      return {
        taskCount: this.tasks.size,
        intervalCount: this.intervals.size,
        timeoutCount: this.timeouts.size,
        isShuttingDown: this.isShuttingDown,
        taskNames: Array.from(this.tasks.keys())
      };
    }
  
    /**
     * Setup graceful shutdown handlers with enhanced error handling
     * Uses async/await pattern to avoid promise-in-callback issues
     */
    setupGracefulShutdown(): void {
      const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
      
      signals.forEach(signal => {
        process.on(signal, () => {
          this.logger.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
          this.handleGracefulShutdown();
        });
      });
  
      // Enhanced uncaught exception handler
      process.on('uncaughtException', (error, origin) => {
        this.logger.error('❌ Uncaught Exception:', { error: error });
        this.logger.error('❌ Origin:', { error: origin });
        this.logger.error('❌ Stack:', error.stack);
        
        this.handleEmergencyShutdown();
      });
  
      // Enhanced unhandled rejection handler
      process.on('unhandledRejection', (reason, promise) => {
        this.logger.error('❌ Unhandled Rejection at:', { error: promise });
        this.logger.error('❌ Reason:', { error: reason });
        
        this.handleEmergencyShutdown();
      });
  
      // Handle memory warnings (Node.js specific)
      process.on('warning', (warning) => {
        if (warning.name === 'MaxListenersExceededWarning' || 
            warning.message.includes('memory')) {
          this.logger.warn('⚠️ Memory/Performance Warning:', warning.message);
          this.logger.warn('⚠️ Current cleanup status:', this.getStatus());
        }
      });
    }
  
    /**
     * Handle graceful shutdown asynchronously
     * Separated to avoid promise-in-callback ESLint issues
     */
    private async handleGracefulShutdown(): Promise<void> {
      try {
        await this.cleanup();
        process.exit(0);
      } catch (error) {
        this.logger.error('❌ Error during graceful shutdown:', { error: error });
        process.exit(1);
      }
    }
  
    /**
     * Handle emergency shutdown with timeout protection
     * Separated to avoid promise-in-callback ESLint issues
     */
    private async handleEmergencyShutdown(): Promise<void> {
      try {
        // Attempt cleanup but don't wait too long
        await Promise.race([
          this.cleanup(),
          new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
        ]);
      } catch (cleanupError) {
        this.logger.error('❌ Error during emergency cleanup:', { error: cleanupError });
      } finally {
        process.exit(1);
      }
    }
  }
  
  // Global instance with enhanced initialization
  export const cleanupManager = new CleanupManager();
  
  // Auto-setup graceful shutdown
  cleanupManager.setupGracefulShutdown();
  
  // Export helper functions for convenience
  export const registerCleanup = (name: string, cleanup: () => void | Promise<void>, options?: CleanupOptions) => 
    cleanupManager.register(name, cleanup, options);
  
  export const createManagedInterval = (callback: () => void, ms: number) => 
    cleanupManager.createInterval(callback, ms);
  
  export const createManagedTimeout = (callback: () => void, ms: number) => 
    cleanupManager.createTimeout(callback, ms);
  
  // Export types for external use
  export type { Logger, CleanupOptions };
  
  // Export the CleanupManager class for custom instances
  export { CleanupManager };