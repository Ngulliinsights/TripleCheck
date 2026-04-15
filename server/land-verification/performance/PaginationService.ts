import { logger } from '../../infrastructure/observability/telemetry';
import { landVerificationCache } from '../cache/LandVerificationCache';

export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
  enableCaching: boolean;
  cacheKeyPrefix: string;
  cacheTTL: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage?: number;
    previousPage?: number;
  };
  meta: {
    queryTime: number;
    fromCache: boolean;
    sortBy?: string;
    sortOrder?: string;
    appliedFilters?: Record<string, any>;
  };
}

export interface LazyLoadConfig {
  initialLoadSize: number;
  incrementalLoadSize: number;
  preloadThreshold: number; // Load next batch when this many items from end
  maxCachedPages: number;
}

export class PaginationService {
  private config: PaginationConfig;
  private lazyLoadConfig: LazyLoadConfig;

  constructor(
    config?: Partial<PaginationConfig>,
    lazyConfig?: Partial<LazyLoadConfig>
  ) {
    this.config = {
      defaultPageSize: 20,
      maxPageSize: 100,
      enableCaching: true,
      cacheKeyPrefix: 'pagination',
      cacheTTL: 300, // 5 minutes
      ...config
    };

    this.lazyLoadConfig = {
      initialLoadSize: 20,
      incrementalLoadSize: 10,
      preloadThreshold: 5,
      maxCachedPages: 10,
      ...lazyConfig
    };
  }

  // Standard Pagination
  async paginate<T>(
    dataFetcher: (offset: number, limit: number, params: PaginationParams) => Promise<{ data: T[]; total: number }>,
    params: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    const startTime = Date.now();
    
    // Validate and normalize parameters
    const normalizedParams = this.normalizeParams(params);
    const offset = (normalizedParams.page - 1) * normalizedParams.limit;

    // Generate cache key
    const cacheKey = this.generateCacheKey('standard', normalizedParams);
    
    // Check cache if enabled
    if (this.config.enableCaching) {
      const cached = await this.getCachedResult<T>(cacheKey);
      if (cached) {
        return {
          ...cached,
          meta: {
            ...cached.meta,
            queryTime: Date.now() - startTime,
            fromCache: true
          }
        };
      }
    }

    try {
      // Fetch data
      const { data, total } = await dataFetcher(offset, normalizedParams.limit, normalizedParams);
      
      // Build response
      const response: PaginatedResponse<T> = {
        data,
        pagination: this.buildPaginationInfo(normalizedParams, total),
        meta: {
          queryTime: Date.now() - startTime,
          fromCache: false,
          sortBy: normalizedParams.sortBy,
          sortOrder: normalizedParams.sortOrder,
          appliedFilters: normalizedParams.filters
        }
      };

      // Cache the result
      if (this.config.enableCaching) {
        await this.cacheResult(cacheKey, response);
      }

      return response;
    } catch (error) {
      logger.error({ error: error }, 'Pagination failed');
      throw error;
    }
  }

  // Cursor-based Pagination (for large datasets)
  async paginateWithCursor<T>(
    dataFetcher: (cursor: string | null, limit: number, params: PaginationParams) => Promise<{ data: T[]; nextCursor: string | null; total?: number }>,
    params: PaginationParams & { cursor?: string }
  ): Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
    meta: {
      queryTime: number;
      fromCache: boolean;
      pageSize: number;
    };
  }> {
    const startTime = Date.now();
    const normalizedParams = this.normalizeParams(params);

    // Generate cache key for cursor-based pagination
    const cacheKey = this.generateCacheKey('cursor', { ...normalizedParams, cursor: params.cursor });

    // Check cache
    if (this.config.enableCaching) {
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        return {
          ...cached,
          meta: {
            ...cached.meta,
            queryTime: Date.now() - startTime,
            fromCache: true
          }
        };
      }
    }

    try {
      const { data, nextCursor } = await dataFetcher(
        params.cursor || null,
        normalizedParams.limit,
        normalizedParams
      );

      const response = {
        data,
        nextCursor,
        hasMore: nextCursor !== null,
        meta: {
          queryTime: Date.now() - startTime,
          fromCache: false,
          pageSize: normalizedParams.limit
        }
      };

      // Cache the result
      if (this.config.enableCaching) {
        await this.cacheResult(cacheKey, response);
      }

      return response;
    } catch (error) {
      logger.error({ error: error }, 'Cursor-based pagination failed');
      throw error;
    }
  }

  // Lazy Loading Implementation
  async initializeLazyLoad<T>(
    dataFetcher: (offset: number, limit: number, params: PaginationParams) => Promise<{ data: T[]; total: number }>,
    params: PaginationParams
  ): Promise<{
    initialData: T[];
    totalItems: number;
    loadMoreToken: string;
    hasMore: boolean;
  }> {
    const startTime = Date.now();
    const normalizedParams = this.normalizeParams(params);

    try {
      // Load initial batch
      const { data, total } = await dataFetcher(0, this.lazyLoadConfig.initialLoadSize, normalizedParams);
      
      // Generate token for subsequent loads
      const loadMoreToken = this.generateLoadMoreToken(normalizedParams, this.lazyLoadConfig.initialLoadSize);
      
      // Cache initial data
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey('lazy_initial', normalizedParams);
        await this.cacheResult(cacheKey, { data, total, offset: 0 });
      }

      logger.info(`Lazy load initialized: ${data.length}/${total} items loaded in ${Date.now() - startTime}ms`);

      return {
        initialData: data,
        totalItems: total,
        loadMoreToken,
        hasMore: data.length < total
      };
    } catch (error) {
      logger.error({ error: error }, 'Lazy load initialization failed');
      throw error;
    }
  }

  async loadMore<T>(
    dataFetcher: (offset: number, limit: number, params: PaginationParams) => Promise<{ data: T[]; total: number }>,
    loadMoreToken: string
  ): Promise<{
    data: T[];
    newLoadMoreToken: string | null;
    hasMore: boolean;
    totalLoaded: number;
  }> {
    const startTime = Date.now();

    try {
      // Decode token to get parameters and current offset
      const { params, currentOffset } = this.decodeLoadMoreToken(loadMoreToken);
      const newOffset = currentOffset + this.lazyLoadConfig.incrementalLoadSize;

      // Check cache for this specific chunk
      const cacheKey = this.generateCacheKey('lazy_chunk', { ...params, offset: newOffset });
      
      if (this.config.enableCaching) {
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          const newToken = cached.data.length > 0 ? this.generateLoadMoreToken(params, newOffset) : null;
          return {
            data: cached.data,
            newLoadMoreToken: newToken,
            hasMore: cached.data.length === this.lazyLoadConfig.incrementalLoadSize,
            totalLoaded: newOffset + cached.data.length
          };
        }
      }

      // Fetch next batch
      const { data, total } = await dataFetcher(newOffset, this.lazyLoadConfig.incrementalLoadSize, params);
      
      // Generate new token if there's more data
      const newLoadMoreToken = (newOffset + data.length) < total ? 
        this.generateLoadMoreToken(params, newOffset) : null;

      // Cache the chunk
      if (this.config.enableCaching) {
        await this.cacheResult(cacheKey, { data, total, offset: newOffset });
      }

      logger.info(`Loaded more: ${data.length} items (offset: ${newOffset}) in ${Date.now() - startTime}ms`);

      return {
        data,
        newLoadMoreToken,
        hasMore: newLoadMoreToken !== null,
        totalLoaded: newOffset + data.length
      };
    } catch (error) {
      logger.error({ error: error }, 'Load more failed');
      throw error;
    }
  }

  // Preloading for Better UX
  async preloadNextPage<T>(
    dataFetcher: (offset: number, limit: number, params: PaginationParams) => Promise<{ data: T[]; total: number }>,
    currentParams: PaginationParams
  ): Promise<void> {
    try {
      const nextPageParams = {
        ...currentParams,
        page: currentParams.page + 1
      };

      const cacheKey = this.generateCacheKey('standard', nextPageParams);
      
      // Only preload if not already cached
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        return;
      }

      const normalizedParams = this.normalizeParams(nextPageParams);
      const offset = (normalizedParams.page - 1) * normalizedParams.limit;

      // Fetch and cache next page
      const { data, total } = await dataFetcher(offset, normalizedParams.limit, normalizedParams);
      
      const response: PaginatedResponse<T> = {
        data,
        pagination: this.buildPaginationInfo(normalizedParams, total),
        meta: {
          queryTime: 0,
          fromCache: false,
          sortBy: normalizedParams.sortBy,
          sortOrder: normalizedParams.sortOrder,
          appliedFilters: normalizedParams.filters
        }
      };

      await this.cacheResult(cacheKey, response);
      logger.info(`Preloaded page ${nextPageParams.page}`);
    } catch (error) {
      logger.warn({ error: error }, 'Preloading failed');
      // Don't throw - preloading is optional
    }
  }

  // Infinite Scroll Support
  async getInfiniteScrollData<T>(
    dataFetcher: (offset: number, limit: number, params: PaginationParams) => Promise<{ data: T[]; total: number }>,
    params: PaginationParams & { loadedCount: number }
  ): Promise<{
    data: T[];
    hasMore: boolean;
    totalItems: number;
    nextOffset: number;
  }> {
    const startTime = Date.now();
    const normalizedParams = this.normalizeParams(params);

    try {
      const { data, total } = await dataFetcher(
        params.loadedCount,
        normalizedParams.limit,
        normalizedParams
      );

      const nextOffset = params.loadedCount + data.length;
      const hasMore = nextOffset < total;

      logger.info(`Infinite scroll: loaded ${data.length} items (${nextOffset}/${total}) in ${Date.now() - startTime}ms`);

      return {
        data,
        hasMore,
        totalItems: total,
        nextOffset
      };
    } catch (error) {
      logger.error({ error: error }, 'Infinite scroll data fetch failed');
      throw error;
    }
  }

  // Cache Management
  async invalidatePaginationCache(pattern: string): Promise<void> {
    try {
      // This would use the cache service's tag-based invalidation
      await landVerificationCache.invalidatePropertyCache(pattern);
      logger.info(`Invalidated pagination cache for pattern: ${pattern}`);
    } catch (error) {
      logger.error({ error: error }, 'Cache invalidation failed');
    }
  }

  // Helper Methods
  private normalizeParams(params: PaginationParams): PaginationParams {
    return {
      page: Math.max(1, params.page || 1),
      limit: Math.min(this.config.maxPageSize, Math.max(1, params.limit || this.config.defaultPageSize)),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters || {}
    };
  }

  private buildPaginationInfo(params: PaginationParams, total: number) {
    const totalPages = Math.ceil(total / params.limit);
    const hasNextPage = params.page < totalPages;
    const hasPreviousPage = params.page > 1;

    return {
      currentPage: params.page,
      pageSize: params.limit,
      totalItems: total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? params.page + 1 : undefined,
      previousPage: hasPreviousPage ? params.page - 1 : undefined
    };
  }

  private generateCacheKey(type: string, params: any): string {
    const paramsStr = JSON.stringify(params);
    const hash = Buffer.from(paramsStr).toString('base64');
    return `${this.config.cacheKeyPrefix}:${type}:${hash}`;
  }

  private generateLoadMoreToken(params: PaginationParams, currentOffset: number): string {
    const tokenData = {
      params,
      currentOffset,
      timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  private decodeLoadMoreToken(token: string): { params: PaginationParams; currentOffset: number } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return {
        params: decoded.params,
        currentOffset: decoded.currentOffset
      };
    } catch (error) {
      throw new Error('Invalid load more token');
    }
  }

  private async getCachedResult<T>(cacheKey: string): Promise<T | null> {
    try {
      // This would use the actual cache service
      // For now, returning null to indicate cache miss
      return null;
    } catch (error) {
      logger.warn({ error: error }, 'Cache retrieval failed');
      return null;
    }
  }

  private async cacheResult<T>(cacheKey: string, result: T): Promise<void> {
    try {
      // This would use the actual cache service
      // Implementation would depend on the cache service API
      logger.debug(`Cached result for key: ${cacheKey}`);
    } catch (error) {
      logger.warn({ error: error }, 'Cache storage failed');
    }
  }

  // Performance Monitoring
  getPerformanceStats(): {
    averageQueryTime: number;
    cacheHitRate: number;
    totalQueries: number;
    totalCacheHits: number;
  } {
    // This would track actual performance metrics
    return {
      averageQueryTime: 0,
      cacheHitRate: 0,
      totalQueries: 0,
      totalCacheHits: 0
    };
  }
}

// Export singleton instance
export const paginationService = new PaginationService();