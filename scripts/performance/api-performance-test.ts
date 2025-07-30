#!/usr/bin/env tsx
/**
 * API Performance Testing Script
 * 
 * Tests the performance improvements made to the similar properties endpoint
 * and other API optimizations.
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3003/api';

interface TestResult {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  success: boolean;
  cached?: boolean;
  error?: string;
}

class PerformanceTester {
  private results: TestResult[] = [];

  async testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const result: TestResult = {
        endpoint,
        method,
        responseTime,
        status: response.status,
        success: response.ok,
        cached: data.cached,
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        endpoint,
        method,
        responseTime,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  async runSimilarPropertiesTest(): Promise<void> {
    console.log('\n🔍 Testing Similar Properties Endpoint Performance...');

    // Test different parameter combinations
    const testCases = [
      { city: 'Nairobi', minPrice: '50000', maxPrice: '100000', limit: '10' },
      { city: 'Mombasa', minPrice: '100000', maxPrice: '200000', limit: '5' },
      { city: 'Nakuru', minPrice: '30000', maxPrice: '80000', limit: '8' },
      { propertyType: 'apartment', city: 'Nairobi', limit: '10' },
    ];

    for (const params of testCases) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/properties/similar?${queryString}`;
      
      console.log(`Testing: ${endpoint}`);
      
      // Test first request (should hit database)
      const firstRequest = await this.testEndpoint(endpoint);
      console.log(`  First request: ${firstRequest.responseTime}ms (cached: ${firstRequest.cached})`);
      
      // Test second request (should be cached)
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      const secondRequest = await this.testEndpoint(endpoint);
      console.log(`  Second request: ${secondRequest.responseTime}ms (cached: ${secondRequest.cached})`);
      
      // Calculate improvement
      if (firstRequest.success && secondRequest.success) {
        const improvement = ((firstRequest.responseTime - secondRequest.responseTime) / firstRequest.responseTime) * 100;
        console.log(`  Performance improvement: ${improvement.toFixed(1)}%`);
      }
    }
  }

  async runBatchTest(): Promise<void> {
    console.log('\n⚡ Testing Concurrent Requests...');

    const endpoint = '/properties/similar?city=Nairobi&minPrice=50000&maxPrice=100000&limit=10';
    const concurrentRequests = 10;

    console.log(`Making ${concurrentRequests} concurrent requests to: ${endpoint}`);

    const startTime = Date.now();
    const promises = Array(concurrentRequests).fill(null).map(() => 
      this.testEndpoint(endpoint)
    );

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const successfulRequests = results.filter(r => r.success).length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const cachedRequests = results.filter(r => r.cached).length;

    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Successful requests: ${successfulRequests}/${concurrentRequests}`);
    console.log(`  Average response time: ${averageResponseTime.toFixed(1)}ms`);
    console.log(`  Cached responses: ${cachedRequests}/${concurrentRequests}`);
    console.log(`  Requests per second: ${(concurrentRequests / (totalTime / 1000)).toFixed(1)}`);
  }

  async runPropertyListingTest(): Promise<void> {
    console.log('\n📋 Testing Property Listings Performance...');

    const testCases = [
      '/properties?page=1&limit=10',
      '/properties?page=1&limit=20',
      '/properties?location=Nairobi&page=1&limit=10',
      '/properties?priceMin=50000&priceMax=150000&page=1&limit=10',
    ];

    for (const endpoint of testCases) {
      console.log(`Testing: ${endpoint}`);
      
      const result = await this.testEndpoint(endpoint);
      console.log(`  Response time: ${result.responseTime}ms (status: ${result.status})`);
      
      if (result.responseTime > 1000) {
        console.log(`  ⚠️  Slow response detected!`);
      }
    }
  }

  async runPerformanceMonitoringTest(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.log('\n⏭️  Skipping performance monitoring test (not in development mode)');
      return;
    }

    console.log('\n📊 Testing Performance Monitoring Endpoint...');

    const endpoint = '/properties/debug/performance?timeWindow=5';
    const result = await this.testEndpoint(endpoint);

    if (result.success) {
      console.log(`  Performance monitoring endpoint: ${result.responseTime}ms`);
      console.log(`  Status: ${result.status}`);
    } else {
      console.log(`  ❌ Performance monitoring endpoint failed: ${result.error}`);
    }
  }

  generateReport(): void {
    console.log('\n📈 Performance Test Report');
    console.log('=' .repeat(50));

    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests;
    const slowRequests = this.results.filter(r => r.responseTime > 1000).length;
    const cachedRequests = this.results.filter(r => r.cached).length;

    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful: ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failedRequests} (${((failedRequests / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Average Response Time: ${averageResponseTime.toFixed(1)}ms`);
    console.log(`Slow Requests (>1s): ${slowRequests} (${((slowRequests / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Cached Responses: ${cachedRequests} (${((cachedRequests / totalRequests) * 100).toFixed(1)}%)`);

    // Response time distribution
    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    console.log('\nResponse Time Percentiles:');
    console.log(`  P50: ${p50}ms`);
    console.log(`  P95: ${p95}ms`);
    console.log(`  P99: ${p99}ms`);

    // Slowest endpoints
    const slowestEndpoints = this.results
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 5);

    console.log('\nSlowest Endpoints:');
    slowestEndpoints.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.endpoint} - ${result.responseTime}ms`);
    });

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    if (averageResponseTime > 500) {
      console.log('  - Consider adding more caching layers');
    }
    if (slowRequests > totalRequests * 0.1) {
      console.log('  - Optimize slow queries (>1s response time)');
    }
    if (cachedRequests < totalRequests * 0.3) {
      console.log('  - Increase cache hit ratio for better performance');
    }
    if (failedRequests > 0) {
      console.log('  - Investigate and fix failing endpoints');
    }
  }
}

async function main() {
  console.log('🚀 Starting API Performance Tests...');
  console.log(`Testing API at: ${API_BASE}`);

  const tester = new PerformanceTester();

  try {
    await tester.runSimilarPropertiesTest();
    await tester.runBatchTest();
    await tester.runPropertyListingTest();
    await tester.runPerformanceMonitoringTest();
    
    tester.generateReport();
    
    console.log('\n✅ Performance tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Performance tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}

export { PerformanceTester };