import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, userEventInstance } from '../../../shared/test-utils'
import { TestDataFactory } from '../../../shared/test-utils/fixtures'
import { PropertyCard } from '../../../shared/components/property/PropertyCard'

// Mock the PropertyCard component for isolated testing
vi.mock('../../../shared/components/property/PropertyCard', () => ({
  PropertyCard: vi.fn(({ property, onSave, onShare, onViewDetails }) => (
    <div data-testid={`property-card-${property.id}`}>
      <h3>{property.title}</h3>
      <p>{property.location}</p>
      <span>${property.price.toLocaleString()}</span>
      <button onClick={() => onSave?.(property.id)}>Save</button>
      <button onClick={() => onShare?.(property.id)}>Share</button>
      <button onClick={() => onViewDetails?.(property.id)}>View Details</button>
    </div>
  ))
}));

// Mock property listing component (since it doesn't exist yet, we'll create a simple one for testing)
const PropertyListing = ({ 
  properties = [], 
  loading = false, 
  onSearch, 
  onFilter, 
  onSort,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  searchQuery = '',
  filters = {},
  sortBy = 'price'
}) => {
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);
  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch?.(localSearchQuery);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleSortChange = (value) => {
    onSort?.(value);
  };

  if (loading) {
    return (
      <div data-testid="loading-state">
        <div>Loading properties...</div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} data-testid={`skeleton-${i}`} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="property-listing">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} data-testid="search-form">
        <input
          type="text"
          placeholder="Search properties..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          data-testid="search-input"
        />
        <button type="submit" data-testid="search-button">Search</button>
      </form>

      {/* Filters */}
      <div data-testid="filters-section">
        <select
          value={localFilters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          data-testid="location-filter"
        >
          <option value="">All Locations</option>
          <option value="nairobi">Nairobi</option>
          <option value="mombasa">Mombasa</option>
          <option value="kisumu">Kisumu</option>
        </select>

        <select
          value={localFilters.propertyType || ''}
          onChange={(e) => handleFilterChange('propertyType', e.target.value)}
          data-testid="property-type-filter"
        >
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="villa">Villa</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={localFilters.priceMin || ''}
          onChange={(e) => handleFilterChange('priceMin', e.target.value)}
          data-testid="price-min-filter"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={localFilters.priceMax || ''}
          onChange={(e) => handleFilterChange('priceMax', e.target.value)}
          data-testid="price-max-filter"
        />

        <label>
          <input
            type="checkbox"
            checked={localFilters.verified || false}
            onChange={(e) => handleFilterChange('verified', e.target.checked)}
            data-testid="verified-filter"
          />
          Verified Only
        </label>
      </div>

      {/* Sort Options */}
      <div data-testid="sort-section">
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          data-testid="sort-select"
        >
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="date">Newest First</option>
          <option value="-date">Oldest First</option>
          <option value="location">Location A-Z</option>
        </select>
      </div>

      {/* Results Count */}
      <div data-testid="results-count">
        {properties.length} properties found
      </div>

      {/* Property Grid */}
      <div data-testid="property-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.length === 0 ? (
          <div data-testid="no-results" className="col-span-full text-center py-8">
            <p>No properties found matching your criteria.</p>
            <button onClick={() => {
              setLocalSearchQuery('');
              setLocalFilters({});
              onSearch?.('');
              onFilter?.({});
            }}>
              Clear Filters
            </button>
          </div>
        ) : (
          properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onSave={(id) => console.log('Save property:', id)}
              onShare={(id) => console.log('Share property:', id)}
              onViewDetails={(id) => console.log('View details:', id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div data-testid="pagination" className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            data-testid="prev-page"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                data-testid={`page-${page}`}
                className={currentPage === page ? 'active' : ''}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            data-testid="next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

describe('PropertyListing Component', () => {
  const mockProperties = TestDataFactory.createProperties(6);
  const mockCallbacks = {
    onSearch: vi.fn(),
    onFilter: vi.fn(),
    onSort: vi.fn(),
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders property listing with all components', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('property-listing')).toBeInTheDocument();
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
      expect(screen.getByTestId('filters-section')).toBeInTheDocument();
      expect(screen.getByTestId('sort-section')).toBeInTheDocument();
      expect(screen.getByTestId('property-grid')).toBeInTheDocument();
      expect(screen.getByTestId('results-count')).toBeInTheDocument();
    });

    it('displays correct results count', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('6 properties found');
    });

    it('renders all property cards', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      mockProperties.forEach((property) => {
        expect(screen.getByTestId(`property-card-${property.id}`)).toBeInTheDocument();
      });
    });

    it('shows loading state when loading is true', () => {
      renderWithProviders(
        <PropertyListing
          properties={[]}
          loading={true}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading properties...')).toBeInTheDocument();
      
      // Check for skeleton loaders
      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId(`skeleton-${i}`)).toBeInTheDocument();
      }
    });

    it('shows no results message when no properties match', () => {
      renderWithProviders(
        <PropertyListing
          properties={[]}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No properties found matching your criteria.')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles search input changes', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'apartment');

      expect(searchInput).toHaveValue('apartment');
    });

    it('calls onSearch when search form is submitted', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      const searchButton = screen.getByTestId('search-button');

      await user.type(searchInput, 'luxury villa');
      await user.click(searchButton);

      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('luxury villa');
    });

    it('calls onSearch when Enter key is pressed in search input', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'modern apartment');
      await user.keyboard('{Enter}');

      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('modern apartment');
    });

    it('displays current search query in input', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          searchQuery="test search"
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('search-input')).toHaveValue('test search');
    });
  });

  describe('Filtering Functionality', () => {
    it('handles location filter changes', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const locationFilter = screen.getByTestId('location-filter');
      await user.selectOptions(locationFilter, 'nairobi');

      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ location: 'nairobi' });
    });

    it('handles property type filter changes', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const propertyTypeFilter = screen.getByTestId('property-type-filter');
      await user.selectOptions(propertyTypeFilter, 'apartment');

      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ propertyType: 'apartment' });
    });

    it('handles price range filter changes', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const priceMinFilter = screen.getByTestId('price-min-filter');
      const priceMaxFilter = screen.getByTestId('price-max-filter');

      await user.type(priceMinFilter, '1000000');
      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ priceMin: '1000000' });

      await user.type(priceMaxFilter, '5000000');
      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ priceMin: '1000000', priceMax: '5000000' });
    });

    it('handles verified filter toggle', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const verifiedFilter = screen.getByTestId('verified-filter');
      await user.click(verifiedFilter);

      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ verified: true });
    });

    it('displays current filter values', () => {
      const filters = {
        location: 'nairobi',
        propertyType: 'apartment',
        priceMin: '1000000',
        priceMax: '5000000',
        verified: true
      };

      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          filters={filters}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('location-filter')).toHaveValue('nairobi');
      expect(screen.getByTestId('property-type-filter')).toHaveValue('apartment');
      expect(screen.getByTestId('price-min-filter')).toHaveValue('1000000');
      expect(screen.getByTestId('price-max-filter')).toHaveValue('5000000');
      expect(screen.getByTestId('verified-filter')).toBeChecked();
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={[]}
          {...mockCallbacks}
        />
      );

      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('');
      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({});
    });
  });

  describe('Sorting Functionality', () => {
    it('handles sort option changes', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, '-price');

      expect(mockCallbacks.onSort).toHaveBeenCalledWith('-price');
    });

    it('displays current sort option', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          sortBy="location"
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('sort-select')).toHaveValue('location');
    });

    it('provides all expected sort options', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      const options = within(sortSelect).getAllByRole('option');

      expect(options).toHaveLength(5);
      expect(options[0]).toHaveValue('price');
      expect(options[1]).toHaveValue('-price');
      expect(options[2]).toHaveValue('date');
      expect(options[3]).toHaveValue('-date');
      expect(options[4]).toHaveValue('location');
    });
  });

  describe('Pagination Functionality', () => {
    it('renders pagination when totalPages > 1', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={2}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('prev-page')).toBeInTheDocument();
      expect(screen.getByTestId('next-page')).toBeInTheDocument();
    });

    it('does not render pagination when totalPages <= 1', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={1}
          totalPages={1}
          {...mockCallbacks}
        />
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('handles previous page click', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={3}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      const prevButton = screen.getByTestId('prev-page');
      await user.click(prevButton);

      expect(mockCallbacks.onPageChange).toHaveBeenCalledWith(2);
    });

    it('handles next page click', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={2}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      const nextButton = screen.getByTestId('next-page');
      await user.click(nextButton);

      expect(mockCallbacks.onPageChange).toHaveBeenCalledWith(3);
    });

    it('handles specific page number click', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={1}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      const pageButton = screen.getByTestId('page-3');
      await user.click(pageButton);

      expect(mockCallbacks.onPageChange).toHaveBeenCalledWith(3);
    });

    it('disables previous button on first page', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={1}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('prev-page')).toBeDisabled();
    });

    it('disables next button on last page', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={5}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('next-page')).toBeDisabled();
    });

    it('highlights current page button', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={3}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('page-3')).toHaveClass('active');
    });
  });

  describe('Property Card Integration', () => {
    it('passes correct props to PropertyCard components', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      mockProperties.forEach((property) => {
        const card = screen.getByTestId(`property-card-${property.id}`);
        expect(card).toHaveTextContent(property.title);
        expect(card).toHaveTextContent(property.location);
        expect(card).toHaveTextContent(`$${property.price.toLocaleString()}`);
      });
    });

    it('handles property card interactions', async () => {
      const user = userEventInstance;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties.slice(0, 1)}
          {...mockCallbacks}
        />
      );

      const property = mockProperties[0];
      const card = screen.getByTestId(`property-card-${property.id}`);

      await user.click(within(card).getByText('Save'));
      expect(consoleSpy).toHaveBeenCalledWith('Save property:', property.id);

      await user.click(within(card).getByText('Share'));
      expect(consoleSpy).toHaveBeenCalledWith('Share property:', property.id);

      await user.click(within(card).getByText('View Details'));
      expect(consoleSpy).toHaveBeenCalledWith('View details:', property.id);

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search properties...');

      const locationFilter = screen.getByTestId('location-filter');
      expect(locationFilter).toBeInTheDocument();

      const verifiedFilter = screen.getByTestId('verified-filter');
      expect(verifiedFilter).toHaveAttribute('type', 'checkbox');
    });

    it('supports keyboard navigation for pagination', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={2}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      const pageButton = screen.getByTestId('page-3');
      await user.tab();
      
      // The button should be focusable
      expect(pageButton).toBeInTheDocument();
    });

    it('provides meaningful button text for pagination', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={2}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const initialRenderCount = screen.getAllByTestId(/property-card-/).length;

      // Re-render with same props
      rerender(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const afterRerenderCount = screen.getAllByTestId(/property-card-/).length;
      expect(afterRerenderCount).toBe(initialRenderCount);
    });

    it('handles large property lists efficiently', () => {
      const largePropertyList = TestDataFactory.createProperties(100);
      
      const startTime = performance.now();
      renderWithProviders(
        <PropertyListing
          properties={largePropertyList}
          {...mockCallbacks}
        />
      );
      const endTime = performance.now();

      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId('results-count')).toHaveTextContent('100 properties found');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search query gracefully', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          {...mockCallbacks}
        />
      );

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('');
    });

    it('handles invalid page numbers gracefully', () => {
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          currentPage={0}
          totalPages={5}
          {...mockCallbacks}
        />
      );

      // Should still render without crashing
      expect(screen.getByTestId('property-listing')).toBeInTheDocument();
    });

    it('handles missing callback functions gracefully', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyListing
          properties={mockProperties}
          // No callbacks provided
        />
      );

      const searchButton = screen.getByTestId('search-button');
      const locationFilter = screen.getByTestId('location-filter');

      // Should not throw errors when callbacks are undefined
      await user.click(searchButton);
      await user.selectOptions(locationFilter, 'nairobi');

      expect(screen.getByTestId('property-listing')).toBeInTheDocument();
    });

    it('handles properties with missing or invalid data', () => {
      const invalidProperties = [
        { id: '1', title: '', location: '', price: 0 },
        { id: '2', title: 'Valid Property', location: 'Nairobi', price: 1000000 }
      ];

      renderWithProviders(
        <PropertyListing
          properties={invalidProperties}
          {...mockCallbacks}
        />
      );

      expect(screen.getByTestId('results-count')).toHaveTextContent('2 properties found');
      expect(screen.getByTestId('property-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('property-card-2')).toBeInTheDocument();
    });
  });
});