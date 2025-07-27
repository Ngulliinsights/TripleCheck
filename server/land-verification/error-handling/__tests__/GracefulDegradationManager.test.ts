/**
 * Tests for GracefulDegradationManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  GracefulDegradationManager, 
  DegradationContext, 
  DegradationLevel,
  DegradationRule 
} from '../GracefulDegradationManager';

describe('GracefulDegradationManager', () => {
  let degradationManager: GracefulDegradationManager;
  let mockOperation: vi.MockedFunction<(level: DegradationLevel) => Promise<string>>;

  beforeEach(() => {
    degradationManager = new GracefulDegradationManager();
    mockOperation = vi.fn();
    vi.clearAllMocks();
  });

  describe('determineDegradationLevel', () => {
    it('should return full service when all services are available', () => {
      const context: DegradationContext = {
        availableServices: ['government-api', 'court-records', 'physical-verification', 'community-intelligence', 'expert-services'],
        failedServices: [],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const level = degradationManager.determineDegradationLevel(context);

      expect(level.level).toBe('full');
      expect(level.dataQuality).toBe(100);
      expect(level.limitations).toHaveLength(0);
    });

    it('should return partial service when government API is down', () => {
      const context: DegradationContext = {
        availableServices: ['court-records', 'physical-verification', 'community-intelligence'],
        failedServices: ['government-api'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const level = degradationManager.determineDegradationLevel(context);

      expect(level.level).toBe('partial');
      expect(level.dataQuality).toBe(75);
      expect(level.availableFeatures).toContain('court-records-search');
      expect(level.availableFeatures).toContain('physical-verification');
      expect(level.limitations).toContain('Real-time registry data unavailable');
    });

    it('should return minimal service when most external services are down', () => {
      const context: DegradationContext = {
        availableServices: ['physical-verification'],
        failedServices: ['government-api', 'court-records'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const level = degradationManager.determineDegradationLevel(context);

      expect(level.level).toBe('minimal');
      expect(level.dataQuality).toBe(50);
      expect(level.availableFeatures).toContain('physical-verification');
      expect(level.availableFeatures).toContain('community-intelligence');
      expect(level.limitations).toContain('No government registry access');
    });

    it('should return emergency service for critical situations', () => {
      const context: DegradationContext = {
        availableServices: ['physical-verification'],
        failedServices: ['government-api', 'court-records', 'expert-services'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'critical'
      };

      const level = degradationManager.determineDegradationLevel(context);

      expect(level.level).toBe('emergency');
      expect(level.dataQuality).toBe(25);
      expect(level.availableFeatures).toContain('document-analysis');
      expect(level.availableFeatures).toContain('expert-escalation');
      expect(level.limitations).toContain('Most automated verification disabled');
    });

    it('should return emergency service when too many services fail', () => {
      const context: DegradationContext = {
        availableServices: ['physical-verification'],
        failedServices: ['government-api', 'court-records', 'expert-services', 'document-processing'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const level = degradationManager.determineDegradationLevel(context);

      expect(level.level).toBe('emergency');
    });
  });

  describe('executeWithDegradation', () => {
    it('should execute operation with full service level', async () => {
      const context: DegradationContext = {
        availableServices: ['government-api', 'court-records', 'physical-verification', 'community-intelligence', 'expert-services', 'gps-service'],
        failedServices: [],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      mockOperation.mockResolvedValueOnce('success');

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.degradationLevel.level).toBe('full');
      expect(result.dataCompleteness).toBeGreaterThan(70);
      expect(result.warnings).toHaveLength(0);
    });

    it('should execute operation with partial service level', async () => {
      const context: DegradationContext = {
        availableServices: ['court-records', 'physical-verification'],
        failedServices: ['government-api'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      mockOperation.mockResolvedValueOnce('partial-success');

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('partial-success');
      expect(result.degradationLevel.level).toBe('partial');
      expect(result.dataCompleteness).toBeLessThan(100);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Consider scheduling verification when government services are restored');
    });

    it('should handle operation failure', async () => {
      const context: DegradationContext = {
        availableServices: ['physical-verification'],
        failedServices: ['government-api', 'court-records'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const operationError = new Error('Operation failed');
      mockOperation.mockRejectedValueOnce(operationError);

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.success).toBe(false);
      expect(result.degradationLevel.level).toBe('minimal');
      expect(result.warnings).toContain('Operation failed: Operation failed');
      expect(result.dataCompleteness).toBe(0);
    });

    it('should calculate data completeness based on available features', async () => {
      const context: DegradationContext = {
        availableServices: ['physical-verification', 'community-intelligence'],
        failedServices: ['government-api', 'court-records', 'expert-services'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      mockOperation.mockResolvedValueOnce('success');

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.success).toBe(true);
      expect(result.dataCompleteness).toBeGreaterThan(0);
      expect(result.dataCompleteness).toBeLessThan(100);
    });
  });

  describe('feature availability', () => {
    it('should check if feature is available at degradation level', () => {
      const fullLevel: DegradationLevel = {
        level: 'full',
        description: 'Full service',
        availableFeatures: ['government-registry-check', 'court-records-search'],
        limitations: [],
        dataQuality: 100
      };

      expect(degradationManager.isFeatureAvailable('government-registry-check', fullLevel)).toBe(true);
      expect(degradationManager.isFeatureAvailable('unavailable-feature', fullLevel)).toBe(false);
    });

    it('should get alternative features for unavailable feature', () => {
      const partialLevel: DegradationLevel = {
        level: 'partial',
        description: 'Partial service',
        availableFeatures: ['cached-registry-data', 'court-records-search'],
        limitations: [],
        dataQuality: 75
      };

      // Register a feature with fallbacks
      degradationManager.registerFeature({
        name: 'government-registry-check',
        dependencies: ['government-api'],
        fallbacks: ['cached-registry-data'],
        criticalityLevel: 'high',
        dataContribution: 30
      });

      const alternatives = degradationManager.getAlternativeFeatures('government-registry-check', partialLevel);
      expect(alternatives).toContain('cached-registry-data');
    });
  });

  describe('custom rules and features', () => {
    it('should register custom degradation rule', () => {
      const customRule: DegradationRule = {
        condition: (context) => context.availableServices.includes('custom-service'),
        level: {
          level: 'full',
          description: 'Custom full service',
          availableFeatures: ['custom-feature'],
          limitations: [],
          dataQuality: 100
        },
        priority: 0 // Higher priority than default rules
      };

      degradationManager.registerDegradationRule(customRule);

      const context: DegradationContext = {
        availableServices: ['custom-service'],
        failedServices: [],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const level = degradationManager.determineDegradationLevel(context);
      expect(level.description).toBe('Custom full service');
    });

    it('should register custom feature', () => {
      const customFeature = {
        name: 'custom-verification',
        dependencies: ['custom-service'],
        fallbacks: ['manual-verification'],
        criticalityLevel: 'high' as const,
        dataContribution: 40
      };

      degradationManager.registerFeature(customFeature);

      const features = degradationManager.getFeatures();
      const registeredFeature = features.find(f => f.name === 'custom-verification');
      
      expect(registeredFeature).toBeDefined();
      expect(registeredFeature?.dataContribution).toBe(40);
    });

    it('should get all degradation rules', () => {
      const rules = degradationManager.getDegradationRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].priority).toBeLessThanOrEqual(rules[1].priority);
    });
  });

  describe('createDegradationWrapper', () => {
    it('should create degradation-aware wrapper function', async () => {
      const originalFunction = vi.fn().mockResolvedValue('result');
      
      const degradationFunction = degradationManager.createDegradationWrapper(
        originalFunction,
        'wrapped-operation'
      );

      const context: DegradationContext = {
        availableServices: ['government-api', 'court-records', 'physical-verification', 'community-intelligence', 'expert-services'],
        failedServices: [],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      const result = await degradationFunction(context, 'arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFunction).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'full' }),
        'arg1',
        'arg2'
      );
    });

    it('should throw error when degraded operation fails', async () => {
      const originalFunction = vi.fn().mockRejectedValue(new Error('Function failed'));
      
      const degradationFunction = degradationManager.createDegradationWrapper(
        originalFunction,
        'wrapped-operation'
      );

      const context: DegradationContext = {
        availableServices: ['physical-verification'],
        failedServices: ['government-api', 'court-records'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      await expect(degradationFunction(context)).rejects.toThrow('Operation failed in degraded mode');
    });
  });

  describe('warning and recommendation generation', () => {
    it('should generate appropriate warnings for partial service', async () => {
      const context: DegradationContext = {
        availableServices: ['court-records', 'physical-verification'],
        failedServices: ['government-api'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      mockOperation.mockResolvedValueOnce('success');

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.warnings.some(w => w.includes('partial mode'))).toBe(true);
      expect(result.warnings.some(w => w.includes('government-api'))).toBe(true);
    });

    it('should generate appropriate recommendations for minimal service', async () => {
      const context: DegradationContext = {
        availableServices: ['physical-verification'],
        failedServices: ['government-api', 'court-records'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'medium'
      };

      mockOperation.mockResolvedValueOnce('success');

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.recommendations).toContain('Prioritize physical verification and community intelligence');
      expect(result.recommendations).toContain('Schedule follow-up verification when external services are restored');
    });

    it('should generate critical recommendations for emergency mode', async () => {
      const context: DegradationContext = {
        availableServices: [],
        failedServices: ['government-api', 'court-records', 'physical-verification', 'expert-services'],
        partialData: {},
        userRequirements: [],
        criticalityLevel: 'critical'
      };

      mockOperation.mockResolvedValueOnce('success');

      const result = await degradationManager.executeWithDegradation(
        mockOperation,
        context,
        'test-operation'
      );

      expect(result.recommendations).toContain('Manual expert review strongly recommended');
      expect(result.recommendations).toContain('Consider alternative verification methods due to critical nature');
    });
  });
});