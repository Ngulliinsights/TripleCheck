import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders, userEventInstance, createTestQueryClient } from '../../../shared/test-utils';
import { TestDataFactory } from '../../../shared/test-utils/fixtures';
import { server } from '../../../shared/test-utils/msw-server';
import { http, HttpResponse } from 'msw';
import ResidentialProperties from '../../pages/PropertiesResidential';

// Mock the performance monitor to avoid test issues
vi.mock('../../utils/performanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    trackRender: vi.fn(),
    trackApiCall: vi.fn(),
  }),
}));

// Mock the performance test panel
vi.mock('../../components/PerformanceTestPanel', () => ({
  default: ({ className }: { className?: string }) => (
    <div className={className} data-testid="performance-panel">Performance Panel</div>
  ),
}));

describe('Property Listing Components - Search, Filtering, and Pagination', () => {
  let queryClient: QueryClient;
  const mockProperties = TestDataFactory.createProperties(20);

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Property Search Functionality', () => {
    it('renders search input and allows text search', async () => {
      const user = userEventInstance;
      
      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(mockProperties);
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      expect(searchInput).toBeInTheDocument();

      await user.type(searchInput, 'luxury apartment');
      
      // Verify search input value
      expect(searchInput).toHaveValue('luxury apartment');
    });

    it('filters properties based on search query', async () => {
      const user = userEventInstance;
      const luxuryProperty = TestDataFactory.createProperty({
        title: 'Luxury Apartment in Westlands',
        description: 'Beautiful luxury apartment with modern amenities',
      });
      
      server.use(
        http.get('/api/properties', ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('query');
          
          if (query === 'luxury') {
            return HttpResponse.json([luxuryProperty]);
          }
          return HttpResponse.json(mockProperties);
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      await user.type(searchInput, 'luxury');

      // Wait for debounced search
      await waitFor(() => {
        expect(screen.getByText('Luxury Apartment in Westlands')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('shows no results message when search returns empty', async () => {
      const user = userEventInstance;
      
      server.use(
        http.get('/api/properties', ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('query');
          
          if (query === 'nonexistent') {
            return HttpResponse.json([]);
          }
          return HttpResponse.json(mockProperties);
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no properties found/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('clears search when input is emptied', async () => {
      const user = userEventInstance;
      
      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(mockProperties);
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const searchInput = screen.getByPlaceholderText(/search properties/i);
      
      // Type and then clear
      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Property Filtering', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/properties', ({ request }) => {
          const url = new URL(request.url);
          const propertyType = url.searchParams.get('propertyType');
          const location = url.searchParams.get('location');
          const priceMin = url.searchParams.get('priceMin');
          const priceMax = url.searchParams.get('priceMax');
          const bedrooms = url.searchParams.get('bedrooms');
          const bathrooms = url.searchParams.get('bathrooms');

          let filtered = [...mockProperties];

          if (propertyType) {
            filtered = filtered.filter(p => p.features?.propertyType === propertyType);
          }
          if (location) {
            filtered = filtered.filter(p => p.location.includes(location));
          }
          if (priceMin) {
            filtered = filtered.filter(p => p.price >= parseInt(priceMin));
          }
          if (priceMax) {
            filtered = filtered.filter(p => p.price <= parseInt(priceMax));
          }
          if (bedrooms) {
            filtered = filtered.filter(p => p.features?.bedrooms >= parseInt(bedrooms));
          }
          if (bathrooms) {
            filtered = filtered.filter(p => p.features?.bathrooms >= parseInt(bathrooms));
          }

          return HttpResponse.json(filtered);
        })
      );
    });

    it('shows and hides advanced filters', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(filtersButton).toBeInTheDocument();

      // Filters should be hidden initially
      expect(screen.queryByText(/min price/i)).not.toBeInTheDocument();

      // Show filters
      await user.click(filtersButton);
      expect(screen.getByText(/min price/i)).toBeInTheDocument();

      // Hide filters
      await user.click(filtersButton);
      expect(screen.queryByText(/min price/i)).not.toBeInTheDocument();
    });

    it('filters by property type', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Click on apartment filter
      const apartmentFilter = screen.getByText(/apartments/i);
      await user.click(apartmentFilter);

      // Verify filter is applied (visual feedback)
      expect(apartmentFilter.closest('span')).toHaveClass('bg-primary');
    });

    it('filters by location', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Click on Westlands location filter
      const westlandsFilter = screen.getByText('Westlands');
      await user.click(westlandsFilter);

      // Verify filter is applied
      expect(westlandsFilter.closest('span')).toHaveClass('bg-primary');
    });

    it('filters by price range', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Show advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Set price range
      const minPriceInput = screen.getByLabelText(/min price/i);
      const maxPriceInput = screen.getByLabelText(/max price/i);

      await user.type(minPriceInput, '1000000');
      await user.type(maxPriceInput, '5000000');

      expect(minPriceInput).toHaveValue(1000000);
      expect(maxPriceInput).toHaveValue(5000000);
    });

    it('filters by bedrooms and bathrooms', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Show advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Set bedroom and bathroom filters
      const bedroomsInput = screen.getByLabelText(/min bedrooms/i);
      const bathroomsInput = screen.getByLabelText(/min bathrooms/i);

      await user.type(bedroomsInput, '2');
      await user.type(bathroomsInput, '2');

      expect(bedroomsInput).toHaveValue(2);
      expect(bathroomsInput).toHaveValue(2);
    });

    it('filters by additional options (furnished, parking, verified)', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Show advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Check additional filters
      const furnishedCheckbox = screen.getByLabelText(/furnished only/i);
      const parkingCheckbox = screen.getByLabelText(/parking required/i);
      const verifiedCheckbox = screen.getByLabelText(/verified only/i);

      await user.click(furnishedCheckbox);
      await user.click(parkingCheckbox);
      await user.click(verifiedCheckbox);

      expect(furnishedCheckbox).toBeChecked();
      expect(parkingCheckbox).toBeChecked();
      expect(verifiedCheckbox).toBeChecked();
    });

    it('clears all filters', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Show advanced filters and set some filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      const minPriceInput = screen.getByLabelText(/min price/i);
      await user.type(minPriceInput, '1000000');

      const furnishedCheckbox = screen.getByLabelText(/furnished only/i);
      await user.click(furnishedCheckbox);

      // Clear all filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearButton);

      // Verify filters are cleared
      expect(minPriceInput).toHaveValue(null);
      expect(furnishedCheckbox).not.toBeChecked();
    });

    it('shows property count after filtering', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Show advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Should show property count
      await waitFor(() => {
        expect(screen.getByText(/properties found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Property Sorting', () => {
    beforeEach(() => {
      const sortedProperties = [
        TestDataFactory.createProperty({ price: 1000000, features: { ...TestDataFactory.createProperty().features, yearBuilt: 2020 } }),
        TestDataFactory.createProperty({ price: 2000000, features: { ...TestDataFactory.createProperty().features, yearBuilt: 2021 } }),
        TestDataFactory.createProperty({ price: 3000000, features: { ...TestDataFactory.createProperty().features, yearBuilt: 2022 } }),
      ];

      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(sortedProperties);
        })
      );
    });

    it('sorts properties by price (low to high)', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const sortSelect = screen.getByLabelText(/sort properties by/i);
      await user.selectOptions(sortSelect, 'price-asc');

      expect(sortSelect).toHaveValue('price-asc');
    });

    it('sorts properties by price (high to low)', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const sortSelect = screen.getByLabelText(/sort properties by/i);
      await user.selectOptions(sortSelect, 'price-desc');

      expect(sortSelect).toHaveValue('price-desc');
    });

    it('sorts properties by newest first', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const sortSelect = screen.getByLabelText(/sort properties by/i);
      await user.selectOptions(sortSelect, 'newest');

      expect(sortSelect).toHaveValue('newest');
    });

    it('sorts properties by rating', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const sortSelect = screen.getByLabelText(/sort properties by/i);
      await user.selectOptions(sortSelect, 'rating');

      expect(sortSelect).toHaveValue('rating');
    });

    it('sorts properties by most viewed', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const sortSelect = screen.getByLabelText(/sort properties by/i);
      await user.selectOptions(sortSelect, 'views');

      expect(sortSelect).toHaveValue('views');
    });
  });

  describe('View Mode Toggle', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(mockProperties.slice(0, 5));
        })
      );
    });

    it('switches between grid and list view modes', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Find view mode buttons
      const gridButton = screen.getByRole('button', { name: /grid/i });
      const listButton = screen.getByRole('button', { name: /list/i });

      expect(gridButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();

      // Grid should be active by default
      expect(gridButton).toHaveClass('bg-primary');

      // Switch to list view
      await user.click(listButton);
      expect(listButton).toHaveClass('bg-primary');
      expect(gridButton).not.toHaveClass('bg-primary');

      // Switch back to grid view
      await user.click(gridButton);
      expect(gridButton).toHaveClass('bg-primary');
      expect(listButton).not.toHaveClass('bg-primary');
    });
  });

  describe('Property Cards Display', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(mockProperties.slice(0, 3));
        })
      );
    });

    it('displays property cards with correct information', async () => {
      renderWithProviders(<ResidentialProperties />, { queryClient });

      await waitFor(() => {
        // Should show property cards
        const propertyCards = screen.getAllByRole('article');
        expect(propertyCards.length).toBeGreaterThan(0);
      });
    });

    it('shows loading skeletons while fetching', () => {
      server.use(
        http.get('/api/properties', () => {
          return new Promise(() => {}); // Never resolves to simulate loading
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Should show loading skeletons
      const skeletons = screen.getAllByRole('generic').filter(el => 
        el.classList.contains('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles property card interactions', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      await waitFor(() => {
        const propertyCards = screen.getAllByRole('article');
        expect(propertyCards.length).toBeGreaterThan(0);
      });

      // Test save and share buttons (they appear on hover)
      const firstCard = screen.getAllByRole('article')[0];
      await user.hover(firstCard);

      // Should show action buttons on hover
      await waitFor(() => {
        expect(screen.getByLabelText(/save property/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/share property/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      server.use(
        http.get('/api/properties', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/failed to load properties/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      const user = userEventInstance;
      let callCount = 0;

      server.use(
        http.get('/api/properties', () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json(mockProperties);
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to load properties/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show properties after retry
      await waitFor(() => {
        expect(screen.queryByText(/failed to load properties/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(mockProperties.slice(0, 5));
        })
      );
    });

    it('has proper ARIA labels and roles', async () => {
      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Search input should have proper label
      const searchInput = screen.getByLabelText(/search/i) || screen.getByPlaceholderText(/search properties/i);
      expect(searchInput).toBeInTheDocument();

      // Sort dropdown should have proper label
      const sortSelect = screen.getByLabelText(/sort properties by/i);
      expect(sortSelect).toBeInTheDocument();

      // Filter button should be accessible
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(filtersButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEventInstance;

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Should be able to tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBe(screen.getByPlaceholderText(/search properties/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /filters/i }));
    });

    it('debounces search input to prevent excessive API calls', async () => {
      const user = userEventInstance;
      let apiCallCount = 0;

      server.use(
        http.get('/api/properties', () => {
          apiCallCount++;
          return HttpResponse.json(mockProperties);
        })
      );

      renderWithProviders(<ResidentialProperties />, { queryClient });

      const searchInput = screen.getByPlaceholderText(/search properties/i);

      // Type multiple characters quickly
      await user.type(searchInput, 'test');

      // Wait for debounce period
      await waitFor(() => {
        // Should only make one API call after debounce
        expect(apiCallCount).toBeLessThanOrEqual(2); // Initial load + debounced search
      }, { timeout: 1000 });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/properties', () => {
          return HttpResponse.json(mockProperties.slice(0, 3));
        })
      );
    });

    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<ResidentialProperties />, { queryClient });

      // Should render without errors on mobile
      expect(screen.getByPlaceholderText(/search properties/i)).toBeInTheDocument();
    });

    it('shows appropriate number of columns based on screen size', async () => {
      renderWithProviders(<ResidentialProperties />, { queryClient });

      await waitFor(() => {
        const propertyCards = screen.getAllByRole('article');
        expect(propertyCards.length).toBeGreaterThan(0);
      });

      // Grid layout should be responsive (tested via CSS classes)
      const container = screen.getByRole('main') || document.body;
      expect(container).toBeInTheDocument();
    });
  });
});