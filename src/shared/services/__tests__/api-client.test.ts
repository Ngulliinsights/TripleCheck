import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { setupMswServer, mockApiSuccess, mockApiError, simulateNetworkConditions } from '../../test-utils/msw-server';
import { ApiClient, apiClient, api, type ApiResponse, type ApiClientConfig } from "../../../shared/services/unified-api-client"
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/msw-server';

// Setup MSW server for all tests
setupMswServer({ quiet: true });

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    // Create a fresh client instance for each test
    client = new ApiClient({
      baseUrl: '/api',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
    });
    
    // Clear any cached responses
    client.clearCache();
    
    // Clear localStorage/sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    // Reset server handlers after each test
    server.resetHandlers();
  });

  describe('Constructor and Configuration', () => {
    it('should create instance with default configuration', () => {
      const defaultClient = new ApiClient();
      const config = defaultClient.getConfig();
      
      expect(config.baseUrl).toBe('/api');
      expect(config.timeout).toBe(10000);
      expect(config.retryAttempts).toBe(3);
      expect(config.defaultHeaders['Content-Type']).toBe('application/json');
    });

    it('should create instance with custom configuration', () => {
      const customConfig: ApiClientConfig = {
        baseUrl: '/custom-api',
        timeout: 15000,
        retryAttempts: 5,
        retryDelay: 2000,
        defaultHeaders: { 'X-Custom-Header': 'test' },
        cacheStrategy: {
          type: 'LRU',
          maxSize: 50,
          defaultTTL: 600000,
        },
        enableBatching: true,
        batchDelay: 100,
        maxBatchSize: 5,
      };

      const customClient = new ApiClient(customConfig);
      const config = customClient.getConfig();
      
      expect(config.baseUrl).toBe('/custom-api');
      expect(config.timeout).toBe(15000);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryDelay).toBe(2000);
      expect(config.defaultHeaders['X-Custom-Header']).toBe('test');
      expect(config.cacheStrategy.type).toBe('LRU');
      expect(config.enableBatching).toBe(true);
    });

    it('should update base URL correctly', () => {
      client.setBaseUrl('/new-api');
      expect(client.getConfig().baseUrl).toBe('/new-api');
    });

    it('should throw error for invalid base URL', () => {
      expect(() => client.setBaseUrl('')).toThrow('Base URL must be a non-empty string');
      expect(() => client.setBaseUrl('   ')).toThrow('Base URL must be a non-empty string');
    });

    it('should update default headers correctly', () => {
      client.setDefaultHeaders({ 'Authorization': 'Bearer token' });
      const config = client.getConfig();
      
      expect(config.defaultHeaders['Authorization']).toBe('Bearer token');
      expect(config.defaultHeaders['Content-Type']).toBe('application/json');
    });

    it('should clear default headers', () => {
      client.setDefaultHeaders({ 'Authorization': 'Bearer token' });
      client.clearDefaultHeaders();
      