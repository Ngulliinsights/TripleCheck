import { Router, Request, Response } from 'express';
import multer from 'multer';

import { Logger } from '../infrastructure/monitoring/logger';

import { DocumentAuthService, DocumentVerificationRequest } from './DocumentAuthService';

const router = Router();
const logger = new Logger();
const documentAuthService = new DocumentAuthService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, JPEG, PNG files
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Initialize the document auth service
let serviceInitialized = false;

async function ensureServiceInitialized() {
  if (!serviceInitialized) {
    try {
      await documentAuthService.initialize();
      serviceInitialized = true;
      logger.info('Document Authentication Service initialized', 'DocumentAuthRoutes');
    } catch (error) {
      logger.error('Failed to initialize Document Authentication Service', 'DocumentAuthRoutes', undefined, error as Error);
      throw error;
    }
  }
}

// Middleware to ensure service is initialized
async function requireInitializedService(req: Request, res: Response, next: Function) {
  try {
    await ensureServiceInitialized();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      message: 'Document authentication service is not available'
    });
  }
}

/**
 * POST /api/document-auth/verify
 * Verify one or more documents for authenticity
 */
router.post('/verify', requireInitializedService, upload.array('documents', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
        message: 'Please upload at least one document to verify'
      });
    }

    logger.info(`Processing ${files.length} documents for verification`, 'DocumentAuthRoutes');

    const verificationPromises = files.map(async (file, index) => {
      const documentId = req.body[`documentId_${index}`] || `doc_${Date.now()}_${index}`;
      
      const verificationRequest: DocumentVerificationRequest = {
        id: documentId,
        file: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        userId: req.user?.id?.toString(),
        propertyId: req.body.propertyId
      };

      try {
        const result = await documentAuthService.verifyDocument(verificationRequest);
        
        // Transform result to match frontend expectations
        return {
          id: documentId,
          filename: file.originalname,
          documentType: getDocumentType(file.mimetype, file.originalname),
          verified: result.status === 'authentic',
          confidence: result.confidence,
          status: result.status,
          checks: {
            metadata: getCheckResult(result.checks, 'metadata'),
            visual: getCheckResult(result.checks, 'visual'),
            signature: getCheckResult(result.checks, 'signature'),
            content: getCheckResult(result.checks, 'content')
          },
          issues: result.riskFactors.map(rf => rf.description),
          recommendations: result.recommendations,
          processingTime: result.processingTime
        };
      } catch (error) {
        logger.error(`Document verification failed for ${file.originalname}`, 'DocumentAuthRoutes', undefined, error as Error);
        
        return {
          id: documentId,
          filename: file.originalname,
          documentType: getDocumentType(file.mimetype, file.originalname),
          verified: false,
          confidence: 0,
          status: 'forged' as const,
          checks: {
            metadata: { passed: false, score: 0, details: 'Analysis failed' },
            visual: { passed: false, score: 0, details: 'Analysis failed' },
            signature: { passed: false, score: 0, details: 'Analysis failed' },
            content: { passed: false, score: 0, details: 'Analysis failed' }
          },
          issues: ['Technical error during verification'],
          recommendations: ['Please try again or contact support'],
          processingTime: 0
        };
      }
    });

    const results = await Promise.all(verificationPromises);

    res.json({
      success: true,
      results
    });

  } catch (error) {
    logger.error('Document verification request failed', 'DocumentAuthRoutes', undefined, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: 'An error occurred during document verification'
    });
  }
});

/**
 * GET /api/document-auth/result/:documentId
 * Get verification result for a specific document
 */
router.get('/result/:documentId', requireInitializedService, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    const result = await documentAuthService.getVerificationResult(documentId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Result not found',
        message: 'No verification result found for the specified document'
      });
    }

    res.json({
      success: true,
      result: {
        id: result.documentId,
        verified: result.status === 'authentic',
        confidence: result.confidence,
        status: result.status,
        overallScore: result.overallScore,
        checks: result.checks,
        metadata: result.metadata,
        riskFactors: result.riskFactors,
        recommendations: result.recommendations,
        processedAt: result.processedAt,
        processingTime: result.processingTime
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve verification result', 'DocumentAuthRoutes', undefined, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve result',
      message: 'An error occurred while retrieving the verification result'
    });
  }
});

/**
 * GET /api/document-auth/status/:documentId
 * Get processing status for a document
 */
router.get('/status/:documentId', requireInitializedService, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    const status = await documentAuthService.getProcessingStatus(documentId);
    
    res.json({
      success: true,
      status,
      documentId
    });

  } catch (error) {
    logger.error('Failed to retrieve processing status', 'DocumentAuthRoutes', undefined, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve status',
      message: 'An error occurred while retrieving the processing status'
    });
  }
});

/**
 * GET /api/document-auth/stats
 * Get system statistics
 */
router.get('/stats', requireInitializedService, async (req: Request, res: Response) => {
  try {
    const stats = await documentAuthService.getSystemStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Failed to retrieve system stats', 'DocumentAuthRoutes', undefined, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      message: 'An error occurred while retrieving system statistics'
    });
  }
});

/**
 * POST /api/document-auth/clear-results
 * Clear old verification results
 */
router.post('/clear-results', requireInitializedService, async (req: Request, res: Response) => {
  try {
    const { olderThan } = req.body;
    const cutoffDate = olderThan ? new Date(olderThan) : undefined;
    
    const clearedCount = await documentAuthService.clearResults(cutoffDate);
    
    res.json({
      success: true,
      message: `Cleared ${clearedCount} old verification results`,
      clearedCount
    });

  } catch (error) {
    logger.error('Failed to clear results', 'DocumentAuthRoutes', undefined, error as Error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear results',
      message: 'An error occurred while clearing old results'
    });
  }
});

/**
 * GET /api/document-auth/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isInitialized = serviceInitialized;
    const stats = isInitialized ? await documentAuthService.getSystemStats() : null;
    
    res.json({
      success: true,
      status: isInitialized ? 'healthy' : 'initializing',
      service: 'Document Authentication Service',
      version: '1.0.0',
      uptime: process.uptime(),
      stats
    });

  } catch (error) {
    logger.error('Health check failed', 'DocumentAuthRoutes', undefined, error as Error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed'
    });
  }
});

// Helper functions

function getDocumentType(mimeType: string, filename: string): string {
  if (mimeType === 'application/pdf') {
    return 'PDF Document';
  }
  
  if (mimeType.startsWith('image/')) {
    const extension = filename.split('.').pop()?.toUpperCase();
    return `${extension} Image`;
  }
  
  return 'Unknown Document';
}

function getCheckResult(checks: any[], type: string) {
  const check = checks.find(c => c.type === type);
  
  if (!check) {
    return {
      passed: false,
      score: 0,
      details: 'Check not performed'
    };
  }
  
  return {
    passed: check.status === 'pass',
    score: check.score,
    details: check.description
  };
}

// Error handling middleware
router.use((error: any, req: Request, res: Response, next: Function) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size exceeds 10MB limit'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Maximum 10 files allowed per request'
      });
    }
  }
  
  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported file type',
      message: 'Only PDF, JPEG, and PNG files are supported'
    });
  }
  
  logger.error('Unhandled error in document auth routes', 'DocumentAuthRoutes', undefined, error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

export default router;