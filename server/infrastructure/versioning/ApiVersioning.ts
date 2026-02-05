/**
 * API Versioning Strategy for TripleCheck
 *
 * Provides comprehensive API versioning support with backward compatibility,
 * deprecation management, and migration utilities.
 */

import { Request, Response, NextFunction } from "express";

// Extend Request interface to include apiVersion
interface ExtendedRequest extends Request {
  apiVersion?: ApiVersionContext;
}
import { logger } from "../monitoring/logger";
import { performanceMonitor, MetricUnit, MetricCategory } from "../monitoring/PerformanceMonitor";

export interface ApiVersion {
  version: string;
  releaseDate: Date;
  deprecationDate?: Date;
  sunsetDate?: Date;
  status: VersionStatus;
  changes: VersionChange[];
  migrationGuide?: string;
}

export enum VersionStatus {
  CURRENT = "CURRENT",
  SUPPORTED = "SUPPORTED",
  DEPRECATED = "DEPRECATED",
  SUNSET = "SUNSET",
}

export interface VersionChange {
  type: ChangeType;
  endpoint?: string;
  field?: string;
  description: string;
  breakingChange: boolean;
  migrationPath?: string;
}

export enum ChangeType {
  ADDED = "ADDED",
  MODIFIED = "MODIFIED",
  REMOVED = "REMOVED",
  DEPRECATED = "DEPRECATED",
}

export interface VersioningConfig {
  defaultVersion: string;
  supportedVersions: string[];
  deprecationWarningDays: number;
  sunsetGracePeriodDays: number;
  headerName: string;
  queryParamName: string;
}

export interface ApiVersionContext {
  requestedVersion: string;
  resolvedVersion: string;
  isDeprecated: boolean;
  isSunset: boolean;
  deprecationDate?: Date | undefined;
  sunsetDate?: Date | undefined;
  migrationGuide?: string | undefined;
}

// Default versioning configuration
const DEFAULT_CONFIG: VersioningConfig = {
  defaultVersion: "v1",
  supportedVersions: ["v1", "v2"],
  deprecationWarningDays: 90,
  sunsetGracePeriodDays: 180,
  headerName: "API-Version",
  queryParamName: "version",
};

// API version registry
const VERSION_REGISTRY: Map<string, ApiVersion> = new Map();

/**
 * Initialize API versioning system with version definitions
 */
export function initializeVersioning(): void {
  // Register v1 - Legacy version
  registerVersion({
    version: "v1",
    releaseDate: new Date("2024-01-01"),
    deprecationDate: new Date("2024-06-01"),
    sunsetDate: new Date("2024-12-01"),
    status: VersionStatus.DEPRECATED,
    changes: [
      {
        type: ChangeType.DEPRECATED,
        description: "Legacy API version - migrate to v2",
        breakingChange: false,
        migrationPath: "/docs/migration/v1-to-v2",
      },
    ],
    migrationGuide: "/docs/migration/v1-to-v2",
  });

  // Register v2 - Current stable version
  registerVersion({
    version: "v2",
    releaseDate: new Date("2024-03-01"),
    status: VersionStatus.CURRENT,
    changes: [
      {
        type: ChangeType.ADDED,
        endpoint: "/api/v2/properties/verify",
        description: "Enhanced property verification with AI analysis",
        breakingChange: false,
      },
      {
        type: ChangeType.MODIFIED,
        endpoint: "/api/v2/properties",
        field: "verification_status",
        description: "Added comprehensive verification status enum",
        breakingChange: true,
        migrationPath: "/docs/migration/verification-status",
      },
      {
        type: ChangeType.ADDED,
        endpoint: "/api/v2/fraud-detection",
        description: "Real-time fraud detection endpoints",
        breakingChange: false,
      },
    ],
  });

  logger.info(
    "API versioning system initialized",
    `Supported versions: ${Array.from(VERSION_REGISTRY.keys()).join(", ")}, Default: ${DEFAULT_CONFIG.defaultVersion}`
  );
}

/**
 * Register a new API version
 */
export function registerVersion(version: ApiVersion): void {
  VERSION_REGISTRY.set(version.version, version);
  logger.info(
    `Registered API version: ${version.version}`,
    `Status: ${version.status}, Released: ${version.releaseDate.toISOString()}`
  );
}

/**
 * Get version information
 */
export function getVersion(version: string): ApiVersion | undefined {
  return VERSION_REGISTRY.get(version);
}

/**
 * Get all supported versions
 */
export function getSupportedVersions(): ApiVersion[] {
  return Array.from(VERSION_REGISTRY.values())
    .filter((v) => v.status !== VersionStatus.SUNSET)
    .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
}

/**
 * Get current version
 */
export function getCurrentVersion(): ApiVersion | undefined {
  return Array.from(VERSION_REGISTRY.values()).find(
    (v) => v.status === VersionStatus.CURRENT
  );
}

/**
 * Extract version from request
 */
export function extractVersionFromRequest(
  req: Request,
  config: VersioningConfig = DEFAULT_CONFIG
): string {
  // Check header first
  const headerVersion = req.headers[config.headerName.toLowerCase()] as string;
  if (headerVersion) {
    return headerVersion;
  }

  // Check query parameter
  const queryVersion = req.query[config.queryParamName] as string;
  if (queryVersion?.trim()) {
    return queryVersion;
  }

  // Check URL path (e.g., /api/v2/properties)
  const pathRegex = /\/api\/(v\d+)\//;
  const pathMatch = pathRegex.exec(req.path);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  // Return default version
  return config.defaultVersion;
}

/**
 * Resolve version context for request
 */
export function resolveVersionContext(
  requestedVersion: string,
  config: VersioningConfig = DEFAULT_CONFIG
): ApiVersionContext {
  let resolvedVersion = requestedVersion;

  // Check if requested version exists
  let versionInfo = VERSION_REGISTRY.get(requestedVersion);

  // If version doesn't exist, use default
  if (!versionInfo) {
    resolvedVersion = config.defaultVersion;
    versionInfo = VERSION_REGISTRY.get(resolvedVersion);
  }

  // If default version doesn't exist, use current
  if (!versionInfo) {
    const currentVersion = getCurrentVersion();
    if (currentVersion) {
      resolvedVersion = currentVersion.version;
      versionInfo = currentVersion;
    }
  }

  if (!versionInfo) {
    throw new Error("No valid API version found");
  }

  const now = new Date();
  const isDeprecated =
    versionInfo.status === VersionStatus.DEPRECATED ||
    Boolean(versionInfo.deprecationDate && versionInfo.deprecationDate <= now);
  const isSunset =
    versionInfo.status === VersionStatus.SUNSET ||
    Boolean(versionInfo.sunsetDate && versionInfo.sunsetDate <= now);

  return {
    requestedVersion,
    resolvedVersion,
    isDeprecated,
    isSunset,
    deprecationDate: versionInfo.deprecationDate,
    sunsetDate: versionInfo.sunsetDate,
    migrationGuide: versionInfo.migrationGuide,
  };
}

/**
 * API versioning middleware
 */
export function apiVersioningMiddleware(
  config: VersioningConfig = DEFAULT_CONFIG
) {
  return async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract and resolve version
      const requestedVersion = extractVersionFromRequest(req, config);
      const versionContext = resolveVersionContext(requestedVersion, config);

      // Check if version is sunset
      if (versionContext.isSunset) {
        res.status(410).json({
          error: "API_VERSION_SUNSET",
          message: `API version ${versionContext.requestedVersion} is no longer supported`,
          version: versionContext.requestedVersion,
          migration_guide: versionContext.migrationGuide,
        });
        return;
      }

      // Add version context to request
      req.apiVersion = versionContext;

      // Set response headers
      res.setHeader("API-Version", versionContext.resolvedVersion);
      res.setHeader(
        "API-Supported-Versions",
        config.supportedVersions.join(", ")
      );

      // Add deprecation warnings
      if (versionContext.isDeprecated) {
        res.setHeader("Deprecation", "true");
        if (versionContext.deprecationDate) {
          res.setHeader("Sunset", versionContext.deprecationDate.toISOString());
        }
        if (versionContext.migrationGuide) {
          res.setHeader(
            "Link",
            `<${versionContext.migrationGuide}>; rel="successor-version"`
          );
        }

        // Log deprecation usage
        logger.warn(
          "Deprecated API version used",
          `Version: ${versionContext.resolvedVersion}, Endpoint: ${req.path}, IP: ${req.ip || "unknown"}`
        );
      }

      // Performance monitoring
      performanceMonitor.recordMetric({
        name: "api_versioning_middleware_duration",
        category: MetricCategory.RESPONSE_TIME,
        value: 1,
        unit: MetricUnit.COUNT
      });

      next();
    } catch (error) {
      logger.error(
        "API versioning middleware error",
        `Error: ${error instanceof Error ? error.message : String(error)}, Path: ${req.path}`
      );

      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "API versioning error occurred",
      });
    }
  };
}

/**
 * Version-aware route wrapper
 */
export function versionedRoute(
  versions: string[],
  handler: (req: ExtendedRequest, res: Response, next: NextFunction) => void
) {
  return (req: ExtendedRequest, res: Response, next: NextFunction): void => {
    const { apiVersion } = req;

    if (!apiVersion) {
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "API version context not found",
      });
      return;
    }

    if (!versions.includes(apiVersion.resolvedVersion)) {
      res.status(404).json({
        error: "ENDPOINT_NOT_AVAILABLE",
        message: `Endpoint not available in API version ${apiVersion.resolvedVersion}`,
        supported_versions: versions,
      });
      return;
    }

    handler(req, res, next);
  };
}

/**
 * Get version-specific response transformer
 */
export function getResponseTransformer(
  version: string
): ((data: unknown) => unknown) | null {
  switch (version) {
    case "v1":
      return transformToV1Response;
    case "v2":
      return transformToV2Response;
    default:
      return null;
  }
}

/**
 * Transform response data for v1 compatibility
 */
function transformToV1Response(data: unknown): unknown {
  if (!data) return data;

  // Handle property verification status transformation
  if (
    typeof data === "object" &&
    data != null &&
    "verification_status" in data
  ) {
    const dataObj = data as Record<string, unknown>;
    const transformed = { ...dataObj };
    // v2 uses detailed enum, v1 uses simple boolean
    transformed.verified = dataObj.verification_status === "VERIFIED";
    delete transformed.verification_status;
    return transformed;
  }

  // Handle nested objects
  if (Array.isArray(data)) {
    return data.map(transformToV1Response);
  }

  if (typeof data === "object" && data != null) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Keys from Object.entries are always strings, but adding check for security
      if (typeof key === "string" && key.length > 0) {
        const safeKey = key.replace(/\W/g, "_"); // Sanitize key using concise regex
        // Use Object.defineProperty to safely set the property
        Object.defineProperty(transformed, safeKey, {
          value: transformToV1Response(value),
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return transformed;
  }

  return data;
}

/**
 * Transform response data for v2 format
 */
function transformToV2Response(data: unknown): unknown {
  // v2 is the current format, no transformation needed
  return data;
}

/**
 * Generate API version documentation
 */
export function generateVersionDocumentation(): Record<string, unknown> {
  const versions = Array.from(VERSION_REGISTRY.values());

  return {
    current_version: getCurrentVersion()?.version,
    supported_versions: getSupportedVersions().map((v) => v.version),
    versions: versions.map((version) => ({
      version: version.version,
      status: version.status,
      release_date: version.releaseDate.toISOString(),
      deprecation_date: version.deprecationDate?.toISOString(),
      sunset_date: version.sunsetDate?.toISOString(),
      changes: version.changes,
      migration_guide: version.migrationGuide,
    })),
    versioning_info: {
      header_name: DEFAULT_CONFIG.headerName,
      query_param_name: DEFAULT_CONFIG.queryParamName,
      default_version: DEFAULT_CONFIG.defaultVersion,
      deprecation_warning_days: DEFAULT_CONFIG.deprecationWarningDays,
      sunset_grace_period_days: DEFAULT_CONFIG.sunsetGracePeriodDays,
    },
  };
}

/**
 * Cleanup expired versions
 */
export function cleanupExpiredVersions(): void {
  const now = new Date();
  const expiredVersions: string[] = [];

  for (const [version, info] of VERSION_REGISTRY.entries()) {
    if (info.sunsetDate && info.sunsetDate < now) {
      expiredVersions.push(version);
    }
  }

  for (const version of expiredVersions) {
    VERSION_REGISTRY.delete(version);
    logger.info(`Removed expired API version: ${version}`);
  }
}

/**
 * Schedule periodic cleanup of expired versions
 */
export function scheduleVersionCleanup(): void {
  // Run cleanup every 24 hours
  setInterval(
    () => {
      try {
        cleanupExpiredVersions();
      } catch (error) {
        logger.error(
          "Error during version cleanup",
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    24 * 60 * 60 * 1000
  ); // 24 hours in milliseconds
}

// Types are already exported above, no need to re-export

// Export default configuration
export { DEFAULT_CONFIG };
