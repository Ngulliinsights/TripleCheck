/**
 * Production-Ready Demonstration Data Scenarios
 * 
 * Comprehensive scenarios designed to showcase TripleCheck's capabilities
 * with realistic Kenyan market data for demonstrations, testing, and validation.
 */

import { DataScenario } from '../core/UnifiedDataGenerator';

/**
 * Demonstration Scenarios for TripleCheck Production System
 */
export const PRODUCTION_DEMO_SCENARIOS: Record<string, DataScenario> = {
  
  /**
   * SCENARIO 1: Executive Demo - Quick Overview
   * Perfect for C-level presentations and investor demos
   */
  executive_demo: {
    name: 'Executive Demo',
    description: 'Curated dataset for executive presentations showcasing key features and value propositions',
    users: 50,
    properties: 200,
    reviews: 300,
    professionals: 15,
    verificationSessions: 100,
    fraudRate: 0.08, // 8% fraud rate for demonstration
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includeSuccessStories: true,
      highlightFraudPrevention: true,
      showcaseExpertNetwork: true,
      includeROIMetrics: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
      propertyTypes: ['residential', 'commercial', 'land'],
      keyMetrics: {
        fraudDetectionRate: 0.95,
        verificationAccuracy: 0.98,
        averageVerificationTime: 24, // hours
        customerSatisfaction: 4.7
      }
    }
  },

  /**
   * SCENARIO 2: Sales Demo - Feature Showcase
   * Comprehensive feature demonstration for sales presentations
   */
  sales_demo: {
    name: 'Sales Demo',
    description: 'Feature-rich dataset demonstrating all TripleCheck capabilities for sales presentations',
    users: 150,
    properties: 500,
    reviews: 800,
    professionals: 35,
    verificationSessions: 300,
    fraudRate: 0.12, // Higher fraud rate to show detection capabilities
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includeComplexCases: true,
      showcaseAICapabilities: true,
      demonstrateWorkflows: true,
      includeIntegrations: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
      propertyTypes: ['residential', 'commercial', 'land', 'agricultural'],
      workflows: [
        'property_listing_verification',
        'buyer_due_diligence',
        'fraud_investigation',
        'expert_consultation',
        'community_validation'
      ],
      integrations: [
        'government_registry',
        'mpesa_payments',
        'expert_network',
        'community_platform'
      ]
    }
  },

  /**
   * SCENARIO 3: Technical Demo - Architecture Showcase
   * Technical demonstration for developers and technical stakeholders
   */
  technical_demo: {
    name: 'Technical Demo',
    description: 'Technical dataset showcasing system architecture, performance, and scalability',
    users: 300,
    properties: 1000,
    reviews: 1500,
    professionals: 50,
    verificationSessions: 600,
    fraudRate: 0.10,
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includePerformanceMetrics: true,
      showcaseScalability: true,
      demonstrateAPIs: true,
      includeMonitoring: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos'],
      propertyTypes: ['residential', 'commercial', 'land', 'agricultural', 'industrial'],
      technicalFeatures: [
        'real_time_processing',
        'machine_learning_models',
        'blockchain_integration',
        'api_performance',
        'data_analytics',
        'security_features'
      ],
      performanceTargets: {
        queryResponseTime: 50, // ms
        throughput: 10000, // queries per second
        uptime: 99.99, // percentage
        concurrentUsers: 1000
      }
    }
  },

  /**
   * SCENARIO 4: Customer Success Stories
   * Real-world success scenarios for case studies
   */
  customer_success: {
    name: 'Customer Success Stories',
    description: 'Realistic customer journey scenarios showcasing successful fraud prevention and verification',
    users: 100,
    properties: 300,
    reviews: 450,
    professionals: 25,
    verificationSessions: 200,
    fraudRate: 0.15, // Higher to show prevention success
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includeSuccessStories: true,
      showcaseROI: true,
      includeTestimonials: true,
      demonstrateValue: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
      successStories: [
        {
          title: 'Prevented $500K Land Fraud',
          description: 'AI-powered document analysis detected forged title deed',
          savings: 500000,
          timeToDetection: 2, // hours
          customerType: 'individual_buyer'
        },
        {
          title: 'Streamlined Due Diligence Process',
          description: 'Reduced verification time from 3 weeks to 2 days',
          timeSaved: 19, // days
          efficiencyGain: 0.85,
          customerType: 'real_estate_company'
        },
        {
          title: 'Community-Validated Property Purchase',
          description: 'Local community insights prevented boundary dispute',
          disputePrevention: true,
          communityConfidence: 0.95,
          customerType: 'diaspora_investor'
        }
      ]
    }
  },

  /**
   * SCENARIO 5: Regulatory Compliance Demo
   * Compliance and audit demonstration for regulatory bodies
   */
  regulatory_compliance: {
    name: 'Regulatory Compliance',
    description: 'Compliance-focused dataset demonstrating audit trails, data protection, and regulatory adherence',
    users: 80,
    properties: 250,
    reviews: 200,
    professionals: 20,
    verificationSessions: 150,
    fraudRate: 0.06,
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includeAuditTrails: true,
      showcaseDataProtection: true,
      demonstrateCompliance: true,
      includeReporting: true,
      focusRegions: ['Nairobi', 'Mombasa'],
      complianceFeatures: [
        'gdpr_compliance',
        'data_encryption',
        'audit_logging',
        'access_control',
        'data_retention',
        'privacy_protection'
      ],
      auditRequirements: {
        dataRetention: 7, // years
        auditLogRetention: 10, // years
        encryptionStandard: 'AES-256',
        accessControlModel: 'RBAC',
        privacyCompliance: 'GDPR'
      }
    }
  },

  /**
   * SCENARIO 6: Performance Benchmark
   * High-volume scenario for performance testing and benchmarking
   */
  performance_benchmark: {
    name: 'Performance Benchmark',
    description: 'High-volume dataset for performance testing, load testing, and system benchmarking',
    users: 1000,
    properties: 5000,
    reviews: 8000,
    professionals: 100,
    verificationSessions: 2500,
    fraudRate: 0.10,
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includeLoadTesting: true,
      showcaseScalability: true,
      measurePerformance: true,
      stressTestSystem: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos', 'Meru'],
      propertyTypes: ['residential', 'commercial', 'land', 'agricultural', 'industrial'],
      performanceMetrics: {
        targetQPS: 10000,
        maxResponseTime: 50, // ms
        concurrentUsers: 1000,
        dataVolumeGB: 10,
        indexingPerformance: true,
        cacheHitRate: 0.95
      },
      loadPatterns: [
        'steady_state',
        'peak_traffic',
        'burst_load',
        'sustained_high_load',
        'gradual_ramp_up'
      ]
    }
  },

  /**
   * SCENARIO 7: Training and Education
   * Educational dataset for training users and demonstrating workflows
   */
  training_education: {
    name: 'Training & Education',
    description: 'Educational dataset with guided workflows for user training and system onboarding',
    users: 75,
    properties: 200,
    reviews: 250,
    professionals: 15,
    verificationSessions: 100,
    fraudRate: 0.08,
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      includeGuidedTours: true,
      showcaseWorkflows: true,
      includeTrainingMaterials: true,
      demonstrateFeatures: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
      trainingModules: [
        'basic_property_search',
        'verification_process',
        'fraud_detection',
        'expert_consultation',
        'community_feedback',
        'report_generation'
      ],
      userJourneys: [
        'first_time_buyer',
        'experienced_investor',
        'real_estate_agent',
        'legal_professional',
        'government_official'
      ]
    }
  },

  /**
   * SCENARIO 8: Integration Showcase
   * Comprehensive integration demonstration with external systems
   */
  integration_showcase: {
    name: 'Integration Showcase',
    description: 'Integration-focused dataset demonstrating API connectivity and third-party system integration',
    users: 120,
    properties: 400,
    reviews: 500,
    professionals: 30,
    verificationSessions: 250,
    fraudRate: 0.09,
    timeRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    features: {
      enableFraudPatterns: true,
      enableLandVerification: true,
      enableCommunityFeedback: true,
      enableExpertNetwork: true,
      enableAnalytics: true
    },
    demoSpecific: {
      showcaseIntegrations: true,
      demonstrateAPIs: true,
      includeWebhooks: true,
      showDataFlow: true,
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
      integrations: [
        {
          name: 'Government Land Registry',
          type: 'api',
          status: 'active',
          dataTypes: ['title_deeds', 'ownership_records', 'survey_maps']
        },
        {
          name: 'M-Pesa Payment Gateway',
          type: 'payment',
          status: 'active',
          features: ['payments', 'refunds', 'transaction_history']
        },
        {
          name: 'Expert Network Platform',
          type: 'service',
          status: 'active',
          services: ['legal_consultation', 'surveying', 'valuation']
        },
        {
          name: 'Community Feedback System',
          type: 'social',
          status: 'active',
          features: ['reviews', 'ratings', 'local_insights']
        }
      ]
    }
  }
};

/**
 * Scenario metadata for easy selection and filtering
 */
export const SCENARIO_METADATA = {
  categories: {
    demo: ['executive_demo', 'sales_demo', 'technical_demo'],
    business: ['customer_success', 'regulatory_compliance'],
    technical: ['performance_benchmark', 'integration_showcase'],
    education: ['training_education']
  },
  
  complexity: {
    simple: ['executive_demo', 'training_education'],
    moderate: ['sales_demo', 'customer_success', 'regulatory_compliance'],
    complex: ['technical_demo', 'performance_benchmark', 'integration_showcase']
  },
  
  audience: {
    executives: ['executive_demo', 'customer_success'],
    sales: ['sales_demo', 'customer_success'],
    technical: ['technical_demo', 'performance_benchmark', 'integration_showcase'],
    compliance: ['regulatory_compliance'],
    training: ['training_education']
  },
  
  duration: {
    quick: ['executive_demo'], // < 15 minutes
    standard: ['sales_demo', 'customer_success', 'regulatory_compliance', 'training_education'], // 15-45 minutes
    extended: ['technical_demo', 'performance_benchmark', 'integration_showcase'] // > 45 minutes
  }
};

/**
 * Get scenario by name with validation
 */
export function getScenario(name: string): DataScenario | null {
  return PRODUCTION_DEMO_SCENARIOS[name] || null;
}

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: keyof typeof SCENARIO_METADATA.categories): DataScenario[] {
  const scenarioNames = SCENARIO_METADATA.categories[category] || [];
  return scenarioNames.map(name => PRODUCTION_DEMO_SCENARIOS[name]).filter(Boolean);
}

/**
 * Get scenarios by audience
 */
export function getScenariosByAudience(audience: keyof typeof SCENARIO_METADATA.audience): DataScenario[] {
  const scenarioNames = SCENARIO_METADATA.audience[audience] || [];
  return scenarioNames.map(name => PRODUCTION_DEMO_SCENARIOS[name]).filter(Boolean);
}

/**
 * Get all scenario names
 */
export function getAllScenarioNames(): string[] {
  return Object.keys(PRODUCTION_DEMO_SCENARIOS);
}

/**
 * Validate scenario configuration
 */
export function validateScenario(scenario: DataScenario): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!scenario.name) errors.push('Scenario name is required');
  if (!scenario.description) errors.push('Scenario description is required');
  if (scenario.users < 1) errors.push('At least 1 user is required');
  if (scenario.properties < 1) errors.push('At least 1 property is required');
  if (scenario.fraudRate < 0 || scenario.fraudRate > 1) errors.push('Fraud rate must be between 0 and 1');
  if (scenario.timeRange.startDate >= scenario.timeRange.endDate) errors.push('Start date must be before end date');
  
  return {
    valid: errors.length === 0,
    errors
  };
}