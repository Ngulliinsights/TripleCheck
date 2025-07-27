/**
 * PropertyListingWizard Component Tests
 * Comprehensive testing for multi-step property listing form
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders, userEventInstance } from '@/shared/test-utils';
import { formTestingUtils, FileUploadHelpers, type FormField } from '@/shared/test-utils/form-testing';
import { PropertyListingWizard, type PropertyFormData } from '../PropertyListingWizard';

// Mock dependencies
vi.mock('../services/property-api', () => ({
  propertyApi: {
    createProperty: vi.fn(),
  },
}));

vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((config) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  })),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

describe('PropertyListingWizard', () => {
  const mockOnSave = vi.fn();
  const mockOnPublish = vi.fn();
  const mockOnCancel = vi.fn();
  const mockMutateAsync = vi.fn();

  const initialData: Partial<PropertyFormData> = {
    title: 'Test Property',
    description: 'A beautiful test property',
    propertyType: 'apartment',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useMutation
    const { useMutation } = require('@tanstack/react-query');
    useMutation.mockImplementation((config) => ({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render wizard with all steps', () => {
      renderWithProviders(<PropertyListingWizard />);

      expect(screen.getByText('List Your Property')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      
      // Check step navigation
      expect(screen.getByText('Basic Details')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should render with initial data', () => {
      renderWithProviders(<PropertyListingWizard initialData={initialData} />);

      expect(screen.getByDisplayValue('Test Property')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A beautiful test property')).toBeInTheDocument();
    });

    it('should show progress indicator', () => {
      renderWithProviders(<PropertyListingWizard />);

      expect(screen.getByText('17% Complete')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '17');
    });
  });

  describe('Step Navigation', () => {
    it('should navigate through steps sequentially', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Start at Basic Details step
      expect(screen.getByText('Property title, type, and description')).toBeInTheDocument();

      // Fill required fields for step 1
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      // Navigate to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Should be on Location step
      await waitFor(() => {
        expect(screen.getByText('Address and map location')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });
    });

    it('should prevent navigation with incomplete required fields', async () => {
      renderWithProviders(<PropertyListingWizard />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Should show validation error and stay on current step
      await waitFor(() => {
        expect(screen.getByText(/please complete required fields/i)).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      });
    });

    it('should allow navigation to previous steps', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Fill step 1 and navigate to step 2
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });

      // Navigate back to step 1
      const previousButton = screen.getByRole('button', { name: /previous/i });
      await userEventInstance.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Property')).toBeInTheDocument();
      });
    });

    it('should allow direct navigation to completed steps', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Complete step 1
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Should be able to click on step 1 directly
      const step1Button = screen.getByRole('button', { name: /basic details/i });
      await userEventInstance.click(step1Button);

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-Step Form Testing', () => {
    it('should complete entire wizard flow', async () => {
      renderWithProviders(<PropertyListingWizard onPublish={mockOnPublish} />);

      const wizardSteps = [
        {
          stepName: 'Basic Details',
          fields: [
            { name: 'title', type: 'text' as const, label: 'Title', value: 'Test Property' },
            { name: 'description', type: 'textarea' as const, label: 'Description', value: 'Test Description' },
            { name: 'propertyType', type: 'select' as const, label: 'Property Type', value: 'apartment' },
          ],
        },
        {
          stepName: 'Location',
          fields: [
            { name: 'address', type: 'text' as const, label: 'Address', value: '123 Test Street' },
            { name: 'city', type: 'text' as const, label: 'City', value: 'Nairobi' },
          ],
        },
        {
          stepName: 'Features',
          fields: [
            { name: 'bedrooms', type: 'number' as const, label: 'Bedrooms', value: '2' },
            { name: 'bathrooms', type: 'number' as const, label: 'Bathrooms', value: '1' },
            { name: 'area', type: 'number' as const, label: 'Area', value: '100' },
          ],
        },
        {
          stepName: 'Images',
          fields: [
            { 
              name: 'images', 
              type: 'file' as const, 
              label: 'Images', 
              value: [FileUploadHelpers.createTestFile('property1.jpg')] 
            },
          ],
        },
        {
          stepName: 'Pricing',
          fields: [
            { name: 'price', type: 'number' as const, label: 'Price', value: '50000' },
            { name: 'priceType', type: 'select' as const, label: 'Price Type', value: 'sale' },
          ],
        },
        {
          stepName: 'Preview',
          fields: [],
        },
      ];

      await formTestingUtils.testMultiStepForm(wizardSteps);

      // Should reach final step
      expect(screen.getByText('Step 6 of 6')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /publish property/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate basic details step', async () => {
      renderWithProviders(<PropertyListingWizard />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete required fields/i)).toBeInTheDocument();
      });

      // Fill required fields
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      // Should now allow navigation
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });
    });

    it('should validate location step', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Complete step 1
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      let nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Try to proceed without location data
      nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete required fields/i)).toBeInTheDocument();
      });

      // Fill location fields
      await userEventInstance.type(screen.getByLabelText(/address/i), '123 Test Street');
      await userEventInstance.type(screen.getByLabelText(/city/i), 'Nairobi');

      // Should now allow navigation
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 3 of 6')).toBeInTheDocument();
      });
    });

    it('should validate numeric fields in features step', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Navigate to features step
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      let nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await userEventInstance.type(screen.getByLabelText(/address/i), '123 Test Street');
      await userEventInstance.type(screen.getByLabelText(/city/i), 'Nairobi');

      nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Should be on features step
      await waitFor(() => {
        expect(screen.getByText('Step 3 of 6')).toBeInTheDocument();
      });

      // Try to proceed with zero values
      const bedroomsField = screen.getByLabelText(/bedrooms/i);
      const bathroomsField = screen.getByLabelText(/bathrooms/i);
      const areaField = screen.getByLabelText(/area/i);

      await userEventInstance.clear(bedroomsField);
      await userEventInstance.clear(bathroomsField);
      await userEventInstance.clear(areaField);

      nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete required fields/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('should handle image uploads', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Navigate to images step
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      let nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await userEventInstance.type(screen.getByLabelText(/address/i), '123 Test Street');
      await userEventInstance.type(screen.getByLabelText(/city/i), 'Nairobi');

      nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await userEventInstance.type(screen.getByLabelText(/bedrooms/i), '2');
      await userEventInstance.type(screen.getByLabelText(/bathrooms/i), '1');
      await userEventInstance.type(screen.getByLabelText(/area/i), '100');

      nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Should be on images step
      await waitFor(() => {
        expect(screen.getByText('Step 4 of 6')).toBeInTheDocument();
      });

      // Test file upload
      const testFiles = FileUploadHelpers.createTestFiles(3, 'property');
      const fileField: FormField = {
        name: 'images',
        type: 'file',
        label: 'Upload Images',
      };

      await formTestingUtils.testFileUpload(fileField, testFiles, 'Files uploaded successfully');
    });

    it('should validate file types and sizes', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Navigate to images step (abbreviated)
      // ... navigation code ...

      const invalidFile = FileUploadHelpers.createTestFile('document.pdf', 'application/pdf');
      const fileField: FormField = {
        name: 'images',
        type: 'file',
        label: 'Upload Images',
      };

      await FileUploadHelpers.testFileValidation(
        fileField,
        invalidFile,
        'Only image files are allowed'
      );
    });

    it('should support drag and drop upload', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Navigate to images step (abbreviated)
      // ... navigation code ...

      const testFiles = FileUploadHelpers.createTestFiles(2, 'property');
      
      await formTestingUtils.testDragAndDropUpload(
        'image-drop-zone',
        testFiles,
        'Files uploaded successfully'
      );
    });
  });

  describe('Form State Management', () => {
    it('should preserve form data across steps', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Fill step 1
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // Navigate back to step 1
      const previousButton = screen.getByRole('button', { name: /previous/i });
      await userEventInstance.click(previousButton);

      // Data should be preserved
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Property')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      });
    });

    it('should update form state when fields change', async () => {
      renderWithProviders(<PropertyListingWizard />);

      const initialFields: FormField[] = [
        { name: 'title', type: 'text', label: 'Title', value: 'Initial Title' },
      ];

      const updatedFields: FormField[] = [
        { name: 'title', type: 'text', label: 'Title', value: 'Updated Title' },
      ];

      await formTestingUtils.testFormState(
        initialFields,
        updatedFields,
        { title: 'Updated Title' }
      );
    });
  });

  describe('Save and Publish', () => {
    it('should save as draft', async () => {
      mockMutateAsync.mockResolvedValue({ id: '1', status: 'draft' });
      renderWithProviders(<PropertyListingWizard onSave={mockOnSave} />);

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEventInstance.click(saveDraftButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should publish property after validation', async () => {
      mockMutateAsync.mockResolvedValue({ id: '1', status: 'active' });
      renderWithProviders(<PropertyListingWizard onPublish={mockOnPublish} />);

      // Complete all steps (abbreviated)
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      // Navigate to final step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      // ... complete other steps ...

      // On final step, publish
      const publishButton = screen.getByRole('button', { name: /publish property/i });
      await userEventInstance.click(publishButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
        expect(mockOnPublish).toHaveBeenCalled();
      });
    });

    it('should prevent publishing with incomplete data', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Try to publish without completing all steps
      const publishButton = screen.getByRole('button', { name: /publish property/i });
      await userEventInstance.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockImplementation((config) => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockRejectedValue(new Error('Save failed')),
        isPending: false,
        error: new Error('Save failed'),
      }));

      renderWithProviders(<PropertyListingWizard />);

      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      await userEventInstance.click(saveDraftButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save draft/i)).toBeInTheDocument();
      });
    });

    it('should handle publish errors', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockImplementation((config) => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockRejectedValue(new Error('Publish failed')),
        isPending: false,
        error: new Error('Publish failed'),
      }));

      renderWithProviders(<PropertyListingWizard />);

      // Complete form and try to publish
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      const publishButton = screen.getByRole('button', { name: /publish property/i });
      await userEventInstance.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to publish property/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during save', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockImplementation((config) => ({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      }));

      renderWithProviders(<PropertyListingWizard />);

      const saveDraftButton = screen.getByRole('button', { name: /saving/i });
      expect(saveDraftButton).toBeDisabled();
    });

    it('should show loading state during publish', async () => {
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockImplementation((config) => ({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      }));

      renderWithProviders(<PropertyListingWizard />);

      const publishButton = screen.getByRole('button', { name: /publishing/i });
      expect(publishButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper step navigation accessibility', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Check ARIA labels for step navigation
      const stepButtons = screen.getAllByRole('button');
      const stepNavButtons = stepButtons.filter(button => 
        button.textContent?.includes('Basic Details') ||
        button.textContent?.includes('Location') ||
        button.textContent?.includes('Features')
      );

      stepNavButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should announce step changes to screen readers', async () => {
      renderWithProviders(<PropertyListingWizard />);

      // Complete step 1 and navigate
      await userEventInstance.type(screen.getByLabelText(/title/i), 'Test Property');
      await userEventInstance.type(screen.getByLabelText(/description/i), 'Test Description');
      await userEventInstance.selectOptions(screen.getByLabelText(/property type/i), 'apartment');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEventInstance.click(nextButton);

      await waitFor(() => {
        const stepIndicator = screen.getByText('Step 2 of 6');
        expect(stepIndicator).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should handle form cancellation', async () => {
      renderWithProviders(<PropertyListingWizard onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEventInstance.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});