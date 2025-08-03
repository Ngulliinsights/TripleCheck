import { Router, Request, Response, NextFunction } from 'express';

import { AuthenticatedRequest, requireAuth } from '../middleware/auth.middleware';

import { PropertyService } from './property.service';

const router = Router();
const propertyService = new PropertyService();

// Get all properties with search and filters
router.get('/', async (req, res, next) => {
  try {
    const result = await propertyService.getProperties(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get similar properties (MUST be before /:id route to avoid conflicts)
router.get('/similar', async (req, res, next) => {
  try {
    const result = await propertyService.getSimilarProperties(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get properties by owner (MUST be before /:id route to avoid conflicts)
router.get('/owner/:ownerId', async (req, res, next) => {
  try {
    const result = await propertyService.getPropertiesByOwner(req.params.ownerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get single property
router.get('/:id', async (req, res, next) => {
  try {
    const includeMarketEstimate = req.query.includeMarketEstimate === 'true';
    const result = await propertyService.getProperty(req.params.id, { includeMarketEstimate });
    if (!result.data) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
        message: `Property with ID ${req.params.id} was not found`
      });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create property (authenticated)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await propertyService.createProperty(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Update property (authenticated, owner only)
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await propertyService.updateProperty(req.params.id, req.body, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete property (authenticated, owner only)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    await propertyService.deleteProperty(req.params.id, req.user.id);
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Land verification endpoints

// Initiate land verification for a property (authenticated)
router.post('/:id/land-verification', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await propertyService.initiateLandVerification(
      req.params.id, 
      req.user.id.toString(), 
      req.body.requestedLayers
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Get land verification status for a property
router.get('/:id/land-verification/status', async (req, res, next) => {
  try {
    const result = await propertyService.getLandVerificationStatus(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get detailed land verification report for a property
router.get('/:id/land-verification/report', async (req, res, next) => {
  try {
    const result = await propertyService.getLandVerificationReport(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update property land verification data (authenticated, owner only)
router.patch('/:id/land-verification', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const result = await propertyService.updatePropertyLandVerification(
      req.params.id, 
      req.body.landVerification, 
      req.user.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Document upload for verification (authenticated)
router.post('/:id/documents', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Mock document upload response
    res.json({ 
      success: true, 
      message: 'Document uploaded successfully',
      data: {
        documentId: `doc_${Date.now()}`,
        propertyId: req.params.id,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Property verification endpoint (authenticated)
router.post('/:id/verify', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Mock verification response
    res.json({
      success: true,
      data: {
        documentAuthenticity: 'verified',
        ownershipVerified: true,
        riskScore: Math.floor(Math.random() * 30) + 10, // Random score between 10-40
        verifiedAt: new Date().toISOString(),
        overallScore: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
        verificationTimestamp: new Date().toISOString(),
        fraudDetection: {
          isSuspicious: false,
          suspiciousScore: Math.floor(Math.random() * 20), // Random score between 0-20
          overallScore: Math.floor(Math.random() * 20) + 80,
          verificationTimestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get property verification status
router.get('/:id/verification', async (req, res, next) => {
  try {
    // Mock verification status response
    res.json({
      success: true,
      data: {
        verificationStatus: 'verified',
        lastVerified: new Date().toISOString(),
        riskLevel: 'low',
        documentAuthenticity: 'verified'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Performance monitoring endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/performance', async (req, res, next) => {
    try {
      const { queryMonitor } = await import('../infrastructure/monitoring/QueryPerformanceMonitor');
      const timeWindow = parseInt(req.query.timeWindow as string) || 60;
      
      const stats = queryMonitor.getStats(timeWindow);
      const similarPropertiesStats = queryMonitor.getQueryStats('findSimilar', timeWindow);
      
      res.json({
        success: true,
        data: {
          overall: stats,
          similarProperties: similarPropertiesStats,
          timeWindowMinutes: timeWindow,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  });
}

export { router as propertyRouter };