import { z } from 'zod';

import { ValidationError } from '../types/api';

// Enhanced validation utilities with comprehensive error handling

export class ValidationService {
  /**
   * Validate data against a Zod schema with enhanced error reporting
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.createValidationError(error);
      }
      throw error;
    }
  }

  /**
   * Validate data and return result with success/error information
   */
  static safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    error?: ValidationError;
  } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: this.createValidationError(error) };
      }
      return { 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unknown validation error',
          field: 'unknown'
        }
      };
    }
  }

  /**
   * Create a structured validation error from Zod error
   * Safely handles different types of ZodIssue that may or may not have 'received' property
   */
  private static createValidationError(zodError: z.ZodError): ValidationError {
    const firstError = zodError.errors[0];
    
    // Safely extract received value - not all ZodIssue types have this property
    const getReceivedValue = (issue: z.ZodIssue): unknown => {
      return 'received' in issue ? issue.received : undefined;
    };
    
    return {
      code: 'VALIDATION_ERROR',
      message: firstError?.message || 'Validation failed',
      field: firstError?.path.join('.') || 'unknown',
      value: firstError ? getReceivedValue(firstError) : undefined,
      constraints: zodError.errors.map(err => err.message),
      details: {
        errors: zodError.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: getReceivedValue(err)
        }))
      }
    };
  }
}

// Common validation schemas
export const CommonValidationSchemas = {
  // Email validation with enhanced rules
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .toLowerCase()
    .refine(
      (email) => {
        if (!email.includes('+')) return true;
        const parts = email.split('@');
        if (parts.length < 2) return false;
        const localParts = parts[0]?.split('+');
        return localParts?.[0] && localParts[0].length >= 3;
      },
      'Email local part before + must be at least 3 characters'
    ),

  // Password validation with security requirements
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
      (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      'Password must contain at least one special character'
    ),

  // Phone number validation (international format)
  phone: z.string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Phone number must be in international format (E.164)'
    )
    .max(20, 'Phone number cannot exceed 20 characters'),

  // URL validation with protocol requirement
  url: z.string()
    .url('Invalid URL format')
    .refine(
      (url) => url.startsWith('https://') || url.startsWith('http://'),
      'URL must include protocol (http:// or https://)'
    ),

  // Secure URL validation (HTTPS only)
  secureUrl: z.string()
    .url('Invalid URL format')
    .refine(
      (url) => url.startsWith('https://'),
      'URL must use HTTPS protocol'
    ),

  // UUID validation
  uuid: z.string()
    .uuid('Invalid UUID format'),

  // Date validation with range checking
  date: z.date()
    .refine(
      (date) => date >= new Date('1900-01-01'),
      'Date cannot be before 1900'
    )
    .refine(
      (date) => date <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'Date cannot be more than 1 year in the future'
    ),

  // Currency amount validation
  currency: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount cannot exceed $999,999,999.99')
    .refine(
      (amount) => Number.isFinite(amount),
      'Amount must be a finite number'
    )
    .refine(
      (amount) => Math.round(amount * 100) / 100 === amount,
      'Amount cannot have more than 2 decimal places'
    ),

  // Text content validation
  shortText: z.string()
    .min(1, 'Text cannot be empty')
    .max(255, 'Text cannot exceed 255 characters')
    .trim(),

  mediumText: z.string()
    .min(1, 'Text cannot be empty')
    .max(1000, 'Text cannot exceed 1000 characters')
    .trim(),

  longText: z.string()
    .min(1, 'Text cannot be empty')
    .max(5000, 'Text cannot exceed 5000 characters')
    .trim(),

  // Search query validation
  searchQuery: z.string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query cannot exceed 100 characters')
    .trim()
    .refine(
      (query) => !/[<>]/.test(query),
      'Search query cannot contain HTML tags'
    ),
};

// Property-specific validation schemas
export const PropertyValidationSchemas = {
  title: CommonValidationSchemas.shortText
    .min(5, 'Property title must be at least 5 characters')
    .max(100, 'Property title cannot exceed 100 characters'),

  description: CommonValidationSchemas.longText
    .min(20, 'Property description must be at least 20 characters')
    .max(2000, 'Property description cannot exceed 2000 characters'),

  // Create a separate base schema for price to avoid method chaining issues
  price: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount cannot exceed $999,999,999.99')
    .min(1, 'Property price must be at least $1')
    .max(50000000, 'Property price cannot exceed $50,000,000')
    .refine(
      (amount) => Number.isFinite(amount),
      'Amount must be a finite number'
    )
    .refine(
      (amount) => Math.round(amount * 100) / 100 === amount,
      'Amount cannot have more than 2 decimal places'
    ),

  location: CommonValidationSchemas.shortText
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters'),

  bedrooms: z.number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative')
    .max(20, 'Bedrooms cannot exceed 20'),

  bathrooms: z.number()
    .min(0, 'Bathrooms cannot be negative')
    .max(20, 'Bathrooms cannot exceed 20')
    .refine(
      (bathrooms) => bathrooms % 0.5 === 0,
      'Bathrooms must be in increments of 0.5'
    ),

  squareFeet: z.number()
    .int('Square feet must be a whole number')
    .min(1, 'Square feet must be at least 1')
    .max(100000, 'Square feet cannot exceed 100,000'),

  yearBuilt: z.number()
    .int('Year built must be a whole number')
    .min(1800, 'Year built cannot be before 1800')
    .max(new Date().getFullYear() + 2, 'Year built cannot be more than 2 years in the future'),

  amenities: z.array(
    CommonValidationSchemas.shortText
      .max(50, 'Amenity name cannot exceed 50 characters')
  )
    .max(30, 'Cannot have more than 30 amenities')
    .refine(
      (amenities) => new Set(amenities).size === amenities.length,
      'Amenities must be unique'
    ),
};

// User validation schemas
export const UserValidationSchemas = {
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .refine(
      (username) => !username.startsWith('-') && !username.endsWith('-'),
      'Username cannot start or end with a hyphen'
    ),

  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'First name can only contain letters, spaces, apostrophes, and hyphens'
    )
    .trim(),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Last name can only contain letters, spaces, apostrophes, and hyphens'
    )
    .trim(),

  bio: z.string()
    .max(500, 'Bio cannot exceed 500 characters')
    .trim()
    .optional(),

  trustScore: z.number()
    .int('Trust score must be a whole number')
    .min(0, 'Trust score cannot be negative')
    .max(1000, 'Trust score cannot exceed 1000'),
};

// Review validation schemas
export const ReviewValidationSchemas = {
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),

  comment: CommonValidationSchemas.mediumText
    .min(10, 'Review comment must be at least 10 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters'),
};

// Search and filter validation schemas
export const SearchValidationSchemas = {
  query: CommonValidationSchemas.searchQuery.optional(),

  priceRange: z.object({
    min: CommonValidationSchemas.currency.optional(),
    max: CommonValidationSchemas.currency.optional(),
  }).refine(
    (range) => !range.min || !range.max || range.min <= range.max,
    'Minimum price cannot be greater than maximum price'
  ),

  bedroomRange: z.object({
    min: PropertyValidationSchemas.bedrooms.optional(),
    max: PropertyValidationSchemas.bedrooms.optional(),
  }).refine(
    (range) => !range.min || !range.max || range.min <= range.max,
    'Minimum bedrooms cannot be greater than maximum bedrooms'
  ),

  sortBy: z.enum([
    'price',
    'created_at',
    'updated_at',
    'title',
    'location',
    'bedrooms',
    'bathrooms',
    'square_feet',
    'year_built',
    'rating'
  ]).optional(),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .default(1),

  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
};

// Utility functions for validation
export const ValidationUtils = {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml: (html: string): string => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  /**
   * Validate and normalize email address
   */
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  /**
   * Generate a validation error response
   */
  createValidationErrorResponse: (error: ValidationError) => ({
    success: false,
    error,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Check if a string contains potentially harmful content
   */
  containsHarmfulContent: (content: string): boolean => {
    const harmfulPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /data:text\/html/i,
    ];

    return harmfulPatterns.some(pattern => pattern.test(content));
  },

  /**
   * Generate a secure random string for validation tokens
   */
  generateValidationToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

export default ValidationService;