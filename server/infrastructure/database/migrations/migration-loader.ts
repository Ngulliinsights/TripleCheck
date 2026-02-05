/**
 * Migration Loader
 * 
 * Loads and registers migrations from the organized directory structure.
 * Handles automatic discovery and validation of migration files.
 */

import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';

import { migrationRegistry, MigrationDefinition } from './migration-registry';

interface MigrationFile {
  domain: string;
  filename: string;
  filepath: string;
  content: string;
}

export class MigrationLoader {
  private migrationsPath: string;
  private domains = ['core', 'verification', 'trust', 'fraud', 'communication', 'analytics', 'performance'];

  constructor(migrationsPath: string = join(process.cwd(), 'database/migrations')) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Load all migrations from the directory structure
   */
  async loadAllMigrations(): Promise<void> {
    console.log('📋 Loading database migrations...');
    
    const migrationFiles = await this.discoverMigrationFiles();
    
    for (const file of migrationFiles) {
      const migration = await this.parseMigrationFile(file);
      migrationRegistry.register(migration);
    }

    // Validate dependencies after all migrations are loaded
    const validation = migrationRegistry.validateDependencies();
    if (!validation.isValid) {
      throw new Error(`Migration dependency validation failed:\n${validation.errors.join('\n')}`);
    }

    const stats = migrationRegistry.getStatistics();
    console.log(`✅ Loaded ${stats.totalMigrations} migrations across ${Object.keys(stats.byDomain).length} domains`);
    
    // Log domain breakdown
    for (const [domain, count] of Object.entries(stats.byDomain)) {
      console.log(`   📁 ${domain}: ${count} migrations`);
    }
  }

  /**
   * Discover all migration files in the directory structure
   */
  private async discoverMigrationFiles(): Promise<MigrationFile[]> {
    const migrationFiles: MigrationFile[] = [];

    for (const domain of this.domains) {
      const domainPath = join(this.migrationsPath, domain);
      
      if (!existsSync(domainPath)) {
        console.log(`⚠️  Domain directory not found: ${domain}`);
        continue;
      }

      try {
        const files = await readdir(domainPath);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        for (const filename of sqlFiles) {
          const filepath = join(domainPath, filename);
          const content = await readFile(filepath, 'utf-8');
          
          migrationFiles.push({
            domain,
            filename,
            filepath,
            content
          });
        }
      } catch (error) {
        console.warn(`⚠️  Failed to read domain directory ${domain}:`, error);
      }
    }

    return migrationFiles;
  }

  /**
   * Parse a migration file and extract metadata
   */
  private async parseMigrationFile(file: MigrationFile): Promise<MigrationDefinition> {
    const { domain, filename, filepath, content } = file;

    // Extract version from filename (e.g., "001_create_tables.sql" -> "001")
    const versionMatch = filename.match(/^(\d{3})_/);
    if (!versionMatch) {
      throw new Error(`Migration file ${filename} does not follow naming convention: ###_description.sql`);
    }
    const version = versionMatch[1];

    // Generate migration ID: domain_version_description
    const description = filename.replace(/^\d{3}_/, '').replace('.sql', '');
    const id = `${domain}_${version}_${description}`;

    // Extract metadata from comments
    const metadata = this.extractMetadata(content);
    
    // Extract SQL sections
    const sqlSections = this.extractSqlSections(content);

    // Calculate checksum
    const checksum = this.calculateChecksum(sqlSections.up);

    // Generate timestamp from file stats or use current time
    const timestamp = metadata.timestamp || new Date().toISOString();

    return {
      id,
      name: metadata.name || this.formatName(description),
      domain,
      version,
      timestamp,
      description: metadata.description || this.formatName(description),
      dependencies: metadata.dependencies || [],
      tags: metadata.tags || [domain],
      author: metadata.author || 'system',
      checksum,
      rollbackSupported: !!sqlSections.down,
      up: sqlSections.up,
      down: sqlSections.down,
      validate: sqlSections.validate,
    };
  }

  /**
   * Extract metadata from migration file comments
   */
  private extractMetadata(content: string): {
    name?: string;
    description?: string;
    dependencies?: string[];
    tags?: string[];
    author?: string;
    timestamp?: string;
  } {
    const metadata: any = {};

    // Extract metadata from comments
    const metadataRegex = /--\s*@(\w+):\s*(.+)/gi;
    let match;

    while ((match = metadataRegex.exec(content)) !== null) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();

      switch (key) {
        case 'name':
          metadata.name = value;
          break;
        case 'description':
          metadata.description = value;
          break;
        case 'depends':
        case 'dependencies':
          metadata.dependencies = value.split(',').map(d => d.trim());
          break;
        case 'tags':
          metadata.tags = value.split(',').map(t => t.trim());
          break;
        case 'author':
          metadata.author = value;
          break;
        case 'timestamp':
          metadata.timestamp = value;
          break;
      }
    }

    return metadata;
  }

  /**
   * Extract SQL sections from migration content
   */
  private extractSqlSections(content: string): {
    up: string;
    down?: string;
    validate?: string;
  } {
    const sections: any = {};

    // Extract UP section (main migration)
    const upMatch = content.match(/--\s*@up\s*start\s*\n([\s\S]*?)(?:--\s*@up\s*end|--\s*@down\s*start|--\s*@validate\s*start|$)/i);
    if (upMatch) {
      sections.up = upMatch[1].trim();
    } else {
      // If no explicit @up section, use everything before @down or @validate
      const beforeDownMatch = content.match(/^([\s\S]*?)(?:--\s*@down\s*start|--\s*@validate\s*start|$)/i);
      sections.up = beforeDownMatch ? beforeDownMatch[1].replace(/^--.*$/gm, '').trim() : content.trim();
    }

    // Extract DOWN section (rollback)
    const downMatch = content.match(/--\s*@down\s*start\s*\n([\s\S]*?)(?:--\s*@down\s*end|--\s*@validate\s*start|$)/i);
    if (downMatch) {
      sections.down = downMatch[1].trim();
    }

    // Extract VALIDATE section (validation queries)
    const validateMatch = content.match(/--\s*@validate\s*start\s*\n([\s\S]*?)(?:--\s*@validate\s*end|$)/i);
    if (validateMatch) {
      sections.validate = validateMatch[1].trim();
    }

    return sections;
  }

  /**
   * Calculate SHA-256 checksum of content
   */
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content.trim()).digest('hex');
  }

  /**
   * Format description into a readable name
   */
  private formatName(description: string): string {
    return description
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Reload migrations (useful for development)
   */
  async reloadMigrations(): Promise<void> {
    migrationRegistry.clear();
    await this.loadAllMigrations();
  }
}

// Export singleton instance
export const migrationLoader = new MigrationLoader();