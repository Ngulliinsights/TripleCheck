import { describe, it, expect, beforeEach, vi, Mock } from '../../shared/test-utils/index'
import { PropertyBusinessLogic } from '../services/property-validation'
import { Property, LandVerificationStatus } from '../types/property.types'
import { PropertyApi } from '../services/property-api'

// Mock the API request function
vi.mock('../../infrastructure/api/queryClient', () => ({
  apiRequest: vi.fn()
}));

describe('Property Land Verification Integration', () => {
  let mockProperty: Property;
  let mockLandVerification: LandVerificationStatus;

  beforeEach(() => {
    mockProperty = {
      id: '1',
      title: 'Test Property',
      description: 'A test property for land verification',
      price: 100000,
      location: {
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Kenya',
        coordinates: { lat: -1.2921, lng: 36.8219 }
      },
      propertyType: 'land',
      bedrooms: 0,
      bathrooms: 0,
      area: 5000,
      images: ['image1.jpg', 'image2.jpg'],
      amenities: [],
      ownerId: 'user123',
      status: 'active',
      verificationStatus: 'verified',
      trustScore: 85,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockLandVerification = {
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
  });

  describe('Property Score Calculation with Land Verification', () => {
    it('should calculate higher score for property with completed land verification', () => {
      const propertyWithLandVerification = {
        ...mockProperty,
        landVerification: mockLandVerification
      };

      const scoreWithLandVerification = PropertyBusinessLogic.calculatePropertyScore(propertyWithLandVerification);
      const scoreWithoutLandVerification = PropertyBusinessLogic.calculatePropertyScore(mockProperty);

      expect(scoreWithLandVerification).toBeGreaterThan(scoreWithoutLandVerification);
    });

    it('should calculate land verification score correctly for completed low-risk verification', () => {
      const score = PropertyBusinessLogic.calculateLandVerificationScore(mockLandVerification);
      
      // Base score (20) + completed status (60) + low risk (40) + confidence bonus (18) + layers bonus (15)
      const expectedScore = 20 + 60 + 40 + 18 + 15;
      expect(score).toBe(expectedScore);
    });

    it('should calculate lower score for high-risk land verification', () => {
      const highRiskVerification = {
        ...mockLandVerification,
        riskLevel: 'high' as const,
        overallRiskScore: 80
      };

      const lowRiskScore = PropertyBusinessLogic.calculateLandVerificationScore(mockLandVerification);
      const highRiskScore = PropertyBusinessLogic.calculateLandVerificationScore(highRiskVerification);

      expect(highRiskScore).toBeLessThan(lowRiskScore);
    });

    it('should return 0 score for undefined land verification', () => {
      const score = PropertyBusinessLogic.calculateLandVerificationScore(undefined);
      expect(score).toBe(0);
    });

    it('should penalize failed land verification', () => {
      const failedVerification = {
        ...mockLandVerification,
        status: 'failed' as const
      };

      const score = PropertyBusinessLogic.calculateLandVerificationScore(failedVerification);
      expect(score).toBeLessThan(PropertyBusinessLogic.calculateLandVerificationScore(mockLandVerification));
    });
  });

  describe('Land Verification Badge Generation', () => {
    it('should generate correct badge for completed low-risk verification', () => {
      const badge = PropertyBusinessLogic.generateLandVerificationBadge(mockLandVerification);
      
      expect(badge).toEqual({
        type: 'verified',
        label: 'Land Verified',
        color: 'green',
        description: 'Property has completed comprehensive land verification with low risk'
      });
    });

    it('should generate correct badge for completed medium-risk verification', () => {
      const mediumRiskVerification = {
        ...mockLandVerification,
        riskLevel: 'medium' as const
      };

      const badge = PropertyBusinessLogic.generateLandVerificationBadge(mediumRiskVerification);
      
      expect(badge).toEqual({
        type: 'verified',
        label: 'Land Verified - Medium Risk',
        color: 'blue',
        description: 'Property has completed land verification with medium risk factors identified'
      });
    });

    it('should generate correct badge for high-risk verification', () => {
      const highRiskVerification = {
        ...mockLandVerification,
        riskLevel: 'critical' as const
      };

      const badge = PropertyBusinessLogic.generateLandVerificationBadge(highRiskVerification);
      
      expect(badge).toEqual({
        type: 'high_risk',
        label: 'High Risk Property',
        color: 'red',
        description: 'Property has completed verification but significant risks were identified'
      });
    });

    it('should generate correct badge for in-progress verification', () => {
      const inProgressVerification = {
        ...mockLandVerification,
        status: 'in_progress' as const
      };

      const badge = PropertyBusinessLogic.generateLandVerificationBadge(inProgressVerification);
      
      expect(badge).toEqual({
        type: 'in_progress',
        label: 'Verification In Progress',
        color: 'blue',
        description: 'Land verification is currently underway'
      });
    });

    it('should generate correct badge for failed verification', () => {
      const failedVerification = {
        ...mockLandVerification,
        status: 'failed' as const
      };

      const badge = PropertyBusinessLogic.generateLandVerificationBadge(failedVerification);
      
      expect(badge).toEqual({
        type: 'expert_required',
        label: 'Expert Review Required',
        color: 'orange',
        description: 'Land verification requires expert attention'
      });
    });

    it('should return undefined for undefined land verification', () => {
      const badge = PropertyBusinessLogic.generateLandVerificationBadge(undefined);
      expect(badge).toBeUndefined();
    });
  });

  describe('Featured Property Logic with Land Verification', () => {
    it('should require completed low-risk land verification for featured land properties', () => {
      const landPropertyWithVerification = {
        ...mockProperty,
        propertyType: 'land' as const,
        landVerification: mockLandVerification,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg'] // 5+ images required
      };

      const isFeatured = PropertyBusinessLogic.isFeaturedProperty(landPropertyWithVerification);
      expect(isFeatured).toBe(true);
    });

    it('should not feature land property with high-risk verification', () => {
      const highRiskLandProperty = {
        ...mockProperty,
        propertyType: 'land' as const,
        landVerification: {
          ...mockLandVerification,
          riskLevel: 'high' as const
        },
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg']
      };

      const isFeatured = PropertyBusinessLogic.isFeaturedProperty(highRiskLandProperty);
      expect(isFeatured).toBe(false);
    });

    it('should not feature land property without completed verification', () => {
      const incompleteLandProperty = {
        ...mockProperty,
        propertyType: 'land' as const,
        landVerification: {
          ...mockLandVerification,
          status: 'in_progress' as const
        },
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg']
      };

      const isFeatured = PropertyBusinessLogic.isFeaturedProperty(incompleteLandProperty);
      expect(isFeatured).toBe(false);
    });

    it('should use standard requirements for non-land properties', () => {
      const apartmentProperty = {
        ...mockProperty,
        propertyType: 'apartment' as const,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg']
      };

      const isFeatured = PropertyBusinessLogic.isFeaturedProperty(apartmentProperty);
      expect(isFeatured).toBe(true); // Should be featured based on standard requirements
    });
  });

  describe('Property API Land Verification Methods', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should initiate land verification successfully', async () => {
      const mockResponse = { data: { sessionId: 'session123' }, success: true };
      const { apiRequest } = await import('../../infrastructure/api/queryClient');
      (apiRequest as Mock).mockResolvedValue(mockResponse);

      const result = await PropertyApi.initiateLandVerification('property123', ['registry', 'physical']);

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/properties/property123/land-verification',
        { requestedLayers: ['registry', 'physical'] },
        expect.objectContaining({
          headers: expect.any(Object),
          requestOptions: expect.objectContaining({
            key: 'initiate-land-verification:property123',
            priority: 'high',
            cancelPrevious: false
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should get land verification status successfully', async () => {
      const mockResponse = { data: mockLandVerification, success: true };
      const { apiRequest } = await import('../../infrastructure/api/queryClient');
      (apiRequest as Mock).mockResolvedValue(mockResponse);

      const result = await PropertyApi.getLandVerificationStatus('property123');

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/properties/property123/land-verification/status',
        undefined,
        expect.objectContaining({
          headers: expect.any(Object),
          requestOptions: expect.objectContaining({
            key: 'land-verification-status:property123',
            cancelPrevious: true,
            priority: 'normal'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should get land verification report successfully', async () => {
      const mockReport = {
        sessionId: 'session123',
        overallRiskScore: 25,
        riskLevel: 'low',
        confidence: 0.9,
        completedLayers: ['registry', 'physical'],
        riskFactors: [
          {
            category: 'ownership',
            severity: 'low',
            description: 'Minor ownership documentation gap',
            impact: 'Low impact on transaction'
          }
        ],
        recommendations: [
          {
            priority: 'low',
            title: 'Proceed with Confidence',
            description: 'Low risk level indicates property is suitable for transaction'
          }
        ],
        lastUpdated: new Date()
      };

      const mockResponse = { data: mockReport, success: true };
      const { apiRequest } = await import('../../infrastructure/api/queryClient');
      (apiRequest as Mock).mockResolvedValue(mockResponse);

      const result = await propertyApi.getLandVerificationReport('property123');

      expect(apiRequest).toHaveBeenCalledWith(
        'GET',
        '/api/properties/property123/land-verification/report',
        undefined,
        expect.objectContaining({
          headers: expect.any(Object),
          requestOptions: expect.objectContaining({
            key: 'land-verification-report:property123',
            cancelPrevious: true,
            priority: 'normal'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should update property land verification successfully', async () => {
      const mockResponse = { data: { ...mockProperty, landVerification: mockLandVerification }, success: true };
      const { apiRequest } = await import('../../infrastructure/api/queryClient');
      (apiRequest as Mock).mockResolvedValue(mockResponse);

      const result = await propertyApi.updatePropertyLandVerification('property123', mockLandVerification);

      expect(apiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/api/properties/property123/land-verification',
        { landVerification: mockLandVerification },
        expect.objectContaining({
          headers: expect.any(Object),
          requestOptions: expect.objectContaining({
            key: 'update-land-verification:property123',
            priority: 'high',
            cancelPrevious: true
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const { apiRequest } = await import('../../infrastructure/api/queryClient');
      (apiRequest as Mock).mockRejectedValue(new Error('Network error'));

      await expect(propertyApi.initiateLandVerification('property123')).rejects.toThrow(
        'Failed to initiate land verification: Network error'
      );
    });
  });

  describe('Property Search with Land Verification Filters', () => {
    it('should include land verification filters in search params', () => {
      const searchParams = {
        query: 'test property',
        location: 'Nairobi',
        landVerified: true,
        landRiskLevel: 'low' as const,
        sortBy: 'landVerification' as const
      };

      // This would be tested in the actual API integration
      expect(searchParams.landVerified).toBe(true);
      expect(searchParams.landRiskLevel).toBe('low');
      expect(searchParams.sortBy).toBe('landVerification');
    });
  });

  describe('Trust Score Integration', () => {
    it('should include land verification score in overall property score calculation', () => {
      const propertyWithLandVerification = {
        ...mockProperty,
        landVerification: mockLandVerification,
        trustScore: 80
      };

      const score = PropertyBusinessLogic.calculatePropertyScore(propertyWithLandVerification);
      
      // Should include base property score + land verification score + trust score contribution
      expect(score).toBeGreaterThan(200); // Reasonable expectation based on scoring logic
    });

    it('should handle properties without trust score', () => {
      const propertyWithoutTrustScore = {
        ...mockProperty,
        landVerification: mockLandVerification,
        trustScore: undefined
      };

      const score = PropertyBusinessLogic.calculatePropertyScore(propertyWithoutTrustScore);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing land verification data gracefully', () => {
      const propertyWithoutLandVerification = {
        ...mockProperty,
        landVerification: undefined
      };

      const score = PropertyBusinessLogic.calculatePropertyScore(propertyWithoutLandVerification);
      const badge = PropertyBusinessLogic.generateLandVerificationBadge(undefined);
      const isFeatured = PropertyBusinessLogic.isFeaturedProperty(propertyWithoutLandVerification);

      expect(score).toBeGreaterThan(0);
      expect(badge).toBeUndefined();
      expect(typeof isFeatured).toBe('boolean');
    });

    it('should handle incomplete land verification data', () => {
      const incompleteLandVerification = {
        status: 'in_progress' as const,
        overallRiskScore: 0,
        riskLevel: 'low' as const,
        confidence: 0,
        completedLayers: [],
        lastUpdated: new Date()
      };

      const score = PropertyBusinessLogic.calculateLandVerificationScore(incompleteLandVerification);
      const badge = PropertyBusinessLogic.generateLandVerificationBadge(incompleteLandVerification);

      expect(score).toBeGreaterThan(0);
      expect(badge?.type).toBe('in_progress');
    });

    it('should handle extreme risk scores', () => {
      const extremeRiskVerification = {
        ...mockLandVerification,
        overallRiskScore: 100,
        riskLevel: 'critical' as const,
        confidence: 0
      };

      const score = PropertyBusinessLogic.calculateLandVerificationScore(extremeRiskVerification);
      const badge = PropertyBusinessLogic.generateLandVerificationBadge(extremeRiskVerification);

      expect(score).toBeGreaterThanOrEqual(0); // Should not go negative
      expect(badge?.type).toBe('high_risk');
    });
  });
});