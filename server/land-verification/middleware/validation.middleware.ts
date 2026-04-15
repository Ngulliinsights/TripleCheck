import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../../src/shared/error-handling';
import { logger } from '../../infrastructure/observability/telemetry';

/**
 * Comprehensive validation schemas for Kenya Land Verification System
 * Requirements: 9.3 - Request validation and error handling
 */

// Base validation schemas
export const LandVerificationValidationSchemas = {
  // Property ID validation
  propertyId: z.string()
    .regex(/^\d+$/, 'Property ID must be a valid positive integer')
    .transform(val => parseInt(val, 10)),

  // Session ID validation
  sessionId: z.string()
    .uuid('Session ID must be a valid UUID'),

  // GPS coordinates validation
  coordinates: z.object({
    latitude: z.number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
  }),

  // Verification request validation
  verificationRequest: z.object({
    propertyId: z.string()
      .regex(/^\d+$/, 'Property ID must be a valid positive integer')
      .transform(val => parseInt(val, 10)),
    requestType: z.enum(['full', 'basic', 'emergency']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    metadata: z.record(z.any()).optional()
  })
}; 
/*
*
 * Validation middleware factory
 * Creates Express middleware for validating request data against schemas
 */
export function validateRequest(schema: z.ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'params' ? req.params : 
                   req.query;

      const validatedData = schema.parse(data);
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'params') {
        req.params = validatedData;
      } else {
        req.query = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          'Request validation failed',
          error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        );

        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: validationError.details,
          correlationId: req.headers['x-correlation-id']
        });

        return res.status(400).json({
          error: 'Validation Error',
          message: validationError.message,
          details: validationError.details
        });
      }

      logger.error('Unexpected validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method
      });

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
}

/**
 * Pre-configured validation middleware for common use cases
 */
export const validatePropertyId = validateRequest(
  LandVerificationValidationSchemas.propertyId,
  'params'
);

export const validateSessionId = validateRequest(
  LandVerificationValidationSchemas.sessionId,
  'params'
);

export const validateVerificationRequest = validateRequest(
  LandVerificationValidationSchemas.verificationRequest,
  'body'
);

export const validateCoordinates = validateRequest(
  LandVerificationValidationSchemas.coordinates,
  'body'
);