/**
 * Zod Validation Middleware
 * Replaces custom validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../infrastructure/observability/telemetry';

/**
 * Validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({
          path: req.path,
          errors: error.errors,
        }, 'Request body validation failed');

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      logger.error({ error }, 'Validation error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Validate request query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({
          path: req.path,
          errors: error.errors,
        }, 'Request query validation failed');

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      logger.error({ error }, 'Validation error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Validate request params
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({
          path: req.path,
          errors: error.errors,
        }, 'Request params validation failed');

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      logger.error({ error }, 'Validation error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
}

/**
 * Validate all request parts (body, query, params)
 */
export function validate<T extends {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}>(schemas: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as any;
      }

      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({
          path: req.path,
          errors: error.errors,
        }, 'Request validation failed');

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      logger.error({ error }, 'Validation error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate,
};
