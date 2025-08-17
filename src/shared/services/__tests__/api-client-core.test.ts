import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupMswServer , server } from '../../test-utils/msw-server';
import { UnifiedApiClient, apiClient } from '../unified-api-client';
import { http, HttpResponse } from 'msw';


// Setup MSW server for all tests
setupMswServer({ quiet: true });

describe('API Client Core Integration Tests', () => {
  let client: UnifiedApiClient;

  beforeEach(() => {
    client = new UnifiedApiClient({
      baseUrl: '/api',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
    });
    
    client.clearCache();
    client.clearInterceptors();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Basic HTTP Methods', () => {
    it('should handle GET requests', async () => {
      server.use(
        http.get('/api/test', () => {
          return HttpResponse.json({ message: 'GET success' });
        })
      );

      const response = await client.get<{ message: string }>('/test');
      
      expect(response.success).toBe(true);
      expect(response.data?.message).toBe('GET success');
    });

    it('should handle POST requests', async () => {
      server.use(
        http.post('/api/test', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ received: body, created: true });
        })
      );

      const requestBody = { name: 'Test Item' };
      const response = await client.post<{ received: any; created: boolean }>('/test', requestBody);
      
      expect(response.success).toBe(true);
      expect(response.data?.created).toBe(true);
      expect(response.data?.received.name).toBe('Test Item');
    });

    it('should handle PUT requests', async () => {
      server.use(
        http.put('/api/test/1', () => {
          return HttpResponse.json({ updated: true });
        })
      );

      const response = await client.put<{ updated: boolean }>('/test/1', { name: 'Updated' });
      
      expect(response.success).toBe(true);
      expect(response.data?.updated).toBe(true);
    });

    it('should handle DELETE requests', async () => {
      server.use(
        http.delete('/api/test/1', () => {
          return HttpResponse.json({ deleted: true });
        })
      );

      const response = await client.delete<{ deleted: boolean }>('/test/1');
      
      expect(response.success).toBe(true);
      expect(response.data?.deleted).toBe(true);
    });

    it('should handle PATCH requests', async () => {
      server.use(
        http.patch('/api/test/1', () => {
          return HttpResponse.json({ patched: true });
        })
      );

      const response = await client.patch<{ patched: boolean }>('/test/1', { status: 'active' });
      
      expect(response.success).toBe(true);
      expect(response.data?.patched).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      server.use(
        http.get('/api/not-found', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'Resource not found' }),
            { status: 404 }
          );
        })
      );

      const response = await client.get('/not-found');
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.error).toContain('404');
    });

    it('should handle 500 server errors', async () => {
      server.use(
        http.get('/api/server-error', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'Internal server error' }),
            { status: 500 }
          );
        })
      );

      const response = await client.get('/server-error');
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(500);
      expect(response.error).toContain('500');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('/api/network-error', () => {
          return HttpResponse.error();
        })
      );

      const response = await client.get('/network-error');
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle malformed JSON responses', async () => {
      server.use(
        http.get('/api/malformed', () => {
          return new HttpResponse('{ invalid json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const response = await client.get('/malformed');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to parse response');
    });
  });

  describe('Request Configuration', () => {
    it('should use custom base URL', () => {
      client.setBaseUrl('/custom-api');
      expect(client.getConfig().baseUrl).toBe('/custom-api');
    });

    it('should update default headers', () => {
      client.setDefaultHeaders({ 'Authorization': 'Bearer token' });
      const config = client.getConfig();
      
      expect(config.defaultHeaders['Authorization']).toBe('Bearer token');
      expect(config.defaultHeaders['Content-Type']).toBe('application/json');
    });

    it('should clear default headers', () => {
      client.setDefaultHeaders({ 'Authorization': 'Bearer token' });
      client.clearDefaultHeaders();
      
      const config = client.getConfig();
      expect(config.defaultHeaders['Authorization']).toBeUndefined();
      expect(config.defaultHeaders['Content-Type']).toBe('application/json');
    });

    it('should throw error for invalid base URL', () => {
      expect(() => client.setBaseUrl('')).toThrow('Base URL must be a non-empty string');
    });
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptors', async () => {
      client.addRequestInterceptor((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'test-value',
        },
      }));

      server.use(
        http.get('/api/interceptor-test', ({ request }) => {
          const customHeader = request.headers.get('X-Custom-Header');
          return HttpResponse.json({ customHeader });
        })
      );

      const response = await client.get<{ customHeader: string }>('/interceptor-test');
      
      expect(response.success).toBe(true);
      expect(response.data?.customHeader).toBe('test-value');
    });

    it('should clear interceptors', async () => {
      client.addRequestInterceptor((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Test': 'should-not-appear' },
      }));

      client.clearInterceptors();

      server.use(
        http.get('/api/clear-test', ({ request }) => {
          const testHeader = request.headers.get('X-Test');
          return HttpResponse.json({ testHeader });
        })
      );

      const response = await client.get<{ testHeader: string | null }>('/clear-test');
      
      expect(response.data?.testHeader).toBeNull();
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });
    });

    it('should include auth token from localStorage', async () => {
      const mockToken = 'test-auth-token';
      vi.mocked(localStorage.getItem).mockReturnValue(mockToken);

      server.use(
        http.get('/api/protected', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ authHeader });
        })
      );

      const response = await client.get<{ authHeader: string }>('/protected');
      
      expect(response.success).toBe(true);
      expect(response.data?.authHeader).toBe(`Bearer ${mockToken}`);
    });

    it('should handle missing auth token', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      server.use(
        http.get('/api/no-auth', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ authHeader });
        })
      );

      const response = await client.get<{ authHeader: string | null }>('/no-auth');
      
      expect(response.success).toBe(true);
      expect(response.data?.authHeader).toBeNull();
    });
  });

  describe('Data Transformation', () => {
    it('should handle JSON responses', async () => {
      const mockData = {
        id: 1,
        name: 'Test',
        active: true,
        metadata: null,
      };

      server.use(
        http.get('/api/json-test', () => {
          return HttpResponse.json(mockData);
        })
      );

      const response = await client.get<typeof mockData>('/json-test');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);
    });

    it('should handle text responses', async () => {
      const textContent = 'Plain text response';
      
      server.use(
        http.get('/api/text-test', () => {
          return new HttpResponse(textContent, {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
      );

      const response = await client.get<string>('/text-test');
      
      expect(response.success).toBe(true);
      expect(response.data).toBe(textContent);
    });

    it('should handle FormData requests', async () => {
      server.use(
        http.post('/api/form-test', async ({ request }) => {
          const formData = await request.formData();
          const name = formData.get('name');
          return HttpResponse.json({ name });
        })
      );

      const formData = new FormData();
      formData.append('name', 'test-file');

      const response = await client.post<{ name: string }>('/form-test', formData);
      
      expect(response.success).toBe(true);
      expect(response.data?.name).toBe('test-file');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = client.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('strategy');
      expect(typeof stats.size).toBe('number');
    });

    it('should clear cache', async () => {
      server.use(
        http.get('/api/cache-test', () => {
          return HttpResponse.json({ data: 'test' });
        })
      );

      // Make a request to potentially cache it
      await client.get('/cache-test');
      
      // Clear cache
      client.clearCache();
      
      // Cache should be empty
      expect(client.getCacheStats().size).toBe(0);
    });
  });

  describe('Singleton Instances', () => {
    it('should use singleton apiClient instance', async () => {
      server.use(
        http.get('/api/singleton-test', () => {
          return HttpResponse.json({ singleton: true });
        })
      );

      const response = await apiClient.get<{ singleton: boolean }>('/singleton-test');
      
      expect(response.success).toBe(true);
      expect(response.data?.singleton).toBe(true);
    });

    it('should use helper api object', async () => {
      server.use(
        http.get('/api/helper-test', () => {
          return HttpResponse.json({ helper: true });
        })
      );

      const response = await api.get<{ helper: boolean }>('/helper-test');
      
      expect(response.success).toBe(true);
      expect(response.data?.helper).toBe(true);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      server.use(
        http.get('/api/concurrent-1', () => HttpResponse.json({ endpoint: 1 })),
        http.get('/api/concurrent-2', () => HttpResponse.json({ endpoint: 2 })),
        http.get('/api/concurrent-3', () => HttpResponse.json({ endpoint: 3 }))
      );

      const [response1, response2, response3] = await Promise.all([
        client.get<{ endpoint: number }>('/concurrent-1'),
        client.get<{ endpoint: number }>('/concurrent-2'),
        client.get<{ endpoint: number }>('/concurrent-3'),
      ]);

      expect(response1.success).toBe(true);
      expect(response2.success).toBe(true);
      expect(response3.success).toBe(true);
      expect(response1.data?.endpoint).toBe(1);
      expect(response2.data?.endpoint).toBe(2);
      expect(response3.data?.endpoint).toBe(3);
    });

    it('should handle mixed success and error responses', async () => {
      server.use(
        http.get('/api/success', () => HttpResponse.json({ result: 'success' })),
        http.get('/api/error', () => new HttpResponse(null, { status: 500 }))
      );

      const [successResponse, errorResponse] = await Promise.allSettled([
        client.get('/success'),
        client.get('/error'),
      ]);

      expect(successResponse.status).toBe('fulfilled');
      expect(successResponse.value.success).toBe(true);

      expect(errorResponse.status).toBe('fulfilled');
      expect(errorResponse.value.success).toBe(false);
    });
  });

  describe('Request Cancellation', () => {
    it('should handle request cancellation', async () => {
      const controller = new AbortController();
      
      server.use(
        http.get('/api/cancel-test', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ message: 'Should not reach here' });
        })
      );

      // Cancel the request after a short delay
      setTimeout(() => controller.abort(), 50);

      const response = await client.get('/cancel-test', controller.signal);
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});