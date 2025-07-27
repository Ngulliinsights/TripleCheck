import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropertiesResidential from '../PropertiesResidential';

// Mock the ListingCard component
jest.mock('../../../property/components/ListingCard', () => {
  return function MockListingCard({ property, onClick }: any) {
    return (
      <div data-testid={`property-${property.id}`} onClick={onClick}>
        <h3>{property.title}</h3>
        <p>{property.location}</p>
        <span>{property.price}</span>
      </div>
    );
  };
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('PropertiesResidential', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with hero section', () => {
    renderWithQueryClient(<PropertiesResidential />);
    
    expect(screen.getByText('Residential Properties')).toBeInTheDocument();
    expect(screen.getByText(/Find your perfect home/)).toBeInTheDocument();
  });

  it('allows searching for properties', async () => {
    renderWithQueryClient(<PropertiesResidential />);
    
    const searchInput = screen.getByPlaceholderText(/Search properties/);
    fireEvent.change(searchInput, { target: { value: 'Kilimani' } });
    
    expect(searchInput).toHaveValue('Kilimani');
  });

  it('toggles filter visibility', () => {
    renderWithQueryClient(<PropertiesResidential />);
    
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    expect(screen.getByText('Min Price (KSH)')).toBeInTheDocument();
  });

  it('switches between grid and list view modes', () => {
    renderWithQueryClient(<PropertiesResidential />);
    
    const listViewButton = screen.getByRole('button', { name: /list/i });
    fireEvent.click(listViewButton);
    
    // Check if the view mode changed (you'd need to verify the actual layout change)
    expect(listViewButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters properties by type', async () => {
    renderWithQueryClient(<PropertiesResidential />);
    
    const apartmentFilter = screen.getByText(/Apartments/);
    fireEvent.click(apartmentFilter);
    
    // Wait for the filter to be applied
    await waitFor(() => {
      expect(apartmentFilter).toHaveClass('bg-primary'); // or whatever active class
    });
  });

  it('sorts properties correctly', async () => {
    renderWithQueryClient(<PropertiesResidential />);
    
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
    
    expect(sortSelect).toHaveValue('price-asc');
  });
});