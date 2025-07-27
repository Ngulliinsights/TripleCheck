import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';
import { renderWithProviders, userEventInstance } from '../../../shared/test-utils';
import { TestDataFactory } from '../../../shared/test-utils/fixtures';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
}));

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    title: 'Modern 3-Bedroom Apartment',
    type: 'residential' as const,
    price: 15000000,
    location: 'Westlands, Nairobi',
    images: ['/test-image-1.jpg', '/test-image-2.jpg', '/test-image-3.jpg'],
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    trustScore: 95,
    verificationStatus: 'verified' as const,
    features: ['Swimming Pool', 'Gym', '24/7 Security'],
  };

  const mockCallbacks = {
    onSave: vi.fn(),
    onShare: vi.fn(),
    onViewDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders property card with all basic information', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
      expect(screen.getByText(mockProperty.location)).toBeInTheDocument();
      expect(screen.getByText('$15,000,000')).toBeInTheDocument();
      expect(screen.getByText('3 beds')).toBeInTheDocument();
      expect(screen.getByText('2 baths')).toBeInTheDocument();
      expect(screen.getByText('1200 m²')).toBeInTheDocument();
    });

    it('renders trust score badge correctly', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      expect(screen.getByText('Trust Score: 95')).toBeInTheDocument();
    });

    it('renders property features as badges', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      mockProperty.features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('renders main property image with correct alt text', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 1 of 3');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image-1.jpg');
    });

    it('renders image navigation dots when multiple images exist', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const navigationDots = screen.getAllByLabelText(/View image \d+/);
      expect(navigationDots).toHaveLength(3);
    });

    it('does not render image navigation for single image', () => {
      const singleImageProperty = {
        ...mockProperty,
        images: ['/test-image-1.jpg'],
      };

      renderWithProviders(
        <PropertyCard property={singleImageProperty} {...mockCallbacks} />
      );

      expect(screen.queryByLabelText(/View image \d+/)).not.toBeInTheDocument();
    });

    it('handles commercial property pricing correctly', () => {
      const commercialProperty = {
        ...mockProperty,
        type: 'commercial' as const,
      };

      renderWithProviders(
        <PropertyCard property={commercialProperty} {...mockCallbacks} />
      );

      expect(screen.getByText('/month')).toBeInTheDocument();
    });

    it('handles properties without bedrooms (commercial)', () => {
      const commercialProperty = {
        ...mockProperty,
        type: 'commercial' as const,
        bedrooms: undefined,
        bathrooms: undefined,
      };

      renderWithProviders(
        <PropertyCard property={commercialProperty} {...mockCallbacks} />
      );

      expect(screen.queryByText(/beds/)).not.toBeInTheDocument();
      expect(screen.queryByText(/baths/)).not.toBeInTheDocument();
      expect(screen.getByText('1200 m²')).toBeInTheDocument();
    });
  });

  describe('Verification Status', () => {
    it('renders verified status with correct styling', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const badge = screen.getByRole('img', { name: /Trust score: 95, Status: verified/ });
      expect(badge).toBeInTheDocument();
    });

    it('renders pending status correctly', () => {
      const pendingProperty = {
        ...mockProperty,
        verificationStatus: 'pending' as const,
        trustScore: 0,
      };

      renderWithProviders(
        <PropertyCard property={pendingProperty} {...mockCallbacks} />
      );

      const badge = screen.getByRole('img', { name: /Trust score: 0, Status: pending/ });
      expect(badge).toBeInTheDocument();
    });

    it('renders warning status correctly', () => {
      const warningProperty = {
        ...mockProperty,
        verificationStatus: 'warning' as const,
        trustScore: 45,
      };

      renderWithProviders(
        <PropertyCard property={warningProperty} {...mockCallbacks} />
      );

      const badge = screen.getByRole('img', { name: /Trust score: 45, Status: warning/ });
      expect(badge).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onSave when save button is clicked', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const propertyCard = screen.getByRole('article');
      await user.hover(propertyCard);

      const saveButton = screen.getByLabelText('Save property');
      await user.click(saveButton);

      expect(mockCallbacks.onSave).toHaveBeenCalledWith(mockProperty.id);
    });

    it('calls onShare when share button is clicked', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const propertyCard = screen.getByRole('article');
      await user.hover(propertyCard);

      const shareButton = screen.getByLabelText('Share property');
      await user.click(shareButton);

      expect(mockCallbacks.onShare).toHaveBeenCalledWith(mockProperty.id);
    });

    it('calls onViewDetails when view details button is clicked', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const viewDetailsButton = screen.getByLabelText(`View details for ${mockProperty.title}`);
      await user.click(viewDetailsButton);

      expect(mockCallbacks.onViewDetails).toHaveBeenCalledWith(mockProperty.id);
    });

    it('navigates through images when navigation dots are clicked', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      // Click second image dot
      const secondImageDot = screen.getByLabelText('View image 2');
      await user.click(secondImageDot);

      const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 2 of 3');
      expect(image).toHaveAttribute('src', '/test-image-2.jpg');

      // Click third image dot
      const thirdImageDot = screen.getByLabelText('View image 3');
      await user.click(thirdImageDot);

      const thirdImage = screen.getByAltText('Modern 3-Bedroom Apartment - Image 3 of 3');
      expect(thirdImage).toHaveAttribute('src', '/test-image-3.jpg');
    });

    it('supports keyboard navigation for image gallery', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const propertyCard = screen.getByRole('article');
      await user.click(propertyCard); // Focus the card

      // Navigate to next image with arrow key
      await user.keyboard('{ArrowRight}');
      
      await waitFor(() => {
        const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 2 of 3');
        expect(image).toHaveAttribute('src', '/test-image-2.jpg');
      });

      // Navigate back with left arrow
      await user.keyboard('{ArrowLeft}');
      
      await waitFor(() => {
        const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 1 of 3');
        expect(image).toHaveAttribute('src', '/test-image-1.jpg');
      });
    });

    it('does not navigate beyond image bounds with keyboard', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const propertyCard = screen.getByRole('article');
      await user.click(propertyCard);

      // Try to navigate before first image
      await user.keyboard('{ArrowLeft}');
      
      const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 1 of 3');
      expect(image).toHaveAttribute('src', '/test-image-1.jpg');

      // Navigate to last image
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');

      // Try to navigate beyond last image
      await user.keyboard('{ArrowRight}');
      
      const lastImage = screen.getByAltText('Modern 3-Bedroom Apartment - Image 3 of 3');
      expect(lastImage).toHaveAttribute('src', '/test-image-3.jpg');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const article = screen.getByRole('article', { 
        name: `Property: ${mockProperty.title}` 
      });
      expect(article).toBeInTheDocument();

      const trustBadge = screen.getByRole('img', { 
        name: /Trust score: 95, Status: verified/ 
      });
      expect(trustBadge).toBeInTheDocument();
    });

    it('is keyboard focusable', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const propertyCard = screen.getByRole('article');
      
      await user.tab();
      expect(propertyCard).toHaveFocus();
    });

    it('has proper image alt text', () => {
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 1 of 3');
      expect(image).toBeInTheDocument();
    });

    it('has descriptive button labels', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      const propertyCard = screen.getByRole('article');
      await user.hover(propertyCard);

      expect(screen.getByLabelText('Save property')).toBeInTheDocument();
      expect(screen.getByLabelText('Share property')).toBeInTheDocument();
      expect(screen.getByLabelText(`View details for ${mockProperty.title}`)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('shows placeholder when property has no images', () => {
      const noImageProperty = {
        ...mockProperty,
        images: [],
      };

      renderWithProviders(
        <PropertyCard property={noImageProperty} {...mockCallbacks} />
      );

      // Should render with placeholder image
      const image = screen.getByAltText('Modern 3-Bedroom Apartment - Image 1 of 1');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/placeholder-property.jpg');
      
      // Should not show image navigation for placeholder
      expect(screen.queryByLabelText(/View image \d+/)).not.toBeInTheDocument();
    });

    it('handles missing callback functions gracefully', async () => {
      const user = userEventInstance;
      
      renderWithProviders(
        <PropertyCard property={mockProperty} />
      );

      const propertyCard = screen.getByRole('article');
      await user.hover(propertyCard);

      // Should not throw errors when callbacks are undefined
      const saveButton = screen.getByLabelText('Save property');
      await user.click(saveButton);

      const shareButton = screen.getByLabelText('Share property');
      await user.click(shareButton);

      const viewDetailsButton = screen.getByLabelText(`View details for ${mockProperty.title}`);
      await user.click(viewDetailsButton);

      // No assertions needed - just ensuring no errors are thrown
    });

    it('handles singular bedroom/bathroom counts correctly', () => {
      const singularProperty = {
        ...mockProperty,
        bedrooms: 1,
        bathrooms: 1,
      };

      renderWithProviders(
        <PropertyCard property={singularProperty} {...mockCallbacks} />
      );

      expect(screen.getByText('1 bed')).toBeInTheDocument();
      expect(screen.getByText('1 bath')).toBeInTheDocument();
    });

    it('handles large numbers in price formatting', () => {
      const expensiveProperty = {
        ...mockProperty,
        price: 1234567890,
      };

      renderWithProviders(
        <PropertyCard property={expensiveProperty} {...mockCallbacks} />
      );

      expect(screen.getByText('$1,234,567,890')).toBeInTheDocument();
    });

    it('handles empty features array', () => {
      const noFeaturesProperty = {
        ...mockProperty,
        features: [],
      };

      renderWithProviders(
        <PropertyCard property={noFeaturesProperty} {...mockCallbacks} />
      );

      // Should render without features section
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders consistently with same props', () => {
      // First render
      const { unmount } = renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
      unmount();

      // Second render with same props should work the same way
      renderWithProviders(
        <PropertyCard property={mockProperty} {...mockCallbacks} />
      );

      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });
  });
});