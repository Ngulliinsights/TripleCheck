import { Router } from 'express';
import {
  submitVerificationRequest,
  getVerificationStatus,
  submitReview,
  getTrustScore,
  getFraudAlerts
} from '../controllers/trust.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Trust & Verification Routes
 * Handles property verification, reviews, and trust scoring
 */

// Verification requests
router.post('/verification-request', requireAuth, submitVerificationRequest);
router.get('/verification/:id', requireAuth, getVerificationStatus);

// Trust scoring
router.get('/score/:id', getTrustScore);

// Fraud alerts
router.get('/alerts', requireAuth, getFraudAlerts);

// Reviews (also accessible via /api/reviews)
router.post('/reviews', requireAuth, submitReview);

export { router as trustRouter };