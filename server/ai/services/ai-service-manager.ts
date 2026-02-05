/**
 * AI Service Manager - Central orchestrator for all AI services
 * 
 * Provides unified access to all AI services including:
 * - PropertyAnalysisAI for automated property valuation
 * - DocumentProcessingAI for OCR and document validation
 * - FraudDetectionAI for pattern recognition and fraud detection
 * - RecommendationAI for personalized property suggestions
 * 
 * Features:
 * - Service initialization and health monitoring
 * - Unified error handling and logging
 * - Performance monitoring and metrics collection
 * - Service discovery and routing
 * - Configuration management
 */

import { logger as loggingService } from '..\..\infrastructure\monitoring\logger';
import { PropertyAnalysisAI, PropertyData as PropertyAnalysisData, ValuationResult, RiskAssessment, PropertyInsights } from './property-analysis-ai.service';
import { DocumentProcessingAI, DocumentInput, DocumentProcessingResult, OCRResult, AuthenticityResult, DocumentClassification } from './document-processing-ai.service';
import { FraudDetectionAI, TransactionData, UserBehaviorData, DocumentFraudData, FraudAnalysisResult, PatternAnalysisResult } from './fraud-detection-ai.service';
import { RecommendationAI, UserPreferences, PropertyData as RecommendationPropertyData, RecommendationResponse } from './recommendation-ai.service';
import { AIServiceError } from '../../../src/shared/services/enhanced-huggingface-client';

export interface AIServiceConfig {
  propertyAnalysis: {
    enabled: boolean;
    maxConcurrentRequests?: number;
    timeout?: number;
  };
  documentProcessing: {
    enabled: boolean;
    maxConcurrentRequests?: number;
    timeout?: number;
    supportedFormats?: string[];
  };
  fraudDetection: {
    enabled: boolean;
    maxConcurrentRequests?: number;
    timeout?: number;
    riskThresholds?: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  recommendation: {
    enabled: boolean;
    maxConcurrentRequests?: number;
    timeout?: number;
    maxRecommendations?: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval?: number;
    healthCheckInterval?: number;
  };
}

export interface ServiceHealthStatus {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  lastCheck: Date;
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  details?: Record<string, any>;
}

export interface AIServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  serviceHealth: ServiceHealthStatus[];
  lastUpdated: Date;
}

export interface ServiceRequest {
  requestId: string;
  service: string;
  operation: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ServiceResponse<T = any> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AIServiceManager {
  private readonly serviceName = 'AIServiceManager';
  private readonly services: Map<string, any> = new Map();
  private readonly config: AIServiceConfig;
  private readonly metrics: AIServiceMetrics;
  private readonly activeRequests: Map<string, ServiceRequest> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      propertyAnalysis: {
        enabled: true,
        maxConcurrentRequests: 10,
        timeout: 30000,
        ...config.propertyAnalysis
      },
      documentProcessing: {
        enabled: true,
        maxConcurrentRequests: 5,
        timeout: 45000,
        supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        ...config.documentProcessing
      },
      fraudDetection: {
        enabled: true,
        maxConcurrentRequests: 15,
        timeout: 20000,
        riskThresholds: {
          low: 25,
          medium: 50,
          high: 75,
          critical: 90
        },
        ...config.fraudDetection
      },
      recommendation: {
        enabled: true,
        maxConcurrentRequests: 8,
        timeout: 25000,
        maxRecommendations: 20,
        ...config.recommendation
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000, // 1 minute
        healthCheckInterval: 300000, // 5 minutes
        ...config.monitoring
      }
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      serviceHealth: [],
      lastUpdated: new Date()
    };

    this.initializeServices();
    this.startMonitoring();

    loggingService.info('AI Service Manager initialized', {
      module: this.serviceName,
      enabledServices: this.getEnabledServices(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Property Analysis Service Methods
   */
  async analyzePropertyValue(propertyData: PropertyAnalysisData): Promise<ServiceResponse<ValuationResult>> {
    return this.executeServiceRequest(
      'propertyAnalysis',
      'analyzePropertyValue',
      async () => {
        const service = this.getService('propertyAnalysis') as PropertyAnalysisAI;
        return await service.analyzePropertyValue(propertyData);
      },
      { propertyId: propertyData.id }
    );
  }

  async assessPropertyRisk(propertyData: PropertyAnalysisData): Promise<ServiceResponse<RiskAssessment>> {
    return this.executeServiceRequest(
      'propertyAnalysis',
      'assessPropertyRisk',
      async () => {
        const service = this.getService('propertyAnalysis') as PropertyAnalysisAI;
        return await service.assessPropertyRisk(propertyData);
      },
      { propertyId: propertyData.id }
    );
  }

  async generatePropertyInsights(propertyData: PropertyAnalysisData): Promise<ServiceResponse<PropertyInsights>> {
    return this.executeServiceRequest(
      'propertyAnalysis',
      'generatePropertyInsights',
      async () => {
        const service = this.getService('propertyAnalysis') as PropertyAnalysisAI;
        return await service.generatePropertyInsights(propertyData);
      },
      { propertyId: propertyData.id }
    );
  }

  /**
   * Document Processing Service Methods
   */
  async extractDocumentData(document: DocumentInput): Promise<ServiceResponse<OCRResult>> {
    return this.executeServiceRequest(
      'documentProcessing',
      'extractDocumentData',
      async () => {
        const service = this.getService('documentProcessing') as DocumentProcessingAI;
        return await service.extractDocumentData(document);
      },
      { documentId: document.id, documentType: document.type }
    );
  }

  async validateDocumentAuthenticity(document: DocumentInput): Promise<ServiceResponse<AuthenticityResult>> {
    return this.executeServiceRequest(
      'documentProcessing',
      'validateDocumentAuthenticity',
      async () => {
        const service = this.getService('documentProcessing') as DocumentProcessingAI;
        return await service.validateDocumentAuthenticity(document);
      },
      { documentId: document.id, documentType: document.type }
    );
  }

  async classifyDocument(document: DocumentInput): Promise<ServiceResponse<DocumentClassification>> {
    return this.executeServiceRequest(
      'documentProcessing',
      'classifyDocument',
      async () => {
        const service = this.getService('documentProcessing') as DocumentProcessingAI;
        return await service.classifyDocument(document);
      },
      { documentId: document.id }
    );
  }

  async processDocument(document: DocumentInput): Promise<ServiceResponse<DocumentProcessingResult>> {
    return this.executeServiceRequest(
      'documentProcessing',
      'processDocument',
      async () => {
        const service = this.getService('documentProcessing') as DocumentProcessingAI;
        return await service.processDocument(document);
      },
      { documentId: document.id, documentType: document.type }
    );
  }

  /**
   * Fraud Detection Service Methods
   */
  async analyzeTransaction(
    transactionData: TransactionData,
    userBehavior?: UserBehaviorData,
    historicalData?: TransactionData[]
  ): Promise<ServiceResponse<FraudAnalysisResult>> {
    return this.executeServiceRequest(
      'fraudDetection',
      'analyzeTransaction',
      async () => {
        const service = this.getService('fraudDetection') as FraudDetectionAI;
        return await service.analyzeTransaction(transactionData, userBehavior, historicalData);
      },
      { 
        transactionId: transactionData.id,
        amount: transactionData.amount,
        hasUserBehavior: !!userBehavior,
        hasHistoricalData: !!historicalData
      }
    );
  }

  async detectDocumentFraud(documentData: DocumentFraudData): Promise<ServiceResponse<FraudAnalysisResult>> {
    return this.executeServiceRequest(
      'fraudDetection',
      'detectDocumentFraud',
      async () => {
        const service = this.getService('fraudDetection') as FraudDetectionAI;
        return await service.detectDocumentFraud(documentData);
      },
      { documentId: documentData.documentId, documentType: documentData.documentType }
    );
  }

  async analyzePatterns(
    transactions: TransactionData[],
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ServiceResponse<PatternAnalysisResult>> {
    return this.executeServiceRequest(
      'fraudDetection',
      'analyzePatterns',
      async () => {
        const service = this.getService('fraudDetection') as FraudDetectionAI;
        return await service.analyzePatterns(transactions, timeframe);
      },
      { transactionCount: transactions.length, timeframe }
    );
  }

  /**
   * Recommendation Service Methods
   */
  async generateRecommendations(
    userPreferences: UserPreferences,
    availableProperties: RecommendationPropertyData[]
  ): Promise<ServiceResponse<RecommendationResponse>> {
    return this.executeServiceRequest(
      'recommendation',
      'generateRecommendations',
      async () => {
        const service = this.getService('recommendation') as RecommendationAI;
        return await service.generateRecommendations(userPreferences, availableProperties);
      },
      { 
        userId: userPreferences.userId,
        propertyCount: availableProperties.length,
        budget: `${userPreferences.budget.min}-${userPreferences.budget.max}`
      }
    );
  }

  async findSimilarProperties(
    targetProperty: RecommendationPropertyData,
    availableProperties: RecommendationPropertyData[],
    similarityThreshold: number = 0.7
  ): Promise<ServiceResponse<Array<{ property: RecommendationPropertyData; similarity: number; reasons: string[] }>>> {
    return this.executeServiceRequest(
      'recommendation',
      'findSimilarProperties',
      async () => {
        const service = this.getService('recommendation') as RecommendationAI;
        return await service.findSimilarProperties(targetProperty, availableProperties, similarityThreshold);
      },
      { 
        targetPropertyId: targetProperty.id,
        availableCount: availableProperties.length,
        threshold: similarityThreshold
      }
    );
  }

  /**
   * Service Management Methods
   */
  getServiceHealth(): ServiceHealthStatus[] {
    return this.metrics.serviceHealth;
  }

  getServiceMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }

  async performHealthCheck(): Promise<ServiceHealthStatus[]> {
    const healthChecks = [];

    for (const [serviceName, service] of this.services) {
      const startTime = Date.now();
      let status: ServiceHealthStatus;

      try {
        // Perform a lightweight health check for each service
        await this.performServiceHealthCheck(serviceName, service);
        const responseTime = Date.now() - startTime;

        status = {
          serviceName,
          status: 'healthy',
          lastCheck: new Date(),
          responseTime,
          errorRate: this.calculateServiceErrorRate(serviceName),
          uptime: this.calculateServiceUptime(serviceName)
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        status = {
          serviceName,
          status: 'unhealthy',
          lastCheck: new Date(),
          responseTime,
          errorRate: this.calculateServiceErrorRate(serviceName),
          uptime: this.calculateServiceUptime(serviceName),
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        };
      }

      healthChecks.push(status);
    }

    this.metrics.serviceHealth = healthChecks;
    return healthChecks;
  }

  getEnabledServices(): string[] {
    return Array.from(this.services.keys()).filter(serviceName => 
      this.config[serviceName as keyof AIServiceConfig]?.enabled
    );
  }

  async shutdown(): Promise<void> {
    loggingService.info('Shutting down AI Service Manager', {
      module: this.serviceName
    });

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Wait for active requests to complete (with timeout)
    const activeRequestIds = Array.from(this.activeRequests.keys());
    if (activeRequestIds.length > 0) {
      loggingService.info('Waiting for active requests to complete', {
        module: this.serviceName,
        activeRequests: activeRequestIds.length
      });

      // Wait up to 30 seconds for requests to complete
      const timeout = setTimeout(() => {
        loggingService.warn('Shutdown timeout reached, forcing shutdown', {
          module: this.serviceName,
          remainingRequests: this.activeRequests.size
        });
      }, 30000);

      while (this.activeRequests.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      clearTimeout(timeout);
    }

    loggingService.info('AI Service Manager shutdown complete', {
      module: this.serviceName
    });
  }

  // Private helper methods

  private initializeServices(): void {
    // Initialize PropertyAnalysisAI
    if (this.config.propertyAnalysis.enabled) {
      this.services.set('propertyAnalysis', new PropertyAnalysisAI());
      loggingService.info('PropertyAnalysisAI service initialized', {
        module: this.serviceName
      });
    }

    // Initialize DocumentProcessingAI
    if (this.config.documentProcessing.enabled) {
      this.services.set('documentProcessing', new DocumentProcessingAI());
      loggingService.info('DocumentProcessingAI service initialized', {
        module: this.serviceName
      });
    }

    // Initialize FraudDetectionAI
    if (this.config.fraudDetection.enabled) {
      this.services.set('fraudDetection', new FraudDetectionAI());
      loggingService.info('FraudDetectionAI service initialized', {
        module: this.serviceName
      });
    }

    // Initialize RecommendationAI
    if (this.config.recommendation.enabled) {
      this.services.set('recommendation', new RecommendationAI());
      loggingService.info('RecommendationAI service initialized', {
        module: this.serviceName
      });
    }
  }

  private getService(serviceName: string): any {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new AIServiceError(
        `Service ${serviceName} is not available`,
        this.serviceName,
        'getService',
        503,
        { retryable: false }
      );
    }
    return service;
  }

  private async executeServiceRequest<T>(
    serviceName: string,
    operation: string,
    serviceCall: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<ServiceResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const request: ServiceRequest = {
      requestId,
      service: serviceName,
      operation,
      timestamp: new Date(),
      metadata
    };

    this.activeRequests.set(requestId, request);
    this.metrics.totalRequests++;

    try {
      // Check if service is enabled
      const serviceConfig = this.config[serviceName as keyof AIServiceConfig];
      if (!serviceConfig?.enabled) {
        throw new AIServiceError(
          `Service ${serviceName} is disabled`,
          this.serviceName,
          operation,
          503,
          { retryable: false }
        );
      }

      // Check concurrent request limits
      const activeServiceRequests = Array.from(this.activeRequests.values())
        .filter(req => req.service === serviceName).length;

      if (activeServiceRequests > (serviceConfig.maxConcurrentRequests || 10)) {
        throw new AIServiceError(
          `Service ${serviceName} has reached maximum concurrent requests`,
          this.serviceName,
          operation,
          429,
          { retryable: true }
        );
      }

      // Execute service call with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIServiceError(
            `Service ${serviceName} operation ${operation} timed out`,
            this.serviceName,
            operation,
            408,
            { retryable: true }
          ));
        }, serviceConfig.timeout || 30000);
      });

      const result = await Promise.race([serviceCall(), timeoutPromise]);
      const processingTime = Date.now() - startTime;

      // Update metrics
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(processingTime);

      const response: ServiceResponse<T> = {
        requestId,
        success: true,
        data: result,
        processingTime,
        timestamp: new Date(),
        metadata
      };

      loggingService.info('Service request completed successfully', {
        module: this.serviceName,
        requestId,
        service: serviceName,
        operation,
        processingTime
      });

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.metrics.failedRequests++;
      this.updateAverageResponseTime(processingTime);

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      loggingService.error('Service request failed', {
        module: this.serviceName,
        requestId,
        service: serviceName,
        operation,
        error: errorMessage,
        processingTime
      });

      const response: ServiceResponse<T> = {
        requestId,
        success: false,
        error: errorMessage,
        processingTime,
        timestamp: new Date(),
        metadata
      };

      return response;

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private startMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    // Health check interval
    if (this.config.monitoring.healthCheckInterval) {
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          loggingService.error('Health check failed', {
            module: this.serviceName,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }, this.config.monitoring.healthCheckInterval);
    }

    // Metrics update interval
    if (this.config.monitoring.metricsInterval) {
      this.metricsInterval = setInterval(() => {
        this.updateMetrics();
      }, this.config.monitoring.metricsInterval);
    }
  }

  private updateMetrics(): void {
    // Calculate requests per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // This is a simplified calculation - in production, you'd want to track requests over time
    this.metrics.requestsPerMinute = this.metrics.totalRequests; // Simplified

    // Calculate error rate
    this.metrics.errorRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0;

    this.metrics.lastUpdated = new Date();

    loggingService.debug('Metrics updated', {
      module: this.serviceName,
      metrics: {
        totalRequests: this.metrics.totalRequests,
        successRate: ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%',
        averageResponseTime: this.metrics.averageResponseTime.toFixed(2) + 'ms',
        errorRate: this.metrics.errorRate.toFixed(2) + '%'
      }
    });
  }

  private async performServiceHealthCheck(serviceName: string, service: any): Promise<void> {
    // Perform a lightweight health check - this is service-specific
    // For now, just check if the service exists and has expected methods
    const expectedMethods = {
      propertyAnalysis: ['analyzePropertyValue', 'assessPropertyRisk', 'generatePropertyInsights'],
      documentProcessing: ['extractDocumentData', 'validateDocumentAuthenticity', 'classifyDocument'],
      fraudDetection: ['analyzeTransaction', 'detectDocumentFraud', 'analyzePatterns'],
      recommendation: ['generateRecommendations', 'findSimilarProperties']
    };

    const methods = expectedMethods[serviceName as keyof typeof expectedMethods];
    if (methods) {
      for (const method of methods) {
        if (typeof service[method] !== 'function') {
          throw new Error(`Service ${serviceName} missing method ${method}`);
        }
      }
    }
  }

  private calculateServiceErrorRate(serviceName: string): number {
    // Simplified calculation - in production, track per-service metrics
    return this.metrics.errorRate;
  }

  private calculateServiceUptime(serviceName: string): number {
    // Simplified calculation - in production, track service start time and downtime
    return 99.9; // Mock 99.9% uptime
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager();

// Export convenience functions
export const propertyAnalysis = {
  analyzeValue: (data: PropertyAnalysisData) => aiServiceManager.analyzePropertyValue(data),
  assessRisk: (data: PropertyAnalysisData) => aiServiceManager.assessPropertyRisk(data),
  generateInsights: (data: PropertyAnalysisData) => aiServiceManager.generatePropertyInsights(data)
};

export const documentProcessing = {
  extractData: (document: DocumentInput) => aiServiceManager.extractDocumentData(document),
  validateAuthenticity: (document: DocumentInput) => aiServiceManager.validateDocumentAuthenticity(document),
  classify: (document: DocumentInput) => aiServiceManager.classifyDocument(document),
  processComplete: (document: DocumentInput) => aiServiceManager.processDocument(document)
};

export const fraudDetection = {
  analyzeTransaction: (
    transaction: TransactionData, 
    behavior?: UserBehaviorData, 
    history?: TransactionData[]
  ) => aiServiceManager.analyzeTransaction(transaction, behavior, history),
  detectDocumentFraud: (document: DocumentFraudData) => aiServiceManager.detectDocumentFraud(document),
  analyzePatterns: (transactions: TransactionData[], timeframe?: 'day' | 'week' | 'month' | 'year') => 
    aiServiceManager.analyzePatterns(transactions, timeframe)
};

export const recommendations = {
  generate: (preferences: UserPreferences, properties: RecommendationPropertyData[]) => 
    aiServiceManager.generateRecommendations(preferences, properties),
  findSimilar: (target: RecommendationPropertyData, available: RecommendationPropertyData[], threshold?: number) => 
    aiServiceManager.findSimilarProperties(target, available, threshold)
};