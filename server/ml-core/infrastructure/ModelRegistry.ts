/**
 * ML Model Registry - Central hub for model management, versioning, and deployment
 * Handles model lifecycle, A/B testing, and performance monitoring
 */

import { EventEmitter } from 'events';
import { legacyLogger as logger } from '../../infrastructure/observability/telemetry';

// --- Interfaces (Truncated for brevity, assuming your original interfaces remain unchanged) ---
export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'anomaly_detection' | 'clustering' | 'nlp' | 'computer_vision';
  framework: 'tensorflow' | 'sklearn' | 'xgboost' | 'pytorch' | 'custom';
  status: 'training' | 'validating' | 'staging' | 'production' | 'deprecated' | 'failed';
  metrics: { accuracy?: number; precision?: number; recall?: number; f1Score?: number; auc?: number; mse?: number; mae?: number; customMetrics?: Record<string, number>; };
  trainingInfo: { datasetSize: number; trainingTime: number; hyperparameters: Record<string, unknown>; featureImportance?: Record<string, number>; crossValidationScore?: number; };
  deployment: { environment: 'development' | 'staging' | 'production'; deployedAt: Date; trafficPercentage: number; latencyP95: number; throughput: number; errorRate: number; };
  config: { inputSchema: Record<string, string>; outputSchema: Record<string, string>; preprocessing: string[]; postprocessing: string[]; businessRules?: string[]; };
  governance: { owner: string; approver?: string; tags: string[]; description: string; businessImpact: 'low' | 'medium' | 'high' | 'critical'; complianceChecks: string[]; auditTrail: Array<{ action: string; user: string; timestamp: Date; details: string; }>; };
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelPrediction {
  modelId: string;
  modelVersion: string;
  prediction: unknown;
  confidence: number;
  explanation?: { featureImportance: Record<string, number>; reasoning: string; alternativeOutcomes?: Array<{ outcome: unknown; probability: number; }>; };
  metadata: { latency: number; timestamp: Date; inputHash: string; };
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  models: Array<{ modelId: string; version: string; trafficPercentage: number; alias: string; }>;
  startDate: Date;
  endDate: Date;
  successMetrics: string[];
  minimumSampleSize: number;
  status: 'draft' | 'running' | 'completed' | 'paused';
}

// Basic contract for a loaded model
interface FrameworkModel {
  predict: (input: unknown) => unknown | Promise<unknown>;
  dispose?: () => void;
}

const MAX_CACHE_SIZE = 5000;

export class ModelRegistry extends EventEmitter {
  // Optimized storage for O(1) lookups
  private models: Map<string, ModelMetadata> = new Map(); // Key: `${modelId}:${version}`
  private latestModelVersions: Map<string, string> = new Map(); // Key: modelId, Value: latest version string
  
  private loadedModels: Map<string, FrameworkModel> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private predictionCache: Map<string, ModelPrediction> = new Map();
  
  private monitorInterval?: NodeJS.Timeout;

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

    this.validateModelMetadata(fullMetadata);

    const modelKey = this.getModelKey(metadata.id, metadata.version);
    
    // Check for newer version timestamp to update the latest index
    const currentLatestVersion = this.latestModelVersions.get(metadata.id);
    if (!currentLatestVersion || 
       (this.models.get(this.getModelKey(metadata.id, currentLatestVersion))?.createdAt.getTime() || 0) <= fullMetadata.createdAt.getTime()) {
      this.latestModelVersions.set(metadata.id, metadata.version);
    }

    this.models.set(modelKey, fullMetadata);

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

    const modelKey = this.getModelKey(modelId, metadata.version);
    
    if (this.loadedModels.has(modelKey)) {
      logger.debug(`Model already loaded: ${modelKey}`);
      return;
    }

    try {
      let model: FrameworkModel;

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
      logger.error(`Failed to load model: ${modelKey}`, { error });
      throw error;
    }
  }

  /**
   * Make a prediction using a loaded model
   */
  async predict(
    modelId: string, 
    input: Record<string, unknown>, 
    options: {
      version?: string;
      useCache?: boolean;
      explainPrediction?: boolean;
      abTestId?: string;
    } = {}
  ): Promise<ModelPrediction> {
    // High-resolution timer
    const startTime = performance.now();

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

    const modelKey = this.getModelKey(actualModelId, metadata.version);
    const inputHash = this.hashInput(input);
    const cacheKey = `${modelKey}:${inputHash}`;

    if (options.useCache) {
      const cached = this.predictionCache.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for prediction: ${cacheKey}`);
        return cached;
      }
    }

    if (!this.loadedModels.has(modelKey)) {
      await this.loadModel(actualModelId, metadata.version);
    }

    const model = this.loadedModels.get(modelKey);
    if (!model) throw new Error(`Model not loaded: ${modelKey}`);

    try {
      this.validateInput(input, metadata.config.inputSchema);
      const preprocessedInput = await this.preprocessInput(input, metadata.config.preprocessing);
      const rawPrediction = await this.makePrediction(model, preprocessedInput, metadata);
      const processedPrediction = await this.postprocessOutput(rawPrediction, metadata.config.postprocessing);
      const finalPrediction = await this.applyBusinessRules(processedPrediction, metadata.config.businessRules);

      let explanation;
      if (options.explainPrediction) {
        explanation = await this.explainPrediction(model, preprocessedInput, finalPrediction, metadata);
      }

      const latency = performance.now() - startTime;

      const result: ModelPrediction = {
        modelId: actualModelId,
        modelVersion: metadata.version,
        prediction: finalPrediction,
        confidence: this.calculateConfidence(rawPrediction, metadata),
        explanation,
        metadata: { latency, timestamp: new Date(), inputHash }
      };

      if (options.useCache) {
        // Simple cache bounding to prevent memory leaks
        if (this.predictionCache.size >= MAX_CACHE_SIZE) {
            this.predictionCache.clear(); 
        }
        this.predictionCache.set(cacheKey, result);
      }

      this.updatePerformanceMetrics(metadata, latency, true);

      logger.debug(`Prediction completed: ${modelKey}`, { latency, confidence: result.confidence });
      this.emit('predictionMade', result);
      return result;

    } catch (error) {
      const latency = performance.now() - startTime;
      this.updatePerformanceMetrics(metadata, latency, false);
      logger.error(`Prediction failed: ${modelKey}`, { error });
      throw error;
    }
  }

  /**
   * Create and start an A/B test
   */
  async createABTest(config: ABTestConfig): Promise<void> {
    this.validateABTestConfig(config);

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

  getModelPerformance(modelId: string, version?: string): ModelMetadata['metrics'] | null {
    return this.getModelMetadata(modelId, version)?.metrics || null;
  }

  listModels(filters: { type?: ModelMetadata['type']; status?: ModelMetadata['status']; owner?: string; tags?: string[]; } = {}): ModelMetadata[] {
    return Array.from(this.models.values()).filter(model => {
      if (filters.type && model.type !== filters.type) return false;
      if (filters.status && model.status !== filters.status) return false;
      if (filters.owner && model.governance.owner !== filters.owner) return false;
      if (filters.tags && !filters.tags.every(tag => model.governance.tags.includes(tag))) return false;
      return true;
    });
  }

  async updateModelStatus(modelId: string, status: ModelMetadata['status'], user: string, reason?: string): Promise<void> {
    const metadata = this.getModelMetadata(modelId);
    if (!metadata) throw new Error(`Model not found: ${modelId}`);

    const oldStatus = metadata.status;
    metadata.status = status;
    metadata.updatedAt = new Date();

    metadata.governance.auditTrail.push({
      action: 'STATUS_CHANGED',
      user,
      timestamp: new Date(),
      details: `Status changed from ${oldStatus} to ${status}${reason ? `: ${reason}` : ''}`
    });

    logger.info(`Model status updated: ${modelId}`, { oldStatus, newStatus: status, user, reason });
    this.emit('modelStatusChanged', { metadata, oldStatus, newStatus: status });
  }

  // --- Private Helper Methods ---

  private getModelKey(modelId: string, version: string): string {
    return `${modelId}:${version}`;
  }

  private getModelMetadata(modelId: string, version?: string): ModelMetadata | null {
    const targetVersion = version || this.latestModelVersions.get(modelId);
    if (!targetVersion) return null;
    return this.models.get(this.getModelKey(modelId, targetVersion)) || null;
  }

  private validateModelMetadata(metadata: ModelMetadata): void {
    if (!metadata.id || !metadata.name || !metadata.version) throw new Error('Model ID, name, and version are required');
    if (!metadata.governance.owner) throw new Error('Model owner is required');
    if (!metadata.config.inputSchema || Object.keys(metadata.config.inputSchema).length === 0) throw new Error('Input schema is required');
  }

  private validateABTestConfig(config: ABTestConfig): void {
    if (config.models.length < 2) throw new Error('A/B test requires at least 2 models');
    const totalTraffic = config.models.reduce((sum, m) => sum + m.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) throw new Error('Traffic percentages must sum to 100%');
    if (config.startDate >= config.endDate) throw new Error('Start date must be before end date');
  }

  private selectModelForABTest(config: ABTestConfig): ABTestConfig['models'][0] {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (const model of config.models) {
      cumulative += model.trafficPercentage;
      if (random <= cumulative) return model;
    }
    return config.models[0];
  }

  private async loadTensorFlowModel(metadata: ModelMetadata): Promise<FrameworkModel> {
    const modelPath = `./models/${metadata.id}/${metadata.version}/model.json`;
    // Using dynamic import instead of require
    // @ts-expect-error - TensorFlow.js is optional for Phase 2, installed separately if needed
    const tf = await import('@tensorflow/tfjs');
    return await tf.loadLayersModel(`file://${modelPath}`);
  }

  private async loadSklearnModel(_metadata: ModelMetadata): Promise<FrameworkModel> {
    return { predict: (_input: unknown) => [Math.random()] };
  }

  private async loadXGBoostModel(_metadata: ModelMetadata): Promise<FrameworkModel> {
    return { predict: (_input: unknown) => [Math.random()] };
  }

  private async loadCustomModel(metadata: ModelMetadata): Promise<FrameworkModel> {
    const modelPath = `./models/${metadata.id}/${metadata.version}/model.js`;
    return await import(modelPath);
  }

  private validateInput(input: Record<string, unknown>, schema: Record<string, string>): void {
    for (const [field, type] of Object.entries(schema)) {
      if (!(field in input)) throw new Error(`Missing required field: ${field}`);
      const value = input[field];
      const actualType = typeof value;

      if (type === 'number' && actualType !== 'number') throw new Error(`Field ${field} must be a number, got ${actualType}`);
      if (type === 'string' && actualType !== 'string') throw new Error(`Field ${field} must be a string, got ${actualType}`);
      if (type === 'boolean' && actualType !== 'boolean') throw new Error(`Field ${field} must be a boolean, got ${actualType}`);
    }
  }

  private async preprocessInput(input: Record<string, unknown>, steps: string[]): Promise<unknown> {
    let processed = { ...input };
    for (const step of steps) {
      switch (step) {
        case 'normalize': processed = this.normalizeInput(processed); break;
        case 'scale': processed = this.scaleInput(processed); break;
        case 'encode_categorical': processed = this.encodeCategorical(processed); break;
        default: logger.warn(`Unknown preprocessing step: ${step}`);
      }
    }
    return processed;
  }

  private async postprocessOutput(output: unknown, steps: string[]): Promise<unknown> {
    let processed = output;
    for (const step of steps) {
      switch (step) {
        case 'apply_threshold': processed = this.applyThreshold(processed); break;
        case 'round': processed = typeof processed === 'number' ? Math.round(processed) : processed; break;
        default: logger.warn(`Unknown postprocessing step: ${step}`);
      }
    }
    return processed;
  }

  private async applyBusinessRules(prediction: unknown, rules?: string[]): Promise<unknown> {
    if (!rules || rules.length === 0) return prediction;
    const result = typeof prediction === 'object' && prediction !== null ? { ...prediction } : prediction;

    for (const rule of rules) {
      switch (rule) {
        case 'min_confidence_threshold':
          if (typeof result === 'object' && result !== null && 'confidence' in result && (result as Record<string, unknown>).confidence as number < 0.5) {
            (result as Record<string, unknown>).prediction = 'uncertain';
          }
          break;
        case 'fraud_escalation':
          if (typeof result === 'object' && result !== null && 'prediction' in result && (result as Record<string, unknown>).prediction as number > 0.8) {
            (result as Record<string, unknown>).requiresManualReview = true;
          }
          break;
        default:
          logger.warn(`Unknown business rule: ${rule}`);
      }
    }
    return result;
  }

  private async makePrediction(model: FrameworkModel, input: unknown, metadata: ModelMetadata): Promise<unknown> {
    switch (metadata.framework) {
      case 'tensorflow': {
        // @ts-expect-error - TensorFlow.js is optional for Phase 2, installed separately if needed
        const tf = await import('@tensorflow/tfjs');
        const inputRecord = input as Record<string, unknown>;
        const tensor = tf.tensor2d([Object.values(inputRecord)]);
        const prediction = model.predict(tensor) as { data(): Promise<unknown[]>; dispose(): void };
        const result = await prediction.data();
        tensor.dispose();
        prediction.dispose();
        return result[0];
      }
      case 'sklearn':
      case 'xgboost':
      case 'custom':
        return (model.predict([Object.values(input as Record<string, unknown>)]) as unknown[])[0];
      default:
        throw new Error(`Unsupported framework: ${metadata.framework}`);
    }
  }

  private async explainPrediction(_model: unknown, _input: unknown, prediction: unknown, metadata: ModelMetadata): Promise<ModelPrediction['explanation']> {
    const featureNames = Object.keys(metadata.config.inputSchema);
    const featureImportance: Record<string, number> = {};

    featureNames.forEach(feature => { featureImportance[feature] = Math.random(); });

    return {
      featureImportance,
      reasoning: `Prediction based on ${featureNames.length} features with confidence ${this.calculateConfidence(prediction, metadata).toFixed(2)}`,
      alternativeOutcomes: [
        { outcome: 'alternative_1', probability: 0.2 },
        { outcome: 'alternative_2', probability: 0.1 }
      ]
    };
  }

  private calculateConfidence(prediction: unknown, _metadata: ModelMetadata): number {
    return typeof prediction === 'number' ? Math.min(1, Math.abs(prediction - 0.5) * 2) : 0.8;
  }

  private normalizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...input };
    for (const [key, value] of Object.entries(normalized)) {
      if (typeof value === 'number') normalized[key] = value; // min-max logic goes here
    }
    return normalized;
  }

  private scaleInput(input: Record<string, unknown>): Record<string, unknown> {
    const scaled = { ...input };
    for (const [key, value] of Object.entries(scaled)) {
      if (typeof value === 'number') scaled[key] = value; // scaling logic goes here
    }
    return scaled;
  }

  private encodeCategorical(input: Record<string, unknown>): Record<string, unknown> {
    const encoded = { ...input };
    for (const [key, value] of Object.entries(encoded)) {
      if (typeof value === 'string') {
        encoded[key] = Math.abs(value.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) / 0x7fffffff;
      }
    }
    return encoded;
  }

  private applyThreshold(value: unknown): unknown {
    return typeof value === 'number' ? (value > 0.5 ? 1 : 0) : value;
  }

  private hashInput(input: Record<string, unknown>): string {
    const str = JSON.stringify(input, Object.keys(input).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; 
    }
    return hash.toString(36);
  }

  private updatePerformanceMetrics(metadata: ModelMetadata, latency: number, success: boolean): void {
    const deployment = metadata.deployment;
    deployment.latencyP95 = (deployment.latencyP95 * 0.9) + (latency * 0.1);
    
    if (!success) {
      deployment.errorRate = (deployment.errorRate * 0.99) + 0.01;
    } else {
      deployment.errorRate = deployment.errorRate * 0.99;
    }
    
    metadata.updatedAt = new Date();
  }

  private startPerformanceMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.monitorModelPerformance();
    }, 5 * 60 * 1000);
    // Unref allows the process to exit if this is the only active timer
    if (this.monitorInterval.unref) this.monitorInterval.unref(); 
  }

  private async monitorModelPerformance(): Promise<void> {
    for (const metadata of Array.from(this.models.values())) {
      if (metadata.status === 'production') {
        if (metadata.deployment.errorRate > 0.05) {
          logger.warn(`High error rate detected for model: ${metadata.id}`, {
            errorRate: metadata.deployment.errorRate,
            latency: metadata.deployment.latencyP95
          });
          this.emit('modelPerformanceDegraded', metadata);
        }
        
        if (metadata.deployment.latencyP95 > 1000) {
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
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    for (const [key, model] of Array.from(this.loadedModels.entries())) {
      try {
        if (model && typeof model.dispose === 'function') {
          model.dispose();
        }
      } catch (error) {
        logger.warn(`Failed to dispose model: ${key}`, { error });
      }
    }
    
    this.loadedModels.clear();
    this.predictionCache.clear();
    
    logger.info('Model Registry shutdown complete');
  }
}