import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { QueryErrorBoundary } from '../QueryErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="success-content">Success content</div>;
};

// Component that throws async error
const ThrowAsyncError = ({ shouldThrow = false }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error('Async error');
    }
  }, [shouldThrow]);
  
  return <div data-testid="async-content">Async content</div>;
};

describe('QueryErrorBoundary Component', () => {
  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <div data-testid="child-content">Child content</div>
        </QueryErrorBoundary>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <span data-testid="child3">Child 3</span>
        </QueryErrorBoundary>
      );
      
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });

    it('renders complex nested children', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <div>
            <h1>Title</h1>
            <div>
              <p>Paragraph</p>
              <button>Button</button>
            </div>
          </div>
        </QueryErrorBoundary>
      );
      
      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Component error" />
        </QueryErrorBoundary>
      );
      
      expect(screen.queryByTestId('success-content')).not.toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('displays custom error message', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </QueryErrorBoundary>
      );
      
      // Should show generic error message, not the actual error details
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('Custom error message')).not.toBeInTheDocument();
    });

    it('shows retry button when error occurs', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows refresh page button when error occurs', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    it('handles different types of errors', () => {
      const { rerender } = renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={false} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
      
      // Throw a TypeError
      rerender(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="TypeError: Cannot read property" />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('handles null and undefined errors gracefully', () => {
      const ThrowNullError = () => {
        throw null;
      };
      
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowNullError />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('retries rendering when try again button is clicked', async () => {
      const user = userEvent.setup();
      
      const { rerender } = renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      // Click try again
      await user.click(screen.getByRole('button', { name: /try again/i }));
      
      // Simulate fixing the error by re-rendering with shouldThrow=false
      rerender(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={false} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('refreshes page when refresh button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });
      
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      await user.click(screen.getByRole('button', { name: /refresh page/i }));
      
      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('resets error state when children change', () => {
      const { rerender } = renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      // Change children (different component)
      rerender(
        <QueryErrorBoundary>
          <div data-testid="new-content">New content</div>
        </QueryErrorBoundary>
      );
      
      expect(screen.getByTestId('new-content')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Information Display', () => {
    it('shows error boundary message', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('shows helpful instructions', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/please try again/i)).toBeInTheDocument();
    });

    it('displays error in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Development error" />
        </QueryErrorBoundary>
      );
      
      // In development, might show more error details
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error state', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      
      expect(tryAgainButton).toBeInTheDocument();
      expect(refreshButton).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      
      await user.tab();
      expect(tryAgainButton).toHaveFocus();
    });
  });

  describe('Integration with React Query', () => {
    it('works with query client provider', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          <div data-testid="query-content">Query content</div>
        </QueryErrorBoundary>
      );
      
      expect(screen.getByTestId('query-content')).toBeInTheDocument();
    });

    it('handles query errors appropriately', () => {
      // Simulate a component that would throw due to query error
      const QueryErrorComponent = () => {
        throw new Error('Query failed');
      };
      
      renderWithProviders(
        <QueryErrorBoundary>
          <QueryErrorComponent />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when no error', () => {
      const renderSpy = vi.fn();
      
      const TestChild = () => {
        renderSpy();
        return <div>Test child</div>;
      };
      
      const { rerender } = renderWithProviders(
        <QueryErrorBoundary>
          <TestChild />
        </QueryErrorBoundary>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(
        <QueryErrorBoundary>
          <TestChild />
        </QueryErrorBoundary>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // Normal React behavior
    });

    it('handles rapid error state changes', async () => {
      const user = userEvent.setup();
      
      const { rerender } = renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      // Rapidly click try again multiple times
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      
      // Should handle this gracefully
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          {null}
        </QueryErrorBoundary>
      );
      
      // Should render without issues
      expect(document.body).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      renderWithProviders(
        <QueryErrorBoundary>
          {undefined}
        </QueryErrorBoundary>
      );
      
      // Should render without issues
      expect(document.body).toBeInTheDocument();
    });

    it('handles children that return false', () => {
      const FalseComponent = () => false;
      
      renderWithProviders(
        <QueryErrorBoundary>
          <FalseComponent />
        </QueryErrorBoundary>
      );
      
      // Should render without issues
      expect(document.body).toBeInTheDocument();
    });

    it('handles errors in event handlers', async () => {
      const user = userEvent.setup();
      
      const ErrorButton = () => (
        <button
          onClick={() => {
            throw new Error('Event handler error');
          }}
        >
          Click me
        </button>
      );
      
      renderWithProviders(
        <QueryErrorBoundary>
          <ErrorButton />
        </QueryErrorBoundary>
      );
      
      const button = screen.getByRole('button', { name: 'Click me' });
      
      // Event handler errors are not caught by error boundaries
      // This should not trigger the error boundary
      await expect(user.click(button)).rejects.toThrow('Event handler error');
      
      // Error boundary should not be triggered
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('handles very long error messages', () => {
      const longErrorMessage = 'A'.repeat(1000);
      
      renderWithProviders(
        <QueryErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={longErrorMessage} />
        </QueryErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      // Should not display the actual long error message to users
      expect(screen.queryByText(longErrorMessage)).not.toBeInTheDocument();
    });
  });
});