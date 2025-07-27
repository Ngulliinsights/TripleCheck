import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { testUtils } from '../../tests/setup';
import { performance } from 'perf_hooks';

describe('Land Verification Load Tests', () => {
  const CONCURRENT_SESSIONS = 50;
  const STRESS_TEST_SESSIONS = 100;
  const PERFORMANCE_THRESHOLD_MS = 5000;

  beforeAll(async () => {
    // Set up test environment for load testing
    process.env.NODE_ENV = 'test';
    
    // Mock external services to avoid hitting real APIs during load tests
    vi.mock('../GovernmentIntegrationService', () => ({
      GovernmentIntegrationService: vi.fn().mockImplementation(() => ({
        searchLandRegistry: vi.fn().mockResolvedValue({
          titleNumber: 'TEST123',
          currentOwner: { name: 'Test Owner', idNumber: '123456' },
          ownershipHistory: [],
          legalInstruments: [],
          surveyDetails: { coordinates: { lat: -1.2921, lng: 36.8219 }, area: 1000 },
          restrictions: [],
          lastUpdated: new Date(),
          verificationStatus: 'verified'
        }),
        checkCourtRecords: vi.fn().mockResolvedValue([]),
        verifyGovernmentDesignations: vi.fn().mockResolvedValue([]),
        checkInfrastructurePlans: vi.fn().mockResolvedValue([])
      }))
    }));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Concurrent Verification Sessions', () => {
    it('should handle multiple concurrent verification initiations', async () => {
      const startTime = performance.now();
      
      const promises = Array.from({ length: CONCURRENT_SESSIONS }, (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 1 };
        const testProperty = { ...testUtils.createTestProperty(), id: index + 1 };
        
        return request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          });
      });

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Analyze results
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      console.log(`Load Test Results:
        - Total sessions: ${CONCURRENT_SESSIONS}
        - Successful: ${successful.length}
        - Failed: ${failed.length}
        - Total time: ${totalTime.toFixed(2)}ms
        - Average time per session: ${(totalTime / CONCURRENT_SESSIONS).toFixed(2)}ms
      `);

      // Assertions
      expect(successful.length).toBeGreaterThan(CONCURRENT_SESSIONS * 0.95); // 95% success rate
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      
      // Check that successful responses have correct structure
      successful.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(201);
          expect(result.value.body).toHaveProperty('sessionId');
        }
      });
    });

    it('should handle concurrent layer executions for multiple sessions', async () => {
      // First, create multiple verification sessions
      const sessionPromises = Array.from({ length: 20 }, (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 1 };
        const testProperty = { ...testUtils.createTestProperty(), id: index + 1 };
        
        return request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'comprehensive'
          });
      });

      const sessionResults = await Promise.all(sessionPromises);
      const sessionIds = sessionResults.map(result => result.body.sessionId);

      // Now execute registry layer for all sessions concurrently
      const startTime = performance.now();
      
      const layerPromises = sessionIds.map(sessionId =>
        request(app)
          .post(`/api/land-verification/sessions/${sessionId}/layers/registry`)
          .send({
            titleNumber: `TEST${sessionId}`,
            location: 'Nairobi, Kenya'
          })
      );

      const layerResults = await Promise.allSettled(layerPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successful = layerResults.filter(result => result.status === 'fulfilled');
      const failed = layerResults.filter(result => result.status === 'rejected');

      console.log(`Concurrent Layer Execution Results:
        - Total layer executions: ${sessionIds.length}
        - Successful: ${successful.length}
        - Failed: ${failed.length}
        - Total time: ${totalTime.toFixed(2)}ms
      `);

      expect(successful.length).toBeGreaterThan(sessionIds.length * 0.9); // 90% success rate
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should maintain data consistency under concurrent access', async () => {
      const testProperty = { ...testUtils.createTestProperty(), id: 999 };
      
      // Create multiple sessions for the same property concurrently
      const promises = Array.from({ length: 10 }, (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 1000 };
        
        return request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          });
      });

      const results = await Promise.all(promises);
      const sessionIds = results.map(result => result.body.sessionId);

      // Verify all sessions were created with unique IDs
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(sessionIds.length);

      // Verify each session has correct property association
      for (const sessionId of sessionIds) {
        const statusResponse = await request(app)
          .get(`/api/land-verification/sessions/${sessionId}/status`);
        
        expect(statusResponse.body.propertyId).toBe(testProperty.id);
      }
    });
  });

  describe('Stress Testing', () => {
    it('should handle stress load of verification sessions', async () => {
      const startTime = performance.now();
      
      const promises = Array.from({ length: STRESS_TEST_SESSIONS }, (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 2000 };
        const testProperty = { ...testUtils.createTestProperty(), id: index + 2000 };
        
        return request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          })
          .timeout(10000); // 10 second timeout
      });

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');
      const timeouts = failed.filter(result => 
        result.reason?.message?.includes('timeout')
      );

      console.log(`Stress Test Results:
        - Total sessions: ${STRESS_TEST_SESSIONS}
        - Successful: ${successful.length}
        - Failed: ${failed.length}
        - Timeouts: ${timeouts.length}
        - Total time: ${totalTime.toFixed(2)}ms
        - Success rate: ${(successful.length / STRESS_TEST_SESSIONS * 100).toFixed(2)}%
      `);

      // Under stress, we expect at least 80% success rate
      expect(successful.length).toBeGreaterThan(STRESS_TEST_SESSIONS * 0.8);
      
      // System should not completely fail
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle memory usage efficiently during high load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create and complete many verification sessions
      const batchSize = 25;
      const batches = 4;
      
      for (let batch = 0; batch < batches; batch++) {
        const promises = Array.from({ length: batchSize }, (_, index) => {
          const sessionIndex = batch * batchSize + index;
          const testUser = { ...testUtils.createTestUser(), id: sessionIndex + 3000 };
          const testProperty = { ...testUtils.createTestProperty(), id: sessionIndex + 3000 };
          
          return request(app)
            .post('/api/land-verification/initiate')
            .send({
              propertyId: testProperty.id,
              userId: testUser.id,
              verificationType: 'basic'
            });
        });

        await Promise.all(promises);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory Usage:
        - Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Increase: ${memoryIncreaseMB.toFixed(2)}MB
      `);

      // Memory increase should be reasonable (less than 100MB for 100 sessions)
      expect(memoryIncreaseMB).toBeLessThan(100);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time requirements under normal load', async () => {
      const normalLoad = 20;
      const responseTimes: number[] = [];
      
      const promises = Array.from({ length: normalLoad }, async (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 4000 };
        const testProperty = { ...testUtils.createTestProperty(), id: index + 4000 };
        
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);
        
        return response;
      });

      await Promise.all(promises);

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      // Calculate percentiles
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      console.log(`Performance Metrics:
        - Average response time: ${averageResponseTime.toFixed(2)}ms
        - Min response time: ${minResponseTime.toFixed(2)}ms
        - Max response time: ${maxResponseTime.toFixed(2)}ms
        - 95th percentile: ${p95.toFixed(2)}ms
        - 99th percentile: ${p99.toFixed(2)}ms
      `);

      // Performance requirements
      expect(averageResponseTime).toBeLessThan(1000); // Average < 1 second
      expect(p95).toBeLessThan(2000); // 95% of requests < 2 seconds
      expect(p99).toBeLessThan(3000); // 99% of requests < 3 seconds
    });

    it('should handle database connection pooling efficiently', async () => {
      // Test with more concurrent requests than typical connection pool size
      const highConcurrency = 100;
      
      const promises = Array.from({ length: highConcurrency }, (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 5000 };
        const testProperty = { ...testUtils.createTestProperty(), id: index + 5000 };
        
        return request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'basic'
          });
      });

      const startTime = performance.now();
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successful = results.filter(result => result.status === 'fulfilled');
      const connectionErrors = results.filter(result => 
        result.status === 'rejected' && 
        result.reason?.message?.includes('connection')
      );

      console.log(`Database Connection Pool Test:
        - Concurrent requests: ${highConcurrency}
        - Successful: ${successful.length}
        - Connection errors: ${connectionErrors.length}
        - Total time: ${totalTime.toFixed(2)}ms
      `);

      // Should handle high concurrency without connection pool exhaustion
      expect(connectionErrors.length).toBe(0);
      expect(successful.length).toBeGreaterThan(highConcurrency * 0.95);
    });
  });

  describe('Resource Utilization', () => {
    it('should efficiently handle CPU-intensive risk assessments', async () => {
      // Create sessions and execute risk assessments concurrently
      const sessions = 30;
      
      // First create sessions
      const sessionPromises = Array.from({ length: sessions }, (_, index) => {
        const testUser = { ...testUtils.createTestUser(), id: index + 6000 };
        const testProperty = { ...testUtils.createTestProperty(), id: index + 6000 };
        
        return request(app)
          .post('/api/land-verification/initiate')
          .send({
            propertyId: testProperty.id,
            userId: testUser.id,
            verificationType: 'comprehensive'
          });
      });

      const sessionResults = await Promise.all(sessionPromises);
      const sessionIds = sessionResults.map(result => result.body.sessionId);

      // Execute risk assessments concurrently
      const startTime = performance.now();
      const startCpuUsage = process.cpuUsage();
      
      const riskPromises = sessionIds.map(sessionId =>
        request(app)
          .post(`/api/land-verification/sessions/${sessionId}/risk-assessment`)
      );

      const riskResults = await Promise.allSettled(riskPromises);
      
      const endTime = performance.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const totalTime = endTime - startTime;

      const successful = riskResults.filter(result => result.status === 'fulfilled');

      console.log(`CPU-Intensive Operations Test:
        - Risk assessments: ${sessions}
        - Successful: ${successful.length}
        - Total time: ${totalTime.toFixed(2)}ms
        - CPU user time: ${(endCpuUsage.user / 1000).toFixed(2)}ms
        - CPU system time: ${(endCpuUsage.system / 1000).toFixed(2)}ms
      `);

      expect(successful.length).toBeGreaterThan(sessions * 0.9);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});