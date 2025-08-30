/**
 * Query Optimizer - Intelligent database query optimization for Kenya Land Platform
 * Implements performance indexes and query optimization based on access patterns
 */

import { sql } from 'drizzle-orm';
import { db } from './connection';

interface QueryOptimization {
  query: string;
  estimatedImprovement: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: number;
}

interface QueryAnalysis {
  slowQueries: SlowQuery[];
  missingIndexes: IndexRecommendation[];
  optimizations: QueryOptimization[];
  performanceMetrics: PerformanceMetrics;
}

interface SlowQuery {
  query: string;
  avgExecutionTime: number;
  callCount: number;
  totalTime: number;
}

interface PerformanceMetrics {
  avgQueryTime: number;
  slowQueryCount: number;
  indexHitRatio: number;
  cacheHitRatio: number;
}

export class QueryOptimizer {
  /**
   * Analyze database performance and provide optimization recommendations
   */
  async analyzePerformance(): Promise<QueryAnalysis> {
    const [slowQueries, missingIndexes, performanceMetrics] = await Promise.all([
      this.identifySlowQueries(),
      this.identifyMissingIndexes(),
      this.getPerformanceMetrics()
    ]);

    const optimizations = this.generateOptimizations(slowQueries, missingIndexes);

    return {
      slowQueries,
      missingIndexes,
      optimizations,
      performanceMetrics
    };
  }

  /**
   * Create performance indexes based on Kenya land registry access patterns
   */
  async createPerformanceIndexes(): Promise<void> {
    console.log('🚀 Creating performance indexes for Kenya Land Platform...');

    const indexes = [
      // Property search optimizations
      {
        name: 'idx_properties_location_type',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_type 
                ON properties (location, property_type) 
                WHERE status = 'active'`,
        description: 'Optimize property searches by location and type'
      },
      
      // Parcel number lookups (critical for Kenya land registry)
      {
        name: 'idx_properties_parcel_number',
        query: `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_parcel_number 
                ON properties (parcel_number) 
                WHERE parcel_number IS NOT NULL`,
        description: 'Fast parcel number lookups for land verification'
      },
      
      // Price range searches
      {
        name: 'idx_properties_price_range',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_price_range 
                ON properties (price) 
                WHERE price > 0 AND status = 'active'`,
        description: 'Optimize price range filtering'
      },
      
      // Date-based queries (recent listings, verification dates)
      {
        name: 'idx_properties_created_at',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_created_at 
                ON properties (created_at DESC)`,
        description: 'Fast retrieval of recent property listings'
      },
      
      // User property ownership
      {
        name: 'idx_properties_owner_status',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_owner_status 
                ON properties (owner_id, status) 
                WHERE owner_id IS NOT NULL`,
        description: 'Fast user property lookups'
      },
      
      // Fraud detection optimizations
      {
        name: 'idx_fraud_reports_property_date',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fraud_reports_property_date 
                ON fraud_reports (property_id, created_at DESC)`,
        description: 'Optimize fraud history lookups'
      },
      
      // Land verification status
      {
        name: 'idx_land_verification_status',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_land_verification_status 
                ON land_verification (property_id, verification_status, updated_at DESC)`,
        description: 'Fast verification status checks'
      },
      
      // Document authentication
      {
        name: 'idx_documents_property_type',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_property_type 
                ON property_documents (property_id, document_type, verification_status)`,
        description: 'Optimize document verification queries'
      },
      
      // Transaction history (M-Pesa payments, etc.)
      {
        name: 'idx_transactions_user_date',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date 
                ON transactions (user_id, created_at DESC) 
                WHERE status = 'completed'`,
        description: 'Fast transaction history retrieval'
      },
      
      // Full-text search for property descriptions
      {
        name: 'idx_properties_search',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_search 
                ON properties USING gin(to_tsvector('english', title || ' ' || description))`,
        description: 'Full-text search optimization'
      },
      
      // Geospatial index for location-based searches
      {
        name: 'idx_properties_coordinates',
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_coordinates 
                ON properties USING gist(coordinates) 
                WHERE coordinates IS NOT NULL`,
        description: 'Geospatial queries for map-based searches'
      }
    ];

    for (const index of indexes) {
      try {
        console.log(`Creating index: ${index.name} - ${index.description}`);
        await db.execute(sql.raw(index.query));
        console.log(`✅ Created: ${index.name}`);
      } catch (error) {
        console.warn(`⚠️  Index ${index.name} may already exist or failed:`, error);
      }
    }

    console.log('✅ Performance indexes creation complete!');
  }

  /**
   * Optimize specific query patterns common in Kenya Land Platform
   */
  async optimizeCommonQueries(): Promise<void> {
    console.log('🔧 Optimizing common query patterns...');

    // Update table statistics for better query planning
    const tables = [
      'properties',
      'users',
      'transactions',
      'fraud_reports',
      'land_verification',
      'property_documents'
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`ANALYZE ${table}`));
        console.log(`✅ Updated statistics for ${table}`);
      } catch (error) {
        console.warn(`⚠️  Could not analyze table ${table}:`, error);
      }
    }

    // Set optimal PostgreSQL configuration for the workload
    const optimizations = [
      "SET work_mem = '256MB'", // Increase memory for sorting/hashing
      "SET maintenance_work_mem = '512MB'", // Memory for maintenance operations
      "SET effective_cache_size = '2GB'", // Estimate of OS cache
      "SET random_page_cost = 1.1", // SSD optimization
      "SET effective_io_concurrency = 200" // SSD optimization
    ];

    for (const optimization of optimizations) {
      try {
        await db.execute(sql.raw(optimization));
      } catch (error) {
        console.warn(`⚠️  Could not apply optimization: ${optimization}`, error);
      }
    }

    console.log('✅ Query optimization complete!');
  }

  /**
   * Identify slow queries from database statistics
   */
  private async identifySlowQueries(): Promise<SlowQuery[]> {
    try {
      // This would typically query pg_stat_statements if available
      const result = await db.execute(sql.raw(`
        SELECT 
          query,
          mean_exec_time as avg_execution_time,
          calls as call_count,
          total_exec_time as total_time
        FROM pg_stat_statements 
        WHERE mean_exec_time > 100 
        ORDER BY mean_exec_time DESC 
        LIMIT 10
      `));

      return result.rows.map(row => ({
        query: row.query as string,
        avgExecutionTime: Number(row.avg_execution_time),
        callCount: Number(row.call_count),
        totalTime: Number(row.total_time)
      }));
    } catch (error) {
      console.warn('Could not retrieve slow query statistics:', error);
      return [];
    }
  }

  /**
   * Identify missing indexes based on query patterns
   */
  private async identifyMissingIndexes(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // Common patterns that would benefit from indexes
    const patterns = [
      {
        table: 'properties',
        columns: ['location', 'price'],
        type: 'btree' as const,
        reason: 'Location and price filtering is common',
        estimatedImprovement: 60
      },
      {
        table: 'properties',
        columns: ['owner_id', 'status'],
        type: 'btree' as const,
        reason: 'User property listings need fast access',
        estimatedImprovement: 70
      },
      {
        table: 'fraud_reports',
        columns: ['property_id', 'severity'],
        type: 'btree' as const,
        reason: 'Fraud analysis by property and severity',
        estimatedImprovement: 50
      },
      {
        table: 'land_verification',
        columns: ['verification_status', 'updated_at'],
        type: 'btree' as const,
        reason: 'Verification status tracking',
        estimatedImprovement: 65
      }
    ];

    // Check which indexes are missing
    for (const pattern of patterns) {
      try {
        const indexExists = await this.checkIndexExists(pattern.table, pattern.columns);
        if (!indexExists) {
          recommendations.push(pattern);
        }
      } catch (error) {
        console.warn(`Could not check index for ${pattern.table}:`, error);
      }
    }

    return recommendations;
  }

  /**
   * Check if an index exists for given table and columns
   */
  private async checkIndexExists(table: string, columns: string[]): Promise<boolean> {
    try {
      const result = await db.execute(sql.raw(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = $1 
        AND indexdef LIKE '%${columns.join('%')}%'
      `), [table]);

      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current database performance metrics
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      // Get basic performance metrics
      const [queryStats, indexStats] = await Promise.all([
        db.execute(sql.raw(`
          SELECT 
            COALESCE(AVG(mean_exec_time), 0) as avg_query_time,
            COUNT(*) FILTER (WHERE mean_exec_time > 1000) as slow_query_count
          FROM pg_stat_statements
        `)),
        db.execute(sql.raw(`
          SELECT 
            COALESCE(
              SUM(idx_blks_hit) * 100.0 / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 
              0
            ) as index_hit_ratio
          FROM pg_statio_user_indexes
        `))
      ]);

      return {
        avgQueryTime: Number(queryStats.rows[0]?.avg_query_time || 0),
        slowQueryCount: Number(queryStats.rows[0]?.slow_query_count || 0),
        indexHitRatio: Number(indexStats.rows[0]?.index_hit_ratio || 0),
        cacheHitRatio: 0 // Would need additional queries to calculate
      };
    } catch (error) {
      console.warn('Could not retrieve performance metrics:', error);
      return {
        avgQueryTime: 0,
        slowQueryCount: 0,
        indexHitRatio: 0,
        cacheHitRatio: 0
      };
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizations(
    slowQueries: SlowQuery[], 
    missingIndexes: IndexRecommendation[]
  ): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Recommendations based on slow queries
    for (const query of slowQueries.slice(0, 3)) {
      optimizations.push({
        query: query.query.substring(0, 100) + '...',
        estimatedImprovement: Math.min(query.avgExecutionTime * 0.5, 80),
        description: `Optimize slow query (${query.avgExecutionTime.toFixed(2)}ms avg)`,
        priority: query.avgExecutionTime > 1000 ? 'high' : 'medium'
      });
    }

    // Recommendations based on missing indexes
    for (const index of missingIndexes.slice(0, 5)) {
      optimizations.push({
        query: `CREATE INDEX ON ${index.table} (${index.columns.join(', ')})`,
        estimatedImprovement: index.estimatedImprovement,
        description: index.reason,
        priority: index.estimatedImprovement > 60 ? 'high' : 'medium'
      });
    }

    return optimizations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Execute all optimizations
   */
  async executeOptimizations(): Promise<void> {
    console.log('🚀 Starting database optimization for Kenya Land Platform...');
    
    await this.createPerformanceIndexes();
    await this.optimizeCommonQueries();
    
    const analysis = await this.analyzePerformance();
    
    console.log('\n📊 Performance Analysis Results:');
    console.log(`   Average Query Time: ${analysis.performanceMetrics.avgQueryTime.toFixed(2)}ms`);
    console.log(`   Slow Queries: ${analysis.performanceMetrics.slowQueryCount}`);
    console.log(`   Index Hit Ratio: ${analysis.performanceMetrics.indexHitRatio.toFixed(2)}%`);
    
    if (analysis.optimizations.length > 0) {
      console.log('\n💡 Additional Optimization Recommendations:');
      for (const opt of analysis.optimizations.slice(0, 5)) {
        console.log(`   ${opt.priority.toUpperCase()}: ${opt.description}`);
        console.log(`   Estimated improvement: ${opt.estimatedImprovement.toFixed(2)}%`);
      }
    }
    
    console.log('\n✅ Database optimization complete!');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new QueryOptimizer();
  optimizer.executeOptimizations().catch(console.error);
}