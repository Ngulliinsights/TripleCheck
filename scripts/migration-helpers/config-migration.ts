/**
 * Configuration Migration Helper
 * 
 * Handles migration of existing configuration patterns to core config utilities
 */

import { promises as fs } from 'fs';

export class ConfigMigrationHelper {
  /**
   * Update configuration imports in a file
   */
  static async updateConfigImports(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Add core config import if file uses process.env
      if (content.includes('process.env.') && !content.includes('@triplecheck/core/config')) {
        // Find the last import statement
        const importRegex = /^import\s+.*?;$/gm;
        const matches = [...content.matchAll(importRegex)];
        
        if (matches.length > 0) {
          const lastImport = matches[matches.length - 1];
          const insertPosition = lastImport.index! + lastImport[0].length;
          
          updatedContent = updatedContent.slice(0, insertPosition) + 
                          '\nimport { configManager } from \'@triplecheck/core/config\';' + 
                          updatedContent.slice(insertPosition);
          hasChanges = true;
        }
      }

      // Map environment variables to config manager
      const envMappings = [
        {
          old: /process\.env\.REDIS_URL/g,
          new: "configManager.config.cache.redisUrl"
        },
        {
          old: /process\.env\.CACHE_TTL/g,
          new: "configManager.config.cache.defaultTtlSec"
        },
        {
          old: /process\.env\.LOG_LEVEL/g,
          new: "configManager.config.log.level"
        },
        {
          old: /process\.env\.LOG_PRETTY/g,
          new: "configManager.config.log.pretty"
        },
        {
          old: /process\.env\.JWT_SECRET/g,
          new: "configManager.config.security.jwtSecret"
        },
        {
          old: /process\.env\.SESSION_SECRET/g,
          new: "configManager.config.security.sessionSecret"
        },
        {
          old: /process\.env\.DATABASE_URL/g,
          new: "configManager.config.database.url"
        },
        {
          old: /process\.env\.RATE_LIMIT_MAX/g,
          new: "configManager.config.rateLimit.max"
        },
        {
          old: /process\.env\.RATE_LIMIT_WINDOW/g,
          new: "configManager.config.rateLimit.windowMs"
        }
      ];

      for (const mapping of envMappings) {
        if (mapping.old.test(content)) {
          updatedContent = updatedContent.replace(mapping.old, mapping.new);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating config imports in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Update feature flag usage
   */
  static async updateFeatureFlags(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Update feature flag patterns
      const featureFlagUpdates = [
        {
          old: /process\.env\.FEATURE_([A-Z_]+)/g,
          new: "configManager.isFeatureEnabled('$1')"
        },
        {
          old: /isFeatureEnabled\('([^']+)'\)/g,
          new: "configManager.isFeatureEnabled('$1').enabled"
        }
      ];

      for (const update of featureFlagUpdates) {
        if (update.old.test(content)) {
          updatedContent = updatedContent.replace(update.old, update.new);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating feature flags in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Generate configuration migration guide
   */
  static generateConfigMigrationGuide(): string {
    return `
# Configuration Migration Guide

## Environment Variables Migration

### Old Pattern:
\`\`\`typescript
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cacheTimeout = parseInt(process.env.CACHE_TTL || '300');
const logLevel = process.env.LOG_LEVEL || 'info';
\`\`\`

### New Pattern:
\`\`\`typescript
import { configManager } from '@triplecheck/core/config';

const redisUrl = configManager.config.cache.redisUrl;
const cacheTimeout = configManager.config.cache.defaultTtlSec;
const logLevel = configManager.config.log.level;
\`\`\`

## Feature Flags Migration

### Old Pattern:
\`\`\`typescript
const enableNewFeature = process.env.FEATURE_NEW_FEATURE === 'true';
\`\`\`

### New Pattern:
\`\`\`typescript
import { configManager } from '@triplecheck/core/config';

const enableNewFeature = configManager.isFeatureEnabled('NEW_FEATURE').enabled;
\`\`\`

## Configuration Validation

The new configuration system provides automatic validation:

\`\`\`typescript
// Configuration is automatically validated on startup
// Invalid configurations will throw detailed errors
try {
  await configManager.load();
} catch (error) {
  console.error('Configuration validation failed:', error);
}
\`\`\`

## Hot Reloading

Configuration changes are automatically detected in development:

\`\`\`typescript
configManager.on('config:changed', (newConfig) => {
  console.log('Configuration updated:', newConfig);
});
\`\`\`
`;
  }

  /**
   * Validate configuration migration
   */
  static async validateConfigMigration(filePath: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues: string[] = [];

      // Check for unmigrated environment variables
      const envVarPattern = /process\.env\.([A-Z_]+)/g;
      const envVarMatches = [...content.matchAll(envVarPattern)];
      
      const knownMigrations = [
        'REDIS_URL', 'CACHE_TTL', 'LOG_LEVEL', 'LOG_PRETTY',
        'JWT_SECRET', 'SESSION_SECRET', 'DATABASE_URL',
        'RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW'
      ];

      for (const match of envVarMatches) {
        const envVar = match[1];
        if (knownMigrations.includes(envVar)) {
          issues.push(`Environment variable ${envVar} should be migrated to configManager`);
        }
      }

      // Check for old feature flag patterns
      if (content.includes('process.env.FEATURE_')) {
        issues.push('Feature flags should be migrated to configManager.isFeatureEnabled()');
      }

      // Check for missing config import
      if (envVarMatches.length > 0 && !content.includes('@triplecheck/core/config')) {
        issues.push('File uses environment variables but missing core config import');
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Error reading file: ${error}`]
      };
    }
  }

  /**
   * Create environment variable mapping
   */
  static createEnvVarMapping(): Record<string, string> {
    return {
      // Cache configuration
      'REDIS_URL': 'configManager.config.cache.redisUrl',
      'REDIS_HOST': 'configManager.config.cache.redisUrl', // Will need manual conversion
      'REDIS_PORT': 'configManager.config.cache.redisUrl', // Will need manual conversion
      'CACHE_TTL': 'configManager.config.cache.defaultTtlSec',
      'CACHE_TTL_SECONDS': 'configManager.config.cache.defaultTtlSec',
      
      // Logging configuration
      'LOG_LEVEL': 'configManager.config.log.level',
      'LOG_PRETTY': 'configManager.config.log.pretty',
      'ENABLE_PRETTY_LOGS': 'configManager.config.log.pretty',
      
      // Security configuration
      'JWT_SECRET': 'configManager.config.security.jwtSecret',
      'JWT_SECRET_KEY': 'configManager.config.security.jwtSecret',
      'SESSION_SECRET': 'configManager.config.security.sessionSecret',
      'SESSION_SECRET_KEY': 'configManager.config.security.sessionSecret',
      
      // Database configuration
      'DATABASE_URL': 'configManager.config.database.url',
      'DB_URL': 'configManager.config.database.url',
      'DB_MAX_CONNECTIONS': 'configManager.config.database.maxConnections',
      
      // Rate limiting configuration
      'RATE_LIMIT_MAX': 'configManager.config.rateLimit.max',
      'RATE_LIMIT_REQUESTS': 'configManager.config.rateLimit.max',
      'RATE_LIMIT_WINDOW': 'configManager.config.rateLimit.windowMs',
      'RATE_LIMIT_WINDOW_MS': 'configManager.config.rateLimit.windowMs',
      
      // Application configuration
      'NODE_ENV': 'configManager.config.app.environment',
      'PORT': 'configManager.config.app.port',
      'HOST': 'configManager.config.app.host'
    };
  }

  /**
   * Update configuration object patterns
   */
  static async updateConfigObjects(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Update configuration object patterns
      const configObjectUpdates = [
        {
          old: /const\s+config\s*=\s*{\s*redis:\s*{\s*url:\s*process\.env\.REDIS_URL/g,
          new: "const config = { redis: { url: configManager.config.cache.redisUrl"
        },
        {
          old: /cache:\s*{\s*ttl:\s*process\.env\.CACHE_TTL/g,
          new: "cache: { ttl: configManager.config.cache.defaultTtlSec"
        }
      ];

      for (const update of configObjectUpdates) {
        if (update.old.test(content)) {
          updatedContent = updatedContent.replace(update.old, update.new);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating config objects in ${filePath}:`, error);
      return false;
    }
  }
}