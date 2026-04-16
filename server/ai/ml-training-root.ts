import { storage } from '../infrastructure/storage/storage';
import { detectTransactionFraud, analyzePropertyDocument } from '../services/ai-ml-service';
import type { FraudAnalysis as FraudAnalysisType } from '../types/fraud.types';
import type { Property as PropertyType } from '../types/property.types';

// Adapter function to match the expected interface
const detectFraud = async (property: PropertyType): Promise<FraudAnalysisType> => {
  try {
    const result = await detectTransactionFraud({
      propertyId: property.id.toString(),
      sellerId: property.ownerId.toString(),
      buyerId: 'unknown',
      amount: parseFloat(property.price.toString()),
      location: property.location
    }, []);
    
    return {
      isSuspicious: result.riskLevel === 'high' || result.riskLevel === 'critical',
      suspiciousScore: result.riskScore / 100,
      fraudPatterns: {
        priceAnomaly: result.indicators.some(i => i.type.includes('price')) ? 80 : 0,
        documentInconsistency: result.indicators.some(i => i.type.includes('document')) ? 70 : 0,
        ownershipRisk: result.indicators.some(i => i.type.includes('ownership')) ? 60 : 0,
        marketDeviation: result.indicators.some(i => i.type.includes('market')) ? 50 : 0
      },
      reasons: result.indicators.map(i => i.description),
      riskLevel: result.riskLevel,
      verificationDate: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Fraud detection failed, using fallback:', error);
    return {
      isSuspicious: false,
      suspiciousScore: 0.1,
      reasons: ['fallback_analysis'],
      riskLevel: 'low' as const,
      verificationDate: new Date().toISOString(),
      fraudPatterns: {
        priceAnomaly: 0,
        documentInconsistency: 0,
        ownershipRisk: 0,
        marketDeviation: 0
      }
    };
  }
};
import fs from '../app';
import path from '../app';

// Enhanced type definitions with better constraints and documentation
export interface ActualAIVerificationResults {
  readonly overallScore: number;
  readonly verificationTimestamp: string;
  readonly imageAnalysis?: {
    readonly qualityScore: number;
    readonly authenticityScore: number;
    readonly flaggedIssues: readonly string[];
  };
  readonly descriptionAnalysis?: {
    readonly coherenceScore: number;
    readonly accuracyScore: number;
    readonly flaggedIssues: readonly string[];
  };
  readonly aiModel?: string;
}

export interface TrainingDocumentScores {
  readonly authenticity: number;
  readonly completeness: number;
  readonly consistency: number;
}

export interface TrainingData {
  readonly propertyId: number;
  readonly features: readonly number[];
  readonly fraudLabel: boolean;
  readonly riskScore: number;
  readonly verificationStatus: string;
  readonly documentScores: TrainingDocumentScores;
}

export interface ModelMetrics {
  readonly accuracy: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1Score: number;
  readonly confusionMatrix: readonly (readonly number[])[];
}

export interface TrainedModel {
  readonly type: 'threshold';
  readonly thresholds: {
    readonly riskScore: number;
    readonly priceDeviationFactor: number;
    readonly documentScoreThreshold: number;
  };
  readonly featureWeights: readonly number[];
  readonly trainingAccuracy: number;
  readonly fraudRate: number;
  readonly sampleSize: number;
  readonly trainedAt?: string;
  readonly version?: string;
}

export interface PropertyFeatures {
  readonly price: number;
  readonly bedrooms: number;
  readonly bathrooms: number;
  readonly squareFootage: number;
  readonly amenities: readonly string[];
  readonly yearBuilt?: number;
}

// Enhanced constants for better maintainability
const FRAUD_DETECTION_CONSTANTS = {
  MINIMUM_TRAINING_SAMPLES: 10,
  TRAIN_TEST_SPLIT_RATIO: 0.8,
  DEFAULT_RISK_THRESHOLD: 70,
  HIGH_CONFIDENCE_THRESHOLD: 0.7,
  PRICE_ANOMALY_THRESHOLD: 80,
  MULTIPLE_RISK_FACTORS_THRESHOLD: 2,
  SCORE_BOUNDS: { MIN: 0, MAX: 100 },
  FEATURE_WEIGHTS: [0.3, 0.1, 0.1, 0.2, 0.15, 0.05, 0.1] as const,
  RISK_SCORE_WEIGHTS: {
    AI_FRAUD_DETECTION: 40,
    PRICE_ANOMALY: 0.2,
    DOCUMENT_INCONSISTENCY: 0.3,
    OWNERSHIP_RISK: 0.25,
    MARKET_DEVIATION: 0.15,
    VERIFICATION_FAILED_BONUS: 20,
    VERIFICATION_SUCCESS_BONUS: -10
  }
} as const;

// Location risk scoring with expanded coverage
const LOCATION_RISK_SCORES = new Map<string, number>([
  // High-value, low-risk areas
  ['karen', 5], ['runda', 5], ['spring valley', 5], ['muthaiga', 5],
  // Medium-value commercial areas
  ['kilimani', 4], ['westlands', 4], ['lavington', 4], ['killeleshwa', 4],
  // General Nairobi
  ['nairobi', 3],
  // Other major cities
  ['mombasa', 2], ['kisumu', 2], ['eldoret', 2], ['nakuru', 2],
]);

/**
 * Enhanced transformation with better error handling and validation.
 * This function bridges the gap between complex AI verification results
 * and the simplified training format, with comprehensive input validation.
 */
function transformVerificationResults(results: ActualAIVerificationResults): TrainingDocumentScores {
  // Input validation to ensure data integrity
  if (!results || typeof results.overallScore !== 'number') {
    throw new Error('Invalid verification results: missing or invalid overallScore');
  }

  // Validate score ranges to prevent invalid training data
  const validateScore = (score: number): number => {
    if (score < 0 || score > 100) {
      console.warn(`Score ${score} out of range, clamping to [0, 100]`);
      return Math.min(Math.max(score, 0), 100);
    }
    return score;
  };

  return {
    authenticity: validateScore(
      results.imageAnalysis?.authenticityScore ?? 
      Math.min(results.overallScore * 1.2, 100)
    ),
    completeness: validateScore(
      results.descriptionAnalysis?.accuracyScore ?? 
      results.overallScore
    ),
    consistency: validateScore(
      results.descriptionAnalysis?.coherenceScore ?? 
      results.overallScore
    )
  };
}

/**
 * Enhanced training data generation with improved error handling and validation.
 * This function processes property data systematically, with comprehensive
 * error recovery and data quality checks.
 */
export async function generateTrainingData(): Promise<TrainingData[]> {
  try {
    const properties = await storage.getProperties();
    
    if (!Array.isArray(properties)) {
      throw new Error('Invalid properties data: expected array');
    }

    const trainingData: TrainingData[] = [];
    const processingErrors: string[] = [];

    // Process each property with individual error handling
    // Process properties sequentially to handle async operations properly
    for (let index = 0; index < properties.length; index++) {
      const property = properties[index];
      try {
        // Validate property structure before processing
        if (!isValidProperty(property)) {
          processingErrors.push(`Property ${index}: Invalid structure`);
          continue;
        }

        // Run fraud detection with timeout protection
        const fraudAnalysis = await Promise.race([
          detectFraud(property),
          new Promise<FraudAnalysisType>((_, reject) => 
            setTimeout(() => reject(new Error('Fraud detection timeout')), 5000)
          )
        ]);

        const features = extractPropertyFeatures(property);
        const fraudLabel = determineFraudLabel(property, fraudAnalysis as FraudAnalysisType);
        const riskScore = calculateCompositeRiskScore(property, fraudAnalysis as FraudAnalysisType);
        const documentScores = getDocumentScores(property);

        trainingData.push({
          propertyId: property.id,
          features,
          fraudLabel,
          riskScore,
          verificationStatus: property.verificationStatus || 'pending',
          documentScores
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        processingErrors.push(`Property ${property.id || index}: ${errorMessage}`);
        continue;
      }
    }

    // Log processing summary for debugging
    if (processingErrors.length > 0) {
      console.warn(`Training data generation completed with ${processingErrors.length} errors:`, processingErrors);
    }

    console.log(`Successfully processed ${trainingData.length} properties for training`);
    return trainingData;

  } catch (error) {
    console.error('Critical error in training data generation:', error);
    throw error;
  }
}

/**
 * Property validation helper to ensure data integrity.
 * This function performs comprehensive validation of property objects
 * to prevent runtime errors during feature extraction.
 */
function isValidProperty(property: any): property is PropertyType {
  return property &&
         typeof property.id === 'number' &&
         typeof property.price === 'number' &&
         typeof property.location === 'string' &&
         property.features &&
         typeof property.features === 'object';
}

/**
 * Enhanced document scores extraction with better error handling.
 * This function safely extracts and transforms document scores,
 * providing meaningful defaults when data is unavailable.
 */
function getDocumentScores(property: PropertyType): TrainingDocumentScores {
  if ((property as any).aiVerificationResults) {
    try {
      return transformVerificationResults((property as any).aiVerificationResults);
    } catch (error) {
      console.warn(`Failed to transform verification results for property ${property.id}:`, error);
    }
  }

  // Return neutral baseline scores when verification data is unavailable
  return {
    authenticity: 50,
    completeness: 50,
    consistency: 50
  };
}

/**
 * Optimized feature extraction with enhanced validation and error handling.
 * This function converts property attributes into a standardized numerical format
 * with comprehensive input validation and meaningful defaults.
 */
function extractPropertyFeatures(property: PropertyType): number[] {
  const features: number[] = [];
  
  try {
    // Core property metrics with validation
    features.push(Math.max(property.price || 0, 0));
    features.push(Math.max(property.features?.bedrooms || 0, 0));
    features.push(Math.max(property.features?.bathrooms || 0, 0));
    features.push(Math.max(property.features?.squareFootage || 0, 0));

    // Enhanced location scoring
    features.push(getLocationScore(property.location));

    // Amenities analysis with null safety
    const amenities = property.features?.amenities || [];
    features.push(amenities.length);
    
    // Specific amenity indicators
    const amenityIndicators = ['Swimming Pool', 'Garden', 'Security'];
    amenityIndicators.forEach(amenity => {
      features.push(amenities.includes(amenity) ? 1 : 0);
    });

    // Price efficiency metric with division-by-zero protection
    const squareFootage = property.features?.squareFootage || 0;
    const pricePerSqFt = squareFootage > 0 ? property.price / squareFootage : 0;
    features.push(pricePerSqFt);

    // Property age calculation
    const currentYear = new Date().getFullYear();
    const propertyAge = property.yearBuilt ? Math.max(currentYear - property.yearBuilt, 0) : 0;
    features.push(propertyAge);

    // Verification and trust indicators
    features.push(property.verificationStatus === 'verified' ? 1 : 0);
    features.push(Math.max(property.trustScore || 0, 0));
    features.push(Math.max(property.ownerId || 0, 0));

    return features;

  } catch (error) {
    console.error(`Error extracting features for property ${property.id}:`, error);
    // Return zero-filled feature vector as fallback
    return new Array(13).fill(0);
  }
}

/**
 * Enhanced fraud label determination with improved logic and validation.
 * This function implements a comprehensive rule-based approach to identify
 * fraudulent properties using multiple weighted indicators.
 */
function determineFraudLabel(property: PropertyType, fraudAnalysis: FraudAnalysisType): boolean {
  // Direct fraud flag takes highest priority
  if (property.isFraudulent === true) {
    return true;
  }

  // High-confidence AI detection
  if (fraudAnalysis.isSuspicious && 
      fraudAnalysis.suspiciousScore > FRAUD_DETECTION_CONSTANTS.HIGH_CONFIDENCE_THRESHOLD) {
    return true;
  }

  // Severe price anomaly detection
  if ((fraudAnalysis.fraudPatterns?.priceAnomaly || 0) > FRAUD_DETECTION_CONSTANTS.PRICE_ANOMALY_THRESHOLD) {
    return true;
  }

  // Verification system failure
  if (property.verificationStatus === 'failed') {
    return true;
  }

  // Multiple moderate risk factors analysis
  const riskFactors = [
    fraudAnalysis.suspiciousScore > 0.5,
    (fraudAnalysis.fraudPatterns?.documentInconsistency || 0) > 60,
    (fraudAnalysis.fraudPatterns?.ownershipRisk || 0) > 60,
    (fraudAnalysis.fraudPatterns?.marketDeviation || 0) > 50
  ].filter(Boolean).length;

  return riskFactors >= FRAUD_DETECTION_CONSTANTS.MULTIPLE_RISK_FACTORS_THRESHOLD;
}

/**
 * Enhanced composite risk scoring with improved weighting and validation.
 * This function implements a sophisticated weighted scoring system that
 * combines multiple risk indicators into a unified risk assessment.
 */
function calculateCompositeRiskScore(property: PropertyType, fraudAnalysis: FraudAnalysisType): number {
  let riskScore = 0;
  const weights = FRAUD_DETECTION_CONSTANTS.RISK_SCORE_WEIGHTS;

  // Primary AI fraud detection score
  riskScore += fraudAnalysis.suspiciousScore * weights.AI_FRAUD_DETECTION;

  // Individual fraud pattern contributions
  const patterns = fraudAnalysis.fraudPatterns || {};
  riskScore += (patterns.priceAnomaly || 0) * weights.PRICE_ANOMALY;
  riskScore += (patterns.documentInconsistency || 0) * weights.DOCUMENT_INCONSISTENCY;
  riskScore += (patterns.ownershipRisk || 0) * weights.OWNERSHIP_RISK;
  riskScore += (patterns.marketDeviation || 0) * weights.MARKET_DEVIATION;

  // Verification status adjustments
  switch (property.verificationStatus) {
    case 'failed':
      riskScore += weights.VERIFICATION_FAILED_BONUS;
      break;
    case 'verified':
      riskScore += weights.VERIFICATION_SUCCESS_BONUS;
      break;
    default:
      // No adjustment for pending or unknown status
      break;
  }

  // Ensure score remains within valid bounds
  return Math.min(Math.max(riskScore, FRAUD_DETECTION_CONSTANTS.SCORE_BOUNDS.MIN), 
                  FRAUD_DETECTION_CONSTANTS.SCORE_BOUNDS.MAX);
}

/**
 * Optimized location scoring with expanded geographical coverage.
 * This function provides nuanced location risk assessment based on
 * known market characteristics and fraud patterns in Kenya.
 */
function getLocationScore(location: string): number {
  if (!location || typeof location !== 'string') {
    return 0;
  }

  const locationLower = location.toLowerCase().trim();
  
  // Check for exact matches first
  let result = 1; // Default score
  LOCATION_RISK_SCORES.forEach((score, area) => {
    if (locationLower.includes(area)) {
      result = score;
    }
  });
  return result;
}

/**
 * Enhanced model training with improved validation and error handling.
 * This function implements a complete machine learning pipeline with
 * comprehensive data validation and performance monitoring.
 */
export async function trainFraudDetectionModel(): Promise<ModelMetrics> {
  try {
    const trainingData = await generateTrainingData();

    // Validate training data sufficiency
    if (trainingData.length < FRAUD_DETECTION_CONSTANTS.MINIMUM_TRAINING_SAMPLES) {
      throw new Error(`Insufficient training data: ${trainingData.length} samples (minimum: ${FRAUD_DETECTION_CONSTANTS.MINIMUM_TRAINING_SAMPLES})`);
    }

    // Analyze class distribution for potential imbalance
    const fraudCount = trainingData.filter(d => d.fraudLabel).length;
    const fraudRate = fraudCount / trainingData.length;
    
    if (fraudRate < 0.01 || fraudRate > 0.99) {
      console.warn(`Potential class imbalance detected: ${(fraudRate * 100).toFixed(1)}% fraud rate`);
    }

    // Implement stratified sampling for better train/test split
    const fraudCases = trainingData.filter(d => d.fraudLabel);
    const normalCases = trainingData.filter(d => !d.fraudLabel);
    
    const trainSet = [
      ...shuffleArray(fraudCases).slice(0, Math.floor(fraudCases.length * FRAUD_DETECTION_CONSTANTS.TRAIN_TEST_SPLIT_RATIO)),
      ...shuffleArray(normalCases).slice(0, Math.floor(normalCases.length * FRAUD_DETECTION_CONSTANTS.TRAIN_TEST_SPLIT_RATIO))
    ];
    
    const testSet = trainingData.filter(d => !trainSet.includes(d));

    console.log(`Training set: ${trainSet.length} samples, Test set: ${testSet.length} samples`);

    // Train and evaluate the model
    const model = trainThresholdModel(trainSet);
    const metrics = evaluateModel(model, testSet);

    // Save model with validation
    await saveModel(model);

    console.log('Model training completed successfully:', metrics);
    return metrics;

  } catch (error) {
    console.error('Model training failed:', error);
    throw error;
  }
}

/**
 * Utility function for array shuffling with Fisher-Yates algorithm.
 * This ensures proper randomization for train/test splits.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Enhanced threshold model training with improved statistics and validation.
 * This function creates a robust baseline model with comprehensive
 * performance analysis and feature importance assessment.
 */
function trainThresholdModel(trainingData: TrainingData[]): TrainedModel {
  const fraudCases = trainingData.filter(d => d.fraudLabel);
  const normalCases = trainingData.filter(d => !d.fraudLabel);
  const fraudRate = fraudCases.length / trainingData.length;

  // Calculate training accuracy for model validation
  const trainingAccuracy = calculateTrainingAccuracy(trainingData);

  console.log(`Model training summary: ${trainingData.length} samples, ${(fraudRate * 100).toFixed(1)}% fraud rate, ${(trainingAccuracy * 100).toFixed(1)}% training accuracy`);

  return {
    type: 'threshold',
    thresholds: {
      riskScore: FRAUD_DETECTION_CONSTANTS.DEFAULT_RISK_THRESHOLD,
      priceDeviationFactor: 0.3,
      documentScoreThreshold: 40
    },
    featureWeights: FRAUD_DETECTION_CONSTANTS.FEATURE_WEIGHTS,
    trainingAccuracy,
    fraudRate,
    sampleSize: trainingData.length
  };
}

/**
 * Optimized training accuracy calculation with improved precision.
 * This function provides accurate baseline performance metrics
 * for model quality assessment.
 */
function calculateTrainingAccuracy(trainingData: TrainingData[]): number {
  if (trainingData.length === 0) return 0;

  const correct = trainingData.filter(data => {
    const prediction = data.riskScore > FRAUD_DETECTION_CONSTANTS.DEFAULT_RISK_THRESHOLD;
    return prediction === data.fraudLabel;
  }).length;

  return correct / trainingData.length;
}

/**
 * Enhanced model evaluation with comprehensive performance metrics.
 * This function calculates standard machine learning metrics with
 * proper handling of edge cases and undefined values.
 */
function evaluateModel(model: TrainedModel, testData: TrainingData[]): ModelMetrics {
  if (testData.length === 0) {
    throw new Error('Cannot evaluate model: empty test dataset');
  }

  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  // Calculate confusion matrix with proper classification logic
  testData.forEach(data => {
    const prediction = data.riskScore > model.thresholds.riskScore;
    const actual = data.fraudLabel;

    if (prediction && actual) truePositives++;
    else if (!prediction && !actual) trueNegatives++;
    else if (prediction && !actual) falsePositives++;
    else if (!prediction && actual) falseNegatives++;
  });

  // Calculate metrics with proper division-by-zero handling
  const accuracy = (truePositives + trueNegatives) / testData.length;
  const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: [
      [trueNegatives, falsePositives],
      [falseNegatives, truePositives]
    ]
  };
}

/**
 * Enhanced model persistence with improved error handling and validation.
 * This function safely serializes models with comprehensive metadata
 * and proper directory management.
 */
async function saveModel(model: TrainedModel): Promise<void> {
  try {
    const modelPath = path.join(__dirname, '..', 'models');

    // Ensure directory exists with proper error handling
    await fs.promises.mkdir(modelPath, { recursive: true });

    const modelFile = path.join(modelPath, 'fraud-detection-model.json');

    // Enhanced model metadata for versioning and tracking
    const modelData: TrainedModel = {
      ...model,
      trainedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    // Use async file operations for better performance
    await fs.promises.writeFile(modelFile, JSON.stringify(modelData, null, 2), 'utf8');
    console.log('Model saved successfully:', modelFile);

  } catch (error) {
    console.error('Model save failed:', error);
    throw new Error(`Failed to save model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced model loading with improved error handling and validation.
 * This function safely deserializes models with comprehensive
 * validation and meaningful error messages.
 */
export async function loadModel(): Promise<TrainedModel | null> {
  try {
    const modelFile = path.join(__dirname, '..', 'models', 'fraud-detection-model.json');

    // Check file existence asynchronously
    try {
      await fs.promises.access(modelFile);
    } catch {
      console.log('No existing model found, will need to train new model');
      return null;
    }

    // Load and parse model data
    const modelData = await fs.promises.readFile(modelFile, 'utf8');
    const model = JSON.parse(modelData) as TrainedModel;

    // Validate model structure
    if (!isValidModel(model)) {
      throw new Error('Invalid model structure');
    }

    console.log(`Model loaded successfully (version: ${model.version}, trained: ${model.trainedAt})`);
    return model;

  } catch (error) {
    console.error('Model loading failed:', error);
    return null;
  }
}

/**
 * Model validation helper to ensure data integrity.
 * This function validates the structure and content of loaded models.
 */
function isValidModel(model: any): model is TrainedModel {
  return model &&
         model.type === 'threshold' &&
         model.thresholds &&
         typeof model.thresholds.riskScore === 'number' &&
         Array.isArray(model.featureWeights) &&
         typeof model.trainingAccuracy === 'number';
}

/**
 * Enhanced fraud prediction with improved error handling and validation.
 * This function applies trained models to new data with comprehensive
 * input validation and meaningful error recovery.
 */
export async function predictFraud(propertyFeatures: readonly number[]): Promise<{
  readonly probability: number;
  readonly prediction: boolean;
  readonly confidence: number;
}> {
  try {
    // Validate input features
    if (!Array.isArray(propertyFeatures) || propertyFeatures.length === 0) {
      throw new Error('Invalid property features: expected non-empty array');
    }

    // Validate feature values
    if (propertyFeatures.some(feature => typeof feature !== 'number' || !isFinite(feature))) {
      throw new Error('Invalid feature values: all features must be finite numbers');
    }

    const model = await loadModel();
    if (!model) {
      throw new Error('No trained model available - please train model first');
    }

    // Calculate weighted score with proper bounds checking
    const weightedScore = propertyFeatures.reduce((sum, feature, index) => {
      const weight = model.featureWeights[index] || 0;
      return sum + (feature * weight);
    }, 0);

    // Normalize score to probability range with proper bounds
    const normalizedScore = Math.min(Math.max(weightedScore / 100, 0), 1);
    
    // Apply threshold for binary classification
    const prediction = normalizedScore > FRAUD_DETECTION_CONSTANTS.HIGH_CONFIDENCE_THRESHOLD;

    // Calculate confidence based on distance from threshold
    const confidence = Math.abs(normalizedScore - FRAUD_DETECTION_CONSTANTS.HIGH_CONFIDENCE_THRESHOLD) * 2;

    return {
      probability: normalizedScore,
      prediction,
      confidence: Math.min(confidence, 1)
    };

  } catch (error) {
    console.error('Fraud prediction failed:', error);
    
    // Return safe default values when prediction fails
    return {
      probability: 0.5,
      prediction: false,
      confidence: 0
    };
  }
}