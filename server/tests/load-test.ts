#!/usr/bin/env node

import request from '..\app';

import app from '../app';
import { storage } from '../infrastructure/storage/storage';

interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  testDurationMs: number;
  endpoints: EndpointConfig[];
}

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
  requiresAuth?: boolean;
  weight: number; // Probability weight for this endpoint
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

interface LoadTestReport {
  timestamp: string;
  config: LoadTestConfig;
  results: LoadTestResult[];
  overallMetrics: {
    totalRequests: number;
    totalSuccessful: number;
    totalFailed: number;
    overallAverageResponseTime: number;
    overallRequestsPerSecond: number;
    overallErrorRate: number;
  };
  performanceStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
}

class LoadTester {
  private testUsers: any[] = [];
  private authCookies: string[] = [];

  async setupTestUsers(count: number): Promise<void> {
    console.log(`🔧 Setting up ${count} test users...`);
    
    for (let i = 0; i < count; i++) {
      const userData = {
        username: `loadtest_user_${i}_${Date.now()}`,
        email: `loadtest${i}@example.com`,
        password: 'loadtest123',
        firstName: 'Load',
        lastName: `Test${i}`
      };

      try {
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        if (response.status === 201) {
          this.testUsers.push(response.body.data);

          // Login to get auth cookie
          const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              username: userData.username,
              password: userData.password
            });

          if (loginResponse.status === 200) {
            this.authCookies.push(loginResponse.headers['set-cookie']);
          }
        }
      } catch (error) {
        console.error(`Failed to create test user ${i}:`, error);
      }
    }

    console.log(`✅ Created ${this.testUsers.length} test users`);
  }

  async cleanupTestUsers(): Promise<void> {
    console.log('🧹 Cleaning up test users...');
    
    for (const user of this.testUsers) {
      try {
        await storage.deleteUser(user.id);
      } catch (error) {
        console.log(`Failed to cleanup user ${user.id}:`, error);
      }
    }

    this.testUsers = [];
    this.authCookies = [];
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestReport> {
    console.log('🚀 Starting load test...');
    console.log(`👥 Concurrent Users: ${config.concurrentUsers}`);
    console.log(`📊 Requests per User: ${config.requestsPerUser}`);
    console.log(`⏱️  Test Duration: ${config.testDurationMs}ms`);

    await this.setupTestUsers(Math.min(config.concurrentUsers, 10)); // Limit to 10 users for safety

    const startTime = Date.now();
    const results: Map<string, number[]> = new Map();
    const errors: Map<string, number> = new Map();

    // Initialize results tracking
    for (const endpoint of config.endpoints) {
      results.set(endpoint.name, []);
      errors.set(endpoint.name, 0);
    }

    // Create concurrent user simulations
    const userPromises: Promise<void>[] = [];

    for (let userId = 0; userId < Math.min(config.concurrentUsers, this.testUsers.length); userId++) {
      const userPromise = this.simulateUser(userId, config, results, errors, startTime);
      userPromises.push(userPromise);
    }

    // Wait for all users to complete or timeout
    await Promise.allSettled(userPromises);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    // Generate report
    const report = this.generateLoadTestReport(config, results, errors, actualDuration);
    
    await this.cleanupTestUsers();
    
    return report;
  }

  private async simulateUser(
    userId: number,
    config: LoadTestConfig,
    results: Map<string, number[]>,
    errors: Map<string, number>,
    startTime: number
  ): Promise<void> {
    const authCookie = this.authCookies[userId] || '';
    let requestCount = 0;

    while (requestCount < config.requestsPerUser && 
           (Date.now() - startTime) < config.testDurationMs) {
      
      // Select random endpoint based on weights
      const endpoint = this.selectRandomEndpoint(config.endpoints);
      
      try {
        const requestStart = Date.now();
        
        let response;
        switch (endpoint.method) {
          case 'GET':
            response = endpoint.requiresAuth ? 
              await request(app).get(endpoint.path).set('Cookie', authCookie) :
              await request(app).get(endpoint.path);
            break;
          case 'POST':
            response = endpoint.requiresAuth ?
              await request(app).post(endpoint.path).set('Cookie', authCookie).send(endpoint.body || {}) :
              await request(app).post(endpoint.path).send(endpoint.body || {});
            break;
          case 'PUT':
            response = endpoint.requiresAuth ?
              await request(app).put(endpoint.path).set('Cookie', authCookie).send(endpoint.body || {}) :
              await request(app).put(endpoint.path).send(endpoint.body || {});
            break;
          case 'DELETE':
            response = endpoint.requiresAuth ?
              await request(app).delete(endpoint.path).set('Cookie', authCookie) :
              await request(app).delete(endpoint.path);
            break;
        }

        const responseTime = Date.now() - requestStart;
        
        if (response && response.status < 400) {
          results.get(endpoint.name)?.push(responseTime);
        } else {
          errors.set(endpoint.name, (errors.get(endpoint.name) || 0) + 1);
        }

      } catch (error) {
        errors.set(endpoint.name, (errors.get(endpoint.name) || 0) + 1);
      }

      requestCount++;
      
      // Small delay between requests to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
  }

  private selectRandomEndpoint(endpoints: EndpointConfig[]): EndpointConfig {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0]; // Fallback
  }

  private generateLoadTestReport(
    config: LoadTestConfig,
    results: Map<string, number[]>,
    errors: Map<string, number>,
    actualDuration: number
  ): LoadTestReport {
    const endpointResults: LoadTestResult[] = [];
    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalResponseTime = 0;

    for (const endpoint of config.endpoints) {
      const responseTimes = results.get(endpoint.name) || [];
      const errorCount = errors.get(endpoint.name) || 0;
      const successCount = responseTimes.length;
      const requestCount = successCount + errorCount;

      if (requestCount > 0) {
        const avgResponseTime = responseTimes.length > 0 ? 
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
        
        const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
        const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
        const requestsPerSecond = (requestCount / actualDuration) * 1000;
        const errorRate = (errorCount / requestCount) * 100;

        endpointResults.push({
          endpoint: endpoint.name,
          totalRequests: requestCount,
          successfulRequests: successCount,
          failedRequests: errorCount,
          averageResponseTime: avgResponseTime,
          minResponseTime,
          maxResponseTime,
          requestsPerSecond,
          errorRate
        });

        totalRequests += requestCount;
        totalSuccessful += successCount;
        totalFailed += errorCount;
        totalResponseTime += avgResponseTime * successCount;
      }
    }

    const overallAverageResponseTime = totalSuccessful > 0 ? totalResponseTime / totalSuccessful : 0;
    const overallRequestsPerSecond = (totalRequests / actualDuration) * 1000;
    const overallErrorRate = totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;

    // Determine performance status
    let performanceStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL' = 'EXCELLENT';
    
    if (overallErrorRate > 10 || overallAverageResponseTime > 5000) {
      performanceStatus = 'CRITICAL';
    } else if (overallErrorRate > 5 || overallAverageResponseTime > 3000) {
      performanceStatus = 'POOR';
    } else if (overallErrorRate > 2 || overallAverageResponseTime > 2000) {
      performanceStatus = 'ACCEPTABLE';
    } else if (overallErrorRate > 1 || overallAverageResponseTime > 1000) {
      performanceStatus = 'GOOD';
    }

    return {
      timestamp: new Date().toISOString(),
      config,
      results: endpointResults,
      overallMetrics: {
        totalRequests,
        totalSuccessful,
        totalFailed,
        overallAverageResponseTime,
        overallRequestsPerSecond,
        overallErrorRate
      },
      performanceStatus
    };
  }

  printReport(report: LoadTestReport): void {
    console.log(`\n${  '='.repeat(80)}`);
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(80));
    
    const { overallMetrics, performanceStatus } = report;
    
    console.log(`\n🎯 Overall Performance: ${performanceStatus}`);
    console.log(`📈 Total Requests: ${overallMetrics.totalRequests}`);
    console.log(`✅ Successful: ${overallMetrics.totalSuccessful}`);
    console.log(`❌ Failed: ${overallMetrics.totalFailed}`);
    console.log(`⚡ Avg Response Time: ${Math.round(overallMetrics.overallAverageResponseTime)}ms`);
    console.log(`🔄 Requests/Second: ${overallMetrics.overallRequestsPerSecond.toFixed(2)}`);
    console.log(`📉 Error Rate: ${overallMetrics.overallErrorRate.toFixed(2)}%`);
    
    console.log('\n📋 Endpoint Details:');
    for (const result of report.results) {
      console.log(`\n  ${result.endpoint}:`);
      console.log(`    Requests: ${result.totalRequests} (${result.successfulRequests} success, ${result.failedRequests} failed)`);
      console.log(`    Avg Response: ${Math.round(result.averageResponseTime)}ms`);
      console.log(`    Min/Max: ${result.minResponseTime}ms / ${result.maxResponseTime}ms`);
      console.log(`    RPS: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`    Error Rate: ${result.errorRate.toFixed(2)}%`);
    }
    
    console.log(`\n${  '='.repeat(80)}`);
  }
}

// Default load test configuration
const defaultConfig: LoadTestConfig = {
  concurrentUsers: 5,
  requestsPerUser: 10,
  testDurationMs: 30000, // 30 seconds
  endpoints: [
    {
      name: 'GET /api/health',
      method: 'GET',
      path: '/api/health',
      requiresAuth: false,
      weight: 10
    },
    {
      name: 'GET /api/properties',
      method: 'GET',
      path: '/api/properties',
      requiresAuth: false,
      weight: 30
    },
    {
      name: 'GET /api/properties with search',
      method: 'GET',
      path: '/api/properties?q=test',
      requiresAuth: false,
      weight: 20
    },
    {
      name: 'GET /api/auth/me',
      method: 'GET',
      path: '/api/auth/me',
      requiresAuth: true,
      weight: 15
    },
    {
      name: 'GET /api/search/locations',
      method: 'GET',
      path: '/api/search/locations?q=test',
      requiresAuth: false,
      weight: 15
    },
    {
      name: 'POST /api/search/properties',
      method: 'POST',
      path: '/api/search/properties',
      body: {
        filters: {
          location: 'test',
          priceMin: 50000,
          priceMax: 200000
        }
      },
      requiresAuth: false,
      weight: 10
    }
  ]
};

// Run load test if this script is executed directly
if (require.main === module) {
  const loadTester = new LoadTester();
  
  loadTester.runLoadTest(defaultConfig)
    .then((report) => {
      loadTester.printReport(report);
      
      // Save report to file
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(__dirname, '..', '..', 'load-test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Load test report saved to: ${reportPath}`);
      
      // Exit with appropriate code
      process.exit(report.performanceStatus === 'CRITICAL' ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}

export { LoadTester, LoadTestConfig };