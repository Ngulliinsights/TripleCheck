import winston from 'winston';
import { Request, Response } from 'express';
import { performance } from 'perf_hooks';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  component?: string;
  version?: string;
  environment?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: LogContext;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory: NodeJS.MemoryUsage;
    cpu?: number;
  };
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: Date;
}

export class StructuredLogger {
  private logger: winston.Logger;
  private defaultContext: LogContext;
  private metricsBuffer: MetricData[] = [];
  private performanceMarks: Map<string, number> = new Map();

  constructor(options: {
    level?: string;
    service?: string;
    version?: string;
    environment?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
    enableMetrics?: boolean;
    logDirectory?: string;
  } = {}) {
    const {
      level = 'info',
      service = 'triplecheck-api',
      version = process.env.APP_VERSION || '1.0.0',
      environment = process.env.NODE_ENV || 'development',
      enableConsole = true,
      enableFile = true,
      enableMetrics = true,
      logDirectory = './logs'
    } = options;

    this.defaultContext = {
      service,
      version,
      environment,
      hostname: require('os').hostname(),
      pid: process.pid
    };

    // Create winston logger with structured format
    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: this.defaultContext,
      transports: this.createTransports(enableConsole, enableFile, logDirectory)
    });

    // Start metrics collection if enabled
    if (enableMetrics) {
      this.startMetricsCollection();
    }

    // Handle uncaught exceptions and rejections
    this.setupErrorHandlers();
  }

  private createTransports(enableConsole: boolean, enableFile: boolean, logDirectory: string): winston.transport[] {
    const transports: winston.transport[] = [];

    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    }

    if (enableFile) {
      // Application logs
      transports.push(
        new winston.transports.File({
          filename: `${logDirectory}/app.log`,
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5
        })
      );

      // Error logs
      transports.push(
        new winston.transports.File({
          filename: `${logDirectory}/error.log`,
          level: 'error',
          maxsize: 50 * 1024 * 1024,
          maxFiles: 5
        })
      );
    }

    return transports;
  }

  private setupErrorHandlers(): void {
    process.on('uncaughtException', (error) => {
      this.error('Uncaught Exception', { error: this.serializeError(error) });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      this.error('Unhandled Rejection', {
        error: reason instanceof Error ? this.serializeError(reason) : { message: String(reason) }
      });
    });
  }

  private serializeError(error: Error): LogEntry['error'] {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    };
  }

  private metricsInterval?: NodeJS.Timeout;
  private flushInterval?: NodeJS.Timeout;

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Flush metrics buffer every 60 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 60000);
  }

  public cleanup(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }
  }

  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.recordMetric('system.memory.heap_used', memoryUsage.heapUsed, 'bytes');
    this.recordMetric('system.memory.heap_total', memoryUsage.heapTotal, 'bytes');
    this.recordMetric('system.memory.external', memoryUsage.external, 'bytes');
    this.recordMetric('system.memory.rss', memoryUsage.rss, 'bytes');
    this.recordMetric('system.cpu.user', cpuUsage.user, 'microseconds');
    this.recordMetric('system.cpu.system', cpuUsage.system, 'microseconds');
    this.recordMetric('system.uptime', process.uptime(), 'seconds');
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length > 0) {
      this.info('System metrics', {
        metadata: {
          metrics: this.metricsBuffer.splice(0)
        }
      });
    }
  }

  // Public logging methods
  public debug(message: string, context: LogContext = {}): void {
    this.logger.debug(message, { context });
  }

  public info(message: string, context: LogContext = {}): void {
    this.logger.info(message, { context });
  }

  public warn(message: string, context: LogContext = {}): void {
    this.logger.warn(message, { context });
  }

  public error(message: string, context: LogContext = {}): void {
    this.logger.error(message, { context });
  }

  // Performance logging methods
  public startTimer(operation: string): void {
    this.performanceMarks.set(operation, performance.now());
  }

  public endTimer(operation: string, context: LogContext = {}): number {
    const startTime = this.performanceMarks.get(operation);
    if (!startTime) {
      this.warn(`Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(operation);

    this.info(`Operation completed: ${operation}`, {
      ...context,
      performance: {
        duration,
        memory: process.memoryUsage()
      }
    });

    this.recordMetric(`operation.duration.${operation}`, duration, 'milliseconds');
    return duration;
  }

  // Metrics recording
  public recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    this.metricsBuffer.push({
      name,
      value,
      unit,
      tags: {
        ...tags,
        service: this.defaultContext.service || 'unknown',
        environment: this.defaultContext.environment || 'unknown'
      },
      timestamp: new Date()
    });
  }

  // Request/Response logging
  public logRequest(req: Request, context: LogContext = {}): void {
    this.info('HTTP Request', {
      ...context,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        headers: this.sanitizeHeaders(req.headers)
      }
    });

    this.recordMetric('http.requests.total', 1, 'count', {
      method: req.method,
      endpoint: req.route?.path || req.path
    });
  }

  public logResponse(req: Request, res: Response, duration: number, context: LogContext = {}): void {
    this.info('HTTP Response', {
      ...context,
      metadata: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration
      },
      performance: {
        duration,
        memory: process.memoryUsage()
      }
    });

    this.recordMetric('http.response_time', duration, 'milliseconds', {
      method: req.method,
      status_code: res.statusCode.toString()
    });
  }

  // Utility methods
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Health check
  public getHealthStatus(): {
    status: 'healthy' | 'unhealthy';
    metrics: {
      totalLogs: number;
      memoryUsage: NodeJS.MemoryUsage;
    };
  } {
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      metrics: {
        totalLogs: this.metricsBuffer.length,
        memoryUsage
      }
    };
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    this.info('Logger shutting down');
    this.flushMetrics();
    
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }
}

// Create singleton logger instance
export const structuredLogger = new StructuredLogger({
  level: process.env.LOG_LEVEL || 'info',
  service: 'triplecheck-api',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development'
});