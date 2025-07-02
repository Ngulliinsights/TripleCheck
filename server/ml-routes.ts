
import { Express, Request, Response } from "express";
import { generateTrainingData, trainFraudDetectionModel, loadModel, predictFraud } from './ml-training';
import { storage } from './storage';

/**
 * Handle model training request
 */
export async function handleModelTraining(req: Request, res: Response) {
  try {
    console.log('Starting ML model training...');
    
    // Generate training data from existing properties
    const trainingData = await generateTrainingData();
    
    if (trainingData.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient training data. Need at least 10 properties.'
      });
    }
    
    // Train the model
    const metrics = await trainFraudDetectionModel();
    
    return res.status(200).json({
      success: true,
      result: {
        trainingDataSize: trainingData.length,
        modelMetrics: metrics,
        trainedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Model training error:', error);
    return res.status(500).json({
      success: false,
      message: 'Model training failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get model information and metrics
 */
export async function handleGetModelInfo(req: Request, res: Response) {
  try {
    const model = await loadModel();
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'No trained model found'
      });
    }
    
    return res.status(200).json({
      success: true,
      result: {
        modelType: model.type,
        version: model.version,
        trainedAt: model.trainedAt,
        trainingAccuracy: model.trainingAccuracy,
        thresholds: model.thresholds
      }
    });
    
  } catch (error) {
    console.error('Get model info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get model information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Predict fraud for a specific property using ML model
 */
export async function handleFraudPrediction(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }
    
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Extract features for ML prediction
    const features = extractPropertyFeatures(property);
    
    // Get ML prediction
    const prediction = await predictFraud(features);
    
    return res.status(200).json({
      success: true,
      result: {
        propertyId,
        fraudProbability: prediction.probability,
        isFraudulent: prediction.prediction,
        features,
        predictionDate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Fraud prediction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Fraud prediction failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get training data statistics
 */
export async function handleGetTrainingStats(req: Request, res: Response) {
  try {
    const trainingData = await generateTrainingData();
    
    const fraudCount = trainingData.filter(d => d.fraudLabel).length;
    const normalCount = trainingData.length - fraudCount;
    
    const averageRiskScore = trainingData.reduce((sum, d) => sum + d.riskScore, 0) / trainingData.length;
    
    const verificationStatusCounts = trainingData.reduce((counts, d) => {
      counts[d.verificationStatus] = (counts[d.verificationStatus] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return res.status(200).json({
      success: true,
      result: {
        totalProperties: trainingData.length,
        fraudulentProperties: fraudCount,
        normalProperties: normalCount,
        fraudRate: fraudCount / trainingData.length,
        averageRiskScore,
        verificationStatusDistribution: verificationStatusCounts,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Training stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get training statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Extract features from property (helper function)
 */
function extractPropertyFeatures(property: any): number[] {
  const features = [];
  
  features.push(property.price || 0);
  features.push(property.features?.bedrooms || 0);
  features.push(property.features?.bathrooms || 0);
  features.push(property.features?.squareFootage || 0);
  features.push(getLocationScore(property.location));
  features.push(property.features?.amenities?.length || 0);
  features.push(property.verificationStatus === 'verified' ? 1 : 0);
  
  return features;
}

function getLocationScore(location: string): number {
  if (!location) return 0;
  
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes('karen') || locationLower.includes('runda')) {
    return 5;
  }
  if (locationLower.includes('kilimani') || locationLower.includes('westlands')) {
    return 4;
  }
  if (locationLower.includes('nairobi')) {
    return 3;
  }
  if (locationLower.includes('mombasa') || locationLower.includes('kisumu')) {
    return 2;
  }
  
  return 1;
}

/**
 * Register ML-related API routes
 */
export function registerMLRoutes(app: Express) {
  // Train new model
  app.post('/api/ml/train', handleModelTraining);
  
  // Get model information
  app.get('/api/ml/model-info', handleGetModelInfo);
  
  // Predict fraud for specific property
  app.get('/api/properties/:id/ml-prediction', handleFraudPrediction);
  
  // Get training data statistics
  app.get('/api/ml/training-stats', handleGetTrainingStats);
}
