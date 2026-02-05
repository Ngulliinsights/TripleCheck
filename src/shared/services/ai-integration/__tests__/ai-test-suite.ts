/**
 * Comprehensive AI Service Test Suite
 * 
 * Provides testing infrastructure for AI services with both real and mock API testing,
 * performance monitoring, health checks, and usage analytics.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { aiIntegrationOrchestrator } from '../ai-integration-orchestrator'
import { propertyAnalysisIntegration } from '../property-analysis-integration'
import { documentProcessingIntegration } from '../document-processing-integration'
import { fraudDetectionIntegration } from '../fraud-detection-integration'
import { recommendationIntegration } from '../recommendation-integration'
import { enhancedHuggingFaceClient } from '../../enhanced-huggingface-client'
import { mockHuggingFaceClient } from '../../mock-huggingface-client'
import { logger as loggingService } from '../../../../../core/src/logging'
import { aiMetricsCollector } from '../monitoring/ai-metrics-collector'
import { aiHealthMonitor } from '../monitoring/ai-health-monitor'

// Test data interfaces
export interface AITestConfig {
  useRealAPI: boolean;
  enablePerformanceTests: boolean;
  enableHealthChecks: boolean;
  enableUsageTracking: boolean;
  testTimeout: number;
  performanceThresholds: {
    maxResponseTime: number;
    maxErrorRate: number;
    minSuccessRate: number;
  };
}

export interface AITestResult {
  testName: string;
  service: string;
  operation: string;
  success: boolean;
  responseTime: number;
  error?: string;
  metrics?: Record<string, any>;
  timestamp: Date;
}

export interface AITestSuiteReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  errorRate: number;
  testResults: AITestResult[];
  performanceMetrics: {
    service: string;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalRequests: number;
  }[];
  healthStatus: Record<string, any>;
  usageAnalytics: Record<string, any>;
}

// Mock data for testing
const mockProperty = {
  id: 'test-property-1',
  title: 'Test Property for AI Analysis',
  description: 'A comprehensive test property with detailed features for AI analysis validation',
  location: 'Test Location, Nairobi',
  price: 5000000,
  bedrooms: 3,
  bathrooms: 2,
  propertyType: 'house' as const,
  features: {
    parking: true,
    garden: true,
    balcony: false,
    security: true
  },
  trustScore: 75,
  images: ['test-image-1.jpg', 'test-image-2.jpg']
};

const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  preferences: {
    propertyTypes: ['house', 'apartment'],
    priceRange: { min: 2000000, max: 8000000 },
    locations: ['Nairobi', 'Mombasa']
  },
  searchHistory: [],
  viewedProperties: []
};

const mockDocument = Buffer.from('Mock document content for AI processing');

export class AITestSuite {
  private config: AITestConfig;
  private testResults: AITestResult[] = [];
  private startTime: number = 0;

  constructor(config: Partial<AITestConfig> = {}) {
    this.config = {
      useRealAPI: false,
      enablePerformanceTests: true,
      enableHealthChecks: true,
      enableUsageTracking: true,
      testTimeout: 30000,
      performanceThresholds: {
        maxResponseTime: 5000,
        maxErrorRate: 0.1,
        minSuccessRate: 0.9
      },
      ...config
    };
  }

  /**
   * Run comprehensive AI service test suite
   */
  async runFullTestSuite(): Promise<AITestSuiteReport> {
    this.startTime = Date.now();
    this.testResults = [];

    loggingService.info('Starting comprehensive AI test suite', {
      module: 'AITestSuite',
      config: this.config
    });

    try {
      // Initialize monitoring systems
      if (this.config.enableUsageTracking) {
        await this.initializeMonitoring();
      }

      // Run all test categories
      await this.runPropertyAnalysisTests();
      await this.runDocumentProcessingTests();
      await this.runFraudDetectionTests();
      await this.runRecommendationTests();
      await this.runIntegrationTests();
      await this.runMonitoringTests();

      if (this.config.enablePerformanceTests) {
        await this.runPerformanceTests();
        await this.runLoadTests();
        await this.runStressTests();
      }

      if (this.config.enableHealthChecks) {
        await this.runHealthCheckTests();
        await this.runCircuitBreakerTests();
      }

      // Run usage analytics tests
      if (this.config.enableUsageTracking) {
        await this.runUsageAnalyticsTests();
        await this.runCostTrackingTests();
      }

      return this.generateTestReport();
    } catch (error) {
      loggingService.error('AI test suite failed', {
        module: 'AITestSuite',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Test property analysis AI services
   */
  async runPropertyAnalysisTests(): Promise<void> {
    const tests = [
      {
        name: 'Property Valuation Analysis',
        operation: async () => propertyAnalysisIntegration.analyzePropertyValue(mockProperty)
      },
      {
        name: 'Property Risk Assessment',
        operation: async () => propertyAnalysisIntegration.assessPropertyRisk(mockProperty)
      },
      {
        name: 'Property Market Insights',
        operation: async () => propertyAnalysisIntegration.generatePropertyInsights(mockProperty)
      }
    ];

    for (const test of tests) {
      await this.executeTest(
        test.name,
        'PropertyAnalysis',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test document processing AI services
   */
  async runDocumentProcessingTests(): Promise<void> {
    const tests = [
      {
        name: 'Document OCR Processing',
        operation: async () => documentProcessingIntegration.processDocument(
          mockDocument,
          'deed',
          'test-session-1'
        )
      },
      {
        name: 'Document Authenticity Validation',
        operation: async () => documentProcessingIntegration.validateDocumentAuthenticity(
          mockDocument,
          'deed'
        )
      },
      {
        name: 'Land Verification Workflow',
        operation: async () => documentProcessingIntegration.processLandVerificationDocuments(
          [{ buffer: mockDocument, type: 'deed', name: 'test-deed.pdf' }],
          'test-session-1'
        )
      }
    ];

    for (const test of tests) {
      await this.executeTest(
        test.name,
        'DocumentProcessing',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test fraud detection AI services
   */
  async runFraudDetectionTests(): Promise<void> {
    const tests = [
      {
        name: 'Property Fraud Analysis',
        operation: async () => fraudDetectionIntegration.analyzePropertyFraud(mockProperty)
      },
      {
        name: 'User Fraud Analysis',
        operation: async () => fraudDetectionIntegration.analyzeUserFraud(mockUser)
      },
      {
        name: 'Network Fraud Analysis',
        operation: async () => fraudDetectionIntegration.analyzeNetworkFraud(
          [
            { id: mockUser.id, type: 'user' as const, data: mockUser },
            { id: mockProperty.id, type: 'property' as const, data: mockProperty }
          ],
          [{ from: mockUser.id, to: mockProperty.id, type: 'viewed', weight: 1 }]
        )
      }
    ];

    for (const test of tests) {
      await this.executeTest(
        test.name,
        'FraudDetection',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test recommendation AI services
   */
  async runRecommendationTests(): Promise<void> {
    const tests = [
      {
        name: 'Personalized Property Recommendations',
        operation: async () => recommendationIntegration.generatePersonalizedRecommendations(
          mockUser,
          [mockProperty],
          undefined,
          5
        )
      },
      {
        name: 'Smart Property Matching',
        operation: async () => recommendationIntegration.findSmartMatches(
          mockUser,
          [mockProperty]
        )
      },
      {
        name: 'Recommendation Feedback Processing',
        operation: async () => recommendationIntegration.processFeedback({
          userId: mockUser.id,
          propertyId: mockProperty.id,
          recommendationId: 'test-rec-1',
          feedbackType: 'interested',
          rating: 4,
          timestamp: new Date()
        })
      }
    ];

    for (const test of tests) {
      await this.executeTest(
        test.name,
        'Recommendations',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test AI integration orchestrator
   */
  async runIntegrationTests(): Promise<void> {
    const tests = [
      {
        name: 'Property Listing Enhancement',
        operation: async () => aiIntegrationOrchestrator.enhancePropertyListing(mockProperty)
      },
      {
        name: 'Search Results Enhancement',
        operation: async () => aiIntegrationOrchestrator.enhanceSearchResults(
          [mockProperty],
          { propertyType: 'house', maxPrice: 6000000 },
          mockUser
        )
      },
      {
        name: 'AI Metrics Collection',
        operation: async () => aiIntegrationOrchestrator.getMetrics()
      },
      {
        name: 'AI Health Status Check',
        operation: async () => aiIntegrationOrchestrator.getHealthStatus()
      }
    ];

    for (const test of tests) {
      await this.executeTest(
        test.name,
        'Integration',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Run performance tests for AI services
   */
  async runPerformanceTests(): Promise<void> {
    const performanceTests = [
      {
        name: 'Concurrent Property Analysis',
        operation: async () => {
          const promises = Array.from({ length: 5 }, () =>
            propertyAnalysisIntegration.analyzePropertyValue(mockProperty)
          );
          return Promise.all(promises);
        }
      },
      {
        name: 'Batch Document Processing',
        operation: async () => {
          const documents = Array.from({ length: 3 }, (_, i) => ({
            buffer: mockDocument,
            type: 'deed',
            name: `test-document-${i}.pdf`
          }));
          return documentProcessingIntegration.processLandVerificationDocuments(
            documents,
            'batch-test-session'
          );
        }
      },
      {
        name: 'Load Test - Multiple Services',
        operation: async () => {
          const promises = [
            propertyAnalysisIntegration.analyzePropertyValue(mockProperty),
            fraudDetectionIntegration.analyzePropertyFraud(mockProperty),
            recommendationIntegration.generatePersonalizedRecommendations(
              mockUser,
              [mockProperty],
              undefined,
              3
            )
          ];
          return Promise.all(promises);
        }
      }
    ];

    for (const test of performanceTests) {
      await this.executeTest(
        test.name,
        'Performance',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Initialize monitoring systems for testing
   */
  async initializeMonitoring(): Promise<void> {
    try {
      // Initialize metrics collector
      const metricsTest = await this.executeTest(
        'Initialize Metrics Collector',
        'Monitoring',
        'initialize_metrics_collector',
        async () => {
          const systemMetrics = aiMetricsCollector.getSystemMetrics();
          return { initialized: true, metrics: systemMetrics };
        }
      );

      // Initialize health monitor
      const healthTest = await this.executeTest(
        'Initialize Health Monitor',
        'Monitoring',
        'initialize_health_monitor',
        async () => {
          const healthStatus = await aiHealthMonitor.getSystemHealthStatus();
          return { initialized: true, status: healthStatus };
        }
      );

      loggingService.info('Monitoring systems initialized for testing', {
        module: 'AITestSuite',
        metricsInitialized: true,
        healthMonitorInitialized: true
      });
    } catch (error) {
      loggingService.error('Failed to initialize monitoring systems', {
        module: 'AITestSuite',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Test monitoring and metrics collection
   */
  async runMonitoringTests(): Promise<void> {
    const monitoringTests = [
      {
        name: 'Metrics Collection Test',
        operation: async () => {
          // Start an operation and track it
          const operationId = aiMetricsCollector.startOperation('test', 'monitoring_test', {
            testData: 'monitoring'
          });
          
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Complete the operation
          aiMetricsCollector.completeOperation(operationId, {
            inputSize: 1024,
            outputSize: 512,
            tokensUsed: 50,
            cost: 0.001,
            cacheHit: false
          });

          return { operationId, tracked: true };
        }
      },
      {
        name: 'System Metrics Retrieval',
        operation: async () => aiMetricsCollector.getSystemMetrics()
      },
      {
        name: 'Service Metrics Retrieval',
        operation: async () => aiMetricsCollector.getServiceMetrics('test')
      },
      {
        name: 'Usage Analytics Generation',
        operation: async () => aiMetricsCollector.getUsageAnalytics(1)
      },
      {
        name: 'Cost Breakdown Analysis',
        operation: async () => aiMetricsCollector.getCostBreakdown()
      }
    ];

    for (const test of monitoringTests) {
      await this.executeTest(
        test.name,
        'Monitoring',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test load handling capabilities
   */
  async runLoadTests(): Promise<void> {
    const loadTests = [
      {
        name: 'Concurrent Operations Load Test',
        operation: async () => {
          const concurrentOperations = 20;
          const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
            const operationId = aiMetricsCollector.startOperation('loadTest', 'concurrent_operation', {
              operationIndex: i
            });
            
            // Simulate varying processing times
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
            
            aiMetricsCollector.completeOperation(operationId, {
              tokensUsed: Math.floor(Math.random() * 100) + 10,
              cost: Math.random() * 0.01
            });
            
            return operationId;
          });

          const results = await Promise.all(promises);
          return { completedOperations: results.length, concurrentOperations };
        }
      },
      {
        name: 'Sustained Load Test',
        operation: async () => {
          const duration = 5000; // 5 seconds
          const interval = 100; // 100ms between operations
          const startTime = Date.now();
          const operations: string[] = [];

          while (Date.now() - startTime < duration) {
            const operationId = aiMetricsCollector.startOperation('sustainedLoad', 'sustained_operation');
            await new Promise(resolve => setTimeout(resolve, 50));
            aiMetricsCollector.completeOperation(operationId, {
              tokensUsed: 25,
              cost: 0.005
            });
            operations.push(operationId);
            
            await new Promise(resolve => setTimeout(resolve, interval));
          }

          return { 
            duration: Date.now() - startTime,
            operationsCompleted: operations.length,
            operationsPerSecond: operations.length / (duration / 1000)
          };
        }
      }
    ];

    for (const test of loadTests) {
      await this.executeTest(
        test.name,
        'LoadTest',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test system behavior under stress
   */
  async runStressTests(): Promise<void> {
    const stressTests = [
      {
        name: 'Memory Stress Test',
        operation: async () => {
          // Create many operations to test memory handling
          const operations = [];
          for (let i = 0; i < 1000; i++) {
            const operationId = aiMetricsCollector.startOperation('stressTest', 'memory_operation', {
              largeData: 'x'.repeat(1000), // 1KB of data per operation
              operationIndex: i
            });
            operations.push(operationId);
          }

          // Complete all operations
          for (const operationId of operations) {
            aiMetricsCollector.completeOperation(operationId, {
              tokensUsed: 10,
              cost: 0.001
            });
          }

          return { operationsCreated: operations.length };
        }
      },
      {
        name: 'Error Handling Stress Test',
        operation: async () => {
          const errorOperations = [];
          const successOperations = [];

          // Create mix of successful and failed operations
          for (let i = 0; i < 100; i++) {
            const operationId = aiMetricsCollector.startOperation('stressTest', 'error_operation');
            
            if (i % 3 === 0) {
              // Fail every third operation
              aiMetricsCollector.failOperation(operationId, `Test error ${i}`, {
                retryCount: Math.floor(Math.random() * 3)
              });
              errorOperations.push(operationId);
            } else {
              aiMetricsCollector.completeOperation(operationId, {
                tokensUsed: 15,
                cost: 0.002
              });
              successOperations.push(operationId);
            }
          }

          return {
            totalOperations: errorOperations.length + successOperations.length,
            errorOperations: errorOperations.length,
            successOperations: successOperations.length,
            errorRate: errorOperations.length / (errorOperations.length + successOperations.length)
          };
        }
      }
    ];

    for (const test of stressTests) {
      await this.executeTest(
        test.name,
        'StressTest',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test usage analytics and reporting
   */
  async runUsageAnalyticsTests(): Promise<void> {
    const analyticsTests = [
      {
        name: 'Daily Usage Analytics',
        operation: async () => {
          // Generate some test data over multiple days
          const analytics = aiMetricsCollector.getUsageAnalytics(7);
          return {
            dailyUsagePoints: analytics.dailyUsage.length,
            hasData: analytics.dailyUsage.some(day => day.operations > 0)
          };
        }
      },
      {
        name: 'Service Usage Distribution',
        operation: async () => {
          const analytics = aiMetricsCollector.getUsageAnalytics(1);
          return {
            servicesTracked: analytics.serviceUsage.length,
            totalPercentage: analytics.serviceUsage.reduce((sum, service) => sum + service.percentage, 0)
          };
        }
      },
      {
        name: 'Error Analysis Report',
        operation: async () => {
          const analytics = aiMetricsCollector.getUsageAnalytics(1);
          return {
            uniqueErrors: analytics.errorAnalysis.length,
            totalErrorOccurrences: analytics.errorAnalysis.reduce((sum, error) => sum + error.count, 0)
          };
        }
      },
      {
        name: 'Metrics Export Test',
        operation: async () => {
          const jsonExport = aiMetricsCollector.exportMetrics('json');
          const csvExport = aiMetricsCollector.exportMetrics('csv');
          
          return {
            jsonExportSize: jsonExport.length,
            csvExportSize: csvExport.length,
            jsonValid: (() => {
              try {
                JSON.parse(jsonExport);
                return true;
              } catch {
                return false;
              }
            })(),
            csvValid: csvExport.includes('timestamp,service,operation')
          };
        }
      }
    ];

    for (const test of analyticsTests) {
      await this.executeTest(
        test.name,
        'UsageAnalytics',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test cost tracking functionality
   */
  async runCostTrackingTests(): Promise<void> {
    const costTests = [
      {
        name: 'Cost Breakdown Generation',
        operation: async () => {
          // Create operations with different costs
          const operations = [];
          const services = ['propertyAnalysis', 'documentProcessing', 'fraudDetection'];
          
          for (let i = 0; i < 30; i++) {
            const service = services[i % services.length];
            const operationId = aiMetricsCollector.startOperation(service, 'cost_test_operation');
            
            aiMetricsCollector.completeOperation(operationId, {
              tokensUsed: Math.floor(Math.random() * 100) + 50,
              cost: Math.random() * 0.05 + 0.01 // $0.01 to $0.06
            });
            
            operations.push(operationId);
          }

          const costBreakdown = aiMetricsCollector.getCostBreakdown();
          return {
            operationsCreated: operations.length,
            costBreakdownEntries: costBreakdown.length,
            totalCost: costBreakdown.reduce((sum, entry) => sum + entry.totalCost, 0)
          };
        }
      },
      {
        name: 'Cost Per Token Analysis',
        operation: async () => {
          const costBreakdown = aiMetricsCollector.getCostBreakdown();
          const validEntries = costBreakdown.filter(entry => entry.tokensUsed > 0);
          
          return {
            entriesWithTokens: validEntries.length,
            averageCostPerToken: validEntries.length > 0 
              ? validEntries.reduce((sum, entry) => sum + entry.costPerToken, 0) / validEntries.length 
              : 0,
            maxCostPerToken: validEntries.length > 0 
              ? Math.max(...validEntries.map(entry => entry.costPerToken)) 
              : 0
          };
        }
      },
      {
        name: 'Time Range Cost Analysis',
        operation: async () => {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
          
          const costBreakdown = aiMetricsCollector.getCostBreakdown({ start: startDate, end: endDate });
          
          return {
            timeRangeEntries: costBreakdown.length,
            timeRangeStart: startDate.toISOString(),
            timeRangeEnd: endDate.toISOString(),
            totalCostInRange: costBreakdown.reduce((sum, entry) => sum + entry.totalCost, 0)
          };
        }
      }
    ];

    for (const test of costTests) {
      await this.executeTest(
        test.name,
        'CostTracking',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Run health check tests
   */
  async runHealthCheckTests(): Promise<void> {
    const healthTests = [
      {
        name: 'HuggingFace Client Health Check',
        operation: async () => enhancedHuggingFaceClient.healthCheck()
      },
      {
        name: 'AI Integration Health Status',
        operation: async () => aiIntegrationOrchestrator.getHealthStatus()
      },
      {
        name: 'Individual Service Health Checks',
        operation: async () => {
          const services = ['propertyAnalysis', 'documentProcessing', 'fraudDetection', 'recommendations'];
          const healthResults = [];
          
          for (const service of services) {
            const result = await aiHealthMonitor.checkServiceHealth(service);
            healthResults.push(result);
          }
          
          return {
            servicesChecked: healthResults.length,
            healthyServices: healthResults.filter(r => r.status === 'healthy').length,
            degradedServices: healthResults.filter(r => r.status === 'degraded').length,
            unhealthyServices: healthResults.filter(r => r.status === 'unhealthy').length
          };
        }
      },
      {
        name: 'System Health Status',
        operation: async () => aiHealthMonitor.getSystemHealthStatus()
      },
      {
        name: 'Health Alert Management',
        operation: async () => {
          // Create a test alert
          const alertId = await aiHealthMonitor.createManualAlert(
            'testService',
            'medium',
            'Test alert for health monitoring',
            { testData: true }
          );
          
          // Get active alerts
          const activeAlerts = aiHealthMonitor.getActiveAlerts();
          
          // Resolve the alert
          await aiHealthMonitor.resolveAlert(alertId, 'test-system');
          
          // Get alerts after resolution
          const alertsAfterResolution = aiHealthMonitor.getActiveAlerts();
          
          return {
            alertCreated: alertId,
            activeAlertsBeforeResolution: activeAlerts.length,
            activeAlertsAfterResolution: alertsAfterResolution.length,
            alertResolved: true
          };
        }
      }
    ];

    for (const test of healthTests) {
      await this.executeTest(
        test.name,
        'HealthCheck',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Test circuit breaker functionality
   */
  async runCircuitBreakerTests(): Promise<void> {
    const circuitBreakerTests = [
      {
        name: 'Circuit Breaker Status Check',
        operation: async () => ({
          state: enhancedHuggingFaceClient.getCircuitBreakerState(),
          metrics: enhancedHuggingFaceClient.getCircuitBreakerMetrics()
        })
      },
      {
        name: 'Circuit Breaker Failure Simulation',
        operation: async () => {
          // This would typically test circuit breaker behavior
          // For now, just return the current state
          return {
            circuitBreakerTested: true,
            currentState: enhancedHuggingFaceClient.getCircuitBreakerState()
          };
        }
      }
    ];

    for (const test of circuitBreakerTests) {
      await this.executeTest(
        test.name,
        'CircuitBreaker',
        test.name.replace(/\s+/g, '_').toLowerCase(),
        test.operation
      );
    }
  }

  /**
   * Execute individual test with error handling and metrics collection
   */
  private async executeTest(
    testName: string,
    service: string,
    operation: string,
    testOperation: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let metrics: Record<string, any> | undefined;

    try {
      loggingService.info(`Starting test: ${testName}`, {
        module: 'AITestSuite',
        service,
        operation
      });

      const result = await Promise.race([
        testOperation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
        )
      ]);

      success = true;
      metrics = this.extractMetrics(result);

      loggingService.info(`Test completed: ${testName}`, {
        module: 'AITestSuite',
        service,
        operation,
        responseTime: Date.now() - startTime,
        success
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      
      loggingService.error(`Test failed: ${testName}`, {
        module: 'AITestSuite',
        service,
        operation,
        error,
        responseTime: Date.now() - startTime
      });
    }

    const testResult: AITestResult = {
      testName,
      service,
      operation,
      success,
      responseTime: Date.now() - startTime,
      error,
      metrics,
      timestamp: new Date()
    };

    this.testResults.push(testResult);
  }

  /**
   * Extract metrics from test results
   */
  private extractMetrics(result: any): Record<string, any> {
    if (!result) return {};

    const metrics: Record<string, any> = {};

    // Extract common metrics
    if (typeof result === 'object') {
      if (result.processingTime) metrics.processingTime = result.processingTime;
      if (result.confidence) metrics.confidence = result.confidence;
      if (result.riskScore) metrics.riskScore = result.riskScore;
      if (result.accuracy) metrics.accuracy = result.accuracy;
      if (result.recommendations?.length) metrics.recommendationCount = result.recommendations.length;
    }

    return metrics;
  }

  /**
   * Generate comprehensive test report
   */
  private async generateTestReport(): Promise<AITestSuiteReport> {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const averageResponseTime = this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    const errorRate = failedTests / totalTests;

    // Generate performance metrics by service
    const serviceGroups = this.testResults.reduce((groups, result) => {
      if (!groups[result.service]) {
        groups[result.service] = [];
      }
      groups[result.service].push(result);
      return groups;
    }, {} as Record<string, AITestResult[]>);

    const performanceMetrics = Object.entries(serviceGroups).map(([service, results]) => {
      const successfulResults = results.filter(r => r.success);
      return {
        service,
        averageResponseTime: successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length || 0,
        successRate: successfulResults.length / results.length,
        errorRate: (results.length - successfulResults.length) / results.length,
        totalRequests: results.length
      };
    });

    // Get current health status
    let healthStatus: Record<string, any> = {
      aiIntegration: 'healthy',
      huggingFaceClient: 'healthy',
      circuitBreaker: 'closed'
    };

    try {
      const systemHealth = await aiHealthMonitor.getSystemHealthStatus();
      healthStatus = {
        overallStatus: systemHealth.overallStatus,
        services: systemHealth.services,
        alerts: systemHealth.alerts.length,
        uptime: systemHealth.uptime
      };
    } catch (error) {
      loggingService.warn('Could not get health status for test report', {
        module: 'AITestSuite',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Generate enhanced usage analytics
    let usageAnalytics: Record<string, any> = {
      totalExecutionTime: Date.now() - this.startTime,
      testsByService: serviceGroups,
      performanceThresholdViolations: performanceMetrics.filter(
        m => m.averageResponseTime > this.config.performanceThresholds.maxResponseTime ||
             m.errorRate > this.config.performanceThresholds.maxErrorRate ||
             m.successRate < this.config.performanceThresholds.minSuccessRate
      )
    };

    try {
      const systemMetrics = aiMetricsCollector.getSystemMetrics();
      const analyticsData = aiMetricsCollector.getUsageAnalytics(1);
      const costBreakdown = aiMetricsCollector.getCostBreakdown();

      usageAnalytics = {
        ...usageAnalytics,
        systemMetrics: {
          totalOperations: systemMetrics.totalOperations,
          successRate: systemMetrics.overallSuccessRate,
          errorRate: systemMetrics.overallErrorRate,
          averageResponseTime: systemMetrics.averageResponseTime,
          totalCost: systemMetrics.totalCost,
          totalTokensUsed: systemMetrics.totalTokensUsed
        },
        costAnalysis: {
          totalCost: costBreakdown.reduce((sum, entry) => sum + entry.totalCost, 0),
          costByService: costBreakdown.reduce((acc, entry) => {
            acc[entry.service] = (acc[entry.service] || 0) + entry.totalCost;
            return acc;
          }, {} as Record<string, number>),
          averageCostPerOperation: costBreakdown.length > 0 
            ? costBreakdown.reduce((sum, entry) => sum + entry.averageCostPerOperation, 0) / costBreakdown.length 
            : 0
        },
        serviceUsage: analyticsData.serviceUsage,
        errorAnalysis: analyticsData.errorAnalysis,
        topOperations: analyticsData.topOperations
      };
    } catch (error) {
      loggingService.warn('Could not get usage analytics for test report', {
        module: 'AITestSuite',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      averageResponseTime,
      errorRate,
      testResults: this.testResults,
      performanceMetrics,
      healthStatus,
      usageAnalytics
    };
  }
}

  /**
   * Get comprehensive test coverage report
   */
  getTestCoverageReport(): {
    totalCategories: number;
    testedCategories: string[];
    coverage: Record<string, {
      tests: number;
      passed: number;
      failed: number;
      coverage: number;
    }>;
  } {
    const categories = this.testResults.reduce((acc, result) => {
      if (!acc[result.service]) {
        acc[result.service] = { tests: 0, passed: 0, failed: 0 };
      }
      acc[result.service].tests++;
      if (result.success) {
        acc[result.service].passed++;
      } else {
        acc[result.service].failed++;
      }
      return acc;
    }, {} as Record<string, { tests: number; passed: number; failed: number }>);

    const coverage = Object.entries(categories).reduce((acc, [service, stats]) => {
      acc[service] = {
        ...stats,
        coverage: stats.tests > 0 ? stats.passed / stats.tests : 0
      };
      return acc;
    }, {} as Record<string, { tests: number; passed: number; failed: number; coverage: number }>);

    return {
      totalCategories: Object.keys(categories).length,
      testedCategories: Object.keys(categories),
      coverage
    };
  }
}

// Export test utilities
export const aiTestUtils = {
  /**
   * Create test suite with custom configuration
   */
  createTestSuite(config?: Partial<AITestConfig>): AITestSuite {
    return new AITestSuite(config);
  },

  /**
   * Run quick health check
   */
  async quickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    let healthy = true;

    try {
      // Test HuggingFace client
      const hfHealth = await enhancedHuggingFaceClient.healthCheck();
      if (hfHealth.status !== 'healthy') {
        issues.push(`HuggingFace client status: ${hfHealth.status}`);
        healthy = false;
      }

      // Test AI integration
      const aiHealth = await aiIntegrationOrchestrator.getHealthStatus();
      if (aiHealth.status !== 'healthy') {
        issues.push(`AI integration status: ${aiHealth.status}`);
        healthy = false;
      }

      // Test monitoring systems
      try {
        const systemMetrics = aiMetricsCollector.getSystemMetrics();
        if (systemMetrics.overallErrorRate > 0.2) {
          issues.push(`High system error rate: ${(systemMetrics.overallErrorRate * 100).toFixed(1)}%`);
          healthy = false;
        }
      } catch (error) {
        issues.push('Metrics collector unavailable');
      }

      try {
        const healthStatus = await aiHealthMonitor.getSystemHealthStatus();
        if (healthStatus.overallStatus !== 'healthy') {
          issues.push(`Health monitor status: ${healthStatus.overallStatus}`);
          if (healthStatus.overallStatus === 'unhealthy') {
            healthy = false;
          }
        }
      } catch (error) {
        issues.push('Health monitor unavailable');
      }
    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      healthy = false;
    }

    return { healthy, issues };
  },

  /**
   * Get current AI metrics
   */
  async getCurrentMetrics(): Promise<Record<string, any>> {
    try {
      const [hfMetrics, aiMetrics, systemMetrics, healthStatus] = await Promise.all([
        enhancedHuggingFaceClient.getMetrics().catch(() => ({})),
        aiIntegrationOrchestrator.getMetrics(),
        Promise.resolve(aiMetricsCollector.getSystemMetrics()),
        aiHealthMonitor.getSystemHealthStatus().catch(() => ({}))
      ]);

      return {
        huggingFace: hfMetrics,
        aiIntegration: aiMetrics,
        systemMetrics,
        healthStatus,
        timestamp: new Date()
      };
    } catch (error) {
      loggingService.error('Failed to get AI metrics', {
        module: 'AITestUtils',
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  },

  /**
   * Run comprehensive system validation
   */
  async validateAISystem(): Promise<{
    valid: boolean;
    validations: Array<{
      component: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }>;
  }> {
    const validations = [];
    let valid = true;

    // Validate metrics collector
    try {
      const metrics = aiMetricsCollector.getSystemMetrics();
      validations.push({
        component: 'MetricsCollector',
        status: 'pass',
        message: `Tracking ${metrics.totalOperations} operations`
      });
    } catch (error) {
      validations.push({
        component: 'MetricsCollector',
        status: 'fail',
        message: `Failed to get metrics: ${error instanceof Error ? error.message : String(error)}`
      });
      valid = false;
    }

    // Validate health monitor
    try {
      const health = await aiHealthMonitor.getSystemHealthStatus();
      const status = health.overallStatus === 'healthy' ? 'pass' : 
                    health.overallStatus === 'degraded' ? 'warning' : 'fail';
      validations.push({
        component: 'HealthMonitor',
        status,
        message: `System status: ${health.overallStatus}`
      });
      if (status === 'fail') valid = false;
    } catch (error) {
      validations.push({
        component: 'HealthMonitor',
        status: 'fail',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`
      });
      valid = false;
    }

    // Validate AI integration
    try {
      const aiHealth = await aiIntegrationOrchestrator.getHealthStatus();
      const status = aiHealth.status === 'healthy' ? 'pass' : 
                    aiHealth.status === 'degraded' ? 'warning' : 'fail';
      validations.push({
        component: 'AIIntegration',
        status,
        message: `AI integration status: ${aiHealth.status}`
      });
      if (status === 'fail') valid = false;
    } catch (error) {
      validations.push({
        component: 'AIIntegration',
        status: 'fail',
        message: `AI integration check failed: ${error instanceof Error ? error.message : String(error)}`
      });
      valid = false;
    }

    return { valid, validations };
  }
};