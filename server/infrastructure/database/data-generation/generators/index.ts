/**
 * Data Generators - Main Exports
 * 
 * Exports for all data generation components including Python and TypeScript generators
 */

// Python generator utilities
export { PythonGeneratorRunner } from './python/runner';

// TypeScript generators
export { TypeScriptUserGenerator } from './typescript/user-generator';
export { TypeScriptPropertyGenerator } from './typescript/property-generator';
export { TypeScriptFraudGenerator } from './typescript/fraud-generator';

// Generator interfaces
export interface GeneratorConfig {
  count: number;
  fraudRate?: number;
  startDate?: Date;
  endDate?: Date;
  outputDir?: string;
}

export interface GeneratorResult {
  success: boolean;
  recordsGenerated: number;
  outputFiles: string[];
  errors: string[];
  warnings: string[];
  duration: number;
}

// Generator types
export type GeneratorType = 'python' | 'typescript';
export type DataType = 'users' | 'properties' | 'fraud' | 'land-verification' | 'community-insights';

// Available generators
export const AVAILABLE_GENERATORS = {
  python: ['user-generator.py', 'property-generator.py', 'fraud-simulator.py', 'land-verification-generator.py', 'community-insights-generator.py'],
  typescript: ['user-generator.ts', 'property-generator.ts', 'fraud-generator.ts']
} as const;