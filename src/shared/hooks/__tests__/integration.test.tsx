import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropertyCard } from '../../components/property/PropertyCard'
import type { NormalizedProperty } from '../../types/property'

// Mock the property compare context
jest.mock('../../../property/contexts', () => ({
  usePropertyCompare: () => ({
    selectedProperties: [],
    canAddMore: true,
  }),
  usePropertyCompareActions: () => ({
    addToCompare: jest.fn(),
    removeFromCompare: jest.fn(),
  }),
}));

// Mock performance monitor
jest.mock('../../hooks/useComponentPerformance', () => ({
  usePerformanceMonitor: jest.fn(),
}));

const mockProperty: NormalizedProperty = {
  id: 'test-property-1',
  title: 'Test Property',
  price: 1000000,
  location: 'Nairobi, Kenya',
  description: 'A beautiful test property',
  images: ['https://example.com/image1.jpg'],
  type: 'residential',
  category: 'residential',
  features: {
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
  },
  verificationStatus: 'verified',
  trustScore: 85,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('PropertyCard Integration', () => {
  it('should render with shared hooks and components', () => {
    render(
      <TestWrapper>
        <PropertyCard
          property={mockProperty}
          onClick={jest.fn()}
          showQuickActions={true}
        />
      </TestWrapper>
    );

    // Check if the property title is rendered
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    
    // Check if the formatted price is rendered
    expect(screen.getByText('KES 1,000,000')).toBeInTheDocument();
    
    // Check if the location is rendered
    expect(screen.getByText('Nairobi, Kenya')).toBeInTheDocument();
    
    // Check if features are rendered
    expect(screen.getByText('3')).toBeInTheDocument(); // bedrooms
    expect(screen.getByText('2')).toBeInTheDocument(); // bathrooms
  });

  it('should handle missing optional data gracefully', () => {
    const minimalProperty: NormalizedProperty = {
      id: 'minimal-property',
      title: 'Minimal Property',
      price: 500000,
      location: 'Test Location',
      images: [],
      type: 'residential',
      category: 'residential',
    };

    render(
      <TestWrapper>
        <PropertyCard
          property={minimalProperty}
          onClick={jest.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Minimal Property')).toBeInTheDocument();
    expect(screen.getByText('KES 500,000')).toBeInTheDocument();
  });
});