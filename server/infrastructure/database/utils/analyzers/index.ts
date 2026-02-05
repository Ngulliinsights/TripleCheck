/**
 * Database Analysis Utilities
 * 
 * Utilities for analyzing database performance, schema optimization,
 * and data quality metrics.
 */

import postgres from '..\..\..\..\..\scripts\cleanup-redundancies';

export interface DatabaseAnalysisResult {
  tableStats: TableStats[];
  indexAnalysis: IndexAnalysis[];
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  lastAnalyzed: Date;
}

export interface IndexAnalysis {
  tableName: string;
  indexName: string;
  isUnique: boolean;
  columns: string[];
  sizeBytes: number;
  usage: {
    scans: number;
    tuplesRead: number;
    tuplesReturned: number;
  };
  recommendation: string;
}

export interface PerformanceMetrics {
  slowQueries: SlowQuery[];
  connectionStats: ConnectionStats;
  cacheHitRatio: number;
  averageQueryTime: number;
}

export interface SlowQuery {
  query: string;
  avgTime: number;
  calls: number;
  totalTime: number;
}

export interface ConnectionStats {
  active: number;
  idle: number;
  total: number;
  maxConnections: number;
}

export class DatabaseAnalyzer {
  /**
   * Performs comprehensive database analysis
   */
  static async analyzeDatabasePerformance(sql: postgres.Sql): Promise<DatabaseAnalysisResult> {
    try {
      console.log('📊 Analyzing database performance...');

      const [tableStats, indexAnalysis, performanceMetrics] = await Promise.all([
        this.getTableStatistics(sql),
        this.analyzeIndexes(sql),
        this.getPerformanceMetrics(sql)
      ]);

      const recommendations = this.generateRecommendations(tableStats, indexAnalysis, performanceMetrics);

      console.log('✅ Database analysis completed');

      return {
        tableStats,
        indexAnalysis,
        performanceMetrics,
        recommendations
      };
    } catch (error) {
      console.error('❌ Database analysis failed:', error);
      throw new Error(`Database analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets statistics for all tables
   */
  private static async getTableStatistics(sql: postgres.Sql): Promise<TableStats[]> {
    const result = await sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `;

    const tableStats: TableStats[] = [];

    for (const row of result) {
      // Get table size
      const sizeResult = await sql`
        SELECT pg_total_relation_size(${row.tablename}::regclass) as size_bytes
      `;
      
      const sizeBytes = Number(sizeResult[0]?.size_bytes || 0);
      
      tableStats.push({
        tableName: row.tablename as string,
        rowCount: Number(row.live_tuples || 0),
        sizeBytes,
        sizeFormatted: this.formatBytes(sizeBytes),
        lastAnalyzed: row.last_analyze || row.last_autoanalyze || new Date()
      });
    }

    return tableStats;
  }

  /**
   * Analyzes index usage and effectiveness
   */
  private static async analyzeIndexes(sql: postgres.Sql): Promise<IndexAnalysis[]> {
    const result = await sql`
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        ix.indisunique as is_unique,
        array_agg(a.attname ORDER BY a.attnum) as columns,
        pg_relation_size(i.oid) as size_bytes,
        COALESCE(s.idx_scan, 0) as scans,
        COALESCE(s.idx_tup_read, 0) as tuples_read,
        COALESCE(s.idx_tup_fetch, 0) as tuples_returned
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
      AND t.relkind = 'r'
      GROUP BY t.relname, i.relname, ix.indisunique, i.oid, s.idx_scan, s.idx_tup_read, s.idx_tup_fetch
      ORDER BY t.relname, i.relname
    `;

    return result.map(row => ({
      tableName: row.table_name as string,
      indexName: row.index_name as string,
      isUnique: Boolean(row.is_unique),
      columns: row.columns as string[],
      sizeBytes: Number(row.size_bytes || 0),
      usage: {
        scans: Number(row.scans || 0),
        tuplesRead: Number(row.tuples_read || 0),
        tuplesReturned: Number(row.tuples_returned || 0)
      },
      recommendation: this.getIndexRecommendation(row)
    }));
  }

  /**
   * Gets performance metrics
   */
  private static async getPerformanceMetrics(sql: postgres.Sql): Promise<PerformanceMetrics> {
    // Get connection stats
    const connectionResult = await sql`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    const maxConnectionsResult = await sql`
      SELECT setting::int as max_connections
      FROM pg_settings
      WHERE name = 'max_connections'
    `;

    // Get cache hit ratio
    const cacheHitResult = await sql`
      SELECT 
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
      FROM pg_statio_user_tables
    `;

    const connectionStats: ConnectionStats = {
      active: Number(connectionResult[0]?.active_connections || 0),
      idle: Number(connectionResult[0]?.idle_connections || 0),
      total: Number(connectionResult[0]?.total_connections || 0),
      maxConnections: Number(maxConnectionsResult[0]?.max_connections || 100)
    };

    return {
      slowQueries: [], // Would require pg_stat_statements extension
      connectionStats,
      cacheHitRatio: Number(cacheHitResult[0]?.cache_hit_ratio || 0),
      averageQueryTime: 0 // Would require query monitoring
    };
  }

  /**
   * Generates optimization recommendations
   */
  private static generateRecommendations(
    tableStats: TableStats[],
    indexAnalysis: IndexAnalysis[],
    performanceMetrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Table size recommendations
    const largeTables = tableStats.filter(t => t.sizeBytes > 100 * 1024 * 1024); // > 100MB
    if (largeTables.length > 0) {
      recommendations.push(`Consider partitioning large tables: ${largeTables.map(t => t.tableName).join(', ')}`);
    }

    // Index usage recommendations
    const unusedIndexes = indexAnalysis.filter(i => i.usage.scans === 0 && !i.indexName.endsWith('_pkey'));
    if (unusedIndexes.length > 0) {
      recommendations.push(`Consider dropping unused indexes: ${unusedIndexes.map(i => `${i.tableName}.${i.indexName}`).join(', ')}`);
    }

    // Cache hit ratio recommendations
    if (performanceMetrics.cacheHitRatio < 95) {
      recommendations.push('Consider increasing shared_buffers to improve cache hit ratio');
    }

    // Connection pool recommendations
    const connectionUtilization = (performanceMetrics.connectionStats.total / performanceMetrics.connectionStats.maxConnections) * 100;
    if (connectionUtilization > 80) {
      recommendations.push('High connection utilization detected. Consider connection pooling.');
    }

    // Missing indexes recommendations
    const tablesWithoutIndexes = tableStats.filter(t => {
      const tableIndexes = indexAnalysis.filter(i => i.tableName === t.tableName);
      return tableIndexes.length <= 1; // Only primary key
    });
    
    if (tablesWithoutIndexes.length > 0) {
      recommendations.push(`Tables may benefit from additional indexes: ${tablesWithoutIndexes.map(t => t.tableName).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Gets recommendation for a specific index
   */
  private static getIndexRecommendation(indexRow: any): string {
    const scans = Number(indexRow.scans || 0);
    const sizeBytes = Number(indexRow.size_bytes || 0);

    if (scans === 0 && !indexRow.index_name.endsWith('_pkey')) {
      return 'Consider dropping - unused index';
    }

    if (sizeBytes > 50 * 1024 * 1024 && scans < 100) { // > 50MB, < 100 scans
      return 'Large index with low usage - review necessity';
    }

    if (scans > 10000) {
      return 'High usage - well optimized';
    }

    return 'Normal usage';
  }

  /**
   * Formats bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  }
}