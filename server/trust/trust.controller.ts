import { Router, Request, Response } from 'express';

import { Logger } from '../infrastructure/monitoring/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

import { TrustScoringService } from './TrustScoringService';

const router = Router();
const logger = new Logger('TrustController');
const trustScoringService = new TrustScoringService();

// Initialize trust scoring service
trustScoringService.initialize().catch(error => {
  logger.error('Failed to initialize trust scoring service', error);
});

// Get user trust score with detailed breakdown
router.get('/score/:userId', async (req: Request, res: Response) => {
  try {
    const {userId} = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const trustScore = await trustScoringService.calculateUserTrustScore(userId);
    
    res.json({
      success: true,
      data: trustScore
    });
  } catch (error) {
    logger.error(`Failed to get trust score for user ${req.params.userId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trust score'
    });
  }
});

// Get property trust score
router.get('/property/:propertyId', async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid property ID is required'
      });
    }

    const propertyTrustScore = await trustScoringService.calculatePropertyTrustScore(propertyId);
    
    res.json({
      success: true,
      data: propertyTrustScore
    });
  } catch (error) {
    logger.error(`Failed to get property trust score for property ${req.params.propertyId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate property trust score'
    });
  }
});

// Update user trust score based on actions
router.post('/update/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {userId} = req.params;
    const { action, details } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: 'User ID and action are required'
      });
    }

    const updatedScore = await trustScoringService.updateUserTrustScore(userId, action, details);
    
    res.json({
      success: true,
      data: updatedScore,
      message: 'Trust score updated successfully'
    });
  } catch (error) {
    logger.error(`Failed to update trust score for user ${req.params.userId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trust score'
    });
  }
});

// Get trust analytics for a user
router.get('/analytics/:userId', async (req: Request, res: Response) => {
  try {
    const {userId} = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const analytics = await trustScoringService.getTrustAnalytics(userId);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Failed to get trust analytics for user ${req.params.userId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trust analytics'
    });
  }
});

// Verify user identity and update trust score
router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, verificationType, verificationData } = req.body;
    
    if (!userId || !verificationType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification type are required'
      });
    }

    const verificationResult = await trustScoringService.processVerification(
      userId,
      verificationType,
      verificationData
    );
    
    res.json({
      success: true,
      data: verificationResult,
      message: 'Verification processed successfully'
    });
  } catch (error) {
    logger.error(`Failed to process verification for user ${req.body.userId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to process verification'
    });
  }
});

// Get trust score history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const {userId} = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const history = await trustScoringService.getTrustScoreHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error(`Failed to get trust score history for user ${req.params.userId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trust score history'
    });
  }
});

// Get system-wide trust statistics
router.get('/stats/system', async (req: Request, res: Response) => {
  try {
    const stats = await trustScoringService.getSystemTrustStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get system trust statistics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system trust statistics'
    });
  }
});

export { router as trustRouter };