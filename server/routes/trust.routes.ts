import { Router } from 'express';
import {
  submitVerificationRequest,
  getVerificationStatus,
  getVerificationResults,
  submitReview,
  getTrustScore
} from '../trust/verification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Trust & Verification Routes - PHASE 2 REFACTORED
 * 
 * KEY CHANGES:
 * - NEW: POST /verification/start (unified entry point for parallel verification)
 * - NEW: GET /verification/:workflowId/results (get complete results)
 * - DEPRECATED: Old sequential endpoints replaced with unified workflow
 */

// ========== PHASE 2 UNIFIED VERIFICATION ENDPOINTS ==========

/**
 * POST /api/verification/start
 * Initiate unified verification workflow
 * Returns 202 Accepted with workflowId for WebSocket subscription
 */
router.post('/start', requireAuth, submitVerificationRequest);

/**
 * GET /api/verification/:workflowId/status
 * Get current verification status
 * Returns progress and individual service statuses
 */
router.get('/:workflowId/status', requireAuth, getVerificationStatus);

/**
 * GET /api/verification/:workflowId/results
 * Get complete verification results after completion
 * Returns orchestrated insights and risk scores
 */
router.get('/:workflowId/results', requireAuth, getVerificationResults);

// ========== UTILITY ENDPOINTS ==========

/**
 * GET /api/trust/score/:id
 * Get trust score for property or user
 */
router.get('/score/:id', getTrustScore);

/**
 * POST /api/reviews
 * Submit property or service review
 */
router.post('/reviews', requireAuth, submitReview);

export { router as trustRouter };