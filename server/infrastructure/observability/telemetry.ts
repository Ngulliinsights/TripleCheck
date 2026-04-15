/**
 * OpenTelemetry and Pino Observability Stack
 * Replaces custom logging, metrics, and performance monitoring
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import pino from 'pino';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

// Initialize OpenTelemetry SDK
let sdk: NodeSDK | null = null;

export function initializeTelemetry() {
  if (sdk) {
    return; // Already initialized
  }

  const prometheusExporter = new PrometheusExporter({
    port: parseInt(process.env.PROMETHEUS_PORT || '9464'),
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'triplecheck-api',
      [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    }),
    metricReader: prometheusExporter,
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
      logger.error('Error shutting down OpenTelemetry SDK', { error });
    }
  });

  logger.info('OpenTelemetry initialized', {
    serviceName: 'triplecheck-api',
    prometheusPort: prometheusExporter.port,
  });
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

export default logger;
