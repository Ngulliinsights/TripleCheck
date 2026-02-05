import { 
  generateTrainingData, 
  trainFraudDetectionModel, 
  loadModel, 
  predictFraud,

  type TrainingData,

  type ModelMetrics,
  type TrainedModel
} from './ml-training-root';
import type { FraudAnalysis } from '../types/fraud.types';
import type { Property } from '../types/property.types';

// Mock data generator for testing - this simulates real property data
// Think of this as creating realistic test scenarios for your system
function createMockProperty(overrides: Partial<any> = {}): any {
  return {
    id: Math.floor(Math.random() * 10000),
    price: 15000000 + Math.random() * 50000000, // 15M to 65M KES
    location: 'Nairobi',
    features: {
      bedrooms: 3 + Math.floor(Math.random() * 3), // 3-5 bedrooms
      bathrooms: 2 + Math.floor(Math.random() * 3), // 2-4 bathrooms
      squareFootage: 1000 + Math.random() * 3000, // 1000-4000 sq ft
      amenities: ['Security', 'Garden', 'Swimming Pool'].slice(0, Math.floor(Math.random() * 3) + 1),
      ...overrides.features
    },
    verificationStatus: 'pending',
    trustScore: 50 + Math.random() * 50, // 50-100 trust score
    ownerId: Math.floor(Math.random() * 1000),
    yearBuilt: 2000 + Math.floor(Math.random() * 24), // 2000-2023
    isFraudulent: false,
    aiVerificationResults: {
      overallScore: 60 + Math.random() * 40, // 60-100 overall score
      verificationTimestamp: new Date().toISOString(),
      imageAnalysis: {
        qualityScore: 70 + Math.random() * 30,
        authenticityScore: 65 + Math.random() * 35,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        coherenceScore: 75 + Math.random() * 25,
        accuracyScore: 70 + Math.random() * 30,
        flaggedIssues: []
      },
      aiModel: 'test-model-v1'
    },
    ...overrides
  };
}

// Create different types of test properties to verify system behavior
function createTestDataset(): any[] {
  const testProperties: Property[] = [];
  
  // Normal properties - these should typically be classified as non-fraudulent
  for (let i = 0; i < 50; i++) {
    testProperties.push(createMockProperty({
      verificationStatus: 'verified',
      trustScore: 70 + Math.random() * 30,
      isFraudulent: false
    } as Partial<Property>));
  }
  
  // Suspicious properties - these should trigger fraud detection
  for (let i = 0; i < 10; i++) {
    testProperties.push(createMockProperty({
      price: 5000000 + Math.random() * 200000000, // Extremely high or low prices
      verificationStatus: 'failed',
      trustScore: Math.random() * 30, // Low trust scores
      isFraudulent: true, // Explicitly marked as fraudulent
      aiVerificationResults: {
        overallScore: Math.random() * 40, // Low verification scores
        verificationTimestamp: new Date().toISOString(),
        imageAnalysis: {
          qualityScore: Math.random() * 50,
          authenticityScore: Math.random() * 40,
          flaggedIssues: ['blurry_image', 'inconsistent_lighting']
        },
        descriptionAnalysis: {
          coherenceScore: Math.random() * 30,
          accuracyScore: Math.random() * 35,
          flaggedIssues: ['inconsistent_details', 'suspicious_language']
        },
        aiModel: 'test-model-v1'
      }
    }));
  }
  
  // Edge cases - these test boundary conditions
  testProperties.push(
    // Minimum viable property
    createMockProperty({
      price: 1000000,
      features: { bedrooms: 1, bathrooms: 1, squareFootage: 500, amenities: [] },
      trustScore: 0,
      verificationStatus: 'pending'
    }),
    
    // Luxury property
    createMockProperty({
      price: 500000000,
      location: 'Karen',
      features: { bedrooms: 6, bathrooms: 8, squareFootage: 8000, amenities: ['Swimming Pool', 'Garden', 'Security'] },
      trustScore: 100,
      verificationStatus: 'verified'
    }),
    
    // Property with missing data
    createMockProperty({
      price: 25000000,
      features: { bedrooms: 3, bathrooms: 2, squareFootage: 0, amenities: [] },
      trustScore: undefined,
      verificationStatus: undefined,
      aiVerificationResults: undefined
    })
  );
  
  return testProperties;
}

// Mock the storage module for testing
// This simulates your actual storage system without requiring database access
const mockStorage = {
  getProperties: async () => {
    console.log('📊 Loading test dataset...');
    return createTestDataset();
  }
};

// Mock the AI service for testing
// This simulates your actual AI fraud detection service
const mockAiService = {
  detectFraud: async (property: any) => {
    // Simulate AI analysis with realistic patterns
    const suspiciousScore = property.isFraudulent ? 0.8 + Math.random() * 0.2 : Math.random() * 0.6;
    
    return {
      isSuspicious: suspiciousScore > 0.7,
      suspiciousScore,
      fraudPatterns: {
        priceAnomaly: property.price > 100000000 ? 85 + Math.random() * 15 : Math.random() * 60,
        documentInconsistency: property.verificationStatus === 'failed' ? 70 + Math.random() * 30 : Math.random() * 50,
        ownershipRisk: property.trustScore < 30 ? 60 + Math.random() * 40 : Math.random() * 40,
        marketDeviation: Math.random() * 60
      }
    };
  }
};

// Test interfaces
interface TestCase {
  test: string;
  passed: boolean;
  note: string;
}

interface TestPrediction {
  readonly probability: number;
  readonly prediction: boolean;
  readonly confidence: number;
}

// Test runner class to organize and execute tests systematically
interface TestResults {
  trainingDataGeneration?: {
    passed: boolean;
    totalSamples: number;
    fraudCases: number;
    normalCases: number;
    averageFeatureCount: number;
    averageRiskScore: number;
    error?: string;
  };
  modelTraining?: {
    passed: boolean;
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    confusionMatrix: number[][];
    error?: string;
  };
  modelPersistence?: {
    passed: boolean;
    modelType: string;
    trainingAccuracy: number;
    sampleSize: number;
    version: string;
    error?: string;
  };
  fraudPrediction?: {
    passed: boolean;
    testCases: number;
    predictions: TestPrediction[];
    error?: string;
  };
  edgeCases?: {
    passed: boolean;
    tests: TestCase[];
    error?: string;
  };
  performance?: {
    passed: boolean;
    totalTime: number;
    averageTime: number;
    predictionsPerSecond: number;
    iterations: number;
    error?: string;
  };
}

class FraudDetectionTester {
  private testResults: TestResults = {};
  private edgeCaseTests: TestCase[] = [];
  private predictions: TestPrediction[] = [];
  
  async runComprehensiveTests(): Promise<void> {
    console.log('🚀 Starting comprehensive fraud detection tests...\n');
    
    try {
      // Test 1: Training Data Generation
      await this.testTrainingDataGeneration();
      
      // Test 2: Model Training
      await this.testModelTraining();
      
      // Test 3: Model Persistence
      await this.testModelPersistence();
      
      // Test 4: Fraud Prediction
      await this.testFraudPrediction();
      
      // Test 5: Edge Cases
      await this.testEdgeCases();
      
      // Test 6: Performance Assessment
      await this.testPerformanceMetrics();
      
      // Generate comprehensive test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }
  
  private async testTrainingDataGeneration(): Promise<void> {
    console.log('📋 Testing training data generation...');
    
    try {
      // Replace the actual imports with our mocks for testing
      const originalStorage = require('./storage');
      const originalAiService = require('./ai-ml-service');
      
      // Temporarily replace with mocks (in a real test, you'd use dependency injection)
      Object.assign(originalStorage, mockStorage);
      Object.assign(originalAiService, mockAiService);
      
      const trainingData = await generateTrainingData();
      
      // Validate training data structure and content
      this.testResults.trainingDataGeneration = {
        passed: true,
        totalSamples: trainingData.length,
        fraudCases: trainingData.filter(d => d.fraudLabel).length,
        normalCases: trainingData.filter(d => !d.fraudLabel).length,
        averageFeatureCount: trainingData.length > 0 ? trainingData[0].features.length : 0,
        averageRiskScore: trainingData.reduce((sum, d) => sum + d.riskScore, 0) / trainingData.length
      };
      
      console.log(`✅ Training data generation successful: ${trainingData.length} samples`);
      console.log(`   - Fraud cases: ${this.testResults.trainingDataGeneration.fraudCases}`);
      console.log(`   - Normal cases: ${this.testResults.trainingDataGeneration.normalCases}`);
      console.log(`   - Average risk score: ${this.testResults.trainingDataGeneration.averageRiskScore.toFixed(2)}`);
      
    } catch (error) {
      this.testResults.trainingDataGeneration = {
        passed: false,
        totalSamples: 0,
        fraudCases: 0,
        normalCases: 0,
        averageFeatureCount: 0,
        averageRiskScore: 0,
        error: error.message
      };
      console.error('❌ Training data generation failed:', error);
      throw error;
    }
  }
  
  private async testModelTraining(): Promise<void> {
    console.log('\n🎯 Testing model training...');
    
    try {
      const metrics = await trainFraudDetectionModel();
      
      this.testResults.modelTraining = {
        passed: true,
        metrics: {
          accuracy: metrics.accuracy,
          precision: metrics.precision,
          recall: metrics.recall,
          f1Score: metrics.f1Score
        },
        confusionMatrix: Array.from(metrics.confusionMatrix).map(row => Array.from(row))
      };
      
      console.log('✅ Model training successful');
      console.log(`   - Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      console.log(`   - Precision: ${(metrics.precision * 100).toFixed(2)}%`);
      console.log(`   - Recall: ${(metrics.recall * 100).toFixed(2)}%`);
      console.log(`   - F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);
      
    } catch (error) {
      this.testResults.modelTraining = {
        passed: false,
        metrics: { accuracy: 0, precision: 0, recall: 0, f1Score: 0 },
        confusionMatrix: [],
        error: error.message
      };
      console.error('❌ Model training failed:', error);
      throw error;
    }
  }
  
  private async testModelPersistence(): Promise<void> {
    console.log('\n💾 Testing model persistence...');
    
    try {
      const loadedModel = await loadModel();
      
      if (!loadedModel) {
        throw new Error('Model loading failed - no model returned');
      }
      
      this.testResults.modelPersistence = {
        passed: true,
        modelType: loadedModel.type,
        trainingAccuracy: loadedModel.trainingAccuracy,
        sampleSize: loadedModel.sampleSize,
        version: loadedModel.version || 'unknown'
      };
      
      console.log('✅ Model persistence successful');
      console.log(`   - Model type: ${loadedModel.type}`);
      console.log(`   - Training accuracy: ${(loadedModel.trainingAccuracy * 100).toFixed(2)}%`);
      console.log(`   - Sample size: ${loadedModel.sampleSize}`);
      
    } catch (error) {
      this.testResults.modelPersistence = {
        passed: false,
        modelType: 'unknown',
        trainingAccuracy: 0,
        sampleSize: 0,
        version: 'unknown',
        error: error.message
      };
      console.error('❌ Model persistence failed:', error);
      throw error;
    }
  }
  
  private async testFraudPrediction(): Promise<void> {
    console.log('\n🔍 Testing fraud prediction...');
    
    try {
      const testCases = [
        [25000000, 3, 2, 1500, 3, 2, 1, 0, 1, 16667, 5, 1, 75, 123],
        [150000000, 6, 8, 8000, 5, 5, 1, 1, 1, 18750, 2, 0, 20, 456],
        [1000000, 1, 1, 500, 1, 1, 0, 0, 0, 2000, 25, 0, 0, 789]
      ];
      
      const predictions: TestPrediction[] = [];
      
      for (const [index, features] of testCases.entries()) {
        const prediction = await predictFraud(features);
        predictions.push(prediction as TestPrediction);
        
        console.log(`   Test case ${index + 1}:`);
        console.log(`     - Probability: ${(prediction.probability * 100).toFixed(2)}%`);
        console.log(`     - Prediction: ${prediction.prediction ? 'FRAUD' : 'NORMAL'}`);
        console.log(`     - Confidence: ${(prediction.confidence * 100).toFixed(2)}%`);
      }
      
      this.testResults.fraudPrediction = {
        passed: true,
        testCases: predictions.length,
        predictions
      };
      
      console.log('✅ Fraud prediction testing successful');
      
    } catch (error) {
      this.testResults.fraudPrediction = {
        passed: false,
        testCases: 0,
        predictions: [],
        error: error.message
      };
      console.error('❌ Fraud prediction failed:', error);
      throw error;
    }
  }
  
  private async testEdgeCases(): Promise<void> {
    console.log('\n⚠️  Testing edge cases...');
    
    try {
      const edgeCaseTests: TestCase[] = [];
      
      // Test with empty features array
      try {
        await predictFraud([]);
        edgeCaseTests.push({ test: 'empty_features', passed: false, note: 'Should have thrown error' } as TestCase);
      } catch (error) {
        edgeCaseTests.push({ test: 'empty_features', passed: true, note: 'Correctly handled empty features' } as TestCase);
      }
      
      // Test with invalid feature values
      try {
        await predictFraud([NaN, Infinity, -Infinity, 'invalid' as any]);
        edgeCaseTests.push({ test: 'invalid_features', passed: false, note: 'Should have thrown error' } as TestCase);
      } catch (error) {
        edgeCaseTests.push({ test: 'invalid_features', passed: true, note: 'Correctly handled invalid features' } as TestCase);
      }
      
      // Test with extreme values
      try {
        const extremeFeatures = [1e12, -1000, 0, 1e6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const prediction = await predictFraud(extremeFeatures);
        edgeCaseTests.push({ 
          test: 'extreme_values', 
          passed: true, 
          note: `Handled extreme values: ${prediction.probability.toFixed(3)}` 
        } as TestCase);
      } catch (error) {
        edgeCaseTests.push({ test: 'extreme_values', passed: false, note: error.message } as TestCase);
      }
      
      this.testResults.edgeCases = {
        passed: edgeCaseTests.every(test => test.passed),
        tests: edgeCaseTests
      };
      
      console.log('✅ Edge case testing completed');
      edgeCaseTests.forEach(test => {
        console.log(`   - ${test.test}: ${test.passed ? '✅' : '❌'} ${test.note}`);
      });
      
    } catch (error) {
      this.testResults.edgeCases = {
        passed: false,
        tests: [],
        error: error.message
      };
      console.error('❌ Edge case testing failed:', error);
    }
  }
  
  private async testPerformanceMetrics(): Promise<void> {
    console.log('\n📊 Testing performance metrics...');
    
    try {
      const startTime = Date.now();
      
      // Test multiple predictions to measure performance
      const testFeatures = [25000000, 3, 2, 1500, 3, 2, 1, 0, 1, 16667, 5, 1, 75, 123];
      const iterations = 100;
      
      const predictions: TestPrediction[] = [];
      for (let i = 0; i < iterations; i++) {
        const prediction = await predictFraud(testFeatures);
        predictions.push(prediction as TestPrediction);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      this.testResults.performance = {
        passed: true,
        totalTime: totalTime,
        averageTime: avgTime,
        predictionsPerSecond: 1000 / avgTime,
        iterations: iterations
      };
      
      console.log('✅ Performance testing completed');
      console.log(`   - Total time: ${totalTime}ms`);
      console.log(`   - Average time per prediction: ${avgTime.toFixed(2)}ms`);
      console.log(`   - Predictions per second: ${(1000 / avgTime).toFixed(2)}`);
      
    } catch (error) {
      this.testResults.performance = {
        passed: false,
        totalTime: 0,
        averageTime: 0,
        predictionsPerSecond: 0,
        iterations: 0,
        error: error.message
      };
      console.error('❌ Performance testing failed:', error);
    }
  }
  
  private generateTestReport(): void {
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('=' .repeat(50));
    
    const allTests = Object.keys(this.testResults);
    const passedTests = allTests.filter(test => this.testResults[test].passed);
    const failedTests = allTests.filter(test => !this.testResults[test].passed);
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total tests: ${allTests.length}`);
    console.log(`   Passed: ${passedTests.length} ✅`);
    console.log(`   Failed: ${failedTests.length} ${failedTests.length > 0 ? '❌' : '✅'}`);
    console.log(`   Success rate: ${((passedTests.length / allTests.length) * 100).toFixed(1)}%`);
    
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`   - ${test}: ${this.testResults[test].error}`);
      });
    }
    
    console.log(`\n🎯 Key Metrics:`);
    if (this.testResults.modelTraining?.passed) {
      const metrics = this.testResults.modelTraining.metrics;
      console.log(`   - Model Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      console.log(`   - Model Precision: ${(metrics.precision * 100).toFixed(2)}%`);
      console.log(`   - Model Recall: ${(metrics.recall * 100).toFixed(2)}%`);
    }
    
    if (this.testResults.performance?.passed) {
      const perf = this.testResults.performance;
      console.log(`   - Average Prediction Time: ${perf.averageTime.toFixed(2)}ms`);
      console.log(`   - Predictions per Second: ${perf.predictionsPerSecond.toFixed(2)}`);
    }
    
    console.log(`\n✅ Testing completed successfully!`);
  }
}

// Main test execution function
export async function runTests(): Promise<void> {
  const tester = new FraudDetectionTester();
  await tester.runComprehensiveTests();
}

// Execute tests if this file is run directly
if (require.main === module) {
  runTests().catch(console.error);
}