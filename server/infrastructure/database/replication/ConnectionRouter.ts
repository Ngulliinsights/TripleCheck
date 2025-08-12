import { PoolClient } from 'pg';

import { logger } from '../../monitoring/logger';
import { observabilitySystem } from '../../monitoring/ObservabilitySystem';

import { replicationManager } from './ReplicationManager';

export interface QueryRoutingOptions {
  forceWriteConnection?: boolean;
  preferredRegion?: string;
  maxLagTolerance?: number; // milliseconds
  readPreference?: 'primary' | 'replica' | 'any';
  consistencyLevel?: 'eventual' | 'strong';
}

export interface ConnectionStats {
  totalQueries: number;
  primaryQueries: number;
  replicaQueries: number;
  routingDecisions: {
    forcedPrimary: number;
    lagTooHigh: number;
    noHealthyReplicas: number;
    preferredRegion: number;
    loadBalanced: number;
  };
}

export class ConnectionRouter {
  private static instance: ConnectionRouter;
  private stats: ConnectionStats;
  private loadBalancingIndex = 0;

  static getInstance(): ConnectionRouter {
    if (!ConnectionRouter.instance) {
      ConnectionRouter.instance = new ConnectionRouter();
    }
    return ConnectionRouter.instance;
  }

  constructor() {
    this.stats = {
      totalQueries: 0,
      primaryQueries: 0,
      replicaQueries: 0,
      routingDecisions: {
        forcedPrimary: 0,
        lagTooHigh: 0,
        noHealthyReplicas: 0,
        preferredRegion: 0,
        loadBalanced: 0
      }
    };
  }

  async getConnection(options: QueryRoutingOptions = {}): Promise<{
    connection: PoolClient;
    connectionType: 'primary' | 'replica';
    replicaId?: string;
  }> {
    this.stats.totalQueries++;

    const {
      forceWriteConnection = false,
      preferredRegion,
      maxLagTolerance = 5000, // 5 seconds default
      readPreference = 'replica',
      consistencyLevel = 'eventual'
    } = options;

    try {
      // Always use primary for write operations or when explicitly requested
      if (forceWriteConnection || this.isWriteOperation(options) || consistencyLevel === 'strong') {
        const connection = await replicationManager.getPrimaryConnection();
        this.stats.primaryQueries++;
        this.stats.routingDecisions.forcedPrimary++;
        
        observabilitySystem.recordMetric({
          name: 'connection_routing',
          value: 1,
          category: 'database',
          tags: { type: 'primary', reason: 'write_operation' }
        });

        return {
          connection,
          connectionType: 'primary'
        };
      }

      // For read operations, try to use replicas based on preference
      if (readPreference === 'replica' || readPreference === 'any') {
        const replicaResult = await this.getOptimalReplicaConnection(
          preferredRegion,
          maxLagTolerance
        );

        if (replicaResult) {
          this.stats.replicaQueries++;
          
          observabilitySystem.recordMetric({
            name: 'connection_routing',
            value: 1,
            category: 'database',
            tags: { 
              type: 'replica', 
              replica_id: replicaResult.replicaId,
              reason: replicaResult.reason 
            }
          });

          return {
            connection: replicaResult.connection,
            connectionType: 'replica',
            replicaId: replicaResult.replicaId
          };
        }
      }

      // Fallback to primary if no suitable replica found
      const connection = await replicationManager.getPrimaryConnection();
      this.stats.primaryQueries++;
      this.stats.routingDecisions.noHealthyReplicas++;

      observabilitySystem.recordMetric({
        name: 'connection_routing',
        value: 1,
        category: 'database',
        tags: { type: 'primary', reason: 'replica_fallback' }
      });

      logger.debug('Using primary connection as fallback for read operation');

      return {
        connection,
        connectionType: 'primary'
      };

    } catch (error) {
      logger.error('Error in connection routing:', error);
      throw error;
    }
  }

  private async getOptimalReplicaConnection(
    preferredRegion?: string,
    maxLagTolerance?: number
  ): Promise<{
    connection: PoolClient;
    replicaId: string;
    reason: string;
  } | null> {
    const replicationStatus = replicationManager.getReplicationStatus();
    
    // Filter healthy replicas
    const healthyReplicas = replicationStatus.replicas.filter(replica => 
      replica.isHealthy && 
      replica.isStreaming && 
      replica.state === 'streaming'
    );

    if (healthyReplicas.length === 0) {
      return null;
    }

    // Filter by lag tolerance
    const lowLagReplicas = healthyReplicas.filter(replica => 
      !maxLagTolerance || replica.lagTime <= maxLagTolerance
    );

    if (lowLagReplicas.length === 0) {
      this.stats.routingDecisions.lagTooHigh++;
      logger.debug('All replicas exceed lag tolerance, using primary');
      return null;
    }

    // Prefer replicas in the specified region
    if (preferredRegion) {
      const regionReplicas = lowLagReplicas.filter(replica => {
        const config = replicationManager['config'].replicas.find(c => c.id === replica.id);
        return config?.region === preferredRegion;
      });

      if (regionReplicas.length > 0) {
        const selectedReplica = this.selectReplicaByLoadBalancing(regionReplicas);
        const connection = await replicationManager.getReadOnlyConnection(preferredRegion);
        
        this.stats.routingDecisions.preferredRegion++;
        
        return {
          connection,
          replicaId: selectedReplica.id,
          reason: 'preferred_region'
        };
      }
    }

    // Load balance among available replicas
    const selectedReplica = this.selectReplicaByLoadBalancing(lowLagReplicas);
    const connection = await replicationManager.getReadOnlyConnection();
    
    this.stats.routingDecisions.loadBalanced++;
    
    return {
      connection,
      replicaId: selectedReplica.id,
      reason: 'load_balanced'
    };
  }

  private selectReplicaByLoadBalancing(replicas: any[]): any {
    // Simple round-robin load balancing
    const selectedReplica = replicas[this.loadBalancingIndex % replicas.length];
    this.loadBalancingIndex++;
    
    return selectedReplica;
  }

  private isWriteOperation(options: QueryRoutingOptions): boolean {
    // This is a simplified check. In a real implementation, you might:
    // 1. Parse the SQL query to detect write operations
    // 2. Use query hints or annotations
    // 3. Check the operation context
    
    return options.forceWriteConnection || false;
  }

  // Query execution wrapper with automatic routing
  async executeQuery<T = any>(
    query: string,
    params?: any[],
    options: QueryRoutingOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const { connection, connectionType, replicaId } = await this.getConnection(options);

    try {
      // Detect query type for better routing decisions
      const queryType = this.detectQueryType(query);
      
      // Override options based on query analysis
      if (queryType === 'write' && connectionType === 'replica') {
        logger.warn('Write query detected on replica connection, re-routing to primary');
        connection.release();
        
        const primaryResult = await this.getConnection({ 
          ...options, 
          forceWriteConnection: true 
        });
        
        const result = await primaryResult.connection.query(query, params);
        primaryResult.connection.release();
        
        const duration = Date.now() - startTime;
        this.recordQueryMetrics(query, queryType, 'primary', duration, true);
        
        return result;
      }

      const result = await connection.query(query, params);
      const duration = Date.now() - startTime;
      
      this.recordQueryMetrics(query, queryType, connectionType, duration, true, replicaId);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQueryMetrics(query, 'unknown', connectionType, duration, false, replicaId);
      
      logger.error('Query execution failed:', {
        query: query.substring(0, 100),
        connectionType,
        replicaId,
        error: error.message
      });
      
      throw error;
    } finally {
      connection.release();
    }
  }

  private detectQueryType(query: string): 'read' | 'write' | 'ddl' | 'unknown' {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Write operations
    if (normalizedQuery.match(/^(insert|update|delete|merge)\s/)) {
      return 'write';
    }
    
    // DDL operations
    if (normalizedQuery.match(/^(create|alter|drop|truncate)\s/)) {
      return 'ddl';
    }
    
    // Read operations
    if (normalizedQuery.match(/^(select|with)\s/)) {
      return 'read';
    }
    
    return 'unknown';
  }

  private recordQueryMetrics(
    query: string,
    queryType: string,
    connectionType: string,
    duration: number,
    success: boolean,
    replicaId?: string
  ): void {
    // Extract table name for more detailed metrics
    const tableName = this.extractTableName(query);
    
    observabilitySystem.recordDatabaseQuery(
      queryType.toUpperCase(),
      tableName || 'unknown',
      duration,
      success ? 'success' : 'error'
    );

    observabilitySystem.recordMetric({
      name: 'query_execution_time',
      value: duration,
      category: 'database',
      tags: {
        query_type: queryType,
        connection_type: connectionType,
        replica_id: replicaId || 'none',
        table: tableName || 'unknown'
      }
    });
  }

  private extractTableName(query: string): string | null {
    const normalizedQuery = query.trim().toLowerCase();
    
    // Simple table name extraction (can be improved with proper SQL parsing)
    const patterns = [
      /from\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      /into\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      /update\s+([a-zA-Z_][a-zA-Z0-9_]*)/,
      /delete\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*)/
    ];

    for (const pattern of patterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Transaction support with proper routing
  async executeTransaction<T>(
    transactionFn: (client: PoolClient) => Promise<T>,
    options: QueryRoutingOptions = {}
  ): Promise<T> {
    // Transactions always use primary connection
    const { connection } = await this.getConnection({
      ...options,
      forceWriteConnection: true
    });

    try {
      await connection.query('BEGIN');
      const result = await transactionFn(connection);
      await connection.query('COMMIT');
      
      observabilitySystem.recordMetric({
        name: 'transaction_completed',
        value: 1,
        category: 'database',
        tags: { status: 'success' }
      });
      
      return result;
    } catch (error) {
      await connection.query('ROLLBACK');
      
      observabilitySystem.recordMetric({
        name: 'transaction_completed',
        value: 1,
        category: 'database',
        tags: { status: 'error' }
      });
      
      throw error;
    } finally {
      connection.release();
    }
  }

  // Batch query execution with intelligent routing
  async executeBatch(
    queries: Array<{
      query: string;
      params?: any[];
      options?: QueryRoutingOptions;
    }>
  ): Promise<any[]> {
    const results = [];
    
    // Group queries by routing requirements
    const writeQueries = queries.filter(q => 
      this.detectQueryType(q.query) === 'write' || 
      q.options?.forceWriteConnection
    );
    
    const readQueries = queries.filter(q => 
      this.detectQueryType(q.query) === 'read' && 
      !q.options?.forceWriteConnection
    );

    // Execute write queries on primary
    if (writeQueries.length > 0) {
      const { connection } = await this.getConnection({ forceWriteConnection: true });
      
      try {
        for (const queryInfo of writeQueries) {
          const result = await connection.query(queryInfo.query, queryInfo.params);
          results.push(result);
        }
      } finally {
        connection.release();
      }
    }

    // Execute read queries on replicas (with fallback to primary)
    if (readQueries.length > 0) {
      const { connection } = await this.getConnection({ readPreference: 'replica' });
      
      try {
        for (const queryInfo of readQueries) {
          const result = await connection.query(queryInfo.query, queryInfo.params);
          results.push(result);
        }
      } finally {
        connection.release();
      }
    }

    return results;
  }

  // Health check for connection routing
  async healthCheck(): Promise<{
    status: string;
    stats: ConnectionStats;
    replicationStatus: any;
  }> {
    try {
      const replicationStatus = replicationManager.getReplicationStatus();
      
      return {
        status: 'healthy',
        stats: { ...this.stats },
        replicationStatus
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        stats: { ...this.stats },
        replicationStatus: null
      };
    }
  }

  // Get routing statistics
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      primaryQueries: 0,
      replicaQueries: 0,
      routingDecisions: {
        forcedPrimary: 0,
        lagTooHigh: 0,
        noHealthyReplicas: 0,
        preferredRegion: 0,
        loadBalanced: 0
      }
    };
  }
}

// Export singleton instance
export const connectionRouter = ConnectionRouter.getInstance();

// Convenience functions for common operations
export const executeQuery = <T = any>(
  query: string,
  params?: any[],
  options?: QueryRoutingOptions
): Promise<T> => connectionRouter.executeQuery<T>(query, params, options);

export const executeTransaction = <T>(
  transactionFn: (client: PoolClient) => Promise<T>,
  options?: QueryRoutingOptions
): Promise<T> => connectionRouter.executeTransaction(transactionFn, options);

export const executeBatch = (
  queries: Array<{
    query: string;
    params?: any[];
    options?: QueryRoutingOptions;
  }>
): Promise<any[]> => connectionRouter.executeBatch(queries);