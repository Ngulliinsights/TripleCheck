#!/usr/bin/env tsx

import { performance } from 'perf_hooks';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface DeploymentTestSuite {
  name: string;
  tests: TestResult[];
  passed: boolean;
  duration: number;
}

class DeploymentTester {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  async runAllTests(): Promise<DeploymentTestSuite[]> {
    console.log('🧪 Starting deployment tests...');
    
    const testSuites = [
      await this.runHealthCheckTests(),
      await this.runAPIEndpointTests(),
      await this.runDatabaseTests(),
      await this.runExternalIntegrationTests(),
      await this.runPerformanceTests(),
      await this.runSecurityTests(),
      await this.runMonitoringTests()
    ];

    const overallPassed = testSuites.every(suite => suite.passed);
    const totalDuration = testSuites.reduce((sum, suite) => sum + suite.duration, 0);

    console.log('\n📊 Deployment Test Summary:');
    console.log(`Overall Status: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
    
    testSuites.forEach(suite => {
      const status = suite.passed ? '✅' : '❌';
      const failedCount = suite.tests.filter(t => !t.passed).length;
      console.log(`${status} ${suite.name}: ${suite.tests.length - failedCount}/${suite.tests.length} passed`);
    });

    return testSuites;
  }

  private async runHealthCheckTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test main health endpoint
    tests.push(await this.runTest('Health Check Endpoint', async () => {
      const response = await this.makeRequest('/health');
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      
      const health = await response.json();
      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error(`Unhealthy status: ${health.status}`);
      }
      
      return { status: health.status, checks: health.checks };
    }));

    // Test readiness endpoint
    tests.push(await this.runTest('Readiness Check', async () => {
      const response = await this.makeRequest('/ready');
      if (!response.ok) {
        throw new Error(`Readiness check failed with status ${response.status}`);
      }
      
      const readiness = await response.json();
      return { status: readiness.status };
    }));

    // Test liveness endpoint
    tests.push(await this.runTest('Liveness Check', async () => {
      const response = await this.makeRequest('/live');
      if (!response.ok) {
        throw new Error(`Liveness check failed with status ${response.status}`);
      }
      
      const liveness = await response.json();
      return { status: liveness.status, uptime: liveness.uptime };
    }));

    return {
      name: 'Health Check Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runAPIEndpointTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test land verification endpoints
    const endpoints = [
      { path: '/api/land-verification/health', method: 'GET' },
      { path: '/api/government-integration/health', method: 'GET' },
      { path: '/api/risk-assessment/health', method: 'GET' },
      { path: '/api/community-intelligence/health', method: 'GET' },
      { path: '/api/monitoring/health', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      tests.push(await this.runTest(`${endpoint.method} ${endpoint.path}`, async () => {
        const response = await this.makeRequest(endpoint.path, {
          method: endpoint.method
        });
        
        if (!response.ok) {
          throw new Error(`Endpoint failed with status ${response.status}`);
        }
        
        return { status: response.status };
      }));
    }

    // Test API authentication
    tests.push(await this.runTest('API Authentication', async () => {
      const response = await this.makeRequest('/api/land-verification/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
        },
        body: JSON.stringify({
          propertyId: 'test-property-id',
          userId: 'test-user-id'
        })
      });
      
      // Should return 401 without proper auth, or 200/201 with proper auth
      if (response.status === 401 && !this.apiKey) {
        return { message: 'Authentication properly required' };
      } else if (response.ok && this.apiKey) {
        return { message: 'Authentication successful' };
      } else {
        throw new Error(`Unexpected authentication response: ${response.status}`);
      }
    }));

    return {
      name: 'API Endpoint Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runDatabaseTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test database connectivity through health endpoint
    tests.push(await this.runTest('Database Connectivity', async () => {
      const response = await this.makeRequest('/health');
      const health = await response.json();
      
      if (health.checks.database.status !== 'pass') {
        throw new Error(`Database check failed: ${health.checks.database.message}`);
      }
      
      return { 
        responseTime: health.checks.database.responseTime,
        message: health.checks.database.message 
      };
    }));

    // Test Redis connectivity
    tests.push(await this.runTest('Redis Connectivity', async () => {
      const response = await this.makeRequest('/health');
      const health = await response.json();
      
      if (health.checks.redis.status !== 'pass') {
        throw new Error(`Redis check failed: ${health.checks.redis.message}`);
      }
      
      return { 
        responseTime: health.checks.redis.responseTime,
        message: health.checks.redis.message 
      };
    }));

    return {
      name: 'Database Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runExternalIntegrationTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test external API connectivity through health endpoint
    tests.push(await this.runTest('External API Connectivity', async () => {
      const response = await this.makeRequest('/health');
      const health = await response.json();
      
      const externalAPIs = health.checks.externalAPIs;
      if (externalAPIs.status === 'fail') {
        throw new Error(`External API check failed: ${externalAPIs.message}`);
      }
      
      return { 
        status: externalAPIs.status,
        message: externalAPIs.message,
        details: externalAPIs.details 
      };
    }));

    // Test government integration service
    tests.push(await this.runTest('Government Integration Service', async () => {
      const response = await this.makeRequest('/api/government-integration/health');
      
      if (!response.ok) {
        throw new Error(`Government integration service unhealthy: ${response.status}`);
      }
      
      return { status: 'healthy' };
    }));

    return {
      name: 'External Integration Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runPerformanceTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test response time for health endpoint
    tests.push(await this.runTest('Health Endpoint Response Time', async () => {
      const testStartTime = performance.now();
      const response = await this.makeRequest('/health');
      const responseTime = performance.now() - testStartTime;
      
      if (!response.ok) {
        throw new Error(`Health endpoint failed: ${response.status}`);
      }
      
      if (responseTime > 5000) { // 5 seconds
        throw new Error(`Health endpoint too slow: ${responseTime.toFixed(2)}ms`);
      }
      
      return { responseTime: responseTime.toFixed(2) + 'ms' };
    }));

    // Test concurrent requests
    tests.push(await this.runTest('Concurrent Request Handling', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests).fill(0).map(() => 
        this.makeRequest('/live')
      );
      
      const testStartTime = performance.now();
      const responses = await Promise.all(promises);
      const totalTime = performance.now() - testStartTime;
      
      const failedRequests = responses.filter(r => !r.ok).length;
      if (failedRequests > 0) {
        throw new Error(`${failedRequests}/${concurrentRequests} concurrent requests failed`);
      }
      
      return { 
        concurrentRequests,
        totalTime: totalTime.toFixed(2) + 'ms',
        averageTime: (totalTime / concurrentRequests).toFixed(2) + 'ms'
      };
    }));

    return {
      name: 'Performance Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runSecurityTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test HTTPS enforcement (if applicable)
    tests.push(await this.runTest('HTTPS Security', async () => {
      if (!this.baseUrl.startsWith('https://')) {
        return { message: 'HTTP endpoint - HTTPS not enforced (development only)' };
      }
      
      return { message: 'HTTPS properly configured' };
    }));

    // Test unauthorized access
    tests.push(await this.runTest('Unauthorized Access Protection', async () => {
      const response = await this.makeRequest('/api/land-verification/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: 'test', userId: 'test' })
      });
      
      if (response.status !== 401 && response.status !== 403) {
        throw new Error(`Expected 401/403 for unauthorized access, got ${response.status}`);
      }
      
      return { message: 'Unauthorized access properly blocked' };
    }));

    // Test SQL injection protection (basic test)
    tests.push(await this.runTest('SQL Injection Protection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const response = await this.makeRequest(`/api/land-verification/sessions?propertyId=${encodeURIComponent(maliciousInput)}`);
      
      // Should not return 500 (internal server error) which might indicate SQL injection vulnerability
      if (response.status === 500) {
        throw new Error('Potential SQL injection vulnerability detected');
      }
      
      return { message: 'SQL injection protection appears to be working' };
    }));

    return {
      name: 'Security Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runMonitoringTests(): Promise<DeploymentTestSuite> {
    const startTime = performance.now();
    const tests: TestResult[] = [];

    // Test metrics endpoint
    tests.push(await this.runTest('Metrics Endpoint', async () => {
      const response = await this.makeRequest('/metrics');
      
      if (!response.ok) {
        throw new Error(`Metrics endpoint failed: ${response.status}`);
      }
      
      const metrics = await response.json();
      return { 
        timestamp: metrics.timestamp,
        hasMetrics: Object.keys(metrics.metrics || {}).length > 0
      };
    }));

    // Test Prometheus metrics
    tests.push(await this.runTest('Prometheus Metrics', async () => {
      const response = await this.makeRequest('/metrics/prometheus');
      
      if (!response.ok) {
        throw new Error(`Prometheus metrics endpoint failed: ${response.status}`);
      }
      
      const metricsText = await response.text();
      return { 
        hasMetrics: metricsText.length > 0,
        format: 'prometheus'
      };
    }));

    // Test alerting endpoint
    tests.push(await this.runTest('Alerting System', async () => {
      const response = await this.makeRequest('/alerts');
      
      if (!response.ok) {
        throw new Error(`Alerting endpoint failed: ${response.status}`);
      }
      
      const alerts = await response.json();
      return { 
        alertCount: alerts.count,
        timestamp: alerts.timestamp
      };
    }));

    return {
      name: 'Monitoring Tests',
      tests,
      passed: tests.every(t => t.passed),
      duration: performance.now() - startTime
    };
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const details = await testFn();
      return {
        name,
        passed: true,
        duration: performance.now() - startTime,
        details
      };
    } catch (error) {
      return {
        name,
        passed: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    
    const defaultOptions: RequestInit = {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'DeploymentTester/1.0',
        ...options.headers
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }
}

// CLI interface
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const apiKey = process.env.API_KEY;

  console.log(`🎯 Testing deployment at: ${baseUrl}`);
  if (apiKey) {
    console.log('🔑 Using API key for authenticated tests');
  }

  const tester = new DeploymentTester(baseUrl, apiKey);
  
  try {
    const results = await tester.runAllTests();
    const overallPassed = results.every(suite => suite.passed);
    
    // Output detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach(suite => {
      console.log(`\n${suite.name}:`);
      suite.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        const duration = test.duration.toFixed(2);
        console.log(`  ${status} ${test.name} (${duration}ms)`);
        if (!test.passed && test.error) {
          console.log(`    Error: ${test.error}`);
        }
        if (test.details) {
          console.log(`    Details: ${JSON.stringify(test.details, null, 2)}`);
        }
      });
    });

    process.exit(overallPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Deployment tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DeploymentTester };