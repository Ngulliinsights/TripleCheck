/**
 * Disaster Recovery Integration Tests
 * 
 * End-to-end integration tests for the disaster recovery system
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ComprehensiveDisasterRecovery, ComprehensiveDisasterRecoveryConfig } from '../ComprehensiveDisasterRecovery';
import { Pool } from 'pg';
import { mkdir, rmdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Disaster Recovery Integration Tests', () => {
  let drSystem: ComprehensiveDisasterRecovery;
  let testConfig: ComprehensiveDisasterRecoveryConfig;
  let testStoragePath: string;

  beforeAll(async () => {
    // Setup test storage directory
    testStoragePath = join(process.cwd(), 'test-dr-storage');
    
    testConfig = {
      database: {
        primary: {
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432'),
          database: process.env.TEST_DB_NAME || 'triplecheck_test',
          username: process.env.TEST_DB_USER || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'password'
        },
        replicas: []
      },
      storage: {
        local: {
          path: testStoragePath,
          maxSizeGB: 1
        },
        crossRegion: {
          enabled: false,
          regions: []
        }
      },
      recovery: {
        rpoMinutes: 5,
        rtoMinutes: 15,
        enableWALArchiving: false, // Disabled for testing
        enablePointInTimeRecovery: true,
        retentionDays: 7,
        testingSchedule: {
          backupValidation: 'daily',
          pointInTimeRecovery: 'weekly',
          fullDisasterRecovery: 'monthly'
        }
      },
      monitoring: {
        enableHealthChecks: true,
        checkIntervalSeconds: 30,
        alerting: {
          enabled: false, // Disabled for testing
          channels: []
        },
        thresholds: {
          backupAge: 1,
          walArchiveLag: 5,
          replicationLag: 10,
          diskUsage: 90,
          connectionFailures: 2
        }
      },
      automation: {
        enableAutomatedFailover: false,
        enableAutomatedRecovery: false,
        enableAutomatedTesting: false,
        maxAutomatedActions: 3,
        requireManualApproval: false // Disabled for testing
      }
    };
  });

  beforeEach(async () => {
    // Create test storage directory
    if (!existsSync(testStoragePath)) {
      await mkdir(testStoragePath, { recursive: true });
    }

    drSystem = new ComprehensiveDisasterRecovery(testConfig);
  });

  afterEach(async () => {
    if (drSystem) {
      await drSystem.shutdown();
    }
  });

  afterAll(async () => {
    // Cleanup test storage directory
    if (existsSync(testStoragePath)) {
      await rmdir(testStoragePath, { recursive: true });
    }
  });

  describe('System Initialization', () => {
    it('should initialize disaster recovery system successfully', async () => {
      await expect(drSystem.initialize()).resolves.not.toThrow();
      
      // Verify storage directories were created
      expect(existsSync(join(testStoragePath, 'backups'))).toBe(true);
      expect(existsSync(join(testStoragePath, 'recovery'))).toBe(true);
      expect(existsSync(join(testStoragePath, 'logs'))).toBe(true);
      expect(existsSync(join(testStoragePath, 'runbooks'))).toBe(true);
    });

    it('should create all required storage subdirectories', async () => {
      await drSystem.initialize();

      const expectedDirs = [
        'backups/full',
        'backups/incremental', 
        'backups/wal',
        'recovery/staging',
        'recovery/testing',
        'logs',
        'reports',
        'runbooks',
        'scripts'
      ];

      for (const dir of expectedDirs) {
        expect(existsSync(join(testStoragePath, dir))).toBe(true);
      }
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should perform comprehensive health checks', async () => {
      const healthStatus = await drSystem.performHealthChecks();

      expect(healthStatus).toHaveProperty('overall');
      expect(['healthy', 'warning', 'critical']).toContain(healthStatus.overall);
      expect(Array.isArray(healthStatus.checks)).toBe(true);
      expect(healthStatus.checks.length).toBeGreaterThan(0);
    });

    it('should check primary database connectivity', async () => {
      const healthStatus = await drSystem.performHealthChecks();
      
      const dbCheck = healthStatus.checks.find(c => c.name.includes('Primary Database'));
      expect(dbCheck).toBeDefined();
      expect(['pass', 'warn', 'fail']).toContain(dbCheck!.status);
    });

    it('should monitor disk usage', async () => {
      const healthStatus = await drSystem.performHealthChecks();
      
      const diskCheck = healthStatus.checks.find(c => c.name === 'Disk Usage');
      expect(diskCheck).toBeDefined();
      expect(diskCheck).toHaveProperty('value');
      expect(diskCheck).toHaveProperty('threshold');
    });
  });

  describe('Disaster Recovery Scenarios', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should execute complete database loss scenario in dry run', async () => {
      const executionId = await drSystem.executeDisasterRecovery('complete_database_loss', {
        dryRun: true,
        skipValidation: true
      });

      expect(executionId).toMatch(/^dr_complete_database_loss_\d+$/);
    });

    it('should execute point-in-time recovery scenario in dry run', async () => {
      const targetTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      const executionId = await drSystem.executeDisasterRecovery('point_in_time_recovery', {
        dryRun: true,
        targetTime,
        skipValidation: true
      });

      expect(executionId).toMatch(/^dr_point_in_time_recovery_\d+$/);
    });

    it('should execute partial data corruption scenario in dry run', async () => {
      const executionId = await drSystem.executeDisasterRecovery('partial_data_corruption', {
        dryRun: true,
        skipValidation: true
      });

      expect(executionId).toMatch(/^dr_partial_data_corruption_\d+$/);
    });

    it('should execute cross-region failover scenario in dry run', async () => {
      const executionId = await drSystem.executeDisasterRecovery('cross_region_failover', {
        dryRun: true,
        skipValidation: true
      });

      expect(executionId).toMatch(/^dr_cross_region_failover_\d+$/);
    });

    it('should track execution progress', async () => {
      let executionStarted = false;
      let executionCompleted = false;

      drSystem.on('disaster_recovery_started', () => {
        executionStarted = true;
      });

      drSystem.on('disaster_recovery_completed', () => {
        executionCompleted = true;
      });

      await drSystem.executeDisasterRecovery('complete_database_loss', {
        dryRun: true,
        skipValidation: true
      });

      expect(executionStarted).toBe(true);
      expect(executionCompleted).toBe(true);
    });
  });

  describe('Testing Framework', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should test all disaster recovery scenarios', async () => {
      const results = await drSystem.testAllScenarios();

      expect(results.success).toBeDefined();
      expect(results.results).toBeDefined();
      expect(results.summary).toBeDefined();
      
      expect(results.summary.totalScenarios).toBe(4); // 4 predefined scenarios
      expect(results.summary.passed + results.summary.failed).toBe(results.summary.totalScenarios);
    });

    it('should provide detailed test results for each scenario', async () => {
      const results = await drSystem.testAllScenarios();

      for (const result of results.results) {
        expect(result).toHaveProperty('scenarioId');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('errors');
        expect(Array.isArray(result.errors)).toBe(true);
      }
    });

    it('should calculate average RTO from test results', async () => {
      const results = await drSystem.testAllScenarios();

      expect(results.summary.averageRTO).toBeGreaterThanOrEqual(0);
      expect(typeof results.summary.averageRTO).toBe('number');
    });
  });

  describe('Runbook Generation', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should generate comprehensive runbooks', async () => {
      const runbooks = await drSystem.generateComprehensiveRunbooks();

      expect(Array.isArray(runbooks)).toBe(true);
      expect(runbooks.length).toBeGreaterThan(0);

      // Verify runbook files were created
      for (const runbook of runbooks) {
        expect(existsSync(runbook)).toBe(true);
      }
    });

    it('should generate main disaster recovery runbook', async () => {
      const runbooks = await drSystem.generateComprehensiveRunbooks();
      
      const mainRunbook = runbooks.find(r => r.includes('main-disaster-recovery-runbook'));
      expect(mainRunbook).toBeDefined();
      expect(existsSync(mainRunbook!)).toBe(true);
    });

    it('should generate scenario-specific runbooks', async () => {
      const runbooks = await drSystem.generateComprehensiveRunbooks();
      
      const scenarioRunbooks = runbooks.filter(r => r.includes('-runbook.md') && !r.includes('main-'));
      expect(scenarioRunbooks.length).toBe(4); // 4 scenarios
    });

    it('should generate operational procedures runbook', async () => {
      const runbooks = await drSystem.generateComprehensiveRunbooks();
      
      const operationalRunbook = runbooks.find(r => r.includes('operational-procedures'));
      expect(operationalRunbook).toBeDefined();
      expect(existsSync(operationalRunbook!)).toBe(true);
    });

    it('should generate testing procedures runbook', async () => {
      const runbooks = await drSystem.generateComprehensiveRunbooks();
      
      const testingRunbook = runbooks.find(r => r.includes('testing-procedures'));
      expect(testingRunbook).toBeDefined();
      expect(existsSync(testingRunbook!)).toBe(true);
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should emit system_initialized event', async () => {
      let eventEmitted = false;
      
      const newDrSystem = new ComprehensiveDisasterRecovery(testConfig);
      newDrSystem.on('system_initialized', () => {
        eventEmitted = true;
      });

      await newDrSystem.initialize();
      expect(eventEmitted).toBe(true);
      
      await newDrSystem.shutdown();
    });

    it('should emit health_check_completed event', async () => {
      let eventEmitted = false;
      
      drSystem.on('health_check_completed', () => {
        eventEmitted = true;
      });

      await drSystem.performHealthChecks();
      expect(eventEmitted).toBe(true);
    });

    it('should emit testing_completed event', async () => {
      let eventEmitted = false;
      
      drSystem.on('testing_completed', () => {
        eventEmitted = true;
      });

      await drSystem.testAllScenarios();
      expect(eventEmitted).toBe(true);
    });

    it('should emit report_generated event', async () => {
      let eventEmitted = false;
      
      drSystem.on('report_generated', () => {
        eventEmitted = true;
      });

      await drSystem.executeDisasterRecovery('complete_database_loss', {
        dryRun: true,
        skipValidation: true
      });

      expect(eventEmitted).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should handle invalid scenario gracefully', async () => {
      await expect(
        drSystem.executeDisasterRecovery('invalid_scenario')
      ).rejects.toThrow('Disaster recovery scenario not found: invalid_scenario');
    });

    it('should emit disaster_recovery_failed event on errors', async () => {
      let errorEventEmitted = false;
      
      drSystem.on('disaster_recovery_failed', () => {
        errorEventEmitted = true;
      });

      try {
        await drSystem.executeDisasterRecovery('invalid_scenario');
      } catch (error) {
        // Expected to fail
      }

      expect(errorEventEmitted).toBe(true);
    });

    it('should handle monitoring errors gracefully', async () => {
      // This test would verify that monitoring continues even if individual checks fail
      const healthStatus = await drSystem.performHealthChecks();
      
      // Should always return a status, even if some checks fail
      expect(healthStatus).toHaveProperty('overall');
      expect(healthStatus).toHaveProperty('checks');
    });
  });

  describe('Configuration Validation', () => {
    it('should work with minimal configuration', async () => {
      const minimalConfig: ComprehensiveDisasterRecoveryConfig = {
        database: {
          primary: testConfig.database.primary,
          replicas: []
        },
        storage: {
          local: {
            path: join(testStoragePath, 'minimal'),
            maxSizeGB: 1
          },
          crossRegion: {
            enabled: false,
            regions: []
          }
        },
        recovery: {
          rpoMinutes: 5,
          rtoMinutes: 15,
          enableWALArchiving: false,
          enablePointInTimeRecovery: false,
          retentionDays: 7,
          testingSchedule: {
            backupValidation: 'daily',
            pointInTimeRecovery: 'weekly',
            fullDisasterRecovery: 'monthly'
          }
        },
        monitoring: {
          enableHealthChecks: false,
          checkIntervalSeconds: 60,
          alerting: {
            enabled: false,
            channels: []
          },
          thresholds: {
            backupAge: 24,
            walArchiveLag: 10,
            replicationLag: 30,
            diskUsage: 85,
            connectionFailures: 3
          }
        },
        automation: {
          enableAutomatedFailover: false,
          enableAutomatedRecovery: false,
          enableAutomatedTesting: false,
          maxAutomatedActions: 1,
          requireManualApproval: true
        }
      };

      const minimalDrSystem = new ComprehensiveDisasterRecovery(minimalConfig);
      await expect(minimalDrSystem.initialize()).resolves.not.toThrow();
      await minimalDrSystem.shutdown();
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      await drSystem.initialize();
    });

    it('should complete health checks within reasonable time', async () => {
      const startTime = Date.now();
      await drSystem.performHealthChecks();
      const duration = Date.now() - startTime;

      // Health checks should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should complete scenario testing within reasonable time', async () => {
      const startTime = Date.now();
      await drSystem.testAllScenarios();
      const duration = Date.now() - startTime;

      // All scenario tests should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    });

    it('should handle multiple concurrent health checks', async () => {
      const promises = Array(5).fill(null).map(() => drSystem.performHealthChecks());
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('overall');
        expect(result).toHaveProperty('checks');
      });
    });
  });
});