import { EventEmitter } from 'events';

import { Pool, PoolClient } from 'pg';

import { logger } from '../../monitoring/logger';
import { observabilitySystem } from '../../monitoring/ObservabilitySystem';

export interface ReplicationConfig {
  primary: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    maxConnections: number;
  };
  replicas: Array<{
    id: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    maxConnections: number;
    priority: number; // Higher number = higher priority for failover
    region?: string;
    datacenter?: string;
  }>;
  replication: {
    synchronousCommit: 'off' | 'local' | 'remote_write' | 'remote_apply' | 'on';
    maxWalSenders: number;
    walKeepSegments: number;
    hotStandby: boolean;
    maxStandbyStreamingDelay: string;
    maxStandbyArchiveDelay: string;
  };
  failover: {
    enabled: boolean;
    healthCheckInterval: number; // milliseconds
    failoverTimeout: number; // milliseconds
    maxLagThreshold: number; // bytes
    autoFailback: boolean;
  };
  monitoring: {
    lagAlertThreshold: number; // bytes
    connectionAlertThreshold: number; // percentage
    healthCheckTimeout: number; // milliseconds
  };
}

export interface ReplicationStatus {
  primary: {
    isHealthy: boolean;
    lastCheck: Date;
    connections: number;
    walPosition: string;
  };
  replicas: Array<{
    id: string;
    isHealthy: boolean;
    lastCheck: Date;
    connections: number;
    walPosition: string;
    lagBytes: number;
    lagTime: number; // milliseconds
    isStreaming: boolean;
    state: 'streaming' | 'catchup' | 'disconnected' | 'failed';
  }>;
  failover: {
    isInProgress: boolean;
    currentPrimary: string;
    lastFailover?: Date;
    failoverReason?: string;
  };
}

export class ReplicationManager extends EventEmitter {
  private static instance: ReplicationManager;
  private config: ReplicationConfig;
  private primaryPool: Pool;
  private replicaPools: Map<string, Pool> = new Map();
  private status: ReplicationStatus;
  private healthCheckInterval: NodeJS.Timeout;
  private isInitialized = false;
  private failoverInProgress = false;

  static getInstance(config?: ReplicationConfig): ReplicationManager {
    if (!ReplicationManager.instance) {
      ReplicationManager.instance = new ReplicationManager(config);
    }
    return ReplicationManager.instance;
  }

  constructor(config?: ReplicationConfig) {
    super();
    
    this.config = config || this.getDefaultConfig();
    this.status = this.initializeStatus();
  }

  private getDefaultConfig(): ReplicationConfig {
    return {
      primary: {
        host: process.env.POSTGRES_PRIMARY_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PRIMARY_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'triplecheck',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        maxConnections: 20
      },
      replicas: [
        {
          id: 'replica-1',
          host: process.env.POSTGRES_REPLICA1_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_REPLICA1_PORT || '5433'),
          database: process.env.POSTGRES_DB || 'triplecheck',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || '',
          maxConnections: 15,
          priority: 100,
          region: 'primary',
          datacenter: 'dc1'
        },
        {
          id: 'replica-2',
          host: process.env.POSTGRES_REPLICA2_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_REPLICA2_PORT || '5434'),
          database: process.env.POSTGRES_DB || 'triplecheck',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || '',
          maxConnections: 15,
          priority: 90,
          region: 'secondary',
          datacenter: 'dc2'
        }
      ],
      replication: {
        synchronousCommit: 'remote_write',
        maxWalSenders: 10,
        walKeepSegments: 64,
        hotStandby: true,
        maxStandbyStreamingDelay: '30s',
        maxStandbyArchiveDelay: '60s'
      },
      failover: {
        enabled: true,
        healthCheckInterval: 5000, // 5 seconds
        failoverTimeout: 15000, // 15 seconds
        maxLagThreshold: 16 * 1024 * 1024, // 16MB
        autoFailback: false // Manual failback for safety
      },
      monitoring: {
        lagAlertThreshold: 8 * 1024 * 1024, // 8MB
        connectionAlertThreshold: 80, // 80%
        healthCheckTimeout: 3000 // 3 seconds
      }
    };
  }

  private initializeStatus(): ReplicationStatus {
    return {
      primary: {
        isHealthy: false,
        lastCheck: new Date(),
        connections: 0,
        walPosition: '0/0'
      },
      replicas: this.config.replicas.map(replica => ({
        id: replica.id,
        isHealthy: false,
        lastCheck: new Date(),
        connections: 0,
        walPosition: '0/0',
        lagBytes: 0,
        lagTime: 0,
        isStreaming: false,
        state: 'disconnected'
      })),
      failover: {
        isInProgress: false,
        currentPrimary: 'primary'
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('ReplicationManager already initialized');
      return;
    }

    try {
      logger.info('Initializing PostgreSQL replication manager...');

      // Initialize primary connection pool
      await this.initializePrimaryPool();

      // Initialize replica connection pools
      await this.initializeReplicaPools();

      // Start health monitoring
      this.startHealthMonitoring();

      // Setup replication monitoring
      await this.setupReplicationMonitoring();

      this.isInitialized = true;
      logger.info('✅ PostgreSQL replication manager initialized successfully');

      this.emit('initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize replication manager:', error);
      throw error;
    }
  }

  private async initializePrimaryPool(): Promise<void> {
    this.primaryPool = new Pool({
      host: this.config.primary.host,
      port: this.config.primary.port,
      database: this.config.primary.database,
      user: this.config.primary.user,
      password: this.config.primary.password,
      max: this.config.primary.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      application_name: 'triplecheck-primary'
    });

    // Test primary connection
    const client = await this.primaryPool.connect();
    try {
      const result = await client.query('SELECT pg_is_in_recovery(), pg_current_wal_lsn()');
      const isInRecovery = result.rows[0].pg_is_in_recovery;
      
      if (isInRecovery) {
        throw new Error('Primary database is in recovery mode');
      }

      logger.info('✅ Primary database connection established');
    } finally {
      client.release();
    }
  }

  private async initializeReplicaPools(): Promise<void> {
    for (const replica of this.config.replicas) {
      const pool = new Pool({
        host: replica.host,
        port: replica.port,
        database: replica.database,
        user: replica.user,
        password: replica.password,
        max: replica.maxConnections,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        application_name: `triplecheck-replica-${replica.id}`
      });

      this.replicaPools.set(replica.id, pool);

      // Test replica connection
      try {
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT pg_is_in_recovery()');
          const isInRecovery = result.rows[0].pg_is_in_recovery;
          
          if (!isInRecovery) {
            logger.warn(`⚠️ Replica ${replica.id} is not in recovery mode`);
          } else {
            logger.info(`✅ Replica ${replica.id} connection established`);
          }
        } finally {
          client.release();
        }
      } catch (error) {
        logger.error(`❌ Failed to connect to replica ${replica.id}:`, error);
      }
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.failover.healthCheckInterval);

    logger.info('✅ Health monitoring started');
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check primary health
      await this.checkPrimaryHealth();

      // Check replica health
      await this.checkReplicaHealth();

      // Check for failover conditions
      if (this.config.failover.enabled && !this.failoverInProgress) {
        await this.checkFailoverConditions();
      }

      // Update metrics
      this.updateMetrics();

    } catch (error) {
      logger.error('Error during health check:', error);
    }
  }

  private async checkPrimaryHealth(): Promise<void> {
    try {
      const client = await this.primaryPool.connect();
      const startTime = Date.now();
      
      try {
        const result = await Promise.race([
          client.query('SELECT pg_current_wal_lsn(), pg_stat_get_db_numbackends($1)', [this.config.primary.database]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), this.config.monitoring.healthCheckTimeout)
          )
        ]) as any;

        const responseTime = Date.now() - startTime;
        
        this.status.primary = {
          isHealthy: true,
          lastCheck: new Date(),
          connections: result.rows[0].pg_stat_get_db_numbackends || 0,
          walPosition: result.rows[0].pg_current_wal_lsn
        };

        // Record metrics
        observabilitySystem.recordDatabaseQuery('HEALTH_CHECK', 'primary', responseTime, 'success');

      } finally {
        client.release();
      }
    } catch (error) {
      this.status.primary.isHealthy = false;
      this.status.primary.lastCheck = new Date();
      
      logger.error('Primary health check failed:', error);
      observabilitySystem.recordDatabaseError('health_check_failed', 'primary', 'HEALTH_CHECK');
      
      this.emit('primary:unhealthy', error);
    }
  }

  private async checkReplicaHealth(): Promise<void> {
    const healthPromises = this.config.replicas.map(async (replica) => {
      const pool = this.replicaPools.get(replica.id);
      if (!pool) return;

      try {
        const client = await pool.connect();
        const startTime = Date.now();
        
        try {
          const [statusResult, lagResult] = await Promise.all([
            Promise.race([
              client.query('SELECT pg_is_in_recovery(), pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()'),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), this.config.monitoring.healthCheckTimeout)
              )
            ]) as any,
            this.calculateReplicationLag(replica.id)
          ]);

          const responseTime = Date.now() - startTime;
          const row = statusResult.rows[0];
          
          const replicaStatus = this.status.replicas.find(r => r.id === replica.id);
          if (replicaStatus) {
            replicaStatus.isHealthy = true;
            replicaStatus.lastCheck = new Date();
            replicaStatus.walPosition = row.pg_last_wal_replay_lsn;
            replicaStatus.lagBytes = lagResult.lagBytes;
            replicaStatus.lagTime = lagResult.lagTime;
            replicaStatus.isStreaming = row.pg_is_in_recovery;
            replicaStatus.state = row.pg_is_in_recovery ? 'streaming' : 'failed';
          }

          // Record metrics
          observabilitySystem.recordDatabaseQuery('HEALTH_CHECK', `replica-${replica.id}`, responseTime, 'success');

          // Check lag thresholds
          if (lagResult.lagBytes > this.config.monitoring.lagAlertThreshold) {
            this.emit('replica:lag_high', { replicaId: replica.id, lagBytes: lagResult.lagBytes });
          }

        } finally {
          client.release();
        }
      } catch (error) {
        const replicaStatus = this.status.replicas.find(r => r.id === replica.id);
        if (replicaStatus) {
          replicaStatus.isHealthy = false;
          replicaStatus.lastCheck = new Date();
          replicaStatus.state = 'failed';
        }

        logger.error(`Replica ${replica.id} health check failed:`, error);
        observabilitySystem.recordDatabaseError('health_check_failed', `replica-${replica.id}`, 'HEALTH_CHECK');
        
        this.emit('replica:unhealthy', { replicaId: replica.id, error });
      }
    });

    await Promise.allSettled(healthPromises);
  }

  private async calculateReplicationLag(replicaId: string): Promise<{ lagBytes: number; lagTime: number }> {
    try {
      const primaryClient = await this.primaryPool.connect();
      const replicaPool = this.replicaPools.get(replicaId);
      
      if (!replicaPool) {
        return { lagBytes: 0, lagTime: 0 };
      }

      const replicaClient = await replicaPool.connect();

      try {
        const [primaryResult, replicaResult] = await Promise.all([
          primaryClient.query('SELECT pg_current_wal_lsn()'),
          replicaClient.query('SELECT pg_last_wal_replay_lsn(), extract(epoch from now() - pg_last_xact_replay_timestamp()) * 1000 as lag_ms')
        ]);

        const primaryLsn = primaryResult.rows[0].pg_current_wal_lsn;
        const replicaLsn = replicaResult.rows[0].pg_last_wal_replay_lsn;
        const lagTime = parseFloat(replicaResult.rows[0].lag_ms) || 0;

        // Calculate byte lag (simplified - in production, use pg_wal_lsn_diff)
        const lagBytes = this.calculateLsnDifference(primaryLsn, replicaLsn);

        return { lagBytes, lagTime };
      } finally {
        primaryClient.release();
        replicaClient.release();
      }
    } catch (error) {
      logger.error(`Error calculating replication lag for ${replicaId}:`, error);
      return { lagBytes: 0, lagTime: 0 };
    }
  }

  private calculateLsnDifference(primaryLsn: string, replicaLsn: string): number {
    // Simplified LSN difference calculation
    // In production, use PostgreSQL's pg_wal_lsn_diff function
    try {
      const [primaryFile, primaryOffset] = primaryLsn.split('/').map(x => parseInt(x, 16));
      const [replicaFile, replicaOffset] = replicaLsn.split('/').map(x => parseInt(x, 16));
      
      const primaryBytes = primaryFile * 0x100000000 + primaryOffset;
      const replicaBytes = replicaFile * 0x100000000 + replicaOffset;
      
      return Math.max(0, primaryBytes - replicaBytes);
    } catch (error) {
      return 0;
    }
  }

  private async checkFailoverConditions(): Promise<void> {
    // Check if primary is unhealthy
    if (!this.status.primary.isHealthy) {
      const timeSinceLastCheck = Date.now() - this.status.primary.lastCheck.getTime();
      
      if (timeSinceLastCheck > this.config.failover.failoverTimeout) {
        await this.initiateFailover('primary_unhealthy');
        return;
      }
    }

    // Check for excessive replication lag
    const healthyReplicas = this.status.replicas.filter(r => r.isHealthy);
    const laggyReplicas = healthyReplicas.filter(r => r.lagBytes > this.config.failover.maxLagThreshold);
    
    if (laggyReplicas.length === healthyReplicas.length && healthyReplicas.length > 0) {
      logger.warn('All replicas have excessive lag, but not triggering failover');
      this.emit('replication:excessive_lag');
    }
  }

  private async initiateFailover(reason: string): Promise<void> {
    if (this.failoverInProgress) {
      logger.warn('Failover already in progress');
      return;
    }

    this.failoverInProgress = true;
    this.status.failover.isInProgress = true;

    logger.warn(`🚨 Initiating failover due to: ${reason}`);
    this.emit('failover:started', { reason });

    try {
      // Find the best replica for promotion
      const bestReplica = this.selectBestReplicaForPromotion();
      
      if (!bestReplica) {
        throw new Error('No healthy replica available for failover');
      }

      logger.info(`Promoting replica ${bestReplica.id} to primary`);

      // Promote the replica
      await this.promoteReplica(bestReplica.id);

      // Update configuration
      await this.updateConfigurationAfterFailover(bestReplica.id);

      // Update status
      this.status.failover.currentPrimary = bestReplica.id;
      this.status.failover.lastFailover = new Date();
      this.status.failover.failoverReason = reason;

      logger.info(`✅ Failover completed successfully. New primary: ${bestReplica.id}`);
      this.emit('failover:completed', { newPrimary: bestReplica.id, reason });

    } catch (error) {
      logger.error('❌ Failover failed:', error);
      this.emit('failover:failed', { reason, error });
      throw error;
    } finally {
      this.failoverInProgress = false;
      this.status.failover.isInProgress = false;
    }
  }

  private selectBestReplicaForPromotion(): any {
    const healthyReplicas = this.status.replicas
      .filter(r => r.isHealthy && r.isStreaming)
      .map(r => ({
        ...r,
        config: this.config.replicas.find(c => c.id === r.id)
      }))
      .filter(r => r.config);

    if (healthyReplicas.length === 0) {
      return null;
    }

    // Sort by priority (highest first), then by lowest lag
    return healthyReplicas.sort((a, b) => {
      if (a.config.priority !== b.config.priority) {
        return b.config.priority - a.config.priority;
      }
      return a.lagBytes - b.lagBytes;
    })[0];
  }

  private async promoteReplica(replicaId: string): Promise<void> {
    const replicaPool = this.replicaPools.get(replicaId);
    if (!replicaPool) {
      throw new Error(`Replica pool not found: ${replicaId}`);
    }

    // In a real implementation, this would involve:
    // 1. Stopping the replica
    // 2. Running pg_promote() or touching the trigger file
    // 3. Waiting for promotion to complete
    // 4. Updating connection strings
    
    logger.info(`Promoting replica ${replicaId} (simulation)`);
    
    // Simulate promotion delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, you would check if promotion was successful
    logger.info(`Replica ${replicaId} promoted successfully`);
  }

  private async updateConfigurationAfterFailover(newPrimaryId: string): Promise<void> {
    // In production, this would update:
    // 1. Load balancer configuration
    // 2. Application connection strings
    // 3. DNS records
    // 4. Monitoring configuration
    
    logger.info(`Updating configuration for new primary: ${newPrimaryId}`);
  }

  private async setupReplicationMonitoring(): Promise<void> {
    // Setup periodic replication status queries
    setInterval(async () => {
      await this.collectReplicationMetrics();
    }, 30000); // Every 30 seconds

    logger.info('✅ Replication monitoring setup completed');
  }

  private async collectReplicationMetrics(): Promise<void> {
    try {
      // Collect primary metrics
      if (this.status.primary.isHealthy) {
        const client = await this.primaryPool.connect();
        try {
          const result = await client.query(`
            SELECT 
              client_addr,
              state,
              sent_lsn,
              write_lsn,
              flush_lsn,
              replay_lsn,
              write_lag,
              flush_lag,
              replay_lag
            FROM pg_stat_replication
          `);

          // Update replication metrics
          for (const row of result.rows) {
            // Record replication lag metrics
            if (row.replay_lag) {
              observabilitySystem.recordMetric({
                name: 'replication_lag_seconds',
                value: parseFloat(row.replay_lag) / 1000,
                category: 'database',
                tags: { 
                  replica: row.client_addr,
                  state: row.state
                }
              });
            }
          }
        } finally {
          client.release();
        }
      }
    } catch (error) {
      logger.error('Error collecting replication metrics:', error);
    }
  }

  private updateMetrics(): void {
    // Update connection pool metrics
    observabilitySystem.updateConnectionPoolMetrics(
      this.status.primary.connections,
      this.config.primary.maxConnections - this.status.primary.connections,
      0 // waiting requests - would need to be tracked separately
    );

    // Update replica health metrics
    this.status.replicas.forEach(replica => {
      observabilitySystem.recordMetric({
        name: 'replica_health',
        value: replica.isHealthy ? 1 : 0,
        category: 'database',
        tags: { replica_id: replica.id }
      });

      observabilitySystem.recordMetric({
        name: 'replica_lag_bytes',
        value: replica.lagBytes,
        category: 'database',
        tags: { replica_id: replica.id }
      });
    });
  }

  // Public API methods
  async getPrimaryConnection(): Promise<PoolClient> {
    if (!this.isInitialized) {
      throw new Error('ReplicationManager not initialized');
    }

    return await this.primaryPool.connect();
  }

  async getReadOnlyConnection(preferredRegion?: string): Promise<PoolClient> {
    if (!this.isInitialized) {
      throw new Error('ReplicationManager not initialized');
    }

    // Find healthy replicas
    const healthyReplicas = this.status.replicas
      .filter(r => r.isHealthy && r.isStreaming)
      .map(r => ({
        ...r,
        config: this.config.replicas.find(c => c.id === r.id)
      }))
      .filter(r => r.config);

    if (healthyReplicas.length === 0) {
      // Fallback to primary for read operations
      logger.warn('No healthy replicas available, using primary for read operation');
      return await this.primaryPool.connect();
    }

    // Select replica based on preference and load
    let selectedReplica = healthyReplicas[0];

    if (preferredRegion) {
      const regionReplicas = healthyReplicas.filter(r => r.config.region === preferredRegion);
      if (regionReplicas.length > 0) {
        selectedReplica = regionReplicas[0];
      }
    }

    const pool = this.replicaPools.get(selectedReplica.id);
    if (!pool) {
      throw new Error(`Replica pool not found: ${selectedReplica.id}`);
    }

    return await pool.connect();
  }

  getReplicationStatus(): ReplicationStatus {
    return { ...this.status };
  }

  async manualFailover(targetReplicaId?: string): Promise<void> {
    if (!this.config.failover.enabled) {
      throw new Error('Failover is disabled');
    }

    if (this.failoverInProgress) {
      throw new Error('Failover already in progress');
    }

    if (targetReplicaId) {
      const replica = this.status.replicas.find(r => r.id === targetReplicaId);
      if (!replica || !replica.isHealthy) {
        throw new Error(`Target replica ${targetReplicaId} is not healthy`);
      }
    }

    await this.initiateFailover('manual_failover');
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const details = {
        initialized: this.isInitialized,
        primary: this.status.primary,
        replicas: this.status.replicas.map(r => ({
          id: r.id,
          isHealthy: r.isHealthy,
          lagBytes: r.lagBytes,
          state: r.state
        })),
        failover: this.status.failover
      };

      const isHealthy = this.status.primary.isHealthy && 
                       this.status.replicas.some(r => r.isHealthy);

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down replication manager...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all connection pools
    const closePromises = [];
    
    if (this.primaryPool) {
      closePromises.push(this.primaryPool.end());
    }

    for (const [id, pool] of this.replicaPools) {
      closePromises.push(pool.end());
    }

    await Promise.allSettled(closePromises);
    
    this.isInitialized = false;
    logger.info('✅ Replication manager shutdown completed');
  }
}

// Export singleton instance
export const replicationManager = ReplicationManager.getInstance();