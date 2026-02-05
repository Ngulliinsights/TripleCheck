/**
 * API Version Management System
 * 
 * Provides comprehensive API versioning with backward compatibility,
 * deprecation management, and smooth migration paths.
 */

import { Request, Response, NextFunction } from 'express';

import { logger } from '../monitoring/logger';

export type ApiVersion = 'v1' | 'v2' | 'v3';
export type VersionStatus = 'active' | 'deprecated' | 'sunset' | 'beta';

export interface VersionConfig {
  version: ApiVersion;
  status: VersionStatus;
  releaseDate: Date;
  deprecationDate?: Date;
  sunsetDate?: Date;
  supportedFeatures: string[];
  breakingChanges: string[];
  migrationGuide?: string;
  defaultVersion?: boolean;
}

export interface VersionedRequest extends Request {
  apiVersion: ApiVersion;
  versionConfig: VersionConfig;
  isLatestVersion: boolean;
  deprecationWarning?: string;
}

export interface ApiCompatibilityLayer {
  fromVersion: ApiVersion;
  toVersion: ApiVersion;
  transformRequest?: (req: any) => any;
  transformResponse?: (res: any) => any;
  fieldMappings?: Record<string, string>;
  removedFields?: string[];
  addedFields?: Record<string, any>;
}

export class ApiVersionManager {
  private versions: Map<ApiVersion, VersionConfig> = new Map();
  private compatibilityLayers: Map<string, ApiCompatibilityLayer> = new Map();
  private defaultVersion: ApiVersion = 'v1';
  private latestVersion: ApiVersion = 'v1';

  constructor() {
    this.initializeVersions();
    this.setupCompatibilityLayers();
  }

  /**
   * Initialize supported API versions with their configurations
   */
  private initializeVersions(): void {
    // Version 1.0 - Initial release
    this.versions.set('v1', {
      version: 'v1',
      status: 'active',
      releaseDate: new Date('2024-01-01'),
      supportedFeatures: [
        'basic-property-management',
        'user-authentication',
        'simple-verification',
        'basic-search'
      ],
      breakingChanges: [],
      defaultVersion: true
    });

    // Version 2.0 - Enhanced verification and fraud detection
    this.versions.set('v2', {
      version: 'v2',
      status: 'active',
      releaseDate: new Date('2024-06-01'),
      supportedFeatures: [
        'advanced-property-management',
        'enhanced-authentication',
        'multi-layer-verification',
        'fraud-detection',
        'trust-scoring',
        'document-authentication',
        'advanced-search',
        'real-time-notifications'
      ],
      breakingChanges: [
        'property-schema-changes',
        'authentication-token-format',
        'verification-response-structure'
      ],
      migrationGuide: '/docs/migration/v1-to-v2'
    });

    // Version 3.0 - AI-powered features and community intelligence (Beta)
    this.versions.set('v3', {
      version: 'v3',
      status: 'beta',
      releaseDate: new Date('2024-12-01'),
      supportedFeatures: [
        'ai-powered-verification',
        'community-intelligence',
        'predictive-analytics',
        'advanced-fraud-detection',
        'market-analysis',
        'automated-risk-assessment',
        'expert-coordination',
        'blockchain-integration'
      ],
      breakingChanges: [
        'verification-workflow-redesign',
        'trust-scoring-algorithm-update',
        'response-format-standardization'
      ],
      migrationGuide: '/docs/migration/v2-to-v3'
    });

    this.defaultVersion = 'v1';
    this.latestVersion = 'v3';

    logger.info('API versions initialized', 'API_VERSIONING', {
      versions: Array.from(this.versions.keys()),
      defaultVersion: this.defaultVersion,
      latestVersion: this.latestVersion
    });
  }

  /**
   * Setup compatibility layers for smooth version transitions
   */
  private setupCompatibilityLayers(): void {
    // V1 to V2 compatibility
    this.compatibilityLayers.set('v1->v2', {
      fromVersion: 'v1',
      toVersion: 'v2',
      transformRequest: (req) => {
        // Transform V1 property creation to V2 format
        if (req.body && req.path.includes('/properties')) {
          return {
            ...req.body,
            // Add new required fields with defaults
            verificationLevel: 'basic',
            trustScoreRequired: false,
            // Transform old field names
            propertyType: req.body.type || req.body.propertyType,
          };
        }
        return req.body;
      },
      transformResponse: (res) => {
        // Transform V2 response back to V1 format
        if (res.data && Array.isArray(res.data)) {
          return {
            ...res,
            data: res.data.map((item: any) => ({
              ...item,
              // Remove V2-specific fields
              verificationLayers: undefined,
              trustScore: undefined,
              fraudRiskScore: undefined,
              // Map new fields to old names
              type: item.propertyType,
            }))
          };
        }
        return res;
      },
      fieldMappings: {
        'type': 'propertyType',
        'verification_status': 'verificationStatus'
      },
      removedFields: ['verificationLayers', 'trustScore', 'fraudRiskScore'],
      addedFields: {
        verificationLevel: 'basic',
        trustScoreRequired: false
      }
    });

    // V2 to V3 compatibility
    this.compatibilityLayers.set('v2->v3', {
      fromVersion: 'v2',
      toVersion: 'v3',
      transformRequest: (req) => {
        if (req.body && req.path.includes('/verification')) {
          return {
            ...req.body,
            // Add V3 AI-powered features with defaults
            aiAnalysisEnabled: true,
            communityIntelligenceEnabled: false,
            expertCoordinationRequired: false,
          };
        }
        return req.body;
      },
      transformResponse: (res) => {
        if (res.data) {
          return {
            ...res,
            data: {
              ...res.data,
              // Remove V3-specific AI fields for V2 clients
              aiAnalysisResults: undefined,
              communityIntelligence: undefined,
              expertCoordination: undefined,
            }
          };
        }
        return res;
      },
      fieldMappings: {
        'verification_result': 'verificationResults',
        'risk_assessment': 'riskAssessment'
      },
      removedFields: ['aiAnalysisResults', 'communityIntelligence', 'expertCoordination'],
      addedFields: {
        aiAnalysisEnabled: true,
        communityIntelligenceEnabled: false
      }
    });

    logger.info('API compatibility layers initialized', 'API_VERSIONING', {
      layers: Array.from(this.compatibilityLayers.keys())
    });
  }

  /**
   * Extract API version from request
   */
  extractVersion(req: Request): ApiVersion {
    // Priority order: header > query param > URL path > default
    
    // 1. Check Accept header (preferred method)
    const acceptHeader = req.headers.accept;
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/application\/vnd\.triplecheck\.v(\d+)\+json/);
      if (versionMatch) {
        const version = `v${versionMatch[1]}` as ApiVersion;
        if (this.versions.has(version)) {
          return version;
        }
      }
    }

    // 2. Check custom version header
    const versionHeader = req.headers['api-version'] as string;
    if (versionHeader && this.versions.has(versionHeader as ApiVersion)) {
      return versionHeader as ApiVersion;
    }

    // 3. Check query parameter
    const versionQuery = req.query.version as string;
    if (versionQuery && this.versions.has(versionQuery as ApiVersion)) {
      return versionQuery as ApiVersion;
    }

    // 4. Check URL path
    const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
    if (pathMatch) {
      const version = `v${pathMatch[1]}` as ApiVersion;
      if (this.versions.has(version)) {
        return version;
      }
    }

    // 5. Return default version
    return this.defaultVersion;
  }

  /**
   * Get version configuration
   */
  getVersionConfig(version: ApiVersion): VersionConfig | undefined {
    return this.versions.get(version);
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version: ApiVersion): boolean {
    const config = this.versions.get(version);
    return config !== undefined && config.status !== 'sunset';
  }

  /**
   * Get deprecation warning for version
   */
  getDeprecationWarning(version: ApiVersion): string | undefined {
    const config = this.versions.get(version);
    if (!config || config.status !== 'deprecated') {
      return undefined;
    }

    const {sunsetDate} = config;
    if (sunsetDate) {
      const daysUntilSunset = Math.ceil(
        (sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return `API version ${version} is deprecated and will be sunset in ${daysUntilSunset} days. Please migrate to version ${this.latestVersion}.`;
    }

    return `API version ${version} is deprecated. Please migrate to version ${this.latestVersion}.`;
  }

  /**
   * Apply compatibility layer transformation
   */
  applyCompatibilityLayer(
    fromVersion: ApiVersion,
    toVersion: ApiVersion,
    data: any,
    type: 'request' | 'response'
  ): any {
    const layerKey = `${fromVersion}->${toVersion}`;
    const layer = this.compatibilityLayers.get(layerKey);

    if (!layer) {
      return data;
    }

    try {
      if (type === 'request' && layer.transformRequest) {
        return layer.transformRequest(data);
      }

      if (type === 'response' && layer.transformResponse) {
        return layer.transformResponse(data);
      }

      return data;
    } catch (error) {
      logger.error('Compatibility layer transformation failed', 'API_VERSIONING', {
        fromVersion,
        toVersion,
        type,
        error
      });
      return data;
    }
  }

  /**
   * Get all supported versions
   */
  getSupportedVersions(): VersionConfig[] {
    return Array.from(this.versions.values())
      .filter(config => config.status !== 'sunset')
      .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());
  }

  /**
   * Get version migration path
   */
  getMigrationPath(fromVersion: ApiVersion, toVersion: ApiVersion): ApiVersion[] {
    const versions = Array.from(this.versions.keys()).sort();
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return [];
    }

    return versions.slice(fromIndex, toIndex + 1);
  }

  /**
   * Check if feature is supported in version
   */
  isFeatureSupported(version: ApiVersion, feature: string): boolean {
    const config = this.versions.get(version);
    return config?.supportedFeatures.includes(feature) || false;
  }

  /**
   * Get version statistics
   */
  getVersionStats(): {
    totalVersions: number;
    activeVersions: number;
    deprecatedVersions: number;
    betaVersions: number;
    defaultVersion: ApiVersion;
    latestVersion: ApiVersion;
  } {
    const configs = Array.from(this.versions.values());
    
    return {
      totalVersions: configs.length,
      activeVersions: configs.filter(c => c.status === 'active').length,
      deprecatedVersions: configs.filter(c => c.status === 'deprecated').length,
      betaVersions: configs.filter(c => c.status === 'beta').length,
      defaultVersion: this.defaultVersion,
      latestVersion: this.latestVersion
    };
  }

  /**
   * Update version status (for administrative purposes)
   */
  updateVersionStatus(version: ApiVersion, status: VersionStatus, sunsetDate?: Date): boolean {
    const config = this.versions.get(version);
    if (!config) {
      return false;
    }

    config.status = status;
    if (sunsetDate) {
      config.sunsetDate = sunsetDate;
    }

    logger.info('Version status updated', 'API_VERSIONING', {
      version,
      status,
      sunsetDate
    });

    return true;
  }
}

// Export singleton instance
export const apiVersionManager = new ApiVersionManager();