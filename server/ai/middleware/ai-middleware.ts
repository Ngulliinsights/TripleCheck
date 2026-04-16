/**
 * AI Middleware for Request/Response Logging and Monitoring
 * 
 * Provides comprehensive middleware for AI service operations including:
 * - Request/response logging with detailed context
 * - Performance monitoring and metrics collection
 * - Error tracking and analysis
 * - Request validation and sanitization
 * - Response transformation and enrichment
 */

import { Request, Response, NextFunction } from 'express';
import { logger as loggingService } from '../../infrastructure/monitoring/logger';
import { getMetricsCollector } from '../../../core/src/rate-limiting/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface AIRequestContext {
  requestId: string;
  userId?: string;
  service: string;
  operation: string;
  startTime: number;
  metadata: Record<string, any>;
}

export interface AIResponseMetrics {
  requestId: string;
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  statusCode: number;
  responseSize?: number;
  errorType?: string;
  errorMessage?: string;
}

export interface AIMiddlewareConfig {
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
  enableMetrics: boolean;
  enableErrorTracking: boolean;
  logRequestBody: boolean;
  logResponseBody: boolean;
  maxLogBodySize: number;
  sensitiveFields: string[];
  enablePerformanceTracking: boolean;
}

class AIMiddleware {
  private config: AIMiddlewareConfig;
  private metricsCollector = getMetricsCollector();

  constructor(config: Partial<AIMiddlewareConfig> = {}) {
    this.config = {
      enableRequestLogging: true,
      enableResponseLogging: true,
      enableMetrics: true,
      enableErrorTracking: true,
      logRequestBody: true,
      logResponseBody: false, // AI responses can be large
      maxLogBodySize: 1024 * 10, // 10KB
      sensitiveFields: ['apiKey', 'authorization', 'password', 'token'],
      enablePerformanceTracking: true,
      ...config
    };
  }

  /**
   * Main AI middleware function
   */
  middleware() {
    return (req: Request & { aiContext?: AIRequestContext }, res: Response, next: NextFunction) => {
      const requestId = uuidv4();
      const startTime = Date.now();

      // Extract AI service context from URL
      const { service, operation } = this.extractServiceContext(req);

      // Create AI request context
      const aiContext: AIRequestContext = {
        requestId,
        userId: (req as any).user?.id,
        service,
        operation,
        startTime,
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          method: req.method,
          url: req.originalUrl,
          contentType: req.get('Content-Type')
        }
      };

      // Attach context to request
      req.aiContext = aiContext;

      // Log incoming request
      if (this.config.enableRequestLogging) {
        this.logRequest(req, aiContext);
      }

      // Track request metrics
      if (this.config.enableMetrics) {
        this.trackRequestStart(aiContext);
      }

      // Override res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const duration = Date.now() - startTime;
        
        // Log response
        if (this.config.enableResponseLogging) {
          this.logResponse(req, res, body, duration);
        }

        // Track response metrics
        if (this.config.enableMetrics) {
          this.trackResponse(aiContext, res.statusCode, duration, body);
        }

        return originalJson(body);
      };

      // Handle errors
      const originalSend = res.send.bind(res);
      res.send = (body: any) => {
        const duration = Date.now() - startTime;
        
        if (res.statusCode >= 400 && this.config.enableErrorTracking) {
          this.trackError(aiContext, res.statusCode, duration, body);
        }

        return originalSend(body);
      };

      next();
    };
  }

  /**
   * Extract service and operation from request URL
   */
  private extractServiceContext(req: Request): { service: string; operation: string } {
    const path = req.path;
    
    // Parse AI service endpoints
    if (path.includes('/property/')) {
      return {
        service: 'PropertyAnalysisAI',
        operation: path.split('/').pop() || 'unknown'
      };
    }
    
    if (path.includes('/document/')) {
      return {
        service: 'DocumentProcessingAI',
        operation: path.split('/').pop() || 'unknown'
      };
    }
    
    if (path.includes('/fraud/')) {
      return {
        service: 'FraudDetectionAI',
        operation: path.split('/').pop() || 'unknown'
      };
    }
    
    if (path.includes('/recommendations/')) {
      return {
        service: 'RecommendationAI',
        operation: path.split('/').pop() || 'unknown'
      };
    }

    return {
      service: 'AIService',
      operation: req.method.toLowerCase()
    };
  }

  /**
   * Log incoming AI request
   */
  private logRequest(req: Request, context: AIRequestContext): void {
    const logData: any = {
      module: 'AIMiddleware',
      type: 'request',
      requestId: context.requestId,
      userId: context.userId,
      service: context.service,
      operation: context.operation,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    // Add request body if enabled and not too large
    if (this.config.logRequestBody && req.body) {
      const bodyString = JSON.stringify(req.body);
      if (bodyString.length <= this.config.maxLogBodySize) {
        logData.requestBody = this.sanitizeData(req.body);
      } else {
        logData.requestBodySize = bodyString.length;
        logData.requestBodyTruncated = true;
      }
    }

    loggingService.info('AI request received', logData);
  }

  /**
   * Log AI response
   */
  private logResponse(req: Request, res: Response, body: any, duration: number): void {
    const context = (req as any).aiContext as AIRequestContext;
    
    const logData: any = {
      module: 'AIMiddleware',
      type: 'response',
      requestId: context.requestId,
      userId: context.userId,
      service: context.service,
      operation: context.operation,
      statusCode: res.statusCode,
      duration,
      success: res.statusCode < 400,
      timestamp: new Date().toISOString()
    };

    // Add response body if enabled and not too large
    if (this.config.logResponseBody && body) {
      const bodyString = JSON.stringify(body);
      if (bodyString.length <= this.config.maxLogBodySize) {
        logData.responseBody = this.sanitizeData(body);
      } else {
        logData.responseBodySize = bodyString.length;
        logData.responseBodyTruncated = true;
      }
    }

    // Add performance metrics
    if (this.config.enablePerformanceTracking) {
      logData.performance = {
        duration,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };
    }

    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    loggingService[logLevel]('AI response sent', logData);
  }

  /**
   * Track request start metrics
   */
  private trackRequestStart(context: AIRequestContext): void {
    this.metricsCollector.recordEvent({
      type: 'ai_request_start',
      timestamp: Date.now(),
      metadata: {
        service: context.service,
        operation: context.operation,
        requestId: context.requestId,
        userId: context.userId
      }
    });
  }

  /**
   * Track response metrics
   */
  private trackResponse(
    context: AIRequestContext,
    statusCode: number,
    duration: number,
    responseBody: any
  ): void {
    const metrics: AIResponseMetrics = {
      requestId: context.requestId,
      service: context.service,
      operation: context.operation,
      duration,
      success: statusCode < 400,
      statusCode,
      responseSize: responseBody ? JSON.stringify(responseBody).length : 0
    };

    this.metricsCollector.recordEvent({
      type: 'ai_response',
      timestamp: Date.now(),
      metadata: metrics
    });

    // Log performance metrics
    loggingService.debug('AI operation metrics', {
      module: 'AIMiddleware',
      ...metrics
    });
  }

  /**
   * Track error metrics
   */
  private trackError(
    context: AIRequestContext,
    statusCode: number,
    duration: number,
    errorBody: any
  ): void {
    const errorMessage = typeof errorBody === 'string' ? errorBody : 
                        errorBody?.error || errorBody?.message || 'Unknown error';

    const metrics: AIResponseMetrics = {
      requestId: context.requestId,
      service: context.service,
      operation: context.operation,
      duration,
      success: false,
      statusCode,
      errorType: this.categorizeError(statusCode),
      errorMessage
    };

    this.metricsCollector.recordEvent({
      type: 'ai_error',
      timestamp: Date.now(),
      metadata: metrics
    });

    loggingService.error('AI operation failed', {
      module: 'AIMiddleware',
      ...metrics,
      errorDetails: errorBody
    });
  }

  /**
   * Categorize error by status code
   */
  private categorizeError(statusCode: number): string {
    if (statusCode >= 400 && statusCode < 500) {
      return 'client_error';
    } else if (statusCode >= 500) {
      return 'server_error';
    }
    return 'unknown_error';
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const field of this.config.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Get middleware configuration
   */
  getConfig(): AIMiddlewareConfig {
    return { ...this.config };
  }

  /**
   * Update middleware configuration
   */
  updateConfig(newConfig: Partial<AIMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const aiMiddleware = new AIMiddleware();

// Export middleware function for Express
export const aiRequestMiddleware = aiMiddleware.middleware();

// Export specialized middleware for different AI services
export const propertyAnalysisMiddleware = () => {
  const middleware = new AIMiddleware({
    enableRequestLogging: true,
    enableResponseLogging: true,
    logResponseBody: false, // Property analysis responses can be large
    enablePerformanceTracking: true
  });
  return middleware.middleware();
};

export const documentProcessingMiddleware = () => {
  const middleware = new AIMiddleware({
    enableRequestLogging: true,
    enableResponseLogging: true,
    logRequestBody: false, // Document uploads can be large
    logResponseBody: false,
    enablePerformanceTracking: true
  });
  return middleware.middleware();
};

export const fraudDetectionMiddleware = () => {
  const middleware = new AIMiddleware({
    enableRequestLogging: true,
    enableResponseLogging: true,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    sensitiveFields: ['apiKey', 'authorization', 'password', 'token', 'ssn', 'creditCard']
  });
  return middleware.middleware();
};

export const recommendationMiddleware = () => {
  const middleware = new AIMiddleware({
    enableRequestLogging: true,
    enableResponseLogging: false, // Recommendation responses can be large
    enablePerformanceTracking: true
  });
  return middleware.middleware();
};

// Export types for external use
export type { AIRequestContext, AIResponseMetrics, AIMiddlewareConfig };