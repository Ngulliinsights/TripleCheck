/**
 * ML Core Module - Entry point for the advanced ML system
 * 
 * Exports all ML services and provides a unified interface for
 * fraud detection, property valuation, and trust intelligence
 */

// Infrastructure
export { ModelRegistry } from './infrastructure/ModelRegistry';
export type { 
  ModelMetadata, 
  ModelPrediction, 
  ABTestConfig 
} from './infrastructure/ModelRegistry';

// Fraud Detection
export { AdvancedFraudDetectionEngine } from './fraud-detection/AdvancedFraudDetectionEngine';
export type { 
  FraudDetectionRequest, 
  FraudDetectionResult 
} from './fraud-detection/AdvancedFraudDetectionEngine';

// Property Valuation
export { AutomatedValuationModel } from './property-valuation/AutomatedValuationModel';
export type { 
  PropertyValuationRequest, 
  PropertyValuationResult 
} from './property-valuation/AutomatedValuationModel';

// Trust Intelligence
export { CommunityTrustEngine } from './trust-intelligence/CommunityTrustEngine';
export type { 
  TrustAnalysisRequest, 
  TrustAnalysisResult 
} from './trust-intelligence/CommunityTrustEngine';

// Orchestration
export { MLOrchestrationService } from './orchestration/MLOrchestrationService';
export type { 
  MLWorkflowRequest, 
  MLWorkflowResult 
} from './orchestration/MLOrchestrationService';

// Continuous Learning
export { ContinuousLearningPipeline } from './training/ContinuousLearningPipeline';
export type { 
  TrainingDataset, 
  TrainingConfiguration, 
  TrainingResult, 
  FeedbackData 
} from './training/ContinuousLearningPipeline';

// Unified ML Service Factory
import { ModelRegistry } from './infrastructure/ModelRegistry';
import { AdvancedFraudDetectionEngine } from './fraud-detection/AdvancedFraudDetectionEngine';
import { AutomatedValuationModel } from './property-valuation/AutomatedValuationModel';
import { CommunityTrustEngine } from './trust-intelligence/CommunityTrustEngine';
import { MLOrchestrationService } from './orchestration/MLOrchestrationService';
import { ContinuousLearningPipeline } from './training/ContinuousLearningPipeline';
import { logger } from '../infrastructure/observability/telemetry';

/**
 * Unified ML Service - Central access point for all ML capabilities
 */
export class UnifiedMLService {
  private modelRegistry: ModelRegistry;
  private fraudDetectionEngine: AdvancedFraudDetectionEngine;
  private valuationModel: AutomatedValuationModel;
  private trustEngine: CommunityTrustEngine;
  private orchestrationService: MLOrchestrationService;
  private learningPipeline: ContinuousLearningPipeline;
  
  private isInitialized: boolean = false;

  constructor() {
    this.modelRegistry = new ModelRegistry();
    this.fraudDetectionEngine = new AdvancedFraudDetectionEngine(this.modelRegistry);
    this.valuationModel = new AutomatedValuationModel(this.modelRegistry);
    this.trustEngine = new CommunityTrustEngine(this.modelRegistry);
    this.orchestrationService = new MLOrchestrationService(this.modelRegistry);
    this.learningPipeline = new ContinuousLearningPipeline(this.modelRegistry);
  }

  /**
   * Initialize all ML services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('ML Service already initialized');
      return;
    }

    logger.info('Initializing Unified ML Service...');
    
    try {
      // Initialize in dependency order
      await this.modelRegistry.initialize?.();
      
      await Promise.all([
        this.fraudDetectionEngine.initialize(),
        this.valuationModel.initialize(),
        this.trustEngine.initialize()
      ]);
      
      await this.orchestrationService.initialize();
      await this.learningPipeline.initialize();
      
      this.isInitialized = true;
      logger.info('Unified ML Service initialized successfully');
      
    } catch (error) {
      logger.error({ error: error }, 'Failed to initialize Unified ML Service');
      throw error;
    }
  }

  /**
   * Get the model registry
   */
  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }

  /**
   * Get the fraud detection engine
   */
  getFraudDetectionEngine(): AdvancedFraudDetectionEngine {
    this.ensureInitialized();
    return this.fraudDetectionEngine;
  }

  /**
   * Get the property valuation model
   */
  getValuationModel(): AutomatedValuationModel {
    this.ensureInitialized();
    return this.valuationModel;
  }

  /**
   * Get the trust engine
   */
  getTrustEngine(): CommunityTrustEngine {
    this.ensureInitialized();
    return this.trustEngine;
  }

  /**
   * Get the orchestration service
   */
  getOrchestrationService(): MLOrchestrationService {
    this.ensureInitialized();
    return this.orchestrationService;
  }

  /**
   * Get the continuous learning pipeline
   */
  getLearningPipeline(): ContinuousLearningPipeline {
    this.ensureInitialized();
    return this.learningPipeline;
  }

  /**
   * Process a comprehensive ML workflow
   */
  async processWorkflow(request: import('./orchestration/MLOrchestrationService').MLWorkflowRequest): Promise<import('./orchestration/MLOrchestrationService').MLWorkflowResult> {
    this.ensureInitialized();
    return this.orchestrationService.processWorkflow(request);
  }

  /**
   * Quick fraud detection
   */
  async detectFraud(request: import('./fraud-detection/AdvancedFraudDetectionEngine').FraudDetectionRequest): Promise<import('./fraud-detection/AdvancedFraudDetectionEngine').FraudDetectionResult> {
    this.ensureInitialized();
    return this.fraudDetectionEngine.detectFraud(request);
  }

  /**
   * Quick property valuation
   */
  async valuateProperty(request: import('./property-valuation/AutomatedValuationModel').PropertyValuationRequest): Promise<import('./property-valuation/AutomatedValuationModel').PropertyValuationResult> {
    this.ensureInitialized();
    return this.valuationModel.valuateProperty(request);
  }

  /**
   * Quick trust analysis
   */
  async analyzeTrust(request: import('./trust-intelligence/CommunityTrustEngine').TrustAnalysisRequest): Promise<import('./trust-intelligence/CommunityTrustEngine').TrustAnalysisResult> {
    this.ensureInitialized();
    return this.trustEngine.analyzeTrust(request);
  }

  /**
   * Submit feedback for continuous learning
   */
  async submitFeedback(feedback: import('./training/ContinuousLearningPipeline').FeedbackData): Promise<void> {
    this.ensureInitialized();
    return this.learningPipeline.submitFeedback(feedback);
  }

  /**
   * Get overall system status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    modelRegistry: any;
    fraudDetection: any;
    propertyValuation: any;
    trustAnalysis: any;
    orchestration: any;
    continuousLearning: any;
  }> {
    return {
      initialized: this.isInitialized,
      modelRegistry: await this.modelRegistry.getStatus?.() || { status: 'unknown' },
      fraudDetection: await this.fraudDetectionEngine.getSystemStatus?.() || { status: 'unknown' },
      propertyValuation: { status: 'active' }, // AVM doesn't have getStatus method
      trustAnalysis: { status: 'active' }, // Trust engine doesn't have getStatus method
      orchestration: await this.orchestrationService.getStatus(),
      continuousLearning: await this.learningPipeline.getStatus()
    };
  }

  /**
   * Shutdown all ML services
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Shutting down Unified ML Service...');
    
    try {
      await Promise.all([
        this.learningPipeline.shutdown(),
        this.orchestrationService.shutdown(),
        this.trustEngine.shutdown?.(),
        this.valuationModel.shutdown?.(),
        this.fraudDetectionEngine.shutdown?.(),
        this.modelRegistry.shutdown()
      ]);
      
      this.isInitialized = false;
      logger.info('Unified ML Service shutdown complete');
      
    } catch (error) {
      logger.error({ error: error }, 'Error during ML Service shutdown');
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ML Service not initialized. Call initialize() first.');
    }
  }
}

// Global instance
let unifiedMLService: UnifiedMLService | null = null;

/**
 * Get the global ML service instance
 */
export function getMLService(): UnifiedMLService {
  if (!unifiedMLService) {
    unifiedMLService = new UnifiedMLService();
  }
  return unifiedMLService;
}

/**
 * Initialize the global ML service
 */
export async function initializeMLService(): Promise<UnifiedMLService> {
  const service = getMLService();
  await service.initialize();
  return service;
}

/**
 * Shutdown the global ML service
 */
export async function shutdownMLService(): Promise<void> {
  if (unifiedMLService) {
    await unifiedMLService.shutdown();
    unifiedMLService = null;
  }
}