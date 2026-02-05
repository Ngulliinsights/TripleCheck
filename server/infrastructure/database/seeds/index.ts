/**
 * Database Seeding System
 * 
 * Comprehensive seeding system for different environments and scenarios.
 * Supports development, testing, performance, and production seeding.
 */

import postgres from '..\..\..\..\scripts\cleanup-redundancies';

import { databaseService } from '../service';
import { UnifiedDataGenerator } from './UnifiedDataGenerator';

// Create alias for backward compatibility
export const DataGenerator = UnifiedDataGenerator;

export interface SeedingOptions {
  scenario: keyof typeof DATA_SCENARIOS;
  clearExisting: boolean;
  validateResults: boolean;
  dryRun: boolean;
  verbose: boolean;
}

export interface SeedingResult {
  success: boolean;
  scenario: string;
  duration: number;
  generationResult?: GenerationResult;
  error?: string;
  summary: {
    totalRecords: number;
    tablesSeeded: string[];
    validationPassed: boolean;
  };
}

/**
 * Main seeding class
 */
export class DatabaseSeeder {
  private sql: postgres.Sql;
  private options: SeedingOptions;

  constructor(sql: postgres.Sql, options: SeedingOptions) {
    this.sql = sql;
    this.options = options;
  }

  /**
   * Execute seeding process
   */
  async seed(): Promise<SeedingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🌱 Starting database seeding for ${this.options.scenario} scenario...`);
      
      if (this.options.dryRun) {
        console.log('🔍 DRY RUN MODE - No data will be written');
      }

      // Validate database connection
      await this.validateConnection();

      // Clear existing data if requested
      if (this.options.clearExisting && !this.options.dryRun) {
        await this.clearExistingData();
      }

      // Generate data
      const generationResult = this.options.dryRun 
        ? this.createDryRunResult()
        : await generateDataForScenario(this.sql, this.options.scenario);

      // Validate results if requested
      if (this.options.validateResults && !this.options.dryRun) {
        await this.validateSeedingResults();
      }

      const duration = Date.now() - startTime;
      const totalRecords = Object.values(generationResult.recordsGenerated)
        .reduce((sum, count) => sum + count, 0);

      console.log(`✅ Seeding completed successfully in ${duration}ms`);
      console.log(`📊 Generated ${totalRecords} records across multiple tables`);

      return {
        success: true,
        scenario: this.options.scenario,
        duration,
        generationResult,
        summary: {
          totalRecords,
          tablesSeeded: this.getSeededTables(generationResult),
          validationPassed: generationResult.validationResults?.invalidRecords === 0 || false
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('❌ Seeding failed:', errorMessage);
      
      return {
        success: false,
        scenario: this.options.scenario,
        duration,
        error: errorMessage,
        summary: {
          totalRecords: 0,
          tablesSeeded: [],
          validationPassed: false
        }
      };
    }
  }

  /**
   * Validate database connection
   */
  private async validateConnection(): Promise<void> {
    try {
      await this.sql`SELECT 1 as test`;
      console.log('✅ Database connection validated');
    } catch (error) {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clear existing data
   */
  private async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    
    try {
      // Clear in reverse dependency order to avoid foreign key violations
      const clearQueries = [
        'DELETE FROM reviews',
        'DELETE FROM transactions', 
        'DELETE FROM land_verifications',
        'DELETE FROM properties',
        'DELETE FROM users'
      ];

      for (const query of clearQueries) {
        const result = await this.sql.unsafe(query);
        if (this.options.verbose) {
          console.log(`   Cleared table: ${query.split(' ')[2]}`);
        }
      }
      
      console.log('✅ Existing data cleared');
    } catch (error) {
      throw new Error(`Failed to clear existing data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate seeding results
   */
  private async validateSeedingResults(): Promise<void> {
    console.log('🔍 Validating seeding results...');
    
    try {
      // Check record counts
      const counts = await this.getTableCounts();
      const expectedCounts = DATA_SCENARIOS[this.options.scenario].volumes;
      
      const validations = [
        { table: 'users', actual: counts.users, expected: expectedCounts.users },
        { table: 'properties', actual: counts.properties, expected: expectedCounts.properties },
        { table: 'reviews', actual: counts.reviews, expected: expectedCounts.reviews },
        { table: 'transactions', actual: counts.transactions, expected: expectedCounts.transactions },
        { table: 'verifications', actual: counts.verifications, expected: expectedCounts.verifications }
      ];

      for (const validation of validations) {
        if (validation.actual !== validation.expected) {
          console.warn(`⚠️ ${validation.table}: expected ${validation.expected}, got ${validation.actual}`);
        } else if (this.options.verbose) {
          console.log(`✅ ${validation.table}: ${validation.actual} records`);
        }
      }

      // Check foreign key integrity
      await this.validateForeignKeyIntegrity();
      
      console.log('✅ Seeding validation completed');
    } catch (error) {
      throw new Error(`Seeding validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current table counts
   */
  private async getTableCounts(): Promise<{
    users: number;
    properties: number;
    reviews: number;
    transactions: number;
    verifications: number;
  }> {
    const [users, properties, reviews, transactions, verifications] = await Promise.all([
      this.sql`SELECT COUNT(*) as count FROM users`,
      this.sql`SELECT COUNT(*) as count FROM properties`,
      this.sql`SELECT COUNT(*) as count FROM reviews`,
      this.sql`SELECT COUNT(*) as count FROM transactions`,
      this.sql`SELECT COUNT(*) as count FROM land_verifications`
    ]);

    return {
      users: parseInt(users[0].count),
      properties: parseInt(properties[0].count),
      reviews: parseInt(reviews[0].count),
      transactions: parseInt(transactions[0].count),
      verifications: parseInt(verifications[0].count)
    };
  }

  /**
   * Validate foreign key integrity
   */
  private async validateForeignKeyIntegrity(): Promise<void> {
    const violations = [];

    // Check properties -> users
    const orphanedProperties = await this.sql`
      SELECT COUNT(*) as count 
      FROM properties p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE u.id IS NULL
    `;
    
    if (parseInt(orphanedProperties[0].count) > 0) {
      violations.push(`${orphanedProperties[0].count} properties with invalid user references`);
    }

    // Check reviews -> properties and users
    const orphanedReviews = await this.sql`
      SELECT COUNT(*) as count 
      FROM reviews r 
      LEFT JOIN properties p ON r.property_id = p.id 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE p.id IS NULL OR u.id IS NULL
    `;
    
    if (parseInt(orphanedReviews[0].count) > 0) {
      violations.push(`${orphanedReviews[0].count} reviews with invalid references`);
    }

    if (violations.length > 0) {
      throw new Error(`Foreign key violations found: ${violations.join(', ')}`);
    }
  }

  /**
   * Create dry run result
   */
  private createDryRunResult(): GenerationResult {
    const scenario = DATA_SCENARIOS[this.options.scenario];
    
    return {
      success: true,
      recordsGenerated: scenario.volumes,
      duration: 0,
      errors: [],
      warnings: ['DRY RUN - No data was actually generated']
    };
  }

  /**
   * Get list of seeded tables
   */
  private getSeededTables(result: GenerationResult): string[] {
    const tables = [];
    
    if (result.recordsGenerated.users > 0) tables.push('users');
    if (result.recordsGenerated.properties > 0) tables.push('properties');
    if (result.recordsGenerated.reviews > 0) tables.push('reviews');
    if (result.recordsGenerated.transactions > 0) tables.push('transactions');
    if (result.recordsGenerated.verifications > 0) tables.push('land_verifications');
    
    return tables;
  }
}

/**
 * Convenience functions for common seeding scenarios
 */

/**
 * Seed development data
 */
export async function seedDevelopmentData(sql: postgres.Sql): Promise<SeedingResult> {
  const seeder = new DatabaseSeeder(sql, {
    scenario: 'development',
    clearExisting: true,
    validateResults: true,
    dryRun: false,
    verbose: true
  });
  
  return await seeder.seed();
}

/**
 * Seed testing data
 */
export async function seedTestingData(sql: postgres.Sql): Promise<SeedingResult> {
  const seeder = new DatabaseSeeder(sql, {
    scenario: 'testing',
    clearExisting: true,
    validateResults: true,
    dryRun: false,
    verbose: false
  });
  
  return await seeder.seed();
}

/**
 * Seed performance testing data
 */
export async function seedPerformanceData(sql: postgres.Sql): Promise<SeedingResult> {
  const seeder = new DatabaseSeeder(sql, {
    scenario: 'performance',
    clearExisting: true,
    validateResults: false, // Skip validation for performance
    dryRun: false,
    verbose: true
  });
  
  return await seeder.seed();
}

/**
 * Seed minimal data for quick testing
 */
export async function seedMinimalData(sql: postgres.Sql): Promise<SeedingResult> {
  const seeder = new DatabaseSeeder(sql, {
    scenario: 'minimal',
    clearExisting: true,
    validateResults: true,
    dryRun: false,
    verbose: true
  });
  
  return await seeder.seed();
}

/**
 * Dry run seeding (no actual data generation)
 */
export async function dryRunSeeding(sql: postgres.Sql, scenario: keyof typeof DATA_SCENARIOS): Promise<SeedingResult> {
  const seeder = new DatabaseSeeder(sql, {
    scenario,
    clearExisting: false,
    validateResults: false,
    dryRun: true,
    verbose: true
  });
  
  return await seeder.seed();
}

/**
 * CLI-friendly seeding function
 */
export async function seedFromCLI(
  scenario: string,
  options: {
    clear?: boolean;
    validate?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
  } = {}
): Promise<void> {
  if (!Object.keys(DATA_SCENARIOS).includes(scenario)) {
    console.error(`❌ Unknown scenario: ${scenario}`);
    console.log(`Available scenarios: ${Object.keys(DATA_SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  try {
    // Initialize database connection
    const databaseService = new DatabaseService();
    await databaseService.initialize();
    const sql = databaseService.getConnection();

    // Create seeder
    const seeder = new DatabaseSeeder(sql, {
      scenario: scenario as keyof typeof DATA_SCENARIOS,
      clearExisting: options.clear ?? true,
      validateResults: options.validate ?? true,
      dryRun: options.dryRun ?? false,
      verbose: options.verbose ?? true
    });

    // Execute seeding
    const result = await seeder.seed();

    if (result.success) {
      console.log('🎉 Seeding completed successfully!');
      console.log(`📊 Summary: ${result.summary.totalRecords} records in ${result.summary.tablesSeeded.length} tables`);
    } else {
      console.error('❌ Seeding failed:', result.error);
      process.exit(1);
    }

    // Cleanup
    await databaseService.cleanup();
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  }
}

export default DatabaseSeeder;