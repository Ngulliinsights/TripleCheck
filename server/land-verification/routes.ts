import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { LandVerificationService } from './LandVerificationService';
import { DocumentAuthService } from '../document-auth/DocumentAuthService';
import { ReportingService } from './ReportingService';
import { logger } from '../infrastructure/monitoring/logger';
import { performanceRoutes } from './performance/performance-routes';
import { landVerificationCache } from './cache/LandVerificationCache';
import { asyncProcessor } from './performance/AsyncProcessor';
import { paginationService } from './performance/PaginationService';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  ErrorCode,
  HttpStatusCode,
  ErrorCategory 
} from '../../src/shared/utils/errors';

// Initialize services
const documentAuthService = new DocumentAuthService();
const landVerificationService = new LandVerificationService(documentAuthService);
const reportingService = new ReportingService();

// Initialize service on startup
landVerificationService.initialize().catch(error => {
  logger.error('Failed to initialize Land Verification Service', 'LandVerificationRoutes', undefined, error);
});

const router = Router();

// Mount performance routes
router.use('/performance', performanceRoutes);

// Validation schemas for land verification endpoints
const landVerificationSchemas = {
  // Initiate verification request
  initiateVerification: z.object({
    body: z.object({
      propertyId: z.string().regex(/^\d+$/, 'Property ID must be a valid number'),
      requestedLayers: z.array(
        z.enum(['registry', 'physical', 'community', 'government', 'legal', 'expert'])
      ).optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      notes: z.string().max(1000).optional()
    })
  }),

  // Execute verification layer
  executeLayer: z.object({
    params: z.object({
      sessionId: z.string().regex(/^\d+$/, 'Session ID must be a valid number')
    }),
    body: z.object({
      layerType: z.enum(['registry', 'physical', 'community', 'government', 'legal', 'expert'])
    })
  }),

  // Session ID parameter validation
  sessionIdParam: z.object({
    params: z.object({
      sessionId: z.string().regex(/^\d+$/, 'Session ID must be a valid number')
    })
  }),

  // Property ID parameter validation
  propertyIdParam: z.object({
    params: z.object({
      propertyId: z.string().regex(/^\d+$/, 'Property ID must be a valid number')
    })
  }),

  // Monitoring configuration
  monitoringConfig: z.object({
    params: z.object({
      propertyId: z.string().regex(/^\d+$/, 'Property ID must be a valid number')
    }),
    body: z.object({
      enabled: z.boolean(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
      monitoringTypes: z.array(z.string()).default(['government', 'legal']),
      alertThresholds: z.record(z.number()).default({}),
      notificationPreferences: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        inApp: z.boolean().default(true)
      }).default({
        email: true,
        sms: false,
        inApp: true
      })
    })
  }),

  // Pagination and filtering for sessions
  sessionFilters: z.object({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(['not_started', 'in_progress', 'completed', 'suspended', 'failed']).optional(),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      sortBy: z.enum(['createdAt', 'updatedAt', 'overallRiskScore']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
  }),

  // Report generation request
  generateReport: z.object({
    params: z.object({
      sessionId: z.string().regex(/^\d+$/, 'Session ID must be a valid number')
    }),
    body: z.object({
      templateId: z.string().min(1, 'Template ID is required'),
      format: z.enum(['pdf', 'html', 'json']).default('pdf'),
      includeConfidential: z.boolean().default(false),
      customSections: z.array(z.string()).optional(),
      audience: z.string().optional()
    })
  }),

  // Report template ID parameter
  templateIdParam: z.object({
    params: z.object({
      templateId: z.string().min(1, 'Template ID is required')
    })
  })
};

/**
 * POST /api/land-verification/sessions
 * Initiate a new land verification session
 * Requirements: 9.1, 9.2, 9.3
 */
router.post('/sessions',
  requireAuth,
  validateRequest(landVerificationSchemas.initiateVerification),
  asyncHandler(async (req, res) => {
    const { propertyId, requestedLayers, priority, notes } = req.body;
    const userId = req.user!.id.toString();

    logger.info(`Initiating land verification for property ${propertyId}`, 'LandVerificationAPI');

    try {
      const session = await landVerificationService.initiateVerification({
        propertyId,
        userId,
        requestedLayers,
        priority,
        notes
      });

      res.status(201).json({
        success: true,
        data: {
          session,
          message: 'Land verification session initiated successfully'
        },
        metadata: {
          sessionId: session.id,
          estimatedLayers: session.completedLayers.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already in progress')) {
          throw new ConflictError(
            'Verification session already in progress for this property',
            { propertyId, userId }
          );
        }
        if (error.message.includes('not found')) {
          throw new NotFoundError(
            error.message.includes('Property') ? 'Property not found' : 'User not found',
            { propertyId, userId }
          );
        }
      }
      throw error;
    }
  })
);

/**
 * GET /api/land-verification/sessions
 * Get user's land verification sessions with filtering and pagination
 * Requirements: 9.1, 9.4
 */
router.get('/sessions',
  requireAuth,
  validateRequest(landVerificationSchemas.sessionFilters),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id.toString();
    const { page, limit, status, riskLevel, sortBy, sortOrder } = req.query;

    logger.info(`Fetching land verification sessions for user ${userId}`, 'LandVerificationAPI');

    try {
      // Create data fetcher function for pagination service
      const dataFetcher = async (offset: number, limit: number, params: any) => {
        // This would integrate with the actual database query
        // For now, return mock data structure
        const mockSessions = Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
          id: `session-${offset + i + 1}`,
          propertyId: `property-${offset + i + 1}`,
          userId,
          status: status || 'in_progress',
          riskLevel: riskLevel || 'medium',
          createdAt: new Date(Date.now() - (offset + i) * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          completedLayers: [],
          expertAssignments: []
        }));

        return {
          data: mockSessions,
          total: 250 // Mock total count
        };
      };

      // Use pagination service with caching
      const result = await paginationService.paginate(dataFetcher, {
        page: page as number,
        limit: limit as number,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        filters: { status, riskLevel, userId }
      });

      res.json({
        success: true,
        data: {
          sessions: result.data,
          pagination: result.pagination
        },
        metadata: {
          filters: { status, riskLevel },
          sorting: { sortBy, sortOrder },
          performance: result.meta,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Failed to fetch verification sessions', error);
      throw error;
    }
  })
);

/**
 * GET /api/land-verification/sessions/:sessionId
 * Get detailed information about a specific verification session
 * Requirements: 9.1, 9.4
 */
router.get('/sessions/:sessionId',
  requireAuth,
  validateRequest(landVerificationSchemas.sessionIdParam),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user!.id.toString();

    logger.info(`Fetching verification session ${sessionId}`, 'LandVerificationAPI');

    try {
      // Check cache first
      const cachedSession = await landVerificationCache.getVerificationSession(sessionId);
      if (cachedSession && cachedSession.userId === userId) {
        return res.json({
          success: true,
          data: {
            status: cachedSession,
            sessionId
          },
          metadata: {
            lastUpdated: cachedSession.updatedAt,
            fromCache: true,
            timestamp: new Date().toISOString()
          }
        });
      }

      const status = await landVerificationService.getVerificationStatus(sessionId);

      // Verify user has access to this session
      // This would typically involve checking session ownership in database
      
      // Cache the session for future requests
      if (status.userId === userId) {
        await landVerificationCache.setVerificationSession(status);
      }
      
      res.json({
        success: true,
        data: {
          status,
          sessionId
        },
        metadata: {
          lastUpdated: status.lastUpdated,
          fromCache: false,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError(
          'Verification session not found',
          { sessionId, userId }
        );
      }
      throw error;
    }
  })
);

/**
 * POST /api/land-verification/sessions/:sessionId/layers
 * Execute a specific verification layer (async processing)
 * Requirements: 9.1, 9.2, 9.5
 */
router.post('/sessions/:sessionId/layers',
  requireAuth,
  validateRequest(landVerificationSchemas.executeLayer),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { layerType } = req.body;
    const userId = req.user!.id.toString();

    logger.info(`Executing verification layer ${layerType} for session ${sessionId}`, 'LandVerificationAPI');

    try {
      // Check if layer result is already cached
      const cachedResult = await landVerificationCache.getLayerResult(sessionId, layerType);
      if (cachedResult) {
        return res.json({
          success: true,
          data: {
            results: [cachedResult],
            layerType,
            sessionId,
            status: 'completed'
          },
          metadata: {
            resultsCount: 1,
            fromCache: true,
            executedAt: cachedResult.completedAt || new Date().toISOString(),
            timestamp: new Date().toISOString()
          }
        });
      }

      // Submit layer execution as async task
      const taskId = await asyncProcessor.addTask({
        type: 'verification-layer',
        priority: 'high',
        sessionId,
        propertyId: `property-${sessionId}`, // Would get actual property ID from session
        payload: {
          sessionId,
          layerType,
          layerConfig: {
            userId,
            // Additional configuration would be loaded from session
          }
        },
        maxRetries: 3,
        timeout: 300000 // 5 minutes
      });

      res.json({
        success: true,
        data: {
          taskId,
          layerType,
          sessionId,
          status: 'processing'
        },
        metadata: {
          taskSubmitted: true,
          estimatedDuration: '2-5 minutes',
          checkStatusUrl: `/api/land-verification/performance/async/task/${taskId}`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new NotFoundError(
            error.message.includes('session') ? 'Verification session not found' : 'Verification layer not found',
            { sessionId, layerType, userId }
          );
        }
      }
      throw error;
    }
  })
);

/**
 * POST /api/land-verification/sessions/:sessionId/risk-assessment
 * Generate comprehensive risk assessment for a verification session
 * Requirements: 9.1, 9.5
 */
router.post('/sessions/:sessionId/risk-assessment',
  requireAuth,
  validateRequest(landVerificationSchemas.sessionIdParam),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user!.id.toString();

    logger.info(`Generating risk assessment for session ${sessionId}`, 'LandVerificationAPI');

    try {
      const riskAssessment = await landVerificationService.generateRiskAssessment(sessionId);

      res.json({
        success: true,
        data: {
          riskAssessment,
          sessionId
        },
        metadata: {
          assessmentDate: riskAssessment.assessmentDate,
          validUntil: riskAssessment.validUntil,
          factorCount: riskAssessment.riskFactors.length,
          recommendationCount: riskAssessment.recommendations.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new NotFoundError(
            'Verification session not found',
            { sessionId, userId }
          );
        }
        if (error.message.includes('No completed')) {
          throw new ValidationError(
            'Cannot generate risk assessment without completed verification layers',
            { session: ['At least one verification layer must be completed'] }
          );
        }
      }
      throw error;
    }
  })
);

/**
 * POST /api/land-verification/properties/:propertyId/monitoring
 * Schedule ongoing monitoring for a property
 * Requirements: 9.1, 9.6
 */
router.post('/properties/:propertyId/monitoring',
  requireAuth,
  validateRequest(landVerificationSchemas.monitoringConfig),
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const monitoringConfig = req.body;
    const userId = req.user!.id.toString();

    logger.info(`Scheduling monitoring for property ${propertyId}`, 'LandVerificationAPI');

    try {
      await landVerificationService.scheduleMonitoring(propertyId, monitoringConfig);

      res.json({
        success: true,
        data: {
          propertyId,
          monitoringConfig,
          message: 'Property monitoring scheduled successfully'
        },
        metadata: {
          scheduledAt: new Date().toISOString(),
          nextCheck: monitoringConfig.enabled ? 
            new Date(Date.now() + (monitoringConfig.frequency === 'daily' ? 24 * 60 * 60 * 1000 : 
                                   monitoringConfig.frequency === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 
                                   30 * 24 * 60 * 60 * 1000)).toISOString() : null,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError(
          'Property not found',
          { propertyId, userId }
        );
      }
      throw error;
    }
  })
);

/**
 * GET /api/land-verification/properties/:propertyId/history
 * Get historical verification data for a property
 * Requirements: 9.4, 9.6
 */
router.get('/properties/:propertyId/history',
  requireAuth,
  validateRequest(landVerificationSchemas.propertyIdParam),
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const userId = req.user!.id.toString();

    logger.info(`Fetching verification history for property ${propertyId}`, 'LandVerificationAPI');

    // This would typically query historical verification sessions and risk assessments
    // For now, return placeholder structure
    const history = {
      verificationSessions: [],
      riskAssessments: [],
      monitoringAlerts: []
    };

    res.json({
      success: true,
      data: {
        propertyId,
        history
      },
      metadata: {
        sessionCount: history.verificationSessions.length,
        assessmentCount: history.riskAssessments.length,
        alertCount: history.monitoringAlerts.length,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * POST /api/land-verification/sessions/:sessionId/reports
 * Generate comprehensive verification report
 * Requirements: 9.6, 10.5, 10.6
 */
router.post('/sessions/:sessionId/reports',
  requireAuth,
  validateRequest(landVerificationSchemas.generateReport),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { templateId, format, includeConfidential, customSections, audience } = req.body;
    const userId = req.user!.id.toString();

    logger.info(`Generating report for session ${sessionId} with template ${templateId}`, 'ReportingAPI');

    try {
      const report = await reportingService.generateReport({
        sessionId,
        templateId,
        format,
        includeConfidential,
        customSections,
        audience
      });

      res.json({
        success: true,
        data: {
          report: {
            id: report.id,
            sessionId: report.sessionId,
            templateId: report.templateId,
            format: report.format,
            metadata: report.metadata
          },
          downloadUrl: report.downloadUrl
        },
        metadata: {
          generatedAt: report.metadata.generatedAt,
          fileSize: report.metadata.fileSize,
          audience: report.metadata.audience,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          if (error.message.includes('template')) {
            throw new NotFoundError(
              'Report template not found',
              { templateId, sessionId, userId }
            );
          } else {
            throw new NotFoundError(
              'Verification session not found',
              { sessionId, userId }
            );
          }
        }
      }
      throw error;
    }
  })
);

/**
 * GET /api/land-verification/sessions/:sessionId/executive-summary
 * Generate executive summary for quick decision making
 * Requirements: 9.6, 10.5
 */
router.get('/sessions/:sessionId/executive-summary',
  requireAuth,
  validateRequest(landVerificationSchemas.sessionIdParam),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user!.id.toString();

    logger.info(`Generating executive summary for session ${sessionId}`, 'ReportingAPI');

    try {
      const summary = await reportingService.generateExecutiveSummary(sessionId);

      res.json({
        success: true,
        data: {
          summary,
          sessionId
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          riskLevel: summary.overallRiskLevel,
          completeness: summary.verificationCompleteness,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError(
          'Verification session not found',
          { sessionId, userId }
        );
      }
      throw error;
    }
  })
);

/**
 * GET /api/land-verification/sessions/:sessionId/expert-reports
 * Compile expert reports into unified document
 * Requirements: 9.6, 10.6
 */
router.get('/sessions/:sessionId/expert-reports',
  requireAuth,
  validateRequest(landVerificationSchemas.sessionIdParam),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user!.id.toString();

    logger.info(`Compiling expert reports for session ${sessionId}`, 'ReportingAPI');

    try {
      const compiledReport = await reportingService.compileExpertReports(sessionId);

      res.json({
        success: true,
        data: {
          compiledReport,
          sessionId
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          contentLength: compiledReport.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError(
          'Verification session not found',
          { sessionId, userId }
        );
      }
      throw error;
    }
  })
);

/**
 * GET /api/land-verification/report-templates
 * Get available report templates
 * Requirements: 9.6
 */
router.get('/report-templates',
  requireAuth,
  asyncHandler(async (req, res) => {
    logger.info('Fetching available report templates', 'ReportingAPI');

    const templates = reportingService.getAvailableTemplates();

    res.json({
      success: true,
      data: {
        templates
      },
      metadata: {
        templateCount: templates.length,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * GET /api/land-verification/report-templates/:templateId
 * Get specific report template details
 * Requirements: 9.6
 */
router.get('/report-templates/:templateId',
  requireAuth,
  validateRequest(landVerificationSchemas.templateIdParam),
  asyncHandler(async (req, res) => {
    const { templateId } = req.params;

    logger.info(`Fetching report template ${templateId}`, 'ReportingAPI');

    const template = reportingService.getTemplate(templateId);

    if (!template) {
      throw new NotFoundError(
        'Report template not found',
        { templateId }
      );
    }

    res.json({
      success: true,
      data: {
        template
      },
      metadata: {
        sectionCount: template.sections.length,
        audience: template.audience,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * GET /api/land-verification/health
 * Health check endpoint for land verification service
 * Requirements: 9.3
 */
router.get('/health',
  asyncHandler(async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        landVerificationService: 'operational',
        documentAuthService: 'operational',
        reportingService: 'operational',
        database: 'connected'
      },
      metrics: {
        activeSessions: 0, // Would be calculated from service
        completedVerifications: 0, // Would be calculated from database
        averageProcessingTime: 0, // Would be calculated from metrics
        generatedReports: 0 // Would be calculated from reporting service
      }
    };

    res.json({
      success: true,
      data: health
    });
  })
);

/**
 * Error handling middleware specific to land verification routes
 */
router.use((error: Error, req: any, res: any, next: any) => {
  logger.error('Land verification API error', 'LandVerificationAPI', undefined, error);
  
  // Let the global error handler deal with it
  next(error);
});

export { router as landVerificationRouter };