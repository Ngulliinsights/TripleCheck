/**
 * AI Request Deduplication Middleware
 * 
 * Prevents duplicate AI requests from being processed simultaneously by:
 * - Tracking active requests by content hash
 * - Queuing duplicate requests to wait for the original
 * - Sharing results among duplicate requests
 * - Implementing request coalescing for identical operations
 */

import { Request, Response, NextFunction } from 'express';
import { logger as loggingService } from '../../../core/src/logging';
import { getMetricsCollector } from '../../../core/src/rate-limiting/metrics';
import crypto from 'crypto';

export interface DeduplicationConfig {
  enabled: boolean;
  maxWaitTime: number;
  maxQueueSize: number;
  enableMetrics: boolean;
  keyFields: string[];
  excludeOperations: string[];
}

export interface PendingRequest {
  requestId: string;
  timestamp: Date;
  promise: Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  waitingRequests: Array<{
    requestId: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>;
}

export interface DeduplicationMetrics {
  totalRequests: number;
  duplicateRequests: number;
  coalescedRequests: number;
  deduplicationRate: number;
  averageWaitTime: number;
  queueOverflows: number;
  lastUpdated: Date;
}

export class AIDeduplicationService {
  private readonly serviceName = 'AIDeduplicationService';
  private readonly config: DeduplicationConfig;
  private readonly pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly metrics: DeduplicationMetrics;
  private readonly metricsCollector = getMetricsCollector();

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = {
      enabled: true,
      maxWaitTime: 30000, // 30 seconds
      maxQueueSize: 100,
      enableMetrics: true,
      keyFields: ['service', 'operation', 'inputs', 'parameters'],
      excludeOperations: ['health-check', 'status'],
      ...config
    };

    this.metrics = {
      totalRequests: 0,
      duplicateRequests: 0,
      coalescedRequests: 0,
      deduplicationRate: 0,
      averageWaitTime: 0,
      queueOverflows: 0,
      lastUpdated: new Date()
    };

    // Cleanup expired requests periodically
    setInterval(() => this.cleanupExpiredRequests(), 60000); // Every minute

    loggingService.info('AI Deduplication Service initialized', {
      module: this.serviceName,
      config: this.config
    });
  }

  /**
   * Middleware function for Express
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      const requestId = this.generateRequestId();
      const operation = this.extractOperation(req);

      // Skip deduplication for excluded operations
      if (this.config.excludeOperations.includes(operation)) {
        return next();
      }

      const requestKey = this.generateRequestKey(req);
      const startTime = Date.now();

      this.metrics.totalRequests++;

      try {
        // Check if there's already a pending request with the same key
        const existingRequest = this.pendingRequests.get(requestKey);

        if (existingRequest) {
          // This is a duplicate request
          this.metrics.duplicateRequests++;
          this.recordDeduplicationEvent('duplicate', requestKey, operation);

          loggingService.debug('Duplicate AI request detected', {
            module: this.serviceName,
            requestId,
            originalRequestId: existingRequest.requestId,
            operation,
            requestKey
          });

          // Check queue size limit
          if (existingRequest.waitingRequests.length >= this.config.maxQueueSize) {
            this.metrics.queueOverflows++;
            const error = new Error('Request queue overflow - too many duplicate requests');
            return res.status(429).json({
              error: 'Too many duplicate requests',
              message: 'Please wait for the current request to complete',
              requestId
            });
          }

          // Wait for the original request to complete
          const result = await this.waitForOriginalRequest(
            existingRequest,
            requestId,
            startTime
          );

          return res.json(result);
        }

        // This is a new request - create a pending request entry
        const pendingRequest = this.createPendingRequest(requestId, requestKey);
        this.pendingRequests.set(requestKey, pendingRequest);

        // Override res.json to capture the response
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          // Resolve all waiting requests with the same result
          this.resolveWaitingRequests(requestKey, body);
          return originalJson(body);
        };

        // Override error handling
        const originalStatus = res.status.bind(res);
        res.status = (code: number) => {
          if (code >= 400) {
            // Reject all waiting requests with the same error
            const error = new Error(`Request failed with status ${code}`);
            this.rejectWaitingRequests(requestKey, error);
          }
          return originalStatus(code);
        };

        // Continue with the original request
        next();

      } catch (error) {
        loggingService.error('Deduplication middleware error', {
          module: this.serviceName,
          requestId,
          error: error instanceof Error ? error.message : String(error)
        });

        // Clean up and continue
        this.pendingRequests.delete(requestKey);
        next();
      }
    };
  }

  /**
   * Deduplicate function calls programmatically
   */
  async deduplicate<T>(
    key: string,
    operation: () => Promise<T>,
    context: { service: string; operation: string }
  ): Promise<T> {
    if (!this.config.enabled) {
      return await operation();
    }

    const requestId = this.generateRequestId();
    const requestKey = `${context.service}:${context.operation}:${key}`;

    this.metrics.totalRequests++;

    // Check for existing request
    const existingRequest = this.pendingRequests.get(requestKey);
    if (existingRequest) {
      this.metrics.duplicateRequests++;
      this.recordDeduplicationEvent('duplicate', requestKey, context.operation);

      loggingService.debug('Duplicate function call detected', {
        module: this.serviceName,
        requestId,
        originalRequestId: existingRequest.requestId,
        service: context.service,
        operation: context.operation,
        requestKey
      });

      return await this.waitForOriginalRequest(existingRequest, requestId, Date.now());
    }

    // Create new pending request
    const pendingRequest = this.createPendingRequest(requestId, requestKey);
    this.pendingRequests.set(requestKey, pendingRequest);

    try {
      const result = await operation();
      this.resolveWaitingRequests(requestKey, result);
      return result;
    } catch (error) {
      this.rejectWaitingRequests(requestKey, error);
      throw error;
    }
  }

  /**
   * Get deduplication metrics
   */
  getMetrics(): DeduplicationMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get current pending requests count
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all pending requests (for testing/cleanup)
   */
  clearPendingRequests(): void {
    for (const [key, request] of this.pendingRequests) {
      request.reject(new Error('Service shutdown - request cancelled'));
    }
    this.pendingRequests.clear();
  }

  // Private helper methods

  private generateRequestId(): string {
    return `dedup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractOperation(req: Request): string {
    // Extract operation from URL path
    const pathParts = req.path.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || 'unknown';
  }

  private generateRequestKey(req: Request): string {
    // Create a hash of the request that identifies identical requests
    const keyData: any = {};

    for (const field of this.config.keyFields) {
      switch (field) {
        case 'service':
          keyData.service = this.extractService(req);
          break;
        case 'operation':
          keyData.operation = this.extractOperation(req);
          break;
        case 'inputs':
          keyData.inputs = this.normalizeInputs(req.body);
          break;
        case 'parameters':
          keyData.parameters = this.normalizeInputs(req.query);
          break;
        case 'userId':
          keyData.userId = (req as any).user?.id || 'anonymous';
          break;
      }
    }

    const keyString = JSON.stringify(keyData);
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }

  private extractService(req: Request): string {
    // Extract service from URL path
    const path = req.path;
    
    if (path.includes('/property/')) return 'PropertyAnalysisAI';
    if (path.includes('/document/')) return 'DocumentProcessingAI';
    if (path.includes('/fraud/')) return 'FraudDetectionAI';
    if (path.includes('/recommendations/')) return 'RecommendationAI';
    
    return 'AIService';
  }

  private normalizeInputs(inputs: any): any {
    // Normalize inputs for consistent key generation
    if (typeof inputs !== 'object' || inputs === null) {
      return inputs;
    }

    if (Array.isArray(inputs)) {
      return inputs.map(item => this.normalizeInputs(item)).sort();
    }

    const normalized: any = {};
    const keys = Object.keys(inputs).sort();
    
    for (const key of keys) {
      // Skip timestamp and other non-deterministic fields
      if (['timestamp', 'requestId', '_id'].includes(key)) {
        continue;
      }
      normalized[key] = this.normalizeInputs(inputs[key]);
    }

    return normalized;
  }

  private createPendingRequest(requestId: string, requestKey: string): PendingRequest {
    let resolveFunc: (value: any) => void;
    let rejectFunc: (error: any) => void;

    const promise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    const pendingRequest: PendingRequest = {
      requestId,
      timestamp: new Date(),
      promise,
      resolve: resolveFunc!,
      reject: rejectFunc!,
      waitingRequests: []
    };

    // Set timeout to prevent hanging requests
    setTimeout(() => {
      if (this.pendingRequests.has(requestKey)) {
        const error = new Error('Request timeout - deduplication wait time exceeded');
        this.rejectWaitingRequests(requestKey, error);
      }
    }, this.config.maxWaitTime);

    return pendingRequest;
  }

  private async waitForOriginalRequest(
    existingRequest: PendingRequest,
    requestId: string,
    startTime: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Add this request to the waiting list
      existingRequest.waitingRequests.push({
        requestId,
        resolve,
        reject
      });

      // Set individual timeout for this waiting request
      setTimeout(() => {
        reject(new Error('Individual request timeout'));
      }, this.config.maxWaitTime);
    }).finally(() => {
      // Record wait time
      const waitTime = Date.now() - startTime;
      this.updateAverageWaitTime(waitTime);
      this.recordDeduplicationEvent('wait_complete', '', '', waitTime);
    });
  }

  private resolveWaitingRequests(requestKey: string, result: any): void {
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (!pendingRequest) return;

    // Resolve the original request
    pendingRequest.resolve(result);

    // Resolve all waiting requests
    for (const waitingRequest of pendingRequest.waitingRequests) {
      waitingRequest.resolve(result);
    }

    this.metrics.coalescedRequests += pendingRequest.waitingRequests.length;
    
    loggingService.debug('Resolved waiting requests', {
      module: this.serviceName,
      requestKey,
      originalRequestId: pendingRequest.requestId,
      waitingRequestsCount: pendingRequest.waitingRequests.length
    });

    // Clean up
    this.pendingRequests.delete(requestKey);
    this.recordDeduplicationEvent('resolve', requestKey, '', 0, pendingRequest.waitingRequests.length);
  }

  private rejectWaitingRequests(requestKey: string, error: any): void {
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (!pendingRequest) return;

    // Reject the original request
    pendingRequest.reject(error);

    // Reject all waiting requests
    for (const waitingRequest of pendingRequest.waitingRequests) {
      waitingRequest.reject(error);
    }

    loggingService.debug('Rejected waiting requests', {
      module: this.serviceName,
      requestKey,
      originalRequestId: pendingRequest.requestId,
      waitingRequestsCount: pendingRequest.waitingRequests.length,
      error: error instanceof Error ? error.message : String(error)
    });

    // Clean up
    this.pendingRequests.delete(requestKey);
    this.recordDeduplicationEvent('reject', requestKey, '', 0, pendingRequest.waitingRequests.length);
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, request] of this.pendingRequests) {
      const age = now - request.timestamp.getTime();
      if (age > this.config.maxWaitTime) {
        expiredKeys.push(key);
        const error = new Error('Request expired - exceeded maximum wait time');
        this.rejectWaitingRequests(key, error);
      }
    }

    if (expiredKeys.length > 0) {
      loggingService.debug('Cleaned up expired requests', {
        module: this.serviceName,
        expiredCount: expiredKeys.length
      });
    }
  }

  private updateMetrics(): void {
    if (!this.config.enableMetrics) return;

    this.metrics.deduplicationRate = this.metrics.totalRequests > 0 ?
      (this.metrics.duplicateRequests / this.metrics.totalRequests) * 100 : 0;

    this.metrics.lastUpdated = new Date();
  }

  private updateAverageWaitTime(waitTime: number): void {
    const totalWaits = this.metrics.duplicateRequests;
    if (totalWaits === 0) {
      this.metrics.averageWaitTime = waitTime;
    } else {
      this.metrics.averageWaitTime = 
        (this.metrics.averageWaitTime * (totalWaits - 1) + waitTime) / totalWaits;
    }
  }

  private recordDeduplicationEvent(
    eventType: 'duplicate' | 'wait_complete' | 'resolve' | 'reject',
    requestKey: string,
    operation: string,
    waitTime: number = 0,
    coalescedCount: number = 0
  ): void {
    if (!this.config.enableMetrics) return;

    this.metricsCollector.recordEvent({
      type: `ai_deduplication_${eventType}`,
      timestamp: Date.now(),
      metadata: {
        requestKey: requestKey.substring(0, 8), // Truncated for privacy
        operation,
        waitTime,
        coalescedCount,
        deduplicationRate: this.metrics.deduplicationRate,
        pendingRequestsCount: this.pendingRequests.size
      }
    });
  }
}

// Export singleton instance
export const aiDeduplicationService = new AIDeduplicationService();

// Export middleware function for Express
export const aiDeduplicationMiddleware = aiDeduplicationService.middleware();

// Export decorator for automatic deduplication
export function deduplicated(keyGenerator?: (args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const service = target.constructor.name;
      const operation = propertyName;
      
      // Generate deduplication key
      const key = keyGenerator ? 
        keyGenerator(args) : 
        crypto.createHash('sha256').update(JSON.stringify(args)).digest('hex').substring(0, 16);

      return await aiDeduplicationService.deduplicate(
        key,
        () => method.apply(this, args),
        { service, operation }
      );
    };

    return descriptor;
  };
}

// Export types
export type { DeduplicationConfig, DeduplicationMetrics, PendingRequest };