/**
 * Tests for ErrorHandlingService
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { errorHandlingService } from '../ErrorHandlingService';
import { DegradationContext , gracefulDegradationManager } from '../GracefulDegradationManager';

// Mock the dependencies
vi.mock('../RetryPolicyManager', () => ({
  retryPolicyManager: {
    executeWithRetry: vi.fn()
  }
}));

vi.mock('../FallbackManager', () => ({
  fallbackManager: {
    executeWithFallback: vi.fn()
  }
}));

vi.mock('../GracefulDegradationManager', () => ({
  gracefulDegradationManager: {
    executeWithDegradation: vi.fn()
  }
}));

vi.mock('../AuditLogger', () => ({
  auditLogger: {
    logEvent: vi.fn()
  },
  AuditSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }
}));

import { retryPolicyManager } from '../RetryPolicyManager';
import { fallbackManager } from '../FallbackManager';

import { auditLogger } from '../AuditLogger';

describe('ErrorHandlingService', () => {
  let errorHandlingService: ErrorHandlingService;
  let mockOperation: vi.MockedFunction<() => Promise<string>>;
  let mockContext: ErrorContext;
  let mockDegradationContext: DegradationContext;

  beforeEach(() => {
    errorHandlingService = new ErrorHandlingService();
    mockOperation = vi.fn();
    
    mockContext = {
      service: 'government-api',
      operation: 'test-operation',
      sessionId: 'session-123',
      propertyId: 'property-456',
      userId: 'user-789',
      metadata: { test: 'data' }
    };

    mockDegradationContext = {
      availableServices: ['government-api', 'court-records'],
      failedServices: [],
      partialData: {},
      userRequirements: [],
      criticalityLevel: 'medium'
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeWithErrorHandling', () => {
    it('should succeed with primary operation on first try', async () => {
      const mockRetryResult = {
        success: true,
        data: 'success',
        attempts: 1,
        totalDuration: 100,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);

      const result = await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.handlingStrategy).toBe('primary');
      expect(result.warnings).toHaveLength(0);
      expect(auditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'system_operation_started',
          service: 'government-api',
          operation: 'test-operation'
        })
      );
    });

    it('should succeed with retry strategy', async () => {
      const mockRetryResult = {
        success: true,
        data: 'retry-success',
        attempts: 3,
        totalDuration: 500,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);

      const result = await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('retry-success');
      expect(result.handlingStrategy).toBe('retry');
      expect(result.warnings).toContain('Operation succeeded after 3 attempts');
    });

    it('should use fallback when retry fails', async () => {
      const mockRetryResult = {
        success: false,
        error: new Error('Retry failed'),
        attempts: 3,
        totalDuration: 1000,
        correlationId: 'corr-123'
      };

      const mockFallbackResult = {
        success: true,
        data: 'fallback-success',
        provider: 'cached-data',
        fallbackUsed: true,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);
      (fallbackManager.executeWithFallback as vi.Mock).mockResolvedValueOnce(mockFallbackResult);

      const result = await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback-success');
      expect(result.handlingStrategy).toBe('fallback');
      expect(result.warnings).toContain('Primary service failed, using fallback: cached-data');
      expect(result.recommendations).toContain('Monitor primary service for restoration');
    });

    it('should use degradation when retry and fallback fail', async () => {
      const mockRetryResult = {
        success: false,
        error: new Error('Retry failed'),
        attempts: 3,
        totalDuration: 1000,
        correlationId: 'corr-123'
      };

      const mockFallbackResult = {
        success: false,
        error: new Error('Fallback failed'),
        fallbackUsed: true,
        correlationId: 'corr-123'
      };

      const mockDegradationResult = {
        success: true,
        data: 'degraded-success',
        degradationLevel: {
          level: 'partial' as const,
          description: 'Partial service',
          availableFeatures: ['basic-verification'],
          limitations: ['Limited functionality'],
          dataQuality: 60
        },
        warnings: ['Service degraded'],
        recommendations: ['Use alternative methods'],
        correlationId: 'corr-123',
        dataCompleteness: 60
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);
      (fallbackManager.executeWithFallback as vi.Mock).mockResolvedValueOnce(mockFallbackResult);
      (gracefulDegradationManager.executeWithDegradation as vi.Mock).mockResolvedValueOnce(mockDegradationResult);

      const result = await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext,
        mockDegradationContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('degraded-success');
      expect(result.handlingStrategy).toBe('degradation');
      expect(result.warnings).toContain('Service degraded');
      expect(result.recommendations).toContain('Use alternative methods');
    });

    it('should fail when all strategies fail', async () => {
      const mockRetryResult = {
        success: false,
        error: new Error('Retry failed'),
        attempts: 3,
        totalDuration: 1000,
        correlationId: 'corr-123'
      };

      const mockFallbackResult = {
        success: false,
        error: new Error('Fallback failed'),
        fallbackUsed: true,
        correlationId: 'corr-123'
      };

      const mockDegradationResult = {
        success: false,
        degradationLevel: {
          level: 'emergency' as const,
          description: 'Emergency mode',
          availableFeatures: [],
          limitations: ['All services down'],
          dataQuality: 0
        },
        warnings: ['All services failed'],
        recommendations: ['Contact administrator'],
        correlationId: 'corr-123',
        dataCompleteness: 0
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);
      (fallbackManager.executeWithFallback as vi.Mock).mockResolvedValueOnce(mockFallbackResult);
      (gracefulDegradationManager.executeWithDegradation as vi.Mock).mockResolvedValueOnce(mockDegradationResult);

      const result = await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext,
        mockDegradationContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.warnings).toContain('All error handling strategies exhausted');
      expect(result.recommendations).toContain('Check service status');
    });

    it('should handle error handling system failure', async () => {
      (retryPolicyManager.executeWithRetry as vi.Mock).mockRejectedValueOnce(new Error('System failure'));

      const result = await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('System failure');
      expect(result.warnings).toContain('Error handling system failure');
      expect(result.recommendations).toContain('Contact system administrator immediately');
    });

    it('should skip disabled strategies', async () => {
      const disabledService = new ErrorHandlingService({
        enableRetry: false,
        enableFallback: false,
        enableDegradation: false
      });

      mockOperation.mockRejectedValueOnce(new Error('Operation failed'));

      const result = await disabledService.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(retryPolicyManager.executeWithRetry).not.toHaveBeenCalled();
      expect(fallbackManager.executeWithFallback).not.toHaveBeenCalled();
      expect(gracefulDegradationManager.executeWithDegradation).not.toHaveBeenCalled();
    });
  });

  describe('service health management', () => {
    it('should track service health', () => {
      const health = errorHandler.getServiceHealth();
      
      expect(health.length).toBeGreaterThan(0);
      expect(health.find(h => h.service === 'government-api')).toBeDefined();
    });

    it('should update service health on success', async () => {
      const mockRetryResult = {
        success: true,
        data: 'success',
        attempts: 1,
        totalDuration: 100,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);

      await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      const health = errorHandler.getServiceHealthStatus('government-api');
      expect(health?.healthy).toBe(true);
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should update service health on failure', async () => {
      const mockRetryResult = {
        success: false,
        error: new Error('Service failed'),
        attempts: 3,
        totalDuration: 1000,
        correlationId: 'corr-123'
      };

      const mockFallbackResult = {
        success: false,
        error: new Error('Fallback failed'),
        fallbackUsed: true,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);
      (fallbackManager.executeWithFallback as vi.Mock).mockResolvedValueOnce(mockFallbackResult);

      await errorHandler.executeWithErrorHandling(
        mockOperation,
        mockContext
      );

      const health = errorHandler.getServiceHealthStatus('government-api');
      expect(health?.consecutiveFailures).toBeGreaterThan(0);
    });

    it('should manually set service health', () => {
      errorHandler.setServiceHealth('government-api', false);
      
      const health = errorHandler.getServiceHealthStatus('government-api');
      expect(health?.healthy).toBe(false);
    });
  });

  describe('createErrorHandledFunction', () => {
    it('should create error-handled wrapper function', async () => {
      const originalFunction = vi.fn().mockResolvedValue('result');
      
      const errorHandledFunction = errorHandler.createErrorHandledFunction(
        originalFunction,
        { service: 'test-service', operation: 'test-op' }
      );

      const mockRetryResult = {
        success: true,
        data: 'result',
        attempts: 1,
        totalDuration: 100,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);

      const result = await errorHandledFunction('arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should throw error when wrapped function fails', async () => {
      const originalFunction = vi.fn().mockRejectedValue(new Error('Function failed'));
      
      const errorHandledFunction = errorHandler.createErrorHandledFunction(
        originalFunction,
        { service: 'test-service', operation: 'test-op' }
      );

      const mockRetryResult = {
        success: false,
        error: new Error('All strategies failed'),
        attempts: 3,
        totalDuration: 1000,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);
      (fallbackManager.executeWithFallback as vi.Mock).mockResolvedValueOnce({
        success: false,
        error: new Error('Fallback failed'),
        fallbackUsed: true,
        correlationId: 'corr-123'
      });

      await expect(errorHandledFunction()).rejects.toThrow('All strategies failed');
    });

    it('should use degradation context factory', async () => {
      const originalFunction = vi.fn().mockResolvedValue('result');
      const degradationContextFactory = vi.fn().mockReturnValue(mockDegradationContext);
      
      const errorHandledFunction = errorHandler.createErrorHandledFunction(
        originalFunction,
        { service: 'test-service', operation: 'test-op' },
        degradationContextFactory
      );

      const mockRetryResult = {
        success: true,
        data: 'result',
        attempts: 1,
        totalDuration: 100,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValueOnce(mockRetryResult);

      await errorHandledFunction('arg1');

      expect(degradationContextFactory).toHaveBeenCalledWith('arg1');
    });
  });

  describe('configuration management', () => {
    it('should get current configuration', () => {
      const config = errorHandler.getConfig();
      
      expect(config.enableRetry).toBe(true);
      expect(config.enableFallback).toBe(true);
      expect(config.enableDegradation).toBe(true);
      expect(config.enableAuditLogging).toBe(true);
    });

    it('should update configuration', () => {
      errorHandler.updateConfig({
        enableRetry: false,
        maxRetryAttempts: 5
      });

      const config = errorHandler.getConfig();
      expect(config.enableRetry).toBe(false);
      expect(config.maxRetryAttempts).toBe(5);
    });
  });

  describe('metrics', () => {
    it('should get error handling metrics', () => {
      const metrics = errorHandler.getMetrics();
      
      expect(metrics.totalServices).toBeGreaterThan(0);
      expect(metrics.healthyServices).toBeGreaterThanOrEqual(0);
      expect(metrics.unhealthyServices).toBeGreaterThanOrEqual(0);
      expect(metrics.averageSuccessRate).toBeGreaterThanOrEqual(0);
      expect(metrics.serviceHealth).toHaveLength(metrics.totalServices);
    });

    it('should calculate success rates correctly', async () => {
      // Simulate some successful operations
      const mockRetryResult = {
        success: true,
        data: 'success',
        attempts: 1,
        totalDuration: 100,
        correlationId: 'corr-123'
      };

      (retryPolicyManager.executeWithRetry as vi.Mock).mockResolvedValue(mockRetryResult);

      // Execute multiple operations
      for (let i = 0; i < 3; i++) {
        await errorHandler.executeWithErrorHandling(
          mockOperation,
          mockContext
        );
      }

      const metrics = errorHandler.getMetrics();
      const govApiHealth = metrics.serviceHealth.find(h => h.service === 'government-api');
      
      expect(govApiHealth?.successRate).toBe(1); // 100% success rate
    });
  });
});