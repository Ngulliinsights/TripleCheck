import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders, userEventInstance, createTestQueryClient, createTestImageFile } from '../../../shared/test-utils';
import { TestDataFactory } from '../../../shared/test-utils/fixtures';
import { server } from '../../../shared/test-utils/msw-server';
import { http, HttpResponse } from 'msw';
import { PropertyListingWizard } from '../PropertyListingWizard';

// Mock the toast hook
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the PropertyMap component
vi.mock('../PropertyMap', () => ({
  PropertyMap: ({ location }: any) => (
    <div data-testid="property-map">
      Map for {location?.address || 'No address'}
    </div>
  ),
}));

describe('Property Creation and Editing Forms - Validation and File Uploads', () => {
  let queryClient: QueryClient;
  const mockToast = vi.fn();

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    
    // Mock the toast hook
    vi.doMock('@/shared/hooks/use-toast', () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }));
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Wizard Navigation and Progress', () => {
    it('renders wizard with initial step and progress', () => {
      renderWithProviders(<PropertyListingWizard />, { queryClient });

      expect(screen.getByText('List Your Property')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('Basic Details')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows all wizard steps in navigation', () => {
      renderWithProviders(<PropertyListingWizard />, { queryClient });

      expect(screen.getByText('Basic Details')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('navigates between steps correctly', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Fill basic details to enable next step
      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Test Property');

      const descriptionInput = screen.getByLabelText(/detailed description/i);
      await user.type(descriptionInput, 'Test description');

      // Navigate to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('prevents navigation to next step with invalid data', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Try to navigate without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should show validation message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Please complete required fields',
            variant: 'destructive',
          })
        );
      });
    });

    it('allows navigation back to previous steps', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Fill basic details and go to next step
      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Test Property');

      const descriptionInput = screen.getByLabelText(/detailed description/i);
      await user.type(descriptionInput, 'Test description');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Go back to previous step
      const previousButton = screen.getByRole('button', { name: /previous/i });
      await user.click(previousButton);

      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('Basic Details')).toBeInTheDocument();
    });

    it('updates progress bar as user advances through steps', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Initial progress should be ~17% (1/6)
      expect(screen.getByText('17% Complete')).toBeInTheDocument();

      // Fill basic details and advance
      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Test Property');

      const descriptionInput = screen.getByLabelText(/detailed description/i);
      await user.type(descriptionInput, 'Test description');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Progress should be ~33% (2/6)
      expect(screen.getByText('33% Complete')).toBeInTheDocument();
    });
  });

  describe('Basic Details Step', () => {
    it('renders basic details form fields', () => {
      renderWithProviders(<PropertyListingWizard />, { queryClient });

      expect(screen.getByLabelText(/property title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select property type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/detailed description/i)).toBeInTheDocument();
    });

    it('validates required fields in basic details', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should prevent navigation and show validation
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    });

    it('accepts valid basic details input', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Modern Apartment');

      const typeSelect = screen.getByLabelText(/select property type/i);
      await user.selectOptions(typeSelect, 'apartment');

      const descriptionInput = screen.getByLabelText(/detailed description/i);
      await user.type(descriptionInput, 'Beautiful modern apartment with city views');

      expect(titleInput).toHaveValue('Modern Apartment');
      expect(typeSelect).toHaveValue('apartment');
      expect(descriptionInput).toHaveValue('Beautiful modern apartment with city views');
    });

    it('shows character count for description field', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      const descriptionInput = screen.getByLabelText(/detailed description/i);
      await user.type(descriptionInput, 'Test description');

      // Should show character count
      expect(screen.getByText(/characters/i)).toBeInTheDocument();
    });
  });

  describe('Location Step', () => {
    it('renders location form fields', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Navigate to location step
      await fillBasicDetailsAndAdvance(user);

      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it('validates required location fields', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);

      // Try to advance without filling location
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should prevent navigation
      expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    });

    it('accepts valid location input', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);

      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Main Street');

      const cityInput = screen.getByLabelText(/city/i);
      await user.type(cityInput, 'Nairobi');

      expect(addressInput).toHaveValue('123 Main Street');
      expect(cityInput).toHaveValue('Nairobi');
    });

    it('shows property map when location is provided', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);

      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Main Street');

      // Should show map component
      expect(screen.getByTestId('property-map')).toBeInTheDocument();
    });
  });

  describe('Features Step', () => {
    it('renders features form fields', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);

      expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/area/i)).toBeInTheDocument();
      expect(screen.getByText(/amenities/i)).toBeInTheDocument();
    });

    it('validates numeric fields in features', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);

      const bedroomsInput = screen.getByLabelText(/bedrooms/i);
      await user.type(bedroomsInput, '0');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should prevent navigation with invalid values
      expect(screen.getByText('Step 3 of 6')).toBeInTheDocument();
    });

    it('accepts valid features input', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);

      const bedroomsInput = screen.getByLabelText(/bedrooms/i);
      await user.clear(bedroomsInput);
      await user.type(bedroomsInput, '3');

      const bathroomsInput = screen.getByLabelText(/bathrooms/i);
      await user.clear(bathroomsInput);
      await user.type(bathroomsInput, '2');

      const areaInput = screen.getByLabelText(/area/i);
      await user.type(areaInput, '1200');

      expect(bedroomsInput).toHaveValue(3);
      expect(bathroomsInput).toHaveValue(2);
      expect(areaInput).toHaveValue(1200);
    });

    it('allows selection of amenities', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);

      // Should show amenities selection
      expect(screen.getByText(/amenities/i)).toBeInTheDocument();
    });
  });

  describe('Images Step - File Upload', () => {
    it('renders image upload interface', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      expect(screen.getByText(/upload images/i)).toBeInTheDocument();
      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    });

    it('validates that at least one image is uploaded', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      // Try to advance without uploading images
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should prevent navigation
      expect(screen.getByText('Step 4 of 6')).toBeInTheDocument();
    });

    it('accepts valid image files', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      // Create test image file
      const imageFile = createTestImageFile('test-property.jpg');
      
      const fileInput = screen.getByLabelText(/upload images/i);
      await user.upload(fileInput, imageFile);

      // Should show uploaded image
      expect(screen.getByText('test-property.jpg')).toBeInTheDocument();
    });

    it('validates image file types', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      // Create invalid file type
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const fileInput = screen.getByLabelText(/upload images/i);
      await user.upload(fileInput, invalidFile);

      // Should show error message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Invalid file type'),
            variant: 'destructive',
          })
        );
      });
    });

    it('validates image file size limits', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      // Create oversized file (mock)
      const oversizedFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      const fileInput = screen.getByLabelText(/upload images/i);
      await user.upload(fileInput, oversizedFile);

      // Should show error message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('File too large'),
            variant: 'destructive',
          })
        );
      });
    });

    it('allows multiple image uploads', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      // Create multiple test images
      const image1 = createTestImageFile('property1.jpg');
      const image2 = createTestImageFile('property2.jpg');
      
      const fileInput = screen.getByLabelText(/upload images/i);
      await user.upload(fileInput, [image1, image2]);

      // Should show both uploaded images
      expect(screen.getByText('property1.jpg')).toBeInTheDocument();
      expect(screen.getByText('property2.jpg')).toBeInTheDocument();
    });

    it('allows removing uploaded images', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);

      // Upload image
      const imageFile = createTestImageFile('test-property.jpg');
      const fileInput = screen.getByLabelText(/upload images/i);
      await user.upload(fileInput, imageFile);

      // Remove image
      const removeButton = screen.getByRole('button', { name: /remove.*test-property.jpg/i });
      await user.click(removeButton);

      // Image should be removed
      expect(screen.queryByText('test-property.jpg')).not.toBeInTheDocument();
    });
  });

  describe('Pricing Step', () => {
    it('renders pricing form fields', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);
      await fillImagesAndAdvance(user);

      expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/price type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    });

    it('validates price is greater than zero', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);
      await fillImagesAndAdvance(user);

      const priceInput = screen.getByLabelText(/price/i);
      await user.type(priceInput, '0');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should prevent navigation
      expect(screen.getByText('Step 5 of 6')).toBeInTheDocument();
    });

    it('accepts valid pricing input', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);
      await fillImagesAndAdvance(user);

      const priceInput = screen.getByLabelText(/price/i);
      await user.type(priceInput, '1500000');

      const priceTypeSelect = screen.getByLabelText(/price type/i);
      await user.selectOptions(priceTypeSelect, 'sale');

      expect(priceInput).toHaveValue(1500000);
      expect(priceTypeSelect).toHaveValue('sale');
    });

    it('shows market insights and pricing suggestions', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillBasicDetailsAndAdvance(user);
      await fillLocationAndAdvance(user);
      await fillFeaturesAndAdvance(user);
      await fillImagesAndAdvance(user);

      // Should show pricing insights
      expect(screen.getByText(/market insights/i)).toBeInTheDocument();
    });
  });

  describe('Preview Step', () => {
    it('renders property preview with all entered data', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillAllStepsAndAdvance(user);

      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText(/review.*publish/i)).toBeInTheDocument();
    });

    it('shows publish button on final step', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillAllStepsAndAdvance(user);

      expect(screen.getByRole('button', { name: /publish property/i })).toBeInTheDocument();
    });

    it('allows editing from preview by navigating back', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillAllStepsAndAdvance(user);

      // Click on basic details step to edit
      const basicDetailsStep = screen.getByText('Basic Details');
      await user.click(basicDetailsStep);

      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    });
  });

  describe('Save Draft Functionality', () => {
    beforeEach(() => {
      server.use(
        http.post('/api/properties', () => {
          return HttpResponse.json({
            id: 'new-property-id',
            title: 'Test Property',
            status: 'inactive',
          }, { status: 201 });
        })
      );
    });

    it('saves draft at any step', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Fill basic details
      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Draft Property');

      // Save draft
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Draft saved successfully',
          })
        );
      });
    });

    it('shows saving state during draft save', async () => {
      const user = userEventInstance;

      server.use(
        http.post('/api/properties', () => {
          return new Promise(resolve => 
            setTimeout(() => resolve(HttpResponse.json({ id: 'test' })), 1000)
          );
        })
      );

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Draft Property');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });

  describe('Publish Property', () => {
    beforeEach(() => {
      server.use(
        http.post('/api/properties', () => {
          return HttpResponse.json({
            id: 'published-property-id',
            title: 'Test Property',
            status: 'active',
          }, { status: 201 });
        })
      );
    });

    it('publishes property after completing all steps', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillAllStepsAndAdvance(user);

      const publishButton = screen.getByRole('button', { name: /publish property/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Property published successfully',
          })
        );
      });
    });

    it('validates all steps before publishing', async () => {
      const user = userEventInstance;

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      // Try to publish without completing all steps
      const publishButton = screen.getByRole('button', { name: /publish property/i });
      
      // This button shouldn't be available until final step
      expect(publishButton).not.toBeInTheDocument();
    });

    it('shows publishing state during submission', async () => {
      const user = userEventInstance;

      server.use(
        http.post('/api/properties', () => {
          return new Promise(resolve => 
            setTimeout(() => resolve(HttpResponse.json({ id: 'test' })), 1000)
          );
        })
      );

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillAllStepsAndAdvance(user);

      const publishButton = screen.getByRole('button', { name: /publish property/i });
      await user.click(publishButton);

      expect(screen.getByRole('button', { name: /publishing/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors during save', async () => {
      const user = userEventInstance;

      server.use(
        http.post('/api/properties', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      const titleInput = screen.getByLabelText(/property title/i);
      await user.type(titleInput, 'Test Property');

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await user.click(saveDraftButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to save draft',
            variant: 'destructive',
          })
        );
      });
    });

    it('handles API errors during publish', async () => {
      const user = userEventInstance;

      server.use(
        http.post('/api/properties', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<PropertyListingWizard />, { queryClient });

      await fillAllStepsAndAdvance(user);

      const publishButton = screen.getByRole('button', { name: /publish property/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to publish property',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Initial Data Support', () => {
    it('accepts initial data for editing existing property', () => {
      const initialData = {
        title: 'Existing Property',
        description: 'Existing description',
        propertyType: 'apartment' as const,
      };

      renderWithProviders(
        <PropertyListingWizard initialData={initialData} />, 
        { queryClient }
      );

      expect(screen.getByDisplayValue('Existing Property')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });
  });

  // Helper functions for test setup
  async function fillBasicDetailsAndAdvance(user: any) {
    const titleInput = screen.getByLabelText(/property title/i);
    await user.type(titleInput, 'Test Property');

    const descriptionInput = screen.getByLabelText(/detailed description/i);
    await user.type(descriptionInput, 'Test description');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  }

  async function fillLocationAndAdvance(user: any) {
    const addressInput = screen.getByLabelText(/address/i);
    await user.type(addressInput, '123 Test Street');

    const cityInput = screen.getByLabelText(/city/i);
    await user.type(cityInput, 'Nairobi');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  }

  async function fillFeaturesAndAdvance(user: any) {
    const bedroomsInput = screen.getByLabelText(/bedrooms/i);
    await user.clear(bedroomsInput);
    await user.type(bedroomsInput, '3');

    const bathroomsInput = screen.getByLabelText(/bathrooms/i);
    await user.clear(bathroomsInput);
    await user.type(bathroomsInput, '2');

    const areaInput = screen.getByLabelText(/area/i);
    await user.type(areaInput, '1200');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  }

  async function fillImagesAndAdvance(user: any) {
    const imageFile = createTestImageFile('test-property.jpg');
    const fileInput = screen.getByLabelText(/upload images/i);
    await user.upload(fileInput, imageFile);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  }

  async function fillAllStepsAndAdvance(user: any) {
    await fillBasicDetailsAndAdvance(user);
    await fillLocationAndAdvance(user);
    await fillFeaturesAndAdvance(user);
    await fillImagesAndAdvance(user);

    // Fill pricing
    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '1500000');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  }
});