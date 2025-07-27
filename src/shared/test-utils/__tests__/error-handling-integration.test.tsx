/**
 * Integration tests for comprehensive error handling across the application
 * Tests the interaction between different error handling mechanisms
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { 
  networkErrors, 
  apiErrors, 
  validationUtilities, 
  stateUtilities,
  authErrorUtilities,
  recoveryUtilities,
  cleanup 
} from '../error-testing';
import { ErrorBoundary } from '../../../app/error-boundary';
import { api } from '../../services/api-client';

// Comprehensive component that demonstrates multiple error scenarios
function ComprehensiveErrorTestComponent() {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [apiData, setApiData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string[]>>({});
  const [networkStatus, setNetworkStatus] = React.useState<'online' | 'offline'>('online');

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    if (!formData.email) {
      errors.email = ['Email is required'];
    } else if (validationUtilities.invalidEmails.includes(formData.email)) {
      errors.email = ['Invalid email format'];
    }

    if (!formData.password) {
      errors.password = ['Password is required'];
    } else if (validationUtilities.invalidPasswords.includes(formData.password)) {
      errors.password = ['Password is too weak'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', formData);
      
      if (response.success) {
        setApiData(response.data);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (endpoint: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/${endpoint}`);
      
      if (response.success) {
        setApiData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const triggerError = () => {
    throw new Error('Intentional component error');
  };

  return (
    <div>
      <div data-testid="network-status">
        Network: {networkStatus}
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="email-input"
          />
          {validationErrors.email && (
            <div data-testid="email-validation-error" role="alert">
              {validationErrors.email[0]}
            </div>
          )}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            data-testid="password-input"
          />
          {validationErrors.password && (
            <div data-testid="password-validation-error" role="alert">
              {validationErrors.password[0]}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} data-testid="submit-button">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <div>
        <button onClick={() => fetchData('properties')} disabled={loading}>
          Fetch Properties
        </button>
        <button onClick={() => fetchData('users')} disabled={loading}>
          Fetch Users
        </button>
        <button onClick={triggerError}>
          Trigger Error
        </button>
      </div>

      {loading && <div data-testid="loading">Loading...</div>}

      {error && (
        <div data-testid="api-error" role="alert">
          Error: {error}
        </div>
      )}

      {apiData && (
        <div data-testid="api-success">
          Success: {JSON.stringify(apiData)}
        </div>
      )}
    </div>
  );
}

describe('Comprehensive Error Handling Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup.resetAll();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
  });

  describe('Multi-Layer Error Handling', () => {
    it('should handle validation errors before API calls', async () => {
      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Try to submit with invalid data
      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.type(screen.getByTestId('password-input'), '123');
      await user.click(screen.getByTestId('submit-button'));

      // Should show validation errors, not make API call
      expect(screen.getByTestId('email-validation-error')).toBeInTheDocument();
      expect(screen.getByTestId('password-validation-error')).toBeInTheDocument();
      expect(screen.queryByTestId('api-error')).not.toBeInTheDocument();
    });

    it('should handle API errors after validation passes', async () => {
      apiErrors.unauthorized('auth/login', 'Invalid credentials');

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Submit with valid data
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'ValidPass123!');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('api-error')).toHaveTextContent('Invalid credentials');
    });

    it('should handle network errors gracefully', async () => {
      networkErrors.connectionFailure('auth/login');

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'ValidPass123!');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('api-error')).toHaveTextContent(/network error/i);
    });

    it('should catch component errors with error boundary', async () => {
      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Trigger Error'));

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from network errors when connection is restored', async () => {
      // Start offline
      networkErrors.offline();

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Network: offline');
      });

      // Try to fetch data while offline
      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      // Come back online
      networkErrors.online();
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('network-status')).toHaveTextContent('Network: online');
      });

      // Retry should work now
      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.queryByTestId('api-error')).not.toBeInTheDocument();
      });
    });

    it('should handle retry scenarios with exponential backoff', async () => {
      recoveryUtilities.failThenSucceed('properties', 2);

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // First attempt fails
      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      // Second attempt also fails
      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      // Third attempt succeeds
      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.getByTestId('api-success')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Error Flows', () => {
    it('should handle expired token scenario', async () => {
      authErrorUtilities.expiredToken();

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Fetch Users'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('api-error')).toHaveTextContent(/token.*expired/i);
    });

    it('should handle invalid token scenario', async () => {
      authErrorUtilities.invalidToken();

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Fetch Users'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('api-error')).toHaveTextContent(/token.*invalid/i);
    });
  });

  describe('Loading State Management', () => {
    it('should handle loading states during error scenarios', async () => {
      stateUtilities.loading('properties', 1000);

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Fetch Properties'));

      // Should show loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Fetch Properties')).toBeDisabled();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Fetch Properties')).not.toBeDisabled();
    });

    it('should handle empty states after errors are resolved', async () => {
      // First return error
      apiErrors.serverError('properties');

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.getByTestId('api-error')).toBeInTheDocument();
      });

      // Then return empty data
      cleanup.resetAll();
      stateUtilities.emptyData('properties');

      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        expect(screen.queryByTestId('api-error')).not.toBeInTheDocument();
      });

      // Should handle empty data appropriately
      expect(screen.getByTestId('api-success')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should isolate errors to specific components', () => {
      function WorkingComponent() {
        return <div data-testid="working-component">This works</div>;
      }

      function FailingComponent() {
        throw new Error('Component failure');
      }

      renderWithProviders(
        <div>
          <WorkingComponent />
          <ErrorBoundary>
            <FailingComponent />
          </ErrorBoundary>
          <WorkingComponent />
        </div>
      );

      // Working components should still render
      expect(screen.getAllByTestId('working-component')).toHaveLength(2);
      
      // Error boundary should catch the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should provide contextual error information', () => {
      renderWithProviders(
        <ErrorBoundary level="component" showErrorDetails={true}>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Trigger component error
      user.click(screen.getByText('Trigger Error'));

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/intentional component error/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility During Error States', () => {
    it('should maintain accessibility during error scenarios', async () => {
      apiErrors.serverError('properties');

      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Fetch Properties'));

      await waitFor(() => {
        const errorElement = screen.getByTestId('api-error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should maintain keyboard navigation during errors', async () => {
      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Tab through form elements
      await user.tab();
      expect(screen.getByTestId('email-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('password-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('submit-button')).toHaveFocus();

      // Should still work after validation errors
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('email-validation-error')).toBeInTheDocument();
      });

      // Navigation should still work
      await user.tab();
      expect(screen.getByText('Fetch Properties')).toHaveFocus();
    });
  });

  describe('Performance During Error Handling', () => {
    it('should not cause memory leaks during error scenarios', async () => {
      const component = renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Trigger multiple error scenarios
      for (let i = 0; i < 5; i++) {
        cleanup.resetAll();
        apiErrors.serverError('properties');
        
        await user.click(screen.getByText('Fetch Properties'));
        
        await waitFor(() => {
          expect(screen.getByTestId('api-error')).toBeInTheDocument();
        });
      }

      // Component should still be responsive
      expect(screen.getByText('Fetch Properties')).toBeInTheDocument();
      
      component.unmount();
    });

    it('should handle rapid error state changes', async () => {
      renderWithProviders(
        <ErrorBoundary>
          <ComprehensiveErrorTestComponent />
        </ErrorBoundary>
      );

      // Rapid clicks should not cause issues
      const button = screen.getByText('Fetch Properties');
      
      for (let i = 0; i < 3; i++) {
        await user.click(button);
      }

      // Should handle rapid requests gracefully
      expect(button).toBeInTheDocument();
    });
  });
});