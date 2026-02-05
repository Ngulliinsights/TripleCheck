import Redis from '..\app';

import { Logger } from '../infrastructure/monitoring/logger';

export interface CacheConfig {
  host: string;
  port: number;
  password: string | undefined;
  db?: number;
  keyPrefix?: string;
  ttl: number; // Default TTL in seconds
  maxRetries: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  tags?: string[]; // For cache invalidation by tags
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  totalOperations: number;
}

export class CacheService {
  private redis: Redis;
  private logger: Logger;
  private config: CacheConfig;
  private stats: CacheStats;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    this.config = config;
    this.logger = new Logger();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      totalOperations: 0
    };

    this.redis = new Redis({
      host: config.host,
      port: config.port,
      ...(config.password && { password: config.password }),
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'triplecheck:',
      maxRetriesPerRequest: config.maxRetries,
      enableOfflineQueue: config.enableOfflineQueue,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info('Redis connection established');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      this.logger.info('Redis is ready to receive commands');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error.message);
      this.stats.errors++;
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      this.logger.info('Redis reconnecting...');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
      this.logger.info('Cache service connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.logger.info('Cache service disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Cache not connected, skipping get operation');
        this.stats.misses++;
        return null;
      }

      const value = await this.redis.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.updateStats();
        return null;
      }

      this.stats.hits++;
      this.updateStats();

      try {
        return JSON.parse(value) as T;
      } catch (parseError) {
        this.logger.warn(`Failed to parse cached value for key: ${key}`, parseError);
        await this.delete(key); // Remove corrupted data
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      this.stats.misses++;
      this.updateStats();
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Cache not connected, skipping set operation');
        return false;
      }

      const ttl = options?.ttl || this.config.ttl;
      const serializedValue = JSON.stringify(value);

      let result: string | null;
      if (ttl > 0) {
        result = await this.redis.setex(key, ttl, serializedValue);
      } else {
        result = await this.redis.set(key, serializedValue);
      }

      // Store tags for cache invalidation
      if (options?.tags && options.tags.length > 0) {
        await this.addToTags(key, options.tags);
      }

      this.stats.sets++;
      this.updateStats();

      return result === 'OK';
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      this.updateStats();
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Cache not connected, skipping delete operation');
        return false;
      }

      const result = await this.redis.del(key);
      this.stats.deletes++;
      this.updateStats();

      return result > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      this.updateStats();
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key: ${key}`, error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache expire error for key: ${key}`, error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.isConnected || keys.length === 0) {
        return keys.map(() => null);
      }

      const values = await this.redis.mget(...keys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        
        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          this.logger.warn(`Failed to parse cached value for key: ${keys[index]}`, parseError);
          this.delete(keys[index]); // Remove corrupted data
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Cache mget error', error instanceof Error ? error.message : String(error));
      this.stats.errors += keys.length;
      this.stats.misses += keys.length;
      return keys.map(() => null);
    } finally {
      this.updateStats();
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset<T>(keyValuePairs: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<boolean> {
    try {
      if (!this.isConnected || keyValuePairs.length === 0) {
        return false;
      }

      // Use pipeline for better performance
      const pipeline = this.redis.pipeline();

      for (const { key, value, options } of keyValuePairs) {
        const ttl = options?.ttl || this.config.ttl;
        const serializedValue = JSON.stringify(value);

        if (ttl > 0) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }

        // Handle tags
        if (options?.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            pipeline.sadd(`tag:${tag}`, key);
          }
        }
      }

      const results = await pipeline.exec();
      const success = results?.every(([error, result]) => error === null && result === 'OK') || false;

      if (success) {
        this.stats.sets += keyValuePairs.length;
      } else {
        this.stats.errors += keyValuePairs.length;
      }

      this.updateStats();
      return success;
    } catch (error) {
      this.logger.error('Cache mset error', error instanceof Error ? error.message : String(error));
      this.stats.errors += keyValuePairs.length;
      this.updateStats();
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      if (!this.isConnected || tags.length === 0) {
        return 0;
      }

      let totalDeleted = 0;
      const pipeline = this.redis.pipeline();

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        
        if (keys.length > 0) {
          // Delete all keys associated with this tag
          pipeline.del(...keys);
          totalDeleted += keys.length;
        }

        // Delete the tag set itself
        pipeline.del(tagKey);
      }

      await pipeline.exec();
      
      this.stats.deletes += totalDeleted;
      this.updateStats();

      this.logger.info(`Invalidated ${totalDeleted} cache entries for tags: ${tags.join(', ')}`);
      return totalDeleted;
    } catch (error) {
      this.logger.error('Cache invalidation by tags error', error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.redis.flushdb();
      this.logger.info('Cache cleared successfully');
      return true;
    } catch (error) {
      this.logger.error('Cache clear error', error instanceof Error ? error.message : String(error));
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      totalOperations: 0
    };
  }

  /**
   * Get cache health status
   */
  async getHealth(): Promise<{
    connected: boolean;
    latency: number;
    memory: any;
    stats: CacheStats;
  }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      const memory = await this.redis.memory('usage');

      return {
        connected: this.isConnected,
        latency,
        memory,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        connected: false,
        latency: -1,
        memory: null,
        stats: this.getStats()
      };
    }
  }

  /**
   * Warm up cache with critical data
   */
  async warmUp(warmUpData: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    this.logger.info(`Starting cache warm-up with ${warmUpData.length} entries`);
    
    try {
      await this.mset(warmUpData);
      this.logger.info('Cache warm-up completed successfully');
    } catch (error) {
      this.logger.error('Cache warm-up failed', error instanceof Error ? error.message : String(error));
    }
  }

  private async addToTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
    }
    
    await pipeline.exec();
  }

  private updateStats(): void {
    this.stats.totalOperations = this.stats.hits + this.stats.misses;
    this.stats.hitRate = this.stats.totalOperations > 0 
      ? (this.stats.hits / this.stats.totalOperations) * 100 
      : 0;
  }
}

// Cache key generators for different data types
export class CacheKeys {
  static property(id: number): string {
    return `property:${id}`;
  }

  static properties(filters: string): string {
    return `properties:${filters}`;
  }

  static user(id: number): string {
    return `user:${id}`;
  }

  static userByUsername(username: string): string {
    return `user:username:${username}`;
  }

  static reviews(propertyId: number): string {
    return `reviews:property:${propertyId}`;
  }

  static searchResults(query: string): string {
    return `search:${Buffer.from(query).toString('base64')}`;
  }

  static trustScore(userId: string): string {
    return `trust:score:${userId}`;
  }

  static fraudDetection(propertyId: number): string {
    return `fraud:detection:${propertyId}`;
  }

  static apiResponse(endpoint: string, params: string): string {
    return `api:${endpoint}:${Buffer.from(params).toString('base64')}`;
  }
}

// Default cache configuration
export const defaultCacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'triplecheck:',
  ttl: 3600, // 1 hour default TTL
  maxRetries: 3,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
};

// Create singleton cache service instance
export const cacheService = new CacheService(defaultCacheConfig);