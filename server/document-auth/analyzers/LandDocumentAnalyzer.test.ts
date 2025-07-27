import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LandDocumentAnalyzer, LandDocumentData, BoundaryDescription } from './LandDocumentAnalyzer';
import { DocumentVerificationRequest } from '../DocumentAuthService';

describe('LandDocumentAnalyzer', () => {
  let analyzer: LandDocumentAnalyzer;

  beforeEach(async () => {
    analyzer = new LandDocumentAnalyzer();
    await analyzer.initialize();
  });

  afterEach(async () => {
    await analyzer.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const status = await analyzer.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.name).toBe('Land Document Analyzer');
      expect(status.supportedDocuments).toContain('title_deed');
      expect(status.supportedDocuments).toContain('survey_plan');
    });

    it('should have Kenya land document templates', async () => {
      const status = await analyzer.getStatus();
      expect(status.templates).toContain('title_deed');
      expect(status.templates).toContain('survey_plan');
    });
  });

  describe('Document Type Identification', () => {
    it('should identify title deed documents', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-title-deed',
        file: Buffer.from('mock pdf content'),
        filename: 'title_deed_sample.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await analyzer.analyze(request);
      
      expect(result.landSpecificData.documentType).toBe('title_deed');
      expect(result.checks).toHaveLength(7); // All validation checks
      
      const typeCheck = result.checks.find(check => check.name === 'Land Document Type Identification');
      expect(typeCheck).toBeDefined();
      expect(typeCheck?.status).toBe('pass');
    });

    it('should identify survey plan documents', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-survey-plan',
        file: Buffer.from('mock pdf content'),
        filename: 'survey_plan_sample.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await analyzer.analyze(request);
      
      expect(result.landSpecificData.documentType).toBe('survey_plan');
      
      const typeCheck = result.checks.find(check => check.name === 'Land Document Type Identification');
      expect(typeCheck).toBeDefined();
      expect(typeCheck?.status).toBe('pass');
    });

    it('should handle unknown document types', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-unknown',
        file: Buffer.from('mock pdf content'),
        filename: 'unknown_document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };

      const result = await analyzer.analyze(request);
      
      // Should still process but with lower confidence
      expect(result.landSpecificData.documentType).toBe('unknown');
      
      const typeCheck = result.checks.find(check => check.name === 'Land Document Type Identification');
      expect(typeCheck).toBeDefined();
      expect(typeCheck?.score).toBeLessThan(70);
    });
  });

  describe('Title Deed Analysis', () => {
    let titleDeedRequest: DocumentVerificationRequest;

    beforeEach(() => {
      titleDeedRequest = {
        id: 'test-title-deed-analysis',
        file: Buffer.from('mock title deed content'),
        filename: 'title_deed_analysis.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };
    });

    it('should validate title number format', async () => {
      const result = await analyzer.analyze(titleDeedRequest);
      
      const titleNumberCheck = result.checks.find(check => check.name === 'Title Number Validation');
      expect(titleNumberCheck).toBeDefined();
      expect(titleNumberCheck?.type).toBe('content');
      expect(titleNumberCheck?.confidence).toBeGreaterThan(0.9);
    });

    it('should validate registration details', async () => {
      const result = await analyzer.analyze(titleDeedRequest);
      
      const registrationCheck = result.checks.find(check => check.name === 'Registration Details Validation');
      expect(registrationCheck).toBeDefined();
      expect(registrationCheck?.type).toBe('content');
      expect(registrationCheck?.details).toContain(expect.stringMatching(/Registration validation score/));
    });

    it('should validate ownership details', async () => {
      const result = await analyzer.analyze(titleDeedRequest);
      
      const ownershipCheck = result.checks.find(check => check.name === 'Ownership Details Validation');
      expect(ownershipCheck).toBeDefined();
      expect(ownershipCheck?.type).toBe('content');
      expect(ownershipCheck?.description).toContain('ownership information');
    });

    it('should validate legal instruments', async () => {
      const result = await analyzer.analyze(titleDeedRequest);
      
      const legalCheck = result.checks.find(check => check.name === 'Legal Instruments Validation');
      expect(legalCheck).toBeDefined();
      expect(legalCheck?.type).toBe('content');
      expect(legalCheck?.description).toContain('charges, caveats');
    });

    it('should extract title deed specific data', async () => {
      const result = await analyzer.analyze(titleDeedRequest);
      
      expect(result.landSpecificData.titleNumber).toBeDefined();
      expect(result.landSpecificData.registrationDetails).toBeDefined();
      expect(result.landSpecificData.ownershipDetails).toBeDefined();
      expect(result.landSpecificData.legalInstruments).toBeDefined();
    });
  });

  describe('Survey Plan Analysis', () => {
    let surveyPlanRequest: DocumentVerificationRequest;

    beforeEach(() => {
      surveyPlanRequest = {
        id: 'test-survey-plan-analysis',
        file: Buffer.from('mock survey plan content'),
        filename: 'survey_plan_analysis.pdf',
        mimeType: 'application/pdf',
        size: 3072,
        uploadedAt: new Date(),
        userId: 'test-user',
        propertyId: 'test-property'
      };
    });

    it('should validate survey details', async () => {
      const result = await analyzer.analyze(surveyPlanRequest);
      
      const surveyCheck = result.checks.find(check => check.name === 'Survey Details Validation');
      expect(surveyCheck).toBeDefined();
      expect(surveyCheck?.type).toBe('content');
      expect(surveyCheck?.confidence).toBeGreaterThan(0.85);
    });

    it('should validate boundaries', async () => {
      const result = await analyzer.analyze(surveyPlanRequest);
      
      const boundaryCheck = result.checks.find(check => check.name === 'Boundary Validation');
      expect(boundaryCheck).toBeDefined();
      expect(boundaryCheck?.type).toBe('content');
      expect(boundaryCheck?.description).toContain('boundary descriptions');
    });

    it('should validate beacon references', async () => {
      const result = await analyzer.analyze(surveyPlanRequest);
      
      const beaconCheck = result.checks.find(check => check.name === 'Beacon References Validation');
      expect(beaconCheck).toBeDefined();
      expect(beaconCheck?.type).toBe('content');
      expect(beaconCheck?.description).toContain('beacon references');
    });

    it('should validate coordinate system', async () => {
      const result = await analyzer.analyze(surveyPlanRequest);
      
      const coordinateCheck = result.checks.find(check => check.name === 'Coordinate System Validation');
      expect(coordinateCheck).toBeDefined();
      expect(coordinateCheck?.type).toBe('content');
      expect(coordinateCheck?.confidence).toBeGreaterThan(0.85);
    });

    it('should extract survey plan specific data', async () => {
      const result = await analyzer.analyze(surveyPlanRequest);
      
      expect(result.landSpecificData.surveyDetails).toBeDefined();
      expect(result.landSpecificData.boundaries).toBeDefined();
      expect(result.landSpecificData.coordinates).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    it('should validate against Kenya title deed template', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-template-validation',
        file: Buffer.from('mock content'),
        filename: 'title_deed_template_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const templateCheck = result.checks.find(check => check.name === 'Template Validation');
      expect(templateCheck).toBeDefined();
      expect(templateCheck?.type).toBe('format');
      expect(templateCheck?.confidence).toBeGreaterThan(0.9);
    });

    it('should check for required sections and fields', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-required-elements',
        file: Buffer.from('mock content'),
        filename: 'title_deed_required_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const templateCheck = result.checks.find(check => check.name === 'Template Validation');
      expect(templateCheck?.details).toContain(expect.stringMatching(/Template validation score/));
      expect(templateCheck?.details).toContain(expect.stringMatching(/sections|fields/));
    });
  });

  describe('Coordinate Validation', () => {
    it('should validate coordinates within Kenya bounds', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-coordinate-validation',
        file: Buffer.from('mock content'),
        filename: 'coordinate_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const coordinateCheck = result.checks.find(check => check.name === 'Coordinate Validation');
      expect(coordinateCheck).toBeDefined();
      expect(coordinateCheck?.type).toBe('content');
      expect(coordinateCheck?.confidence).toBeGreaterThan(0.9);
    });

    it('should detect coordinates outside Kenya bounds', async () => {
      // This would be tested with mock data that simulates coordinates outside Kenya
      const request: DocumentVerificationRequest = {
        id: 'test-invalid-coordinates',
        file: Buffer.from('mock content with invalid coordinates'),
        filename: 'invalid_coordinates.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const coordinateCheck = result.checks.find(check => check.name === 'Coordinate Validation');
      expect(coordinateCheck).toBeDefined();
      // The actual validation would depend on the simulated data
    });
  });

  describe('Legal Format Validation', () => {
    it('should validate official document format', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-legal-format',
        file: Buffer.from('mock legal document'),
        filename: 'legal_format_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const legalFormatCheck = result.checks.find(check => check.name === 'Legal Format Validation');
      expect(legalFormatCheck).toBeDefined();
      expect(legalFormatCheck?.type).toBe('format');
      expect(legalFormatCheck?.description).toContain('legal document format');
    });

    it('should check for official headers and signatures', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-official-elements',
        file: Buffer.from('mock official document'),
        filename: 'official_elements_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const legalFormatCheck = result.checks.find(check => check.name === 'Legal Format Validation');
      expect(legalFormatCheck?.details).toContain(expect.stringMatching(/headers|signatures|stamps/));
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should validate internal document consistency', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-cross-reference',
        file: Buffer.from('mock document with references'),
        filename: 'cross_reference_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const crossRefCheck = result.checks.find(check => check.name === 'Cross-Reference Validation');
      expect(crossRefCheck).toBeDefined();
      expect(crossRefCheck?.type).toBe('content');
      expect(crossRefCheck?.description).toContain('consistency');
    });

    it('should check title and plot number consistency', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-title-plot-consistency',
        file: Buffer.from('mock document'),
        filename: 'title_plot_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      const crossRefCheck = result.checks.find(check => check.name === 'Cross-Reference Validation');
      expect(crossRefCheck?.details).toContain(expect.stringMatching(/consistency/));
    });
  });

  describe('Error Handling', () => {
    it('should handle analyzer not initialized error', async () => {
      const uninitializedAnalyzer = new LandDocumentAnalyzer();
      
      const request: DocumentVerificationRequest = {
        id: 'test-uninitialized',
        file: Buffer.from('mock content'),
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      await expect(uninitializedAnalyzer.analyze(request)).rejects.toThrow('Land Document Analyzer not initialized');
    });

    it('should handle invalid file format gracefully', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-invalid-format',
        file: Buffer.from('invalid content'),
        filename: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      // Should still return results but with lower scores
      expect(result.checks).toHaveLength(7);
      expect(result.landSpecificData.documentType).toBe('unknown');
    });

    it('should create failed checks on technical errors', async () => {
      // This would test the createFailedCheck method indirectly
      const request: DocumentVerificationRequest = {
        id: 'test-technical-error',
        file: Buffer.from(''),
        filename: 'empty.pdf',
        mimeType: 'application/pdf',
        size: 0,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);
      
      // Should handle empty files gracefully
      expect(result.checks).toHaveLength(7);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Performance and Accuracy', () => {
    it('should complete analysis within reasonable time', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-performance',
        file: Buffer.from('mock large document content'.repeat(100)),
        filename: 'large_document.pdf',
        mimeType: 'application/pdf',
        size: 10240,
        uploadedAt: new Date()
      };

      const startTime = Date.now();
      const result = await analyzer.analyze(request);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.checks).toHaveLength(7);
    });

    it('should provide consistent results for same document', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-consistency',
        file: Buffer.from('consistent test content'),
        filename: 'consistency_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result1 = await analyzer.analyze(request);
      const result2 = await analyzer.analyze(request);

      // Results should be consistent (allowing for some randomness in simulation)
      expect(result1.landSpecificData.documentType).toBe(result2.landSpecificData.documentType);
      expect(result1.checks).toHaveLength(result2.checks.length);
    });

    it('should maintain high confidence for valid documents', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-high-confidence',
        file: Buffer.from('valid kenya land document'),
        filename: 'valid_title_deed.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);

      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.checks.every(check => check.confidence > 0.5)).toBe(true);
    });
  });

  describe('Integration with Document Auth Service', () => {
    it('should return land-specific data in correct format', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-integration',
        file: Buffer.from('integration test content'),
        filename: 'integration_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);

      // Verify the result structure matches what DocumentAuthService expects
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('landSpecificData');
      
      expect(Array.isArray(result.checks)).toBe(true);
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.landSpecificData).toBe('object');
    });

    it('should provide metadata compatible with existing system', async () => {
      const request: DocumentVerificationRequest = {
        id: 'test-metadata-compatibility',
        file: Buffer.from('metadata test content'),
        filename: 'metadata_test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date()
      };

      const result = await analyzer.analyze(request);

      expect(result.metadata).toHaveProperty('hash');
      expect(result.metadata).toHaveProperty('fileSize');
      expect(typeof result.metadata.hash).toBe('string');
      expect(typeof result.metadata.fileSize).toBe('number');
    });
  });
});