/**
 * Request Monitoring and Debugging Tools
 * Provides comprehensive monitoring for API requests and performance tracking
 */

interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  success: boolean;
  error?: string | undefined;
  retryCount: number;
  cacheHit: boolean;
  requestId: string;
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  slowestRequests: RequestMetrics[];
  mostFrequentErrors: Array<{ error: string; count: number }>;
}

interface InfiniteLoopDetection {
  endpoint: string;
  requestCount: number;
  timeWindow: number;
  lastReset: number;
  isThrottled: boolean;
}

export class RequestMonitor {
  private static instance: RequestMonitor;
  private metrics: RequestMetrics[] = [];
  private loopDetection = new Map<string, InfiniteLoopDetection>();
  private readonly MAX_METRICS = 1000; // Keep last 1000 requests
  private readonly LOOP_THRESHOLD = 10; // 10 requests per time window
  private readonly LOOP_TIME_WINDOW = 5000; // 5 seconds
  private readonly SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds

  private constructor() {
    this.startPeriodicCleanup();
  }

  static getInstance(): RequestMonitor {
    if (!RequestMonitor.instance) {
      RequestMonitor.instance = new RequestMonitor();
    }
    return RequestMonitor.instance;
  }

  /**
   * Start tracking a request
   */
  startRequest(url: string, method: string, requestId: string): void {
    const metric: RequestMetrics = {
      url,
      method,
      startTime: Date.now(),
      success: false,
      retryCount: 0,
      cacheHit: false,
      requestId,
    };

    this.metrics.push(metric);
    this.checkForInfiniteLoop(url, method);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Complete tracking a request
   */
  completeRequest(
    requestId: string,
    status: number,
    success: boolean,
    error?: string,
    cacheHit = false
  ): void {
    const metric = this.metrics.find(m => m.requestId === requestId);
    if (!metric) return;

    const now = Date.now();
    metric.endTime = now;
    metric.duration = now - metric.startTime;
    metric.status = status;
    metric.success = success;
    metric.error = error;
    metric.cacheHit = cacheHit;

    // Log slow requests in development
    if (process.env.NODE_ENV === "development" && metric.duration > this.SLOW_REQUEST_THRESHOLD) {
      // eslint-disable-next-line no-console
      console.warn(`🐌 Slow request detected: ${metric.method} ${metric.url} took ${metric.duration}ms`);
    }
  }

  /**
   * Track a retry attempt
   */
  trackRetry(requestId: string): void {
    const metric = this.metrics.find(m => m.requestId === requestId);
    if (metric) {
      metric.retryCount++;
    }
  }

  /**
   * Check for potential infinite loops
   */
  private checkForInfiniteLoop(url: string, method: string): boolean {
    const key = `${method}:${url}`;
    const now = Date.now();
    
    let detection = this.loopDetection.get(key);
    if (!detection) {
      detection = {
        endpoint: key,
        requestCount: 0,
        timeWindow: this.LOOP_TIME_WINDOW,
        lastReset: now,
        isThrottled: false,
      };
      this.loopDetection.set(key, detection);
    }

    // Reset counter if time window has passed
    if (now - detection.lastReset > detection.timeWindow) {
      detection.requestCount = 0;
      detection.lastReset = now;
      detection.isThrottled = false;
    }

    detection.requestCount++;

    // Check if we've exceeded the threshold
    if (detection.requestCount > this.LOOP_THRESHOLD) {
      if (!detection.isThrottled) {
        detection.isThrottled = true;
        
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error(
            `🔄 Infinite loop detected for ${key}: ${detection.requestCount} requests in ${detection.timeWindow}ms`
          );
        }

        // Send alert to monitoring service in production
        if (process.env.NODE_ENV === "production") {
          this.sendInfiniteLoopAlert(detection);
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const completedRequests = this.metrics.filter(m => m.endTime !== undefined);
    const successfulRequests = completedRequests.filter(m => m.success);
    const failedRequests = completedRequests.filter(m => !m.success);
    const cacheHits = completedRequests.filter(m => m.cacheHit);

    // Calculate average response time
    const totalDuration = completedRequests.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageResponseTime = completedRequests.length > 0 ? totalDuration / completedRequests.length : 0;

    // Find slowest requests
    const slowestRequests = completedRequests
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Count error frequencies
    const errorCounts = new Map<string, number>();
    failedRequests.forEach(request => {
      if (request.error) {
        const count = errorCounts.get(request.error) || 0;
        errorCounts.set(request.error, count + 1);
      }
    });

    const mostFrequentErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests: this.metrics.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate: completedRequests.length > 0 ? cacheHits.length / completedRequests.length : 0,
      errorRate: completedRequests.length > 0 ? failedRequests.length / completedRequests.length : 0,
      slowestRequests,
      mostFrequentErrors,
    };
  }

  /**
   * Get infinite loop detection status
   */
  getInfiniteLoopStatus(): Array<InfiniteLoopDetection> {
    return Array.from(this.loopDetection.values());
  }

  /**
   * Get recent requests for debugging
   */
  getRecentRequests(limit = 50): RequestMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get requests by URL pattern
   */
  getRequestsByPattern(pattern: RegExp): RequestMetrics[] {
    return this.metrics.filter(m => pattern.test(m.url));
  }

  /**
   * Get failed requests
   */
  getFailedRequests(limit = 20): RequestMetrics[] {
    return this.metrics
      .filter(m => !m.success && m.endTime !== undefined)
      .slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.loopDetection.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      performanceMetrics: this.getPerformanceMetrics(),
      infiniteLoopStatus: this.getInfiniteLoopStatus(),
      recentRequests: this.getRecentRequests(100),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Send infinite loop alert to monitoring service
   */
  private sendInfiniteLoopAlert(detection: InfiniteLoopDetection): void {
    try {
      fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'infinite_loop',
          endpoint: detection.endpoint,
          requestCount: detection.requestCount,
          timeWindow: detection.timeWindow,
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        // eslint-disable-next-line no-console
        console.warn('Failed to send infinite loop alert:', error);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Monitoring service unavailable:', error);
    }
  }

  /**
   * Start periodic cleanup of old data
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes

      // Clean up old loop detection data
      for (const [key, detection] of this.loopDetection.entries()) {
        if (now - detection.lastReset > maxAge) {
          this.loopDetection.delete(key);
        }
      }

      // Clean up old metrics
      const cutoff = now - maxAge;
      this.metrics = this.metrics.filter(m => m.startTime > cutoff);
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Create a performance report
   */
  generatePerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();
    const loopStatus = this.getInfiniteLoopStatus();
    const failedRequests = this.getFailedRequests(10);

    let report = "# Request Performance Report\n\n";
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += "## Overall Metrics\n";
    report += `- Total Requests: ${metrics.totalRequests}\n`;
    report += `- Success Rate: ${((1 - metrics.errorRate) * 100).toFixed(1)}%\n`;
    report += `- Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%\n`;
    report += `- Average Response Time: ${metrics.averageResponseTime}ms\n\n`;

    if (metrics.mostFrequentErrors.length > 0) {
      report += "## Most Frequent Errors\n";
      metrics.mostFrequentErrors.forEach(({ error, count }) => {
        report += `- ${error}: ${count} occurrences\n`;
      });
      report += "\n";
    }

    if (metrics.slowestRequests.length > 0) {
      report += "## Slowest Requests\n";
      metrics.slowestRequests.slice(0, 5).forEach(request => {
        report += `- ${request.method} ${request.url}: ${request.duration}ms\n`;
      });
      report += "\n";
    }

    if (loopStatus.some(l => l.isThrottled)) {
      report += "## Infinite Loop Alerts\n";
      loopStatus.filter(l => l.isThrottled).forEach(detection => {
        report += `- ${detection.endpoint}: ${detection.requestCount} requests in ${detection.timeWindow}ms\n`;
      });
      report += "\n";
    }

    if (failedRequests.length > 0) {
      report += "## Recent Failed Requests\n";
      failedRequests.slice(0, 5).forEach(request => {
        report += `- ${request.method} ${request.url}: ${request.error || 'Unknown error'}\n`;
      });
    }

    return report;
  }
}

// Create and export singleton instance
export const requestMonitor = RequestMonitor.getInstance();

// Development-only debugging utilities
if (process.env.NODE_ENV === "development") {
  // Make monitor available globally for debugging
  (window as any).requestMonitor = requestMonitor;

  // Log performance summary every 30 seconds
  setInterval(() => {
    const metrics = requestMonitor.getPerformanceMetrics();
    if (metrics.totalRequests > 0) {
      // eslint-disable-next-line no-console
      console.log("📊 Request Performance Summary:", {
        totalRequests: metrics.totalRequests,
        successRate: `${((1 - metrics.errorRate) * 100).toFixed(1)}%`,
        avgResponseTime: `${metrics.averageResponseTime}ms`,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      });
    }
  }, 30000);
}

export type { RequestMetrics, PerformanceMetrics, InfiniteLoopDetection };