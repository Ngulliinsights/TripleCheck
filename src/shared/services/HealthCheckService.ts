/**
 * Health Check Service
 * Monitors API endpoints, connection status, and system health
 */

export interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  error?: string;
  statusCode?: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, HealthCheckResult>;
  lastCheck: Date;
  uptime: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  lastHour: {
    requests: number;
    failures: number;
    avgResponseTime: number;
  };
  lastDay: {
    requests: number;
    failures: number;
    avgResponseTime: number;
  };
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private healthResults: Map<string, HealthCheckResult[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();
  private callbacks: Map<string, (health: SystemHealth) => void> = new Map();

  // Critical endpoints to monitor
  private criticalEndpoints = [
    { name: 'auth', url: '/api/auth/status', timeout: 5000 },
    { name: 'users', url: '/api/users/health', timeout: 5000 },
    { name: 'properties', url: '/api/properties/health', timeout: 5000 },
    { name: 'search', url: '/api/search/health', timeout: 5000 },
    { name: 'messaging', url: '/api/messaging/health', timeout: 5000 },
    { name: 'notifications', url: '/api/notifications/health', timeout: 5000 }
  ];

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Initial check
    this.performHealthChecks();

    // Set up interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform health checks on all critical endpoints
   */
  async performHealthChecks(): Promise<SystemHealth> {
    const healthPromises = this.criticalEndpoints.map(endpoint =>
      this.checkEndpointHealth(endpoint.name, endpoint.url, endpoint.timeout)
    );

    const results = await Promise.allSettled(healthPromises);
    const services: Record<string, HealthCheckResult> = {};
    let healthyCount = 0;
    let degradedCount = 0;

    results.forEach((result, index) => {
      const endpointName = this.criticalEndpoints[index].name;
      
      if (result.status === 'fulfilled') {
        services[endpointName] = result.value;
        if (result.value.status === 'healthy') healthyCount++;
        else if (result.value.status === 'degraded') degradedCount++;
      } else {
        services[endpointName] = {
          endpoint: this.criticalEndpoints[index].url,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: result.reason?.message || 'Health check failed'
        };
      }
    });

    // Determine overall health
    let overall: SystemHealth['overall'] = 'healthy';
    const totalServices = Object.keys(services).length;
    const unhealthyCount = totalServices - healthyCount - degradedCount;

    if (unhealthyCount > totalServices * 0.5) {
      overall = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > totalServices * 0.3) {
      overall = 'degraded';
    }

    const systemHealth: SystemHealth = {
      overall,
      services,
      lastCheck: new Date(),
      uptime: Date.now() - this.startTime.getTime()
    };

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(systemHealth);
      } catch (error) {
        console.error('Error in health check callback:', error);
      }
    });

    return systemHealth;
  }

  /**
   * Check health of a specific endpoint
   */
  async checkEndpointHealth(
    name: string, 
    url: string, 
    timeout: number = 5000
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let status: HealthCheckResult['status'] = 'healthy';
      if (responseTime > 2000) {
        status = 'degraded';
      }
      if (!response.ok) {
        status = response.status >= 500 ? 'unhealthy' : 'degraded';
      }

      const result: HealthCheckResult = {
        endpoint: url,
        status,
        responseTime,
        timestamp: new Date(),
        statusCode: response.status
      };

      // Store result
      this.storeHealthResult(name, result);
      this.updatePerformanceMetrics(name, result);

      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        endpoint: url,
        status: 'unhealthy',
        responseTime,
        timestamp: new Date(),
        error: error.message
      };

      this.storeHealthResult(name, result);
      this.updatePerformanceMetrics(name, result);

      return result;
    }
  }

  /**
   * Store health check result
   */
  private storeHealthResult(name: string, result: HealthCheckResult): void {
    if (!this.healthResults.has(name)) {
      this.healthResults.set(name, []);
    }

    const results = this.healthResults.get(name)!;
    results.push(result);

    // Keep only last 100 results per endpoint
    if (results.length > 100) {
      results.splice(0, results.length - 100);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(name: string, result: HealthCheckResult): void {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, {
        endpoint: result.endpoint,
        averageResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0,
        lastHour: { requests: 0, failures: 0, avgResponseTime: 0 },
        lastDay: { requests: 0, failures: 0, avgResponseTime: 0 }
      });
    }

    const metrics = this.performanceMetrics.get(name)!;
    const isSuccess = result.status !== 'unhealthy';

    // Update overall metrics
    metrics.totalRequests++;
    if (!isSuccess) metrics.failedRequests++;
    
    metrics.successRate = ((metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests) * 100;
    metrics.averageResponseTime = this.calculateAverageResponseTime(name);

    // Update time-based metrics
    this.updateTimeBasedMetrics(name, result, isSuccess);
  }

  /**
   * Calculate average response time for an endpoint
   */
  private calculateAverageResponseTime(name: string): number {
    const results = this.healthResults.get(name) || [];
    if (results.length === 0) return 0;

    const total = results.reduce((sum, result) => sum + result.responseTime, 0);
    return total / results.length;
  }

  /**
   * Update time-based metrics (last hour, last day)
   */
  private updateTimeBasedMetrics(name: string, result: HealthCheckResult, isSuccess: boolean): void {
    const metrics = this.performanceMetrics.get(name)!;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const results = this.healthResults.get(name) || [];

    // Last hour metrics
    const lastHourResults = results.filter(r => r.timestamp >= oneHourAgo);
    metrics.lastHour = {
      requests: lastHourResults.length,
      failures: lastHourResults.filter(r => r.status === 'unhealthy').length,
      avgResponseTime: lastHourResults.length > 0 
        ? lastHourResults.reduce((sum, r) => sum + r.responseTime, 0) / lastHourResults.length 
        : 0
    };

    // Last day metrics
    const lastDayResults = results.filter(r => r.timestamp >= oneDayAgo);
    metrics.lastDay = {
      requests: lastDayResults.length,
      failures: lastDayResults.filter(r => r.status === 'unhealthy').length,
      avgResponseTime: lastDayResults.length > 0 
        ? lastDayResults.reduce((sum, r) => sum + r.responseTime, 0) / lastDayResults.length 
        : 0
    };
  }

  /**
   * Get current system health
   */
  getCurrentHealth(): SystemHealth | null {
    const services: Record<string, HealthCheckResult> = {};
    let hasData = false;

    this.criticalEndpoints.forEach(endpoint => {
      const results = this.healthResults.get(endpoint.name);
      if (results && results.length > 0) {
        services[endpoint.name] = results[results.length - 1];
        hasData = true;
      }
    });

    if (!hasData) return null;

    const healthyCount = Object.values(services).filter(s => s.status === 'healthy').length;
    const degradedCount = Object.values(services).filter(s => s.status === 'degraded').length;
    const totalServices = Object.keys(services).length;
    const unhealthyCount = totalServices - healthyCount - degradedCount;

    let overall: SystemHealth['overall'] = 'healthy';
    if (unhealthyCount > totalServices * 0.5) {
      overall = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > totalServices * 0.3) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      lastCheck: new Date(),
      uptime: Date.now() - this.startTime.getTime()
    };
  }

  /**
   * Get performance metrics for all endpoints
   */
  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Get health history for an endpoint
   */
  getHealthHistory(endpointName: string, limit: number = 50): HealthCheckResult[] {
    const results = this.healthResults.get(endpointName) || [];
    return results.slice(-limit);
  }

  /**
   * Subscribe to health updates
   */
  onHealthUpdate(id: string, callback: (health: SystemHealth) => void): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Unsubscribe from health updates
   */
  offHealthUpdate(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Add custom endpoint to monitor
   */
  addEndpoint(name: string, url: string, timeout: number = 5000): void {
    this.criticalEndpoints.push({ name, url, timeout });
  }

  /**
   * Remove endpoint from monitoring
   */
  removeEndpoint(name: string): void {
    const index = this.criticalEndpoints.findIndex(e => e.name === name);
    if (index > -1) {
      this.criticalEndpoints.splice(index, 1);
      this.healthResults.delete(name);
      this.performanceMetrics.delete(name);
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance();
export default healthCheckService;