import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ValidationError, generateCorrelationId } from '../../src/shared/error-handling';

// Enhanced validation middleware with comprehensive error handling and sanitization

export interface ValidationConfig {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  headers?: z.ZodSchema<any>;
  files?: z.ZodSchema<any>;
  sanitize?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export interface ValidatedRequest<
  TBody = any,
  TQuery = any,
  TParams = any,
  THeaders = any
> extends Request {
  validatedBody?: TBody;
  validatedQuery?: TQuery;
  validatedParams?: TParams;
  validatedHeaders?: THeaders;
  correlationId: string;
}

/**
 * Enhanced validation middleware factory
 */
export function validateRequest(config: ValidationConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = generateCorrelationId();
    (req as ValidatedRequest).correlationId = correlationId;

    try {
      const validationResults: Record<string, any> = {};
      const errors: Record<string, string[]> = {};

      // Validate request body
      if (config.body) {
        try {
          const sanitizedBody = config.sanitize ? sanitizeObject(req.body) : req.body;
          const result = config.stripUnknown 
            ? config.body.strip().parse(sanitizedBody)
            : config.body.parse(sanitizedBody);
          validationResults.body = result;
          (req as ValidatedRequest).validatedBody = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.body = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.body = ['Invalid request body format'];
          }
        }
      }

      // Validate query parameters
      if (config.query) {
        try {
          const sanitizedQuery = config.sanitize ? sanitizeObject(req.query) : req.query;
          const result = config.stripUnknown
            ? config.query.strip().parse(sanitizedQuery)
            : config.query.parse(sanitizedQuery);
          validationResults.query = result;
          (req as ValidatedRequest).validatedQuery = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.query = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.query = ['Invalid query parameters'];
          }
        }
      }

      // Validate route parameters
      if (config.params) {
        try {
          const result = config.params.parse(req.params);
          validationResults.params = result;
          (req as ValidatedRequest).validatedParams = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.params = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.params = ['Invalid route parameters'];
          }
        }
      }

      // Validate headers
      if (config.headers) {
        try {
          const result = config.headers.parse(req.headers);
          validationResults.headers = result;
          (req as ValidatedRequest).validatedHeaders = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.headers = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.headers = ['Invalid request headers'];
          }
        }
      }

      // Validate uploaded files
      if (config.files && req.files) {
        try {
          const result = config.files.parse(req.files);
          validationResults.files = result;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.files = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          } else {
            errors.files = ['Invalid file upload'];
          }
        }
      }

      // Check if there are any validation errors
      if (Object.keys(errors).length > 0) {
        const validationError = new ValidationError(
          'Request validation failed',
          errors,
          correlationId
        );

        const errorResponse = ErrorResponseFormatter.formatValidationError(validationError);
        return res.status(400).json(errorResponse);
      }

      // All validations passed, continue to next middleware
      next();
    } catch (error) {
      // Handle unexpected errors during validation
      const validationError = new ValidationError(
        'Validation process failed',
        { general: ['An error occurred during request validation'] },
        correlationId
      );

      const errorResponse = ErrorResponseFormatter.formatValidationError(validationError);
      return res.status(500).json(errorResponse);
    }
  };
}

/**
 * Sanitize object to prevent XSS and injection attacks
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string to prevent XSS attacks
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

// Common validation schemas for reuse
export const CommonValidationSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // ID parameter validation
  idParam: z.object({
    id: z.coerce.number().int().positive('ID must be a positive integer'),
  }),

  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),

  // Search query validation
  searchQuery: z.object({
    q: z.string()
      .min(1, 'Search query cannot be empty')
      .max(100, 'Search query cannot exceed 100 characters')
      .trim()
      .optional(),
    location: z.string().max(100).trim().optional(),
    category: z.string().max(50).trim().optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    mimetype: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(type),
      'Invalid file type'
    ),
    size: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  }),

  // Authentication headers
  authHeaders: z.object({
    authorization: z.string()
      .regex(/^Bearer\s+.+/, 'Authorization header must be in Bearer token format')
      .optional(),
  }),

  // Content type headers
  contentTypeHeaders: z.object({
    'content-type': z.string()
      .refine(
        (type) => type.includes('application/json') || type.includes('multipart/form-data'),
        'Content-Type must be application/json or multipart/form-data'
      )
      .optional(),
  }),
};

// Property-specific validation schemas
export const PropertyValidationSchemas = {
  // Create property request
  createProperty: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title cannot exceed 100 characters')
      .trim(),
    description: z.string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .trim(),
    price: z.number()
      .positive('Price must be positive')
      .max(50000000, 'Price cannot exceed $50,000,000'),
    location: z.string()
      .min(2, 'Location must be at least 2 characters')
      .max(100, 'Location cannot exceed 100 characters')
      .trim(),
    address: z.string()
      .max(500, 'Address cannot exceed 500 characters')
      .trim()
      .optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    features: z.object({
      bedrooms: z.number().int().min(0).max(20).optional(),
      bathrooms: z.number().min(0).max(20).optional(),
      squareFeet: z.number().int().min(1).max(100000).optional(),
      parkingSpaces: z.number().int().min(0).max(20).optional(),
      yearBuilt: z.number().int()
        .min(1800)
        .max(new Date().getFullYear() + 2)
        .optional(),
      propertyType: z.enum([
        'apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land'
      ]).optional(),
      petFriendly: z.boolean().optional(),
      furnished: z.boolean().optional(),
      amenities: z.array(z.string().max(50).trim()).max(30).optional(),
    }).optional(),
    imageUrls: z.array(z.string().url()).max(20).optional(),
  }),

  // Update property request
  updateProperty: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(100, 'Title cannot exceed 100 characters')
      .trim()
      .optional(),
    description: z.string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .trim()
      .optional(),
    price: z.number()
      .positive('Price must be positive')
      .max(50000000, 'Price cannot exceed $50,000,000')
      .optional(),
    location: z.string()
      .min(2, 'Location must be at least 2 characters')
      .max(100, 'Location cannot exceed 100 characters')
      .trim()
      .optional(),
    // ... other optional fields
  }),

  // Property search filters
  searchFilters: z.object({
    query: z.string().max(100).trim().optional(),
    location: z.string().max(100).trim().optional(),
    priceMin: z.coerce.number().positive().optional(),
    priceMax: z.coerce.number().positive().optional(),
    bedrooms: z.coerce.number().int().min(0).max(20).optional(),
    bathrooms: z.coerce.number().min(0).max(20).optional(),
    propertyType: z.enum([
      'apartment', 'house', 'condo', 'townhouse', 'studio', 'commercial', 'land'
    ]).optional(),
    petFriendly: z.coerce.boolean().optional(),
    furnished: z.coerce.boolean().optional(),
  }).refine(
    (data) => !data.priceMin || !data.priceMax || data.priceMin <= data.priceMax,
    'Minimum price cannot be greater than maximum price'
  ),
};

// User validation schemas
export const UserValidationSchemas = {
  // User registration
  register: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
      .refine(
        (username) => !username.startsWith('-') && !username.endsWith('-'),
        'Username cannot start or end with a hyphen'
      ),
    email: z.string()
      .email('Invalid email format')
      .max(255, 'Email cannot exceed 255 characters')
      .toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .refine(
        (password) => /[A-Z]/.test(password),
        'Password must contain at least one uppercase letter'
      )
      .refine(
        (password) => /[a-z]/.test(password),
        'Password must contain at least one lowercase letter'
      )
      .refine(
        (password) => /\d/.test(password),
        'Password must contain at least one number'
      )
      .refine(
        (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        'Password must contain at least one special character'
      ),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, apostrophes, and hyphens')
      .trim(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, apostrophes, and hyphens')
      .trim(),
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be in international format')
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional(),
  }),

  // User login
  login: z.object({
    username: z.string()
      .min(1, 'Username is required')
      .max(30, 'Username cannot exceed 30 characters')
      .trim(),
    password: z.string()
      .min(1, 'Password is required'),
  }),

  // Update user profile
  updateProfile: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, apostrophes, and hyphens')
      .trim()
      .optional(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, apostrophes, and hyphens')
      .trim()
      .optional(),
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be in international format')
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional(),
    bio: z.string()
      .max(500, 'Bio cannot exceed 500 characters')
      .trim()
      .optional(),
  }),

  // Change password
  changePassword: z.object({
    currentPassword: z.string()
      .min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password cannot exceed 128 characters')
      .refine(
        (password) => /[A-Z]/.test(password),
        'New password must contain at least one uppercase letter'
      )
      .refine(
        (password) => /[a-z]/.test(password),
        'New password must contain at least one lowercase letter'
      )
      .refine(
        (password) => /\d/.test(password),
        'New password must contain at least one number'
      )
      .refine(
        (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        'New password must contain at least one special character'
      ),
  }),
};

// Review validation schemas
export const ReviewValidationSchemas = {
  // Create review
  createReview: z.object({
    rating: z.number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comment: z.string()
      .min(10, 'Review comment must be at least 10 characters')
      .max(1000, 'Review comment cannot exceed 1000 characters')
      .trim(),
  }),

  // Update review
  updateReview: z.object({
    rating: z.number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional(),
    comment: z.string()
      .min(10, 'Review comment must be at least 10 characters')
      .max(1000, 'Review comment cannot exceed 1000 characters')
      .trim()
      .optional(),
  }),
};

// Export validation middleware as default
export { validateRequest as default };