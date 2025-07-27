/**
 * RequestManager - Centralized request coordination and cancellation
 * 
 * This class provides coordinated request management to prevent race conditions
 * and ensure proper cleanup of API requests.
 */

export interface RequestOptions {
  /** Unique key to identify and potentially cancel this request */
  key?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to cancel previous requests with the same key */
  cancelPrevious?: boolean;
  /** Custom abort signal */
  signal?: AbortSignal;
  /** Request priority for coordination */
  priority?: 'low' | 'normal' | 'high';
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
  };
}

export interface RequestMetadata {
  key: string;
  startTime: number;
  priority: 'low' | 'normal' | 'high';
  controller: AbortController;
  promise: Promise<any>;
  retryCount: number;
}

export class RequestManager {
  private activeRequests = new Map<string, RequestMetadata>();
  private requestQueue: Array<{ key: string; priority: 'low' | 'normal' | 'high' }> = [];
  private maxConcurrentRequests = 10;
  private defaultTimeout = 30000; // 30 seconds

  /**
   * Make a coordinated request with cancellation support
   */
  async makeRequest<T>(
    requestFn: (signal: AbortSignal) => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      key = this.generateRequestKey(),
      timeout = this.defaultTimeout,
      cancelPrevious = true,
      signal: externalSignal,
      priority = 'normal',
      retry
    } = options;

    // Cancel previous request with same key if requested
    if (cancelPrevious && this.activeRequests.has(key)) {
      this.cancelRequest(key);
    }

    // Create combined abort controller
    const controller = new AbortController();
    const combinedSignal = this.combineSignals([controller.signal, externalSignal].filter(Boolean) as AbortSignal[]);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    // Create request metadata
    const metadata: RequestMetadata = {
      key,
      startTime: Date.now(),
      priority,
      controller,
      promise: this.executeRequest(requestFn, combinedSignal, retry),
      retryCount: 0
    };

    this.activeRequests.set(key, metadata);

    try {
      const result = await metadata.promise;
      clearTimeout(timeoutId);
      this.activeRequests.delete(key);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(key);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request cancelled: ${key}`);
      }
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    requestFn: (signal: AbortSignal) => Promise<T>,
    signal: AbortSignal,
    retryConfig?: RequestOptions['retry']
  ): Promise<T> {
    let lastError: Error;
    const maxAttempts = retryConfig?.attempts ?? 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      try {
        return await requestFn(signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if request was aborted or on last attempt
        if (signal.aborted || attempt === maxAttempts - 1) {
          break;
        }

        // Calculate delay for retry
        const baseDelay = retryConfig?.delay ?? 1000;
        const delay = retryConfig?.backoff === 'exponential' 
          ? baseDelay * Math.pow(2, attempt)
          : baseDelay * (attempt + 1);

        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Cancel a specific request by key
   */
  cancelRequest(key: string): boolean {
    const request = this.activeRequests.get(key);
    if (request) {
      request.controller.abort(new Error(`Request cancelled: ${key}`));
      this.activeRequests.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    for (const [key, request] of this.activeRequests) {
      request.controller.abort(new Error('All requests cancelled'));
    }
    this.activeRequests.clear();
  }

  /**
   * Cancel requests by pattern
   */
  cancelRequestsByPattern(pattern: RegExp): number {
    let cancelled = 0;
    for (const [key, request] of this.activeRequests) {
      if (pattern.test(key)) {
        request.controller.abort(new Error(`Request cancelled by pattern: ${key}`));
        this.activeRequests.delete(key);
        cancelled++;
      }
    }
    return cancelled;
  }

  /**
   * Get active request information
   */
  getActiveRequests(): Array<{
    key: string;
    duration: number;
    priority: string;
  }> {
    const now = Date.now();
    return Array.from(this.activeRequests.entries()).map(([key, metadata]) => ({
      key,
      duration: now - metadata.startTime,
      priority: metadata.priority
    }));
  }

  /**
   * Check if a request is active
   */
  isRequestActive(key: string): boolean {
    return this.activeRequests.has(key);
  }

  /**
   * Get request statistics
   */
  getStats(): {
    activeRequests: number;
    totalRequests: number;
    averageDuration: number;
  } {
    const active = this.activeRequests.size;
    const now = Date.now();
    const durations = Array.from(this.activeRequests.values())
      .map(req => now - req.startTime);
    
    return {
      activeRequests: active,
      totalRequests: active, // This would be tracked over time in a real implementation
      averageDuration: durations.length > 0 
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
        : 0
    };
  }

  /**
   * Combine multiple abort signals into one
   */
  private combineSignals(signals: AbortSignal[]): AbortSignal {
    if (signals.length === 0) {
      return new AbortController().signal;
    }
    
    if (signals.length === 1) {
      return signals[0];
    }

    const controller = new AbortController();
    
    const onAbort = () => {
      controller.abort();
    };

    signals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });

    return controller.signal;
  }

  /**
   * Generate a unique request key
   */
  private generateRequestKey(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancelAllRequests();
  }
}

// Singleton instance for global use
export const requestManager = new RequestManager();

// Types are already exported above as interfaces