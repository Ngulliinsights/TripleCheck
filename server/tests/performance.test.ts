import request from 'supertest';
import app from '../app';
import { storage } from '../infrastructure/storage/storage';

describe('Performance Tests', () => {
  let testUser: any;
  let authCookie: string;
  const performanceThresholds = {
    auth: 500, // ms
    properties: 1000, // ms
    search: 1500, // ms
    verification: 2000, // ms
  };

  beforeAll(async () => {
    // Create test user for performance tests
    const userData = {
      username: 'perftest_user',
      email: 'perftest@example.com',
      password: 'testpassword123',
      firstName: 'Perf',
      lastName: 'Test'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUser = response.body.data;
    
    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      });

    authCookie = loginResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser) {
      try {
        await storage.deleteUser(testUser.id);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Authentication Performance', () => {
    test('Login should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'perftest_user',
          password: 'testpassword123'
        });

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.auth);
      console.log(`Login performance: ${duration}ms (threshold: ${performanceThresholds.auth}ms)`);
    });

    test('User registration should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const userData = {
        username: 'perftest_user2',
        email: 'perftest2@example.com',
        password: 'testpassword123',
        firstName: 'Perf2',
        lastName: 'Test2'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(performanceThresholds.auth);
      console.log(`Registration performance: ${duration}ms (threshold: ${performanceThresholds.auth}ms)`);

      // Cleanup
      await storage.deleteUser(response.body.data.id);
    });

    test('Get current user should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.auth);
      console.log(`Get user performance: ${duration}ms (threshold: ${performanceThresholds.auth}ms)`);
    });
  });

  describe('Property Operations Performance', () => {
    let testProperty: any;

    test('Property creation should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const propertyData = {
        title: 'Performance Test Property',
        description: 'A property for performance testing',
        location: 'Performance Test Location',
        price: 150000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'house',
        features: {
          parking: true,
          garden: false,
          balcony: true
        }
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .send(propertyData);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(performanceThresholds.properties);
      console.log(`Property creation performance: ${duration}ms (threshold: ${performanceThresholds.properties}ms)`);

      testProperty = response.body.data;
    });

    test('Property retrieval should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties');

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.properties);
      console.log(`Property retrieval performance: ${duration}ms (threshold: ${performanceThresholds.properties}ms)`);
    });

    test('Single property retrieval should complete within performance threshold', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}`);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.properties);
      console.log(`Single property retrieval performance: ${duration}ms (threshold: ${performanceThresholds.properties}ms)`);
    });

    test('Property update should complete within performance threshold', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const startTime = Date.now();
      
      const updateData = {
        title: 'Updated Performance Test Property',
        price: 160000
      };

      const response = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .set('Cookie', authCookie)
        .send(updateData);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.properties);
      console.log(`Property update performance: ${duration}ms (threshold: ${performanceThresholds.properties}ms)`);
    });

    afterAll(async () => {
      // Cleanup test property
      if (testProperty) {
        try {
          await storage.deleteProperty(testProperty.id);
        } catch (error) {
          console.log('Property cleanup error:', error);
        }
      }
    });
  });

  describe('Search Performance', () => {
    test('Property search should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties?q=test');

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.search);
      console.log(`Property search performance: ${duration}ms (threshold: ${performanceThresholds.search}ms)`);
    });

    test('Location search should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/search/locations?q=test');

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.search);
      console.log(`Location search performance: ${duration}ms (threshold: ${performanceThresholds.search}ms)`);
    });

    test('Advanced property search should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const searchFilters = {
        location: 'test',
        priceMin: 50000,
        priceMax: 200000,
        propertyType: 'house',
        bedrooms: 3
      };

      const response = await request(app)
        .post('/api/search/properties')
        .send({ filters: searchFilters });

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.search);
      console.log(`Advanced search performance: ${duration}ms (threshold: ${performanceThresholds.search}ms)`);
    });
  });

  describe('Verification Performance', () => {
    let testProperty: any;

    beforeAll(async () => {
      // Create a test property for verification tests
      const propertyData = {
        title: 'Verification Test Property',
        description: 'A property for verification performance testing',
        location: 'Verification Test Location',
        price: 180000,
        bedrooms: 4,
        bathrooms: 3,
        propertyType: 'house'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .send(propertyData);

      testProperty = response.body.data;
    });

    test('Property verification status check should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/verification`);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.verification);
      console.log(`Verification status check performance: ${duration}ms (threshold: ${performanceThresholds.verification}ms)`);
    });

    test('Property verification process should complete within performance threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(performanceThresholds.verification);
      console.log(`Verification process performance: ${duration}ms (threshold: ${performanceThresholds.verification}ms)`);
    });

    afterAll(async () => {
      // Cleanup test property
      if (testProperty) {
        try {
          await storage.deleteProperty(testProperty.id);
        } catch (error) {
          console.log('Verification property cleanup error:', error);
        }
      }
    });
  });

  describe('Load Testing', () => {
    test('Concurrent property requests should maintain performance', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app).get('/api/properties')
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Average response time should be reasonable
      const averageTime = duration / concurrentRequests;
      expect(averageTime).toBeLessThan(performanceThresholds.properties * 2);
      console.log(`Concurrent requests performance: ${averageTime}ms average (${concurrentRequests} requests)`);
    });

    test('Concurrent authentication requests should maintain performance', async () => {
      const concurrentRequests = 5;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, index) =>
        request(app)
          .post('/api/auth/register')
          .send({
            username: `loadtest_user_${index}_${Date.now()}`,
            email: `loadtest${index}@example.com`,
            password: 'testpassword123',
            firstName: 'Load',
            lastName: `Test${index}`
          })
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Average response time should be reasonable
      const averageTime = duration / concurrentRequests;
      expect(averageTime).toBeLessThan(performanceThresholds.auth * 3);
      console.log(`Concurrent auth requests performance: ${averageTime}ms average (${concurrentRequests} requests)`);

      // Cleanup created users
      for (const response of responses) {
        try {
          await storage.deleteUser(response.body.data.id);
        } catch (error) {
          console.log('Load test cleanup error:', error);
        }
      }
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Health check should report system status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('nodeVersion');
      expect(response.body.data).toHaveProperty('platform');
      expect(response.body.data.services).toHaveProperty('database');

      console.log('System health:', {
        uptime: response.body.data.uptime,
        nodeVersion: response.body.data.nodeVersion,
        platform: response.body.data.platform,
        databaseStatus: response.body.data.services.database
      });
    });

    test('Memory usage should remain stable during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      await request(app).get('/api/properties');
      await request(app).get('/api/auth/me').set('Cookie', authCookie);
      await request(app).get('/api/search/locations?q=test');
      
      const finalMemory = process.memoryUsage();
      
      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      
      console.log('Memory usage:', {
        initial: Math.round(initialMemory.heapUsed / 1024 / 1024) + 'MB',
        final: Math.round(finalMemory.heapUsed / 1024 / 1024) + 'MB',
        increase: Math.round(memoryIncrease / 1024 / 1024) + 'MB'
      });
    });
  });
});