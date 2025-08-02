/**
 * API Versioning Middleware
 * 
 * Handles API version detection, validation, and compatibility transformations
 */

import { Request, Response, NextFunction } from 'express';
import { apiVersionManager, VersionedRequest, ApiVersion } from './ApiVersionManager';
import { logger } from '../monitoring/logger';
import { ResponseHelper } from '../../utils/response-helpers';
import { HTTP_STATUS } from '../../utils/constants';

/**
 * Main versioning middleware that processes all API requests
 */
export const versioningMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract API version from request
    const apiVersion = apiVersionManager.extractVersion(req);
    
    // Check if version is supported
    if (!apiVersionManager.isVersionSupported(apiVersion)) {
      ResponseHelper.error(
        res,
        `API version ${apiVersion} is not supported or has been sunset`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        {
          supportedVersions: apiVersionManager.getSupportedVersions().map(v => v.version),
          migrationGuide: '/docs/api-versioning'
        }
      );
      return;
    }

    // Get version configuration
    const versionConfig = apiVersionManager.getVersionConfig(apiVersion);
    if (!versionConfig) {
      ResponseHelper.error(
        res,
        'Invalid API version configuration',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
      return;
    }

    // Attach version information to request
    req.apiVersion = apiVersion;
    req.versionConfig = versionConfig;
    req.isLatestVersion = apiVersion === 'v3'; // Update this dynamically

    // Check for deprecation warning
    const deprecationWarning = apiVersionManager.getDeprecationWarning(apiVersion);
    if (deprecationWarning) {
      req.deprecationWarning = deprecationWarning;
      // Add deprecation header
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', versionConfig.sunsetDate?.toISOString() || '');
      res.setHeader('Link', `</docs/migration/${apiVersion}-to-v3>; rel="successor-version"`);
    }

    // Add version headers to response
    res.setHeader('API-Version', apiVersion);
    res.setHeader('API-Version-Status', versionConfig.status);
    
    // Log version usage for analytics
    logger.info('API version detected', 'API_VERSIONING', {
      version: apiVersion,
      status: versionConfig.status,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      isDeprecated: !!deprecationWarning
    });

    next();
  } catch (error) {
    logger.error('Versioning middleware error', 'API_VERSIONING', { error });
    ResponseHelper.error(
      res,
      'API versioning error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Feature gate middleware - blocks access to features not supported in the requested version
 */
export const featureGate = (requiredFeatures: string[]) => {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    const { apiVersion } = req;
    
    // Check if all required features are supported in this version
    const unsupportedFeatures = requiredFeatures.filter(
      feature => !apiVersionManager.isFeatureSupported(apiVersion, feature)
    );

    if (unsupportedFeatures.length > 0) {
      const latestVersionWithFeatures = apiVersionManager.getSupportedVersions()
        .reverse()
        .find(config => 
          requiredFeatures.every(feature => 
            config.supportedFeatures.includes(feature)
          )
        );

      ResponseHelper.error(
        res,
        `Features not supported in API version ${apiVersion}`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        {
          unsupportedFeatures,
          requiredVersion: latestVersionWithFeatures?.version,
          upgradeRequired: true,
          migrationGuide: `/docs/migration/${apiVersion}-to-${latestVersionWithFeatures?.version}`
        }
      );
      return;
    }

    next();
  };
};

/**
 * Request transformation middleware - applies compatibility layers for older versions
 */
export const requestTransformMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { apiVersion } = req;
  
  // Only transform if not using the latest version
  if (!req.isLatestVersion) {
    try {
      // Apply compatibility transformation from requested version to latest
      const transformedBody = apiVersionManager.applyCompatibilityLayer(
        apiVersion,
        'v3', // Latest version
        req.body,
        'request'
      );
      
      req.body = transformedBody;
      
      logger.debug('Request transformed for compatibility', 'API_VERSIONING', {
        fromVersion: apiVersion,
        toVersion: 'v3',
        originalPath: req.path
      });
    } catch (error) {
      logger.error('Request transformation failed', 'API_VERSIONING', {
        version: apiVersion,
        error
      });
      // Continue without transformation rather than failing
    }
  }

  next();
};

/**
 * Response transformation middleware - transforms responses back to requested version format
 */
export const responseTransformMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Only transform if not using the latest version
  if (!req.isLatestVersion) {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to transform response
    res.json = function(body: any) {
      try {
        // Apply compatibility transformation from latest version to requested
        const transformedBody = apiVersionManager.applyCompatibilityLayer(
          'v3', // Latest version
          req.apiVersion,
          body,
          'response'
        );
        
        // Add deprecation warning to response if applicable
        if (req.deprecationWarning) {
          if (transformedBody && typeof transformedBody === 'object') {
            transformedBody.deprecationWarning = req.deprecationWarning;
          }
        }
        
        logger.debug('Response transformed for compatibility', 'API_VERSIONING', {
          fromVersion: 'v3',
          toVersion: req.apiVersion,
          path: req.path
        });
        
        return originalJson(transformedBody);
      } catch (error) {
        logger.error('Response transformation failed', 'API_VERSIONING', {
          version: req.apiVersion,
          error
        });
        // Return original response if transformation fails
        return originalJson(body);
      }
    };
  }

  next();
};

/**
 * Version-specific route middleware - ensures route is only accessible in specific versions
 */
export const versionSpecificRoute = (supportedVersions: ApiVersion[]) => {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    const { apiVersion } = req;
    
    if (!supportedVersions.includes(apiVersion)) {
      const latestSupportedVersion = supportedVersions
        .sort()
        .reverse()[0];
      
      ResponseHelper.error(
        res,
        `This endpoint is not available in API version ${apiVersion}`,
        HTTP_STATUS.NOT_FOUND,
        [],
        {
          supportedVersions,
          recommendedVersion: latestSupportedVersion,
          migrationGuide: `/docs/migration/${apiVersion}-to-${latestSupportedVersion}`
        }
      );
      return;
    }

    next();
  };
};

/**
 * Beta feature middleware - restricts access to beta features
 */
export const betaFeatureMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { versionConfig } = req;
  
  // Only allow beta features in beta versions or with explicit opt-in
  const betaOptIn = req.headers['x-beta-features'] === 'true';
  
  if (versionConfig.status !== 'beta' && !betaOptIn) {
    ResponseHelper.error(
      res,
      'This feature is currently in beta and requires opt-in',
      HTTP_STATUS.FORBIDDEN,
      [],
      {
        betaOptInRequired: true,
        betaOptInHeader: 'X-Beta-Features: true',
        betaVersion: 'v3'
      }
    );
    return;
  }

  // Add beta warning header
  res.setHeader('X-Beta-Feature', 'true');
  res.setHeader('X-Beta-Warning', 'This feature is in beta and may change without notice');

  next();
};

/**
 * Content negotiation middleware - handles version-specific content types
 */
export const contentNegotiationMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { apiVersion } = req;
  
  // Set appropriate content type based on version
  const contentType = `application/vnd.triplecheck.${apiVersion}+json`;
  res.setHeader('Content-Type', contentType);
  
  // Add version-specific cache headers
  if (req.versionConfig.status === 'deprecated') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  }

  next();
};

/**
 * Version analytics middleware - tracks version usage for metrics
 */
export const versionAnalyticsMiddleware = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  
  // Track response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log version usage analytics
    logger.info('API version usage', 'API_ANALYTICS', {
      version: req.apiVersion,
      status: req.versionConfig.status,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      isDeprecated: !!req.deprecationWarning,
      isLatestVersion: req.isLatestVersion
    });
  });

  next();
};

/**
 * Combined versioning middleware stack
 */
export const fullVersioningMiddleware = [
  versioningMiddleware,
  requestTransformMiddleware,
  responseTransformMiddleware,
  contentNegotiationMiddleware,
  versionAnalyticsMiddleware
];