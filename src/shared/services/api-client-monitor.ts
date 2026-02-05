/**
 * API Client Monitoring and Performance Baseline
 * 
 * This service monitors the unified API client performance and provides
 * baseline metrics for regression detection.
 */

import { apiClient } from "../../shared/services/unified-api-client"

export interface ApiMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  circuitBreakerTrips: number;
  rateLimitHits: number;
  securityBlocks: number;
  lastUpdated: Date;
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  errorTypes: Record<string, number>;
  lastError?: {
    message: string;
    timestamp: Date;
    status?: number;
  };
}

export interface PerformanceBaseline {
  version: string;
  timestamp: Date;
  metrics: ApiMetrics;
  endpointMetrics: EndpointMetrics[];
  systemInfo: {
    userAgent: string;
    connectionType?: string;
    memoryUsage?: number;
  };
}

class ApiClientMonitor {
  private metrics: ApiMetrics;
  private endpointMetrics = new Map<string, EndpointMetrics>();
  private responseTimes: number[] = [];
  private baseline: PerformanceBaseline | null = null;
  private isMonitoring = false;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeMetrics(): ApiMetrics {
    return {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHitRate: 0,
      circuitBreakerTrips: 0,
      rateLimitHits: 0,
      securityBlocks: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Start monitoring API client performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 API Client monitoring started');

    // Monitor fetch requests by intercepting them
    this.interceptFetch();
    
    // Set up periodic metric collection
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds

    // Set up performance baseline collection
    setTimeout(() => {
      this.establishBaseline();
    }, 60000); // After 1 minute of operation
  }

  /**
   * Intercept fetch requests to monitor API calls
   */
  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.recordRequest(url, method, response.status, responseTime, response.ok);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.recordRequest(url, method, 0, responseTime, false, error as Error);
        
        throw error;
      }
    };
  }

  /**
   * Record individual request metrics
   */
  private recordRequest(
    url: string, 
    method: string, 
    status: number, 
    responseTime: number, 
    success: boolean,
    error?: Error
  ): void {
    // Update global metrics
    this.metrics.requestCount++;
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    // Track response times
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000); // Keep last 1000
    }

    // Update endpoint-specific metrics
    const endpointKey = `${method}:${this.normalizeUrl(url)}`;
    let endpointMetric = this.endpointMetrics.get(endpointKey);
    
    if (!endpointMetric) {
      endpointMetric = {
        endpoint: this.normalizeUrl(url),
        method,
        requestCount: 0,
        successRate: 0,
        averageResponseTime: 0,
        errorTypes: {}
      };
      this.endpointMetrics.set(endpointKey, endpointMetric);
    }

    endpointMetric.requestCount++;
    
    // Update success rate
    const successCount = Math.round(endpointMetric.successRate * (endpointMetric.requestCount - 1) / 100);
    const newSuccessCount = success ? successCount + 1 : successCount;
    endpointMetric.successRate = (newSuccessCount / endpointMetric.requestCount) * 100;

    // Update average response time
    const totalTime = endpointMetric.averageResponseTime * (endpointMetric.requestCount - 1);
    endpointMetric.averageResponseTime = (totalTime + responseTime) / endpointMetric.requestCount;

    // Track errors
    if (!success && error) {
      const errorType = error.name || 'UnknownError';
      endpointMetric.errorTypes[errorType] = (endpointMetric.errorTypes[errorType] || 0) + 1;
      endpointMetric.lastError = {
        message: error.message,
        timestamp: new Date(),
        status
      };

      // Check for specific error types
      if (error.message.includes('Rate limit')) {
        this.metrics.rateLimitHits++;
      }
      if (error.message.includes('Circuit breaker')) {
        this.metrics.circuitBreakerTrips++;
      }
      if (error.message.includes('security policy')) {
        this.metrics.securityBlocks++;
      }
    }

    this.metrics.lastUpdated = new Date();
  }

  /**
   * Normalize URL for consistent tracking
   */
  private normalizeUrl(url: string): string {
    // Remove query parameters and normalize IDs
    return url
      .replace(/\?.*$/, '') // Remove query params
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid'); // Replace UUIDs
  }

  /**
   * Collect and calculate current metrics
   */
  private collectMetrics(): void {
    if (this.responseTimes.length === 0) return;

    // Calculate response time percentiles
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    this.metrics.averageResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    this.metrics.p95ResponseTime = sortedTimes[p95Index] || 0;
    this.metrics.p99ResponseTime = sortedTimes[p99Index] || 0;

    // Calculate cache hit rate (would need integration with cache service)
    // For now, estimate based on duplicate requests
    this.metrics.cacheHitRate = this.estimateCacheHitRate();

    this.metrics.lastUpdated = new Date();
  }

  /**
   * Estimate cache hit rate based on request patterns
   */
  private estimateCacheHitRate(): number {
    // Simple estimation - in real implementation would integrate with cache
    const getRequests = Array.from(this.endpointMetrics.values())
      .filter(m => m.method === 'GET')
      .reduce((sum, m) => sum + m.requestCount, 0);
    
    const totalRequests = this.metrics.requestCount;
    
    if (totalRequests === 0) return 0;
    
    // Rough estimate: assume 30% of GET requests could be cached
    return Math.min((getRequests * 0.3) / totalRequests * 100, 100);
  }

  /**
   * Establish performance baseline
   */
  establishBaseline(): void {
    this.baseline = {
      version: '1.0.0', // Would get from package.json
      timestamp: new Date(),
      metrics: { ...this.metrics },
      endpointMetrics: Array.from(this.endpointMetrics.values()),
      systemInfo: {
        userAgent: navigator.userAgent,
        connectionType: (navigator as any).connection?.effectiveType,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }
    };

    console.log('📊 Performance baseline established:', this.baseline);
    
    // Save baseline to localStorage for persistence
    try {
      localStorage.setItem('api_client_baseline', JSON.stringify(this.baseline));
    } catch (error) {
      console.warn('Could not save baseline to localStorage:', error);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ApiMetrics {
    this.collectMetrics();
    return { ...this.metrics };
  }

  /**
   * Get endpoint-specific metrics
   */
  getEndpointMetrics(): EndpointMetrics[] {
    return Array.from(this.endpointMetrics.values());
  }

  /**
   * Get performance baseline
   */
  getBaseline(): PerformanceBaseline | null {
    return this.baseline;
  }

  /**
   * Compare current performance to baseline
   */
  compareToBaseline(): {
    status: 'better' | 'similar' | 'worse' | 'no_baseline';
    differences: {
      responseTime: number; // percentage change
      successRate: number;
      errorRate: number;
    };
    alerts: string[];
  } {
    if (!this.baseline) {
      return {
        status: 'no_baseline',
        differences: { responseTime: 0, successRate: 0, errorRate: 0 },
        alerts: ['No baseline available for comparison']
      };
    }

    const current = this.getCurrentMetrics();
    const baseline = this.baseline.metrics;
    
    const responseTimeChange = baseline.averageResponseTime > 0 
      ? ((current.averageResponseTime - baseline.averageResponseTime) / baseline.averageResponseTime) * 100
      : 0;
    
    const currentSuccessRate = current.requestCount > 0 
      ? (current.successCount / current.requestCount) * 100 
      : 100;
    const baselineSuccessRate = baseline.requestCount > 0 
      ? (baseline.successCount / baseline.requestCount) * 100 
      : 100;
    const successRateChange = currentSuccessRate - baselineSuccessRate;
    
    const currentErrorRate = current.requestCount > 0 
      ? (current.errorCount / current.requestCount) * 100 
      : 0;
    const baselineErrorRate = baseline.requestCount > 0 
      ? (baseline.errorCount / baseline.requestCount) * 100 
      : 0;
    const errorRateChange = currentErrorRate - baselineErrorRate;

    const alerts: string[] = [];
    
    // Performance regression alerts
    if (responseTimeChange > 50) {
      alerts.push(`Response time increased by ${responseTimeChange.toFixed(1)}%`);
    }
    if (successRateChange < -5) {
      alerts.push(`Success rate decreased by ${Math.abs(successRateChange).toFixed(1)}%`);
    }
    if (errorRateChange > 5) {
      alerts.push(`Error rate increased by ${errorRateChange.toFixed(1)}%`);
    }
    if (current.circuitBreakerTrips > baseline.circuitBreakerTrips + 5) {
      alerts.push(`Circuit breaker trips increased significantly`);
    }

    // Determine overall status
    let status: 'better' | 'similar' | 'worse' = 'similar';
    if (responseTimeChange > 25 || successRateChange < -3 || errorRateChange > 3) {
      status = 'worse';
    } else if (responseTimeChange < -10 && successRateChange > 1 && errorRateChange < 1) {
      status = 'better';
    }

    return {
      status,
      differences: {
        responseTime: responseTimeChange,
        successRate: successRateChange,
        errorRate: errorRateChange
      },
      alerts
    };
  }

  /**
   * Generate monitoring report
   */
  generateReport(): {
    summary: string;
    metrics: ApiMetrics;
    endpointMetrics: EndpointMetrics[];
    baseline: PerformanceBaseline | null;
    comparison: ReturnType<typeof this.compareToBaseline>;
    recommendations: string[];
  } {
    const metrics = this.getCurrentMetrics();
    const endpointMetrics = this.getEndpointMetrics();
    const comparison = this.compareToBaseline();
    
    const successRate = metrics.requestCount > 0 
      ? ((metrics.successCount / metrics.requestCount) * 100).toFixed(1)
      : '100';
    
    const summary = `API Client Health: ${metrics.requestCount} requests, ${successRate}% success rate, ${metrics.averageResponseTime.toFixed(0)}ms avg response time`;
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on metrics
    if (metrics.averageResponseTime > 2000) {
      recommendations.push('Consider optimizing slow endpoints or increasing cache TTL');
    }
    if (metrics.errorCount / metrics.requestCount > 0.05) {
      recommendations.push('High error rate detected - investigate failing endpoints');
    }
    if (metrics.circuitBreakerTrips > 0) {
      recommendations.push('Circuit breaker has triggered - check service health');
    }
    if (metrics.rateLimitHits > 0) {
      recommendations.push('Rate limiting active - consider request throttling');
    }
    if (metrics.cacheHitRate < 20) {
      recommendations.push('Low cache hit rate - review caching strategy');
    }

    return {
      summary,
      metrics,
      endpointMetrics,
      baseline: this.baseline,
      comparison,
      recommendations
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.endpointMetrics.clear();
    this.responseTimes = [];
    console.log('📊 API Client metrics reset');
  }
}

// Export singleton instance
export const apiMonitor = new ApiClientMonitor();

// Export monitoring utilities
export const monitoringUtils = {
  /**
   * Get quick health check
   */
  getHealthCheck(): { status: 'healthy' | 'degraded' | 'critical'; message: string } {
    const metrics = apiMonitor.getCurrentMetrics();
    const comparison = apiMonitor.compareToBaseline();
    
    if (comparison.alerts.length === 0 && comparison.status !== 'worse') {
      return { status: 'healthy', message: 'API client performing normally' };
    } else if (comparison.status === 'worse' || comparison.alerts.length <= 2) {
      return { status: 'degraded', message: `Performance issues detected: ${comparison.alerts.join(', ')}` };
    } else {
      return { status: 'critical', message: `Critical performance degradation: ${comparison.alerts.join(', ')}` };
    }
  },

  /**
   * Log performance summary to console
   */
  logPerformanceSummary(): void {
    const report = apiMonitor.generateReport();
    console.group('🔍 API Client Performance Summary');
    console.log(report.summary);
    console.log('📊 Metrics:', report.metrics);
    console.log('🎯 Top Endpoints:', report.endpointMetrics.slice(0, 5));
    if (report.comparison.alerts.length > 0) {
      console.warn('⚠️ Alerts:', report.comparison.alerts);
    }
    if (report.recommendations.length > 0) {
      console.info('💡 Recommendations:', report.recommendations);
    }
    console.groupEnd();
  },

  /**
   * Start automated monitoring reports
   */
  startAutomatedReporting(intervalMinutes: number = 15): void {
    setInterval(() => {
      monitoringUtils.logPerformanceSummary();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🔄 Automated reporting started (every ${intervalMinutes} minutes)`);
  }
};