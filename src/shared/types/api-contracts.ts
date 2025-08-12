import { z } from 'zod';

// Base API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    version: z.string().default('1.0'),
  }),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
};

// Error Response Schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    version: z.string().default('1.0'),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Success Response Schema
export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string(),
      version: z.string().default('1.0'),
    }),
  });

export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
};

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// Paginated Response Schema
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationSchema,
    }),
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string(),
      version: z.string().default('1.0'),
    }),
  });

export type PaginatedResponse<T> = {
  success: true;
  data: {
    items: T[];
    pagination: Pagination;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
};

// API Contract Interface
export interface ApiContract<TRequest = unknown, TResponse = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  requestSchema?: z.ZodType<TRequest>;
  responseSchema: z.ZodType<TResponse>;
  description?: string;
  tags?: string[];
}

// Contract Registry
export class ApiContractRegistry {
  private contracts = new Map<string, ApiContract>();

  register<TRequest, TResponse>(
    name: string,
    contract: ApiContract<TRequest, TResponse>
  ): void {
    this.contracts.set(name, contract);
  }

  get<TRequest, TResponse>(
    name: string
  ): ApiContract<TRequest, TResponse> | undefined {
    return this.contracts.get(name) as ApiContract<TRequest, TResponse> | undefined;
  }

  getAll(): Map<string, ApiContract> {
    return new Map(this.contracts);
  }

  validateRequest<T>(contractName: string, data: unknown): T {
    const contract = this.contracts.get(contractName);
    if (!contract?.requestSchema) {
      throw new Error(`Contract ${contractName} not found or has no request schema`);
    }
    
    const result = contract.requestSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Request validation failed: ${result.error.message}`);
    }
    
    return result.data as T;
  }

  validateResponse<T>(contractName: string, data: unknown): T {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    const result = contract.responseSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Response validation failed: ${result.error.message}`);
    }
    
    return result.data as T;
  }
}

// Global contract registry instance
export const apiContractRegistry = new ApiContractRegistry();

// Common HTTP Status Codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Error Codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Request/Response Type Helpers
export type ExtractRequestType<T> = T extends ApiContract<infer R, any> ? R : never;
export type ExtractResponseType<T> = T extends ApiContract<any, infer R> ? R : never;