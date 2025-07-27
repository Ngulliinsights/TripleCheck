import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PropertyService } from './property.service';
import { PropertyRepository } from './property.repository';
import { LandVerificationService } from '../land-verification/LandVerificationService';

// Mock dependencies
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

describe('PropertyService Land Verification Integration', () => {
  let propertyService: PropertyService;
  let mockPropertyRepository: Mock;
  let mockLandVerificationService: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    mockPropertyRepository = {
      findById: vi.fn(),
      update: vi.fn()
    };
    
    mockLandVerificationService = {
      initialize: vi.fn(),
      initiateVerification: vi.fn()
    };

    // Mock the constructors
    (PropertyRepository as any).mockImplementation(() => mockPropertyRepository);
    (LandVerificationService as any).mockImplementation(() => mockLandVerificationService);

    propertyService = new PropertyService();
  });

  describe('initiateLandVerification', () => {
    it('should successfully initiate land verification', async () => {
      const mockSession = {
        id: 'session123',
        propertyId: 'property123',
        userId: 'user123',
        status: 'not_started'
      };

      mockLandVerificationService.initialize.mockResolvedValue(undefined);
      mockLandVerificationService.initiateVerification.mockResolvedValue(mockSession);

      const result = await propertyService.initiateLandVerification('property123', 'user123');

      expect(mockLandVerificationService.initialize).toHaveBeenCalled();
      expect(mockLandVerificationService.initiateVerification).toHaveBeenCalledWith({
        propertyId: 'property123',
        userId: 'user123',
        requestedLayers: undefined,
        priority: 'medium'
      });

      expect(result).toEqual({
        data: { sessionId: 'session123' },
        success: true,
        message: 'Land verification initiated successfully'
      });
    });

    it('should handle initialization errors', async () => {
      mockLandVerificationService.initialize.mockRejectedValue(new Error('Initialization failed'));

      await expect(
        propertyService.initiateLandVerification('property123', 'user123')
      ).rejects.toThrow('Failed to initiate land verification: Initialization failed');
    });

    it('should pass requested layers to verification service', async () => {
      const mockSession = { id: 'session123' };
      const requestedLayers = ['registry', 'physical', 'community'];

      mockLandVerificationService.initialize.mockResolvedValue(undefined);
      mockLandVerificationService.initiateVerification.mockResolvedValue(mockSession);

      await propertyService.initiateLandVerification('property123', 'user123', requestedLayers);

      expect(mockLandVerificationService.initiateVerification).toHaveBeenCalledWith({
        propertyId: 'property123',
        userId: 'user123',
        requestedLayers,
        priority: 'medium'
      });
    });
  });

  describe('getLandVerificationStatus', () => {
    it('should return default status when no session exists', async () => {
      // Mock database to return empty result
      const { db } = await import('../lib/database');
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]) // No sessions found
            })
          })
        })
      });

      const result = await propertyService.getLandVerificationStatus('property123');

      expect(result).toEqual({
        data: {
          status: 'not_started',
          overallRiskScore: 0,
          riskLevel: 'low',
          confidence: 0,
          completedLayers: [],
          lastUpdated: expect.any(Date)
        },
        success: true
      });
    });

    it('should return session status with completed layers', async () => {
      const mockSession = {
        id: 1,
        status: 'completed',
        overallRiskScore: 25,
        riskLevel: 'low',
        confidence: '0.9',
        updatedAt: new Date()
      };

      const mockLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' },
        { layerType: 'community', status: 'in_progress' }
      ];

      // Mock database calls
      const { db } = await import('../lib/database');
      (db.select as Mock)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockSession])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLayers)
          })
        });

      const result = await propertyService.getLandVerificationStatus('property123');

      expect(result.data).toEqual({
        sessionId: '1',
        status: 'completed',
        overallRiskScore: 25,
        riskLevel: 'low',
        confidence: 0.9,
        completedLayers: ['registry', 'physical'],
        lastUpdated: mockSession.updatedAt,
        badge: {
          type: 'verified',
          label: 'Land Verified',
          color: 'green',
          description: 'Property has completed comprehensive land verification with low risk'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('../lib/database');
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      });

      await expect(
        propertyService.getLandVerificationStatus('property123')
      ).rejects.toThrow('Failed to get land verification status: Database error');
    });
  });

  describe('getLandVerificationReport', () => {
    it('should return comprehensive verification report', async () => {
      const mockSession = {
        id: 1,
        status: 'completed',
        overallRiskScore: 35,
        riskLevel: 'medium',
        confidence: '0.8',
        updatedAt: new Date()
      };

      const mockLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' }
      ];

      const mockRiskFactors = [
        {
          category: 'ownership',
          severity: 'medium',
          description: 'Minor ownership documentation gap',
          impact: 'Potential delays in transaction'
        },
        {
          category: 'government',
          severity: 'low',
          description: 'Nearby infrastructure development planned',
          impact: 'May affect property value positively'
        }
      ];

      // Mock database calls
      const { db } = await import('../lib/database');
      (db.select as Mock)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockSession])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLayers)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockRiskFactors)
          })
        });

      const result = await propertyService.getLandVerificationReport('property123');

      expect(result.data).toEqual({
        sessionId: '1',
        overallRiskScore: 35,
        riskLevel: 'medium',
        confidence: 0.8,
        completedLayers: ['registry', 'physical'],
        riskFactors: mockRiskFactors,
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            priority: expect.any(String),
            title: expect.any(String),
            description: expect.any(String)
          })
        ]),
        lastUpdated: mockSession.updatedAt
      });
    });

    it('should throw error when no session exists', async () => {
      const { db } = await import('../lib/database');
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]) // No sessions found
            })
          })
        })
      });

      await expect(
        propertyService.getLandVerificationReport('property123')
      ).rejects.toThrow('No land verification session found for this property');
    });
  });

  describe('updatePropertyLandVerification', () => {
    it('should successfully update property with land verification data', async () => {
      const mockProperty = {
        id: 1,
        title: 'Test Property',
        ownerId: 123
      };

      const mockLandVerification = {
        sessionId: 'session123',
        status: 'completed',
        overallRiskScore: 25,
        riskLevel: 'low',
        confidence: 0.9,
        completedLayers: ['registry', 'physical'],
        lastUpdated: new Date()
      };

      const mockUpdatedProperty = {
        ...mockProperty,
        landVerification: mockLandVerification
      };

      mockPropertyRepository.findById.mockResolvedValue(mockProperty);
      mockPropertyRepository.update.mockResolvedValue(mockUpdatedProperty);

      const result = await propertyService.updatePropertyLandVerification(
        'property123',
        mockLandVerification,
        123
      );

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith('property123');
      expect(mockPropertyRepository.update).toHaveBeenCalledWith('property123', {
        landVerification: mockLandVerification
      });

      expect(result).toEqual({
        data: mockUpdatedProperty,
        success: true,
        message: 'Property land verification updated successfully'
      });
    });

    it('should throw error when property not found', async () => {
      mockPropertyRepository.findById.mockResolvedValue(null);

      await expect(
        propertyService.updatePropertyLandVerification('property123', {}, 123)
      ).rejects.toThrow('Property not found');
    });

    it('should throw error when user is not property owner', async () => {
      const mockProperty = {
        id: 1,
        title: 'Test Property',
        ownerId: 456 // Different owner
      };

      mockPropertyRepository.findById.mockResolvedValue(mockProperty);

      await expect(
        propertyService.updatePropertyLandVerification('property123', {}, 123)
      ).rejects.toThrow('Unauthorized: You can only update your own properties');
    });
  });

  describe('Badge Generation', () => {
    it('should generate correct badge for completed low-risk verification', () => {
      const badge = (propertyService as any).generateLandVerificationBadge('completed', 'low');
      
      expect(badge).toEqual({
        type: 'verified',
        label: 'Land Verified',
        color: 'green',
        description: 'Property has completed comprehensive land verification with low risk'
      });
    });

    it('should generate correct badge for high-risk verification', () => {
      const badge = (propertyService as any).generateLandVerificationBadge('completed', 'critical');
      
      expect(badge).toEqual({
        type: 'high_risk',
        label: 'High Risk Property',
        color: 'red',
        description: 'Property has completed verification but significant risks were identified'
      });
    });

    it('should generate correct badge for in-progress verification', () => {
      const badge = (propertyService as any).generateLandVerificationBadge('in_progress', 'low');
      
      expect(badge).toEqual({
        type: 'in_progress',
        label: 'Verification In Progress',
        color: 'blue',
        description: 'Land verification is currently underway'
      });
    });

    it('should generate correct badge for failed verification', () => {
      const badge = (propertyService as any).generateLandVerificationBadge('failed', 'medium');
      
      expect(badge).toEqual({
        type: 'expert_required',
        label: 'Expert Review Required',
        color: 'orange',
        description: 'Land verification requires expert attention'
      });
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate appropriate recommendations for critical risk level', () => {
      const riskFactors = [
        { category: 'ownership', severity: 'critical', description: 'Invalid title deed', impact: 'Transaction cannot proceed' }
      ];

      const recommendations = (propertyService as any).generateBasicRecommendations('critical', riskFactors);
      
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            priority: 'high',
            title: 'Immediate Expert Review Required'
          }),
          expect.objectContaining({
            priority: 'high',
            title: 'Consider Alternative Properties'
          }),
          expect.objectContaining({
            priority: 'high',
            title: 'Ownership Verification'
          })
        ])
      );
    });

    it('should generate appropriate recommendations for low risk level', () => {
      const riskFactors = [];

      const recommendations = (propertyService as any).generateBasicRecommendations('low', riskFactors);
      
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            priority: 'low',
            title: 'Proceed with Confidence'
          }),
          expect.objectContaining({
            priority: 'low',
            title: 'Periodic Review'
          })
        ])
      );
    });

    it('should add specific recommendations based on risk factor categories', () => {
      const riskFactors = [
        { category: 'ownership', severity: 'medium', description: 'Test', impact: 'Test' },
        { category: 'government', severity: 'low', description: 'Test', impact: 'Test' },
        { category: 'legal', severity: 'high', description: 'Test', impact: 'Test' }
      ];

      const recommendations = (propertyService as any).generateBasicRecommendations('medium', riskFactors);
      
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Ownership Verification' }),
          expect.objectContaining({ title: 'Government Compliance Check' }),
          expect.objectContaining({ title: 'Legal Consultation' })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors in initiateLandVerification', async () => {
      mockLandVerificationService.initialize.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        propertyService.initiateLandVerification('property123', 'user123')
      ).rejects.toThrow('Failed to initiate land verification: Service unavailable');
    });

    it('should handle verification service errors', async () => {
      mockLandVerificationService.initialize.mockResolvedValue(undefined);
      mockLandVerificationService.initiateVerification.mockRejectedValue(new Error('Verification failed'));

      await expect(
        propertyService.initiateLandVerification('property123', 'user123')
      ).rejects.toThrow('Failed to initiate land verification: Verification failed');
    });

    it('should handle database connection errors in status retrieval', async () => {
      const { db } = await import('../lib/database');
      (db.select as Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(
        propertyService.getLandVerificationStatus('property123')
      ).rejects.toThrow('Failed to get land verification status: Database connection failed');
    });

    it('should handle malformed database responses', async () => {
      const { db } = await import('../lib/database');
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 1, confidence: 'invalid' }]) // Invalid confidence value
            })
          })
        })
      });

      // Should handle parsing errors gracefully
      const result = await propertyService.getLandVerificationStatus('property123');
      expect(result.data.confidence).toBe(0); // Should default to 0 for invalid values
    });
  });

  describe('Integration with PropertyRepository', () => {
    it('should properly integrate with repository for property updates', async () => {
      const mockProperty = { id: 1, ownerId: 123, title: 'Test Property' };
      const mockLandVerification = { status: 'completed', riskLevel: 'low' };
      const mockUpdatedProperty = { ...mockProperty, landVerification: mockLandVerification };

      mockPropertyRepository.findById.mockResolvedValue(mockProperty);
      mockPropertyRepository.update.mockResolvedValue(mockUpdatedProperty);

      const result = await propertyService.updatePropertyLandVerification(
        'property123',
        mockLandVerification,
        123
      );

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith('property123');
      expect(mockPropertyRepository.update).toHaveBeenCalledWith('property123', {
        landVerification: mockLandVerification
      });
      expect(result.success).toBe(true);
    });

    it('should handle repository update failures', async () => {
      const mockProperty = { id: 1, ownerId: 123, title: 'Test Property' };

      mockPropertyRepository.findById.mockResolvedValue(mockProperty);
      mockPropertyRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        propertyService.updatePropertyLandVerification('property123', {}, 123)
      ).rejects.toThrow('Failed to update property land verification: Update failed');
    });
  });

  describe('Data Transformation', () => {
    it('should properly transform database session data to API format', async () => {
      const mockSession = {
        id: 42,
        status: 'completed',
        overallRiskScore: 15,
        riskLevel: 'low',
        confidence: '0.95',
        updatedAt: new Date('2024-01-15T10:00:00Z')
      };

      const mockLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' },
        { layerType: 'community', status: 'completed' }
      ];

      const { db } = await import('../lib/database');
      (db.select as Mock)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockSession])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockLayers)
          })
        });

      const result = await propertyService.getLandVerificationStatus('property123');

      expect(result.data).toEqual({
        sessionId: '42', // Should be converted to string
        status: 'completed',
        overallRiskScore: 15,
        riskLevel: 'low',
        confidence: 0.95, // Should be converted to number
        completedLayers: ['registry', 'physical', 'community'],
        lastUpdated: mockSession.updatedAt,
        badge: expect.objectContaining({
          type: 'verified',
          label: 'Land Verified',
          color: 'green'
        })
      });
    });

    it('should handle edge cases in data transformation', async () => {
      const mockSession = {
        id: 1,
        status: 'completed',
        overallRiskScore: 0,
        riskLevel: 'low',
        confidence: '0.00', // Edge case: zero confidence
        updatedAt: new Date()
      };

      const { db } = await import('../lib/database');
      (db.select as Mock)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockSession])
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]) // No layers completed
          })
        });

      const result = await propertyService.getLandVerificationStatus('property123');

      expect(result.data.confidence).toBe(0);
      expect(result.data.completedLayers).toEqual([]);
      expect(result.data.badge).toBeDefined(); // Should still generate badge
    });
  });
});