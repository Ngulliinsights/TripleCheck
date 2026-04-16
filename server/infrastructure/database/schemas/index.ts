/**
 * Schema Management System
 * 
 * Centralized management of all database schemas with validation
 * and consistency checking.
 */

import postgres from '../../../../scripts/cleanup-redundancies';

import { ValidationResult } from '../index';

export interface SchemaDefinition {
  name: string;
  version: string;
  tables: TableDefinition[];
  relationships: RelationshipDefinition[];
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ConstraintDefinition {
  name: string;
  type: 'CHECK' | 'UNIQUE' | 'FOREIGN_KEY' | 'PRIMARY_KEY';
  definition: string;
}

export interface RelationshipDefinition {
  name: string;
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  referencedKey: string;
}

export interface SchemaMetadata {
  name: string;
  version: string;
  tables: string[];
  loadedAt: Date;
  dependencies?: string[];
}

export class SchemaManager {
  private schemas: Map<string, SchemaDefinition> = new Map();
  private loadedSchemas: any = null;
  private schemaMetadata: Map<string, SchemaMetadata> = new Map();

  /**
   * Loads all database schemas from the consolidated location
   */
  async loadSchemas(): Promise<any> {
    if (this.loadedSchemas) {
      return this.loadedSchemas;
    }

    try {
      console.log('📋 Loading database schemas...');
      
      // Import core schemas
      const coreSchemas = await import('./core');
      
      // Import domain-specific schemas (these will be populated as we consolidate)
      const trustSchemas = await import('./trust');
      const verificationSchemas = await import('./verification');
      const fraudSchemas = await import('./fraud');
      const communicationSchemas = await import('./communication');
      const analyticsSchemas = await import('./analytics');

      // Combine all schemas
      this.loadedSchemas = {
        ...coreSchemas,
        ...trustSchemas.trustSchemas,
        ...verificationSchemas.verificationSchemas,
        ...fraudSchemas.fraudSchemas,
        ...communicationSchemas.communicationSchemas,
        ...analyticsSchemas.analyticsSchemas
      };

      // Store schema metadata for validation
      this.schemaMetadata.set('core', {
        name: 'core',
        version: '1.0.0',
        tables: this.extractTableNames(coreSchemas),
        loadedAt: new Date()
      });

      console.log(`✅ Database schemas loaded successfully (${Object.keys(this.loadedSchemas).length} entities)`);
      return this.loadedSchemas;
    } catch (error) {
      console.error('❌ Failed to load database schemas:', error);
      throw new Error(`Schema loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets schema metadata for a specific domain
   */
  getSchemaMetadata(domain: string): SchemaMetadata | undefined {
    return this.schemaMetadata.get(domain);
  }

  /**
   * Gets all loaded schema metadata
   */
  getAllSchemaMetadata(): SchemaMetadata[] {
    return Array.from(this.schemaMetadata.values());
  }

  /**
   * Extracts table names from a schema module
   */
  private extractTableNames(schemaModule: any): string[] {
    const tableNames: string[] = [];
    
    for (const [key, value] of Object.entries(schemaModule)) {
      // Check if this is a Drizzle table (has a getSQL method or similar table properties)
      if (value && typeof value === 'object' && 'getSQL' in value) {
        tableNames.push(key);
      }
    }
    
    return tableNames;
  }

  /**
   * Validates all loaded schemas for consistency and integrity
   */
  async validateSchemas(sql: postgres.Sql): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating database schemas...');

      if (!this.loadedSchemas) {
        await this.loadSchemas();
      }

      // Use the comprehensive schema validator
      const { SchemaValidator } = await import('./validation');
      const validator = new SchemaValidator(sql, {
        checkForeignKeys: true,
        checkIndexes: true,
        checkBusinessRules: true,
        strictMode: false
      });

      // Get expected table names from loaded schemas
      const expectedTables = this.extractTableNames(this.loadedSchemas);
      
      // Run comprehensive validation
      const result = await validator.validateAllSchemas(expectedTables);

      console.log(`✅ Schema validation completed. Tables validated: ${result.tablesValidated}`);
      return result;
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      return {
        isValid: false,
        errors: [`Schema validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        tablesValidated: 0
      };
    }
  }

  /**
   * Extracts table names from loaded schemas
   */
  private extractTableNames(schemas: any): string[] {
    const tableNames: string[] = [];
    
    for (const [key, value] of Object.entries(schemas)) {
      // Check if this is a Drizzle table (has a getSQL method or similar table properties)
      if (value && typeof value === 'object' && ('getSQL' in value || 'dbName' in value)) {
        tableNames.push(key);
      }
    }
    
    return tableNames;
  }
}