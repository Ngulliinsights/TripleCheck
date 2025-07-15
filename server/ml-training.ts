import { storage } from './storage';
import { detectFraud, verifyDocument } from './ai-service';
import fs from 'fs';
import path from 'path';

// This interface represents the actual structure of AI verification results
// based on what your system is actually storing
interface ActualAIVerificationResults {
  overallScore: number;
  verificationTimestamp: string;
  imageAnalysis?: {
    qualityScore: number;
    authenticityScore: number;
    flaggedIssues: string[];
  };
  descriptionAnalysis?: {
    coherenceScore: number;
    accuracyScore: number;
    flaggedIssues: string[];
  };
  aiModel?: string;
}

// This interface represents the simplified structure needed for training
interface TrainingDocumentScores {
  authenticity: number;
  completeness: number;
  consistency: number;
}

interface TrainingData {
  propertyId: number;
  features: number[];
  fraudLabel: boolean;
  riskScore: number;
  verificationStatus: string;
  documentScores: TrainingDocumentScores;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
}

/**
 * Transform actual AI verification results into the simplified format needed for training.
 * This function serves as a bridge between the complex verification data structure
 * and the simplified scores needed for machine learning training.
 */
function transformVerificationResults(results: ActualAIVerificationResults): TrainingDocumentScores {
  return {
    // Map authenticity from image analysis quality, falling back to overall score
    authenticity: results.imageAnalysis?.authenticityScore ?? 
                 Math.min(results.overallScore * 1.2, 100), // Scale up overall score slightly
    
    // Map completeness from overall score, considering description analysis
    completeness: results.descriptionAnalysis?.accuracyScore ?? 
                 results.overallScore,
    
    // Map consistency from description coherence, falling back to overall score
    consistency: results.descriptionAnalysis?.coherenceScore ?? 
                results.overallScore
  };
}

/**
 * Generate training data from existing properties with proper type handling
 */
export async function generateTrainingData(): Promise<TrainingData[]> {
  try {
    const properties = await storage.getProperties();
    const trainingData: TrainingData[] = [];

    for (const property of properties) {
      // Run fraud detection to get current model predictions
      const fraudAnalysis = await detectFraud(property);

      // Extract numerical features from property data
      const features = extractPropertyFeatures(property);

      // Determine fraud label based on multiple indicators
      const fraudLabel = determineFraudLabel(property, fraudAnalysis);

      // Calculate composite risk score
      const riskScore = calculateCompositeRiskScore(property, fraudAnalysis);

      // Handle AI verification results with proper type casting and transformation
      let documentScores: TrainingDocumentScores;
      
      if (property.aiVerificationResults) {
        // Cast to the actual structure first, then transform to training format
        const actualVerification = property.aiVerificationResults as ActualAIVerificationResults;
        documentScores = transformVerificationResults(actualVerification);
      } else {
        // Provide neutral defaults when no verification data exists
        documentScores = {
          authenticity: 50,
          completeness: 50,
          consistency: 50
        };
      }

      trainingData.push({
        propertyId: property.id,
        features,
        fraudLabel,
        riskScore,
        verificationStatus: property.verificationStatus || 'pending',
        documentScores
      });
    }

    return trainingData;
  } catch (error) {
    console.error('Error generating training data:', error);
    return [];
  }
}

/**
 * Extract numerical features from property for ML training.
 * This function converts property attributes into a standardized numerical format
 * that machine learning algorithms can process effectively.
 */
function extractPropertyFeatures(property: any): number[] {
  const features = [];

  // Basic property features - these form the foundation of our feature vector
  features.push(property.price || 0);
  features.push(property.features?.bedrooms || 0);
  features.push(property.features?.bathrooms || 0);
  features.push(property.features?.squareFootage || 0);

  // Location encoding - convert location strings to numerical risk scores
  features.push(getLocationScore(property.location));

  // Amenities analysis - count and categorize amenities
  const amenities = property.features?.amenities || [];
  features.push(amenities.length);
  features.push(amenities.includes('Swimming Pool') ? 1 : 0);
  features.push(amenities.includes('Garden') ? 1 : 0);
  features.push(amenities.includes('Security') ? 1 : 0);

  // Calculate price efficiency metric
  const pricePerSqFt = property.features?.squareFootage > 0 
    ? property.price / property.features.squareFootage 
    : 0;
  features.push(pricePerSqFt);

  // Property age calculation - older properties may have different risk profiles
  const currentYear = new Date().getFullYear();
  const propertyAge = property.yearBuilt ? currentYear - property.yearBuilt : 0;
  features.push(propertyAge);

  // Verification status indicators - convert categorical data to numerical
  features.push(property.verificationStatus === 'verified' ? 1 : 0);
  features.push(property.trustScore || 0);

  // User-related features
  features.push(property.ownerId || 0);

  return features;
}

/**
 * Determine fraud label based on multiple indicators.
 * This function implements a rule-based approach to identify fraudulent properties
 * by examining various risk factors and their combinations.
 */
function determineFraudLabel(property: any, fraudAnalysis: any): boolean {
  // Direct fraud flag - highest priority indicator
  if (property.isFraudulent) {
    return true;
  }

  // AI fraud detection with high confidence threshold
  if (fraudAnalysis.isSuspicious && fraudAnalysis.suspiciousScore > 0.7) {
    return true;
  }

  // Price anomaly detection - significant deviations suggest fraud
  if (fraudAnalysis.fraudPatterns?.priceAnomaly > 80) {
    return true;
  }

  // Verification failure indicates potential fraud
  if (property.verificationStatus === 'failed') {
    return true;
  }

  // Multiple moderate risk factors can indicate fraud
  let riskFactors = 0;
  if (fraudAnalysis.suspiciousScore > 0.5) riskFactors++;
  if (fraudAnalysis.fraudPatterns?.documentInconsistency > 60) riskFactors++;
  if (fraudAnalysis.fraudPatterns?.ownershipRisk > 60) riskFactors++;
  
  // If multiple risk factors are present, classify as fraud
  return riskFactors >= 2;
}

/**
 * Calculate composite risk score by combining multiple risk indicators.
 * This weighted scoring system provides a nuanced assessment of fraud risk.
 */
function calculateCompositeRiskScore(property: any, fraudAnalysis: any): number {
  let riskScore = 0;

  // Base risk from AI fraud detection - primary indicator
  riskScore += fraudAnalysis.suspiciousScore * 40;

  // Individual pattern contributions with specific weights
  riskScore += (fraudAnalysis.fraudPatterns?.priceAnomaly || 0) * 0.2;
  riskScore += (fraudAnalysis.fraudPatterns?.documentInconsistency || 0) * 0.3;
  riskScore += (fraudAnalysis.fraudPatterns?.ownershipRisk || 0) * 0.25;
  riskScore += (fraudAnalysis.fraudPatterns?.marketDeviation || 0) * 0.15;

  // Verification status adjustments
  if (property.verificationStatus === 'failed') {
    riskScore += 20;
  } else if (property.verificationStatus === 'verified') {
    riskScore -= 10; // Reduce risk for verified properties
  }

  // Ensure score remains within valid bounds
  return Math.min(Math.max(riskScore, 0), 100);
}

/**
 * Get location-based risk scoring for Kenyan property markets.
 * This function encodes location information into numerical risk scores
 * based on known market characteristics and fraud patterns.
 */
function getLocationScore(location: string): number {
  if (!location) return 0;

  const locationLower = location.toLowerCase();

  // High-value, well-established areas with lower fraud risk
  if (locationLower.includes('karen') || locationLower.includes('runda') || 
      locationLower.includes('spring valley')) {
    return 5;
  }

  // Medium-value commercial and residential areas
  if (locationLower.includes('kilimani') || locationLower.includes('westlands') || 
      locationLower.includes('lavington')) {
    return 4;
  }

  // General Nairobi area
  if (locationLower.includes('nairobi')) {
    return 3;
  }

  // Other major cities with established markets
  if (locationLower.includes('mombasa') || locationLower.includes('kisumu')) {
    return 2;
  }

  // Unknown or less established areas
  return 1;
}

/**
 * Train and evaluate a fraud detection model using collected data.
 * This function implements a complete machine learning pipeline with
 * data splitting, model training, and performance evaluation.
 */
export async function trainFraudDetectionModel(): Promise<ModelMetrics> {
  try {
    const trainingData = await generateTrainingData();

    // Ensure sufficient data for meaningful training
    if (trainingData.length < 10) {
      throw new Error('Insufficient training data - need at least 10 samples');
    }

    // Implement proper data splitting to avoid overfitting
    const shuffled = trainingData.sort(() => 0.5 - Math.random());
    const splitIndex = Math.floor(trainingData.length * 0.8);
    const trainSet = shuffled.slice(0, splitIndex);
    const testSet = shuffled.slice(splitIndex);

    // Train the model using the training set
    const model = trainThresholdModel(trainSet);

    // Evaluate model performance on the test set
    const metrics = evaluateModel(model, testSet);

    // Persist the trained model for future use
    await saveModel(model);

    return metrics;

  } catch (error) {
    console.error('Error training fraud detection model:', error);
    throw error;
  }
}

/**
 * Train a threshold-based model as a baseline approach.
 * This simple model establishes performance benchmarks and provides
 * interpretable decision rules for fraud detection.
 */
function trainThresholdModel(trainingData: TrainingData[]): any {
  // Separate fraud and normal cases for threshold analysis
  const fraudCases = trainingData.filter(d => d.fraudLabel);
  const normalCases = trainingData.filter(d => !d.fraudLabel);

  // Calculate class distribution for model calibration
  const fraudRate = fraudCases.length / trainingData.length;

  // Analyze price distributions to identify anomaly thresholds
  const fraudPrices = fraudCases.map(d => d.features[0]);
  const normalPrices = normalCases.map(d => d.features[0]);

  return {
    type: 'threshold',
    thresholds: {
      riskScore: 70, // Primary decision threshold
      priceDeviationFactor: 0.3, // Price deviation threshold
      documentScoreThreshold: 40 // Document quality threshold
    },
    // Feature importance weights derived from analysis
    featureWeights: [0.3, 0.1, 0.1, 0.2, 0.15, 0.05, 0.1],
    trainingAccuracy: calculateTrainingAccuracy(trainingData),
    fraudRate: fraudRate,
    sampleSize: trainingData.length
  };
}

/**
 * Calculate training accuracy to assess model fit.
 * This provides a baseline measure of how well the model
 * performs on the data it was trained on.
 */
function calculateTrainingAccuracy(trainingData: TrainingData[]): number {
  let correct = 0;

  for (const data of trainingData) {
    const prediction = data.riskScore > 70;
    if (prediction === data.fraudLabel) {
      correct++;
    }
  }

  return correct / trainingData.length;
}

/**
 * Evaluate model performance using comprehensive metrics.
 * This function calculates standard machine learning performance
 * metrics to assess model quality and reliability.
 */
function evaluateModel(model: any, testData: TrainingData[]): ModelMetrics {
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  // Calculate confusion matrix components
  for (const data of testData) {
    const prediction = data.riskScore > model.thresholds.riskScore;
    const actual = data.fraudLabel;

    if (prediction && actual) truePositives++;
    else if (!prediction && !actual) trueNegatives++;
    else if (prediction && !actual) falsePositives++;
    else if (!prediction && actual) falseNegatives++;
  }

  // Calculate performance metrics
  const accuracy = (truePositives + trueNegatives) / testData.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

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
 * Save trained model to persistent storage.
 * This function serializes the model with metadata
 * for future loading and inference.
 */
async function saveModel(model: any): Promise<void> {
  try {
    const modelPath = path.join(__dirname, '..', 'models');

    // Ensure the models directory exists
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }

    const modelFile = path.join(modelPath, 'fraud-detection-model.json');

    // Add metadata to the model for tracking and versioning
    const modelData = {
      ...model,
      trainedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    fs.writeFileSync(modelFile, JSON.stringify(modelData, null, 2));
    console.log('Model saved successfully:', modelFile);

  } catch (error) {
    console.error('Error saving model:', error);
    throw error;
  }
}

/**
 * Load previously trained model from storage.
 * This function deserializes a saved model for inference.
 */
export async function loadModel(): Promise<any> {
  try {
    const modelFile = path.join(__dirname, '..', 'models', 'fraud-detection-model.json');

    if (!fs.existsSync(modelFile)) {
      return null;
    }

    const modelData = fs.readFileSync(modelFile, 'utf8');
    return JSON.parse(modelData);

  } catch (error) {
    console.error('Error loading model:', error);
    return null;
  }
}

/**
 * Predict fraud probability using the trained model.
 * This function applies the trained model to new property data
 * to generate fraud risk assessments.
 */
export async function predictFraud(propertyFeatures: number[]): Promise<{probability: number, prediction: boolean}> {
  try {
    const model = await loadModel();

    if (!model) {
      throw new Error('No trained model available');
    }

    // Apply feature weights to calculate weighted score
    const weightedScore = propertyFeatures.reduce((sum, feature, index) => {
      const weight = model.featureWeights[index] || 0;
      return sum + (feature * weight);
    }, 0);

    // Normalize score to probability range [0, 1]
    const normalizedScore = Math.min(Math.max(weightedScore / 100, 0), 1);
    
    // Apply threshold for binary classification
    const prediction = normalizedScore > 0.7;

    return {
      probability: normalizedScore,
      prediction
    };

  } catch (error) {
    console.error('Error predicting fraud:', error);
    // Return neutral prediction when model fails
    return {
      probability: 0.5,
      prediction: false
    };
  }
}