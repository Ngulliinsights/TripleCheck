// Enhanced API types with comprehensive error handling and response structures

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  metadata?: ResponseMetadata;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  stack?: string; // Only in development
}

export interface ResponseMetadata {
  requestId?: string;
  processingTime?: number;
  version?: string;
  rateLimit?: RateLimitInfo;
  pagination?: PaginationInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  metadata: ResponseMetadata & {
    pagination: PaginationInfo;
  };
}

// Request types with validation
export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchRequest extends PaginationRequest {
  query?: string;
  filters?: Record<string, any>;
}

// Error types for different scenarios
export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field: string;
  value?: any;
  constraints?: string[];
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_ERROR';
  details: {
    reason: 'invalid_credentials' | 'token_expired' | 'token_invalid' | 'missing_token';
  };
}

export interface AuthorizationError extends ApiError {
  code: 'AUTHORIZATION_ERROR';
  details: {
    requiredRole?: string;
    requiredPermissions?: string[];
    currentRole?: string;
  };
}

// HTTP status code mappings
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// API endpoint types
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  authenticated?: boolean;
  roles?: string[];
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
}

// Request/Response interceptor types
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => any;
}

export interface ResponseInterceptor {
  onResponse?: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>;
  onResponseError?: (error: any) => any;
}

export interface RequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Cache configuration types
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  strategy: 'lru' | 'fifo' | 'ttl';
  maxSize?: number;
  keyGenerator?: (config: RequestConfig) => string;
}

// Batch request types
export interface BatchRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

export interface BatchResponse {
  id: string;
  status: number;
  data?: any;
  error?: ApiError;
}

// WebSocket types
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeat?: {
    interval: number;
    message: string;
  };
}

// File upload types
export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  multiple?: boolean;
  compress?: boolean;
  quality?: number; // for image compression
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// API client configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  cache: CacheConfig;
  interceptors: {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
  };
  auth?: {
    type: 'bearer' | 'basic' | 'api_key';
    token?: string;
    refreshToken?: string;
    apiKey?: string;
  };
}