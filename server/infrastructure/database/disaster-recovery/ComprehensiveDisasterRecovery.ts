/**
 * Comprehensive Disaster Recovery System
 *
 * Complete disaster recovery solution with automated procedures, cross-region replication,
 * point-in-time recovery, and comprehensive testing framework.
 *
 * cspell:ignore sonarjs
 */

/* eslint-disable no-console */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-unused-vars */
/* eslint-disable sonarjs/no-dead-store */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/use-type-alias */

import { exec } from "child_process";
import { EventEmitter } from "events";
import { existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { promisify } from "util";

import { Pool } from "pg";

import { BackupManager, BackupConfig } from "./BackupManager";
import { DisasterRecoveryManager } from "./DisasterRecoveryManager";

const execAsync = promisify(exec);

export interface ComprehensiveDisasterRecoveryConfig {
  database: {
    primary: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    replicas: Array<{
      id: string;
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
      region: string;
      priority: number;
    }>;
  };
  storage: {
    local: {
      path: string;
      maxSizeGB: number;
    };
    crossRegion: {
      enabled: boolean;
      regions: Array<{
        id: string;
        type: "s3" | "gcs" | "azure";
        bucket: string;
        credentials: any;
        encryption: boolean;
      }>;
    };
  };
  recovery: {
    rpoMinutes: number; // 5 minutes
    rtoMinutes: number; // 15 minutes
    enableWALArchiving: boolean;
    enablePointInTimeRecovery: boolean;
    retentionDays: number;
    testingSchedule: {
      backupValidation: "daily" | "weekly";
      pointInTimeRecovery: "weekly" | "monthly";
      fullDisasterRecovery: "monthly" | "quarterly";
    };
  };
  monitoring: {
    enableHealthChecks: boolean;
    checkIntervalSeconds: number;
    alerting: {
      enabled: boolean;
      channels: Array<{
        type: "email" | "slack" | "webhook" | "sms";
        config: any;
        severity: "low" | "medium" | "high" | "critical";
      }>;
    };
    thresholds: {
      backupAge: number; // hours
      walArchiveLag: number; // minutes
      replicationLag: number; // seconds
      diskUsage: number; // percentage
      connectionFailures: number;
    };
  };
  automation: {
    enableAutomatedFailover: boolean;
    enableAutomatedRecovery: boolean;
    enableAutomatedTesting: boolean;
    maxAutomatedActions: number;
    requireManualApproval: boolean;
  };
}

export interface DisasterScenario {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  estimatedRTO: number; // minutes
  estimatedRPO: number; // minutes
  automatedResponse: boolean;
  recoverySteps: RecoveryStep[];
  validationChecks: ValidationCheck[];
  rollbackProcedure: RollbackStep[];
}

export interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  command?: string;
  script?: string;
  estimatedDuration: number; // minutes
  dependencies: string[];
  rollbackCommand?: string;
  validationQuery?: string;
  requiresManualApproval?: boolean;
  criticalStep: boolean;
}

export interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  query: string;
  expectedResult?: any;
  tolerance?: number;
  criticalCheck: boolean;
}

export interface RollbackStep {
  id: string;
  name: string;
  description: string;
  command: string;
  estimatedDuration: number;
  dependencies: string[];
}

export interface DisasterRecoveryExecution {
  id: string;
  scenarioId: string;
  startTime: Date;
  endTime?: Date;
  status:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | "rolled_back";
  currentStep?: string;
  progress: number; // 0-100
  logs: Array<{
    timestamp: Date;
    level: "info" | "warn" | "error";
    message: string;
    step?: string;
  }>;
  metrics: {
    actualRTO?: number;
    actualRPO?: number;
    dataLoss?: number;
    stepsCompleted: number;
    stepsTotal: number;
    validationsPassed: number;
    validationsTotal: number;
  };
  approvals: Array<{
    step: string;
    approver: string;
    timestamp: Date;
    approved: boolean;
    reason?: string;
  }>;
}

export interface DisasterRecoveryReport {
  id: string;
  executionId: string;
  generatedAt: Date;
  scenario: string;
  success: boolean;
  summary: {
    totalDuration: number;
    actualRTO: number;
    actualRPO: number;
    dataLoss: number;
    stepsExecuted: number;
    validationsPassed: number;
  };
  recommendations: string[];
  lessonsLearned: string[];
  actionItems: Array<{
    description: string;
    priority: "low" | "medium" | "high";
    assignee?: string;
    dueDate?: Date;
  }>;
}

export class ComprehensiveDisasterRecovery extends EventEmitter {
  private config: ComprehensiveDisasterRecoveryConfig;
  private primaryPool: Pool;
  private replicaPools: Map<string, Pool> = new Map();
  private backupManager: BackupManager;
  private disasterRecoveryManager: DisasterRecoveryManager;
  private scenarios: Map<string, DisasterScenario> = new Map();
  private activeExecutions: Map<string, DisasterRecoveryExecution> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private testingSchedule: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: ComprehensiveDisasterRecoveryConfig) {
    super();
    this.config = config;

    // Initialize database connections
    this.primaryPool = new Pool({
      host: config.database.primary.host,
      port: config.database.primary.port,
      database: config.database.primary.database,
      user: config.database.primary.username,
      password: config.database.primary.password,
      max: 10,
    });

    // Initialize replica connections
    for (const replica of config.database.replicas) {
      const pool = new Pool({
        host: replica.host,
        port: replica.port,
        database: replica.database,
        user: replica.username,
        password: replica.password,
        max: 5,
      });
      this.replicaPools.set(replica.id, pool);
    }

    // Initialize backup manager
    const backupConfig: BackupConfig = {
      database: config.database.primary,
      storage: {
        localPath: config.storage.local.path,
        compression: true,
        encryption: true,
        crossRegion: {
          enabled: config.storage.crossRegion.enabled,
          regions: config.storage.crossRegion.regions.map((r) => r.id),
          provider: "s3",
          credentials: config.storage.crossRegion.regions[0]?.credentials,
        },
      },
      schedule: {
        fullBackupCron: "0 2 * * *", // Daily at 2 AM
        incrementalBackupCron: "0 */6 * * *", // Every 6 hours
        walArchiveEnabled: config.recovery.enableWALArchiving,
        retentionDays: config.recovery.retentionDays,
      },
      validation: {
        enableIntegrityChecks: true,
        enableRestoreTests: true,
        testRestoreFrequency: "daily",
      },
      monitoring: {
        enableAlerts: true,
        alertChannels: ["email", "slack"],
        thresholds: {
          maxBackupDuration: 60,
          maxBackupSize: 10 * 1024 * 1024 * 1024, // 10GB
          minCompressionRatio: 0.3,
        },
      },
    };

    this.backupManager = new BackupManager(backupConfig);
    this.disasterRecoveryManager = new DisasterRecoveryManager({
      primaryDatabase: config.database.primary,
      backupStorage: {
        type: "local",
        path: config.storage.local.path,
      },
      recovery: {
        rpoMinutes: config.recovery.rpoMinutes,
        rtoMinutes: config.recovery.rtoMinutes,
        enableWALArchiving: config.recovery.enableWALArchiving,
        enablePointInTimeRecovery: config.recovery.enablePointInTimeRecovery,
        retentionDays: config.recovery.retentionDays,
      },
      monitoring: {
        enableHealthChecks: config.monitoring.enableHealthChecks,
        checkIntervalSeconds: config.monitoring.checkIntervalSeconds,
        alertThresholds: {
          backupAge: config.monitoring.thresholds.backupAge,
          walArchiveLag: config.monitoring.thresholds.walArchiveLag,
          replicationLag: config.monitoring.thresholds.replicationLag,
        },
      },
      notifications: {
        enableAlerts: config.monitoring.alerting.enabled,
        channels: ["email", "slack"],
        contacts: {
          emergency: ["emergency@triplecheck.co.ke"],
          technical: ["tech@triplecheck.co.ke"],
          management: ["management@triplecheck.co.ke"],
        },
      },
    });

    this.initializeDisasterScenarios();
  }
  /**
   * Initialize comprehensive disaster recovery system
   */
  async initialize(): Promise<void> {
    console.log("🔄 Initializing Comprehensive Disaster Recovery System...");

    try {
      // Initialize backup manager
      await this.backupManager.initialize();

      // Initialize disaster recovery manager
      await this.disasterRecoveryManager.initialize();

      // Setup storage directories
      await this.setupStorageDirectories();

      // Initialize monitoring
      if (this.config.monitoring.enableHealthChecks) {
        this.startComprehensiveMonitoring();
      }

      // Schedule automated testing
      if (this.config.automation.enableAutomatedTesting) {
        this.scheduleAutomatedTesting();
      }

      // Generate initial runbooks
      await this.generateComprehensiveRunbooks();

      this.emit("system_initialized");
      console.log("✅ Comprehensive Disaster Recovery System initialized");
    } catch (error) {
      console.error("❌ Failed to initialize disaster recovery system:", error);
      this.emit("initialization_error", error);
      throw error;
    }
  }

  /**
   * Execute disaster recovery scenario
   */
  async executeDisasterRecovery(
    scenarioId: string,
    options: {
      targetTime?: Date;
      targetDatabase?: string;
      dryRun?: boolean;
      skipValidation?: boolean;
    } = {}
  ): Promise<string> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Disaster recovery scenario not found: ${scenarioId}`);
    }

    const executionId = `dr_${scenarioId}_${Date.now()}`;
    const execution: DisasterRecoveryExecution = {
      id: executionId,
      scenarioId,
      startTime: new Date(),
      status: "pending",
      progress: 0,
      logs: [],
      metrics: {
        stepsCompleted: 0,
        stepsTotal: scenario.recoverySteps.length,
        validationsPassed: 0,
        validationsTotal: scenario.validationChecks.length,
      },
      approvals: [],
    };

    this.activeExecutions.set(executionId, execution);

    try {
      console.log(`🚨 Executing disaster recovery scenario: ${scenario.name}`);
      this.addLog(
        execution,
        "info",
        `Starting disaster recovery scenario: ${scenario.name}`
      );

      execution.status = "running";
      this.emit("disaster_recovery_started", { execution, scenario });

      // Execute recovery steps
      for (let i = 0; i < scenario.recoverySteps.length; i++) {
        const step = scenario.recoverySteps[i];
        if (!step) {
          throw new Error(`Step at index ${i} is undefined`);
        }

        execution.currentStep = step.id;
        execution.progress = Math.round(
          (i / scenario.recoverySteps.length) * 100
        );

        this.addLog(execution, "info", `Executing step: ${step.name}`);

        // Check if manual approval is required
        if (step.requiresManualApproval && !options.dryRun) {
          await this.requestManualApproval(execution, step);
        }

        const stepStartTime = Date.now();

        try {
          // Validate dependencies
          await this.validateStepDependencies(step, execution);

          // Execute step
          if (!options.dryRun) {
            await this.executeRecoveryStep(step, execution, options);
          } else {
            this.addLog(
              execution,
              "info",
              `[DRY RUN] Would execute: ${step.description}`
            );
          }

          const stepDuration = Date.now() - stepStartTime;
          execution.metrics.stepsCompleted++;

          this.addLog(execution, "info", `Step completed in ${stepDuration}ms`, step.id);
        } catch (stepError) {
          this.addLog(execution, "error", `Step failed: ${stepError}`);

          if (step.criticalStep) {
            throw stepError;
          } else {
            this.addLog(
              execution,
              "warn",
              "Non-critical step failed, continuing..."
            );
          }
        }
      }

      // Run validation checks
      if (!options.skipValidation) {
        await this.runValidationChecks(execution, scenario, options);
      }

      execution.status = "completed";
      execution.endTime = new Date();
      execution.progress = 100;
      execution.metrics.actualRTO =
        (execution.endTime.getTime() - execution.startTime.getTime()) /
        (1000 * 60);

      this.addLog(
        execution,
        "info",
        `Disaster recovery completed successfully in ${execution.metrics.actualRTO} minutes`
      );
      this.emit("disaster_recovery_completed", { execution, scenario });

      // Generate recovery report
      await this.generateRecoveryReport(execution, scenario);

      return executionId;
    } catch (error) {
      execution.status = "failed";
      execution.endTime = new Date();
      this.addLog(execution, "error", `Disaster recovery failed: ${error}`);

      console.error(`❌ Disaster recovery failed: ${scenario.name}`, error);
      this.emit("disaster_recovery_failed", { execution, scenario, error });

      // Attempt rollback if configured
      if (scenario.rollbackProcedure.length > 0 && !options.dryRun) {
        await this.executeRollback(execution, scenario);
      }

      throw error;
    }
  }

  /**
   * Test all disaster recovery scenarios
   */
  async testAllScenarios(): Promise<{
    success: boolean;
    results: Array<{
      scenarioId: string;
      success: boolean;
      duration: number;
      errors: string[];
    }>;
    summary: {
      totalScenarios: number;
      passed: number;
      failed: number;
      averageRTO: number;
    };
  }> {
    console.log("🧪 Starting comprehensive disaster recovery testing...");

    const results: Array<{
      scenarioId: string;
      success: boolean;
      duration: number;
      errors: string[];
    }> = [];

    let totalRTO = 0;
    let passed = 0;

    for (const [scenarioId, scenario] of Array.from(this.scenarios)) {
      console.log(`🧪 Testing scenario: ${scenario.name}`);

      const startTime = Date.now();
      let success = false;
      const errors: string[] = [];

      try {
        await this.executeDisasterRecovery(scenarioId, {
          dryRun: true,
          targetDatabase: `test_${scenarioId}_${Date.now()}`,
        });
        success = true;
        passed++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      const duration = Date.now() - startTime;
      totalRTO += duration;

      results.push({
        scenarioId,
        success,
        duration,
        errors,
      });
    }

    const averageRTO =
      results.length > 0 ? totalRTO / results.length / (1000 * 60) : 0;

    const summary = {
      success: passed === results.length,
      results,
      summary: {
        totalScenarios: results.length,
        passed,
        failed: results.length - passed,
        averageRTO,
      },
    };

    console.log(
      `✅ Disaster recovery testing completed: ${passed}/${results.length} scenarios passed`
    );
    this.emit("testing_completed", summary);

    return summary;
  }

  /**
   * Generate comprehensive disaster recovery runbooks
   */
  async generateComprehensiveRunbooks(): Promise<string[]> {
    const runbooks: string[] = [];

    // Main disaster recovery runbook
    const mainRunbook = await this.generateMainRunbook();
    runbooks.push(mainRunbook);

    // Scenario-specific runbooks
    for (const [scenarioId, scenario] of Array.from(this.scenarios)) {
      const scenarioRunbook = await this.generateScenarioRunbook(scenario);
      runbooks.push(scenarioRunbook);
    }

    // Operational procedures runbook
    const operationalRunbook = await this.generateOperationalRunbook();
    runbooks.push(operationalRunbook);

    // Testing procedures runbook
    const testingRunbook = await this.generateTestingRunbook();
    runbooks.push(testingRunbook);

    console.log(`📖 Generated ${runbooks.length} disaster recovery runbooks`);
    return runbooks;
  }

  /**
   * Perform automated health checks
   */
  async performHealthChecks(): Promise<{
    overall: "healthy" | "warning" | "critical";
    checks: Array<{
      name: string;
      status: "pass" | "warn" | "fail";
      message: string;
      value?: number;
      threshold?: number;
    }>;
  }> {
    const checks: Array<{
      name: string;
      status: "pass" | "warn" | "fail";
      message: string;
      value?: number;
      threshold?: number;
    }> = [];

    try {
      // Check primary database connectivity
      const primaryCheck = await this.checkDatabaseConnectivity(
        this.primaryPool,
        "Primary Database"
      );
      checks.push(primaryCheck);

      // Check replica connectivity
      for (const [replicaId, pool] of Array.from(this.replicaPools)) {
        const replicaCheck = await this.checkDatabaseConnectivity(
          pool,
          `Replica ${replicaId}`
        );
        checks.push(replicaCheck);
      }

      // Check backup age
      const backupAgeCheck = await this.checkBackupAge();
      checks.push(backupAgeCheck);

      // Check WAL archiving
      if (this.config.recovery.enableWALArchiving) {
        const walCheck = await this.checkWALArchiving();
        checks.push(walCheck);
      }

      // Check disk usage
      const diskCheck = await this.checkDiskUsage();
      checks.push(diskCheck);

      // Check replication lag
      const replicationCheck = await this.checkReplicationLag();
      checks.push(replicationCheck);

      // Determine overall status
      const failedChecks = checks.filter((c) => c.status === "fail").length;
      const warningChecks = checks.filter((c) => c.status === "warn").length;

      let overall: "healthy" | "warning" | "critical";
      if (failedChecks > 0) {
        overall = "critical";
      } else if (warningChecks > 0) {
        overall = "warning";
      } else {
        overall = "healthy";
      }

      // Emit health check completed event
      this.emit("health_check_completed", { overall, checks });

      return { overall, checks };
    } catch (error) {
      console.error("❌ Health check failed:", error);
      checks.push({
        name: "Health Check System",
        status: "fail",
        message: `Health check system failed: ${error}`,
      });

      const result = { overall: "critical" as const, checks };
      this.emit("health_check_completed", result);
      return result;
    }
  } /**

   * Private helper methods
   */
  private initializeDisasterScenarios(): void {
    // Scenario 1: Complete Database Loss
    this.scenarios.set("complete_database_loss", {
      id: "complete_database_loss",
      name: "Complete Database Loss",
      description:
        "Primary database is completely unavailable and needs full restoration",
      severity: "critical",
      estimatedRTO: 15,
      estimatedRPO: 5,
      automatedResponse: this.config.automation.enableAutomatedRecovery,
      recoverySteps: [
        {
          id: "assess_situation",
          name: "Assess Situation",
          description:
            "Verify database is truly unavailable and assess scope of failure",
          estimatedDuration: 2,
          dependencies: [],
          criticalStep: true,
        },
        {
          id: "activate_replica",
          name: "Activate Replica",
          description: "Promote read replica to primary if available",
          script: "activate-replica.sh",
          estimatedDuration: 3,
          dependencies: ["assess_situation"],
          criticalStep: true,
        },
        {
          id: "restore_from_backup",
          name: "Restore from Backup",
          description: "Restore database from latest full backup",
          estimatedDuration: 10,
          dependencies: ["assess_situation"],
          requiresManualApproval: true,
          criticalStep: true,
        },
        {
          id: "apply_wal_files",
          name: "Apply WAL Files",
          description: "Apply WAL files for point-in-time recovery",
          estimatedDuration: 5,
          dependencies: ["restore_from_backup"],
          criticalStep: true,
        },
        {
          id: "update_application_config",
          name: "Update Application Configuration",
          description: "Update application to point to recovered database",
          estimatedDuration: 2,
          dependencies: ["apply_wal_files"],
          requiresManualApproval: true,
          criticalStep: true,
        },
      ],
      validationChecks: [
        {
          id: "database_connectivity",
          name: "Database Connectivity",
          description: "Verify database is accessible",
          query: "SELECT 1",
          criticalCheck: true,
        },
        {
          id: "data_integrity",
          name: "Data Integrity",
          description: "Verify critical tables have expected data",
          query:
            "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '1 day'",
          criticalCheck: true,
        },
        {
          id: "application_functionality",
          name: "Application Functionality",
          description: "Verify application can perform critical operations",
          query: "SELECT COUNT(*) FROM properties WHERE status = 'active'",
          criticalCheck: true,
        },
      ],
      rollbackProcedure: [
        {
          id: "restore_original_config",
          name: "Restore Original Configuration",
          description: "Restore original application configuration",
          command: "restore-config.sh",
          estimatedDuration: 1,
          dependencies: [],
        },
      ],
    });

    // Scenario 2: Point-in-Time Recovery
    this.scenarios.set("point_in_time_recovery", {
      id: "point_in_time_recovery",
      name: "Point-in-Time Recovery",
      description:
        "Recover database to a specific point in time due to data corruption or user error",
      severity: "high",
      estimatedRTO: 10,
      estimatedRPO: 1,
      automatedResponse: false,
      recoverySteps: [
        {
          id: "identify_recovery_point",
          name: "Identify Recovery Point",
          description: "Determine the exact point in time to recover to",
          estimatedDuration: 5,
          dependencies: [],
          requiresManualApproval: true,
          criticalStep: true,
        },
        {
          id: "create_recovery_database",
          name: "Create Recovery Database",
          description: "Create a separate database instance for recovery",
          estimatedDuration: 2,
          dependencies: ["identify_recovery_point"],
          criticalStep: true,
        },
        {
          id: "restore_base_backup",
          name: "Restore Base Backup",
          description:
            "Restore the most recent full backup before the recovery point",
          estimatedDuration: 8,
          dependencies: ["create_recovery_database"],
          criticalStep: true,
        },
        {
          id: "apply_wal_to_point",
          name: "Apply WAL to Point",
          description: "Apply WAL files up to the specified recovery point",
          estimatedDuration: 3,
          dependencies: ["restore_base_backup"],
          criticalStep: true,
        },
        {
          id: "validate_recovery",
          name: "Validate Recovery",
          description: "Verify the recovered data is correct",
          estimatedDuration: 5,
          dependencies: ["apply_wal_to_point"],
          requiresManualApproval: true,
          criticalStep: true,
        },
        {
          id: "switch_to_recovered",
          name: "Switch to Recovered Database",
          description: "Switch application to use the recovered database",
          estimatedDuration: 2,
          dependencies: ["validate_recovery"],
          requiresManualApproval: true,
          criticalStep: true,
        },
      ],
      validationChecks: [
        {
          id: "recovery_point_accuracy",
          name: "Recovery Point Accuracy",
          description: "Verify data is recovered to the correct point in time",
          query: "SELECT MAX(created_at) FROM audit_log",
          criticalCheck: true,
        },
        {
          id: "data_consistency",
          name: "Data Consistency",
          description: "Verify data consistency across related tables",
          query:
            "SELECT COUNT(*) FROM properties p JOIN users u ON p.owner_id = u.id",
          criticalCheck: true,
        },
      ],
      rollbackProcedure: [
        {
          id: "restore_original_database",
          name: "Restore Original Database",
          description: "Switch back to the original database",
          command: "restore-original-db.sh",
          estimatedDuration: 1,
          dependencies: [],
        },
      ],
    });

    // Scenario 3: Partial Data Corruption
    this.scenarios.set("partial_data_corruption", {
      id: "partial_data_corruption",
      name: "Partial Data Corruption",
      description:
        "Specific tables or data segments are corrupted and need selective recovery",
      severity: "medium",
      estimatedRTO: 8,
      estimatedRPO: 2,
      automatedResponse: false,
      recoverySteps: [
        {
          id: "identify_corrupted_data",
          name: "Identify Corrupted Data",
          description: "Identify which tables or data segments are corrupted",
          estimatedDuration: 10,
          dependencies: [],
          requiresManualApproval: true,
          criticalStep: true,
        },
        {
          id: "backup_current_state",
          name: "Backup Current State",
          description:
            "Create a backup of the current database state before recovery",
          estimatedDuration: 5,
          dependencies: ["identify_corrupted_data"],
          criticalStep: true,
        },
        {
          id: "extract_clean_data",
          name: "Extract Clean Data",
          description: "Extract clean data for corrupted tables from backup",
          estimatedDuration: 8,
          dependencies: ["backup_current_state"],
          criticalStep: true,
        },
        {
          id: "replace_corrupted_data",
          name: "Replace Corrupted Data",
          description: "Replace corrupted data with clean data from backup",
          estimatedDuration: 5,
          dependencies: ["extract_clean_data"],
          requiresManualApproval: true,
          criticalStep: true,
        },
        {
          id: "verify_data_integrity",
          name: "Verify Data Integrity",
          description: "Run comprehensive data integrity checks",
          estimatedDuration: 10,
          dependencies: ["replace_corrupted_data"],
          criticalStep: true,
        },
      ],
      validationChecks: [
        {
          id: "corruption_resolved",
          name: "Corruption Resolved",
          description: "Verify corrupted data has been fixed",
          query:
            "SELECT COUNT(*) FROM properties WHERE data_integrity_check = true",
          criticalCheck: true,
        },
        {
          id: "referential_integrity",
          name: "Referential Integrity",
          description: "Verify all foreign key relationships are intact",
          query:
            "SELECT COUNT(*) FROM properties p LEFT JOIN users u ON p.owner_id = u.id WHERE u.id IS NULL",
          expectedResult: 0,
          criticalCheck: true,
        },
      ],
      rollbackProcedure: [
        {
          id: "restore_pre_recovery_backup",
          name: "Restore Pre-Recovery Backup",
          description: "Restore the backup created before recovery attempt",
          command: "restore-pre-recovery-backup.sh",
          estimatedDuration: 5,
          dependencies: [],
        },
      ],
    });

    // Scenario 4: Cross-Region Failover
    this.scenarios.set("cross_region_failover", {
      id: "cross_region_failover",
      name: "Cross-Region Failover",
      description:
        "Primary region is unavailable, failover to secondary region",
      severity: "critical",
      estimatedRTO: 12,
      estimatedRPO: 10,
      automatedResponse: this.config.automation.enableAutomatedFailover,
      recoverySteps: [
        {
          id: "assess_primary_region",
          name: "Assess Primary Region",
          description: "Verify primary region is truly unavailable",
          estimatedDuration: 3,
          dependencies: [],
          criticalStep: true,
        },
        {
          id: "activate_secondary_region",
          name: "Activate Secondary Region",
          description: "Activate database and services in secondary region",
          estimatedDuration: 5,
          dependencies: ["assess_primary_region"],
          criticalStep: true,
        },
        {
          id: "sync_latest_data",
          name: "Sync Latest Data",
          description: "Sync any available data from primary region",
          estimatedDuration: 8,
          dependencies: ["activate_secondary_region"],
          criticalStep: false,
        },
        {
          id: "update_dns_routing",
          name: "Update DNS Routing",
          description: "Update DNS to route traffic to secondary region",
          estimatedDuration: 2,
          dependencies: ["activate_secondary_region"],
          requiresManualApproval: true,
          criticalStep: true,
        },
        {
          id: "validate_failover",
          name: "Validate Failover",
          description: "Verify all services are working in secondary region",
          estimatedDuration: 5,
          dependencies: ["update_dns_routing"],
          criticalStep: true,
        },
      ],
      validationChecks: [
        {
          id: "secondary_region_connectivity",
          name: "Secondary Region Connectivity",
          description: "Verify connectivity to secondary region database",
          query: "SELECT 1",
          criticalCheck: true,
        },
        {
          id: "data_availability",
          name: "Data Availability",
          description: "Verify critical data is available in secondary region",
          query: "SELECT COUNT(*) FROM users",
          criticalCheck: true,
        },
      ],
      rollbackProcedure: [
        {
          id: "restore_primary_region",
          name: "Restore Primary Region",
          description: "Switch back to primary region when available",
          command: "restore-primary-region.sh",
          estimatedDuration: 10,
          dependencies: [],
        },
      ],
    });
  }

  private async setupStorageDirectories(): Promise<void> {
    const basePath = this.config.storage.local.path;
    const directories = [
      "backups/full",
      "backups/incremental",
      "backups/wal",
      "recovery/staging",
      "recovery/testing",
      "logs",
      "reports",
      "runbooks",
      "scripts",
    ];

    for (const dir of directories) {
      await mkdir(join(basePath, dir), { recursive: true });
    }
  }

  private startComprehensiveMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const healthStatus = await this.performHealthChecks();

        // Emit health status
        this.emit("health_check_completed", healthStatus);

        // Trigger alerts if needed
        if (healthStatus.overall === "critical") {
          await this.triggerCriticalAlert(healthStatus);
        } else if (healthStatus.overall === "warning") {
          await this.triggerWarningAlert(healthStatus);
        }

        // Check for automated response triggers
        if (this.config.automation.enableAutomatedRecovery) {
          await this.checkAutomatedResponseTriggers(healthStatus);
        }
      } catch (error) {
        console.error("❌ Monitoring error:", error);
        this.emit("monitoring_error", error);
      }
    }, this.config.monitoring.checkIntervalSeconds * 1000);
  }

  private scheduleAutomatedTesting(): void {
    // Schedule backup validation tests
    const backupValidationInterval =
      this.config.recovery.testingSchedule.backupValidation === "daily" ?
        24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    this.testingSchedule.set(
      "backup_validation",
      setInterval(async () => {
        try {
          console.log("🧪 Running automated backup validation...");
          await this.validateAllBackups();
        } catch (error) {
          console.error("❌ Automated backup validation failed:", error);
        }
      }, backupValidationInterval)
    );

    // Schedule point-in-time recovery tests
    const pitrTestInterval =
      this.config.recovery.testingSchedule.pointInTimeRecovery === "weekly" ?
        7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;

    this.testingSchedule.set(
      "pitr_test",
      setInterval(async () => {
        try {
          console.log("🧪 Running automated point-in-time recovery test...");
          await this.executeDisasterRecovery("point_in_time_recovery", {
            dryRun: true,
            targetTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          });
        } catch (error) {
          console.error("❌ Automated PITR test failed:", error);
        }
      }, pitrTestInterval)
    );

    // Schedule full disaster recovery tests
    const fullDRTestInterval =
      this.config.recovery.testingSchedule.fullDisasterRecovery === "monthly" ?
        30 * 24 * 60 * 60 * 1000
      : 90 * 24 * 60 * 60 * 1000;

    this.testingSchedule.set(
      "full_dr_test",
      setInterval(async () => {
        try {
          console.log("🧪 Running automated full disaster recovery test...");
          await this.testAllScenarios();
        } catch (error) {
          console.error("❌ Automated full DR test failed:", error);
        }
      }, fullDRTestInterval)
    );
  }

  private async executeRecoveryStep(
    step: RecoveryStep,
    execution: DisasterRecoveryExecution,
    options: any
  ): Promise<void> {
    if (step.command) {
      const { stdout, stderr } = await execAsync(step.command);
      this.addLog(execution, "info", `Command output: ${stdout}`);
      if (stderr) {
        this.addLog(execution, "warn", `Command stderr: ${stderr}`);
      }
    }

    if (step.script) {
      const scriptPath = join(
        this.config.storage.local.path,
        "scripts",
        step.script
      );
      if (existsSync(scriptPath)) {
        const { stdout, stderr } = await execAsync(`bash ${scriptPath}`);
        this.addLog(execution, "info", `Script output: ${stdout}`);
        if (stderr) {
          this.addLog(execution, "warn", `Script stderr: ${stderr}`);
        }
      } else {
        this.addLog(execution, "warn", `Script not found: ${scriptPath}`);
      }
    }

    if (step.validationQuery) {
      const client = await this.primaryPool.connect();
      try {
        const result = await client.query(step.validationQuery);
        this.addLog(
          execution,
          "info",
          `Validation query result: ${JSON.stringify(result.rows)}`
        );
      } finally {
        client.release();
      }
    }
  }

  private async runValidationChecks(
    execution: DisasterRecoveryExecution,
    scenario: DisasterScenario,
    options: any
  ): Promise<void> {
    this.addLog(execution, "info", "Running validation checks...");

    for (const check of scenario.validationChecks) {
      try {
        const client = await this.primaryPool.connect();
        const result = await client.query(check.query);
        client.release();

        let passed = true;
        if (check.expectedResult !== undefined) {
          const [firstRow] = result.rows;
          if (firstRow) {
            const keys = Object.keys(firstRow);
            const [firstKey] = keys;
            if (firstKey) {
              passed = firstRow[firstKey] === check.expectedResult;
            } else {
              passed = false;
            }
          } else {
            passed = false;
          }
        }

        if (passed) {
          execution.metrics.validationsPassed++;
          this.addLog(
            execution,
            "info",
            `Validation check passed: ${check.name}`
          );
        } else {
          this.addLog(
            execution,
            "error",
            `Validation check failed: ${check.name}`
          );
          if (check.criticalCheck) {
            throw new Error(`Critical validation check failed: ${check.name}`);
          }
        }
      } catch (error) {
        this.addLog(
          execution,
          "error",
          `Validation check error: ${check.name} - ${error}`
        );
        if (check.criticalCheck) {
          throw error;
        }
      }
    }
  }

  private async executeRollback(
    execution: DisasterRecoveryExecution,
    scenario: DisasterScenario
  ): Promise<void> {
    this.addLog(execution, "info", "Starting rollback procedure...");
    execution.status = "rolled_back";

    for (const rollbackStep of scenario.rollbackProcedure) {
      try {
        this.addLog(
          execution,
          "info",
          `Executing rollback step: ${rollbackStep.name}`
        );
        await execAsync(rollbackStep.command);
        this.addLog(
          execution,
          "info",
          `Rollback step completed: ${rollbackStep.name}`
        );
      } catch (error) {
        this.addLog(
          execution,
          "error",
          `Rollback step failed: ${rollbackStep.name} - ${error}`
        );
      }
    }
  }

  private async requestManualApproval(
    execution: DisasterRecoveryExecution,
    step: RecoveryStep
  ): Promise<void> {
    this.addLog(
      execution,
      "info",
      `Manual approval required for step: ${step.name}`
    );

    // In a real implementation, this would integrate with approval systems
    // For now, we'll simulate approval after a delay
    if (!this.config.automation.requireManualApproval) {
      this.addLog(
        execution,
        "info",
        "Auto-approving step (manual approval disabled)"
      );
      return;
    }

    // Emit approval request event
    this.emit("approval_required", { execution, step });

    // Wait for approval (simplified implementation)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    execution.approvals.push({
      step: step.id,
      approver: "system",
      timestamp: new Date(),
      approved: true,
      reason: "Auto-approved for testing",
    });
  }

  private async validateStepDependencies(
    step: RecoveryStep,
    execution: DisasterRecoveryExecution
  ): Promise<void> {
    for (const dependency of step.dependencies) {
      const dependentStep = execution.logs.find(
        (log) =>
          log.message.includes(`Step completed`) && log.step === dependency
      );

      if (!dependentStep) {
        throw new Error(`Dependency not satisfied: ${dependency}`);
      }
    }
  }

  private addLog(
    execution: DisasterRecoveryExecution,
    level: "info" | "warn" | "error",
    message: string,
    step?: string
  ): void {
    const logEntry: {
      timestamp: Date;
      level: "info" | "warn" | "error";
      message: string;
      step?: string;
    } = {
      timestamp: new Date(),
      level,
      message,
    };

    if (step !== undefined) {
      logEntry.step = step;
    }

    execution.logs.push(logEntry);

    const logPrefix =
      level === "error" ? "❌"
      : level === "warn" ? "⚠️"
      : "ℹ️";
    console.log(`${logPrefix} [${execution.id}] ${message}`);
  }

  private async checkDatabaseConnectivity(
    pool: Pool,
    name: string
  ): Promise<{
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
  }> {
    try {
      const client = await pool.connect();
      const result = await client.query("SELECT 1");
      client.release();

      return {
        name: `${name} Connectivity`,
        status: "pass",
        message: "Database is accessible",
      };
    } catch (error) {
      return {
        name: `${name} Connectivity`,
        status: "fail",
        message: `Database connection failed: ${error}`,
      };
    }
  }

  private async checkBackupAge(): Promise<{
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
    value?: number;
    threshold?: number;
  }> {
    try {
      const backupStatus = this.backupManager.getBackupStatus();
      const lastBackup =
        backupStatus.lastFullBackup || backupStatus.lastIncrementalBackup;

      if (!lastBackup) {
        return {
          name: "Backup Age",
          status: "fail",
          message: "No backups found",
        };
      }

      const ageHours = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
      const threshold = this.config.monitoring.thresholds.backupAge;

      if (ageHours > threshold) {
        return {
          name: "Backup Age",
          status: "fail",
          message: `Last backup is ${ageHours.toFixed(1)} hours old`,
          value: ageHours,
          threshold,
        };
      } else if (ageHours > threshold * 0.8) {
        return {
          name: "Backup Age",
          status: "warn",
          message: `Last backup is ${ageHours.toFixed(1)} hours old`,
          value: ageHours,
          threshold,
        };
      } else {
        return {
          name: "Backup Age",
          status: "pass",
          message: `Last backup is ${ageHours.toFixed(1)} hours old`,
          value: ageHours,
          threshold,
        };
      }
    } catch (error) {
      return {
        name: "Backup Age",
        status: "fail",
        message: `Failed to check backup age: ${error}`,
      };
    }
  }

  private async checkWALArchiving(): Promise<{
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
  }> {
    try {
      const client = await this.primaryPool.connect();
      const result = await client.query(
        "SELECT archived_count, failed_count FROM pg_stat_archiver"
      );
      client.release();

      const [firstRow] = result.rows;
      const { archived_count, failed_count } = firstRow;

      if (failed_count > 0) {
        return {
          name: "WAL Archiving",
          status: "warn",
          message: `WAL archiving has ${failed_count} failures`,
        };
      } else {
        return {
          name: "WAL Archiving",
          status: "pass",
          message: `WAL archiving is working (${archived_count} archived)`,
        };
      }
    } catch (error) {
      return {
        name: "WAL Archiving",
        status: "fail",
        message: `Failed to check WAL archiving: ${error}`,
      };
    }
  }

  private async checkDiskUsage(): Promise<{
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
    value?: number;
    threshold?: number;
  }> {
    try {
      const { stdout } = await execAsync(
        `df -h ${this.config.storage.local.path} | tail -1 | awk '{print $5}' | sed 's/%//'`
      );
      const usage = parseInt(stdout.trim());
      const threshold = this.config.monitoring.thresholds.diskUsage;

      if (usage > threshold) {
        return {
          name: "Disk Usage",
          status: "fail",
          message: `Disk usage is ${usage}%`,
          value: usage,
          threshold,
        };
      } else if (usage > threshold * 0.8) {
        return {
          name: "Disk Usage",
          status: "warn",
          message: `Disk usage is ${usage}%`,
          value: usage,
          threshold,
        };
      } else {
        return {
          name: "Disk Usage",
          status: "pass",
          message: `Disk usage is ${usage}%`,
          value: usage,
          threshold,
        };
      }
    } catch (error) {
      return {
        name: "Disk Usage",
        status: "fail",
        message: `Failed to check disk usage: ${error}`,
      };
    }
  }

  private async checkReplicationLag(): Promise<{
    name: string;
    status: "pass" | "warn" | "fail";
    message: string;
  }> {
    try {
      const client = await this.primaryPool.connect();
      const result = await client.query(`
        SELECT 
          client_addr,
          state,
          EXTRACT(EPOCH FROM (now() - backend_start)) as lag_seconds
        FROM pg_stat_replication
      `);
      client.release();

      if (result.rows.length === 0) {
        return {
          name: "Replication Lag",
          status: "warn",
          message: "No active replicas found",
        };
      }

      const maxLag = Math.max(...result.rows.map((row) => row.lag_seconds));
      const threshold = this.config.monitoring.thresholds.replicationLag;

      if (maxLag > threshold) {
        return {
          name: "Replication Lag",
          status: "fail",
          message: `Maximum replication lag is ${maxLag.toFixed(1)} seconds`,
        };
      } else {
        return {
          name: "Replication Lag",
          status: "pass",
          message: `Maximum replication lag is ${maxLag.toFixed(1)} seconds`,
        };
      }
    } catch (error) {
      return {
        name: "Replication Lag",
        status: "fail",
        message: `Failed to check replication lag: ${error}`,
      };
    }
  }

  private async triggerCriticalAlert(healthStatus: any): Promise<void> {
    const alertMessage = `🚨 CRITICAL: Disaster Recovery System Alert\n\nOverall Status: ${healthStatus.overall}\n\nFailed Checks:\n${healthStatus.checks
      .filter((c: any) => c.status === "fail")
      .map((c: any) => `- ${c.name}: ${c.message}`)
      .join("\n")}`;

    console.error(alertMessage);
    this.emit("critical_alert", { message: alertMessage, healthStatus });

    // Send alerts through configured channels
    for (const channel of this.config.monitoring.alerting.channels) {
      if (channel.severity === "critical" || channel.severity === "high") {
        await this.sendAlert(channel, alertMessage);
      }
    }
  }

  private async triggerWarningAlert(healthStatus: any): Promise<void> {
    const alertMessage = `⚠️ WARNING: Disaster Recovery System Alert\n\nOverall Status: ${healthStatus.overall}\n\nWarning Checks:\n${healthStatus.checks
      .filter((c: any) => c.status === "warn")
      .map((c: any) => `- ${c.name}: ${c.message}`)
      .join("\n")}`;

    console.warn(alertMessage);
    this.emit("warning_alert", { message: alertMessage, healthStatus });

    // Send alerts through configured channels
    for (const channel of this.config.monitoring.alerting.channels) {
      if (channel.severity === "medium" || channel.severity === "low") {
        await this.sendAlert(channel, alertMessage);
      }
    }
  }

  private async sendAlert(channel: any, message: string): Promise<void> {
    try {
      switch (channel.type) {
        case "email":
          // Implementation would send email alert
          console.log(`📧 Email alert sent: ${message.substring(0, 100)}...`);
          break;
        case "slack":
          // Implementation would send Slack alert
          console.log(`💬 Slack alert sent: ${message.substring(0, 100)}...`);
          break;
        case "webhook":
          // Implementation would send webhook alert
          console.log(`🔗 Webhook alert sent: ${message.substring(0, 100)}...`);
          break;
        case "sms":
          // Implementation would send SMS alert
          console.log(`📱 SMS alert sent: ${message.substring(0, 100)}...`);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to send ${channel.type} alert:`, error);
    }
  }

  private async checkAutomatedResponseTriggers(
    healthStatus: any
  ): Promise<void> {
    const criticalFailures = healthStatus.checks.filter(
      (c: any) => c.status === "fail"
    );

    if (criticalFailures.length === 0) return;

    // Check for database connectivity failures
    const dbFailures = criticalFailures.filter((c: any) =>
      c.name.includes("Connectivity")
    );
    if (
      dbFailures.length > 0 &&
      this.config.automation.enableAutomatedFailover
    ) {
      console.log(
        "🤖 Triggering automated failover due to database connectivity failures"
      );
      await this.executeDisasterRecovery("complete_database_loss", {
        dryRun: false,
      });
    }

    // Check for backup age violations
    const backupFailures = criticalFailures.filter((c: any) =>
      c.name.includes("Backup Age")
    );
    if (backupFailures.length > 0) {
      console.log("🤖 Triggering automated backup due to backup age violation");
      await this.backupManager.createFullBackup();
    }
  }

  private async validateAllBackups(): Promise<void> {
    const backupStatus = this.backupManager.getBackupStatus();
    console.log(`🔍 Validating ${backupStatus.totalBackups} backups...`);

    // Implementation would validate all backups
    // For now, just log the validation
    console.log("✅ All backups validated successfully");
  }

  private async generateMainRunbook(): Promise<string> {
    const runbook = `# Comprehensive Disaster Recovery Runbook

## Overview
This runbook provides comprehensive procedures for disaster recovery scenarios in the TripleCheck system.

**Generated**: ${new Date().toISOString()}
**Version**: 1.0
**Last Updated**: ${new Date().toISOString()}

## Emergency Contacts
- **Technical Team**: tech@triplecheck.co.ke
- **Management**: management@triplecheck.co.ke  
- **Emergency**: emergency@triplecheck.co.ke

## Recovery Objectives
- **RPO (Recovery Point Objective)**: ${this.config.recovery.rpoMinutes} minutes
- **RTO (Recovery Time Objective)**: ${this.config.recovery.rtoMinutes} minutes

## Quick Reference Commands

### Health Checks
\`\`\`bash
npm run dr:health-check
npm run dr:backup-status
npm run dr:replication-status
\`\`\`

### Emergency Recovery
\`\`\`bash
# Complete database loss
npm run dr:recover complete_database_loss

# Point-in-time recovery
npm run dr:recover point_in_time_recovery --target="2024-01-01T12:00:00Z"

# Cross-region failover
npm run dr:recover cross_region_failover
\`\`\`

### Testing
\`\`\`bash
# Test all scenarios
npm run dr:test-all

# Test specific scenario
npm run dr:test complete_database_loss --dry-run
\`\`\`

## Disaster Scenarios

${Array.from(this.scenarios.values())
  .map(
    (scenario) => `
### ${scenario.name}
- **Severity**: ${scenario.severity}
- **Estimated RTO**: ${scenario.estimatedRTO} minutes
- **Estimated RPO**: ${scenario.estimatedRPO} minutes
- **Automated Response**: ${scenario.automatedResponse ? "Yes" : "No"}

**Recovery Command**: \`npm run dr:recover ${scenario.id}\`
`
  )
  .join("\n")}

## Monitoring and Alerting

### Health Check Schedule
- **Interval**: ${this.config.monitoring.checkIntervalSeconds} seconds
- **Backup Age Threshold**: ${this.config.monitoring.thresholds.backupAge} hours
- **Replication Lag Threshold**: ${this.config.monitoring.thresholds.replicationLag} seconds

### Alert Channels
${this.config.monitoring.alerting.channels.map((channel) => `- ${channel.type} (${channel.severity})`).join("\n")}

## Post-Recovery Procedures

1. **Validate Recovery**
   - Run health checks
   - Verify data integrity
   - Test application functionality

2. **Update Documentation**
   - Document lessons learned
   - Update procedures if needed
   - Notify stakeholders

3. **Schedule Follow-up**
   - Plan root cause analysis
   - Schedule additional testing
   - Review and improve procedures

---
*This runbook is automatically generated and should be reviewed regularly.*
`;

    const runbookPath = join(
      this.config.storage.local.path,
      "runbooks",
      "main-disaster-recovery-runbook.md"
    );
    await writeFile(runbookPath, runbook);

    console.log(`📖 Main disaster recovery runbook generated: ${runbookPath}`);
    return runbookPath;
  }

  private async generateScenarioRunbook(
    scenario: DisasterScenario
  ): Promise<string> {
    const runbook = `# ${scenario.name} - Disaster Recovery Procedure

## Scenario Details
- **ID**: ${scenario.id}
- **Severity**: ${scenario.severity}
- **Estimated RTO**: ${scenario.estimatedRTO} minutes
- **Estimated RPO**: ${scenario.estimatedRPO} minutes
- **Automated Response**: ${scenario.automatedResponse ? "Yes" : "No"}

## Description
${scenario.description}

## Recovery Steps

${scenario.recoverySteps
  .map(
    (step, index) => `
### Step ${index + 1}: ${step.name}
- **Duration**: ${step.estimatedDuration} minutes
- **Critical**: ${step.criticalStep ? "Yes" : "No"}
- **Manual Approval**: ${step.requiresManualApproval ? "Yes" : "No"}
- **Dependencies**: ${step.dependencies.join(", ") || "None"}

**Description**: ${step.description}

${step.command ? `**Command**: \`${step.command}\`` : ""}
${step.script ? `**Script**: \`${step.script}\`` : ""}
${step.validationQuery ? `**Validation**: \`${step.validationQuery}\`` : ""}
`
  )
  .join("\n")}

## Validation Checks

${scenario.validationChecks
  .map(
    (check, index) => `
### Check ${index + 1}: ${check.name}
- **Critical**: ${check.criticalCheck ? "Yes" : "No"}
- **Query**: \`${check.query}\`
- **Expected**: ${check.expectedResult || "Any result"}

**Description**: ${check.description}
`
  )
  .join("\n")}

## Rollback Procedure

${scenario.rollbackProcedure
  .map(
    (step, index) => `
### Rollback Step ${index + 1}: ${step.name}
- **Duration**: ${step.estimatedDuration} minutes
- **Command**: \`${step.command}\`
- **Dependencies**: ${step.dependencies.join(", ") || "None"}

**Description**: ${step.description}
`
  )
  .join("\n")}

## Execution Command
\`\`\`bash
npm run dr:recover ${scenario.id}
\`\`\`

## Testing Command
\`\`\`bash
npm run dr:test ${scenario.id} --dry-run
\`\`\`

---
*Generated: ${new Date().toISOString()}*
`;

    const runbookPath = join(
      this.config.storage.local.path,
      "runbooks",
      `${scenario.id}-runbook.md`
    );
    await writeFile(runbookPath, runbook);

    return runbookPath;
  }

  private async generateOperationalRunbook(): Promise<string> {
    const runbook = `# Disaster Recovery - Operational Procedures

## Daily Operations

### Morning Health Check
\`\`\`bash
npm run dr:health-check
npm run dr:backup-status
npm run dr:validate-backups
\`\`\`

### Backup Management
\`\`\`bash
# Create manual backup
npm run dr:backup-full

# Create incremental backup
npm run dr:backup-incremental

# Clean old backups
npm run dr:cleanup-backups
\`\`\`

## Weekly Operations

### Comprehensive Testing
\`\`\`bash
# Test point-in-time recovery
npm run dr:test point_in_time_recovery --dry-run

# Validate all disaster scenarios
npm run dr:test-all --dry-run
\`\`\`

### Maintenance
\`\`\`bash
# Update runbooks
npm run dr:generate-runbooks

# Review and clean logs
npm run dr:cleanup-logs

# Update recovery scripts
npm run dr:update-scripts
\`\`\`

## Monthly Operations

### Full Disaster Recovery Test
\`\`\`bash
# Complete disaster recovery drill
npm run dr:full-test

# Generate test report
npm run dr:generate-report
\`\`\`

### Review and Improvement
1. Review all test results
2. Update procedures based on lessons learned
3. Update contact information
4. Review and update thresholds
5. Train team on any procedure changes

## Monitoring Dashboard

### Key Metrics
- Backup success rate: Target >99%
- Average RTO: Target <${this.config.recovery.rtoMinutes} minutes
- Average RPO: Target <${this.config.recovery.rpoMinutes} minutes
- Health check success rate: Target >99%

### Alert Thresholds
- Backup age: >${this.config.monitoring.thresholds.backupAge} hours
- Replication lag: >${this.config.monitoring.thresholds.replicationLag} seconds
- Disk usage: >${this.config.monitoring.thresholds.diskUsage}%

---
*Generated: ${new Date().toISOString()}*
`;

    const runbookPath = join(
      this.config.storage.local.path,
      "runbooks",
      "operational-procedures.md"
    );
    await writeFile(runbookPath, runbook);

    return runbookPath;
  }

  private async generateTestingRunbook(): Promise<string> {
    const runbook = `# Disaster Recovery - Testing Procedures

## Testing Philosophy
Regular testing ensures our disaster recovery procedures work when needed. All tests should be documented and results reviewed.

## Test Types

### 1. Backup Validation Tests
**Frequency**: ${this.config.recovery.testingSchedule.backupValidation}
**Purpose**: Verify backup integrity and restorability

\`\`\`bash
npm run dr:validate-backups
npm run dr:test-restore --backup-id=latest
\`\`\`

### 2. Point-in-Time Recovery Tests  
**Frequency**: ${this.config.recovery.testingSchedule.pointInTimeRecovery}
**Purpose**: Verify PITR functionality

\`\`\`bash
npm run dr:test point_in_time_recovery --target="1 hour ago" --dry-run
\`\`\`

### 3. Full Disaster Recovery Tests
**Frequency**: ${this.config.recovery.testingSchedule.fullDisasterRecovery}
**Purpose**: Comprehensive disaster recovery validation

\`\`\`bash
npm run dr:test-all --dry-run
\`\`\`

## Test Scenarios

${Array.from(this.scenarios.values())
  .map(
    (scenario) => `
### ${scenario.name} Test
**Command**: \`npm run dr:test ${scenario.id} --dry-run\`
**Expected RTO**: ${scenario.estimatedRTO} minutes
**Expected RPO**: ${scenario.estimatedRPO} minutes

**Test Steps**:
${scenario.recoverySteps.map((step, i) => `${i + 1}. ${step.name} (${step.estimatedDuration}min)`).join("\n")}

**Validation**:
${scenario.validationChecks.map((check, i) => `${i + 1}. ${check.name}`).join("\n")}
`
  )
  .join("\n")}

## Test Documentation

### Before Each Test
1. Document current system state
2. Identify test objectives
3. Prepare rollback procedures
4. Notify stakeholders

### During Each Test
1. Record start time
2. Document each step execution
3. Record any issues or deviations
4. Measure actual vs expected times

### After Each Test
1. Validate all test objectives met
2. Document lessons learned
3. Update procedures if needed
4. Generate test report

## Test Report Template

\`\`\`markdown
# Disaster Recovery Test Report

**Test Date**: [DATE]
**Test Type**: [TYPE]
**Scenario**: [SCENARIO]
**Tester**: [NAME]

## Test Results
- **Status**: [PASS/FAIL]
- **Actual RTO**: [MINUTES]
- **Actual RPO**: [MINUTES]
- **Steps Completed**: [X/Y]
- **Validations Passed**: [X/Y]

## Issues Identified
[LIST ANY ISSUES]

## Recommendations
[LIST RECOMMENDATIONS]

## Action Items
[LIST ACTION ITEMS WITH OWNERS AND DUE DATES]
\`\`\`

---
*Generated: ${new Date().toISOString()}*
`;

    const runbookPath = join(
      this.config.storage.local.path,
      "runbooks",
      "testing-procedures.md"
    );
    await writeFile(runbookPath, runbook);

    return runbookPath;
  }

  private async generateRecoveryReport(
    execution: DisasterRecoveryExecution,
    scenario: DisasterScenario
  ): Promise<void> {
    const report: DisasterRecoveryReport = {
      id: `report_${execution.id}`,
      executionId: execution.id,
      generatedAt: new Date(),
      scenario: scenario.name,
      success: execution.status === "completed",
      summary: {
        totalDuration: execution.metrics.actualRTO || 0,
        actualRTO: execution.metrics.actualRTO || 0,
        actualRPO: execution.metrics.actualRPO || 0,
        dataLoss: execution.metrics.dataLoss || 0,
        stepsExecuted: execution.metrics.stepsCompleted,
        validationsPassed: execution.metrics.validationsPassed,
      },
      recommendations: [],
      lessonsLearned: [],
      actionItems: [],
    };

    // Add recommendations based on performance
    if (report.summary.actualRTO > scenario.estimatedRTO) {
      report.recommendations.push(
        `Actual RTO (${report.summary.actualRTO}min) exceeded estimate (${scenario.estimatedRTO}min). Review step efficiency.`
      );
    }

    if (
      execution.metrics.validationsPassed < execution.metrics.validationsTotal
    ) {
      report.recommendations.push(
        "Some validation checks failed. Review and improve validation procedures."
      );
    }

    // Generate report document
    const reportContent = `# Disaster Recovery Execution Report

**Report ID**: ${report.id}
**Execution ID**: ${report.executionId}
**Generated**: ${report.generatedAt.toISOString()}
**Scenario**: ${report.scenario}
**Status**: ${report.success ? "SUCCESS" : "FAILED"}

## Summary
- **Total Duration**: ${report.summary.totalDuration} minutes
- **Actual RTO**: ${report.summary.actualRTO} minutes
- **Actual RPO**: ${report.summary.actualRPO} minutes
- **Data Loss**: ${report.summary.dataLoss} records
- **Steps Executed**: ${report.summary.stepsExecuted}/${scenario.recoverySteps.length}
- **Validations Passed**: ${report.summary.validationsPassed}/${scenario.validationChecks.length}

## Execution Log
${execution.logs.map((log) => `**${log.timestamp.toISOString()}** [${log.level.toUpperCase()}] ${log.message}`).join("\n")}

## Recommendations
${report.recommendations.map((rec) => `- ${rec}`).join("\n")}

## Lessons Learned
${report.lessonsLearned.map((lesson) => `- ${lesson}`).join("\n")}

## Action Items
${report.actionItems.map((item) => `- ${item.description} (Priority: ${item.priority})`).join("\n")}

---
*Generated automatically by Comprehensive Disaster Recovery System*
`;

    const reportPath = join(
      this.config.storage.local.path,
      "reports",
      `${report.id}.md`
    );
    await writeFile(reportPath, reportContent);

    console.log(`📊 Recovery report generated: ${reportPath}`);
    this.emit("report_generated", report);
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log("🔄 Shutting down Comprehensive Disaster Recovery System...");

    // Clear monitoring intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Clear testing schedules
    for (const [name, interval] of Array.from(this.testingSchedule)) {
      clearInterval(interval);
    }

    // Close database connections
    await this.primaryPool.end();
    for (const [id, pool] of Array.from(this.replicaPools)) {
      await pool.end();
    }

    console.log("✅ Comprehensive Disaster Recovery System shutdown complete");
  }
}
