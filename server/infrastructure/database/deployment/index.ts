/**
 * Zero-Downtime Deployment System
 * 
 * Comprehensive zero-downtime deployment and migration system with blue-green deployment
 * strategies, online schema changes, and comprehensive validation.
 */

// Core Components
export { 
  ZeroDowntimeMigrationManager,
  createZeroDowntimeMigrationManager,
  getZeroDowntimeMigrationManager
} from './ZeroDowntimeMigrationManager';

export {
  BlueGreenDeploymentManager,
  createBlueGreenDeploymentManager,
  getBlueGreenDeploymentManager
} from './BlueGreenDeploymentManager';

export {
  DeploymentValidator,
  createDeploymentValidator,
  getDeploymentValidator
} from './DeploymentValidator';

// Types and Interfaces
export type {
  ZeroDowntimeMigrationConfig,
  MigrationOperation,
  MigrationProgress
} from './ZeroDowntimeMigrationManager';

export type {
  BlueGreenConfig,
  DeploymentEnvironment,
  DeploymentPlan,
  DeploymentExecution
} from './BlueGreenDeploymentManager';

export type {
  ValidationConfig,
  ValidationResult,
  ComprehensiveValidationResult
} from './DeploymentValidator';

// Utility Functions
export * from './deployment-utils';

// Default Configurations
export const DEFAULT_ZERO_DOWNTIME_CONFIG = {
  batchSize: 1000,
  maxLockTime: 100,
  progressReportInterval: 10000,
  validationSampleSize: 1000,
  enableBlueGreenDeployment: true,
  switchoverTimeout: 30000,
  rollbackTimeout: 60000,
  enableSafetyChecks: true,
  requireApproval: false,
  maxTableSize: 10 * 1024 * 1024 * 1024, // 10GB
  enableProgressMonitoring: true,
  enablePerformanceMonitoring: true,
  alertOnSlowdown: true
};

export const DEFAULT_BLUE_GREEN_CONFIG = {
  switchoverTimeout: 30000,
  validationTimeout: 300000,
  rollbackTimeout: 60000,
  healthCheckInterval: 10000,
  enableDataConsistencyCheck: true,
  enablePerformanceValidation: true,
  enableFunctionalTesting: true,
  enableRollbackReadiness: true,
  requireManualApproval: false,
  enableAutomaticRollback: true,
  maxFailureThreshold: 3
};

export const DEFAULT_VALIDATION_CONFIG = {
  dataConsistency: {
    enabled: true,
    sampleSize: 1000,
    toleranceThreshold: 0.0001,
    criticalTables: ['users', 'properties', 'transactions', 'land_verification_sessions'],
    checksumValidation: true
  },
  performance: {
    enabled: true,
    baselineMetrics: {
      avgResponseTime: 50,
      p95ResponseTime: 100,
      throughput: 1000,
      errorRate: 0.0001
    },
    toleranceMultiplier: 1.2,
    testDuration: 60000,
    warmupDuration: 10000
  },
  functional: {
    enabled: true,
    testSuites: [],
    parallelExecution: true,
    failFast: false
  },
  schema: {
    enabled: true,
    validateConstraints: true,
    validateIndexes: true,
    validatePermissions: true,
    validateTriggers: true
  },
  rollback: {
    enabled: true,
    testRollbackProcedure: true,
    validateBackupIntegrity: true,
    checkDependencies: true
  }
};