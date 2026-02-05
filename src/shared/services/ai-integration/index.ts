/**
 * AI Integration Services - Main Export File
 * 
 * Exports all AI integration services and utilities for easy importing
 * throughout the application.
 */

// Main orchestrator
export { 
  aiIntegrationOrchestrator,
  AIIntegrationOrchestrator,
  type AIIntegrationConfig,
  type AIIntegrationMetrics,
  type PropertyListingEnhancement,
  type SearchResultsEnhancement
} from './ai-integration-orchestrator'

// Property analysis integration
export {
  propertyAnalysisIntegration,
  PropertyAnalysisIntegrationService,
  type PropertyValuationResult,
  type PropertyRiskAssessment,
  type PropertyInsights,
  type EnhancedPropertySearchResult
} from './property-analysis-integration'

// Document processing integration
export {
  documentProcessingIntegration,
  DocumentProcessingIntegrationService,
  type DocumentProcessingResult,
  type AuthenticityResult,
  type CompletenessResult,
  type ConsistencyResult,
  type LandVerificationWorkflowResult
} from './document-processing-integration'

// Fraud detection integration
export {
  fraudDetectionIntegration,
  FraudDetectionIntegrationService,
  type FraudDetectionResult,
  type PropertyFraudAnalysis,
  type UserFraudAnalysis,
  type NetworkFraudAnalysis
} from './fraud-detection-integration'

// Recommendation integration
export {
  recommendationIntegration,
  RecommendationIntegrationService,
  type PropertyRecommendation,
  type UserPreferenceProfile,
  type SmartMatchResult,
  type RecommendationFeedback
} from './recommendation-integration'

// Monitoring and testing suite
export {
  // Metrics Collection
  aiMetricsCollector,
  type AIOperationMetrics,
  type AIServiceMetrics,
  type AISystemMetrics,
  type CostBreakdown,
  type UsageAnalytics,
  
  // Health Monitoring
  aiHealthMonitor,
  type HealthCheckResult,
  type SystemHealthStatus,
  type HealthAlert,
  
  // Performance Dashboard
  aiPerformanceDashboard,
  type DashboardMetrics,
  type PerformanceInsights,
  type DashboardRecommendation,
  
  // Testing Suite
  AITestSuite,
  aiTestUtils,
  type AITestConfig,
  type AITestResult,
  type AITestSuiteReport,
  
  // Comprehensive Test Runner
  ComprehensiveAITestRunner,
  type ComprehensiveTestConfig,
  type ComprehensiveTestReport,
  
  // Utility Functions
  initializeAIMonitoring,
  getAISystemStatus,
  quickAIHealthCheck,
  exportAllMonitoringData,
  cleanupAIMonitoring
} from './monitoring'

// Utility functions for AI integration
export const aiIntegrationUtils = {
  /**
   * Check if AI services are available and healthy
   */
  async checkAIHealth() {
    try {
      const health = await aiIntegrationOrchestrator.getHealthStatus();
      return health.status === 'healthy';
    } catch (error) {
      return false;
    }
  },

  /**
   * Get AI integration metrics summary
   */
  async getMetricsSummary() {
    try {
      const metrics = await aiIntegrationOrchestrator.getMetrics();
      return {
        totalOperations: metrics.overall.totalAIOperations,
        errorRate: metrics.overall.errorRate,
        averageResponseTime: metrics.overall.averageResponseTime,
        servicesStatus: {
          propertyAnalysis: metrics.propertyAnalysis.errorRate < 0.1,
          documentProcessing: metrics.documentProcessing.authenticityRate > 0.8,
          fraudDetection: metrics.fraudDetection.falsePositiveRate < 0.2,
          recommendations: metrics.recommendations.userEngagementRate > 0.3
        }
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * Format AI confidence score for display
   */
  formatConfidence(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 90) return `${percentage}% (Very High)`;
    if (percentage >= 70) return `${percentage}% (High)`;
    if (percentage >= 50) return `${percentage}% (Medium)`;
    return `${percentage}% (Low)`;
  },

  /**
   * Get risk level color for UI display
   */
  getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[riskLevel] || 'text-gray-600';
  },

  /**
   * Get risk level badge variant
   */
  getRiskLevelVariant(riskLevel: 'low' | 'medium' | 'high' | 'critical'): 'default' | 'secondary' | 'destructive' {
    if (riskLevel === 'low') return 'default';
    if (riskLevel === 'medium') return 'secondary';
    return 'destructive';
  },

  /**
   * Calculate overall AI score from multiple analyses
   */
  calculateOverallAIScore(analyses: {
    valuation?: { confidence: number };
    riskAssessment?: { riskScore: number };
    fraudAnalysis?: { riskScore: number; confidence: number };
  }): number {
    let totalScore = 0;
    let weights = 0;

    if (analyses.valuation) {
      totalScore += analyses.valuation.confidence * 100 * 0.3;
      weights += 0.3;
    }

    if (analyses.riskAssessment) {
      totalScore += (100 - analyses.riskAssessment.riskScore) * 0.3;
      weights += 0.3;
    }

    if (analyses.fraudAnalysis) {
      const fraudScore = (100 - analyses.fraudAnalysis.riskScore) * analyses.fraudAnalysis.confidence;
      totalScore += fraudScore * 0.4;
      weights += 0.4;
    }

    return weights > 0 ? Math.round(totalScore / weights) : 50;
  },

  /**
   * Generate AI insights summary
   */
  generateInsightsSummary(analyses: {
    valuation?: any;
    riskAssessment?: any;
    fraudAnalysis?: any;
    marketInsights?: any;
  }): string {
    const insights = [];

    if (analyses.valuation?.confidence > 0.8) {
      insights.push('High-confidence AI valuation available');
    }

    if (analyses.riskAssessment?.overallRisk === 'low') {
      insights.push('Low risk investment opportunity');
    }

    if (analyses.fraudAnalysis?.riskLevel === 'low') {
      insights.push('No fraud indicators detected');
    }

    if (analyses.marketInsights?.investmentPotential === 'excellent') {
      insights.push('Excellent investment potential identified');
    }

    return insights.length > 0 
      ? insights.join('. ') + '.'
      : 'AI analysis completed with standard results.';
  }
};

// Constants for AI integration
export const AI_INTEGRATION_CONSTANTS = {
  // Confidence thresholds
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.8,
    MEDIUM: 0.6,
    LOW: 0.4
  },

  // Risk score thresholds
  RISK_SCORE_THRESHOLDS: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80
  },

  // Cache TTL values (in seconds)
  CACHE_TTL: {
    PROPERTY_ANALYSIS: 3600, // 1 hour
    DOCUMENT_PROCESSING: 7200, // 2 hours
    FRAUD_DETECTION: 1800, // 30 minutes
    RECOMMENDATIONS: 900 // 15 minutes
  },

  // Batch processing limits
  BATCH_LIMITS: {
    PROPERTIES: 50,
    DOCUMENTS: 20,
    USERS: 100
  },

  // API timeouts (in milliseconds)
  TIMEOUTS: {
    PROPERTY_ANALYSIS: 30000,
    DOCUMENT_PROCESSING: 60000,
    FRAUD_DETECTION: 45000,
    RECOMMENDATIONS: 20000
  }
};

// Error types for AI integration
export class AIIntegrationError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AIIntegrationError';
  }
}

export class AIServiceUnavailableError extends AIIntegrationError {
  constructor(service: string, operation: string) {
    super(`AI service ${service} is currently unavailable`, service, operation);
    this.name = 'AIServiceUnavailableError';
  }
}

export class AIAnalysisTimeoutError extends AIIntegrationError {
  constructor(service: string, operation: string, timeout: number) {
    super(`AI analysis timed out after ${timeout}ms`, service, operation);
    this.name = 'AIAnalysisTimeoutError';
  }
}

// Type guards for AI integration
export const aiTypeGuards = {
  isPropertyValuationResult(obj: any): obj is PropertyValuationResult {
    return obj && 
           typeof obj.estimatedValue === 'number' &&
           typeof obj.confidence === 'number' &&
           obj.valueRange &&
           Array.isArray(obj.factors);
  },

  isPropertyRiskAssessment(obj: any): obj is PropertyRiskAssessment {
    return obj &&
           ['low', 'medium', 'high'].includes(obj.overallRisk) &&
           typeof obj.riskScore === 'number' &&
           Array.isArray(obj.riskFactors);
  },

  isFraudDetectionResult(obj: any): obj is FraudDetectionResult {
    return obj &&
           ['low', 'medium', 'high', 'critical'].includes(obj.riskLevel) &&
           typeof obj.riskScore === 'number' &&
           typeof obj.confidence === 'number';
  },

  isPropertyRecommendation(obj: any): obj is PropertyRecommendation {
    return obj &&
           typeof obj.propertyId === 'string' &&
           typeof obj.score === 'number' &&
           typeof obj.confidence === 'number' &&
           Array.isArray(obj.reasons);
  }
};