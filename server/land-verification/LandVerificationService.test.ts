import { describe, it, expect, beforeEach, afterEach, vi, Mock } from '..\..\src\shared\test-utils\index';
import { EventEmitter } from 'events';
import { LandVerificationService, VerificationRequest, VerificationSession } from './LandVerificationService';
import { DocumentAuthService } from '../document-auth/DocumentAuthService';

// Mock the database
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

// Mock the schema
vi.mock('../../src/shared/schema', () => ({
  landVerificationSessions: { id: 'id', propertyId: 'propertyId', userId: 'userId', status: 'status' },
  verificationLayers: { id: 'id', sessionId: 'sessionId', layerType: 'layerType', status: 'status' },
  riskFactors: { id: 'id', sessionId: 'sessionId' },
  properties: { id: 'id' },
  users: { id: 'id' }
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn()
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('LandVerificationService', () => {
  let service: LandVerificationService;
  let mockDocumentAuthService: DocumentAuthService;
  let mockDb: any;

  beforeEach(async () => {
    // Create mock document auth service
    mockDocumentAuthService = new EventEmitter() as any;
    mockDocumentAuthService.initialize = vi.fn().mockResolvedValue(undefined);
    mockDocumentAuthService.verifyDocument = vi.fn();

    // Get the mocked db
    const { db } = await import('../db');
    mockDb = db;

    // Create service instance
    service = new LandVerificationService(mockDocumentAuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with document auth service', async () => {
      // Mock database query for loading active sessions
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      await service.initialize();

      expect(mockDocumentAuthService).toBeDefined();
    });

    it('should throw error if document auth service is not provided', async () => {
      const serviceWithoutAuth = new LandVerificationService(null as any);

      await expect(serviceWithoutAuth.initialize()).rejects.toThrow(
        'Document Authentication Service is required'
      );
    });

    it('should load active sessions from database during initialization', async () => {
      const mockActiveSessions = [
        {
          id: 1,
          propertyId: 1,
          userId: 1,
          status: 'in_progress',
          currentLayer: 'registry',
          overallRiskScore: 0,
          riskLevel: 'low',
          confidence: '0.00',
          estimatedCompletionDate: null,
          actualCompletionDate: null,
          monitoringEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockActiveSessions)
        })
      });

      await service.initialize();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('initiateVerification', () => {
    beforeEach(async () => {
      // Initialize service
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      await service.initialize();
    });

    it('should create new verification session successfully', async () => {
      const request: VerificationRequest = {
        propertyId: '1',
        userId: '1',
        requestedLayers: ['registry', 'physical']
      };

      // Mock property exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, title: 'Test Property' }])
          })
        })
      });

      // Mock user exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, username: 'testuser' }])
          })
        })
      });

      // Mock no existing session
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      // Mock session insertion
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

      // Mock layer insertions
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }])
        })
      });

      const session = await service.initiateVerification(request);

      expect(session).toBeDefined();
      expect(session.propertyId).toBe('1');
      expect(session.userId).toBe('1');
      expect(session.status).toBe('not_started');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error if property does not exist', async () => {
      const request: VerificationRequest = {
        propertyId: '999',
        userId: '1'
      };

      // Mock property not found
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await expect(service.initiateVerification(request)).rejects.toThrow(
        'Property 999 not found'
      );
    });

    it('should throw error if user does not exist', async () => {
      const request: VerificationRequest = {
        propertyId: '1',
        userId: '999'
      };

      // Mock property exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      });

      // Mock user not found
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await expect(service.initiateVerification(request)).rejects.toThrow(
        'User 999 not found'
      );
    });

    it('should throw error if verification session already in progress', async () => {
      const request: VerificationRequest = {
        propertyId: '1',
        userId: '1'
      };

      // Mock property exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      });

      // Mock user exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1 }])
          })
        })
      });

      // Mock existing session in progress
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: 'in_progress' }])
          })
        })
      });

      await expect(service.initiateVerification(request)).rejects.toThrow(
        'Verification session already in progress for this property'
      );
    });

    it('should emit verification_initiated event', async () => {
      const request: VerificationRequest = {
        propertyId: '1',
        userId: '1'
      };

      // Setup mocks for successful creation
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

      const eventSpy = vi.fn();
      service.on('verification_initiated', eventSpy);

      await service.initiateVerification(request);

      expect(eventSpy).toHaveBeenCalledWith({
        sessionId: '1',
        propertyId: '1'
      });
    });
  });

  describe('executeVerificationLayer', () => {
    beforeEach(async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      await service.initialize();
    });

    it('should execute registry layer successfully', async () => {
      const sessionId = '1';
      const layerType = 'registry';

      // Mock session exists
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: 'in_progress' }])
          })
        })
      });

      // Mock layer exists
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

      // Mock layer updates
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      // Mock session update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      // Mock layers for progress update
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, status: 'completed' },
            { id: 2, status: 'not_started' }
          ])
        })
      });

      const results = await service.executeVerificationLayer(sessionId, layerType);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('registry_check');
      expect(results[0].status).toBe('pass');
    });

    it('should throw error if session not found', async () => {
      const sessionId = '999';
      const layerType = 'registry';

      // Mock session not found
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await expect(service.executeVerificationLayer(sessionId, layerType)).rejects.toThrow(
        'Verification session 999 not found'
      );
    });

    it('should emit layer_completed event', async () => {
      const sessionId = '1';
      const layerType = 'physical';

      // Setup mocks for successful execution
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
              layerType: 'physical',
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
            { id: 1, status: 'completed' }
          ])
        })
      });

      const eventSpy = vi.fn();
      service.on('layer_completed', eventSpy);

      const results = await service.executeVerificationLayer(sessionId, layerType);

      expect(eventSpy).toHaveBeenCalledWith({
        sessionId,
        layerType,
        results
      });
    });
  });

  describe('generateRiskAssessment', () => {
    beforeEach(async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      await service.initialize();
    });

    it('should generate risk assessment successfully', async () => {
      const sessionId = '1';

      // Mock completed layers
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              status: 'completed',
              results: [{ score: 85, confidence: 0.9 }]
            },
            {
              id: 2,
              status: 'completed',
              results: [{ score: 70, confidence: 0.8 }]
            }
          ])
        })
      });

      // Mock existing risk factors
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              category: 'ownership',
              severity: 'medium',
              confidence: '0.8',
              description: 'Test risk factor',
              evidence: ['test evidence'],
              impact: 'Medium impact',
              likelihood: '0.6',
              mitigation: ['Test mitigation']
            }
          ])
        })
      });

      // Mock session update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const riskAssessment = await service.generateRiskAssessment(sessionId);

      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.sessionId).toBe(sessionId);
      expect(riskAssessment.overallRiskScore).toBeGreaterThan(0);
      expect(riskAssessment.riskLevel).toBeDefined();
      expect(riskAssessment.confidence).toBeGreaterThan(0);
      expect(riskAssessment.recommendations).toBeDefined();
    });

    it('should throw error if no completed layers found', async () => {
      const sessionId = '1';

      // Mock no completed layers
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, status: 'not_started' },
            { id: 2, status: 'in_progress' }
          ])
        })
      });

      await expect(service.generateRiskAssessment(sessionId)).rejects.toThrow(
        'No completed verification layers found for risk assessment'
      );
    });

    it('should emit risk_assessment_generated event', async () => {
      const sessionId = '1';

      // Setup mocks for successful generation
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

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const eventSpy = vi.fn();
      service.on('risk_assessment_generated', eventSpy);

      const riskAssessment = await service.generateRiskAssessment(sessionId);

      expect(eventSpy).toHaveBeenCalledWith({
        sessionId,
        riskAssessment
      });
    });
  });

  describe('getVerificationStatus', () => {
    beforeEach(async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      await service.initialize();
    });

    it('should return verification status successfully', async () => {
      const sessionId = '1';

      // Mock session
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

      // Mock layers
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 1, status: 'completed', layerType: 'registry', estimatedDuration: 4 },
            { id: 2, status: 'in_progress', layerType: 'physical', estimatedDuration: 8 },
            { id: 3, status: 'not_started', layerType: 'community', estimatedDuration: 6 }
          ])
        })
      });

      // Mock risk factors
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { severity: 'high', description: 'High risk factor' },
            { severity: 'medium', description: 'Medium risk factor' }
          ])
        })
      });

      const status = await service.getVerificationStatus(sessionId);

      expect(status).toBeDefined();
      expect(status.sessionId).toBe(sessionId);
      expect(status.status).toBe('in_progress');
      expect(status.progress.totalLayers).toBe(3);
      expect(status.progress.completedLayers).toBe(1);
      expect(status.progress.currentLayer).toBe('physical');
      expect(status.progress.estimatedTimeRemaining).toBe(6);
      expect(status.riskAssessment).toBeDefined();
      expect(status.riskAssessment?.majorRisks).toContain('High risk factor');
    });

    it('should throw error if session not found', async () => {
      const sessionId = '999';

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await expect(service.getVerificationStatus(sessionId)).rejects.toThrow(
        'Verification session 999 not found'
      );
    });
  });

  describe('scheduleMonitoring', () => {
    beforeEach(async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      await service.initialize();
    });

    it('should schedule monitoring successfully', async () => {
      const propertyId = '1';
      const monitoringConfig = {
        enabled: true,
        frequency: 'monthly' as const,
        monitoringTypes: ['government_changes', 'legal_disputes'],
        alertThresholds: { risk_score: 70 },
        notificationPreferences: {
          email: true,
          sms: false,
          inApp: true
        }
      };

      // Mock session exists
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 1 }])
            })
          })
        })
      });

      // Mock session update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const eventSpy = vi.fn();
      service.on('monitoring_scheduled', eventSpy);

      await service.scheduleMonitoring(propertyId, monitoringConfig);

      expect(eventSpy).toHaveBeenCalledWith({
        propertyId,
        monitoringConfig
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      
      await service.initialize();
      await service.shutdown();

      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});