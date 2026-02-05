/**
 * Production Demo Generator Test Suite
 * 
 * Comprehensive tests for the TripleCheck Production Demo Data Generator
 * including scenario validation, data quality checks, and performance testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

import { 
  ProductionDemoGenerator, 
  generateQuickDemo,
  DemoGenerationConfig 
} from '../scenarios/production-demo-generator';
import { 
  PRODUCTION_DEMO_SCENARIOS, 
  getScenario,
  validateScenario,
  getAllScenarioNames 
} from '../scenarios/production-demo-scenarios';

describe('Production Demo Generator', () => {
  let tempDir: string;
  let generator: ProductionDemoGenerator;

  beforeEach(async () => {
    // Create temporary directory for test outputs
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'demo-test-'));
    generator = new ProductionDemoGenerator(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  describe('Scenario Configuration', () => {
    it('should have all required demo scenarios', () => {
      const expectedScenarios = [
        'executive_demo',
        'sales_demo',
        'technical_demo',
        'customer_success',
        'training_education',
        'integration_showcase',
        'performance_benchmark',
        'regulatory_compliance'
      ];

      const availableScenarios = getAllScenarioNames();
      
      expectedScenarios.forEach(scenario => {
        expect(availableScenarios).toContain(scenario);
      });
    });

    it('should validate scenario configurations correctly', () => {
      Object.entries(PRODUCTION_DEMO_SCENARIOS).forEach(([name, scenario]) => {
        const validation = validateScenario(scenario);
        
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        
        // Check required fields
        expect(scenario.name).toBeTruthy();
        expect(scenario.description).toBeTruthy();
        expect(scenario.users).toBeGreaterThan(0);
        expect(scenario.properties).toBeGreaterThan(0);
        expect(scenario.fraudRate).toBeGreaterThanOrEqual(0);
        expect(scenario.fraudRate).toBeLessThanOrEqual(1);
        expect(scenario.timeRange.startDate).toBeInstanceOf(Date);
        expect(scenario.timeRange.endDate).toBeInstanceOf(Date);
        expect(scenario.timeRange.startDate.getTime()).toBeLessThan(scenario.timeRange.endDate.getTime());
      });
    });

    it('should retrieve scenarios correctly', () => {
      const executiveDemo = getScenario('executive_demo');
      expect(executiveDemo).toBeTruthy();
      expect(executiveDemo?.name).toBe('Executive Demo');
      
      const nonExistentScenario = getScenario('non_existent');
      expect(nonExistentScenario).toBeNull();
    });
  });

  describe('Quick Demo Generation', () => {
    it('should generate quick executive demo successfully', async () => {
      const result = await generateQuickDemo('executive_demo');
      
      expect(result.success).toBe(true);
      expect(result.scenario).toBe('executive_demo');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.recordsGenerated).toBeDefined();
      expect(result.filesGenerated).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.dataQuality).toBeGreaterThan(0.9);
    }, 30000); // 30 second timeout for data generation

    it('should handle invalid scenario names', async () => {
      await expect(generateQuickDemo('invalid_scenario')).rejects.toThrow();
    });
  });

  describe('Custom Demo Generation', () => {
    it('should generate sales demo with custom configuration', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'sales_demo',
        outputDir: path.join(tempDir, 'sales_demo'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'sales',
          demoLength: 'standard',
          focusRegions: ['Nairobi', 'Mombasa'],
          emphasizeFeatures: ['fraud_detection', 'community_validation']
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      expect(result.success).toBe(true);
      expect(result.scenario).toBe('sales_demo');
      expect(result.recordsGenerated.users).toBeGreaterThan(0);
      expect(result.recordsGenerated.properties).toBeGreaterThan(0);
      expect(result.filesGenerated).toContain('showcase_users.json');
      expect(result.filesGenerated).toContain('showcase_properties.json');
      expect(result.statistics.dataQuality).toBeGreaterThan(0.95);
    }, 45000); // 45 second timeout for comprehensive generation

    it('should generate technical demo with performance metrics', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'technical_demo',
        outputDir: path.join(tempDir, 'technical_demo'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'technical',
          demoLength: 'extended'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      expect(result.success).toBe(true);
      expect(result.scenario).toBe('technical_demo');
      expect(result.recordsGenerated.users).toBeGreaterThan(100);
      expect(result.recordsGenerated.properties).toBeGreaterThan(500);
      expect(result.statistics.fraudDetectionAccuracy).toBeGreaterThan(0.9);
    }, 60000); // 60 second timeout for technical demo
  });

  describe('Data Quality Validation', () => {
    it('should generate high-quality user data', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'executive_demo',
        outputDir: path.join(tempDir, 'quality_test'),
        includeNarratives: false,
        generateShowcaseData: true,
        createVisualizations: false,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      // Check if showcase users file exists and is valid
      const usersFile = path.join(config.outputDir, 'showcase_users.json');
      const usersData = JSON.parse(await fs.readFile(usersFile, 'utf-8'));
      
      expect(Array.isArray(usersData)).toBe(true);
      expect(usersData.length).toBeGreaterThan(0);
      
      // Validate user data structure
      const user = usersData[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('userType');
      expect(user).toHaveProperty('location');
      expect(user).toHaveProperty('profile');
      expect(user).toHaveProperty('activity');
      expect(user).toHaveProperty('demoAttributes');
      
      // Validate Kenyan context
      expect(user.phone).toMatch(/^\+254/); // Kenyan phone number format
      expect(user.location.county).toBeTruthy();
      expect(user.profile.trustScore).toBeGreaterThanOrEqual(0);
      expect(user.profile.trustScore).toBeLessThanOrEqual(1);
    }, 30000);

    it('should generate realistic property data', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'sales_demo',
        outputDir: path.join(tempDir, 'property_test'),
        includeNarratives: false,
        generateShowcaseData: true,
        createVisualizations: false,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'sales',
          demoLength: 'standard'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      // Check if showcase properties file exists and is valid
      const propertiesFile = path.join(config.outputDir, 'showcase_properties.json');
      const propertiesData = JSON.parse(await fs.readFile(propertiesFile, 'utf-8'));
      
      expect(Array.isArray(propertiesData)).toBe(true);
      expect(propertiesData.length).toBeGreaterThan(0);
      
      // Validate property data structure
      const property = propertiesData[0];
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('title');
      expect(property).toHaveProperty('description');
      expect(property).toHaveProperty('propertyType');
      expect(property).toHaveProperty('location');
      expect(property).toHaveProperty('details');
      expect(property).toHaveProperty('verification');
      expect(property).toHaveProperty('market');
      expect(property).toHaveProperty('demoAttributes');
      
      // Validate realistic data
      expect(property.details.price).toBeGreaterThan(0);
      expect(property.details.currency).toBe('KES');
      expect(property.location.coordinates.lat).toBeGreaterThan(-5);
      expect(property.location.coordinates.lat).toBeLessThan(5);
      expect(property.location.coordinates.lng).toBeGreaterThan(33);
      expect(property.location.coordinates.lng).toBeLessThan(42);
      expect(property.verification.score).toBeGreaterThanOrEqual(0);
      expect(property.verification.score).toBeLessThanOrEqual(1);
    }, 45000);

    it('should generate realistic fraud cases', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'customer_success',
        outputDir: path.join(tempDir, 'fraud_test'),
        includeNarratives: false,
        generateShowcaseData: true,
        createVisualizations: false,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'sales',
          demoLength: 'standard'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      // Check if fraud cases file exists and is valid
      const fraudFile = path.join(config.outputDir, 'demo_fraud_cases.json');
      const fraudData = JSON.parse(await fs.readFile(fraudFile, 'utf-8'));
      
      expect(Array.isArray(fraudData)).toBe(true);
      expect(fraudData.length).toBeGreaterThan(0);
      
      // Validate fraud case structure
      const fraudCase = fraudData[0];
      expect(fraudCase).toHaveProperty('id');
      expect(fraudCase).toHaveProperty('type');
      expect(fraudCase).toHaveProperty('severity');
      expect(fraudCase).toHaveProperty('status');
      expect(fraudCase).toHaveProperty('detectionMethod');
      expect(fraudCase).toHaveProperty('timeline');
      expect(fraudCase).toHaveProperty('impact');
      expect(fraudCase).toHaveProperty('resolution');
      expect(fraudCase).toHaveProperty('demoAttributes');
      
      // Validate fraud case data
      expect(['document_forgery', 'identity_theft', 'double_selling', 'fake_listing']).toContain(fraudCase.type);
      expect(['low', 'medium', 'high', 'critical']).toContain(fraudCase.severity);
      expect(['detected', 'investigating', 'resolved', 'prevented']).toContain(fraudCase.status);
      expect(fraudCase.impact.potentialLoss).toBeGreaterThan(0);
      expect(fraudCase.demoAttributes.isShowcase).toBe(true);
    }, 30000);
  });

  describe('File Generation and Export', () => {
    it('should generate all required files', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'executive_demo',
        outputDir: path.join(tempDir, 'file_test'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      const requiredFiles = [
        'showcase_users.json',
        'showcase_properties.json',
        'demo_fraud_cases.json',
        'success_stories.json',
        'demo_narratives.json',
        'demo_visualizations.json',
        'demo_documentation.json',
        'DEMO_GUIDE.md'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(config.outputDir, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
        
        if (file.endsWith('.json')) {
          const content = await fs.readFile(filePath, 'utf-8');
          expect(() => JSON.parse(content)).not.toThrow();
        }
      }
    }, 30000);

    it('should generate valid JSON files', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'sales_demo',
        outputDir: path.join(tempDir, 'json_test'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'sales',
          demoLength: 'standard'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      const jsonFiles = result.filesGenerated.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(config.outputDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        expect(() => {
          const parsed = JSON.parse(content);
          expect(parsed).toBeDefined();
        }).not.toThrow();
      }
    }, 45000);

    it('should generate markdown documentation', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'technical_demo',
        outputDir: path.join(tempDir, 'markdown_test'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'technical',
          demoLength: 'extended'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      const markdownFile = path.join(config.outputDir, 'DEMO_GUIDE.md');
      await expect(fs.access(markdownFile)).resolves.not.toThrow();
      
      const content = await fs.readFile(markdownFile, 'utf-8');
      expect(content).toContain('# TripleCheck Demo Documentation');
      expect(content).toContain('## Setup');
      expect(content).toContain('## Walkthrough');
      expect(content.length).toBeGreaterThan(1000); // Substantial content
    }, 60000);
  });

  describe('Progress Tracking', () => {
    it('should emit progress events during generation', async () => {
      const progressEvents: any[] = [];
      
      generator.onProgress((progress) => {
        progressEvents.push(progress);
      });

      const config: DemoGenerationConfig = {
        scenario: 'executive_demo',
        outputDir: path.join(tempDir, 'progress_test'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      await generator.generateDemoScenario(config);
      
      expect(progressEvents.length).toBeGreaterThan(0);
      
      // Validate progress event structure
      const progressEvent = progressEvents[0];
      expect(progressEvent).toHaveProperty('stage');
      expect(progressEvent).toHaveProperty('completed');
      expect(progressEvent).toHaveProperty('total');
      expect(progressEvent).toHaveProperty('percentage');
      expect(progressEvent).toHaveProperty('currentOperation');
      
      // Check progress values
      expect(progressEvent.percentage).toBeGreaterThanOrEqual(0);
      expect(progressEvent.percentage).toBeLessThanOrEqual(100);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid scenario names gracefully', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'invalid_scenario',
        outputDir: path.join(tempDir, 'error_test'),
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      await expect(generator.generateDemoScenario(config)).rejects.toThrow('Unknown demo scenario');
    });

    it('should handle invalid output directory gracefully', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'executive_demo',
        outputDir: '/invalid/path/that/does/not/exist',
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: true,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      // Should not throw - should create directory
      await expect(generator.generateDemoScenario(config)).resolves.toBeDefined();
    }, 30000);
  });

  describe('Performance Testing', () => {
    it('should generate demo data within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const config: DemoGenerationConfig = {
        scenario: 'executive_demo',
        outputDir: path.join(tempDir, 'performance_test'),
        includeNarratives: false, // Skip narratives for speed
        generateShowcaseData: true,
        createVisualizations: false, // Skip visualizations for speed
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.duration).toBeLessThan(30000);
    }, 35000);

    it('should handle large data generation efficiently', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'performance_benchmark',
        outputDir: path.join(tempDir, 'large_data_test'),
        includeNarratives: false,
        generateShowcaseData: false,
        createVisualizations: false,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'technical',
          demoLength: 'extended'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBeGreaterThan(500);
      expect(result.recordsGenerated.properties).toBeGreaterThan(2000);
      expect(result.statistics.dataQuality).toBeGreaterThan(0.95);
    }, 120000); // 2 minute timeout for large data generation
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity across generated data', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'sales_demo',
        outputDir: path.join(tempDir, 'consistency_test'),
        includeNarratives: false,
        generateShowcaseData: true,
        createVisualizations: false,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'sales',
          demoLength: 'standard'
        }
      };

      const result = await generator.generateDemoScenario(config);
      
      // Load generated data
      const usersData = JSON.parse(await fs.readFile(path.join(config.outputDir, 'showcase_users.json'), 'utf-8'));
      const propertiesData = JSON.parse(await fs.readFile(path.join(config.outputDir, 'showcase_properties.json'), 'utf-8'));
      const fraudData = JSON.parse(await fs.readFile(path.join(config.outputDir, 'demo_fraud_cases.json'), 'utf-8'));
      
      // Check data consistency
      expect(usersData.length).toBeGreaterThan(0);
      expect(propertiesData.length).toBeGreaterThan(0);
      expect(fraudData.length).toBeGreaterThan(0);
      
      // Validate that all users have unique IDs
      const userIds = usersData.map((user: any) => user.id);
      const uniqueUserIds = new Set(userIds);
      expect(uniqueUserIds.size).toBe(userIds.length);
      
      // Validate that all properties have unique IDs
      const propertyIds = propertiesData.map((property: any) => property.id);
      const uniquePropertyIds = new Set(propertyIds);
      expect(uniquePropertyIds.size).toBe(propertyIds.length);
      
      // Validate that fraud cases have unique IDs
      const fraudIds = fraudData.map((fraud: any) => fraud.id);
      const uniqueFraudIds = new Set(fraudIds);
      expect(uniqueFraudIds.size).toBe(fraudIds.length);
    }, 45000);

    it('should generate consistent statistics across runs', async () => {
      const config: DemoGenerationConfig = {
        scenario: 'executive_demo',
        outputDir: path.join(tempDir, 'stats_test_1'),
        includeNarratives: false,
        generateShowcaseData: true,
        createVisualizations: false,
        exportFormats: ['json'],
        customization: {
          targetAudience: 'executives',
          demoLength: 'quick'
        }
      };

      const result1 = await generator.generateDemoScenario(config);
      
      // Generate again with same config
      config.outputDir = path.join(tempDir, 'stats_test_2');
      const result2 = await generator.generateDemoScenario(config);
      
      // Statistics should be consistent (within reasonable variance)
      expect(result1.statistics.dataQuality).toBeCloseTo(result2.statistics.dataQuality, 1);
      expect(result1.statistics.fraudDetectionAccuracy).toBeCloseTo(result2.statistics.fraudDetectionAccuracy, 1);
      expect(result1.statistics.relationshipConsistency).toBeCloseTo(result2.statistics.relationshipConsistency, 1);
    }, 60000);
  });
});

describe('Demo Scenario Metadata', () => {
  it('should have valid scenario categories', () => {
    const { SCENARIO_METADATA } = require('../scenarios/production-demo-scenarios');
    
    expect(SCENARIO_METADATA.categories).toBeDefined();
    expect(SCENARIO_METADATA.audience).toBeDefined();
    expect(SCENARIO_METADATA.complexity).toBeDefined();
    expect(SCENARIO_METADATA.duration).toBeDefined();
    
    // Validate that all scenarios in categories exist
    Object.values(SCENARIO_METADATA.categories).forEach((scenarios: any) => {
      scenarios.forEach((scenario: string) => {
        expect(PRODUCTION_DEMO_SCENARIOS[scenario]).toBeDefined();
      });
    });
  });

  it('should have consistent scenario classifications', () => {
    const { SCENARIO_METADATA } = require('../scenarios/production-demo-scenarios');
    
    // All scenarios should be classified in at least one category
    const allScenarios = getAllScenarioNames();
    const categorizedScenarios = new Set();
    
    Object.values(SCENARIO_METADATA.categories).forEach((scenarios: any) => {
      scenarios.forEach((scenario: string) => categorizedScenarios.add(scenario));
    });
    
    allScenarios.forEach(scenario => {
      expect(categorizedScenarios.has(scenario)).toBe(true);
    });
  });
});