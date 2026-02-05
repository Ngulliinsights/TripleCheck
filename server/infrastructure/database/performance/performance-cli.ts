#!/usr/bin/env node

/**
 * Performance Testing CLI
 * 
 * Command-line interface for database performance testing, load testing,
 * and performance certification.
 */

import { Command } from '..\..\..\..\src\shared\components\ui\command';
import { Pool } from 'pg';
import chalk from '..\..\..\..\scripts\cleanup-redundancies';
import ora from '..\..\..\..\src\auth\components\TwoFactorAuth';
import inquirer from '..\..\..\..\scripts\cleanup-redundancies';
import { LoadTestingFramework } from './LoadTestingFramework';
import { PerformanceCertificationSystem } from './PerformanceCertificationSystem';

const program = new Command();

// Configuration
const DEFAULT_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck',
  reportsDir: './database/performance/reports'
};

/**
 * Initialize database connection
 */
function createDatabasePool(): Pool {
  return new Pool({
    connectionString: DEFAULT_CONFIG.connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
}

/**
 * Load Testing Commands
 */
program
  .command('load-test')
  .description('Execute comprehensive load testing')
  .option('-u, --users <number>', 'Maximum concurrent users', '1000')
  .option('-d, --duration <seconds>', 'Test duration in seconds', '300')
  .option('-w, --warmup <seconds>', 'Warmup duration in seconds', '30')
  .option('--ramp-up <seconds>', 'Ramp-up duration in seconds', '60')
  .option('--target-qps <number>', 'Target queries per second', '10000')
  .option('--target-response <ms>', 'Target average response time in ms', '50')
  .option('--output <format>', 'Output format (json|html|csv)', 'json')
  .option('--real-time', 'Enable real-time metrics display', false)
  .action(async (options) => {
    const spinner = ora('Initializing load testing framework...').start();
    
    try {
      const pool = createDatabasePool();
      
      const config = {
        testDuration: parseInt(options.duration) * 1000,
        warmupDuration: parseInt(options.warmup) * 1000,
        maxConcurrentUsers: parseInt(options.users),
        rampUpDuration: parseInt(options.rampUp) * 1000,
        performanceTargets: {
          avgResponseTime: parseInt(options.targetResponse),
          p95ResponseTime: parseInt(options.targetResponse) * 2,
          p99ResponseTime: parseInt(options.targetResponse) * 4,
          throughput: parseInt(options.targetQps),
          errorRate: 0.0001,
          connectionSuccessRate: 0.9999
        },
        reporting: {
          enableRealTimeMetrics: options.realTime,
          metricsInterval: 5000,
          enableDetailedLogging: true,
          generateReport: true,
          reportFormat: options.output
        }
      };

      const loadTest = new LoadTestingFramework(pool, config);
      
      spinner.succeed('Load testing framework initialized');
      
      // Set up event listeners for real-time feedback
      if (options.realTime) {
        loadTest.on('test_started', ({ testId }) => {
          console.log(chalk.blue(`\n🚀 Load test started: ${testId}`));
        });

        loadTest.on('phase_started', ({ phase, duration }) => {
          console.log(chalk.yellow(`📋 Phase started: ${phase} (${Math.round(duration / 1000)}s)`));
        });

        loadTest.on('ramp_up_step', ({ step, totalSteps, currentUsers, targetUsers }) => {
          const progress = Math.round((step / totalSteps) * 100);
          console.log(chalk.cyan(`📈 Ramp-up: ${progress}% (${currentUsers}/${targetUsers} users)`));
        });

        loadTest.on('metrics_updated', ({ metrics }) => {
          if (metrics.throughput.qps > 0) {
            console.log(chalk.green(
              `📊 QPS: ${Math.round(metrics.throughput.qps)} | ` +
              `Avg Response: ${Math.round(metrics.responseTime.avg)}ms | ` +
              `Errors: ${Math.round(metrics.errors.errorRate * 100 * 1000) / 1000}%`
            ));
          }
        });

        loadTest.on('phase_completed', ({ phase }) => {
          console.log(chalk.green(`✅ Phase completed: ${phase}`));
        });
      }

      // Execute load test
      const progressSpinner = ora('Executing load test...').start();
      
      const result = await loadTest.executeLoadTest();
      
      progressSpinner.succeed('Load test completed');
      
      // Display results
      console.log(chalk.blue('\n📊 Load Test Results:'));
      console.log(`Test ID: ${result.testId}`);
      console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(`Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}`);
      console.log(`Score: ${result.score}%`);
      
      console.log(chalk.blue('\n📈 Performance Metrics:'));
      console.log(`Average Response Time: ${Math.round(result.metrics.responseTime.avg)}ms`);
      console.log(`P95 Response Time: ${Math.round(result.metrics.responseTime.p95)}ms`);
      console.log(`P99 Response Time: ${Math.round(result.metrics.responseTime.p99)}ms`);
      console.log(`Throughput: ${Math.round(result.metrics.throughput.qps)} qps`);
      console.log(`Total Queries: ${result.metrics.throughput.totalQueries}`);
      console.log(`Error Rate: ${(result.metrics.errors.errorRate * 100).toFixed(3)}%`);

      if (result.issues.length > 0) {
        console.log(chalk.red('\n❌ Issues Found:'));
        result.issues.forEach(issue => {
          const severityColor = issue.severity === 'CRITICAL' ? chalk.red : 
                               issue.severity === 'HIGH' ? chalk.yellow : chalk.gray;
          console.log(`${severityColor(`[${issue.severity}]`)} ${issue.message}`);
          console.log(`   Recommendation: ${issue.recommendation}`);
        });
      }

      if (result.recommendations.length > 0) {
        console.log(chalk.blue('\n💡 Recommendations:'));
        result.recommendations.forEach(rec => {
          console.log(`• ${rec}`);
        });
      }

      await pool.end();

    } catch (error) {
      spinner.fail('Load test failed');
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Performance Certification Commands
 */
program
  .command('certify')
  .description('Execute comprehensive performance certification')
  .option('--scenarios <scenarios>', 'Comma-separated list of scenarios to run', 'normal_load,peak_load,stress_test')
  .option('--passing-score <score>', 'Minimum passing score percentage', '85')
  .option('--output-dir <dir>', 'Output directory for reports', DEFAULT_CONFIG.reportsDir)
  .option('--formats <formats>', 'Report formats (json,html,pdf)', 'json,html')
  .option('--interactive', 'Interactive mode with confirmations', false)
  .action(async (options) => {
    const spinner = ora('Initializing performance certification system...').start();
    
    try {
      const pool = createDatabasePool();
      
      const scenarios = options.scenarios.split(',').map((s: string) => s.trim());
      const reportFormats = options.formats.split(',').map((f: string) => f.trim());
      
      const config = {
        certification: {
          passingScore: parseInt(options.passingScore),
          criticalFailureThreshold: 0,
          requiredScenarios: scenarios,
          validityPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
        },
        reporting: {
          generateDetailedReport: true,
          includeRecommendations: true,
          includePerformanceGraphs: true,
          reportFormats,
          outputDirectory: options.outputDir
        }
      };

      const certificationSystem = new PerformanceCertificationSystem(pool, config);
      
      spinner.succeed('Performance certification system initialized');
      
      // Interactive confirmation
      if (options.interactive) {
        console.log(chalk.blue('\n🏆 Performance Certification Configuration:'));
        console.log(`Scenarios: ${scenarios.join(', ')}`);
        console.log(`Passing Score: ${options.passingScore}%`);
        console.log(`Report Formats: ${reportFormats.join(', ')}`);
        console.log(`Output Directory: ${options.outputDir}`);
        
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to proceed with performance certification?',
            default: true
          }
        ]);

        if (!confirm) {
          console.log(chalk.yellow('🛑 Certification cancelled'));
          return;
        }
      }

      // Set up event listeners
      certificationSystem.on('certification_started', ({ certificationId }) => {
        console.log(chalk.blue(`\n🏆 Performance certification started: ${certificationId}`));
      });

      certificationSystem.on('scenario_started', ({ scenario }) => {
        console.log(chalk.yellow(`🧪 Executing scenario: ${scenario}`));
      });

      certificationSystem.on('scenario_completed', ({ scenario, passed, score }) => {
        const status = passed ? chalk.green('PASSED') : chalk.red('FAILED');
        console.log(`${status} ${scenario}: ${score}%`);
      });

      certificationSystem.on('load_test_phase', ({ scenario, phase }) => {
        console.log(chalk.cyan(`   📋 ${scenario}: ${phase} phase`));
      });

      // Execute certification
      const certSpinner = ora('Executing performance certification...').start();
      
      const result = await certificationSystem.executeCertification();
      
      certSpinner.succeed('Performance certification completed');
      
      // Display results
      const statusColor = result.passed ? chalk.green : chalk.red;
      const statusText = result.passed ? 'PASSED' : 'FAILED';
      
      console.log(chalk.blue('\n🏆 Performance Certification Results:'));
      console.log(`Certification ID: ${result.certificationId}`);
      console.log(`Status: ${statusColor(statusText)}`);
      console.log(`Overall Score: ${result.overallScore}%`);
      console.log(`Valid Until: ${result.validUntil.toISOString()}`);
      
      console.log(chalk.blue('\n📊 Performance Summary:'));
      console.log(`Average Response Time: ${result.performanceSummary.avgResponseTime}ms`);
      console.log(`P95 Response Time: ${result.performanceSummary.p95ResponseTime}ms`);
      console.log(`Sustained Throughput: ${result.performanceSummary.sustainedThroughput} qps`);
      console.log(`Peak Throughput: ${result.performanceSummary.peakThroughput} qps`);
      console.log(`Error Rate: ${(result.performanceSummary.errorRate * 100).toFixed(3)}%`);
      console.log(`Uptime: ${(result.performanceSummary.uptime * 100).toFixed(2)}%`);

      console.log(chalk.blue('\n🧪 Scenario Results:'));
      result.scenarios.forEach(scenario => {
        const status = scenario.passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
        console.log(`${status} ${scenario.name}: ${scenario.score}%`);
        
        if (scenario.issues.length > 0) {
          scenario.issues.forEach((issue: any) => {
            const severityColor = issue.severity === 'CRITICAL' ? chalk.red : 
                                 issue.severity === 'HIGH' ? chalk.yellow : chalk.gray;
            console.log(`    ${severityColor(`[${issue.severity}]`)} ${issue.message}`);
          });
        }
      });

      if (result.criticalIssues.length > 0) {
        console.log(chalk.red('\n🚨 Critical Issues:'));
        result.criticalIssues.forEach(issue => {
          console.log(`• ${issue.scenario}: ${issue.issue}`);
          console.log(`  Recommendation: ${issue.recommendation}`);
        });
      }

      if (result.recommendations.length > 0) {
        console.log(chalk.blue('\n💡 Recommendations:'));
        result.recommendations.forEach(rec => {
          const priorityColor = rec.priority === 'HIGH' ? chalk.red : 
                               rec.priority === 'MEDIUM' ? chalk.yellow : chalk.gray;
          console.log(`${priorityColor(`[${rec.priority}]`)} ${rec.category}: ${rec.recommendation}`);
          console.log(`   Expected Impact: ${rec.expectedImpact}`);
        });
      }

      console.log(chalk.blue(`\n📄 Reports generated in: ${options.outputDir}`));
      
      if (result.passed) {
        console.log(chalk.green('\n🎉 Performance certification PASSED! Database is ready for production.'));
      } else {
        console.log(chalk.red('\n❌ Performance certification FAILED. Please address the issues before production deployment.'));
      }

      await pool.end();

    } catch (error) {
      spinner.fail('Performance certification failed');
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Quick Performance Check
 */
program
  .command('quick-check')
  .description('Quick performance health check')
  .option('-q, --queries <number>', 'Number of test queries', '100')
  .option('-c, --connections <number>', 'Number of concurrent connections', '10')
  .action(async (options) => {
    const spinner = ora('Running quick performance check...').start();
    
    try {
      const pool = createDatabasePool();
      const queries = parseInt(options.queries);
      const connections = parseInt(options.connections);
      
      const startTime = Date.now();
      const results: number[] = [];
      let errors = 0;

      // Execute concurrent queries
      const promises = [];
      for (let i = 0; i < connections; i++) {
        promises.push(
          (async () => {
            const client = await pool.connect();
            try {
              for (let j = 0; j < Math.floor(queries / connections); j++) {
                const queryStart = Date.now();
                try {
                  await client.query('SELECT COUNT(*) FROM users');
                  results.push(Date.now() - queryStart);
                } catch (error) {
                  errors++;
                }
              }
            } finally {
              client.release();
            }
          })()
        );
      }

      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      
      spinner.succeed('Quick performance check completed');
      
      // Calculate statistics
      results.sort((a, b) => a - b);
      const avg = results.reduce((sum, val) => sum + val, 0) / results.length;
      const p95 = results[Math.floor(results.length * 0.95)];
      const p99 = results[Math.floor(results.length * 0.99)];
      const qps = Math.round((results.length / totalTime) * 1000);
      const errorRate = (errors / (results.length + errors)) * 100;

      console.log(chalk.blue('\n⚡ Quick Performance Check Results:'));
      console.log(`Total Queries: ${results.length + errors}`);
      console.log(`Successful Queries: ${results.length}`);
      console.log(`Failed Queries: ${errors}`);
      console.log(`Total Time: ${totalTime}ms`);
      console.log(`Queries per Second: ${qps}`);
      console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
      
      console.log(chalk.blue('\n📊 Response Time Statistics:'));
      console.log(`Average: ${Math.round(avg)}ms`);
      console.log(`Minimum: ${results[0]}ms`);
      console.log(`Maximum: ${results[results.length - 1]}ms`);
      console.log(`P95: ${p95}ms`);
      console.log(`P99: ${p99}ms`);

      // Health assessment
      let healthScore = 100;
      const issues: string[] = [];

      if (avg > 50) {
        healthScore -= 20;
        issues.push('Average response time exceeds 50ms target');
      }
      
      if (p95 > 100) {
        healthScore -= 15;
        issues.push('P95 response time exceeds 100ms target');
      }
      
      if (qps < 1000) {
        healthScore -= 15;
        issues.push('Throughput below 1000 qps target');
      }
      
      if (errorRate > 0.1) {
        healthScore -= 25;
        issues.push('Error rate exceeds 0.1% threshold');
      }

      const healthColor = healthScore >= 80 ? chalk.green : 
                         healthScore >= 60 ? chalk.yellow : chalk.red;
      
      console.log(chalk.blue('\n🏥 Health Assessment:'));
      console.log(`Health Score: ${healthColor(healthScore + '%')}`);
      
      if (issues.length > 0) {
        console.log(chalk.yellow('\n⚠️  Issues Found:'));
        issues.forEach(issue => console.log(`• ${issue}`));
      } else {
        console.log(chalk.green('\n✅ No performance issues detected'));
      }

      await pool.end();

    } catch (error) {
      spinner.fail('Quick performance check failed');
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Database Health Check
 */
program
  .command('health')
  .description('Check database health and performance metrics')
  .action(async () => {
    const spinner = ora('Checking database health...').start();
    
    try {
      const pool = createDatabasePool();
      const client = await pool.connect();
      
      try {
        // Basic connectivity test
        const connectStart = Date.now();
        await client.query('SELECT 1');
        const connectTime = Date.now() - connectStart;

        // Get database version
        const versionResult = await client.query('SELECT version()');
        const version = versionResult.rows[0].version;

        // Get connection statistics
        const connectionResult = await client.query(`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity
        `);
        
        const connections = connectionResult.rows[0];

        // Get database size
        const sizeResult = await client.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);
        
        const dbSize = sizeResult.rows[0].size;

        // Get table statistics
        const tableResult = await client.query(`
          SELECT 
            count(*) as table_count,
            sum(n_tup_ins + n_tup_upd + n_tup_del) as total_modifications
          FROM pg_stat_user_tables
        `);
        
        const tableStats = tableResult.rows[0];

        spinner.succeed('Database health check completed');
        
        console.log(chalk.blue('\n🏥 Database Health Status:'));
        console.log(`Connection Time: ${connectTime}ms`);
        console.log(`Database Version: ${version.split(' ')[0]} ${version.split(' ')[1]}`);
        console.log(`Database Size: ${dbSize}`);
        
        console.log(chalk.blue('\n📊 Connection Statistics:'));
        console.log(`Total Connections: ${connections.total_connections}`);
        console.log(`Active Connections: ${connections.active_connections}`);
        console.log(`Idle Connections: ${connections.idle_connections}`);
        
        console.log(chalk.blue('\n📈 Table Statistics:'));
        console.log(`Total Tables: ${tableStats.table_count}`);
        console.log(`Total Modifications: ${tableStats.total_modifications || 0}`);

        // Health assessment
        const healthIssues: string[] = [];
        
        if (connectTime > 100) {
          healthIssues.push('High connection latency detected');
        }
        
        if (parseInt(connections.active_connections) > 50) {
          healthIssues.push('High number of active connections');
        }

        if (healthIssues.length === 0) {
          console.log(chalk.green('\n✅ Database health is good'));
        } else {
          console.log(chalk.yellow('\n⚠️  Health Issues:'));
          healthIssues.forEach(issue => console.log(`• ${issue}`));
        }

      } finally {
        client.release();
        await pool.end();
      }

    } catch (error) {
      spinner.fail('Database health check failed');
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Benchmark Command
 */
program
  .command('benchmark')
  .description('Run standard database benchmarks')
  .option('--read-heavy', 'Run read-heavy benchmark', false)
  .option('--write-heavy', 'Run write-heavy benchmark', false)
  .option('--mixed', 'Run mixed read/write benchmark', true)
  .option('-d, --duration <seconds>', 'Benchmark duration in seconds', '60')
  .action(async (options) => {
    const spinner = ora('Running database benchmark...').start();
    
    try {
      const pool = createDatabasePool();
      const duration = parseInt(options.duration) * 1000;
      
      let benchmarkType = 'mixed';
      if (options.readHeavy) benchmarkType = 'read-heavy';
      if (options.writeHeavy) benchmarkType = 'write-heavy';
      
      spinner.text = `Running ${benchmarkType} benchmark for ${options.duration}s...`;
      
      const startTime = Date.now();
      const results = {
        reads: 0,
        writes: 0,
        errors: 0,
        responseTimes: [] as number[]
      };

      // Run benchmark
      const endTime = startTime + duration;
      const workers = [];
      
      for (let i = 0; i < 10; i++) {
        workers.push(
          (async () => {
            const client = await pool.connect();
            try {
              while (Date.now() < endTime) {
                const queryStart = Date.now();
                
                try {
                  if (benchmarkType === 'read-heavy' || 
                      (benchmarkType === 'mixed' && Math.random() > 0.3)) {
                    // Read operation
                    await client.query('SELECT * FROM users ORDER BY random() LIMIT 10');
                    results.reads++;
                  } else {
                    // Write operation
                    await client.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [
                      Math.floor(Math.random() * 1000) + 1
                    ]);
                    results.writes++;
                  }
                  
                  results.responseTimes.push(Date.now() - queryStart);
                  
                } catch (error) {
                  results.errors++;
                }
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            } finally {
              client.release();
            }
          })()
        );
      }

      await Promise.all(workers);
      
      const totalTime = Date.now() - startTime;
      const totalOps = results.reads + results.writes;
      
      spinner.succeed('Database benchmark completed');
      
      // Calculate statistics
      results.responseTimes.sort((a, b) => a - b);
      const avgResponseTime = results.responseTimes.reduce((sum, val) => sum + val, 0) / results.responseTimes.length;
      const p95ResponseTime = results.responseTimes[Math.floor(results.responseTimes.length * 0.95)];
      const opsPerSecond = Math.round((totalOps / totalTime) * 1000);
      const errorRate = (results.errors / (totalOps + results.errors)) * 100;

      console.log(chalk.blue(`\n🏁 ${benchmarkType.toUpperCase()} Benchmark Results:`));
      console.log(`Duration: ${Math.round(totalTime / 1000)}s`);
      console.log(`Total Operations: ${totalOps}`);
      console.log(`Read Operations: ${results.reads}`);
      console.log(`Write Operations: ${results.writes}`);
      console.log(`Failed Operations: ${results.errors}`);
      console.log(`Operations per Second: ${opsPerSecond}`);
      console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
      
      console.log(chalk.blue('\n📊 Response Time Statistics:'));
      console.log(`Average: ${Math.round(avgResponseTime)}ms`);
      console.log(`P95: ${p95ResponseTime}ms`);
      console.log(`Min: ${results.responseTimes[0]}ms`);
      console.log(`Max: ${results.responseTimes[results.responseTimes.length - 1]}ms`);

      await pool.end();

    } catch (error) {
      spinner.fail('Database benchmark failed');
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Configure program
program
  .name('performance-cli')
  .description('Database performance testing and certification tool')
  .version('1.0.0');

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}