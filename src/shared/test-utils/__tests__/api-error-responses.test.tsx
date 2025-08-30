/**
 * API error responses and user-friendly error message tests
 * Tests various HTTP error codes and their user-facing error messages
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { apiErrors, authErrorUtilities, cleanup } from '../error-testing';
import { api } from "../../../shared/services/unified-api-client"

// Component for testing API error handling
function ApiErrorTestComponent() {
  const [response, setResponse] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const makeRequest = async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let result;
      switch (method) {
        case 'POST':
          result = await api.post(endpoint, { test: 'data' });
          break;
        case 'PUT':
          result = await api.put(endpoint, { test: 'data' });
          break;
        case 'DELETE':
          result = await api.delete(endpoint);
          break;
        default:
          result = await api.get(endpoint);
      }

      if (result.success) {
        setResponse(result.data);
      } else {
        setError(result.error || result.message || 'Request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <button onClick={() => makeRequest('/test-endpoint')} disabled={loading}>
          GET Request
        </button>
        <button onClick={() => makeRequest('/test-endpoint', 'POST')} disabled={loading}>
          POST Request
        </button>
        <button onClick={() => makeRequest('/test-endpoint', 'PUT')} disabled={loading}>
          PUT Request
        </button>
        <button onClick={() => makeRequest('/test-endpoint', 'DELETE')} disabled={loading}>
          DELETE Request
        </button>
      </div>

      {loading && <div data-testid="loading">Loading...</div>}

      {error && (
        <div data-testid="error" role="alert">
          {error}
        </div>
      )}

      {response && (
        <div data-testid="success">
          {JSON.stringify(response)}
        </div>
      )}
    </div>
  );
}

describe('API Error Response Handling', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup.resetAll();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
  });

  describe('HTTP 400 Bad Request Errors', () => {
    it('should display user-friendly message for bad request', async () => {
      apiErrors.badRequest('test-endpoint', 'Invalid request parameters');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Invalid request parameters');
    });

    it('should handle bad request for different HTTP methods', async () => {
      apiErrors.badRequest('test-endpoint', 'Bad request data');

      renderWithProviders(<ApiErrorTestComponent />);

      const methods = ['GET Request', 'POST Request', 'PUT Request', 'DELETE Request'];

      for (const method of methods) {
        await user.click(screen.getByText(method));

        await waitFor(() => {
          expect(screen.getByTestId('error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('error')).toHaveTextContent('Bad request data');

        // Clear error for next test
        cleanup.resetAll();
        apiErrors.badRequest('test-endpoint', 'Bad request data');
      }
    });
  });

  describe('HTTP 401 Unauthorized Errors', () => {
    it('should display authentication required message', async () => {
      apiErrors.unauthorized('test-endpoint', 'Please log in to continue');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Please log in to continue');
    });

    it('should handle expired token scenario', async () => {
      authErrorUtilities.expiredToken();

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(/token.*expired/i);
    });

    it('should handle invalid token scenario', async () => {
      authErrorUtilities.invalidToken();

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(/token.*invalid/i);
    });
  });

  describe('HTTP 403 Forbidden Errors', () => {
    it('should display access denied message', async () => {
      apiErrors.forbidden('test-endpoint', 'You do not have permission to access this resource');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('You do not have permission to access this resource');
    });
  });

  describe('HTTP 404 Not Found Errors', () => {
    it('should display resource not found message', async () => {
      apiErrors.notFound('test-endpoint', 'Property');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Property not found');
    });

    it('should handle different resource types', async () => {
      const resources = ['User', 'Property', 'Review', 'Payment'];

      for (const resource of resources) {
        cleanup.resetAll();
        apiErrors.notFound('test-endpoint', resource);

        renderWithProviders(<ApiErrorTestComponent />);

        await user.click(screen.getByText('GET Request'));

        await waitFor(() => {
          expect(screen.getByTestId('error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('error')).toHaveTextContent(`${resource} not found`);
      }
    });
  });

  describe('HTTP 422 Validation Errors', () => {
    it('should display validation error messages', async () => {
      const fieldErrors = {
        email: ['Email is required', 'Email format is invalid'],
        password: ['Password must be at least 8 characters'],
      };

      apiErrors.validationError('test-endpoint', fieldErrors);

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('POST Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Validation failed');
    });

    it('should handle single field validation error', async () => {
      const fieldErrors = {
        title: ['Property title is required'],
      };

      apiErrors.validationError('test-endpoint', fieldErrors);

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('POST Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Validation failed');
    });
  });

  describe('HTTP 429 Rate Limit Errors', () => {
    it('should display rate limit exceeded message', async () => {
      apiErrors.rateLimited('test-endpoint', 60);

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Too many requests');
    });

    it('should handle different retry-after values', async () => {
      const retryTimes = [30, 60, 300];

      for (const retryTime of retryTimes) {
        cleanup.resetAll();
        apiErrors.rateLimited('test-endpoint', retryTime);

        renderWithProviders(<ApiErrorTestComponent />);

        await user.click(screen.getByText('GET Request'));

        await waitFor(() => {
          expect(screen.getByTestId('error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('error')).toHaveTextContent('Too many requests');
      }
    });
  });

  describe('HTTP 500 Server Errors', () => {
    it('should display server error message', async () => {
      apiErrors.serverError('test-endpoint', 'Database connection failed');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Database connection failed');
    });

    it('should handle generic server errors', async () => {
      apiErrors.serverError('test-endpoint');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Internal server error');
    });
  });

  describe('HTTP 503 Service Unavailable Errors', () => {
    it('should display service unavailable message', async () => {
      apiErrors.serviceUnavailable('test-endpoint', 'Service is under maintenance');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Service is under maintenance');
    });
  });

  describe('Error Message Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      apiErrors.serverError('test-endpoint', 'Server error occurred');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        const errorElement = screen.getByTestId('error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should provide clear error context', async () => {
      apiErrors.notFound('test-endpoint', 'Property');

      renderWithProviders(<ApiErrorTestComponent />);

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      const errorText = screen.getByTestId('error').textContent;
      expect(errorText).toBeTruthy();
      expect(errorText).not.toBe('Error'); // Should be more descriptive
    });
  });

  describe('Error Recovery and Retry', () => {
    it('should allow retry after error', async () => {
      apiErrors.serverError('test-endpoint');

      renderWithProviders(<ApiErrorTestComponent />);

      // First request fails
      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Fix the error and retry
      cleanup.resetAll();

      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      });
    });

    it('should clear previous errors on new request', async () => {
      apiErrors.serverError('test-endpoint');

      renderWithProviders(<ApiErrorTestComponent />);

      // First request fails
      await user.click(screen.getByText('GET Request'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Second request should clear previous error
      await user.click(screen.getByText('POST Request'));

      // Error should be cleared during loading
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Error Consistency Across Methods', () => {
    it('should handle errors consistently across HTTP methods', async () => {
      const methods = [
        { button: 'GET Request', method: 'GET' },
        { button: 'POST Request', method: 'POST' },
        { button: 'PUT Request', method: 'PUT' },
        { button: 'DELETE Request', method: 'DELETE' },
      ];

      for (const { button, method } of methods) {
        cleanup.resetAll();
        apiErrors.serverError('test-endpoint', `${method} error`);

        renderWithProviders(<ApiErrorTestComponent />);

        await user.click(screen.getByText(button));

        await waitFor(() => {
          expect(screen.getByTestId('error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('error')).toHaveTextContent(`${method} error`);
      }
    });
  });
});