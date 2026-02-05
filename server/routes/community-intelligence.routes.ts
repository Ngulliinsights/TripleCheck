import { Router } from 'express';

import { CommunityIntelligenceService } from '../services/CommunityIntelligenceService';
import type { CommunityReport } from '../services/CommunityIntelligenceService';

const router = Router();
const communityService = new CommunityIntelligenceService();

/**
 * GET /api/community/intelligence/:propertyId
 * Get community intelligence for a property
 */
router.get('/intelligence/:propertyId', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId) || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID'
      });
    }

    const intelligence = await communityService.getCommunityIntelligence(propertyId);

    res.json({
      success: true,
      data: intelligence
    });

  } catch (error) {
    console.error('Community intelligence error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get community intelligence'
    });
  }
});

/**
 * POST /api/community/report
 * Submit a community report about a property
 */
router.post('/report', async (req, res) => {
  try {
    const reportData: CommunityReport = {
      propertyId: parseInt(req.body.propertyId),
      reportType: req.body.reportType,
      description: req.body.description,
      evidence: req.body.evidence,
      reporterId: parseInt(req.body.reporterId), // In real app, would get from auth
      anonymous: req.body.anonymous || false,
      severity: req.body.severity || 'medium'
    };

    const result = await communityService.submitCommunityReport(reportData);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Community report error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit community report'
    });
  }
});

/**
 * GET /api/community/neighborhood/:location
 * Get neighborhood analysis for a location
 */
router.get('/neighborhood/:location', async (req, res) => {
  try {
    const location = decodeURIComponent(req.params.location);
    
    if (!location || location.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }

    const analysis = await communityService.getNeighborhoodAnalysis(location);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Neighborhood analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get neighborhood analysis'
    });
  }
});

/**
 * GET /api/community/report-types
 * Get available community report types
 */
router.get('/report-types', (req, res) => {
  res.json({
    success: true,
    data: {
      reportTypes: [
        {
          value: 'fraud_suspicion',
          label: 'Fraud Suspicion',
          description: 'Report suspected fraudulent activity related to this property'
        },
        {
          value: 'ownership_dispute',
          label: 'Ownership Dispute',
          description: 'Report disputes about property ownership or title'
        },
        {
          value: 'condition_issue',
          label: 'Property Condition',
          description: 'Report issues with property condition or misrepresentation'
        },
        {
          value: 'pricing_concern',
          label: 'Pricing Concern',
          description: 'Report concerns about property pricing or market manipulation'
        }
      ],
      severityLevels: [
        {
          value: 'low',
          label: 'Low',
          description: 'Minor concern that should be noted'
        },
        {
          value: 'medium',
          label: 'Medium',
          description: 'Moderate concern requiring attention'
        },
        {
          value: 'high',
          label: 'High',
          description: 'Serious concern requiring immediate attention'
        }
      ]
    }
  });
});

export default router;