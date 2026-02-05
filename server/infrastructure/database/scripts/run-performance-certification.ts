#!/usr/bin/env tsx
/**
 * Performance Certification Execution Script
 * 
 * Executes comprehensive performance certification with realistic load testing
 */

import { Pool } from 'pg';
import { PerformanceCertificationSystem } from '../performance/PerformanceCertificationSystem';
import { logger } from '../../monitoring/logger';

interface CertificationConfig {
  databaseUrl?: string;
  outputDir?: string;
  testDuration?: number;
  maxConcurrentUsers?: number;
  performanceTargets?: {
    avgResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
    errorRate: number;
  };
}

async function runPerformanceCertification(config: CertificationConfig = {}) {
  const {
    databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/triplecheck',
    outputDir = './database/performance/reports',
    testDuration = 300000, // 5 minutes
    maxConcurrentUsers = 1000,
    performanceTargets = {
      avgResponseTime: 50,
      p95ResponseTime: 100,
      throughput: 10000,
      errorRate: 0.0001
    }
  } = config;

  console.log('🏆 Starting Performance Certification...');
  console.log(`⏱️  Test duration: ${testDuration / 1000}s`);
  console.log(`👥 Max concurrent users: ${maxConcurrentUsers}`);
  console.log(`🎯 Performance targets:`);
  console.log(`   - Average response time: ${performanceTargets.avgResponseTime}ms`);
  console.log(`   - P95 response time: ${performanceTargets.p95ResponseTime}ms`);
  console.log(`   - Throughput: ${performanceTargets.throughput} qps`);
  console.log(`   - Error rate: ${(performanceTargets.errorRate * 100).toFixed(4)}%`);

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Initialize certification system
    const certification = new PerformanceCertificationSystem(pool, {
      targets: {
        avgResponseTime: performanceTargets.avgResponseTime,
        p95ResponseTime: performanceTargets.p95ResponseTime,
        p99ResponseTime: performanceTargets.p95ResponseTime * 2,
        sustainedThroughput: performanceTargets.throughput,
        peakThroughput: performanceTargets.throughput * 1.5,
        concurrentConnections: maxConcurrentUsers,
        uptime: 0.9999,
        errorRate: performanceTargets.errorRate,
        connectionSuccessRate: 0.9999,
        maxCpuUtilization: 0.7,
        maxMemoryUtilization: 0.8,
        maxDiskIOUtilization: 0.8,
        maxConnectionPoolUtilization: 0.8
      },
      scenarios: [
        {
          name: 'normal_load',
          description: 'Normal production load simulation',
          loadMultiplier: 1.0,
          duration: testDuration,
          expectedPerformance: performanceTargets,
          criticalForCertification: true
        },
        {
          name: 'peak_load',
          description: 'Peak load simulation (2x normal)',
          loadMultiplier: 2.0,
          duration: testDuration / 2,
          expectedPerformance: {
            ...performanceTargets,
            avgResponseTime: performanceTargets.avgResponseTime * 1.5,
            p95ResponseTime: performanceTargets.p95ResponseTime * 1.5
          },
          criticalForCertification: true
        },
        {
          name: 'stress_test',
          description: 'Stress test (5x normal load)',
          loadMultiplier: 5.0,
          duration: testDuration / 5,
          expectedPerformance: {
            ...performanceTargets,
            avgResponseTime: performanceTargets.avgResponseTime * 3,
            p95ResponseTime: performanceTargets.p95ResponseTime * 3,
            throughput: performanceTargets.throughput * 2
          },
          criticalForCertification: false
        }
      ],
      reporting: {
        generateDetailedReport: true,
        includeRecommendations: true,
        includePerformanceGraphs: true,
        reportFormats: ['json', 'html'],
        outputDirectory: outputDir
      }
    });

    // Set up event listeners for progress tracking
    certification.on('certification_started', (data) => {
      console.log(`🚀 Certification started: ${data.certificationId}`);
    });

    certification.on('scenario_started', (data) => {
      console.log(`🧪 Starting scenario: ${data.scenario}`);
    });

    certification.on('scenario_completed', (data) => {
      const status = data.passed ? '✅' : '❌';
      console.log(`${status} Scenario completed: ${data.scenario} (Score: ${data.score}%)`);
    });

    certification.on('load_test_phase', (data) => {
      console.log(`📊 Load test phase: ${data.phase} (${data.scenario})`);
    });

    certification.on('load_test_metrics', (data) => {
      if (data.metrics) {
        console.log(`📈 Metrics - Avg: ${Math.round(data.metrics.avgResponseTime)}ms, QPS: ${Math.round(data.metrics.qps)}, Errors: ${(data.metrics.errorRate * 100).toFixed(2)}%`);
      }
    });

    certification.on('certification_completed', (data) => {
      const status = data.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} Certification completed: ${data.score}% (Duration: ${Math.round(data.duration / 1000)}s)`);
    });

    // Execute certification
    const result = await certification.executeCertification();

    // Display results
    console.log('\n📋 PERFORMANCE CERTIFICATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Certification ID: ${result.certificationId}`);
    console.log(`Overall Status: ${result.passed ? '✅ CERTIFIED' : '❌ NOT CERTIFIED'}`);
    console.log(`Overall Score: ${result.overallScore}%`);
    console.log(`Valid Until: ${result.validUntil.toISOString()}`);

    // Display performance summary
    console.log('\n📊 PERFORMANCE SUMMARY:');
    console.log(`Average Response Time: ${result.performanceSummary.avgResponseTime}ms (Target: ${performanceTargets.avgResponseTime}ms)`);
    console.log(`P95 Response Time: ${result.performanceSummary.p95ResponseTime}ms (Target: ${performanceTargets.p95ResponseTime}ms)`);
    console.log(`P99 Response Time: ${result.performanceSummary.p99ResponseTime}ms`);
    console.log(`Sustained Throughput: ${result.performanceSummary.sustainedThroughput} qps (Target: ${performanceTargets.throughput} qps)`);
    console.log(`Peak Throughput: ${result.performanceSummary.peakThroughput} qps`);
    console.log(`Error Rate: ${(result.performanceSummary.errorRate * 100).toFixed(4)}% (Target: ${(performanceTargets.errorRate * 100).toFixed(4)}%)`);
    console.log(`Uptime: ${(result.performanceSummary.uptime * 100).toFixed(2)}%`);

    // Display resource utilization
    console.log('\n💻 RESOURCE UTILIZATION:');
    console.log(`Average CPU Usage: ${(result.resourceUtilization.avgCpuUsage * 100).toFixed(1)}%`);
    console.log(`Peak CPU Usage: ${(result.resourceUtilization.maxCpuUsage * 100).toFixed(1)}%`);
    console.log(`Average Memory Usage: ${(result.resourceUtilization.avgMemoryUsage * 100).toFixed(1)}%`);
    console.log(`Peak Memory Usage: ${(result.resourceUtilization.maxMemoryUsage * 100).toFixed(1)}%`);
    console.log(`Average Connection Pool Usage: ${(result.resourceUtilization.avgConnectionPoolUsage * 100).toFixed(1)}%`);
    console.log(`Peak Connection Pool Usage: ${(result.resourceUtilization.maxConnectionPoolUsage * 100).toFixed(1)}%`);

    // Display scenario results
    console.log('\n🧪 SCENARIO RESULTS:');
    result.scenarios.forEach((scenario, index) => {
      const status = scenario.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${scenario.name}: ${scenario.score}%`);
      if (scenario.issues.length > 0) {
        scenario.issues.forEach(issue => {
          console.log(`   ⚠️  ${issue.severity}: ${issue.message}`);
        });
      }
    });

    // Display critical issues
    if (result.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      result.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.scenario}] ${issue.issue}`);
        console.log(`   💡 Recommendation: ${issue.recommendation}`);
      });
    }

    // Display recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
        console.log(`   📈 Expected Impact: ${rec.expectedImpact}`);
      });
    }

    // Display report locations
    console.log('\n📊 REPORTS GENERATED:');
    console.log(`📄 JSON Report: ${outputDir}/certification-${result.certificationId}.json`);
    console.log(`🌐 HTML Report: ${outputDir}/certification-${result.certificationId}.html`);

    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Performance certification failed:', error);
    logger.error('Performance certification failed', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: CertificationConfig = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--database-url':
        config.databaseUrl = value;
        break;
      case '--output-dir':
        config.outputDir = value;
        break;
      case '--duration':
        config.testDuration = parseInt(value) * 1000; // Convert to ms
        break;
      case '--users':
        config.maxConcurrentUsers = parseInt(value);
        break;
      case '--avg-response-time':
        config.performanceTargets = config.performanceTargets || {} as any;
        config.performanceTargets.avgResponseTime = parseInt(value);
        break;
      case '--p95-response-time':
        config.performanceTargets = config.performanceTargets || {} as any;
        config.performanceTargets.p95ResponseTime = parseInt(value);
        break;
      case '--throughput':
        config.performanceTargets = config.performanceTargets || {} as any;
        config.performanceTargets.throughput = parseInt(value);
        break;
      case '--help':
        console.log(`
Performance Certification Tool

Usage: tsx database/scripts/run-performance-certification.ts [options]

Options:
  --database-url <url>           Database connection URL (default: DATABASE_URL env var)
  --output-dir <dir>             Output directory for reports (default: ./database/performance/reports)
  --duration <seconds>           Test duration in seconds (default: 300)
  --users <count>                Max concurrent users (default: 1000)
  --avg-response-time <ms>       Target average response time (default: 50)
  --p95-response-time <ms>       Target P95 response time (default: 100)
  --throughput <qps>             Target throughput in queries per second (default: 10000)
  --help                         Show this help message

Examples:
  tsx database/scripts/run-performance-certification.ts
  tsx database/scripts/run-performance-certification.ts --duration 600 --users 2000
  tsx database/scripts/run-performance-certification.ts --avg-response-time 30 --throughput 15000
        `);
        process.exit(0);
        break;
    }
  }

  runPerformanceCertification(config);
}

export { runPerformanceCertification };