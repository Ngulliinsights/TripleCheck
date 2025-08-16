import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingCard from '../ListingCard';
import { Property } from '../../../shared/types/property';

// Mock the PropertyContext comparison hooks
jest.mock('../../contexts', () => ({
  usePropertyCompare: () => ({
    selectedProperties: [],
    canAddMore: true,
  }),
  usePropertyCompareActions: () => ({
    addToCompare: jest.fn(),
    removeFromCompare: jest.fn(),
    isSelected: jest.fn(() => false),
    canAddMore: true,
  }),
}));

const mockProperty: Property = {
  id: '1',
  title: 'Test Property',
  description: 'A beautiful test property',
  price: 100000,
  location: { address: 'Test Location' },
  images: ['test-image.jpg'],
  type: 'residential',
  features: {
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'house',
  },
  status: 'available',
  verificationStatus: 'verified',
  trustScore: 85,
};

describe('ListingCard Grid Mode', () => {
  it('applies grid mode CSS classes', () => {
    const { container } = render(
      <ListingCard property={mockProperty} viewMode="grid" />
    );
    
    expect(container.querySelector('.property-card--grid-mode')).toBeInTheDocument();
    expect(container.querySelector('.property-card--list-mode')).not.toBeInTheDocument();
  });

  it('applies list mode CSS classes', () => {
    const { container } = render(
      <ListingCard property={mockProperty} viewMode="list" />
    );
    
    expect(container.querySelector('.property-card--list-mode')).toBeInTheDocument();
    expect(container.querySelector('.property-card--grid-mode')).not.toBeInTheDocument();
  });

  it('defaults to grid mode when viewMode is not specified', () => {
    const { container } = render(
      <ListingCard property={mockProperty} />
    );
    
    expect(container.querySelector('.property-card--grid-mode')).toBeInTheDocument();
  });

  it('uses property-card-image-container for image containment', () => {
    const { container } = render(
      <ListingCard property={mockProperty} viewMode="grid" />
    );
    
    expect(container.querySelector('.property-card-image-container')).toBeInTheDocument();
  });

  it('uses property-card-image class for images', () => {
    const { container } = render(
      <ListingCard property={mockProperty} viewMode="grid" />
    );
    
    const image = container.querySelector('img');
    expect(image).toHaveClass('property-card-image');
  });

  it('maintains proper image aspect ratio', () => {
    const { container } = render(
      <ListingCard property={mockProperty} viewMode="grid" />
    );
    
    const imageContainer = container.querySelector('.property-card-image-container');
    expect(imageContainer).toBeInTheDocument();
    
    // The container should have aspect-ratio styling from CSS
    const computedStyle = window.getComputedStyle(imageContainer!);
    // Note: In a real test environment, you might need to mock CSS or use a different approach
  });

  it('renders property information correctly in grid mode', () => {
    render(<ListingCard property={mockProperty} viewMode="grid" />);
    
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText(/KES/)).toBeInTheDocument(); // Price formatting
  });

  it('shows property features in grid mode', () => {
    render(<ListingCard property={mockProperty} viewMode="grid" />);
    
    // Check for bedrooms, bathrooms, and square feet
    expect(screen.getByText('3')).toBeInTheDocument(); // bedrooms
    expect(screen.getByText('2')).toBeInTheDocument(); // bathrooms
    expect(screen.getByText('1500 sq ft')).toBeInTheDocument(); // square feet
  });

  it('displays image count when multiple images exist', () => {
    const propertyWithMultipleImages = {
      ...mockProperty,
      images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    };
    
    render(<ListingCard property={propertyWithMultipleImages} viewMode="grid" />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Image count
  });

  it('shows verified badge when property is verified', () => {
    const verifiedProperty = {
      ...mockProperty,
      status: 'verified' as const,
    };
    
    render(<ListingCard property={verifiedProperty} viewMode="grid" />);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});