/**
 * Migration Registry
 * 
 * Central registry for all database migrations with proper versioning,
 * dependency tracking, and metadata management.
 */

export interface MigrationMetadata {
  id: string;
  name: string;
  domain: string;
  version: string;
  timestamp: string; // ISO timestamp for ordering
  description: string;
  dependencies: string[];
  tags: string[];
  author: string;
  checksum: string;
  rollbackSupported: boolean;
}

export interface MigrationDefinition extends MigrationMetadata {
  up: string;
  down?: string;
  validate?: string; // Optional validation SQL
}

/**
 * Migration Registry - Central catalog of all migrations
 */
export class MigrationRegistry {
  private static instance: MigrationRegistry;
  private migrations: Map<string, MigrationDefinition> = new Map();
  private domainOrder: string[] = ['core', 'verification', 'trust', 'fraud', 'communication', 'analytics', 'performance'];

  static getInstance(): MigrationRegistry {
    if (!MigrationRegistry.instance) {
      MigrationRegistry.instance = new MigrationRegistry();
    }
    return MigrationRegistry.instance;
  }

  /**
   * Register a migration
   */
  register(migration: MigrationDefinition): void {
    // Validate migration format
    this.validateMigration(migration);
    
    // Check for duplicate IDs
    if (this.migrations.has(migration.id)) {
      throw new Error(`Migration with ID ${migration.id} is already registered`);
    }

    this.migrations.set(migration.id, migration);
  }

  /**
   * Get all migrations ordered by domain priority and timestamp
   */
  getAllMigrations(): MigrationDefinition[] {
    const migrations = Array.from(this.migrations.values());
    
    return migrations.sort((a, b) => {
      // First sort by domain priority
      const domainPriorityA = this.domainOrder.indexOf(a.domain);
      const domainPriorityB = this.domainOrder.indexOf(b.domain);
      
      if (domainPriorityA !== domainPriorityB) {
        return domainPriorityA - domainPriorityB;
      }
      
      // Then sort by timestamp
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  /**
   * Get migration by ID
   */
  getMigration(id: string): MigrationDefinition | undefined {
    return this.migrations.get(id);
  }

  /**
   * Get migrations by domain
   */
  getMigrationsByDomain(domain: string): MigrationDefinition[] {
    return Array.from(this.migrations.values())
      .filter(m => m.domain === domain)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get migrations by tag
   */
  getMigrationsByTag(tag: string): MigrationDefinition[] {
    return Array.from(this.migrations.values())
      .filter(m => m.tags.includes(tag))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Validate migration dependencies
   */
  validateDependencies(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const migration of this.migrations.values()) {
      for (const depId of migration.dependencies) {
        if (!this.migrations.has(depId)) {
          errors.push(`Migration ${migration.id} depends on non-existent migration ${depId}`);
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (migrationId: string): boolean => {
      if (recursionStack.has(migrationId)) {
        return true;
      }
      if (visited.has(migrationId)) {
        return false;
      }

      visited.add(migrationId);
      recursionStack.add(migrationId);

      const migration = this.migrations.get(migrationId);
      if (migration) {
        for (const depId of migration.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(migrationId);
      return false;
    };

    for (const migrationId of this.migrations.keys()) {
      if (!visited.has(migrationId) && hasCycle(migrationId)) {
        errors.push(`Circular dependency detected involving migration ${migrationId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get migration execution order respecting dependencies
   */
  getExecutionOrder(migrationIds?: string[]): string[] {
    const targetMigrations = migrationIds 
      ? migrationIds.filter(id => this.migrations.has(id))
      : Array.from(this.migrations.keys());

    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (migrationId: string): void => {
      if (visiting.has(migrationId)) {
        throw new Error(`Circular dependency detected involving migration ${migrationId}`);
      }
      if (visited.has(migrationId)) {
        return;
      }

      const migration = this.migrations.get(migrationId);
      if (!migration) {
        return;
      }

      visiting.add(migrationId);

      // Visit dependencies first
      for (const depId of migration.dependencies) {
        if (targetMigrations.includes(depId)) {
          visit(depId);
        }
      }

      visiting.delete(migrationId);
      visited.add(migrationId);
      sorted.push(migrationId);
    };

    for (const migrationId of targetMigrations) {
      if (!visited.has(migrationId)) {
        visit(migrationId);
      }
    }

    return sorted;
  }

  /**
   * Generate migration statistics
   */
  getStatistics(): {
    totalMigrations: number;
    byDomain: Record<string, number>;
    byTag: Record<string, number>;
    withRollback: number;
    withValidation: number;
  } {
    const migrations = Array.from(this.migrations.values());
    
    const byDomain: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    
    for (const migration of migrations) {
      byDomain[migration.domain] = (byDomain[migration.domain] || 0) + 1;
      
      for (const tag of migration.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
    }

    return {
      totalMigrations: migrations.length,
      byDomain,
      byTag,
      withRollback: migrations.filter(m => m.rollbackSupported).length,
      withValidation: migrations.filter(m => !!m.validate).length,
    };
  }

  /**
   * Validate migration format
   */
  private validateMigration(migration: MigrationDefinition): void {
    const required = ['id', 'name', 'domain', 'version', 'timestamp', 'up'];
    
    for (const field of required) {
      if (!migration[field as keyof MigrationDefinition]) {
        throw new Error(`Migration is missing required field: ${field}`);
      }
    }

    // Validate ID format: domain_version_name
    const idPattern = /^[a-z]+_\d{3}_[a-z0-9_]+$/;
    if (!idPattern.test(migration.id)) {
      throw new Error(`Migration ID ${migration.id} does not match required format: domain_version_name`);
    }

    // Validate domain
    if (!this.domainOrder.includes(migration.domain)) {
      throw new Error(`Invalid domain ${migration.domain}. Must be one of: ${this.domainOrder.join(', ')}`);
    }

    // Validate timestamp format
    if (isNaN(Date.parse(migration.timestamp))) {
      throw new Error(`Invalid timestamp format: ${migration.timestamp}`);
    }

    // Validate rollback support
    if (migration.rollbackSupported && !migration.down) {
      throw new Error(`Migration ${migration.id} claims rollback support but has no down migration`);
    }
  }

  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.migrations.clear();
  }

  /**
   * Get registry size
   */
  size(): number {
    return this.migrations.size;
  }
}

// Export singleton instance
export const migrationRegistry = MigrationRegistry.getInstance();