#!/usr/bin/env tsx

/**
 * Data Seeding CLI Script
 * 
 * Command-line interface for seeding database with different scenarios.
 * Supports development, testing, performance, and minimal data generation.
 */

import { Command } from 'commander';

import { seedFromCLI, DATA_SCENARIOS } from '../seeds';
import { DatabaseService } from '../service';

const program = new Command();

program
  .name('seed-data')
  .description('Seed database with test data for different scenarios')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate data for a specific scenario')
  .argument('<scenario>', `Scenario to generate data for (${Object.keys(DATA_SCENARIOS).join(', ')})`)
  .option('-c, --clear', 'Clear existing data before seeding', false)
  .option('-v, --validate', 'Validate generated data', true)
  .option('-d, --dry-run', 'Perform dry run without writing data', false)
  .option('--verbose', 'Enable verbose output', false)
  .action(async (scenario: string, options) => {
    try {
      console.log(`🌱 Seeding database with ${scenario} scenario...`);
      
      await seedFromCLI(scenario, {
        clear: options.clear,
        validate: options.validate,
        dryRun: options.dryRun,
        verbose: options.verbose
      });
      
      console.log('✅ Seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  });

program
  .command('list-scenarios')
  .description('List available data generation scenarios')
  .action(() => {
    console.log('📋 Available scenarios:');
    console.log('');
    
    Object.entries(DATA_SCENARIOS).forEach(([name, config]) => {
      console.log(`  ${name}:`);
      console.log(`    Users: ${config.volumes.users}`);
      console.log(`    Properties: ${config.volumes.properties}`);
      console.log(`    Reviews: ${config.volumes.reviews}`);
      console.log(`    Transactions: ${config.volumes.transactions}`);
      console.log(`    Verifications: ${config.volumes.verifications}`);
      console.log(`    Batch Size: ${config.options.batchSize}`);
      console.log(`    Realistic Data: ${config.options.useRealisticData}`);
      console.log('');
    });
  });

program
  .command('quick-dev')
  .description('Quick setup for development environment')
  .action(async () => {
    try {
      console.log('🚀 Setting up development environment...');
      
      await seedFromCLI('development', {
        clear: true,
        validate: true,
        dryRun: false,
        verbose: true
      });
      
      console.log('🎉 Development environment ready!');
    } catch (error) {
      console.error('❌ Development setup failed:', error);
      process.exit(1);
    }
  });

program
  .command('quick-test')
  .description('Quick setup for testing environment')
  .action(async () => {
    try {
      console.log('🧪 Setting up testing environment...');
      
      await seedFromCLI('testing', {
        clear: true,
        validate: true,
        dryRun: false,
        verbose: false
      });
      
      console.log('✅ Testing environment ready!');
    } catch (error) {
      console.error('❌ Testing setup failed:', error);
      process.exit(1);
    }
  });

program
  .command('performance-data')
  .description('Generate large dataset for performance testing')
  .option('--confirm', 'Confirm generation of large dataset', false)
  .action(async (options) => {
    if (!options.confirm) {
      console.log('⚠️  This will generate a large dataset for performance testing.');
      console.log('   Use --confirm flag to proceed.');
      console.log('   Example: npm run seed:performance -- --confirm');
      return;
    }
    
    try {
      console.log('⚡ Generating performance testing dataset...');
      console.log('   This may take several minutes...');
      
      await seedFromCLI('performance', {
        clear: true,
        validate: false, // Skip validation for performance
        dryRun: false,
        verbose: true
      });
      
      console.log('🏁 Performance dataset ready!');
    } catch (error) {
      console.error('❌ Performance data generation failed:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate existing data in database')
  .action(async () => {
    try {
      console.log('🔍 Validating existing database data...');
      
      const databaseService = new DatabaseService();
      await databaseService.initialize();
      const sql = databaseService.getConnection();
      
      // Check table counts
      const counts = await Promise.all([
        sql`SELECT COUNT(*) as count FROM users`,
        sql`SELECT COUNT(*) as count FROM properties`,
        sql`SELECT COUNT(*) as count FROM reviews`,
        sql`SELECT COUNT(*) as count FROM transactions`,
        sql`SELECT COUNT(*) as count FROM land_verifications`
      ]);
      
      console.log('📊 Current data counts:');
      console.log(`   Users: ${counts[0][0].count}`);
      console.log(`   Properties: ${counts[1][0].count}`);
      console.log(`   Reviews: ${counts[2][0].count}`);
      console.log(`   Transactions: ${counts[3][0].count}`);
      console.log(`   Verifications: ${counts[4][0].count}`);
      
      // Check for foreign key violations
      const violations = await sql`
        SELECT COUNT(*) as count 
        FROM properties p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE u.id IS NULL
      `;
      
      if (parseInt(violations[0].count) > 0) {
        console.log(`⚠️  Found ${violations[0].count} properties with invalid user references`);
      } else {
        console.log('✅ No foreign key violations found');
      }
      
      await databaseService.cleanup();
      console.log('✅ Validation completed');
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

program
  .command('clear')
  .description('Clear all data from database')
  .option('--confirm', 'Confirm data deletion', false)
  .action(async (options) => {
    if (!options.confirm) {
      console.log('⚠️  This will delete ALL data from the database.');
      console.log('   Use --confirm flag to proceed.');
      console.log('   Example: npm run seed:clear -- --confirm');
      return;
    }
    
    try {
      console.log('🧹 Clearing all database data...');
      
      const databaseService = new DatabaseService();
      await databaseService.initialize();
      const sql = databaseService.getConnection();
      
      // Clear in reverse dependency order
      await sql`DELETE FROM reviews`;
      await sql`DELETE FROM transactions`;
      await sql`DELETE FROM land_verifications`;
      await sql`DELETE FROM properties`;
      await sql`DELETE FROM users`;
      
      console.log('✅ All data cleared');
      await databaseService.cleanup();
    } catch (error) {
      console.error('❌ Data clearing failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show database and seeding status')
  .action(async () => {
    try {
      console.log('📊 Database Status:');
      console.log('');
      
      const databaseService = new DatabaseService();
      await databaseService.initialize();
      const sql = databaseService.getConnection();
      
      // Check database connection
      await sql`SELECT 1 as test`;
      console.log('✅ Database connection: OK');
      
      // Check table existence
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      console.log(`📋 Tables found: ${tables.length}`);
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      // Check data counts
      if (tables.some(t => t.table_name === 'users')) {
        const counts = await Promise.all([
          sql`SELECT COUNT(*) as count FROM users`,
          sql`SELECT COUNT(*) as count FROM properties`,
          sql`SELECT COUNT(*) as count FROM reviews`,
          sql`SELECT COUNT(*) as count FROM transactions`,
          sql`SELECT COUNT(*) as count FROM land_verifications`
        ]);
        
        console.log('');
        console.log('📊 Data counts:');
        console.log(`   Users: ${counts[0][0].count}`);
        console.log(`   Properties: ${counts[1][0].count}`);
        console.log(`   Reviews: ${counts[2][0].count}`);
        console.log(`   Transactions: ${counts[3][0].count}`);
        console.log(`   Verifications: ${counts[4][0].count}`);
        
        const totalRecords = counts.reduce((sum, result) => sum + parseInt(result[0].count), 0);
        console.log(`   Total: ${totalRecords} records`);
      }
      
      await databaseService.cleanup();
    } catch (error) {
      console.error('❌ Status check failed:', error);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error('❌ Invalid command: %s', program.args.join(' '));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}