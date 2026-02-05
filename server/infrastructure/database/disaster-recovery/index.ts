/**
 * Disaster Recovery System - Main Export
 * 
 * Comprehensive disaster recovery system for TripleCheck database infrastructure
 */

export { ComprehensiveDisasterRecovery } from './ComprehensiveDisasterRecovery';
export { BackupManager } from './BackupManager';
export { DisasterRecoveryManager } from './DisasterRecoveryManager';

export type {
  ComprehensiveDisasterRecoveryConfig,
  DisasterScenario,
  RecoveryStep,
  ValidationCheck,
  RollbackStep,
  DisasterRecoveryExecution,
  DisasterRecoveryReport
} from './ComprehensiveDisasterRecovery';

export type {
  BackupConfig,
  BackupJob,
  BackupValidationResult
} from './BackupManager';

export type {
  DisasterRecoveryConfig,
  BackupMetadata,
  RecoveryPlan,
  RecoveryExecution
} from './DisasterRecoveryManager';

// Default configuration for quick setup
export const defaultDisasterRecoveryConfig: Partial<ComprehensiveDisasterRecoveryConfig> = {
  recovery: {
    rpoMinutes: 5,
    rtoMinutes: 15,
    enableWALArchiving: true,
    enablePointInTimeRecovery: true,
    retentionDays: 30,
    testingSchedule: {
      backupValidation: 'daily',
      pointInTimeRecovery: 'weekly',
      fullDisasterRecovery: 'monthly'
    }
  },
  monitoring: {
    enableHealthChecks: true,
    checkIntervalSeconds: 60,
    alerting: {
      enabled: true,
      channels: []
    },
    thresholds: {
      backupAge: 25,
      walArchiveLag: 10,
      replicationLag: 30,
      diskUsage: 85,
      connectionFailures: 3
    }
  },
  automation: {
    enableAutomatedFailover: false,
    enableAutomatedRecovery: false,
    enableAutomatedTesting: true,
    maxAutomatedActions: 5,
    requireManualApproval: true
  }
};

/**
 * Quick setup function for disaster recovery system
 */
export async function setupDisasterRecovery(
  config: ComprehensiveDisasterRecoveryConfig
): Promise<ComprehensiveDisasterRecovery> {
  const drSystem = new ComprehensiveDisasterRecovery(config);
  await drSystem.initialize();
  return drSystem;
}

/**
 * Utility function to validate disaster recovery configuration
 */
export function validateDisasterRecoveryConfig(
  config: ComprehensiveDisasterRecoveryConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate database configuration
  if (!config.database?.primary?.host) {
    errors.push('Primary database host is required');
  }

  if (!config.database?.primary?.database) {
    errors.push('Primary database name is required');
  }

  // Validate storage configuration
  if (!config.storage?.local?.path) {
    errors.push('Local storage path is required');
  }

  // Validate recovery objectives
  if (config.recovery?.rpoMinutes && config.recovery.rpoMinutes < 1) {
    errors.push('RPO must be at least 1 minute');
  }

  if (config.recovery?.rtoMinutes && config.recovery.rtoMinutes < 5) {
    errors.push('RTO must be at least 5 minutes');
  }

  // Validate monitoring thresholds
  if (config.monitoring?.thresholds?.diskUsage && 
      (config.monitoring.thresholds.diskUsage < 50 || config.monitoring.thresholds.diskUsage > 95)) {
    errors.push('Disk usage threshold must be between 50% and 95%');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Utility function to get disaster recovery system status
 */
export interface DisasterRecoverySystemStatus {
  initialized: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastBackup?: Date;
  activeRecoveries: number;
  automationEnabled: boolean;
  monitoringEnabled: boolean;
}

/**
 * Create a disaster recovery system status summary
 */
export function createStatusSummary(drSystem: ComprehensiveDisasterRecovery): DisasterRecoverySystemStatus {
  // This would be implemented to return actual system status
  return {
    initialized: true,
    healthStatus: 'healthy',
    activeRecoveries: 0,
    automationEnabled: false,
    monitoringEnabled: true
  };
}