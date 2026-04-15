/**
 * Property Validation Schemas with Zod
 * Consolidates all property-related validation
 */

import { z } from 'zod';

// Base property schema
export const PropertySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  location: z.string().min(3).max(200),
  address: z.string().nullable(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).nullable(),
  imageUrls: z.array(z.string().url()).max(20, 'Maximum 20 images allowed'),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  features: z.record(z.any()).nullable(),
  ownerId: z.number().int().positive(),
  aiVerificationResults: z.any().nullable(),
  viewCount: z.number().int().nonnegative().default(0),
  favoriteCount: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  availableFrom: z.date().nullable(),
  availableUntil: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Infer TypeScript type from schema
export type Property = z.infer<typeof PropertySchema>;

// Schema for creating a new property
export const CreatePropertySchema = PropertySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  favoriteCount: true,
  aiVerificationResults: true,
}).extend({
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
});

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;

// Schema for updating a property
export const UpdatePropertySchema = PropertySchema.partial().omit({
  id: true,
  createdAt: true,
  ownerId: true,
}).extend({
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
});

export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

// Schema for property search/filters
export const PropertySearchSchema = z.object({
  query: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  location: z.string().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  ownerId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'price', 'viewCount', 'favoriteCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PropertySearchInput = z.infer<typeof PropertySearchSchema>;

// Schema for property ID validation
export const PropertyIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid property ID').transform(Number),
});

export type PropertyIdInput = z.infer<typeof PropertyIdSchema>;

// Schema for bulk operations
export const BulkPropertyIdsSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export type BulkPropertyIdsInput = z.infer<typeof BulkPropertyIdsSchema>;

// Schema for property verification
export const PropertyVerificationSchema = z.object({
  propertyId: z.number().int().positive(),
  status: z.enum(['verified', 'rejected']),
  reason: z.string().optional(),
  verifiedBy: z.number().int().positive(),
  verificationDate: z.date().default(() => new Date()),
});

export type PropertyVerificationInput = z.infer<typeof PropertyVerificationSchema>;

export default {
  PropertySchema,
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertySearchSchema,
  PropertyIdSchema,
  BulkPropertyIdsSchema,
  PropertyVerificationSchema,
};
