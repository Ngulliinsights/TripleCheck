/**
 * TripleCheck Data Generation System - Main Exports
 * 
 * Consolidated exports for all data generation functionality
 */

// Core generators
export { UnifiedDataGenerator } from './core/UnifiedDataGenerator';
export { KenyanDataGenerator } from './core/KenyanDataGenerator';
export { CheckpointManager } from './core/checkpoint-manager';

// Generator types and interfaces
export type {
  DataScenario,
  GenerationConfig,
  GenerationProgress,
  GenerationResult
} from './core/UnifiedDataGenerator';

// Scenarios
export * from './scenarios';

// Individual generators
export * from './generators';

// Integrations
export { DatabaseLoader } from './integrations/database-loader';
export { CacheWarmer } from './integrations/cache-warmer';
export { MigrationHelper } from './integrations/migration-helper';

// Utilities
export { DataValidator } from './core/data-validator';

// CLI utilities
export { runDataGenerationCLI } from './cli/unified-data-generation';

// Constants
export const DATA_GENERATION_VERSION = '1.0.0';
export const DEFAULT_OUTPUT_DIR = './database/data-generation/output';
export const SUPPORTED_SCENARIOS = ['minimal', 'development', 'testing', 'performance', 'demo'] as const;

// Default configuration
export const DEFAULT_CONFIG = {
  outputDir: DEFAULT_OUTPUT_DIR,
  usePython: true,
  validateOutput: true,
  enableCheckpoints: true,
  parallelProcessing: true,
  maxConcurrency: 3
};

/**
 * Quick setup function for common use cases
 */
export function createDataGenerator(outputDir?: string) {
  return new UnifiedDataGenerator(outputDir || DEFAULT_OUTPUT_DIR);
}

/**
 * Generate data for a specific scenario with default settings
 */
export async function generateScenarioData(
  scenario: typeof SUPPORTED_SCENARIOS[number],
  customConfig?: Partial<GenerationConfig>
) {
  const generator = createDataGenerator();
  return await generator.generateScenario(scenario, customConfig);
}