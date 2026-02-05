/**
 * Schema Validation Utilities
 * 
 * Provides comprehensive validation for database schemas including
 * consistency checking, foreign key integrity, and business rule validation.
 */

import postgres from '..\..\..\..\scripts\cleanup-redundancies';

import { ValidationResult } from '../index';

export interface SchemaValidationOptions {
  checkForeignKeys: boolean;
  checkIndexes: boolean;
  checkBusinessRules: boolean;
  strictMode: boolean;
}

export interface TableValidationResult {
  tableName: string;
  exists: boolean;
  columnCount: number;
  indexCount: number;
  foreignKeyCount: number;
  errors: string[];
  warnings: string[];
}

export class SchemaValidator {
  private sql: postgres.Sql;
  private options: SchemaValidationOptions;

  constructor(sql: postgres.Sql, options: Partial<SchemaValidationOptions> = {}) {
    this.sql = sql;
    this.options = {
      checkForeignKeys: true,
      checkIndexes: true,
      checkBusinessRules: true,
      strictMode: false,
      ...options
    };
  }

  /**
   * Validates all schemas with comprehensive checks
   */
  async validateAllSchemas(expectedTables: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let tablesValidated = 0;

    try {
      console.log('🔍 Starting comprehensive schema validation...');

      // Get current database state
      const existingTables = await this.getExistingTables();
      const foreignKeys = await this.getForeignKeyConstraints();
      const indexes = await this.getIndexInformation();

      // Validate each expected table
      for (const tableName of expectedTables) {
        const tableResult = await this.validateTable(tableName, existingTables, foreignKeys, indexes);
        
        errors.push(...tableResult.errors);
        warnings.push(...tableResult.warnings);
        
        if (tableResult.exists) {
          tablesValidated++;
        }
      }

      // Check for orphaned tables (exist in DB but not in schema)
      const orphanedTables = existingTables.filter(table => !expectedTables.includes(table));
      if (orphanedTables.length > 0) {
        warnings.push(`Found ${orphanedTables.length} orphaned tables in database: ${orphanedTables.join(', ')}`);
      }

      // Validate foreign key consistency
      if (this.options.checkForeignKeys) {
        const fkValidation = await this.validateForeignKeyConsistency(foreignKeys, expectedTables);
        errors.push(...fkValidation.errors);
        warnings.push(...fkValidation.warnings);
      }

      // Validate index effectiveness
      if (this.options.checkIndexes) {
        const indexValidation = await this.validateIndexEffectiveness(indexes);
        warnings.push(...indexValidation.warnings);
      }

      // Validate business rules
      if (this.options.checkBusinessRules) {
        const businessValidation = await this.validateBusinessRules();
        errors.push(...businessValidation.errors);
        warnings.push(...businessValidation.warnings);
      }

      console.log(`✅ Schema validation completed. Tables validated: ${tablesValidated}`);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        tablesValidated
      };
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      return {
        isValid: false,
        errors: [`Schema validation error: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        tablesValidated
      };
    }
  }

  /**
   * Validates a specific table
   */
  private async validateTable(
    tableName: string,
    existingTables: string[],
    foreignKeys: Map<string, any[]>,
    indexes: Map<string, any[]>
  ): Promise<TableValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const exists = existingTables.includes(tableName);
    if (!exists) {
      errors.push(`Table '${tableName}' is defined in schema but does not exist in database`);
      return {
        tableName,
        exists: false,
        columnCount: 0,
        indexCount: 0,
        foreignKeyCount: 0,
        errors,
        warnings
      };
    }

    // Get table details
    const columns = await this.getTableColumns(tableName);
    const tableForeignKeys = foreignKeys.get(tableName) || [];
    const tableIndexes = indexes.get(tableName) || [];

    // Validate table structure
    const structureValidation = this.validateTableStructure(tableName, columns);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    // Validate foreign keys
    const fkValidation = this.validateTableForeignKeys(tableName, tableForeignKeys);
    warnings.push(...fkValidation.warnings);

    // Validate indexes
    const indexValidation = this.validateTableIndexes(tableName, tableIndexes, columns);
    warnings.push(...indexValidation.warnings);

    return {
      tableName,
      exists: true,
      columnCount: columns.length,
      indexCount: tableIndexes.length,
      foreignKeyCount: tableForeignKeys.length,
      errors,
      warnings
    };
  }

  /**
   * Gets all existing tables from the database
   */
  private async getExistingTables(): Promise<string[]> {
    const result = await this.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    return result.map(row => row.table_name as string);
  }

  /**
   * Gets foreign key constraints
   */
  private async getForeignKeyConstraints(): Promise<Map<string, any[]>> {
    const result = await this.sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `;

    const foreignKeys = new Map<string, any[]>();
    for (const row of result) {
      const tableName = row.table_name as string;
      if (!foreignKeys.has(tableName)) {
        foreignKeys.set(tableName, []);
      }
      foreignKeys.get(tableName)!.push(row);
    }

    return foreignKeys;
  }

  /**
   * Gets index information
   */
  private async getIndexInformation(): Promise<Map<string, any[]>> {
    const result = await this.sql`
      SELECT 
        t.relname AS table_name,
        i.relname AS index_name,
        ix.indisunique AS is_unique,
        ix.indisprimary AS is_primary,
        a.attname AS column_name,
        a.attnum AS column_position
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
      AND t.relkind = 'r'
      ORDER BY t.relname, i.relname, a.attnum
    `;

    const indexes = new Map<string, any[]>();
    for (const row of result) {
      const tableName = row.table_name as string;
      if (!indexes.has(tableName)) {
        indexes.set(tableName, []);
      }
      indexes.get(tableName)!.push(row);
    }

    return indexes;
  }

  /**
   * Gets columns for a specific table
   */
  private async getTableColumns(tableName: string): Promise<any[]> {
    return await this.sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
  }

  /**
   * Validates table structure
   */
  private validateTableStructure(tableName: string, columns: any[]): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (columns.length === 0) {
      errors.push(`Table '${tableName}' has no columns`);
      return { errors, warnings };
    }

    const columnNames = columns.map(col => col.column_name as string);

    // Check for standard columns
    if (!columnNames.includes('id')) {
      if (this.options.strictMode) {
        errors.push(`Table '${tableName}' must have an 'id' column`);
      } else {
        warnings.push(`Table '${tableName}' does not have an 'id' column`);
      }
    }

    if (!columnNames.includes('created_at')) {
      warnings.push(`Table '${tableName}' does not have a 'created_at' column`);
    }

    if (!columnNames.includes('updated_at')) {
      warnings.push(`Table '${tableName}' does not have an 'updated_at' column`);
    }

    // Check for nullable primary key
    const idColumn = columns.find(col => col.column_name === 'id');
    if (idColumn && idColumn.is_nullable === 'YES') {
      errors.push(`Primary key 'id' in table '${tableName}' should not be nullable`);
    }

    return { errors, warnings };
  }

  /**
   * Validates table foreign keys
   */
  private validateTableForeignKeys(tableName: string, foreignKeys: any[]): { warnings: string[] } {
    const warnings: string[] = [];

    for (const fk of foreignKeys) {
      // Check cascade rules
      if (fk.delete_rule === 'NO ACTION') {
        warnings.push(`Foreign key '${tableName}.${fk.column_name}' uses NO ACTION delete rule, consider CASCADE or SET NULL`);
      }

      // Check naming convention
      if (!fk.column_name.endsWith('_id')) {
        warnings.push(`Foreign key column '${tableName}.${fk.column_name}' should follow naming convention (*_id)`);
      }
    }

    return { warnings };
  }

  /**
   * Validates table indexes
   */
  private validateTableIndexes(tableName: string, indexes: any[], columns: any[]): { warnings: string[] } {
    const warnings: string[] = [];

    // Check for primary key
    const hasPrimaryKey = indexes.some(idx => idx.is_primary);
    if (!hasPrimaryKey) {
      warnings.push(`Table '${tableName}' does not have a primary key`);
    }

    // Check for indexes on foreign key columns
    const foreignKeyColumns = columns
      .filter(col => col.column_name.endsWith('_id'))
      .map(col => col.column_name);

    for (const fkColumn of foreignKeyColumns) {
      const hasIndex = indexes.some(idx => 
        idx.column_name === fkColumn && !idx.is_primary
      );
      if (!hasIndex) {
        warnings.push(`Foreign key column '${tableName}.${fkColumn}' may benefit from an index`);
      }
    }

    return { warnings };
  }

  /**
   * Validates foreign key consistency across tables
   */
  private async validateForeignKeyConsistency(
    foreignKeys: Map<string, any[]>,
    expectedTables: string[]
  ): Promise<{ errors: string[], warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [tableName, fks] of foreignKeys.entries()) {
      for (const fk of fks) {
        const referencedTable = fk.foreign_table_name;
        
        // Check if referenced table exists in our expected tables
        if (!expectedTables.includes(referencedTable)) {
          warnings.push(`Table '${tableName}' references '${referencedTable}' which is not in expected schema tables`);
        }

        // Check for circular references (simplified check)
        const referencedTableFks = foreignKeys.get(referencedTable) || [];
        const hasCircularRef = referencedTableFks.some(refFk => refFk.foreign_table_name === tableName);
        if (hasCircularRef) {
          warnings.push(`Potential circular reference between '${tableName}' and '${referencedTable}'`);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates index effectiveness
   */
  private async validateIndexEffectiveness(indexes: Map<string, any[]>): Promise<{ warnings: string[] }> {
    const warnings: string[] = [];

    // This would require pg_stat_user_indexes which may not be available in all environments
    // For now, we'll do basic structural validation
    
    for (const [tableName, tableIndexes] of indexes.entries()) {
      // Check for duplicate indexes
      const indexColumns = new Map<string, string[]>();
      
      for (const idx of tableIndexes) {
        const key = `${idx.index_name}`;
        if (!indexColumns.has(key)) {
          indexColumns.set(key, []);
        }
        indexColumns.get(key)!.push(idx.column_name);
      }

      // Look for potentially redundant indexes
      const indexSignatures = Array.from(indexColumns.entries()).map(([name, cols]) => ({
        name,
        signature: cols.sort().join(',')
      }));

      const signatures = new Set<string>();
      for (const { name, signature } of indexSignatures) {
        if (signatures.has(signature)) {
          warnings.push(`Table '${tableName}' may have redundant indexes with signature: ${signature}`);
        }
        signatures.add(signature);
      }
    }

    return { warnings };
  }

  /**
   * Validates business rules
   */
  private async validateBusinessRules(): Promise<{ errors: string[], warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for common business rule violations
      
      // Check for invalid ratings (if reviews table exists)
      try {
        const invalidRatings = await this.sql`
          SELECT COUNT(*) as count FROM reviews
          WHERE rating < 1 OR rating > 5
        `;
        
        const count = Number(invalidRatings[0]?.count);
        if (count > 0) {
          errors.push(`Found ${count} reviews with invalid ratings (must be 1-5)`);
        }
      } catch {
        // Table might not exist, skip this check
      }

      // Check for invalid prices (if properties table exists)
      try {
        const invalidPrices = await this.sql`
          SELECT COUNT(*) as count FROM properties
          WHERE price <= 0
        `;
        
        const count = Number(invalidPrices[0]?.count);
        if (count > 0) {
          errors.push(`Found ${count} properties with invalid prices (must be positive)`);
        }
      } catch {
        // Table might not exist, skip this check
      }

      // Check for invalid trust scores (if users table exists)
      try {
        const invalidTrustScores = await this.sql`
          SELECT COUNT(*) as count FROM users
          WHERE trust_score < 0 OR trust_score > 100
        `;
        
        const count = Number(invalidTrustScores[0]?.count);
        if (count > 0) {
          errors.push(`Found ${count} users with invalid trust scores (must be 0-100)`);
        }
      } catch {
        // Table might not exist, skip this check
      }

    } catch (error) {
      warnings.push(`Business rule validation partially failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { errors, warnings };
  }
}