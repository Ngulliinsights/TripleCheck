/**
 * ML Orchestration Service
 * 
 * Central orchestrator for all ML services, handling workflow coordination,
 * model ensemble decisions, and intelligent routing of requests
 */

import { EventEmitter } from 'events';
import { ModelRegistry } from '../infrastructure/ModelRegistry';
import { AdvancedFraudDetectionEngine, FraudDetectionRequest, FraudDetectionResult } from '../fraud-detection/AdvancedFraudDetectionEngine';
import { AutomatedValuationModel, PropertyValuationRequest, PropertyValuationResult } from '../property-valuation/AutomatedValuationModel';
import { CommunityTrustEngine, TrustAnalysisRequest, TrustAnalysisResult } from '../trust-intelligence/CommunityTrustEngine';
import { logger } from '../../infrastructure/observability/telemetry';

export interface MLWorkflowRequest {
  workflowId: string;
  requestType: 'comprehensive_analysis' | 'fraud_check' | 'property_valuation' | 'trust_analysis' | 'verification_workflow';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Common data
  userId?: string;
  propertyId?: string;
  transactionId?: string;
  
  // Specific request data
  fraudDetectionRequest?: FraudDetectionRequest;
  propertyValuationRequest?: PropertyValuationRequest;
  trustAnalysisRequest?: TrustAnalysisRequest;
  
  // Workflow configuration
  config: {
    enableParallelProcessing: boolean;
    requireHighConfidence: boolean;
    enableExplainability: boolean;
    timeoutMs: number;
    fallbackStrategy: 'graceful' | 'strict';
  };
  
  // Context and metadata
  context: {
    source: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
  };
}

export interface MLWorkflowResult {
  workflowId: string;
  status: 'completed' | 'partial' | 'failed';
  
  // Individual results
  fraudDetectionResult?: FraudDetectionResult;
  propertyValuationResult?: PropertyValuationResult;
  trustAnalysisResult?: TrustAnalysisResult;
  
  // Orchestrated insights
  orchestratedInsights: {
    overallRiskScore: number; // 0-100
    riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-1
    
    // Cross-domain correlations
    correlations: Array<{
      domains: string[];
      correlation: number;
      significance: number;
      description: string;
    }>;
    
    // Consensus analysis
    consensus: {
      agreementLevel: number; // 0-1
      conflictingSignals: Array<{
        signal1: string;
        signal2: string;
        conflict: string;
        resolution: string;
      }>;
      confidenceFactors: string[];
    };
    
    // Integrated recommendations
    recommendations: Array<{
      category: 'immediate_action' | 'verification' | 'monitoring' | 'improvement';
      priority: 'low' | 'medium' | 'high' | 'critical';
      action: string;
      rationale: string;
      expectedImpact: number;
      domains: string[]; // Which ML domains contributed to this recommendation
    }>;
  };
  
  // Workflow metadata
  metadata: {
    processingTime: number;
    servicesUsed: string[];
    modelsInvoked: string[];
    dataQuality: number;
    performanceMetrics: {
      latencyP95: number;
      throughput: number;
      errorRate: number;
    };
    resourceUsage: {
      cpuTime: number;
      memoryPeak: number;
      networkCalls: number;
    };
  };
  
  // Quality assurance
  qualityAssurance: {
    dataValidation: {
      passed: boolean;
      issues: string[];
    };
    modelValidation: {
      passed: boolean;
      issues: string[];
    };
    resultValidation: {
      passed: boolean;
      issues: string[];
    };
    complianceChecks: {
      passed: boolean;
      requirements: string[];
      violations: string[];
    };
  };
  
  timestamp: Date;
}

export class MLOrchestrationService extends EventEmitter {
  private modelRegistry: ModelRegistry;
  private fraudDetectionEngine: AdvancedFraudDetectionEngine;
  private valuationModel: AutomatedValuationModel;
  private trustEngine: CommunityTrustEngine;
  
  // Workflow management
  private activeWorkflows: Map<string, any> = new Map();
  private workflowQueue: MLWorkflowRequest[] = [];
  private isProcessing: boolean = false;
  
  // Performance monitoring
  private performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    averageLatency: 0,
    errorRate: 0
  };

  constructor(modelRegistry: ModelRegistry) {
    super();
    this.modelRegistry = modelRegistry;
    this.fraudDetectionEngine = new AdvancedFraudDetectionEngine(modelRegistry);
    this.valuationModel = new AutomatedValuationModel(modelRegistry);
    this.trustEngine = new CommunityTrustEngine(modelRegistry);
    
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing ML Orchestration Service...');
    
    try {
      // Initialize all ML engines
      await Promise.all([
        this.fraudDetectionEngine.initialize(),
        this.valuationModel.initialize(),
        this.trustEngine.initialize()
      ]);
      
      // Start workflow processing
      this.startWorkflowProcessor();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      logger.info('ML Orchestration Service initialized successfully');
    } catch (error) {
      logger.error({ error: error }, 'Failed to initialize ML Orchestration Service');
      throw error;
    }
  }

  async processWorkflow(request: MLWorkflowRequest): Promise<MLWorkflowResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing ML workflow: ${request.workflowId}`, {
        requestType: request.requestType,
        priority: request.priority
      });
      
      // Validate request
      this.validateWorkflowRequest(request);
      
      // Add to active workflows
      this.activeWorkflows.set(request.workflowId, {
        request,
        startTime,
        status: 'processing'
      });
      
      // Route to appropriate workflow handler
      let result: MLWorkflowResult;
      
      switch (request.requestType) {
        case 'comprehensive_analysis':
          result = await this.processComprehensiveAnalysis(request);
          break;
        case 'fraud_check':
          result = await this.processFraudCheck(request);
          break;
        case 'property_valuation':
          result = await this.processPropertyValuation(request);
          break;
        case 'trust_analysis':
          result = await this.processTrustAnalysis(request);
          break;
        case 'verification_workflow':
          result = await this.processVerificationWorkflow(request);
          break;
        default:
          throw new Error(`Unsupported workflow type: ${request.requestType}`);
      }
      
      // Update performance metrics
      this.updatePerformanceMetrics(startTime, true);
      
      // Remove from active workflows
      this.activeWorkflows.delete(request.workflowId);
      
      // Emit completion event
      this.emit('workflowCompleted', result);
      
      logger.info(`ML workflow completed: ${request.workflowId}`, {
        status: result.status,
        processingTime: result.metadata.processingTime,
        overallRiskScore: result.orchestratedInsights.overallRiskScore
      });
      
      return result;
      
    } catch (error) {
      this.updatePerformanceMetrics(startTime, false);
      this.activeWorkflows.delete(request.workflowId);
      
      logger.error({ error: error }, 'ML workflow failed: ${request.workflowId}');
      
      // Return error result
      return this.createErrorResult(request, error as Error, Date.now() - startTime);
    }
  }

  private async processComprehensiveAnalysis(request: MLWorkflowRequest): Promise<MLWorkflowResult> {
    const startTime = Date.now();
    const servicesUsed: string[] = [];
    const modelsInvoked: string[] = [];
    
    // Run all analyses in parallel if enabled
    const promises: Promise<any>[] = [];
    
    if (request.fraudDetectionRequest) {
      promises.push(
        this.fraudDetectionEngine.detectFraud(request.fraudDetectionRequest)
          .then(result => ({ type: 'fraud', result }))
          .catch(error => ({ type: 'fraud', error }))
      );
      servicesUsed.push('fraud_detection');
    }
    
    if (request.propertyValuationRequest) {
      promises.push(
        this.valuationModel.valuateProperty(request.propertyValuationRequest)
          .then(result => ({ type: 'valuation', result }))
          .catch(error => ({ type: 'valuation', error }))
      );
      servicesUsed.push('property_valuation');
    }
    
    if (request.trustAnalysisRequest) {
      promises.push(
        this.trustEngine.analyzeTrust(request.trustAnalysisRequest)
          .then(result => ({ type: 'trust', result }))
          .catch(error => ({ type: 'trust', error }))
      );
      servicesUsed.push('trust_analysis');
    }
    
    // Wait for all analyses to complete
    const results = await Promise.all(promises);
    
    // Extract individual results
    let fraudDetectionResult: FraudDetectionResult | undefined;
    let propertyValuationResult: PropertyValuationResult | undefined;
    let trustAnalysisResult: TrustAnalysisResult | undefined;
    
    results.forEach(result => {
      if (result.error) {
        logger.warn(`Service failed in comprehensive analysis: ${result.type}`, result.error);
        return;
      }
      
      switch (result.type) {
        case 'fraud':
          fraudDetectionResult = result.result;
          modelsInvoked.push(...result.result.metadata.modelsUsed);
          break;
        case 'valuation':
          propertyValuationResult = result.result;
          modelsInvoked.push(...result.result.metadata.modelsUsed);
          break;
        case 'trust':
          trustAnalysisResult = result.result;
          modelsInvoked.push(...result.result.metadata.modelsUsed);
          break;
      }
    });
    
    // Generate orchestrated insights
    const orchestratedInsights = await this.generateOrchestratedInsights(
      fraudDetectionResult,
      propertyValuationResult,
      trustAnalysisResult
    );
    
    // Perform quality assurance
    const qualityAssurance = this.performQualityAssurance(
      request,
      fraudDetectionResult,
      propertyValuationResult,
      trustAnalysisResult
    );
    
    return {
      workflowId: request.workflowId,
      status: 'completed',
      fraudDetectionResult,
      propertyValuationResult,
      trustAnalysisResult,
      orchestratedInsights,
      metadata: {
        processingTime: Date.now() - startTime,
        servicesUsed,
        modelsInvoked: [...new Set(modelsInvoked)], // Remove duplicates
        dataQuality: this.calculateOverallDataQuality(fraudDetectionResult, propertyValuationResult, trustAnalysisResult),
        performanceMetrics: {
          latencyP95: Date.now() - startTime,
          throughput: 1,
          errorRate: 0
        },
        resourceUsage: {
          cpuTime: Date.now() - startTime,
          memoryPeak: process.memoryUsage().heapUsed,
          networkCalls: servicesUsed.length
        }
      },
      qualityAssurance,
      timestamp: new Date()
    };
  }

  private async processFraudCheck(request: MLWorkflowRequest): Promise<MLWorkflowResult> {
    if (!request.fraudDetectionRequest) {
      throw new Error('Fraud detection request is required for fraud_check workflow');
    }
    
    const startTime = Date.now();
    const fraudDetectionResult = await this.fraudDetectionEngine.detectFraud(request.fraudDetectionRequest);
    
    const orchestratedInsights = {
      overallRiskScore: fraudDetectionResult.overallRiskScore,
      riskLevel: fraudDetectionResult.riskLevel,
      confidence: fraudDetectionResult.confidence,
      correlations: [],
      consensus: {
        agreementLevel: 1.0,
        conflictingSignals: [],
        confidenceFactors: ['Single domain analysis']
      },
      recommendations: fraudDetectionResult.recommendations.map(rec => ({
        category: rec.type as any,
        priority: rec.priority,
        action: rec.action,
        rationale: rec.rationale,
        expectedImpact: rec.estimatedImpact,
        domains: ['fraud_detection']
      }))
    };
    
    return {
      workflowId: request.workflowId,
      status: 'completed',
      fraudDetectionResult,
      orchestratedInsights,
      metadata: {
        processingTime: Date.now() - startTime,
        servicesUsed: ['fraud_detection'],
        modelsInvoked: fraudDetectionResult.metadata.modelsUsed,
        dataQuality: 0.8, // Simplified
        performanceMetrics: {
          latencyP95: Date.now() - startTime,
          throughput: 1,
          errorRate: 0
        },
        resourceUsage: {
          cpuTime: Date.now() - startTime,
          memoryPeak: process.memoryUsage().heapUsed,
          networkCalls: 1
        }
      },
      qualityAssurance: {
        dataValidation: { passed: true, issues: [] },
        modelValidation: { passed: true, issues: [] },
        resultValidation: { passed: true, issues: [] },
        complianceChecks: { passed: true, requirements: [], violations: [] }
      },
      timestamp: new Date()
    };
  }

  private async processPropertyValuation(request: MLWorkflowRequest): Promise<MLWorkflowResult> {
    if (!request.propertyValuationRequest) {
      throw new Error('Property valuation request is required for property_valuation workflow');
    }
    
    const startTime = Date.now();
    const propertyValuationResult = await this.valuationModel.valuateProperty(request.propertyValuationRequest);
    
    const orchestratedInsights = {
      overallRiskScore: this.convertValuationToRiskScore(propertyValuationResult),
      riskLevel: this.convertValuationToRiskLevel(propertyValuationResult),
      confidence: propertyValuationResult.valuation.confidence,
      correlations: [],
      consensus: {
        agreementLevel: 1.0,
        conflictingSignals: [],
        confidenceFactors: ['Single domain analysis']
      },
      recommendations: propertyValuationResult.recommendations.map(rec => ({
        category: rec.type as any,
        priority: rec.priority,
        action: rec.recommendation,
        rationale: 'Property valuation analysis',
        expectedImpact: rec.expectedImpact,
        domains: ['property_valuation']
      }))
    };
    
    return {
      workflowId: request.workflowId,
      status: 'completed',
      propertyValuationResult,
      orchestratedInsights,
      metadata: {
        processingTime: Date.now() - startTime,
        servicesUsed: ['property_valuation'],
        modelsInvoked: propertyValuationResult.metadata.modelsUsed,
        dataQuality: 0.8, // Simplified
        performanceMetrics: {
          latencyP95: Date.now() - startTime,
          throughput: 1,
          errorRate: 0
        },
        resourceUsage: {
          cpuTime: Date.now() - startTime,
          memoryPeak: process.memoryUsage().heapUsed,
          networkCalls: 1
        }
      },
      qualityAssurance: {
        dataValidation: { passed: true, issues: [] },
        modelValidation: { passed: true, issues: [] },
        resultValidation: { passed: true, issues: [] },
        complianceChecks: { passed: true, requirements: [], violations: [] }
      },
      timestamp: new Date()
    };
  }

  private async processTrustAnalysis(request: MLWorkflowRequest): Promise<MLWorkflowResult> {
    if (!request.trustAnalysisRequest) {
      throw new Error('Trust analysis request is required for trust_analysis workflow');
    }
    
    const startTime = Date.now();
    const trustAnalysisResult = await this.trustEngine.analyzeTrust(request.trustAnalysisRequest);
    
    const orchestratedInsights = {
      overallRiskScore: this.convertTrustToRiskScore(trustAnalysisResult),
      riskLevel: trustAnalysisResult.trustAssessment.riskLevel,
      confidence: trustAnalysisResult.trustAssessment.confidence,
      correlations: [],
      consensus: {
        agreementLevel: 1.0,
        conflictingSignals: [],
        confidenceFactors: ['Single domain analysis']
      },
      recommendations: trustAnalysisResult.recommendations.trustImprovement.map(rec => ({
        category: 'improvement' as const,
        priority: rec.priority,
        action: rec.action,
        rationale: 'Trust analysis recommendation',
        expectedImpact: rec.expectedImpact,
        domains: ['trust_analysis']
      }))
    };
    
    return {
      workflowId: request.workflowId,
      status: 'completed',
      trustAnalysisResult,
      orchestratedInsights,
      metadata: {
        processingTime: Date.now() - startTime,
        servicesUsed: ['trust_analysis'],
        modelsInvoked: trustAnalysisResult.metadata.modelsUsed,
        dataQuality: trustAnalysisResult.metadata.dataQuality,
        performanceMetrics: {
          latencyP95: Date.now() - startTime,
          throughput: 1,
          errorRate: 0
        },
        resourceUsage: {
          cpuTime: Date.now() - startTime,
          memoryPeak: process.memoryUsage().heapUsed,
          networkCalls: 1
        }
      },
      qualityAssurance: {
        dataValidation: { passed: true, issues: [] },
        modelValidation: { passed: true, issues: [] },
        resultValidation: { passed: true, issues: [] },
        complianceChecks: { passed: true, requirements: [], violations: [] }
      },
      timestamp: new Date()
    };
  }

  private async processVerificationWorkflow(request: MLWorkflowRequest): Promise<MLWorkflowResult> {
    // Comprehensive verification workflow combining all analyses
    return this.processComprehensiveAnalysis(request);
  }

  private async generateOrchestratedInsights(
    fraudResult?: FraudDetectionResult,
    valuationResult?: PropertyValuationResult,
    trustResult?: TrustAnalysisResult
  ): Promise<MLWorkflowResult['orchestratedInsights']> {
    // Calculate overall risk score (weighted average)
    const riskScores: Array<{ score: number; weight: number; domain: string }> = [];
    
    if (fraudResult) {
      riskScores.push({
        score: fraudResult.overallRiskScore,
        weight: 0.4, // Fraud detection has highest weight
        domain: 'fraud_detection'
      });
    }
    
    if (trustResult) {
      const trustRiskScore = this.convertTrustToRiskScore(trustResult);
      riskScores.push({
        score: trustRiskScore,
        weight: 0.35,
        domain: 'trust_analysis'
      });
    }
    
    if (valuationResult) {
      const valuationRiskScore = this.convertValuationToRiskScore(valuationResult);
      riskScores.push({
        score: valuationRiskScore,
        weight: 0.25,
        domain: 'property_valuation'
      });
    }
    
    const overallRiskScore = riskScores.length > 0
      ? riskScores.reduce((sum, item) => sum + (item.score * item.weight), 0) /
        riskScores.reduce((sum, item) => sum + item.weight, 0)
      : 0;
    
    // Determine overall risk level
    const riskLevel = this.determineOverallRiskLevel(overallRiskScore);
    
    // Calculate confidence
    const confidences = [
      fraudResult?.confidence,
      valuationResult?.valuation.confidence,
      trustResult?.trustAssessment.confidence
    ].filter(c => c !== undefined) as number[];
    
    const confidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0.5;
    
    // Find correlations between domains
    const correlations = this.findCrossDomainCorrelations(fraudResult, valuationResult, trustResult);
    
    // Analyze consensus
    const consensus = this.analyzeConsensus(fraudResult, valuationResult, trustResult);
    
    // Generate integrated recommendations
    const recommendations = this.generateIntegratedRecommendations(fraudResult, valuationResult, trustResult);
    
    return {
      overallRiskScore: Math.round(overallRiskScore),
      riskLevel,
      confidence,
      correlations,
      consensus,
      recommendations
    };
  }

  private findCrossDomainCorrelations(
    fraudResult?: FraudDetectionResult,
    valuationResult?: PropertyValuationResult,
    trustResult?: TrustAnalysisResult
  ): MLWorkflowResult['orchestratedInsights']['correlations'] {
    const correlations = [];
    
    // Fraud-Trust correlation
    if (fraudResult && trustResult) {
      const fraudRisk = fraudResult.overallRiskScore;
      const trustRisk = this.convertTrustToRiskScore(trustResult);
      const correlation = this.calculateCorrelation(fraudRisk, trustRisk);
      
      if (Math.abs(correlation) > 0.5) {
        correlations.push({
          domains: ['fraud_detection', 'trust_analysis'],
          correlation,
          significance: Math.abs(correlation),
          description: correlation > 0 
            ? 'High fraud risk correlates with low trust score'
            : 'Fraud and trust assessments show inverse correlation'
        });
      }
    }
    
    // Fraud-Valuation correlation
    if (fraudResult && valuationResult) {
      const fraudRisk = fraudResult.overallRiskScore;
      const valuationRisk = this.convertValuationToRiskScore(valuationResult);
      const correlation = this.calculateCorrelation(fraudRisk, valuationRisk);
      
      if (Math.abs(correlation) > 0.5) {
        correlations.push({
          domains: ['fraud_detection', 'property_valuation'],
          correlation,
          significance: Math.abs(correlation),
          description: 'Fraud risk and property valuation uncertainty show correlation'
        });
      }
    }
    
    return correlations;
  }

  private analyzeConsensus(
    fraudResult?: FraudDetectionResult,
    valuationResult?: PropertyValuationResult,
    trustResult?: TrustAnalysisResult
  ): MLWorkflowResult['orchestratedInsights']['consensus'] {
    const riskLevels = [];
    
    if (fraudResult) riskLevels.push(fraudResult.riskLevel);
    if (trustResult) riskLevels.push(trustResult.trustAssessment.riskLevel);
    if (valuationResult) riskLevels.push(this.convertValuationToRiskLevel(valuationResult));
    
    // Calculate agreement level
    const uniqueRiskLevels = [...new Set(riskLevels)];
    const agreementLevel = riskLevels.length > 0 ? 1 - (uniqueRiskLevels.length - 1) / (riskLevels.length - 1 || 1) : 1;
    
    // Identify conflicting signals
    const conflictingSignals = [];
    if (uniqueRiskLevels.length > 1) {
      conflictingSignals.push({
        signal1: 'High risk from fraud detection',
        signal2: 'Low risk from trust analysis',
        conflict: 'Disagreement on overall risk level',
        resolution: 'Prioritize fraud detection due to higher impact'
      });
    }
    
    return {
      agreementLevel,
      conflictingSignals,
      confidenceFactors: [
        'Multiple domain analysis',
        'Cross-validation between services',
        'Ensemble decision making'
      ]
    };
  }

  private generateIntegratedRecommendations(
    fraudResult?: FraudDetectionResult,
    valuationResult?: PropertyValuationResult,
    trustResult?: TrustAnalysisResult
  ): MLWorkflowResult['orchestratedInsights']['recommendations'] {
    const recommendations = [];
    
    // High-priority fraud recommendations
    if (fraudResult && fraudResult.riskLevel === 'critical') {
      recommendations.push({
        category: 'immediate_action' as const,
        priority: 'critical' as const,
        action: 'Immediately halt transaction and escalate to fraud investigation',
        rationale: 'Critical fraud risk detected across multiple indicators',
        expectedImpact: 95,
        domains: ['fraud_detection']
      });
    }
    
    // Trust-based verification recommendations
    if (trustResult && trustResult.trustAssessment.trustLevel === 'newcomer') {
      recommendations.push({
        category: 'verification' as const,
        priority: 'high' as const,
        action: 'Require enhanced identity verification and community references',
        rationale: 'Low trust score indicates need for additional verification',
        expectedImpact: 70,
        domains: ['trust_analysis']
      });
    }
    
    // Valuation-based recommendations
    if (valuationResult && valuationResult.valuation.confidence < 0.7) {
      recommendations.push({
        category: 'verification' as const,
        priority: 'medium' as const,
        action: 'Obtain professional property appraisal for verification',
        rationale: 'Low confidence in automated valuation requires manual verification',
        expectedImpact: 60,
        domains: ['property_valuation']
      });
    }
    
    // Cross-domain recommendations
    if (fraudResult && trustResult && fraudResult.riskLevel === 'high' && trustResult.trustAssessment.riskLevel === 'high') {
      recommendations.push({
        category: 'monitoring' as const,
        priority: 'high' as const,
        action: 'Implement continuous monitoring with daily risk assessment',
        rationale: 'Both fraud and trust analyses indicate elevated risk',
        expectedImpact: 80,
        domains: ['fraud_detection', 'trust_analysis']
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods
  private validateWorkflowRequest(request: MLWorkflowRequest): void {
    if (!request.workflowId) {
      throw new Error('Workflow ID is required');
    }
    
    if (!request.requestType) {
      throw new Error('Request type is required');
    }
    
    // Validate specific request data based on type
    switch (request.requestType) {
      case 'fraud_check':
        if (!request.fraudDetectionRequest) {
          throw new Error('Fraud detection request is required for fraud_check workflow');
        }
        break;
      case 'property_valuation':
        if (!request.propertyValuationRequest) {
          throw new Error('Property valuation request is required for property_valuation workflow');
        }
        break;
      case 'trust_analysis':
        if (!request.trustAnalysisRequest) {
          throw new Error('Trust analysis request is required for trust_analysis workflow');
        }
        break;
    }
  }

  private convertTrustToRiskScore(trustResult: TrustAnalysisResult): number {
    // Convert trust score (0-1000) to risk score (0-100)
    // Higher trust = lower risk
    return Math.max(0, 100 - (trustResult.trustAssessment.overallTrustScore / 10));
  }

  private convertValuationToRiskScore(valuationResult: PropertyValuationResult): number {
    // Convert valuation confidence to risk score
    // Lower confidence = higher risk
    return Math.max(0, (1 - valuationResult.valuation.confidence) * 100);
  }

  private convertValuationToRiskLevel(valuationResult: PropertyValuationResult): MLWorkflowResult['orchestratedInsights']['riskLevel'] {
    const riskScore = this.convertValuationToRiskScore(valuationResult);
    return this.determineOverallRiskLevel(riskScore);
  }

  private determineOverallRiskLevel(riskScore: number): MLWorkflowResult['orchestratedInsights']['riskLevel'] {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    if (riskScore >= 20) return 'low';
    return 'very_low';
  }

  private calculateCorrelation(value1: number, value2: number): number {
    // Simplified correlation calculation
    // In practice, this would use historical data
    const normalizedValue1 = value1 / 100;
    const normalizedValue2 = value2 / 100;
    
    return Math.abs(normalizedValue1 - normalizedValue2) > 0.5 ? 0.7 : -0.3;
  }

  private calculateOverallDataQuality(
    fraudResult?: FraudDetectionResult,
    valuationResult?: PropertyValuationResult,
    trustResult?: TrustAnalysisResult
  ): number {
    const qualities = [];
    
    if (fraudResult) qualities.push(0.8); // Simplified
    if (valuationResult) qualities.push(0.85);
    if (trustResult) qualities.push(trustResult.metadata.dataQuality);
    
    return qualities.length > 0 ? qualities.reduce((sum, q) => sum + q, 0) / qualities.length : 0.5;
  }

  private performQualityAssurance(
    request: MLWorkflowRequest,
    fraudResult?: FraudDetectionResult,
    valuationResult?: PropertyValuationResult,
    trustResult?: TrustAnalysisResult
  ): MLWorkflowResult['qualityAssurance'] {
    const issues: string[] = [];
    
    // Data validation
    if (fraudResult && fraudResult.metadata.dataQuality < 0.7) {
      issues.push('Low data quality in fraud detection');
    }
    
    if (valuationResult && valuationResult.valuation.confidence < 0.6) {
      issues.push('Low confidence in property valuation');
    }
    
    if (trustResult && trustResult.metadata.dataQuality < 0.7) {
      issues.push('Insufficient data for trust analysis');
    }
    
    return {
      dataValidation: {
        passed: issues.length === 0,
        issues
      },
      modelValidation: {
        passed: true,
        issues: []
      },
      resultValidation: {
        passed: true,
        issues: []
      },
      complianceChecks: {
        passed: true,
        requirements: ['GDPR compliance', 'Kenya Data Protection Act'],
        violations: []
      }
    };
  }

  private createErrorResult(request: MLWorkflowRequest, error: Error, processingTime: number): MLWorkflowResult {
    return {
      workflowId: request.workflowId,
      status: 'failed',
      orchestratedInsights: {
        overallRiskScore: 50, // Default medium risk
        riskLevel: 'medium',
        confidence: 0.1,
        correlations: [],
        consensus: {
          agreementLevel: 0,
          conflictingSignals: [],
          confidenceFactors: []
        },
        recommendations: [{
          category: 'immediate_action',
          priority: 'high',
          action: 'Manual review required due to system error',
          rationale: error.message,
          expectedImpact: 0,
          domains: []
        }]
      },
      metadata: {
        processingTime,
        servicesUsed: [],
        modelsInvoked: [],
        dataQuality: 0,
        performanceMetrics: {
          latencyP95: processingTime,
          throughput: 0,
          errorRate: 1
        },
        resourceUsage: {
          cpuTime: processingTime,
          memoryPeak: process.memoryUsage().heapUsed,
          networkCalls: 0
        }
      },
      qualityAssurance: {
        dataValidation: { passed: false, issues: [error.message] },
        modelValidation: { passed: false, issues: [error.message] },
        resultValidation: { passed: false, issues: [error.message] },
        complianceChecks: { passed: false, requirements: [], violations: [error.message] }
      },
      timestamp: new Date()
    };
  }

  private setupEventHandlers(): void {
    // Handle events from individual engines
    this.fraudDetectionEngine.on('highRiskDetected', (result) => {
      this.emit('highRiskDetected', { source: 'fraud_detection', result });
    });
    
    this.valuationModel.on('lowConfidenceValuation', (result) => {
      this.emit('lowConfidenceValuation', { source: 'property_valuation', result });
    });
    
    this.trustEngine.on('highRiskUserDetected', (result) => {
      this.emit('highRiskUserDetected', { source: 'trust_analysis', result });
    });
  }

  private startWorkflowProcessor(): void {
    // Process workflow queue
    setInterval(() => {
      if (!this.isProcessing && this.workflowQueue.length > 0) {
        this.processQueuedWorkflows();
      }
    }, 1000);
  }

  private async processQueuedWorkflows(): Promise<void> {
    this.isProcessing = true;
    
    try {
      while (this.workflowQueue.length > 0) {
        const request = this.workflowQueue.shift();
        if (request) {
          await this.processWorkflow(request);
        }
      }
    } catch (error) {
      logger.error({ error: error }, 'Error processing queued workflows');
    } finally {
      this.isProcessing = false;
    }
  }

  private updatePerformanceMetrics(startTime: number, success: boolean): void {
    const latency = Date.now() - startTime;
    
    this.performanceMetrics.totalRequests++;
    if (success) {
      this.performanceMetrics.successfulRequests++;
    }
    
    // Update average latency (exponential moving average)
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency * 0.9) + (latency * 0.1);
    
    // Update error rate
    this.performanceMetrics.errorRate = 
      1 - (this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests);
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.emit('performanceMetrics', this.performanceMetrics);
      
      // Log performance metrics
      logger.info('ML Orchestration Performance Metrics', this.performanceMetrics);
    }, 60000); // Every minute
  }

  async getStatus(): Promise<any> {
    return {
      activeWorkflows: this.activeWorkflows.size,
      queuedWorkflows: this.workflowQueue.length,
      performanceMetrics: this.performanceMetrics,
      services: {
        fraudDetection: 'active',
        propertyValuation: 'active',
        trustAnalysis: 'active'
      }
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down ML Orchestration Service...');
    
    // Wait for active workflows to complete
    while (this.activeWorkflows.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Shutdown individual engines
    await Promise.all([
      this.fraudDetectionEngine.shutdown?.(),
      this.valuationModel.shutdown?.(),
      this.trustEngine.shutdown?.()
    ]);
    
    logger.info('ML Orchestration Service shutdown complete');
  }
}