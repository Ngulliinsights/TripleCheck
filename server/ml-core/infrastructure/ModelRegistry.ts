/**
 * ML Model Registry - Central hub for model management, versioning, and deployment
 * Handles model lifecycle, A/B testing, and performance monitoring
 */

import { EventEmitter } from 'events';
import * as tf from '..\index';
import { logger } from '../../infrastructure/monitoring/logger';

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'anomaly_detection' | 'clustering' | 'nlp' | 'computer_vision';
  framework: 'tensorflow' | 'sklearn' | 'xgboost' | 'pytorch' | 'custom';
  status: 'training' | 'validating' | 'staging' | 'production' | 'deprecated' | 'failed';
  
  // Performance metrics
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
    mse?: number;
    mae?: number;
    customMetrics?: Record<string, number>;
  };
  
  // Training information
  trainingInfo: {
    datasetSize: number;
    trainingTime: number;
    hyperparameters: Record<string, any>;
    featureImportance?: Record<string, number>;
    crossValidationScore?: number;
  };
  
  // Deployment information
  deployment: {
    environment: 'development' | 'staging' | 'production';
    deployedAt: Date;
    trafficPercentage: number; // For A/B testing
    latencyP95: number; // 95th percentile latency in ms
    throughput: number; // Requests per second
    errorRate: number; // Error rate percentage
  };
  
  // Model configuration
  config: {
    inputSchema: Record<string, string>; // Feature name -> type
    outputSchema: Record<string, string>; // Output name -> type
    preprocessing: string[]; // List of preprocessing steps
    postprocessing: string[]; // List of postprocessing steps
    businessRules?: string[]; // Business logic to apply
  };
  
  // Governance
  governance: {
    owner: string;
    approver?: string;
    tags: string[];
    description: string;
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    complianceChecks: string[];
    auditTrail: Array<{
      action: string;
      user: string;
      timestamp: Date;
      details: string;
    }>;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelPrediction {
  modelId: string;
  modelVersion: string;
  prediction: any;
  confidence: number;
  explanation?: {
    featureImportance: Record<string, number>;
    reasoning: string;
    alternativeOutcomes?: Array<{
      outcome: any;
      probability: number;
    }>;
  };
  metadata: {
    latency: number;
    timestamp: Date;
    inputHash: string;
  };
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  models: Array<{
    modelId: string;
    version: string;
    trafficPercentage: number;
    alias: string;
  }>;
  startDate: Date;
  endDate: Date;
  successMetrics: string[];
  minimumSampleSize: number;
  status: 'draft' | 'running' | 'completed' | 'paused';
}

export class ModelRegistry extends EventEmitter {
  private models: Map<string, ModelMetadata> = new Map();
  private loadedModels: Map<string, any> = new Map(); // Actual model instances
  private abTests: Map<string, ABTestConfig> = new Map();
  private predictionCache: Map<string, ModelPrediction> = new Map();
  
  constructor() {
    super();
    this.startPerformanceMonitoring();
  }

  /**
   * Register a new model in the registry
   */
  async registerModel(metadata: Omit<ModelMetadata, 'createdAt' | 'updatedAt'>): Promise<void> {
    const fullMetadata: ModelMetadata = {
      ...metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate model metadata
    this.validateModelMetadata(fullMetadata);

    // Store metadata
    this.models.set(metadata.id, fullMetadata);

    // Add to audit trail
    fullMetadata.governance.auditTrail.push({
      action: 'MODEL_REGISTERED',
      user: metadata.governance.owner,
      timestamp: new Date(),
      details: `Model ${metadata.name} v${metadata.version} registered`
    });

    logger.info(`Model registered: ${metadata.name} v${metadata.version}`, {
      modelId: metadata.id,
      type: metadata.type,
      framework: metadata.framework
    });

    this.emit('modelRegistered', fullMetadata);
  }

  /**
   * Load a model for inference
   */
  async loadModel(modelId: string, version?: string): Promise<void> {
    const metadata = this.getModelMetadata(modelId, version);
    if (!metadata) {
      throw new Error(`Model not found: ${modelId}${version ? ` v${version}` : ''}`);
    }

    const modelKey = `${modelId}:${metadata.version}`;
    
    if (this.loadedModels.has(modelKey)) {
      logger.debug(`Model already loaded: ${modelKey}`);
      return;
    }

    try {
      let model: any;

      switch (metadata.framework) {
        case 'tensorflow':
          model = await this.loadTensorFlowModel(metadata);
          break;
        case 'sklearn':
          model = await this.loadSklearnModel(metadata);
          break;
        case 'xgboost':
          model = await this.loadXGBoostModel(metadata);
          break;
        case 'custom':
          model = await this.loadCustomModel(metadata);
          break;
        default:
          throw new Error(`Unsupported framework: ${metadata.framework}`);
      }

      this.loadedModels.set(modelKey, model);
      
      // Update metadata
      metadata.updatedAt = new Date();
      metadata.governance.auditTrail.push({
        action: 'MODEL_LOADED',
        user: 'system',
        timestamp: new Date(),
        details: `Model loaded for inference`
      });

      logger.info(`Model loaded successfully: ${modelKey}`);
      this.emit('modelLoaded', metadata);

    } catch (error) {
      logger.error(`Failed to load model: ${modelKey}`, error);
      throw error;
    }
  }

  /**
   * Make a prediction using a loaded model
   */
  async predict(
    modelId: string, 
    input: Record<string, any>, 
    options: {
      version?: string;
      useCache?: boolean;
      explainPrediction?: boolean;
      abTestId?: string;
    } = {}
  ): Promise<ModelPrediction> {
    const startTime = Date.now();

    // Handle A/B testing
    let actualModelId = modelId;
    let actualVersion = options.version;

    if (options.abTestId) {
      const testConfig = this.abTests.get(options.abTestId);
      if (testConfig && testConfig.status === 'running') {
        const selectedModel = this.selectModelForABTest(testConfig);
        actualModelId = selectedModel.modelId;
        actualVersion = selectedModel.version;
      }
    }

    const metadata = this.getModelMetadata(actualModelId, actualVersion);
    if (!metadata) {
      throw new Error(`Model not found: ${actualModelId}${actualVersion ? ` v${actualVersion}` : ''}`);
    }

    const modelKey = `${actualModelId}:${metadata.version}`;

    // Check cache if enabled
    if (options.useCache) {
      const inputHash = this.hashInput(input);
      const cacheKey = `${modelKey}:${inputHash}`;
      const cached = this.predictionCache.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for prediction: ${cacheKey}`);
        return cached;
      }
    }

    // Ensure model is loaded
    if (!this.loadedModels.has(modelKey)) {
      await this.loadModel(actualModelId, actualVersion);
    }

    const model = this.loadedModels.get(modelKey);
    if (!model) {
      throw new Error(`Model not loaded: ${modelKey}`);
    }

    try {
      // Validate input
      this.validateInput(input, metadata.config.inputSchema);

      // Preprocess input
      const preprocessedInput = await this.preprocessInput(input, metadata.config.preprocessing);

      // Make prediction
      const rawPrediction = await this.makePrediction(model, preprocessedInput, metadata);

      // Postprocess output
      const processedPrediction = await this.postprocessOutput(rawPrediction, metadata.config.postprocessing);

      // Apply business rules
      const finalPrediction = await this.applyBusinessRules(processedPrediction, metadata.config.businessRules);

      // Generate explanation if requested
      let explanation;
      if (options.explainPrediction) {
        explanation = await this.explainPrediction(model, preprocessedInput, finalPrediction, metadata);
      }

      const latency = Date.now() - startTime;
      const inputHash = this.hashInput(input);

      const result: ModelPrediction = {
        modelId: actualModelId,
        modelVersion: metadata.version,
        prediction: finalPrediction,
        confidence: this.calculateConfidence(rawPrediction, metadata),
        explanation,
        metadata: {
          latency,
          timestamp: new Date(),
          inputHash
        }
      };

      // Cache result if enabled
      if (options.useCache) {
        const cacheKey = `${modelKey}:${inputHash}`;
        this.predictionCache.set(cacheKey, result);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(metadata, latency, true);

      logger.debug(`Prediction completed: ${modelKey}`, {
        latency,
        confidence: result.confidence
      });

      this.emit('predictionMade', result);
      return result;

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updatePerformanceMetrics(metadata, latency, false);
      
      logger.error(`Prediction failed: ${modelKey}`, error);
      throw error;
    }
  }

  /**
   * Create and start an A/B test
   */
  async createABTest(config: ABTestConfig): Promise<void> {
    // Validate A/B test configuration
    this.validateABTestConfig(config);

    // Ensure all models exist and are loaded
    for (const modelConfig of config.models) {
      await this.loadModel(modelConfig.modelId, modelConfig.version);
    }

    this.abTests.set(config.id, config);
    
    logger.info(`A/B test created: ${config.name}`, {
      testId: config.id,
      models: config.models.length,
      duration: config.endDate.getTime() - config.startDate.getTime()
    });

    this.emit('abTestCreated', config);
  }

  /**
   * Get model performance metrics
   */
  getModelPerformance(modelId: string, version?: string): ModelMetadata['metrics'] | null {
    const metadata = this.getModelMetadata(modelId, version);
    return metadata?.metrics || null;
  }

  /**
   * List all models with optional filtering
   */
  listModels(filters: {
    type?: ModelMetadata['type'];
    status?: ModelMetadata['status'];
    owner?: string;
    tags?: string[];
  } = {}): ModelMetadata[] {
    const models = Array.from(this.models.values());
    
    return models.filter(model => {
      if (filters.type && model.type !== filters.type) return false;
      if (filters.status && model.status !== filters.status) return false;
      if (filters.owner && model.governance.owner !== filters.owner) return false;
      if (filters.tags && !filters.tags.every(tag => model.governance.tags.includes(tag))) return false;
      return true;
    });
  }

  /**
   * Update model status
   */
  async updateModelStatus(
    modelId: string, 
    status: ModelMetadata['status'], 
    user: string,
    reason?: string
  ): Promise<void> {
    const metadata = this.getModelMetadata(modelId);
    if (!metadata) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const oldStatus = metadata.status;
    metadata.status = status;
    metadata.updatedAt = new Date();

    metadata.governance.auditTrail.push({
      action: 'STATUS_CHANGED',
      user,
      timestamp: new Date(),
      details: `Status changed from ${oldStatus} to ${status}${reason ? `: ${reason}` : ''}`
    });

    logger.info(`Model status updated: ${modelId}`, {
      oldStatus,
      newStatus: status,
      user,
      reason
    });

    this.emit('modelStatusChanged', { metadata, oldStatus, newStatus: status });
  }

  // Private helper methods

  private getModelMetadata(modelId: string, version?: string): ModelMetadata | null {
    if (version) {
      // Find specific version
      for (const metadata of this.models.values()) {
        if (metadata.id === modelId && metadata.version === version) {
          return metadata;
        }
      }
      return null;
    } else {
      // Find latest version
      const candidates = Array.from(this.models.values())
        .filter(m => m.id === modelId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return candidates[0] || null;
    }
  }

  private validateModelMetadata(metadata: ModelMetadata): void {
    if (!metadata.id || !metadata.name || !metadata.version) {
      throw new Error('Model ID, name, and version are required');
    }

    if (!metadata.governance.owner) {
      throw new Error('Model owner is required');
    }

    if (!metadata.config.inputSchema || Object.keys(metadata.config.inputSchema).length === 0) {
      throw new Error('Input schema is required');
    }
  }

  private validateABTestConfig(config: ABTestConfig): void {
    if (config.models.length < 2) {
      throw new Error('A/B test requires at least 2 models');
    }

    const totalTraffic = config.models.reduce((sum, m) => sum + m.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Traffic percentages must sum to 100%');
    }

    if (config.startDate >= config.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  private selectModelForABTest(config: ABTestConfig): ABTestConfig['models'][0] {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const model of config.models) {
      cumulative += model.trafficPercentage;
      if (random <= cumulative) {
        return model;
      }
    }

    // Fallback to first model
    return config.models[0];
  }

  private async loadTensorFlowModel(metadata: ModelMetadata): Promise<tf.LayersModel> {
    const modelPath = `./models/${metadata.id}/${metadata.version}/model.json`;
    return await tf.loadLayersModel(`file://${modelPath}`);
  }

  private async loadSklearnModel(metadata: ModelMetadata): Promise<any> {
    // In production, this would load a serialized scikit-learn model
    // For now, return a mock model
    return {
      predict: (input: any) => {
        // Mock prediction logic
        return [Math.random()];
      }
    };
  }

  private async loadXGBoostModel(metadata: ModelMetadata): Promise<any> {
    // In production, this would load an XGBoost model
    return {
      predict: (input: any) => {
        return [Math.random()];
      }
    };
  }

  private async loadCustomModel(metadata: ModelMetadata): Promise<any> {
    // Load custom model implementation
    const modelPath = `./models/${metadata.id}/${metadata.version}/model.js`;
    return require(modelPath);
  }

  private validateInput(input: Record<string, any>, schema: Record<string, string>): void {
    for (const [field, type] of Object.entries(schema)) {
      if (!(field in input)) {
        throw new Error(`Missing required field: ${field}`);
      }

      const value = input[field];
      const actualType = typeof value;

      if (type === 'number' && actualType !== 'number') {
        throw new Error(`Field ${field} must be a number, got ${actualType}`);
      }
      if (type === 'string' && actualType !== 'string') {
        throw new Error(`Field ${field} must be a string, got ${actualType}`);
      }
      if (type === 'boolean' && actualType !== 'boolean') {
        throw new Error(`Field ${field} must be a boolean, got ${actualType}`);
      }
    }
  }

  private async preprocessInput(input: Record<string, any>, steps: string[]): Promise<any> {
    let processed = { ...input };

    for (const step of steps) {
      switch (step) {
        case 'normalize':
          processed = this.normalizeInput(processed);
          break;
        case 'scale':
          processed = this.scaleInput(processed);
          break;
        case 'encode_categorical':
          processed = this.encodeCategorical(processed);
          break;
        default:
          logger.warn(`Unknown preprocessing step: ${step}`);
      }
    }

    return processed;
  }

  private async postprocessOutput(output: any, steps: string[]): Promise<any> {
    let processed = output;

    for (const step of steps) {
      switch (step) {
        case 'apply_threshold':
          processed = this.applyThreshold(processed);
          break;
        case 'round':
          processed = Math.round(processed);
          break;
        default:
          logger.warn(`Unknown postprocessing step: ${step}`);
      }
    }

    return processed;
  }

  private async applyBusinessRules(prediction: any, rules?: string[]): Promise<any> {
    if (!rules || rules.length === 0) return prediction;

    let result = prediction;

    for (const rule of rules) {
      switch (rule) {
        case 'min_confidence_threshold':
          if (typeof result === 'object' && result.confidence < 0.5) {
            result.prediction = 'uncertain';
          }
          break;
        case 'fraud_escalation':
          if (typeof result === 'object' && result.prediction > 0.8) {
            result.requiresManualReview = true;
          }
          break;
        default:
          logger.warn(`Unknown business rule: ${rule}`);
      }
    }

    return result;
  }

  private async makePrediction(model: any, input: any, metadata: ModelMetadata): Promise<any> {
    switch (metadata.framework) {
      case 'tensorflow':
        const tensor = tf.tensor2d([Object.values(input)]);
        const prediction = model.predict(tensor) as tf.Tensor;
        const result = await prediction.data();
        tensor.dispose();
        prediction.dispose();
        return result[0];

      case 'sklearn':
      case 'xgboost':
      case 'custom':
        return model.predict([Object.values(input)])[0];

      default:
        throw new Error(`Unsupported framework: ${metadata.framework}`);
    }
  }

  private async explainPrediction(
    model: any, 
    input: any, 
    prediction: any, 
    metadata: ModelMetadata
  ): Promise<ModelPrediction['explanation']> {
    // Generate feature importance and explanation
    const featureNames = Object.keys(metadata.config.inputSchema);
    const featureImportance: Record<string, number> = {};

    // Mock feature importance calculation
    featureNames.forEach((feature, index) => {
      featureImportance[feature] = Math.random();
    });

    return {
      featureImportance,
      reasoning: `Prediction based on ${featureNames.length} features with confidence ${this.calculateConfidence(prediction, metadata).toFixed(2)}`,
      alternativeOutcomes: [
        { outcome: 'alternative_1', probability: 0.2 },
        { outcome: 'alternative_2', probability: 0.1 }
      ]
    };
  }

  private calculateConfidence(prediction: any, metadata: ModelMetadata): number {
    // Calculate confidence based on prediction and model type
    if (typeof prediction === 'number') {
      // For regression or probability outputs
      return Math.min(1, Math.abs(prediction - 0.5) * 2);
    }
    
    return 0.8; // Default confidence
  }

  private normalizeInput(input: Record<string, any>): Record<string, any> {
    const normalized = { ...input };
    for (const [key, value] of Object.entries(normalized)) {
      if (typeof value === 'number') {
        normalized[key] = (value - 0) / (1 - 0); // Simple min-max normalization
      }
    }
    return normalized;
  }

  private scaleInput(input: Record<string, any>): Record<string, any> {
    // Standard scaling (z-score normalization)
    const scaled = { ...input };
    for (const [key, value] of Object.entries(scaled)) {
      if (typeof value === 'number') {
        scaled[key] = (value - 0) / 1; // Simplified scaling
      }
    }
    return scaled;
  }

  private encodeCategorical(input: Record<string, any>): Record<string, any> {
    const encoded = { ...input };
    for (const [key, value] of Object.entries(encoded)) {
      if (typeof value === 'string') {
        // Simple hash-based encoding
        encoded[key] = value.split('').reduce((hash, char) => {
          return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
        }, 0) / 0xffffffff;
      }
    }
    return encoded;
  }

  private applyThreshold(value: any): any {
    if (typeof value === 'number') {
      return value > 0.5 ? 1 : 0;
    }
    return value;
  }

  private hashInput(input: Record<string, any>): string {
    const str = JSON.stringify(input, Object.keys(input).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private updatePerformanceMetrics(metadata: ModelMetadata, latency: number, success: boolean): void {
    // Update deployment metrics
    const deployment = metadata.deployment;
    
    // Update latency (simple moving average)
    deployment.latencyP95 = (deployment.latencyP95 * 0.9) + (latency * 0.1);
    
    // Update error rate
    if (!success) {
      deployment.errorRate = (deployment.errorRate * 0.99) + 0.01;
    } else {
      deployment.errorRate = deployment.errorRate * 0.99;
    }
    
    metadata.updatedAt = new Date();
  }

  private startPerformanceMonitoring(): void {
    // Monitor model performance every 5 minutes
    setInterval(() => {
      this.monitorModelPerformance();
    }, 5 * 60 * 1000);
  }

  private async monitorModelPerformance(): Promise<void> {
    for (const metadata of this.models.values()) {
      if (metadata.status === 'production') {
        // Check if model performance has degraded
        if (metadata.deployment.errorRate > 0.05) { // 5% error rate threshold
          logger.warn(`High error rate detected for model: ${metadata.id}`, {
            errorRate: metadata.deployment.errorRate,
            latency: metadata.deployment.latencyP95
          });
          
          this.emit('modelPerformanceDegraded', metadata);
        }
        
        // Check if latency is too high
        if (metadata.deployment.latencyP95 > 1000) { // 1 second threshold
          logger.warn(`High latency detected for model: ${metadata.id}`, {
            latency: metadata.deployment.latencyP95
          });
          
          this.emit('modelLatencyHigh', metadata);
        }
      }
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Model Registry...');
    
    // Dispose of TensorFlow models
    for (const [key, model] of this.loadedModels.entries()) {
      try {
        if (model && typeof model.dispose === 'function') {
          model.dispose();
        }
      } catch (error) {
        logger.warn(`Failed to dispose model: ${key}`, error);
      }
    }
    
    this.loadedModels.clear();
    this.predictionCache.clear();
    
    logger.info('Model Registry shutdown complete');
  }
}