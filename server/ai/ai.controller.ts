import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { aiServiceManager, propertyAnalysis, documentProcessing, fraudDetection, recommendations } from './services/ai-service-manager';
import { logger as loggingService } from '..\infrastructure\monitoring\logger';

const router = Router();

// Property Analysis Endpoints

// Property valuation endpoint
router.post('/property/analyze-value', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const propertyData = req.body;
    
    if (!propertyData.id || !propertyData.location || !propertyData.propertyType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required property data: id, location, propertyType'
      });
    }

    const result = await propertyAnalysis.analyzeValue(propertyData);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Property valuation failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Property valuation analysis failed'
    });
  }
});

// Property risk assessment endpoint
router.post('/property/assess-risk', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const propertyData = req.body;
    
    if (!propertyData.id || !propertyData.location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required property data: id, location'
      });
    }

    const result = await propertyAnalysis.assessRisk(propertyData);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Property risk assessment failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Property risk assessment failed'
    });
  }
});

// Property insights endpoint
router.post('/property/generate-insights', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const propertyData = req.body;
    
    if (!propertyData.id || !propertyData.location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required property data: id, location'
      });
    }

    const result = await propertyAnalysis.generateInsights(propertyData);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Property insights generation failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Property insights generation failed'
    });
  }
});

// Document Processing Endpoints

// Document OCR endpoint
router.post('/document/extract-text', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId, documentType, imageBase64, imageBuffer, text } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: documentId'
      });
    }

    if (!imageBase64 && !imageBuffer && !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing document data: provide imageBase64, imageBuffer, or text'
      });
    }

    const documentInput = {
      id: documentId,
      type: documentType,
      imageBase64,
      imageBuffer: imageBuffer ? Buffer.from(imageBuffer, 'base64') : undefined,
      text,
      metadata: {
        uploadedBy: req.user?.id,
        uploadedAt: new Date()
      }
    };

    const result = await documentProcessing.extractData(documentInput);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Document text extraction failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Document text extraction failed'
    });
  }
});

// Document verification endpoint
router.post('/document/verify-authenticity', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId, documentType, imageBase64, imageBuffer, text } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: documentId'
      });
    }

    const documentInput = {
      id: documentId,
      type: documentType,
      imageBase64,
      imageBuffer: imageBuffer ? Buffer.from(imageBuffer, 'base64') : undefined,
      text,
      metadata: {
        uploadedBy: req.user?.id,
        uploadedAt: new Date()
      }
    };

    const result = await documentProcessing.validateAuthenticity(documentInput);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Document authenticity verification failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Document authenticity verification failed'
    });
  }
});

// Document classification endpoint
router.post('/document/classify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId, imageBase64, imageBuffer, text } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: documentId'
      });
    }

    const documentInput = {
      id: documentId,
      imageBase64,
      imageBuffer: imageBuffer ? Buffer.from(imageBuffer, 'base64') : undefined,
      text,
      metadata: {
        uploadedBy: req.user?.id,
        uploadedAt: new Date()
      }
    };

    const result = await documentProcessing.classify(documentInput);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Document classification failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Document classification failed'
    });
  }
});

// Comprehensive document processing endpoint
router.post('/document/process-complete', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentId, documentType, imageBase64, imageBuffer, text } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: documentId'
      });
    }

    const documentInput = {
      id: documentId,
      type: documentType,
      imageBase64,
      imageBuffer: imageBuffer ? Buffer.from(imageBuffer, 'base64') : undefined,
      text,
      metadata: {
        uploadedBy: req.user?.id,
        uploadedAt: new Date()
      }
    };

    const result = await documentProcessing.processComplete(documentInput);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Comprehensive document processing failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Comprehensive document processing failed'
    });
  }
});

// Fraud Detection Endpoints

// Transaction fraud analysis endpoint
router.post('/fraud/analyze-transaction', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { transactionData, userBehavior, historicalData } = req.body;
    
    if (!transactionData || !transactionData.id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required transaction data'
      });
    }

    const result = await fraudDetection.analyzeTransaction(
      transactionData,
      userBehavior,
      historicalData
    );
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Transaction fraud analysis failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Transaction fraud analysis failed'
    });
  }
});

// Document fraud detection endpoint
router.post('/fraud/detect-document-fraud', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const documentFraudData = req.body;
    
    if (!documentFraudData.documentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: documentId'
      });
    }

    // Add user context
    documentFraudData.uploadedBy = req.user?.id;
    documentFraudData.uploadDate = documentFraudData.uploadDate || new Date();

    const result = await fraudDetection.detectDocumentFraud(documentFraudData);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Document fraud detection failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Document fraud detection failed'
    });
  }
});

// Pattern analysis endpoint
router.post('/fraud/analyze-patterns', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { transactions, timeframe } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid transactions array'
      });
    }

    const result = await fraudDetection.analyzePatterns(transactions, timeframe);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Pattern analysis failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Pattern analysis failed'
    });
  }
});

// Recommendation Endpoints

// Generate property recommendations endpoint
router.post('/recommendations/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userPreferences, availableProperties } = req.body;
    
    if (!userPreferences || !userPreferences.userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required user preferences'
      });
    }

    if (!availableProperties || !Array.isArray(availableProperties)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid available properties array'
      });
    }

    // Ensure user can only get recommendations for themselves
    if (userPreferences.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot generate recommendations for other users'
      });
    }

    const result = await recommendations.generate(userPreferences, availableProperties);
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Recommendation generation failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Recommendation generation failed'
    });
  }
});

// Find similar properties endpoint
router.post('/recommendations/find-similar', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetProperty, availableProperties, similarityThreshold } = req.body;
    
    if (!targetProperty || !targetProperty.id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required target property'
      });
    }

    if (!availableProperties || !Array.isArray(availableProperties)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid available properties array'
      });
    }

    const result = await recommendations.findSimilar(
      targetProperty,
      availableProperties,
      similarityThreshold
    );
    
    res.json({
      success: result.success,
      data: result.data,
      requestId: result.requestId,
      processingTime: result.processingTime
    });
  } catch (error) {
    loggingService.error('Similar property search failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Similar property search failed'
    });
  }
});

// Service Management Endpoints

// Service health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await aiServiceManager.performHealthCheck();
    const overallHealth = healthStatus.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';
    
    res.json({
      success: true,
      data: {
        overallHealth,
        services: healthStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    loggingService.error('Health check failed', {
      module: 'AIController',
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Service metrics endpoint
router.get('/metrics', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const metrics = aiServiceManager.getServiceMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    loggingService.error('Metrics retrieval failed', {
      module: 'AIController',
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Metrics retrieval failed'
    });
  }
});

// Legacy endpoints for backward compatibility

// Legacy AI analysis endpoint
router.post('/analyze', (req, res) => {
  const { text, type } = req.body;
  
  // Mock AI analysis response for backward compatibility
  res.json({ 
    success: true, 
    data: { 
      analysis: 'completed',
      type: type || 'general',
      confidence: 0.85,
      results: {
        sentiment: 'positive',
        keywords: ['property', 'location', 'value'],
        score: 78
      },
      processedAt: new Date().toISOString(),
      note: 'This is a legacy endpoint. Please use the new AI service endpoints for enhanced functionality.'
    } 
  });
});

// Legacy fraud detection endpoint
router.post('/detect-fraud', requireAuth, (req: AuthenticatedRequest, res) => {
  // Mock fraud detection response for backward compatibility
  res.json({
    success: true,
    data: {
      isSuspicious: false,
      riskScore: Math.floor(Math.random() * 30) + 10, // Random score 10-40
      confidence: 0.88,
      flaggedPatterns: [],
      recommendation: 'proceed',
      analyzedAt: new Date().toISOString(),
      note: 'This is a legacy endpoint. Please use /fraud/analyze-transaction for enhanced fraud detection.'
    }
  });
});

export { router as aiRouter };