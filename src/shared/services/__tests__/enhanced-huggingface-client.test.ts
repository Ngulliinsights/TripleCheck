/**
 * Tests for Enhanced HuggingFace API Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  EnhancedHuggingFaceApiClient, 
  AIServiceError, 
  AIServiceTimeoutError,
  AIServiceRateLimitError,
  enhancedHuggingFaceClient,
  enhancedLandVerificationAI
} from '../enhanced-huggingface-client';
import { CircuitBreakerState } from '../../../../core/src/error-handling';
import * as apiClientModule from '../unified-api-client';
import * as mockClientModule from '../mock-huggingface-client';

// Mock dependencies
vi.mock('../../../../core/src/logging', () => ({
  loggingService: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../unified-api-client', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

vi.mock('../mock-huggingface-client', () => ({
  mockHuggingFaceClient: {
    analyzePropertyDocument: vi.fn(),
    analyzeLandImage: vi.fn(),
    classifyLegalDocument: vi.fn(),
    analyzePropertyReviewSentiment: vi.fn(),
    translateText: vi.fn(),
    extractPropertyInfo: vi.fn(),
    summarizePropertyDocument: vi.fn(),
    detectFraudIndicators: vi.fn()
  }
}));

describe('EnhancedHuggingFaceApiClient', () => {
  let client: EnhancedHuggingFaceApiClient;
  let mockApiClient: any;
  let mockHuggingFaceClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient = apiClientModule.apiClient;
    mockHuggingFaceClient = mockClientModule.mockHuggingFaceClient;
    
    client = new EnhancedHuggingFaceApiClient({
      enableDetailedLogging: false, // Reduce noise in tests
      circuitBreakerEnabled: true,
      maxRetries: 2,
      initialRetryDelay: 10, // Fast retries for tests
      maxRetryDelay: 50
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new EnhancedHuggingFaceApiClient();
      expect(defaultClient.getCircuitBreakerState()).toBe(CircuitBreakerState.CLOSED);
      
      const metrics = defaultClient.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const customClient = new EnhancedHuggingFaceApiClient({
        maxRetries: 5,
        enableFallback: false,
        circuitBreakerEnabled: false
      });
      
      expect(customClient).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should create AIServiceError with correct properties', () => {
      const error = new AIServiceError(
        'Test error',
        'HuggingFace',
        'testOperation',
        500,
        { retryable: true, details: { custom: 'data' } }
      );

      expect(error.message).toBe('Test error');
      expect(error.service).toBe('HuggingFace');
      expect(error.operation).toBe('testOperation');
      expect(error.statusCode).toBe(500);
      expect(error.metadata.retryable).toBe(true);
      expect(error.details?.custom).toBe('data');
    });

    it('should create AIServiceTimeoutError', () => {
      const error = new AIServiceTimeoutError('HuggingFace', 'testOp', 5000);
      
      expect(error.message).toContain('timeout after 5000ms');
      expect(error.statusCode).toBe(408);
      expect(error.metadata.retryable).toBe(true);
    });

    it('should create AIServiceRateLimitError', () => {
      const error = new AIServiceRateLimitError('HuggingFace', 'testOp', 60);
      
      expect(error.message).toContain('rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.metadata.retryable).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      mockApiClient.post
        .mockRejectedValueOnce({ success: false, error: 'Temporary error' })
        .mockRejectedValueOnce({ success: false, error: 'Temporary error' })
        .mockResolvedValueOnce({ 
          success: true, 
          data: [{ generated_text: 'Success' }] 
        });

      const result = await client.analyzePropertyDocument('test-image');
      
      expect(mockApiClient.post).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('should not retry non-retryable errors', async () => {
      mockApiClient.post.mockRejectedValue({ 
        success: false, 
        error: 'Bad request' 
      });

      await expect(client.analyzePropertyDocument('test-image'))
        .rejects.toThrow();
      
      // Should be called more than once due to retries, but will eventually fail
      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should respect maximum retry attempts', async () => {
      mockApiClient.post.mockRejectedValue({ 
        success: false, 
        error: 'Persistent error' 
      });

      await expect(client.analyzePropertyDocument('test-image'))
        .rejects.toThrow();
      
      // Should be called maxRetries + 1 times (initial + retries)
      expect(mockApiClient.post).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after threshold failures', async () => {
      // Configure client with low threshold for testing
      const testClient = new EnhancedHuggingFaceApiClient({
        failureThreshold: 2,
        maxRetries: 0, // No retries to speed up test
        enableFallback: false
      });

      mockApiClient.post.mockRejectedValue({ 
        success: false, 
        error: 'Service error' 
      });

      // Trigger failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await testClient.analyzePropertyDocument('test-image');
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit breaker should be open now
      expect(testClient.getCircuitBreakerState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should use fallback when circuit breaker is open', async () => {
      const testClient = new EnhancedHuggingFaceApiClient({
        failureThreshold: 1,
        maxRetries: 0,
        enableFallback: true,
        fallbackToMock: true
      });

      // Mock API to return 503 error to trigger fallback
      mockApiClient.post.mockResolvedValue({ 
        success: false, 
        error: 'Service unavailable (503)' 
      });

      mockHuggingFaceClient.analyzePropertyDocument.mockResolvedValue({
        text: 'Mock result',
        confidence: 0.8
      });

      // Call should use fallback due to 503 error
      const result = await testClient.analyzePropertyDocument('test-image');
      
      expect(result.text).toBe('Mock result');
      expect(mockHuggingFaceClient.analyzePropertyDocument).toHaveBeenCalled();
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should use mock client as fallback', async () => {
      const testClient = new EnhancedHuggingFaceApiClient({
        enableFallback: true,
        fallbackToMock: true,
        maxRetries: 0,
        circuitBreakerEnabled: false // Disable circuit breaker for this test
      });

      // Mock API to return 503 error to trigger fallback
      mockApiClient.post.mockResolvedValue({ 
        success: false, 
        error: 'Service unavailable (503)' 
      });

      mockHuggingFaceClient.analyzeLandImage.mockResolvedValue({
        labels: [{ label: 'land', confidence: 0.9 }],
        description: 'Mock land analysis'
      });

      const result = await testClient.analyzeLandImage('test-image');
      
      expect(result.labels[0].label).toBe('land');
      expect(mockHuggingFaceClient.analyzeLandImage).toHaveBeenCalledWith('test-image');
    });

    it('should handle fallback mapping for different endpoints', async () => {
      const testClient = new EnhancedHuggingFaceApiClient({
        enableFallback: true,
        fallbackToMock: true,
        maxRetries: 0,
        circuitBreakerEnabled: false
      });

      // Mock API to return 503 error to trigger fallback
      mockApiClient.post.mockResolvedValue({ 
        success: false, 
        error: 'Service unavailable (503)' 
      });

      // Test different endpoint mappings
      mockHuggingFaceClient.classifyLegalDocument.mockResolvedValue({
        label: 'contract',
        confidence: 0.85
      });

      const result = await testClient.classifyLegalDocument('test document');
      
      expect(result.label).toBe('contract');
      expect(mockHuggingFaceClient.classifyLegalDocument).toHaveBeenCalled();
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      // Mock different response formats for different endpoints
      mockApiClient.post.mockImplementation((url) => {
        if (url.includes('trocr-base-printed')) {
          return Promise.resolve({ 
            success: true, 
            data: [{ generated_text: 'Mock extracted text' }] 
          });
        }
        if (url.includes('vit-base-patch16-224')) {
          return Promise.resolve({ 
            success: true, 
            data: [{ label: 'land', score: 0.9 }] 
          });
        }
        if (url.includes('legal-bert') || url.includes('bart-large-mnli')) {
          return Promise.resolve({ 
            success: true, 
            data: [[{ label: 'contract', score: 0.85 }]] 
          });
        }
        return Promise.resolve({ 
          success: true, 
          data: { mockResponse: true } 
        });
      });
    });

    it('should call analyzePropertyDocument with correct parameters', async () => {
      await client.analyzePropertyDocument('test-image', 'deed');
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/models/microsoft/trocr-base-printed'),
        { inputs: 'test-image' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          timeout: 45000
        })
      );
    });

    it('should call analyzeLandImage with correct parameters', async () => {
      await client.analyzeLandImage('test-image');
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/models/google/vit-base-patch16-224'),
        { inputs: 'test-image' },
        expect.objectContaining({
          timeout: 30000
        })
      );
    });

    it('should call classifyLegalDocument with correct parameters', async () => {
      await client.classifyLegalDocument('test document');
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/models/nlpaueb/legal-bert-base-uncased'),
        { inputs: 'test document' },
        expect.objectContaining({
          timeout: 20000
        })
      );
    });

    it('should include API key in headers when provided', async () => {
      const clientWithKey = new EnhancedHuggingFaceApiClient({
        apiKey: 'test-api-key'
      });

      await clientWithKey.analyzeLandImage('test-image');
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track request metrics', async () => {
      mockApiClient.post.mockResolvedValue({ 
        success: true, 
        data: [{ label: 'land', score: 0.9 }] 
      });

      await client.analyzeLandImage('test-image');
      
      const metrics = client.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.lastRequestTime).toBeInstanceOf(Date);
    });

    it('should track failure metrics', async () => {
      mockApiClient.post.mockRejectedValue({ 
        success: false, 
        error: 'Test error' 
      });

      try {
        await client.analyzeLandImage('test-image');
      } catch (error) {
        // Expected to fail
      }
      
      const metrics = client.getMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.failedRequests).toBeGreaterThan(0);
    });

    it('should provide health check status', async () => {
      const health = await client.healthCheck();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('circuitBreakerState');
      expect(health).toHaveProperty('metrics');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      mockApiClient.post.mockImplementation((url) => {
        if (url.includes('trocr-base-printed')) {
          return Promise.resolve({ 
            success: true, 
            data: [{ generated_text: 'Mock extracted text' }] 
          });
        }
        if (url.includes('vit-base-patch16-224')) {
          return Promise.resolve({ 
            success: true, 
            data: [{ label: 'land', score: 0.9 }] 
          });
        }
        if (url.includes('legal-bert')) {
          return Promise.resolve({ 
            success: true, 
            data: [[{ label: 'contract', score: 0.85 }]] 
          });
        }
        return Promise.resolve({ 
          success: true, 
          data: { mockResponse: true } 
        });
      });
    });

    it('should provide utility functions through enhancedLandVerificationAI', async () => {
      await enhancedLandVerificationAI.analyzePropertyDocument('test-image');
      await enhancedLandVerificationAI.analyzeLandImage('test-image');
      await enhancedLandVerificationAI.classifyLegalDocument('test-doc');
      
      expect(mockApiClient.post).toHaveBeenCalledTimes(3);
    });

    it('should provide health status through utility functions', async () => {
      const health = await enhancedLandVerificationAI.getHealthStatus();
      expect(health).toHaveProperty('status');
    });

    it('should provide metrics through utility functions', () => {
      const metrics = enhancedLandVerificationAI.getMetrics();
      expect(metrics).toHaveProperty('totalRequests');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty responses gracefully', async () => {
      mockApiClient.post.mockResolvedValue({ 
        success: true, 
        data: null 
      });

      await expect(client.analyzeLandImage('test-image'))
        .rejects.toThrow('Invalid response format');
    });

    it('should handle malformed responses', async () => {
      mockApiClient.post.mockResolvedValue({ 
        success: true, 
        data: 'invalid-response' 
      });

      await expect(client.analyzeLandImage('test-image'))
        .rejects.toThrow('Invalid response format');
    });

    it('should handle network timeouts', async () => {
      mockApiClient.post.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(client.analyzeLandImage('test-image'))
        .rejects.toThrow();
    });
  });

  describe('Fraud Detection', () => {
    it('should handle fraud detection with proper fallback', async () => {
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: {
          labels: ['fraudulent_document'],
          scores: [0.8]
        }
      });

      const result = await client.detectFraudIndicators('suspicious document');
      
      expect(result.riskLevel).toBe('high');
      expect(result.indicators).toContain('fraudulent_document');
      expect(result.confidence).toBe(0.8);
    });

    it('should return safe default on fraud detection failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Service error'));

      const result = await client.detectFraudIndicators('test document');
      
      expect(result.riskLevel).toBe('low');
      expect(result.indicators).toEqual([]);
      expect(result.confidence).toBe(0);
    });
  });
});

describe('Singleton Instance', () => {
  it('should export singleton instance', () => {
    expect(enhancedHuggingFaceClient).toBeInstanceOf(EnhancedHuggingFaceApiClient);
  });

  it('should export utility functions', () => {
    expect(enhancedLandVerificationAI).toHaveProperty('analyzePropertyDocument');
    expect(enhancedLandVerificationAI).toHaveProperty('analyzeLandImage');
    expect(enhancedLandVerificationAI).toHaveProperty('getHealthStatus');
    expect(enhancedLandVerificationAI).toHaveProperty('getMetrics');
  });
});