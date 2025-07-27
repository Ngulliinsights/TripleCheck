/**
 * Network failure scenarios and offline functionality tests
 * Tests network timeouts, connection failures, intermittent issues, and offline mode
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { networkErrors, cleanup } from '../error-testing';
import { api } from '../../services/api-client';

// Mock component that makes API calls
function NetworkTestComponent() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/test-endpoint');
      if (response.success && response.data) {
        setData(response.data);
      } else {
        // Handle both API errors and error responses
        setError(response.error || response.message || 'Request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const retryRequest = () => {
    fetchData();
  };

  return (
    <div>
      <div data-testid="online-status">
        Status: {isOnline ? 'Online' : 'Offline'}
      </div>
      
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      
      <button onClick={retryRequest} disabled={loading}>
        Retry
      </button>
      
      {loading && <div data-testid="loading">Loading...</div>}
      
      {error && (
        <div data-testid="error" role="alert">
          Error: {error}
        </div>
      )}
      
      {data && (
        <div data-testid="success">
          Data: {JSON.stringify(data)}
        </div>
      )}
    </div>
  );
}

describe('Network Error Handling', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup.resetAll();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
  });

  describe('Network Timeout Scenarios', () => {
    it('should handle request timeout gracefully', async () => {
      networkErrors.timeout('test-endpoint', 1000);

      renderWithProviders(<NetworkTestComponent />);

      await user.click(screen.getByText('Fetch Data'));

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for timeout
      await waitFor(
        () => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent(/timeout|took too long/i);
    });

    it('should allow retry after timeout', async () => {
      networkErrors.timeout('test-endpoint', 500);

      renderWithProviders(<NetworkTestComponent />);

      // First request times out
      await user.click(screen.getByText('Fetch Data'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Setup successful response for retry
      cleanup.resetAll();

      // Retry should work
      await user.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      });
    });

    it('should show appropriate loading states during timeout', async () => {
      networkErrors.timeout('test-endpoint', 1000);

      renderWithProviders(<NetworkTestComponent />);

      await user.click(screen.getByText('Fetch Data'));

      // Should show loading immediately
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      
      // Button should be disabled during loading
      expect(screen.getByText('Loading...')).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Button should be enabled again after timeout
      expect(screen.getByText('Fetch Data')).not.toBeDisabled();
    });
  });

  describe('Connection Failure Scenarios', () => {
    it('should handle complete connection failure', async () => {
      networkErrors.connectionFailure('test-endpoint');

      renderWithProviders(<NetworkTestComponent />);

      await user.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(/network error/i);
    });

    it('should handle intermittent connection issues', async () => {
      networkErrors.intermittent('test-endpoint', 0.8); // 80% failure rate

      renderWithProviders(<NetworkTestComponent />);

      let successCount = 0;
      let errorCount = 0;

      // Try multiple requests to test intermittent behavior
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('Fetch Data'));
        
        await waitFor(() => {
          const error = screen.queryByTestId('error');
          const success = screen.queryByTestId('success');
          
          if (error) errorCount++;
          if (success) successCount++;
          
          return error || success;
        });

        // Clear state for next iteration
        cleanup.resetAll();
        networkErrors.intermittent('test-endpoint', 0.8);
      }

      // With 80% failure rate, we should see some failures
      expect(errorCount).toBeGreaterThan(0);
    });
  });

  describe('Offline Mode Handling', () => {
    it('should detect offline status', async () => {
      renderWithProviders(<NetworkTestComponent />);

      expect(screen.getByTestId('online-status')).toHaveTextContent('Status: Online');

      act(() => {
        networkErrors.offline();
      });

      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('Status: Offline');
      });
    });

    it('should handle API calls when offline', async () => {
      networkErrors.offline();

      renderWithProviders(<NetworkTestComponent />);

      await user.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error')).toHaveTextContent(/network error/i);
    });

    it('should recover when coming back online', async () => {
      renderWithProviders(<NetworkTestComponent />);

      // Go offline
      act(() => {
        networkErrors.offline();
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('Status: Offline');
      });

      // Try request while offline
      await user.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Come back online
      act(() => {
        networkErrors.online();
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('Status: Online');
      });

      // Retry should work now
      await user.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Network Error Recovery', () => {
    it('should provide clear error messages for different network issues', async () => {
      const testCases = [
        {
          setup: () => networkErrors.timeout('test-endpoint'),
          expectedMessage: /timeout|took too long/i,
        },
        {
          setup: () => networkErrors.connectionFailure('test-endpoint'),
          expectedMessage: /network error/i,
        },
      ];

      for (const testCase of testCases) {
        cleanup.resetAll();
        testCase.setup();

        renderWithProviders(<NetworkTestComponent />);

        await user.click(screen.getByText('Fetch Data'));

        await waitFor(() => {
          expect(screen.getByTestId('error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('error')).toHaveTextContent(testCase.expectedMessage);
      }
    });

    it('should allow multiple retry attempts', async () => {
      networkErrors.connectionFailure('test-endpoint');

      renderWithProviders(<NetworkTestComponent />);

      // First attempt fails
      await user.click(screen.getByText('Fetch Data'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Second attempt also fails
      await user.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Fix network and retry should succeed
      cleanup.resetAll();
      
      await user.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('error')).not.toBeInTheDocument();
      });
    });

    it('should maintain UI state during network errors', async () => {
      networkErrors.connectionFailure('test-endpoint');

      renderWithProviders(<NetworkTestComponent />);

      // Initial state
      expect(screen.getByText('Fetch Data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();

      await user.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // UI should still be functional
      expect(screen.getByText('Fetch Data')).not.toBeDisabled();
      expect(screen.getByText('Retry')).not.toBeDisabled();
    });
  });

  describe('Accessibility During Network Errors', () => {
    it('should announce errors to screen readers', async () => {
      networkErrors.connectionFailure('test-endpoint');

      renderWithProviders(<NetworkTestComponent />);

      await user.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        const errorElement = screen.getByTestId('error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should maintain keyboard navigation during errors', async () => {
      networkErrors.connectionFailure('test-endpoint');

      renderWithProviders(<NetworkTestComponent />);

      // Tab to fetch button
      await user.tab();
      expect(screen.getByText('Fetch Data')).toHaveFocus();

      // Trigger error
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Should still be able to navigate
      await user.tab();
      expect(screen.getByText('Retry')).toHaveFocus();
    });
  });
});