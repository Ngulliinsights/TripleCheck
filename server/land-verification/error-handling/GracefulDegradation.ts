/**
 * Graceful Degradation Manager (Consolidated)
 * Combines functionality from GracefulDegradation.ts and GracefulDegradationManager.ts
 */

import { BusinessLogicError, ErrorCode, HttpStatusCode, generateCorrelationId } from '@shared/types/errors';
import { logger } from '../../infrastructure/observability/telemetry';

// ─── Types ────────────────────────────────────────────────────────────────

export interface DegradationLevel {
  readonly level: 'full' | 'partial' | 'minimal' | 'emergency';
  readonly description: string;
  readonly availableFeatures: string[];
  readonly limitations: string[];
  readonly dataQuality: number; // 0-100
  readonly confidence: number; // 0-1
}

export interface DegradationContext {
  readonly availableServices: string[];
  readonly failedServices: string[];
  readonly partialData: Record<string, unknown>;
  readonly userRequirements: string[];
  readonly timeConstraints?: number;
  readonly criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DegradationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly degradationLevel: DegradationLevel;
  readonly warnings: string[];
  readonly recommendations: string[];
  readonly correlationId: string;
  readonly dataCompleteness: number; // 0-100
}

interface DegradationRule {
  readonly condition: (context: DegradationContext) => boolean;
  readonly level: DegradationLevel;
  readonly priority: number;
}

interface FeatureDefinition {
  readonly name: string;
  readonly dependencies: string[];
  readonly fallbacks: string[];
  readonly criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly dataContribution: number;
}

// ─── Degradation Level Presets ─────────────────────────────────────────────

const DEGRADATION_LEVELS: Record<string, DegradationLevel> = {
  full: {
    level: 'full',
    description: 'All verification services operational',
    availableFeatures: [
      'government-registry-check',
      'court-records-search',
      'physical-verification',
      'community-intelligence',
      'expert-coordination',
      'risk-assessment',
      'monitoring',
    ],
    limitations: [],
    dataQuality: 100,
    confidence: 1.0,
  },

  partial: {
    level: 'partial',
    description: 'Government registry unavailable, using alternative verification methods',
    availableFeatures: [
      'court-records-search',
      'physical-verification',
      'community-intelligence',
      'expert-coordination',
      'cached-registry-data',
      'risk-assessment',
    ],
    limitations: [
      'Real-time registry data unavailable',
      'Ownership verification limited to cached data',
      'Increased reliance on physical verification',
    ],
    dataQuality: 75,
    confidence: 0.8,
  },

  minimal: {
    level: 'minimal',
    description: 'External services unavailable, local verification only',
    availableFeatures: [
      'physical-verification',
      'community-intelligence',
      'document-analysis',
      'basic-risk-assessment',
    ],
    limitations: [
      'No government registry access',
      'No court records available',
      'Limited to physical and community verification',
      'Risk assessment based on incomplete data',
    ],
    dataQuality: 50,
    confidence: 0.5,
  },

  emergency: {
    level: 'emergency',
    description: 'Emergency mode - basic verification only',
    availableFeatures: [
      'document-analysis',
      'basic-validation',
      'expert-escalation',
    ],
    limitations: [
      'Most automated verification disabled',
      'Manual expert review required',
      'Significantly reduced data quality',
      'Extended processing time',
    ],
    dataQuality: 25,
    confidence: 0.25,
  },
} as const;

// ─── Main Manager Implementation ───────────────────────────────────────────

export class GracefulDegradationManager {
  private readonly degradationRules: DegradationRule[] = [];
  private readonly featureRegistry: Map<string, FeatureDefinition> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeFeatureRegistry();
  }

  private initializeDefaultRules(): void {
    this.degradationRules.push(
      {
        condition: (ctx) => ctx.failedServices.length === 0 && ctx.availableServices.length >= 5,
        level: DEGRADATION_LEVELS.full,
        priority: 1,
      },
      {
        condition: (ctx) =>
          ctx.failedServices.includes('government-api') &&
          ctx.availableServices.includes('court-records') &&
          ctx.availableServices.includes('physical-verification'),
        level: DEGRADATION_LEVELS.partial, // FIXED: 'partial' (was typo 'partia l')
        priority: 2,
      },
      {
        condition: (ctx) =>
          ctx.failedServices.includes('government-api') &&
          ctx.failedServices.includes('court-records') &&
          ctx.availableServices.includes('physical-verification'),
        level: DEGRADATION_LEVELS.minimal,
        priority: 3,
      },
      {
        condition: (ctx) => ctx.failedServices.length >= 3 || ctx.criticalityLevel === 'critical',
        level: DEGRADATION_LEVELS.emergency,
        priority: 4,
      }
    );
  }

  private initializeFeatureRegistry(): void {
    const features: FeatureDefinition[] = [
      { name: 'government-registry-check', dependencies: ['government-api'], fallbacks: ['cached-registry-data'], criticalityLevel: 'high', dataContribution: 30 },
      { name: 'court-records-search', dependencies: ['court-records'], fallbacks: ['cached-court-data'], criticalityLevel: 'medium', dataContribution: 20 },
      { name: 'physical-verification', dependencies: ['gps-service'], fallbacks: ['manual-measurement'], criticalityLevel: 'high', dataContribution: 25 },
      { name: 'community-intelligence', dependencies: [], fallbacks: [], criticalityLevel: 'medium', dataContribution: 15 },
      { name: 'expert-coordination', dependencies: ['expert-services'], fallbacks: ['manual-expert-contact'], criticalityLevel: 'low', dataContribution: 10 },
    ];

    features.forEach(f => this.featureRegistry.set(f.name, f));
  }

  /**
   * Determine appropriate degradation level based on context
   */
  determineDegradationLevel(context: DegradationContext): DegradationLevel {
    const sortedRules = [...this.degradationRules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (rule.condition(context)) {
        logger.info(`Applied degradation rule: ${rule.level.level}`, {
          level: rule.level.level,
          availableServices: context.availableServices.length,
          failedServices: context.failedServices.length,
        });
        return rule.level;
      }
    }

    logger.warn('No degradation rules matched, defaulting to emergency level', { context });
    return DEGRADATION_LEVELS.emergency;
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

    logger.info(`Executing with degradation: ${operationName}`, {
      operationName,
      degradationLevel: degradationLevel.level,
      correlationId,
    });

    try {
      const result = await operation(degradationLevel);
      const dataCompleteness = this.calculateDataCompleteness(context, degradationLevel);

      return {
        success: true,
        data: result,
        degradationLevel,
        warnings: this.generateWarnings(degradationLevel, context),
        recommendations: this.generateRecommendations(degradationLevel, context),
        correlationId,
        dataCompleteness,
      };
    } catch (error) {
      logger.error(`Degraded operation failed: ${operationName}`, {
        operationName,
        degradationLevel: degradationLevel.level,
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        degradationLevel,
        warnings: [`Operation failed: ${error instanceof Error ? error.message : String(error)}`],
        recommendations: this.generateFailureRecommendations(),
        correlationId,
        dataCompleteness: 0,
      };
    }
  }

  /**
   * Calculate data completeness percentage
   */
  private calculateDataCompleteness(context: DegradationContext, level: DegradationLevel): number {
    let totalContribution = 0;
    let availableContribution = 0;

    for (const feature of this.featureRegistry.values()) {
      totalContribution += feature.dataContribution;

      if (level.availableFeatures.includes(feature.name)) {
        const dependenciesAvailable = feature.dependencies.every(dep => context.availableServices.includes(dep));
        
        if (dependenciesAvailable) {
          availableContribution += feature.dataContribution;
        } else {
          const fallbackAvailable = feature.fallbacks.some(fb => level.availableFeatures.includes(fb));
          if (fallbackAvailable) {
            availableContribution += feature.dataContribution * 0.7; // Fallback penalty
          }
        }
      }
    }

    return totalContribution > 0 ? Math.round((availableContribution / totalContribution) * 100) : 0;
  }

  private generateWarnings(level: DegradationLevel, context: DegradationContext): string[] {
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

  private generateRecommendations(level: DegradationLevel, context: DegradationContext): string[] {
    const recommendations: string[] = [];

    switch (level.level) {
      case 'partial':
        recommendations.push('Consider scheduling verification when services are restored');
        recommendations.push('Increase reliance on physical verification and expert consultation');
        break;
      case 'minimal':
        recommendations.push('Prioritize physical verification and community intelligence');
        recommendations.push('Schedule follow-up verification when services are restored');
        break;
      case 'emergency':
        recommendations.push('Manual expert review strongly recommended');
        recommendations.push('Defer non-critical verification decisions');
        break;
    }

    if (context.criticalityLevel === 'critical') {
      recommendations.push('Consider alternative verification methods due to critical nature');
    }

    return recommendations;
  }

  private generateFailureRecommendations(): string[] {
    return [
      'Retry operation when services are restored',
      'Contact system administrator if issues persist',
      'Consider manual verification processes',
      'Check service status dashboard for updates',
    ];
  }

  /**
   * Check if a feature is available at current degradation level
   */
  isFeatureAvailable(featureName: string, level: DegradationLevel): boolean {
    return level.availableFeatures.includes(featureName);
  }

  /**
   * Get alternative features for an unavailable feature
   */
  getAlternativeFeatures(featureName: string, level: DegradationLevel): string[] {
    const feature = this.featureRegistry.get(featureName);
    if (!feature) return [];

    return feature.fallbacks.filter(fallback => level.availableFeatures.includes(fallback));
  }

  /**
   * Register a custom degradation rule
   */
  registerDegradationRule(rule: DegradationRule): void {
    this.degradationRules.push(rule);
    this.degradationRules.sort((a, b) => a.priority - b.priority);
    logger.info(`Registered custom degradation rule: ${rule.level.level}`, { priority: rule.priority });
  }

  /**
   * Create a degradation-aware wrapper function
   */
  createDegradationWrapper<TArgs extends unknown[], TReturn>(
    fn: (level: DegradationLevel, ...args: TArgs) => Promise<TReturn>,
    operationName: string
  ): (context: DegradationContext, ...args: TArgs) => Promise<TReturn> {
    return async (context: DegradationContext, ...args: TArgs): Promise<TReturn> => {
      const result = await this.executeWithDegradation(
        (level) => fn(level, ...args),
        context,
        operationName
      );

      if (result.success) {
        return result.data!;
      }

      throw new BusinessLogicError(
        `Operation failed in degraded mode: ${operationName}`,
        ErrorCode.OPERATION_NOT_ALLOWED,
        HttpStatusCode.SERVICE_UNAVAILABLE,
        {
          degradationLevel: result.degradationLevel.level,
          warnings: result.warnings,
          recommendations: result.recommendations,
        },
        result.correlationId
      );
    };
  }
}

// Export singleton instance
export const gracefulDegradationManager = new GracefulDegradationManager();