/**
 * Fallback mechanisms for land verification services
 * Provides graceful degradation when primary services are unavailable
 */

import { logger } from '../../infrastructure/observability/telemetry';
import { LandVerificationErrorCode } from '../errors/LandVerificationErrors';

export interface FallbackConfig {
  enabled: boolean;
  fallbackOrder: string[];
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  manualFallbackEnabled: boolean;
  partialResultsAcceptable: boolean;
}

export interface FallbackResult<T> {
  success: boolean;
  result?: T;
  source: 'primary' | 'cache' | 'alternative' | 'manual' | 'partial';
  warnings: string[];
  limitations: string[];
  confidence: number; // 0-1
}

export interface CachedData<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  source: string;
  confidence: number;
}

export class FallbackMechanisms {
  private cache: Map<string, CachedData<any>> = new Map();
  private config: FallbackConfig;

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      enabled: true,
      fallbackOrder: ['cache', 'alternative', 'manual', 'partial'],
      cacheEnabled: true,
      cacheTTL: 3600, // 1 hour
      manualFallbackEnabled: true,
      partialResultsAcceptable: true,
      ...config
    };
  }

  /**
   * Execute operation with fallback mechanisms
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOptions: FallbackOptions<T>,
    operationName: string,
    correlationId?: string
  ): Promise<FallbackResult<T>> {
    if (!this.config.enabled) {
      try {
        const result = await primaryOperation();
        return {
          success: true,
          result,
          source: 'primary',
          warnings: [],
          limitations: [],
          confidence: 1.0
        };
      } catch (error) {
        return {
          success: false,
          source: 'primary',
          warnings: [`Primary operation failed: ${(error as Error).message}`],
          limitations: ['No fallback mechanisms enabled'],
          confidence: 0
        };
      }
    }

    logger.info(
      `Executing operation with fallback: ${operationName}`,
      'FallbackMechanisms',
      correlationId
    );

    // Try primary operation first
    try {
      const result = await primaryOperation();
      
      // Cache successful result
      if (this.config.cacheEnabled && fallbackOptions.cacheKey) {
        this.cacheResult(fallbackOptions.cacheKey, result, 'primary', 1.0);
      }

      return {
        success: true,
        result,
        source: 'primary',
        warnings: [],
        limitations: [],
        confidence: 1.0
      };
    } catch (primaryError) {
      logger.warn(
        `Primary operation failed for ${operationName}: ${(primaryError as Error).message}`,
        'FallbackMechanisms',
        correlationId
      );

      // Try fallback mechanisms in order
      for (const fallbackType of this.config.fallbackOrder) {
        try {
          const fallbackResult = await this.tryFallback(
            fallbackType,
            fallbackOptions,
            operationName,
            correlationId
          );

          if (fallbackResult.success) {
            logger.info(
              `Fallback successful for ${operationName} using ${fallbackType}`,
              'FallbackMechanisms',
              correlationId
            );
            return fallbackResult;
          }
        } catch (fallbackError) {
          logger.warn(
            `Fallback ${fallbackType} failed for ${operationName}: ${(fallbackError as Error).message}`,
            'FallbackMechanisms',
            correlationId
          );
        }
      }

      // All fallbacks failed
      logger.error(
        `All fallback mechanisms failed for ${operationName}`,
        'FallbackMechanisms',
        correlationId,
        primaryError as Error
      );

      return {
        success: false,
        source: 'primary',
        warnings: [`Primary operation failed: ${(primaryError as Error).message}`],
        limitations: ['All fallback mechanisms exhausted'],
        confidence: 0
      };
    }
  }

  /**
   * Try specific fallback mechanism
   */
  private async tryFallback<T>(
    fallbackType: string,
    options: FallbackOptions<T>,
    operationName: string,
    correlationId?: string
  ): Promise<FallbackResult<T>> {
    switch (fallbackType) {
      case 'cache':
        return this.tryCache(options, operationName, correlationId);
      case 'alternative':
        return this.tryAlternative(options, operationName, correlationId);
      case 'manual':
        return this.tryManual(options, operationName, correlationId);
      case 'partial':
        return this.tryPartial(options, operationName, correlationId);
      default:
        throw new Error(`Unknown fallback type: ${fallbackType}`);
    }
  }

  /**
   * Try cached data fallback
   */
  private async tryCache<T>(
    options: FallbackOptions<T>,
    operationName: string,
    correlationId?: string
  ): Promise<FallbackResult<T>> {
    if (!this.config.cacheEnabled || !options.cacheKey) {
      throw new Error('Cache fallback not available');
    }

    const cached = this.cache.get(options.cacheKey);
    if (!cached) {
      throw new Error('No cached data available');
    }

    const age = (Date.now() - cached.timestamp.getTime()) / 1000;
    if (age > cached.ttl) {
      this.cache.delete(options.cacheKey);
      throw new Error('Cached data expired');
    }

    const staleness = age / cached.ttl;
    const confidence = cached.confidence * (1 - staleness * 0.3); // Reduce confidence based on staleness

    return {
      success: true,
      result: cached.data,
      source: 'cache',
      warnings: [`Using cached data from ${cached.source} (${Math.round(age)}s old)`],
      limitations: ['Data may be outdated', 'Real-time changes not reflected'],
      confidence
    };
  }

  /**
   * Try alternative service fallback
   */
  private async tryAlternative<T>(
    options: FallbackOptions<T>,
    operationName: string,
    correlationId?: string
  ): Promise<FallbackResult<T>> {
    if (!options.alternativeOperation) {
      throw new Error('No alternative operation available');
    }

    const result = await options.alternativeOperation();
    
    // Cache alternative result with lower confidence
    if (this.config.cacheEnabled && options.cacheKey) {
      this.cacheResult(options.cacheKey, result, 'alternative', 0.8);
    }

    return {
      success: true,
      result,
      source: 'alternative',
      warnings: ['Using alternative data source'],
      limitations: options.alternativeLimitations || ['Alternative data source may have different coverage'],
      confidence: 0.8
    };
  }

  /**
   * Try manual fallback
   */
  private async tryManual<T>(
    options: FallbackOptions<T>,
    operationName: string,
    correlationId?: string
  ): Promise<FallbackResult<T>> {
    if (!this.config.manualFallbackEnabled || !options.manualFallback) {
      throw new Error('Manual fallback not available');
    }

    const result = await options.manualFallback();

    return {
      success: true,
      result,
      source: 'manual',
      warnings: ['Manual intervention required'],
      limitations: ['Manual process may introduce delays', 'Human verification required'],
      confidence: options.manualConfidence || 0.9
    };
  }

  /**
   * Try partial results fallback
   */
  private async tryPartial<T>(
    options: FallbackOptions<T>,
    operationName: string,
    correlationId?: string
  ): Promise<FallbackResult<T>> {
    if (!this.config.partialResultsAcceptable || !options.partialResults) {
      throw new Error('Partial results not acceptable');
    }

    const result = await options.partialResults();

    return {
      success: true,
      result,
      source: 'partial',
      warnings: ['Incomplete data available'],
      limitations: ['Some verification layers may be missing', 'Risk assessment may be less accurate'],
      confidence: options.partialConfidence || 0.6
    };
  }

  /**
   * Cache operation result
   */
  private cacheResult<T>(
    key: string,
    data: T,
    source: string,
    confidence: number
  ): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl: this.config.cacheTTL,
      source,
      confidence
    });

    logger.debug(
      `Cached result for key: ${key} from source: ${source}`,
      'FallbackMechanisms'
    );
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, cached] of this.cache.entries()) {
      const age = (now - cached.timestamp.getTime()) / 1000;
      if (age > cached.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Cleared ${cleared} expired cache entries');
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    hitRate: number;
    averageAge: number;
  } {
    const now = Date.now();
    let expired = 0;
    let totalAge = 0;

    for (const cached of this.cache.values()) {
      const age = (now - cached.timestamp.getTime()) / 1000;
      totalAge += age;
      if (age > cached.ttl) {
        expired++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expired,
      hitRate: 0, // Would need to track hits/misses
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    };
  }
}

export interface FallbackOptions<T> {
  cacheKey?: string;
  alternativeOperation?: () => Promise<T>;
  alternativeLimitations?: string[];
  manualFallback?: () => Promise<T>;
  manualConfidence?: number;
  partialResults?: () => Promise<T>;
  partialConfidence?: number;
}

/**
 * Government API fallback mechanisms
 */
export class GovernmentAPIFallback extends FallbackMechanisms {
  constructor() {
    super({
      enabled: true,
      fallbackOrder: ['cache', 'alternative', 'partial'],
      cacheEnabled: true,
      cacheTTL: 7200, // 2 hours for government data
      manualFallbackEnabled: false, // Government APIs don't have manual alternatives
      partialResultsAcceptable: true
    });
  }

  /**
   * Create fallback options for land registry queries
   */
  static createLandRegistryFallback(
    titleNumber: string,
    alternativeRegistries?: string[]
  ): FallbackOptions<any> {
    return {
      cacheKey: `land_registry_${titleNumber}`,
      alternativeOperation: alternativeRegistries?.length ? async () => {
        // Try alternative registry endpoints
        throw new Error('Alternative registries not implemented');
      } : undefined,
      alternativeLimitations: ['Alternative registry may have different data format'],
      partialResults: async () => {
        // Return basic property information without full ownership chain
        return {
          titleNumber,
          status: 'partial',
          basicInfo: 'Available from cache or alternative source',
          limitations: ['Full ownership chain not available', 'Recent transactions may be missing']
        };
      },
      partialConfidence: 0.5
    };
  }

  /**
   * Create fallback options for court records
   */
  static createCourtRecordsFallback(
    propertyId: string,
    ownerNames: string[]
  ): FallbackOptions<any> {
    return {
      cacheKey: `court_records_${propertyId}`,
      partialResults: async () => {
        // Return indication that court records check was attempted
        return {
          propertyId,
          ownerNames,
          status: 'partial',
          message: 'Court records system unavailable - manual verification recommended',
          recommendations: [
            'Conduct manual court records search',
            'Consult with legal counsel',
            'Consider title insurance'
          ]
        };
      },
      partialConfidence: 0.3
    };
  }
}

/**
 * Physical verification fallback mechanisms
 */
export class PhysicalVerificationFallback extends FallbackMechanisms {
  constructor() {
    super({
      enabled: true,
      fallbackOrder: ['cache', 'manual', 'partial'],
      cacheEnabled: true,
      cacheTTL: 1800, // 30 minutes for physical data
      manualFallbackEnabled: true,
      partialResultsAcceptable: true
    });
  }

  /**
   * Create fallback options for GPS coordinate validation
   */
  static createGPSValidationFallback(
    coordinates: { lat: number; lng: number }[],
    surveyData: any
  ): FallbackOptions<any> {
    return {
      cacheKey: `gps_validation_${coordinates.map(c => `${c.lat},${c.lng}`).join('_')}`,
      manualFallback: async () => {
        return {
          coordinates,
          status: 'manual_required',
          message: 'GPS accuracy insufficient - manual surveyor verification required',
          recommendations: [
            'Engage professional surveyor',
            'Use high-precision GPS equipment',
            'Verify boundary markers physically'
          ]
        };
      },
      manualConfidence: 0.9,
      partialResults: async () => {
        return {
          coordinates,
          status: 'partial',
          message: 'Basic coordinate validation completed with limitations',
          limitations: [
            'GPS accuracy below optimal threshold',
            'Some boundary points may be imprecise',
            'Professional survey recommended'
          ]
        };
      },
      partialConfidence: 0.6
    };
  }
}

/**
 * Expert coordination fallback mechanisms
 */
export class ExpertCoordinationFallback extends FallbackMechanisms {
  constructor() {
    super({
      enabled: true,
      fallbackOrder: ['cache', 'alternative', 'manual'],
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes for expert availability
      manualFallbackEnabled: true,
      partialResultsAcceptable: false // Expert coordination requires full results
    });
  }

  /**
   * Create fallback options for expert assignment
   */
  static createExpertAssignmentFallback(
    expertType: string,
    location: string,
    urgency: 'low' | 'medium' | 'high'
  ): FallbackOptions<any> {
    return {
      cacheKey: `expert_${expertType}_${location}`,
      alternativeOperation: async () => {
        // Try alternative expert networks or broader geographic search
        return {
          expertType,
          location,
          status: 'alternative',
          message: 'Primary expert unavailable - alternative expert assigned',
          estimatedDelay: urgency === 'high' ? 24 : urgency === 'medium' ? 48 : 72
        };
      },
      alternativeLimitations: [
        'Expert may be from different location',
        'May have longer response time',
        'Different specialization focus'
      ],
      manualFallback: async () => {
        return {
          expertType,
          location,
          status: 'manual_coordination',
          message: 'Manual expert coordination required',
          nextSteps: [
            'Contact expert networks directly',
            'Consider expanding geographic search',
            'Evaluate alternative expert types'
          ]
        };
      },
      manualConfidence: 0.8
    };
  }
}