/**
 * Error testing utilities for comprehensive error handling and edge case testing
 * Provides utilities for testing network failures, API errors, validation errors, and error boundaries
 */

import React from 'react';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './msw-server';

// Network error simulation utilities
export const networkErrors = {
  /**
   * Simulate network timeout
   */
  timeout: (endpoint: string, delay: number = 5000) => {
    server.use(
      http.get(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate actual timeout by rejecting
            reject(new Error('Request timeout'));
          }, delay);
        });
      })
    );
  },

  /**
   * Simulate network connection failure
   */
  connectionFailure: (endpoint: string) => {
    server.use(
      http.get(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return HttpResponse.error();
      })
    );
  },

  /**
   * Simulate intermittent network issues
   */
  intermittent: (endpoint: string, failureRate: number = 0.5) => {
    server.use(
      http.get(`/api/${endpoint.replace(/^\//, '')}`, () => {
        if (Math.random() < failureRate) {
          return HttpResponse.error();
        }
        return HttpResponse.json({
          success: true,
          data: { message: 'Success after retry' }
        });
      })
    );
  },

  /**
   * Simulate offline mode
   */
  offline: () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Intercept all API calls and return network error
    server.use(
      http.all('/api/*', () => {
        return HttpResponse.error();
      })
    );
  },

  /**
   * Restore online mode
   */
  online: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    server.resetHandlers();
  },
};

// API error response utilities
export const apiErrors = {
  /**
   * Create a 400 Bad Request error
   */
  badRequest: (endpoint: string, message: string = 'Bad request') => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'BAD_REQUEST',
            message,
            details: {
              code: 400,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 400 }
        );
      })
    );
  },

  /**
   * Create a 401 Unauthorized error
   */
  unauthorized: (endpoint: string, message: string = 'Unauthorized access') => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'UNAUTHORIZED',
            message,
            details: {
              code: 401,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 401 }
        );
      })
    );
  },

  /**
   * Create a 403 Forbidden error
   */
  forbidden: (endpoint: string, message: string = 'Access forbidden') => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'FORBIDDEN',
            message,
            details: {
              code: 403,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 403 }
        );
      })
    );
  },

  /**
   * Create a 404 Not Found error
   */
  notFound: (endpoint: string, resource: string = 'Resource') => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: `${resource} not found`,
            details: {
              code: 404,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 404 }
        );
      })
    );
  },

  /**
   * Create a 422 Validation Error
   */
  validationError: (endpoint: string, fieldErrors: Record<string, string[]>) => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'VALIDATION_FAILED',
            message: 'Validation failed',
            details: {
              code: 422,
              fieldErrors,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 422 }
        );
      })
    );
  },

  /**
   * Create a 429 Rate Limit error
   */
  rateLimited: (endpoint: string, retryAfter: number = 60) => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            details: {
              code: 429,
              retryAfter,
              timestamp: new Date().toISOString(),
            }
          }),
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
            }
          }
        );
      })
    );
  },

  /**
   * Create a 500 Internal Server Error
   */
  serverError: (endpoint: string, message: string = 'Internal server error') => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message,
            details: {
              code: 500,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 500 }
        );
      })
    );
  },

  /**
   * Create a 503 Service Unavailable error
   */
  serviceUnavailable: (endpoint: string, message: string = 'Service temporarily unavailable') => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new HttpResponse(
          JSON.stringify({
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message,
            details: {
              code: 503,
              timestamp: new Date().toISOString(),
            }
          }),
          { status: 503 }
        );
      })
    );
  },
};

// Empty state and loading state utilities
export const stateUtilities = {
  /**
   * Create empty data response
   */
  emptyData: (endpoint: string) => {
    server.use(
      http.get(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            items: [],
            totalCount: 0,
            page: 1,
            limit: 20,
          }
        });
      })
    );
  },

  /**
   * Create loading state simulation with delay
   */
  loading: (endpoint: string, delay: number = 2000) => {
    server.use(
      http.get(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(HttpResponse.json({
              success: true,
              data: { message: 'Data loaded after delay' }
            }));
          }, delay);
        });
      })
    );
  },

  /**
   * Create no data scenario (different from empty - no results found)
   */
  noData: (endpoint: string, message: string = 'No data available') => {
    server.use(
      http.get(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return HttpResponse.json({
          success: true,
          data: null,
          message
        });
      })
    );
  },
};

// Input validation utilities
export const validationUtilities = {
  /**
   * Test invalid email formats
   */
  invalidEmails: [
    'invalid-email',
    '@domain.com',
    'user@',
    'user@domain',
    'user.domain.com',
    'user@domain.',
    'user@.domain.com',
    '',
    ' ',
    'user name@domain.com',
  ],

  /**
   * Test invalid phone numbers
   */
  invalidPhoneNumbers: [
    '123',
    'abc',
    '+254abc',
    '07123',
    '+254712345678901234567890', // too long
    '',
    ' ',
  ],

  /**
   * Test invalid passwords
   */
  invalidPasswords: [
    '123', // too short
    'password', // no uppercase, no numbers
    'PASSWORD', // no lowercase, no numbers
    '12345678', // no letters
    '', // empty
    ' ', // whitespace only
    'a'.repeat(129), // too long
  ],

  /**
   * Test invalid property data
   */
  invalidPropertyData: {
    emptyTitle: { title: '', description: 'Valid description', price: 1000000 },
    negativePrice: { title: 'Valid Title', description: 'Valid description', price: -1000 },
    invalidLocation: { title: 'Valid Title', description: 'Valid description', price: 1000000, location: '' },
    missingRequired: { description: 'Valid description' }, // missing title and price
  },

  /**
   * Create validation error response for specific field
   */
  createFieldError: (field: string, message: string) => ({
    success: false,
    error: 'VALIDATION_FAILED',
    message: 'Validation failed',
    details: {
      fieldErrors: {
        [field]: [message]
      }
    }
  }),
};

// Error boundary testing utilities
export const errorBoundaryUtilities = {
  /**
   * Component that throws an error for testing error boundaries
   */
  ThrowingComponent: ({ shouldThrow = true, errorMessage = 'Test error' }: { 
    shouldThrow?: boolean; 
    errorMessage?: string; 
  }) => {
    if (shouldThrow) {
      throw new Error(errorMessage);
    }
    return React.createElement('div', { 'data-testid': 'no-error' }, 'No error occurred');
  },

  /**
   * Component that throws async error
   */
  AsyncThrowingComponent: ({ shouldThrow = true, delay = 100 }: { 
    shouldThrow?: boolean; 
    delay?: number; 
  }) => {
    React.useEffect(() => {
      if (shouldThrow) {
        setTimeout(() => {
          throw new Error('Async error');
        }, delay);
      }
    }, [shouldThrow, delay]);

    return React.createElement('div', { 'data-testid': 'async-component' }, 'Async component');
  },

  /**
   * Mock console.error to capture error boundary logs
   */
  mockConsoleError: () => {
    const originalError = console.error;
    const mockError = vi.fn();
    console.error = mockError;
    
    return {
      mockError,
      restore: () => {
        console.error = originalError;
      }
    };
  },
};

// Utility to simulate slow network conditions
export const performanceUtilities = {
  /**
   * Simulate slow 3G network
   */
  slow3G: (endpoint: string) => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(HttpResponse.json({
              success: true,
              data: { message: 'Slow network response' }
            }));
          }, 3000); // 3 second delay
        });
      })
    );
  },

  /**
   * Simulate fast network
   */
  fastNetwork: (endpoint: string) => {
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        return HttpResponse.json({
          success: true,
          data: { message: 'Fast network response' }
        });
      })
    );
  },
};

// Utility to test error recovery
export const recoveryUtilities = {
  /**
   * Create a handler that fails first N times then succeeds
   */
  failThenSucceed: (endpoint: string, failCount: number = 2) => {
    let attempts = 0;
    
    server.use(
      http.all(`/api/${endpoint.replace(/^\//, '')}`, () => {
        attempts++;
        
        if (attempts <= failCount) {
          return new HttpResponse(
            JSON.stringify({
              success: false,
              error: 'TEMPORARY_ERROR',
              message: `Attempt ${attempts} failed`,
            }),
            { status: 500 }
          );
        }
        
        return HttpResponse.json({
          success: true,
          data: { message: `Success on attempt ${attempts}` }
        });
      })
    );
  },

  /**
   * Reset attempt counter for failThenSucceed
   */
  resetAttempts: () => {
    server.resetHandlers();
  },
};

// Utility to test authentication errors
export const authErrorUtilities = {
  /**
   * Simulate expired token
   */
  expiredToken: () => {
    server.use(
      http.all('/api/*', ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.includes('Bearer')) {
          return new HttpResponse(
            JSON.stringify({
              success: false,
              error: 'TOKEN_EXPIRED',
              message: 'Authentication token has expired',
            }),
            { status: 401 }
          );
        }
        return HttpResponse.json({ success: true, data: {} });
      })
    );
  },

  /**
   * Simulate invalid token
   */
  invalidToken: () => {
    server.use(
      http.all('/api/*', ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.includes('Bearer')) {
          return new HttpResponse(
            JSON.stringify({
              success: false,
              error: 'TOKEN_INVALID',
              message: 'Authentication token is invalid',
            }),
            { status: 401 }
          );
        }
        return HttpResponse.json({ success: true, data: {} });
      })
    );
  },

  /**
   * Simulate missing token
   */
  missingToken: () => {
    server.use(
      http.all('/api/*', ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
          return new HttpResponse(
            JSON.stringify({
              success: false,
              error: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required',
            }),
            { status: 401 }
          );
        }
        return HttpResponse.json({ success: true, data: {} });
      })
    );
  },
};

// Utility to clean up after tests
export const cleanup = {
  /**
   * Reset all handlers and restore defaults
   */
  resetAll: () => {
    server.resetHandlers();
    networkErrors.online();
  },

  /**
   * Clear all overrides and restore original handlers
   */
  restoreDefaults: () => {
    server.restoreHandlers();
    networkErrors.online();
  },
};