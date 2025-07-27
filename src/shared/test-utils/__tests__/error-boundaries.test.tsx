/**
 * Error boundaries and graceful degradation tests
 * Tests error boundary components and their fallback UI behavior
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { errorBoundaryUtilities, cleanup } from '../error-testing';
import { ErrorBoundary } from '../../../app/error-boundary';
import { QueryErrorBoundary } from '../../../shared/components/QueryErrorBoundary';

const { ThrowingComponent, AsyncThrowingComponent, mockConsoleError } = errorBoundaryUtilities;

// Component that conditionally throws errors
function ConditionalErrorComponent({ shouldThrow = false, errorType = 'sync' }: {
  shouldThrow?: boolean;
  errorType?: 'sync' | 'async' | 'render' | 'effect';
}) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (shouldThrow && errorType === 'effect') {
      throw new Error('Effect error');
    }
  }, [shouldThrow, errorType]);

  React.useEffect(() => {
    if (shouldThrow && errorType === 'async') {
      setTimeout(() => {
        throw new Error('Async error in effect');
      }, 100);
    }
  }, [shouldThrow, errorType]);

  if (shouldThrow && errorType === 'render') {
    throw new Error('Render error');
  }

  const handleClick = () => {
    if (shouldThrow && errorType === 'sync') {
      throw new Error('Click handler error');
    }
    setCount(c => c + 1);
  };

  return (
    <div>
      <button onClick={handleClick} data-testid="trigger-button">
        Click me ({count})
      </button>
      <div data-testid="component-content">Component is working</div>
    </div>
  );
}

// Component that simulates network errors
function NetworkErrorComponent({ shouldFail = false }: { shouldFail?: boolean }) {
  const [data, setData] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (shouldFail) {
      setError('Network request failed');
    } else {
      setData('Data loaded successfully');
    }
  }, [shouldFail]);

  if (error) {
    throw new Error(error);
  }

  return (
    <div data-testid="network-component">
      {data || 'Loading...'}
    </div>
  );
}

// Custom error boundary for testing
function CustomErrorBoundary({ 
  children, 
  fallback,
  onError 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}) {
  return (
    <ErrorBoundary 
      fallback={fallback}
      onError={onError}
      showErrorDetails={true}
      level="component"
    >
      {children}
    </ErrorBoundary>
  );
}

describe('Error Boundaries and Graceful Degradation', () => {
  const user = userEvent.setup();
  let consoleErrorMock: ReturnType<typeof mockConsoleError>;

  beforeEach(() => {
    cleanup.resetAll();
    consoleErrorMock = mockConsoleError();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
    consoleErrorMock.restore();
  });

  describe('Basic Error Boundary Functionality', () => {
    it('should catch and display render errors', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Test render error" />
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/test render error/i)).toBeInTheDocument();
    });

    it('should render children normally when no error occurs', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </CustomErrorBoundary>
      );

      expect(screen.getByTestId('no-error')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should catch errors from nested components', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <div>
            <h1>Parent Component</h1>
            <div>
              <ThrowingComponent shouldThrow={true} errorMessage="Nested component error" />
            </div>
          </div>
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/nested component error/i)).toBeInTheDocument();
    });

    it('should display custom fallback UI when provided', () => {
      const customFallback = (
        <div data-testid="custom-fallback">
          <h2>Custom Error Message</h2>
          <p>Something went wrong in our custom way</p>
        </div>
      );

      renderWithProviders(
        <CustomErrorBoundary fallback={customFallback}>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Recovery', () => {
    it('should allow retry after error', async () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ConditionalErrorComponent shouldThrow={true} errorType="render" />
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);

      // After retry, the error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
      });
    });

    it('should handle page reload option', async () => {
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      const reloadButton = screen.getByText(/reload page/i);
      await user.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });

    it('should prevent infinite retry loops', async () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ConditionalErrorComponent shouldThrow={true} errorType="render" />
        </CustomErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);

      // Click retry multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(retryButton);
        await waitFor(() => {
          expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        });
      }

      // After max retries, button should be disabled
      await waitFor(() => {
        expect(retryButton).toBeDisabled();
      });

      expect(screen.getByText(/max retries reached/i)).toBeInTheDocument();
    });
  });

  describe('Query Error Boundary', () => {
    it('should handle React Query errors', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Query error" />
        </QueryErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/query error/i)).toBeInTheDocument();
    });

    it('should provide query-specific error actions', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </QueryErrorBoundary>
      );

      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.getByText(/reload page/i)).toBeInTheDocument();
    });

    it('should reset query errors properly', async () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ConditionalErrorComponent shouldThrow={true} errorType="render" />
        </QueryErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByText(/try again/i);
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Types and Messages', () => {
    it('should provide user-friendly messages for different error types', () => {
      const errorTypes = [
        { error: 'ChunkLoadError: Loading chunk failed', expected: /failed to load page resources/i },
        { error: 'Network Error: fetch failed', expected: /network connection issue/i },
        { error: 'TypeError: Cannot read property', expected: /issue loading the page data/i },
        { error: '404 Not Found', expected: /requested page.*could not be found/i },
        { error: 'Permission denied', expected: /don\'t have permission/i },
      ];

      errorTypes.forEach(({ error, expected }) => {
        const { unmount } = renderWithProviders(
          <CustomErrorBoundary>
            <ThrowingComponent shouldThrow={true} errorMessage={error} />
          </CustomErrorBoundary>
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('should provide helpful suggestions for different error types', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="ChunkLoadError: Loading chunk failed" />
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/refresh the page to load the latest version/i)).toBeInTheDocument();
      expect(screen.getByText(/clear your browser cache/i)).toBeInTheDocument();
    });

    it('should show technical details in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Development error" />
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/technical details/i)).toBeInTheDocument();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Boundary Accessibility', () => {
    it('should announce errors to screen readers', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      const errorElement = screen.getByText(/something went wrong/i).closest('[role="alert"]');
      expect(errorElement).toBeInTheDocument();
    });

    it('should maintain keyboard navigation in error state', async () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);
      const reloadButton = screen.getByText(/reload page/i);

      // Should be able to navigate between buttons
      await user.tab();
      expect(retryButton).toHaveFocus();

      await user.tab();
      expect(reloadButton).toHaveFocus();
    });

    it('should provide accessible button labels', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);
      const reloadButton = screen.getByText(/reload page/i);

      expect(retryButton).toHaveAccessibleName();
      expect(reloadButton).toHaveAccessibleName();
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should call custom error handler when provided', () => {
      const onErrorMock = vi.fn();

      renderWithProviders(
        <CustomErrorBoundary onError={onErrorMock}>
          <ThrowingComponent shouldThrow={true} errorMessage="Custom handler test" />
        </CustomErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom handler test'
        }),
        expect.any(Object)
      );
    });

    it('should log errors to console', () => {
      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Console log test" />
        </CustomErrorBoundary>
      );

      expect(consoleErrorMock.mockError).toHaveBeenCalled();
    });

    it('should generate unique error IDs', () => {
      const { unmount } = renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      const firstErrorId = screen.getByText(/error id:/i).textContent;
      unmount();

      renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      const secondErrorId = screen.getByText(/error id:/i).textContent;

      expect(firstErrorId).not.toBe(secondErrorId);
    });
  });

  describe('Graceful Degradation', () => {
    it('should isolate errors to specific components', () => {
      renderWithProviders(
        <div>
          <div data-testid="working-component">This component works</div>
          <CustomErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </CustomErrorBoundary>
          <div data-testid="another-working-component">This also works</div>
        </div>
      );

      // Working components should still be visible
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.getByTestId('another-working-component')).toBeInTheDocument();

      // Error boundary should show error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should handle partial page failures', () => {
      renderWithProviders(
        <div>
          <header data-testid="header">Header</header>
          <main>
            <CustomErrorBoundary>
              <ThrowingComponent shouldThrow={true} />
            </CustomErrorBoundary>
          </main>
          <footer data-testid="footer">Footer</footer>
        </div>
      );

      // Header and footer should remain functional
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      // Main content shows error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should provide fallback content for failed features', () => {
      const fallbackContent = (
        <div data-testid="fallback-content">
          <p>This feature is temporarily unavailable.</p>
          <button>Use alternative feature</button>
        </div>
      );

      renderWithProviders(
        <CustomErrorBoundary fallback={fallbackContent}>
          <NetworkErrorComponent shouldFail={true} />
        </CustomErrorBoundary>
      );

      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
      expect(screen.getByText('This feature is temporarily unavailable.')).toBeInTheDocument();
      expect(screen.getByText('Use alternative feature')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Nesting', () => {
    it('should handle nested error boundaries', () => {
      renderWithProviders(
        <CustomErrorBoundary fallback={<div data-testid="outer-error">Outer error</div>}>
          <div>
            <CustomErrorBoundary fallback={<div data-testid="inner-error">Inner error</div>}>
              <ThrowingComponent shouldThrow={true} />
            </CustomErrorBoundary>
          </div>
        </CustomErrorBoundary>
      );

      // Inner error boundary should catch the error
      expect(screen.getByTestId('inner-error')).toBeInTheDocument();
      expect(screen.queryByTestId('outer-error')).not.toBeInTheDocument();
    });

    it('should bubble errors when inner boundary fails', () => {
      // Create a boundary that throws in its error handling
      function FailingErrorBoundary({ children }: { children: React.ReactNode }) {
        return (
          <ErrorBoundary 
            fallback={<ThrowingComponent shouldThrow={true} errorMessage="Boundary error" />}
          >
            {children}
          </ErrorBoundary>
        );
      }

      renderWithProviders(
        <CustomErrorBoundary fallback={<div data-testid="outer-error">Outer caught error</div>}>
          <FailingErrorBoundary>
            <ThrowingComponent shouldThrow={true} />
          </FailingErrorBoundary>
        </CustomErrorBoundary>
      );

      // Outer boundary should catch the error from the failing inner boundary
      expect(screen.getByTestId('outer-error')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from transient errors', async () => {
      function TransientErrorComponent() {
        const [shouldError, setShouldError] = React.useState(true);

        React.useEffect(() => {
          const timer = setTimeout(() => setShouldError(false), 1000);
          return () => clearTimeout(timer);
        }, []);

        if (shouldError) {
          throw new Error('Transient error');
        }

        return <div data-testid="recovered">Component recovered</div>;
      }

      renderWithProviders(
        <CustomErrorBoundary>
          <TransientErrorComponent />
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const retryButton = screen.getByText(/try again/i);
      
      // Wait for the transient error to resolve
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('recovered')).toBeInTheDocument();
      });
    });

    it('should handle component remounting after error', async () => {
      function RemountTestComponent({ key }: { key: string }) {
        return (
          <div data-testid={`component-${key}`}>
            Component {key}
          </div>
        );
      }

      const { rerender } = renderWithProviders(
        <CustomErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </CustomErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Remount with different component
      rerender(
        <CustomErrorBoundary>
          <RemountTestComponent key="new" />
        </CustomErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('component-new')).toBeInTheDocument();
      });

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });
});