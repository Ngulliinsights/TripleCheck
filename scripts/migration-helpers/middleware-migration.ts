/**
 * Middleware Migration Helper
 * 
 * Handles migration of existing middleware usage to core middleware utilities
 */

import { promises as fs } from 'fs';

export class MiddlewareMigrationHelper {
  /**
   * Update middleware imports in a file
   */
  static async updateMiddlewareImports(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Map of old middleware imports to new imports
      const importMappings = [
        {
          old: /import\s*{\s*requireAuth\s*,\s*AuthenticatedRequest\s*}\s*from\s*["']\.\.\/middleware\/auth\.middleware["']/g,
          new: "import { requireAuth, AuthenticatedRequest } from '@triplecheck/core/middleware'"
        },
        {
          old: /import\s*{\s*validateRequest\s*}\s*from\s*["']\.\.\/middleware\/validation\.middleware["']/g,
          new: "import { validateRequest } from '@triplecheck/core/middleware'"
        },
        {
          old: /import\s*{\s*cacheResponse\s*}\s*from\s*["']\.\.\/middleware\/cache\.middleware["']/g,
          new: "import { cacheResponse } from '@triplecheck/core/middleware'"
        },
        {
          old: /import\s*{\s*rateLimitMiddleware\s*}\s*from\s*["']\.\.\/middleware\/rate-limiting\.middleware["']/g,
          new: "import { rateLimitMiddleware } from '@triplecheck/core/middleware'"
        },
        {
          old: /import\s*{\s*errorHandlerMiddleware\s*}\s*from\s*["']\.\.\/middleware\/error["']/g,
          new: "import { errorHandlerMiddleware } from '@triplecheck/core/middleware'"
        }
      ];

      // Apply import mappings
      for (const mapping of importMappings) {
        if (mapping.old.test(content)) {
          updatedContent = updatedContent.replace(mapping.old, mapping.new);
          hasChanges = true;
        }
      }

      // Update middleware usage patterns
      const usageUpdates = [
        {
          old: /app\.use\(requireAuth\)/g,
          new: "app.use(requireAuth)"
        },
        {
          old: /router\.use\(requireAuth\)/g,
          new: "router.use(requireAuth)"
        }
      ];

      for (const update of usageUpdates) {
        if (update.old.test(updatedContent)) {
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
      console.error(`Error updating middleware imports in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Update validation middleware usage
   */
  static async updateValidationMiddleware(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Update validation middleware patterns
      const validationUpdates = [
        {
          old: /validateRequest\(\{\s*body:\s*([^}]+)\s*\}\)/g,
          new: "validateRequest({ body: $1 })"
        },
        {
          old: /validateRequest\(\{\s*query:\s*([^}]+)\s*\}\)/g,
          new: "validateRequest({ query: $1 })"
        },
        {
          old: /validateRequest\(\{\s*params:\s*([^}]+)\s*\}\)/g,
          new: "validateRequest({ params: $1 })"
        }
      ];

      for (const update of validationUpdates) {
        if (update.old.test(content)) {
          updatedContent = updatedContent.replace(update.old, update.new);
          hasChanges = true;
        }
      }

      // Update validation schema imports
      if (content.includes('CommonValidationSchemas')) {
        updatedContent = updatedContent.replace(
          /import\s*{\s*CommonValidationSchemas\s*}\s*from\s*["'][^"']+["']/g,
          "import { CommonValidationSchemas } from '../../core/src/validation'"
        );
        hasChanges = true;
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating validation middleware in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Update auth middleware usage
   */
  static async updateAuthMiddleware(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Update auth middleware patterns
      const authUpdates = [
        {
          old: /requireRole\(\['([^']+)'\]\)/g,
          new: "requireRole('$1')"
        },
        {
          old: /requireRole\(\[([^\]]+)\]\)/g,
          new: "requireRole([$1])"
        }
      ];

      for (const update of authUpdates) {
        if (update.old.test(content)) {
          updatedContent = updatedContent.replace(update.old, update.new);
          hasChanges = true;
        }
      }

      // Update session management calls
      if (content.includes('SessionManager.')) {
        updatedContent = updatedContent.replace(
          /import\s*{\s*SessionManager\s*}\s*from\s*["'][^"']+["']/g,
          "import { SessionManager } from '@triplecheck/core/middleware'"
        );
        hasChanges = true;
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error updating auth middleware in ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Generate middleware configuration migration
   */
  static generateMiddlewareConfigMigration(): string {
    return `
// Middleware Configuration Migration
// Old middleware setup pattern:
/*
app.use(requireAuth);
app.use(validateRequest({ body: userSchema }));
app.use(cacheResponse({ ttl: 300 }));
*/

// New middleware setup pattern:
import { 
  requireAuth, 
  validateRequest, 
  cacheResponse,
  createMiddlewareChain 
} from '@triplecheck/core/middleware';

// Individual middleware usage (same as before)
app.use(requireAuth);
app.use(validateRequest({ body: userSchema }));
app.use(cacheResponse({ ttl: 300 }));

// Or use middleware chain for better organization
const authChain = createMiddlewareChain([
  requireAuth,
  validateRequest({ body: userSchema }),
  cacheResponse({ ttl: 300 })
]);

app.use('/api/protected', authChain);
`;
  }

  /**
   * Validate middleware migration
   */
  static async validateMiddlewareMigration(filePath: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues: string[] = [];

      // Check for old import patterns
      if (content.includes('../middleware/auth.middleware')) {
        issues.push('Still using old auth middleware import path');
      }

      if (content.includes('../middleware/validation.middleware')) {
        issues.push('Still using old validation middleware import path');
      }

      if (content.includes('../middleware/cache.middleware')) {
        issues.push('Still using old cache middleware import path');
      }

      // Check for deprecated patterns
      if (content.includes('validateBody(') || content.includes('validateQuery(')) {
        issues.push('Using deprecated validation methods instead of validateRequest');
      }

      // Check for missing core imports
      if (content.includes('requireAuth') && !content.includes('@triplecheck/core/middleware')) {
        issues.push('Using requireAuth without core middleware import');
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
   * Update error handling middleware
   */
  static async updateErrorHandlingMiddleware(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // Update error handling imports
      const errorHandlingUpdates = [
        {
          old: /import\s*{\s*asyncHandler\s*}\s*from\s*["']\.\.\/middleware\/error["']/g,
          new: "import { asyncHandler } from '@triplecheck/core/middleware'"
        },
        {
          old: /import\s*{\s*errorHandler\s*}\s*from\s*["']\.\.\/middleware\/error["']/g,
          new: "import { errorHandler } from '@triplecheck/core/middleware'"
        }
      ];

      for (const update of errorHandlingUpdates) {
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
      console.error(`Error updating error handling middleware in ${filePath}:`, error);
      return false;
    }
  }
}