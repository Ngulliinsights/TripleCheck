/**
 * CANONICAL API contract layer for entire monorepo (client + server)
 *
 * Owns:
 *   - Envelope schemas & types  (ApiResponse, SuccessResponse, ErrorResponse)
 *   - Pagination schemas & types
 *   - HTTP status codes and API error codes
 *   - ApiContract interface and registry
 *
 * Rule: all other files derive response types from here — never redefine the envelope.
 */

import { z } from 'zod';

// ============================================================================
// SHARED META SCHEMA  (single definition, composed everywhere)
// ============================================================================

export const MetaSchema = z.object({
  timestamp: z.string(),   // ISO-8601
  requestId: z.string(),
  version:   z.string().default('1.0'),
});

export type ResponseMeta = z.infer<typeof MetaSchema>;

// ============================================================================
// ENVELOPE SCHEMAS
// ============================================================================

/** Error detail — used inside both ApiResponse and ErrorResponse. */
export const ErrorDetailSchema = z.object({
  code:    z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

// ── Generic envelope (union: success | failure) ───────────────────────────────

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data:    z.unknown().optional(),
  error:   ErrorDetailSchema.optional(),
  meta:    MetaSchema,
});

/** Generic envelope — prefer SuccessResponse<T> or ErrorResponse for narrow typing. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?:   T;
  error?:  ErrorDetail;
  meta:    ResponseMeta;
};

// ── Narrow success envelope ───────────────────────────────────────────────────

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data:    dataSchema,
    meta:    MetaSchema,
  });

export type SuccessResponse<T> = {
  success: true;
  data:    T;
  meta:    ResponseMeta;
};

// ── Narrow error envelope ─────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error:   ErrorDetailSchema,
  meta:    MetaSchema,
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// PAGINATION
// ============================================================================

export const PaginationSchema = z.object({
  page:       z.number().int().positive().default(1),
  limit:      z.number().int().positive().max(100).default(20),
  total:      z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext:    z.boolean(),
  hasPrev:    z.boolean(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items:      z.array(itemSchema),
      pagination: PaginationSchema,
    }),
    meta: MetaSchema,
  });

export type PaginatedResponse<T> = {
  success: true;
  data: {
    items:      T[];
    pagination: Pagination;
  };
  meta: ResponseMeta;
};

// ============================================================================
// HTTP STATUS CODES & ERROR CODES
// (const objects instead of enums — tree-shakeable, compatible with plain JS)
// ============================================================================

export const HttpStatus = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE:   503,
} as const;

export type HttpStatus = typeof HttpStatus[keyof typeof HttpStatus];

export const ApiErrorCode = {
  VALIDATION_ERROR:       'VALIDATION_ERROR',
  AUTHENTICATION_ERROR:   'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR:    'AUTHORIZATION_ERROR',
  NOT_FOUND:              'NOT_FOUND',
  CONFLICT:               'CONFLICT',
  RATE_LIMIT_EXCEEDED:    'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR:         'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE:    'SERVICE_UNAVAILABLE',
} as const;

export type ApiErrorCode = typeof ApiErrorCode[keyof typeof ApiErrorCode];

// ============================================================================
// API CONTRACT INTERFACE & REGISTRY
// ============================================================================

export interface ApiContract<TRequest = unknown, TResponse = unknown> {
  method:          'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path:            string;
  requestSchema?:  z.ZodType<TRequest>;
  responseSchema:  z.ZodType<TResponse>;
  description?:    string;
  tags?:           string[];
}

export type ExtractRequest<T>  = T extends ApiContract<infer R, unknown> ? R : never;
export type ExtractResponse<T> = T extends ApiContract<unknown, infer R> ? R : never;

export class ApiContractRegistry {
  private readonly contracts = new Map<string, ApiContract>();

  register<TRequest, TResponse>(
    name:     string,
    contract: ApiContract<TRequest, TResponse>,
  ): void {
    this.contracts.set(name, contract);
  }

  get<TRequest, TResponse>(name: string): ApiContract<TRequest, TResponse> | undefined {
    return this.contracts.get(name) as ApiContract<TRequest, TResponse> | undefined;
  }

  getAll(): ReadonlyMap<string, ApiContract> {
    return this.contracts;
  }

  /**
   * Validates `data` against the contract's request schema.
   * Throws a `z.ZodError` on failure (structured, not a plain Error string).
   */
  validateRequest<T>(contractName: string, data: unknown): T {
    const contract = this.contracts.get(contractName);
    if (!contract?.requestSchema) {
      throw new Error(`No request schema registered for contract "${contractName}"`);
    }
    // `.parse` throws ZodError directly — callers get field-level details
    return contract.requestSchema.parse(data) as T;
  }

  /**
   * Validates `data` against the contract's response schema.
   * Throws a `z.ZodError` on failure.
   */
  validateResponse<T>(contractName: string, data: unknown): T {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      throw new Error(`No contract registered for name "${contractName}"`);
    }
    return contract.responseSchema.parse(data) as T;
  }
}

/** Singleton registry — import and register contracts at app startup. */
export const apiRegistry = new ApiContractRegistry();