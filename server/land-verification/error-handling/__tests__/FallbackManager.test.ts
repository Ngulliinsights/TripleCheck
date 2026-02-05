/**
 * Tests for FallbackManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FallbackManager, FallbackProvider } from '../FallbackManager';

describe('FallbackManager', () => {
  let fallbackManager: FallbackManager;
  let mockPrimaryOperation: vi.MockedFunction<() => Promise<string>>;
  let mockFallbackProvider: FallbackProvider<string>;
  let mockSecondaryProvider: FallbackProvider<string>;

  beforeEach(() => {
    fallbackManager = new FallbackManager();
    mockPrimaryOperation = vi.fn();

    mockFallbackProvider = {
      name: 'cached-data-provider',
      execute: vi.fn(),
      healthCheck: vi.fn(),
      config: {
        enabled: true,
        priority: 1,
        timeout: 5000,
        healthCheckInterval: 30000,
        maxFailures: 3,
        recoveryTime: 60000
      }
    };

    mockSecondaryProvider = {
      name: 'manual-fallback-provider',
      execute: vi.fn(),
      healthCheck: vi.fn(),
      config: {
        enabled: true,
        priority: 2,
        timeout: 10000,
        healthCheckInterval: 60000,
        maxFailures: 2,
        recoveryTime: 120000
      }
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    fallbackManager.clear();
    vi.restoreAllMocks();
  });

  describe('registerFallback', () => {
    it('should register fallback provider', () => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);

      const providers = fallbackManager.getProviders('government-api');
      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe('cached-data-provider');
    });

    it('should sort providers by priority', () => {
      fallbackManager.registerFallback('government-api', mockSecondaryProvider);
      fallbackManager.registerFallback('government-api', mockFallbackProvider);

      const providers = fallbackManager.getProviders('government-api');
      expect(providers).toHaveLength(2);
      expect(providers[0].name).toBe('cached-data-provider'); // Priority 1
      expect(providers[1].name).toBe('manual-fallback-provider'); // Priority 2
    });

    it('should initialize health status for provider', () => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);

      const health = fallbackManager.getHealthStatus();
      expect(health).toHaveLength(1);
      expect(health[0].name).toBe('cached-data-provider');
      expect(health[0].healthy).toBe(true);
    });
  });

  describe('executeWithFallback', () => {
    beforeEach(() => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);
      fallbackManager.registerFallback('government-api', mockSecondaryProvider);
    });

    it('should succeed with primary operation', async () => {
      mockPrimaryOperation.mockResolvedValueOnce('primary-success');

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('primary-success');
      expect(result.provider).toBe('primary');
      expect(result.fallbackUsed).toBe(false);
      expect(mockFallbackProvider.execute).not.toHaveBeenCalled();
    });

    it('should use first fallback when primary fails', async () => {
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      (mockFallbackProvider.execute as vi.Mock).mockResolvedValueOnce('fallback-success');

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback-success');
      expect(result.provider).toBe('cached-data-provider');
      expect(result.fallbackUsed).toBe(true);
      expect(mockFallbackProvider.execute).toHaveBeenCalledTimes(1);
      expect(mockSecondaryProvider.execute).not.toHaveBeenCalled();
    });

    it('should try secondary fallback when first fails', async () => {
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      (mockFallbackProvider.execute as vi.Mock).mockRejectedValueOnce(new Error('First fallback failed'));
      (mockSecondaryProvider.execute as vi.Mock).mockResolvedValueOnce('secondary-success');

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('secondary-success');
      expect(result.provider).toBe('manual-fallback-provider');
      expect(result.fallbackUsed).toBe(true);
      expect(mockFallbackProvider.execute).toHaveBeenCalledTimes(1);
      expect(mockSecondaryProvider.execute).toHaveBeenCalledTimes(1);
    });

    it('should fail when all fallbacks fail', async () => {
      const primaryError = new Error('Primary failed');
      mockPrimaryOperation.mockRejectedValueOnce(primaryError);
      (mockFallbackProvider.execute as vi.Mock).mockRejectedValueOnce(new Error('First fallback failed'));
      (mockSecondaryProvider.execute as vi.Mock).mockRejectedValueOnce(new Error('Second fallback failed'));

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(primaryError);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should skip disabled providers', async () => {
      mockFallbackProvider.config.enabled = false;
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      (mockSecondaryProvider.execute as vi.Mock).mockResolvedValueOnce('secondary-success');

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('manual-fallback-provider');
      expect(mockFallbackProvider.execute).not.toHaveBeenCalled();
      expect(mockSecondaryProvider.execute).toHaveBeenCalledTimes(1);
    });

    it('should skip unhealthy providers', async () => {
      fallbackManager.setProviderHealth('cached-data-provider', false);
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      (mockSecondaryProvider.execute as vi.Mock).mockResolvedValueOnce('secondary-success');

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('manual-fallback-provider');
      expect(mockFallbackProvider.execute).not.toHaveBeenCalled();
    });

    it('should handle timeout in fallback execution', async () => {
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      
      // Mock a slow fallback that exceeds timeout
      (mockFallbackProvider.execute as vi.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow-result'), 10000))
      );
      
      mockFallbackProvider.config.timeout = 100; // Very short timeout

      const result = await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(mockFallbackProvider.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('health management', () => {
    beforeEach(() => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);
    });

    it('should update health on successful execution', async () => {
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      (mockFallbackProvider.execute as vi.Mock).mockResolvedValueOnce('success');

      await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      const health = fallbackManager.getHealthStatus();
      const providerHealth = health.find(h => h.name === 'cached-data-provider');
      
      expect(providerHealth?.healthy).toBe(true);
      expect(providerHealth?.consecutiveFailures).toBe(0);
    });

    it('should update health on failed execution', async () => {
      mockPrimaryOperation.mockRejectedValueOnce(new Error('Primary failed'));
      (mockFallbackProvider.execute as vi.Mock).mockRejectedValueOnce(new Error('Fallback failed'));

      await fallbackManager.executeWithFallback(
        mockPrimaryOperation,
        'government-api',
        'test-operation'
      );

      const health = fallbackManager.getHealthStatus();
      const providerHealth = health.find(h => h.name === 'cached-data-provider');
      
      expect(providerHealth?.consecutiveFailures).toBe(1);
    });

    it('should mark provider unhealthy after max failures', async () => {
      mockPrimaryOperation.mockRejectedValue(new Error('Primary failed'));
      (mockFallbackProvider.execute as vi.Mock).mockRejectedValue(new Error('Fallback failed'));

      // Fail 3 times (max failures for this provider)
      for (let i = 0; i < 3; i++) {
        await fallbackManager.executeWithFallback(
          mockPrimaryOperation,
          'government-api',
          'test-operation'
        );
      }

      const health = fallbackManager.getHealthStatus();
      const providerHealth = health.find(h => h.name === 'cached-data-provider');
      
      expect(providerHealth?.healthy).toBe(false);
      expect(providerHealth?.consecutiveFailures).toBe(3);
    });

    it('should manually set provider health', () => {
      fallbackManager.setProviderHealth('cached-data-provider', false);

      const health = fallbackManager.getHealthStatus();
      const providerHealth = health.find(h => h.name === 'cached-data-provider');
      
      expect(providerHealth?.healthy).toBe(false);
    });

    it('should get service-specific health', () => {
      const serviceHealth = fallbackManager.getServiceHealth('government-api');
      
      expect(serviceHealth).toHaveLength(1);
      expect(serviceHealth[0].name).toBe('cached-data-provider');
    });
  });

  describe('provider management', () => {
    it('should remove fallback provider', () => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);
      fallbackManager.removeFallback('government-api', 'cached-data-provider');

      const providers = fallbackManager.getProviders('government-api');
      expect(providers).toHaveLength(0);

      const health = fallbackManager.getHealthStatus();
      expect(health.find(h => h.name === 'cached-data-provider')).toBeUndefined();
    });

    it('should enable/disable provider', () => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);
      fallbackManager.setProviderEnabled('cached-data-provider', false);

      const providers = fallbackManager.getProviders('government-api');
      expect(providers[0].config.enabled).toBe(false);
    });

    it('should clear all providers', () => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);
      fallbackManager.registerFallback('court-records', mockSecondaryProvider);
      
      fallbackManager.clear();

      expect(fallbackManager.getProviders('government-api')).toHaveLength(0);
      expect(fallbackManager.getProviders('court-records')).toHaveLength(0);
      expect(fallbackManager.getHealthStatus()).toHaveLength(0);
    });
  });

  describe('createFallbackFunction', () => {
    beforeEach(() => {
      fallbackManager.registerFallback('government-api', mockFallbackProvider);
    });

    it('should create fallback-enabled wrapper function', async () => {
      const originalFunction = vi.fn().mockResolvedValue('result');
      
      const fallbackFunction = fallbackManager.createFallbackFunction(
        originalFunction,
        'government-api',
        'wrapped-operation'
      );

      const result = await fallbackFunction('arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should use fallback when wrapped function fails', async () => {
      const originalFunction = vi.fn().mockRejectedValue(new Error('Function failed'));
      (mockFallbackProvider.execute as vi.Mock).mockResolvedValue('fallback-result');
      
      const fallbackFunction = fallbackManager.createFallbackFunction(
        originalFunction,
        'government-api',
        'wrapped-operation'
      );

      const result = await fallbackFunction();

      expect(result).toBe('fallback-result');
      expect(originalFunction).toHaveBeenCalledTimes(1);
      expect(mockFallbackProvider.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw error when all fallbacks fail', async () => {
      const originalError = new Error('Function failed');
      const originalFunction = vi.fn().mockRejectedValue(originalError);
      (mockFallbackProvider.execute as vi.Mock).mockRejectedValue(new Error('Fallback failed'));
      
      const fallbackFunction = fallbackManager.createFallbackFunction(
        originalFunction,
        'government-api',
        'wrapped-operation'
      );

      await expect(fallbackFunction()).rejects.toThrow('Function failed');
    });
  });
});