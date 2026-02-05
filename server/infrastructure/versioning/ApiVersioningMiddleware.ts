/**
 * API Versioning Middleware
 *
 * Handles version detection, validation, and request/response transformation
 * for seamless API version management.
 */

import { Request, Response, NextFunction } from "express";

import { HTTP_STATUS } from "../../utils/constants";
import { ResponseHelper } from "../../utils/response-helpers";
import { logger } from "../monitoring/logger";

import {
  apiVersionManager,
  VersionedRequest,
  ApiVersion,
} from "./ApiVersionManager";

export interface VersioningOptions {
  enforceVersioning?: boolean;
  allowBetaVersions?: boolean;
  logVersionUsage?: boolean;
  enableCompatibilityMode?: boolean;
  requireExplicitVersioning?: boolean;
}

// Define proper types for request handlers
export type VersionedRequestHandler = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
) => void;
export type VersionHandlerMap = Partial<
  Record<ApiVersion, VersionedRequestHandler>
>;

// Type-safe JSON response data
export interface JsonResponseData {
  [key: string]: unknown;
  _deprecationWarning?: string;
}

export class ApiVersioningMiddleware {
  private options: Required<VersioningOptions>;
  private versionUsageStats: Map<ApiVersion, number> = new Map();

  constructor(options: VersioningOptions = {}) {
    this.options = {
      enforceVersioning: options.enforceVersioning ?? true,
      allowBetaVersions: options.allowBetaVersions ?? false,
      logVersionUsage: options.logVersionUsage ?? true,
      enableCompatibilityMode: options.enableCompatibilityMode ?? true,
      requireExplicitVersioning: options.requireExplicitVersioning ?? false,
    };

    // Initialize usage stats
    apiVersionManager.getSupportedVersions().forEach((config) => {
      this.versionUsageStats.set(config.version, 0);
    });
  }

  /**
   * Main versioning middleware
   */
  versioningMiddleware = (
    req: VersionedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      // Extract version from request
      const requestedVersion = apiVersionManager.extractVersion(req);

      // Check if explicit versioning is required
      if (
        this.options.requireExplicitVersioning &&
        this.isDefaultVersion(req, requestedVersion)
      ) {
        ResponseHelper.error(
          res,
          "API version must be explicitly specified. Use Accept header, api-version header, or version query parameter.",
          HTTP_STATUS.BAD_REQUEST,
          undefined,
          {
            supportedVersions: apiVersionManager
              .getSupportedVersions()
              .map((v) => v.version),
            versioningMethods: [
              "Accept: application/vnd.triplecheck.v2+json",
              "api-version: v2",
              "?version=v2",
            ],
          }
        );
        return;
      }

      // Validate version support
      if (!apiVersionManager.isVersionSupported(requestedVersion)) {
        ResponseHelper.error(
          res,
          `API version '${requestedVersion}' is not supported or has been sunset.`,
          HTTP_STATUS.BAD_REQUEST,
          undefined,
          {
            supportedVersions: apiVersionManager
              .getSupportedVersions()
              .map((v) => v.version),
            versionDetails: apiVersionManager
              .getSupportedVersions()
              .map((v) => ({
                version: v.version,
                status: v.status,
                releaseDate: v.releaseDate,
              })),
          }
        );
        return;
      }

      // Get version configuration
      const versionConfig =
        apiVersionManager.getVersionConfig(requestedVersion);
      if (!versionConfig) {
        ResponseHelper.error(
          res,
          "Invalid API version configuration",
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        );
        return;
      }

      // Check beta version access
      if (versionConfig.status === "beta" && !this.options.allowBetaVersions) {
        ResponseHelper.error(
          res,
          `Beta version '${requestedVersion}' is not available in this environment.`,
          HTTP_STATUS.FORBIDDEN,
          undefined,
          {
            availableVersions: apiVersionManager
              .getSupportedVersions()
              .filter((v) => v.status !== "beta")
              .map((v) => v.version),
          }
        );
        return;
      }

      // Attach version information to request
      req.apiVersion = requestedVersion;
      req.versionConfig = versionConfig;
      req.isLatestVersion = this.isLatestVersion(requestedVersion);

      // Add deprecation warning if applicable
      const deprecationWarning =
        apiVersionManager.getDeprecationWarning(requestedVersion);
      if (deprecationWarning) {
        req.deprecationWarning = deprecationWarning;
        res.setHeader("Deprecation", "true");
        res.setHeader("Sunset", versionConfig.sunsetDate?.toISOString() || "");
        res.setHeader(
          "Link",
          `</docs/migration/${requestedVersion}>; rel="successor-version"`
        );
      }

      // Set version headers
      res.setHeader("API-Version", requestedVersion);
      res.setHeader("API-Version-Status", versionConfig.status);

      // Log version usage
      if (this.options.logVersionUsage) {
        this.logVersionUsage(requestedVersion, req);
      }

      // Apply request transformation if compatibility mode is enabled
      if (this.options.enableCompatibilityMode && !req.isLatestVersion) {
        this.applyRequestTransformation(req);
      }

      // Override res.json to apply response transformation
      if (this.options.enableCompatibilityMode && !req.isLatestVersion) {
        this.setupResponseTransformation(req, res);
      }

      next();
    } catch (error) {
      logger.error("API versioning middleware error", "API_VERSIONING", {
        error,
      });
      ResponseHelper.error(
        res,
        "API versioning error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };

  /**
   * Feature gate middleware - checks if feature is supported in requested version
   */
  requireFeature = (feature: string): VersionedRequestHandler => {
    return (req: VersionedRequest, res: Response, next: NextFunction): void => {
      if (!apiVersionManager.isFeatureSupported(req.apiVersion, feature)) {
        ResponseHelper.error(
          res,
          `Feature '${feature}' is not available in API version ${req.apiVersion}.`,
          HTTP_STATUS.NOT_IMPLEMENTED,
          undefined,
          {
            feature,
            currentVersion: req.apiVersion,
            availableInVersions: apiVersionManager
              .getSupportedVersions()
              .filter((v) => v.supportedFeatures.includes(feature))
              .map((v) => v.version),
          }
        );
        return;
      }
      next();
    };
  };

  /**
   * Version-specific route handler
   */
  versionSpecificHandler = (
    handlers: VersionHandlerMap
  ): VersionedRequestHandler => {
    return (req: VersionedRequest, res: Response, next: NextFunction): void => {
      // Use safe property access to prevent object injection
      const requestedVersion = req.apiVersion;
      const handler = this.getHandlerSafely(handlers, requestedVersion);

      if (!handler) {
        // Try to find a compatible handler
        const compatibleHandler = this.findCompatibleHandler(
          requestedVersion,
          handlers
        );
        if (compatibleHandler) {
          return compatibleHandler(req, res, next);
        }

        ResponseHelper.error(
          res,
          `No handler available for API version ${requestedVersion}`,
          HTTP_STATUS.NOT_IMPLEMENTED,
          undefined,
          {
            currentVersion: requestedVersion,
            availableVersions: Object.keys(handlers).filter((version) =>
              this.isValidApiVersion(version)
            ),
          }
        );
        return;
      }

      handler(req, res, next);
    };
  };

  /**
   * Safely retrieve handler from handlers map to prevent object injection
   */
  private getHandlerSafely(
    handlers: VersionHandlerMap,
    version: ApiVersion
  ): VersionedRequestHandler | undefined {
    // Validate that the version is a supported API version before using it as a key
    if (!this.isValidApiVersion(version)) {
      return undefined;
    }

    // Create a safe lookup map to prevent object injection
    const safeHandlers = new Map<ApiVersion, VersionedRequestHandler>();

    // Only add handlers for valid API versions
    for (const validVersion of apiVersionManager
      .getSupportedVersions()
      .map((v) => v.version)) {
      // Use Object.prototype.hasOwnProperty to safely check for the property
      if (Object.prototype.hasOwnProperty.call(handlers, validVersion)) {
        const handler = handlers[validVersion];
        if (handler) {
          safeHandlers.set(validVersion, handler);
        }
      }
    }

    return safeHandlers.get(version);
  }

  /**
   * Check if version string is a valid API version
   */
  private isValidApiVersion(version: string): version is ApiVersion {
    const supportedVersions = apiVersionManager
      .getSupportedVersions()
      .map((v) => v.version);
    return supportedVersions.includes(version as ApiVersion);
  }

  /**
   * Check if this is the default version (no explicit versioning)
   */
  private isDefaultVersion(req: Request, _version: ApiVersion): boolean {
    const hasVersionHeader =
      req.headers["api-version"] ||
      req.headers.accept?.includes("vnd.triplecheck");
    const hasVersionQuery = req.query.version;
    const versionPathRegex = /^\/api\/v\d+\//;
    const hasVersionPath = versionPathRegex.exec(req.path);

    return !hasVersionHeader && !hasVersionQuery && !hasVersionPath;
  }

  /**
   * Check if version is the latest
   */
  private isLatestVersion(version: ApiVersion): boolean {
    const versions = apiVersionManager
      .getSupportedVersions()
      .filter((v) => v.status === "active")
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

    return versions[0]?.version === version;
  }

  /**
   * Apply request transformation for backward compatibility
   */
  private applyRequestTransformation(req: VersionedRequest): void {
    const latestVersion = this.getLatestActiveVersion();
    if (req.apiVersion !== latestVersion) {
      const transformedBody = apiVersionManager.applyCompatibilityLayer(
        req.apiVersion,
        latestVersion,
        req,
        "request"
      );

      if (transformedBody !== req.body) {
        req.body = transformedBody;
        logger.debug("Applied request transformation", "API_VERSIONING", {
          fromVersion: req.apiVersion,
          toVersion: latestVersion,
        });
      }
    }
  }

  /**
   * Setup response transformation for backward compatibility
   */
  private setupResponseTransformation(
    req: VersionedRequest,
    res: Response
  ): void {
    const originalJson = res.json.bind(res);
    const latestVersion = this.getLatestActiveVersion();

    // Override res.json with type-safe implementation
    res.json = function (data: JsonResponseData) {
      if (req.apiVersion !== latestVersion) {
        const transformedData = apiVersionManager.applyCompatibilityLayer(
          latestVersion,
          req.apiVersion,
          data,
          "response"
        );

        // Use loose equality to handle both strict inequality and type coercion cases
        if (transformedData != data) {
          logger.debug("Applied response transformation", "API_VERSIONING", {
            fromVersion: latestVersion,
            toVersion: req.apiVersion,
          });
          return originalJson(transformedData);
        }
      }

      // Add deprecation warning to response if applicable
      if (
        req.deprecationWarning &&
        data &&
        typeof data === "object" &&
        data != null
      ) {
        const responseWithWarning: JsonResponseData = {
          ...data,
          _deprecationWarning: req.deprecationWarning,
        };
        return originalJson(responseWithWarning);
      }

      return originalJson(data);
    };
  }

  /**
   * Find compatible handler for version
   */
  private findCompatibleHandler(
    version: ApiVersion,
    handlers: VersionHandlerMap
  ): VersionedRequestHandler | null {
    // Get all available handler versions and validate them
    const availableVersions = Object.keys(handlers).filter((v) =>
      this.isValidApiVersion(v)
    ) as ApiVersion[];

    const sortedVersions = [...availableVersions].sort((a, b) => {
      const aNum = parseInt(a.replace("v", ""));
      const bNum = parseInt(b.replace("v", ""));
      return bNum - aNum; // Descending order
    });

    // Find the highest version that's still compatible
    const versionNum = parseInt(version.replace("v", ""));

    for (const availableVersion of sortedVersions) {
      const availableVersionNum = parseInt(availableVersion.replace("v", ""));

      if (availableVersionNum <= versionNum) {
        const handler = this.getHandlerSafely(handlers, availableVersion);
        if (handler) {
          return handler;
        }
      }
    }

    return null;
  }

  /**
   * Get latest active version
   */
  private getLatestActiveVersion(): ApiVersion {
    const versions = apiVersionManager
      .getSupportedVersions()
      .filter((v) => v.status === "active")
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

    return versions[0]?.version || "v1";
  }

  /**
   * Log version usage for analytics
   */
  private logVersionUsage(version: ApiVersion, req: Request): void {
    const currentCount = this.versionUsageStats.get(version) || 0;
    this.versionUsageStats.set(version, currentCount + 1);

    logger.info("API version used", "API_VERSIONING", {
      version,
      path: req.path,
      method: req.method,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
  }

  /**
   * Get version usage statistics
   */
  getUsageStats(): Record<ApiVersion, number> {
    // Create a safe stats object using Map iteration to prevent object injection
    const stats: Record<string, number> = {};

    // Use Map's forEach method which is safe from prototype pollution
    this.versionUsageStats.forEach((count, version) => {
      // Double-check that version is valid before using as object key
      if (this.isValidApiVersion(version)) {
        // Use Object.defineProperty to safely set the property
        Object.defineProperty(stats, version, {
          value: count,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    return stats as Record<ApiVersion, number>;
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.versionUsageStats.clear();
    apiVersionManager.getSupportedVersions().forEach((config) => {
      this.versionUsageStats.set(config.version, 0);
    });
  }
}

// Export singleton instance with default options
export const apiVersioningMiddleware = new ApiVersioningMiddleware({
  enforceVersioning: true,
  allowBetaVersions: process.env.NODE_ENV === "development",
  logVersionUsage: true,
  enableCompatibilityMode: true,
  requireExplicitVersioning: false,
});

// Export middleware functions for easy use
export const versioningMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  return apiVersioningMiddleware.versioningMiddleware(req, res, next);
};

export const requireFeature = (feature: string): VersionedRequestHandler => {
  return apiVersioningMiddleware.requireFeature(feature);
};

export const versionSpecificHandler = (
  handlers: Record<ApiVersion, VersionedRequestHandler>
) => {
  return apiVersioningMiddleware.versionSpecificHandler(handlers);
};
