/**
 * Unified Logging System with OpenTelemetry and Pino
 * 
 * Single source of truth for all logging across the application.
 * Replaces custom logging, Winston, and other logging implementations.
 * 
 * Features:
 * - Pino for fast, structured JSON logging
 * - OpenTelemetry integration for distributed tracing
 * - Automatic trace/span ID injection
 * - Prometheus metrics export
 * - Context-aware logging
 * - Backward compatibility adapters
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as pino from 'pino';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Initialize OpenTelemetry SDK
let sdk: NodeSDK | null = null;

export function initializeTelemetry() {
  if (sdk) {
    return; // Already initialized
  }

  const prometheusPort = parseInt(process.env.PROMETHEUS_PORT || '9464');
  const prometheusExporter = new PrometheusExporter(
    {
      port: prometheusPort,
    },
    () => {
      logger.info({ port: prometheusPort }, 'Prometheus metrics server started');
    }
  );

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'triplecheck-api',
      [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    }),
    metricReader: prometheusExporter as any,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    try {
      await sdk?.shutdown();
      logger.info('OpenTelemetry SDK shut down successfully');
    } catch (error) {
      logger.error({ error }, 'Error shutting down OpenTelemetry SDK');
    }
  });

  logger.info({
    serviceName: 'triplecheck-api',
    prometheusPort,
  }, 'OpenTelemetry initialized');
}

// Pino logger with OpenTelemetry integration
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    
    const { traceId, spanId } = span.spanContext();
    return { traceId, spanId };
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Tracer for custom spans
export const tracer = trace.getTracer('triplecheck-api');

/**
 * Create a traced function wrapper
 */
export function traced<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  attributes?: Record<string, any>
): T {
  return ((...args: any[]) => {
    return tracer.startActiveSpan(name, (span: any) => {
      try {
        if (attributes) {
          span.setAttributes(attributes);
        }
        
        const result = fn(...args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
              return value;
            })
            .catch((error) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              span.end();
              throw error;
            });
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.end();
        throw error;
      }
    });
  }) as T;
}

/**
 * Decorator for tracing class methods
 */
export function Traced(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = traced(name, originalMethod);
    return descriptor;
  };
}

/**
 * Express middleware for request tracing
 */
export function tracingMiddleware() {
  return (req: any, res: any, next: any) => {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes({
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.route?.path,
        'user.id': req.user?.id,
      });
    }
    next();
  };
}

/**
 * Log with context from active span
 */
export function logWithSpan(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, any>
) {
  const span = trace.getActiveSpan();
  const logData = { ...data };
  
  if (span) {
    const { traceId, spanId } = span.spanContext();
    logData.traceId = traceId;
    logData.spanId = spanId;
  }
  
  logger[level](logData, message);
}

// ============================================================================
// Backward Compatibility Adapters
// ============================================================================

/**
 * Legacy Logger Interface Adapter
 * Provides compatibility with the old custom logger interface
 * Supports both calling patterns:
 * 1. logger.info(message, context, data, error) - Old format
 * 2. logger.info(message, data) - Pino-like format
 * 3. logger.error({ error: data }, message) - Old pino format (will be handled)
 */
export class LegacyLoggerAdapter {
  error(message: string | any, contextOrData?: string | any, data?: any, error?: Error): void {
    // Handle logger.error(data, message) - old Pino format where first arg is object
    if (typeof message === 'object' && typeof contextOrData === 'string') {
      // Pino logger.error(logData, message)
      logger.error(message, contextOrData);
      return;
    }
    
    // Handle both calling patterns
    if (typeof contextOrData === 'string') {
      // Old format: error(message, context, data, error)
      const logData: any = {};
      if (contextOrData) logData.context = contextOrData;
      if (data) logData.data = data;
      if (error) logData.error = { message: error.message, stack: error.stack };
      
      logger.error(logData, message as string);
    } else if (contextOrData) {
      // Pino format: error(message, data)
      logger.error(contextOrData, message as string);
    } else {
      // Simple message only
      logger.error(message as string);
    }
  }

  warn(message: string | any, contextOrData?: string | any, data?: any): void {
    // Handle logger.warn(data, message) - old Pino format where first arg is object
    if (typeof message === 'object' && typeof contextOrData === 'string') {
      // Pino logger.warn(logData, message)
      logger.warn(message, contextOrData);
      return;
    }
    
    // Handle both calling patterns
    if (typeof contextOrData === 'string') {
      // Old format: warn(message, context, data)
      const logData: any = {};
      if (contextOrData) logData.context = contextOrData;
      if (data) logData.data = data;
      
      logger.warn(logData, message as string);
    } else if (contextOrData) {
      // Pino format: warn(message, data)
      logger.warn(contextOrData, message as string);
    } else {
      // Simple message only
      logger.warn(message as string);
    }
  }

  info(message: string | any, contextOrData?: string | any, data?: any): void {
    // Handle logger.info(data, message) - old Pino format where first arg is object
    if (typeof message === 'object' && typeof contextOrData === 'string') {
      // Pino logger.info(logData, message)
      logger.info(message, contextOrData);
      return;
    }
    
    // Handle both calling patterns
    if (typeof contextOrData === 'string') {
      // Old format: info(message, context, data)
      const logData: any = {};
      if (contextOrData) logData.context = contextOrData;
      if (data) logData.data = data;
      
      logger.info(logData, message as string);
    } else if (contextOrData) {
      // Pino format: info(message, data)
      logger.info(contextOrData, message as string);
    } else {
      // Simple message only
      logger.info(message as string);
    }
  }

  debug(message: string | any, contextOrData?: string | any, data?: any): void {
    // Handle logger.debug(data, message) - old Pino format where first arg is object
    if (typeof message === 'object' && typeof contextOrData === 'string') {
      // Pino logger.debug(logData, message)
      logger.debug(message, contextOrData);
      return;
    }
    
    // Handle both calling patterns
    if (typeof contextOrData === 'string') {
      // Old format: debug(message, context, data)
      const logData: any = {};
      if (contextOrData) logData.context = contextOrData;
      if (data) logData.data = data;
      
      logger.debug(logData, message as string);
    } else if (contextOrData) {
      // Pino format: debug(message, data)
      logger.debug(contextOrData, message as string);
    } else {
      // Simple message only
      logger.debug(message as string);
    }
  }

  // Convenience methods
  apiRequest(method: string, path: string, statusCode: number, duration: number, userId?: number): void {
    logger.info({
      context: 'API',
      method,
      path,
      statusCode,
      duration,
      userId,
    }, `${method} ${path} ${statusCode} in ${duration}ms`);
  }

  databaseOperation(operation: string, table: string, duration: number, recordCount?: number): void {
    logger.debug({
      context: 'DATABASE',
      operation,
      table,
      duration,
      recordCount,
    }, `${operation} on ${table} completed in ${duration}ms`);
  }

  aiOperation(operation: string, duration: number, tokens?: number): void {
    logger.info({
      context: 'AI',
      operation,
      duration,
      tokens,
    }, `AI ${operation} completed in ${duration}ms`);
  }

  securityEvent(event: string, userId?: number, ip?: string): void {
    logger.warn({
      context: 'SECURITY',
      event,
      userId,
      ip,
    }, `Security event: ${event}`);
  }
}

/**
 * Simple Logger Interface Adapter
 * Provides compatibility with simple logger interface (storage, etc.)
 */
export class SimpleLoggerAdapter {
  info(message: string, meta?: any): void {
    logger.info(meta || {}, message);
  }

  warn(message: string, meta?: any): void {
    logger.warn(meta || {}, message);
  }

  error(message: string, meta?: any): void {
    logger.error(meta || {}, message);
  }

  debug(message: string, meta?: any): void {
    logger.debug(meta || {}, message);
  }
}

// Export adapter instances for backward compatibility
export const legacyLogger = new LegacyLoggerAdapter();
export const simpleLogger = new SimpleLoggerAdapter();

// Export default logger
export default logger;
