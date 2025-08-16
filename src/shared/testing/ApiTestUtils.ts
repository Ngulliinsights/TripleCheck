/**
 * API Testing Utilities
 * Utilities for testing API endpoints and integrations
 */

import { vi } from 'vitest';
import { mockApiResponses } from './TestUtils';

export interface ApiTestConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ApiTestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  responseTime: number;
}

export class ApiTester {
  private config: Required<ApiTestConfig>;

  constructor(config: ApiTestConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000/api',
      timeout: config.timeout || 5000,
      retries: config.retries || 3,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };
  }

  /**
   * Test API endpoint
   */
  async testEndpoint(
    method: string,
    endpoint: string,
    data?: any,
    expectedStatus: number = 200
  ): Promise<ApiTestResult> {
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: this.config.headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.json().catch(() => null);

      return {
        success: response.status === expectedStatus,
        status: response.status,
        data: responseData,
        responseTime,
        error: response.ok ? undefined : response.statusText,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        status: 0,
        responseTime,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Test multiple endpoints
   */
  async testEndpoints(
    tests: Array<{
      name: string;
      method: string;
      endpoint: string;
      data?: any;
      expectedStatus?: number;
    }>
  ): Promise<Record<string, ApiTestResult>> {
    const results: Record<string, ApiTestResult> = {};

    for (const test of tests) {
      results[test.name] = await this.testEndpoint(
        test.method,
        test.endpoint,
        test.data,
        test.expectedStatus
      );
    }

    return results;
  }

  /**
   * Test endpoint with retries
   */
  async testEndpointWithRetries(
    method: string,
    endpoint: string,
    data?: any,
    expectedStatus: number = 200
  ): Promise<ApiTestResult> {
    let lastResult: ApiTestResult | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      lastResult = await this.testEndpoint(method, endpoint, data, expectedStatus);
      
      if (lastResult.success) {
        return lastResult;
      }

      if (attempt < this.config.retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return lastResult!;
  }

  /**
   * Test endpoint performance
   */
  async testEndpointPerformance(
    method: string,
    endpoint: string,
    iterations: number = 10,
    data?: any
  ): Promise<{
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    successRate: number;
    results: ApiTestResult[];
  }> {
    const results: ApiTestResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.testEndpoint(method, endpoint, data);
      results.push(result);
    }

    const responseTimes = results.map(r => r.responseTime);
    const successCount = results.filter(r => r.success).length;

    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      successRate: (successCount / results.length) * 100,
      results,
    };
  }
}

/**
 * Mock API server for testing
 */
export class MockApiServer {
  private routes: Map<string, any> = new Map();
  private middleware: Array<(req: any, res: any, next: () => void) => void> = [];

  /**
   * Add route handler
   */
  addRoute(method: string, path: string, handler: (req: any) => any) {
    const key = `${method.toUpperCase()} ${path}`;
    this.routes.set(key, handler);
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware: (req: any, res: any, next: () => void) => void) {
    this.middleware.push(middleware);
  }

  /**
   * Mock fetch to use this server
   */
  mockFetch() {
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any = {}) => {
      const method = options.method || 'GET';
      const path = new URL(url).pathname;
      const key = `${method.toUpperCase()} ${path}`;

      // Create mock request object
      const req = {
        method,
        url,
        path,
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null,
      };

      // Create mock response object
      const res = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: null,
      };

      // Run middleware
      for (const mw of this.middleware) {
        let nextCalled = false;
        mw(req, res, () => { nextCalled = true; });
        if (!nextCalled) break;
      }

      // Find and execute route handler
      const handler = this.routes.get(key);
      if (handler) {
        try {
          res.data = await handler(req);
        } catch (error) {
          res.status = 500;
          res.statusText = 'Internal Server Error';
          res.data = { error: (error as Error).message };
        }
      } else {
        res.status = 404;
        res.statusText = 'Not Found';
        res.data = { error: 'Route not found' };
      }

      // Return mock response
      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: res.statusText,
        headers: new Headers(res.headers),
        json: async () => res.data,
        text: async () => JSON.stringify(res.data),
      };
    });
  }

  /**
   * Reset all routes and middleware
   */
  reset() {
    this.routes.clear();
    this.middleware = [];
  }
}

/**
 * API test scenarios
 */
export const createApiTestScenarios = () => {
  const scenarios = {
    // Authentication tests
    auth: [
      {
        name: 'login_success',
        method: 'POST',
        endpoint: '/auth/login',
        data: { email: 'test@example.com', password: 'password123' },
        expectedStatus: 200,
      },
      {
        name: 'login_invalid_credentials',
        method: 'POST',
        endpoint: '/auth/login',
        data: { email: 'test@example.com', password: 'wrongpassword' },
        expectedStatus: 401,
      },
      {
        name: 'refresh_token',
        method: 'POST',
        endpoint: '/auth/refresh',
        data: { refreshToken: 'valid-refresh-token' },
        expectedStatus: 200,
      },
    ],

    // User management tests
    users: [
      {
        name: 'get_user_profile',
        method: 'GET',
        endpoint: '/users/profile',
        expectedStatus: 200,
      },
      {
        name: 'update_user_profile',
        method: 'PUT',
        endpoint: '/users/profile',
        data: { firstName: 'John', lastName: 'Doe' },
        expectedStatus: 200,
      },
      {
        name: 'change_password',
        method: 'POST',
        endpoint: '/users/change-password',
        data: { currentPassword: 'old', newPassword: 'new' },
        expectedStatus: 200,
      },
    ],

    // Property tests
    properties: [
      {
        name: 'get_properties',
        method: 'GET',
        endpoint: '/properties',
        expectedStatus: 200,
      },
      {
        name: 'get_property_by_id',
        method: 'GET',
        endpoint: '/properties/123',
        expectedStatus: 200,
      },
      {
        name: 'create_property',
        method: 'POST',
        endpoint: '/properties',
        data: {
          title: 'Test Property',
          price: 100000,
          address: '123 Test St',
        },
        expectedStatus: 201,
      },
      {
        name: 'search_properties',
        method: 'GET',
        endpoint: '/properties/search?q=test&minPrice=50000&maxPrice=200000',
        expectedStatus: 200,
      },
    ],

    // Messaging tests
    messaging: [
      {
        name: 'get_threads',
        method: 'GET',
        endpoint: '/messaging/threads',
        expectedStatus: 200,
      },
      {
        name: 'create_thread',
        method: 'POST',
        endpoint: '/messaging/threads',
        data: {
          participantIds: ['user-456'],
          subject: 'Test Thread',
          threadType: 'direct_message',
        },
        expectedStatus: 201,
      },
      {
        name: 'send_message',
        method: 'POST',
        endpoint: '/messaging/threads/123/messages',
        data: {
          content: 'Hello, this is a test message',
          messageType: 'text',
        },
        expectedStatus: 201,
      },
    ],

    // Health check tests
    health: [
      {
        name: 'health_check',
        method: 'GET',
        endpoint: '/health',
        expectedStatus: 200,
      },
      {
        name: 'auth_health',
        method: 'GET',
        endpoint: '/auth/health',
        expectedStatus: 200,
      },
      {
        name: 'database_health',
        method: 'GET',
        endpoint: '/health/database',
        expectedStatus: 200,
      },
    ],
  };

  return scenarios;
};

/**
 * Load testing utilities
 */
export class LoadTester {
  private concurrency: number;
  private duration: number;

  constructor(concurrency: number = 10, duration: number = 30000) {
    this.concurrency = concurrency;
    this.duration = duration;
  }

  /**
   * Run load test on endpoint
   */
  async runLoadTest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const endTime = startTime + this.duration;
    const results: ApiTestResult[] = [];
    const errors: string[] = [];

    const makeRequest = async (): Promise<void> => {
      while (Date.now() < endTime) {
        try {
          const apiTester = new ApiTester();
          const result = await apiTester.testEndpoint(method, endpoint, data);
          results.push(result);
          
          if (!result.success && result.error) {
            errors.push(result.error);
          }
        } catch (error) {
          errors.push((error as Error).message);
        }
      }
    };

    // Run concurrent requests
    const promises = Array.from({ length: this.concurrency }, () => makeRequest());
    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const successfulRequests = results.filter(r => r.success).length;
    const averageResponseTime = results.length > 0
      ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      : 0;

    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests: results.length - successfulRequests,
      averageResponseTime,
      requestsPerSecond: (results.length / totalTime) * 1000,
      errors: [...new Set(errors)], // Remove duplicates
    };
  }
}

/**
 * Integration test runner
 */
export class IntegrationTestRunner {
  private apiTester: ApiTester;
  private mockServer: MockApiServer;

  constructor(config?: ApiTestConfig) {
    this.apiTester = new ApiTester(config);
    this.mockServer = new MockApiServer();
  }

  /**
   * Run integration test suite
   */
  async runTestSuite(
    suiteName: string,
    tests: Array<{
      name: string;
      setup?: () => Promise<void>;
      test: () => Promise<void>;
      teardown?: () => Promise<void>;
    }>
  ): Promise<{
    suiteName: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: Array<{
      name: string;
      passed: boolean;
      error?: string;
      duration: number;
    }>;
  }> {
    const results: Array<{
      name: string;
      passed: boolean;
      error?: string;
      duration: number;
    }> = [];

    for (const test of tests) {
      const startTime = Date.now();
      let passed = false;
      let error: string | undefined;

      try {
        await test.setup?.();
        await test.test();
        passed = true;
      } catch (err) {
        error = (err as Error).message;
      } finally {
        try {
          await test.teardown?.();
        } catch (teardownError) {
          console.warn('Teardown error:', teardownError);
        }
      }

      results.push({
        name: test.name,
        passed,
        error,
        duration: Date.now() - startTime,
      });
    }

    const passedTests = results.filter(r => r.passed).length;

    return {
      suiteName,
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      results,
    };
  }

  getMockServer(): MockApiServer {
    return this.mockServer;
  }

  getApiTester(): ApiTester {
    return this.apiTester;
  }
}