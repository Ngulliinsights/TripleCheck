import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { PropertyReviews } from '../PropertyReviews'
import { renderWithProviders, userEventInstance, createTestQueryClient } from '../../../shared/test-utils'
import { TestDataFactory } from '../../../shared/test-utils/fixtures'
import { server } from '../../../shared/test-utils/msw-server'
import { http, HttpResponse } from 'msw'

// Mock the toast hook
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('PropertyReviews', () => {
  let queryClient: QueryClient;
  const propertyId = '1';

  const mockReviews = [
    {
      id: 1,
      userId: 1,
      propertyId: 1,
      rating: 5,
      comment: 'Excellent property with great amenities. Highly recommended!',
      createdAt: '2024-01-16T12:00:00Z',
    },
    {
      id: 2,
      userId: 2,
      propertyId: 1,
      rating: 4,
      comment: 'Good location and well-maintained. Minor issues with parking.',
      createdAt: '2024-01-18T15:30:00Z',
    },
  ];

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders reviews section with correct title', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json(mockReviews);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      expect(screen.getByText('Reviews (2)')).toBeInTheDocument();
    });

    it('displays average rating correctly', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json(mockReviews);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('average from 2 reviews')).toBeInTheDocument();
      });
    });

    it('renders individual reviews with correct information', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json(mockReviews);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByText('Excellent property with great amenities. Highly recommended!')).toBeInTheDocument();
        expect(screen.getByText('Good location and well-maintained. Minor issues with parking.')).toBeInTheDocument();
        expect(screen.getAllByText('User #1')).toHaveLength(1);
        expect(screen.getAllByText('User #2')).toHaveLength(1);
      });
    });

    it('shows write review button for authenticated users', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Write Review' })).toBeInTheDocument();
      });
    });

    it('shows login prompt for unauthenticated users', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/auth/me', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('Please log in to write a review')).toBeInTheDocument();
      });
    });

    it('shows empty state when no reviews exist', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
        expect(screen.getByText('Be the first to share your experience with this property!')).toBeInTheDocument();
      });
    });
  });

  describe('Review Form', () => {
    beforeEach(() => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );
    });

    it('shows review form when write review button is clicked', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Write Review' })).toBeInTheDocument();
      });

      const writeReviewButton = screen.getByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      expect(screen.getByText('Write a Review')).toBeInTheDocument();
      expect(screen.getByText('Share your experience with this property')).toBeInTheDocument();
    });

    it('allows rating selection', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      // Click on 4th star
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('w-8')
      );
      await user.click(stars[3]); // 4th star (0-indexed)

      expect(screen.getByText('4 stars selected')).toBeInTheDocument();
    });

    it('validates comment length', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'Short');

      expect(screen.getByText('5/500 characters (minimum 10)')).toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'This is a great property with excellent amenities.');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      expect(submitButton).not.toBeDisabled();
    });

    it('submits review successfully', async () => {
      const user = userEventInstance;
      let submittedData: any = null;

      server.use(
        http.post(`/api/properties/${propertyId}/reviews`, async ({ request }) => {
          submittedData = await request.json();
          return HttpResponse.json({
            id: 3,
            userId: 1,
            propertyId: 1,
            rating: submittedData.rating,
            comment: submittedData.comment,
            createdAt: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      // Set rating to 4 stars
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('w-8')
      );
      await user.click(stars[3]);

      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'This is a great property with excellent amenities.');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submittedData).toEqual({
          rating: 4,
          comment: 'This is a great property with excellent amenities.',
        });
      });
    });

    it('cancels review form', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      expect(screen.getByText('Write a Review')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(screen.queryByText('Write a Review')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Write Review' })).toBeInTheDocument();
    });

    it('resets form when cancelled', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      // Fill form
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('w-8')
      );
      await user.click(stars[2]); // 3 stars

      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'Some comment');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      // Open form again
      const writeReviewButtonAgain = screen.getByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButtonAgain);

      // Check form is reset
      expect(screen.getByText('5 stars selected')).toBeInTheDocument(); // Default rating
      expect(screen.getByLabelText('Comment')).toHaveValue('');
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton while fetching reviews', () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return new Promise(() => {}); // Never resolves to simulate loading
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      // Should show loading skeletons
      const skeletons = screen.getAllByRole('generic').filter(el => 
        el.classList.contains('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows submitting state during review submission', async () => {
      const user = userEventInstance;

      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        }),
        http.post(`/api/properties/${propertyId}/reviews`, () => {
          return new Promise(() => {}); // Never resolves to simulate loading
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'This is a great property with excellent amenities.');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully when fetching reviews', async () => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return new HttpResponse(null, { status: 500 });
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      // Should still render the component without crashing
      await waitFor(() => {
        expect(screen.getByText('Reviews (0)')).toBeInTheDocument();
      });
    });

    it('handles review submission errors', async () => {
      const user = userEventInstance;
      const mockToast = vi.fn();

      // Mock the toast hook to capture error messages
      vi.doMock('@/shared/hooks/use-toast', () => ({
        useToast: () => ({
          toast: mockToast,
        }),
      }));

      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        }),
        http.post(`/api/properties/${propertyId}/reviews`, () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Failed to submit review' }),
            { status: 500 }
          );
        })
      );

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'This is a great property with excellent amenities.');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      // Form should remain visible after error
      await waitFor(() => {
        expect(screen.getByText('Write a Review')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          return HttpResponse.json(mockReviews);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );
    });

    it('has proper heading structure', async () => {
      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Reviews/ })).toBeInTheDocument();
      });
    });

    it('has proper form labels', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      expect(screen.getByLabelText('Rating')).toBeInTheDocument();
      expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    });

    it('provides feedback for screen readers', async () => {
      const user = userEventInstance;

      renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      const writeReviewButton = await screen.findByRole('button', { name: 'Write Review' });
      await user.click(writeReviewButton);

      // Rating feedback
      const stars = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('w-8')
      );
      await user.click(stars[3]);

      expect(screen.getByText('4 stars selected')).toBeInTheDocument();

      // Character count feedback
      const commentTextarea = screen.getByLabelText('Comment');
      await user.type(commentTextarea, 'Test comment');

      expect(screen.getByText('12/500 characters (minimum 10)')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not refetch reviews unnecessarily', async () => {
      let fetchCount = 0;

      server.use(
        http.get(`/api/properties/${propertyId}/reviews`, () => {
          fetchCount++;
          return HttpResponse.json(mockReviews);
        }),
        http.get('/api/auth/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      const { rerender } = renderWithProviders(
        <PropertyReviews propertyId={propertyId} />,
        { queryClient, user: mockUser, isAuthenticated: true }
      );

      await waitFor(() => {
        expect(screen.getByText('Reviews (2)')).toBeInTheDocument();
      });

      expect(fetchCount).toBe(1);

      // Re-render with same props
      rerender(<PropertyReviews propertyId={propertyId} />);

      // Should not fetch again due to caching
      expect(fetchCount).toBe(1);
    });
  });
});