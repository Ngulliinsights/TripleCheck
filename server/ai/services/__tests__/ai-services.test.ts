/**
 * Comprehensive AI Services Test Suite
 * 
 * Tests all four AI services:
 * - PropertyAnalysisAI
 * - DocumentProcessingAI  
 * - FraudDetectionAI
 * - RecommendationAI
 * - AIServiceManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PropertyAnalysisAI } from '../property-analysis-ai.service';
import { DocumentProcessingAI } from '../document-processing-ai.service';
import { FraudDetectionAI } from '../fraud-detection-ai.service';
import { RecommendationAI } from '../recommendation-ai.service';
import { AIServiceManager } from '../ai-service-manager';

// Mock the enhanced HuggingFace client
vi.mock('../../../../src/shared/services/enhanced-huggingface-client', () => ({
  enhancedHuggingFaceClient: {
    analyzeLandImage: vi.fn().mockResolvedValue({
      labels: [
        { label: 'house', confidence: 0.9 },
        { label: 'garden', confidence: 0.8 }
      ],
      description: 'Property with house and garden'
    }),
    analyzePropertyReviewSentiment: vi.fn().mockResolvedValue({
      label: 'POSITIVE',
      confidence: 0.85
    }),
    summarizePropertyDocument: vi.fn().mockResolvedValue('Property summary'),
    analyzePropertyDocument: vi.fn().mockResolvedValue({
      text: 'Extracted document text',
      confidence: 0.9,
      entities: []
    }),
    classifyLegalDocument: vi.fn().mockResolvedValue({
      label: 'title_deed',
      confidence: 0.8
    }),
    detectFraudIndicators: vi.fn().mockResolvedValue({
      riskLevel: 'low',
      indicators: [],
      confidence: 0.7
    })
  },
  AIServiceError: class AIServiceError extends Error {
    constructor(message: string, public service: string, public operation: string, public statusCode?: number, options: any = {}) {
      super(message);
      this.name = 'AIServiceError';
    }
  }
}));

// Mock the logging service
vi.mock('../../../../core/src/logging', () => ({
  loggingService: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('PropertyAnalysisAI Service', () => {
  let propertyAnalysisAI: PropertyAnalysisAI;

  beforeEach(() => {
    propertyAnalysisAI = new PropertyAnalysisAI();
  });

  describe('analyzePropertyValue', () => {
    it('should analyze property value successfully', async () => {
      const propertyData = {
        id: 'prop_123',
        location: 'Westlands, Nairobi',
        propertyType: 'residential' as const,
        size: 150,
        features: ['swimming pool', 'garden', 'security'],
        yearBuilt: 2020,
        condition: 'excellent' as const,
        images: ['base64image1', 'base64image2'],
        description: 'Beautiful modern house with excellent amenities'
      };

      const result = await propertyAnalysisAI.analyzePropertyValue(propertyData);

      expect(result).toBeDefined();
      expect(result.estimatedValue).toBeDefined();
      expect(result.estimatedValue.min).toBeGreaterThan(0);
      expect(result.estimatedValue.max).toBeGreaterThan(result.estimatedValue.min);
      expect(result.estimatedValue.average).toBeGreaterThan(0);
      expect(result.estimatedValue.currency).toBe('KES');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.factors).toBeInstanceOf(Array);
      expect(result.comparables).toBeInstanceOf(Array);
      expect(result.methodology).toBeDefined();
    });

    it('should handle missing optional data gracefully', async () => {
      const minimalPropertyData = {
        id: 'prop_456',
        location: 'Karen, Nairobi',
        propertyType: 'residential' as const,
        size: 200,
        features: []
      };

      const result = await propertyAnalysisAI.analyzePropertyValue(minimalPropertyData);

      expect(result).toBeDefined();
      expect(result.estimatedValue).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('assessPropertyRisk', () => {
    it('should assess property risk successfully', async () => {
      const propertyData = {
        id: 'prop_789',
        location: 'Kilimani, Nairobi',
        propertyType: 'commercial' as const,
        size: 500,
        features: ['parking', 'elevator'],
        yearBuilt: 1995
      };

      const result = await propertyAnalysisAI.assessPropertyRisk(propertyData);

      expect(result).toBeDefined();
      expect(result.overallRisk).toMatch(/^(low|medium|high)$/);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.riskFactors).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.investmentViability).toBeDefined();
    });
  });

  describe('generatePropertyInsights', () => {
    it('should generate property insights successfully', async () => {
      const propertyData = {
        id: 'prop_101',
        location: 'Lavington, Nairobi',
        propertyType: 'residential' as const,
        size: 300,
        features: ['garden', 'garage', 'modern kitchen']
      };

      const result = await propertyAnalysisAI.generatePropertyInsights(propertyData);

      expect(result).toBeDefined();
      expect(result.marketPosition).toBeDefined();
      expect(result.improvementSuggestions).toBeInstanceOf(Array);
      expect(result.marketDemand).toBeDefined();
      expect(result.locationAnalysis).toBeDefined();
    });
  });
});

describe('DocumentProcessingAI Service', () => {
  let documentProcessingAI: DocumentProcessingAI;

  beforeEach(() => {
    documentProcessingAI = new DocumentProcessingAI();
  });

  describe('extractDocumentData', () => {
    it('should extract text from document successfully', async () => {
      const document = {
        id: 'doc_123',
        type: 'title_deed' as const,
        imageBase64: 'base64encodedimage',
        metadata: {
          filename: 'title_deed.jpg',
          uploadedBy: 'user_123',
          uploadedAt: new Date()
        }
      };

      const result = await documentProcessingAI.extractDocumentData(document);

      expect(result).toBeDefined();
      expect(result.extractedText).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.textRegions).toBeInstanceOf(Array);
      expect(result.language).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle text input directly', async () => {
      const document = {
        id: 'doc_456',
        type: 'survey_report' as const,
        text: 'This is a survey report for property XYZ'
      };

      const result = await documentProcessingAI.extractDocumentData(document);

      expect(result).toBeDefined();
      expect(result.extractedText).toBe(document.text);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('validateDocumentAuthenticity', () => {
    it('should validate document authenticity successfully', async () => {
      const document = {
        id: 'doc_789',
        type: 'title_deed' as const,
        text: 'REPUBLIC OF KENYA MINISTRY OF LANDS Title Deed No. NAIROBI/BLOCK209/542'
      };

      const result = await documentProcessingAI.validateDocumentAuthenticity(document);

      expect(result).toBeDefined();
      expect(typeof result.isAuthentic).toBe('boolean');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(result.authenticityScore).toBeLessThanOrEqual(100);
      expect(result.verificationChecks).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('classifyDocument', () => {
    it('should classify document successfully', async () => {
      const document = {
        id: 'doc_101',
        text: 'Building Permit Application for Construction Project'
      };

      const result = await documentProcessingAI.classifyDocument(document);

      expect(result).toBeDefined();
      expect(result.documentType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(typeof result.isOfficial).toBe('boolean');
    });
  });

  describe('processDocument', () => {
    it('should process document comprehensively', async () => {
      const document = {
        id: 'doc_comprehensive',
        type: 'title_deed' as const,
        imageBase64: 'base64encodedimage',
        metadata: {
          filename: 'comprehensive_test.jpg',
          uploadedBy: 'user_123',
          uploadedAt: new Date()
        }
      };

      const result = await documentProcessingAI.processDocument(document);

      expect(result).toBeDefined();
      expect(result.documentId).toBe(document.id);
      expect(result.ocr).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.authenticity).toBeDefined();
      expect(result.extractedData).toBeDefined();
      expect(result.qualityAssessment).toBeDefined();
      expect(result.processingMetadata).toBeDefined();
      expect(result.processingMetadata.aiModelsUsed).toBeInstanceOf(Array);
    });
  });
});

describe('FraudDetectionAI Service', () => {
  let fraudDetectionAI: FraudDetectionAI;

  beforeEach(() => {
    fraudDetectionAI = new FraudDetectionAI();
  });

  describe('analyzeTransaction', () => {
    it('should analyze transaction for fraud successfully', async () => {
      const transactionData = {
        id: 'txn_123',
        propertyId: 'prop_123',
        sellerId: 'user_456',
        buyerId: 'user_789',
        amount: 5000000,
        currency: 'KES',
        location: 'Westlands, Nairobi',
        transactionDate: new Date(),
        propertyType: 'residential' as const,
        propertySize: 150,
        marketValue: 4800000
      };

      const userBehavior = {
        userId: 'user_789',
        accountAge: 45,
        transactionHistory: [],
        loginPatterns: [],
        documentUploads: [],
        communicationPatterns: []
      };

      const result = await fraudDetectionAI.analyzeTransaction(transactionData, userBehavior);

      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
      expect(result.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(result.fraudProbability).toBeGreaterThanOrEqual(0);
      expect(result.fraudProbability).toBeLessThanOrEqual(1);
      expect(result.riskFactors).toBeInstanceOf(Array);
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(typeof result.requiresManualReview).toBe('boolean');
      expect(typeof result.blockTransaction).toBe('boolean');
    });

    it('should handle high-risk transactions', async () => {
      const highRiskTransaction = {
        id: 'txn_high_risk',
        propertyId: 'prop_suspicious',
        sellerId: 'user_suspicious',
        buyerId: 'user_new',
        amount: 1000000, // Very low amount
        currency: 'KES',
        location: 'Remote Area',
        transactionDate: new Date(),
        propertyType: 'residential' as const,
        marketValue: 8000000 // Much higher market value
      };

      const suspiciousBehavior = {
        userId: 'user_new',
        accountAge: 1, // Very new account
        transactionHistory: [],
        loginPatterns: [],
        documentUploads: [],
        communicationPatterns: []
      };

      const result = await fraudDetectionAI.analyzeTransaction(highRiskTransaction, suspiciousBehavior);

      expect(result.overallRiskScore).toBeGreaterThan(30); // Should be higher risk
      expect(result.requiresManualReview).toBe(true);
    });
  });

  describe('detectDocumentFraud', () => {
    it('should detect document fraud successfully', async () => {
      const documentData = {
        documentId: 'doc_fraud_test',
        documentType: 'title_deed',
        uploadedBy: 'user_123',
        uploadDate: new Date(),
        extractedText: 'REPUBLIC OF KENYA Title Deed',
        verificationAttempts: 1
      };

      const result = await fraudDetectionAI.detectDocumentFraud(documentData);

      expect(result).toBeDefined();
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
      expect(result.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(result.riskFactors).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('analyzePatterns', () => {
    it('should analyze transaction patterns successfully', async () => {
      const transactions = [
        {
          id: 'txn_1',
          propertyId: 'prop_1',
          sellerId: 'user_1',
          buyerId: 'user_2',
          amount: 3000000,
          currency: 'KES',
          location: 'Nairobi',
          transactionDate: new Date('2024-01-01'),
          propertyType: 'residential' as const
        },
        {
          id: 'txn_2',
          propertyId: 'prop_2',
          sellerId: 'user_2',
          buyerId: 'user_3',
          amount: 3200000,
          currency: 'KES',
          location: 'Nairobi',
          transactionDate: new Date('2024-01-15'),
          propertyType: 'residential' as const
        }
      ];

      const result = await fraudDetectionAI.analyzePatterns(transactions, 'month');

      expect(result).toBeDefined();
      expect(result.patterns).toBeInstanceOf(Array);
      expect(result.trends).toBeInstanceOf(Array);
      expect(result.correlations).toBeInstanceOf(Array);
    });
  });
});

describe('RecommendationAI Service', () => {
  let recommendationAI: RecommendationAI;

  beforeEach(() => {
    recommendationAI = new RecommendationAI();
  });

  describe('generateRecommendations', () => {
    it('should generate property recommendations successfully', async () => {
      const userPreferences = {
        userId: 'user_123',
        budget: {
          min: 2000000,
          max: 5000000,
          currency: 'KES'
        },
        propertyTypes: ['residential' as const],
        locations: ['Nairobi'],
        features: {
          required: ['security'],
          preferred: ['garden', 'parking'],
          unwanted: []
        },
        propertySize: {
          min: 100,
          max: 300,
          unit: 'sqm' as const
        }
      };

      const availableProperties = [
        {
          id: 'prop_1',
          title: 'Modern House in Westlands',
          description: 'Beautiful 3-bedroom house',
          propertyType: 'residential' as const,
          location: 'Westlands, Nairobi',
          price: 3500000,
          currency: 'KES',
          size: 180,
          sizeUnit: 'sqm',
          bedrooms: 3,
          bathrooms: 2,
          features: ['security', 'garden', 'parking'],
          images: [],
          listedAt: new Date(),
          lastUpdated: new Date()
        },
        {
          id: 'prop_2',
          title: 'Apartment in Kilimani',
          description: 'Cozy 2-bedroom apartment',
          propertyType: 'residential' as const,
          location: 'Kilimani, Nairobi',
          price: 2800000,
          currency: 'KES',
          size: 120,
          sizeUnit: 'sqm',
          bedrooms: 2,
          bathrooms: 1,
          features: ['security', 'balcony'],
          images: [],
          listedAt: new Date(),
          lastUpdated: new Date()
        }
      ];

      const result = await recommendationAI.generateRecommendations(userPreferences, availableProperties);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userPreferences.userId);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.totalMatches).toBeGreaterThanOrEqual(0);
      expect(result.searchMetadata).toBeDefined();
      expect(result.marketInsights).toBeDefined();

      // Check recommendation structure
      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation.propertyId).toBeDefined();
        expect(recommendation.matchScore).toBeGreaterThanOrEqual(0);
        expect(recommendation.matchScore).toBeLessThanOrEqual(100);
        expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(1);
        expect(recommendation.reasons).toBeInstanceOf(Array);
        expect(recommendation.highlights).toBeInstanceOf(Array);
      }
    });

    it('should filter properties based on budget', async () => {
      const userPreferences = {
        userId: 'user_456',
        budget: {
          min: 1000000,
          max: 2000000,
          currency: 'KES'
        },
        propertyTypes: ['residential' as const],
        locations: [],
        features: {
          required: [],
          preferred: [],
          unwanted: []
        },
        propertySize: {
          unit: 'sqm' as const
        }
      };

      const availableProperties = [
        {
          id: 'prop_expensive',
          title: 'Expensive House',
          description: 'Very expensive property',
          propertyType: 'residential' as const,
          location: 'Karen, Nairobi',
          price: 10000000, // Outside budget
          currency: 'KES',
          size: 300,
          sizeUnit: 'sqm',
          features: [],
          images: [],
          listedAt: new Date(),
          lastUpdated: new Date()
        },
        {
          id: 'prop_affordable',
          title: 'Affordable House',
          description: 'Within budget property',
          propertyType: 'residential' as const,
          location: 'Kasarani, Nairobi',
          price: 1500000, // Within budget
          currency: 'KES',
          size: 150,
          sizeUnit: 'sqm',
          features: [],
          images: [],
          listedAt: new Date(),
          lastUpdated: new Date()
        }
      ];

      const result = await recommendationAI.generateRecommendations(userPreferences, availableProperties);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].propertyId).toBe('prop_affordable');
    });
  });

  describe('findSimilarProperties', () => {
    it('should find similar properties successfully', async () => {
      const targetProperty = {
        id: 'target_prop',
        title: 'Target House',
        description: '3-bedroom house in Westlands',
        propertyType: 'residential' as const,
        location: 'Westlands, Nairobi',
        price: 4000000,
        currency: 'KES',
        size: 200,
        sizeUnit: 'sqm',
        bedrooms: 3,
        bathrooms: 2,
        features: ['garden', 'security'],
        images: [],
        listedAt: new Date(),
        lastUpdated: new Date()
      };

      const availableProperties = [
        {
          id: 'similar_prop_1',
          title: 'Similar House 1',
          description: '3-bedroom house nearby',
          propertyType: 'residential' as const,
          location: 'Westlands, Nairobi',
          price: 3800000,
          currency: 'KES',
          size: 190,
          sizeUnit: 'sqm',
          bedrooms: 3,
          bathrooms: 2,
          features: ['garden', 'security', 'parking'],
          images: [],
          listedAt: new Date(),
          lastUpdated: new Date()
        },
        {
          id: 'different_prop',
          title: 'Different Property',
          description: 'Commercial space',
          propertyType: 'commercial' as const,
          location: 'Industrial Area, Nairobi',
          price: 8000000,
          currency: 'KES',
          size: 500,
          sizeUnit: 'sqm',
          features: ['parking'],
          images: [],
          listedAt: new Date(),
          lastUpdated: new Date()
        }
      ];

      const result = await recommendationAI.findSimilarProperties(
        targetProperty,
        availableProperties,
        0.5 // Lower threshold for testing
      );

      expect(result).toBeInstanceOf(Array);
      
      if (result.length > 0) {
        const similarProperty = result[0];
        expect(similarProperty.property).toBeDefined();
        expect(similarProperty.similarity).toBeGreaterThanOrEqual(0);
        expect(similarProperty.similarity).toBeLessThanOrEqual(1);
        expect(similarProperty.reasons).toBeInstanceOf(Array);
      }
    });
  });
});

describe('AIServiceManager', () => {
  let aiServiceManager: AIServiceManager;

  beforeEach(() => {
    aiServiceManager = new AIServiceManager({
      propertyAnalysis: { enabled: true },
      documentProcessing: { enabled: true },
      fraudDetection: { enabled: true },
      recommendation: { enabled: true },
      monitoring: { enabled: false } // Disable monitoring for tests
    });
  });

  afterEach(async () => {
    await aiServiceManager.shutdown();
  });

  describe('Service Integration', () => {
    it('should initialize all services successfully', () => {
      const enabledServices = aiServiceManager.getEnabledServices();
      expect(enabledServices).toContain('propertyAnalysis');
      expect(enabledServices).toContain('documentProcessing');
      expect(enabledServices).toContain('fraudDetection');
      expect(enabledServices).toContain('recommendation');
    });

    it('should perform health checks', async () => {
      const healthStatus = await aiServiceManager.performHealthCheck();
      
      expect(healthStatus).toBeInstanceOf(Array);
      expect(healthStatus.length).toBeGreaterThan(0);
      
      healthStatus.forEach(status => {
        expect(status.serviceName).toBeDefined();
        expect(status.status).toMatch(/^(healthy|degraded|unhealthy|disabled)$/);
        expect(status.lastCheck).toBeInstanceOf(Date);
      });
    });

    it('should get service metrics', () => {
      const metrics = aiServiceManager.getServiceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.failedRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.serviceHealth).toBeInstanceOf(Array);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Property Analysis Integration', () => {
    it('should analyze property value through service manager', async () => {
      const propertyData = {
        id: 'integration_test_prop',
        location: 'Test Location',
        propertyType: 'residential' as const,
        size: 150,
        features: []
      };

      const result = await aiServiceManager.analyzePropertyValue(propertyData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Test with invalid data to trigger error
      const invalidDocument = {
        id: '', // Invalid empty ID
        type: 'unknown' as any
      };

      const result = await aiServiceManager.extractDocumentData(invalidDocument);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.requestId).toBeDefined();
    });
  });
});

describe('Service Performance', () => {
  it('should complete property analysis within reasonable time', async () => {
    const propertyAnalysisAI = new PropertyAnalysisAI();
    const startTime = Date.now();

    const propertyData = {
      id: 'perf_test_prop',
      location: 'Performance Test Location',
      propertyType: 'residential' as const,
      size: 200,
      features: ['security', 'garden']
    };

    await propertyAnalysisAI.analyzePropertyValue(propertyData);
    
    const processingTime = Date.now() - startTime;
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle concurrent requests efficiently', async () => {
    const recommendationAI = new RecommendationAI();
    
    const userPreferences = {
      userId: 'concurrent_test_user',
      budget: { min: 1000000, max: 5000000, currency: 'KES' },
      propertyTypes: ['residential' as const],
      locations: ['Nairobi'],
      features: { required: [], preferred: [], unwanted: [] },
      propertySize: { unit: 'sqm' as const }
    };

    const properties = Array.from({ length: 10 }, (_, i) => ({
      id: `concurrent_prop_${i}`,
      title: `Property ${i}`,
      description: `Test property ${i}`,
      propertyType: 'residential' as const,
      location: 'Nairobi',
      price: 2000000 + (i * 100000),
      currency: 'KES',
      size: 150 + (i * 10),
      sizeUnit: 'sqm',
      features: [],
      images: [],
      listedAt: new Date(),
      lastUpdated: new Date()
    }));

    const startTime = Date.now();
    
    // Run multiple concurrent requests
    const promises = Array.from({ length: 3 }, () => 
      recommendationAI.generateRecommendations(userPreferences, properties)
    );

    const results = await Promise.all(promises);
    const processingTime = Date.now() - startTime;

    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.userId).toBe(userPreferences.userId);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
    
    expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
  });
});