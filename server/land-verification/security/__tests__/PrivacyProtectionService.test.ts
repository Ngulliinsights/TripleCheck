import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyProtectionService } from '../PrivacyProtectionService';

// Mock encryption service
vi.mock('../EncryptionService', () => ({
  encryptionService: {
    encryptCommunityFeedback: vi.fn((data) => ({
      ...data,
      encrypted: true
    }))
  }
}));

describe('PrivacyProtectionService', () => {
  let privacyService: PrivacyProtectionService;

  beforeEach(() => {
    privacyService = new PrivacyProtectionService();
    vi.clearAllMocks();
  });

  describe('Community Feedback Protection', () => {
    const sampleFeedback = {
      id: 'feedback-123',
      sessionId: 'session-456',
      sourceDetails: {
        name: 'John Doe',
        position: 'Village Chief',
        contactInfo: 'john@example.com',
        yearsInArea: 10
      },
      feedback: {
        ownershipHistory: 'Property was owned by the Smith family for 20 years',
        knownDisputes: ['Boundary dispute with neighbor in 2020'],
        concerns: ['Potential land grabbing by local officials']
      },
      recordedAt: new Date()
    };

    it('should apply minimal protection level', async () => {
      const protectedData = await privacyService.protectCommunityFeedback(sampleFeedback, 'minimal');

      expect(protectedData.id).toBe('feedback-123');
      expect(protectedData.feedback).toBeDefined();
      expect(protectedData.sourceDetails?.name).toBeUndefined();
      expect(protectedData.sourceDetails?.contactInfo).toBeUndefined();
      expect(protectedData.sourceDetails?.position).toBeUndefined();
      expect(protectedData.encrypted).toBe(true);
    });

    it('should apply standard protection level', async () => {
      const protectedData = await privacyService.protectCommunityFeedback(sampleFeedback, 'standard');

      expect(protectedData.id).toBe('feedback-123');
      expect(protectedData.sourceDetails?.yearsInArea).toBe(10);
      expect(protectedData.sourceDetails?.name).toMatch(/^Source_[a-f0-9]{8}$/);
      expect(protectedData.sourceDetails?.contactInfo).toBeUndefined();
      expect(protectedData.encrypted).toBe(true);
    });

    it('should apply maximum protection level', async () => {
      const protectedData = await privacyService.protectCommunityFeedback(sampleFeedback, 'maximum');

      expect(protectedData.id).toBe('feedback-123');
      expect(protectedData.sourceDetails).toBeDefined();
      expect(protectedData.sourceDetails?.name).toMatch(/^Source_[a-f0-9]{8}$/);
      expect(protectedData.sourceDetails?.position).toBe('Community Leader');
      expect(protectedData.encrypted).toBe(true);
    });

    it('should anonymize old feedback automatically', async () => {
      const oldFeedback = {
        ...sampleFeedback,
        recordedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
      };

      const protectedData = await privacyService.protectCommunityFeedback(oldFeedback, 'standard');

      expect(protectedData.sourceDetails?.name).toBeUndefined();
      expect(protectedData.anonymizedAt).toBeInstanceOf(Date);
    });
  });

  describe('Data Minimization', () => {
    const testData = {
      id: 'test-123',
      sessionId: 'session-456',
      sourceDetails: {
        name: 'John Doe',
        position: 'Chief',
        contactInfo: 'john@example.com',
        yearsInArea: 5
      },
      feedback: {
        ownershipHistory: 'Some history'
      },
      reliability: 0.8,
      recordedAt: new Date()
    };

    it('should minimize data at minimal level', () => {
      const result = privacyService.minimizeCommunityData(testData, 'minimal');

      expect(result.minimizedData.id).toBe('test-123');
      expect(result.minimizedData.feedback).toBeDefined();
      expect(result.minimizedData.sourceDetails?.name).toBeUndefined();
      expect(result.minimizedData.sourceDetails?.contactInfo).toBeUndefined();
      expect(result.removedFields).toContain('sourceDetails.name');
      expect(result.removedFields).toContain('sourceDetails.contactInfo');
    });

    it('should minimize data at standard level', () => {
      const result = privacyService.minimizeCommunityData(testData, 'standard');

      expect(result.minimizedData.sourceDetails?.yearsInArea).toBe(5);
      expect(result.minimizedData.sourceDetails?.name).toBeUndefined();
      expect(result.minimizedData.sourceDetails?.contactInfo).toBeUndefined();
      expect(result.removedFields).toContain('sourceDetails.name');
      expect(result.removedFields).toContain('sourceDetails.contactInfo');
    });

    it('should minimize data at maximum level', () => {
      const result = privacyService.minimizeCommunityData(testData, 'maximum');

      expect(result.minimizedData.sourceDetails).toBeDefined();
      expect(result.removedFields).toHaveLength(0);
      expect(result.retainedFields).toContain('sourceDetails');
    });
  });

  describe('Pseudonymization', () => {
    const testData = {
      sourceDetails: {
        name: 'John Doe',
        position: 'Village Chairman'
      },
      feedback: {
        ownershipHistory: 'Mr. Smith owned this property',
        knownDisputes: ['Dispute with Mrs. Johnson'],
        concerns: ['Issues with John Doe']
      }
    };

    it('should pseudonymize source names consistently', () => {
      const result1 = privacyService.pseudonymizeCommunityData(testData);
      const result2 = privacyService.pseudonymizeCommunityData(testData);

      expect(result1.pseudonymizedData.sourceDetails.name).toBe(result2.pseudonymizedData.sourceDetails.name);
      expect(result1.pseudonymizedData.sourceDetails.name).toMatch(/^Source_[a-f0-9]{8}$/);
    });

    it('should generalize positions', () => {
      const result = privacyService.pseudonymizeCommunityData(testData);

      expect(result.pseudonymizedData.sourceDetails.position).toBe('Community Leader');
      expect(result.fieldsPseudonymized).toContain('sourceDetails.position');
    });

    it('should pseudonymize names in feedback content', () => {
      const result = privacyService.pseudonymizeCommunityData(testData);

      expect(result.pseudonymizedData.feedback.ownershipHistory).not.toContain('Mr. Smith');
      expect(result.pseudonymizedData.feedback.knownDisputes[0]).not.toContain('Mrs. Johnson');
      expect(result.pseudonymMap.size).toBeGreaterThan(0);
    });

    it('should track pseudonymized fields', () => {
      const result = privacyService.pseudonymizeCommunityData(testData);

      expect(result.fieldsPseudonymized).toContain('sourceDetails.name');
      expect(result.fieldsPseudonymized).toContain('sourceDetails.position');
    });
  });

  describe('Anonymization', () => {
    const testData = {
      sourceDetails: {
        name: 'John Doe',
        position: 'Village Chief',
        contactInfo: 'john@example.com'
      },
      feedback: {
        ownershipHistory: 'John Smith owned this property. Contact: 0712345678',
        knownDisputes: ['Dispute with jane@example.com'],
        concerns: ['ID: 12345678 has issues']
      }
    };

    it('should anonymize source details', () => {
      const result = privacyService.anonymizeCommunityData(testData);

      expect(result.anonymizedData.sourceDetails.name).toBeUndefined();
      expect(result.anonymizedData.sourceDetails.contactInfo).toBeUndefined();
      expect(result.anonymizedData.sourceDetails.position).toBe('Community Leadership');
      expect(result.anonymizedData.anonymizedAt).toBeInstanceOf(Date);
    });

    it('should anonymize feedback content', () => {
      const result = privacyService.anonymizeCommunityData(testData);

      expect(result.anonymizedData.feedback.ownershipHistory).toContain('[NAME]');
      expect(result.anonymizedData.feedback.ownershipHistory).toContain('[PHONE]');
      expect(result.anonymizedData.feedback.knownDisputes[0]).toContain('[EMAIL]');
      expect(result.anonymizedData.feedback.concerns[0]).toContain('[ID]');
    });

    it('should track anonymized fields', () => {
      const result = privacyService.anonymizeCommunityData(testData);

      expect(result.fieldsAnonymized).toContain('sourceDetails.name');
      expect(result.fieldsAnonymized).toContain('sourceDetails.contactInfo');
      expect(result.anonymizationMap.get('sourceDetails.name')).toBe('[ANONYMIZED]');
    });
  });

  describe('Age-based Anonymization', () => {
    it('should identify old data for anonymization', () => {
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      expect(privacyService.shouldAnonymize(oldDate)).toBe(true);
      expect(privacyService.shouldAnonymize(recentDate)).toBe(false);
    });

    it('should handle missing dates', () => {
      expect(privacyService.shouldAnonymize(undefined as any)).toBe(false);
    });
  });

  describe('Pseudonym Generation', () => {
    it('should generate consistent pseudonyms', () => {
      const name = 'John Doe';
      const pseudonym1 = privacyService.generatePseudonym(name);
      const pseudonym2 = privacyService.generatePseudonym(name);

      expect(pseudonym1).toBe(pseudonym2);
      expect(pseudonym1).toMatch(/^Source_[a-f0-9]{8}$/);
    });

    it('should generate different pseudonyms for different names', () => {
      const pseudonym1 = privacyService.generatePseudonym('John Doe');
      const pseudonym2 = privacyService.generatePseudonym('Jane Smith');

      expect(pseudonym1).not.toBe(pseudonym2);
    });

    it('should generalize positions correctly', () => {
      expect(privacyService.generatePositionPseudonym('Village Chief')).toBe('Community Leader');
      expect(privacyService.generatePositionPseudonym('Local Administrator')).toBe('Local Official');
      expect(privacyService.generatePositionPseudonym('Neighbor')).toBe('Community Member');
      expect(privacyService.generatePositionPseudonym('Shop Owner')).toBe('Local Business');
      expect(privacyService.generatePositionPseudonym('Unknown Role')).toBe('Community Member');
    });
  });

  describe('Text Content Processing', () => {
    it('should pseudonymize names in text', () => {
      const text = 'Mr. John Doe and Mrs. Jane Smith had a dispute';
      const pseudonyms = new Map<string, string>();
      
      const result = (privacyService as any).pseudonymizeTextContent(text, pseudonyms);
      
      expect(result).not.toContain('John Doe');
      expect(result).not.toContain('Jane Smith');
      expect(pseudonyms.size).toBeGreaterThan(0);
    });

    it('should anonymize identifiers in text', () => {
      const text = 'Contact John Smith at 0712345678 or john@example.com. ID: 12345678, P.O. Box 123';
      
      const result = (privacyService as any).anonymizeTextContent(text);
      
      expect(result).toContain('[NAME]');
      expect(result).toContain('[PHONE]');
      expect(result).toContain('[EMAIL]');
      expect(result).toContain('[ID]');
      expect(result).toContain('[ADDRESS]');
    });
  });

  describe('Configuration and Management', () => {
    it('should provide protection summary', () => {
      const summary = privacyService.getProtectionSummary();

      expect(summary.config).toBeDefined();
      expect(summary.cacheSize).toBeGreaterThanOrEqual(0);
      expect(summary.protectionMethods).toContain('Data Minimization');
      expect(summary.protectionMethods).toContain('Pseudonymization');
      expect(summary.protectionMethods).toContain('Anonymization');
      expect(summary.protectionMethods).toContain('Encryption');
    });

    it('should clear pseudonym cache', () => {
      // Generate some pseudonyms to populate cache
      privacyService.generatePseudonym('Test Name 1');
      privacyService.generatePseudonym('Test Name 2');

      let summary = privacyService.getProtectionSummary();
      expect(summary.cacheSize).toBeGreaterThan(0);

      privacyService.clearCache();

      summary = privacyService.getProtectionSummary();
      expect(summary.cacheSize).toBe(0);
    });

    it('should respect configuration settings', () => {
      const customConfig = {
        enableDataMinimization: false,
        enableAnonymization: false,
        enablePseudonymization: false,
        anonymizationThreshold: 60
      };

      const customService = new PrivacyProtectionService(customConfig);
      const summary = customService.getProtectionSummary();

      expect(summary.config.enableDataMinimization).toBe(false);
      expect(summary.config.enableAnonymization).toBe(false);
      expect(summary.config.enablePseudonymization).toBe(false);
      expect(summary.config.anonymizationThreshold).toBe(60);
      expect(summary.protectionMethods).toEqual(['Encryption']);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed data gracefully', async () => {
      const malformedData = null;

      const result = await privacyService.protectCommunityFeedback(malformedData, 'standard');
      expect(result).toBeDefined();
    });

    it('should handle missing nested properties', () => {
      const incompleteData = {
        id: 'test-123',
        // Missing sourceDetails and feedback
      };

      const result = privacyService.minimizeCommunityData(incompleteData, 'standard');
      expect(result.minimizedData.id).toBe('test-123');
      expect(result.removedFields).toHaveLength(0);
    });

    it('should handle empty feedback content', () => {
      const emptyFeedback = {
        sourceDetails: {},
        feedback: {}
      };

      const result = privacyService.pseudonymizeCommunityData(emptyFeedback);
      expect(result.pseudonymizedData).toBeDefined();
      expect(result.fieldsPseudonymized).toHaveLength(0);
    });
  });

  describe('Integration with Encryption Service', () => {
    it('should call encryption service for community feedback', async () => {
      const { encryptionService } = await import('../EncryptionService');
      
      const feedback = {
        id: 'test-123',
        sourceDetails: { name: 'John Doe' }
      };

      await privacyService.protectCommunityFeedback(feedback, 'standard');

      expect(encryptionService.encryptCommunityFeedback).toHaveBeenCalled();
    });
  });
});