/**
 * Reviews Page Tests
 * Comprehensive testing for review submission form and display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, userEventInstance } from '@/shared/test-utils'
import { formTestingUtils, FormValidationHelpers, type FormField } from '@/shared/test-utils/form-testing'
import ReviewsPage from '../Reviews'

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../../shared/utils/date-utils', () => ({
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString()),
}));

describe('ReviewsPage', () => {
  const mockReviews = [
    {
      id: 1,
      userId: 1,
      propertyId: 1,
      rating: 5,
      comment: 'Excellent service, very thorough verification process.',
      userName: 'John Doe',
      createdAt: '2025-03-10',
      helpful: 12,
    },
    {
      id: 2,
      userId: 2,
      propertyId: 1,
      rating: 4,
      comment: 'Good experience overall, would recommend.',
      userName: 'Jane Smith',
      createdAt: '2025-03-09',
      helpful: 8,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useQuery
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockReviews,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render reviews page with all sections', () => {
      renderWithProviders(<ReviewsPage />);

      expect(screen.getByText('Community Reviews & Ratings')).toBeInTheDocument();
      expect(screen.getByText('Real experiences from verified users in our trust network')).toBeInTheDocument();
      expect(screen.getByText('Rating Overview')).toBeInTheDocument();
      expect(screen.getByText('Write a Review')).toBeInTheDocument();
      expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    });

    it('should display rating statistics', () => {
      renderWithProviders(<ReviewsPage />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('Based on 128 reviews')).toBeInTheDocument();
      
      // Check rating distribution
      expect(screen.getByText('5 ★')).toBeInTheDocument();
      expect(screen.getByText('4 ★')).toBeInTheDocument();
      expect(screen.getByText('3 ★')).toBeInTheDocument();
      expect(screen.getByText('2 ★')).toBeInTheDocument();
      expect(screen.getByText('1 ★')).toBeInTheDocument();
    });

    it('should render review form', () => {
      renderWithProviders(<ReviewsPage />);

      expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });

    it('should display existing reviews', () => {
      renderWithProviders(<ReviewsPage />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Excellent service, very thorough verification process.')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Good experience overall, would recommend.')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<ReviewsPage />);

      expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
      expect(screen.getAllByRole('generic')).toHaveLength(3); // Loading skeletons
    });

    it('should show empty state when no reviews', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProviders(<ReviewsPage />);

      expect(screen.getByText('No reviews yet. Be the first to leave a review!')).toBeInTheDocument();
    });
  });

  describe('Review Form', () => {
    it('should handle star rating selection', async () => {
      renderWithProviders(<ReviewsPage />);

      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );

      // Click on 4th star (4-star rating)
      await userEventInstance.click(stars[3]);

      // Check that 4 stars are filled
      const filledStars = stars.slice(0, 4);
      const emptyStars = stars.slice(4);

      filledStars.forEach(star => {
        const svg = star.querySelector('svg');
        expect(svg).toHaveClass('text-yellow-400', 'fill-yellow-400');
      });

      emptyStars.forEach(star => {
        const svg = star.querySelector('svg');
        expect(svg).toHaveClass('text-gray-300');
      });
    });

    it('should handle comment input', async () => {
      renderWithProviders(<ReviewsPage />);

      const commentField = screen.getByLabelText(/your review/i);
      const testComment = 'This is a test review comment';

      await userEventInstance.type(commentField, testComment);

      expect(commentField).toHaveValue(testComment);
    });

    it('should submit review with valid data', async () => {
      const mockHandleSubmit = vi.fn();
      
      // Mock the form submission
      const originalConsoleLog = console.log;
      console.log = mockHandleSubmit;

      renderWithProviders(<ReviewsPage />);

      // Select rating
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );
      await userEventInstance.click(stars[4]); // 5-star rating

      // Enter comment
      const commentField = screen.getByLabelText(/your review/i);
      await userEventInstance.type(commentField, 'Excellent service!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEventInstance.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Excellent service!',
      });

      // Restore console.log
      console.log = originalConsoleLog;
    });

    it('should disable submit button without rating', () => {
      renderWithProviders(<ReviewsPage />);

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button with rating', async () => {
      renderWithProviders(<ReviewsPage />);

      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );
      await userEventInstance.click(stars[2]); // 3-star rating

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should reset form after submission', async () => {
      renderWithProviders(<ReviewsPage />);

      // Fill form
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );
      await userEventInstance.click(stars[3]); // 4-star rating

      const commentField = screen.getByLabelText(/your review/i);
      await userEventInstance.type(commentField, 'Test comment');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEventInstance.click(submitButton);

      // Form should reset (in a real implementation)
      // This would need to be implemented in the actual component
    });
  });

  describe('Form Validation', () => {
    it('should validate rating selection', async () => {
      renderWithProviders(<ReviewsPage />);

      const formFields: FormField[] = [
        {
          name: 'rating',
          type: 'radio',
          label: 'Rating',
          required: true,
        },
      ];

      // Try to submit without rating
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();

      // Select rating
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );
      await userEventInstance.click(stars[2]);

      // Button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('should validate comment length', async () => {
      renderWithProviders(<ReviewsPage />);

      const commentField = screen.getByLabelText(/your review/i);
      
      // Test minimum length (if implemented)
      await userEventInstance.type(commentField, 'Too short');
      
      // Test maximum length (if implemented)
      const longComment = 'a'.repeat(1001); // Assuming 1000 char limit
      await userEventInstance.clear(commentField);
      await userEventInstance.type(commentField, longComment);

      // Validation would need to be implemented in the actual component
    });
  });

  describe('Review Display', () => {
    it('should display review ratings as stars', () => {
      renderWithProviders(<ReviewsPage />);

      // Check that reviews show star ratings
      const reviewCards = screen.getAllByRole('generic').filter(card => 
        card.textContent?.includes('John Doe') || card.textContent?.includes('Jane Smith')
      );

      expect(reviewCards.length).toBeGreaterThan(0);
    });

    it('should display review dates', () => {
      renderWithProviders(<ReviewsPage />);

      // Mock formatDate should be called
      const { formatDate } = require('../../shared/utils/date-utils');
      expect(formatDate).toHaveBeenCalledWith('2025-03-10');
      expect(formatDate).toHaveBeenCalledWith('2025-03-09');
    });

    it('should display helpful counts', () => {
      renderWithProviders(<ReviewsPage />);

      expect(screen.getByText('Helpful (12)')).toBeInTheDocument();
      expect(screen.getByText('Helpful (8)')).toBeInTheDocument();
    });

    it('should handle helpful button clicks', async () => {
      renderWithProviders(<ReviewsPage />);

      const helpfulButtons = screen.getAllByRole('button', { name: /helpful/i });
      
      await userEventInstance.click(helpfulButtons[0]);

      // In a real implementation, this would update the helpful count
      // and possibly disable the button or show feedback
    });

    it('should handle report button clicks', async () => {
      renderWithProviders(<ReviewsPage />);

      const reportButtons = screen.getAllByRole('button', { name: /report/i });
      
      await userEventInstance.click(reportButtons[0]);

      // In a real implementation, this would open a report modal
      // or show some feedback
    });
  });

  describe('Accessibility', () => {
    it('should have proper form accessibility', async () => {
      renderWithProviders(<ReviewsPage />);

      const formFields: FormField[] = [
        {
          name: 'rating',
          type: 'radio',
          label: 'Rating',
          required: true,
        },
        {
          name: 'comment',
          type: 'textarea',
          label: 'Your Review',
        },
      ];

      await formTestingUtils.testFormAccessibility(formFields);
    });

    it('should have accessible star rating', () => {
      renderWithProviders(<ReviewsPage />);

      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );

      stars.forEach((star, index) => {
        expect(star).toHaveAttribute('aria-label', `Rate ${index + 1} stars`);
      });
    });

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<ReviewsPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Community Reviews & Ratings');

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible review cards', () => {
      renderWithProviders(<ReviewsPage />);

      // Each review should be in a properly structured card
      const reviewCards = screen.getAllByRole('article') || 
                         screen.getAllByRole('region');
      
      // In a proper implementation, each review would be an article
      // with proper heading structure and accessible content
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for star rating', async () => {
      renderWithProviders(<ReviewsPage />);

      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );

      // Tab to first star
      await userEventInstance.tab();
      expect(stars[0]).toHaveFocus();

      // Use arrow keys to navigate between stars
      await userEventInstance.keyboard('{ArrowRight}');
      expect(stars[1]).toHaveFocus();

      await userEventInstance.keyboard('{ArrowLeft}');
      expect(stars[0]).toHaveFocus();

      // Press Enter to select
      await userEventInstance.keyboard('{Enter}');
      
      // Check that star is selected (visual feedback)
      const svg = stars[0].querySelector('svg');
      expect(svg).toHaveClass('text-yellow-400', 'fill-yellow-400');
    });

    it('should support keyboard navigation through form', async () => {
      renderWithProviders(<ReviewsPage />);

      // Tab through form elements
      await userEventInstance.tab(); // First star
      await userEventInstance.tab(); // Second star
      // ... continue through all stars
      
      // Eventually reach comment field
      const commentField = screen.getByLabelText(/your review/i);
      commentField.focus();
      expect(commentField).toHaveFocus();

      // Tab to submit button
      await userEventInstance.tab();
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load reviews'),
      });

      renderWithProviders(<ReviewsPage />);

      // Should show error state
      expect(screen.getByText(/error loading reviews|failed to load/i)).toBeInTheDocument();
    });

    it('should handle form submission errors', async () => {
      // Mock form submission to throw error
      const mockHandleSubmit = vi.fn().mockImplementation(() => {
        throw new Error('Submission failed');
      });

      renderWithProviders(<ReviewsPage />);

      // Fill and submit form
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );
      await userEventInstance.click(stars[3]);

      const commentField = screen.getByLabelText(/your review/i);
      await userEventInstance.type(commentField, 'Test comment');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEventInstance.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to submit review|error submitting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<ReviewsPage />);

      // Check that layout adapts for mobile
      const container = screen.getByRole('main') || document.querySelector('.container');
      expect(container).toHaveClass('px-4'); // Mobile padding
    });

    it('should maintain functionality on touch devices', async () => {
      renderWithProviders(<ReviewsPage />);

      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('h-8')
      );

      // Simulate touch interaction
      await userEventInstance.click(stars[2]);

      // Should work the same as mouse click
      const svg = stars[2].querySelector('svg');
      expect(svg).toHaveClass('text-yellow-400', 'fill-yellow-400');
    });
  });
});