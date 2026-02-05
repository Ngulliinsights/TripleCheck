import { Response } from 'express';

import { HTTP_STATUS } from './constants';

// Generic API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: unknown[];
  metadata: ApiMetadata;
}

// API metadata interface
export interface ApiMetadata {
  totalCount?: number;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  verificationStatus?: string;
  riskLevel?: string;
  fraudDetectionPerformed?: boolean;
  requiresManualReview?: boolean;
  timestamp?: string;
  correlationId?: string;
  // API Versioning metadata
  supportedVersions?: string[];
  availableVersions?: string[];
  availableInVersions?: string[];
  currentVersion?: string;
  feature?: string;
  versioningMethods?: string[];
  versionDetails?: Array<{
    version: string;
    status: string;
    releaseDate: Date;
  }>;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

// Response helper class for consistent API responses
export class ResponseHelper {
  /**
   * Send successful response with data
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    metadata?: ApiMetadata,
    statusCode: number = HTTP_STATUS.OK
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || 'Success',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send successful response without data
   */
  static successMessage(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.OK
  ): void {
    const response: ApiResponse = {
      success: true,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: unknown[],
    metadata?: ApiMetadata
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors: errors || [],
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors: ValidationError[] = [],
    statusCode: number = HTTP_STATUS.BAD_REQUEST
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send authentication error response
   */
  static authError(
    res: Response,
    message: string = 'Authentication required',
    statusCode: number = HTTP_STATUS.UNAUTHORIZED
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send authorization error response
   */
  static authorizationError(
    res: Response,
    message: string = 'Insufficient permissions',
    statusCode: number = HTTP_STATUS.FORBIDDEN
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send not found error response
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(HTTP_STATUS.NOT_FOUND).json(response);
  }

  /**
   * Send conflict error response
   */
  static conflict(
    res: Response,
    message: string = 'Resource conflict'
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
    
    res.status(HTTP_STATUS.CONFLICT).json(response);
  }

  /**
   * Send rate limit error response
   */
  static rateLimited(
    res: Response,
    message: string = 'Too many requests',
    retryAfter?: number
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      metadata: {
        timestamp: new Date().toISOString(),
        ...(retryAfter && { retryAfter }),
      },
    };
    
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    metadata?: ApiMetadata
  ): void {
    ResponseHelper.success(res, data, message, metadata, HTTP_STATUS.CREATED);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    totalCount: number,
    page: number,
    limit: number,
    message?: string,
    additionalMetadata?: Partial<ApiMetadata>
  ): void {
    const metadata: ApiMetadata = {
      totalCount,
      page,
      limit,
      timestamp: new Date().toISOString(),
      ...additionalMetadata,
    };
    
    ResponseHelper.success(res, data, message, metadata);
  }
}

// Utility functions for common response patterns
export const sendSuccess = ResponseHelper.success;
export const sendError = ResponseHelper.error;
export const sendValidationError = ResponseHelper.validationError;
export const sendAuthError = ResponseHelper.authError;
export const sendAuthorizationError = ResponseHelper.authorizationError;
export const sendNotFound = ResponseHelper.notFound;
export const sendConflict = ResponseHelper.conflict;
export const sendRateLimited = ResponseHelper.rateLimited;
export const sendCreated = ResponseHelper.created;
export const sendPaginated = ResponseHelper.paginated;