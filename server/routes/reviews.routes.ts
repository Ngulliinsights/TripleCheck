import { Router } from 'express';
import { submitReview } from '../controllers/trust.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Reviews Routes
 * Handles review submissions for properties, services, and agents
 */

// Submit review
router.post('/', requireAuth, submitReview);

// Get reviews (mock endpoint)
router.get('/', async (req, res) => {
  try {
    const { propertyId, type = 'property', limit = 10, offset = 0 } = req.query;

    // Mock reviews data
    const reviews = Array.from({ length: Number(limit) }, (_, index) => ({
      id: `REV-${Date.now()}-${index}`,
      rating: Math.floor(Math.random() * 5) + 1,
      comment: [
        'Excellent property with great amenities and location.',
        'Good value for money, but could use some improvements.',
        'Outstanding service and professional handling.',
        'Average experience, nothing exceptional.',
        'Highly recommended for serious buyers.'
      ][Math.floor(Math.random() * 5)],
      reviewType: type,
      propertyId: propertyId || `PROP-${Math.floor(Math.random() * 1000)}`,
      userId: `USER-${Math.floor(Math.random() * 1000)}`,
      userName: [
        'John Kamau',
        'Mary Wanjiku',
        'Peter Ochieng',
        'Grace Akinyi',
        'David Mwangi'
      ][Math.floor(Math.random() * 5)],
      submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      helpful: Math.floor(Math.random() * 20),
      verified: Math.random() > 0.3 // 70% verified reviews
    }));

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: 50,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < 50
        },
        summary: {
          averageRating: 4.2,
          totalReviews: 50,
          ratingDistribution: {
            5: 20,
            4: 15,
            3: 10,
            2: 3,
            1: 2
          }
        }
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews'
    });
  }
});

export { router as reviewsRouter };