/**
 * Integration example showing how to use the centralized error handling middleware
 * This demonstrates how the new middleware integrates with existing routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  ValidationError,
  DatabaseError,
  AuthenticationError,
  NotFoundError,
} from '../../src/shared/utils/errors';

import {
  centralizedErrorHandler,
  correlationIdMiddleware,
  notFoundHandler,
  asyncHandler,
  createSuccessResponse,
  handleDrizzleError,
  handleValidationError,
  ERROR_CONSTANTS,
} from './centralized-error-handler';

// Example of how to integrate the centralized error handling middleware
export function setupErrorHandlingExample(): express.Application {
  const app = express();

  // 1. Add correlation ID middleware first (before any routes)
  app.use(correlationIdMiddleware);

  // 2. Add JSON parsing middleware
  app.use(express.json());

  // 3. Example routes showing different error scenarios

  // Success response example
  app.get('/api/success', (req: Request, res: Response) => {
    const data = { message: 'This is a successful response' };
    const response = createSuccessResponse(data, 'Operation completed successfully');
    res.json(response);
  });

  // Validation error example using asyncHandler
  app.post('/api/validate', asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      username: z.string().min(3),
      email: z.string().email(),
    });

    // This will throw a ZodError if validation fails
    const validatedData = schema.parse(req.body);
    
    const response = createSuccessResponse(validatedData, 'Validation successful');
    res.json(response);
  }));

  // Database error example
  app.get('/api/database-error', asyncHandler(async (req: Request, res: Response) => {
    // Simulate a database error
    throw new Error('duplicate key value violates unique constraint "users_email_key"');
  }));

  // Authentication error example
  app.get('/api/protected', asyncHandler(async (req: Request, res: Response) => {
    // Simulate authentication check
    const token = req.headers.authorization;
    if (!token) {
      throw new AuthenticationError('Authentication token required');
    }
    
    const response = createSuccessResponse({ data: 'Protected resource' });
    res.json(response);
  }));

  // Legacy handleDrizzleError integration example
  app.get('/api/legacy-db-error', (req: Request, res: Response) => {
    try {
      // Simulate database operation that fails
      throw new Error('foreign key constraint violation');
    } catch (error) {
      // Use the legacy handleDrizzleError function for backward compatibility
      handleDrizzleError(error, res, 'Database operation failed', (req as any).correlationId);
    }
  });

  // Legacy validation error integration example
  app.post('/api/legacy-validation', (req: Request, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });
      
      schema.parse(req.body);
      
      const response = createSuccessResponse({ message: 'Validation passed' });
      res.json(response);
    } catch (error) {
      // Use the legacy handleValidationError function for backward compatibility
      handleValidationError(error, res, (req as any).correlationId);
    }
  });

  // Manual error throwing example
  app.get('/api/manual-error', asyncHandler(async (req: Request, res: Response) => {
    const errorType = req.query.type as string;
    
    switch (errorType) {
      case 'validation':
        throw new ValidationError('Manual validation error', {
          field: ['This field has an error']
        });
      case 'database':
        throw new DatabaseError('Manual database error');
      case 'not-found':
        throw new NotFoundError('Manual resource');
      case 'timeout':
        throw new Error('Request timeout occurred');
      default:
        throw new Error('Generic error for testing');
    }
  }));

  // 4. Add 404 handler for unmatched routes
  app.use(notFoundHandler);

  // 5. Add centralized error handling middleware (must be last)
  app.use(centralizedErrorHandler);

  return app;
}

// Example of how to use the middleware in existing routes.ts
export function integrateWithExistingRoutes(app: express.Application): void {
  // 1. Add correlation ID middleware at the beginning
  app.use(correlationIdMiddleware);

  // 2. Replace existing error handling patterns with centralized approach
  
  // OLD WAY (from routes.ts):
  // try {
  //   // some operation
  // } catch (error) {
  //   handleDrizzleError(error, res, "Default message");
  // }

  // NEW WAY:
  // Use asyncHandler wrapper and let centralized error handler manage errors
  app.post('/api/example', asyncHandler(async (req: Request, res: Response) => {
    // Business logic here
    // Any thrown errors will be automatically handled by centralizedErrorHandler
    
    const response = createSuccessResponse({ message: 'Success' });
    res.json(response);
  }));

  // 3. For legacy compatibility, existing handleDrizzleError calls can remain
  // but they now use the centralized error handling internally

  // 4. Add centralized error handler at the end (after all routes)
  app.use(centralizedErrorHandler);
}

// Example constants usage
export const EXAMPLE_USAGE = {
  // Use centralized constants instead of scattered magic numbers
  HTTP_STATUS: ERROR_CONSTANTS.HTTP_STATUS,
  MESSAGES: ERROR_CONSTANTS.MESSAGES,
  
  // Example of consistent error response
  createValidationErrorResponse: (fieldErrors: Record<string, string[]>) => {
    return {
      success: false as const,
      message: ERROR_CONSTANTS.MESSAGES.VALIDATION_FAILED,
      errors: Object.entries(fieldErrors).flatMap(([field, messages]) =>
        messages.map(message => ({
          field,
          message,
          code: 'VALIDATION_ERROR',
        }))
      ),
    };
  },
};

// Migration guide for existing routes
export const MIGRATION_GUIDE = {
  // Step 1: Add middleware
  step1: 'Add correlationIdMiddleware at the beginning of your app setup',
  
  // Step 2: Wrap async routes
  step2: 'Wrap async route handlers with asyncHandler',
  
  // Step 3: Replace error handling
  step3: 'Replace try/catch blocks with centralized error handling',
  
  // Step 4: Use response helpers
  step4: 'Use createSuccessResponse and createErrorResponse for consistency',
  
  // Step 5: Add error middleware
  step5: 'Add centralizedErrorHandler at the end of your middleware stack',
  
  example: `
    // Before:
    app.post('/api/users', async (req, res) => {
      try {
        const user = await createUser(req.body);
        res.json({ success: true, data: user });
      } catch (error) {
        handleDrizzleError(error, res, 'Failed to create user');
      }
    });

    // After:
    app.post('/api/users', asyncHandler(async (req, res) => {
      const user = await createUser(req.body);
      const response = createSuccessResponse(user, 'User created successfully');
      res.json(response);
    }));
  `,
};