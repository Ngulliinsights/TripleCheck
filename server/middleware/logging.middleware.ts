import { Request, Response, NextFunction } from 'express';

import { generateCorrelationId } from '../../src/shared/utils/errors';
import { structuredLogger } from '../monitoring/StructuredLogger';

export interface LoggingOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  logHeaders?: boolean;
  logBody?: boolean;
  logQuery?: boolean;
  logParams?: boolean;
  sensitiveFields?: string[];
  skipPaths?: string[];
  skipMethods?: string[];
  maxBodySize?: number;
}

export interface RequestWithLogging extends Request {
  startTime?: number;
  correlationId?: string;
  requestId?: string;
}

/**
 * Enhanced logging middleware with correlation IDs and performance tracking
 */
export function loggingMiddleware(options: LoggingOptions = {}) {
  const {
    logRequests = true,
    logResponses = true,
    logHeaders = false,
    logBody = false,
    logQuery = true,
    logParams = true,
    sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'],
    skipPaths = ['/health', '/metrics', '/favicon.ico', '/assets/Artmark.svg'],
    skipMethods = ['OPTIONS'],
    maxBodySize = 10000 // 10KB
  } = options;

  return (req: RequestWithLogging, res: Response, next: NextFunction) => {
    // Skip logging for certain paths and methods
    if (skipPaths.some(path => req.path.startsWith(path)) || 
        skipMethods.includes(req.method)) {
      return next();
    }

    // Generate correlation and request IDs
    const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
    const requestId = generateCorrelationId();
    
    req.correlationId = correlationId;
    req.requestId = requestId;
    req.startTime = Date.now();

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', requestId);

    // Log incoming request
    if (logRequests) {
      const requestData: any = {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
      };

      if (logHeaders) {
        requestData.headers = sanitizeObject(req.headers, sensitiveFields);
      }

      if (logQuery && Object.keys(req.query).length > 0) {
        requestData.query = sanitizeObject(req.query, sensitiveFields);
      }

      if (logParams && Object.keys(req.params).length > 0) {
        requestData.params = req.params;
      }

      if (logBody && req.body) {
        const bodyString = JSON.stringify(req.body);
        if (bodyString.length <= maxBodySize) {
          requestData.body = sanitizeObject(req.body, sensitiveFields);
        } else {
          requestData.body = '[BODY TOO LARGE]';
          requestData.bodySize = bodyString.length;
        }
      }

      structuredLogger.info('HTTP Request', {
        correlationId,
        requestId,
        component: 'http',
        operation: 'request',
        metadata: requestData
      });
    }

    // Capture original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    let responseBody: any;
    let responseSent = false;

    // Override json method to capture response body
    res.json = function(body: any) {
      if (!responseSent) {
        responseBody = body;
        logResponse();
        responseSent = true;
      }
      return originalJson.call(this, body);
    };

    // Override send method to capture response body
    res.send = function(body: any) {
      if (!responseSent) {
        responseBody = body;
        logResponse();
        responseSent = true;
      }
      return originalSend.call(this, body);
    };

    // Override end method to ensure logging
    res.end = function(chunk?: any, encoding?: any) {
      if (!responseSent) {
        if (chunk) {
          responseBody = chunk;
        }
        logResponse();
        responseSent = true;
      }
      return originalEnd.call(this, chunk, encoding);
    };

    function logResponse() {
      if (!logResponses || !req.startTime) return;

      const duration = Date.now() - req.startTime;
      const responseData: any = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        contentType: res.get('Content-Type'),
        contentLength: res.get('Content-Length'),
        duration
      };

      if (logHeaders) {
        responseData.headers = sanitizeObject(res.getHeaders(), sensitiveFields);
      }

      if (logBody && responseBody) {
        const bodyString = typeof responseBody === 'string' 
          ? responseBody 
          : JSON.stringify(responseBody);
        
        if (bodyString.length <= maxBodySize) {
          responseData.body = typeof responseBody === 'object' 
            ? sanitizeObject(responseBody, sensitiveFields)
            : responseBody;
        } else {
          responseData.body = '[BODY TOO LARGE]';
          responseData.bodySize = bodyString.length;
        }
      }

      // Determine log level based on status code
      let logLevel: 'info' | 'warn' | 'error' = 'info';
      if (res.statusCode >= 500) {
        logLevel = 'error';
      } else if (res.statusCode >= 400) {
        logLevel = 'warn';
      }

      structuredLogger[logLevel]('HTTP Response', {
        correlationId,
        requestId,
        component: 'http',
        operation: 'response',
        metadata: responseData,
        performance: {
          duration,
          memory: process.memoryUsage()
        }
      });

      // Record metrics
      structuredLogger.recordMetric('http.request.duration', duration, 'milliseconds', {
        method: req.method,
        status_code: res.statusCode.toString(),
        endpoint: req.route?.path || req.path
      });

      structuredLogger.recordMetric('http.requests.total', 1, 'count', {
        method: req.method,
        status_code: res.statusCode.toString(),
        endpoint: req.route?.path || req.path
      });

      // Log slow requests
      if (duration > 1000) {
        structuredLogger.warn('Slow HTTP Request', {
          correlationId,
          requestId,
          component: 'http',
          operation: 'slow_request',
          metadata: {
            method: req.method,
            url: req.url,
            duration,
            threshold: 1000
          }
        });

        structuredLogger.recordMetric('http.slow_requests.total', 1, 'count', {
          method: req.method,
          endpoint: req.route?.path || req.path
        });
      }
    }

    next();
  };
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware() {
  return (error: Error, req: RequestWithLogging, res: Response, next: NextFunction) => {
    const correlationId = req.correlationId || 'unknown';
    const requestId = req.requestId || 'unknown';
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    structuredLogger.error('HTTP Error', {
      correlationId,
      requestId,
      component: 'http',
      operation: 'error',
      metadata: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }
    });

    // Record error metrics
    structuredLogger.recordMetric('http.errors.total', 1, 'count', {
      method: req.method,
      error_type: error.name,
      endpoint: req.route?.path || req.path
    });

    next(error);
  };
}

/**
 * Security event logging middleware
 */
export function securityLoggingMiddleware() {
  return (req: RequestWithLogging, res: Response, next: NextFunction) => {
    const correlationId = req.correlationId || 'unknown';

    // Log suspicious activities
    const suspiciousPatterns = [
      /\.\.\//,  // Path traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /eval\(/i, // Code injection
    ];

    const requestString = `${req.url} ${JSON.stringify(req.body || {})} ${JSON.stringify(req.query)}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestString)) {
        structuredLogger.warn('Security Event: Suspicious Request Pattern', {
          correlationId,
          component: 'security',
          operation: 'suspicious_pattern',
          metadata: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            pattern: pattern.toString()
          }
        });

        structuredLogger.recordMetric('security.suspicious_requests.total', 1, 'count', {
          pattern: pattern.toString(),
          method: req.method
        });
        break;
      }
    }

    // Log failed authentication attempts
    res.on('finish', () => {
      if (res.statusCode === 401) {
        structuredLogger.warn('Security Event: Authentication Failed', {
          correlationId,
          component: 'security',
          operation: 'auth_failed',
          metadata: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });

        structuredLogger.recordMetric('security.auth_failures.total', 1, 'count', {
          endpoint: req.route?.path || req.path
        });
      }

      // Log rate limit violations
      if (res.statusCode === 429) {
        structuredLogger.warn('Security Event: Rate Limit Exceeded', {
          correlationId,
          component: 'security',
          operation: 'rate_limit',
          metadata: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });

        structuredLogger.recordMetric('security.rate_limit_violations.total', 1, 'count', {
          endpoint: req.route?.path || req.path
        });
      }
    });

    next();
  };
}

/**
 * Database operation logging middleware
 */
export function databaseLoggingWrapper<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const operationId = generateCorrelationId();

    structuredLogger.debug('Database Operation Started', {
      component: 'database',
      operation: 'start',
      metadata: {
        operation,
        operationId
      }
    });

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      structuredLogger.info('Database Operation Completed', {
        component: 'database',
        operation: 'complete',
        metadata: {
          operation,
          operationId,
          duration,
          success: true
        },
        performance: {
          duration,
          memory: process.memoryUsage()
        }
      });

      structuredLogger.recordMetric('database.operation.duration', duration, 'milliseconds', {
        operation
      });

      structuredLogger.recordMetric('database.operations.total', 1, 'count', {
        operation,
        status: 'success'
      });

      // Log slow database operations
      if (duration > 500) {
        structuredLogger.warn('Slow Database Operation', {
          component: 'database',
          operation: 'slow_query',
          metadata: {
            operation,
            operationId,
            duration,
            threshold: 500
          }
        });

        structuredLogger.recordMetric('database.slow_operations.total', 1, 'count', {
          operation
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      structuredLogger.error('Database Operation Failed', {
        component: 'database',
        operation: 'error',
        metadata: {
          operation,
          operationId,
          duration,
          error: {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error)
          }
        }
      });

      structuredLogger.recordMetric('database.operations.total', 1, 'count', {
        operation,
        status: 'error'
      });

      throw error;
    }
  }) as T;
}

/**
 * Sanitize object by removing or masking sensitive fields
 */
function sanitizeObject(obj: any, sensitiveFields: string[]): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveFields));
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export {
  loggingMiddleware as default,
  errorLoggingMiddleware,
  securityLoggingMiddleware,
  databaseLoggingWrapper
};