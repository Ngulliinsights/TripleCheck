import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, userEventInstance } from '../../../shared/test-utils'
import { TestDataFactory, createTestFile, createTestImageFile } from '../../../shared/test-utils/fixtures'
import ListPropertyPage from '../ListProperty'

// Mock the API client
vi.mock('../../../infrastructure/api/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../../../shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock react-query
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

describe('ListProperty Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
    mockMutate.mockClear();
    mockInvalidateQueries.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure and Navigation', () => {
    it('renders the main page structure', () => {
      renderWithProviders(<ListPropertyPage />);

      expect(screen.getByText('List Your Property')).toBeInTheDocument();
      expect(screen.getByText(/Add your property to our trusted platform/)).toBeInTheDocument();
      expect(screen.getByText('Property Information')).toBeInTheDocument();
    });

    it('displays step navigation with all steps', () => {
      renderWithProviders(<ListPropertyPage />);

      expect(screen.getByText('Basic Details')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    it('shows current step indicator', () => {
      renderWithProviders(<ListPropertyPage />);

      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    it('highlights current step in navigation', () => {
      renderWithProviders(<ListPropertyPage />);

      const basicDetailsTab = screen.getByText('Basic Details').closest('button');
      expect(basicDetailsTab).toHaveClass('text-[#2C5282]', 'border-b-2', 'border-[#2C5282]');
    });
  });

  describe('Step 1: Basic Details', () => {
    it('renders all basic details form fields', () => {
      renderWithProviders(<ListPropertyPage />);

      expect(screen.getByLabelText(/Property Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Property Type/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price \(KES\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ownership Status/)).toBeInTheDocument();
    });

    it('shows required field indicators', () => {
      renderWithProviders(<ListPropertyPage />);

      const requiredFields = screen.getAllByText('*');
      expect(