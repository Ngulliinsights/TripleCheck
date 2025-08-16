import React from 'react';
import { render as originalRender, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PropertyCard } from '../../../shared/components/property/PropertyCard';
import { PropertyProvider } from '../../contexts/PropertyContext';
import type { NormalizedProperty } from '../../../shared/types/property';

// Override render to always include PropertyProvider
const render = (ui: React.ReactElement) => {
  return originalRender(
    <PropertyProvider>
      {ui}
    </PropertyProvider>
  );
};

// Mock the UI components
vi.mock('../../../shared/components/ui/card', () => ({
  Card: ({ children, className, onClick, role, tabIndex, onKeyDown, ...props }: any) => (
    <div 
      className={className} 
      onClick={onClick} 
      role={role} 
      tabIndex={tabIndex} 
      onKeyDown={onKeyDown}
      data-testid="card"
      {...props}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
}));

vi.mock('../../../shared/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={className} data-variant={variant} data-testid="badge">
      {children}
    </span>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MapPin: ({ className }: any) => <div className={className} data-testid="map-pin-icon" />,
  Bed: ({ className }: any) => <div className={className} data-testid="bed-icon" />,
  Bath: ({ className }: any) => <div className={className} data-testid="bath-icon" />,
  Square: ({ className }: any) => <div className={className} data-testid="square-icon" />,
  Camera: ({ className }: any) => <div className={className} data-testid="camera-icon" />,
}));

describe('PropertyCard', () => {
  const mockProperty: NormalizedProperty = {
    id: '1',
    title: 'Beautiful 3BR House',
    location: 'Nairobi, Kenya',
    price: 5000000,
    images: ['image1.jpg', 'image2.jpg'],
    status: 'verified',
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1500,
      propertyType: 'House',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders property information correctly', () => {
      render(<ListingCard property={mockProperty} />);
      
      expect(screen.getByText('Beautiful 3BR House')).toBeInTheDocument();
      expect(screen.getByText('Nairobi, Kenya')).toBeInTheDocument();
      expect(screen.getByText('Ksh 5,000,000')).toBeInTheDocument();
    });

    it('displays property image with correct alt text', () => {
      render(<ListingCard property={mockProperty} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'image1.jpg');
      expect(image).toHaveAttribute('alt', 'Beautiful 3BR House - Property image');
    });

    it('shows verified badge for verified properties', () => {
      renderWithProvider(<ListingCard property={mockProperty} />);
      
      const badge = screen.getByText('Verified');
      expect(badge).toBeInTheDocument();
    });

    it('displays property features when available', () => {
      render(<ListingCard property={mockProperty} />);
      
      expect(screen.getByTitle('3 bedrooms')).toBeInTheDocument();
      expect(screen.getByTitle('2 bathrooms')).toBeInTheDocument();
      expect(screen.getByText('1500 sq ft')).toBeInTheDocument();
      expect(screen.getByText('House')).toBeInTheDocument();
    });

    it('shows image count when multiple images exist', () => {
      render(<ListingCard property={mockProperty} />);
      
      // Check for image count indicator with camera icon
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
      // The image count should be displayed next to the camera icon
      const imageCountElement = screen.getByTestId('camera-icon').parentElement;
      expect(imageCountElement).toHaveTextContent('2');
    });
  });

  describe('Price Formatting', () => {
    it('formats price correctly for valid numbers', () => {
      render(<ListingCard property={mockProperty} />);
      
      expect(screen.getByText('Ksh 5,000,000')).toBeInTheDocument();
    });

    it('shows "Price on request" for missing price', () => {
      const propertyWithoutPrice = { ...mockProperty, price: undefined };
      render(<ListingCard property={propertyWithoutPrice} />);
      
      expect(screen.getByText('Price on request')).toBeInTheDocument();
    });

    it('shows "Price on request" for invalid price', () => {
      const propertyWithInvalidPrice = { ...mockProperty, price: null as any };
      render(<ListingCard property={propertyWithInvalidPrice} />);
      
      expect(screen.getByText('Price on request')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('uses placeholder image when no images provided', () => {
      const propertyWithoutImages = { ...mockProperty, images: [] };
      render(<ListingCard property={propertyWithoutImages} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/placeholder-property.jpg');
    });

    it('handles image error by setting placeholder', () => {
      render(<ListingCard property={mockProperty} />);
      
      const image = screen.getByRole('img');
      fireEvent.error(image);
      
      expect(image).toHaveAttribute('src', '/placeholder-property.jpg');
    });

    it('prevents infinite loops in image error handling', () => {
      const propertyWithPlaceholder = { 
        ...mockProperty, 
        images: ['/placeholder-property.jpg'] 
      };
      render(<ListingCard property={propertyWithPlaceholder} />);
      
      const image = screen.getByRole('img');
      const originalSrc = image.getAttribute('src');
      fireEvent.error(image);
      
      // Should not change src if already placeholder
      expect(image).toHaveAttribute('src', originalSrc);
    });
  });

  describe('Interactive Behavior', () => {
    it('makes card clickable when onClick provided', () => {
      const mockOnClick = vi.fn();
      render(<ListingCard property={mockProperty} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('calls onClick with property when clicked', () => {
      const mockOnClick = vi.fn();
      render(<ListingCard property={mockProperty} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('card');
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith(mockProperty);
    });

    it('handles keyboard navigation (Enter key)', () => {
      const mockOnClick = vi.fn();
      render(<ListingCard property={mockProperty} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('card');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledWith(mockProperty);
    });

    it('handles keyboard navigation (Space key)', () => {
      const mockOnClick = vi.fn();
      render(<ListingCard property={mockProperty} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('card');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(mockOnClick).toHaveBeenCalledWith(mockProperty);
    });

    it('does not make card interactive when no onClick provided', () => {
      render(<ListingCard property={mockProperty} />);
      
      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('role');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Conditional Rendering', () => {
    it('hides features section when no features available', () => {
      const propertyWithoutFeatures = { 
        ...mockProperty, 
        features: {} 
      };
      render(<ListingCard property={propertyWithoutFeatures} />);
      
      expect(screen.queryByTestId('bed-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bath-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument();
    });

    it('shows only available features', () => {
      const propertyWithPartialFeatures = { 
        ...mockProperty, 
        features: { bedrooms: 2 } 
      };
      render(<ListingCard property={propertyWithPartialFeatures} />);
      
      expect(screen.getByTestId('bed-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('bath-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument();
    });

    it('does not show verified badge for non-verified properties', () => {
      const unverifiedProperty = { ...mockProperty, status: 'pending' };
      render(<ListingCard property={unverifiedProperty} />);
      
      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    });

    it('does not show image count for single image', () => {
      const singleImageProperty = { ...mockProperty, images: ['image1.jpg'] };
      render(<ListingCard property={singleImageProperty} />);
      
      expect(screen.queryByTestId('camera-icon')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper aria-label for interactive cards', () => {
      const mockOnClick = vi.fn();
      render(<ListingCard property={mockProperty} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'View property Beautiful 3BR House');
    });

    it('provides proper image alt text', () => {
      render(<ListingCard property={mockProperty} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Beautiful 3BR House - Property image');
    });

    it('includes proper titles for feature icons', () => {
      render(<ListingCard property={mockProperty} />);
      
      const bedroomContainer = screen.getByTitle('3 bedrooms');
      const bathroomContainer = screen.getByTitle('2 bathrooms');
      const squareFeetContainer = screen.getByTitle('1500 square feet');
      
      expect(bedroomContainer).toBeInTheDocument();
      expect(bathroomContainer).toBeInTheDocument();
      expect(squareFeetContainer).toBeInTheDocument();
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies custom className', () => {
      render(<ListingCard property={mockProperty} className="custom-class" />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('applies hover styles for interactive cards', () => {
      const mockOnClick = vi.fn();
      render(<ListingCard property={mockProperty} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('card');
      expect(card.className).toContain('cursor-pointer');
      expect(card.className).toContain('hover:shadow-lg');
    });

    it('applies different styles for non-interactive cards', () => {
      render(<ListingCard property={mockProperty} />);
      
      const card = screen.getByTestId('card');
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).not.toContain('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('handles property with minimal data', () => {
      const minimalProperty: Property = {
        id: '1',
        title: 'Basic Property',
        location: 'Location',
        images: [],
      };
      
      render(<ListingCard property={minimalProperty} />);
      
      expect(screen.getByText('Basic Property')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Price on request')).toBeInTheDocument();
    });

    it('handles fallback onClick pattern', () => {
      const mockOnClick = vi.fn();
      // Simulate the old onClick pattern without property parameter
      const legacyOnClick = mockOnClick as () => void;
      
      render(<ListingCard property={mockProperty} onClick={legacyOnClick} />);
      
      const card = screen.getByTestId('card');
      fireEvent.click(card);
      
      // Should still be called, even if with different signature
      expect(mockOnClick).toHaveBeenCalled();
    });
  });
});