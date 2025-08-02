/**
 * API Versioning System - Main Export
 * 
 * Comprehensive API versioning system with backward compatibility,
 * automatic migration, and interactive documentation.
 */

export { 
  ApiVersionManager, 
  apiVersionManager,
  type ApiVersion,
  type VersionConfig,
  type VersionStatus,
  type VersionedRequest,
  type ApiCompatibilityLayer
} from './ApiVersionManager';

export {
  ApiVersioningMiddleware,
  apiVersioningMiddleware,
  versioningMiddleware,
  requireFeature,
  versionSpecificHandler,
  type VersioningOptions
} from './ApiVersioningMiddleware';

export {
  VersionedRoutes,
  versionedRoutes,
  type VersionedRouteConfig
} from './VersionedRoutes';

export {
  ApiDocumentationGenerator,
  apiDocumentationGenerator,
  type ApiEndpoint,
  type MigrationGuide,
  type BreakingChange
} from './ApiDocumentation';

// Convenience function to setup versioning system
export function setupApiVersioning(app: any): void {
  // Apply versioning middleware globally
  app.use('/api', versioningMiddleware);
  
  // Setup versioned routes
  app.use('/api', versionedRoutes.getRouter());
  
  // Setup documentation endpoints
  app.get('/docs', apiDocumentationGenerator.generateInteractiveDocumentation.bind(apiDocumentationGenerator));
  app.get('/docs/api.json', apiDocumentationGenerator.getDocumentationJson.bind(apiDocumentationGenerator));
  app.get('/docs/migration/:fromVersion/:toVersion', apiDocumentationGenerator.getMigrationGuide.bind(apiDocumentationGenerator));
  
  // Version info endpoint
  app.get('/api/version', (req: any, res: any) => {
    const stats = apiVersionManager.getVersionStats();
    const supportedVersions = apiVersionManager.getSupportedVersions();
    
    res.json({
      success: true,
      data: {
        stats,
        supportedVersions,
        currentVersion: req.apiVersion || 'v1',
        latestVersion: stats.latestVersion,
        defaultVersion: stats.defaultVersion
      },
      message: 'API version information retrieved'
    });
  });
  
  console.log('✅ API Versioning System initialized');
  console.log(`📚 Documentation available at: /docs`);
  console.log(`🔄 Migration guides available at: /docs/migration/{from}/{to}`);
}