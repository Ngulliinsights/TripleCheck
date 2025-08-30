import { Router, Request, Response } from 'express';

const router = Router();

// Type definitions for monitoring data
interface PerformanceAlert {
  id: string;
  type: 'high_response_time' | 'memory_usage' | 'error_rate' | 'cpu_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
}

interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  requestCount: number;
  errorRate: number;
  lastHour: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

// Helper function to generate mock system metrics
const generateSystemMetrics = (): SystemMetrics => ({
  timestamp: new Date().toISOString(),
  cpu: {
    usage: Math.random() * 100,
    loadAverage: [
      Math.random() * 2,
      Math.random() * 2,
      Math.random() * 2
    ]
  },
  memory: {
    used: Math.random() * 8000000000, // 8GB max
    total: 8000000000,
    percentage: Math.random() * 100
  },
  disk: {
    used: Math.random() * 500000000000, // 500GB max
    total: 500000000000,
    percentage: Math.random() * 100
  },
  network: {
    bytesIn: Math.random() * 1000000,
    bytesOut: Math.random() * 1000000
  }
});

// Helper function to generate mock API metrics
const generateApiMetrics = (): ApiMetrics[] => {
  const endpoints = [
    { endpoint: '/api/properties', method: 'GET' },
    { endpoint: '/api/users', method: 'GET' },
    { endpoint: '/api/auth/login', method: 'POST' },
    { endpoint: '/api/notifications', method: 'GET' },
    { endpoint: '/api/properties/search', method: 'POST' }
  ];

  return endpoints.map(({ endpoint, method }) => ({
    endpoint,
    method,
    responseTime: {
      avg: Math.random() * 500 + 50,
      min: Math.random() * 50 + 10,
      max: Math.random() * 1000 + 500,
      p95: Math.random() * 800 + 200,
      p99: Math.random() * 1200 + 400
    },
    requestCount: Math.floor(Math.random() * 10000) + 1000,
    errorRate: Math.random() * 5, // 0-5% error rate
    lastHour: {
      requests: Math.floor(Math.random() * 1000) + 100,
      errors: Math.floor(Math.random() * 50),
      avgResponseTime: Math.random() * 300 + 100
    }
  }));
};

// Performance alerts endpoint
router.post('/performance-alerts', (req: Request, res: Response) => {
  const { metric, value, threshold, severity = 'medium' } = req.body;
  
  const alert: PerformanceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: metric || 'high_response_time',
    severity,
    message: `Performance alert: ${metric} is ${value}, exceeding threshold of ${threshold}`,
    value: value || 0,
    threshold: threshold || 0,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  
  res.json({
    success: true,
    data: alert,
    message: 'Performance alert recorded'
  });
});

// General monitoring alerts endpoint
router.post('/alerts', (req: Request, res: Response) => {
  const { type, message, severity = 'medium', metadata } = req.body;
  
  const alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type || 'system',
    severity,
    message: message || 'System alert triggered',
    timestamp: new Date().toISOString(),
    resolved: false,
    metadata: metadata || {}
  };
  
  res.json({
    success: true,
    data: alert,
    message: 'Alert recorded successfully'
  });
});

// Get system metrics
router.get('/metrics/system', (req: Request, res: Response) => {
  const { timeRange = '1h' } = req.query;
  
  // Generate historical data based on time range
  const dataPoints = timeRange === '1h' ? 60 : timeRange === '24h' ? 24 : 7;
  const metrics = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(Date.now() - i * (timeRange === '1h' ? 60000 : timeRange === '24h' ? 3600000 : 86400000));
    metrics.push({
      ...generateSystemMetrics(),
      timestamp: timestamp.toISOString()
    });
  }
  
  res.json({
    success: true,
    data: {
      current: generateSystemMetrics(),
      historical: metrics.reverse(),
      timeRange,
      summary: {
        avgCpuUsage: metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.length,
        avgMemoryUsage: metrics.reduce((sum, m) => sum + m.memory.percentage, 0) / metrics.length,
        peakCpuUsage: Math.max(...metrics.map(m => m.cpu.usage)),
        peakMemoryUsage: Math.max(...metrics.map(m => m.memory.percentage))
      }
    }
  });
});

// Get API performance metrics
router.get('/metrics/api', (req: Request, res: Response) => {
  const { endpoint, timeRange = '1h' } = req.query;
  
  let apiMetrics = generateApiMetrics();
  
  if (endpoint) {
    apiMetrics = apiMetrics.filter(m => m.endpoint === endpoint);
  }
  
  res.json({
    success: true,
    data: {
      endpoints: apiMetrics,
      timeRange,
      summary: {
        totalRequests: apiMetrics.reduce((sum, m) => sum + m.requestCount, 0),
        avgResponseTime: apiMetrics.reduce((sum, m) => sum + m.responseTime.avg, 0) / apiMetrics.length,
        totalErrors: apiMetrics.reduce((sum, m) => sum + (m.requestCount * m.errorRate / 100), 0),
        overallErrorRate: apiMetrics.reduce((sum, m) => sum + m.errorRate, 0) / apiMetrics.length
      }
    }
  });
});

// Get application health status
router.get('/health', (req: Request, res: Response) => {
  const systemMetrics = generateSystemMetrics();
  const apiMetrics = generateApiMetrics();
  
  // Determine overall health based on metrics
  let healthStatus = 'healthy';
  const issues = [];
  
  if (systemMetrics.cpu.usage > 80) {
    healthStatus = 'degraded';
    issues.push('High CPU usage detected');
  }
  
  if (systemMetrics.memory.percentage > 85) {
    healthStatus = 'degraded';
    issues.push('High memory usage detected');
  }
  
  const avgErrorRate = apiMetrics.reduce((sum, m) => sum + m.errorRate, 0) / apiMetrics.length;
  if (avgErrorRate > 5) {
    healthStatus = 'unhealthy';
    issues.push('High API error rate detected');
  }
  
  const avgResponseTime = apiMetrics.reduce((sum, m) => sum + m.responseTime.avg, 0) / apiMetrics.length;
  if (avgResponseTime > 1000) {
    healthStatus = healthStatus === 'healthy' ? 'degraded' : healthStatus;
    issues.push('Slow API response times detected');
  }
  
  res.json({
    success: true,
    data: {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      issues,
      metrics: {
        system: systemMetrics,
        api: {
          avgResponseTime,
          avgErrorRate,
          totalEndpoints: apiMetrics.length
        }
      },
      services: {
        database: 'healthy',
        cache: 'healthy',
        storage: 'healthy',
        email: 'healthy'
      }
    }
  });
});

// Get alerts history
router.get('/alerts', (req: Request, res: Response) => {
  const { severity, resolved, limit = '50' } = req.query;
  
  // Generate mock alerts
  const alerts: PerformanceAlert[] = [];
  const severities: PerformanceAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
  const types: PerformanceAlert['type'][] = ['high_response_time', 'memory_usage', 'error_rate', 'cpu_usage'];
  
  for (let i = 0; i < parseInt(limit as string); i++) {
    const alertSeverity = severities[i % severities.length];
    const alertType = types[i % types.length];
    const isResolved = Math.random() > 0.3; // 70% chance of being resolved
    
    alerts.push({
      id: `alert_${i}_${Date.now()}`,
      type: alertType,
      severity: alertSeverity,
      message: `${alertType.replace('_', ' ').toUpperCase()} alert - ${alertSeverity} severity`,
      value: Math.random() * 100,
      threshold: Math.random() * 80,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      resolved: isResolved
    });
  }
  
  let filteredAlerts = alerts;
  
  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  }
  
  if (resolved !== undefined) {
    const isResolved = resolved === 'true';
    filteredAlerts = filteredAlerts.filter(a => a.resolved === isResolved);
  }
  
  res.json({
    success: true,
    data: filteredAlerts,
    summary: {
      total: filteredAlerts.length,
      resolved: filteredAlerts.filter(a => a.resolved).length,
      unresolved: filteredAlerts.filter(a => !a.resolved).length,
      bySeverity: {
        critical: filteredAlerts.filter(a => a.severity === 'critical').length,
        high: filteredAlerts.filter(a => a.severity === 'high').length,
        medium: filteredAlerts.filter(a => a.severity === 'medium').length,
        low: filteredAlerts.filter(a => a.severity === 'low').length
      }
    }
  });
});

// Resolve alert
router.patch('/alerts/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolution, resolvedBy } = req.body;
  
  res.json({
    success: true,
    data: {
      id,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolution: resolution || 'Alert resolved manually',
      resolvedBy: resolvedBy || 'system'
    },
    message: 'Alert resolved successfully'
  });
});

// Get dashboard summary
router.get('/dashboard', (req: Request, res: Response) => {
  const systemMetrics = generateSystemMetrics();
  const apiMetrics = generateApiMetrics();
  
  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      system: {
        status: 'operational',
        uptime: process.uptime(),
        cpu: systemMetrics.cpu.usage,
        memory: systemMetrics.memory.percentage,
        disk: systemMetrics.disk.percentage
      },
      api: {
        totalRequests: apiMetrics.reduce((sum, m) => sum + m.requestCount, 0),
        avgResponseTime: apiMetrics.reduce((sum, m) => sum + m.responseTime.avg, 0) / apiMetrics.length,
        errorRate: apiMetrics.reduce((sum, m) => sum + m.errorRate, 0) / apiMetrics.length,
        activeEndpoints: apiMetrics.length
      },
      alerts: {
        active: Math.floor(Math.random() * 5),
        resolved: Math.floor(Math.random() * 20) + 10,
        critical: Math.floor(Math.random() * 2),
        high: Math.floor(Math.random() * 3)
      },
      performance: {
        cacheHitRate: Math.random() * 20 + 80, // 80-100%
        dbConnectionPool: Math.floor(Math.random() * 10) + 5,
        queueLength: Math.floor(Math.random() * 100),
        activeUsers: Math.floor(Math.random() * 500) + 100
      }
    }
  });
});

export { router as monitoringRouter };