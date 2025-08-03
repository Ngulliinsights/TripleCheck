import { Router } from 'express';

import { professionalsController } from '../controllers/professionals.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createDeduplicationMiddleware } from '../middleware/deduplication.middleware';
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';

const router = Router();

// Rate limiting configurations for different endpoints
const searchRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  enableGlobalLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 30 }, // 30 searches per minute per user
    global: { windowMs: 60000, maxRequests: 1000 }, // 1000 searches per minute globally
  },
});

const createRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 3600000, maxRequests: 5 }, // 5 profile creations per hour
  },
});

const reviewRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 3600000, maxRequests: 10 }, // 10 reviews per hour
  },
});

// Deduplication middleware for search and create operations
const searchDeduplication = createDeduplicationMiddleware({
  enabled: true,
  ttl: 120000, // 2 minutes
  forcePatterns: [/^\/api\/professionals\/search$/],
});

const createDeduplication = createDeduplicationMiddleware({
  enabled: true,
  ttl: 300000, // 5 minutes
  forcePatterns: [/^\/api\/professionals$/],
});

// Public routes (no authentication required)

/**
 * @route GET /api/professionals/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', professionalsController.healthCheck);

/**
 * @route GET /api/professionals/specializations
 * @desc Get available professional specializations
 * @access Public
 */
router.get('/specializations', professionalsController.getSpecializations);

/**
 * @route GET /api/professionals/search
 * @desc Search professionals with filters
 * @access Public
 * @rateLimit 30 requests per minute per user
 */
router.get('/search', 
  searchRateLimit,
  searchDeduplication,
  professionalsController.searchProfessionals
);

/**
 * @route GET /api/professionals/category/:category
 * @desc Get professionals by category
 * @access Public
 */
router.get('/category/:category', professionalsController.getProfessionalsByCategory);

/**
 * @route GET /api/professionals/available
 * @desc Get available professionals
 * @access Public
 */
router.get('/available', professionalsController.getAvailableProfessionals);

/**
 * @route GET /api/professionals/:id
 * @desc Get professional by ID
 * @access Public
 */
router.get('/:id(\\d+)', professionalsController.getProfessional);

/**
 * @route GET /api/professionals/:id/reviews
 * @desc Get professional reviews
 * @access Public
 */
router.get('/:id(\\d+)/reviews', professionalsController.getReviews);

/**
 * @route GET /api/professionals/:id/stats
 * @desc Get professional statistics
 * @access Public
 */
router.get('/:id(\\d+)/stats', professionalsController.getProfessionalStats);

// Protected routes (authentication required)

/**
 * @route POST /api/professionals
 * @desc Create a new professional profile
 * @access Private
 * @rateLimit 5 requests per hour per user
 */
router.post('/',
  authMiddleware,
  createRateLimit,
  createDeduplication,
  validationMiddleware,
  professionalsController.createProfessional
);

/**
 * @route PUT /api/professionals/:id
 * @desc Update professional profile
 * @access Private (own profile only)
 */
router.put('/:id(\\d+)',
  authMiddleware,
  validationMiddleware,
  professionalsController.updateProfessional
);

/**
 * @route PATCH /api/professionals/:id/availability
 * @desc Update professional availability
 * @access Private (own profile only)
 */
router.patch('/:id(\\d+)/availability',
  authMiddleware,
  validationMiddleware,
  professionalsController.updateAvailability
);

/**
 * @route POST /api/professionals/:id/reviews
 * @desc Add a review for a professional
 * @access Private
 * @rateLimit 10 reviews per hour per user
 */
router.post('/:id(\\d+)/reviews',
  authMiddleware,
  reviewRateLimit,
  validationMiddleware,
  professionalsController.addReview
);

// Admin routes (admin authentication required)
// TODO: Add admin middleware when implemented

/**
 * @route PATCH /api/professionals/:id/verify
 * @desc Verify a professional profile (admin only)
 * @access Admin
 */
// router.patch('/:id(\\d+)/verify', adminMiddleware, professionalsController.verifyProfessional);

/**
 * @route DELETE /api/professionals/:id
 * @desc Deactivate a professional profile (admin only)
 * @access Admin
 */
// router.delete('/:id(\\d+)', adminMiddleware, professionalsController.deactivateProfessional);

export default router;