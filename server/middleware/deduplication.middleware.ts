import { Request, Response, NextFunction } from "express";
import { RequestDeduplicator } from "../infrastructure/deduplication/RequestDeduplicator";
import { CacheService } from "../infrastructure/cache/CacheService";

/**
 * Configuration for deduplication middleware
 */
export interface DeduplicationMiddlewareConfig {
  enabled: boolean;
  ttl: number; // TTL in milliseconds
  skipPatterns: RegExp[]; // Patterns to skip deduplication
  forcePatterns: RegExp[]; // Patterns to force deduplication
  includeUserInKey: boolean; // Whether to include user ID in deduplication key
  includeHeaders: string[]; // Headers to include in deduplication key
}

/**
 * Extended Request interface with deduplication properties
 */
export interface DeduplicatedRequest extends Request {
  deduplication?: {
    key: string;
    hash: string;
    shouldDeduplicate: boolean;
    isFromCache: boolean;
  };
}

/**
 * Create deduplication middleware
 */
export function createDeduplicationMiddleware(
  config: Partial<DeduplicationMiddlewareConfig> = {},
  cache?: CacheService
) {
  const fullConfig: DeduplicationMiddlewareConfig = {
    enabled: true,
    ttl: 300000, // 5 minutes
    skipPatterns: [
      /^\/api\/auth\/login$/,
      /^\/api\/auth\/logout$/,
      /^\/api\/auth\/register$/,
      /^\/api\/payments\//,
      /^\/api\/communication\/messages$/, // Don't deduplicate message sending
    ],
    forcePatterns: [
      /^\/api\/analytics\/events$/,
      /^\/api\/professionals\/search$/,
      /^\/api\/properties\/search$/,
    ],
    includeUserInKey: true,
    includeHeaders: ["content-type", "accept"],
    ...config,
  };

  const deduplicator = RequestDeduplicator.getInstance(
    {
      defaultTtl: fullConfig.ttl,
      enableRedisBackup: !!cache,
    },
    cache
  );

  return async (
    req: DeduplicatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Skip if deduplication is disabled
      if (!fullConfig.enabled) {
        return next();
      }

      // Check if request should be skipped
      if (shouldSkipDeduplication(req, fullConfig)) {
        return next();
      }

      // Generate deduplication key and hash
      const deduplicationKey = generateDeduplicationKey(req, fullConfig);
      const requestHash = deduplicator.generateRequestHash(
        req.method,
        req.originalUrl,
        req.body,
        getRelevantHeaders(req, fullConfig.includeHeaders)
      );

      // Check if request should be deduplicated
      const shouldDeduplicate =
        deduplicator.shouldDeduplicate(req.method, req.path) ||
        fullConfig.forcePatterns.some((pattern) => pattern.test(req.path));

      // Add deduplication info to request
      req.deduplication = {
        key: deduplicationKey,
        hash: requestHash,
        shouldDeduplicate,
        isFromCache: false,
      };

      if (!shouldDeduplicate) {
        return next();
      }

      // Handle idempotent request
      const result = await deduplicator.handleIdempotentRequest(
        deduplicationKey,
        () => executeRequest(req, res, next),
        fullConfig.ttl
      );

      // If we got a cached result, send it directly
      if (result && result.fromCache) {
        req.deduplication.isFromCache = true;
        return res.status(result.status || 200).json({
          ...result.data,
          cached: true,
          requestId: req.headers["x-request-id"] || generateRequestId(),
        });
      }

      // Continue with normal request processing
      next();
    } catch (error) {
      console.error("Deduplication middleware error:", error);
      // Continue with normal request processing on error
      next();
    }
  };
}

/**
 * Middleware to add request ID for tracking
 */
export function addRequestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add request ID if not present
    if (!req.headers["x-request-id"]) {
      req.headers["x-request-id"] = generateRequestId();
    }

    // Add request ID to response headers
    res.setHeader("x-request-id", req.headers["x-request-id"]);

    next();
  };
}

/**
 * Middleware to handle idempotency keys
 */
export function idempotencyMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for idempotency key in headers
    const idempotencyKey = req.headers["idempotency-key"] as string;

    if (idempotencyKey) {
      // Validate idempotency key format
      if (!isValidIdempotencyKey(idempotencyKey)) {
        return res.status(400).json({
          success: false,
          error: "Invalid idempotency key format",
          message: "Idempotency key must be a valid UUID or hash",
        });
      }

      // Add to request for use in handlers
      (req as any).idempotencyKey = idempotencyKey;
    }

    next();
  };
}

// Helper functions

function shouldSkipDeduplication(
  req: DeduplicatedRequest,
  config: DeduplicationMiddlewareConfig
): boolean {
  // Skip if explicitly configured to skip
  if (config.skipPatterns.some((pattern) => pattern.test(req.path))) {
    return true;
  }

  // Skip for certain HTTP methods that shouldn't be deduplicated
  const nonDeduplicatableMethods = ["PATCH"];
  if (nonDeduplicatableMethods.includes(req.method.toUpperCase())) {
    return true;
  }

  // Skip if request has specific headers indicating it shouldn't be deduplicated
  if (req.headers["x-no-deduplication"] === "true") {
    return true;
  }

  return false;
}

function generateDeduplicationKey(
  req: DeduplicatedRequest,
  config: DeduplicationMiddlewareConfig
): string {
  const parts: string[] = [req.method.toUpperCase(), req.path];

  // Include user ID if configured and available
  if (config.includeUserInKey && req.session?.userId) {
    parts.push(`user:${req.session.userId}`);
  }

  // Include relevant headers
  const headers = getRelevantHeaders(req, config.includeHeaders);
  if (Object.keys(headers).length > 0) {
    parts.push(`headers:${JSON.stringify(headers)}`);
  }

  // Include body hash for POST/PUT requests
  if (["POST", "PUT"].includes(req.method.toUpperCase()) && req.body) {
    const bodyHash = require("crypto")
      .createHash("md5")
      .update(JSON.stringify(req.body))
      .digest("hex")
      .substring(0, 8);
    parts.push(`body:${bodyHash}`);
  }

  return parts.join("|");
}

function getRelevantHeaders(
  req: Request,
  includeHeaders: string[]
): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const headerName of includeHeaders) {
    const value = req.headers[headerName.toLowerCase()];
    if (value && typeof value === "string") {
      headers[headerName.toLowerCase()] = value;
    }
  }

  return headers;
}

async function executeRequest(
  req: DeduplicatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Capture the original res.json method
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;

    // Override res.status to capture status code
    res.status = (code: number) => {
      statusCode = code;
      return originalStatus(code);
    };

    // Override res.json to capture response
    res.json = (data: any) => {
      resolve({
        data,
        status: statusCode,
        fromCache: false,
      });
      return originalJson(data);
    };

    // Handle errors
    const errorHandler = (error: any) => {
      reject(error);
    };

    // Add error handler
    res.on("error", errorHandler);

    // Continue with request processing
    next();
  });
}

function generateRequestId(): string {
  return require("crypto").randomBytes(16).toString("hex");
}

function isValidIdempotencyKey(key: string): boolean {
  // Check if it's a valid UUID or hash format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const hashRegex = /^[0-9a-f]{16,64}$/i;

  return uuidRegex.test(key) || hashRegex.test(key);
}

/**
 * Express middleware for handling deduplication responses
 */
export function deduplicationResponseMiddleware() {
  return (req: DeduplicatedRequest, res: Response, next: NextFunction) => {
    // Add deduplication info to response if available
    if (req.deduplication) {
      res.setHeader("x-deduplication-key", req.deduplication.key);
      res.setHeader("x-from-cache", req.deduplication.isFromCache.toString());
    }

    next();
  };
}
