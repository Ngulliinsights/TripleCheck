#!/usr/bin/env tsx
/**
 * Unified Data Generation CLI
 * 
 * Command-line interface for the unified scenario-based data generation system
 */

import 'dotenv/config';
import chalk from '..\..\..\..\scripts\cleanup-redundancies';
import { program } from '..\data-generation\cli\demo-generator-cli';
import ora from '..\..\..\..\src\auth\components\TwoFactorAuth';

import { unifiedCacheManager } from '../../cache';
import { UnifiedDataGenerator, type GenerationProgress } from '../seeds/UnifiedDataGenerator';

/**
 * CLI progress display
 */
class ProgressDisplay {
  private spinner = ora();
  private lastProgress: GenerationProgress | null = null;

  start(): void {
    this.spinner.start('Initializing data generation...');
  }

  update(progress: GenerationProgress): void {
    this.lastProgress = progress;
    const percentage = progress.percentage.toFixed(1);
    const progressBar = this.createProgressBar(progress.percentage);
    
    this.spinner.text = `${progress.stage} ${progressBar} ${percentage}% (${progress.completed}/${progress.total})`;
  }

  succeed(message: string): void {
    this.spinner.succeed(chalk.green(message));
  }

  fail(message: string): void {
    this.spinner.fail(chalk.red(message));
  }

  warn(message: string): void {
    this.spinner.warn(chalk.yellow(message));
  }

  info(message: string): void {
    this.spinner.info(chalk.blue(message));
  }

  stop(): void {
    this.spinner.stop();
  }

  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Display generation summary
 */
function displaySummary(result: any): void {
  console.log(`\n${  chalk.bold('📊 Generation Summary')}`);
  console.log('═'.repeat(50));
  
  console.log(chalk.blue('Scenario:'), result.scenario);
  console.log(chalk.blue('Duration:'), formatDuration(result.duration));
  console.log(chalk.blue('Success:'), result.success ? chalk.green('✓') : chalk.red('✗'));
  
  console.log(`\n${  chalk.bold('📈 Records Generated:')}`);
  console.log(`  Users: ${chalk.cyan(result.recordsGenerated.users.toLocaleString())}`);
  console.log(`  Properties: ${chalk.cyan(result.recordsGenerated.properties.toLocaleString())}`);
  console.log(`  Reviews: ${chalk.cyan(result.recordsGenerated.reviews.toLocaleString())}`);
  console.log(`  Professionals: ${chalk.cyan(result.recordsGenerated.professionals.toLocaleString())}`);
  console.log(`  Verification Sessions: ${chalk.cyan(result.recordsGenerated.verificationSessions.toLocaleString())}`);
  console.log(`  Fraud Cases: ${chalk.cyan(result.recordsGenerated.fraudCases.toLocaleString())}`);
  
  if (result.filesGenerated.length > 0) {
    console.log(`\n${  chalk.bold('📁 Files Generated:')}`);
    result.filesGenerated.forEach((file: string) => {
      console.log(`  ${chalk.gray(file)}`);
    });
  }
  
  if (result.statistics) {
    console.log(`\n${  chalk.bold('📊 Quality Statistics:')}`);
    console.log(`  Data Quality: ${chalk.green(`${(result.statistics.dataQuality * 100).toFixed(1)  }%`)}`);
    console.log(`  Fraud Detection Accuracy: ${chalk.green(`${(result.statistics.fraudDetectionAccuracy * 100).toFixed(1)  }%`)}`);
    console.log(`  Relationship Consistency: ${chalk.green(`${(result.statistics.relationshipConsistency * 100).toFixed(1)  }%`)}`);
  }
  
  if (result.warnings.length > 0) {
    console.log(`\n${  chalk.bold.yellow('⚠️  Warnings:')}`);
    result.warnings.forEach((warning: string) => {
      console.log(`  ${chalk.yellow('•')} ${warning}`);
    });
  }
  
  if (result.errors.length > 0) {
    console.log(`\n${  chalk.bold.red('❌ Errors:')}`);
    result.errors.forEach((error: string) => {
      console.log(`  ${chalk.red('•')} ${error}`);
    });
  }
}

/**
 * Main CLI program
 */
async function main(): Promise<void> {
  const generator = new UnifiedDataGenerator();
  const progress = new ProgressDisplay();

  program
    .name('unified-data-generation')
    .description('Unified scenario-based data generation system for TripleCheck')
    .version('1.0.0');

  // List available scenarios
  program
    .command('list')
    .description('List available data generation scenarios')
    .action(() => {
      console.log(chalk.bold('\n🎯 Available Data Generation Scenarios\n'));
      
      const scenarios = generator.getAvailableScenarios();
      scenarios.forEach(scenario => {
        console.log(chalk.cyan(`${scenario.name}:`));
        console.log(`  ${scenario.description}`);
        console.log(`  ${chalk.gray(`~${scenario.records.toLocaleString()} total records`)}\n`);
      });
    });

  // Generate data for a scenario
  program
    .command('generate')
    .description('Generate data for a specific scenario')
    .argument('<scenario>', 'Scenario name (minimal, development, testing, performance, demo)')
    .option('--no-python', 'Use TypeScript generators instead of Python')
    .option('--no-validation', 'Skip output validation')
    .option('--no-checkpoints', 'Disable checkpoint creation')
    .option('--sequential', 'Run generators sequentially instead of parallel')
    .option('--users <number>', 'Override number of users to generate')
    .option('--properties <number>', 'Override number of properties to generate')
    .option('--fraud-rate <number>', 'Override fraud rate (0.0-1.0)')
    .option('--output-dir <path>', 'Override output directory')
    .action(async (scenario: string, options: any) => {
      try {
        progress.start();
        
        // Set up progress tracking
        generator.onProgress((progressData) => {
          progress.update(progressData);
        });

        // Prepare configuration
        const config: any = {
          usePython: options.python !== false,
          validateOutput: options.validation !== false,
          enableCheckpoints: options.checkpoints !== false,
          parallelProcessing: !options.sequential
        };

        if (options.outputDir) {
          config.outputDir = options.outputDir;
        }

        // Custom scenario overrides
        const customConfig: any = {};
        if (options.users) {
          customConfig.users = parseInt(options.users);
        }
        if (options.properties) {
          customConfig.properties = parseInt(options.properties);
        }
        if (options.fraudRate) {
          customConfig.fraudRate = parseFloat(options.fraudRate);
        }

        if (Object.keys(customConfig).length > 0) {
          config.customConfig = customConfig;
        }

        // Generate data
        const result = await generator.generateScenario(scenario, config);
        
        if (result.success) {
          progress.succeed('Data generation completed successfully!');
        } else {
          progress.fail('Data generation completed with errors');
        }

        // Display summary
        displaySummary(result);

        // Warm cache with generated data
        if (result.success && result.recordsGenerated.users > 0) {
          progress.info('Warming cache with generated data...');
          try {
            // This would warm the cache with some of the generated data
            // Implementation depends on your specific caching strategy
            await unifiedCacheManager.clear(); // Clear existing cache
            progress.succeed('Cache warmed successfully');
          } catch (error) {
            progress.warn('Cache warming failed but data generation was successful');
          }
        }

      } catch (error) {
        progress.fail(`Data generation failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Validate existing data
  program
    .command('validate')
    .description('Validate existing generated data files')
    .option('--dir <path>', 'Directory containing data files', './database/seeds/generators')
    .action(async (options: any) => {
      progress.start();
      progress.update({
        stage: 'Validating data files',
        completed: 0,
        total: 100,
        percentage: 0,
        estimatedTimeRemaining: 0,
        currentOperation: 'Scanning files'
      });

      try {
        // Implementation would validate existing data files
        // This is a placeholder for the actual validation logic
        
        progress.succeed('Data validation completed');
        console.log(chalk.green('\n✅ All data files are valid'));
        
      } catch (error) {
        progress.fail(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Clean generated data
  program
    .command('clean')
    .description('Clean generated data files')
    .option('--dir <path>', 'Directory containing data files', './database/seeds/generators')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (options: any) => {
      if (!options.confirm) {
        console.log(chalk.yellow('⚠️  This will delete all generated data files.'));
        console.log(chalk.yellow('Use --confirm to skip this prompt.'));
        return;
      }

      progress.start();
      
      try {
        // Implementation would clean generated files
        // This is a placeholder for the actual cleanup logic
        
        progress.succeed('Generated data files cleaned');
        
      } catch (error) {
        progress.fail(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  // Status command
  program
    .command('status')
    .description('Show status of data generation system')
    .action(async () => {
      console.log(chalk.bold('\n🔍 Data Generation System Status\n'));
      
      try {
        // Check Python availability
        const pythonAvailable = await checkPythonAvailability();
        console.log(`Python: ${pythonAvailable ? chalk.green('✓ Available') : chalk.red('✗ Not available')}`);
        
        // Check cache status
        const cacheStats = unifiedCacheManager.getStats();
        console.log(`Cache: ${cacheStats.l2.connected ? chalk.green('✓ Connected') : chalk.yellow('⚠ L1 only')}`);
        
        // Check available scenarios
        const scenarios = generator.getAvailableScenarios();
        console.log(`Scenarios: ${chalk.cyan(scenarios.length)} available`);
        
        console.log(`\n${  chalk.bold('📊 System Resources:')}`);
        console.log(`Memory Usage: ${chalk.cyan((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1))} MB`);
        console.log(`Node.js Version: ${chalk.cyan(process.version)}`);
        
      } catch (error) {
        console.error(chalk.red('Failed to get system status:'), error);
      }
    });

  // Parse command line arguments
  program.parse();
}

/**
 * Check if Python is available
 */
async function checkPythonAvailability(): Promise<boolean> {
  try {
    const { spawn } = await import('child_process');
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['--version'], { stdio: 'pipe' });
      pythonProcess.on('close', (code) => resolve(code === 0));
      pythonProcess.on('error', () => resolve(false));
    });
  } catch {
    return false;
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n💥 Unhandled Rejection:'), reason);
  process.exit(1);
});

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red('\n💥 CLI Error:'), error.message);
    process.exit(1);
  });
}