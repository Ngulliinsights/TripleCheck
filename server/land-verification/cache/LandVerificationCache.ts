import { cacheService, CacheKeys } from '../../cache/CacheService';
import { logger } from '../../infrastructure/monitoring/logger';
import type {
  VerificationSession,
  LayerExecutionResult,
  RiskAssessment,
  GovernmentDataResult,
  CommunityIntelligence,
  PhysicalVerificationResult
} from '../../../src/types/land-verification';

export interface LandVerificationCacheConfig {
  sessionTTL: number;
  governmentDataTTL: number;
  riskAssessmentTTL: number;
  communityDataTTL: number;
  physicalVerificationTTL: number;
  monitoringDataTTL: number;
}

export class LandVerificationCache {
  private config: LandVerificationCacheConfig;

  constructor(config?: Partial<LandVerificationCacheConfig>) {
    this.config = {
      sessionTTL: 3600, // 1 hour
      governmentDataTTL: 7200, // 2 hours - government data changes less frequently
      riskAssessmentTTL: 1800, // 30 minutes
      communityDataTTL: 3600, // 1 hour
      physicalVerificationTTL: 7200, // 2 hours
      monitoringDataTTL: 1800, // 30 minutes
      ...config
    };
  }

  // Verification Session Caching
  async getVerificationSession(sessionId: string): Promise<VerificationSession | null> {
    try {
      const cacheKey = this.getSessionCacheKey(sessionId);
      return await cacheService.get<VerificationSession>(cacheKey);
    } catch (error) {
      logger.error('Failed to get verification session from cache', error);
      return null;
    }
  }

  async setVerificationSession(session: VerificationSession): Promise<void> {
    try {
      const cacheKey = this.getSessionCacheKey(session.id);
      await cacheService.set(cacheKey, session, {
        ttl: this.config.sessionTTL,
        tags: ['verification-session', `property-${session.propertyId}`, `user-${session.userId}`]
      });
    } catch (error) {
      logger.error('Failed to cache verification session', error);
    }
  }

  async invalidateVerificationSession(sessionId: string): Promise<void> {
    try {
      const cacheKey = this.getSessionCacheKey(sessionId);
      await cacheService.delete(cacheKey);
    } catch (error) {
      logger.error('Failed to invalidate verification session cache', error);
    }
  }

  // Government Data Caching
  async getGovernmentData(propertyId: string, dataType: string): Promise<GovernmentDataResult | null> {
    try {
      const cacheKey = this.getGovernmentDataCacheKey(propertyId, dataType);
      return await cacheService.get<GovernmentDataResult>(cacheKey);
    } catch (error) {
      logger.error('Failed to get government data from cache', error);
      return null;
    }
  }

  async setGovernmentData(propertyId: string, dataType: string, data: GovernmentDataResult): Promise<void> {
    try {
      const cacheKey = this.getGovernmentDataCacheKey(propertyId, dataType);
      await cacheService.set(cacheKey, data, {
        ttl: this.config.governmentDataTTL,
        tags: ['government-data', `property-${propertyId}`, `data-type-${dataType}`]
      });
    } catch (error) {
      logger.error('Failed to cache government data', error);
    }
  }

  // Risk Assessment Caching
  async getRiskAssessment(sessionId: string): Promise<RiskAssessment | null> {
    try {
      const cacheKey = this.getRiskAssessmentCacheKey(sessionId);
      return await cacheService.get<RiskAssessment>(cacheKey);
    } catch (error) {
      logger.error('Failed to get risk assessment from cache', error);
      return null;
    }
  }

  async setRiskAssessment(sessionId: string, assessment: RiskAssessment): Promise<void> {
    try {
      const cacheKey = this.getRiskAssessmentCacheKey(sessionId);
      await cacheService.set(cacheKey, assessment, {
        ttl: this.config.riskAssessmentTTL,
        tags: ['risk-assessment', `session-${sessionId}`]
      });
    } catch (error) {
      logger.error('Failed to cache risk assessment', error);
    }
  }

  // Community Intelligence Caching
  async getCommunityIntelligence(propertyId: string): Promise<CommunityIntelligence | null> {
    try {
      const cacheKey = this.getCommunityIntelligenceCacheKey(propertyId);
      return await cacheService.get<CommunityIntelligence>(cacheKey);
    } catch (error) {
      logger.error('Failed to get community intelligence from cache', error);
      return null;
    }
  }

  async setCommunityIntelligence(propertyId: string, intelligence: CommunityIntelligence): Promise<void> {
    try {
      const cacheKey = this.getCommunityIntelligenceCacheKey(propertyId);
      await cacheService.set(cacheKey, intelligence, {
        ttl: this.config.communityDataTTL,
        tags: ['community-intelligence', `property-${propertyId}`]
      });
    } catch (error) {
      logger.error('Failed to cache community intelligence', error);
    }
  }

  // Physical Verification Caching
  async getPhysicalVerification(sessionId: string): Promise<PhysicalVerificationResult | null> {
    try {
      const cacheKey = this.getPhysicalVerificationCacheKey(sessionId);
      return await cacheService.get<PhysicalVerificationResult>(cacheKey);
    } catch (error) {
      logger.error('Failed to get physical verification from cache', error);
      return null;
    }
  }

  async setPhysicalVerification(sessionId: string, result: PhysicalVerificationResult): Promise<void> {
    try {
      const cacheKey = this.getPhysicalVerificationCacheKey(sessionId);
      await cacheService.set(cacheKey, result, {
        ttl: this.config.physicalVerificationTTL,
        tags: ['physical-verification', `session-${sessionId}`, `property-${result.propertyId}`]
      });
    } catch (error) {
      logger.error('Failed to cache physical verification', error);
    }
  }

  // Layer Results Caching
  async getLayerResult(sessionId: string, layerType: string): Promise<LayerExecutionResult | null> {
    try {
      const cacheKey = this.getLayerResultCacheKey(sessionId, layerType);
      return await cacheService.get<LayerExecutionResult>(cacheKey);
    } catch (error) {
      logger.error('Failed to get layer result from cache', error);
      return null;
    }
  }

  async setLayerResult(sessionId: string, layerType: string, result: LayerExecutionResult): Promise<void> {
    try {
      const cacheKey = this.getLayerResultCacheKey(sessionId, layerType);
      await cacheService.set(cacheKey, result, {
        ttl: this.config.sessionTTL,
        tags: ['layer-result', `session-${sessionId}`, `layer-${layerType}`]
      });
    } catch (error) {
      logger.error('Failed to cache layer result', error);
    }
  }

  // Bulk Operations for Performance
  async getMultipleGovernmentData(requests: Array<{ propertyId: string; dataType: string }>): Promise<Array<GovernmentDataResult | null>> {
    try {
      const cacheKeys = requests.map(req => this.getGovernmentDataCacheKey(req.propertyId, req.dataType));
      return await cacheService.mget<GovernmentDataResult>(cacheKeys);
    } catch (error) {
      logger.error('Failed to get multiple government data from cache', error);
      return requests.map(() => null);
    }
  }

  async setMultipleGovernmentData(data: Array<{ propertyId: string; dataType: string; result: GovernmentDataResult }>): Promise<void> {
    try {
      const cacheEntries = data.map(item => ({
        key: this.getGovernmentDataCacheKey(item.propertyId, item.dataType),
        value: item.result,
        options: {
          ttl: this.config.governmentDataTTL,
          tags: ['government-data', `property-${item.propertyId}`, `data-type-${item.dataType}`]
        }
      }));

      await cacheService.mset(cacheEntries);
    } catch (error) {
      logger.error('Failed to cache multiple government data', error);
    }
  }

  // Cache Invalidation Methods
  async invalidatePropertyCache(propertyId: string): Promise<void> {
    try {
      await cacheService.invalidateByTags([`property-${propertyId}`]);
      logger.info(`Invalidated cache for property ${propertyId}`);
    } catch (error) {
      logger.error('Failed to invalidate property cache', error);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      await cacheService.invalidateByTags([`user-${userId}`]);
      logger.info(`Invalidated cache for user ${userId}`);
    } catch (error) {
      logger.error('Failed to invalidate user cache', error);
    }
  }

  async invalidateGovernmentDataCache(dataType?: string): Promise<void> {
    try {
      const tags = dataType ? [`data-type-${dataType}`] : ['government-data'];
      await cacheService.invalidateByTags(tags);
      logger.info(`Invalidated government data cache${dataType ? ` for type ${dataType}` : ''}`);
    } catch (error) {
      logger.error('Failed to invalidate government data cache', error);
    }
  }

  // Cache Key Generators
  private getSessionCacheKey(sessionId: string): string {
    return `land-verification:session:${sessionId}`;
  }

  private getGovernmentDataCacheKey(propertyId: string, dataType: string): string {
    return `land-verification:government:${propertyId}:${dataType}`;
  }

  private getRiskAssessmentCacheKey(sessionId: string): string {
    return `land-verification:risk:${sessionId}`;
  }

  private getCommunityIntelligenceCacheKey(propertyId: string): string {
    return `land-verification:community:${propertyId}`;
  }

  private getPhysicalVerificationCacheKey(sessionId: string): string {
    return `land-verification:physical:${sessionId}`;
  }

  private getLayerResultCacheKey(sessionId: string, layerType: string): string {
    return `land-verification:layer:${sessionId}:${layerType}`;
  }

  // Cache Statistics and Health
  async getCacheStats(): Promise<{
    hitRate: number;
    totalOperations: number;
    landVerificationCacheSize: number;
  }> {
    try {
      const stats = cacheService.getStats();
      
      // Get approximate cache size for land verification keys
      // This is a simplified implementation - in production you might want more detailed metrics
      const landVerificationCacheSize = 0; // Would need to implement key counting by prefix
      
      return {
        hitRate: stats.hitRate,
        totalOperations: stats.totalOperations,
        landVerificationCacheSize
      };
    } catch (error) {
      logger.error('Failed to get cache stats', error);
      return {
        hitRate: 0,
        totalOperations: 0,
        landVerificationCacheSize: 0
      };
    }
  }

  // Cache Warming for Frequently Accessed Data
  async warmUpCache(propertyIds: string[]): Promise<void> {
    try {
      logger.info(`Starting cache warm-up for ${propertyIds.length} properties`);
      
      // This would be implemented to pre-load frequently accessed data
      // For now, it's a placeholder for the warming logic
      
      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Cache warm-up failed', error);
    }
  }
}

// Export singleton instance
export const landVerificationCache = new LandVerificationCache();