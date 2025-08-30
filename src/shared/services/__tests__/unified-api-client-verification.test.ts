/**
 * Unified API Client Verification Tests
 * Quick tests to ensure the unified client is working correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedApiClient, apiClient } from "../../../shared/services/unified-api-client"

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Unified API Client Verification', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    apiClient.clearCache();
  });

  describe('Basic Functionality', () => {
    it('should create client instance', () => {
      const client = new UnifiedApiClient();
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should use singleton instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
    });

    it('should handle successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1, name: 'Test' })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await apiClient.get('/test');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: 1, name: 'Test' });
      expect(response.status).toBe(200);
      expect(response.requestId).toBeDefined();
    });

    it('should handle POST request with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 2, created: true })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const testData = { name: 'New Item' };
      const response = await apiClient.post('/items', testData);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: 2, created: true });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData)
        })
      );
    });

    it('should handle error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers()
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await apiClient.get('/not-found');
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.error).toContain('404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await apiClient.get('/network-error');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Network error');
    });
  });

  describe('Caching', () => {
    it('should cache GET requests when enabled', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ cached: true })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      // First request
      const response1 = await apiClient.get('/cached', { useCache: true });
      expect(response1.success).toBe(true);
      expect(response1.cached).toBeFalsy(); // First request not from cache
      
      // Second request should use cache
      const response2 = await apiClient.get('/cached', { useCache: true });
      expect(response2.success).toBe(true);
      expect(response2.cached).toBe(true); // Second request from cache
      
      // Should only have called fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration', () => {
    it('should allow custom configuration', () => {
      const customClient = new UnifiedApiClient({
        baseUrl: 'https://api.example.com',
        defaultOptions: {
          timeout: 5000,
          retries: 2
        }
      });
      
      expect(customClient).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      apiClient.clearCache();
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should get circuit breaker state', () => {
      const state = apiClient.getCircuitBreakerState();
      expect(typeof state).toBe('string');
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should support PUT requests', async () => {
      const response = await apiClient.put('/items/1', { name: 'Updated' });
      expect(response.success).toBe(true);
    });

    it('should support DELETE requests', async () => {
      const response = await apiClient.delete('/items/1');
      expect(response.success).toBe(true);
    });
  });
});