import request from 'supertest';
import app from '../app';
import { storage } from '../infrastructure/storage/storage';

describe('Backward Compatibility Tests', () => {
  let testUser: any;
  let testProperty: any;
  let authCookie: string;

  beforeAll(async () => {
    // Create test user for authentication
    const userData = {
      username: 'testuser_compat',
      email: 'test@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
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
    if (testProperty) {
      try {
        await storage.deleteProperty(testProperty.id);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register should work unchanged', async () => {
      const userData = {
        username: 'newuser_compat',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', userData.username);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.message).toBe('User registered successfully');

      // Cleanup
      await storage.deleteUser(response.body.data.id);
    });

    test('POST /api/auth/login should work unchanged', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser_compat',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', 'testuser_compat');
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.message).toBe('Login successful');
    });

    test('GET /api/auth/me should work unchanged', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', 'testuser_compat');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('POST /api/auth/logout should work unchanged', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Property Endpoints', () => {
    test('GET /api/properties should work unchanged', async () => {
      const response = await request(app)
        .get('/api/properties');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('properties');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.data.properties)).toBe(true);
      expect(response.body.metadata).toHaveProperty('totalCount');
    });

    test('POST /api/properties should work unchanged', async () => {
      const propertyData = {
        title: 'Test Property Compat',
        description: 'A test property for compatibility testing',
        location: 'Test Location',
        price: 100000,
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

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', propertyData.title);
      expect(response.body.data).toHaveProperty('price', propertyData.price);
      expect(response.body.message).toBe('Property created successfully');

      testProperty = response.body.data;
    });

    test('GET /api/properties/:id should work unchanged', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const response = await request(app)
        .get(`/api/properties/${testProperty.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testProperty.id);
      expect(response.body.data).toHaveProperty('title', testProperty.title);
    });

    test('PUT /api/properties/:id should work unchanged', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const updateData = {
        title: 'Updated Test Property',
        price: 120000
      };

      const response = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .set('Cookie', authCookie)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('price', updateData.price);
      expect(response.body.message).toBe('Property updated successfully');
    });

    test('GET /api/properties with search query should work unchanged', async () => {
      const response = await request(app)
        .get('/api/properties?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('properties');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.metadata).toHaveProperty('filters');
    });
  });

  describe('Review Endpoints', () => {
    test('POST /api/properties/:id/reviews should work unchanged', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const reviewData = {
        rating: 5,
        comment: 'Great property for testing!'
      };

      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/reviews`)
        .set('Cookie', authCookie)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rating', reviewData.rating);
      expect(response.body.data).toHaveProperty('comment', reviewData.comment);
      expect(response.body.message).toBe('Review created successfully');
    });

    test('GET /api/properties/:id/reviews should work unchanged', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/reviews`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('User Management Endpoints', () => {
    test('GET /api/users should work unchanged', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/users/:id should work unchanged', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testUser.id);
      expect(response.body.data).not.toHaveProperty('password');
    });
  });

  describe('Verification Endpoints', () => {
    test('GET /api/properties/:id/verification should work unchanged', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/verification`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('verificationStatus');
    });

    test('POST /api/properties/:id/verify should work unchanged', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/verify`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('documentAuthenticity');
      expect(response.body.data).toHaveProperty('ownershipVerified');
      expect(response.body.data).toHaveProperty('riskScore');
    });
  });

  describe('Search Endpoints', () => {
    test('GET /api/search/locations should work unchanged', async () => {
      const response = await request(app)
        .get('/api/search/locations?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/search/properties should work unchanged', async () => {
      const searchFilters = {
        location: 'test',
        priceMin: 50000,
        priceMax: 200000,
        propertyType: 'house'
      };

      const response = await request(app)
        .post('/api/search/properties')
        .send({ filters: searchFilters });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('properties');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.metadata).toHaveProperty('filters');
    });
  });

  describe('Health Check Endpoint', () => {
    test('GET /api/health should work unchanged', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('version');
    });
  });

  describe('Error Handling Compatibility', () => {
    test('Invalid authentication should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    test('Invalid property ID should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/properties/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    test('Unauthorized access should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          title: 'Test Property',
          description: 'Test',
          location: 'Test',
          price: 100000
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });
});