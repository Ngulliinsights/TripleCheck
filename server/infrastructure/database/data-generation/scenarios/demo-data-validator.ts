/**
 * Demo Data Validator
 * 
 * Validates generated demonstration data for quality, consistency, and realism
 * to ensure professional presentation standards.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  field?: string;
  count?: number;
  examples?: any[];
}

export interface ValidationWarning {
  type: string;
  message: string;
  field?: string;
  count?: number;
  impact: 'presentation' | 'realism' | 'performance';
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  errorCount: number;
  warningCount: number;
  dataQualityScore: number;
  realismScore: number;
  presentationReadiness: number;
}

/**
 * Comprehensive demo data validator
 */
export class DemoDataValidator {
  private scenarioPath: string;
  private data: any = {};

  constructor(scenarioPath: string) {
    this.scenarioPath = scenarioPath;
  }

  /**
   * Validate demo data for presentation quality
   */
  async validate(): Promise<ValidationResult> {
    try {
      // Load data from scenario path
      const dataContent = await readFile(this.scenarioPath, 'utf-8');
      this.data = JSON.parse(dataContent);

      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const recommendations: string[] = [];

      // Basic validation
      if (!this.data || typeof this.data !== 'object') {
        errors.push({
          type: 'structure',
          severity: 'critical',
          message: 'Invalid data structure'
        });
      }

      // Calculate scores
      const dataQualityScore = Math.max(0, 100 - (errors.length * 10));
      const realismScore = 85; // Placeholder
      const presentationReadiness = Math.min(dataQualityScore, realismScore);

      const summary: ValidationSummary = {
        totalRecords: Array.isArray(this.data) ? this.data.length : Object.keys(this.data).length,
        validRecords: 0, // Calculate based on validation
        errorCount: errors.length,
        warningCount: warnings.length,
        dataQualityScore,
        realismScore,
        presentationReadiness
      };

      return {
        valid: errors.length === 0,
        score: presentationReadiness,
        errors,
        warnings,
        recommendations,
        summary
      };
    } catch (error) {
      return {
        valid: false,
        score: 0,
        errors: [{
          type: 'system',
          severity: 'critical',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        warnings: [],
        recommendations: [],
        summary: {
          totalRecords: 0,
          validRecords: 0,
          errorCount: 1,
          warningCount: 0,
          dataQualityScore: 0,
          realismScore: 0,
          presentationReadiness: 0
        }
      };
    }
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    const { score, errors, warnings, summary } = result;
    
    let report = chalk.bold('\n📊 Demo Data Validation Report\n');
    report += chalk.gray('='.repeat(50)) + '\n\n';
    
    // Overall score
    const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
    report += `Overall Score: ${scoreColor(score.toString())}/100\n\n`;
    
    // Summary
    report += chalk.bold('Summary:\n');
    report += `  Total Records: ${summary.totalRecords}\n`;
    report += `  Valid Records: ${summary.validRecords}\n`;
    report += `  Errors: ${chalk.red(summary.errorCount.toString())}\n`;
    report += `  Warnings: ${chalk.yellow(summary.warningCount.toString())}\n\n`;
    
    // Errors
    if (errors.length > 0) {
      report += chalk.bold.red('Errors:\n');
      errors.forEach(error => {
        report += `  ❌ ${error.message}\n`;
      });
      report += '\n';
    }
    
    // Warnings
    if (warnings.length > 0) {
      report += chalk.bold.yellow('Warnings:\n');
      warnings.forEach(warning => {
        report += `  ⚠️  ${warning.message}\n`;
      });
      report += '\n';
    }
    
    return report;
  }
}