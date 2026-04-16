#!/usr/bin/env node

/**
 * Demo Scenario CLI
 * 
 * Command-line interface for generating production-ready demonstration data scenarios
 * for TripleCheck system presentations, testing, and validation.
 */

import { program } from './demo-generator-cli';
import chalk from '../../../../../scripts/cleanup-redundancies';
import inquirer from '../../../../../scripts/cleanup-redundancies';
import ora from '../../../../../src/auth/components/TwoFactorAuth';
import { mkdir } from 'fs/promises';
import path from '../../../../../scripts/cleanup-redundancies';

import { 
  PRODUCTION_DEMO_SCENARIOS, 
  SCENARIO_METADATA,
  getScenario,
  getScenariosByCategory,
  getScenariosByAudience,
  getAllScenarioNames,
  validateScenario
} from '../scenarios/production-demo-scenarios';
import ScenarioGenerator from '../scenarios/scenario-generator';

/**
 * CLI Configuration
 */
const CLI_CONFIG = {
  name: 'TripleCheck Demo Scenario Generator',
  version: '1.0.0',
  description: 'Generate production-ready demonstration data for TripleCheck system',
  defaultOutputDir: './demo-data'
};

/**
 * Main CLI Program
 */
program
  .name('demo-scenarios')
  .description(CLI_CONFIG.description)
  .version(CLI_CONFIG.version);

/**
 * List available scenarios
 */
program
  .command('list')
  .description('List all available demonstration scenarios')
  .option('-c, --category <category>', 'Filter by category (demo, business, technical, education)')
  .option('-a, --audience <audience>', 'Filter by audience (executives, sales, technical, compliance, training)')
  .option('-d, --duration <duration>', 'Filter by duration (quick, standard, extended)')
  .option('--detailed', 'Show detailed scenario information')
  .action(async (options) => {
    console.log(chalk.blue.bold(`\n🎬 ${CLI_CONFIG.name}\n`));

    let scenarios = Object.values(PRODUCTION_DEMO_SCENARIOS);

    // Apply filters
    if (options.category) {
      const categoryScenarios = getScenariosByCategory(options.category);
      scenarios = scenarios.filter(s => categoryScenarios.some(cs => cs.name === s.name));
    }

    if (options.audience) {
      const audienceScenarios = getScenariosByAudience(options.audience);
      scenarios = scenarios.filter(s => audienceScenarios.some(as => as.name === s.name));
    }

    if (options.duration) {
      const durationScenarios = SCENARIO_METADATA.duration[options.duration] || [];
      scenarios = scenarios.filter(s => durationScenarios.includes(s.name.toLowerCase().replace(/\s+/g, '_')));
    }

    if (scenarios.length === 0) {
      console.log(chalk.yellow('No scenarios match the specified filters.'));
      return;
    }

    console.log(chalk.green(`Found ${scenarios.length} scenario(s):\n`));

    scenarios.forEach((scenario, index) => {
      console.log(chalk.cyan(`${index + 1}. ${scenario.name}`));
      console.log(chalk.gray(`   ${scenario.description}`));
      
      if (options.detailed) {
        console.log(chalk.gray(`   📊 Data: ${scenario.users} users, ${scenario.properties} properties, ${scenario.reviews} reviews`));
        console.log(chalk.gray(`   🎯 Fraud Rate: ${(scenario.fraudRate * 100).toFixed(1)}%`));
        console.log(chalk.gray(`   📅 Time Range: ${scenario.timeRange.startDate.toDateString()} - ${scenario.timeRange.endDate.toDateString()}`));
        console.log(chalk.gray(`   ✨ Features: ${Object.entries(scenario.features).filter(([_, enabled]) => enabled).map(([feature]) => feature).join(', ')}`));
      }
      
      console.log();
    });

    // Show category breakdown
    console.log(chalk.blue('📂 Available Categories:'));
    Object.entries(SCENARIO_METADATA.categories).forEach(([category, scenarioNames]) => {
      console.log(chalk.gray(`   ${category}: ${scenarioNames.length} scenarios`));
    });

    console.log(chalk.blue('\n👥 Available Audiences:'));
    Object.entries(SCENARIO_METADATA.audience).forEach(([audience, scenarioNames]) => {
      console.log(chalk.gray(`   ${audience}: ${scenarioNames.length} scenarios`));
    });
  });

/**
 * Generate a specific scenario
 */
program
  .command('generate <scenario>')
  .description('Generate data for a specific scenario')
  .option('-o, --output <dir>', 'Output directory', CLI_CONFIG.defaultOutputDir)
  .option('--force', 'Overwrite existing data')
  .option('--validate', 'Validate generated data')
  .action(async (scenarioName, options) => {
    const spinner = ora('Initializing scenario generation...').start();

    try {
      // Validate scenario exists
      const scenario = getScenario(scenarioName);
      if (!scenario) {
        spinner.fail(chalk.red(`Scenario '${scenarioName}' not found.`));
        console.log(chalk.yellow('\nAvailable scenarios:'));
        getAllScenarioNames().forEach(name => console.log(chalk.gray(`  - ${name}`)));
        return;
      }

      // Validate scenario configuration
      const validation = validateScenario(scenario);
      if (!validation.valid) {
        spinner.fail(chalk.red('Scenario validation failed:'));
        validation.errors.forEach(error => console.log(chalk.red(`  ❌ ${error}`)));
        return;
      }

      spinner.text = `Generating scenario: ${scenario.name}`;
      
      // Create output directory
      const outputDir = path.resolve(options.output);
      await mkdir(outputDir, { recursive: true });

      // Initialize scenario generator
      const generator = new ScenarioGenerator(scenarioName, outputDir);
      
      spinner.text = 'Generating demonstration data...';
      
      // Generate scenario data
      const startTime = Date.now();
      const data = await generator.generateScenarioData();
      const duration = Date.now() - startTime;

      spinner.succeed(chalk.green(`✅ Scenario '${scenario.name}' generated successfully!`));

      // Display generation summary
      console.log(chalk.blue('\n📊 Generation Summary:'));
      console.log(chalk.gray(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`   👥 Users: ${data.users.length}`));
      console.log(chalk.gray(`   🏠 Properties: ${data.properties.length}`));
      console.log(chalk.gray(`   ⭐ Reviews: ${data.reviews.length}`));
      console.log(chalk.gray(`   👨‍💼 Professionals: ${data.professionals.length}`));
      console.log(chalk.gray(`   ✅ Verifications: ${data.verificationSessions.length}`));
      console.log(chalk.gray(`   🚨 Fraud Cases: ${data.fraudCases.length}`));
      console.log(chalk.gray(`   📁 Output: ${outputDir}`));

      // Display key metrics
      console.log(chalk.blue('\n📈 Key Metrics:'));
      console.log(chalk.gray(`   🎯 Fraud Detection Rate: ${(data.analytics.security.fraudDetectionAccuracy * 100).toFixed(1)}%`));
      console.log(chalk.gray(`   ⚡ Average Response Time: ${data.analytics.performance.responseTime}ms`));
      console.log(chalk.gray(`   📊 Customer Satisfaction: ${data.analytics.business.customerSatisfaction}/5.0`));
      console.log(chalk.gray(`   🔒 Compliance Score: ${(data.analytics.security.complianceScore * 100).toFixed(1)}%`));

      // Validation if requested
      if (options.validate) {
        const validationSpinner = ora('Validating generated data...').start();
        
        // Perform data validation
        const validationResults = await validateGeneratedData(data);
        
        if (validationResults.valid) {
          validationSpinner.succeed(chalk.green('✅ Data validation passed'));
        } else {
          validationSpinner.fail(chalk.red('❌ Data validation failed'));
          validationResults.errors.forEach(error => {
            console.log(chalk.red(`  ❌ ${error}`));
          });
        }
      }

      console.log(chalk.green(`\n🎉 Demo scenario '${scenario.name}' is ready for use!`));
      console.log(chalk.blue(`📁 Data location: ${outputDir}`));

    } catch (error) {
      spinner.fail(chalk.red('Generation failed'));
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
    }
  });

/**
 * Interactive scenario selection
 */
program
  .command('interactive')
  .alias('i')
  .description('Interactive scenario selection and generation')
  .option('-o, --output <dir>', 'Output directory', CLI_CONFIG.defaultOutputDir)
  .action(async (options) => {
    console.log(chalk.blue.bold(`\n🎬 ${CLI_CONFIG.name}\n`));
    console.log(chalk.gray('Interactive mode - Let\'s create the perfect demo scenario!\n'));

    try {
      // Step 1: Select audience
      const audienceAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'audience',
          message: '👥 Who is your target audience?',
          choices: [
            { name: '🏢 Executives & Leadership', value: 'executives' },
            { name: '💼 Sales & Business Development', value: 'sales' },
            { name: '⚙️ Technical & Development Teams', value: 'technical' },
            { name: '📋 Compliance & Legal', value: 'compliance' },
            { name: '🎓 Training & Education', value: 'training' }
          ]
        }
      ]);

      // Step 2: Select duration
      const durationAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'duration',
          message: '⏱️ How much time do you have for the demo?',
          choices: [
            { name: '⚡ Quick (< 15 minutes)', value: 'quick' },
            { name: '📊 Standard (15-45 minutes)', value: 'standard' },
            { name: '🔬 Extended (> 45 minutes)', value: 'extended' }
          ]
        }
      ]);

      // Filter scenarios based on selections
      let availableScenarios = getScenariosByAudience(audienceAnswer.audience);
      
      if (SCENARIO_METADATA.duration[durationAnswer.duration]) {
        const durationScenarios = SCENARIO_METADATA.duration[durationAnswer.duration];
        availableScenarios = availableScenarios.filter(s => 
          durationScenarios.includes(s.name.toLowerCase().replace(/\s+/g, '_'))
        );
      }

      if (availableScenarios.length === 0) {
        console.log(chalk.yellow('No scenarios match your criteria. Showing all scenarios.'));
        availableScenarios = Object.values(PRODUCTION_DEMO_SCENARIOS);
      }

      // Step 3: Select specific scenario
      const scenarioAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'scenario',
          message: '🎯 Select your demo scenario:',
          choices: availableScenarios.map(scenario => ({
            name: `${scenario.name} - ${scenario.description}`,
            value: scenario.name.toLowerCase().replace(/\s+/g, '_')
          }))
        }
      ]);

      // Step 4: Confirm generation
      const selectedScenario = getScenario(scenarioAnswer.scenario);
      
      console.log(chalk.blue('\n📋 Scenario Summary:'));
      console.log(chalk.gray(`   Name: ${selectedScenario.name}`));
      console.log(chalk.gray(`   Description: ${selectedScenario.description}`));
      console.log(chalk.gray(`   Data Volume: ${selectedScenario.users} users, ${selectedScenario.properties} properties`));
      console.log(chalk.gray(`   Fraud Rate: ${(selectedScenario.fraudRate * 100).toFixed(1)}%`));

      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: '🚀 Generate this scenario?',
          default: true
        }
      ]);

      if (!confirmAnswer.proceed) {
        console.log(chalk.yellow('Generation cancelled.'));
        return;
      }

      // Step 5: Generate scenario
      const spinner = ora(`Generating ${selectedScenario.name} scenario...`).start();
      
      const outputDir = path.resolve(options.output);
      await mkdir(outputDir, { recursive: true });

      const generator = new ScenarioGenerator(scenarioAnswer.scenario, outputDir);
      const startTime = Date.now();
      const data = await generator.generateScenarioData();
      const duration = Date.now() - startTime;

      spinner.succeed(chalk.green(`✅ Scenario generated successfully in ${(duration / 1000).toFixed(2)}s!`));

      // Display success message with next steps
      console.log(chalk.green('\n🎉 Your demo scenario is ready!'));
      console.log(chalk.blue('\n📁 Generated Files:'));
      console.log(chalk.gray(`   📊 ${outputDir}/metadata.json - Scenario configuration`));
      console.log(chalk.gray(`   👥 ${outputDir}/users.json - User data`));
      console.log(chalk.gray(`   🏠 ${outputDir}/properties.json - Property listings`));
      console.log(chalk.gray(`   ⭐ ${outputDir}/reviews.json - User reviews`));
      console.log(chalk.gray(`   👨‍💼 ${outputDir}/professionals.json - Expert network`));
      console.log(chalk.gray(`   ✅ ${outputDir}/verification_sessions.json - Verification data`));
      console.log(chalk.gray(`   🚨 ${outputDir}/fraud_cases.json - Fraud detection cases`));
      console.log(chalk.gray(`   📈 ${outputDir}/analytics.json - Performance metrics`));

      console.log(chalk.blue('\n🚀 Next Steps:'));
      console.log(chalk.gray('   1. Import data into your TripleCheck database'));
      console.log(chalk.gray('   2. Configure your demo environment'));
      console.log(chalk.gray('   3. Practice your presentation flow'));
      console.log(chalk.gray('   4. Prepare for questions about the data'));

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

/**
 * Batch generate multiple scenarios
 */
program
  .command('batch')
  .description('Generate multiple scenarios in batch')
  .option('-s, --scenarios <scenarios...>', 'Scenario names to generate')
  .option('-c, --category <category>', 'Generate all scenarios in category')
  .option('-o, --output <dir>', 'Output directory', CLI_CONFIG.defaultOutputDir)
  .option('--parallel', 'Generate scenarios in parallel')
  .action(async (options) => {
    let scenarioNames: string[] = [];

    if (options.scenarios) {
      scenarioNames = options.scenarios;
    } else if (options.category) {
      const categoryScenarios = getScenariosByCategory(options.category);
      scenarioNames = categoryScenarios.map(s => s.name.toLowerCase().replace(/\s+/g, '_'));
    } else {
      console.log(chalk.red('Please specify scenarios with -s or category with -c'));
      return;
    }

    console.log(chalk.blue(`\n🔄 Batch generating ${scenarioNames.length} scenarios...\n`));

    const outputDir = path.resolve(options.output);
    await mkdir(outputDir, { recursive: true });

    const results = [];

    if (options.parallel) {
      // Parallel generation
      const promises = scenarioNames.map(async (scenarioName) => {
        const spinner = ora(`Generating ${scenarioName}...`).start();
        try {
          const generator = new ScenarioGenerator(scenarioName, outputDir);
          const startTime = Date.now();
          await generator.generateScenarioData();
          const duration = Date.now() - startTime;
          
          spinner.succeed(chalk.green(`✅ ${scenarioName} (${(duration / 1000).toFixed(2)}s)`));
          return { scenario: scenarioName, success: true, duration };
        } catch (error) {
          spinner.fail(chalk.red(`❌ ${scenarioName}: ${error.message}`));
          return { scenario: scenarioName, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    } else {
      // Sequential generation
      for (const scenarioName of scenarioNames) {
        const spinner = ora(`Generating ${scenarioName}...`).start();
        try {
          const generator = new ScenarioGenerator(scenarioName, outputDir);
          const startTime = Date.now();
          await generator.generateScenarioData();
          const duration = Date.now() - startTime;
          
          spinner.succeed(chalk.green(`✅ ${scenarioName} (${(duration / 1000).toFixed(2)}s)`));
          results.push({ scenario: scenarioName, success: true, duration });
        } catch (error) {
          spinner.fail(chalk.red(`❌ ${scenarioName}: ${error.message}`));
          results.push({ scenario: scenarioName, success: false, error: error.message });
        }
      }
    }

    // Display batch results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(chalk.blue('\n📊 Batch Generation Results:'));
    console.log(chalk.green(`   ✅ Successful: ${successful.length}`));
    console.log(chalk.red(`   ❌ Failed: ${failed.length}`));

    if (successful.length > 0) {
      const totalTime = successful.reduce((sum, r) => sum + r.duration, 0);
      console.log(chalk.gray(`   ⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`));
      console.log(chalk.gray(`   📁 Output: ${outputDir}`));
    }

    if (failed.length > 0) {
      console.log(chalk.red('\n❌ Failed Scenarios:'));
      failed.forEach(f => {
        console.log(chalk.red(`   ${f.scenario}: ${f.error}`));
      });
    }
  });

/**
 * Validate generated data
 */
async function validateGeneratedData(data: any): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate data structure
  if (!data.users || !Array.isArray(data.users)) {
    errors.push('Users data is missing or invalid');
  }

  if (!data.properties || !Array.isArray(data.properties)) {
    errors.push('Properties data is missing or invalid');
  }

  if (!data.reviews || !Array.isArray(data.reviews)) {
    errors.push('Reviews data is missing or invalid');
  }

  // Validate data relationships
  if (data.users && data.reviews) {
    const userIds = new Set(data.users.map(u => u.id));
    const invalidReviews = data.reviews.filter(r => !userIds.has(r.userId));
    if (invalidReviews.length > 0) {
      errors.push(`${invalidReviews.length} reviews reference non-existent users`);
    }
  }

  if (data.properties && data.reviews) {
    const propertyIds = new Set(data.properties.map(p => p.id));
    const invalidReviews = data.reviews.filter(r => !propertyIds.has(r.propertyId));
    if (invalidReviews.length > 0) {
      errors.push(`${invalidReviews.length} reviews reference non-existent properties`);
    }
  }

  // Validate data quality
  if (data.users) {
    const usersWithoutEmail = data.users.filter(u => !u.email);
    if (usersWithoutEmail.length > 0) {
      errors.push(`${usersWithoutEmail.length} users missing email addresses`);
    }
  }

  if (data.properties) {
    const propertiesWithoutPrice = data.properties.filter(p => !p.price || p.price <= 0);
    if (propertiesWithoutPrice.length > 0) {
      errors.push(`${propertiesWithoutPrice.length} properties have invalid prices`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Show help information
 */
program
  .command('help-scenarios')
  .description('Show detailed help about available scenarios')
  .action(() => {
    console.log(chalk.blue.bold(`\n🎬 ${CLI_CONFIG.name} - Scenario Guide\n`));

    console.log(chalk.green('📋 Available Scenarios:\n'));

    Object.entries(PRODUCTION_DEMO_SCENARIOS).forEach(([key, scenario]) => {
      console.log(chalk.cyan(`🎯 ${scenario.name}`));
      console.log(chalk.gray(`   ID: ${key}`));
      console.log(chalk.gray(`   Description: ${scenario.description}`));
      console.log(chalk.gray(`   Data Volume: ${scenario.users} users, ${scenario.properties} properties`));
      console.log(chalk.gray(`   Fraud Rate: ${(scenario.fraudRate * 100).toFixed(1)}%`));
      console.log(chalk.gray(`   Time Range: ${scenario.timeRange.startDate.getFullYear()}`));
      console.log();
    });

    console.log(chalk.blue('🚀 Quick Start Examples:\n'));
    console.log(chalk.gray('  # List all scenarios'));
    console.log(chalk.white('  demo-scenarios list\n'));
    console.log(chalk.gray('  # Generate executive demo'));
    console.log(chalk.white('  demo-scenarios generate executive_demo\n'));
    console.log(chalk.gray('  # Interactive mode'));
    console.log(chalk.white('  demo-scenarios interactive\n'));
    console.log(chalk.gray('  # Batch generate all demo scenarios'));
    console.log(chalk.white('  demo-scenarios batch -c demo\n'));
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue.bold(`\n🎬 ${CLI_CONFIG.name}\n`));
  console.log(chalk.gray('Generate production-ready demonstration data for TripleCheck system\n'));
  program.outputHelp();
  console.log(chalk.blue('\n🚀 Quick Start:'));
  console.log(chalk.white('  demo-scenarios interactive  # Interactive scenario selection'));
  console.log(chalk.white('  demo-scenarios list         # List available scenarios'));
  console.log(chalk.white('  demo-scenarios help-scenarios # Detailed scenario guide'));
}