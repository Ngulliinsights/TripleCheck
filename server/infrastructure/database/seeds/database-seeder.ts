/**
 * Database Seeder - Master Seeding Orchestrator
 * 
 * Coordinates all seeding operations across different domains
 */

import { logger } from '../../../infrastructure/monitoring/logger';
import { LandVerificationSeeder } from './land-verification-seed';

export interface SeederOptions {
  truncate?: boolean;
  cascade?: boolean;
  environment?: 'development' | 'staging' | 'production';
  verbose?: boolean;
}

export interface SeederResult {
  success: boolean;
  seedersRun: string[];
  totalRecords: number;
  duration: number;
  errors: string[];
}

export class DatabaseSeeder {
  private seeders: Map<string, any> = new Map();

  constructor() {
    // Register all available seeders
    this.registerSeeder('land-verification', new LandVerificationSeeder());
  }

  /**
   * Register a new seeder
   */
  registerSeeder(name: string, seeder: any): void {
    this.seeders.set(name, seeder);
    logger.debug(`Registered seeder: ${name}`);
  }

  /**
   * Run all seeders
   */
  async seedAll(options: SeederOptions = {}): Promise<SeederResult> {
    const startTime = Date.now();
    const result: SeederResult = {
      success: true,
      seedersRun: [],
      totalRecords: 0,
      duration: 0,
      errors: []
    };

    logger.info('Starting database seeding process', 'DATABASE_SEEDER', { options });

    try {
      // Run seeders in order
      const seederNames = Array.from(this.seeders.keys());
      
      for (const seederName of seederNames) {
        try {
          logger.info(`Running seeder: ${seederName}`);
          
          const seeder = this.seeders.get(seederName);
          const seederResult = await seeder.seed(options);
          
          result.seedersRun.push(seederName);
          result.totalRecords += seederResult.recordsCreated || 0;
          
          logger.info(`Completed seeder: ${seederName}`, 'DATABASE_SEEDER', {
            records: seederResult.recordsCreated
          });
          
        } catch (error) {
          const errorMessage = `Seeder ${seederName} failed: ${error}`;
          result.errors.push(errorMessage);
          result.success = false;
          logger.error(errorMessage, 'DATABASE_SEEDER', { error });
          
          // Continue with other seeders unless in production
          if (options.environment === 'production') {
            break;
          }
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Seeding process failed: ${error}`);
      logger.error('Database seeding process failed', 'DATABASE_SEEDER', { error });
    }

    result.duration = Date.now() - startTime;
    
    logger.info('Database seeding completed', 'DATABASE_SEEDER', {
      success: result.success,
      seedersRun: result.seedersRun.length,
      totalRecords: result.totalRecords,
      duration: result.duration,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * Run specific seeder
   */
  async seedSpecific(seederName: string, options: SeederOptions = {}): Promise<SeederResult> {
    const startTime = Date.now();
    const result: SeederResult = {
      success: true,
      seedersRun: [],
      totalRecords: 0,
      duration: 0,
      errors: []
    };

    const seeder = this.seeders.get(seederName);
    if (!seeder) {
      result.success = false;
      result.errors.push(`Seeder not found: ${seederName}`);
      return result;
    }

    try {
      logger.info(`Running specific seeder: ${seederName}`);
      
      const seederResult = await seeder.seed(options);
      
      result.seedersRun.push(seederName);
      result.totalRecords = seederResult.recordsCreated || 0;
      
      logger.info(`Completed seeder: ${seederName}`, 'DATABASE_SEEDER', {
        records: result.totalRecords
      });
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Seeder ${seederName} failed: ${error}`);
      logger.error(`Seeder ${seederName} failed`, 'DATABASE_SEEDER', { error });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Get available seeders
   */
  getAvailableSeeders(): string[] {
    return Array.from(this.seeders.keys());
  }

  /**
   * Clear all data (use with caution)
   */
  async clearAll(options: SeederOptions = {}): Promise<void> {
    if (options.environment === 'production') {
      throw new Error('Cannot clear data in production environment');
    }

    logger.warn('Clearing all seeded data', 'DATABASE_SEEDER');

    // Run clearers in reverse order
    const seederNames = Array.from(this.seeders.keys()).reverse();
    
    for (const seederName of seederNames) {
      try {
        const seeder = this.seeders.get(seederName);
        if (seeder.clear) {
          await seeder.clear(options);
          logger.info(`Cleared data for: ${seederName}`);
        }
      } catch (error) {
        logger.error(`Failed to clear data for ${seederName}`, 'DATABASE_SEEDER', { error });
      }
    }
  }
}

// Export singleton instance
export const databaseSeeder = new DatabaseSeeder();