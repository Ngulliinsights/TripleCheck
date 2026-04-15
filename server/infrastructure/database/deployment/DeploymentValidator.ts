/**
 * Deployment Validator
 * 
 * Comprehensive validation system for zero-downtime deployments.
 * Validates data consistency, performance baselines, and functional requirements.
 */

import { EventEmitter } from 'events';
import { Pool, PoolClient } from 'pg';
import { logger } from '../../monitoring/logger';
import { observabilitySystem } from '../../monitoring/ObservabilitySystem';

export interface ValidationConfig {
  // Data Consistency Validation
  dataConsistency: {
    enabled: boolean;
    sampleSize: number;              // 1000 rows to sample
    toleranceThreshold: number;      // 0.01% tolerance for differences
    criticalTables: string[];        // Tables that must be 100% consistent
    checksumValidation: boolean;     // Enable checksum validation
  };
  
  // Performance Validation
  performance: {
    enabled: boolean;
    baselineMetrics: {
      avgResponseTime: number;       // 50ms baseline
      p95ResponseTime: number;       // 100ms baseline
      throughput: number;            // 1000 qps baseline
      errorRate: number;             // 0.01% baseline
    };
    toleranceMultiplier: number;     // 1.2x tolerance (20% degradation allowed)
    testDuration: number;            // 60 seconds test duration
    warmupDuration: number;          // 10 seconds warmup
  };
  
  // Functional Testing
  functional: {
    enabled: boolean;
    testSuites: Array<{
      name: string;
      description: string;
      tests: Array<{
        name: string;
        sql: string;
        expectedResult?: any;
        timeout: number;
      }>;
    }>;
    parallelExecution: boolean;      // Run tests in parallel
    failFast: boolean;               // Stop on first failure
  };
  
  // Schema Validation
  schema: {
    enabled: boolean;
    validateConstraints: boolean;    // Validate foreign keys, checks, etc.
    validateIndexes: boolean;        // Validate index consistency
    validatePermissions: boolean;    // Validate user permissions
    validateTriggers: boolean;       // Validate triggers and functions
  };
  
  // Rollback Readiness
  rollback: {
    enabled: boolean;
    testRollbackProcedure: boolean;  // Test rollback without executing
    validateBackupIntegrity: boolean; // Validate backup availability
    checkDependencies: boolean;      // Check for blocking dependencies
  };
}

export interface ValidationResult {
  validationType: 'DATA_CONSISTENCY' | 'PERFORMANCE' | 'FUNCTIONAL' | 'SCHEMA' | 'ROLLBACK';
  passed: boolean;
  score: number;                     // 0-100 score
  startTime: Date;
  endTime: Date;
  duration: number;
  details: {
    summary: string;
    metrics?: Record<string, number>;
    tests?: Array<{
      name: string;
      passed: boolean;
      duration: number;
      error?: string;
      details?: any;
    }>;
    issues?: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      table?: string;
      query?: string;
      recommendation?: string;
    }>;
  };
  recommendations: string[];
}

export interface ComprehensiveValidationResult {
  overallPassed: boolean;
  overallScore: number;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  results: ValidationResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: number;
    recommendations: string[];
  };
}

export class DeploymentValidator extends EventEmitter {
  private config: ValidationConfig;
  private sourcePool: Pool;
  private targetPool: Pool;
  private isInitialized = false;

  constructor(
    sourcePool: Pool,
    targetPool: Pool,
    config: Partial<ValidationConfig> = {}
  ) {
    super();
    
    this.sourcePool = sourcePool;
    this.targetPool = targetPool;
    
    this.config = {
      dataConsistency: {
        enabled: true,
        sampleSize: 1000,
        toleranceThreshold: 0.0001, // 0.01%
        criticalTables: ['users', 'properties', 'transactions', 'land_verification_sessions'],
        checksumValidation: true,
        ...config.dataConsistency
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
        warmupDuration: 10000,
        ...config.performance
      },
      functional: {
        enabled: true,
        testSuites: [],
        parallelExecution: true,
        failFast: false,
        ...config.functional
      },
      schema: {
        enabled: true,
        validateConstraints: true,
        validateIndexes: true,
        validatePermissions: true,
        validateTriggers: true,
        ...config.schema
      },
      rollback: {
        enabled: true,
        testRollbackProcedure: true,
        validateBackupIntegrity: true,
        checkDependencies: true,
        ...config.rollback
      }
    };
  }

  /**
   * Initialize the deployment validator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('DeploymentValidator already initialized');
      return;
    }

    try {
      logger.info('🔄 Initializing Deployment Validator...');

      // Test connections
      await this.testConnections();

      // Load default functional tests if none provided
      if (this.config.functional.testSuites.length === 0) {
        this.loadDefaultFunctionalTests();
      }

      this.isInitialized = true;
      this.emit('initialized');
      logger.info('✅ Deployment Validator initialized');

    } catch (error) {
      logger.error({ error: error }, '❌ Failed to initialize Deployment Validator:');
      this.emit('initialization_error', error);
      throw error;
    }
  }

  /**
   * Run comprehensive validation
   */
  async validateDeployment(): Promise<ComprehensiveValidationResult> {
    if (!this.isInitialized) {
      throw new Error('Validator not initialized');
    }

    const startTime = new Date();
    const results: ValidationResult[] = [];
    
    logger.info('🔍 Starting comprehensive deployment validation...');
    this.emit('validation_started');

    try {
      // Data Consistency Validation
      if (this.config.dataConsistency.enabled) {
        const result = await this.validateDataConsistency();
        results.push(result);
        this.emit('validation_completed', { type: 'DATA_CONSISTENCY', result });
      }

      // Performance Validation
      if (this.config.performance.enabled) {
        const result = await this.validatePerformance();
        results.push(result);
        this.emit('validation_completed', { type: 'PERFORMANCE', result });
      }

      // Functional Testing
      if (this.config.functional.enabled) {
        const result = await this.runFunctionalTests();
        results.push(result);
        this.emit('validation_completed', { type: 'FUNCTIONAL', result });
      }

      // Schema Validation
      if (this.config.schema.enabled) {
        const result = await this.validateSchema();
        results.push(result);
        this.emit('validation_completed', { type: 'SCHEMA', result });
      }

      // Rollback Readiness
      if (this.config.rollback.enabled) {
        const result = await this.validateRollbackReadiness();
        results.push(result);
        this.emit('validation_completed', { type: 'ROLLBACK', result });
      }

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      // Calculate overall results
      const overallPassed = results.every(r => r.passed);
      const overallScore = results.length > 0 ? 
        Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0;

      const summary = {
        totalTests: results.reduce((sum, r) => sum + (r.details.tests?.length || 1), 0),
        passedTests: results.reduce((sum, r) => sum + (r.details.tests?.filter(t => t.passed).length || (r.passed ? 1 : 0)), 0),
        failedTests: results.reduce((sum, r) => sum + (r.details.tests?.filter(t => !t.passed).length || (!r.passed ? 1 : 0)), 0),
        criticalIssues: results.reduce((sum, r) => sum + (r.details.issues?.filter(i => i.severity === 'CRITICAL').length || 0), 0),
        recommendations: results.flatMap(r => r.recommendations)
      };

      const comprehensiveResult: ComprehensiveValidationResult = {
        overallPassed,
        overallScore,
        startTime,
        endTime,
        totalDuration,
        results,
        summary
      };

      this.emit('validation_finished', comprehensiveResult);
      logger.info(`${overallPassed ? '✅' : '❌'} Comprehensive validation completed`, {
        passed: overallPassed,
        score: overallScore,
        duration: totalDuration
      });

      // Record metrics
      observabilitySystem.recordMetric({
        name: 'deployment_validation_completed',
        value: 1,
        labels: { 
          passed: overallPassed.toString(),
          score: overallScore.toString()
        }
      });

      return comprehensiveResult;

    } catch (error) {
      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      this.emit('validation_error', error);
      logger.error({ error: error }, '❌ Comprehensive validation failed:');

      throw error;
    }
  }

  /**
   * Validate data consistency between source and target
   */
  private async validateDataConsistency(): Promise<ValidationResult> {
    const startTime = new Date();
    logger.info('🔍 Validating data consistency...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();
    
    try {
      const tests: Array<{
        name: string;
        passed: boolean;
        duration: number;
        error?: string;
        details?: any;
      }> = [];

      const issues: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        table?: string;
        recommendation?: string;
      }> = [];

      // Get list of tables to validate
      const tablesResult = await sourceClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tables = tablesResult.rows.map(row => row.table_name);
      
      for (const table of tables) {
        const testStart = Date.now();
        
        try {
          // Row count comparison
          const sourceCountResult = await sourceClient.query(`SELECT COUNT(*) as count FROM ${table}`);
          const targetCountResult = await targetClient.query(`SELECT COUNT(*) as count FROM ${table}`);
          
          const sourceCount = parseInt(sourceCountResult.rows[0].count);
          const targetCount = parseInt(targetCountResult.rows[0].count);
          
          const countDifference = Math.abs(sourceCount - targetCount);
          const countTolerance = Math.max(1, Math.floor(sourceCount * this.config.dataConsistency.toleranceThreshold));
          
          const countTestPassed = countDifference <= countTolerance;
          
          tests.push({
            name: `${table} row count`,
            passed: countTestPassed,
            duration: Date.now() - testStart,
            details: {
              sourceCount,
              targetCount,
              difference: countDifference,
              tolerance: countTolerance
            }
          });

          if (!countTestPassed) {
            const severity = this.config.dataConsistency.criticalTables.includes(table) ? 'CRITICAL' : 'HIGH';
            issues.push({
              severity,
              message: `Row count mismatch in table ${table}: source=${sourceCount}, target=${targetCount}`,
              table,
              recommendation: 'Investigate data migration process and ensure all data was transferred correctly'
            });
          }

          // Checksum validation for critical tables
          if (this.config.dataConsistency.checksumValidation && 
              this.config.dataConsistency.criticalTables.includes(table)) {
            
            const checksumStart = Date.now();
            
            try {
              // Sample-based checksum for large tables
              const sampleSize = Math.min(this.config.dataConsistency.sampleSize, sourceCount);
              
              const sourceChecksumResult = await sourceClient.query(`
                SELECT md5(string_agg(md5(t.*::text), '' ORDER BY random())) as checksum
                FROM (SELECT * FROM ${table} ORDER BY random() LIMIT $1) t
              `, [sampleSize]);
              
              const targetChecksumResult = await targetClient.query(`
                SELECT md5(string_agg(md5(t.*::text), '' ORDER BY random())) as checksum
                FROM (SELECT * FROM ${table} ORDER BY random() LIMIT $1) t
              `, [sampleSize]);
              
              const sourceChecksum = sourceChecksumResult.rows[0].checksum;
              const targetChecksum = targetChecksumResult.rows[0].checksum;
              
              const checksumTestPassed = sourceChecksum === targetChecksum;
              
              tests.push({
                name: `${table} checksum (sample)`,
                passed: checksumTestPassed,
                duration: Date.now() - checksumStart,
                details: {
                  sampleSize,
                  sourceChecksum,
                  targetChecksum
                }
              });

              if (!checksumTestPassed) {
                issues.push({
                  severity: 'CRITICAL',
                  message: `Checksum mismatch in critical table ${table}`,
                  table,
                  recommendation: 'Perform full data comparison and re-sync if necessary'
                });
              }

            } catch (checksumError) {
              tests.push({
                name: `${table} checksum (sample)`,
                passed: false,
                duration: Date.now() - checksumStart,
                error: checksumError.message
              });

              issues.push({
                severity: 'MEDIUM',
                message: `Failed to validate checksum for table ${table}: ${checksumError.message}`,
                table,
                recommendation: 'Investigate checksum validation failure'
              });
            }
          }

        } catch (tableError) {
          tests.push({
            name: `${table} validation`,
            passed: false,
            duration: Date.now() - testStart,
            error: tableError.message
          });

          issues.push({
            severity: 'HIGH',
            message: `Failed to validate table ${table}: ${tableError.message}`,
            table,
            recommendation: 'Check table structure and accessibility'
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const passedTests = tests.filter(t => t.passed).length;
      const totalTests = tests.length;
      const passed = issues.filter(i => i.severity === 'CRITICAL').length === 0;
      const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

      const recommendations = [
        ...issues.filter(i => i.recommendation).map(i => i.recommendation!),
        ...(issues.length > 0 ? ['Review data migration process for consistency'] : []),
        ...(passed ? ['Data consistency validation passed successfully'] : [])
      ];

      return {
        validationType: 'DATA_CONSISTENCY',
        passed,
        score,
        startTime,
        endTime,
        duration,
        details: {
          summary: `Validated ${tables.length} tables with ${passedTests}/${totalTests} tests passed`,
          metrics: {
            tablesValidated: tables.length,
            testsRun: totalTests,
            testsPassed: passedTests,
            criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length
          },
          tests,
          issues
        },
        recommendations
      };

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  /**
   * Validate performance against baseline metrics
   */
  private async validatePerformance(): Promise<ValidationResult> {
    const startTime = new Date();
    logger.info('📊 Validating performance baseline...');

    const targetClient = await this.targetPool.connect();
    
    try {
      const tests: Array<{
        name: string;
        passed: boolean;
        duration: number;
        error?: string;
        details?: any;
      }> = [];

      const issues: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        recommendation?: string;
      }> = [];

      // Warmup period
      logger.info('🔥 Running performance warmup...');
      const warmupEnd = Date.now() + this.config.performance.warmupDuration;
      
      while (Date.now() < warmupEnd) {
        await targetClient.query('SELECT 1');
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Performance test queries
      const testQueries = [
        {
          name: 'Simple SELECT',
          sql: 'SELECT 1',
          expectedMaxTime: 10
        },
        {
          name: 'User lookup',
          sql: 'SELECT * FROM users LIMIT 1',
          expectedMaxTime: 50
        },
        {
          name: 'Property search',
          sql: 'SELECT * FROM properties WHERE is_active = true LIMIT 10',
          expectedMaxTime: 100
        },
        {
          name: 'Complex join',
          sql: `
            SELECT p.*, u.username 
            FROM properties p 
            JOIN users u ON p.owner_id = u.id 
            WHERE p.is_active = true 
            LIMIT 5
          `,
          expectedMaxTime: 200
        }
      ];

      const metrics = {
        totalQueries: 0,
        totalTime: 0,
        slowQueries: 0,
        errors: 0
      };

      // Run performance tests
      const testEnd = Date.now() + this.config.performance.testDuration;
      
      while (Date.now() < testEnd) {
        for (const query of testQueries) {
          const queryStart = Date.now();
          
          try {
            await targetClient.query(query.sql);
            const queryTime = Date.now() - queryStart;
            
            metrics.totalQueries++;
            metrics.totalTime += queryTime;
            
            if (queryTime > query.expectedMaxTime) {
              metrics.slowQueries++;
            }

          } catch (queryError) {
            metrics.errors++;
            
            tests.push({
              name: `${query.name} execution`,
              passed: false,
              duration: Date.now() - queryStart,
              error: queryError.message
            });
          }
        }
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Calculate performance metrics
      const avgResponseTime = metrics.totalQueries > 0 ? 
        Math.round(metrics.totalTime / metrics.totalQueries) : 0;
      
      const errorRate = metrics.totalQueries > 0 ? 
        metrics.errors / metrics.totalQueries : 0;
      
      const slowQueryRate = metrics.totalQueries > 0 ? 
        metrics.slowQueries / metrics.totalQueries : 0;

      // Validate against baseline
      const baselineMetrics = this.config.performance.baselineMetrics;
      const tolerance = this.config.performance.toleranceMultiplier;

      const avgResponseTimeTest = avgResponseTime <= baselineMetrics.avgResponseTime * tolerance;
      const errorRateTest = errorRate <= baselineMetrics.errorRate * tolerance;
      const throughputTest = metrics.totalQueries >= baselineMetrics.throughput * 0.8; // 80% of baseline throughput

      tests.push(
        {
          name: 'Average response time',
          passed: avgResponseTimeTest,
          duration: 0,
          details: {
            actual: avgResponseTime,
            baseline: baselineMetrics.avgResponseTime,
            threshold: baselineMetrics.avgResponseTime * tolerance
          }
        },
        {
          name: 'Error rate',
          passed: errorRateTest,
          duration: 0,
          details: {
            actual: errorRate,
            baseline: baselineMetrics.errorRate,
            threshold: baselineMetrics.errorRate * tolerance
          }
        },
        {
          name: 'Throughput',
          passed: throughputTest,
          duration: 0,
          details: {
            actual: metrics.totalQueries,
            baseline: baselineMetrics.throughput,
            threshold: baselineMetrics.throughput * 0.8
          }
        }
      );

      // Generate issues for failed tests
      if (!avgResponseTimeTest) {
        issues.push({
          severity: 'HIGH',
          message: `Average response time (${avgResponseTime}ms) exceeds baseline (${baselineMetrics.avgResponseTime}ms)`,
          recommendation: 'Investigate query performance and database configuration'
        });
      }

      if (!errorRateTest) {
        issues.push({
          severity: 'CRITICAL',
          message: `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds baseline (${(baselineMetrics.errorRate * 100).toFixed(2)}%)`,
          recommendation: 'Investigate and fix database errors before deployment'
        });
      }

      if (!throughputTest) {
        issues.push({
          severity: 'MEDIUM',
          message: `Throughput (${metrics.totalQueries} qps) below baseline (${baselineMetrics.throughput} qps)`,
          recommendation: 'Check database resources and connection pool configuration'
        });
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const passedTests = tests.filter(t => t.passed).length;
      const totalTests = tests.length;
      const passed = issues.filter(i => i.severity === 'CRITICAL').length === 0;
      const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

      const recommendations = [
        ...issues.filter(i => i.recommendation).map(i => i.recommendation!),
        ...(passed ? ['Performance validation passed successfully'] : [])
      ];

      return {
        validationType: 'PERFORMANCE',
        passed,
        score,
        startTime,
        endTime,
        duration,
        details: {
          summary: `Performance test completed with ${passedTests}/${totalTests} metrics passed`,
          metrics: {
            avgResponseTime,
            errorRate,
            throughput: metrics.totalQueries,
            slowQueryRate,
            totalQueries: metrics.totalQueries
          },
          tests,
          issues
        },
        recommendations
      };

    } finally {
      targetClient.release();
    }
  }

  /**
   * Run functional tests
   */
  private async runFunctionalTests(): Promise<ValidationResult> {
    const startTime = new Date();
    logger.info('🧪 Running functional tests...');

    const targetClient = await this.targetPool.connect();
    
    try {
      const allTests: Array<{
        name: string;
        passed: boolean;
        duration: number;
        error?: string;
        details?: any;
      }> = [];

      const issues: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        recommendation?: string;
      }> = [];

      // Run test suites
      for (const suite of this.config.functional.testSuites) {
        logger.info(`🧪 Running test suite: ${suite.name}`);
        
        const suiteTests = this.config.functional.parallelExecution ?
          await Promise.allSettled(suite.tests.map(test => this.runSingleTest(targetClient, test))) :
          await this.runTestsSequentially(targetClient, suite.tests);

        // Process test results
        suiteTests.forEach((result, index) => {
          const test = suite.tests[index];
          
          if (result.status === 'fulfilled') {
            allTests.push(result.value);
          } else {
            allTests.push({
              name: test.name,
              passed: false,
              duration: 0,
              error: result.reason?.message || 'Unknown error'
            });

            issues.push({
              severity: 'HIGH',
              message: `Functional test failed: ${test.name}`,
              recommendation: 'Investigate test failure and fix underlying issues'
            });
          }

          // Fail fast if configured
          if (this.config.functional.failFast && result.status === 'rejected') {
            break;
          }
        });
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const passedTests = allTests.filter(t => t.passed).length;
      const totalTests = allTests.length;
      const passed = totalTests > 0 ? passedTests === totalTests : true;
      const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

      const recommendations = [
        ...issues.filter(i => i.recommendation).map(i => i.recommendation!),
        ...(passed ? ['All functional tests passed successfully'] : [])
      ];

      return {
        validationType: 'FUNCTIONAL',
        passed,
        score,
        startTime,
        endTime,
        duration,
        details: {
          summary: `Functional testing completed with ${passedTests}/${totalTests} tests passed`,
          metrics: {
            testSuites: this.config.functional.testSuites.length,
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests
          },
          tests: allTests,
          issues
        },
        recommendations
      };

    } finally {
      targetClient.release();
    }
  }

  /**
   * Run a single functional test
   */
  private async runSingleTest(client: PoolClient, test: any): Promise<{
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
    details?: any;
  }> {
    const testStart = Date.now();
    
    try {
      const result = await Promise.race([
        client.query(test.sql),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), test.timeout || 30000)
        )
      ]);

      const duration = Date.now() - testStart;
      
      // Validate expected result if provided
      let passed = true;
      let details: any = { rowCount: (result as any).rowCount };
      
      if (test.expectedResult !== undefined) {
        const actualResult = (result as any).rows;
        passed = JSON.stringify(actualResult) === JSON.stringify(test.expectedResult);
        details.expectedResult = test.expectedResult;
        details.actualResult = actualResult;
      }

      return {
        name: test.name,
        passed,
        duration,
        details
      };

    } catch (error) {
      return {
        name: test.name,
        passed: false,
        duration: Date.now() - testStart,
        error: error.message
      };
    }
  }

  /**
   * Run tests sequentially
   */
  private async runTestsSequentially(client: PoolClient, tests: any[]): Promise<Array<{
    status: 'fulfilled' | 'rejected';
    value?: any;
    reason?: any;
  }>> {
    const results = [];
    
    for (const test of tests) {
      try {
        const result = await this.runSingleTest(client, test);
        results.push({ status: 'fulfilled' as const, value: result });
      } catch (error) {
        results.push({ status: 'rejected' as const, reason: error });
      }
    }
    
    return results;
  }

  /**
   * Validate schema consistency
   */
  private async validateSchema(): Promise<ValidationResult> {
    const startTime = new Date();
    logger.info('📊 Validating schema consistency...');

    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();
    
    try {
      const tests: Array<{
        name: string;
        passed: boolean;
        duration: number;
        error?: string;
        details?: any;
      }> = [];

      const issues: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        recommendation?: string;
      }> = [];

      // Validate table structure
      if (this.config.schema.validateConstraints) {
        const testStart = Date.now();
        
        try {
          const sourceTablesResult = await sourceClient.query(`
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
          `);

          const targetTablesResult = await targetClient.query(`
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
          `);

          const sourceSchema = JSON.stringify(sourceTablesResult.rows);
          const targetSchema = JSON.stringify(targetTablesResult.rows);
          
          const schemaPassed = sourceSchema === targetSchema;
          
          tests.push({
            name: 'Table structure consistency',
            passed: schemaPassed,
            duration: Date.now() - testStart,
            details: {
              sourceColumns: sourceTablesResult.rows.length,
              targetColumns: targetTablesResult.rows.length
            }
          });

          if (!schemaPassed) {
            issues.push({
              severity: 'CRITICAL',
              message: 'Table structure mismatch between source and target',
              recommendation: 'Ensure schema migrations are applied correctly to target environment'
            });
          }

        } catch (error) {
          tests.push({
            name: 'Table structure consistency',
            passed: false,
            duration: Date.now() - testStart,
            error: error.message
          });
        }
      }

      // Validate indexes
      if (this.config.schema.validateIndexes) {
        const testStart = Date.now();
        
        try {
          const sourceIndexesResult = await sourceClient.query(`
            SELECT indexname, tablename, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
          `);

          const targetIndexesResult = await targetClient.query(`
            SELECT indexname, tablename, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
          `);

          const sourceIndexes = JSON.stringify(sourceIndexesResult.rows);
          const targetIndexes = JSON.stringify(targetIndexesResult.rows);
          
          const indexesPassed = sourceIndexes === targetIndexes;
          
          tests.push({
            name: 'Index consistency',
            passed: indexesPassed,
            duration: Date.now() - testStart,
            details: {
              sourceIndexes: sourceIndexesResult.rows.length,
              targetIndexes: targetIndexesResult.rows.length
            }
          });

          if (!indexesPassed) {
            issues.push({
              severity: 'HIGH',
              message: 'Index definitions differ between source and target',
              recommendation: 'Verify all indexes are created correctly in target environment'
            });
          }

        } catch (error) {
          tests.push({
            name: 'Index consistency',
            passed: false,
            duration: Date.now() - testStart,
            error: error.message
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const passedTests = tests.filter(t => t.passed).length;
      const totalTests = tests.length;
      const passed = issues.filter(i => i.severity === 'CRITICAL').length === 0;
      const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

      const recommendations = [
        ...issues.filter(i => i.recommendation).map(i => i.recommendation!),
        ...(passed ? ['Schema validation passed successfully'] : [])
      ];

      return {
        validationType: 'SCHEMA',
        passed,
        score,
        startTime,
        endTime,
        duration,
        details: {
          summary: `Schema validation completed with ${passedTests}/${totalTests} checks passed`,
          metrics: {
            checksRun: totalTests,
            checksPassed: passedTests,
            criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length
          },
          tests,
          issues
        },
        recommendations
      };

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  /**
   * Validate rollback readiness
   */
  private async validateRollbackReadiness(): Promise<ValidationResult> {
    const startTime = new Date();
    logger.info('🔄 Validating rollback readiness...');

    const sourceClient = await this.sourcePool.connect();
    
    try {
      const tests: Array<{
        name: string;
        passed: boolean;
        duration: number;
        error?: string;
        details?: any;
      }> = [];

      const issues: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        recommendation?: string;
      }> = [];

      // Test source environment health
      const testStart = Date.now();
      
      try {
        await sourceClient.query('SELECT 1');
        
        tests.push({
          name: 'Source environment connectivity',
          passed: true,
          duration: Date.now() - testStart
        });

      } catch (error) {
        tests.push({
          name: 'Source environment connectivity',
          passed: false,
          duration: Date.now() - testStart,
          error: error.message
        });

        issues.push({
          severity: 'CRITICAL',
          message: 'Source environment is not accessible for rollback',
          recommendation: 'Ensure source environment is healthy and accessible before proceeding'
        });
      }

      // Check for blocking dependencies
      if (this.config.rollback.checkDependencies) {
        const depTestStart = Date.now();
        
        try {
          // Check for long-running transactions
          const longTransactionsResult = await sourceClient.query(`
            SELECT count(*) as count
            FROM pg_stat_activity 
            WHERE state = 'active' 
            AND query_start < NOW() - INTERVAL '5 minutes'
            AND pid != pg_backend_pid()
          `);
          
          const longTransactionCount = parseInt(longTransactionsResult.rows[0].count);
          const dependenciesPassed = longTransactionCount === 0;
          
          tests.push({
            name: 'Blocking dependencies check',
            passed: dependenciesPassed,
            duration: Date.now() - depTestStart,
            details: {
              longRunningTransactions: longTransactionCount
            }
          });

          if (!dependenciesPassed) {
            issues.push({
              severity: 'MEDIUM',
              message: `${longTransactionCount} long-running transactions may block rollback`,
              recommendation: 'Consider waiting for transactions to complete or terminating them if safe'
            });
          }

        } catch (error) {
          tests.push({
            name: 'Blocking dependencies check',
            passed: false,
            duration: Date.now() - depTestStart,
            error: error.message
          });
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const passedTests = tests.filter(t => t.passed).length;
      const totalTests = tests.length;
      const passed = issues.filter(i => i.severity === 'CRITICAL').length === 0;
      const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

      const recommendations = [
        ...issues.filter(i => i.recommendation).map(i => i.recommendation!),
        ...(passed ? ['Rollback readiness validation passed successfully'] : [])
      ];

      return {
        validationType: 'ROLLBACK',
        passed,
        score,
        startTime,
        endTime,
        duration,
        details: {
          summary: `Rollback readiness validated with ${passedTests}/${totalTests} checks passed`,
          metrics: {
            checksRun: totalTests,
            checksPassed: passedTests,
            criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length
          },
          tests,
          issues
        },
        recommendations
      };

    } finally {
      sourceClient.release();
    }
  }

  /**
   * Test database connections
   */
  private async testConnections(): Promise<void> {
    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();
    
    try {
      await sourceClient.query('SELECT 1');
      await targetClient.query('SELECT 1');
      
      logger.info('✅ Database connections tested successfully');

    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  /**
   * Load default functional tests
   */
  private loadDefaultFunctionalTests(): void {
    this.config.functional.testSuites = [
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
            name: 'Current timestamp',
            sql: 'SELECT NOW() as current_time',
            timeout: 5000
          },
          {
            name: 'Database version',
            sql: 'SELECT version() as db_version',
            timeout: 5000
          }
        ]
      },
      {
        name: 'Core Table Access',
        description: 'Test access to core application tables',
        tests: [
          {
            name: 'Users table access',
            sql: 'SELECT COUNT(*) as user_count FROM users',
            timeout: 10000
          },
          {
            name: 'Properties table access',
            sql: 'SELECT COUNT(*) as property_count FROM properties',
            timeout: 10000
          },
          {
            name: 'Reviews table access',
            sql: 'SELECT COUNT(*) as review_count FROM reviews',
            timeout: 10000
          }
        ]
      }
    ];
  }

  /**
   * Shutdown the validator
   */
  async shutdown(): Promise<void> {
    logger.info('🔄 Shutting down Deployment Validator...');
    
    this.isInitialized = false;
    this.emit('shutdown');
    
    logger.info('✅ Deployment Validator shutdown complete');
  }
}

// Export singleton instance
let validatorInstance: DeploymentValidator | null = null;

export function createDeploymentValidator(
  sourcePool: Pool,
  targetPool: Pool,
  config?: Partial<ValidationConfig>
): DeploymentValidator {
  if (validatorInstance) {
    throw new Error('Deployment validator already exists. Use getDeploymentValidator() instead.');
  }
  
  validatorInstance = new DeploymentValidator(sourcePool, targetPool, config);
  return validatorInstance;
}

export function getDeploymentValidator(): DeploymentValidator {
  if (!validatorInstance) {
    throw new Error('Deployment validator not initialized. Call createDeploymentValidator() first.');
  }
  
  return validatorInstance;
}