import { sql, SQL, and, or, eq, desc, asc, count } from 'drizzle-orm';

import { logger } from '../../infrastructure/observability/telemetry';
import { db } from '..\..\infrastructure\database\connection\index';
import { landVerificationCache } from '../cache/LandVerificationCache';

export interface QueryOptimizationOptions {
  useCache: boolean;
  cacheTTL?: number;
  enablePagination: boolean;
  pageSize: number;
  enableIndexHints: boolean;
  enableQueryPlan: boolean;
  timeout?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  performance: {
    queryTime: number;
    fromCache: boolean;
    indexesUsed?: string[];
  };
}

export interface DatabaseIndexInfo {
  tableName: string;
  indexName: string;
  columns: string[];
  isUnique: boolean;
  size: number;
  usage: number;
}

export class DatabaseOptimizer {
  private defaultOptions: QueryOptimizationOptions = {
    useCache: true,
    cacheTTL: 3600,
    enablePagination: true,
    pageSize: 20,
    enableIndexHints: true,
    enableQueryPlan: false,
    timeout: 30000
  };

  // Optimized Verification Session Queries
  async getVerificationSessionsOptimized(
    filters: {
      userId?: string;
      propertyId?: string;
      status?: string;
      dateRange?: { start: Date; end: Date };
    },
    pagination: PaginationParams,
    options?: Partial<QueryOptimizationOptions>
  ): Promise<PaginatedResult<any>> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('verification_sessions', filters, pagination);
      
      // Check cache first
      if (opts.useCache) {
        const cached = await landVerificationCache.getVerificationSession(cacheKey);
        if (cached) {
          return {
            data: [cached],
            pagination: this.calculatePagination(1, pagination),
            performance: {
              queryTime: Date.now() - startTime,
              fromCache: true
            }
          };
        }
      }

      // Build optimized query
      let query = db
        .select()
        .from(sql`verification_sessions`)
        .where(this.buildWhereConditions(filters));

      // Add index hints if enabled
      if (opts.enableIndexHints) {
        query = this.addIndexHints(query, 'verification_sessions', filters);
      }

      // Add ordering for consistent pagination
      query = query.orderBy(desc(sql`created_at`));

      // Execute count query for pagination
      const countQuery = db
        .select({ count: count() })
        .from(sql`verification_sessions`)
        .where(this.buildWhereConditions(filters));

      const [countResult] = await countQuery;
      const total = countResult?.count || 0;

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.limit(pagination.limit).offset(offset);

      // Execute main query with timeout
      const data = await this.executeWithTimeout(query, opts.timeout);

      const result: PaginatedResult<any> = {
        data,
        pagination: this.calculatePagination(total, pagination),
        performance: {
          queryTime: Date.now() - startTime,
          fromCache: false
        }
      };

      // Cache the result
      if (opts.useCache && data.length > 0) {
        // Note: This is simplified - in practice you'd cache the full result
        await landVerificationCache.setVerificationSession(data[0]);
      }

      return result;
    } catch (error) {
      logger.error({ error: error }, 'Optimized verification sessions query failed');
      throw error;
    }
  }

  // Optimized Government Data Queries
  async getGovernmentDataOptimized(
    propertyIds: string[],
    dataTypes: string[],
    options?: Partial<QueryOptimizationOptions>
  ): Promise<{ [propertyId: string]: { [dataType: string]: any } }> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      // Check cache for all combinations
      const cacheRequests = propertyIds.flatMap(propertyId =>
        dataTypes.map(dataType => ({ propertyId, dataType }))
      );

      const cachedResults = await landVerificationCache.getMultipleGovernmentData(cacheRequests);
      const result: { [propertyId: string]: { [dataType: string]: any } } = {};

      // Process cached results and identify missing data
      const missingRequests: typeof cacheRequests = [];
      let cacheIndex = 0;

      for (const propertyId of propertyIds) {
        result[propertyId] = {};
        for (const dataType of dataTypes) {
          const cached = cachedResults[cacheIndex++];
          if (cached) {
            result[propertyId][dataType] = cached;
          } else {
            missingRequests.push({ propertyId, dataType });
          }
        }
      }

      // Fetch missing data from database
      if (missingRequests.length > 0) {
        const dbResults = await this.fetchGovernmentDataFromDB(missingRequests, opts);
        
        // Merge database results
        for (const { propertyId, dataType, data } of dbResults) {
          result[propertyId][dataType] = data;
        }

        // Cache the new results
        await landVerificationCache.setMultipleGovernmentData(
          dbResults.map(item => ({
            propertyId: item.propertyId,
            dataType: item.dataType,
            result: item.data
          }))
        );
      }

      logger.info(`Government data query completed in ${Date.now() - startTime}ms (${cachedResults.filter(r => r).length}/${cacheRequests.length} from cache)`);
      return result;
    } catch (error) {
      logger.error({ error: error }, 'Optimized government data query failed');
      throw error;
    }
  }

  // Optimized Risk Assessment Queries
  async getRiskAssessmentsOptimized(
    sessionIds: string[],
    options?: Partial<QueryOptimizationOptions>
  ): Promise<{ [sessionId: string]: any }> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    try {
      const result: { [sessionId: string]: any } = {};
      const missingSessionIds: string[] = [];

      // Check cache for all sessions
      for (const sessionId of sessionIds) {
        const cached = await landVerificationCache.getRiskAssessment(sessionId);
        if (cached) {
          result[sessionId] = cached;
        } else {
          missingSessionIds.push(sessionId);
        }
      }

      // Fetch missing assessments from database
      if (missingSessionIds.length > 0) {
        const query = db
          .select()
          .from(sql`risk_assessments`)
          .where(sql`session_id = ANY(${missingSessionIds})`);

        const dbResults = await this.executeWithTimeout(query, opts.timeout);

        for (const assessment of dbResults) {
          result[assessment.session_id] = assessment;
          // Cache the result
          await landVerificationCache.setRiskAssessment(assessment.session_id, assessment);
        }
      }

      logger.info(`Risk assessments query completed in ${Date.now() - startTime}ms (${sessionIds.length - missingSessionIds.length}/${sessionIds.length} from cache)`);
      return result;
    } catch (error) {
      logger.error({ error: error }, 'Optimized risk assessments query failed');
      throw error;
    }
  }

  // Batch Operations for Performance
  async batchInsertVerificationLayers(
    layers: Array<{
      sessionId: string;
      layerType: string;
      status: string;
      results: any;
      startedAt: Date;
      completedAt?: Date;
    }>,
    batchSize: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < layers.length; i += batchSize) {
        const batch = layers.slice(i, i + batchSize);
        
        // Use a single INSERT statement with multiple values
        const values = batch.map(layer => 
          `('${layer.sessionId}', '${layer.layerType}', '${layer.status}', '${JSON.stringify(layer.results)}', '${layer.startedAt.toISOString()}', ${layer.completedAt ? `'${layer.completedAt.toISOString()}'` : 'NULL'})`
        ).join(', ');

        const insertQuery = sql`
          INSERT INTO verification_layers (session_id, layer_type, status, results, started_at, completed_at)
          VALUES ${sql.raw(values)}
          ON CONFLICT (session_id, layer_type) 
          DO UPDATE SET 
            status = EXCLUDED.status,
            results = EXCLUDED.results,
            completed_at = EXCLUDED.completed_at,
            updated_at = NOW()
        `;

        await db.execute(insertQuery);
        
        logger.info(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(layers.length / batchSize)} (${batch.length} records)`);
      }

      logger.info(`Batch insert completed in ${Date.now() - startTime}ms (${layers.length} total records)`);
    } catch (error) {
      logger.error({ error: error }, 'Batch insert failed');
      throw error;
    }
  }

  async batchUpdateVerificationStatus(
    updates: Array<{
      sessionId: string;
      status: string;
      completedLayers?: number;
      totalLayers?: number;
    }>,
    batchSize: number = 50
  ): Promise<void> {
    const startTime = Date.now();

    try {
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        // Use CASE statements for efficient batch updates
        const sessionIds = batch.map(u => `'${u.sessionId}'`).join(', ');
        const statusCases = batch.map(u => `WHEN '${u.sessionId}' THEN '${u.status}'`).join(' ');
        const completedCases = batch.map(u => `WHEN '${u.sessionId}' THEN ${u.completedLayers || 0}`).join(' ');
        const totalCases = batch.map(u => `WHEN '${u.sessionId}' THEN ${u.totalLayers || 0}`).join(' ');

        const updateQuery = sql`
          UPDATE verification_sessions 
          SET 
            status = CASE session_id ${sql.raw(statusCases)} END,
            completed_layers = CASE session_id ${sql.raw(completedCases)} END,
            total_layers = CASE session_id ${sql.raw(totalCases)} END,
            updated_at = NOW()
          WHERE session_id IN (${sql.raw(sessionIds)})
        `;

        await db.execute(updateQuery);
      }

      logger.info(`Batch update completed in ${Date.now() - startTime}ms (${updates.length} records)`);
    } catch (error) {
      logger.error({ error: error }, 'Batch update failed');
      throw error;
    }
  }

  // Database Index Management
  async analyzeTableIndexes(tableName: string): Promise<DatabaseIndexInfo[]> {
    try {
      const indexQuery = sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        JOIN pg_indexes ON pg_stat_user_indexes.indexrelname = pg_indexes.indexname
        WHERE tablename = ${tableName}
      `;

      const indexes = await db.execute(indexQuery);
      
      return indexes.map((idx: any) => ({
        tableName: idx.tablename,
        indexName: idx.indexname,
        columns: this.parseIndexColumns(idx.indexdef),
        isUnique: idx.indexdef.includes('UNIQUE'),
        size: 0, // Would need additional query to get size
        usage: idx.idx_tup_read + idx.idx_tup_fetch
      }));
    } catch (error) {
      logger.error({ error: error }, 'Failed to analyze indexes for table ${tableName}');
      return [];
    }
  }

  async createOptimalIndexes(): Promise<void> {
    const indexDefinitions = [
      // Verification sessions indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_sessions_user_id ON verification_sessions(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_sessions_property_id ON verification_sessions(property_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_sessions_status ON verification_sessions(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_sessions_created_at ON verification_sessions(created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_sessions_composite ON verification_sessions(user_id, status, created_at DESC)',

      // Verification layers indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_layers_session_id ON verification_layers(session_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_layers_type ON verification_layers(layer_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_layers_status ON verification_layers(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_layers_composite ON verification_layers(session_id, layer_type, status)',

      // Government data indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_government_data_property_id ON government_data(property_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_government_data_type ON government_data(data_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_government_data_updated_at ON government_data(updated_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_government_data_composite ON government_data(property_id, data_type, updated_at DESC)',

      // Risk assessments indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risk_assessments_session_id ON risk_assessments(session_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risk_assessments_score ON risk_assessments(overall_risk_score DESC)',

      // Monitoring data indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_data_property_id ON monitoring_data(property_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_data_alert_type ON monitoring_data(alert_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_data_created_at ON monitoring_data(created_at DESC)'
    ];

    for (const indexDef of indexDefinitions) {
      try {
        await db.execute(sql.raw(indexDef));
        logger.info(`Created index: ${indexDef.split(' ')[5]}`);
      } catch (error) {
        logger.warn({ error: error }, 'Failed to create index: ${indexDef}');
      }
    }
  }

  // Query Performance Analysis
  async analyzeQueryPerformance(query: string): Promise<any> {
    try {
      const explainQuery = sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql.raw(query)}`;
      const result = await db.execute(explainQuery);
      return result[0];
    } catch (error) {
      logger.error({ error: error }, 'Query performance analysis failed');
      return null;
    }
  }

  async getSlowQueries(limit: number = 10): Promise<any[]> {
    try {
      const slowQueryQuery = sql`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE query LIKE '%verification%' OR query LIKE '%government%' OR query LIKE '%risk%'
        ORDER BY total_time DESC 
        LIMIT ${limit}
      `;

      return await db.execute(slowQueryQuery);
    } catch (error) {
      logger.error({ error: error }, 'Failed to get slow queries');
      return [];
    }
  }

  // Helper Methods
  private buildWhereConditions(filters: any): SQL {
    const conditions: SQL[] = [];

    if (filters.userId) {
      conditions.push(eq(sql`user_id`, filters.userId));
    }
    if (filters.propertyId) {
      conditions.push(eq(sql`property_id`, filters.propertyId));
    }
    if (filters.status) {
      conditions.push(eq(sql`status`, filters.status));
    }
    if (filters.dateRange) {
      conditions.push(
        and(
          sql`created_at >= ${filters.dateRange.start}`,
          sql`created_at <= ${filters.dateRange.end}`
        )
      );
    }

    return conditions.length > 0 ? and(...conditions) : sql`1=1`;
  }

  private addIndexHints(query: any, tableName: string, filters: any): any {
    // PostgreSQL doesn't have explicit index hints like MySQL
    // Instead, we can influence the query planner through query structure
    // This is a simplified implementation
    return query;
  }

  private async executeWithTimeout<T>(query: any, timeoutMs?: number): Promise<T[]> {
    if (!timeoutMs) {
      return await query;
    }

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await query;
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private calculatePagination(total: number, params: PaginationParams) {
    const totalPages = Math.ceil(total / params.limit);
    return {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    };
  }

  private generateCacheKey(table: string, filters: any, pagination?: PaginationParams): string {
    const filterStr = JSON.stringify(filters);
    const paginationStr = pagination ? JSON.stringify(pagination) : '';
    return `db_query:${table}:${Buffer.from(filterStr + paginationStr).toString('base64')}`;
  }

  private async fetchGovernmentDataFromDB(
    requests: Array<{ propertyId: string; dataType: string }>,
    options: QueryOptimizationOptions
  ): Promise<Array<{ propertyId: string; dataType: string; data: any }>> {
    // Group requests by data type for efficient querying
    const requestsByType = requests.reduce((acc, req) => {
      if (!acc[req.dataType]) {
        acc[req.dataType] = [];
      }
      acc[req.dataType].push(req.propertyId);
      return acc;
    }, {} as { [dataType: string]: string[] });

    const results: Array<{ propertyId: string; dataType: string; data: any }> = [];

    for (const [dataType, propertyIds] of Object.entries(requestsByType)) {
      const query = db
        .select()
        .from(sql`government_data`)
        .where(
          and(
            sql`data_type = ${dataType}`,
            sql`property_id = ANY(${propertyIds})`
          )
        );

      const dbResults = await this.executeWithTimeout(query, options.timeout);
      
      for (const row of dbResults) {
        results.push({
          propertyId: row.property_id,
          dataType: row.data_type,
          data: row.data
        });
      }
    }

    return results;
  }

  private parseIndexColumns(indexDef: string): string[] {
    // Simple parser for index definition - would need more robust implementation
    const match = indexDef.match(/\((.*?)\)/);
    if (match) {
      return match[1].split(',').map(col => col.trim());
    }
    return [];
  }
}

// Export singleton instance
export const databaseOptimizer = new DatabaseOptimizer();