/**
 * Graceful degradation system for land verification
 * Handles partial data scenarios and service degradation
 */

import { logger } from '../../infrastructure/monitoring/logger';
import { LandVerificationErrorCode } from '../errors/LandVerificationErrors';

export interface DegradationLevel {
  level: 'full' | 'partial' | 'minimal' | 'emergency';
  description: string;
  availableFeatures: string[];
  disabledFeatures: string[];
  confidence: number;
  limitations: string[];
  recommendations: string[];
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  lastCheck: Date;
  responseTime?: number;
  errorRate: number;
  uptime: number;
}

export interface DegradationConfig {
  enabledServices: string[];
  criticalServices: string[];
  degradationThresholds: {
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
  autoRecovery: boolean;
  notificationEnabled: boolean;
}

export class GracefulDegradation {
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private currentDegradationLevel: DegradationLevel;
  private config: DegradationConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config?: Partial<DegradationConfig>) {
    this.config = {
      enabledServices: [
        'land-registry',
        'court-records',
        'physical-verification',
        'community-intelligence',
        'expert-coordination',
        'risk-assessment',
        'monitoring'
      ],
      criticalServices: ['land-registry', 'risk-assessment'],
      degradationThresholds: {
        errorRate: 0.3, // 30% error rate triggers degradation
        responseTime: 10000, // 10 seconds
        uptime: 0.95 // 95% uptime required
      },
      autoRecovery: true,
      notificationEnabled: true,
      ...config
    };

    this.currentDegradationLevel = this.createFullServiceLevel();
    this.initializeServiceHealth();
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    logger.info('Started graceful degradation health monitoring', 'GracefulDegradation');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    logger.info('Stopped graceful degradation health monitoring', 'GracefulDegradation');
  }

  /**
   * Update service health status
   */
  updateServiceHealth(
    serviceName: string,
    status: ServiceHealth['status'],
    responseTime?: number,
    error?: Error
  ): void {
    const existing = this.serviceHealth.get(serviceName);
    const now = new Date();

    if (existing) {
      existing.status = status;
      existing.lastCheck = now;
      existing.responseTime = responseTime;
      
      // Update error rate (simple moving average)
      if (error) {
        existing.errorRate = Math.min(1, existing.errorRate * 0.9 + 0.1);
      } else {
        existing.errorRate = existing.errorRate * 0.95;
      }

      // Update uptime
      const timeSinceLastCheck = now.getTime() - existing.lastCheck.getTime();
      const uptimeWeight = Math.min(1, timeSinceLastCheck / (24 * 60 * 60 * 1000)); // 24 hour window
      existing.uptime = existing.uptime * (1 - uptimeWeight) + 
                      (status === 'healthy' ? 1 : 0) * uptimeWeight;
    } else {
      this.serviceHealth.set(serviceName, {
        service: serviceName,
        status,
        lastCheck: now,
        responseTime,
        errorRate: error ? 0.1 : 0,
        uptime: status === 'healthy' ? 1 : 0
      });
    }

    // Check if degradation level needs to be updated
    this.evaluateDegradationLevel();
  }

  /**
   * Get current degradation level
   */
  getCurrentDegradationLevel(): DegradationLevel {
    return this.currentDegradationLevel;
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName?: string): ServiceHealth | ServiceHealth[] {
    if (serviceName) {
      return this.serviceHealth.get(serviceName) || this.createUnknownServiceHealth(serviceName);
    }

    return Array.from(this.serviceHealth.values());
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    const health = this.serviceHealth.get(serviceName);
    return health?.status === 'healthy' || health?.status === 'degraded';
  }

  /**
   * Get available verification layers based on current degradation
   */
  getAvailableVerificationLayers(): string[] {
    const availableLayers: string[] = [];

    if (this.isServiceAvailable('land-registry')) {
      availableLayers.push('registry');
    }

    if (this.isServiceAvailable('physical-verification')) {
      availableLayers.push('physical');
    }

    if (this.isServiceAvailable('community-intelligence')) {
      availableLayers.push('community');
    }

    if (this.isServiceAvailable('court-records')) {
      availableLayers.push('legal');
    }

    if (this.isServiceAvailable('expert-coordination')) {
      availableLayers.push('expert');
    }

    return availableLayers;
  }

  /**
   * Adapt verification process based on current degradation
   */
  adaptVerificationProcess(requestedLayers: string[]): {
    availableLayers: string[];
    unavailableLayers: string[];
    adaptations: string[];
    confidence: number;
  } {
    const availableLayers = this.getAvailableVerificationLayers();
    const unavailableLayers = requestedLayers.filter(layer => !availableLayers.includes(layer));
    const adaptations: string[] = [];
    let {confidence} = this.currentDegradationLevel;

    // Suggest adaptations for unavailable layers
    for (const unavailableLayer of unavailableLayers) {
      switch (unavailableLayer) {
        case 'registry':
          adaptations.push('Use cached registry data if available');
          adaptations.push('Recommend manual title deed verification');
          confidence *= 0.7;
          break;
        case 'physical':
          adaptations.push('Skip GPS validation, rely on survey documents');
          adaptations.push('Recommend professional surveyor engagement');
          confidence *= 0.8;
          break;
        case 'community':
          adaptations.push('Skip community intelligence gathering');
          adaptations.push('Increase reliance on official records');
          confidence *= 0.9;
          break;
        case 'legal':
          adaptations.push('Skip automated court records search');
          adaptations.push('Recommend manual legal due diligence');
          confidence *= 0.8;
          break;
        case 'expert':
          adaptations.push('Proceed without expert coordination');
          adaptations.push('Recommend post-verification expert review');
          confidence *= 0.7;
          break;
      }
    }

    return {
      availableLayers: availableLayers.filter(layer => requestedLayers.includes(layer)),
      unavailableLayers,
      adaptations,
      confidence: Math.max(0.1, confidence)
    };
  }

  /**
   * Generate degraded verification result
   */
  generateDegradedResult(
    sessionId: string,
    availableResults: any[],
    unavailableLayers: string[]
  ): any {
    const warnings: string[] = [];
    const limitations: string[] = [];

    // Add warnings for each unavailable layer
    for (const layer of unavailableLayers) {
      warnings.push(`${layer} verification unavailable due to service degradation`);
    }

    // Add general limitations based on degradation level
    limitations.push(...this.currentDegradationLevel.limitations);

    // Calculate adjusted confidence
    const baseConfidence = availableResults.length > 0 
      ? availableResults.reduce((sum, result) => sum + (result.confidence || 0.5), 0) / availableResults.length
      : 0.3;
    
    const adjustedConfidence = baseConfidence * this.currentDegradationLevel.confidence;

    return {
      sessionId,
      status: 'degraded',
      degradationLevel: this.currentDegradationLevel.level,
      availableResults,
      unavailableLayers,
      warnings,
      limitations,
      confidence: adjustedConfidence,
      recommendations: [
        ...this.currentDegradationLevel.recommendations,
        'Consider re-running verification when services are restored',
        'Consult with experts for critical decisions'
      ],
      timestamp: new Date()
    };
  }

  /**
   * Perform health check on all services
   */
  private async performHealthCheck(): Promise<void> {
    logger.debug('Performing service health check', 'GracefulDegradation');

    for (const serviceName of this.config.enabledServices) {
      try {
        const startTime = Date.now();
        await this.checkServiceHealth(serviceName);
        const responseTime = Date.now() - startTime;
        
        this.updateServiceHealth(serviceName, 'healthy', responseTime);
      } catch (error) {
        logger.warn(
          `Service health check failed: ${serviceName}`,
          'GracefulDegradation',
          undefined,
          error as Error
        );
        
        this.updateServiceHealth(serviceName, 'unavailable', undefined, error as Error);
      }
    }
  }

  /**
   * Check individual service health
   */
  private async checkServiceHealth(serviceName: string): Promise<void> {
    // This would be implemented to actually check each service
    // For now, we'll simulate health checks
    switch (serviceName) {
      case 'land-registry':
        // Simulate registry API health check
        if (Math.random() > 0.95) {
          throw new Error('Land registry API timeout');
        }
        break;
      case 'court-records':
        // Simulate court records health check
        if (Math.random() > 0.98) {
          throw new Error('Court records system unavailable');
        }
        break;
      // Add other service health checks as needed
    }
  }

  /**
   * Evaluate and update degradation level
   */
  private evaluateDegradationLevel(): void {
    const healthyServices = Array.from(this.serviceHealth.values())
      .filter(health => health.status === 'healthy');
    
    const criticalServicesHealthy = this.config.criticalServices
      .every(service => this.isServiceAvailable(service));

    const totalServices = this.config.enabledServices.length;
    const healthyRatio = healthyServices.length / totalServices;

    let newLevel: DegradationLevel;

    if (healthyRatio >= 0.9 && criticalServicesHealthy) {
      newLevel = this.createFullServiceLevel();
    } else if (healthyRatio >= 0.7 && criticalServicesHealthy) {
      newLevel = this.createPartialServiceLevel();
    } else if (healthyRatio >= 0.4 || criticalServicesHealthy) {
      newLevel = this.createMinimalServiceLevel();
    } else {
      newLevel = this.createEmergencyServiceLevel();
    }

    if (newLevel.level !== this.currentDegradationLevel.level) {
      const previousLevel = this.currentDegradationLevel.level;
      this.currentDegradationLevel = newLevel;

      logger.warn(
        `Service degradation level changed: ${previousLevel} -> ${newLevel.level}`,
        'GracefulDegradation'
      );

      if (this.config.notificationEnabled) {
        // Emit degradation event for external notification systems
        process.emit('service-degradation', {
          previousLevel,
          currentLevel: newLevel.level,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Initialize service health tracking
   */
  private initializeServiceHealth(): void {
    for (const serviceName of this.config.enabledServices) {
      this.serviceHealth.set(serviceName, this.createUnknownServiceHealth(serviceName));
    }
  }

  /**
   * Create unknown service health status
   */
  private createUnknownServiceHealth(serviceName: string): ServiceHealth {
    return {
      service: serviceName,
      status: 'degraded',
      lastCheck: new Date(),
      errorRate: 0,
      uptime: 1
    };
  }

  /**
   * Create full service degradation level
   */
  private createFullServiceLevel(): DegradationLevel {
    return {
      level: 'full',
      description: 'All services operational',
      availableFeatures: [
        'Complete land registry verification',
        'Physical boundary validation',
        'Community intelligence gathering',
        'Court records search',
        'Expert coordination',
        'Real-time risk assessment',
        'Continuous monitoring'
      ],
      disabledFeatures: [],
      confidence: 1.0,
      limitations: [],
      recommendations: []
    };
  }

  /**
   * Create partial service degradation level
   */
  private createPartialServiceLevel(): DegradationLevel {
    return {
      level: 'partial',
      description: 'Some services degraded, core functionality available',
      availableFeatures: [
        'Basic land registry verification',
        'Physical boundary validation',
        'Risk assessment with cached data',
        'Expert coordination (delayed)'
      ],
      disabledFeatures: [
        'Real-time government data updates',
        'Advanced community intelligence',
        'Continuous monitoring'
      ],
      confidence: 0.8,
      limitations: [
        'Some data may be cached or outdated',
        'Expert response times may be longer',
        'Monitoring alerts may be delayed'
      ],
      recommendations: [
        'Verify critical information manually',
        'Consider postponing non-urgent verifications'
      ]
    };
  }

  /**
   * Create minimal service degradation level
   */
  private createMinimalServiceLevel(): DegradationLevel {
    return {
      level: 'minimal',
      description: 'Critical services only, significant limitations',
      availableFeatures: [
        'Basic property information',
        'Cached registry data',
        'Manual verification guidance'
      ],
      disabledFeatures: [
        'Real-time government API access',
        'Physical verification coordination',
        'Community intelligence',
        'Automated expert coordination',
        'Live monitoring'
      ],
      confidence: 0.5,
      limitations: [
        'Most data from cache or manual sources',
        'No real-time verification possible',
        'Expert coordination requires manual intervention',
        'Risk assessment based on limited data'
      ],
      recommendations: [
        'Postpone non-critical verifications',
        'Engage experts manually',
        'Consider alternative verification methods',
        'Implement additional due diligence'
      ]
    };
  }

  /**
   * Create emergency service degradation level
   */
  private createEmergencyServiceLevel(): DegradationLevel {
    return {
      level: 'emergency',
      description: 'Emergency mode - manual processes only',
      availableFeatures: [
        'Basic property lookup',
        'Manual verification templates',
        'Emergency contact information'
      ],
      disabledFeatures: [
        'All automated verification',
        'Government API integration',
        'Risk assessment calculations',
        'Expert coordination',
        'Monitoring services'
      ],
      confidence: 0.2,
      limitations: [
        'No automated verification available',
        'All processes require manual intervention',
        'Risk assessment not available',
        'No real-time data access'
      ],
      recommendations: [
        'Suspend all automated verifications',
        'Implement manual verification procedures',
        'Contact system administrators',
        'Consider alternative verification providers',
        'Notify users of service limitations'
      ]
    };
  }
}