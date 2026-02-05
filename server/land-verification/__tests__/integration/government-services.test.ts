import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GovernmentIntegrationService } from '../GovernmentIntegrationService';
import { MockGovernmentServices } from './mocks/MockGovernmentServices';

describe('Government Services Integration Tests', () => {
  let governmentService: GovernmentIntegrationService;
  let mockServices: MockGovernmentServices;

  beforeEach(() => {
    mockServices = new MockGovernmentServices();
    governmentService = new GovernmentIntegrationService({
      apiEndpoints: mockServices.getEndpoints(),
      timeout: 5000,
      retryAttempts: 3
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Ministry of Lands Registry Integration', () => {
    it('should successfully search land registry with valid title number', async () => {
      const titleNumber = 'NAIROBI/BLOCK1/123';
      const location = 'Nairobi, Kenya';

      const result = await governmentService.searchLandRegistry(titleNumber, location);

      expect(result).toMatchObject({
        titleNumber,
        currentOwner: expect.objectContaining({
          name: expect.any(String),
          idNumber: expect.any(String),
          registrationDate: expect.any(Date)
        }),
        ownershipHistory: expect.any(Array),
        legalInstruments: expect.any(Array),
        surveyDetails: expect.objectContaining({
          coordinates: expect.objectContaining({
            lat: expect.any(Number),
            lng: expect.any(Number)
          }),
          area: expect.any(Number)
        }),
        verificationStatus: 'verified'
      });
    });

    it('should handle invalid title number gracefully', async () => {
      const invalidTitleNumber = 'INVALID/TITLE/000';
      
      await expect(
        governmentService.searchLandRegistry(invalidTitleNumber, 'Nairobi')
      ).rejects.toThrow('Title number not found in registry');
    });

    it('should handle registry service timeout', async () => {
      mockServices.simulateTimeout('lands-registry');

      await expect(
        governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi')
      ).rejects.toThrow('Registry service timeout');
    });

    it('should retry failed requests according to retry policy', async () => {
      const spy = vi.spyOn(mockServices, 'callLandsRegistry');
      mockServices.simulateIntermittentFailure('lands-registry', 2);

      const result = await governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi');

      expect(spy).toHaveBeenCalledTimes(3); // Initial call + 2 retries
      expect(result).toBeDefined();
    });

    it('should validate ownership history completeness', async () => {
      const result = await governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi');

      expect(result.ownershipHistory).toBeInstanceOf(Array);
      if (result.ownershipHistory.length > 0) {
        result.ownershipHistory.forEach(transfer => {
          expect(transfer).toMatchObject({
            fromOwner: expect.any(String),
            toOwner: expect.any(String),
            transferDate: expect.any(Date),
            transferType: expect.any(String),
            registrationNumber: expect.any(String)
          });
        });
      }
    });
  });

  describe('Court Records Integration', () => {
    it('should search court records for property-related cases', async () => {
      const propertyId = 'PROP123';
      const ownerNames = ['John Doe', 'Jane Smith'];

      const records = await governmentService.checkCourtRecords(propertyId, ownerNames);

      expect(records).toBeInstanceOf(Array);
      records.forEach(record => {
        expect(record).toMatchObject({
          caseNumber: expect.any(String),
          court: expect.any(String),
          parties: expect.any(Array),
          caseType: expect.any(String),
          status: expect.stringMatching(/^(active|settled|dismissed|withdrawn)$/),
          filingDate: expect.any(Date),
          summary: expect.any(String),
          relevanceScore: expect.any(Number),
          riskImplication: expect.any(String)
        });
      });
    });

    it('should filter court records by relevance score', async () => {
      const records = await governmentService.checkCourtRecords('PROP123', ['John Doe']);

      const relevantRecords = records.filter(record => record.relevanceScore > 0.5);
      expect(relevantRecords.length).toBeGreaterThan(0);
    });

    it('should handle multiple court systems', async () => {
      const records = await governmentService.checkCourtRecords('PROP123', ['John Doe']);

      const courts = [...new Set(records.map(record => record.court))];
      expect(courts).toContain('High Court of Kenya');
      expect(courts).toContain('Magistrate Court');
    });
  });

  describe('Government Designation Services', () => {
    it('should check for riparian reserves', async () => {
      const coordinates = { lat: -1.2921, lng: 36.8219 };
      const propertyBounds = [
        { lat: -1.2920, lng: 36.8218 },
        { lat: -1.2922, lng: 36.8220 }
      ];

      const designations = await governmentService.verifyGovernmentDesignations(
        coordinates,
        propertyBounds
      );

      const riparianDesignations = designations.filter(d => d.type === 'riparian');
      expect(riparianDesignations).toBeInstanceOf(Array);
    });

    it('should identify road reserve conflicts', async () => {
      const coordinates = { lat: -1.2921, lng: 36.8219 };
      const propertyBounds = [
        { lat: -1.2920, lng: 36.8218 },
        { lat: -1.2922, lng: 36.8220 }
      ];

      const designations = await governmentService.verifyGovernmentDesignations(
        coordinates,
        propertyBounds
      );

      const roadReserves = designations.filter(d => d.type === 'road_reserve');
      roadReserves.forEach(reserve => {
        expect(reserve).toMatchObject({
          type: 'road_reserve',
          authority: expect.any(String),
          designation: expect.any(String),
          restrictions: expect.any(Array),
          riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/)
        });
      });
    });

    it('should check environmental designations', async () => {
      const coordinates = { lat: -1.2921, lng: 36.8219 };
      const propertyBounds = [];

      const designations = await governmentService.verifyGovernmentDesignations(
        coordinates,
        propertyBounds
      );

      const environmentalDesignations = designations.filter(d => d.type === 'environmental');
      environmentalDesignations.forEach(designation => {
        expect(designation.authority).toMatch(/NEMA|KFS|KWS/);
      });
    });
  });

  describe('Infrastructure Planning Integration', () => {
    it('should check for planned infrastructure projects', async () => {
      const location = 'Nairobi, Kenya';
      const radius = 1000; // 1km radius

      const plans = await governmentService.checkInfrastructurePlans(location, radius);

      expect(plans).toBeInstanceOf(Array);
      plans.forEach(plan => {
        expect(plan).toMatchObject({
          projectName: expect.any(String),
          authority: expect.any(String),
          projectType: expect.stringMatching(/^(road|railway|utility|development)$/),
          plannedStartDate: expect.any(Date),
          estimatedCompletion: expect.any(Date),
          impactRadius: expect.any(Number),
          riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/)
        });
      });
    });

    it('should calculate distance-based risk assessment', async () => {
      const location = 'Nairobi, Kenya';
      const radius = 500;

      const plans = await governmentService.checkInfrastructurePlans(location, radius);

      const highRiskPlans = plans.filter(plan => plan.riskLevel === 'high');
      highRiskPlans.forEach(plan => {
        expect(plan.impactRadius).toBeLessThanOrEqual(radius);
      });
    });
  });

  describe('Service Resilience and Error Handling', () => {
    it('should handle partial service failures gracefully', async () => {
      mockServices.simulatePartialFailure(['court-records']);

      const titleNumber = 'NAIROBI/BLOCK1/123';
      const result = await governmentService.searchLandRegistry(titleNumber, 'Nairobi');

      expect(result).toBeDefined();
      expect(result.verificationStatus).toBe('verified');
    });

    it('should provide fallback data when primary services fail', async () => {
      mockServices.simulateServiceDown('lands-registry');
      mockServices.enableFallbackMode();

      const result = await governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi');

      expect(result.verificationStatus).toBe('fallback');
      expect(result).toHaveProperty('dataSource', 'cached');
    });

    it('should log service interactions for audit purposes', async () => {
      const logSpy = vi.spyOn(console, 'log');

      await governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Government service call'),
        expect.objectContaining({
          service: 'lands-registry',
          titleNumber: 'NAIROBI/BLOCK1/123'
        })
      );
    });

    it('should respect rate limiting', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        governmentService.searchLandRegistry(`NAIROBI/BLOCK1/${i}`, 'Nairobi')
      );

      const results = await Promise.allSettled(promises);
      const rateLimitedResults = results.filter(
        result => result.status === 'rejected' && 
        result.reason.message.includes('rate limit')
      );

      expect(rateLimitedResults.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation and Quality', () => {
    it('should validate coordinate data from government services', async () => {
      const result = await governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi');

      expect(result.surveyDetails.coordinates.lat).toBeGreaterThan(-5);
      expect(result.surveyDetails.coordinates.lat).toBeLessThan(5);
      expect(result.surveyDetails.coordinates.lng).toBeGreaterThan(33);
      expect(result.surveyDetails.coordinates.lng).toBeLessThan(42);
    });

    it('should validate date consistency in ownership history', async () => {
      const result = await governmentService.searchLandRegistry('NAIROBI/BLOCK1/123', 'Nairobi');

      if (result.ownershipHistory.length > 1) {
        for (let i = 1; i < result.ownershipHistory.length; i++) {
          const current = result.ownershipHistory[i];
          const previous = result.ownershipHistory[i - 1];
          expect(current.transferDate.getTime()).toBeGreaterThan(previous.transferDate.getTime());
        }
      }
    });

    it('should detect and flag suspicious ownership patterns', async () => {
      mockServices.simulateSuspiciousOwnership();

      const result = await governmentService.searchLandRegistry('SUSPICIOUS/TITLE/001', 'Nairobi');

      expect(result).toHaveProperty('suspiciousPatterns');
      expect(result.suspiciousPatterns).toContain('rapid_transfers');
    });
  });
});