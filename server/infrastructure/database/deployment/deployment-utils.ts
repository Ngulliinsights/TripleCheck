/**
 * Deployment Utilities
 * 
 * Utility functions for zero-downtime deployments and migrations.
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '../../monitoring/logger';
import { MigrationOperation } from './ZeroDowntimeMigrationManager';

/**
 * Migration operation builders
 */
export class MigrationBuilder {
  /**
   * Build ADD_COLUMN migration operation
   */
  static addColumn(
    table: string,
    columnDefinition: string,
    options: {
      description?: string;
      defaultValue?: string;
      nullable?: boolean;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {}
  ): MigrationOperation {
    const columnName = columnDefinition.split(' ')[0];
    const isNullable = options.nullable !== false;
    
    let sql = `ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`;
    
    // Add default value if provided
    if (options.defaultValue) {
      sql += ` DEFAULT ${options.defaultValue}`;
    }
    
    // Add NOT NULL constraint if specified
    if (!isNullable) {
      sql += ' NOT NULL';
    }

    return {
      id: `add_column_${table}_${columnName}_${Date.now()}`,
      type: 'ADD_COLUMN',
      table,
      description: options.description || `Add column ${columnName} to ${table}`,
      estimatedDuration: 30000, // 30 seconds
      riskLevel: options.riskLevel || 'LOW',
      lockingBehavior: 'MINIMAL',
      reversible: true,
      sql,
      rollbackSql: `ALTER TABLE ${table} DROP COLUMN IF EXISTS ${columnName}`,
      validationSql: `
        SELECT 1 as valid 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND column_name = '${columnName}'
      `
    };
  }

  /**
   * Build DROP_COLUMN migration operation
   */
  static dropColumn(
    table: string,
    columnName: string,
    options: {
      description?: string;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {}
  ): MigrationOperation {
    return {
      id: `drop_column_${table}_${columnName}_${Date.now()}`,
      type: 'DROP_COLUMN',
      table,
      description: options.description || `Drop column ${columnName} from ${table}`,
      estimatedDuration: 10000, // 10 seconds
      riskLevel: options.riskLevel || 'HIGH',
      lockingBehavior: 'MINIMAL',
      reversible: false, // Cannot easily reverse without knowing original definition
      sql: `ALTER TABLE ${table} DROP COLUMN ${columnName}`,
      validationSql: `
        SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as valid
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        AND column_name = '${columnName}'
      `
    };
  }

  /**
   * Build ADD_INDEX migration operation
   */
  static addIndex(
    table: string,
    indexDefinition: string,
    options: {
      indexName?: string;
      description?: string;
      concurrent?: boolean;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {}
  ): MigrationOperation {
    const indexName = options.indexName || `idx_${table}_${Date.now()}`;
    const concurrent = options.concurrent !== false;
    
    let sql: string;
    
    if (indexDefinition.toLowerCase().startsWith('create')) {
      sql = indexDefinition;
    } else {
      sql = `CREATE INDEX${concurrent ? ' CONCURRENTLY' : ''} ${indexName} ON ${table} ${indexDefinition}`;
    }

    return {
      id: `add_index_${table}_${indexName}_${Date.now()}`,
      type: 'ADD_INDEX',
      table,
      description: options.description || `Add index ${indexName} to ${table}`,
      estimatedDuration: 120000, // 2 minutes
      riskLevel: options.riskLevel || 'MEDIUM',
      lockingBehavior: concurrent ? 'NONE' : 'MODERATE',
      reversible: true,
      sql,
      rollbackSql: `DROP INDEX IF EXISTS ${indexName}`,
      validationSql: `
        SELECT 1 as valid
        FROM pg_indexes 
        WHERE tablename = '${table}' 
        AND indexname = '${indexName}'
      `
    };
  }

  /**
   * Build DROP_INDEX migration operation
   */
  static dropIndex(
    indexName: string,
    options: {
      table?: string;
      description?: string;
      concurrent?: boolean;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {}
  ): MigrationOperation {
    const concurrent = options.concurrent !== false;
    const sql = `DROP INDEX${concurrent ? ' CONCURRENTLY' : ''} IF EXISTS ${indexName}`;

    return {
      id: `drop_index_${indexName}_${Date.now()}`,
      type: 'DROP_INDEX',
      table: options.table || 'unknown',
      description: options.description || `Drop index ${indexName}`,
      estimatedDuration: 30000, // 30 seconds
      riskLevel: options.riskLevel || 'LOW',
      lockingBehavior: concurrent ? 'NONE' : 'MINIMAL',
      reversible: false, // Cannot reverse without knowing original definition
      sql,
      validationSql: `
        SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as valid
        FROM pg_indexes 
        WHERE indexname = '${indexName}'
      `
    };
  }

  /**
   * Build RENAME_TABLE migration operation
   */
  static renameTable(
    oldName: string,
    newName: string,
    options: {
      description?: string;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {}
  ): MigrationOperation {
    return {
      id: `rename_table_${oldName}_${newName}_${Date.now()}`,
      type: 'RENAME_TABLE',
      table: oldName,
      description: options.description || `Rename table ${oldName} to ${newName}`,
      estimatedDuration: 5000, // 5 seconds
      riskLevel: options.riskLevel || 'HIGH',
      lockingBehavior: 'EXCLUSIVE',
      reversible: true,
      sql: `ALTER TABLE ${oldName} RENAME TO ${newName}`,
      rollbackSql: `ALTER TABLE ${newName} RENAME TO ${oldName}`,
      validationSql: `
        SELECT 1 as valid
        FROM information_schema.tables 
        WHERE table_name = '${newName}' 
        AND table_schema = 'public'
      `
    };
  }

  /**
   * Build custom migration operation
   */
  static custom(
    table: string,
    sql: string,
    options: {
      description: string;
      estimatedDuration?: number;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      lockingBehavior?: 'NONE' | 'MINIMAL' | 'MODERATE' | 'EXCLUSIVE';
      reversible?: boolean;
      rollbackSql?: string;
      validationSql?: string;
    }
  ): MigrationOperation {
    return {
      id: `custom_${table}_${Date.now()}`,
      type: 'CUSTOM',
      table,
      description: options.description,
      estimatedDuration: options.estimatedDuration || 60000,
      riskLevel: options.riskLevel || 'MEDIUM',
      lockingBehavior: options.lockingBehavior || 'MODERATE',
      reversible: options.reversible || false,
      sql,
      rollbackSql: options.rollbackSql,
      validationSql: options.validationSql
    };
  }
}

/**
 * Database analysis utilities
 */
export class DatabaseAnalyzer {
  /**
   * Analyze table size and estimate migration impact
   */
  static async analyzeTable(pool: Pool, tableName: string): Promise<{
    rowCount: number;
    sizeBytes: number;
    sizeMB: number;
    estimatedMigrationTime: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendations: string[];
  }> {
    const client = await pool.connect();
    
    try {
      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = parseInt(countResult.rows[0].count);

      // Get table size
      const sizeResult = await client.query(`
        SELECT pg_total_relation_size($1) as size_bytes
      `, [tableName]);
      const sizeBytes = parseInt(sizeResult.rows[0].size_bytes);
      const sizeMB = Math.round(sizeBytes / (1024 * 1024));

      // Estimate migration time (rough heuristic)
      const estimatedMigrationTime = Math.max(5000, Math.min(300000, rowCount * 0.1));

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (sizeMB < 100) {
        riskLevel = 'LOW';
      } else if (sizeMB < 1000) {
        riskLevel = 'MEDIUM';
      } else if (sizeMB < 10000) {
        riskLevel = 'HIGH';
      } else {
        riskLevel = 'CRITICAL';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (riskLevel === 'CRITICAL') {
        recommendations.push('Consider breaking migration into smaller batches');
        recommendations.push('Schedule migration during low-traffic periods');
        recommendations.push('Ensure adequate monitoring during migration');
      } else if (riskLevel === 'HIGH') {
        recommendations.push('Monitor migration progress closely');
        recommendations.push('Consider maintenance window for migration');
      } else if (riskLevel === 'MEDIUM') {
        recommendations.push('Monitor for performance impact during migration');
      }

      if (rowCount > 1000000) {
        recommendations.push('Use batch processing for large data modifications');
      }

      return {
        rowCount,
        sizeBytes,
        sizeMB,
        estimatedMigrationTime,
        riskLevel,
        recommendations
      };

    } finally {
      client.release();
    }
  }

  /**
   * Analyze database performance metrics
   */
  static async analyzePerformance(pool: Pool): Promise<{
    connectionCount: number;
    activeQueries: number;
    slowQueries: number;
    avgQueryTime: number;
    recommendations: string[];
  }> {
    const client = await pool.connect();
    
    try {
      // Get connection count
      const connectionResult = await client.query(`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      const connectionCount = parseInt(connectionResult.rows[0].count);

      // Get active queries
      const activeResult = await client.query(`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query != '<IDLE>'
      `);
      const activeQueries = parseInt(activeResult.rows[0].count);

      // Get slow queries (if pg_stat_statements is available)
      let slowQueries = 0;
      let avgQueryTime = 0;
      
      try {
        const slowQueryResult = await client.query(`
          SELECT 
            COUNT(*) FILTER (WHERE mean_exec_time > 1000) as slow_count,
            ROUND(AVG(mean_exec_time)::numeric, 2) as avg_time
          FROM pg_stat_statements 
          WHERE calls > 10
        `);
        
        if (slowQueryResult.rows.length > 0) {
          slowQueries = parseInt(slowQueryResult.rows[0].slow_count || '0');
          avgQueryTime = parseFloat(slowQueryResult.rows[0].avg_time || '0');
        }
      } catch (error) {
        // pg_stat_statements not available
        logger.warn('pg_stat_statements extension not available for performance analysis');
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (connectionCount > 80) {
        recommendations.push('High connection count detected - consider connection pooling');
      }
      
      if (activeQueries > 50) {
        recommendations.push('High number of active queries - monitor for blocking');
      }
      
      if (slowQueries > 10) {
        recommendations.push('Multiple slow queries detected - review query performance');
      }
      
      if (avgQueryTime > 100) {
        recommendations.push('Average query time is high - consider query optimization');
      }

      return {
        connectionCount,
        activeQueries,
        slowQueries,
        avgQueryTime,
        recommendations
      };

    } finally {
      client.release();
    }
  }

  /**
   * Check for migration blockers
   */
  static async checkMigrationBlockers(pool: Pool, tableName: string): Promise<{
    longRunningTransactions: number;
    exclusiveLocks: number;
    replicationLag: number;
    blockers: Array<{
      type: string;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      recommendation: string;
    }>;
  }> {
    const client = await pool.connect();
    
    try {
      const blockers: Array<{
        type: string;
        description: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        recommendation: string;
      }> = [];

      // Check for long-running transactions
      const longTxResult = await client.query(`
        SELECT count(*) as count
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query_start < NOW() - INTERVAL '5 minutes'
        AND pid != pg_backend_pid()
      `);
      const longRunningTransactions = parseInt(longTxResult.rows[0].count);

      if (longRunningTransactions > 0) {
        blockers.push({
          type: 'LONG_TRANSACTIONS',
          description: `${longRunningTransactions} long-running transactions detected`,
          severity: 'HIGH',
          recommendation: 'Wait for transactions to complete or consider terminating if safe'
        });
      }

      // Check for exclusive locks on the table
      const lockResult = await client.query(`
        SELECT count(*) as count
        FROM pg_locks l
        JOIN pg_class c ON l.relation = c.oid
        WHERE c.relname = $1
        AND l.mode = 'AccessExclusiveLock'
      `, [tableName]);
      const exclusiveLocks = parseInt(lockResult.rows[0].count);

      if (exclusiveLocks > 0) {
        blockers.push({
          type: 'EXCLUSIVE_LOCKS',
          description: `Exclusive locks detected on table ${tableName}`,
          severity: 'CRITICAL',
          recommendation: 'Wait for locks to be released before proceeding'
        });
      }

      // Check replication lag (if replica is configured)
      let replicationLag = 0;
      try {
        const lagResult = await client.query(`
          SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds
        `);
        
        if (lagResult.rows.length > 0 && lagResult.rows[0].lag_seconds !== null) {
          replicationLag = parseFloat(lagResult.rows[0].lag_seconds);
          
          if (replicationLag > 30) {
            blockers.push({
              type: 'REPLICATION_LAG',
              description: `High replication lag detected: ${Math.round(replicationLag)} seconds`,
              severity: 'MEDIUM',
              recommendation: 'Wait for replication to catch up before proceeding'
            });
          }
        }
      } catch (error) {
        // Not a replica or function not available
      }

      return {
        longRunningTransactions,
        exclusiveLocks,
        replicationLag,
        blockers
      };

    } finally {
      client.release();
    }
  }
}

/**
 * Deployment safety utilities
 */
export class DeploymentSafety {
  /**
   * Validate migration safety
   */
  static validateMigrationSafety(operation: MigrationOperation): {
    safe: boolean;
    warnings: string[];
    blockers: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const blockers: string[] = [];
    const recommendations: string[] = [];

    // Check operation type safety
    switch (operation.type) {
      case 'DROP_COLUMN':
        warnings.push('Dropping columns is irreversible and may break application compatibility');
        recommendations.push('Ensure application no longer references this column');
        break;
        
      case 'RENAME_TABLE':
        warnings.push('Renaming tables requires brief exclusive lock');
        recommendations.push('Coordinate with application deployment to update references');
        break;
        
      case 'MODIFY_COLUMN':
        if (operation.riskLevel === 'CRITICAL') {
          blockers.push('Column modifications with CRITICAL risk level require manual review');
        }
        warnings.push('Column modifications may require data conversion');
        break;
    }

    // Check risk level
    if (operation.riskLevel === 'CRITICAL') {
      warnings.push('CRITICAL risk level operation requires extra caution');
      recommendations.push('Consider breaking into smaller operations if possible');
      recommendations.push('Schedule during maintenance window');
    }

    // Check locking behavior
    if (operation.lockingBehavior === 'EXCLUSIVE') {
      warnings.push('Operation requires exclusive lock and will block all access');
      recommendations.push('Schedule during low-traffic period');
    }

    // Check reversibility
    if (!operation.reversible) {
      warnings.push('Operation is not reversible');
      recommendations.push('Ensure thorough testing before execution');
      recommendations.push('Create backup before proceeding');
    }

    const safe = blockers.length === 0;

    return {
      safe,
      warnings,
      blockers,
      recommendations
    };
  }

  /**
   * Generate pre-migration checklist
   */
  static generatePreMigrationChecklist(operation: MigrationOperation): Array<{
    item: string;
    required: boolean;
    description: string;
  }> {
    const checklist = [
      {
        item: 'Backup database',
        required: true,
        description: 'Create full database backup before proceeding'
      },
      {
        item: 'Test migration in staging',
        required: true,
        description: 'Verify migration works correctly in staging environment'
      },
      {
        item: 'Review application compatibility',
        required: true,
        description: 'Ensure application can handle schema changes'
      },
      {
        item: 'Monitor system resources',
        required: true,
        description: 'Verify sufficient CPU, memory, and disk space'
      },
      {
        item: 'Check for blocking transactions',
        required: true,
        description: 'Ensure no long-running transactions will block migration'
      }
    ];

    // Add operation-specific items
    if (operation.type === 'ADD_INDEX') {
      checklist.push({
        item: 'Verify disk space for index',
        required: true,
        description: 'Ensure sufficient disk space for new index creation'
      });
    }

    if (operation.riskLevel === 'CRITICAL') {
      checklist.push({
        item: 'Schedule maintenance window',
        required: true,
        description: 'Schedule appropriate maintenance window for high-risk operation'
      });
      
      checklist.push({
        item: 'Prepare rollback plan',
        required: true,
        description: 'Document detailed rollback procedures'
      });
    }

    if (operation.lockingBehavior === 'EXCLUSIVE') {
      checklist.push({
        item: 'Notify users of downtime',
        required: true,
        description: 'Inform users of expected downtime during migration'
      });
    }

    return checklist;
  }

  /**
   * Estimate migration downtime
   */
  static estimateDowntime(operation: MigrationOperation, tableAnalysis?: {
    rowCount: number;
    sizeMB: number;
  }): {
    estimatedDowntime: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  } {
    const factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }> = [];

    let estimatedDowntime = 0;

    // Base downtime by operation type
    switch (operation.type) {
      case 'ADD_COLUMN':
        estimatedDowntime = 100; // 100ms base
        factors.push({
          factor: 'Column addition',
          impact: 100,
          description: 'Base time for adding column'
        });
        break;
        
      case 'DROP_COLUMN':
        estimatedDowntime = 50; // 50ms base
        factors.push({
          factor: 'Column removal',
          impact: 50,
          description: 'Base time for dropping column'
        });
        break;
        
      case 'ADD_INDEX':
        estimatedDowntime = 0; // Concurrent index creation has no downtime
        factors.push({
          factor: 'Concurrent index creation',
          impact: 0,
          description: 'No downtime for concurrent index operations'
        });
        break;
        
      case 'RENAME_TABLE':
        estimatedDowntime = 10; // 10ms base
        factors.push({
          factor: 'Table rename',
          impact: 10,
          description: 'Brief exclusive lock for table rename'
        });
        break;
        
      default:
        estimatedDowntime = operation.estimatedDuration * 0.1; // 10% of total time
        factors.push({
          factor: 'Custom operation',
          impact: estimatedDowntime,
          description: 'Estimated based on operation duration'
        });
    }

    // Adjust for table size
    if (tableAnalysis) {
      if (tableAnalysis.sizeMB > 1000) {
        const sizeImpact = Math.min(1000, tableAnalysis.sizeMB * 0.1);
        estimatedDowntime += sizeImpact;
        factors.push({
          factor: 'Large table size',
          impact: sizeImpact,
          description: `Additional time for ${tableAnalysis.sizeMB}MB table`
        });
      }
    }

    // Adjust for locking behavior
    if (operation.lockingBehavior === 'EXCLUSIVE') {
      const lockImpact = Math.max(100, estimatedDowntime * 0.5);
      estimatedDowntime += lockImpact;
      factors.push({
        factor: 'Exclusive locking',
        impact: lockImpact,
        description: 'Additional downtime due to exclusive lock requirement'
      });
    }

    return {
      estimatedDowntime: Math.round(estimatedDowntime),
      factors
    };
  }
}

/**
 * Deployment monitoring utilities
 */
export class DeploymentMonitor {
  /**
   * Monitor migration progress
   */
  static async monitorMigrationProgress(
    pool: Pool,
    operationId: string,
    callback: (progress: {
      operationId: string;
      status: string;
      progress: number;
      metrics: Record<string, number>;
    }) => void
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      // This would integrate with the actual migration tracking
      // For now, we'll simulate progress monitoring
      
      let progress = 0;
      const interval = setInterval(async () => {
        try {
          // Get current metrics
          const metricsResult = await client.query(`
            SELECT 
              COUNT(*) as active_connections,
              COALESCE(AVG(EXTRACT(EPOCH FROM (now() - query_start)) * 1000), 0) as avg_query_time
            FROM pg_stat_activity 
            WHERE state = 'active'
          `);

          const metrics = {
            activeConnections: parseInt(metricsResult.rows[0].active_connections),
            avgQueryTime: parseFloat(metricsResult.rows[0].avg_query_time)
          };

          progress += 10;
          
          callback({
            operationId,
            status: progress >= 100 ? 'COMPLETED' : 'RUNNING',
            progress: Math.min(progress, 100),
            metrics
          });

          if (progress >= 100) {
            clearInterval(interval);
          }

        } catch (error) {
          logger.error('Error monitoring migration progress:', error);
          clearInterval(interval);
        }
      }, 1000);

    } finally {
      client.release();
    }
  }

  /**
   * Monitor system health during deployment
   */
  static async monitorSystemHealth(
    pool: Pool,
    callback: (health: {
      timestamp: Date;
      healthy: boolean;
      metrics: {
        connectionCount: number;
        activeQueries: number;
        avgResponseTime: number;
        errorRate: number;
      };
      alerts: string[];
    }) => void
  ): Promise<() => void> {
    const client = await pool.connect();
    
    const interval = setInterval(async () => {
      try {
        const startTime = Date.now();
        
        // Test basic connectivity
        await client.query('SELECT 1');
        const responseTime = Date.now() - startTime;

        // Get system metrics
        const metricsResult = await client.query(`
          SELECT 
            COUNT(*) as connection_count,
            COUNT(*) FILTER (WHERE state = 'active' AND query != '<IDLE>') as active_queries
          FROM pg_stat_activity
        `);

        const connectionCount = parseInt(metricsResult.rows[0].connection_count);
        const activeQueries = parseInt(metricsResult.rows[0].active_queries);

        const alerts: string[] = [];
        
        // Check for alerts
        if (connectionCount > 80) {
          alerts.push('High connection count detected');
        }
        
        if (activeQueries > 50) {
          alerts.push('High number of active queries');
        }
        
        if (responseTime > 1000) {
          alerts.push('High database response time');
        }

        const healthy = alerts.length === 0 && responseTime < 500;

        callback({
          timestamp: new Date(),
          healthy,
          metrics: {
            connectionCount,
            activeQueries,
            avgResponseTime: responseTime,
            errorRate: 0 // Would be calculated from error tracking
          },
          alerts
        });

      } catch (error) {
        callback({
          timestamp: new Date(),
          healthy: false,
          metrics: {
            connectionCount: 0,
            activeQueries: 0,
            avgResponseTime: 0,
            errorRate: 1
          },
          alerts: [`Database health check failed: ${error.message}`]
        });
      }
    }, 5000); // Every 5 seconds

    // Return cleanup function
    return () => {
      clearInterval(interval);
      client.release();
    };
  }
}

/**
 * Export all utilities
 */
export {
  MigrationBuilder,
  DatabaseAnalyzer,
  DeploymentSafety,
  DeploymentMonitor
};