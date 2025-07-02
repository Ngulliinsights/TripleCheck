
import { storage } from './storage';
import { detectFraud, verifyDocument } from './ai-service';
import fs from 'fs';
import path from 'path';

interface TrainingData {
  propertyId: number;
  features: number[];
  fraudLabel: boolean;
  riskScore: number;
  verificationStatus: string;
  documentScores: {
    authenticity: number;
    completeness: number;
    consistency: number;
  };
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
}

/**
 * Generate training data from existing properties
 */
export async function generateTrainingData(): Promise<TrainingData[]> {
  try {
    const properties = await storage.getAllProperties();
    const trainingData: TrainingData[] = [];
    
    for (const property of properties) {
      // Run fraud detection to get current model predictions
      const fraudAnalysis = await detectFraud(property);
      
      // Extract features
      const features = extractPropertyFeatures(property);
      
      // Determine fraud label based on multiple indicators
      const fraudLabel = determineFraudLabel(property, fraudAnalysis);
      
      // Calculate composite risk score
      const riskScore = calculateCompositeRiskScore(property, fraudAnalysis);
      
      // Get document verification scores if available
      const documentScores = property.aiVerificationResults ? {
        authenticity: property.aiVerificationResults.authenticity || 50,
        completeness: property.aiVerificationResults.completeness || 50,
        consistency: property.aiVerificationResults.consistency || 50
      } : {
        authenticity: 50,
        completeness: 50,
        consistency: 50
      };
      
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
 * Extract numerical features from property for ML training
 */
function extractPropertyFeatures(property: any): number[] {
  const features = [];
  
  // Basic property features
  features.push(property.price || 0);
  features.push(property.features?.bedrooms || 0);
  features.push(property.features?.bathrooms || 0);
  features.push(property.features?.squareFootage || 0);
  
  // Location encoding
  features.push(getLocationScore(property.location));
  
  // Amenities count and type encoding
  const amenities = property.features?.amenities || [];
  features.push(amenities.length);
  features.push(amenities.includes('Swimming Pool') ? 1 : 0);
  features.push(amenities.includes('Garden') ? 1 : 0);
  features.push(amenities.includes('Security') ? 1 : 0);
  
  // Price per square foot
  const pricePerSqFt = property.features?.squareFootage > 0 
    ? property.price / property.features.squareFootage 
    : 0;
  features.push(pricePerSqFt);
  
  // Property age
  const currentYear = new Date().getFullYear();
  const propertyAge = property.yearBuilt ? currentYear - property.yearBuilt : 0;
  features.push(propertyAge);
  
  // Verification indicators
  features.push(property.verificationStatus === 'verified' ? 1 : 0);
  features.push(property.trustScore || 0);
  
  // User indicators
  features.push(property.ownerId || 0);
  
  return features;
}

/**
 * Determine fraud label based on multiple indicators
 */
function determineFraudLabel(property: any, fraudAnalysis: any): boolean {
  // Check if property has known fraud indicators
  if (property.isFraudulent) {
    return true;
  }
  
  // Check if AI fraud detection flagged it with high confidence
  if (fraudAnalysis.isSuspicious && fraudAnalysis.suspiciousScore > 0.7) {
    return true;
  }
  
  // Check for price anomalies
  if (fraudAnalysis.fraudPatterns?.priceAnomaly > 80) {
    return true;
  }
  
  // Check verification status
  if (property.verificationStatus === 'failed') {
    return true;
  }
  
  return false;
}

/**
 * Calculate composite risk score
 */
function calculateCompositeRiskScore(property: any, fraudAnalysis: any): number {
  let riskScore = 0;
  
  // Base risk from fraud detection
  riskScore += fraudAnalysis.suspiciousScore * 40;
  
  // Price anomaly contribution
  riskScore += (fraudAnalysis.fraudPatterns?.priceAnomaly || 0) * 0.2;
  
  // Document inconsistency contribution
  riskScore += (fraudAnalysis.fraudPatterns?.documentInconsistency || 0) * 0.3;
  
  // Ownership risk contribution
  riskScore += (fraudAnalysis.fraudPatterns?.ownershipRisk || 0) * 0.25;
  
  // Market deviation contribution
  riskScore += (fraudAnalysis.fraudPatterns?.marketDeviation || 0) * 0.15;
  
  // Verification status impact
  if (property.verificationStatus === 'failed') {
    riskScore += 20;
  } else if (property.verificationStatus === 'verified') {
    riskScore -= 10;
  }
  
  return Math.min(Math.max(riskScore, 0), 100);
}

/**
 * Get location-based risk scoring
 */
function getLocationScore(location: string): number {
  if (!location) return 0;
  
  const locationLower = location.toLowerCase();
  
  // High-value, low-risk areas
  if (locationLower.includes('karen') || locationLower.includes('runda') || 
      locationLower.includes('spring valley')) {
    return 5;
  }
  
  // Medium-value areas
  if (locationLower.includes('kilimani') || locationLower.includes('westlands') || 
      locationLower.includes('lavington')) {
    return 4;
  }
  
  // Nairobi general
  if (locationLower.includes('nairobi')) {
    return 3;
  }
  
  // Other major cities
  if (locationLower.includes('mombasa') || locationLower.includes('kisumu')) {
    return 2;
  }
  
  return 1;
}

/**
 * Train and evaluate a simple fraud detection model
 */
export async function trainFraudDetectionModel(): Promise<ModelMetrics> {
  try {
    const trainingData = await generateTrainingData();
    
    if (trainingData.length < 10) {
      throw new Error('Insufficient training data');
    }
    
    // Split data into training and testing sets (80/20)
    const shuffled = trainingData.sort(() => 0.5 - Math.random());
    const splitIndex = Math.floor(trainingData.length * 0.8);
    const trainSet = shuffled.slice(0, splitIndex);
    const testSet = shuffled.slice(splitIndex);
    
    // Simple threshold-based model for demonstration
    // In production, you would use a proper ML library like TensorFlow.js
    const model = trainThresholdModel(trainSet);
    
    // Evaluate model on test set
    const metrics = evaluateModel(model, testSet);
    
    // Save model parameters
    await saveModel(model);
    
    return metrics;
    
  } catch (error) {
    console.error('Error training fraud detection model:', error);
    throw error;
  }
}

/**
 * Simple threshold-based model training
 */
function trainThresholdModel(trainingData: TrainingData[]): any {
  // Calculate optimal thresholds for different features
  const fraudCases = trainingData.filter(d => d.fraudLabel);
  const normalCases = trainingData.filter(d => !d.fraudLabel);
  
  // Price threshold analysis
  const fraudPrices = fraudCases.map(d => d.features[0]);
  const normalPrices = normalCases.map(d => d.features[0]);
  
  return {
    type: 'threshold',
    thresholds: {
      riskScore: 70, // Risk score above 70 indicates fraud
      priceDeviationFactor: 0.3, // Price deviation > 30% is suspicious
      documentScoreThreshold: 40 // Document scores below 40 are concerning
    },
    featureWeights: [0.3, 0.1, 0.1, 0.2, 0.15, 0.05, 0.1], // Weights for different features
    trainingAccuracy: calculateTrainingAccuracy(trainingData)
  };
}

/**
 * Calculate training accuracy
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
 * Evaluate model performance
 */
function evaluateModel(model: any, testData: TrainingData[]): ModelMetrics {
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  for (const data of testData) {
    const prediction = data.riskScore > model.thresholds.riskScore;
    const actual = data.fraudLabel;
    
    if (prediction && actual) truePositives++;
    else if (!prediction && !actual) trueNegatives++;
    else if (prediction && !actual) falsePositives++;
    else if (!prediction && actual) falseNegatives++;
  }
  
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
 * Save trained model to file
 */
async function saveModel(model: any): Promise<void> {
  try {
    const modelPath = path.join(__dirname, '../models');
    
    // Ensure models directory exists
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }
    
    const modelFile = path.join(modelPath, 'fraud-detection-model.json');
    
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
 * Load saved model from file
 */
export async function loadModel(): Promise<any> {
  try {
    const modelFile = path.join(__dirname, '../models/fraud-detection-model.json');
    
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
 * Predict fraud probability using trained model
 */
export async function predictFraud(propertyFeatures: number[]): Promise<{probability: number, prediction: boolean}> {
  try {
    const model = await loadModel();
    
    if (!model) {
      throw new Error('No trained model available');
    }
    
    // Simple threshold-based prediction
    // In production, this would use the actual ML model
    const weightedScore = propertyFeatures.reduce((sum, feature, index) => {
      const weight = model.featureWeights[index] || 0;
      return sum + (feature * weight);
    }, 0);
    
    const normalizedScore = Math.min(Math.max(weightedScore / 100, 0), 1);
    const prediction = normalizedScore > 0.7;
    
    return {
      probability: normalizedScore,
      prediction
    };
    
  } catch (error) {
    console.error('Error predicting fraud:', error);
    return {
      probability: 0.5,
      prediction: false
    };
  }
}
