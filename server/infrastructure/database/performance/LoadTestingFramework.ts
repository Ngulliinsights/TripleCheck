/**
 * Comprehensive Load Testing Framework
 * 
 * Advanced load testing system for database performance validation with realistic
 * Kenyan user behavior patterns and comprehensive performance metrics collection.
 */

import { EventEmitter } from 'events';
import { Pool, PoolClient } from 'pg';
import { Worker } from 'worker_threads';
import { logger } from '../../monitoring/logger';
import { observabilitySystem } from '../../monitoring/ObservabilitySystem';

export interface LoadTestConfig {
  // Test Configuration
  testDuration: number;                 // 300000ms (5 minutes)
  warmupDuration: number;               // 30000ms (30 seconds)
  cooldownDuration: number;             // 10000ms (10 seconds)
  
  // Load Configuration
  maxConcurrentUsers: number;           // 1000 concurrent users
  rampUpDuration: number;               // 60000ms (1 minute ramp-up)
  rampDownDuration: number;             // 30000ms (30 second ramp-down)
  
  // User Behavior Patterns
  userPatterns: Array<{
    name: string;
    weight: number;                     // Percentage of users following this pattern
    operations: Array<{
      type: string;
      weight: number;                   // Relative frequency
      sql: string;
      params?: any[];
      expectedResponseTime: number;     // Expected response time in ms
    }>;
    thinkTime: {
      min: number;                      // Minimum think time between operations
      max: number;                      // Maximum think time between operations
    };
  }>;
  
  // Performance Targets
  performanceTargets: {
    avgResponseTime: number;            // 50ms target
    p95ResponseTime: number;            // 100ms target
    p99ResponseTime: number;            // 200ms target
    throughput: number;                 // 10000 qps target
    errorRate: number;                  // 0.01% target
    connectionSuccessRate: number;      // 99.99% target
  };
  
  // Resource Monitoring
  resourceMonitoring: {
    enabled: boolean;
    cpuThreshold: number;               // 70% CPU threshold
    memoryThreshold: number;            // 80% memory threshold
    diskIOThreshold: number;            // 80% disk I/O threshold
    connectionPoolThreshold: number;    // 80% connection pool threshold
  };
  
  // Reporting
  reporting: {
    enableRealTimeMetrics: boolean;
    metricsInterval: number;            // 5000ms (5 seconds)
    enableDetailedLogging: boolean;
    generateReport: boolean;
    reportFormat: 'json' | 'html' | 'csv';
  };
}

export interface LoadTestMetrics {
  // Response Time Metrics
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    samples: number[];
  };
  
  // Throughput Metrics
  throughput: {
    qps: number;                        // Queries per second
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
  };
  
  // Error Metrics
  errors: {
    connectionErrors: number;
    timeoutErrors: number;
    sqlErrors: number;
    totalErrors: number;
    errorRate: number;
    errorsByType: Map<string, number>;
  };
  
  // Resource Metrics
  resources: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    avgConnectionPoolUsage: number;
    maxConnectionPoolUsage: number;
  };
  
  // User Pattern Metrics
  userPatterns: Map<string, {
    activeUsers: number;
    completedSessions: number;
    avgSessionDuration: number;
    operationsPerSession: number;
  }>;
  
  // Time-based Metrics
  timeline: Array<{
    timestamp: Date;
    activeUsers: number;
    qps: number;
    avgResponseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}

export interface LoadTestResult {
  testId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  config: LoadTestConfig;
  metrics: LoadTestMetrics;
  passed: boolean;
  score: number;                        // 0-100 performance score
  issues: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'PERFORMANCE' | 'RELIABILITY' | 'RESOURCE' | 'ERROR';
    message: string;
    metric: string;
    actual: number;
    expected: number;
    recommendation: string;
  }>;
  recommendations: string[];
}

export class LoadTestingFramework extends EventEmitter {
  private config: LoadTestConfig;
  private pool: Pool;
  private testId: string;
  private isRunning = false;
  private workers: Worker[] = [];
  private metrics: LoadTestMetrics;
  private startTime: Date;
  private metricsInterval?: NodeJS.Timeout;

  constructor(pool: Pool, config: Partial<LoadTestConfig> = {}) {
    super();
    
    this.pool = pool;
    this.testId = `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      testDuration: 300000,               // 5 minutes
      warmupDuration: 30000,              // 30 seconds
      cooldownDuration: 10000,            // 10 seconds
      maxConcurrentUsers: 1000,
      rampUpDuration: 60000,              // 1 minute
      rampDownDuration: 30000,            // 30 seconds
      userPatterns: this.getDefaultUserPatterns(),
      performanceTargets: {
        avgResponseTime: 50,
        p95ResponseTime: 100,
        p99ResponseTime: 200,
        throughput: 10000,
        errorRate: 0.0001,
        connectionSuccessRate: 0.9999
      },
      resourceMonitoring: {
        enabled: true,
        cpuThreshold: 0.7,
        memoryThreshold: 0.8,
        diskIOThreshold: 0.8,
        connectionPoolThreshold: 0.8
      },
      reporting: {
        enableRealTimeMetrics: true,
        metricsInterval: 5000,
        enableDetailedLogging: true,
        generateReport: true,
        reportFormat: 'json'
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
  }

  /**
   * Execute comprehensive load test
   */
  async executeLoadTest(): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    this.isRunning = true;
    this.startTime = new Date();
    
    logger.info(`🚀 Starting comprehensive load test: ${this.testId}`, {
      testId: this.testId,
      maxUsers: this.config.maxConcurrentUsers,
      duration: this.config.testDuration
    });

    this.emit('test_started', { testId: this.testId, config: this.config });

    try {
      // Initialize metrics collection
      this.initializeMetricsCollection();

      // Phase 1: Warmup
      await this.executeWarmup();

      // Phase 2: Ramp-up
      await this.executeRampUp();

      // Phase 3: Sustained load
      await this.executeSustainedLoad();

      // Phase 4: Ramp-down
      await this.executeRampDown();

      // Phase 5: Cooldown
      await this.executeCooldown();

      // Analyze results
      const result = await this.analyzeResults();

      this.emit('test_completed', { testId: this.testId, result });
      logger.info(`✅ Load test completed: ${this.testId}`, {
        testId: this.testId,
        passed: result.passed,
        score: result.score,
        duration: result.duration
      });

      return result;

    } catch (error) {
      this.emit('test_failed', { testId: this.testId, error });
      logger.error(`❌ Load test failed: ${this.testId}`, error);
      throw error;
    } finally {
      await this.cleanup();
      this.isRunning = false;
    }
  }

  /**
   * Execute warmup phase
   */
  private async executeWarmup(): Promise<void> {
    logger.info(`🔥 Starting warmup phase (${this.config.warmupDuration}ms)...`);
    this.emit('phase_started', { phase: 'warmup', duration: this.config.warmupDuration });

    const warmupUsers = Math.min(10, this.config.maxConcurrentUsers * 0.1);
    await this.spawnUsers(warmupUsers, 'warmup');

    await this.sleep(this.config.warmupDuration);

    await this.stopUsers();
    logger.info('✅ Warmup phase completed');
    this.emit('phase_completed', { phase: 'warmup' });
  }

  /**
   * Execute ramp-up phase
   */
  private async executeRampUp(): Promise<void> {
    logger.info(`📈 Starting ramp-up phase (${this.config.rampUpDuration}ms)...`);
    this.emit('phase_started', { phase: 'ramp_up', duration: this.config.rampUpDuration });

    const rampUpSteps = 10;
    const stepDuration = this.config.rampUpDuration / rampUpSteps;
    const usersPerStep = this.config.maxConcurrentUsers / rampUpSteps;

    for (let step = 1; step <= rampUpSteps; step++) {
      const targetUsers = Math.floor(usersPerStep * step);
      await this.adjustUserCount(targetUsers);
      
      this.emit('ramp_up_step', { 
        step, 
        totalSteps: rampUpSteps, 
        currentUsers: targetUsers,
        targetUsers: this.config.maxConcurrentUsers
      });

      await this.sleep(stepDuration);
    }

    logger.info(`✅ Ramp-up completed - ${this.config.maxConcurrentUsers} users active`);
    this.emit('phase_completed', { phase: 'ramp_up' });
  }

  /**
   * Execute sustained load phase
   */
  private async executeSustainedLoad(): Promise<void> {
    logger.info(`⚡ Starting sustained load phase (${this.config.testDuration}ms)...`);
    this.emit('phase_started', { phase: 'sustained_load', duration: this.config.testDuration });

    // Ensure we have the target number of users
    await this.adjustUserCount(this.config.maxConcurrentUsers);

    // Run sustained load for the configured duration
    await this.sleep(this.config.testDuration);

    logger.info('✅ Sustained load phase completed');
    this.emit('phase_completed', { phase: 'sustained_load' });
  }

  /**
   * Execute ramp-down phase
   */
  private async executeRampDown(): Promise<void> {
    logger.info(`📉 Starting ramp-down phase (${this.config.rampDownDuration}ms)...`);
    this.emit('phase_started', { phase: 'ramp_down', duration: this.config.rampDownDuration });

    const rampDownSteps = 5;
    const stepDuration = this.config.rampDownDuration / rampDownSteps;
    const usersPerStep = this.config.maxConcurrentUsers / rampDownSteps;

    for (let step = 1; step <= rampDownSteps; step++) {
      const targetUsers = Math.floor(this.config.maxConcurrentUsers - (usersPerStep * step));
      await this.adjustUserCount(Math.max(0, targetUsers));
      
      this.emit('ramp_down_step', { 
        step, 
        totalSteps: rampDownSteps, 
        currentUsers: targetUsers
      });

      await this.sleep(stepDuration);
    }

    logger.info('✅ Ramp-down completed');
    this.emit('phase_completed', { phase: 'ramp_down' });
  }

  /**
   * Execute cooldown phase
   */
  private async executeCooldown(): Promise<void> {
    logger.info(`❄️ Starting cooldown phase (${this.config.cooldownDuration}ms)...`);
    this.emit('phase_started', { phase: 'cooldown', duration: this.config.cooldownDuration });

    await this.stopUsers();
    await this.sleep(this.config.cooldownDuration);

    logger.info('✅ Cooldown phase completed');
    this.emit('phase_completed', { phase: 'cooldown' });
  }

  /**
   * Spawn virtual users
   */
  private async spawnUsers(userCount: number, phase: string): Promise<void> {
    logger.info(`👥 Spawning ${userCount} virtual users for ${phase} phase...`);

    for (let i = 0; i < userCount; i++) {
      const userPattern = this.selectUserPattern();
      const worker = new Worker(__filename, {
        workerData: {
          type: 'virtual_user',
          userId: `user_${i}_${Date.now()}`,
          pattern: userPattern,
          connectionString: this.pool.options.connectionString,
          testId: this.testId
        }
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(message);
      });

      worker.on('error', (error) => {
        logger.error(`Worker error: ${error.message}`);
        this.metrics.errors.totalErrors++;
      });

      this.workers.push(worker);
    }

    // Give workers time to initialize
    await this.sleep(1000);
  }

  /**
   * Adjust user count
   */
  private async adjustUserCount(targetCount: number): Promise<void> {
    const currentCount = this.workers.length;
    
    if (targetCount > currentCount) {
      // Spawn additional users
      await this.spawnUsers(targetCount - currentCount, 'adjustment');
    } else if (targetCount < currentCount) {
      // Stop excess users
      const usersToStop = currentCount - targetCount;
      for (let i = 0; i < usersToStop; i++) {
        const worker = this.workers.pop();
        if (worker) {
          await worker.terminate();
        }
      }
    }
  }

  /**
   * Stop all users
   */
  private async stopUsers(): Promise<void> {
    logger.info(`🛑 Stopping ${this.workers.length} virtual users...`);

    await Promise.all(
      this.workers.map(worker => worker.terminate())
    );

    this.workers = [];
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(message: any): void {
    switch (message.type) {
      case 'query_completed':
        this.recordQueryMetrics(message.data);
        break;
      case 'query_failed':
        this.recordQueryError(message.data);
        break;
      case 'user_session_completed':
        this.recordSessionMetrics(message.data);
        break;
      default:
        // Unknown message type
        break;
    }
  }

  /**
   * Record query metrics
   */
  private recordQueryMetrics(data: {
    responseTime: number;
    queryType: string;
    success: boolean;
  }): void {
    this.metrics.responseTime.samples.push(data.responseTime);
    this.metrics.throughput.totalQueries++;
    
    if (data.success) {
      this.metrics.throughput.successfulQueries++;
    } else {
      this.metrics.throughput.failedQueries++;
      this.metrics.errors.totalErrors++;
    }

    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  /**
   * Record query error
   */
  private recordQueryError(data: {
    errorType: string;
    errorMessage: string;
    queryType: string;
  }): void {
    this.metrics.errors.totalErrors++;
    
    switch (data.errorType) {
      case 'CONNECTION_ERROR':
        this.metrics.errors.connectionErrors++;
        break;
      case 'TIMEOUT_ERROR':
        this.metrics.errors.timeoutErrors++;
        break;
      case 'SQL_ERROR':
        this.metrics.errors.sqlErrors++;
        break;
    }

    const currentCount = this.metrics.errors.errorsByType.get(data.errorType) || 0;
    this.metrics.errors.errorsByType.set(data.errorType, currentCount + 1);
  }

  /**
   * Record session metrics
   */
  private recordSessionMetrics(data: {
    patternName: string;
    sessionDuration: number;
    operationsCompleted: number;
  }): void {
    const patternMetrics = this.metrics.userPatterns.get(data.patternName) || {
      activeUsers: 0,
      completedSessions: 0,
      avgSessionDuration: 0,
      operationsPerSession: 0
    };

    patternMetrics.completedSessions++;
    patternMetrics.avgSessionDuration = 
      (patternMetrics.avgSessionDuration * (patternMetrics.completedSessions - 1) + data.sessionDuration) / 
      patternMetrics.completedSessions;
    patternMetrics.operationsPerSession = 
      (patternMetrics.operationsPerSession * (patternMetrics.completedSessions - 1) + data.operationsCompleted) / 
      patternMetrics.completedSessions;

    this.metrics.userPatterns.set(data.patternName, patternMetrics);
  }

  /**
   * Update real-time metrics
   */
  private updateRealTimeMetrics(): void {
    // Calculate current QPS
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime.getTime()) / 1000;
    this.metrics.throughput.qps = this.metrics.throughput.totalQueries / elapsedSeconds;

    // Calculate error rate
    this.metrics.errors.errorRate = this.metrics.throughput.totalQueries > 0 ?
      this.metrics.errors.totalErrors / this.metrics.throughput.totalQueries : 0;

    // Update response time statistics
    if (this.metrics.responseTime.samples.length > 0) {
      const samples = this.metrics.responseTime.samples.slice(-1000); // Keep last 1000 samples
      samples.sort((a, b) => a - b);

      this.metrics.responseTime.avg = samples.reduce((sum, val) => sum + val, 0) / samples.length;
      this.metrics.responseTime.min = samples[0];
      this.metrics.responseTime.max = samples[samples.length - 1];
      this.metrics.responseTime.p50 = samples[Math.floor(samples.length * 0.5)];
      this.metrics.responseTime.p95 = samples[Math.floor(samples.length * 0.95)];
      this.metrics.responseTime.p99 = samples[Math.floor(samples.length * 0.99)];
    }

    // Record timeline metrics
    this.metrics.timeline.push({
      timestamp: new Date(),
      activeUsers: this.workers.length,
      qps: this.metrics.throughput.qps,
      avgResponseTime: this.metrics.responseTime.avg,
      errorRate: this.metrics.errors.errorRate,
      cpuUsage: 0, // Would be collected from system monitoring
      memoryUsage: 0 // Would be collected from system monitoring
    });

    // Emit real-time metrics
    this.emit('metrics_updated', {
      testId: this.testId,
      metrics: this.metrics,
      timestamp: new Date()
    });
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetricsCollection(): void {
    if (this.config.reporting.enableRealTimeMetrics) {
      this.metricsInterval = setInterval(() => {
        this.updateRealTimeMetrics();
        
        // Record metrics to observability system
        observabilitySystem.recordMetric({
          name: 'load_test_qps',
          value: this.metrics.throughput.qps,
          labels: { test_id: this.testId }
        });

        observabilitySystem.recordMetric({
          name: 'load_test_response_time',
          value: this.metrics.responseTime.avg,
          labels: { test_id: this.testId, percentile: 'avg' }
        });

        observabilitySystem.recordMetric({
          name: 'load_test_error_rate',
          value: this.metrics.errors.errorRate,
          labels: { test_id: this.testId }
        });

      }, this.config.reporting.metricsInterval);
    }
  }

  /**
   * Analyze test results
   */
  private async analyzeResults(): Promise<LoadTestResult> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    // Final metrics calculation
    this.updateRealTimeMetrics();

    const issues: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      category: 'PERFORMANCE' | 'RELIABILITY' | 'RESOURCE' | 'ERROR';
      message: string;
      metric: string;
      actual: number;
      expected: number;
      recommendation: string;
    }> = [];

    const recommendations: string[] = [];

    // Analyze performance targets
    const targets = this.config.performanceTargets;

    // Average response time
    if (this.metrics.responseTime.avg > targets.avgResponseTime) {
      issues.push({
        severity: this.metrics.responseTime.avg > targets.avgResponseTime * 2 ? 'CRITICAL' : 'HIGH',
        category: 'PERFORMANCE',
        message: `Average response time exceeds target`,
        metric: 'avg_response_time',
        actual: this.metrics.responseTime.avg,
        expected: targets.avgResponseTime,
        recommendation: 'Optimize slow queries and consider connection pool tuning'
      });
    }

    // P95 response time
    if (this.metrics.responseTime.p95 > targets.p95ResponseTime) {
      issues.push({
        severity: this.metrics.responseTime.p95 > targets.p95ResponseTime * 2 ? 'CRITICAL' : 'HIGH',
        category: 'PERFORMANCE',
        message: `P95 response time exceeds target`,
        metric: 'p95_response_time',
        actual: this.metrics.responseTime.p95,
        expected: targets.p95ResponseTime,
        recommendation: 'Investigate and optimize slowest queries'
      });
    }

    // Throughput
    if (this.metrics.throughput.qps < targets.throughput) {
      issues.push({
        severity: this.metrics.throughput.qps < targets.throughput * 0.5 ? 'CRITICAL' : 'MEDIUM',
        category: 'PERFORMANCE',
        message: `Throughput below target`,
        metric: 'throughput',
        actual: this.metrics.throughput.qps,
        expected: targets.throughput,
        recommendation: 'Scale database resources or optimize query performance'
      });
    }

    // Error rate
    if (this.metrics.errors.errorRate > targets.errorRate) {
      issues.push({
        severity: this.metrics.errors.errorRate > targets.errorRate * 10 ? 'CRITICAL' : 'HIGH',
        category: 'RELIABILITY',
        message: `Error rate exceeds target`,
        metric: 'error_rate',
        actual: this.metrics.errors.errorRate,
        expected: targets.errorRate,
        recommendation: 'Investigate and fix database errors'
      });
    }

    // Calculate overall score
    let score = 100;
    
    // Deduct points for each issue
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'CRITICAL':
          score -= 25;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    });

    score = Math.max(0, score);

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('All performance targets met successfully');
    } else {
      recommendations.push(...issues.map(issue => issue.recommendation));
    }

    const passed = issues.filter(issue => issue.severity === 'CRITICAL').length === 0;

    return {
      testId: this.testId,
      startTime: this.startTime,
      endTime,
      duration,
      config: this.config,
      metrics: this.metrics,
      passed,
      score,
      issues,
      recommendations
    };
  }

  /**
   * Get default user patterns for Kenyan market
   */
  private getDefaultUserPatterns(): LoadTestConfig['userPatterns'] {
    return [
      {
        name: 'Property Browser',
        weight: 40, // 40% of users
        operations: [
          {
            type: 'property_search',
            weight: 50,
            sql: 'SELECT * FROM properties WHERE is_active = true AND location ILIKE $1 ORDER BY created_at DESC LIMIT 20',
            params: ['%Nairobi%'],
            expectedResponseTime: 30
          },
          {
            type: 'property_details',
            weight: 30,
            sql: 'SELECT p.*, u.username FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.id = $1',
            params: [1],
            expectedResponseTime: 20
          },
          {
            type: 'property_reviews',
            weight: 20,
            sql: 'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.property_id = $1 ORDER BY r.created_at DESC LIMIT 10',
            params: [1],
            expectedResponseTime: 25
          }
        ],
        thinkTime: { min: 2000, max: 10000 }
      },
      {
        name: 'Property Owner',
        weight: 20, // 20% of users
        operations: [
          {
            type: 'user_properties',
            weight: 40,
            sql: 'SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC',
            params: [1],
            expectedResponseTime: 25
          },
          {
            type: 'property_analytics',
            weight: 30,
            sql: 'SELECT COUNT(*) as views FROM property_views WHERE property_id = $1 AND created_at > NOW() - INTERVAL \'30 days\'',
            params: [1],
            expectedResponseTime: 35
          },
          {
            type: 'update_property',
            weight: 20,
            sql: 'UPDATE properties SET updated_at = NOW() WHERE id = $1 AND owner_id = $2',
            params: [1, 1],
            expectedResponseTime: 15
          },
          {
            type: 'property_messages',
            weight: 10,
            sql: 'SELECT m.*, u.username FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.property_id = $1 ORDER BY m.created_at DESC LIMIT 20',
            params: [1],
            expectedResponseTime: 30
          }
        ],
        thinkTime: { min: 5000, max: 15000 }
      },
      {
        name: 'Land Verification User',
        weight: 25, // 25% of users
        operations: [
          {
            type: 'verification_search',
            weight: 35,
            sql: 'SELECT * FROM land_verification_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
            params: [1],
            expectedResponseTime: 40
          },
          {
            type: 'verification_details',
            weight: 25,
            sql: 'SELECT lvs.*, p.title FROM land_verification_sessions lvs JOIN properties p ON lvs.property_id = p.id WHERE lvs.id = $1',
            params: [1],
            expectedResponseTime: 35
          },
          {
            type: 'expert_assignments',
            weight: 20,
            sql: 'SELECT ea.*, u.username FROM expert_assignments ea JOIN users u ON ea.expert_id = u.id WHERE ea.session_id = $1',
            params: [1],
            expectedResponseTime: 30
          },
          {
            type: 'community_feedback',
            weight: 20,
            sql: 'SELECT cf.*, u.username FROM community_feedback cf JOIN users u ON cf.user_id = u.id WHERE cf.session_id = $1 ORDER BY cf.created_at DESC',
            params: [1],
            expectedResponseTime: 45
          }
        ],
        thinkTime: { min: 3000, max: 12000 }
      },
      {
        name: 'Trust System User',
        weight: 15, // 15% of users
        operations: [
          {
            type: 'trust_score_check',
            weight: 40,
            sql: 'SELECT trust_score, reputation_events FROM users WHERE id = $1',
            params: [1],
            expectedResponseTime: 20
          },
          {
            type: 'fraud_alerts',
            weight: 30,
            sql: 'SELECT * FROM fraud_alerts WHERE user_id = $1 OR property_id IN (SELECT id FROM properties WHERE owner_id = $1) ORDER BY created_at DESC LIMIT 10',
            params: [1],
            expectedResponseTime: 50
          },
          {
            type: 'community_references',
            weight: 20,
            sql: 'SELECT cr.*, u.username FROM community_references cr JOIN users u ON cr.reference_user_id = u.id WHERE cr.user_id = $1',
            params: [1],
            expectedResponseTime: 35
          },
          {
            type: 'reputation_history',
            weight: 10,
            sql: 'SELECT * FROM reputation_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            params: [1],
            expectedResponseTime: 40
          }
        ],
        thinkTime: { min: 4000, max: 8000 }
      }
    ];
  }

  /**
   * Select user pattern based on weights
   */
  private selectUserPattern(): LoadTestConfig['userPatterns'][0] {
    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (const pattern of this.config.userPatterns) {
      cumulativeWeight += pattern.weight;
      if (random <= cumulativeWeight) {
        return pattern;
      }
    }

    // Fallback to first pattern
    return this.config.userPatterns[0];
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): LoadTestMetrics {
    return {
      responseTime: {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        samples: []
      },
      throughput: {
        qps: 0,
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0
      },
      errors: {
        connectionErrors: 0,
        timeoutErrors: 0,
        sqlErrors: 0,
        totalErrors: 0,
        errorRate: 0,
        errorsByType: new Map()
      },
      resources: {
        avgCpuUsage: 0,
        maxCpuUsage: 0,
        avgMemoryUsage: 0,
        maxMemoryUsage: 0,
        avgConnectionPoolUsage: 0,
        maxConnectionPoolUsage: 0
      },
      userPatterns: new Map(),
      timeline: []
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    await this.stopUsers();
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): LoadTestMetrics {
    return { ...this.metrics };
  }

  /**
   * Stop running test
   */
  async stopTest(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info(`🛑 Stopping load test: ${this.testId}`);
    this.isRunning = false;
    await this.cleanup();
    this.emit('test_stopped', { testId: this.testId });
  }
}

// Export singleton instance
let loadTestingFrameworkInstance: LoadTestingFramework | null = null;

export function createLoadTestingFramework(
  pool: Pool,
  config?: Partial<LoadTestConfig>
): LoadTestingFramework {
  if (loadTestingFrameworkInstance) {
    throw new Error('Load testing framework already exists. Use getLoadTestingFramework() instead.');
  }
  
  loadTestingFrameworkInstance = new LoadTestingFramework(pool, config);
  return loadTestingFrameworkInstance;
}

export function getLoadTestingFramework(): LoadTestingFramework {
  if (!loadTestingFrameworkInstance) {
    throw new Error('Load testing framework not initialized. Call createLoadTestingFramework() first.');
  }
  
  return loadTestingFrameworkInstance;
}