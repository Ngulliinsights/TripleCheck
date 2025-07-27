/**
 * Tests for centralized error handling middleware
 * Verifies consistent error responses and proper error type detection
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  centralizedErrorHandler,
  correlationIdMiddleware,
  handleDrizzleError,
  handleValidationError,
  notFoundHandler,
  asyncHandler,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CONSTANTS,
} from '../centralized-error-handler';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  DatabaseError,
  NotFoundError,
  ErrorCode,
  HttpStatusCode,
  ErrorCategory,
} from '../../../src/shared/utils/errors';

import { vi } from 'vitest';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Helper function to create mock request
const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  method: 'GET',
  url: '/test',
  originalUrl: '/test',
  headers: {},
  body: {},
  query: {},
  params: {},
  ...overrides,
} as Request);

// Helper function to create mock response
const createMockResponse = (): Response => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    headersSent: false,
  } as unknown as Response;
  return res;
};

// Helper function to create mock next function
const createMockNext = (): NextFunction => vi.fn();

describe('Centralized Error Handler Middleware', () => {
  describe('correlationIdMiddleware', () => {
    it('should add correlation ID to request and response headers', () => {
      const req = createMockRequest() as any;
      const res = createMockResponse();
      const next = createMockNext();

      correlationIdMiddleware(req, res, next);

      expect(req.correlationId).toBeDefined();
      expect(typeof req.correlationId).toBe('string');
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', req.correlationId);
      expect(next).toHaveBeenCalled();
    });

    it('should use existing correlation ID from headers', () => {
      const existingId = 'existing-correlation-id';
      const req = createMockRequest({
        headers: { 'x-correlation-id': existingId },
      }) as any;
      const res = createMockResponse();
      const next = createMockNext();

      correlationIdMiddleware(req, res, next);

      expect(req.correlationId).toBe(existingId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingId);
    });
  });

  describe('centralizedErrorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Test validation error', { field: ['Test error'] }, 'test-correlation-id');
      const req = createMockRequest() as any;
      req.correlationId = 'test-correlation-id';
      const res = createMockResponse();
      const next = createMockNext();

      centralizedErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test validation error',
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          category: ErrorCategory.VALIDATION,
          details: { fieldErrors: { field: ['Test error'] } },
          timestamp: expect.any(String),
          correlationId: 'test-correlation-id',
        },
        errors: [
          {
            field: 'field',
            message: 'Test error',
            code: 'VALIDATION_ERROR',
          },
        ],
      });
    });

    it('should handle Zod validation errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['username'],
          message: 'Expected string, received number',
        },
      ]);
      const req = createMockRequest() as any;
      req.correlationId = 'test-correlation-id';
      const res = createMockResponse();
      const next = createMockNext();

      centralizedErrorHandler(zodError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Input validation failed',
          errors: [
            {
              field: 'username',
              message: 'Expected string, received number',
              code: 'VALIDATION_ERROR',
            },
          ],
        })
      );
    });

    it('should handle database errors with specific detection', () => {
      const dbError = new Error('duplicate key value violates unique constraint');
      const req = createMockRequest() as any;
      req.correlationId = 'test-correlation-id';
      const res = createMockResponse();
      const next = createMockNext();

      centralizedErrorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A record with this information already exists',
          error: expect.objectContaining({
            code: ErrorCode.DUPLICATE_RECORD,
            category: ErrorCategory.DATABASE,
          }),
        })
      );
    });

    it('should handle JWT authentication errors', () => {
      const jwtError = new Error('JsonWebTokenError');
      jwtError.name = 'JsonWebTokenError';
      const req = createMockRequest() as any;
      const res = createMockResponse();
      const next = createMockNext();

      centralizedErrorHandler(jwtError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token',
          error: expect.objectContaining({
            code: ErrorCode.TOKEN_INVALID,
            category: ErrorCategory.AUTHENTICATION,
          }),
        })
      );
    });

    it('should handle timeout errors', () => {
      const timeoutError = new Error('Request timeout occurred');
      const req = createMockRequest() as any;
      const res = createMockResponse();
      const next = createMockNext();

      centralizedErrorHandler(timeoutError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.GATEWAY_TIMEOUT);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Request timeout',
          error: expect.objectContaining({
            code: ErrorCode.TIMEOUT,
            category: ErrorCategory.NETWORK,
          }),
        })
      );
    });

    it('should not send response if headers already sent', () => {
      const error = new Error('Test error');
      const req = createMockRequest() as any;
      const res = createMockResponse();
      res.headersSent = true;
      const next = createMockNext();

      centralizedErrorHandler(error, req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should add debug headers in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new ValidationError('Test error');
      const req = createMockRequest() as any;
      const res = createMockResponse();
      const next = createMockNext();

      centralizedErrorHandler(error, req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Error-Code', ErrorCode.VALIDATION_FAILED);
      expect(res.setHeader).toHaveBeenCalledWith('X-Error-Category', ErrorCategory.VALIDATION);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('handleDrizzleError', () => {
    it('should handle database errors with default message', () => {
      const error = new Error('foreign key constraint violation');
      const res = createMockResponse();
      const defaultMessage = 'Database operation failed';

      handleDrizzleError(error, res, defaultMessage, 'test-correlation-id');

      expect(res.status).toHaveBeenCalledWith(HttpStatusCode.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Referenced record does not exist',
          error: expect.objectContaining({
            code: ErrorCode.CONSTRAINT_VIOLATION,
            category: ErrorCategory.DATABASE,
          }),
        })
      );
    });

    it('should not send response if headers already sent', () => {
      const error = new Error('Test database error');
      const res = createMockResponse();
      res.headersSent = true;

      handleDrizzleError(error, res, 'Default message');

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('notFoundHandler', () => {
    it('should create NotFoundError and pass to next', () => {
      const req = createMockRequest({
        method: 'GET',
        originalUrl: '/api/nonexistent',
      }) as any;
      req.correlationId = 'test-correlation-id';
      const res = createMockResponse();
      const next = createMockNext();

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.RECORD_NOT_FOUND,
          message: 'Route GET /api/nonexistent not found',
          statusCode: HttpStatusCode.NOT_FOUND,
          correlationId: 'test-correlation-id',
        })
      );
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and pass errors to next', async () => {
      const error = new Error('Async error');
      const asyncFn = vi.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await wrappedFn(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Response helpers', () => {
    describe('createSuccessResponse', () => {
      it('should create success response with data', () => {
        const data = { id: 1, name: 'Test' };
        const message = 'Success message';
        const metadata = { totalCount: 1 };

        const response = createSuccessResponse(data, message, metadata);

        expect(response).toEqual({
          success: true,
          data,
          message,
          metadata,
        });
      });

      it('should create success response with minimal data', () => {
        const data = { id: 1 };

        const response = createSuccessResponse(data);

        expect(response).toEqual({
          success: true,
          data,
          message: undefined,
          metadata: undefined,
        });
      });
    });

    describe('createErrorResponse', () => {
      it('should create error response with message and errors', () => {
        const message = 'Validation failed';
        const errors = [
          { field: 'username', message: 'Required', code: 'REQUIRED' },
          { field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' },
        ];

        const response = createErrorResponse(message, errors);

        expect(response).toEqual({
          success: false,
          message,
          errors,
        });
      });

      it('should create error response with message only', () => {
        const message = 'Something went wrong';

        const response = createErrorResponse(message);

        expect(response).toEqual({
          success: false,
          message,
          errors: undefined,
        });
      });
    });
  });

  describe('ERROR_CONSTANTS', () => {
    it('should export HTTP status constants', () => {
      expect(ERROR_CONSTANTS.HTTP_STATUS.OK).toBe(200);
      expect(ERROR_CONSTANTS.HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(ERROR_CONSTANTS.HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(ERROR_CONSTANTS.HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(ERROR_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('should export error messages', () => {
      expect(ERROR_CONSTANTS.MESSAGES.VALIDATION_FAILED).toBe('Invalid data provided');
      expect(ERROR_CONSTANTS.MESSAGES.AUTH_REQUIRED).toBe('Authentication required');
      expect(ERROR_CONSTANTS.MESSAGES.DATABASE_ERROR).toBe('Database operation failed');
    });
  });
});