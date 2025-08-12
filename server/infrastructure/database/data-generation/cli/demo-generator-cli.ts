#!/usr/bin/env node

/**
 * TripleCheck Demo Data Generator CLI
 * 
 * Command-line interface for generating production-ready demonstration data
 * with comprehensive scenarios, realistic patterns, and validation.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';

import { 
  ProductionDemoGenerator, 
  generateQuickDemo, 
  generateAllDemoScenarios,
  DemoGenerationConfig 
} from '../scenarios/production-demo-generator';
import { 
  PRODUCTION_DEMO_SCENARIOS, 
  SCENARIO_METADATA,
  getAllScenarioNames,
  getScenariosByCategory,
  getScenariosByAudience 
} from '../scenarios/production-demo-scenarios';

const program = new Command();

/**
 * CLI Configuration
 */
interface CLIConfig {
  outputDir: string;
  verbose: boolean;
  interactive: boolean;
  format: string[];
}

/**
 * Main CLI setup
 */
program
  .name('demo-generator')
  .description('TripleCheck Production Demo Data Generator')
  .version('1.0.0')
  .option('-o, --output <dir>', 'Output directory', './database/data-generation/output/demo')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-i, --interactive', 'Interactive mode', false)
  .option('-f, --format <formats...>', 'Export formats (json,csv,sql,excel)', ['json']);

/**
 * Generate specific demo scenario
 */
program
  .command('generate <scenario>')
  .description('Generate a specific demo scenario')
  .option('-a, --audience <type>', 'Target audience (executives,sales,technical,compliance)', 'executives')
  .option('-l, --length <duration>', 'Demo length (quick,standard,extended)', 'standard')
  .option('-n, --narratives', 'Include demo narratives', true)
  .option('-s, --showcase', 'Generate showcase data', true)
  .option('-z, --visualizations', 'Create visualizations', true)
  .option('--regions <regions...>', 'Focus regions')
  .option('--features <features...>', 'Emphasize features')
  .action(async (scenario: string, options: any) => {
    const config = program.opts() as CLIConfig;
    
    console.log(chalk.blue.bold('\n🎬 TripleCheck Demo Data Generator\n'));
    
    if (!PRODUCTION_DEMO_SCENARIOS[scenario]) {
      console.error(chalk.red(`❌ Unknown scenario: ${scenario}`));
      console.log(chalk.yellow('Available scenarios:'));
      getAllScenarioNames().forEach(name => {
        console.log(chalk.gray(`  - ${name}`));
      });
      process.exit(1);
    }

    const spinner = ora('Generating demo data...').start();
    
    try {
      const generator = new ProductionDemoGenerator(config.outputDir);
      
      // Setup progress tracking
      generator.onProgress((progress) => {
        spinner.text = `${progress.stage}: ${progress.percentage.toFixed(1)}% - ${progress.currentOperation}`;
      });

      const demoConfig: DemoGenerationConfig = {
        scenario,
        outputDir: path.join(config.outputDir, scenario),
        includeNarratives: options.narratives,
        generateShowcaseData: options.showcase,
        createVisualizations: options.visualizations,
        exportFormats: config.format,
        customization: {
          focusRegions: options.regions,
          emphasizeFeatures: options.features,
          targetAudience: options.audience,
          demoLength: options.length
        }
      };

      const result = await generator.generateDemoScenario(demoConfig);
      
      spinner.succeed(chalk.green('Demo data generated successfully!'));
      
      // Display results
      console.log(chalk.blue('\n📊 Generation Results:'));
      console.log(chalk.gray(`  Scenario: ${result.scenario}`));
      console.log(chalk.gray(`  Duration: ${Math.round(result.duration)}ms`));
      console.log(chalk.gray(`  Output: ${demoConfig.outputDir}`));
      
      console.log(chalk.blue('\n📈 Records Generated:'));
      Object.entries(result.recordsGenerated).forEach(([key, value]) => {
        console.log(chalk.gray(`  ${key}: ${value}`));
      });
      
      console.log(chalk.blue('\n📁 Files Generated:'));
      result.filesGenerated.forEach(file => {
        console.log(chalk.gray(`  - ${file}`));
      });
      
      if (result.statistics) {
        console.log(chalk.blue('\n📊 Quality Metrics:'));
        console.log(chalk.gray(`  Data Quality: ${(result.statistics.dataQuality * 100).toFixed(1)}%`));
        console.log(chalk.gray(`  Fraud Detection Accuracy: ${(result.statistics.fraudDetectionAccuracy * 100).toFixed(1)}%`));
        console.log(chalk.gray(`  Relationship Consistency: ${(result.statistics.relationshipConsistency * 100).toFixed(1)}%`));
      }

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  - ${warning}`));
        });
      }

      console.log(chalk.green('\n✅ Demo data generation completed successfully!'));
      console.log(chalk.blue(`\n📖 View demo guide: ${path.join(demoConfig.outputDir, 'DEMO_GUIDE.md')}`));

    } catch (error) {
      spinner.fail(chalk.red('Demo data generation failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      if (config.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

/**
 * Generate quick demo
 */
program
  .command('quick [scenario]')
  .description('Generate a quick demo scenario (default: executive_demo)')
  .action(async (scenario: string = 'executive_demo') => {
    const config = program.opts() as CLIConfig;
    
    console.log(chalk.blue.bold('\n🚀 Quick Demo Generation\n'));
    
    const spinner = ora('Generating quick demo...').start();
    
    try {
      const result = await generateQuickDemo(scenario);
      
      spinner.succeed(chalk.green('Quick demo generated successfully!'));
      
      console.log(chalk.blue('\n📊 Quick Demo Results:'));
      console.log(chalk.gray(`  Scenario: ${result.scenario}`));
      console.log(chalk.gray(`  Duration: ${Math.round(result.duration)}ms`));
      console.log(chalk.gray(`  Records: ${Object.values(result.recordsGenerated).reduce((a, b) => a + b, 0)}`));
      
      console.log(chalk.green('\n✅ Quick demo ready for presentation!'));

    } catch (error) {
      spinner.fail(chalk.red('Quick demo generation failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Generate all demo scenarios
 */
program
  .command('all')
  .description('Generate all demo scenarios')
  .option('--parallel', 'Generate scenarios in parallel', false)
  .action(async (options: any) => {
    const config = program.opts() as CLIConfig;
    
    console.log(chalk.blue.bold('\n🎯 Generating All Demo Scenarios\n'));
    
    const scenarios = getAllScenarioNames();
    console.log(chalk.gray(`Generating ${scenarios.length} scenarios...\n`));
    
    const spinner = ora('Generating all demo scenarios...').start();
    
    try {
      const results = await generateAllDemoScenarios();
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        spinner.succeed(chalk.green(`All ${successful} demo scenarios generated successfully!`));
      } else {
        spinner.warn(chalk.yellow(`${successful} scenarios succeeded, ${failed} failed`));
      }
      
      console.log(chalk.blue('\n📊 Generation Summary:'));
      results.forEach(result => {
        const status = result.success ? chalk.green('✅') : chalk.red('❌');
        const duration = result.success ? `${Math.round(result.duration)}ms` : 'failed';
        console.log(`  ${status} ${result.scenario} (${duration})`);
      });
      
      if (failed > 0) {
        console.log(chalk.red('\n❌ Failed Scenarios:'));
        results.filter(r => !r.success).forEach(result => {
          console.log(chalk.red(`  - ${result.scenario}: ${result.errors.join(', ')}`));
        });
      }

    } catch (error) {
      spinner.fail(chalk.red('Demo generation failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * List available scenarios
 */
program
  .command('list')
  .description('List available demo scenarios')
  .option('-c, --category <category>', 'Filter by category (demo,business,technical,education)')
  .option('-a, --audience <audience>', 'Filter by audience (executives,sales,technical,compliance,training)')
  .action(async (options: any) => {
    console.log(chalk.blue.bold('\n📋 Available Demo Scenarios\n'));
    
    let scenarios: string[];
    
    if (options.category) {
      scenarios = SCENARIO_METADATA.categories[options.category] || [];
      console.log(chalk.yellow(`Category: ${options.category}\n`));
    } else if (options.audience) {
      scenarios = SCENARIO_METADATA.audience[options.audience] || [];
      console.log(chalk.yellow(`Audience: ${options.audience}\n`));
    } else {
      scenarios = getAllScenarioNames();
    }
    
    if (scenarios.length === 0) {
      console.log(chalk.red('No scenarios found for the specified criteria.'));
      return;
    }
    
    scenarios.forEach(name => {
      const scenario = PRODUCTION_DEMO_SCENARIOS[name];
      if (scenario) {
        console.log(chalk.blue(`📄 ${scenario.name}`));
        console.log(chalk.gray(`   ${scenario.description}`));
        console.log(chalk.gray(`   Users: ${scenario.users}, Properties: ${scenario.properties}, Fraud Rate: ${(scenario.fraudRate * 100).toFixed(1)}%`));
        
        if (scenario.demoSpecific) {
          const features = Object.keys(scenario.features).filter(key => scenario.features[key]).join(', ');
          console.log(chalk.gray(`   Features: ${features}`));
        }
        
        console.log('');
      }
    });
    
    console.log(chalk.blue('\n📚 Categories:'));
    Object.entries(SCENARIO_METADATA.categories).forEach(([category, scenarioNames]) => {
      console.log(chalk.gray(`  ${category}: ${scenarioNames.join(', ')}`));
    });
    
    console.log(chalk.blue('\n👥 Audiences:'));
    Object.entries(SCENARIO_METADATA.audience).forEach(([audience, scenarioNames]) => {
      console.log(chalk.gray(`  ${audience}: ${scenarioNames.join(', ')}`));
    });
  });

/**
 * Interactive mode
 */
program
  .command('interactive')
  .alias('i')
  .description('Interactive demo generation wizard')
  .action(async () => {
    console.log(chalk.blue.bold('\n🧙 Interactive Demo Generation Wizard\n'));
    
    try {
      // Scenario selection
      const { scenario } = await inquirer.prompt([
        {
          type: 'list',
          name: 'scenario',
          message: 'Select a demo scenario:',
          choices: getAllScenarioNames().map(name => ({
            name: `${PRODUCTION_DEMO_SCENARIOS[name].name} - ${PRODUCTION_DEMO_SCENARIOS[name].description}`,
            value: name
          }))
        }
      ]);
      
      // Configuration options
      const { audience, length, includeNarratives, generateShowcase, createVisualizations, exportFormats } = await inquirer.prompt([
        {
          type: 'list',
          name: 'audience',
          message: 'Target audience:',
          choices: ['executives', 'sales', 'technical', 'compliance', 'training'],
          default: 'executives'
        },
        {
          type: 'list',
          name: 'length',
          message: 'Demo length:',
          choices: ['quick', 'standard', 'extended'],
          default: 'standard'
        },
        {
          type: 'confirm',
          name: 'includeNarratives',
          message: 'Include demo narratives?',
          default: true
        },
        {
          type: 'confirm',
          name: 'generateShowcase',
          message: 'Generate showcase data?',
          default: true
        },
        {
          type: 'confirm',
          name: 'createVisualizations',
          message: 'Create visualizations?',
          default: true
        },
        {
          type: 'checkbox',
          name: 'exportFormats',
          message: 'Export formats:',
          choices: ['json', 'csv', 'sql', 'excel'],
          default: ['json']
        }
      ]);
      
      // Output directory
      const { outputDir } = await inquirer.prompt([
        {
          type: 'input',
          name: 'outputDir',
          message: 'Output directory:',
          default: `./database/data-generation/output/demo/${scenario}`
        }
      ]);
      
      // Confirmation
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Generate demo data with these settings?',
          default: true
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Demo generation cancelled.'));
        return;
      }
      
      // Generate demo
      const spinner = ora('Generating demo data...').start();
      
      const generator = new ProductionDemoGenerator();
      
      generator.onProgress((progress) => {
        spinner.text = `${progress.stage}: ${progress.percentage.toFixed(1)}% - ${progress.currentOperation}`;
      });
      
      const config: DemoGenerationConfig = {
        scenario,
        outputDir,
        includeNarratives,
        generateShowcaseData: generateShowcase,
        createVisualizations,
        exportFormats,
        customization: {
          targetAudience: audience,
          demoLength: length
        }
      };
      
      const result = await generator.generateDemoScenario(config);
      
      spinner.succeed(chalk.green('Demo data generated successfully!'));
      
      // Display results
      console.log(chalk.blue('\n🎉 Demo Generation Complete!\n'));
      console.log(chalk.gray(`📁 Output Directory: ${outputDir}`));
      console.log(chalk.gray(`📊 Records Generated: ${Object.values(result.recordsGenerated).reduce((a, b) => a + b, 0)}`));
      console.log(chalk.gray(`⏱️  Duration: ${Math.round(result.duration)}ms`));
      console.log(chalk.gray(`📖 Demo Guide: ${path.join(outputDir, 'DEMO_GUIDE.md')}`));
      
      console.log(chalk.green('\n✅ Your demo is ready for presentation!'));

    } catch (error) {
      console.error(chalk.red(`\n❌ Interactive mode failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Validate demo data
 */
program
  .command('validate <directory>')
  .description('Validate generated demo data')
  .action(async (directory: string) => {
    console.log(chalk.blue.bold('\n🔍 Validating Demo Data\n'));
    
    const spinner = ora('Validating demo data...').start();
    
    try {
      // Check if directory exists
      await fs.access(directory);
      
      // Check for required files
      const requiredFiles = [
        'demo_data.json',
        'showcase_users.json',
        'showcase_properties.json',
        'demo_fraud_cases.json',
        'success_stories.json',
        'DEMO_GUIDE.md'
      ];
      
      const missingFiles: string[] = [];
      
      for (const file of requiredFiles) {
        try {
          await fs.access(path.join(directory, file));
        } catch {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        spinner.warn(chalk.yellow('Demo data validation completed with warnings'));
        console.log(chalk.yellow('\n⚠️  Missing Files:'));
        missingFiles.forEach(file => {
          console.log(chalk.yellow(`  - ${file}`));
        });
      } else {
        spinner.succeed(chalk.green('Demo data validation passed'));
        console.log(chalk.green('\n✅ All required files present'));
      }
      
      // Validate JSON files
      const jsonFiles = requiredFiles.filter(f => f.endsWith('.json'));
      let validJson = 0;
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(directory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          JSON.parse(content);
          validJson++;
        } catch (error) {
          console.log(chalk.red(`❌ Invalid JSON: ${file}`));
        }
      }
      
      console.log(chalk.blue(`\n📊 JSON Validation: ${validJson}/${jsonFiles.length} files valid`));
      
      if (validJson === jsonFiles.length) {
        console.log(chalk.green('\n✅ Demo data is valid and ready for use!'));
      } else {
        console.log(chalk.red('\n❌ Demo data has validation errors'));
        process.exit(1);
      }

    } catch (error) {
      spinner.fail(chalk.red('Demo data validation failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Clean demo data
 */
program
  .command('clean [directory]')
  .description('Clean generated demo data')
  .option('-f, --force', 'Force deletion without confirmation', false)
  .action(async (directory: string = './database/data-generation/output/demo', options: any) => {
    console.log(chalk.blue.bold('\n🧹 Cleaning Demo Data\n'));
    
    try {
      // Check if directory exists
      await fs.access(directory);
      
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete all demo data in ${directory}?`,
            default: false
          }
        ]);
        
        if (!confirm) {
          console.log(chalk.yellow('Cleanup cancelled.'));
          return;
        }
      }
      
      const spinner = ora('Cleaning demo data...').start();
      
      // Remove directory
      await fs.rm(directory, { recursive: true, force: true });
      
      spinner.succeed(chalk.green('Demo data cleaned successfully'));
      console.log(chalk.green(`\n✅ Removed: ${directory}`));

    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow('\n⚠️  Directory does not exist, nothing to clean.'));
      } else {
        console.error(chalk.red(`\n❌ Cleanup failed: ${error.message}`));
        process.exit(1);
      }
    }
  });

/**
 * Show demo statistics
 */
program
  .command('stats [directory]')
  .description('Show demo data statistics')
  .action(async (directory: string = './database/data-generation/output/demo') => {
    console.log(chalk.blue.bold('\n📊 Demo Data Statistics\n'));
    
    try {
      // Check if directory exists
      await fs.access(directory);
      
      // Get all subdirectories (scenarios)
      const entries = await fs.readdir(directory, { withFileTypes: true });
      const scenarios = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
      
      if (scenarios.length === 0) {
        console.log(chalk.yellow('No demo scenarios found.'));
        return;
      }
      
      console.log(chalk.blue(`Found ${scenarios.length} demo scenarios:\n`));
      
      for (const scenario of scenarios) {
        const scenarioPath = path.join(directory, scenario);
        
        try {
          // Read demo data
          const demoDataPath = path.join(scenarioPath, 'demo_data.json');
          const demoData = JSON.parse(await fs.readFile(demoDataPath, 'utf-8'));
          
          console.log(chalk.blue(`📄 ${scenario}`));
          console.log(chalk.gray(`   Records: ${Object.values(demoData.recordsGenerated || {}).reduce((a: number, b: number) => a + b, 0)}`));
          console.log(chalk.gray(`   Files: ${(demoData.filesGenerated || []).length}`));
          console.log(chalk.gray(`   Duration: ${Math.round(demoData.duration || 0)}ms`));
          
          if (demoData.statistics) {
            console.log(chalk.gray(`   Quality: ${(demoData.statistics.dataQuality * 100).toFixed(1)}%`));
          }
          
          console.log('');
          
        } catch (error) {
          console.log(chalk.red(`❌ ${scenario}: Error reading data`));
        }
      }
      
      console.log(chalk.green(`\n✅ Statistics for ${scenarios.length} scenarios displayed`));

    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(chalk.yellow('\n⚠️  Demo directory does not exist.'));
      } else {
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
      }
    }
  });

/**
 * Error handling
 */
program.on('command:*', () => {
  console.error(chalk.red(`\n❌ Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Use --help to see available commands.'));
  process.exit(1);
});

/**
 * Parse command line arguments
 */
if (process.argv.length === 2) {
  // No arguments provided, show help
  program.help();
} else {
  program.parse();
}

export { program };