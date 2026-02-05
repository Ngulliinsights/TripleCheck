import { describe, it, expect, beforeEach, vi, Mock } from '..\..\src\shared\test-utils\index';
import { PropertyService } from './property.service';
import { PropertyRepository } from './property.repository';
import { LandVerificationService } from '../land-verification/LandVerificationService';
import { DocumentAuthService } from '../document-auth/DocumentAuthService';

// Mock all dependencies
vi.mock('./property.repository');
vi.mock('../land-verification/LandVerificationService');
vi.mock('../document-auth/DocumentAuthService');
vi.mock('../lib/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Property Service End-to-End Land Verification Integration', () => {
  let propertyService: PropertyService;
  let mockPropertyRepository: any;
  let mockLandVerificationService: any;
  let mockDocumentAuthService: any;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup comprehensive mocks
    mockPropertyRepository = {
      findById: vi.fn(),
      findMany: vi.fn(),
      findByOwner: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    mockLandVerificationService = {
      initialize: vi.fn(),
      initiateVerification: vi.fn(),
      executeVerificationLayer: vi.fn(),
      generateRiskAssessment: vi.fn(),
      getVerificationStatus: vi.fn(),
      scheduleMonitoring: vi.fn()
    };

    mockDocumentAuthService = {
      initialize: vi.fn(),
      authenticateDocument: vi.fn()
    };

    mockDb = require('../lib/database').db;

    // Mock constructors
    (PropertyRepository as any).mockImplementation(() => mockPropertyRepository);
    (LandVerificationService as any).mockImplementation(() => mockLandVerificationService);
    (DocumentAuthService as any).mockImplementation(() => mockDocumentAuthService);

    propertyService = new PropertyService();
  });

  describe('Complete Land Verification Workflow', () => {
    it('should complete full land verification workflow from initiation to completion', async () => {
      // Step 1: Create a property
      const propertyData = {
        title: 'Test Land Property',
        description: 'A test land property for verification',
        price: 100000,
        location: 'Nairobi, Kenya',
        propertyType: 'land',
        ownerId: 123
      };

      const mockCreatedProperty = {
        id: 1,
        ...propertyData,
        landVerification: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPropertyRepository.create.mockResolvedValue(mockCreatedProperty);

      const createdProperty = await propertyService.createProperty(propertyData, 123);
      expect(createdProperty.success).toBe(true);
      expect(createdProperty.data.landVerification).toBeNull();

      // Step 2: Initiate land verification
      const mockSession = {
        id: 'session123',
        propertyId: '1',
        userId: '123',
        status: 'not_started',
        overallRiskScore: 0,
        riskLevel: 'low',
        confidence: 0,
        monitoringEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedLayers: [],
        expertAssignments: []
      };

      mockLandVerificationService.initialize.mockResolvedValue(undefined);
      mockLandVerificationService.initiateVerification.mockResolvedValue(mockSession);

      const initiationResult = await propertyService.initiateLandVerification('1', '123', ['registry', 'physical', 'community']);
      expect(initiationResult.success).toBe(true);
      expect(initiationResult.data.sessionId).toBe('session123');

      // Step 3: Check initial verification status
      const mockInitialStatus = {
        id: 1,
        status: 'in_progress',
        overallRiskScore: 0,
        riskLevel: 'low',
        confidence: '0.0',
        updatedAt: new Date()
      };

      const mockInitialLayers = [
        { layerType: 'registry', status: 'not_started' },
        { layerType: 'physical', status: 'not_started' },
        { layerType: 'community', status: 'not_started' }
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockInitialStatus])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockInitialLayers)
          })
        });

      const initialStatus = await propertyService.getLandVerificationStatus('1');
      expect(initialStatus.success).toBe(true);
      expect(initialStatus.data.status).toBe('in_progress');
      expect(initialStatus.data.completedLayers).toEqual([]);

      // Step 4: Simulate layer completion and check updated status
      const mockCompletedStatus = {
        id: 1,
        status: 'completed',
        overallRiskScore: 25,
        riskLevel: 'low',
        confidence: '0.9',
        updatedAt: new Date()
      };

      const mockCompletedLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' },
        { layerType: 'community', status: 'completed' }
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockCompletedStatus])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedLayers)
          })
        });

      const completedStatus = await propertyService.getLandVerificationStatus('1');
      expect(completedStatus.success).toBe(true);
      expect(completedStatus.data.status).toBe('completed');
      expect(completedStatus.data.overallRiskScore).toBe(25);
      expect(completedStatus.data.riskLevel).toBe('low');
      expect(completedStatus.data.confidence).toBe(0.9);
      expect(completedStatus.data.completedLayers).toEqual(['registry', 'physical', 'community']);
      expect(completedStatus.data.badge).toEqual({
        type: 'verified',
        label: 'Land Verified',
        color: 'green',
        description: 'Property has completed comprehensive land verification with low risk'
      });

      // Step 5: Get detailed verification report
      const mockRiskFactors = [
        {
          category: 'ownership',
          severity: 'low',
          description: 'Minor documentation formatting issue',
          impact: 'Minimal impact on transaction'
        }
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockCompletedStatus])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedLayers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockRiskFactors)
          })
        });

      const report = await propertyService.getLandVerificationReport('1');
      expect(report.success).toBe(true);
      expect(report.data.sessionId).toBe('1');
      expect(report.data.overallRiskScore).toBe(25);
      expect(report.data.riskLevel).toBe('low');
      expect(report.data.confidence).toBe(0.9);
      expect(report.data.completedLayers).toEqual(['registry', 'physical', 'community']);
      expect(report.data.riskFactors).toEqual(mockRiskFactors);
      expect(report.data.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            priority: 'low',
            title: 'Proceed with Confidence'
          })
        ])
      );

      // Step 6: Update property with land verification results
      const landVerificationData = {
        sessionId: 'session123',
        status: 'completed',
        overallRiskScore: 25,
        riskLevel: 'low',
        confidence: 0.9,
        completedLayers: ['registry', 'physical', 'community'],
        lastUpdated: new Date(),
        badge: {
          type: 'verified',
          label: 'Land Verified',
          color: 'green',
          description: 'Property has completed comprehensive land verification with low risk'
        }
      };

      const mockPropertyWithVerification = {
        ...mockCreatedProperty,
        landVerification: landVerificationData
      };

      mockPropertyRepository.findById.mockResolvedValue(mockCreatedProperty);
      mockPropertyRepository.update.mockResolvedValue(mockPropertyWithVerification);

      const updateResult = await propertyService.updatePropertyLandVerification('1', landVerificationData, 123);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.landVerification).toEqual(landVerificationData);

      // Step 7: Verify property now shows as land verified in listings
      const mockPropertiesWithVerification = {
        data: [mockPropertyWithVerification],
        total: 1,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      };

      mockPropertyRepository.findMany.mockResolvedValue(mockPropertiesWithVerification);

      const properties = await propertyService.getProperties({ landVerified: true, landRiskLevel: 'low' });
      expect(properties.data).toHaveLength(1);
      expect(properties.data[0].landVerification.status).toBe('completed');
      expect(properties.data[0].landVerification.riskLevel).toBe('low');
    });

    it('should handle high-risk verification workflow', async () => {
      // Simulate high-risk verification scenario
      const mockHighRiskStatus = {
        id: 1,
        status: 'completed',
        overallRiskScore: 85,
        riskLevel: 'high',
        confidence: '0.6',
        updatedAt: new Date()
      };

      const mockCompletedLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' },
        { layerType: 'community', status: 'completed' }
      ];

      const mockHighRiskFactors = [
        {
          category: 'ownership',
          severity: 'high',
          description: 'Disputed ownership claims identified',
          impact: 'Significant legal risk for transaction'
        },
        {
          category: 'government',
          severity: 'medium',
          description: 'Property in planned development zone',
          impact: 'Potential future restrictions'
        }
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockHighRiskStatus])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedLayers)
          })
        });

      const highRiskStatus = await propertyService.getLandVerificationStatus('1');
      expect(highRiskStatus.data.riskLevel).toBe('high');
      expect(highRiskStatus.data.badge).toEqual({
        type: 'high_risk',
        label: 'High Risk Property',
        color: 'red',
        description: 'Property has completed verification but significant risks were identified'
      });

      // Get detailed report for high-risk property
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockHighRiskStatus])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedLayers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockHighRiskFactors)
          })
        });

      const highRiskReport = await propertyService.getLandVerificationReport('1');
      expect(highRiskReport.data.riskLevel).toBe('high');
      expect(highRiskReport.data.riskFactors).toHaveLength(2);
      expect(highRiskReport.data.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            priority: 'high',
            title: 'Professional Legal Review'
          }),
          expect.objectContaining({
            priority: 'high',
            title: 'Ownership Verification'
          })
        ])
      );
    });

    it('should handle failed verification workflow', async () => {
      // Simulate failed verification scenario
      const mockFailedSession = {
        id: 'session123',
        propertyId: '1',
        userId: '123',
        status: 'failed',
        overallRiskScore: 0,
        riskLevel: 'low',
        confidence: 0,
        monitoringEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedLayers: [],
        expertAssignments: []
      };

      mockLandVerificationService.initialize.mockResolvedValue(undefined);
      mockLandVerificationService.initiateVerification.mockRejectedValue(
        new Error('Property documents could not be authenticated')
      );

      await expect(
        propertyService.initiateLandVerification('1', '123')
      ).rejects.toThrow('Failed to initiate land verification: Property documents could not be authenticated');

      // Check status shows failed state
      const mockFailedStatus = {
        id: 1,
        status: 'failed',
        overallRiskScore: 0,
        riskLevel: 'low',
        confidence: '0.0',
        updatedAt: new Date()
      };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockFailedStatus])
            })
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      const failedStatus = await propertyService.getLandVerificationStatus('1');
      expect(failedStatus.data.status).toBe('failed');
      expect(failedStatus.data.badge).toEqual({
        type: 'expert_required',
        label: 'Expert Review Required',
        color: 'orange',
        description: 'Land verification requires expert attention'
      });
    });
  });

  describe('Property Filtering and Search Integration', () => {
    it('should filter properties by land verification status in search results', async () => {
      const mockVerifiedProperties = {
        data: [
          {
            id: 1,
            title: 'Verified Land Property 1',
            landVerification: {
              status: 'completed',
              riskLevel: 'low',
              badge: { type: 'verified', label: 'Land Verified', color: 'green' }
            }
          },
          {
            id: 2,
            title: 'Verified Land Property 2',
            landVerification: {
              status: 'completed',
              riskLevel: 'medium',
              badge: { type: 'verified', label: 'Land Verified - Medium Risk', color: 'blue' }
            }
          }
        ],
        total: 2,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      };

      mockPropertyRepository.findMany.mockResolvedValue(mockVerifiedProperties);

      const searchResults = await propertyService.getProperties({
        landVerified: true,
        sortBy: 'landVerification',
        sortOrder: 'asc'
      });

      expect(searchResults.data).toHaveLength(2);
      expect(searchResults.data.every(p => p.landVerification?.status === 'completed')).toBe(true);
    });

    it('should filter properties by specific risk levels', async () => {
      const mockLowRiskProperties = {
        data: [
          {
            id: 1,
            title: 'Low Risk Property',
            landVerification: {
              status: 'completed',
              riskLevel: 'low',
              overallRiskScore: 15
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      };

      mockPropertyRepository.findMany.mockResolvedValue(mockLowRiskProperties);

      const lowRiskResults = await propertyService.getProperties({
        landRiskLevel: 'low'
      });

      expect(lowRiskResults.data).toHaveLength(1);
      expect(lowRiskResults.data[0].landVerification.riskLevel).toBe('low');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(
        propertyService.getLandVerificationStatus('1')
      ).rejects.toThrow('Failed to get land verification status: Database connection failed');
    });

    it('should handle land verification service failures', async () => {
      mockLandVerificationService.initialize.mockRejectedValue(
        new Error('Land verification service is down')
      );

      await expect(
        propertyService.initiateLandVerification('1', '123')
      ).rejects.toThrow('Failed to initiate land verification: Land verification service is down');
    });

    it('should handle partial verification data gracefully', async () => {
      const mockPartialStatus = {
        id: 1,
        status: 'in_progress',
        overallRiskScore: null,
        riskLevel: null,
        confidence: null,
        updatedAt: new Date()
      };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockPartialStatus])
            })
          })
        })
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });

      const status = await propertyService.getLandVerificationStatus('1');
      expect(status.success).toBe(true);
      expect(status.data.status).toBe('in_progress');
      expect(status.data.completedLayers).toEqual([]);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent verification requests', async () => {
      const mockSessions = [
        { id: 'session1', propertyId: '1', userId: '123' },
        { id: 'session2', propertyId: '2', userId: '123' },
        { id: 'session3', propertyId: '3', userId: '123' }
      ];

      mockLandVerificationService.initialize.mockResolvedValue(undefined);
      mockLandVerificationService.initiateVerification
        .mockResolvedValueOnce(mockSessions[0])
        .mockResolvedValueOnce(mockSessions[1])
        .mockResolvedValueOnce(mockSessions[2]);

      const promises = [
        propertyService.initiateLandVerification('1', '123'),
        propertyService.initiateLandVerification('2', '123'),
        propertyService.initiateLandVerification('3', '123')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockLandVerificationService.initiateVerification).toHaveBeenCalledTimes(3);
    });

    it('should handle large property datasets with land verification', async () => {
      const mockLargeDataset = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          title: `Property ${i + 1}`,
          landVerification: i % 2 === 0 ? {
            status: 'completed',
            riskLevel: 'low'
          } : null
        })),
        total: 100,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false
      };

      mockPropertyRepository.findMany.mockResolvedValue(mockLargeDataset);

      const results = await propertyService.getProperties({ limit: 100 });
      expect(results.data).toHaveLength(100);
      expect(results.data.filter(p => p.landVerification?.status === 'completed')).toHaveLength(50);
    });
  });
});