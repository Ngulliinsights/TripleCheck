/**
 * Canonical API contract layer for the entire monorepo (client + server).
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
// META
// ============================================================================

export const MetaSchema = z.object({
  timestamp: z.string(),                    // ISO-8601
  requestId: z.string(),
  version:   z.string().default('1.0'),
});

export type ResponseMeta = z.infer<typeof MetaSchema>;

// ============================================================================
// ERROR DETAIL
// ============================================================================

export const ErrorDetailSchema = z.object({
  code:    z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

// ============================================================================
// ENVELOPES
// ============================================================================

// ── Generic (success | failure) ──────────────────────────────────────────────

/** Generic runtime schema — use SuccessResponseSchema<T> or ErrorResponseSchema for narrow validation. */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data:    z.unknown().optional(),
  error:   ErrorDetailSchema.optional(),
  meta:    MetaSchema,
});

/** Wide envelope type. Prefer SuccessResponse<T> or ErrorResponse at call sites. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?:   T;
  error?:  ErrorDetail;
  meta:    ResponseMeta;
};

// ── Success ───────────────────────────────────────────────────────────────────

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data:    dataSchema,
    meta:    MetaSchema,
  });

export type SuccessResponse<T> = {
  readonly success: true;
  readonly data:    T;
  readonly meta:    ResponseMeta;
};

// ── Error ─────────────────────────────────────────────────────────────────────

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
    data:    z.object({
      items:      z.array(itemSchema),
      pagination: PaginationSchema,
    }),
    meta: MetaSchema,
  });

export type PaginatedResponse<T> = {
  readonly success: true;
  readonly data: {
    readonly items:      T[];
    readonly pagination: Pagination;
  };
  readonly meta: ResponseMeta;
};

// ============================================================================
// HTTP STATUS CODES
// (const object — tree-shakeable, usable from plain JS)
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

// ============================================================================
// API ERROR CODES
// ============================================================================

export const ApiErrorCode = {
  VALIDATION_ERROR:     'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR:  'AUTHORIZATION_ERROR',
  NOT_FOUND:            'NOT_FOUND',
  CONFLICT:             'CONFLICT',
  RATE_LIMIT_EXCEEDED:  'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR:       'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE:  'SERVICE_UNAVAILABLE',
} as const;

export type ApiErrorCode = typeof ApiErrorCode[keyof typeof ApiErrorCode];

// ============================================================================
// API CONTRACT INTERFACE & REGISTRY
// ============================================================================

export interface ApiContract<TRequest = unknown, TResponse = unknown> {
  readonly method:          'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path:            string;
  readonly requestSchema?:  z.ZodType<TRequest>;
  readonly responseSchema:  z.ZodType<TResponse>;
  readonly description?:    string;
  readonly tags?:           readonly string[];
}

/** Extracts the request type from a typed ApiContract. */
export type ExtractRequest<T>  = T extends ApiContract<infer R, unknown> ? R : never;
/** Extracts the response type from a typed ApiContract. */
export type ExtractResponse<T> = T extends ApiContract<unknown, infer R> ? R : never;

export class ApiContractRegistry {
  private readonly contracts = new Map<string, ApiContract>();

  register<TReq, TRes>(name: string, contract: ApiContract<TReq, TRes>): this {
    if (this.contracts.has(name)) {
      throw new Error(`Contract "${name}" is already registered.`);
    }
    this.contracts.set(name, contract);
    return this;               // fluent — enables registry.register(...).register(...)
  }

  get<TReq = unknown, TRes = unknown>(name: string): ApiContract<TReq, TRes> | undefined {
    return this.contracts.get(name) as ApiContract<TReq, TRes> | undefined;
  }

  getAll(): ReadonlyMap<string, ApiContract> {
    return this.contracts;
  }

  /**
   * Validates `data` against the named contract's request schema.
   * @throws `z.ZodError` with field-level details on failure.
   * @throws `Error` if no request schema is registered for the contract.
   */
  validateRequest<T>(contractName: string, data: unknown): T {
    const contract = this.contracts.get(contractName);
    if (!contract?.requestSchema) {
      throw new Error(`No request schema registered for contract "${contractName}"`);
    }
    return contract.requestSchema.parse(data) as T;
  }

  /**
   * Validates `data` against the named contract's response schema.
   * @throws `z.ZodError` with field-level details on failure.
   * @throws `Error` if the contract is not found.
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