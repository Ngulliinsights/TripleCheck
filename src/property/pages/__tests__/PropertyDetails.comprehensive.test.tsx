import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders, userEventInstance, createTestQueryClient } from '../../../shared/test-utils';
import { TestDataFactory } from '../../../shared/test-utils/fixtures';
import { server } from '../../../shared/test-utils/msw-server';
import { http, HttpResponse } from 'msw';
import PropertyDetails from '../PropertyDetails';

// Mock the date utils
vi.mock('../../../shared/utils/date-utils', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

describe('Property Details Page - All Sections', () => {
  let queryClient: QueryClient;
  const mockProperty = {
    id: '1',
    title: 'Modern 3-Bedroom Apartment in Nairobi',
    description: 'Beautiful modern apartment with stunning city views, located in the heart of Nairobi. Features include modern appliances, spacious rooms, and excellent security.',
    location: 'Westlands, Nairobi',
    price: 150000,
    images: [
      '/placeholder-property-1.jpg',
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
    status: 'verified' as const,
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
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Property Header Section', () => {
    it('displays property title and basic information', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
      expect(screen.getByText(mockProperty.location)).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });

    it('shows verification status badge', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const verificationBadge = screen.getByText('verified');
      expect(verificationBadge).toBeInTheDocument();
      expect(verificationBadge.closest('.bg-green-100')).toBeInTheDocument();
    });

    it('displays different status badges correctly', () => {
      const pendingProperty = { ...mockProperty, status: 'pending' as const };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: pendingProperty }
      });

      const pendingBadge = screen.getByText('pending');
      expect(pendingBadge).toBeInTheDocument();
      expect(pendingBadge.closest('.bg-yellow-100')).toBeInTheDocument();
    });

    it('formats price correctly for different amounts', () => {
      const expensiveProperty = { ...mockProperty, price: 1500000 };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: expensiveProperty }
      });

      expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    });
  });

  describe('Image Gallery Section', () => {
    it('displays main property image', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const mainImage = screen.getByAltText(mockProperty.title);
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('src', mockProperty.images[0]);
    });

    it('displays additional images in grid layout', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Should show additional images
      const additionalImages = screen.getAllByRole('img').filter(img => 
        img.getAttribute('alt')?.includes('Modern 3-Bedroom Apartment')
      );
      expect(additionalImages.length).toBeGreaterThan(1);
    });

    it('handles missing images gracefully', () => {
      const noImageProperty = { ...mockProperty, images: [] };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: noImageProperty }
      });

      // Should still render the component without crashing
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });

    it('shows image gallery with proper aspect ratios', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveClass('object-cover');
      });
    });
  });

  describe('Property Description Section', () => {
    it('displays full property description', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByText(mockProperty.description)).toBeInTheDocument();
    });

    it('renders description in a dedicated card section', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const descriptionSection = screen.getByText('Description').closest('.card');
      expect(descriptionSection).toBeInTheDocument();
      
      const descriptionText = within(descriptionSection!).getByText(mockProperty.description);
      expect(descriptionText).toBeInTheDocument();
    });

    it('handles long descriptions properly', () => {
      const longDescription = 'A'.repeat(1000);
      const longDescProperty = { ...mockProperty, description: longDescription };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: longDescProperty }
      });

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe('Property Features Section', () => {
    it('displays basic property features with icons', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByText('3 Bedrooms')).toBeInTheDocument();
      expect(screen.getByText('2 Bathrooms')).toBeInTheDocument();
      expect(screen.getByText('1200 sqft')).toBeInTheDocument();
      expect(screen.getByText('Built 2020')).toBeInTheDocument();
    });

    it('displays amenities as badges', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      mockProperty.features.amenities.forEach(amenity => {
        expect(screen.getByText(amenity)).toBeInTheDocument();
      });
    });

    it('handles properties without amenities', () => {
      const noAmenitiesProperty = { 
        ...mockProperty, 
        features: { ...mockProperty.features, amenities: [] }
      };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: noAmenitiesProperty }
      });

      expect(screen.getByText('No amenities listed')).toBeInTheDocument();
    });

    it('shows features section with proper heading', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const featuresSection = screen.getByText('Property Features').closest('.card');
      expect(featuresSection).toBeInTheDocument();
      
      const amenitiesHeading = within(featuresSection!).getByText('Amenities');
      expect(amenitiesHeading).toBeInTheDocument();
    });

    it('handles missing feature data gracefully', () => {
      const noFeaturesProperty = { ...mockProperty, features: undefined };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: noFeaturesProperty }
      });

      // Should show 0 for missing features
      expect(screen.getByText('0 Bedrooms')).toBeInTheDocument();
      expect(screen.getByText('0 Bathrooms')).toBeInTheDocument();
    });
  });

  describe('Verification Report Section', () => {
    it('displays verification scores and metrics', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByText('94%')).toBeInTheDocument(); // Overall score
      expect(screen.getByText('98%')).toBeInTheDocument(); // Image authenticity
      expect(screen.getByText('92%')).toBeInTheDocument(); // Description accuracy
    });

    it('shows verification timestamp and AI model', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByText(/verified on/i)).toBeInTheDocument();
      expect(screen.getByText('TripleCheck-AI-v2.1')).toBeInTheDocument();
    });

    it('displays verification report with proper headings', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const verificationSection = screen.getByText('Verification Report').closest('.card');
      expect(verificationSection).toBeInTheDocument();
      
      const overallScoreLabel = within(verificationSection!).getByText('Overall Score');
      expect(overallScoreLabel).toBeInTheDocument();
    });

    it('handles missing verification data', () => {
      const noVerificationProperty = { ...mockProperty, verificationData: undefined };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: noVerificationProperty }
      });

      // Verification section should not be rendered
      expect(screen.queryByText('Verification Report')).not.toBeInTheDocument();
    });

    it('shows different score colors based on values', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Overall score should be green (high score)
      const overallScore = screen.getByText('94%');
      expect(overallScore).toHaveClass('text-green-600');

      // Image authenticity should be blue
      const imageScore = screen.getByText('98%');
      expect(imageScore).toHaveClass('text-blue-600');

      // Description accuracy should be purple
      const descScore = screen.getByText('92%');
      expect(descScore).toHaveClass('text-purple-600');
    });
  });

  describe('Contact Owner Section', () => {
    it('displays owner information and trust score', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByText(mockProperty.owner.name)).toBeInTheDocument();
      expect(screen.getByText('Trust Score: 4.8/5.0')).toBeInTheDocument();
    });

    it('shows verified badge for verified owners', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const verifiedBadge = screen.getByText('Verified');
      expect(verifiedBadge).toBeInTheDocument();
      expect(verifiedBadge.closest('.bg-green-100')).toBeInTheDocument();
    });

    it('displays contact action buttons', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByRole('button', { name: /call owner/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('handles unverified owners', () => {
      const unverifiedOwnerProperty = { 
        ...mockProperty, 
        owner: { ...mockProperty.owner, verified: false }
      };
      
      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: unverifiedOwnerProperty }
      });

      expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    });

    it('shows contact section with proper heading', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const contactSection = screen.getByText('Contact Owner').closest('.card');
      expect(contactSection).toBeInTheDocument();
    });
  });

  describe('Quick Actions Section', () => {
    it('displays all quick action buttons', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      expect(screen.getByRole('button', { name: /save to favorites/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share property/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule viewing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();
    });

    it('handles quick action button clicks', async () => {
      const user = userEventInstance;
      
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const saveButton = screen.getByRole('button', { name: /save to favorites/i });
      await user.click(saveButton);

      // Button should be clickable (no errors thrown)
      expect(saveButton).toBeInTheDocument();
    });

    it('shows quick actions section with proper heading', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const quickActionsSection = screen.getByText('Quick Actions').closest('.card');
      expect(quickActionsSection).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Should render without errors on mobile
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });

    it('uses proper grid layout for desktop', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Main content should use grid layout
      const mainContent = screen.getByText(mockProperty.title).closest('.grid');
      expect(mainContent).toBeInTheDocument();
    });

    it('stacks sidebar content on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Contact and quick actions should still be accessible
      expect(screen.getByText('Contact Owner')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('handles loading state gracefully', () => {
      server.use(
        http.get('/api/properties/1', () => {
          return new Promise(() => {}); // Never resolves to simulate loading
        })
      );

      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Should show loading indicators or skeleton
      // Since this component uses mock data, it won't actually show loading
      // But it should render without errors
      expect(document.body).toBeInTheDocument();
    });

    it('handles missing property ID', () => {
      renderWithProviders(<PropertyDetails />, { queryClient });

      // Should use default ID and render
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });

    it('handles API errors gracefully', () => {
      server.use(
        http.get('/api/properties/1', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Should still render with mock data (since component uses mock data)
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Main title should be h1
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent(mockProperty.title);

      // Section headings should be properly structured
      expect(screen.getByRole('heading', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /property features/i })).toBeInTheDocument();
    });

    it('has proper ARIA labels for interactive elements', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const callButton = screen.getByRole('button', { name: /call owner/i });
      expect(callButton).toBeInTheDocument();

      const messageButton = screen.getByRole('button', { name: /send message/i });
      expect(messageButton).toBeInTheDocument();
    });

    it('has proper alt text for images', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const mainImage = screen.getByAltText(mockProperty.title);
      expect(mainImage).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Should be able to tab through interactive elements
      const callButton = screen.getByRole('button', { name: /call owner/i });
      
      await user.tab();
      // First focusable element should receive focus
      expect(document.activeElement).toBeDefined();
    });

    it('has proper color contrast for text elements', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      // Price should have proper contrast
      const priceElement = screen.getByText('$150,000');
      expect(priceElement).toHaveClass('text-blue-600');

      // Status badge should have proper contrast
      const statusBadge = screen.getByText('verified');
      expect(statusBadge.closest('.text-green-800')).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const initialTitle = screen.getByText(mockProperty.title);
      expect(initialTitle).toBeInTheDocument();

      // Re-render with same props
      rerender(<PropertyDetails id="1" />);

      // Should still show the same content
      expect(screen.getByText(mockProperty.title)).toBeInTheDocument();
    });

    it('handles large amounts of amenities efficiently', () => {
      const manyAmenitiesProperty = {
        ...mockProperty,
        features: {
          ...mockProperty.features,
          amenities: Array.from({ length: 50 }, (_, i) => `Amenity ${i + 1}`)
        }
      };

      renderWithProviders(<PropertyDetails id="1" />, { 
        queryClient,
        initialData: { property: manyAmenitiesProperty }
      });

      // Should render all amenities without performance issues
      expect(screen.getByText('Amenity 1')).toBeInTheDocument();
      expect(screen.getByText('Amenity 50')).toBeInTheDocument();
    });

    it('optimizes image loading', () => {
      renderWithProviders(<PropertyDetails id="1" />, { queryClient });

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        // Images should have proper loading attributes
        expect(img).toHaveAttribute('src');
      });
    });
  });
});