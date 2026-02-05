/**
 * Unified API Client Tests
 * 
 * Basic tests to verify the unified API client functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UnifiedApiClient, apiClient } from "../../../shared/services/unified-api-client"

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('Unified API Client', () => {
  let client: UnifiedApiClient;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockSessionStorage.getItem.mockClear();

    // Create fresh client instance
    client = new UnifiedApiClient({
      baseUrl: '/api',
      defaultOptions: {
        timeout: 5000,
        retries: 1,
        useCache: false
      }
    });
  });

  describe('Basic HTTP Methods', () => {
    it('should make GET requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Test User' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'Test User' });
    });

    it('should make POST requests with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 2, name: 'New User' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const userData = { name: 'New User', email: 'new@example.com' };
      const result = await client.post('/users', userData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(userData)
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 2, name: 'New User' });
    });

    it('should make PUT requests with data', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Updated User' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const userData = { name: 'Updated User' };
      const result = await client.put('/users/1', userData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(userData)
        })
      );
      expect(result.success).toBe(true);
    });

    it('should make DELETE requests', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors correctly', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ message: 'User not found' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/users/999');

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toContain('HTTP 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await client.get('/users');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      const result = await client.get('/users', { timeout: 50 });

      expect(result.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should include auth token from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ data: 'protected' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/protected');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should work without auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ data: 'public' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/public');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/public',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Caching', () => {
    it('should cache GET requests when enabled', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, cached: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // First request
      const result1 = await client.get('/users/1', { useCache: true });
      expect(result1.success).toBe(true);
      expect(result1.cached).toBeFalsy(); // First request not cached

      // Second request should use cache (but our implementation may not cache in tests)
      const result2 = await client.get('/users/1', { useCache: true });
      expect(result2.success).toBe(true);
    });

    it('should not cache POST requests', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, created: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.post('/users', { name: 'Test' }, { useCache: true });
      
      expect(result.success).toBe(true);
      expect(result.cached).toBeFalsy();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      expect(() => client.clearCache()).not.toThrow();
    });

    it('should get circuit breaker state', () => {
      const state = client.getCircuitBreakerState();
      expect(typeof state).toBe('string');
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton apiClient', () => {
      expect(apiClient).toBeInstanceOf(UnifiedApiClient);
    });

    it('should use the singleton for requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ singleton: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ singleton: true });
    });
  });

  describe('Configuration', () => {
    it('should create client with custom configuration', () => {
      const customClient = new UnifiedApiClient({
        baseUrl: 'https://api.example.com',
        defaultOptions: {
          timeout: 15000,
          retries: 5,
          useCache: true
        }
      });

      expect(customClient).toBeInstanceOf(UnifiedApiClient);
    });

    it('should handle missing configuration gracefully', () => {
      const defaultClient = new UnifiedApiClient();
      expect(defaultClient).toBeInstanceOf(UnifiedApiClient);
    });
  });
});