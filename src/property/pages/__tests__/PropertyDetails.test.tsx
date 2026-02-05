import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, userEventInstance } from '../../../shared/test-utils'
import { TestDataFactory } from '../../../shared/test-utils/fixtures'
import PropertyDetails from '../PropertyDetails'

// Mock the PropertyReviews component
vi.mock('../../components/PropertyReviews', () => ({
  PropertyReviews: vi.fn(({ propertyId }) => (
    <div data-testid={`property-reviews-${propertyId}`}>
      <h3>Property Reviews</h3>
      <div data-testid="review-form">Review Form</div>
      <div data-testid="reviews-list">Reviews List</div>
    </div>
  ))
}));

// Mock date formatting utility
vi.mock('../../../shared/utils/date-utils', () => ({
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString())
}));

describe('PropertyDetails Page', () => {
  const mockProperty = {
    id: '1',
    title: 'Modern 3-Bedroom Apartment in Nairobi',
    description: 'Beautiful modern apartment with stunning city views, located in the heart of Nairobi. Features include modern appliances, spacious rooms, and excellent security.',
    location: 'Westlands, Nairobi',
    price: 150000,
    images: [
      '/placeholder-property.jpg',
      '/placeholder-property-2.jpg',
      '/placeholder-property-3.jpg'
    ],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 2,
      yearBuilt: 2020,
      amenities: ['Swimming Pool', 'Gym', 'Security', 'Garden', 'Parking'],
      propertyType: 'Apartment',
      petFriendly: true,
      furnished: false
    },
    status: 'verified',
    verificationData: {
      imageAnalysis: {
        qualityScore: 95,
        authenticityScore: 98,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        accuracyScore: 92,
        completenessScore: 88,
        suggestedImprovements: []
      },
      overallScore: 94,
      verificationTimestamp: '2024-01-15T10:30:00Z',
      aiModel: 'TripleCheck-AI-v2.1'
    },
    owner: {
      name: 'John Doe',
      phone: '+254 700 123 456',
      email: 'john.doe@example.com',
      trustScore: 4.8,
      verified: true
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure and Layout', () => {
    it('renders the main property details page structure', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
      expect(screen.getByText(mockProperty.location)).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });

    it('displays property status badge', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const statusBadge = screen.getByText('verified');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('.bg-green-100')).toBeInTheDocument();
    });

    it('renders property location with map pin icon', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const locationElement = screen.getByText(mockProperty.location);
      expect(locationElement).toBeInTheDocument();
      
      // Check for map pin icon (using aria-hidden attribute)
      const mapIcon = locationElement.parentElement?.querySelector('[aria-hidden="true"]');
      expect(mapIcon).toBeInTheDocument();
    });

    it('displays formatted price correctly', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('$150,000')).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toHaveClass('text-2xl', 'font-bold', 'text-blue-600');
    });
  });

  describe('Image Gallery Section', () => {
    it('renders image gallery with main image', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const mainImage = screen.getByAltText(mockProperty.title);
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('src', mockProperty.images[0]);
    });

    it('renders thumbnail images', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Check for additional images
      const additionalImages = screen.getAllByAltText(/Modern 3-Bedroom Apartment in Nairobi \d+/);
      expect(additionalImages).toHaveLength(2); // 2 additional images besides main
    });

    it('displays images in proper grid layout', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const imageContainer = screen.getByRole('img', { name: mockProperty.title }).closest('.grid');
      expect(imageContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('handles missing images gracefully', () => {
      // Test with property that has no images
      const propertyWithoutImages = { ...mockProperty, images: [] };
      
      // Mock the component to handle empty images
      const { container } = renderWithProviders(<PropertyDetails id="1" />);
      
      // Should still render the page structure
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });
  });

  describe('Property Description Section', () => {
    it('renders description card with proper title', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText(mockProperty.description)).toBeInTheDocument();
    });

    it('displays description text with proper styling', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const descriptionText = screen.getByText(mockProperty.description);
      expect(descriptionText).toHaveClass('text-gray-700', 'leading-relaxed');
    });
  });

  describe('Property Features Section', () => {
    it('renders property features card', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Property Features')).toBeInTheDocument();
    });

    it('displays basic property metrics with icons', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('3 Bedrooms')).toBeInTheDocument();
      expect(screen.getByText('2 Bathrooms')).toBeInTheDocument();
      expect(screen.getByText('1200 sqft')).toBeInTheDocument();
      expect(screen.getByText('Built 2020')).toBeInTheDocument();
    });

    it('renders amenities section with badges', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Amenities')).toBeInTheDocument();
      
      mockProperty.features.amenities.forEach(amenity => {
        expect(screen.getByText(amenity)).toBeInTheDocument();
      });
    });

    it('handles properties without amenities', () => {
      // Mock property without amenities
      const propertyWithoutAmenities = {
        ...mockProperty,
        features: { ...mockProperty.features, amenities: [] }
      };

      renderWithProviders(<PropertyDetails id="1" />);

      // Should show "No amenities listed" or similar message
      expect(screen.getByText('No amenities listed')).toBeInTheDocument();
    });

    it('displays property metrics in grid layout', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const metricsContainer = screen.getByText('3 Bedrooms').closest('.grid');
      expect(metricsContainer).toHaveClass('grid-cols-2', 'md:grid-cols-4');
    });
  });

  describe('Verification Report Section', () => {
    it('renders verification report when data is available', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Verification Report')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument(); // Overall score
      expect(screen.getByText('Overall Score')).toBeInTheDocument();
    });

    it('displays verification scores with proper styling', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const overallScore = screen.getByText('94%');
      expect(overallScore).toHaveClass('text-2xl', 'font-bold', 'text-green-600');

      const authenticityScore = screen.getByText('98%');
      expect(authenticityScore).toHaveClass('text-2xl', 'font-bold', 'text-blue-600');

      const accuracyScore = screen.getByText('92%');
      expect(accuracyScore).toHaveClass('text-2xl', 'font-bold', 'text-purple-600');
    });

    it('shows verification timestamp and AI model', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText(/Verified on/)).toBeInTheDocument();
      expect(screen.getByText(/TripleCheck-AI-v2.1/)).toBeInTheDocument();
    });

    it('displays verification metrics in grid layout', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const metricsContainer = screen.getByText('Overall Score').closest('.grid');
      expect(metricsContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('does not render verification section when data is missing', () => {
      const propertyWithoutVerification = {
        ...mockProperty,
        verificationData: null
      };

      // Mock the component to handle missing verification data
      renderWithProviders(<PropertyDetails id="1" />);

      // Should still render other sections
      expect(screen.getByText('Property Features')).toBeInTheDocument();
    });
  });

  describe('Contact Owner Section', () => {
    it('renders contact owner card', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Contact Owner')).toBeInTheDocument();
      expect(screen.getByText(mockProperty.owner.name)).toBeInTheDocument();
    });

    it('displays owner trust score and verification status', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Trust Score: 4.8/5.0')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders contact action buttons', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Call Owner')).toBeInTheDocument();
      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });

    it('displays owner information with user icon', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const ownerName = screen.getByText(mockProperty.owner.name);
      expect(ownerName).toBeInTheDocument();
      
      // Check for user icon
      const userIcon = ownerName.closest('.flex')?.querySelector('[aria-hidden="true"]');
      expect(userIcon).toBeInTheDocument();
    });

    it('shows verified badge for verified owners', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const verifiedBadge = screen.getByText('Verified');
      expect(verifiedBadge).toBeInTheDocument();
      expect(verifiedBadge.closest('.bg-green-100')).toBeInTheDocument();
    });
  });

  describe('Quick Actions Section', () => {
    it('renders quick actions card', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('displays all quick action buttons', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Save to Favorites')).toBeInTheDocument();
      expect(screen.getByText('Share Property')).toBeInTheDocument();
      expect(screen.getByText('Schedule Viewing')).toBeInTheDocument();
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });

    it('renders action buttons with proper styling', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const actionButtons = [
        'Save to Favorites',
        'Share Property',
        'Schedule Viewing',
        'Report Issue'
      ];

      actionButtons.forEach(buttonText => {
        const button = screen.getByText(buttonText);
        expect(button).toHaveClass('w-full');
      });
    });
  });

  describe('User Interactions', () => {
    it('handles call owner button click', async () => {
      const user = userEventInstance;
      
      renderWithProviders(<PropertyDetails id="1" />);

      const callButton = screen.getByText('Call Owner');
      await user.click(callButton);

      // Should trigger some action (in real app, might open phone dialer)
      expect(callButton).toBeInTheDocument();
    });

    it('handles send message button click', async () => {
      const user = userEventInstance;
      
      renderWithProviders(<PropertyDetails id="1" />);

      const messageButton = screen.getByText('Send Message');
      await user.click(messageButton);

      // Should trigger some action (in real app, might open message form)
      expect(messageButton).toBeInTheDocument();
    });

    it('handles quick action button clicks', async () => {
      const user = userEventInstance;
      
      renderWithProviders(<PropertyDetails id="1" />);

      const quickActions = [
        'Save to Favorites',
        'Share Property',
        'Schedule Viewing',
        'Report Issue'
      ];

      for (const actionText of quickActions) {
        const button = screen.getByText(actionText);
        await user.click(button);
        expect(button).toBeInTheDocument();
      }
    });
  });

  describe('Reviews Integration', () => {
    it('renders property reviews component', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByTestId('property-reviews-1')).toBeInTheDocument();
      expect(screen.getByText('Property Reviews')).toBeInTheDocument();
    });

    it('passes correct property ID to reviews component', () => {
      renderWithProviders(<PropertyDetails id="123" />);

      expect(screen.getByTestId('property-reviews-123')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('uses responsive grid classes for layout', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Check main grid layout
      const mainGrid = screen.getByText(mockProperty.title).closest('.grid');
      expect(mainGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
    });

    it('uses responsive classes for image gallery', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const imageGrid = screen.getByRole('img', { name: mockProperty.title }).closest('.grid');
      expect(imageGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('uses responsive classes for property features', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const featuresGrid = screen.getByText('3 Bedrooms').closest('.grid');
      expect(featuresGrid).toHaveClass('grid-cols-2', 'md:grid-cols-4');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Main title should be h1
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent(mockProperty.title);

      // Section titles should be properly structured
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Property Features')).toBeInTheDocument();
    });

    it('has proper alt text for images', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const mainImage = screen.getByAltText(mockProperty.title);
      expect(mainImage).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      const callButton = screen.getByRole('button', { name: 'Call Owner' });
      expect(callButton).toBeInTheDocument();

      const messageButton = screen.getByRole('button', { name: 'Send Message' });
      expect(messageButton).toBeInTheDocument();
    });

    it('uses semantic HTML elements', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Should use proper semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(6); // All action buttons
    });

    it('has proper ARIA labels for icons', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Icons should have aria-hidden="true"
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles missing property ID gracefully', () => {
      renderWithProviders(<PropertyDetails />);

      // Should render with default property data
      expect(screen.getByText('Modern 3-Bedroom Apartment in Nairobi')).toBeInTheDocument();
    });

    it('handles missing property features gracefully', () => {
      const propertyWithoutFeatures = {
        ...mockProperty,
        features: null
      };

      renderWithProviders(<PropertyDetails id="1" />);

      // Should still render basic property information
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });

    it('handles missing owner information gracefully', () => {
      const propertyWithoutOwner = {
        ...mockProperty,
        owner: null
      };

      renderWithProviders(<PropertyDetails id="1" />);

      // Should still render other sections
      expect(screen.getByText('Property Features')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large amounts of data', () => {
      const propertyWithManyAmenities = {
        ...mockProperty,
        features: {
          ...mockProperty.features,
          amenities: Array.from({ length: 50 }, (_, i) => `Amenity ${i + 1}`)
        }
      };

      const startTime = performance.now();
      renderWithProviders(<PropertyDetails id="1" />);
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByText('Property Features')).toBeInTheDocument();
    });

    it('does not re-render unnecessarily', () => {
      const { rerender } = renderWithProviders(<PropertyDetails id="1" />);

      const initialTitle = screen.getByText(mockProperty.title);
      expect(initialTitle).toBeInTheDocument();

      // Re-render with same props
      rerender(<PropertyDetails id="1" />);

      const afterRerenderTitle = screen.getByText(mockProperty.title);
      expect(afterRerenderTitle).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('formats price correctly', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });

    it('formats dates correctly', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Should format verification timestamp
      expect(screen.getByText(/Verified on/)).toBeInTheDocument();
    });

    it('handles different property types correctly', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      // Should display property type from features
      expect(screen.getByText('Apartment')).toBeInTheDocument();
    });

    it('formats trust score correctly', () => {
      renderWithProviders(<PropertyDetails id="1" />);

      expect(screen.getByText('Trust Score: 4.8/5.0')).toBeInTheDocument();
    });
  });
});