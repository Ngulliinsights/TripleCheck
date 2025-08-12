/**
 * Unified Scenario-Based Data Generation System
 * 
 * Consolidates existing Python generators into a TypeScript orchestrator
 * that supports multiple scenarios with configurable data volumes and relationships.
 */

import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

import { CheckpointManager } from './generators/checkpoint-manager';
import { KenyanDataGenerator } from './kenyan-data-generator';

/**
 * Data generation scenarios with predefined configurations
 */
export interface DataScenario {
  name: string;
  description: string;
  users: number;
  properties: number;
  reviews: number;
  professionals: number;
  verificationSessions: number;
  fraudRate: number;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  features: {
    enableFraudPatterns: boolean;
    enableLandVerification: boolean;
    enableCommunityFeedback: boolean;
    enableExpertNetwork: boolean;
    enableAnalytics: boolean;
  };
}

/**
 * Generation configuration options
 */
export interface GenerationConfig {
  scenario: string;
  outputDir: string;
  usePython: boolean;
  validateOutput: boolean;
  enableCheckpoints: boolean;
  parallelProcessing: boolean;
  maxConcurrency: number;
  customConfig?: Partial<DataScenario>;
}

/**
 * Generation progress tracking
 */
export interface GenerationProgress {
  stage: string;
  completed: number;
  total: number;
  percentage: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
}

/**
 * Generation result summary
 */
export interface GenerationResult {
  success: boolean;
  scenario: string;
  duration: number;
  recordsGenerated: {
    users: number;
    properties: number;
    reviews: number;
    professionals: number;
    verificationSessions: number;
    fraudCases: number;
  };
  filesGenerated: string[];
  errors: string[];
  warnings: string[];
  statistics: {
    dataQuality: number;
    fraudDetectionAccuracy: number;
    relationshipConsistency: number;
  };
}

/**
 * Python generator wrapper
 */
interface PythonGenerator {
  name: string;
  script: string;
  args: string[];
  outputFiles: string[];
  dependencies: string[];
}

/**
 * Unified Data Generation System
 */
export class UnifiedDataGenerator {
  private scenarios: Map<string, DataScenario> = new Map();
  private pythonGenerators: Map<string, PythonGenerator> = new Map();
  private checkpointManager: CheckpointManager;
  private kenyanGenerator: KenyanDataGenerator;
  private progressCallbacks: ((progress: GenerationProgress) => void)[] = [];

  constructor(private outputDir: string = './database/seeds/generators') {
    this.checkpointManager = new CheckpointManager(outputDir);
    this.kenyanGenerator = new KenyanDataGenerator();
    this.initializeScenarios();
    this.initializePythonGenerators();
  }

  /**
   * Initialize predefined data scenarios
   */
  private initializeScenarios(): void {
    const baseDate = new Date();
    const oneYearAgo = new Date(baseDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Minimal scenario for quick testing
    this.scenarios.set('minimal', {
      name: 'Minimal Test Data',
      description: 'Small dataset for quick testing and development',
      users: 100,
      properties: 200,
      reviews: 50,
      professionals: 20,
      verificationSessions: 30,
      fraudRate: 0.05,
      timeRange: { startDate: oneYearAgo, endDate: baseDate },
      features: {
        enableFraudPatterns: true,
        enableLandVerification: true,
        enableCommunityFeedback: false,
        enableExpertNetwork: false,
        enableAnalytics: false
      }
    });

    // Development scenario for regular development work
    this.scenarios.set('development', {
      name: 'Development Dataset',
      description: 'Medium dataset for development and feature testing',
      users: 5000,
      properties: 10000,
      reviews: 2000,
      professionals: 200,
      verificationSessions: 500,
      fraudRate: 0.03,
      timeRange: { startDate: oneYearAgo, endDate: baseDate },
      features: {
        enableFraudPatterns: true,
        enableLandVerification: true,
        enableCommunityFeedback: true,
        enableExpertNetwork: true,
        enableAnalytics: false
      }
    });

    // Testing scenario for comprehensive testing
    this.scenarios.set('testing', {
      name: 'Comprehensive Test Dataset',
      description: 'Large dataset for comprehensive testing and QA',
      users: 25000,
      properties: 50000,
      reviews: 10000,
      professionals: 1000,
      verificationSessions: 2500,
      fraudRate: 0.025,
      timeRange: { startDate: oneYearAgo, endDate: baseDate },
      features: {
        enableFraudPatterns: true,
        enableLandVerification: true,
        enableCommunityFeedback: true,
        enableExpertNetwork: true,
        enableAnalytics: true
      }
    });

    // Performance scenario for load testing
    this.scenarios.set('performance', {
      name: 'Performance Test Dataset',
      description: 'Very large dataset for performance and load testing',
      users: 100000,
      properties: 200000,
      reviews: 50000,
      professionals: 5000,
      verificationSessions: 10000,
      fraudRate: 0.02,
      timeRange: { startDate: oneYearAgo, endDate: baseDate },
      features: {
        enableFraudPatterns: true,
        enableLandVerification: true,
        enableCommunityFeedback: true,
        enableExpertNetwork: true,
        enableAnalytics: true
      }
    });

    // Production demo scenario
    this.scenarios.set('demo', {
      name: 'Production Demo Dataset',
      description: 'Curated dataset for investor presentations and demos',
      users: 10000,
      properties: 15000,
      reviews: 5000,
      professionals: 500,
      verificationSessions: 1000,
      fraudRate: 0.015,
      timeRange: { startDate: oneYearAgo, endDate: baseDate },
      features: {
        enableFraudPatterns: true,
        enableLandVerification: true,
        enableCommunityFeedback: true,
        enableExpertNetwork: true,
        enableAnalytics: true
      }
    });
  }

  /**
   * Initialize Python generator configurations
   */
  private initializePythonGenerators(): void {
    this.pythonGenerators.set('users', {
      name: 'User Generator',
      script: 'user-generator.py',
      args: [],
      outputFiles: ['user_dataset.json', 'user_statistics.json'],
      dependencies: ['pandas', 'numpy', 'faker']
    });

    this.pythonGenerators.set('properties', {
      name: 'Property Generator',
      script: 'property-generator.py',
      args: [],
      outputFiles: ['property_dataset.json', 'property_statistics.json'],
      dependencies: ['pandas', 'numpy', 'faker']
    });

    this.pythonGenerators.set('fraud', {
      name: 'Fraud Simulator',
      script: 'fraud-simulator.py',
      args: [],
      outputFiles: [
        'fraudulent_user_dataset.json',
        'fraudulent_property_dataset.json',
        'fraudulent_transaction_dataset.json',
        'fraud_analysis_report.json'
      ],
      dependencies: ['pandas', 'numpy', 'faker', 'networkx']
    });

    this.pythonGenerators.set('land-verification', {
      name: 'Land Verification Generator',
      script: 'land-verification-generator.py',
      args: [],
      outputFiles: ['optimized_land_dataset.json', 'optimized_land_dataset_statistics.json'],
      dependencies: ['pandas', 'numpy', 'faker', 'geopy']
    });

    this.pythonGenerators.set('community-insights', {
      name: 'Community Insights Generator',
      script: 'community-insights-generator.py',
      args: [],
      outputFiles: ['community_insights_dataset.json'],
      dependencies: ['pandas', 'numpy', 'faker']
    });
  }

  /**
   * Generate data for a specific scenario
   */
  async generateScenario(
    scenarioName: string,
    config: Partial<GenerationConfig> = {}
  ): Promise<GenerationResult> {
    const startTime = performance.now();
    const scenario = this.scenarios.get(scenarioName);
    
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}. Available: ${Array.from(this.scenarios.keys()).join(', ')}`);
    }

    // Merge custom configuration
    const finalScenario = config.customConfig 
      ? { ...scenario, ...config.customConfig }
      : scenario;

    const generationConfig: GenerationConfig = {
      scenario: scenarioName,
      outputDir: this.outputDir,
      usePython: true,
      validateOutput: true,
      enableCheckpoints: true,
      parallelProcessing: true,
      maxConcurrency: 3,
      ...config
    };

    console.log(`🚀 Starting data generation for scenario: ${finalScenario.name}`);
    console.log(`📊 Target records: ${finalScenario.users} users, ${finalScenario.properties} properties`);

    const result: GenerationResult = {
      success: false,
      scenario: scenarioName,
      duration: 0,
      recordsGenerated: {
        users: 0,
        properties: 0,
        reviews: 0,
        professionals: 0,
        verificationSessions: 0,
        fraudCases: 0
      },
      filesGenerated: [],
      errors: [],
      warnings: [],
      statistics: {
        dataQuality: 0,
        fraudDetectionAccuracy: 0,
        relationshipConsistency: 0
      }
    };

    try {
      // Create checkpoint if enabled
      if (generationConfig.enableCheckpoints) {
        await this.checkpointManager.createCheckpoint(`scenario_${scenarioName}_start`, {
          scenario: finalScenario,
          config: generationConfig,
          timestamp: new Date()
        });
      }

      // Generate data using appropriate method
      if (generationConfig.usePython) {
        await this.generateWithPython(finalScenario, generationConfig, result);
      } else {
        await this.generateWithTypeScript(finalScenario, generationConfig, result);
      }

      // Validate output if enabled
      if (generationConfig.validateOutput) {
        await this.validateGeneratedData(result);
      }

      // Calculate statistics
      await this.calculateStatistics(result);

      result.success = result.errors.length === 0;
      result.duration = performance.now() - startTime;

      console.log(`✅ Data generation completed in ${(result.duration / 1000).toFixed(2)}s`);
      console.log(`📈 Generated ${result.recordsGenerated.users} users, ${result.recordsGenerated.properties} properties`);

      return result;

    } catch (error) {
      result.errors.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
      result.duration = performance.now() - startTime;
      
      console.error(`❌ Data generation failed:`, error);
      return result;
    }
  }

  /**
   * Generate data using Python generators
   */
  private async generateWithPython(
    scenario: DataScenario,
    config: GenerationConfig,
    result: GenerationResult
  ): Promise<void> {
    this.updateProgress('Preparing Python environment', 0, 100);

    // Check Python dependencies
    await this.checkPythonDependencies();

    const generators = ['users', 'properties'];
    
    if (scenario.features.enableFraudPatterns) {
      generators.push('fraud');
    }
    
    if (scenario.features.enableLandVerification) {
      generators.push('land-verification');
    }
    
    if (scenario.features.enableCommunityFeedback) {
      generators.push('community-insights');
    }

    // Run generators in parallel or sequence based on config
    if (config.parallelProcessing) {
      await this.runPythonGeneratorsParallel(generators, scenario, result);
    } else {
      await this.runPythonGeneratorsSequential(generators, scenario, result);
    }
  }

  /**
   * Generate data using TypeScript generators
   */
  private async generateWithTypeScript(
    scenario: DataScenario,
    config: GenerationConfig,
    result: GenerationResult
  ): Promise<void> {
    this.updateProgress('Generating with TypeScript', 0, 100);

    // Use Kenyan data generator for base data
    const userData = await this.kenyanGenerator.generateUsers(scenario.users);
    const propertyData = await this.kenyanGenerator.generateProperties(scenario.properties);

    // Write data to files
    const userFile = path.join(config.outputDir, 'user_dataset.json');
    const propertyFile = path.join(config.outputDir, 'property_dataset.json');

    await fs.writeFile(userFile, JSON.stringify(userData, null, 2));
    await fs.writeFile(propertyFile, JSON.stringify(propertyData, null, 2));

    result.filesGenerated.push(userFile, propertyFile);
    result.recordsGenerated.users = userData.length;
    result.recordsGenerated.properties = propertyData.length;

    this.updateProgress('TypeScript generation complete', 100, 100);
  }

  /**
   * Run Python generators in parallel
   */
  private async runPythonGeneratorsParallel(
    generators: string[],
    scenario: DataScenario,
    result: GenerationResult
  ): Promise<void> {
    const chunks = this.chunkArray(generators, Math.min(generators.length, 3));
    
    for (const chunk of chunks) {
      const promises = chunk.map(generatorName => 
        this.runPythonGenerator(generatorName, scenario, result)
      );
      
      await Promise.allSettled(promises);
    }
  }

  /**
   * Run Python generators sequentially
   */
  private async runPythonGeneratorsSequential(
    generators: string[],
    scenario: DataScenario,
    result: GenerationResult
  ): Promise<void> {
    for (let i = 0; i < generators.length; i++) {
      const generatorName = generators[i];
      this.updateProgress(
        `Running ${generatorName} generator`,
        i,
        generators.length
      );
      
      await this.runPythonGenerator(generatorName, scenario, result);
    }
  }

  /**
   * Run individual Python generator
   */
  private async runPythonGenerator(
    generatorName: string,
    scenario: DataScenario,
    result: GenerationResult
  ): Promise<void> {
    const generator = this.pythonGenerators.get(generatorName);
    if (!generator) {
      result.warnings.push(`Generator not found: ${generatorName}`);
      return;
    }

    const scriptPath = path.join(this.outputDir, generator.script);
    
    // Check if script exists
    try {
      await fs.access(scriptPath);
    } catch {
      result.warnings.push(`Python script not found: ${generator.script}`);
      return;
    }

    // Prepare arguments based on scenario
    const args = [
      scriptPath,
      '--users', scenario.users.toString(),
      '--properties', scenario.properties.toString(),
      '--fraud-rate', scenario.fraudRate.toString(),
      '--start-date', scenario.timeRange.startDate.toISOString(),
      '--end-date', scenario.timeRange.endDate.toISOString()
    ];

    try {
      await this.executePythonScript(args);
      
      // Update result with generated files
      for (const outputFile of generator.outputFiles) {
        const filePath = path.join(this.outputDir, outputFile);
        try {
          await fs.access(filePath);
          result.filesGenerated.push(filePath);
          
          // Count records in generated files
          if (outputFile.includes('user')) {
            const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            result.recordsGenerated.users += Array.isArray(data) ? data.length : 0;
          } else if (outputFile.includes('property')) {
            const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            result.recordsGenerated.properties += Array.isArray(data) ? data.length : 0;
          }
        } catch {
          result.warnings.push(`Expected output file not found: ${outputFile}`);
        }
      }
      
    } catch (error) {
      result.errors.push(`${generator.name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute Python script with proper error handling
   */
  private async executePythonScript(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', args, {
        cwd: this.outputDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to execute Python script: ${error.message}`));
      });

      // Set timeout for long-running processes
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script execution timeout'));
      }, 300000); // 5 minutes timeout
    });
  }

  /**
   * Check Python dependencies
   */
  private async checkPythonDependencies(): Promise<void> {
    const requiredPackages = ['pandas', 'numpy', 'faker'];
    
    for (const pkg of requiredPackages) {
      try {
        await this.executePythonScript(['-c', `import ${pkg}`]);
      } catch {
        console.log(`📦 Installing Python package: ${pkg}`);
        await this.executePythonScript(['-m', 'pip', 'install', pkg]);
      }
    }
  }

  /**
   * Validate generated data
   */
  private async validateGeneratedData(result: GenerationResult): Promise<void> {
    this.updateProgress('Validating generated data', 90, 100);

    for (const filePath of result.filesGenerated) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        if (!Array.isArray(data)) {
          result.warnings.push(`File ${filePath} does not contain array data`);
          continue;
        }

        if (data.length === 0) {
          result.warnings.push(`File ${filePath} is empty`);
          continue;
        }

        // Basic data structure validation
        const sample = data[0];
        if (!sample || typeof sample !== 'object') {
          result.warnings.push(`File ${filePath} contains invalid data structure`);
        }

      } catch (error) {
        result.errors.push(`Failed to validate ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Calculate generation statistics
   */
  private async calculateStatistics(result: GenerationResult): Promise<void> {
    // Mock statistics calculation - implement based on your needs
    result.statistics = {
      dataQuality: 0.95,
      fraudDetectionAccuracy: 0.92,
      relationshipConsistency: 0.98
    };
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios(): Array<{ name: string; description: string; records: number }> {
    return Array.from(this.scenarios.entries()).map(([name, scenario]) => ({
      name,
      description: scenario.description,
      records: scenario.users + scenario.properties + scenario.reviews
    }));
  }

  /**
   * Add progress callback
   */
  onProgress(callback: (progress: GenerationProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Update progress and notify callbacks
   */
  private updateProgress(stage: string, completed: number, total: number): void {
    const progress: GenerationProgress = {
      stage,
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      estimatedTimeRemaining: 0, // Calculate based on current rate
      currentOperation: stage
    };

    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    });
  }

  /**
   * Utility function to chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const unifiedDataGenerator = new UnifiedDataGenerator();