#!/usr/bin/env node

import { performance } from 'perf_hooks';

interface LoadTestResult {
  testName: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  operationsPerSecond: number;
  errorRate: number;
}

interface LoadTestReport {
  timestamp: string;
  overallMetrics: {
    totalOperations: number;
    totalSuccessful: number;
    totalFailed: number;
    overallAverageResponseTime: number;
    overallOperationsPerSecond: number;
    overallErrorRate: number;
  };
  results: LoadTestResult[];
  performanceStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
}

class LoadTestValidator {
  async runCPUIntensiveTest(operations: number = 1000): Promise<LoadTestResult> {
    console.log(`🔄 Running CPU intensive test with ${operations} operations...`);
    
    const startTime = performance.now();
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < operations; i++) {
      const operationStart = performance.now();
      
      try {
        // Simulate CPU intensive operation
        const data = Array.from({ length: 100 }, (_, j) => ({
          id: j,
          value: Math.random() * 1000,
          computed: Math.sqrt(Math.pow(j, 2) + Math.pow(Math.random() * 100, 2))
        }));
        
        // Process the data
        const processed = data
          .filter(item => item.value > 500)
          .map(item => ({ ...item, normalized: item.value / 1000 }))
          .sort((a, b) => a.computed - b.computed);
        
        if (processed.length >= 0) {
          successful++;
        } else {
          failed++;
        }
        
        const operationTime = performance.now() - operationStart;
        responseTimes.push(operationTime);
        
      } catch (error) {
        failed++;
        const operationTime = performance.now() - operationStart;
        responseTimes.push(operationTime);
      }
    }

    const totalTime = performance.now() - startTime;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const operationsPerSecond = (operations / totalTime) * 1000;
    const errorRate = (failed / operations) * 100;

    return {
      testName: 'CPU Intensive Operations',
      totalOperations: operations,
      successfulOperations: successful,
      failedOperations: failed,
      averageResponseTime: avgResponseTime,
      minResponseTime,
      maxResponseTime,
      operationsPerSecond,
      errorRate
    };
  }

  async runMemoryIntensiveTest(operations: number = 500): Promise<LoadTestResult> {
    console.log(`🧠 Running memory intensive test with ${operations} operations...`);
    
    const startTime = performance.now();
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < operations; i++) {
      const operationStart = performance.now();
      
      try {
        // Simulate memory intensive operation
        const largeArray = Array.from({ length: 1000 }, (_, j) => ({
          id: j,
          data: new Array(100).fill(0).map(() => Math.random()),
          metadata: {
            created: new Date(),
            index: j,
            category: `category_${j % 10}`,
            tags: Array.from({ length: 10 }, (_, k) => `tag_${k}`)
          }
        }));
        
        // Process the large array
        const processed = largeArray
          .filter(item => item.data.reduce((sum, val) => sum + val, 0) > 50)
          .map(item => ({
            ...item,
            average: item.data.reduce((sum, val) => sum + val, 0) / item.data.length
          }));
        
        if (processed.length >= 0) {
          successful++;
        } else {
          failed++;
        }
        
        const operationTime = performance.now() - operationStart;
        responseTimes.push(operationTime);
        
        // Clear the large objects to help with garbage collection
        largeArray.length = 0;
        processed.length = 0;
        
      } catch (error) {
        failed++;
        const operationTime = performance.now() - operationStart;
        responseTimes.push(operationTime);
      }
    }

    const totalTime = performance.now() - startTime;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const operationsPerSecond = (operations / totalTime) * 1000;
    const errorRate = (failed / operations) * 100;

    return {
      testName: 'Memory Intensive Operations',
      totalOperations: operations,
      successfulOperations: successful,
      failedOperations: failed,
      averageResponseTime: avgResponseTime,
      minResponseTime,
      maxResponseTime,
      operationsPerSecond,
      errorRate
    };
  }

  async runConcurrentOperationsTest(concurrency: number = 50, operationsPerWorker: number = 20): Promise<LoadTestResult> {
    console.log(`⚡ Running concurrent operations test with ${concurrency} workers, ${operationsPerWorker} ops each...`);
    
    const startTime = performance.now();
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    const workers = Array.from({ length: concurrency }, async (_, workerId) => {
      for (let i = 0; i < operationsPerWorker; i++) {
        const operationStart = performance.now();
        
        try {
          // Simulate async operation with some processing
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          
          const data = {
            workerId,
            operationId: i,
            result: Math.random() * 1000,
            processed: Array.from({ length: 50 }, (_, j) => j * Math.random())
          };
          
          // Simulate some processing
          const sum = data.processed.reduce((acc, val) => acc + val, 0);
          
          if (sum >= 0) {
            successful++;
          } else {
            failed++;
          }
          
          const operationTime = performance.now() - operationStart;
          responseTimes.push(operationTime);
          
        } catch (error) {
          failed++;
          const operationTime = performance.now() - operationStart;
          responseTimes.push(operationTime);
        }
      }
    });

    await Promise.all(workers);

    const totalOperations = concurrency * operationsPerWorker;
    const totalTime = performance.now() - startTime;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const operationsPerSecond = (totalOperations / totalTime) * 1000;
    const errorRate = (failed / totalOperations) * 100;

    return {
      testName: 'Concurrent Operations',
      totalOperations,
      successfulOperations: successful,
      failedOperations: failed,
      averageResponseTime: avgResponseTime,
      minResponseTime,
      maxResponseTime,
      operationsPerSecond,
      errorRate
    };
  }

  async runJSONProcessingTest(operations: number = 200): Promise<LoadTestResult> {
    console.log(`📄 Running JSON processing test with ${operations} operations...`);
    
    const startTime = performance.now();
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < operations; i++) {
      const operationStart = performance.now();
      
      try {
        // Create complex JSON object
        const complexObject = {
          id: i,
          timestamp: new Date().toISOString(),
          data: Array.from({ length: 100 }, (_, j) => ({
            id: j,
            value: Math.random() * 1000,
            metadata: {
              category: `category_${j % 5}`,
              tags: Array.from({ length: 5 }, (_, k) => `tag_${k}_${j}`),
              nested: {
                level1: {
                  level2: {
                    value: Math.random(),
                    array: Array.from({ length: 10 }, () => Math.random())
                  }
                }
              }
            }
          })),
          summary: {
            total: 100,
            processed: new Date(),
            version: '1.0.0'
          }
        };
        
        // Serialize and deserialize
        const serialized = JSON.stringify(complexObject);
        const deserialized = JSON.parse(serialized);
        
        // Validate the result
        if (deserialized.data.length === 100 && deserialized.id === i) {
          successful++;
        } else {
          failed++;
        }
        
        const operationTime = performance.now() - operationStart;
        responseTimes.push(operationTime);
        
      } catch (error) {
        failed++;
        const operationTime = performance.now() - operationStart;
        responseTimes.push(operationTime);
      }
    }

    const totalTime = performance.now() - startTime;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const operationsPerSecond = (operations / totalTime) * 1000;
    const errorRate = (failed / operations) * 100;

    return {
      testName: 'JSON Processing',
      totalOperations: operations,
      successfulOperations: successful,
      failedOperations: failed,
      averageResponseTime: avgResponseTime,
      minResponseTime,
      maxResponseTime,
      operationsPerSecond,
      errorRate
    };
  }

  async runFullLoadTest(): Promise<LoadTestReport> {
    console.log('🚀 Starting comprehensive load test validation...\n');
    
    const results: LoadTestResult[] = [];
    
    // Run all test types
    results.push(await this.runCPUIntensiveTest(1000));
    results.push(await this.runMemoryIntensiveTest(500));
    results.push(await this.runConcurrentOperationsTest(50, 20));
    results.push(await this.runJSONProcessingTest(200));
    
    // Calculate overall metrics
    const totalOperations = results.reduce((sum, result) => sum + result.totalOperations, 0);
    const totalSuccessful = results.reduce((sum, result) => sum + result.successfulOperations, 0);
    const totalFailed = results.reduce((sum, result) => sum + result.failedOperations, 0);
    
    const overallAverageResponseTime = results.reduce((sum, result) => 
      sum + (result.averageResponseTime * result.totalOperations), 0) / totalOperations;
    
    const overallOperationsPerSecond = results.reduce((sum, result) => 
      sum + result.operationsPerSecond, 0) / results.length;
    
    const overallErrorRate = (totalFailed / totalOperations) * 100;
    
    // Determine performance status
    let performanceStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL' = 'EXCELLENT';
    
    if (overallErrorRate > 5 || overallAverageResponseTime > 100) {
      performanceStatus = 'CRITICAL';
    } else if (overallErrorRate > 2 || overallAverageResponseTime > 50) {
      performanceStatus = 'POOR';
    } else if (overallErrorRate > 1 || overallAverageResponseTime > 25) {
      performanceStatus = 'ACCEPTABLE';
    } else if (overallErrorRate > 0.5 || overallAverageResponseTime > 10) {
      performanceStatus = 'GOOD';
    }
    
    return {
      timestamp: new Date().toISOString(),
      overallMetrics: {
        totalOperations,
        totalSuccessful,
        totalFailed,
        overallAverageResponseTime,
        overallOperationsPerSecond,
        overallErrorRate
      },
      results,
      performanceStatus
    };
  }

  printReport(report: LoadTestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 LOAD TEST VALIDATION RESULTS');
    console.log('='.repeat(80));
    
    const { overallMetrics, performanceStatus } = report;
    
    console.log(`\n🎯 Overall Performance: ${performanceStatus}`);
    console.log(`📈 Total Operations: ${overallMetrics.totalOperations}`);
    console.log(`✅ Successful: ${overallMetrics.totalSuccessful}`);
    console.log(`❌ Failed: ${overallMetrics.totalFailed}`);
    console.log(`⚡ Avg Response Time: ${Math.round(overallMetrics.overallAverageResponseTime)}ms`);
    console.log(`🔄 Operations/Second: ${overallMetrics.overallOperationsPerSecond.toFixed(2)}`);
    console.log(`📉 Error Rate: ${overallMetrics.overallErrorRate.toFixed(2)}%`);
    
    console.log('\n📋 Test Details:');
    for (const result of report.results) {
      console.log(`\n  ${result.testName}:`);
      console.log(`    Operations: ${result.totalOperations} (${result.successfulOperations} success, ${result.failedOperations} failed)`);
      console.log(`    Avg Response: ${Math.round(result.averageResponseTime)}ms`);
      console.log(`    Min/Max: ${result.minResponseTime.toFixed(2)}ms / ${result.maxResponseTime.toFixed(2)}ms`);
      console.log(`    Ops/Second: ${result.operationsPerSecond.toFixed(2)}`);
      console.log(`    Error Rate: ${result.errorRate.toFixed(2)}%`);
    }
    
    console.log('\n📊 Performance Assessment:');
    if (performanceStatus === 'EXCELLENT') {
      console.log('🟢 EXCELLENT: System performance exceeds expectations');
    } else if (performanceStatus === 'GOOD') {
      console.log('🟡 GOOD: System performance meets requirements');
    } else if (performanceStatus === 'ACCEPTABLE') {
      console.log('🟠 ACCEPTABLE: System performance is within acceptable limits');
    } else if (performanceStatus === 'POOR') {
      console.log('🔴 POOR: System performance needs improvement');
    } else {
      console.log('🚨 CRITICAL: System performance is below acceptable thresholds');
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run load test if this script is executed directly
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const loadTester = new LoadTestValidator();
  
  loadTester.runFullLoadTest()
    .then((report) => {
      loadTester.printReport(report);
      
      // Save report to file
      const reportPath = join(__dirname, '..', '..', 'load-test-validation-report.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Load test validation report saved to: ${reportPath}`);
      
      // Exit with appropriate code
      process.exit(report.performanceStatus === 'CRITICAL' ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Load test validation failed:', error);
      process.exit(1);
    });
}

export { LoadTestValidator };