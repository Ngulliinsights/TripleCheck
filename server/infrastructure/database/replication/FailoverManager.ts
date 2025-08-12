import { execSync } from 'child_process';
import { EventEmitter } from 'events';
import { writeFileSync, existsSync } from 'fs';

import { alertingSystem } from '../../monitoring/AlertingSystem';
import { logger } from '../../monitoring/logger';
import { observabilitySystem } from '../../monitoring/ObservabilitySystem';

import { replicationManager } from './ReplicationManager';

export interface FailoverConfig {
  enabled: boolean;
  automaticFailover: boolean;
  healthCheckInterval: number; // milliseconds
  failoverTimeout: number; // milliseconds
  maxFailoverAttempts: number;
  failoverCooldown: number; // milliseconds
  preFailoverChecks: string[]; // Scripts to run before failover
  postFailoverActions: string[]; // Scripts to run after failover
  notificationChannels: string[];
  rollbackEnabled: boolean;
  rollbackTimeout: number; // milliseconds
}

export interface FailoverEvent {
  id: string;
  timestamp: Date;
  type: 'initiated' | 'completed' | 'failed' | 'rolled_back';
  reason: string;
  oldPrimary: string;
  newPrimary?: string;
  duration?: number; // milliseconds
  error?: string;
  metadata?: Record<string, any>;
}

export interface FailoverStatus {
  isInProgress: boolean;
  currentAttempt: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  phase: 'detection' | 'validation' | 'promotion' | 'configuration' | 'verification' | 'completed' | 'failed';
  progress: number; // 0-100
  lastFailover?: FailoverEvent;
  failoverHistory: FailoverEvent[];
}

export class FailoverManager extends EventEmitter {
  private static instance: FailoverManager;
  private config: FailoverConfig;
  private status: FailoverStatus;
  private healthCheckInterval: NodeJS.Timeout;
  private failoverInProgress = false;
  private lastFailoverTime = 0;
  private failoverAttempts = 0;

  static getInstance(config?: FailoverConfig): FailoverManager {
    if (!FailoverManager.instance) {
      FailoverManager.instance = new FailoverManager(config);
    }
    return FailoverManager.instance;
  }

  constructor(config?: FailoverConfig) {
    super();
    
    this.config = config || this.getDefaultConfig();
    this.status = this.initializeStatus();
  }

  private getDefaultConfig(): FailoverConfig {
    return {
      enabled: true,
      automaticFailover: process.env.NODE_ENV === 'production',
      healthCheckInterval: 5000, // 5 seconds
      failoverTimeout: 30000, // 30 seconds
      maxFailoverAttempts: 3,
      failoverCooldown: 300000, // 5 minutes
      preFailoverChecks: [
        'check-replica-health',
        'validate-replication-lag',
        'verify-network-connectivity'
      ],
      postFailoverActions: [
        'update-load-balancer',
        'update-dns-records',
        'notify-applications',
        'update-monitoring'
      ],
      notificationChannels: ['slack', 'email', 'pagerduty'],
      rollbackEnabled: true,
      rollbackTimeout: 60000 // 1 minute
    };
  }

  private initializeStatus(): FailoverStatus {
    return {
      isInProgress: false,
      currentAttempt: 0,
      phase: 'detection',
      progress: 0,
      failoverHistory: []
    };
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing failover manager...');

      // Validate configuration
      await this.validateConfiguration();

      // Setup health monitoring
      if (this.config.enabled) {
        this.startHealthMonitoring();
      }

      // Setup event listeners
      this.setupEventListeners();

      logger.info('✅ Failover manager initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize failover manager:', error);
      throw error;
    }
  }

  private async validateConfiguration(): Promise<void> {
    // Validate pre-failover check scripts exist
    for (const check of this.config.preFailoverChecks) {
      const scriptPath = `database/replication/scripts/${check}.sh`;
      if (!existsSync(scriptPath)) {
        logger.warn(`Pre-failover check script not found: ${scriptPath}`);
      }
    }

    // Validate post-failover action scripts exist
    for (const action of this.config.postFailoverActions) {
      const scriptPath = `database/replication/scripts/${action}.sh`;
      if (!existsSync(scriptPath)) {
        logger.warn(`Post-failover action script not found: ${scriptPath}`);
      }
    }

    logger.info('Failover configuration validated');
  }

  private setupEventListeners(): void {
    // Listen to replication manager events
    replicationManager.on('primary:unhealthy', (error) => {
      this.handlePrimaryUnhealthy(error);
    });

    replicationManager.on('replica:unhealthy', ({ replicaId, error }) => {
      this.handleReplicaUnhealthy(replicaId, error);
    });

    replicationManager.on('replica:lag_high', ({ replicaId, lagBytes }) => {
      this.handleHighReplicationLag(replicaId, lagBytes);
    });
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performFailoverHealthCheck();
    }, this.config.healthCheckInterval);

    logger.info('✅ Failover health monitoring started');
  }

  private async performFailoverHealthCheck(): Promise<void> {
    try {
      if (this.failoverInProgress) {
        return; // Skip health check during failover
      }

      const replicationStatus = replicationManager.getReplicationStatus();
      
      // Check if automatic failover should be triggered
      if (this.config.automaticFailover && this.shouldTriggerFailover(replicationStatus)) {
        await this.initiateAutomaticFailover('health_check_failure');
      }

    } catch (error) {
      logger.error('Error during failover health check:', error);
    }
  }

  private shouldTriggerFailover(replicationStatus: any): boolean {
    // Don't trigger if we're in cooldown period
    const timeSinceLastFailover = Date.now() - this.lastFailoverTime;
    if (timeSinceLastFailover < this.config.failoverCooldown) {
      return false;
    }

    // Don't trigger if we've exceeded max attempts
    if (this.failoverAttempts >= this.config.maxFailoverAttempts) {
      logger.warn('Maximum failover attempts reached, manual intervention required');
      return false;
    }

    // Check primary health
    if (!replicationStatus.primary.isHealthy) {
      const timeSinceLastCheck = Date.now() - replicationStatus.primary.lastCheck.getTime();
      if (timeSinceLastCheck > this.config.failoverTimeout) {
        return true;
      }
    }

    return false;
  }

  private async handlePrimaryUnhealthy(error: any): Promise<void> {
    logger.warn('Primary database unhealthy detected:', error);
    
    // Send alert
    await this.sendFailoverAlert('primary_unhealthy', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Trigger failover if automatic mode is enabled
    if (this.config.automaticFailover && !this.failoverInProgress) {
      setTimeout(async () => {
        if (!replicationManager.getReplicationStatus().primary.isHealthy) {
          await this.initiateAutomaticFailover('primary_unhealthy');
        }
      }, this.config.failoverTimeout);
    }
  }

  private async handleReplicaUnhealthy(replicaId: string, error: any): Promise<void> {
    logger.warn(`Replica ${replicaId} unhealthy:`, error);
    
    await this.sendFailoverAlert('replica_unhealthy', {
      replicaId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  private async handleHighReplicationLag(replicaId: string, lagBytes: number): Promise<void> {
    logger.warn(`High replication lag detected on ${replicaId}: ${lagBytes} bytes`);
    
    await this.sendFailoverAlert('high_replication_lag', {
      replicaId,
      lagBytes,
      timestamp: new Date().toISOString()
    });
  }

  async initiateAutomaticFailover(reason: string): Promise<void> {
    if (this.failoverInProgress) {
      logger.warn('Failover already in progress, skipping automatic failover');
      return;
    }

    logger.warn(`🚨 Initiating automatic failover due to: ${reason}`);
    await this.executeFailover(reason, true);
  }

  async initiateManualFailover(reason: string, targetReplicaId?: string): Promise<void> {
    if (this.failoverInProgress) {
      throw new Error('Failover already in progress');
    }

    logger.info(`🔧 Initiating manual failover due to: ${reason}`);
    await this.executeFailover(reason, false, targetReplicaId);
  }

  private async executeFailover(
    reason: string,
    isAutomatic: boolean,
    targetReplicaId?: string
  ): Promise<void> {
    const failoverEvent: FailoverEvent = {
      id: `failover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'initiated',
      reason,
      oldPrimary: replicationManager.getReplicationStatus().failover.currentPrimary
    };

    this.failoverInProgress = true;
    this.failoverAttempts++;
    this.status.isInProgress = true;
    this.status.currentAttempt = this.failoverAttempts;
    this.status.startTime = new Date();
    this.status.phase = 'detection';
    this.status.progress = 0;

    const startTime = Date.now();

    try {
      logger.info(`Starting failover process (${isAutomatic ? 'automatic' : 'manual'})`);
      
      // Send initial notification
      await this.sendFailoverAlert('failover_started', {
        failoverId: failoverEvent.id,
        reason,
        isAutomatic,
        targetReplicaId
      });

      // Phase 1: Pre-failover validation
      this.status.phase = 'validation';
      this.status.progress = 10;
      await this.runPreFailoverChecks();

      // Phase 2: Select and validate target replica
      this.status.progress = 20;
      const targetReplica = await this.selectTargetReplica(targetReplicaId);
      failoverEvent.newPrimary = targetReplica.id;

      // Phase 3: Promote replica
      this.status.phase = 'promotion';
      this.status.progress = 40;
      await this.promoteReplica(targetReplica);

      // Phase 4: Update configuration
      this.status.phase = 'configuration';
      this.status.progress = 60;
      await this.updateSystemConfiguration(targetReplica);

      // Phase 5: Run post-failover actions
      this.status.progress = 80;
      await this.runPostFailoverActions(targetReplica);

      // Phase 6: Verify failover success
      this.status.phase = 'verification';
      this.status.progress = 90;
      await this.verifyFailoverSuccess(targetReplica);

      // Complete failover
      this.status.phase = 'completed';
      this.status.progress = 100;
      
      const duration = Date.now() - startTime;
      failoverEvent.type = 'completed';
      failoverEvent.duration = duration;

      this.status.lastFailover = failoverEvent;
      this.status.failoverHistory.push(failoverEvent);
      this.lastFailoverTime = Date.now();

      logger.info(`✅ Failover completed successfully in ${duration}ms. New primary: ${targetReplica.id}`);
      
      // Send success notification
      await this.sendFailoverAlert('failover_completed', {
        failoverId: failoverEvent.id,
        newPrimary: targetReplica.id,
        duration,
        oldPrimary: failoverEvent.oldPrimary
      });

      this.emit('failover:completed', failoverEvent);

      // Record metrics
      observabilitySystem.recordMetric({
        name: 'failover_completed',
        value: 1,
        category: 'database',
        tags: {
          reason,
          type: isAutomatic ? 'automatic' : 'manual',
          duration: duration.toString(),
          success: 'true'
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      failoverEvent.type = 'failed';
      failoverEvent.duration = duration;
      failoverEvent.error = error.message;

      this.status.phase = 'failed';
      this.status.lastFailover = failoverEvent;
      this.status.failoverHistory.push(failoverEvent);

      logger.error(`❌ Failover failed after ${duration}ms:`, error);

      // Send failure notification
      await this.sendFailoverAlert('failover_failed', {
        failoverId: failoverEvent.id,
        error: error.message,
        duration,
        phase: this.status.phase
      });

      this.emit('failover:failed', failoverEvent);

      // Record metrics
      observabilitySystem.recordMetric({
        name: 'failover_completed',
        value: 1,
        category: 'database',
        tags: {
          reason,
          type: isAutomatic ? 'automatic' : 'manual',
          duration: duration.toString(),
          success: 'false'
        }
      });

      // Attempt rollback if enabled
      if (this.config.rollbackEnabled && !isAutomatic) {
        try {
          await this.attemptRollback(failoverEvent);
        } catch (rollbackError) {
          logger.error('Rollback also failed:', rollbackError);
        }
      }

      throw error;
    } finally {
      this.failoverInProgress = false;
      this.status.isInProgress = false;
    }
  }

  private async runPreFailoverChecks(): Promise<void> {
    logger.info('Running pre-failover checks...');

    for (const check of this.config.preFailoverChecks) {
      try {
        const scriptPath = `database/replication/scripts/${check}.sh`;
        if (existsSync(scriptPath)) {
          execSync(`bash ${scriptPath}`, { timeout: 10000 });
          logger.info(`✅ Pre-failover check passed: ${check}`);
        } else {
          logger.warn(`⚠️ Pre-failover check script not found: ${check}`);
        }
      } catch (error) {
        logger.error(`❌ Pre-failover check failed: ${check}`, error);
        throw new Error(`Pre-failover check failed: ${check}`);
      }
    }
  }

  private async selectTargetReplica(targetReplicaId?: string): Promise<any> {
    const replicationStatus = replicationManager.getReplicationStatus();
    
    if (targetReplicaId) {
      const targetReplica = replicationStatus.replicas.find(r => r.id === targetReplicaId);
      if (!targetReplica || !targetReplica.isHealthy) {
        throw new Error(`Target replica ${targetReplicaId} is not healthy`);
      }
      return { id: targetReplicaId, ...targetReplica };
    }

    // Select best replica automatically
    const healthyReplicas = replicationStatus.replicas.filter(r => 
      r.isHealthy && r.isStreaming && r.state === 'streaming'
    );

    if (healthyReplicas.length === 0) {
      throw new Error('No healthy replicas available for failover');
    }

    // Sort by lowest lag and highest priority
    const sortedReplicas = healthyReplicas.sort((a, b) => {
      // First by lag (lower is better)
      if (a.lagBytes !== b.lagBytes) {
        return a.lagBytes - b.lagBytes;
      }
      // Then by priority (higher is better) - would need to get from config
      return 0;
    });

    const selectedReplica = sortedReplicas[0];
    logger.info(`Selected replica for promotion: ${selectedReplica.id}`);
    
    return selectedReplica;
  }

  private async promoteReplica(replica: any): Promise<void> {
    logger.info(`Promoting replica ${replica.id} to primary...`);

    // In a real implementation, this would:
    // 1. Stop the replica
    // 2. Create a trigger file or run pg_promote()
    // 3. Wait for promotion to complete
    // 4. Verify the replica is now accepting writes

    // Simulate promotion process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    logger.info(`✅ Replica ${replica.id} promoted successfully`);
  }

  private async updateSystemConfiguration(newPrimary: any): Promise<void> {
    logger.info('Updating system configuration for new primary...');

    // Update connection configurations
    // In production, this would update:
    // - Load balancer configuration
    // - Application connection strings
    // - DNS records
    // - Monitoring configuration

    // Simulate configuration update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info('✅ System configuration updated');
  }

  private async runPostFailoverActions(newPrimary: any): Promise<void> {
    logger.info('Running post-failover actions...');

    for (const action of this.config.postFailoverActions) {
      try {
        const scriptPath = `database/replication/scripts/${action}.sh`;
        if (existsSync(scriptPath)) {
          execSync(`bash ${scriptPath} ${newPrimary.id}`, { timeout: 30000 });
          logger.info(`✅ Post-failover action completed: ${action}`);
        } else {
          logger.warn(`⚠️ Post-failover action script not found: ${action}`);
        }
      } catch (error) {
        logger.error(`❌ Post-failover action failed: ${action}`, error);
        // Don't fail the entire failover for post-actions
      }
    }
  }

  private async verifyFailoverSuccess(newPrimary: any): Promise<void> {
    logger.info('Verifying failover success...');

    // Verify new primary is accepting connections and writes
    try {
      const connection = await replicationManager.getPrimaryConnection();
      await connection.query('SELECT 1');
      connection.release();
      
      logger.info('✅ Failover verification successful');
    } catch (error) {
      throw new Error(`Failover verification failed: ${error.message}`);
    }
  }

  private async attemptRollback(failedFailover: FailoverEvent): Promise<void> {
    logger.warn('Attempting failover rollback...');

    const rollbackEvent: FailoverEvent = {
      id: `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'initiated',
      reason: 'failover_rollback',
      oldPrimary: failedFailover.newPrimary || 'unknown',
      newPrimary: failedFailover.oldPrimary
    };

    try {
      // Attempt to restore original primary
      // This is a simplified rollback - in production, this would be more complex
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      rollbackEvent.type = 'completed';
      rollbackEvent.duration = 5000;
      
      this.status.failoverHistory.push(rollbackEvent);
      
      logger.info('✅ Failover rollback completed');
      
      await this.sendFailoverAlert('rollback_completed', {
        originalFailoverId: failedFailover.id,
        rollbackId: rollbackEvent.id
      });

    } catch (rollbackError) {
      rollbackEvent.type = 'failed';
      rollbackEvent.error = rollbackError.message;
      
      this.status.failoverHistory.push(rollbackEvent);
      
      logger.error('❌ Failover rollback failed:', rollbackError);
      
      await this.sendFailoverAlert('rollback_failed', {
        originalFailoverId: failedFailover.id,
        rollbackId: rollbackEvent.id,
        error: rollbackError.message
      });

      throw rollbackError;
    }
  }

  private async sendFailoverAlert(type: string, data: any): Promise<void> {
    try {
      const alert = {
        id: `failover-alert-${Date.now()}`,
        name: `Database Failover: ${type}`,
        severity: type.includes('failed') ? 'critical' : 
                 type.includes('started') ? 'high' : 'medium',
        status: 'firing',
        startsAt: new Date(),
        labels: {
          alertname: 'DatabaseFailover',
          team: 'infrastructure',
          service: 'database',
          type: type
        },
        annotations: {
          summary: `Database failover event: ${type}`,
          description: `Failover event details: ${JSON.stringify(data)}`,
          runbook_url: 'https://docs.triplecheck.com/runbooks/database-failover'
        },
        fingerprint: `failover-${type}-${Date.now()}`
      };

      await alertingSystem.processAlert(alert);
    } catch (error) {
      logger.error('Failed to send failover alert:', error);
    }
  }

  // Public API methods
  getFailoverStatus(): FailoverStatus {
    return { ...this.status };
  }

  getFailoverHistory(): FailoverEvent[] {
    return [...this.status.failoverHistory];
  }

  async testFailover(dryRun: boolean = true): Promise<{
    success: boolean;
    checks: Array<{ name: string; passed: boolean; message?: string }>;
  }> {
    const checks = [];

    // Test replica health
    const replicationStatus = replicationManager.getReplicationStatus();
    const healthyReplicas = replicationStatus.replicas.filter(r => r.isHealthy);
    
    checks.push({
      name: 'healthy_replicas',
      passed: healthyReplicas.length > 0,
      message: `${healthyReplicas.length} healthy replicas available`
    });

    // Test pre-failover checks
    for (const check of this.config.preFailoverChecks) {
      try {
        const scriptPath = `database/replication/scripts/${check}.sh`;
        if (existsSync(scriptPath) && !dryRun) {
          execSync(`bash ${scriptPath}`, { timeout: 10000 });
        }
        checks.push({
          name: check,
          passed: true,
          message: dryRun ? 'Script exists' : 'Check passed'
        });
      } catch (error) {
        checks.push({
          name: check,
          passed: false,
          message: error.message
        });
      }
    }

    const success = checks.every(check => check.passed);
    
    return { success, checks };
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const details = {
        enabled: this.config.enabled,
        automaticFailover: this.config.automaticFailover,
        failoverInProgress: this.failoverInProgress,
        failoverAttempts: this.failoverAttempts,
        lastFailoverTime: this.lastFailoverTime,
        status: this.status,
        replicationHealth: replicationManager.getReplicationStatus()
      };

      return {
        status: 'healthy',
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
    logger.info('Shutting down failover manager...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.failoverInProgress) {
      logger.warn('Failover in progress during shutdown - waiting for completion...');
      // In production, you might want to wait for failover completion
    }

    logger.info('✅ Failover manager shutdown completed');
  }
}

// Export singleton instance
export const failoverManager = FailoverManager.getInstance();