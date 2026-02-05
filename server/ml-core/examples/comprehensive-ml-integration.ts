/**
 * Comprehensive ML Integration Example
 * 
 * Demonstrates how to use the advanced ML system for real-world
 * Kenyan real estate scenarios with fraud detection, valuation, and trust analysis
 */

import { 
  getMLService, 
  initializeMLService,
  MLWorkflowRequest,
  FraudDetectionRequest,
  PropertyValuationRequest,
  TrustAnalysisRequest,
  FeedbackData
} from '../index';
import { logger } from '../../infrastructure/monitoring/logger';

/**
 * Example 1: Comprehensive Property Transaction Analysis
 */
export async function comprehensiveTransactionAnalysis() {
  logger.info('Starting comprehensive transaction analysis example...');
  
  try {
    // Initialize ML service
    const mlService = await initializeMLService();
    
    // Prepare comprehensive workflow request
    const workflowRequest: MLWorkflowRequest = {
      workflowId: `workflow_${Date.now()}`,
      requestType: 'comprehensive_analysis',
      priority: 'high',
      userId: 'user_12345',
      propertyId: 'prop_67890',
      transactionId: 'txn_abcdef',
      
      // Fraud detection request
      fraudDetectionRequest: {
        transactionId: 'txn_abcdef',
        propertyId: 'prop_67890',
        sellerId: 'seller_123',
        buyerId: 'buyer_456',
        amount: 8500000, // KES 8.5M
        location: {
          county: 'Nairobi',
          constituency: 'Westlands',
          ward: 'Parklands',
          coordinates: { lat: -1.2634, lng: 36.8155 }
        },
        documents: [
          {
            type: 'title_deed',
            url: 'https://example.com/title_deed.pdf',
            metadata: { uploadedAt: new Date(), fileSize: 2048576 }
          },
          {
            type: 'id_document',
            url: 'https://example.com/national_id.jpg',
            metadata: { uploadedAt: new Date(), fileSize: 1024768 }
          },
          {
            type: 'sale_agreement',
            url: 'https://example.com/sale_agreement.pdf',
            metadata: { uploadedAt: new Date(), fileSize: 1536000 }
          }
        ],
        participants: [
          {
            id: 'seller_123',
            role: 'seller',
            verificationLevel: 3,
            trustScore: 0.75,
            historicalTransactions: 5
          },
          {
            id: 'buyer_456',
            role: 'buyer',
            verificationLevel: 4,
            trustScore: 0.85,
            historicalTransactions: 2
          },
          {
            id: 'agent_789',
            role: 'agent',
            verificationLevel: 5,
            trustScore: 0.92,
            historicalTransactions: 150
          }
        ],
        timeline: [
          {
            event: 'Property listed',
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            actor: 'seller_123'
          },
          {
            event: 'Buyer inquiry',
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            actor: 'buyer_456'
          },
          {
            event: 'Property viewing',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            actor: 'buyer_456'
          },
          {
            event: 'Offer submitted',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            actor: 'buyer_456'
          },
          {
            event: 'Offer accepted',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            actor: 'seller_123'
          }
        ],
        contextualData: {
          marketConditions: {
            volatility: 0.15,
            trend: 'stable',
            seasonality: 'peak'
          },
          economicIndicators: {
            inflation: 0.065,
            interestRate: 0.13,
            gdpGrowth: 0.055
          }
        }
      },
      
      // Property valuation request
      propertyValuationRequest: {
        propertyId: 'prop_67890',
        location: {
          county: 'Nairobi',
          constituency: 'Westlands',
          ward: 'Parklands',
          coordinates: { lat: -1.2634, lng: 36.8155 },
          address: 'Parklands Road, Westlands, Nairobi'
        },
        property: {
          type: 'residential',
          subtype: 'apartment',
          size: 120, // 120 sqm
          bedrooms: 3,
          bathrooms: 2,
          yearBuilt: 2018,
          condition: 'excellent',
          features: ['swimming_pool', 'gym', 'parking', 'security', 'backup_generator']
        },
        market: {
          valuationPurpose: 'sale',
          urgency: 'standard',
          confidenceLevel: 'premium'
        },
        comparables: [
          {
            propertyId: 'comp_001',
            salePrice: 8200000,
            saleDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            distance: 250,
            similarity: 0.92
          },
          {
            propertyId: 'comp_002',
            salePrice: 8800000,
            saleDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            distance: 180,
            similarity: 0.88
          },
          {
            propertyId: 'comp_003',
            salePrice: 8350000,
            saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            distance: 320,
            similarity: 0.85
          }
        ]
      },
      
      // Trust analysis request
      trustAnalysisRequest: {
        userId: 'buyer_456',
        analysisType: 'comprehensive',
        profile: {
          completeness: 0.85,
          consistency: 0.92,
          verificationLevel: 4,
          accountAge: 180, // 6 months
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        communication: {
          messageHistory: [
            {
              content: 'I am interested in viewing the property this weekend. What times are available?',
              timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              responseTime: 45,
              sentiment: 0.7,
              quality: 0.9
            },
            {
              content: 'Thank you for the viewing. The property is exactly what I am looking for. I would like to make an offer.',
              timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              responseTime: 30,
              sentiment: 0.8,
              quality: 0.95
            },
            {
              content: 'I can provide all necessary documentation and am ready to proceed with the purchase.',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              responseTime: 20,
              sentiment: 0.75,
              quality: 0.9
            }
          ],
          averageResponseTime: 31.67,
          communicationFrequency: 0.8,
          languageConsistency: 0.95
        },
        socialNetwork: {
          connections: [
            {
              connectedUserId: 'friend_001',
              connectionType: 'friend',
              strength: 0.8,
              trustScore: 0.85,
              mutualConnections: 5
            },
            {
              connectedUserId: 'colleague_002',
              connectionType: 'colleague',
              strength: 0.7,
              trustScore: 0.9,
              mutualConnections: 8
            },
            {
              connectedUserId: 'family_003',
              connectionType: 'family',
              strength: 0.95,
              trustScore: 0.95,
              mutualConnections: 12
            }
          ],
          networkDensity: 0.65,
          clusteringCoefficient: 0.7,
          centralityScore: 0.6
        },
        references: [
          {
            referenceId: 'ref_001',
            referrerId: 'employer_123',
            referrerTrustLevel: 0.9,
            relationship: 'employer',
            message: 'Reliable employee with stable income and good character',
            verificationStatus: 'verified',
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          {
            referenceId: 'ref_002',
            referrerId: 'landlord_456',
            referrerTrustLevel: 0.85,
            relationship: 'previous_landlord',
            message: 'Excellent tenant, always paid rent on time, took good care of property',
            verificationStatus: 'verified',
            timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
          }
        ],
        transactionHistory: {
          totalTransactions: 2,
          successfulTransactions: 2,
          averageTransactionValue: 2500000,
          averageRating: 4.8,
          cancellationRate: 0,
          disputeRate: 0,
          timeToComplete: 21
        },
        locationContext: {
          county: 'Nairobi',
          constituency: 'Westlands',
          ward: 'Parklands',
          yearsInArea: 3,
          localKnowledge: 0.8,
          communityInvolvement: 0.6,
          neighborhoodReputation: 0.85
        },
        behaviorPatterns: {
          loginPatterns: [
            {
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              duration: 25,
              activityType: 'property_search'
            },
            {
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
              duration: 45,
              activityType: 'message_exchange'
            }
          ],
          searchPatterns: [
            {
              searchQuery: '3 bedroom apartment Westlands',
              timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              resultInteraction: true
            },
            {
              searchQuery: 'properties near Sarit Centre',
              timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
              resultInteraction: true
            }
          ],
          interactionPatterns: [
            {
              interactionType: 'property_inquiry',
              frequency: 0.8,
              quality: 0.9
            },
            {
              interactionType: 'document_upload',
              frequency: 0.9,
              quality: 0.95
            }
          ]
        }
      },
      
      config: {
        enableParallelProcessing: true,
        requireHighConfidence: true,
        enableExplainability: true,
        timeoutMs: 30000,
        fallbackStrategy: 'graceful'
      },
      
      context: {
        source: 'web_application',
        sessionId: 'session_xyz789',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '41.90.64.123', // Kenyan IP
        timestamp: new Date()
      }
    };
    
    // Process the comprehensive workflow
    logger.info('Processing comprehensive ML workflow...');
    const result = await mlService.processWorkflow(workflowRequest);
    
    // Log results
    logger.info('Comprehensive analysis completed', {
      workflowId: result.workflowId,
      status: result.status,
      overallRiskScore: result.orchestratedInsights.overallRiskScore,
      riskLevel: result.orchestratedInsights.riskLevel,
      confidence: result.orchestratedInsights.confidence,
      processingTime: result.metadata.processingTime
    });
    
    // Display detailed results
    console.log('\n=== COMPREHENSIVE TRANSACTION ANALYSIS RESULTS ===\n');
    
    if (result.fraudDetectionResult) {
      console.log('🔍 FRAUD DETECTION RESULTS:');
      console.log(`   Overall Risk Score: ${result.fraudDetectionResult.overallRiskScore}/100`);
      console.log(`   Risk Level: ${result.fraudDetectionResult.riskLevel.toUpperCase()}`);
      console.log(`   Confidence: ${(result.fraudDetectionResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Detected Patterns: ${result.fraudDetectionResult.detectedPatterns.length}`);
      console.log(`   Recommendations: ${result.fraudDetectionResult.recommendations.length}`);
      console.log('');
    }
    
    if (result.propertyValuationResult) {
      console.log('🏠 PROPERTY VALUATION RESULTS:');
      console.log(`   Estimated Value: KES ${result.propertyValuationResult.valuation.estimatedValue.toLocaleString()}`);
      console.log(`   Value Range: KES ${result.propertyValuationResult.valuation.valueRange.low.toLocaleString()} - ${result.propertyValuationResult.valuation.valueRange.high.toLocaleString()}`);
      console.log(`   Confidence: ${(result.propertyValuationResult.valuation.confidence * 100).toFixed(1)}%`);
      console.log(`   Market Position: ${result.propertyValuationResult.comparableAnalysis.marketPosition}`);
      console.log('');
    }
    
    if (result.trustAnalysisResult) {
      console.log('🤝 TRUST ANALYSIS RESULTS:');
      console.log(`   Trust Score: ${result.trustAnalysisResult.trustAssessment.overallTrustScore}/1000`);
      console.log(`   Trust Level: ${result.trustAnalysisResult.trustAssessment.trustLevel.toUpperCase()}`);
      console.log(`   Risk Level: ${result.trustAnalysisResult.trustAssessment.riskLevel.toUpperCase()}`);
      console.log(`   Confidence: ${(result.trustAnalysisResult.trustAssessment.confidence * 100).toFixed(1)}%`);
      console.log('');
    }
    
    console.log('🎯 ORCHESTRATED INSIGHTS:');
    console.log(`   Overall Risk Score: ${result.orchestratedInsights.overallRiskScore}/100`);
    console.log(`   Risk Level: ${result.orchestratedInsights.riskLevel.toUpperCase()}`);
    console.log(`   Confidence: ${(result.orchestratedInsights.confidence * 100).toFixed(1)}%`);
    console.log(`   Cross-domain Correlations: ${result.orchestratedInsights.correlations.length}`);
    console.log(`   Integrated Recommendations: ${result.orchestratedInsights.recommendations.length}`);
    console.log('');
    
    // Show top recommendations
    if (result.orchestratedInsights.recommendations.length > 0) {
      console.log('📋 TOP RECOMMENDATIONS:');
      result.orchestratedInsights.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`      Rationale: ${rec.rationale}`);
        console.log(`      Expected Impact: ${rec.expectedImpact}%`);
        console.log(`      Domains: ${rec.domains.join(', ')}`);
        console.log('');
      });
    }
    
    return result;
    
  } catch (error) {
    logger.error('Comprehensive transaction analysis failed', error);
    throw error;
  }
}

/**
 * Example 2: Continuous Learning with Feedback
 */
export async function continuousLearningExample() {
  logger.info('Starting continuous learning example...');
  
  try {
    const mlService = getMLService();
    
    // Simulate feedback from a completed transaction
    const feedback: FeedbackData = {
      id: `feedback_${Date.now()}`,
      modelId: 'fraud_detection_ensemble',
      predictionId: 'pred_12345',
      feedback: {
        actualOutcome: false, // Transaction was legitimate
        predictionAccuracy: 0.92, // Model predicted low risk, which was correct
        userSatisfaction: 5, // User was very satisfied
        businessImpact: 'positive',
        comments: 'The fraud detection system correctly identified this as a low-risk transaction, allowing for smooth processing'
      },
      context: {
        timestamp: new Date(),
        userId: 'buyer_456',
        sessionId: 'session_xyz789',
        source: 'transaction_completion',
        environment: 'production'
      },
      features: {
        transaction_amount: 8500000,
        participant_count: 3,
        document_count: 3,
        location_risk_score: 15,
        avg_participant_trust: 0.84,
        timeline_duration_hours: 720
      },
      metadata: {
        collectedAt: new Date(),
        validatedAt: new Date(),
        quality: 0.95,
        reliability: 0.9
      }
    };
    
    // Submit feedback
    await mlService.submitFeedback(feedback);
    
    logger.info('Feedback submitted successfully', {
      feedbackId: feedback.id,
      modelId: feedback.modelId,
      accuracy: feedback.feedback.predictionAccuracy
    });
    
    console.log('\n=== CONTINUOUS LEARNING FEEDBACK ===\n');
    console.log('✅ Feedback submitted to continuous learning pipeline');
    console.log(`   Model: ${feedback.modelId}`);
    console.log(`   Prediction Accuracy: ${(feedback.feedback.predictionAccuracy * 100).toFixed(1)}%`);
    console.log(`   User Satisfaction: ${feedback.feedback.userSatisfaction}/5`);
    console.log(`   Business Impact: ${feedback.feedback.businessImpact}`);
    console.log('');
    
  } catch (error) {
    logger.error('Continuous learning example failed', error);
    throw error;
  }
}

/**
 * Example 3: Individual Service Usage
 */
export async function individualServiceExample() {
  logger.info('Starting individual service example...');
  
  try {
    const mlService = getMLService();
    
    // Quick fraud detection
    const fraudRequest: FraudDetectionRequest = {
      transactionId: 'quick_txn_001',
      propertyId: 'quick_prop_001',
      sellerId: 'quick_seller_001',
      buyerId: 'quick_buyer_001',
      amount: 5000000,
      location: {
        county: 'Kiambu',
        constituency: 'Ruiru',
        ward: 'Biashara',
        coordinates: { lat: -1.1496, lng: 36.9659 }
      },
      documents: [
        {
          type: 'title_deed',
          url: 'https://example.com/quick_title.pdf'
        }
      ],
      participants: [
        {
          id: 'quick_seller_001',
          role: 'seller',
          verificationLevel: 2,
          trustScore: 0.6,
          historicalTransactions: 1
        },
        {
          id: 'quick_buyer_001',
          role: 'buyer',
          verificationLevel: 3,
          trustScore: 0.75,
          historicalTransactions: 0
        }
      ],
      timeline: [
        {
          event: 'Property listed',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          actor: 'quick_seller_001'
        },
        {
          event: 'Offer made',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          actor: 'quick_buyer_001'
        }
      ]
    };
    
    const fraudResult = await mlService.detectFraud(fraudRequest);
    
    console.log('\n=== QUICK FRAUD DETECTION ===\n');
    console.log(`🔍 Risk Score: ${fraudResult.overallRiskScore}/100`);
    console.log(`🔍 Risk Level: ${fraudResult.riskLevel.toUpperCase()}`);
    console.log(`🔍 Confidence: ${(fraudResult.confidence * 100).toFixed(1)}%`);
    console.log(`🔍 Processing Time: ${fraudResult.metadata.processingTime}ms`);
    console.log('');
    
    // Quick property valuation
    const valuationRequest: PropertyValuationRequest = {
      propertyId: 'quick_prop_001',
      location: {
        county: 'Kiambu',
        constituency: 'Ruiru',
        ward: 'Biashara',
        coordinates: { lat: -1.1496, lng: 36.9659 },
        address: 'Ruiru Town, Kiambu County'
      },
      property: {
        type: 'residential',
        subtype: 'house',
        size: 200,
        bedrooms: 4,
        bathrooms: 3,
        yearBuilt: 2015,
        condition: 'good',
        features: ['parking', 'garden', 'borehole']
      },
      market: {
        valuationPurpose: 'sale',
        urgency: 'standard',
        confidenceLevel: 'standard'
      }
    };
    
    const valuationResult = await mlService.valuateProperty(valuationRequest);
    
    console.log('=== QUICK PROPERTY VALUATION ===\n');
    console.log(`🏠 Estimated Value: KES ${valuationResult.valuation.estimatedValue.toLocaleString()}`);
    console.log(`🏠 Value Range: KES ${valuationResult.valuation.valueRange.low.toLocaleString()} - ${valuationResult.valuation.valueRange.high.toLocaleString()}`);
    console.log(`🏠 Confidence: ${(valuationResult.valuation.confidence * 100).toFixed(1)}%`);
    console.log(`🏠 Processing Time: ${valuationResult.metadata.processingTime}ms`);
    console.log('');
    
  } catch (error) {
    logger.error('Individual service example failed', error);
    throw error;
  }
}

/**
 * Example 4: System Status and Monitoring
 */
export async function systemStatusExample() {
  logger.info('Starting system status example...');
  
  try {
    const mlService = getMLService();
    
    // Get comprehensive system status
    const status = await mlService.getStatus();
    
    console.log('\n=== ML SYSTEM STATUS ===\n');
    console.log(`🟢 System Initialized: ${status.initialized}`);
    console.log('');
    
    console.log('📊 Model Registry:');
    console.log(`   Status: ${status.modelRegistry.status || 'Active'}`);
    console.log('');
    
    console.log('🔍 Fraud Detection:');
    console.log(`   Status: ${status.fraudDetection.status || 'Active'}`);
    console.log('');
    
    console.log('🏠 Property Valuation:');
    console.log(`   Status: ${status.propertyValuation.status}`);
    console.log('');
    
    console.log('🤝 Trust Analysis:');
    console.log(`   Status: ${status.trustAnalysis.status}`);
    console.log('');
    
    console.log('🎯 Orchestration Service:');
    console.log(`   Active Workflows: ${status.orchestration.activeWorkflows || 0}`);
    console.log(`   Queued Workflows: ${status.orchestration.queuedWorkflows || 0}`);
    console.log('');
    
    console.log('🔄 Continuous Learning:');
    console.log(`   Queued Training: ${status.continuousLearning.queuedTraining || 0}`);
    console.log(`   Active Training: ${status.continuousLearning.activeTraining || 0}`);
    console.log(`   Feedback Buffer: ${status.continuousLearning.feedbackBuffer || 0}`);
    console.log(`   Datasets: ${status.continuousLearning.datasets || 0}`);
    console.log('');
    
  } catch (error) {
    logger.error('System status example failed', error);
    throw error;
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n🚀 STARTING COMPREHENSIVE ML SYSTEM EXAMPLES\n');
  console.log('=' .repeat(60));
  
  try {
    // Example 1: Comprehensive analysis
    await comprehensiveTransactionAnalysis();
    
    console.log('=' .repeat(60));
    
    // Example 2: Continuous learning
    await continuousLearningExample();
    
    console.log('=' .repeat(60));
    
    // Example 3: Individual services
    await individualServiceExample();
    
    console.log('=' .repeat(60));
    
    // Example 4: System status
    await systemStatusExample();
    
    console.log('=' .repeat(60));
    console.log('\n✅ ALL EXAMPLES COMPLETED SUCCESSFULLY\n');
    
  } catch (error) {
    console.error('\n❌ EXAMPLES FAILED:', error);
    throw error;
  }
}

// Export for use in other modules
export {
  comprehensiveTransactionAnalysis,
  continuousLearningExample,
  individualServiceExample,
  systemStatusExample
};