/**
 * Graceful Degradation Manager for Kenya Land Verification System
 * Handles partial data scenarios and provides degraded but functional service
 */

import { 
  BusinessLogicError, 
  ErrorCode, 
  HttpStatusCode,
  generateCorrelationId 
} from '../../../src/local/error-handling";
import { logger } from "..\..\infrastructure\monitoring\logger";

export interface DegradationLevel {
  level: 'full' | 'partial' | 'minimal' | 'emergency';
  description: string;
  availableFeatures: string[];
  limitations: string[];
  dataQuality: number; // 0-100
}

export interface DegradationRule {
  condition: (context: DegradationContext) => boolean;
  level: DegradationLevel;
  priority: number;
}

export interface DegradationContext {
  availableServices: string[];
  failedServices: string[];
  partialData: Record<string, any>;
  userRequirements: string[];
  timeConstraints?: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DegradationResult<T> {
  success: boolean;
  data?: T;
  degradationLevel: DegradationLevel;
  warnings: string[];
  recommendations: string[];
  correlationId: string;
  dataCompleteness: number; // 0-100
}

export class GracefulDegradationManager {
  private readonly degradationRules: DegradationRule[] = [];
  private readonly featureRegistry: Map<string, FeatureDefinition> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeFeatureRegistry();
  }

  /**
   * Initialize default degradation rules
   */
  private initializeDefaultRules(): void {
    // Full service - all systems operational
    this.degradationRules.push({
      condition: (context) => 
        context.failedServices.length === 0 && 
        context.availableServices.length >= 5,
      level: {
        level: 'full',
        description: 'All verification services operational',
        availableFeatures: [
          'government-registry-check',
          'court-records-search',
          'physical-verification',
          'community-intelligence',
          'expert-coordination',
          'risk-assessment',
          'monitoring'
        ],
        limitations: [],
        dataQuality: 100
      },
      priority: 1
    });

    // Partial service - some government services down
    this.degradationRules.push({
      condition: (context) => 
        context.failedServices.includes('government-api') &&
        context.availableServices.includes('court-records') &&
        context.availableServices.includes('physical-verification'),
      level: {
        level: 'partial',
        description: 'Government registry unavailable, using alternative verification methods',
        availableFeatures: [
          'court-records-search',
          'physical-verification',
          'community-intelligence',
          'expert-coordination',
          'cached-registry-data',
          'risk-assessment'
        ],
        limitations: [
          'Real-time registry data unavailable',
          'Ownership verification limited to cached data',
          'Increased reliance on physical verification'
        ],
        dataQuality: 75
      },
      priority: 2
    });

    // Minimal service - only local verification available
    this.degradationRules.push({
      condition: (context) => 
        context.failedServices.includes('government-api') &&
        context.failedServices.includes('court-records') &&
        context.availableServices.includes('physical-verification'),
      level: {
        level: 'minimal',
        description: 'External services unavailable, local verification only',
        availableFeatures: [
          'physical-verification',
          'community-intelligence',
          'document-analysis',
          'basic-risk-assessment'
        ],
        limitations: [
          'No government registry access',
          'No court records available',
          'Limited to physical and community verification',
          'Risk assessment based on incomplete data'
        ],
        dataQuality: 50
      },
      priority: 3
    });

    // Emergency service - critical functionality only
    this.degradationRules.push({
      condition: (context) => 
        context.failedServices.length >= 3 ||
        context.criticalityLevel === 'critical',
      level: {
        level: 'emergency',
        description: 'Emergency mode - basic verification only',
        availableFeatures: [
          'document-analysis',
          'basic-validation',
          'expert-escalation'
        ],
        limitations: [
          'Most automated verification disabled',
          'Manual expert review required',
          'Significantly reduced data quality',
          'Extended processing time'
        ],
        dataQuality: 25
      },
      priority: 4
    });

    logger.info(
      `Initialized ${this.degradationRules.length} degradation rules`,
      'DEGRADATION_MANAGER'
    );
  }

  /**
   * Initialize feature registry
   */
  private initializeFeatureRegistry(): void {
    const features: FeatureDefinition[] = [
      {
        name: 'government-registry-check',
        dependencies: ['government-api'],
        fallbacks: ['cached-registry-data'],
        criticalityLevel: 'high',
        dataContribution: 30
      },
      {
        name: 'court-records-search',
        dependencies: ['court-records'],
        fallbacks: ['cached-court-data'],
        criticalityLevel: 'medium',
        dataContribution: 20
      },
      {
        name: 'physical-verification',
        dependencies: ['gps-service'],
        fallbacks: ['manual-measurement'],
        criticalityLevel: 'high',
        dataContribution: 25
      },
      {
        name: 'community-intelligence',
        dependencies: [],
        fallbacks: [],
        criticalityLevel: 'medium',
        dataContribution: 15
      },
      {
        name: 'expert-coordination',
        dependencies: ['expert-services'],
        fallbacks: ['manual-expert-contact'],
        criticalityLevel: 'low',
        dataContribution: 10
      }
    ];

    features.forEach(feature => {
      this.featureRegistry.set(feature.name, feature);
    });

    logger.info(
      `Registered ${features.length} features in degradation manager`,
      'DEGRADATION_MANAGER'
    );
  }

  /**
   * Determine appropriate degradation level
   */
  determineDegradationLevel(context: DegradationContext): DegradationLevel {
    // Sort rules by priority and find first matching rule
    const sortedRules = [...this.degradationRules].sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      if (rule.condition(context)) {
        logger.info(
          `Applied degradation rule: ${rule.level.level}`,
          'DEGRADATION_MANAGER',
          { 
            level: rule.level.level,
            availableServices: context.availableServices.length,
            failedServices: context.failedServices.length
          }
        );
        
        return rule.level;
      }
    }

    // Default to emergency level if no rules match
    logger.warn(
      'No degradation rules matched, defaulting to emergency level',
      'DEGRADATION_MANAGER',
      { context }
    );

    return this.degradationRules[this.degradationRules.length - 1].level;
  }

  /**
   * Execute operation with graceful degradation
   */
  async executeWithDegradation<T>(
    operation: (level: DegradationLevel) => Promise<T>,
    context: DegradationContext,
    operationName: string
  ): Promise<DegradationResult<T>> {
    const correlationId = generateCorrelationId();
    const degradationLevel = this.determineDegradationLevel(context);

    logger.info(
      `Executing operation with degradation: ${operationName}`,
      'DEGRADATION_MANAGER',
      { 
        operationName,
        degradationLevel: degradationLevel.level,
        correlationId 
      }
    );

    try {
      const result = await operation(degradationLevel);
      const dataCompleteness = this.calculateDataCompleteness(context, degradationLevel);
      const warnings = this.generateWarnings(degradationLevel, context);
      const recommendations = this.generateRecommendations(degradationLevel, context);

      logger.info(
        `Degraded operation completed successfully: ${operationName}`,
        'DEGRADATION_MANAGER',
        { 
          operationName,
          degradationLevel: degradationLevel.level,
          dataCompleteness,
          correlationId 
        }
      );

      return {
        success: true,
        data: result,
        degradationLevel,
        warnings,
        recommendations,
        correlationId,
        dataCompleteness
      };

    } catch (error) {
      logger.error(
        `Degraded operation failed: ${operationName}`,
        'DEGRADATION_MANAGER',
        { 
          operationName,
          degradationLevel: degradationLevel.level,
          correlationId,
          error: error instanceof Error ? error.message : String(error)
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        success: false,
        degradationLevel,
        warnings: [`Operation failed: ${error instanceof Error ? error.message : String(error)}`],
        recommendations: this.generateFailureRecommendations(degradationLevel, context),
        correlationId,
        dataCompleteness: 0
      };
    }
  }

  /**
   * Calculate data completeness based on available services
   */
  private calculateDataCompleteness(
    context: DegradationContext,
    level: DegradationLevel
  ): number {
    let totalPossibleContribution = 0;
    let availableContribution = 0;

    for (const [featureName, feature] of this.featureRegistry) {
      totalPossibleContribution += feature.dataContribution;
      
      if (level.availableFeatures.includes(featureName)) {
        // Check if dependencies are available
        const dependenciesAvailable = feature.dependencies.every(dep => 
          context.availableServices.includes(dep)
        );
        
        if (dependenciesAvailable) {
          availableContribution += feature.dataContribution;
        } else {
          // Check if fallbacks are available
          const fallbacksAvailable = feature.fallbacks.some(fallback =>
            level.availableFeatures.includes(fallback)
          );
          
          if (fallbacksAvailable) {
            availableContribution += feature.dataContribution * 0.7; // Fallback penalty
          }
        }
      }
    }

    return Math.round((availableContribution / totalPossibleContribution) * 100);
  }

  /**
   * Generate warnings for current degradation level
   */
  private generateWarnings(
    level: DegradationLevel,
    context: DegradationContext
  ): string[] {
    const warnings: string[] = [];

    if (level.level !== 'full') {
      warnings.push(`Service operating in ${level.level} mode: ${level.description}`);
    }

    if (context.failedServices.length > 0) {
      warnings.push(`Failed services: ${context.failedServices.join(', ')}`);
    }

    if (level.dataQuality < 80) {
      warnings.push(`Data quality reduced to ${level.dataQuality}%`);
    }

    warnings.push(...level.limitations);

    return warnings;
  }

  /**
   * Generate recommendations for current degradation level
   */
  private generateRecommendations(
    level: DegradationLevel,
    context: DegradationContext
  ): string[] {
    const recommendations: string[] = [];

    switch (level.level) {
      case 'partial':
        recommendations.push('Consider scheduling verification when government services are restored');
        recommendations.push('Increase reliance on physical verification and expert consultation');
        break;
      
      case 'minimal':
        recommendations.push('Prioritize physical verification and community intelligence');
        recommendations.push('Schedule follow-up verification when external services are restored');
        recommendations.push('Consider expert review for critical decisions');
        break;
      
      case 'emergency':
        recommendations.push('Manual expert review strongly recommended');
        recommendations.push('Defer non-critical verification decisions');
        recommendations.push('Monitor service status for restoration');
        break;
    }

    if (context.criticalityLevel === 'critical') {
      recommendations.push('Consider alternative verification methods due to critical nature');
    }

    return recommendations;
  }

  /**
   * Generate recommendations for failed operations
   */
  private generateFailureRecommendations(
    level: DegradationLevel,
    context: DegradationContext
  ): string[] {
    return [
      'Retry operation when services are restored',
      'Contact system administrator if issues persist',
      'Consider manual verification processes',
      'Check service status dashboard for updates'
    ];
  }

  /**
   * Check if feature is available at current degradation level
   */
  isFeatureAvailable(featureName: string, level: DegradationLevel): boolean {
    return level.availableFeatures.includes(featureName);
  }

  /**
   * Get alternative features for unavailable feature
   */
  getAlternativeFeatures(featureName: string, level: DegradationLevel): string[] {
    const feature = this.featureRegistry.get(featureName);
    if (!feature) return [];

    return feature.fallbacks.filter(fallback => 
      level.availableFeatures.includes(fallback)
    );
  }

  /**
   * Register custom degradation rule
   */
  registerDegradationRule(rule: DegradationRule): void {
    this.degradationRules.push(rule);
    this.degradationRules.sort((a, b) => a.priority - b.priority);
    
    logger.info(
      `Registered custom degradation rule: ${rule.level.level}`,
      'DEGRADATION_MANAGER',
      { level: rule.level.level, priority: rule.priority }
    );
  }

  /**
   * Register feature definition
   */
  registerFeature(feature: FeatureDefinition): void {
    this.featureRegistry.set(feature.name, feature);
    
    logger.info(
      `Registered feature: ${feature.name}`,
      'DEGRADATION_MANAGER',
      { feature: feature.name, criticality: feature.criticalityLevel }
    );
  }

  /**
   * Get current degradation rules
   */
  getDegradationRules(): DegradationRule[] {
    return [...this.degradationRules];
  }

  /**
   * Get registered features
   */
  getFeatures(): FeatureDefinition[] {
    return Array.from(this.featureRegistry.values());
  }

  /**
   * Create a degradation-aware wrapper for async functions
   */
  createDegradationWrapper<T extends any[], R>(
    fn: (level: DegradationLevel, ...args: T) => Promise<R>,
    operationName: string
  ): (context: DegradationContext, ...args: T) => Promise<R> {
    return async (context: DegradationContext, ...args: T): Promise<R> => {
      const result = await this.executeWithDegradation(
        (level) => fn(level, ...args),
        context,
        operationName
      );

      if (result.success) {
        return result.data!;
      } else {
        throw new BusinessLogicError(
          `Operation failed in degraded mode: ${operationName}`,
          ErrorCode.OPERATION_NOT_ALLOWED,
          HttpStatusCode.SERVICE_UNAVAILABLE,
          {
            degradationLevel: result.degradationLevel.level,
            warnings: result.warnings,
            recommendations: result.recommendations
          },
          result.correlationId
        );
      }
    };
  }
}

interface FeatureDefinition {
  name: string;
  dependencies: string[];
  fallbacks: string[];
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  dataContribution: number; // Percentage contribution to overall data quality
}

// Export singleton instance
export const gracefulDegradationManager = new GracefulDegradationManager();