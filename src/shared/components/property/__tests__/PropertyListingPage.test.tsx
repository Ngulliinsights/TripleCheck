import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PropertyListingPage } from '../PropertyListingPage';
import { allPropertiesConfig } from '../../../config/propertyTypes';
import type { BasePropertyFilters } from '../../../types/property';

// Mock the property configuration
const mockConfig = {
  ...allPropertiesConfig,
  fetcher: jest.fn().mockResolvedValue({
    items: [
      {
        id: '1',
        title: 'Test Property',
        description: 'Test Description',
        location: 'Test Location',
        price: 1000000,
        images: [],
        verificationStatus: 'verified',
        type: 'apartment',
        features: {},
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
    totalCount: 1,
    totalPages: 1,
  }),
};

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PropertyListingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the property listing page with title', () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    expect(screen.getByText('All Properties')).toBeInTheDocument();
  });

  it('should render search input and allow typing', async () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    const searchInput = screen.getByPlaceholderText('Search properties...');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'apartment' } });
    expect(searchInput).toHaveValue('apartment');
  });

  it('should handle view mode changes', () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    // Find view mode buttons by their icons
    const gridButton = screen.getByRole('button', { name: /grid/i });
    const listButton = screen.getByRole('button', { name: /list/i });

    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();

    // Click list view button
    fireEvent.click(listButton);
    
    // The list button should now be active (have default variant)
    expect(listButton).toHaveClass('bg-primary');
  });

  it('should handle sort changes', () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    const sortSelect = screen.getByDisplayValue('Newest First');
    expect(sortSelect).toBeInTheDocument();

    fireEvent.change(sortSelect, { target: { value: 'price-low' } });
    expect(sortSelect).toHaveValue('price-low');
  });

  it('should display loading state initially', () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    // Should show skeleton loading cards
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle filter reset', async () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    const searchInput = screen.getByPlaceholderText('Search properties...');
    
    // Add some filter values
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Wait for the filter to be applied
    await waitFor(() => {
      expect(searchInput).toHaveValue('test query');
    });

    // Look for clear all button (it should appear when filters are active)
    await waitFor(() => {
      const clearButton = screen.queryByText('Clear all');
      if (clearButton) {
        fireEvent.click(clearButton);
      }
    });
  });

  it('should call fetcher with correct parameters', async () => {
    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    // Wait for the initial fetch to be called
    await waitFor(() => {
      expect(mockConfig.fetcher).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '',
          location: '',
          priceMin: null,
          priceMax: null,
          verified: false,
          category: null,
        }),
        1, // page
        12 // pageSize
      );
    });
  });

  it('should handle custom hero configuration', () => {
    const customHeroConfig = {
      title: 'Custom Title',
      subtitle: 'Custom Subtitle',
    };

    render(
      <PropertyListingPage
        config={mockConfig}
        enableCompare={true}
        enablePhotoManagement={true}
        heroConfig={customHeroConfig}
      />,
      { wrapper: createTestWrapper() }
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
  });
});

// Integration test for the complete flow
describe('PropertyListingPage Integration', () => {
  it('should handle complete user workflow', async () => {
    const mockFetcher = jest.fn()
      .mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        totalPages: 0,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: '1',
            title: 'Filtered Property',
            description: 'Matches search',
            location: 'Nairobi',
            price: 1000000,
            images: [],
            verificationStatus: 'verified',
            type: 'apartment',
            features: {},
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        totalCount: 1,
        totalPages: 1,
      });

    const testConfig = {
      ...mockConfig,
      fetcher: mockFetcher,
    };

    render(
      <PropertyListingPage
        config={testConfig}
        enableCompare={true}
        enablePhotoManagement={true}
      />,
      { wrapper: createTestWrapper() }
    );

    // 1. Initial load
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    // 2. Apply search filter
    const searchInput = screen.getByPlaceholderText('Search properties...');
    fireEvent.change(searchInput, { target: { value: 'apartment' } });

    // 3. Submit search
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // 4. Verify second fetch with filters
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(mockFetcher).toHaveBeenLastCalledWith(
        expect.objectContaining({
          query: 'apartment',
        }),
        1,
        12
      );
    });
  });
});