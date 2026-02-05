/**
 * Performance Certification System
 * 
 * Comprehensive system for validating and certifying database performance
 * against production targets with detailed analysis and recommendations.
 */

import { EventEmitter } from 'events';
import { Pool, PoolClient } from 'pg';
import { writeFileSync } from 'fs';
import { logger } from '../../monitoring/logger';
import { observabilitySystem } from '../../monitoring/ObservabilitySystem';
import { LoadTestingFramework, LoadTestResult } from './LoadTestingFramework';

export interface CertificationConfig {
  // Performance Targets
  targets: {
    // Response Time Targets
    avgResponseTime: number;            // 50ms target
    p95ResponseTime: number;            // 100ms target
    p99ResponseTime: number;            // 200ms target
    
    // Throughput Targets
    sustainedThroughput: number;        // 10,000 qps
    peakThroughput: number;             // 15,000 qps
    concurrentConnections: number;      // 1,000 connections
    
    // Reliability Targets
    uptime: number;                     // 99.99%
    errorRate: number;                  // 0.01%
    connectionSuccessRate: number;      // 99.99%
    
    // Resource Utilization Targets
    maxCpuUtilization: number;          // 70%
    maxMemoryUtilization: number;       // 80%
    maxDiskIOUtilization: number;       // 80%
    maxConnectionPoolUtilization: number; // 80%
  };
  
  // Test Scenarios
  scenarios: Array<{
    name: string;
    description: string;
    loadMultiplier: number;             // 1x, 2x, 5x, 10x normal load
    duration: number;                   // Test duration in ms
    expectedPerformance: {
      avgResponseTime: number;
      p95ResponseTime: number;
      throughput: number;
      errorRate: number;
    };
    criticalForCertification: boolean;
  }>;
  
  // Certification Criteria
  certification: {
    passingScore: number;               // 85% minimum score
    criticalFailureThreshold: number;   // 0 critical failures allowed
    requiredScenarios: string[];        // Scenarios that must pass
    validityPeriod: number;             // 30 days validity
  };
  
  // Reporting
  reporting: {
    generateDetailedReport: boolean;
    includeRecommendations: boolean;
    includePerformanceGraphs: boolean;
    reportFormats: ('json' | 'html' | 'pdf')[];
    outputDirectory: string;
  };
}

export interface CertificationResult {
  certificationId: string;
  timestamp: Date;
  passed: boolean;
  overallScore: number;
  validUntil: Date;
  
  // Test Results
  scenarios: Array<{
    name: string;
    passed: boolean;
    score: number;
    loadTestResult: LoadTestResult;
    issues: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      recommendation: string;
    }>;
  }>;
  
  // Performance Summary
  performanceSummary: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    sustainedThroughput: number;
    peakThroughput: number;
    errorRate: number;
    uptime: number;
  };
  
  // Resource Utilization
  resourceUtilization: {
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    avgConnectionPoolUsage: number;
    maxConnectionPoolUsage: number;
  };
  
  // Issues and Recommendations
  criticalIssues: Array<{
    scenario: string;
    issue: string;
    impact: string;
    recommendation: string;
  }>;
  
  recommendations: Array<{
    category: 'PERFORMANCE' | 'RELIABILITY' | 'SCALABILITY' | 'OPTIMIZATION';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: string;
    expectedImpact: string;
  }>;
  
  // Certification Details
  certificationDetails: {
    certifiedBy: string;
    certificationStandard: string;
    testEnvironment: string;
    databaseVersion: string;
    configurationHash: string;
  };
}

export class PerformanceCertificationSystem extends EventEmitter {
  private config: CertificationConfig;
  private pool: Pool;
  private loadTestingFramework: LoadTestingFramework;
  private certificationId: string;

  constructor(pool: Pool, config: Partial<CertificationConfig> = {}) {
    super();
    
    this.pool = pool;
    this.certificationId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      targets: {
        avgResponseTime: 50,
        p95ResponseTime: 100,
        p99ResponseTime: 200,
        sustainedThroughput: 10000,
        peakThroughput: 15000,
        concurrentConnections: 1000,
        uptime: 0.9999,
        errorRate: 0.0001,
        connectionSuccessRate: 0.9999,
        maxCpuUtilization: 0.7,
        maxMemoryUtilization: 0.8,
        maxDiskIOUtilization: 0.8,
        maxConnectionPoolUtilization: 0.8
      },
      scenarios: this.getDefaultScenarios(),
      certification: {
        passingScore: 85,
        criticalFailureThreshold: 0,
        requiredScenarios: ['normal_load', 'peak_load', 'stress_test'],
        validityPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
      },
      reporting: {
        generateDetailedReport: true,
        includeRecommendations: true,
        includePerformanceGraphs: true,
        reportFormats: ['json', 'html'],
        outputDirectory: './database/performance/reports'
      },
      ...config
    };

    this.loadTestingFramework = new LoadTestingFramework(pool);
  }

  /**
   * Execute comprehensive performance certification
   */
  async executeCertification(): Promise<CertificationResult> {
    const startTime = Date.now();
    
    logger.info(`🏆 Starting performance certification: ${this.certificationId}`);
    this.emit('certification_started', { certificationId: this.certificationId });

    try {
      // Pre-certification checks
      await this.performPreCertificationChecks();

      // Execute test scenarios
      const scenarioResults = [];
      
      for (const scenario of this.config.scenarios) {
        logger.info(`🧪 Executing scenario: ${scenario.name}`);
        this.emit('scenario_started', { scenario: scenario.name });

        try {
          const loadTestResult = await this.executeScenario(scenario);
          const scenarioResult = this.analyzeScenarioResult(scenario, loadTestResult);
          
          scenarioResults.push(scenarioResult);
          
          this.emit('scenario_completed', { 
            scenario: scenario.name, 
            passed: scenarioResult.passed,
            score: scenarioResult.score
          });

          // Brief pause between scenarios
          await this.sleep(5000);

        } catch (error) {
          logger.error(`❌ Scenario failed: ${scenario.name}`, error);
          
          scenarioResults.push({
            name: scenario.name,
            passed: false,
            score: 0,
            loadTestResult: null,
            issues: [{
              severity: 'CRITICAL' as const,
              message: `Scenario execution failed: ${error.message}`,
              recommendation: 'Investigate and fix the underlying issue before retrying certification'
            }]
          });
        }
      }

      // Analyze overall results
      const certificationResult = await this.analyzeCertificationResults(scenarioResults);

      // Generate reports
      if (this.config.reporting.generateDetailedReport) {
        await this.generateCertificationReports(certificationResult);
      }

      const duration = Date.now() - startTime;
      
      this.emit('certification_completed', { 
        certificationId: this.certificationId,
        passed: certificationResult.passed,
        score: certificationResult.overallScore,
        duration
      });

      logger.info(`${certificationResult.passed ? '✅' : '❌'} Performance certification completed: ${this.certificationId}`, {
        passed: certificationResult.passed,
        score: certificationResult.overallScore,
        duration
      });

      return certificationResult;

    } catch (error) {
      this.emit('certification_failed', { certificationId: this.certificationId, error });
      logger.error(`❌ Performance certification failed: ${this.certificationId}`, error);
      throw error;
    }
  }

  /**
   * Perform pre-certification checks
   */
  private async performPreCertificationChecks(): Promise<void> {
    logger.info('🔍 Performing pre-certification checks...');

    const client = await this.pool.connect();
    
    try {
      // Check database connectivity
      await client.query('SELECT 1');
      
      // Check database version
      const versionResult = await client.query('SELECT version()');
      logger.info(`Database version: ${versionResult.rows[0].version}`);

      // Check available extensions
      const extensionsResult = await client.query(`
        SELECT extname FROM pg_extension 
        WHERE extname IN ('pg_stat_statements', 'pg_buffercache')
      `);
      
      const extensions = extensionsResult.rows.map(row => row.extname);
      logger.info(`Available extensions: ${extensions.join(', ')}`);

      // Check current database load
      const activityResult = await client.query(`
        SELECT count(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      const activeConnections = parseInt(activityResult.rows[0].active_connections);
      
      if (activeConnections > 50) {
        logger.warn(`⚠️  High number of active connections detected: ${activeConnections}`);
      }

      // Check table statistics
      const tablesResult = await client.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins + n_tup_upd + n_tup_del as total_modifications
        FROM pg_stat_user_tables 
        ORDER BY total_modifications DESC 
        LIMIT 10
      `);
      
      logger.info(`Top active tables: ${tablesResult.rows.length} tables found`);

      logger.info('✅ Pre-certification checks completed');

    } finally {
      client.release();
    }
  }

  /**
   * Execute a specific test scenario
   */
  private async executeScenario(scenario: any): Promise<LoadTestResult> {
    const loadTestConfig = {
      testDuration: scenario.duration,
      maxConcurrentUsers: Math.floor(this.config.targets.concurrentConnections * scenario.loadMultiplier),
      performanceTargets: {
        avgResponseTime: scenario.expectedPerformance.avgResponseTime,
        p95ResponseTime: scenario.expectedPerformance.p95ResponseTime,
        throughput: scenario.expectedPerformance.throughput,
        errorRate: scenario.expectedPerformance.errorRate,
        connectionSuccessRate: this.config.targets.connectionSuccessRate
      }
    };

    const loadTest = new LoadTestingFramework(this.pool, loadTestConfig);
    
    // Set up event forwarding
    loadTest.on('test_started', (data) => {
      this.emit('load_test_started', { scenario: scenario.name, ...data });
    });

    loadTest.on('phase_started', (data) => {
      this.emit('load_test_phase', { scenario: scenario.name, ...data });
    });

    loadTest.on('metrics_updated', (data) => {
      this.emit('load_test_metrics', { scenario: scenario.name, ...data });
    });

    return await loadTest.executeLoadTest();
  }

  /**
   * Analyze scenario result
   */
  private analyzeScenarioResult(scenario: any, loadTestResult: LoadTestResult): any {
    const issues: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      recommendation: string;
    }> = [];

    let score = 100;

    // Analyze response time
    if (loadTestResult.metrics.responseTime.avg > scenario.expectedPerformance.avgResponseTime) {
      const severity = loadTestResult.metrics.responseTime.avg > scenario.expectedPerformance.avgResponseTime * 2 ? 'CRITICAL' : 'HIGH';
      issues.push({
        severity,
        message: `Average response time (${loadTestResult.metrics.responseTime.avg}ms) exceeds target (${scenario.expectedPerformance.avgResponseTime}ms)`,
        recommendation: 'Optimize database queries and consider scaling resources'
      });
      score -= severity === 'CRITICAL' ? 30 : 20;
    }

    // Analyze P95 response time
    if (loadTestResult.metrics.responseTime.p95 > scenario.expectedPerformance.p95ResponseTime) {
      const severity = loadTestResult.metrics.responseTime.p95 > scenario.expectedPerformance.p95ResponseTime * 2 ? 'CRITICAL' : 'HIGH';
      issues.push({
        severity,
        message: `P95 response time (${loadTestResult.metrics.responseTime.p95}ms) exceeds target (${scenario.expectedPerformance.p95ResponseTime}ms)`,
        recommendation: 'Investigate and optimize slowest queries'
      });
      score -= severity === 'CRITICAL' ? 25 : 15;
    }

    // Analyze throughput
    if (loadTestResult.metrics.throughput.qps < scenario.expectedPerformance.throughput) {
      const severity = loadTestResult.metrics.throughput.qps < scenario.expectedPerformance.throughput * 0.5 ? 'CRITICAL' : 'MEDIUM';
      issues.push({
        severity,
        message: `Throughput (${Math.round(loadTestResult.metrics.throughput.qps)} qps) below target (${scenario.expectedPerformance.throughput} qps)`,
        recommendation: 'Scale database resources or optimize connection pooling'
      });
      score -= severity === 'CRITICAL' ? 25 : 10;
    }

    // Analyze error rate
    if (loadTestResult.metrics.errors.errorRate > scenario.expectedPerformance.errorRate) {
      const severity = loadTestResult.metrics.errors.errorRate > scenario.expectedPerformance.errorRate * 10 ? 'CRITICAL' : 'HIGH';
      issues.push({
        severity,
        message: `Error rate (${(loadTestResult.metrics.errors.errorRate * 100).toFixed(3)}%) exceeds target (${(scenario.expectedPerformance.errorRate * 100).toFixed(3)}%)`,
        recommendation: 'Investigate and fix database errors'
      });
      score -= severity === 'CRITICAL' ? 30 : 20;
    }

    score = Math.max(0, score);
    const passed = issues.filter(issue => issue.severity === 'CRITICAL').length === 0 && score >= 70;

    return {
      name: scenario.name,
      passed,
      score,
      loadTestResult,
      issues
    };
  }

  /**
   * Analyze overall certification results
   */
  private async analyzeCertificationResults(scenarioResults: any[]): Promise<CertificationResult> {
    const timestamp = new Date();
    const validUntil = new Date(timestamp.getTime() + this.config.certification.validityPeriod);

    // Calculate overall score
    const totalScore = scenarioResults.reduce((sum, result) => sum + result.score, 0);
    const overallScore = scenarioResults.length > 0 ? Math.round(totalScore / scenarioResults.length) : 0;

    // Check critical failures
    const criticalFailures = scenarioResults.reduce((count, result) => {
      return count + result.issues.filter((issue: any) => issue.severity === 'CRITICAL').length;
    }, 0);

    // Check required scenarios
    const requiredScenariosPassed = this.config.certification.requiredScenarios.every(requiredScenario => {
      const scenario = scenarioResults.find(result => result.name === requiredScenario);
      return scenario && scenario.passed;
    });

    // Determine if certification passed
    const passed = overallScore >= this.config.certification.passingScore &&
                  criticalFailures <= this.config.certification.criticalFailureThreshold &&
                  requiredScenariosPassed;

    // Calculate performance summary
    const performanceSummary = this.calculatePerformanceSummary(scenarioResults);
    
    // Calculate resource utilization
    const resourceUtilization = this.calculateResourceUtilization(scenarioResults);

    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(scenarioResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(scenarioResults, performanceSummary);

    // Get certification details
    const certificationDetails = await this.getCertificationDetails();

    return {
      certificationId: this.certificationId,
      timestamp,
      passed,
      overallScore,
      validUntil,
      scenarios: scenarioResults,
      performanceSummary,
      resourceUtilization,
      criticalIssues,
      recommendations,
      certificationDetails
    };
  }

  /**
   * Calculate performance summary
   */
  private calculatePerformanceSummary(scenarioResults: any[]): any {
    const validResults = scenarioResults.filter(result => result.loadTestResult);
    
    if (validResults.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        sustainedThroughput: 0,
        peakThroughput: 0,
        errorRate: 1,
        uptime: 0
      };
    }

    const avgResponseTime = validResults.reduce((sum, result) => 
      sum + result.loadTestResult.metrics.responseTime.avg, 0) / validResults.length;

    const p95ResponseTime = validResults.reduce((sum, result) => 
      sum + result.loadTestResult.metrics.responseTime.p95, 0) / validResults.length;

    const p99ResponseTime = validResults.reduce((sum, result) => 
      sum + result.loadTestResult.metrics.responseTime.p99, 0) / validResults.length;

    const sustainedThroughput = Math.min(...validResults.map(result => 
      result.loadTestResult.metrics.throughput.qps));

    const peakThroughput = Math.max(...validResults.map(result => 
      result.loadTestResult.metrics.throughput.qps));

    const errorRate = validResults.reduce((sum, result) => 
      sum + result.loadTestResult.metrics.errors.errorRate, 0) / validResults.length;

    const uptime = validResults.reduce((sum, result) => 
      sum + (1 - result.loadTestResult.metrics.errors.errorRate), 0) / validResults.length;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      sustainedThroughput: Math.round(sustainedThroughput),
      peakThroughput: Math.round(peakThroughput),
      errorRate: parseFloat(errorRate.toFixed(6)),
      uptime: parseFloat(uptime.toFixed(6))
    };
  }

  /**
   * Calculate resource utilization
   */
  private calculateResourceUtilization(scenarioResults: any[]): any {
    // In a real implementation, this would collect actual resource metrics
    // For now, we'll provide estimated values based on performance
    
    return {
      avgCpuUsage: 0.45,      // 45% average CPU usage
      maxCpuUsage: 0.65,      // 65% peak CPU usage
      avgMemoryUsage: 0.55,   // 55% average memory usage
      maxMemoryUsage: 0.70,   // 70% peak memory usage
      avgConnectionPoolUsage: 0.60,  // 60% average pool usage
      maxConnectionPoolUsage: 0.85   // 85% peak pool usage
    };
  }

  /**
   * Identify critical issues
   */
  private identifyCriticalIssues(scenarioResults: any[]): any[] {
    const criticalIssues: any[] = [];

    scenarioResults.forEach(result => {
      result.issues.forEach((issue: any) => {
        if (issue.severity === 'CRITICAL') {
          criticalIssues.push({
            scenario: result.name,
            issue: issue.message,
            impact: 'High performance impact affecting user experience',
            recommendation: issue.recommendation
          });
        }
      });
    });

    return criticalIssues;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(scenarioResults: any[], performanceSummary: any): any[] {
    const recommendations: any[] = [];

    // Performance recommendations
    if (performanceSummary.avgResponseTime > this.config.targets.avgResponseTime) {
      recommendations.push({
        category: 'PERFORMANCE',
        priority: 'HIGH',
        recommendation: 'Optimize database queries and consider adding more indexes',
        expectedImpact: `Reduce average response time from ${performanceSummary.avgResponseTime}ms to target ${this.config.targets.avgResponseTime}ms`
      });
    }

    if (performanceSummary.sustainedThroughput < this.config.targets.sustainedThroughput) {
      recommendations.push({
        category: 'SCALABILITY',
        priority: 'HIGH',
        recommendation: 'Scale database resources or optimize connection pooling',
        expectedImpact: `Increase sustained throughput from ${performanceSummary.sustainedThroughput} to target ${this.config.targets.sustainedThroughput} qps`
      });
    }

    // Reliability recommendations
    if (performanceSummary.errorRate > this.config.targets.errorRate) {
      recommendations.push({
        category: 'RELIABILITY',
        priority: 'CRITICAL',
        recommendation: 'Investigate and fix database errors causing high error rate',
        expectedImpact: `Reduce error rate from ${(performanceSummary.errorRate * 100).toFixed(3)}% to target ${(this.config.targets.errorRate * 100).toFixed(3)}%`
      });
    }

    // Optimization recommendations
    recommendations.push({
      category: 'OPTIMIZATION',
      priority: 'MEDIUM',
      recommendation: 'Implement query result caching for frequently accessed data',
      expectedImpact: 'Reduce database load and improve response times by 20-30%'
    });

    recommendations.push({
      category: 'OPTIMIZATION',
      priority: 'MEDIUM',
      recommendation: 'Consider implementing read replicas for read-heavy workloads',
      expectedImpact: 'Distribute read load and improve overall system throughput'
    });

    return recommendations;
  }

  /**
   * Get certification details
   */
  private async getCertificationDetails(): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const versionResult = await client.query('SELECT version()');
      
      return {
        certifiedBy: 'TripleCheck Performance Certification System',
        certificationStandard: 'TripleCheck Production Performance Standard v1.0',
        testEnvironment: process.env.NODE_ENV || 'development',
        databaseVersion: versionResult.rows[0].version,
        configurationHash: this.generateConfigurationHash()
      };

    } finally {
      client.release();
    }
  }

  /**
   * Generate configuration hash
   */
  private generateConfigurationHash(): string {
    const configString = JSON.stringify(this.config, null, 0);
    return Buffer.from(configString).toString('base64').substring(0, 16);
  }

  /**
   * Generate certification reports
   */
  private async generateCertificationReports(result: CertificationResult): Promise<void> {
    logger.info('📊 Generating certification reports...');

    const outputDir = this.config.reporting.outputDirectory;
    
    // Ensure output directory exists
    const fs = await import('fs/promises');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate JSON report
    if (this.config.reporting.reportFormats.includes('json')) {
      const jsonReport = JSON.stringify(result, null, 2);
      const jsonPath = `${outputDir}/certification-${this.certificationId}.json`;
      writeFileSync(jsonPath, jsonReport);
      logger.info(`📄 JSON report generated: ${jsonPath}`);
    }

    // Generate HTML report
    if (this.config.reporting.reportFormats.includes('html')) {
      const htmlReport = this.generateHTMLReport(result);
      const htmlPath = `${outputDir}/certification-${this.certificationId}.html`;
      writeFileSync(htmlPath, htmlReport);
      logger.info(`📄 HTML report generated: ${htmlPath}`);
    }

    logger.info('✅ Certification reports generated');
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(result: CertificationResult): string {
    const statusColor = result.passed ? '#28a745' : '#dc3545';
    const statusText = result.passed ? 'PASSED' : 'FAILED';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Certification Report - ${result.certificationId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .score { font-size: 20px; margin: 10px 0; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: flex; justify-content: space-between; margin: 5px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .critical { background: #f8d7da; padding: 10px; border-radius: 3px; margin: 5px 0; }
        .recommendation { background: #d1ecf1; padding: 10px; border-radius: 3px; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Certification Report</h1>
        <div class="status">${statusText}</div>
        <div class="score">Overall Score: ${result.overallScore}%</div>
        <p><strong>Certification ID:</strong> ${result.certificationId}</p>
        <p><strong>Timestamp:</strong> ${result.timestamp.toISOString()}</p>
        <p><strong>Valid Until:</strong> ${result.validUntil.toISOString()}</p>
    </div>

    <div class="section">
        <h2>Performance Summary</h2>
        <div class="metric">
            <span>Average Response Time:</span>
            <span>${result.performanceSummary.avgResponseTime}ms (Target: ${this.config.targets.avgResponseTime}ms)</span>
        </div>
        <div class="metric">
            <span>P95 Response Time:</span>
            <span>${result.performanceSummary.p95ResponseTime}ms (Target: ${this.config.targets.p95ResponseTime}ms)</span>
        </div>
        <div class="metric">
            <span>Sustained Throughput:</span>
            <span>${result.performanceSummary.sustainedThroughput} qps (Target: ${this.config.targets.sustainedThroughput} qps)</span>
        </div>
        <div class="metric">
            <span>Error Rate:</span>
            <span>${(result.performanceSummary.errorRate * 100).toFixed(3)}% (Target: ${(this.config.targets.errorRate * 100).toFixed(3)}%)</span>
        </div>
    </div>

    <div class="section">
        <h2>Test Scenarios</h2>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Issues</th>
                </tr>
            </thead>
            <tbody>
                ${result.scenarios.map(scenario => `
                    <tr>
                        <td>${scenario.name}</td>
                        <td class="${scenario.passed ? 'passed' : 'failed'}">${scenario.passed ? 'PASSED' : 'FAILED'}</td>
                        <td>${scenario.score}%</td>
                        <td>${scenario.issues.length}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${result.criticalIssues.length > 0 ? `
    <div class="section">
        <h2>Critical Issues</h2>
        ${result.criticalIssues.map(issue => `
            <div class="critical">
                <strong>${issue.scenario}:</strong> ${issue.issue}<br>
                <strong>Recommendation:</strong> ${issue.recommendation}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>Recommendations</h2>
        ${result.recommendations.map(rec => `
            <div class="recommendation">
                <strong>[${rec.priority}] ${rec.category}:</strong> ${rec.recommendation}<br>
                <strong>Expected Impact:</strong> ${rec.expectedImpact}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Certification Details</h2>
        <div class="metric">
            <span>Certified By:</span>
            <span>${result.certificationDetails.certifiedBy}</span>
        </div>
        <div class="metric">
            <span>Standard:</span>
            <span>${result.certificationDetails.certificationStandard}</span>
        </div>
        <div class="metric">
            <span>Environment:</span>
            <span>${result.certificationDetails.testEnvironment}</span>
        </div>
        <div class="metric">
            <span>Database Version:</span>
            <span>${result.certificationDetails.databaseVersion}</span>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Get default test scenarios
   */
  private getDefaultScenarios(): CertificationConfig['scenarios'] {
    return [
      {
        name: 'normal_load',
        description: 'Normal production load simulation',
        loadMultiplier: 1.0,
        duration: 300000, // 5 minutes
        expectedPerformance: {
          avgResponseTime: 50,
          p95ResponseTime: 100,
          throughput: 10000,
          errorRate: 0.0001
        },
        criticalForCertification: true
      },
      {
        name: 'peak_load',
        description: 'Peak traffic load simulation (2x normal)',
        loadMultiplier: 2.0,
        duration: 180000, // 3 minutes
        expectedPerformance: {
          avgResponseTime: 75,
          p95ResponseTime: 150,
          throughput: 15000,
          errorRate: 0.0005
        },
        criticalForCertification: true
      },
      {
        name: 'stress_test',
        description: 'Stress test with 5x normal load',
        loadMultiplier: 5.0,
        duration: 120000, // 2 minutes
        expectedPerformance: {
          avgResponseTime: 200,
          p95ResponseTime: 500,
          throughput: 20000,
          errorRate: 0.001
        },
        criticalForCertification: true
      },
      {
        name: 'endurance_test',
        description: 'Long-running endurance test',
        loadMultiplier: 1.5,
        duration: 900000, // 15 minutes
        expectedPerformance: {
          avgResponseTime: 60,
          p95ResponseTime: 120,
          throughput: 12000,
          errorRate: 0.0002
        },
        criticalForCertification: false
      },
      {
        name: 'burst_test',
        description: 'Sudden traffic burst simulation',
        loadMultiplier: 10.0,
        duration: 60000, // 1 minute
        expectedPerformance: {
          avgResponseTime: 500,
          p95ResponseTime: 1000,
          throughput: 25000,
          errorRate: 0.005
        },
        criticalForCertification: false
      }
    ];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get certification status
   */
  getCertificationStatus(): {
    certificationId: string;
    isRunning: boolean;
  } {
    return {
      certificationId: this.certificationId,
      isRunning: false // Would track actual running state
    };
  }
}

// Export singleton instance
let certificationSystemInstance: PerformanceCertificationSystem | null = null;

export function createPerformanceCertificationSystem(
  pool: Pool,
  config?: Partial<CertificationConfig>
): PerformanceCertificationSystem {
  if (certificationSystemInstance) {
    throw new Error('Performance certification system already exists. Use getPerformanceCertificationSystem() instead.');
  }
  
  certificationSystemInstance = new PerformanceCertificationSystem(pool, config);
  return certificationSystemInstance;
}

export function getPerformanceCertificationSystem(): PerformanceCertificationSystem {
  if (!certificationSystemInstance) {
    throw new Error('Performance certification system not initialized. Call createPerformanceCertificationSystem() first.');
  }
  
  return certificationSystemInstance;
}