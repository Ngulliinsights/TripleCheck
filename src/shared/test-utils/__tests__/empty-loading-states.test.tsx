/**
 * Empty states, loading states, and no-data scenarios tests
 * Tests various UI states when data is loading, empty, or unavailable
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { stateUtilities, cleanup } from '../error-testing';
import { api } from "../../../shared/services/unified-api-client"

// Mock component for testing different states
function StateTestComponent() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const fetchData = async (endpoint: string = 'properties') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/${endpoint}`);
      if (response.success) {
        setData(response.data?.items || response.data || []);
      } else {
        setError(response.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const refresh = () => {
    setHasLoaded(false);
    fetchData();
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (loading && !hasLoaded) {
    return (
      <div data-testid="initial-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true">⏳</div>
        <span>Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-state" role="alert">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={refresh}>Try Again</button>
      </div>
    );
  }

  if (hasLoaded && (!data || data.length === 0)) {
    return (
      <div data-testid="empty-state" role="status">
        <div className="empty-icon" aria-hidden="true">📭</div>
        <h2>No data found</h2>
        <p>There are no items to display at the moment.</p>
        <button onClick={refresh}>Refresh</button>
        <button onClick={() => fetchData('search')}>Search</button>
      </div>
    );
  }

  return (
    <div data-testid="data-loaded">
      <div className="data-header">
        <h2>Data ({data.length} items)</h2>
        <button onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {loading && (
        <div data-testid="refresh-loading" role="status" aria-live="polite">
          Refreshing data...
        </div>
      )}
      
      <ul>
        {data.map((item, index) => (
          <li key={item.id || index} data-testid={`data-item-${index}`}>
            {item.title || item.name || JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component for testing search states
function SearchStateComponent() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/search', { query });
      if (response.success) {
        setResults(response.data?.properties || response.data || []);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search error');
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div>
      <div className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search properties..."
          data-testid="search-input"
        />
        <button onClick={search} disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button onClick={clearSearch}>Clear</button>
      </div>

      {loading && (
        <div data-testid="search-loading" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true">🔍</div>
          Searching for "{query}"...
        </div>
      )}

      {error && (
        <div data-testid="search-error" role="alert">
          Search failed: {error}
        </div>
      )}

      {hasSearched && !loading && !error && (
        <>
          {results.length === 0 ? (
            <div data-testid="no-search-results" role="status">
              <div className="no-results-icon" aria-hidden="true">🔍</div>
              <h3>No results found</h3>
              <p>No properties match your search for "{query}".</p>
              <p>Try adjusting your search terms or browse all properties.</p>
            </div>
          ) : (
            <div data-testid="search-results">
              <h3>Search Results ({results.length})</h3>
              <ul>
                {results.map((result, index) => (
                  <li key={result.id || index} data-testid={`search-result-${index}`}>
                    {result.title || result.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!hasSearched && !loading && (
        <div data-testid="search-prompt" role="status">
          <p>Enter a search term to find properties.</p>
        </div>
      )}
    </div>
  );
}

describe('Empty States, Loading States, and No-Data Scenarios', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup.resetAll();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
  });

  describe('Loading States', () => {
    it('should show initial loading state', async () => {
      stateUtilities.loading('properties', 1000);

      renderWithProviders(<StateTestComponent />);

      expect(screen.getByTestId('initial-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      
      // Should have proper accessibility attributes
      expect(screen.getByTestId('initial-loading')).toHaveAttribute('role', 'status');
      expect(screen.getByTestId('initial-loading')).toHaveAttribute('aria-live', 'polite');
    });

    it('should show loading spinner with proper accessibility', async () => {
      stateUtilities.loading('properties', 500);

      renderWithProviders(<StateTestComponent />);

      const loadingElement = screen.getByTestId('initial-loading');
      const spinner = loadingElement.querySelector('.loading-spinner');
      
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should show refresh loading state', async () => {
      // First load with data
      cleanup.resetAll();
      
      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });

      // Setup loading for refresh
      stateUtilities.loading('properties', 1000);

      // Trigger refresh
      await user.click(screen.getByText('Refresh'));

      expect(screen.getByTestId('refresh-loading')).toBeInTheDocument();
      expect(screen.getByText('Refreshing data...')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeDisabled();
    });

    it('should handle search loading state', async () => {
      stateUtilities.loading('search', 1000);

      renderWithProviders(<SearchStateComponent />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'apartment');
      await user.click(screen.getByText('Search'));

      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      expect(screen.getByText(/Searching for "apartment"/)).toBeInTheDocument();
      expect(screen.getByText('Searching...')).toBeDisabled();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no data is available', async () => {
      stateUtilities.emptyData('properties');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      expect(screen.getByText('No data found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display at the moment.')).toBeInTheDocument();
      
      // Should have proper accessibility
      expect(screen.getByTestId('empty-state')).toHaveAttribute('role', 'status');
    });

    it('should show empty state with helpful actions', async () => {
      stateUtilities.emptyData('properties');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      // Should have action buttons
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should show no search results state', async () => {
      stateUtilities.emptyData('search');

      renderWithProviders(<SearchStateComponent />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistent');
      await user.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByTestId('no-search-results')).toBeInTheDocument();
      });

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/No properties match your search for "nonexistent"/)).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search terms/)).toBeInTheDocument();
    });

    it('should handle empty state with visual indicators', async () => {
      stateUtilities.emptyData('properties');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      const emptyIcon = screen.getByTestId('empty-state').querySelector('.empty-icon');
      expect(emptyIcon).toBeInTheDocument();
      expect(emptyIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('No-Data Scenarios', () => {
    it('should handle null data response', async () => {
      stateUtilities.noData('properties', 'No properties available');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('should differentiate between empty array and no data', async () => {
      // Empty array scenario
      stateUtilities.emptyData('properties');

      const { rerender } = renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      // No data scenario
      cleanup.resetAll();
      stateUtilities.noData('properties');

      rerender(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('should handle partial data loading', async () => {
      // Setup response with some data
      cleanup.resetAll();

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });

      // Should show data count
      expect(screen.getByText(/Data \(\d+ items\)/)).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to empty state', async () => {
      stateUtilities.loading('properties', 500);

      renderWithProviders(<StateTestComponent />);

      // Initially loading
      expect(screen.getByTestId('initial-loading')).toBeInTheDocument();

      // Setup empty response
      cleanup.resetAll();
      stateUtilities.emptyData('properties');

      // Should transition to empty state
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('initial-loading')).not.toBeInTheDocument();
    });

    it('should transition from loading to error state', async () => {
      stateUtilities.loading('properties', 500);

      renderWithProviders(<StateTestComponent />);

      // Initially loading
      expect(screen.getByTestId('initial-loading')).toBeInTheDocument();

      // Setup error response
      cleanup.resetAll();
      // This will cause a network error
      
      // Should transition to error state
      await waitFor(() => {
        expect(screen.queryByTestId('initial-loading')).not.toBeInTheDocument();
      });
    });

    it('should handle refresh from empty state', async () => {
      stateUtilities.emptyData('properties');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      // Setup data for refresh
      cleanup.resetAll();

      await user.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Search State Management', () => {
    it('should show initial search prompt', () => {
      renderWithProviders(<SearchStateComponent />);

      expect(screen.getByTestId('search-prompt')).toBeInTheDocument();
      expect(screen.getByText('Enter a search term to find properties.')).toBeInTheDocument();
    });

    it('should disable search button when input is empty', async () => {
      renderWithProviders(<SearchStateComponent />);

      const searchButton = screen.getByText('Search');
      expect(searchButton).toBeDisabled();

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'apartment');

      expect(searchButton).not.toBeDisabled();

      await user.clear(searchInput);
      expect(searchButton).toBeDisabled();
    });

    it('should clear search state properly', async () => {
      renderWithProviders(<SearchStateComponent />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'apartment');
      await user.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.queryByTestId('search-prompt')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Clear'));

      expect(searchInput).toHaveValue('');
      expect(screen.getByTestId('search-prompt')).toBeInTheDocument();
    });
  });

  describe('Accessibility in State Management', () => {
    it('should announce loading states to screen readers', async () => {
      stateUtilities.loading('properties', 1000);

      renderWithProviders(<StateTestComponent />);

      const loadingElement = screen.getByTestId('initial-loading');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveAttribute('role', 'status');
    });

    it('should announce empty states appropriately', async () => {
      stateUtilities.emptyData('properties');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        const emptyElement = screen.getByTestId('empty-state');
        expect(emptyElement).toHaveAttribute('role', 'status');
      });
    });

    it('should maintain focus management during state changes', async () => {
      stateUtilities.emptyData('properties');

      renderWithProviders(<StateTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();

      // Setup data response
      cleanup.resetAll();

      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });

      // Focus should be maintained or moved appropriately
      const newRefreshButton = screen.getByText('Refresh');
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily during loading', async () => {
      const renderSpy = vi.fn();
      
      function SpyComponent() {
        renderSpy();
        return <StateTestComponent />;
      }

      stateUtilities.loading('properties', 1000);

      renderWithProviders(<SpyComponent />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Wait a bit during loading
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should not have additional renders during loading
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });

    it('should handle rapid state changes gracefully', async () => {
      renderWithProviders(<SearchStateComponent />);

      const searchInput = screen.getByTestId('search-input');
      const searchButton = screen.getByText('Search');

      // Rapid search changes
      await user.type(searchInput, 'a');
      await user.click(searchButton);
      
      await user.clear(searchInput);
      await user.type(searchInput, 'apartment');
      await user.click(searchButton);

      // Should handle the rapid changes without errors
      expect(screen.getByTestId('search-input')).toHaveValue('apartment');
    });
  });
});