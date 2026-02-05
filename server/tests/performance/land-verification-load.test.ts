import { describe, it, expect, beforeAll, afterAll } from '..\..\..\src\shared\test-utils\index';
import { performance } from 'perf_hooks';
import request from '..\..\..\scripts\cleanup-redundancies';
import { app } from '../../app';
import { LandVerificationService } from '../../land-verification/LandVerificationService';
import { database } from '../../lib/database';

describe('Land Verification Performance Tests', () => {
  let authTokens: string[] = [];
  let testPropertyIds: string[] = [];
  let landVerificationService: LandVerificationService;

  beforeAll(async () => {
    landVerificationService = new LandVerificationService();

    // Create multiple test users and properties for load testing
    const userCount = 50;
    const propertyCount = 100;

    // Create test users
    for (let i = 0; i < userCount; i++) {
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: `load-test-user-${i}@example.com`,
          password: 'TestPassword123!',
          name: `Load Test User ${i}`
        });

      authTokens.push(userResponse.body.token);
    }

    // Create test properties
    for (let i = 0; i < propertyCount; i++) {
      const tokenIndex = i % userCount;
      const propertyResponse = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
        .send({
          title: `Load Test Property ${i}`,
          description: `Test property ${i} for load testing`,
          price: 1000000 + (i * 100000),
          location: {
            county: 'Nairobi',
            area: `Area ${i % 10}`,
            coordinates: {
              latitude: -1.2921 + (i * 0.001),
              longitude: 36.8219 + (i * 0.001)
            }
          },
          propertyType: 'land',
          size: 0.5 + (i * 0.1),
          sizeUnit: 'acres'
        });

      testPropertyIds.push(propertyResponse.body.property.id);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    for (const propertyId of testPropertyIds) {
      await database.query('DELETE FROM properties WHERE id = ?', [propertyId]);
    }
    
    for (let i = 0; i < authTokens.length; i++) {
      await database.query('DELETE FROM users WHERE email = ?', [`load-test-user-${i}@example.com`]);
    }
  });

  describe('Concurrent Verification Sessions', () => {
    it('should handle 50 concurrent verification initiations', async () => {
      const concurrentRequests = 50;
      const startTime = performance.now();
      
      const promises = [];
      for (let i = 0; i < concurrentRequests; i++) {
        const tokenIndex = i % authTokens.length;
        const propertyIndex = i % testPropertyIds.length;
        
        const promise = request(app)
          .post('/api/land-verification/initiate')
          .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
          .send({
            propertyId: testPropertyIds[propertyIndex]
          });
        
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.session).toBeDefined();
      });

      // Should complete within reasonable time (10 seconds for 50 concurrent requests)
      expect(totalTime).toBeLessThan(10000);
      
      // Average response time should be reasonable
      const averageResponseTime = totalTime / concurrentRequests;
      expect(averageResponseTime).toBeLessThan(500); // 500ms average

      console.log(`Concurrent verification initiation test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
    });

    it('should handle 100 concurrent layer executions', async () => {
      // First create verification sessions
      const sessionCount = 20;
      const sessions = [];

      for (let i = 0; i < sessionCount; i++) {
        const tokenIndex = i % authTokens.length;
        const propertyIndex = i % testPropertyIds.length;
        
        const session = await landVerificationService.initiateVerification(
          testPropertyIds[propertyIndex],
          `user-${tokenIndex}`
        );
        sessions.push({ session, tokenIndex });
      }

      // Now execute multiple layers concurrently
      const startTime = performance.now();
      const promises = [];

      for (const { session, tokenIndex } of sessions) {
        // Execute multiple layers per session
        const layerTypes = ['registry', 'physical', 'community', 'government', 'legal'];
        
        for (const layerType of layerTypes) {
          const promise = request(app)
            .post(`/api/land-verification/sessions/${session.id}/layers/${layerType}`)
            .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
            .send({
              mockData: true, // Use mock data for performance testing
              layerType
            });
          
          promises.push(promise);
        }
      }

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Most requests should succeed (some may fail due to business logic, but not due to performance)
      const successfulResponses = responses.filter(r => r.status === 200);
      const successRate = successfulResponses.length / responses.length;
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 100 layer executions

      console.log(`Concurrent layer execution test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);
    });
  });

  describe('Risk Assessment Performance', () => {
    it('should generate risk assessments efficiently under load', async () => {
      // Create sessions with completed layers
      const sessionCount = 30;
      const sessions = [];

      for (let i = 0; i < sessionCount; i++) {
        const tokenIndex = i % authTokens.length;
        const propertyIndex = i % testPropertyIds.length;
        
        const session = await landVerificationService.initiateVerification(
          testPropertyIds[propertyIndex],
          `user-${tokenIndex}`
        );

        // Complete some layers
        await landVerificationService.executeVerificationLayer(session.id, {
          type: 'registry',
          status: 'completed',
          results: [{
            type: 'registry_check',
            status: 'passed',
            data: { ownershipVerified: true },
            confidence: 0.9
          }]
        });

        await landVerificationService.executeVerificationLayer(session.id, {
          type: 'physical',
          status: 'completed',
          results: [{
            type: 'boundary_check',
            status: 'passed',
            data: { boundariesMatch: true },
            confidence: 0.8
          }]
        });

        sessions.push({ session, tokenIndex });
      }

      // Generate risk assessments concurrently
      const startTime = performance.now();
      const promises = sessions.map(({ session, tokenIndex }) =>
        request(app)
          .post(`/api/land-verification/sessions/${session.id}/risk-assessment`)
          .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
      );

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All risk assessments should be generated successfully
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.riskAssessment).toBeDefined();
        expect(response.body.riskAssessment.overallRiskScore).toBeGreaterThanOrEqual(0);
        expect(response.body.riskAssessment.overallRiskScore).toBeLessThanOrEqual(100);
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(8000); // 8 seconds for 30 risk assessments

      const averageTime = totalTime / sessionCount;
      expect(averageTime).toBeLessThan(300); // 300ms average per risk assessment

      console.log(`Risk assessment generation test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Average time per assessment: ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('Database Performance', () => {
    it('should handle large numbers of verification sessions efficiently', async () => {
      const sessionCount = 100;
      const startTime = performance.now();

      // Create many sessions rapidly
      const promises = [];
      for (let i = 0; i < sessionCount; i++) {
        const tokenIndex = i % authTokens.length;
        const propertyIndex = i % testPropertyIds.length;
        
        const promise = landVerificationService.initiateVerification(
          testPropertyIds[propertyIndex],
          `user-${tokenIndex}`
        );
        
        promises.push(promise);
      }

      const sessions = await Promise.all(promises);
      const creationTime = performance.now() - startTime;

      // All sessions should be created
      expect(sessions).toHaveLength(sessionCount);
      sessions.forEach(session => {
        expect(session.id).toBeDefined();
        expect(session.status).toBe('initiated');
      });

      // Query all sessions efficiently
      const queryStartTime = performance.now();
      const sessionIds = sessions.map(s => s.id);
      
      const queryPromises = sessionIds.map(id =>
        landVerificationService.getVerificationStatus(id)
      );
      
      const sessionStatuses = await Promise.all(queryPromises);
      const queryTime = performance.now() - queryStartTime;

      // All queries should succeed
      expect(sessionStatuses).toHaveLength(sessionCount);
      sessionStatuses.forEach(status => {
        expect(status.id).toBeDefined();
        expect(status.status).toBe('initiated');
      });

      const totalTime = performance.now() - startTime;

      // Performance expectations
      expect(creationTime).toBeLessThan(5000); // 5 seconds to create 100 sessions
      expect(queryTime).toBeLessThan(3000); // 3 seconds to query 100 sessions
      expect(totalTime).toBeLessThan(8000); // 8 seconds total

      console.log(`Database performance test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Session creation: ${creationTime.toFixed(2)}ms`);
      console.log(`Session querying: ${queryTime.toFixed(2)}ms`);
    });

    it('should maintain performance with large datasets', async () => {
      // Create a session with many verification results
      const session = await landVerificationService.initiateVerification(
        testPropertyIds[0],
        'user-0'
      );

      const startTime = performance.now();

      // Add many layer results
      const layerCount = 50;
      const promises = [];

      for (let i = 0; i < layerCount; i++) {
        const layerType = ['registry', 'physical', 'community', 'government', 'legal'][i % 5];
        
        const promise = landVerificationService.executeVerificationLayer(session.id, {
          type: layerType as any,
          status: 'completed',
          results: Array.from({ length: 10 }, (_, j) => ({
            type: `${layerType}_check_${j}`,
            status: Math.random() > 0.2 ? 'passed' : 'failed',
            data: {
              checkId: `${layerType}_${i}_${j}`,
              timestamp: new Date().toISOString(),
              details: `Detailed result for ${layerType} check ${j}`
            },
            confidence: Math.random() * 0.5 + 0.5
          }))
        });

        promises.push(promise);
      }

      await Promise.all(promises);
      const layerExecutionTime = performance.now() - startTime;

      // Generate risk assessment with large dataset
      const riskStartTime = performance.now();
      const riskAssessment = await landVerificationService.generateRiskAssessment(session.id);
      const riskGenerationTime = performance.now() - riskStartTime;

      // Verify risk assessment is complete
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.riskFactors.length).toBeGreaterThan(0);
      expect(riskAssessment.recommendations.length).toBeGreaterThan(0);

      const totalTime = performance.now() - startTime;

      // Performance expectations with large dataset
      expect(layerExecutionTime).toBeLessThan(10000); // 10 seconds for 50 layers with 10 results each
      expect(riskGenerationTime).toBeLessThan(2000); // 2 seconds for risk assessment
      expect(totalTime).toBeLessThan(12000); // 12 seconds total

      console.log(`Large dataset performance test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`Layer execution: ${layerExecutionTime.toFixed(2)}ms`);
      console.log(`Risk generation: ${riskGenerationTime.toFixed(2)}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during intensive operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform intensive operations
      const operationCount = 200;
      const promises = [];

      for (let i = 0; i < operationCount; i++) {
        const tokenIndex = i % authTokens.length;
        const propertyIndex = i % testPropertyIds.length;
        
        const promise = (async () => {
          const session = await landVerificationService.initiateVerification(
            testPropertyIds[propertyIndex],
            `user-${tokenIndex}`
          );

          await landVerificationService.executeVerificationLayer(session.id, {
            type: 'registry',
            status: 'completed',
            results: [{
              type: 'registry_check',
              status: 'passed',
              data: { test: 'data' },
              confidence: 0.9
            }]
          });

          await landVerificationService.generateRiskAssessment(session.id);
        })();

        promises.push(promise);
      }

      await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerOperation = memoryIncrease / operationCount;

      // Memory increase should be reasonable (less than 1MB per operation)
      expect(memoryIncreasePerOperation).toBeLessThan(1024 * 1024);

      console.log(`Memory usage test completed`);
      console.log(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Per operation: ${(memoryIncreasePerOperation / 1024).toFixed(2)}KB`);
    });
  });

  describe('API Response Times', () => {
    it('should maintain fast response times under load', async () => {
      const requestCount = 100;
      const responseTimes: number[] = [];

      // Test various API endpoints
      const endpoints = [
        { method: 'GET', path: '/api/land-verification/sessions', requiresSession: false },
        { method: 'POST', path: '/api/land-verification/initiate', requiresSession: false },
        { method: 'GET', path: '/api/land-verification/sessions/:sessionId/status', requiresSession: true }
      ];

      for (const endpoint of endpoints) {
        const endpointResponseTimes: number[] = [];

        for (let i = 0; i < requestCount / endpoints.length; i++) {
          const tokenIndex = i % authTokens.length;
          const propertyIndex = i % testPropertyIds.length;
          
          let url = endpoint.path;
          let requestData = {};

          if (endpoint.requiresSession) {
            // Create a session first
            const session = await landVerificationService.initiateVerification(
              testPropertyIds[propertyIndex],
              `user-${tokenIndex}`
            );
            url = url.replace(':sessionId', session.id);
          } else if (endpoint.method === 'POST' && endpoint.path.includes('initiate')) {
            requestData = { propertyId: testPropertyIds[propertyIndex] };
          }

          const startTime = performance.now();
          
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app)
              .get(url)
              .set('Authorization', `Bearer ${authTokens[tokenIndex]}`);
          } else {
            response = await request(app)
              .post(url)
              .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
              .send(requestData);
          }

          const responseTime = performance.now() - startTime;
          endpointResponseTimes.push(responseTime);

          // Response should be successful or have expected error
          expect([200, 201, 400, 404]).toContain(response.status);
        }

        responseTimes.push(...endpointResponseTimes);

        // Calculate statistics for this endpoint
        const avgResponseTime = endpointResponseTimes.reduce((a, b) => a + b, 0) / endpointResponseTimes.length;
        const maxResponseTime = Math.max(...endpointResponseTimes);
        const minResponseTime = Math.min(...endpointResponseTimes);

        console.log(`${endpoint.method} ${endpoint.path}:`);
        console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`  Min: ${minResponseTime.toFixed(2)}ms`);
        console.log(`  Max: ${maxResponseTime.toFixed(2)}ms`);

        // Performance expectations
        expect(avgResponseTime).toBeLessThan(500); // 500ms average
        expect(maxResponseTime).toBeLessThan(2000); // 2 second max
      }

      // Overall statistics
      const overallAvg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const overallMax = Math.max(...responseTimes);
      
      expect(overallAvg).toBeLessThan(400); // 400ms overall average
      expect(overallMax).toBeLessThan(3000); // 3 second overall max

      console.log(`Overall API performance:`);
      console.log(`  Average response time: ${overallAvg.toFixed(2)}ms`);
      console.log(`  Maximum response time: ${overallMax.toFixed(2)}ms`);
    });
  });
});