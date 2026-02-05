import { describe, it, expect, beforeEach } from 'vitest';
import { AIMLService, createAIConfig, getAIMLService } from '../ai-ml-service';

describe('AIMLService', () => {
  let aiService: AIMLService;

  beforeEach(() => {
    const config = createAIConfig();
    aiService = new AIMLService(config);
  });

  describe('Configuration', () => {
    it('should create AI config with default values', () => {
      const config = createAIConfig();
      
      expect(config).toHaveProperty('providers');
      expect(config).toHaveProperty('fallbackMode');
      expect(config).toHaveProperty('defaultProvider');
      expect(['openai', 'gemini', 'claude']).toContain(config.defaultProvider);
    });

    it('should initialize service in fallback mode when no API keys provided', () => {
      const status = aiService.getStatus();
      
      expect(status.fallbackMode).toBe(true);
      expect(status.connected).toBe(false);
      expect(Array.isArray(status.availableProviders)).toBe(true);
    });
  });

  describe('Document Analysis', () => {
    it('should handle document analysis in fallback mode', async () => {
      const mockBuffer = Buffer.from('test document content');
      
      const result = await aiService.analyzeDocument({
        documentType: 'title_deed',
        imageBuffer: mockBuffer,
        context: {
          propertyId: 'test-123',
          location: 'Nairobi'
        }
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('documentType', 'title_deed');
      expect(result).toHaveProperty('extractedData');
      expect(result).toHaveProperty('fraudIndicators');
      expect(result).toHaveProperty('authenticity');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('fallbackUsed', true);
    });
  });

  describe('Fraud Detection', () => {
    it('should detect fraud patterns in fallback mode', async () => {
      const mockRequest = {
        transactionData: {
          propertyId: 'test-123',
          sellerId: 'seller-456',
          buyerId: 'buyer-789',
          amount: 5000000, // 5M KES
          location: 'Nairobi'
        },
        documentUrls: ['doc1.pdf', 'doc2.pdf']
      };

      const result = await aiService.detectFraud(mockRequest);

      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskLevel');
      expect(['low', 'medium', 'high']).toContain(result.riskLevel);
      expect(result).toHaveProperty('indicators');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('requiresManualReview');
      expect(result).toHaveProperty('fallbackUsed', true);
    });
  });

  describe('Property Valuation', () => {
    it('should provide property valuation in fallback mode', async () => {
      const mockRequest = {
        location: 'Westlands, Nairobi',
        propertyType: 'apartment',
        size: 100, // sq meters
        features: ['parking', 'security', 'gym']
      };

      const result = await aiService.valuateProperty(mockRequest);

      expect(result).toHaveProperty('estimatedValue');
      expect(result.estimatedValue).toHaveProperty('min');
      expect(result.estimatedValue).toHaveProperty('max');
      expect(result.estimatedValue).toHaveProperty('average');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('comparables');
      expect(result).toHaveProperty('fallbackUsed', true);
    });
  });

  describe('Service Status', () => {
    it('should return service status', () => {
      const status = aiService.getStatus();

      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('fallbackMode');
      expect(status).toHaveProperty('availableProviders');
      expect(Array.isArray(status.availableProviders)).toBe(true);
    });
  });

  describe('Singleton Service', () => {
    it('should return same instance from getAIMLService', () => {
      const service1 = getAIMLService();
      const service2 = getAIMLService();
      
      expect(service1).toBe(service2);
    });
  });
});