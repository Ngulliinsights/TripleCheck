#!/usr/bin/env tsx

/**
 * TRIPLECHECK HEALTH CHECK SCRIPT
 * ===============================
 * 
 * Comprehensive health check for deployment monitoring
 */

import { performance } from 'perf_hooks';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthStatus;
    filesystem: HealthStatus;
    memory: HealthStatus;
    dependencies: HealthStatus;
  };
  metrics: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
}

class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Run comprehensive health check
   */
  async check(): Promise<HealthCheckResult> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkFilesystem(),
      this.checkMemory(),
      this.checkDependencies()
    ]);

    const overallStatus = this.determineOverallStatus(checks);
    const responseTime = performance.now() - this.startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.getVersion(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: checks[0],
        filesystem: checks[1],
        memory: checks[2],
        dependencies: checks[3]
      },
      metrics: {
        responseTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      // Check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL) {
        return {
          status: 'fail',
          message: 'Database URL not configured',
          responseTime: performance.now() - startTime
        };
      }

      // For production, you would actually test the connection here
      // This is a simplified check
      const url = new URL(process.env.DATABASE_URL);
      
      if (!url.hostname || !url.port) {
        return {
          status: 'fail',
          message: 'Invalid database URL format',
          responseTime: performance.now() - startTime
        };
      }

      return {
        status: 'pass',
        message: 'Database configuration valid',
        responseTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Database check failed: ${error.message}`,
        responseTime: performance.now() - startTime
      };
    }
  }

  /**
   * Check filesystem access
   */
  private async checkFilesystem(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      const fs = await import('fs/promises');
      
      // Check if we can read the current directory
      await fs.access('.', fs.constants.R_OK);
      
      // Check if uploads directory exists or can be created
      const uploadsDir = process.env.UPLOAD_DIR || './uploads';
      try {
        await fs.access(uploadsDir, fs.constants.W_OK);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      return {
        status: 'pass',
        message: 'Filesystem access OK',
        responseTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Filesystem check failed: ${error.message}`,
        responseTime: performance.now() - startTime
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Memory usage: ${memoryUsagePercent.toFixed(1)}%`;

      if (memoryUsagePercent > 90) {
        status = 'fail';
        message += ' (Critical)';
      } else if (memoryUsagePercent > 75) {
        status = 'warn';
        message += ' (High)';
      }

      return {
        status,
        message,
        responseTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Memory check failed: ${error.message}`,
        responseTime: performance.now() - startTime
      };
    }
  }

  /**
   * Check critical dependencies
   */
  private async checkDependencies(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      const criticalDeps = [
        'react',
        'react-dom',
        'express',
        'drizzle-orm'
      ];

      for (const dep of criticalDeps) {
        try {
          await import(dep);
        } catch (error) {
          return {
            status: 'fail',
            message: `Critical dependency missing: ${dep}`,
            responseTime: performance.now() - startTime
          };
        }
      }

      return {
        status: 'pass',
        message: 'All critical dependencies available',
        responseTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Dependency check failed: ${error.message}`,
        responseTime: performance.now() - startTime
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: HealthStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');

    if (hasFailures) return 'unhealthy';
    if (hasWarnings) return 'degraded';
    return 'healthy';
  }

  /**
   * Get application version
   */
  private getVersion(): string {
    try {
      const fs = require('fs');
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const format = args[0] || 'json';

  try {
    const checker = new HealthChecker();
    const result = await checker.check();

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else if (format === 'summary') {
      console.log(`Status: ${result.status.toUpperCase()}`);
      console.log(`Environment: ${result.environment}`);
      console.log(`Uptime: ${Math.floor(result.uptime)}s`);
      console.log(`Response Time: ${result.metrics.responseTime.toFixed(2)}ms`);
      console.log('\nChecks:');
      
      Object.entries(result.checks).forEach(([name, check]) => {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
        console.log(`  ${icon} ${name}: ${check.message}`);
      });
    }

    // Exit with appropriate code
    process.exit(result.status === 'unhealthy' ? 1 : 0);
    
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { HealthChecker };