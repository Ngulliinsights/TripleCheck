/**
 * Cache Service Migration Helper
 * 
 * Handles migration of existing cache service usage to core cache utilities
 */

import { promises as fs } from 'fs';
import { LegacyCacheAdapter } from '../../core/src/utils/migration';

export class CacheMigrationHelper {
  /**
   * Update cache service imports in a file
   */
  static async updateCacheImports(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Map of old imports to new imports
      const importMappings = [
        {
          old: /import\s*{\s*cacheService\s*}\s*from\s*["']\.\.\/\.\.\/src\/shared\/services\/CacheService["']/g,
          new: "import { cacheService } from '..\..\server\cache\CacheService'"
        },
        {
          old: /import\s*{\s*cacheService\s*as\s*enhancedCache\s*}\s*from\s*["']\.\.\/services\/CacheService["']/g,
          new: "import { cacheService as enhancedCache } from '..\..\server\cache\CacheService'"
        },
        {
          old: /import\s*{\s*CacheService\s*}\s*from\s*["']\.\.\/infrastructure\/cache["']/g,
          new: "import { CacheService } from '..\..\server\cache\CacheService'"
        },
        {
          old: /import\s*{\s*PropertyCacheService\s*}\s*from\s*["']\.\.\/infrastructure\/cache\/PropertyCacheService["']/g,
          new: "import { PropertyCacheService } from '..\..\server\infrastructure\cache\PropertyCacheService'"
        }
      ];

      // Apply import mappings
      for (const mapping of importMappings) {
        if (mapping.old.test(content)) {
          updatedContent = updatedContent.replace(mapping.old, mapping.new);
          hasChanges = true;
        }
      }

      // Update cache service instantiation patterns
      const instantiationMappings = [
        {
          old: /new CacheService\(\)/g,
          new: "cacheService"
        },
        {
          old: /CacheService\.getInstance\(\)/g,
          new: "cacheService"
        }
      ];

      for (const mapping of instantiationMappings) {
        if (mapping.old.test(updatedContent)) {
          updatedContent = updatedContent.replace(mapping.old, mapping.new);
          hasChanges = true;
        }
      }

      // Write updated content if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating cache imports in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Create legacy adapter for gradual migration
   */
  static createLegacyAdapter(coreCache: any): LegacyCacheAdapter {
    return new LegacyCacheAdapter(coreCache);
  }

  /**
   * Update cache method calls to use new API
   */
  static async updateCacheMethodCalls(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Map old method calls to new ones
      const methodMappings = [
        {
          old: /\.has\(/g,
          new: ".exists("
        },
        {
          old: /\.clear\(\)/g,
          new: ".flush()"
        },
        {
          old: /\.getStats\(\)/g,
          new: ".getMetrics()"
        }
      ];

      for (const mapping of methodMappings) {
        if (mapping.old.test(content)) {
          updatedContent = updatedContent.replace(mapping.old, mapping.new);
          hasChanges = true;
        }
      }

      // Update cache.set calls to use new options format
      const setCallRegex = /\.set\(([^,]+),\s*([^,]+),\s*{\s*ttl:\s*([^}]+)\s*}\)/g;
      if (setCallRegex.test(content)) {
        updatedContent = updatedContent.replace(setCallRegex, '.set($1, $2, $3)');
        hasChanges = true;
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating cache method calls in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Generate cache configuration migration
   */
  static generateCacheConfigMigration(): string {
    return `
// Cache Configuration Migration
// Old configuration pattern:
/*
const cacheConfig = {
  maxSize: 50 * 1024 * 1024,
  defaultTTL: 5 * 60 * 1000,
  enableCompression: true
};
*/

// New configuration pattern:
import { configManager } from '@triplecheck/core/config';

const cacheConfig = {
  maxMemoryMB: configManager.config.cache.maxMemoryMB,
  defaultTtlSec: configManager.config.cache.defaultTtlSec,
  compressionThreshold: configManager.config.cache.compressionThreshold
};
`;
  }

  /**
   * Validate cache migration
   */
  static async validateCacheMigration(filePath: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues: string[] = [];

      // Check for old import patterns
      if (content.includes('src/shared/services/CacheService')) {
        issues.push('Still using old cache service import path');
      }

      if (content.includes('server/infrastructure/cache/CacheService')) {
        issues.push('Still using old server cache service import path');
      }

      // Check for old method calls
      if (content.includes('.has(') && !content.includes('.exists(')) {
        issues.push('Using deprecated .has() method instead of .exists()');
      }

      if (content.includes('.clear()') && !content.includes('.flush()')) {
        issues.push('Using deprecated .clear() method instead of .flush()');
      }

      // Check for old instantiation patterns
      if (content.includes('new CacheService()')) {
        issues.push('Still instantiating CacheService directly');
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
}