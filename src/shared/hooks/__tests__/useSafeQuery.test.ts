/**
 * Tests for useSafeQuery hook
 * Validates TypeScript compliance and core functionality
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

import { useSafeQuery } from '../useSafeQuery'

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSafeQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TypeScript Compliance', () => {
    it('should handle undefined body correctly for GET requests', async () => {
      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
      });

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'GET',
          body: undefined, // This should not cause TypeScript errors
          fallbackData: null,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          credentials: 'include',
          signal: expect.any(AbortSignal),
        })
      );

      // Verify that body property is not included for GET requests
      const fetchCall = (fetch as jest.Mock).mock.calls[0][1];
      expect(fetchCall).not.toHaveProperty('body');
    });

    it('should handle POST requests with body correctly', async () => {
      const mockResponse = { success: true };
      const requestBody = { name: 'test', value: 123 };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
      });

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'POST',
          body: requestBody,
          fallbackData: null,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          credentials: 'include',
          signal: expect.any(AbortSignal),
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should handle missing auth token gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
      });

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'GET',
          fallbackData: null,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer ',
          }),
        })
      );
    });
  });

  describe('Analytics Integration', () => {
    it('should call analytics callbacks correctly', async () => {
      const mockAnalytics = jest.fn();
      const mockSuccess = jest.fn();
      const mockError = jest.fn();

      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
      });

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'GET',
          fallbackData: null,
          onAnalyticsEvent: mockAnalytics,
          onSuccess: mockSuccess,
          onError: mockError,
          context: 'test-context',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify analytics events were called
      expect(mockAnalytics).toHaveBeenCalledWith('query_start', expect.objectContaining({
        endpoint: '/api/test',
        method: 'GET',
        context: 'test-context',
      }));

      expect(mockAnalytics).toHaveBeenCalledWith('query_success', expect.objectContaining({
        endpoint: '/api/test',
        method: 'GET',
        context: 'test-context',
      }));

      // Verify success callback was called
      expect(mockSuccess).toHaveBeenCalledWith(mockResponse, 'test-context');
      expect(mockError).not.toHaveBeenCalled();
    });

    it('should call error analytics and callbacks on failure', async () => {
      const mockAnalytics = jest.fn();
      const mockSuccess = jest.fn();
      const mockError = jest.fn();

      const errorMessage = 'Network error';
      (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'GET',
          fallbackData: 'fallback-data',
          onAnalyticsEvent: mockAnalytics,
          onSuccess: mockSuccess,
          onError: mockError,
          context: 'test-context',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify analytics events were called
      expect(mockAnalytics).toHaveBeenCalledWith('query_start', expect.any(Object));
      expect(mockAnalytics).toHaveBeenCalledWith('query_error', expect.objectContaining({
        endpoint: '/api/test',
        method: 'GET',
        context: 'test-context',
        error: errorMessage,
      }));

      // Verify error callback was called
      expect(mockError).toHaveBeenCalledWith(expect.any(Error), 'test-context');
      expect(mockSuccess).not.toHaveBeenCalled();

      // Should return fallback data
      expect(result.current.data).toBe('fallback-data');
    });
  });

  describe('Enhanced Features', () => {
    it('should provide enhanced error information', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('HTTP 429: Too Many Requests'));

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'GET',
          fallbackData: null,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.enhancedError).toEqual(
        expect.objectContaining({
          code: 'RATE_LIMIT',
          retryAfter: expect.any(Number),
          userMessage: expect.stringContaining('Too many requests'),
          originalError: expect.any(Error),
        })
      );
    });

    it('should provide request statistics', async () => {
      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
      });

      const { result } = renderHook(
        () => useSafeQuery({
          endpoint: '/api/test',
          method: 'GET',
          fallbackData: null,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics).toEqual(
        expect.objectContaining({
          requestCount: expect.any(Number),
          errorCount: expect.any(Number),
          avgResponseTime: expect.any(Number),
          successRate: expect.any(Number),
        })
      );
    });
  });
});