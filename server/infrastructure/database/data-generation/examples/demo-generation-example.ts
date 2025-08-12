/**
 * TripleCheck Demo Generation Examples
 * 
 * Practical examples showing how to use the Production Demo Data Generator
 * for different scenarios and use cases.
 */

import { 
  ProductionDemoGenerator, 
  generateQuickDemo, 
  generateAllDemoScenarios,
  DemoGenerationConfig 
} from '../scenarios/production-demo-generator';
import { 
  PRODUCTION_DEMO_SCENARIOS, 
  getScenario,
  getScenariosByAudience 
} from '../scenarios/production-demo-scenarios';

/**
 * Example 1: Quick Executive Demo
 * Perfect for last-minute presentation preparation
 */
async function generateExecutiveDemo() {
  console.log('🎯 Generating Executive Demo...\n');
  
  try {
    // Quick generation with default settings
    const result = await generateQuickDemo('executive_demo');
    
    console.log('✅ Executive Demo Generated Successfully!');
    console.log(`📊 Records: ${Object.values(result.recordsGenerated).reduce((a, b) => a + b, 0)}`);
    console.log(`⏱️  Duration: ${Math.round(result.duration)}ms`);
    console.log(`📁 Output: ./database/data-generation/output/demo`);
    
    return result;
  } catch (error) {
    console.error('❌ Executive demo generation failed:', error);
    throw error;
  }
}

/**
 * Example 2: Custom Sales Demo with Specific Requirements
 * Tailored for a specific sales presentation
 */
async function generateCustomSalesDemo() {
  console.log('💼 Generating Custom Sales Demo...\n');
  
  const generator = new ProductionDemoGenerator('./output/custom-sales-demo');
  
  // Setup progress tracking
  generator.onProgress((progress) => {
    console.log(`${progress.stage}: ${progress.percentage.toFixed(1)}% - ${progress.currentOperation}`);
  });
  
  const config: DemoGenerationConfig = {
    scenario: 'sales_demo',
    outputDir: './database/data-generation/output/custom-sales-demo',
    includeNarratives: true,
    generateShowcaseData: true,
    createVisualizations: true,
    exportFormats: ['json', 'csv', 'excel'],
    customization: {
      targetAudience: 'sales',
      demoLength: 'standard',
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu'],
      emphasizeFeatures: [
        'fraud_detection',
        'community_validation',
        'expert_network',
        'government_integration'
      ]
    }
  };
  
  try {
    const result = await generator.generateDemoScenario(config);
    
    console.log('\n✅ Custom Sales Demo Generated Successfully!');
    console.log('📊 Generation Results:');
    console.log(`  - Users: ${result.recordsGenerated.users || 0}`);
    console.log(`  - Properties: ${result.recordsGenerated.properties || 0}`);
    console.log(`  - Fraud Cases: ${result.recordsGenerated.fraudCases || 0}`);
    console.log(`  - Success Stories: ${result.recordsGenerated.successStories || 0}`);
    console.log(`  - Files Generated: ${result.filesGenerated.length}`);
    console.log(`  - Quality Score: ${(result.statistics.dataQuality * 100).toFixed(1)}%`);
    
    return result;
  } catch (error) {
    console.error('❌ Custom sales demo generation failed:', error);
    throw error;
  }
}

/**
 * Example 3: Technical Demo for Developer Audience
 * Comprehensive technical demonstration with performance metrics
 */
async function generateTechnicalDemo() {
  console.log('🔧 Generating Technical Demo...\n');
  
  const generator = new ProductionDemoGenerator('./output/technical-demo');
  
  const config: DemoGenerationConfig = {
    scenario: 'technical_demo',
    outputDir: './database/data-generation/output/technical-demo',
    includeNarratives: true,
    generateShowcaseData: true,
    createVisualizations: true,
    exportFormats: ['json', 'sql'],
    customization: {
      targetAudience: 'technical',
      demoLength: 'extended',
      focusRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
      emphasizeFeatures: [
        'api_performance',
        'scalability',
        'security',
        'monitoring',
        'integration_capabilities'
      ]
    }
  };
  
  try {
    const result = await generator.generateDemoScenario(config);
    
    console.log('\n✅ Technical Demo Generated Successfully!');
    console.log('🔧 Technical Highlights:');
    console.log(`  - Performance Metrics: Included`);
    console.log(`  - API Examples: Generated`);
    console.log(`  - Architecture Diagrams: Configured`);
    console.log(`  - Scalability Data: ${result.recordsGenerated.users} users, ${result.recordsGenerated.properties} properties`);
    console.log(`  - Security Features: Demonstrated`);
    
    return result;
  } catch (error) {
    console.error('❌ Technical demo generation failed:', error);
    throw error;
  }
}

/**
 * Example 4: Multi-Scenario Generation for Complete Demo Suite
 * Generate multiple scenarios for different presentation needs
 */
async function generateCompleteDemoSuite() {
  console.log('🎯 Generating Complete Demo Suite...\n');
  
  const scenarios = ['executive_demo', 'sales_demo', 'technical_demo', 'customer_success'];
  const results = [];
  
  for (const scenarioName of scenarios) {
    console.log(`\n📋 Generating ${scenarioName}...`);
    
    const generator = new ProductionDemoGenerator(`./output/demo-suite/${scenarioName}`);
    
    const config: DemoGenerationConfig = {
      scenario: scenarioName,
      outputDir: `./database/data-generation/output/demo-suite/${scenarioName}`,
      includeNarratives: true,
      generateShowcaseData: true,
      createVisualizations: true,
      exportFormats: ['json'],
      customization: {
        targetAudience: scenarioName.includes('executive') ? 'executives' : 
                       scenarioName.includes('sales') ? 'sales' : 
                       scenarioName.includes('technical') ? 'technical' : 'sales',
        demoLength: scenarioName.includes('executive') ? 'quick' : 'standard'
      }
    };
    
    try {
      const result = await generator.generateDemoScenario(config);
      results.push(result);
      console.log(`✅ ${scenarioName} completed`);
    } catch (error) {
      console.error(`❌ ${scenarioName} failed:`, error);
      results.push({
        success: false,
        scenario: scenarioName,
        error: error.message
      });
    }
  }
  
  console.log('\n🎉 Complete Demo Suite Generation Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = result.success ? `${Math.round(result.duration)}ms` : 'failed';
    console.log(`  ${status} ${result.scenario} (${duration})`);
  });
  
  return results;
}

/**
 * Example 5: Performance Benchmark Data Generation
 * Generate high-volume data for performance testing
 */
async function generatePerformanceBenchmark() {
  console.log('📊 Generating Performance Benchmark Data...\n');
  
  const generator = new ProductionDemoGenerator('./output/performance-benchmark');
  
  // Track progress for large data generation
  generator.onProgress((progress) => {
    if (progress.percentage % 10 === 0) { // Log every 10%
      console.log(`📈 ${progress.stage}: ${progress.percentage.toFixed(1)}% complete`);
    }
  });
  
  const config: DemoGenerationConfig = {
    scenario: 'performance_benchmark',
    outputDir: './database/data-generation/output/performance-benchmark',
    includeNarratives: false, // Skip narratives for performance testing
    generateShowcaseData: false, // Skip showcase data for performance testing
    createVisualizations: true,
    exportFormats: ['json', 'sql'],
    customization: {
      targetAudience: 'technical',
      demoLength: 'extended'
    }
  };
  
  try {
    const result = await generator.generateDemoScenario(config);
    
    console.log('\n✅ Performance Benchmark Data Generated!');
    console.log('📊 Performance Data Summary:');
    console.log(`  - Total Records: ${Object.values(result.recordsGenerated).reduce((a, b) => a + b, 0)}`);
    console.log(`  - Generation Time: ${Math.round(result.duration)}ms`);
    console.log(`  - Data Quality: ${(result.statistics.dataQuality * 100).toFixed(1)}%`);
    console.log(`  - Ready for Load Testing: Yes`);
    
    return result;
  } catch (error) {
    console.error('❌ Performance benchmark generation failed:', error);
    throw error;
  }
}

/**
 * Example 6: Scenario Validation and Quality Check
 * Validate generated demo data for quality and consistency
 */
async function validateDemoData(outputDir: string) {
  console.log(`🔍 Validating Demo Data in ${outputDir}...\n`);
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check for required files
    const requiredFiles = [
      'demo_data.json',
      'showcase_users.json',
      'showcase_properties.json',
      'demo_fraud_cases.json',
      'success_stories.json',
      'DEMO_GUIDE.md'
    ];
    
    const validationResults = {
      filesPresent: 0,
      filesValid: 0,
      dataQuality: 0,
      errors: [] as string[]
    };
    
    for (const file of requiredFiles) {
      const filePath = path.join(outputDir, file);
      
      try {
        await fs.access(filePath);
        validationResults.filesPresent++;
        
        if (file.endsWith('.json')) {
          const content = await fs.readFile(filePath, 'utf-8');
          JSON.parse(content); // Validate JSON
          validationResults.filesValid++;
        } else {
          validationResults.filesValid++;
        }
        
        console.log(`✅ ${file}: Valid`);
      } catch (error) {
        validationResults.errors.push(`${file}: ${error.message}`);
        console.log(`❌ ${file}: Missing or invalid`);
      }
    }
    
    // Calculate overall quality score
    validationResults.dataQuality = validationResults.filesValid / requiredFiles.length;
    
    console.log('\n📊 Validation Summary:');
    console.log(`  - Files Present: ${validationResults.filesPresent}/${requiredFiles.length}`);
    console.log(`  - Files Valid: ${validationResults.filesValid}/${requiredFiles.length}`);
    console.log(`  - Data Quality: ${(validationResults.dataQuality * 100).toFixed(1)}%`);
    
    if (validationResults.errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      validationResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return validationResults;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

/**
 * Example 7: Batch Generation with Error Handling
 * Generate multiple scenarios with comprehensive error handling
 */
async function batchGenerateWithErrorHandling() {
  console.log('🔄 Batch Generation with Error Handling...\n');
  
  const scenarios = Object.keys(PRODUCTION_DEMO_SCENARIOS);
  const results = [];
  const errors = [];
  
  for (const scenario of scenarios) {
    console.log(`\n📋 Processing ${scenario}...`);
    
    try {
      const generator = new ProductionDemoGenerator(`./output/batch/${scenario}`);
      
      const config: DemoGenerationConfig = {
        scenario,
        outputDir: `./database/data-generation/output/batch/${scenario}`,
        includeNarratives: true,
        generateShowcaseData: true,
        createVisualizations: false, // Skip visualizations for batch processing
        exportFormats: ['json'],
        customization: {
          targetAudience: 'sales',
          demoLength: 'standard'
        }
      };
      
      const result = await generator.generateDemoScenario(config);
      results.push(result);
      
      // Validate generated data
      const validation = await validateDemoData(config.outputDir);
      if (validation.dataQuality < 0.9) {
        console.log(`⚠️  ${scenario}: Low quality score (${(validation.dataQuality * 100).toFixed(1)}%)`);
      }
      
      console.log(`✅ ${scenario}: Success`);
      
    } catch (error) {
      errors.push({ scenario, error: error.message });
      console.log(`❌ ${scenario}: Failed - ${error.message}`);
    }
  }
  
  console.log('\n🎉 Batch Generation Complete!');
  console.log(`✅ Successful: ${results.length}`);
  console.log(`❌ Failed: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Failed Scenarios:');
    errors.forEach(({ scenario, error }) => {
      console.log(`  - ${scenario}: ${error}`);
    });
  }
  
  return { results, errors };
}

/**
 * Main execution function - demonstrates all examples
 */
async function runAllExamples() {
  console.log('🚀 TripleCheck Demo Generation Examples\n');
  console.log('=' .repeat(50));
  
  try {
    // Example 1: Quick Executive Demo
    console.log('\n1️⃣  EXAMPLE 1: Quick Executive Demo');
    console.log('-'.repeat(40));
    await generateExecutiveDemo();
    
    // Example 2: Custom Sales Demo
    console.log('\n2️⃣  EXAMPLE 2: Custom Sales Demo');
    console.log('-'.repeat(40));
    await generateCustomSalesDemo();
    
    // Example 3: Technical Demo
    console.log('\n3️⃣  EXAMPLE 3: Technical Demo');
    console.log('-'.repeat(40));
    await generateTechnicalDemo();
    
    // Example 4: Complete Demo Suite
    console.log('\n4️⃣  EXAMPLE 4: Complete Demo Suite');
    console.log('-'.repeat(40));
    await generateCompleteDemoSuite();
    
    // Example 5: Performance Benchmark
    console.log('\n5️⃣  EXAMPLE 5: Performance Benchmark');
    console.log('-'.repeat(40));
    await generatePerformanceBenchmark();
    
    // Example 6: Data Validation
    console.log('\n6️⃣  EXAMPLE 6: Data Validation');
    console.log('-'.repeat(40));
    await validateDemoData('./database/data-generation/output/demo');
    
    console.log('\n🎉 All Examples Completed Successfully!');
    console.log('📁 Check output directories for generated demo data');
    console.log('📖 Read DEMO_GUIDE.md files for presentation instructions');
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
    process.exit(1);
  }
}

/**
 * Individual example runners for selective execution
 */
export {
  generateExecutiveDemo,
  generateCustomSalesDemo,
  generateTechnicalDemo,
  generateCompleteDemoSuite,
  generatePerformanceBenchmark,
  validateDemoData,
  batchGenerateWithErrorHandling,
  runAllExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}