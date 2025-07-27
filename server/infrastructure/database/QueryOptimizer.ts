import { sql, SQL, and, or, eq, ne, gt, gte, lt, lte, like, ilike, inArray, isNull, isNotNull } from 'drizzle-orm';
import { PgSelect, PgSelectQueryBuilder } from 'drizzle-orm/pg-core';
import { Logger } from '../infrastructure/monitoring/logger';
import { cacheService, CacheKeys } from '../cache/CacheService';

export interface QueryOptions {
  cache?: {
    enabled: boolean;
    ttl?: number;
    key?: string;
    tags?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  filters?: Record<string, any>;
  includes?: string[];
  performance?: {
    timeout?: number;
    explain?: boolean;
    monitor?: boolean;
  };
}

export interface QueryResult<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  executionTime: number;
  fromCache: boolean;
  queryPlan?: any;
}

export interface QueryStats {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageExecutionTime: number;
  slowQueries: number;
  errorCount: number;
}

export class QueryOptimizer {
  private logger: Logger;
  private stats: QueryStats;
  private slowQueryThreshold: number = 1000; // 1 second

  constructor() {
    this.logger = new Logger('QueryOptimizer');
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      errorCount: 0
    };
  }

  /**
   * Execute optimized query with caching and performance monitoring
   */
  async executeQuery<T>(
    queryBuilder: PgSelect,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();
    
    try {
      this.stats.totalQueries++;

      // Check cache first if enabled
      if (options.cache?.enabled) {
        const cacheKey = options.cache.key || this.generateCacheKey(queryBuilder, options);
        const cachedResult = await cacheService.get<QueryResult<T>>(cacheKey);
        
        if (cachedResult) {
          this.stats.cacheHits++;
          this.logger.debug(`Cache hit for query: ${queryId}`);
          return {
            ...cachedResult,
            fromCache: true,
            executionTime: Date.now() - startTime
          };
        }
        
        this.stats.cacheMisses++;
      }

      // Apply optimizations
      const optimizedQuery = this.applyOptimizations(queryBuilder, options);

      // Execute query with timeout
      const result = await this.executeWithTimeout(
        optimizedQuery,
        options.performance?.timeout || 30000
      );

      const executionTime = Date.now() - startTime;

      // Monitor slow queries
      if (executionTime > this.slowQueryThreshold) {
        this.stats.slowQueries++;
        this.logger.warn(`Slow query detected: ${queryId} (${executionTime}ms)`);
        
        if (options.performance?.explain) {
          await this.explainQuery(optimizedQuery);
        }
      }

      // Update average execution time
      this.updateAverageExecutionTime(executionTime);

      // Prepare result
      const queryResult: QueryResult<T> = {
        data: result as T[],
        executionTime,
        fromCache: false
      };

      // Add pagination info if applicable
      if (options.pagination) {
        const total = await this.getQueryCount(queryBuilder, options);
        queryResult.total = total;
        queryResult.page = options.pagination.page;
        queryResult.limit = options.pagination.limit;
        queryResult.hasNext = (options.pagination.page * options.pagination.limit) < total;
        queryResult.hasPrev = options.pagination.page > 1;
      }

      // Cache result if enabled
      if (options.cache?.enabled) {
        const cacheKey = options.cache.key || this.generateCacheKey(queryBuilder, options);
        await cacheService.set(cacheKey, queryResult, {
          ttl: options.cache.ttl,
          tags: options.cache.tags
        });
      }

      return queryResult;
    } catch (error) {
      this.stats.errorCount++;
      this.logger.error(`Query execution failed: ${queryId}`, error);
      throw error;
    }
  }

  /**
   * Apply query optimizations
   */
  private applyOptimizations<T extends PgSelect>(
    queryBuilder: T,
    options: QueryOptions
  ): T {
    let optimizedQuery = queryBuilder;

    // Apply pagination
    if (options.pagination) {
      const offset = (options.pagination.page - 1) * options.pagination.limit;
      optimizedQuery = optimizedQuery.limit(options.pagination.limit).offset(offset) as T;
    }

    // Apply sorting
    if (options.sorting && options.sorting.length > 0) {
      for (const sort of options.sorting) {
        // Note: In a real implementation, you'd need to map field names to actual columns
        // This is a simplified example
        if (sort.direction === 'desc') {
          optimizedQuery = optimizedQuery.orderBy(sql`${sql.identifier(sort.field)} DESC`) as T;
        } else {
          optimizedQuery = optimizedQuery.orderBy(sql`${sql.identifier(sort.field)} ASC`) as T;
        }
      }
    }

    return optimizedQuery;
  }

  /**
   * Execute query with timeout
   */
  private async executeWithTimeout<T>(
    query: PgSelect,
    timeoutMs: number
  ): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await query.execute();
        clearTimeout(timeout);
        resolve(result as T[]);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Get total count for pagination
   */
  private async getQueryCount(
    queryBuilder: PgSelect,
    options: QueryOptions
  ): Promise<number> {
    try {
      // Create a count query based on the original query
      // This is a simplified implementation
      const countQuery = sql`SELECT COUNT(*) as count FROM (${queryBuilder}) as subquery`;
      const result = await countQuery.execute();
      return parseInt((result as any)[0]?.count || '0');
    } catch (error) {
      this.logger.error('Failed to get query count', error);
      return 0;
    }
  }

  /**
   * Explain query for performance analysis
   */
  private async explainQuery(query: PgSelect): Promise<void> {
    try {
      const explainQuery = sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await explainQuery.execute();
      this.logger.info('Query execution plan:', result);
    } catch (error) {
      this.logger.error('Failed to explain query', error);
    }
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(queryBuilder: PgSelect, options: QueryOptions): string {
    // Create a hash of the query and options
    const crypto = require('crypto');
    const queryString = queryBuilder.toSQL().sql;
    const optionsString = JSON.stringify(options);
    const hash = crypto.createHash('md5').update(queryString + optionsString).digest('hex');
    return `query:${hash}`;
  }

  /**
   * Generate unique query ID for tracking
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Update average execution time
   */
  private updateAverageExecutionTime(executionTime: number): void {
    const totalTime = this.stats.averageExecutionTime * (this.stats.totalQueries - 1);
    this.stats.averageExecutionTime = (totalTime + executionTime) / this.stats.totalQueries;
  }

  /**
   * Get query statistics
   */
  getStats(): QueryStats {
    return { ...this.stats };
  }

  /**
   * Reset query statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      errorCount: 0
    };
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
  }
}

// Query builder helpers for common patterns
export class QueryBuilderHelpers {
  /**
   * Build dynamic WHERE conditions
   */
  static buildWhereConditions(filters: Record<string, any>, columnMap: Record<string, any>): SQL | undefined {
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(filters)) {
      const column = columnMap[key];
      if (!column || value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          conditions.push(inArray(column, value));
        }
      } else if (typeof value === 'string') {
        if (key.endsWith('_like')) {
          conditions.push(ilike(column, `%${value}%`));
        } else {
          conditions.push(eq(column, value));
        }
      } else if (typeof value === 'number') {
        conditions.push(eq(column, value));
      } else if (typeof value === 'boolean') {
        conditions.push(eq(column, value));
      } else if (typeof value === 'object') {
        // Handle range queries
        if (value.min !== undefined) {
          conditions.push(gte(column, value.min));
        }
        if (value.max !== undefined) {
          conditions.push(lte(column, value.max));
        }
        if (value.gt !== undefined) {
          conditions.push(gt(column, value.gt));
        }
        if (value.lt !== undefined) {
          conditions.push(lt(column, value.lt));
        }
        if (value.ne !== undefined) {
          conditions.push(ne(column, value.ne));
        }
        if (value.null === true) {
          conditions.push(isNull(column));
        }
        if (value.null === false) {
          conditions.push(isNotNull(column));
        }
      }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Build ORDER BY clauses
   */
  static buildOrderBy(
    sorting: { field: string; direction: 'asc' | 'desc' }[],
    columnMap: Record<string, any>
  ): SQL[] {
    const orderClauses: SQL[] = [];

    for (const sort of sorting) {
      const column = columnMap[sort.field];
      if (column) {
        if (sort.direction === 'desc') {
          orderClauses.push(sql`${column} DESC`);
        } else {
          orderClauses.push(sql`${column} ASC`);
        }
      }
    }

    return orderClauses;
  }

  /**
   * Build search conditions for full-text search
   */
  static buildSearchConditions(
    query: string,
    searchColumns: any[],
    options: { exact?: boolean; caseSensitive?: boolean } = {}
  ): SQL | undefined {
    if (!query || query.trim().length === 0) {
      return undefined;
    }

    const searchTerm = options.exact ? query : `%${query}%`;
    const searchFunction = options.caseSensitive ? like : ilike;

    const conditions = searchColumns.map(column => 
      searchFunction(column, searchTerm)
    );

    return conditions.length > 0 ? or(...conditions) : undefined;
  }
}

// Connection pool monitoring
export class ConnectionPoolMonitor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ConnectionPoolMonitor');
  }

  /**
   * Monitor connection pool health
   */
  async monitorPool(db: any): Promise<{
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    try {
      // This would depend on your database driver
      // Example for node-postgres
      const poolInfo = {
        totalConnections: db.totalCount || 0,
        activeConnections: db.activeCount || 0,
        idleConnections: db.idleCount || 0,
        waitingClients: db.waitingCount || 0
      };

      // Log warnings for pool issues
      if (poolInfo.waitingClients > 0) {
        this.logger.warn(`${poolInfo.waitingClients} clients waiting for database connections`);
      }

      if (poolInfo.activeConnections / poolInfo.totalConnections > 0.8) {
        this.logger.warn('Database connection pool is running at high capacity');
      }

      return poolInfo;
    } catch (error) {
      this.logger.error('Failed to monitor connection pool', error);
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0
      };
    }
  }
}

// Export singleton instances
export const queryOptimizer = new QueryOptimizer();
export const connectionPoolMonitor = new ConnectionPoolMonitor();