/**
 * Demonstration of error handling and edge case testing utilities
 * Shows how to use the error testing utilities effectively
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { 
  networkErrors, 
  apiErrors, 
  stateUtilities,
  authErrorUtilities,
  cleanup 
} from '../error-testing';
import { ErrorBoundary } from '../../../app/error-boundary';

// Simple demo component for testing error scenarios
function ErrorDemoComponent() {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');

  const simulateNetworkRequest = async () => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('Request successful');
      } else {
        setStatus('error');
        setMessage(data.message || 'Request failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred');
    }
  };

  const throwError = () => {
    throw new Error('Component error for testing');
  };

  return (
    <div>
      <h2>Error Handling Demo</h2>
      
      <div data-testid="status">Status: {status}</div>
      
      {message && (
        <div data-testid="message" role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </div>
      )}
      
      <div>
        <button onClick={simulateNetworkRequest} disabled={status === 'loading'}>
          {status === 'loading' ? 'Loading...' : 'Make Request'}
        </button>
        
        <button onClick={throwError}>
          Throw Error
        </button>
      </div>
      
      {status === 'loading' && (
        <div data-testid="loading-indicator">
          Loading...
        </div>
      )}
    </div>
  );
}

describe('Error Handling Demo Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup.resetAll();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
  });

  describe('Network Error Scenarios', () => {
    it('should handle 500 server errors', async () => {
      apiErrors.serverError('test', 'Database connection failed');

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      expect(screen.getByTestId('status')).toHaveTextContent('Status: loading');

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
      });

      expect(screen.getByTestId('message')).toHaveTextContent('Database connection failed');
      expect(screen.getByTestId('message')).toHaveAttribute('role', 'alert');
    });

    it('should handle 404 not found errors', async () => {
      apiErrors.notFound('test', 'Resource');

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
      });

      expect(screen.getByTestId('message')).toHaveTextContent('Resource not found');
    });

    it('should handle authentication errors', async () => {
      authErrorUtilities.expiredToken();

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
      });

      expect(screen.getByTestId('message')).toHaveTextContent(/token.*expired/i);
    });

    it('should handle network connection failures', async () => {
      networkErrors.connectionFailure('test');

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
      });

      expect(screen.getByTestId('message')).toHaveTextContent('Network error occurred');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during requests', async () => {
      stateUtilities.loading('test', 1000);

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      // Should immediately show loading state
      expect(screen.getByTestId('status')).toHaveTextContent('Status: loading');
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeDisabled();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: success');
      }, { timeout: 2000 });

      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      expect(screen.getByText('Make Request')).not.toBeDisabled();
    });

    it('should handle empty data responses', async () => {
      stateUtilities.emptyData('test');

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: success');
      });

      expect(screen.getByTestId('message')).toHaveTextContent('Request successful');
    });
  });

  describe('Error Boundaries', () => {
    it('should catch component errors', async () => {
      renderWithProviders(
        <ErrorBoundary>
          <ErrorDemoComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Throw Error'));

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/component error for testing/i)).toBeInTheDocument();
    });

    it('should provide retry functionality', async () => {
      renderWithProviders(
        <ErrorBoundary>
          <ErrorDemoComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Throw Error'));

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);

      // After retry, component should be restored
      await waitFor(() => {
        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Error Handling Demo')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after network errors', async () => {
      // First request fails
      apiErrors.serverError('test');

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
      });

      // Fix the error and retry
      cleanup.resetAll();

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: success');
      });

      expect(screen.getByTestId('message')).toHaveTextContent('Request successful');
    });

    it('should handle multiple error types in sequence', async () => {
      renderWithProviders(<ErrorDemoComponent />);

      // Test 500 error
      apiErrors.serverError('test', 'Server error');
      await user.click(screen.getByText('Make Request'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Server error');
      });

      // Test 404 error
      cleanup.resetAll();
      apiErrors.notFound('test', 'Item');
      await user.click(screen.getByText('Make Request'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Item not found');
      });

      // Test success
      cleanup.resetAll();
      await user.click(screen.getByText('Make Request'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Request successful');
      });
    });
  });

  describe('Accessibility During Errors', () => {
    it('should announce errors to screen readers', async () => {
      apiErrors.serverError('test', 'Accessibility test error');

      renderWithProviders(<ErrorDemoComponent />);

      await user.click(screen.getByText('Make Request'));

      await waitFor(() => {
        const messageElement = screen.getByTestId('message');
        expect(messageElement).toHaveAttribute('role', 'alert');
        expect(messageElement).toHaveTextContent('Accessibility test error');
      });
    });

    it('should maintain keyboard navigation during errors', async () => {
      apiErrors.serverError('test');

      renderWithProviders(<ErrorDemoComponent />);

      // Tab to the button
      await user.tab();
      expect(screen.getByText('Make Request')).toHaveFocus();

      // Trigger error
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
      });

      // Should still be able to navigate
      await user.tab();
      expect(screen.getByText('Throw Error')).toHaveFocus();
    });
  });

  describe('Performance During Errors', () => {
    it('should handle rapid error scenarios without issues', async () => {
      renderWithProviders(<ErrorDemoComponent />);

      // Rapid clicks with different error types
      const scenarios = [
        () => apiErrors.serverError('test'),
        () => apiErrors.notFound('test'),
        () => authErrorUtilities.expiredToken(),
      ];

      for (let i = 0; i < scenarios.length; i++) {
        cleanup.resetAll();
        scenarios[i]();
        
        await user.click(screen.getByText('Make Request'));
        
        await waitFor(() => {
          expect(screen.getByTestId('status')).toHaveTextContent('Status: error');
        });
      }

      // Component should still be responsive
      expect(screen.getByText('Make Request')).toBeInTheDocument();
    });
  });
});