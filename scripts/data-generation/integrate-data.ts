#!/usr/bin/env tsx
/**
 * Data Integration Script for TripleCheck
 * 
 * This script integrates all data generation components and loads them into the database
 */

import 'dotenv/config';
import { UnifiedDataGenerator } from '../unified-data-generator.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

interface IntegrationOptions {
  users?: number;
  properties?: number;
  reviews?: number;
  usePython?: boolean;
  fraudRate?: number;
  loadToDatabase?: boolean;
}

async function runPythonGenerator(scriptName: string, args: string[] = []): Promise<void> {
  const scriptPath = path.join(__dirname, scriptName);
  
  return new Promise((resolve, reject) => {
    console.log(`🐍 Running ${scriptName}...`);
    
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        reject(new Error(`${scriptName} failed with code ${code}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to run ${scriptName}: ${error.message}`));
    });
  });
}

async function loadDataToDatabase(): Promise<void> {
  console.log('📊 Loading data to database...');
  
  return new Promise((resolve, reject) => {
    const loaderProcess = spawn('npx', ['tsx', 'scripts/data-migration/robust-batch-loader.ts'], {
      stdio: 'inherit'
    });

    loaderProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database loading completed successfully');
        resolve();
      } else {
        reject(new Error(`Database loading failed with code ${code}`));
      }
    });

    loaderProcess.on('error', (error) => {
      reject(new Error(`Failed to load data to database: ${error.message}`));
    });
  });
}

async function integrateData(options: IntegrationOptions = {}): Promise<void> {
  console.log('🚀 TripleCheck Data Integration Starting...');
  console.log('==========================================');
  
  const {
    users = 5000,
    properties = 10000,
    reviews = 1000,
    usePython = true,
    fraudRate = 0.02,
    loadToDatabase = true
  } = options;

  try {
    // Ensure data-generation directory exists
    await fs.mkdir(__dirname, { recursive: true });

    if (usePython) {
      console.log('🐍 Using Python generators for enhanced data quality...\n');
      
      try {
        // Run Python generators
        await runPythonGenerator('user-generator.py', [
          '--count', users.toString(),
          '--fraud-rate', fraudRate.toString()
        ]);

        await runPythonGenerator('property-generator.py', [
          '--count', properties.toString(),
          '--fraud-rate', fraudRate.toString()
        ]);

        await runPythonGenerator('fraud-simulator.py');

        console.log('✅ Python data generation completed\n');
      } catch (error) {
        console.log('⚠️  Python generators failed, falling back to JavaScript...\n');
        
        // Fallback to JavaScript generators
        const generator = new UnifiedDataGenerator(__dirname);
        await generator.generateData({
          users,
          properties,
          reviews,
          usePython: false,
          fraudRate,
          validateOutput: true
        });
      }
    } else {
      console.log('🟨 Using JavaScript generators...\n');
      
      const generator = new UnifiedDataGenerator(__dirname);
      await generator.generateData({
        users,
        properties,
        reviews,
        usePython: false,
        fraudRate,
        validateOutput: true
      });
    }

    // Load data to database if requested
    if (loadToDatabase) {
      console.log('\n📊 Loading generated data to database...');
      await loadDataToDatabase();
    }

    // Run additional migration scripts
    console.log('\n🔄 Running additional migration scripts...');
    
    try {
      await new Promise<void>((resolve, reject) => {
        const migrationProcess = spawn('npx', ['tsx', 'scripts/data-migration/seed-kenya-properties.ts'], {
          stdio: 'inherit'
        });

        migrationProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Kenya properties seeded successfully');
            resolve();
          } else {
            console.log('⚠️  Kenya properties seeding had issues but continuing...');
            resolve(); // Don't fail the entire process
          }
        });

        migrationProcess.on('error', () => {
          console.log('⚠️  Kenya properties seeding failed but continuing...');
          resolve(); // Don't fail the entire process
        });
      });

      await new Promise<void>((resolve, reject) => {
        const migrationProcess = spawn('npx', ['tsx', 'scripts/data-migration/migrate-existing-properties.ts'], {
          stdio: 'inherit'
        });

        migrationProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Existing properties migrated successfully');
            resolve();
          } else {
            console.log('⚠️  Existing properties migration had issues but continuing...');
            resolve(); // Don't fail the entire process
          }
        });

        migrationProcess.on('error', () => {
          console.log('⚠️  Existing properties migration failed but continuing...');
          resolve(); // Don't fail the entire process
        });
      });

    } catch (error) {
      console.log('⚠️  Some migration scripts had issues but data integration completed');
    }

    console.log('\n🎉 Data Integration Completed Successfully!');
    console.log('=========================================');
    console.log(`📊 Generated:`);
    console.log(`   • ${users} users with ${Math.round(users * fraudRate)} fraudulent profiles`);
    console.log(`   • ${properties} properties with ${Math.round(properties * fraudRate)} suspicious listings`);
    console.log(`   • ${reviews} reviews and ratings`);
    console.log(`   • Comprehensive fraud patterns and scenarios`);
    console.log(`   • Kenya-specific land verification data`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Start the application: npm run dev');
    console.log('   2. Test fraud detection features');
    console.log('   3. Verify land verification workflows');
    console.log('   4. Review generated data quality');

  } catch (error) {
    console.error('\n❌ Data integration failed:', error);
    process.exit(1);
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('TripleCheck Data Integration');
    console.log('===========================');
    console.log('');
    console.log('Usage: npx tsx scripts/data-generation/integrate-data.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --users=5000          Number of users to generate');
    console.log('  --properties=10000    Number of properties to generate');
    console.log('  --reviews=1000        Number of reviews to generate');
    console.log('  --fraud-rate=0.02     Fraud rate (0.02 = 2%)');
    console.log('  --no-python           Use JavaScript generators only');
    console.log('  --no-database         Skip database loading');
    console.log('  --help, -h            Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/data-generation/integrate-data.ts');
    console.log('  npx tsx scripts/data-generation/integrate-data.ts --users=2000 --properties=5000');
    console.log('  npx tsx scripts/data-generation/integrate-data.ts --no-python --fraud-rate=0.05');
    return;
  }

  // Parse options
  const options: IntegrationOptions = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--users=')) {
      options.users = parseInt(arg.split('=')[1]) || 5000;
    } else if (arg.startsWith('--properties=')) {
      options.properties = parseInt(arg.split('=')[1]) || 10000;
    } else if (arg.startsWith('--reviews=')) {
      options.reviews = parseInt(arg.split('=')[1]) || 1000;
    } else if (arg.startsWith('--fraud-rate=')) {
      options.fraudRate = parseFloat(arg.split('=')[1]) || 0.02;
    } else if (arg === '--no-python') {
      options.usePython = false;
    } else if (arg === '--no-database') {
      options.loadToDatabase = false;
    }
  });

  await integrateData(options);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { integrateData, type IntegrationOptions };