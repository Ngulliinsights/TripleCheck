/**
 * API Versioning System - Main Export
 *
 * Comprehensive API versioning system with backward compatibility,
 * automatic migration, and interactive documentation.
 */

import { Express, Request, Response } from "express";

import { logger } from "../monitoring/logger";

export {
  ApiVersionManager,
  apiVersionManager,
  type ApiVersion,
  type VersionConfig,
  type VersionStatus,
  type VersionedRequest,
  type ApiCompatibilityLayer,
} from "./ApiVersionManager";

export {
  ApiVersioningMiddleware,
  apiVersioningMiddleware,
  versioningMiddleware,
  requireFeature,
  versionSpecificHandler,
  type VersioningOptions,
} from "./ApiVersioningMiddleware";

export {
  VersionedRoutes,
  versionedRoutes,
  type VersionedRouteConfig,
} from "./VersionedRoutes";

export {
  ApiDocumentationGenerator,
  apiDocumentationGenerator,
  type ApiEndpoint,
  type MigrationGuide,
  type BreakingChange,
} from "./ApiDocumentation";

// Import the instances we need
import { apiDocumentationGenerator } from "./ApiDocumentation";
import { versioningMiddleware } from "./ApiVersioningMiddleware";
import { apiVersionManager, type VersionedRequest } from "./ApiVersionManager";
import { versionedRoutes } from "./VersionedRoutes";

// Convenience function to setup versioning system
export function setupApiVersioning(app: Express): void {
  // Apply versioning middleware globally
  app.use("/api", (req: Request, res: Response, next: () => void) => {
    versioningMiddleware(req as VersionedRequest, res, next);
  });

  // Setup versioned routes
  app.use("/api", versionedRoutes.getRouter());

  // Setup documentation endpoints
  app.get("/docs", (req: Request, res: Response) => {
    apiDocumentationGenerator.generateInteractiveDocumentation(req, res);
  });
  app.get("/docs/api.json", (req: Request, res: Response) => {
    apiDocumentationGenerator.getDocumentationJson(req, res);
  });
  app.get(
    "/docs/migration/:fromVersion/:toVersion",
    (req: Request, res: Response) => {
      apiDocumentationGenerator.getMigrationGuide(req, res);
    }
  );

  // Version info endpoint
  app.get("/api/version", (req: Request, res: Response) => {
    const versionedReq = req as VersionedRequest;
    const stats = apiVersionManager.getVersionStats();
    const supportedVersions = apiVersionManager.getSupportedVersions();

    res.json({
      success: true,
      data: {
        stats,
        supportedVersions,
        currentVersion: versionedReq.apiVersion || "v1",
        latestVersion: stats.latestVersion,
        defaultVersion: stats.defaultVersion,
      },
      message: "API version information retrieved",
    });
  });

  logger.info("✅ API Versioning System initialized");
  logger.info("📚 Documentation available at: /docs");
  logger.info("🔄 Migration guides available at: /docs/migration/{from}/{to}");
}
