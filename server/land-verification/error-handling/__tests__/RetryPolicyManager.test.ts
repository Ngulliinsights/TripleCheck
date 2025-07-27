/**
 * Tests for RetryPolicyManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RetryPolicyManager } from '../RetryPolicyManager';

describe('RetryPolicyManager', () => {
  let retryManager: RetryPolicyManager;
  let mockOperation: vi.MockedFunction<() => Promise<string>>;

  beforeEach(() => {
    retryManager = new RetryPolicyManager();
    mockOperation = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      mockOperation.mockResolvedValueOnce('success');

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryableError = new Error('ECONNRESET');
      (retryableError as any).code = 'ECONNRESET';

      mockOperation
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new Error('HTTP 400: Bad Request');
      (nonRetryableError as any).statusCode = 400;

      mockOperation.mockRejectedValueOnce(nonRetryableError);

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const retryableError = new Error('ETIMEDOUT');
      (retryableError as any).code = 'ETIMEDOUT';

      mockOperation.mockRejectedValue(retryableError);

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(5); // Default max attempts for government-api
      expect(mockOperation).toHaveBeenCalledTimes(5);
    }, 15000);

    it('should use custom retry configuration', async () => {
      const retryableError = new Error('Service unavailable');
      mockOperation.mockRejectedValue(retryableError);

      const customConfig = {
        maxAttempts: 2,
        baseDelay: 100,
        backoffStrategy: 'linear' as const
      };

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation',
        customConfig
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff', async () => {
      const retryableError = new Error('ECONNRESET');
      (retryableError as any).code = 'ECONNRESET';

      mockOperation.mockRejectedValue(retryableError);

      const startTime = Date.now();
      
      await retryManager.executeWithRetry(
        mockOperation,
        'expert-services', // Has linear backoff by default
        'test-operation',
        { maxAttempts: 3, baseDelay: 100, backoffStrategy: 'exponential' }
      );

      const duration = Date.now() - startTime;
      
      // Should have delays of ~100ms and ~200ms (exponential)
      // Total should be at least 300ms but allow for some variance
      expect(duration).toBeGreaterThan(250);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.message = 'timeout';

      mockOperation
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('success');

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe('createRetryableFunction', () => {
    it('should create a retryable wrapper function', async () => {
      const originalFunction = vi.fn().mockResolvedValue('result');
      
      const retryableFunction = retryManager.createRetryableFunction(
        originalFunction,
        'government-api',
        'wrapped-operation'
      );

      const result = await retryableFunction('arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should retry wrapped function on failure', async () => {
      const retryableError = new Error('ECONNRESET');
      (retryableError as any).code = 'ECONNRESET';

      const originalFunction = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');
      
      const retryableFunction = retryManager.createRetryableFunction(
        originalFunction,
        'government-api',
        'wrapped-operation'
      );

      const result = await retryableFunction();

      expect(result).toBe('success');
      expect(originalFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration management', () => {
    it('should register custom configuration', () => {
      const customConfig = {
        maxAttempts: 10,
        baseDelay: 500,
        maxDelay: 60000,
        backoffStrategy: 'exponential' as const,
        jitter: false,
        retryableErrors: ['CUSTOM_ERROR'],
        retryableStatusCodes: [503]
      };

      retryManager.registerConfig('custom-service', customConfig);

      const configs = retryManager.getConfigurations();
      expect(configs.get('custom-service')).toEqual(customConfig);
    });

    it('should update existing configuration', () => {
      const updates = {
        maxAttempts: 10,
        baseDelay: 2000
      };

      retryManager.updateConfig('government-api', updates);

      const configs = retryManager.getConfigurations();
      const config = configs.get('government-api');
      
      expect(config?.maxAttempts).toBe(10);
      expect(config?.baseDelay).toBe(2000);
    });

    it('should remove configuration', () => {
      retryManager.removeConfig('government-api');

      const configs = retryManager.getConfigurations();
      expect(configs.has('government-api')).toBe(false);
    });
  });

  describe('error classification', () => {
    it('should identify retryable HTTP status codes', async () => {
      const httpError = new Error('HTTP 503: Service Unavailable');
      (httpError as any).statusCode = 503;

      mockOperation
        .mockRejectedValueOnce(httpError)
        .mockResolvedValueOnce('success');

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should not retry client errors', async () => {
      const clientError = new Error('HTTP 400: Bad Request');
      (clientError as any).statusCode = 400;

      mockOperation.mockRejectedValueOnce(clientError);

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
    });

    it('should identify retryable error patterns in messages', async () => {
      const connectionError = new Error('connection reset by peer');

      mockOperation
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce('success');

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe('backoff strategies', () => {
    it('should apply linear backoff', async () => {
      const error = new Error('ECONNRESET');
      (error as any).code = 'ECONNRESET';

      mockOperation.mockRejectedValue(error);

      const startTime = Date.now();
      
      await retryManager.executeWithRetry(
        mockOperation,
        'expert-services', // Uses linear backoff
        'test-operation',
        { maxAttempts: 3, baseDelay: 100 }
      );

      const duration = Date.now() - startTime;
      
      // Linear: 100ms + 200ms = 300ms minimum
      expect(duration).toBeGreaterThan(250);
    });

    it('should apply fixed backoff', async () => {
      const error = new Error('ECONNRESET');
      (error as any).code = 'ECONNRESET';

      mockOperation.mockRejectedValue(error);

      const startTime = Date.now();
      
      await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation',
        { 
          maxAttempts: 3, 
          baseDelay: 100, 
          backoffStrategy: 'fixed',
          jitter: false 
        }
      );

      const duration = Date.now() - startTime;
      
      // Fixed: 100ms + 100ms = 200ms minimum
      expect(duration).toBeGreaterThan(150);
      expect(duration).toBeLessThan(350); // Should not be exponential
    });

    it('should respect maximum delay', async () => {
      const error = new Error('ECONNRESET');
      (error as any).code = 'ECONNRESET';

      mockOperation.mockRejectedValue(error);

      const result = await retryManager.executeWithRetry(
        mockOperation,
        'government-api',
        'test-operation',
        { 
          maxAttempts: 10, 
          baseDelay: 1000,
          maxDelay: 2000,
          backoffStrategy: 'exponential',
          jitter: false
        }
      );

      expect(result.success).toBe(false);
      // Test should complete in reasonable time despite high attempt count
    }, 30000);
  });
});