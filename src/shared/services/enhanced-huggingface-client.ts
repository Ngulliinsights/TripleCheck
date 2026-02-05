/**
 * Enhanced HuggingFace API Client with Robust Error Handling
 * 
 * Features:
 * - Comprehensive error handling with typed errors
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern for service resilience
 * - Fallback mechanisms using mock client
 * - Request/response logging and monitoring
 * - Rate limiting integration
 */

import { CircuitBreaker, CircuitBreakerState, BaseError, ErrorDomain, ErrorSeverity } from '../../../server/infrastructure/rate-limiting/CircuitBreaker'
import { logger as loggingService } from '../../../server/infrastructure/monitoring/logger'
import { apiClient } from './unified-api-client'
import { mockHuggingFaceClient } from './mock-huggingface-client'
import {
  HuggingFaceConfig,
  DocumentAnalysisResult,
  ImageAnalysisResult,
  TextClassificationResult,
  TranslationResult
} from './huggingface-api-client'

// Enhanced configuration interface
export interface EnhancedHuggingFaceConfig extends HuggingFaceConfig {
  // Retry configuration
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  retryMultiplier?: number;
  
  // Circuit breaker configuration
  circuitBreakerEnabled?: boolean;
  failureThreshold?: number;
  successThreshold?: number;
  circuitBreakerTimeout?: number;
  
  // Fallback configuration
  enableFallback?: boolean;
  fallbackToMock?: boolean;
  
  // Monitoring configuration
  enableMetrics?: boolean;
  enableDetailedLogging?: boolean;
}

// AI Service specific errors
export class AIServiceError extends BaseError {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly statusCode?: number,
    options: {
      cause?: Error;
      retryable?: boolean;
      details?: Record<string, any>;
    } = {}
  ) {
    super(message, {
      code: 'AI_SERVICE_ERROR',
      domain: ErrorDomain.EXTERNAL,
      severity: ErrorSeverity.HIGH,
      cause: options.cause,
      retryable: options.retryable ?? true,
      details: {
        service,
        operation,
        statusCode,
        ...options.details
      }
    });
  }
}

export class AIServiceTimeoutError extends AIServiceError {
  constructor(service: string, operation: string, timeout: number) {
    super(
      `AI service timeout after ${timeout}ms`,
      service,
      operation,
      408,
      { retryable: true, details: { timeout } }
    );
  }
}

export class AIServiceRateLimitError extends AIServiceError {
  constructor(service: string, operation: string, retryAfter?: number) {
    super(
      'AI service rate limit exceeded',
      service,
      operation,
      429,
      { 
        retryable: true, 
        details: { retryAfter } 
      }
    );
  }
}

// Retry utility with exponential backoff
class RetryManager {
  constructor(private config: Required<EnhancedHuggingFaceConfig>) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context: { service: string; operation: string }
  ): Promise<T> {
    let lastError: Error;
    let delay = this.config.initialRetryDelay;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          loggingService.info(`Retrying ${operationName}`, {
            module: 'EnhancedHuggingFaceClient',
            attempt,
            delay,
            ...context
          });
          await this.sleep(delay);
          delay = Math.min(delay * this.config.retryMultiplier, this.config.maxRetryDelay);
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry non-retryable errors
        if (error instanceof AIServiceError && !error.retryable) {
          throw error;
        }

        // Don't retry on final attempt
        if (attempt === this.config.maxRetries) {
          break;
        }

        loggingService.warn(`${operationName} failed, will retry`, {
          module: 'EnhancedHuggingFaceClient',
          attempt,
          error: error instanceof Error ? error.message : String(error),
          nextRetryIn: delay,
          ...context
        });
      }
    }

    throw new AIServiceError(
      `${operationName} failed after ${this.config.maxRetries + 1} attempts`,
      context.service,
      context.operation,
      undefined,
      { 
        cause: lastError,
        retryable: false,
        details: { attempts: this.config.maxRetries + 1 }
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class EnhancedHuggingFaceApiClient {
  private config: Required<EnhancedHuggingFaceConfig>;
  private circuitBreaker: CircuitBreaker;
  private retryManager: RetryManager;
  private metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    fallbackRequests: number;
    averageResponseTime: number;
    lastRequestTime?: Date;
  };

  constructor(config: EnhancedHuggingFaceConfig = {}) {
    // Set defaults
    this.config = {
      baseUrl: 'https://api-inference.huggingface.co',
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 10000,
      retryMultiplier: 2,
      circuitBreakerEnabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      circuitBreakerTimeout: 60000,
      enableFallback: true,
      fallbackToMock: true,
      enableMetrics: true,
      enableDetailedLogging: true,
      ...config
    };

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      name: 'HuggingFaceAPI',
      failureThreshold: this.config.failureThreshold,
      successThreshold: this.config.successThreshold,
      timeout: this.config.circuitBreakerTimeout,
      halfOpenRetries: 3
    });

    // Initialize retry manager
    this.retryManager = new RetryManager(this.config);

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackRequests: 0,
      averageResponseTime: 0
    };

    // Set up circuit breaker event listeners
    this.setupCircuitBreakerListeners();

    loggingService.info('Enhanced HuggingFace API Client initialized', {
      module: 'EnhancedHuggingFaceClient',
      config: {
        maxRetries: this.config.maxRetries,
        circuitBreakerEnabled: this.config.circuitBreakerEnabled,
        enableFallback: this.config.enableFallback
      }
    });
  }

  private setupCircuitBreakerListeners(): void {
    this.circuitBreaker.on('open', (data) => {
      loggingService.error('HuggingFace API circuit breaker opened', {
        module: 'EnhancedHuggingFaceClient',
        metrics: data.metrics
      });
    });

    this.circuitBreaker.on('half-open', (data) => {
      loggingService.info('HuggingFace API circuit breaker half-open', {
        module: 'EnhancedHuggingFaceClient',
        metrics: data.metrics
      });
    });

    this.circuitBreaker.on('close', (data) => {
      loggingService.info('HuggingFace API circuit breaker closed', {
        module: 'EnhancedHuggingFaceClient',
        metrics: data.metrics
      });
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    data: any,
    options: { timeout?: number; operationName?: string } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const operationName = options.operationName || 'API Request';
    const context = { service: 'HuggingFace', operation: operationName };

    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = new Date();

    try {
      const result = await this.executeWithCircuitBreaker(async () => {
        return await this.retryManager.executeWithRetry(
          async () => {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };

            if (this.config.apiKey) {
              headers.Authorization = `Bearer ${this.config.apiKey}`;
            }

            const response = await apiClient.post<T>(
              `${this.config.baseUrl}${endpoint}`,
              data,
              {
                headers,
                timeout: options.timeout || 30000,
                useCache: false,
              }
            );

            if (!response.success) {
              const statusCode = response.error?.includes('429') ? 429 :
                               response.error?.includes('timeout') ? 408 :
                               response.error?.includes('503') ? 503 : 500;
              
              throw new AIServiceError(
                response.error || 'Unknown API error',
                'HuggingFace',
                operationName,
                statusCode,
                { retryable: statusCode !== 400 }
              );
            }

            return response.data;
          },
          operationName,
          context
        );
      });

      // Record success metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);

      if (this.config.enableDetailedLogging) {
        loggingService.info(`${operationName} completed successfully`, {
          module: 'EnhancedHuggingFaceClient',
          responseTime,
          endpoint,
          ...context
        });
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);

      if (this.config.enableFallback && this.shouldUseFallback(error)) {
        return await this.executeFallback(endpoint, data, operationName);
      }

      throw error;
    }
  }

  private async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.circuitBreakerEnabled) {
      return await operation();
    }

    return await this.circuitBreaker.execute(operation);
  }

  private shouldUseFallback(error: any): boolean {
    if (!this.config.enableFallback) return false;
    
    // Use fallback for circuit breaker open state or severe failures
    if (error instanceof BaseError && error.code === 'CIRCUIT_BREAKER_OPEN') {
      return true;
    }
    
    if (error instanceof BaseError && error.code === 'CIRCUIT_BREAKER_FAILURE') {
      return true;
    }
    
    if (error instanceof AIServiceError) {
      return error.statusCode === 503 || error.statusCode === 500;
    }
    
    // Check for nested AIServiceError in circuit breaker failures
    if (error instanceof BaseError && error.cause instanceof AIServiceError) {
      const cause = error.cause;
      return cause.statusCode === 503 || cause.statusCode === 500;
    }
    
    return false;
  }

  private async executeFallback<T>(
    endpoint: string,
    data: any,
    operationName: string
  ): Promise<T> {
    this.metrics.fallbackRequests++;

    loggingService.warn(`Using fallback for ${operationName}`, {
      module: 'EnhancedHuggingFaceClient',
      endpoint,
      fallbackType: this.config.fallbackToMock ? 'mock' : 'default'
    });

    if (this.config.fallbackToMock) {
      // Map endpoint to mock client method
      return await this.mapToMockClient(endpoint, data, operationName) as T;
    }

    // Default fallback - return empty/default response
    throw new AIServiceError(
      'Service unavailable and no fallback configured',
      'HuggingFace',
      operationName,
      503,
      { retryable: true }
    );
  }

  private async mapToMockClient(endpoint: string, data: any, operationName: string): Promise<any> {
    // Map HuggingFace endpoints to mock client methods
    if (endpoint.includes('trocr-base-printed')) {
      return await mockHuggingFaceClient.analyzePropertyDocument(data.inputs);
    }
    
    if (endpoint.includes('vit-base-patch16-224')) {
      return await mockHuggingFaceClient.analyzeLandImage(data.inputs);
    }
    
    if (endpoint.includes('legal-bert') || endpoint.includes('bart-large-mnli')) {
      return await mockHuggingFaceClient.classifyLegalDocument(data.inputs);
    }
    
    if (endpoint.includes('twitter-roberta-base-sentiment')) {
      return await mockHuggingFaceClient.analyzePropertyReviewSentiment(data.inputs);
    }
    
    if (endpoint.includes('opus-mt-') || endpoint.includes('mbart-large')) {
      return await mockHuggingFaceClient.translateText(data.inputs, 'en');
    }
    
    if (endpoint.includes('roberta-base-squad2')) {
      return await mockHuggingFaceClient.extractPropertyInfo(
        data.inputs.context,
        data.inputs.question
      );
    }
    
    if (endpoint.includes('bart-large-cnn')) {
      return await mockHuggingFaceClient.summarizePropertyDocument(data.inputs);
    }

    // Default fallback
    throw new AIServiceError(
      `No mock fallback available for ${operationName}`,
      'HuggingFace',
      operationName,
      503
    );
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    if (!this.config.enableMetrics) return;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalSuccessful = this.metrics.successfulRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalSuccessful - 1) + responseTime) / totalSuccessful;
  }

  // Public API methods with enhanced error handling
  async analyzePropertyDocument(
    imageBase64: string,
    documentType: 'deed' | 'survey' | 'permit' | 'contract' = 'deed'
  ): Promise<DocumentAnalysisResult> {
    const result = await this.makeRequest<Array<{ generated_text: string }>>(
      '/models/microsoft/trocr-base-printed',
      { inputs: imageBase64 },
      { operationName: 'analyzePropertyDocument', timeout: 45000 }
    );

    if (!result || !Array.isArray(result) || !result[0]?.generated_text) {
      throw new AIServiceError(
        'Invalid response format from document analysis',
        'HuggingFace',
        'analyzePropertyDocument',
        500,
        { retryable: false }
      );
    }

    return {
      text: result[0].generated_text,
      confidence: 0.85,
      entities: []
    };
  }

  async analyzeLandImage(imageBase64: string): Promise<ImageAnalysisResult> {
    const result = await this.makeRequest<Array<{ label: string; score: number }>>(
      '/models/google/vit-base-patch16-224',
      { inputs: imageBase64 },
      { operationName: 'analyzeLandImage', timeout: 30000 }
    );

    if (!result || !Array.isArray(result)) {
      throw new AIServiceError(
        'Invalid response format from image analysis',
        'HuggingFace',
        'analyzeLandImage',
        500,
        { retryable: false }
      );
    }

    const labels = result.map(item => ({
      label: item.label,
      confidence: item.score,
    }));

    return {
      labels,
      description: `Land appears to contain: ${labels.slice(0, 3).map(l => l.label).join(', ')}`
    };
  }

  async classifyLegalDocument(text: string): Promise<TextClassificationResult> {
    const result = await this.makeRequest<Array<Array<{ label: string; score: number }>>>(
      '/models/nlpaueb/legal-bert-base-uncased',
      { inputs: text },
      { operationName: 'classifyLegalDocument', timeout: 20000 }
    );

    if (!result || !Array.isArray(result) || !result[0]?.[0]) {
      throw new AIServiceError(
        'Invalid response format from document classification',
        'HuggingFace',
        'classifyLegalDocument',
        500,
        { retryable: false }
      );
    }

    return {
      label: result[0][0].label,
      confidence: result[0][0].score
    };
  }

  async analyzePropertyReviewSentiment(review: string): Promise<TextClassificationResult> {
    return await this.makeRequest<TextClassificationResult>(
      '/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      { inputs: review },
      { operationName: 'analyzePropertyReviewSentiment', timeout: 15000 }
    );
  }

  async translateText(
    text: string,
    targetLanguage: string = 'en',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const modelName = sourceLanguage 
      ? `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`
      : 'facebook/mbart-large-50-many-to-many-mmt';

    return await this.makeRequest<TranslationResult>(
      `/models/${modelName}`,
      { inputs: text },
      { operationName: 'translateText', timeout: 25000 }
    );
  }

  async extractPropertyInfo(
    propertyDescription: string,
    question: string
  ): Promise<{ answer: string; confidence: number }> {
    return await this.makeRequest<{ answer: string; confidence: number }>(
      '/models/deepset/roberta-base-squad2',
      { inputs: { question, context: propertyDescription } },
      { operationName: 'extractPropertyInfo', timeout: 20000 }
    );
  }

  async summarizePropertyDocument(text: string): Promise<string> {
    const result = await this.makeRequest<Array<{ summary_text: string }>>(
      '/models/facebook/bart-large-cnn',
      { 
        inputs: text,
        parameters: { max_length: 150, min_length: 50 }
      },
      { operationName: 'summarizePropertyDocument', timeout: 30000 }
    );

    return result[0]?.summary_text || 'Unable to generate summary';
  }

  async detectFraudIndicators(documentText: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    indicators: string[];
    confidence: number;
  }> {
    try {
      const suspiciousPatterns = [
        'fraudulent_document',
        'forged_signature',
        'altered_dates',
        'suspicious_pricing',
        'fake_credentials',
      ];

      const classification = await this.makeRequest<{ labels: string[]; scores: number[] }>(
        '/models/facebook/bart-large-mnli',
        {
          inputs: documentText,
          parameters: { candidate_labels: suspiciousPatterns }
        },
        { operationName: 'detectFraudIndicators', timeout: 25000 }
      );

      const topLabel = classification.labels[0];
      const confidence = classification.scores[0];
      
      const riskLevel = confidence > 0.7 ? 'high' : 
                       confidence > 0.4 ? 'medium' : 'low';

      return {
        riskLevel,
        indicators: confidence > 0.4 ? [topLabel] : [],
        confidence
      };
    } catch (error) {
      loggingService.warn('Fraud detection failed, returning safe default', {
        module: 'EnhancedHuggingFaceClient',
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        riskLevel: 'low',
        indicators: [],
        confidence: 0
      };
    }
  }

  // Utility methods
  getMetrics() {
    return { ...this.metrics };
  }

  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    circuitBreakerState: CircuitBreakerState;
    metrics: typeof this.metrics;
    lastError?: string;
  }> {
    const circuitBreakerState = this.getCircuitBreakerState();
    const metrics = this.getMetrics();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (circuitBreakerState === CircuitBreakerState.OPEN) {
      status = 'unhealthy';
    } else if (circuitBreakerState === CircuitBreakerState.HALF_OPEN || 
               metrics.fallbackRequests > metrics.successfulRequests * 0.1) {
      status = 'degraded';
    }

    return {
      status,
      circuitBreakerState,
      metrics
    };
  }
}

// Export singleton instance
export const enhancedHuggingFaceClient = new EnhancedHuggingFaceApiClient();

// Export utility functions with enhanced error handling
export const enhancedLandVerificationAI = {
  async analyzePropertyDocument(imageBase64: string, documentType?: 'deed' | 'survey' | 'permit' | 'contract') {
    return enhancedHuggingFaceClient.analyzePropertyDocument(imageBase64, documentType);
  },

  async analyzeLandImage(imageBase64: string) {
    return enhancedHuggingFaceClient.analyzeLandImage(imageBase64);
  },

  async classifyLegalDocument(text: string) {
    return enhancedHuggingFaceClient.classifyLegalDocument(text);
  },

  async analyzePropertyReview(review: string) {
    return enhancedHuggingFaceClient.analyzePropertyReviewSentiment(review);
  },

  async translatePropertyDescription(text: string, targetLanguage: string) {
    return enhancedHuggingFaceClient.translateText(text, targetLanguage);
  },

  async extractPropertyDetails(description: string, question: string) {
    return enhancedHuggingFaceClient.extractPropertyInfo(description, question);
  },

  async summarizeDocument(text: string) {
    return enhancedHuggingFaceClient.summarizePropertyDocument(text);
  },

  async checkDocumentAuthenticity(text: string) {
    return enhancedHuggingFaceClient.detectFraudIndicators(text);
  },

  // Utility methods
  getHealthStatus() {
    return enhancedHuggingFaceClient.healthCheck();
  },

  getMetrics() {
    return enhancedHuggingFaceClient.getMetrics();
  }
};