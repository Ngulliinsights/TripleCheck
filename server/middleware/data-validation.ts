import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

import { 
  insertPropertySchema, 
  insertUserSchema, 
  insertReviewSchema,
  PropertyFeaturesSchema 
} from "../../src/shared/schema";

// Enhanced error response interface
interface ValidationErrorResponse {
  error: string;
  details: Array<{
    field: string;
    message: string;
    received?: any;
  }>;
  timestamp: string;
}

// Generic validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request body
      const validatedData = schema.parse(req.body);
      
      // Replace the original body with validated data
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationErrorResponse = {
          error: "Validation failed",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date().toISOString()
        };
        
        return res.status(400).json(validationErrors);
      }
      
      // Handle unexpected errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: "Internal validation error",
        details: [],
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Specific validation middlewares
export const validateProperty = validateBody(insertPropertySchema);
export const validateUser = validateBody(insertUserSchema);
export const validateReview = validateBody(insertReviewSchema);

// Query parameter validation
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString()
        });
      }
      
      console.error('Query validation error:', error);
      return res.status(500).json({
        error: "Internal validation error",
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Property search query validation
export const PropertySearchSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
  bathrooms: z.coerce.number().min(0).max(20).optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio']).optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const validatePropertySearch = validateQuery(PropertySearchSchema);

// File upload validation
export const FileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().min(1),
  encoding: z.string(),
  mimetype: z.string().refine(
    (type) => type.startsWith('image/') || type === 'application/pdf',
    "Only images and PDF files are allowed"
  ),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB")
});

// Sanitization utilities
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function sanitizePropertyData(data: any): any {
  if (!data || typeof data !== 'object') return {};
  
  return {
    ...data,
    title: sanitizeString(data.title || ''),
    description: sanitizeString(data.description || ''),
    location: sanitizeString(data.location || ''),
    price: Math.max(0, parseInt(data.price) || 0),
    imageUrls: Array.isArray(data.imageUrls) 
      ? data.imageUrls.filter((url: any) => typeof url === 'string' && url.length > 0)
      : [],
    features: sanitizePropertyFeatures(data.features)
  };
}

export function sanitizePropertyFeatures(features: any): any {
  if (!features || typeof features !== 'object') {
    return {
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 1000,
      parkingSpaces: 0,
      amenities: [],
      petFriendly: false,
      furnished: false
    };
  }
  
  return {
    bedrooms: Math.max(0, Math.min(20, parseInt(features.bedrooms) || 0)),
    bathrooms: Math.max(0, Math.min(20, parseFloat(features.bathrooms) || 0)),
    squareFeet: Math.max(1, Math.min(100000, parseInt(features.squareFeet) || 1000)),
    parkingSpaces: Math.max(0, Math.min(20, parseInt(features.parkingSpaces) || 0)),
    yearBuilt: features.yearBuilt ? Math.max(1800, Math.min(new Date().getFullYear() + 5, parseInt(features.yearBuilt))) : undefined,
    amenities: Array.isArray(features.amenities) 
      ? features.amenities.filter((a: any) => typeof a === 'string' && a.trim().length > 0).slice(0, 20)
      : [],
    propertyType: ['apartment', 'house', 'condo', 'townhouse', 'studio'].includes(features.propertyType) 
      ? features.propertyType 
      : undefined,
    petFriendly: Boolean(features.petFriendly),
    furnished: Boolean(features.furnished)
  };
}

// Rate limiting for data-intensive operations
export function createRateLimit(windowMs: number, max: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (clientData.count >= max) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Please try again later",
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
}

// Database operation wrapper with error handling
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error('Database operation failed:', error);
    
    if (fallback !== undefined) {
      return { success: false, data: fallback, error: 'Operation failed, using fallback' };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}