import { z } from 'zod'

import {
  ApiContract,
  SuccessResponseSchema,
  PaginatedResponseSchema,
  apiContractRegistry,
} from '../api-contracts'

// Property Schemas
export const PropertySchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().positive(),
  location: z.string().min(1).max(100),
  type: z.enum(['residential', 'commercial', 'land']),
  status: z.enum(['available', 'sold', 'pending', 'withdrawn']),
  images: z.array(z.string().url()).default([]),
  features: z.object({
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    area: z.number().positive().optional(),
    parking: z.boolean().optional(),
    furnished: z.boolean().optional(),
  }).optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  trustScore: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  ownerId: z.string(),
});

export type Property = z.infer<typeof PropertySchema>;

// Property List Request Schema
const PropertyListRequestSchemaBase = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  type: z.enum(['residential', 'commercial', 'land']).optional(),
  status: z.enum(['available', 'sold', 'pending', 'withdrawn']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'createdAt', 'trustScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const PropertyListRequestSchema = PropertyListRequestSchemaBase.transform((data) => ({
  ...data,
  sortBy: data.sortBy || 'createdAt' as 'price' | 'createdAt' | 'trustScore',
  sortOrder: data.sortOrder || 'desc' as 'asc' | 'desc',
  page: data.page || 1 as number,
  limit: data.limit || 10 as number,
}));

export type PropertyListRequest = z.infer<typeof PropertyListRequestSchema>;

// Property Create Request Schema
export const PropertyCreateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().positive(),
  location: z.string().min(1).max(100),
  type: z.enum(['residential', 'commercial', 'land']),
  images: z.array(z.string().url()).default([]).transform(arr => arr.length > 0 ? arr : []),
  features: z.object({
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    area: z.number().positive().optional(),
    parking: z.boolean().optional(),
    furnished: z.boolean().optional(),
  }).optional(),
});

// Transform for create request to ensure images is string[]
const PropertyCreateRequestTransformed = PropertyCreateRequestSchema.transform((data) => ({
  ...data,
  images: data.images as string[],
}));

export type PropertyCreateRequest = z.infer<typeof PropertyCreateRequestTransformed>;

// Property Update Request Schema
export const PropertyUpdateRequestSchema = PropertyCreateRequestSchema.extend({
  status: z.enum(['available', 'sold', 'pending', 'withdrawn']).optional(),
}).partial();

export type PropertyUpdateRequest = z.infer<typeof PropertyUpdateRequestSchema>;

// Property Contracts
export const PropertyListContract: ApiContract<PropertyListRequest, any> = {
  method: 'GET',
  path: '/api/properties',
  requestSchema: PropertyListRequestSchemaBase as any,
  responseSchema: PaginatedResponseSchema(PropertySchema),
  description: 'Get paginated list of properties',
  tags: ['properties'],
};

export const PropertyGetContract: ApiContract<{ id: string }, any> = {
  method: 'GET',
  path: '/api/properties/:id',
  requestSchema: z.object({ id: z.string() }),
  responseSchema: SuccessResponseSchema(PropertySchema),
  description: 'Get property by ID',
  tags: ['properties'],
};

export const PropertyCreateContract: ApiContract<PropertyCreateRequest, any> = {
  method: 'POST',
  path: '/api/properties',
  requestSchema: PropertyCreateRequestTransformed as any,
  responseSchema: SuccessResponseSchema(PropertySchema),
  description: 'Create new property',
  tags: ['properties'],
};

export const PropertyUpdateContract: ApiContract<PropertyUpdateRequest & { id: string }, any> = {
  method: 'PUT',
  path: '/api/properties/:id',
  requestSchema: PropertyUpdateRequestSchema.extend({ id: z.string() }),
  responseSchema: SuccessResponseSchema(PropertySchema),
  description: 'Update property by ID',
  tags: ['properties'],
};

export const PropertyDeleteContract: ApiContract<{ id: string }, any> = {
  method: 'DELETE',
  path: '/api/properties/:id',
  requestSchema: z.object({ id: z.string() }),
  responseSchema: SuccessResponseSchema(z.object({ deleted: z.boolean() })),
  description: 'Delete property by ID',
  tags: ['properties'],
};

// Register contracts
apiContractRegistry.register('property.list', PropertyListContract);
apiContractRegistry.register('property.get', PropertyGetContract);
apiContractRegistry.register('property.create', PropertyCreateContract);
apiContractRegistry.register('property.update', PropertyUpdateContract);
apiContractRegistry.register('property.delete', PropertyDeleteContract);