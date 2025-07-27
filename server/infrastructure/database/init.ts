/**
 * Database Initialization Script
 * 
 * Comprehensive database setup including connection, migrations, and seeding
 */

import { logger } from '../monitoring/logger';
import { DatabaseConnection } from './connection';
import { DatabaseMigrator } from './migrations/migrator';
import { databaseSeeder } from './seeds/database-seeder';
import { validateDatabaseConfig } from './config/database.config';

export interface InitializationOptions {
  runMigrations?: boolean;
  seedData?: boolean;
  environment?: 'development' | 'staging' | 'production';
  force?: boolean;
}

export interface InitializationResult {
  success: boolean;
  steps: {
    configValidation: boolean;
    connection: boolean;
    migrations: boolean;
    seeding: boolean;
  };
  errors: string[];
  duration: number;
}

/**
 * Initialize the complete database infrastructure
 */
export async function initializeDatabase(
  options: InitializationOptions = {}
): Promise<InitializationResult> {
  const startTime = Date.now();
  const result: InitializationResult = {
    success: true,
    steps: {
      configValidation: false,
      connection: false,
      migrations: false,
      seeding: false
    },
    errors: [],
    duration: 0
  };

  logger.info('Starting database initialization', 'DATABASE_INIT', { options });

  try {
    // Step 1: Validate configuration
    logger.info('Validating database configuration...', 'DATABASE_INIT');
    try {
      validateDatabaseConfig();
      result.steps.configValidation = true;
      logger.info('Database configuration validated', 'DATABASE_INIT');
    } catch (error) {
      result.errors.push(`Configuration validation failed: ${error}`);
      result.success = false;
      return result;
    }

    // Step 2: Establish connection
    logger.info('Establishing database connection...', 'DATABASE_INIT');
    try {
      const dbConnection = DatabaseConnection.getInstance();
      await dbConnection.connect();
      result.steps.connection = true;
      logger.info('Database connection established', 'DATABASE_INIT');
    } catch (error) {
      result.errors.push(`Connection failed: ${error}`);
      result.success = false;
      return result;
    }

    // Step 3: Run migrations (if requested)
    if (options.runMigrations !== false) {
      logger.info('Running database migrations...', 'DATABASE_INIT');
      try {
        const migrator = new DatabaseMigrator();
        const migrationResult = await migrator.migrate();
        
        if (migrationResult.success) {
          result.steps.migrations = true;
          logger.info('Database migrations completed', 'DATABASE_INIT', {
            migrationsApplied: migrationResult.migrationsApplied.length
          });
        } else {
          result.errors.push(...migrationResult.errors);
          result.success = false;
        }
      } catch (error) {
        result.errors.push(`Migration failed: ${error}`);
        result.success = false;
      }
    } else {
      result.steps.migrations = true; // Skipped by choice
      logger.info('Skipping database migrations', 'DATABASE_INIT');
    }

    // Step 4: Seed data (if requested and not in production)
    if (options.seedData && options.environment !== 'production') {
      logger.info('Seeding database with sample data...', 'DATABASE_INIT');
      try {
        const seedResult = await databaseSeeder.seedAll({
          environment: options.environment,
          truncate: options.force
        });
        
        if (seedResult.success) {
          result.steps.seeding = true;
          logger.info('Database seeding completed', 'DATABASE_INIT', {
            seedersRun: seedResult.seedersRun.length,
            totalRecords: seedResult.totalRecords
          });
        } else {
          result.errors.push(...seedResult.errors);
          // Don't fail initialization for seeding errors
          logger.warn('Database seeding had errors but continuing', 'DATABASE_INIT', {
            errors: seedResult.errors
          });
        }
      } catch (error) {
        result.errors.push(`Seeding failed: ${error}`);
        logger.warn('Database seeding failed but continuing', 'DATABASE_INIT', { error });
      }
    } else {
      result.steps.seeding = true; // Skipped by choice
      if (options.environment === 'production') {
        logger.info('Skipping database seeding in production', 'DATABASE_INIT');
      } else {
        logger.info('Skipping database seeding', 'DATABASE_INIT');
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Initialization failed: ${error}`);
    logger.error('Database initialization failed', 'DATABASE_INIT', { error });
  }

  result.duration = Date.now() - startTime;
  
  if (result.success) {
    logger.info('Database initialization completed successfully', 'DATABASE_INIT', {
      duration: result.duration,
      steps: result.steps
    });
  } else {
    logger.error('Database initialization failed', 'DATABASE_INIT', {
      duration: result.duration,
      errors: result.errors,
      steps: result.steps
    });
  }

  return result;
}

/**
 * Quick database health check
 */
export async function checkDatabaseStatus(): Promise<{
  healthy: boolean;
  details: any;
}> {
  try {
    const dbConnection = DatabaseConnection.getInstance();
    const health = await dbConnection.getHealth();
    
    return {
      healthy: health.connected,
      details: health
    };
  } catch (error) {
    logger.error('Database status check failed', 'DATABASE_INIT', { error });
    return {
      healthy: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Reset database (development only)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production environment');
  }

  logger.warn('Resetting database - all data will be lost!', 'DATABASE_INIT');

  try {
    // Clear all data
    await databaseSeeder.clearAll({
      environment: process.env.NODE_ENV as any
    });

    // Re-run migrations
    const migrator = new DatabaseMigrator();
    await migrator.migrate();

    // Re-seed data
    await databaseSeeder.seedAll({
      environment: process.env.NODE_ENV as any,
      truncate: true
    });

    logger.info('Database reset completed', 'DATABASE_INIT');
  } catch (error) {
    logger.error('Database reset failed', 'DATABASE_INIT', { error });
    throw error;
  }
}

// Export for CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      initializeDatabase({
        runMigrations: true,
        seedData: process.env.NODE_ENV !== 'production',
        environment: process.env.NODE_ENV as any
      }).then(result => {
        process.exit(result.success ? 0 : 1);
      });
      break;

    case 'status':
      checkDatabaseStatus().then(status => {
        console.log(JSON.stringify(status, null, 2));
        process.exit(status.healthy ? 0 : 1);
      });
      break;

    case 'reset':
      resetDatabase().then(() => {
        process.exit(0);
      }).catch(() => {
        process.exit(1);
      });
      break;

    default:
      console.log('Usage: tsx server/infrastructure/database/init.ts [init|status|reset]');
      process.exit(1);
  }
}