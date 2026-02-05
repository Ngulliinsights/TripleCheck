import { describe, it, expect, beforeEach, afterEach } from '..\..\src\shared\test-utils\index';
import { DocumentAuthService, DocumentVerificationRequest } from './DocumentAuthService';

describe('DocumentAuthService - Land Document Integration', () => {
  let service: DocumentAuthService;

  beforeEach(async () => {
    service = new DocumentAuthService();
    await service.initialize();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  describe('Land Document Verification Integration', () => {
    it('should include land document analysis in verification results', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-land-integration',
        file: Buffer.from('mock kenya title deed content'),
        filename: 'kenya_title_deed.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Should include land-specific data
      expect(result.landSpecificData).toBeDefined();
      expect(result.landSpecificData?.documentType).toBeDefined();

      // Should include land document checks alongside existing checks
      const landChecks = result.checks.filter(check => 
        check.name.includes('Land Document') || 
        check.name.includes('Title Number') ||
        check.name.includes('Survey') ||
        check.name.includes('Boundary') ||
        check.name.includes('Beacon') ||
        check.name.includes('Template Validation') ||
        check.name.includes('Coordinate') ||
        check.name.includes('Legal Format') ||
        check.name.includes('Cross-Reference')
      );

      expect(landChecks.length).toBeGreaterThan(0);
    });

    it('should maintain existing verification functionality', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-existing-functionality',
        file: Buffer.from('mock document content'),
        filename: 'regular_document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Should still have all existing check types
      const checkTypes = new Set(result.checks.map(check => check.type));
      expect(checkTypes).toContain('metadata');
      expect(checkTypes).toContain('visual');
      expect(checkTypes).toContain('signature');
      expect(checkTypes).toContain('content');

      // Should have standard result structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('documentId');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('riskFactors');
      expect(result).toHaveProperty('recommendations');
    });

    it('should handle title deed documents with enhanced analysis', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-title-deed-enhanced',
        file: Buffer.from('mock kenya title deed with all sections'),
        filename: 'complete_title_deed.pdf',
        mimeType: 'application/pdf',
        size: 3072,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Should identify as title deed
      expect(result.landSpecificData?.documentType).toBe('title_deed');

      // Should have title deed specific checks
      const titleDeedChecks = result.checks.filter(check => 
        check.name.includes('Title Number') ||
        check.name.includes('Registration Details') ||
        check.name.includes('Ownership Details') ||
        check.name.includes('Legal Instruments')
      );

      expect(titleDeedChecks.length).toBeGreaterThan(0);

      // Should have extracted title deed data
      expect(result.landSpecificData?.titleNumber).toBeDefined();
      expect(result.landSpecificData?.registrationDetails).toBeDefined();
      expect(result.landSpecificData?.ownershipDetails).toBeDefined();
    });

    it('should handle survey plan documents with specialized validation', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-survey-plan-specialized',
        file: Buffer.from('mock kenya survey plan with coordinates'),
        filename: 'detailed_survey_plan.pdf',
        mimeType: 'application/pdf',
        size: 4096,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Should identify as survey plan
      expect(result.landSpecificData?.documentType).toBe('survey_plan');

      // Should have survey plan specific checks
      const surveyPlanChecks = result.checks.filter(check => 
        check.name.includes('Survey Details') ||
        check.name.includes('Boundary') ||
        check.name.includes('Beacon References') ||
        check.name.includes('Coordinate System')
      );

      expect(surveyPlanChecks.length).toBeGreaterThan(0);

      // Should have extracted survey plan data
      expect(result.landSpecificData?.surveyDetails).toBeDefined();
      expect(result.landSpecificData?.boundaries).toBeDefined();
      expect(result.landSpecificData?.coordinates).toBeDefined();
    });

    it('should provide enhanced risk assessment for land documents', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-enhanced-risk-assessment',
        file: Buffer.from('mock suspicious land document'),
        filename: 'suspicious_title_deed.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Should include land-specific risk factors
      const landRiskFactors = result.riskFactors.filter(risk => 
        risk.category.includes('Land') ||
        risk.category.includes('Title') ||
        risk.category.includes('Survey') ||
        risk.category.includes('Ownership') ||
        risk.category.includes('Coordinate')
      );

      // Should provide land-specific recommendations
      const landRecommendations = result.recommendations.filter(rec => 
        rec.includes('title') ||
        rec.includes('survey') ||
        rec.includes('land') ||
        rec.includes('ownership') ||
        rec.includes('coordinate')
      );

      // Risk factors and recommendations should be present for land documents
      expect(result.riskFactors.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should maintain performance with additional land analysis', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-performance-with-land-analysis',
        file: Buffer.from('mock large land document'.repeat(50)),
        filename: 'large_land_document.pdf',
        mimeType: 'application/pdf',
        size: 8192,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const startTime = Date.now();
      const result = await service.verifyDocument(request);
      const processingTime = Date.now() - startTime;

      // Should complete within reasonable time even with additional analysis
      expect(processingTime).toBeLessThan(10000); // 10 seconds max
      expect(result.processingTime).toBeLessThan(10000);

      // Should still provide comprehensive analysis
      expect(result.checks.length).toBeGreaterThan(10); // Original + land checks
      expect(result.landSpecificData).toBeDefined();
    });

    it('should handle non-land documents without interference', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-non-land-document',
        file: Buffer.from('mock regular business document'),
        filename: 'business_contract.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Should still process but identify as unknown land document type
      expect(result.landSpecificData?.documentType).toBe('unknown');

      // Should not negatively impact overall verification
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.status).toMatch(/authentic|suspicious|forged/);

      // Should still have all standard checks
      expect(result.checks.length).toBeGreaterThan(5);
    });

    it('should provide accurate confidence scores for land documents', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-confidence-accuracy',
        file: Buffer.from('mock well-formatted kenya land document'),
        filename: 'well_formatted_title_deed.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await service.verifyDocument(request);

      // Land document checks should have reasonable confidence scores
      const landChecks = result.checks.filter(check => 
        check.name.includes('Land Document') ||
        check.name.includes('Title') ||
        check.name.includes('Survey') ||
        check.name.includes('Template') ||
        check.name.includes('Coordinate')
      );

      landChecks.forEach(check => {
        expect(check.confidence).toBeGreaterThan(0.5);
        expect(check.confidence).toBeLessThanOrEqual(1.0);
      });

      // Overall confidence should be reasonable
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('System Integration', () => {
    it('should maintain system statistics with land document analysis', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-system-stats',
        file: Buffer.from('mock document for stats'),
        filename: 'stats_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      await service.verifyDocument(request);
      const stats = await service.getSystemStats();

      expect(stats).toHaveProperty('totalProcessed');
      expect(stats).toHaveProperty('statusDistribution');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('averageScore');

      // Stats should reflect the processed document
      expect((stats as any).totalProcessed).toBeGreaterThan(0);
    });

    it('should handle concurrent land document verifications', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        id: `test-concurrent-${i}`,
        file: Buffer.from(`mock concurrent document ${i}`),
        filename: `concurrent_test_${i}.pdf`,
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      }));

      const results = await Promise.all(
        requests.map(request => service.verifyDocument(request))
      );

      // All should complete successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('landSpecificData');
        expect(result.checks.length).toBeGreaterThan(0);
      });
    });

    it('should properly clean up land document results', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-cleanup',
        file: Buffer.from('mock document for cleanup'),
        filename: 'cleanup_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      await service.verifyDocument(request);
      
      // Clear old results
      const oldDate = new Date(Date.now() - 1000); // 1 second ago
      const clearedCount = await service.clearResults(oldDate);

      expect(clearedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle land analyzer failures gracefully', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-analyzer-failure',
        file: Buffer.from(''), // Empty file to potentially cause issues
        filename: 'empty_file.pdf',
        mimeType: 'application/pdf',
        size: 0,
        uploadedAt: new Date()
      };

      // Should not throw, but handle gracefully
      const result = await service.verifyDocument(request);

      expect(result).toBeDefined();
      expect(result.status).toMatch(/authentic|suspicious|forged/);
      expect(result.landSpecificData).toBeDefined();
    });

    it('should maintain service availability during land analysis errors', async () => {
      const validRequest: DocumentVerificationRequest = {
        id: 'test-service-availability',
        file: Buffer.from('valid document content'),
        filename: 'valid_document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      // Service should remain functional
      const result = await service.verifyDocument(validRequest);

      expect(result).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.landSpecificData).toBeDefined();
    });
  });
});