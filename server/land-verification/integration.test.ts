import { describe, it, expect, beforeEach, afterEach, vi } from '..\..\src\shared\test-utils\index';
import { LandVerificationServiceFactory } from './ServiceFactory';
import { DocumentAuthService } from '../document-auth/DocumentAuthService';
import { LandVerificationService } from './LandVerificationService';
import { DocumentIntegration } from './DocumentIntegration';

// Mock the database and dependencies
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis()
  }
}));

vi.mock('../../src/shared/schema', () => ({
  landVerificationSessions: { id: 'id', propertyId: 'propertyId', userId: 'userId', status: 'status' },
  verificationLayers: { id: 'id', sessionId: 'sessionId', layerType: 'layerType', status: 'status' },
  riskFactors: { id: 'id', sessionId: 'sessionId' },
  properties: { id: 'id' },
  users: { id: 'id' }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn()
}));

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock Document Auth Service
vi.mock('../document-auth/DocumentAuthService', () => ({
  DocumentAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    verifyDocument: vi.fn().mockResolvedValue({
      id: 'test-verification-id',
      documentId: 'test-doc-id',
      overallScore: 85,
      status: 'authentic',
      confidence: 0.9,
      checks: [
        {
          type: 'metadata',
          name: 'Metadata Check',
          status: 'pass',
          score: 90,
          description: 'Document metadata verified',
          details: ['Creation date valid', 'Author information present'],
          confidence: 0.95,
          processingTime: 1000
        }
      ],
      metadata: {
        fileSize: 1024,
        hash: 'test-hash'
      },
      processedAt: new Date(),
      processingTime: 2000,
      riskFactors: [],
      recommendations: ['Document appears authentic']
    }),
    shutdown: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Land Verification Service Integration', () => {
  let mockDocumentAuthService: DocumentAuthService;
  let landVerificationService: LandVerificationService;
  let documentIntegration: DocumentIntegration;
  let mockDb: any;

  beforeEach(async () => {
    // Get the mocked db
    const { db } = await import('../db');
    mockDb = db;

    // Mock database responses for initialization
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    });

    // Create mock document auth service
    mockDocumentAuthService = new DocumentAuthService();

    // Create services using factory
    const services = await LandVerificationServiceFactory.createService(mockDocumentAuthService, {
      enableDocumentIntegration: true,
      defaultVerificationLayers: ['registry', 'physical', 'community'],
      riskThresholds: {
        low: 80,
        medium: 60,
        high: 40
      }
    });

    landVerificationService = services.landVerificationService;
    documentIntegration = services.documentIntegration;
  });

  afterEach(async () => {
    await LandVerificationServiceFactory.shutdownService();
    vi.clearAllMocks();
  });

  describe('Service Factory Integration', () => {
    it('should create services with proper dependencies', async () => {
      expect(landVerificationService).toBeInstanceOf(LandVerificationService);
      expect(documentIntegration).toBeInstanceOf(DocumentIntegration);
      expect(mockDocumentAuthService.initialize).toHaveBeenCalled();
    });

    it('should create singleton service', async () => {
      const services1 = await LandVerificationServiceFactory.createSingletonService(mockDocumentAuthService);
      const services2 = await LandVerificationServiceFactory.createSingletonService(mockDocumentAuthService);

      expect(services1.landVerificationService).toBe(services2.landVerificationService);
      expect(services1.documentIntegration).toBe(services2.documentIntegration);
    });

    it('should handle service shutdown gracefully', async () => {
      await LandVerificationServiceFactory.shutdownService();
      expect(LandVerificationServiceFactory.getInstance()).toBeNull();
      expect(LandVerificationServiceFactory.getDocumentIntegration()).toBeNull();
    });
  });

  describe('Document Integration', () => {
    it('should integrate document verification with land verification', async () => {
      const documentRequest = {
        sessionId: '1',
        layerId: '1',
        documentType: 'title_deed' as const,
        file: Buffer.from('test document content'),
        filename: 'title_deed.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: '1',
        propertyId: '1'
      };

      const result = await documentIntegration.verifyLandDocument(documentRequest);

      expect(result).toBeDefined();
      expect(result.landSpecificChecks).toBeDefined();
      expect(result.complianceStatus).toBeDefined();
      expect(result.legalImplications).toBeDefined();
      expect(result.requiredActions).toBeDefined();
      expect(mockDocumentAuthService.verifyDocument).toHaveBeenCalled();
    });

    it('should handle different document types appropriately', async () => {
      const documentTypes = ['title_deed', 'survey_plan', 'government_approval', 'legal_opinion', 'expert_report'] as const;

      for (const documentType of documentTypes) {
        const documentRequest = {
          sessionId: '1',
          layerId: '1',
          documentType,
          file: Buffer.from('test document content'),
          filename: `${documentType}.pdf`,
          mimeType: 'application/pdf',
          size: 1024,
          uploadedAt: new Date(),
          userId: '1',
          propertyId: '1'
        };

        const result = await documentIntegration.verifyLandDocument(documentRequest);

        expect(result.landSpecificChecks.length).toBeGreaterThan(0);
        expect(result.complianceStatus).toMatch(/^(compliant|non_compliant|requires_review)$/);
      }
    });

    it('should emit document_verified event', async () => {
      const documentRequest = {
        sessionId: '1',
        layerId: '1',
        documentType: 'title_deed' as const,
        file: Buffer.from('test document content'),
        filename: 'title_deed.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: '1',
        propertyId: '1'
      };

      const eventSpy = vi.fn();
      landVerificationService.on('document_verified', eventSpy);

      await documentIntegration.verifyLandDocument(documentRequest);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: '1',
          layerId: '1',
          documentType: 'title_deed'
        })
      );
    });
  });

  describe('End-to-End Verification Flow', () => {
    it('should complete full verification workflow', async () => {
      // Mock database responses for verification initiation
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, title: 'Test Property' }])
          })
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, username: 'testuser' }])
          })
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const mockInsertedSession = {
        id: 1,
        propertyId: 1,
        userId: 1,
        status: 'not_started',
        overallRiskScore: 0,
        riskLevel: 'low',
        confidence: '0.00',
        monitoringEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockInsertedSession])
        })
      });

      // 1. Initiate verification
      const verificationRequest = {
        propertyId: '1',
        userId: '1',
        requestedLayers: ['registry', 'physical'] as const
      };

      const session = await landVerificationService.initiateVerification(verificationRequest);
      expect(session.status).toBe('not_started');

      // 2. Execute verification layer
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: 'in_progress' }])
          })
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              layerType: 'registry',
              status: 'not_started',
              startedAt: new Date()
            }])
          })
        })
      });

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, status: 'completed' },
            { id: 2, status: 'not_started' }
          ])
        })
      });

      const layerResults = await landVerificationService.executeVerificationLayer(session.id, 'registry');
      expect(layerResults.length).toBeGreaterThan(0);

      // 3. Generate risk assessment
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              status: 'completed',
              results: [{ score: 85, confidence: 0.9 }]
            }
          ])
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      const riskAssessment = await landVerificationService.generateRiskAssessment(session.id);
      expect(riskAssessment.overallRiskScore).toBeGreaterThan(0);
      expect(riskAssessment.riskLevel).toBeDefined();

      // 4. Get verification status
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              status: 'in_progress',
              overallRiskScore: 75,
              riskLevel: 'medium',
              confidence: '0.85',
              updatedAt: new Date()
            }])
          })
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, status: 'completed', layerType: 'registry', estimatedDuration: 4 },
            { id: 2, status: 'not_started', layerType: 'physical', estimatedDuration: 8 }
          ])
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      const status = await landVerificationService.getVerificationStatus(session.id);
      expect(status.sessionId).toBe(session.id);
      expect(status.progress.totalLayers).toBe(2);
      expect(status.progress.completedLayers).toBe(1);
    });

    it('should handle errors gracefully throughout the workflow', async () => {
      // Test error handling in verification initiation
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const verificationRequest = {
        propertyId: '999',
        userId: '1'
      };

      await expect(landVerificationService.initiateVerification(verificationRequest))
        .rejects.toThrow('Property 999 not found');

      // Test error handling in document verification
      const documentRequest = {
        sessionId: '1',
        layerId: '1',
        documentType: 'title_deed' as const,
        file: Buffer.from('test document content'),
        filename: 'title_deed.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: '1',
        propertyId: '1'
      };

      // Mock document auth service to throw error
      (mockDocumentAuthService.verifyDocument as any).mockRejectedValueOnce(new Error('Document verification failed'));

      await expect(documentIntegration.verifyLandDocument(documentRequest))
        .rejects.toThrow('Document verification failed');
    });
  });

  describe('Event System Integration', () => {
    it('should properly emit and handle events across services', async () => {
      const events: string[] = [];

      landVerificationService.on('verification_initiated', () => events.push('verification_initiated'));
      landVerificationService.on('layer_completed', () => events.push('layer_completed'));
      landVerificationService.on('risk_assessment_generated', () => events.push('risk_assessment_generated'));
      landVerificationService.on('document_verified', () => events.push('document_verified'));

      // Setup mocks for successful verification
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            propertyId: 1,
            userId: 1,
            status: 'not_started',
            overallRiskScore: 0,
            riskLevel: 'low',
            confidence: '0.00',
            monitoringEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }])
        })
      });

      // Initiate verification (should emit verification_initiated)
      const session = await landVerificationService.initiateVerification({
        propertyId: '1',
        userId: '1'
      });

      expect(events).toContain('verification_initiated');

      // Verify document (should emit document_verified)
      const documentRequest = {
        sessionId: session.id,
        layerId: '1',
        documentType: 'title_deed' as const,
        file: Buffer.from('test'),
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: '1',
        propertyId: '1'
      };

      await documentIntegration.verifyLandDocument(documentRequest);
      expect(events).toContain('document_verified');
    });
  });
});