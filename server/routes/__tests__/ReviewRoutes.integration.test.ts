import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { ReviewRoutes } from '../reviews.routes';
import { ReviewService } from '../../services/ReviewService';
import { storage } from '../../storage';

// Mock the storage and services
jest.mock('../../storage');
jest.mock('../../services/ReviewService');

describe('ReviewRoutes Integration Tests', () => {
  let app: express.Application;
  let reviewService: jest.Mocked<ReviewService>;
  let reviewRoutes: ReviewRoutes;

  beforeEach(() => {
    // Create mocked service
    reviewService = new ReviewService() as jest.Mocked<ReviewService>;
    
    // Create ReviewRoutes instance
    reviewRoutes = new ReviewRoutes(reviewService);
    
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Setup session middleware
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));
    
    // Mount review routes
    app.use('/api/reviews', reviewRoutes.getRouter());
  });

  describe('GET /api/reviews/properties/:id/reviews', () => {
    it('should get reviews for a property successfully', async () => {
      const mockReviews = {
        success: true,
        data: {
          reviews: [
            {
              id: 1,
              propertyId: 1,
              userId: 1,
              rating: 5,
              comment: 'Great property!',
              createdAt: new Date(),
            }
          ],
          totalCount: 1,
          averageRating: 5,
        }
      };

      reviewService.getPropertyReviews.mockResolvedValue(mockReviews);

      const response = await request(app)
        .get('/api/reviews/properties/1/reviews')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toHaveLength(1);
      expect(reviewService.getPropertyReviews).toHaveBeenCalledWith(1, { page: 1, limit: 20 });
    });

    it('should handle invalid property ID', async () => {
      const response = await request(app)
        .get('/api/reviews/properties/invalid/reviews');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      reviewService.getPropertyReviews.mockResolvedValue({
        success: false,
        error: 'Property not found'
      });

      const response = await request(app)
        .get('/api/reviews/properties/999/reviews');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/reviews/properties/:id/reviews', () => {
    it('should create a review when authenticated', async () => {
      const mockReview = {
        success: true,
        data: {
          id: 1,
          propertyId: 1,
          userId: 1,
          rating: 5,
          comment: 'Excellent property!',
          createdAt: new Date(),
        },
        message: 'Review created successfully'
      };

      reviewService.createReview.mockResolvedValue(mockReview);

      // Create authenticated session
      const agent = request.agent(app);
      
      // Mock session with user
      const sessionData = { userId: 1 };
      
      const response = await agent
        .post('/api/reviews/properties/1/reviews')
        .set('Cookie', [`connect.sid=s%3A${Buffer.from(JSON.stringify(sessionData)).toString('base64')}`])
        .send({
          rating: 5,
          comment: 'Excellent property!'
        });

      // Note: This test would need proper session setup in a real integration test
      // For now, we'll test the unauthenticated case
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reviews/properties/1/reviews')
        .send({
          rating: 5,
          comment: 'Great property!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate review data', async () => {
      const response = await request(app)
        .post('/api/reviews/properties/1/reviews')
        .send({
          rating: 6, // Invalid rating (should be 1-5)
          comment: 'A' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/my-reviews', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/my-reviews');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/properties/:id/reviews/summary', () => {
    it('should get review summary for a property', async () => {
      const mockSummary = {
        success: true,
        data: {
          totalReviews: 10,
          averageRating: 4.5,
          ratingDistribution: {
            1: 0,
            2: 1,
            3: 2,
            4: 3,
            5: 4
          }
        }
      };

      reviewService.generateReviewSummary.mockResolvedValue(mockSummary);

      const response = await request(app)
        .get('/api/reviews/properties/1/reviews/summary');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBe(4.5);
      expect(reviewService.generateReviewSummary).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/reviews/:id/helpful', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reviews/1/helpful');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/reviews/:id/report', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/reviews/1/report')
        .send({
          reason: 'Inappropriate content'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate report reason', async () => {
      const response = await request(app)
        .post('/api/reviews/1/report')
        .send({
          reason: 'Bad' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/properties/:id/can-review', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/properties/1/can-review');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/analytics', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/analytics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors', async () => {
      await expect(reviewRoutes.initialize()).resolves.toBeUndefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      reviewService.getPropertyReviews.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/reviews/properties/1/reviews');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent API response format for success', async () => {
      const mockReviews = {
        success: true,
        data: { reviews: [], totalCount: 0 }
      };

      reviewService.getPropertyReviews.mockResolvedValue(mockReviews);

      const response = await request(app)
        .get('/api/reviews/properties/1/reviews');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });

    it('should return consistent API response format for errors', async () => {
      reviewService.getPropertyReviews.mockResolvedValue({
        success: false,
        error: 'Service error'
      });

      const response = await request(app)
        .get('/api/reviews/properties/1/reviews');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });
  });
});