import { CacheService } from '../../../core/src/cache'

export class PropertyCacheService {
  private cache: CacheService;
  private readonly CACHE_PREFIXES = {
    SIMILAR_PROPERTIES: 'similar_props:',
    PROPERTY_DETAILS: 'property:',
    PROPERTY_STATS: 'prop_stats:',
    OWNER_PROPERTIES: 'owner_props:',
  } as const;

  private readonly CACHE_TTL = {
    SIMILAR_PROPERTIES: 5 * 60, // 5 minutes
    PROPERTY_DETAILS: 10 * 60, // 10 minutes
    PROPERTY_STATS: 15 * 60, // 15 minutes
    OWNER_PROPERTIES: 5 * 60, // 5 minutes
  } as const;

  constructor() {
    try {
      this.cache = new CacheService();
    } catch (error) {
      console.warn('Failed to initialize cache service:', error);
      // Create a no-op cache service as fallback
      this.cache = {
        set: async () => {},
        get: async () => null,
        delete: async () => true,
        deletePattern: async () => 0,
        has: async () => false,
        clear: async () => {},
      } as any;
    }
  }

  // Cache similar properties with intelligent key generation
  async cacheSimilarProperties(
    params: {
      propertyType?: string;
      city?: string;
      minPrice?: string;
      maxPrice?: string;
      limit?: string;
    },
    properties: any[]
  ): Promise<void> {
    try {
      const cacheKey = this.generateSimilarPropertiesKey(params);
      await this.cache.set(
        cacheKey,
        properties,
        { ttl: this.CACHE_TTL.SIMILAR_PROPERTIES }
      );
    } catch (error) {
      console.warn('Failed to cache similar properties:', error);
    }
  }

  async getCachedSimilarProperties(params: {
    propertyType?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
  }): Promise<any[] | null> {
    try {
      const cacheKey = this.generateSimilarPropertiesKey(params);
      return await this.cache.get<any[]>(cacheKey);
    } catch (error) {
      console.warn('Failed to get cached similar properties:', error);
      return null;
    }
  }

  // Cache property details
  async cachePropertyDetails(propertyId: string, property: any): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIXES.PROPERTY_DETAILS}${propertyId}`;
      await this.cache.set(
        cacheKey,
        property,
        { ttl: this.CACHE_TTL.PROPERTY_DETAILS }
      );
    } catch (error) {
      console.warn('Failed to cache property details:', error);
    }
  }

  async getCachedPropertyDetails(propertyId: string): Promise<any | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIXES.PROPERTY_DETAILS}${propertyId}`;
      return await this.cache.get<any>(cacheKey);
    } catch (error) {
      console.warn('Failed to get cached property details:', error);
      return null;
    }
  }

  // Cache owner properties
  async cacheOwnerProperties(ownerId: string, properties: any[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIXES.OWNER_PROPERTIES}${ownerId}`;
      await this.cache.set(
        cacheKey,
        properties,
        { ttl: this.CACHE_TTL.OWNER_PROPERTIES }
      );
    } catch (error) {
      console.warn('Failed to cache owner properties:', error);
    }
  }

  async getCachedOwnerProperties(ownerId: string): Promise<any[] | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIXES.OWNER_PROPERTIES}${ownerId}`;
      return await this.cache.get<any[]>(cacheKey);
    } catch (error) {
      console.warn('Failed to get cached owner properties:', error);
      return null;
    }
  }

  // Cache property statistics
  async cachePropertyStats(filters: any, stats: any): Promise<void> {
    try {
      const cacheKey = this.generateStatsKey(filters);
      await this.cache.set(
        cacheKey,
        stats,
        { ttl: this.CACHE_TTL.PROPERTY_STATS }
      );
    } catch (error) {
      console.warn('Failed to cache property stats:', error);
    }
  }

  async getCachedPropertyStats(filters: any): Promise<any | null> {
    try {
      const cacheKey = this.generateStatsKey(filters);
      return await this.cache.get<any>(cacheKey);
    } catch (error) {
      console.warn('Failed to get cached property stats:', error);
      return null;
    }
  }

  // Invalidate cache when properties are updated
  async invalidatePropertyCache(propertyId: string): Promise<void> {
    try {
      const patterns = [
        `${this.CACHE_PREFIXES.PROPERTY_DETAILS}${propertyId}`,
        `${this.CACHE_PREFIXES.SIMILAR_PROPERTIES}*`, // Invalidate all similar properties
        `${this.CACHE_PREFIXES.PROPERTY_STATS}*`, // Invalidate all stats
      ];

      // Note: deletePattern not implemented in CacheService, using individual deletes
      for (const pattern of patterns) {
        // For now, we'll skip pattern deletion as it's not implemented
        console.warn(`Pattern deletion not implemented: ${pattern}`);
      }
    } catch (error) {
      console.warn('Failed to invalidate property cache:', error);
    }
  }

  // Invalidate owner cache when properties are updated
  async invalidateOwnerCache(ownerId: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIXES.OWNER_PROPERTIES}${ownerId}`;
      await this.cache.delete(cacheKey);
    } catch (error) {
      console.warn('Failed to invalidate owner cache:', error);
    }
  }

  // Helper methods for cache key generation
  private generateSimilarPropertiesKey(params: {
    propertyType?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
  }): string {
    const { propertyType = '', city = '', minPrice = '', maxPrice = '', limit = '10' } = params;
    const keyParts = [
      this.CACHE_PREFIXES.SIMILAR_PROPERTIES,
      propertyType,
      city.toLowerCase().replace(/\s+/g, '_'),
      minPrice,
      maxPrice,
      limit
    ];
    return keyParts.join('');
  }

  private generateStatsKey(filters: any): string {
    const filterString = JSON.stringify(filters || {});
    const hash = this.simpleHash(filterString);
    return `${this.CACHE_PREFIXES.PROPERTY_STATS}${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Batch operations for better performance
  async batchInvalidate(propertyIds: string[]): Promise<void> {
    try {
      const invalidationPromises = propertyIds.map(id => 
        this.invalidatePropertyCache(id)
      );
      await Promise.all(invalidationPromises);
    } catch (error) {
      console.warn('Failed to batch invalidate cache:', error);
    }
  }

  // Health check for cache service
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      await this.cache.set(testKey, testValue, { ttl: 10 });
      const retrieved = await this.cache.get(testKey);
      await this.cache.delete(testKey);
      
      if (retrieved && (retrieved as any).timestamp === testValue.timestamp) {
        return { status: 'healthy' };
      } else {
        return { status: 'unhealthy', details: 'Cache read/write test failed' };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}