#!/usr/bin/env node

/**
 * Zero-Downtime Deployment CLI
 * 
 * Command-line interface for managing zero-downtime database deployments
 * and blue-green deployment strategies.
 */

import { Command } from '..\..\..\..\src\shared\components\ui\command';
import { Pool } from 'pg';
import chalk from '..\..\..\..\scripts\cleanup-redundancies';
import ora from '..\..\..\..\src\auth\components\TwoFactorAuth';
import inquirer from '..\..\..\..\scripts\cleanup-redundancies';
import { ZeroDowntimeMigrationManager, MigrationOperation } from './ZeroDowntimeMigrationManager';
import { BlueGreenDeploymentManager, BlueGreenConfig } from './BlueGreenDeploymentManager';
import { logger } from '../../monitoring/logger';

const program = new Command();

// Configuration
const DEFAULT_CONFIG = {
  primaryConnectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck',
  replicaConnectionString: process.env.REPLICA_DATABASE_URL,
  blueConnectionString: process.env.BLUE_DATABASE_URL || process.env.DATABASE_URL,
  greenConnectionString: process.env.GREEN_DATABASE_URL || process.env.DATABASE_URL
};

/**
 * Initialize database connections
 */
function createDatabasePools() {
  const primaryPool = new Pool({
    connectionString: DEFAULT_CONFIG.primaryConnectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  const replicaPool = DEFAULT_CONFIG.replicaConnectionString ? new Pool({
    connectionString: DEFAULT_CONFIG.replicaConnectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  }) : undefined;

  return { primaryPool, replicaPool };
}

/**
 * Create blue-green deployment configuration
 */
function createBlueGreenConfig(): BlueGreenConfig {
  return {
    blueEnvironment: {
      connectionString: DEFAULT_CONFIG.blueConnectionString!,
      poolConfig: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000
      }
    },
    greenEnvironment: {
      connectionString: DEFAULT_CONFIG.greenConnectionString!,
      poolConfig: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000
      }
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
}

/**
 * Migration Commands
 */
program
  .command('migration')
  .description('Zero-downtime migration operations')
  .addCommand(
    new Command('add-column')
      .description('Add a column with zero downtime')
      .requiredOption('-t, --table <table>', 'Table name')
      .requiredOption('-c, --column <column>', 'Column definition')
      .option('-d, --description <description>', 'Migration description')
      .option('--dry-run', 'Show what would be executed without running')
      .action(async (options) => {
        const spinner = ora('Preparing zero-downtime column addition...').start();
        
        try {
          const { primaryPool, replicaPool } = createDatabasePools();
          const migrationManager = new ZeroDowntimeMigrationManager(primaryPool, {}, replicaPool);
          
          await migrationManager.initialize();
          
          const operation: MigrationOperation = {
            id: `add_column_${Date.now()}`,
            type: 'ADD_COLUMN',
            table: options.table,
            description: options.description || `Add column ${options.column} to ${options.table}`,
            estimatedDuration: 30000,
            riskLevel: 'LOW',
            lockingBehavior: 'MINIMAL',
            reversible: true,
            sql: `ALTER TABLE ${options.table} ADD COLUMN ${options.column}`,
            rollbackSql: `ALTER TABLE ${options.table} DROP COLUMN ${options.column.split(' ')[0]}`,
            validationSql: `SELECT 1 FROM information_schema.columns WHERE table_name = '${options.table}' AND column_name = '${options.column.split(' ')[0]}'`
          };

          if (options.dryRun) {
            spinner.succeed('Dry run completed');
            console.log(chalk.blue('\n📋 Migration Plan:'));
            console.log(`  Operation: ${operation.type}`);
            console.log(`  Table: ${operation.table}`);
            console.log(`  Description: ${operation.description}`);
            console.log(`  Risk Level: ${operation.riskLevel}`);
            console.log(`  SQL: ${operation.sql}`);
            console.log(`  Rollback SQL: ${operation.rollbackSql}`);
            return;
          }

          spinner.text = 'Executing zero-downtime migration...';
          
          const operationId = await migrationManager.executeMigration(operation);
          
          spinner.succeed(`Migration completed successfully: ${operationId}`);
          console.log(chalk.green(`✅ Column ${options.column} added to ${options.table}`));

        } catch (error) {
          spinner.fail('Migration failed');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('add-index')
      .description('Add an index with zero downtime')
      .requiredOption('-t, --table <table>', 'Table name')
      .requiredOption('-i, --index <index>', 'Index definition')
      .option('-d, --description <description>', 'Migration description')
      .option('--dry-run', 'Show what would be executed without running')
      .action(async (options) => {
        const spinner = ora('Preparing zero-downtime index creation...').start();
        
        try {
          const { primaryPool, replicaPool } = createDatabasePools();
          const migrationManager = new ZeroDowntimeMigrationManager(primaryPool, {}, replicaPool);
          
          await migrationManager.initialize();
          
          const indexName = options.index.includes('(') ? 
            `idx_${options.table}_${Date.now()}` : 
            options.index;

          const operation: MigrationOperation = {
            id: `add_index_${Date.now()}`,
            type: 'ADD_INDEX',
            table: options.table,
            description: options.description || `Add index ${indexName} to ${options.table}`,
            estimatedDuration: 120000,
            riskLevel: 'MEDIUM',
            lockingBehavior: 'NONE',
            reversible: true,
            sql: options.index.startsWith('CREATE') ? 
              options.index : 
              `CREATE INDEX ${indexName} ON ${options.table} ${options.index}`,
            rollbackSql: `DROP INDEX IF EXISTS ${indexName}`,
            validationSql: `SELECT 1 FROM pg_indexes WHERE tablename = '${options.table}' AND indexname = '${indexName}'`
          };

          if (options.dryRun) {
            spinner.succeed('Dry run completed');
            console.log(chalk.blue('\n📋 Migration Plan:'));
            console.log(`  Operation: ${operation.type}`);
            console.log(`  Table: ${operation.table}`);
            console.log(`  Description: ${operation.description}`);
            console.log(`  Risk Level: ${operation.riskLevel}`);
            console.log(`  SQL: ${operation.sql}`);
            console.log(`  Rollback SQL: ${operation.rollbackSql}`);
            return;
          }

          spinner.text = 'Creating index concurrently...';
          
          const operationId = await migrationManager.executeMigration(operation);
          
          spinner.succeed(`Index creation completed successfully: ${operationId}`);
          console.log(chalk.green(`✅ Index ${indexName} added to ${options.table}`));

        } catch (error) {
          spinner.fail('Index creation failed');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show migration status')
      .option('-o, --operation-id <id>', 'Specific operation ID')
      .action(async (options) => {
        const spinner = ora('Fetching migration status...').start();
        
        try {
          const { primaryPool, replicaPool } = createDatabasePools();
          const migrationManager = new ZeroDowntimeMigrationManager(primaryPool, {}, replicaPool);
          
          await migrationManager.initialize();

          if (options.operationId) {
            const progress = migrationManager.getMigrationProgress(options.operationId);
            
            if (!progress) {
              spinner.fail(`Migration not found: ${options.operationId}`);
              return;
            }

            spinner.succeed('Migration status retrieved');
            console.log(chalk.blue('\n📊 Migration Status:'));
            console.log(`  Operation ID: ${progress.operationId}`);
            console.log(`  Status: ${getStatusColor(progress.status)}${progress.status}${chalk.reset()}`);
            console.log(`  Progress: ${progress.progress}%`);
            console.log(`  Start Time: ${progress.startTime.toISOString()}`);
            
            if (progress.endTime) {
              console.log(`  End Time: ${progress.endTime.toISOString()}`);
              console.log(`  Duration: ${progress.endTime.getTime() - progress.startTime.getTime()}ms`);
            }

            if (progress.errors.length > 0) {
              console.log(chalk.red('\n❌ Errors:'));
              progress.errors.forEach(error => {
                console.log(`  ${error.timestamp.toISOString()}: ${error.error}`);
              });
            }

          } else {
            const activeMigrations = migrationManager.getActiveMigrations();
            
            spinner.succeed('Active migrations retrieved');
            console.log(chalk.blue('\n📊 Active Migrations:'));
            
            if (activeMigrations.size === 0) {
              console.log('  No active migrations');
            } else {
              for (const [id, progress] of activeMigrations) {
                console.log(`  ${id}: ${getStatusColor(progress.status)}${progress.status}${chalk.reset()} (${progress.progress}%)`);
              }
            }
          }

        } catch (error) {
          spinner.fail('Failed to fetch migration status');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  );

/**
 * Blue-Green Deployment Commands
 */
program
  .command('deploy')
  .description('Blue-green deployment operations')
  .addCommand(
    new Command('plan')
      .description('Create a deployment plan')
      .requiredOption('-v, --version <version>', 'Deployment version')
      .option('-o, --output <file>', 'Output plan to file')
      .action(async (options) => {
        const spinner = ora('Creating deployment plan...').start();
        
        try {
          const config = createBlueGreenConfig();
          const deploymentManager = new BlueGreenDeploymentManager(config);
          
          await deploymentManager.initialize();
          
          const plan = deploymentManager.createDeploymentPlan(options.version);
          
          spinner.succeed('Deployment plan created');
          console.log(chalk.blue('\n📋 Deployment Plan:'));
          console.log(`  Plan ID: ${plan.id}`);
          console.log(`  Version: ${plan.version}`);
          console.log(`  Source Environment: ${plan.sourceEnvironment}`);
          console.log(`  Target Environment: ${plan.targetEnvironment}`);
          console.log(`  Estimated Duration: ${Math.round(plan.totalEstimatedDuration / 1000)}s`);
          console.log(`  Risk Level: ${getRiskColor(plan.riskAssessment.level)}${plan.riskAssessment.level}${chalk.reset()}`);
          
          console.log(chalk.blue('\n📝 Steps:'));
          plan.steps.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step.name} (${Math.round(step.estimatedDuration / 1000)}s)`);
            console.log(`     ${step.description}`);
          });

          console.log(chalk.blue('\n🔍 Validation Plan:'));
          console.log(`  Data Consistency: ${plan.validationPlan.dataConsistency ? '✅' : '❌'}`);
          console.log(`  Performance Baseline: ${plan.validationPlan.performanceBaseline ? '✅' : '❌'}`);
          console.log(`  Functional Tests: ${plan.validationPlan.functionalTests ? '✅' : '❌'}`);
          console.log(`  Rollback Readiness: ${plan.validationPlan.rollbackReadiness ? '✅' : '❌'}`);

          if (options.output) {
            const fs = await import('fs/promises');
            await fs.writeFile(options.output, JSON.stringify(plan, null, 2));
            console.log(chalk.green(`\n💾 Plan saved to ${options.output}`));
          }

        } catch (error) {
          spinner.fail('Failed to create deployment plan');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('execute')
      .description('Execute a deployment plan')
      .requiredOption('-v, --version <version>', 'Deployment version')
      .option('-p, --plan <file>', 'Load plan from file')
      .option('--auto-approve', 'Skip manual approval prompts')
      .action(async (options) => {
        const spinner = ora('Preparing deployment execution...').start();
        
        try {
          const config = createBlueGreenConfig();
          
          // Override approval requirement if auto-approve is set
          if (options.autoApprove) {
            config.requireManualApproval = false;
          }

          const deploymentManager = new BlueGreenDeploymentManager(config);
          
          await deploymentManager.initialize();
          
          let plan;
          
          if (options.plan) {
            const fs = await import('fs/promises');
            const planData = await fs.readFile(options.plan, 'utf-8');
            plan = JSON.parse(planData);
          } else {
            plan = deploymentManager.createDeploymentPlan(options.version);
          }

          spinner.succeed('Deployment plan loaded');
          
          // Show deployment summary
          console.log(chalk.blue('\n🚀 Deployment Summary:'));
          console.log(`  Version: ${plan.version}`);
          console.log(`  Source: ${plan.sourceEnvironment} → Target: ${plan.targetEnvironment}`);
          console.log(`  Estimated Duration: ${Math.round(plan.totalEstimatedDuration / 1000)}s`);
          console.log(`  Risk Level: ${getRiskColor(plan.riskAssessment.level)}${plan.riskAssessment.level}${chalk.reset()}`);

          // Confirm execution unless auto-approved
          if (!options.autoApprove) {
            const { confirm } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to proceed with this deployment?',
                default: false
              }
            ]);

            if (!confirm) {
              console.log(chalk.yellow('🛑 Deployment cancelled'));
              return;
            }
          }

          // Set up progress monitoring
          const progressSpinner = ora('Executing deployment...').start();
          
          deploymentManager.on('deployment_step_completed', ({ step }) => {
            progressSpinner.text = `Completed: ${step.name}`;
          });

          deploymentManager.on('deployment_completed', ({ executionId, execution }) => {
            progressSpinner.succeed(`Deployment completed successfully: ${executionId}`);
            console.log(chalk.green(`✅ Version ${plan.version} deployed to ${plan.targetEnvironment}`));
            console.log(`   Duration: ${execution.metrics.totalDuration}ms`);
            
            if (execution.metrics.switchoverDuration) {
              console.log(`   Switchover Duration: ${execution.metrics.switchoverDuration}ms`);
            }
          });

          deploymentManager.on('deployment_failed', ({ executionId, error }) => {
            progressSpinner.fail(`Deployment failed: ${executionId}`);
            console.error(chalk.red(`❌ Error: ${error.message}`));
          });

          deploymentManager.on('deployment_rolled_back', ({ executionId, rollbackDuration }) => {
            console.log(chalk.yellow(`🔄 Deployment rolled back: ${executionId}`));
            console.log(`   Rollback Duration: ${rollbackDuration}ms`);
          });

          // Execute deployment
          const executionId = await deploymentManager.executeDeployment(plan);
          
          console.log(chalk.green(`\n🎉 Deployment execution completed: ${executionId}`));

        } catch (error) {
          spinner.fail('Deployment execution failed');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show deployment status')
      .option('-e, --execution-id <id>', 'Specific execution ID')
      .action(async (options) => {
        const spinner = ora('Fetching deployment status...').start();
        
        try {
          const config = createBlueGreenConfig();
          const deploymentManager = new BlueGreenDeploymentManager(config);
          
          await deploymentManager.initialize();

          if (options.executionId) {
            const execution = deploymentManager.getDeploymentStatus(options.executionId);
            
            if (!execution) {
              spinner.fail(`Deployment execution not found: ${options.executionId}`);
              return;
            }

            spinner.succeed('Deployment status retrieved');
            console.log(chalk.blue('\n📊 Deployment Status:'));
            console.log(`  Execution ID: ${execution.id}`);
            console.log(`  Status: ${getStatusColor(execution.status)}${execution.status}${chalk.reset()}`);
            console.log(`  Progress: ${execution.progress}%`);
            console.log(`  Current Step: ${execution.currentStep}/${execution.totalSteps}`);
            console.log(`  Start Time: ${execution.startTime.toISOString()}`);
            
            if (execution.endTime) {
              console.log(`  End Time: ${execution.endTime.toISOString()}`);
              console.log(`  Duration: ${execution.endTime.getTime() - execution.startTime.getTime()}ms`);
            }

            // Show validation results
            if (Object.keys(execution.validationResults).length > 0) {
              console.log(chalk.blue('\n🔍 Validation Results:'));
              
              Object.entries(execution.validationResults).forEach(([key, result]) => {
                if (result) {
                  const status = result.passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
                  console.log(`  ${key}: ${status}`);
                }
              });
            }

            if (execution.errors.length > 0) {
              console.log(chalk.red('\n❌ Errors:'));
              execution.errors.forEach(error => {
                console.log(`  ${error.timestamp.toISOString()}: ${error.error}`);
              });
            }

          } else {
            const environmentStatus = deploymentManager.getEnvironmentStatus();
            const activeDeployments = deploymentManager.getActiveDeployments();
            
            spinner.succeed('Environment status retrieved');
            console.log(chalk.blue('\n🌍 Environment Status:'));
            console.log(`  Active Environment: ${chalk.green(environmentStatus.active)}`);
            
            console.log(chalk.blue('\n📊 Environment Health:'));
            Object.entries(environmentStatus.environments).forEach(([name, env]) => {
              const healthStatus = env.healthStatus.isHealthy ? 
                chalk.green('✅ HEALTHY') : 
                chalk.red('❌ UNHEALTHY');
              
              console.log(`  ${name}: ${healthStatus} (${env.status})`);
              console.log(`    Version: ${env.version}`);
              console.log(`    Response Time: ${env.healthStatus.responseTime}ms`);
              console.log(`    Last Check: ${env.healthStatus.lastCheck.toISOString()}`);
            });
            
            console.log(chalk.blue('\n🚀 Active Deployments:'));
            if (activeDeployments.size === 0) {
              console.log('  No active deployments');
            } else {
              for (const [id, execution] of activeDeployments) {
                console.log(`  ${id}: ${getStatusColor(execution.status)}${execution.status}${chalk.reset()} (${execution.progress}%)`);
              }
            }
          }

        } catch (error) {
          spinner.fail('Failed to fetch deployment status');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('rollback')
      .description('Rollback a deployment')
      .requiredOption('-e, --execution-id <id>', 'Execution ID to rollback')
      .action(async (options) => {
        const spinner = ora('Preparing deployment rollback...').start();
        
        try {
          const config = createBlueGreenConfig();
          const deploymentManager = new BlueGreenDeploymentManager(config);
          
          await deploymentManager.initialize();

          // Confirm rollback
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to rollback deployment ${options.executionId}?`,
              default: false
            }
          ]);

          if (!confirm) {
            spinner.stop();
            console.log(chalk.yellow('🛑 Rollback cancelled'));
            return;
          }

          spinner.text = 'Executing rollback...';
          
          await deploymentManager.rollbackDeployment(options.executionId);
          
          spinner.succeed(`Rollback completed successfully: ${options.executionId}`);
          console.log(chalk.green(`✅ Deployment ${options.executionId} rolled back`));

        } catch (error) {
          spinner.fail('Rollback failed');
          console.error(chalk.red(`❌ Error: ${error.message}`));
          process.exit(1);
        }
      })
  );

/**
 * Utility Commands
 */
program
  .command('health')
  .description('Check deployment system health')
  .action(async () => {
    const spinner = ora('Checking system health...').start();
    
    try {
      const { primaryPool, replicaPool } = createDatabasePools();
      
      // Test primary connection
      const primaryClient = await primaryPool.connect();
      const primaryStart = Date.now();
      await primaryClient.query('SELECT 1');
      const primaryResponseTime = Date.now() - primaryStart;
      primaryClient.release();

      // Test replica connection if available
      let replicaResponseTime = 0;
      if (replicaPool) {
        const replicaClient = await replicaPool.connect();
        const replicaStart = Date.now();
        await replicaClient.query('SELECT 1');
        replicaResponseTime = Date.now() - replicaStart;
        replicaClient.release();
      }

      spinner.succeed('System health check completed');
      console.log(chalk.blue('\n🏥 System Health:'));
      console.log(`  Primary Database: ${chalk.green('✅ HEALTHY')} (${primaryResponseTime}ms)`);
      
      if (replicaPool) {
        console.log(`  Replica Database: ${chalk.green('✅ HEALTHY')} (${replicaResponseTime}ms)`);
      } else {
        console.log(`  Replica Database: ${chalk.yellow('⚠️  NOT CONFIGURED')}`);
      }

      // Test blue-green environments if configured
      if (DEFAULT_CONFIG.blueConnectionString && DEFAULT_CONFIG.greenConnectionString) {
        const config = createBlueGreenConfig();
        const deploymentManager = new BlueGreenDeploymentManager(config);
        
        await deploymentManager.initialize();
        const environmentStatus = deploymentManager.getEnvironmentStatus();
        
        console.log(chalk.blue('\n🌍 Blue-Green Environments:'));
        Object.entries(environmentStatus.environments).forEach(([name, env]) => {
          const healthStatus = env.healthStatus.isHealthy ? 
            chalk.green('✅ HEALTHY') : 
            chalk.red('❌ UNHEALTHY');
          
          console.log(`  ${name}: ${healthStatus} (${env.healthStatus.responseTime}ms)`);
        });
      }

    } catch (error) {
      spinner.fail('System health check failed');
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Helper functions
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'ACTIVE':
      return chalk.green.bold;
    case 'RUNNING':
    case 'PREPARING':
      return chalk.blue.bold;
    case 'FAILED':
    case 'UNHEALTHY':
      return chalk.red.bold;
    case 'CANCELLED':
    case 'ROLLED_BACK':
      return chalk.yellow.bold;
    default:
      return chalk.gray.bold;
  }
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return chalk.green.bold;
    case 'MEDIUM':
      return chalk.yellow.bold;
    case 'HIGH':
      return chalk.orange.bold;
    case 'CRITICAL':
      return chalk.red.bold;
    default:
      return chalk.gray.bold;
  }
}

// Configure program
program
  .name('deployment-cli')
  .description('Zero-downtime database deployment and migration tool')
  .version('1.0.0');

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}