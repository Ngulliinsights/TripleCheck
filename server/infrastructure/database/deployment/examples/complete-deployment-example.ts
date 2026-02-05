/**
 * Complete Zero-Downtime Deployment Example
 * 
 * This example demonstrates a complete zero-downtime deployment workflow
 * including migrations, blue-green deployment, and comprehensive validation.
 */

import { Pool } from 'pg';
import {
  ZeroDowntimeMigrationManager,
  BlueGreenDeploymentManager,
  DeploymentValidator,
  MigrationBuilder,
  DatabaseAnalyzer,
  DeploymentSafety
} from '../index';

/**
 * Example: Complete deployment workflow
 */
async function completeDeploymentExample() {
  console.log('🚀 Starting Complete Zero-Downtime Deployment Example\n');

  // Database connections
  const primaryPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck',
    max: 10,
    idleTimeoutMillis: 30000
  });

  const replicaPool = new Pool({
    connectionString: process.env.REPLICA_DATABASE_URL || process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000
  });

  try {
    // Step 1: Initialize Migration Manager
    console.log('📋 Step 1: Initializing Migration Manager...');
    const migrationManager = new ZeroDowntimeMigrationManager(
      primaryPool,
      {
        batchSize: 1000,
        maxLockTime: 100,
        enableSafetyChecks: true,
        enableProgressMonitoring: true,
        enablePerformanceMonitoring: true
      },
      replicaPool
    );

    await migrationManager.initialize();
    console.log('✅ Migration Manager initialized\n');

    // Step 2: Analyze Database Before Migration
    console.log('📊 Step 2: Analyzing Database...');
    
    const userTableAnalysis = await DatabaseAnalyzer.analyzeTable(primaryPool, 'users');
    console.log(`Users table: ${userTableAnalysis.rowCount} rows, ${userTableAnalysis.sizeMB}MB`);
    console.log(`Risk Level: ${userTableAnalysis.riskLevel}`);
    console.log(`Estimated Migration Time: ${userTableAnalysis.estimatedMigrationTime}ms`);
    
    if (userTableAnalysis.recommendations.length > 0) {
      console.log('Recommendations:');
      userTableAnalysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    const performanceAnalysis = await DatabaseAnalyzer.analyzePerformance(primaryPool);
    console.log(`\nPerformance: ${performanceAnalysis.connectionCount} connections, ${performanceAnalysis.activeQueries} active queries`);
    console.log(`Average Query Time: ${performanceAnalysis.avgQueryTime}ms\n`);

    // Step 3: Create Migration Operations
    console.log('🔧 Step 3: Creating Migration Operations...');
    
    const migrations = [
      // Add new column for user preferences
      MigrationBuilder.addColumn(
        'users',
        'preferences JSONB',
        {
          description: 'Add user preferences storage',
          defaultValue: "'{}'::jsonb",
          riskLevel: 'LOW'
        }
      ),

      // Add index for better query performance
      MigrationBuilder.addIndex(
        'properties',
        'USING GIN (features)',
        {
          indexName: 'idx_properties_features_gin',
          description: 'GIN index for property features search',
          riskLevel: 'MEDIUM'
        }
      ),

      // Add composite index for common query pattern
      MigrationBuilder.addIndex(
        'properties',
        '(location, price) WHERE is_active = true',
        {
          indexName: 'idx_properties_location_price_active',
          description: 'Composite index for active property searches',
          riskLevel: 'MEDIUM'
        }
      )
    ];

    // Step 4: Validate Migration Safety
    console.log('🔍 Step 4: Validating Migration Safety...');
    
    for (const migration of migrations) {
      const safety = DeploymentSafety.validateMigrationSafety(migration);
      console.log(`\n${migration.description}:`);
      console.log(`  Safe: ${safety.safe ? '✅' : '❌'}`);
      
      if (safety.warnings.length > 0) {
        console.log('  Warnings:');
        safety.warnings.forEach(warning => console.log(`    - ${warning}`));
      }
      
      if (safety.blockers.length > 0) {
        console.log('  Blockers:');
        safety.blockers.forEach(blocker => console.log(`    - ${blocker}`));
      }
      
      if (safety.recommendations.length > 0) {
        console.log('  Recommendations:');
        safety.recommendations.forEach(rec => console.log(`    - ${rec}`));
      }

      // Generate pre-migration checklist
      const checklist = DeploymentSafety.generatePreMigrationChecklist(migration);
      console.log('  Pre-migration Checklist:');
      checklist.forEach(item => {
        const required = item.required ? '[REQUIRED]' : '[OPTIONAL]';
        console.log(`    ${required} ${item.item}: ${item.description}`);
      });

      // Estimate downtime
      const downtimeEstimate = DeploymentSafety.estimateDowntime(migration, userTableAnalysis);
      console.log(`  Estimated Downtime: ${downtimeEstimate.estimatedDowntime}ms`);
      
      if (downtimeEstimate.factors.length > 0) {
        console.log('  Downtime Factors:');
        downtimeEstimate.factors.forEach(factor => {
          console.log(`    - ${factor.factor}: +${factor.impact}ms (${factor.description})`);
        });
      }
    }

    // Step 5: Check for Migration Blockers
    console.log('\n🚧 Step 5: Checking for Migration Blockers...');
    
    const blockers = await DatabaseAnalyzer.checkMigrationBlockers(primaryPool, 'users');
    console.log(`Long-running transactions: ${blockers.longRunningTransactions}`);
    console.log(`Exclusive locks: ${blockers.exclusiveLocks}`);
    console.log(`Replication lag: ${blockers.replicationLag}s`);
    
    if (blockers.blockers.length > 0) {
      console.log('Blockers found:');
      blockers.blockers.forEach(blocker => {
        console.log(`  [${blocker.severity}] ${blocker.type}: ${blocker.description}`);
        console.log(`    Recommendation: ${blocker.recommendation}`);
      });
    } else {
      console.log('✅ No migration blockers detected');
    }

    // Step 6: Execute Migrations
    console.log('\n⚡ Step 6: Executing Migrations...');
    
    // Set up progress monitoring
    migrationManager.on('migration_started', ({ operationId, operation }) => {
      console.log(`🚀 Migration started: ${operation.description} (${operationId})`);
    });

    migrationManager.on('migration_progress', ({ operationId, progress }) => {
      console.log(`📊 Migration progress: ${operationId} - ${progress.progress}%`);
      
      if (progress.performanceImpact.avgQueryTime > 0) {
        console.log(`   Performance Impact: ${progress.performanceImpact.avgQueryTime}ms avg query time`);
      }
    });

    migrationManager.on('migration_completed', ({ operationId, operation, progress }) => {
      const duration = progress.endTime!.getTime() - progress.startTime.getTime();
      console.log(`✅ Migration completed: ${operation.description} (${duration}ms)`);
    });

    migrationManager.on('migration_failed', ({ operationId, operation, error }) => {
      console.log(`❌ Migration failed: ${operation.description} - ${error.message}`);
    });

    // Execute each migration
    const migrationResults = [];
    for (const migration of migrations) {
      try {
        const operationId = await migrationManager.executeMigration(migration);
        migrationResults.push({ operationId, success: true, migration });
        console.log(`✅ Migration completed successfully: ${operationId}\n`);
      } catch (error) {
        migrationResults.push({ error, success: false, migration });
        console.log(`❌ Migration failed: ${error.message}\n`);
      }
    }

    // Step 7: Initialize Blue-Green Deployment
    console.log('🔄 Step 7: Initializing Blue-Green Deployment...');
    
    const blueGreenConfig = {
      blueEnvironment: {
        connectionString: process.env.BLUE_DATABASE_URL || process.env.DATABASE_URL!,
        poolConfig: { min: 2, max: 10, idleTimeoutMillis: 30000 }
      },
      greenEnvironment: {
        connectionString: process.env.GREEN_DATABASE_URL || process.env.DATABASE_URL!,
        poolConfig: { min: 2, max: 10, idleTimeoutMillis: 30000 }
      },
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

    const deploymentManager = new BlueGreenDeploymentManager(blueGreenConfig);
    await deploymentManager.initialize();
    console.log('✅ Blue-Green Deployment Manager initialized\n');

    // Step 8: Create Deployment Plan
    console.log('📋 Step 8: Creating Deployment Plan...');
    
    const deploymentPlan = deploymentManager.createDeploymentPlan('v2.1.0');
    console.log(`Deployment Plan Created: ${deploymentPlan.id}`);
    console.log(`Source: ${deploymentPlan.sourceEnvironment} → Target: ${deploymentPlan.targetEnvironment}`);
    console.log(`Estimated Duration: ${Math.round(deploymentPlan.totalEstimatedDuration / 1000)}s`);
    console.log(`Risk Level: ${deploymentPlan.riskAssessment.level}`);
    
    console.log('\nDeployment Steps:');
    deploymentPlan.steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step.name} (${Math.round(step.estimatedDuration / 1000)}s)`);
      console.log(`     ${step.description}`);
    });

    console.log('\nValidation Plan:');
    console.log(`  Data Consistency: ${deploymentPlan.validationPlan.dataConsistency ? '✅' : '❌'}`);
    console.log(`  Performance Baseline: ${deploymentPlan.validationPlan.performanceBaseline ? '✅' : '❌'}`);
    console.log(`  Functional Tests: ${deploymentPlan.validationPlan.functionalTests ? '✅' : '❌'}`);
    console.log(`  Rollback Readiness: ${deploymentPlan.validationPlan.rollbackReadiness ? '✅' : '❌'}`);

    // Step 9: Initialize Deployment Validator
    console.log('\n🔍 Step 9: Initializing Deployment Validator...');
    
    const validator = new DeploymentValidator(
      primaryPool,
      primaryPool, // In real scenario, this would be the target environment
      {
        dataConsistency: {
          enabled: true,
          sampleSize: 1000,
          toleranceThreshold: 0.0001,
          criticalTables: ['users', 'properties', 'transactions'],
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
          testDuration: 30000, // Shortened for example
          warmupDuration: 5000
        },
        functional: {
          enabled: true,
          testSuites: [
            {
              name: 'Basic Database Operations',
              description: 'Test basic database connectivity and operations',
              tests: [
                {
                  name: 'Connection test',
                  sql: 'SELECT 1 as test',
                  expectedResult: [{ test: 1 }],
                  timeout: 5000
                },
                {
                  name: 'Users table access',
                  sql: 'SELECT COUNT(*) as user_count FROM users',
                  timeout: 10000
                },
                {
                  name: 'Properties table access',
                  sql: 'SELECT COUNT(*) as property_count FROM properties',
                  timeout: 10000
                }
              ]
            }
          ],
          parallelExecution: true,
          failFast: false
        }
      }
    );

    await validator.initialize();
    console.log('✅ Deployment Validator initialized\n');

    // Step 10: Run Comprehensive Validation
    console.log('🧪 Step 10: Running Comprehensive Validation...');
    
    // Set up validation event listeners
    validator.on('validation_started', () => {
      console.log('🔍 Comprehensive validation started...');
    });

    validator.on('validation_completed', ({ type, result }) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${type}: ${result.score}% (${result.duration}ms)`);
      
      if (result.details.issues && result.details.issues.length > 0) {
        console.log('  Issues:');
        result.details.issues.forEach(issue => {
          console.log(`    [${issue.severity}] ${issue.message}`);
        });
      }
    });

    validator.on('validation_finished', (comprehensiveResult) => {
      const status = comprehensiveResult.overallPassed ? '✅ PASSED' : '❌ FAILED';
      console.log(`\n${status} Comprehensive Validation Complete`);
      console.log(`Overall Score: ${comprehensiveResult.overallScore}%`);
      console.log(`Total Duration: ${comprehensiveResult.totalDuration}ms`);
      console.log(`Tests: ${comprehensiveResult.summary.passedTests}/${comprehensiveResult.summary.totalTests} passed`);
      
      if (comprehensiveResult.summary.criticalIssues > 0) {
        console.log(`Critical Issues: ${comprehensiveResult.summary.criticalIssues}`);
      }
    });

    const validationResult = await validator.validateDeployment();
    
    if (!validationResult.overallPassed) {
      console.log('\n❌ Validation failed - deployment aborted');
      console.log('Issues found:');
      validationResult.results.forEach(result => {
        if (result.details.issues) {
          result.details.issues.forEach(issue => {
            if (issue.severity === 'CRITICAL') {
              console.log(`  [CRITICAL] ${issue.message}`);
            }
          });
        }
      });
      return;
    }

    // Step 11: Execute Blue-Green Deployment
    console.log('\n🚀 Step 11: Executing Blue-Green Deployment...');
    
    // Set up deployment event listeners
    deploymentManager.on('deployment_started', ({ executionId, plan }) => {
      console.log(`🚀 Deployment started: ${plan.version} (${executionId})`);
    });

    deploymentManager.on('deployment_step_completed', ({ step }) => {
      console.log(`✅ Step completed: ${step.name}`);
    });

    deploymentManager.on('deployment_completed', ({ executionId, execution }) => {
      console.log(`✅ Deployment completed successfully: ${executionId}`);
      console.log(`Total Duration: ${execution.metrics.totalDuration}ms`);
      
      if (execution.metrics.switchoverDuration) {
        console.log(`Switchover Duration: ${execution.metrics.switchoverDuration}ms`);
      }
      
      if (execution.metrics.downtime) {
        console.log(`Downtime: ${execution.metrics.downtime}ms`);
      }
    });

    deploymentManager.on('deployment_failed', ({ executionId, error }) => {
      console.log(`❌ Deployment failed: ${executionId} - ${error.message}`);
    });

    deploymentManager.on('deployment_rolled_back', ({ executionId, rollbackDuration }) => {
      console.log(`🔄 Deployment rolled back: ${executionId} (${rollbackDuration}ms)`);
    });

    try {
      const executionId = await deploymentManager.executeDeployment(deploymentPlan);
      console.log(`\n🎉 Deployment execution completed successfully: ${executionId}`);
      
      // Get final environment status
      const environmentStatus = deploymentManager.getEnvironmentStatus();
      console.log(`\nActive Environment: ${environmentStatus.active}`);
      console.log('Environment Health:');
      Object.entries(environmentStatus.environments).forEach(([name, env]) => {
        const health = env.healthStatus.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY';
        console.log(`  ${name}: ${health} (${env.status}) - ${env.version}`);
      });

    } catch (deploymentError) {
      console.log(`❌ Deployment failed: ${deploymentError.message}`);
    }

    // Step 12: Summary
    console.log('\n📊 Step 12: Deployment Summary');
    console.log('=====================================');
    
    console.log('\nMigration Results:');
    migrationResults.forEach((result, index) => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      console.log(`  ${index + 1}. ${status}: ${result.migration.description}`);
      if (!result.success) {
        console.log(`     Error: ${result.error.message}`);
      }
    });

    console.log(`\nValidation Results:`);
    console.log(`  Overall Score: ${validationResult.overallScore}%`);
    console.log(`  Tests Passed: ${validationResult.summary.passedTests}/${validationResult.summary.totalTests}`);
    console.log(`  Critical Issues: ${validationResult.summary.criticalIssues}`);

    console.log('\nRecommendations:');
    if (validationResult.summary.recommendations.length > 0) {
      validationResult.summary.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    } else {
      console.log('  - No specific recommendations');
    }

    console.log('\n✅ Complete zero-downtime deployment example finished successfully!');

  } catch (error) {
    console.error('\n❌ Deployment example failed:', error);
    throw error;
  } finally {
    // Cleanup
    await primaryPool.end();
    await replicaPool.end();
  }
}

/**
 * Example: Simple migration workflow
 */
async function simpleMigrationExample() {
  console.log('🔧 Simple Migration Example\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck'
  });

  try {
    const migrationManager = new ZeroDowntimeMigrationManager(pool);
    await migrationManager.initialize();

    // Create a simple column addition
    const operation = MigrationBuilder.addColumn(
      'users',
      'email_verified BOOLEAN',
      {
        description: 'Add email verification status',
        defaultValue: 'false',
        riskLevel: 'LOW'
      }
    );

    console.log('Migration Operation:');
    console.log(`  Type: ${operation.type}`);
    console.log(`  Table: ${operation.table}`);
    console.log(`  Description: ${operation.description}`);
    console.log(`  Risk Level: ${operation.riskLevel}`);
    console.log(`  SQL: ${operation.sql}`);

    // Execute migration
    const operationId = await migrationManager.executeMigration(operation);
    console.log(`\n✅ Migration completed: ${operationId}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Example: Blue-green deployment only
 */
async function blueGreenExample() {
  console.log('🔄 Blue-Green Deployment Example\n');

  const config = {
    blueEnvironment: {
      connectionString: process.env.BLUE_DATABASE_URL || process.env.DATABASE_URL!,
      poolConfig: { min: 2, max: 10, idleTimeoutMillis: 30000 }
    },
    greenEnvironment: {
      connectionString: process.env.GREEN_DATABASE_URL || process.env.DATABASE_URL!,
      poolConfig: { min: 2, max: 10, idleTimeoutMillis: 30000 }
    },
    switchoverTimeout: 30000,
    enableAutomaticRollback: true
  };

  try {
    const deploymentManager = new BlueGreenDeploymentManager(config);
    await deploymentManager.initialize();

    // Get current environment status
    const status = deploymentManager.getEnvironmentStatus();
    console.log(`Current Active Environment: ${status.active}`);

    // Create deployment plan
    const plan = deploymentManager.createDeploymentPlan('v1.2.0');
    console.log(`\nDeployment Plan: ${plan.sourceEnvironment} → ${plan.targetEnvironment}`);

    // Execute deployment
    const executionId = await deploymentManager.executeDeployment(plan);
    console.log(`\n✅ Deployment completed: ${executionId}`);

    // Get updated status
    const newStatus = deploymentManager.getEnvironmentStatus();
    console.log(`New Active Environment: ${newStatus.active}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

// Export examples
export {
  completeDeploymentExample,
  simpleMigrationExample,
  blueGreenExample
};

// Run example if called directly
if (require.main === module) {
  const exampleType = process.argv[2] || 'complete';
  
  switch (exampleType) {
    case 'simple':
      simpleMigrationExample().catch(console.error);
      break;
    case 'blue-green':
      blueGreenExample().catch(console.error);
      break;
    case 'complete':
    default:
      completeDeploymentExample().catch(console.error);
      break;
  }
}