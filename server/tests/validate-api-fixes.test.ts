/**
 * Comprehensive API Bug Fixes Validation Test
 * Task 7: Validate all backend API bug fixes and improvements
 */

import { describe, it, expect, beforeAll } from '..\..\src\shared\test-utils\index';
import request from '..\app';
import express from '..\app';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  correlationIdMiddleware,
  sanitizeString,
  sanitizeObject,
  validateRequest,
  ErrorResponseFormatter,
  errorHandler,
  rateLimit,
  asyncHandler,
  securityHeaders,
  ResponseHelper,
  ValidationSchemas,
  generateCorrelationId
} from './api-bug-fixes';

describe('Comprehensive API Bug Fixes Validation', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(correlationIdMiddleware);
    app.use(securityHeaders);
  });

  describe('Bug Fix 1: Error Classes and Inheritance', () => {
    it('should create AppError with proper properties', () => {
      const error = new AppError('TEST_ERROR', 'Test message', 400, 'CLIENT');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.category).toBe('CLIENT');
    });

    it('should create ValidationError with proper inheritance', () => {
      const error = new ValidationError('Validation failed', { field: ['Required'] });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.category).toBe('VALIDATION');
      expect(error.details).toEqual({ field: ['Required'] });
    });

    it('should create AuthenticationError with proper inheritance', () => {
      const error = new AuthenticationError('Auth failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.category).toBe('AUTH');
    });
  });

  describe('Bug Fix 2: Correlation ID Generation', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      
      expect(id1).toMatch(/^req_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });

    it('should add correlation ID to request and response', async () => {
      const testApp = express();
      testApp.use(correlationIdMiddleware);
      testApp.get('/test', (req: any, res) => {
        res.json({ correlationId: req.correlationId });
      });

      const response = await request(testApp)
        .get('/test')
        .expect(200);

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
      expect(response.headers['x-correlation-id']).toBe(response.body.correlationId);
    });
  });

  describe('Bug Fix 3: Input Sanitization', () => {
    it('should sanitize XSS attempts in strings', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeString(maliciousInput);
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should sanitize objects recursively', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
        nested: {
          description: '<iframe src="javascript:alert(1)"></iframe>Description',
          tags: ['<script>alert("tag")</script>tag1', 'tag2']
        }
      };

      const sanitized = sanitizeObject(maliciousObject);
      
      expect(sanitized.name).toBe('John');
      expect(sanitized.email).toBe('john@example.com');
      expect(sanitized.nested.description).toBe('Description');
      expect(sanitized.nested.tags[0]).toBe('tag1');
      expect(sanitized.nested.tags[1]).toBe('tag2');
    });
  });

  describe('Bug Fix 4: Enhanced Request Validation', () => {
    it('should validate request body successfully', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(correlationIdMiddleware);
      
      testApp.post('/test', 
        validateRequest({
          body: ValidationSchemas.login,
          sanitize: true
        }),
        (req: any, res) => {
          res.json({ success: true, data: req.validatedBody });
        }
      );
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/test')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.password).toBe('password123');
    });

    it('should return validation errors for invalid data', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(correlationIdMiddleware);
      
      testApp.post('/test', 
        validateRequest({
          body: ValidationSchemas.login,
          sanitize: true
        }),
        (req: any, res) => {
          res.json({ success: true });
        }
      );
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/test')
        .send({
          username: '', // Invalid: empty username
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.validationErrors).toBeDefined();
    });
  });

  describe('Bug Fix 5: Error Response Formatting', () => {
    it('should format AppError correctly', () => {
      const error = new AppError('TEST_ERROR', 'Test message', 400, 'CLIENT', { detail: 'test' }, 'corr-123');
      const formatted = ErrorResponseFormatter.format(error);

      expect(formatted.success).toBe(false);
      expect(formatted.error.code).toBe('TEST_ERROR');
      expect(formatted.error.message).toBe('Test message');
      expect(formatted.error.category).toBe('CLIENT');
      expect(formatted.error.correlationId).toBe('corr-123');
      expect(formatted.error.timestamp).toBeDefined();
      expect(formatted.error.details).toEqual({ detail: 'test' });
    });

    it('should format ValidationError correctly', () => {
      const error = new ValidationError('Validation failed', { field: ['Required'] }, 'corr-123');
      const formatted = ErrorResponseFormatter.formatValidationError(error);

      expect(formatted.success).toBe(false);
      expect(formatted.error.code).toBe('VALIDATION_ERROR');
      expect(formatted.error.message).toBe('Validation failed');
      expect(formatted.error.category).toBe('VALIDATION');
      expect(formatted.error.correlationId).toBe('corr-123');
      expect(formatted.error.timestamp).toBeDefined();
      expect(formatted.error.validationErrors).toEqual({ field: ['Required'] });
    });
  });

  describe('Bug Fix 6: Enhanced Error Handling', () => {
    it('should handle errors in middleware chain', async () => {
      const testApp = express();
      testApp.use(correlationIdMiddleware);
      
      testApp.get('/test', (req, res, next) => {
        next(new ValidationError('Test validation error'));
      });
      testApp.use(errorHandler);

      const response = await request(testApp)
        .get('/test')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Test validation error');
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  describe('Bug Fix 7: Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const testApp = express();
      testApp.use(correlationIdMiddleware);
      testApp.use(rateLimit(5, 60000)); // 5 requests per minute
      
      testApp.get('/test', (req, res) => {
        res.json({ success: true });
      });
      testApp.use(errorHandler);

      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const response = await request(testApp)
          .get('/test')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.headers['x-ratelimit-limit']).toBe('5');
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      }
    });
  });

  describe('Bug Fix 8: Async Handler Wrapper', () => {
    it('should handle async function errors', async () => {
      const testApp = express();
      testApp.use(correlationIdMiddleware);
      
      testApp.get('/test', asyncHandler(async (req, res, next) => {
        throw new ValidationError('Async validation error');
      }));
      testApp.use(errorHandler);

      const response = await request(testApp)
        .get('/test')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Async validation error');
    });
  });

  describe('Bug Fix 9: Security Headers', () => {
    it('should add security headers to responses', async () => {
      const testApp = express();
      testApp.use(securityHeaders);
      
      testApp.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp)
        .get('/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Bug Fix 10: Response Helper Functions', () => {
    it('should format success responses correctly', async () => {
      const testApp = express();
      
      testApp.get('/test', (req, res) => {
        ResponseHelper.success(res, { id: 1, name: 'Test' }, 'Success message');
      });

      const response = await request(testApp)
        .get('/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ id: 1, name: 'Test' });
      expect(response.body.message).toBe('Success message');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should format error responses correctly', async () => {
      const testApp = express();
      testApp.use(correlationIdMiddleware);
      
      testApp.get('/test', (req: any, res) => {
        ResponseHelper.error(res, 'Test error', 400, req.correlationId);
      });

      const response = await request(testApp)
        .get('/test')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Test error');
      expect(response.body.error.code).toBe('CLIENT_ERROR');
      expect(response.body.error.correlationId).toBeDefined();
      expect(response.body.error.timestamp).toBeDefined();
    });
  });

  describe('Integration Test: Complete Request Flow', () => {
    it('should handle complete request flow with all middleware', async () => {
      const testApp = express();
      
      // Apply all middleware
      testApp.use(express.json());
      testApp.use(correlationIdMiddleware);
      testApp.use(securityHeaders);
      testApp.use(rateLimit(100, 60000));
      
      // Test endpoint with validation
      testApp.post('/api/properties', 
        validateRequest({
          body: ValidationSchemas.createProperty,
          sanitize: true
        }),
        asyncHandler(async (req: any, res) => {
          ResponseHelper.success(res, {
            id: Date.now(),
            ...req.validatedBody,
            createdAt: new Date().toISOString()
          }, 'Property created successfully', 201);
        })
      );
      
      // Error handling
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/api/properties')
        .send({
          title: 'Beautiful House',
          description: 'A beautiful house with great amenities and stunning views',
          price: 250000,
          location: 'Nairobi, Kenya',
          bedrooms: 3,
          bathrooms: 2
        })
        .expect(201);

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('Beautiful House');
      expect(response.body.message).toBe('Property created successfully');
      expect(response.body.timestamp).toBeDefined();

      // Verify headers
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
    });
  });
});