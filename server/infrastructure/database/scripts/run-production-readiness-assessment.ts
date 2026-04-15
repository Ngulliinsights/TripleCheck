#!/usr/bin/env tsx
/**
 * Production Readiness Assessment Execution Script
 * 
 * Executes comprehensive production readiness assessment and generates certification
 */

import { Pool } from 'pg';
import { ProductionReadinessAssessment } from '../integration/ProductionReadinessAssessment';
import { logger } from '../../monitoring/logger';

interface AssessmentConfig {
  databaseUrl?: string;
  outputDir?: string;
  minimumScore?: number;
  generateReports?: boolean;
}

async function runProductionReadinessAssessment(config: AssessmentConfig = {}) {
  const {
    databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/triplecheck',
    outputDir = './database/integration/reports',
    minimumScore = 85,
    generateReports = true
  } = config;

  console.log('🏆 Starting Production Readiness Assessment...');
  console.log(`📊 Target minimum score: ${minimumScore}%`);
  console.log(`📁 Output directory: ${outputDir}`);

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Initialize assessment system
    const assessment = new ProductionReadinessAssessment(pool, {
      thresholds: {
        minimumScore,
        criticalIssueThreshold: 0,
        highIssueThreshold: 2
      },
      reporting: {
        generateCertificate: generateReports,
        includeRecommendations: true,
        outputDirectory: outputDir
      }
    });

    // Set up event listeners for progress tracking
    assessment.on('assessment_started', (data) => {
      console.log(`🚀 Assessment started: ${data.assessmentId}`);
    });

    assessment.on('assessment_completed', (data) => {
      const status = data.result.overallPassed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} Assessment completed: ${data.result.overallScore}%`);
    });

    // Execute assessment
    const result = await assessment.executeAssessment();

    // Display results
    console.log('\n📋 PRODUCTION READINESS ASSESSMENT RESULTS');
    console.log('='.repeat(50));
    console.log(`Assessment ID: ${result.assessmentId}`);
    console.log(`Overall Status: ${result.overallPassed ? '✅ CERTIFIED' : '❌ NOT CERTIFIED'}`);
    console.log(`Overall Score: ${result.overallScore}%`);
    console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
    console.log(`Started: ${result.startTime.toISOString()}`);
    console.log(`Completed: ${result.endTime.toISOString()}`);

    // Display criteria results
    console.log('\n📊 CRITERIA RESULTS:');
    Object.entries(result.criteriaResults).forEach(([name, criteria]: [string, any]) => {
      const status = criteria.passed ? '✅' : '❌';
      console.log(`${status} ${name.toUpperCase()}: ${criteria.score}% (Weight: ${criteria.weight}%)`);
    });

    // Display issues if any
    if (result.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      result.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.category.toUpperCase()}] ${issue.severity}: ${issue.message}`);
        console.log(`   💡 Recommendation: ${issue.recommendation}`);
        console.log(`   📈 Impact: ${issue.impact}`);
      });
    }

    // Display recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Display certification status
    console.log('\n🏆 CERTIFICATION STATUS:');
    if (result.certification.certified) {
      console.log(`✅ PRODUCTION CERTIFIED`);
      console.log(`📜 Certificate ID: ${result.certification.certificateId}`);
      console.log(`⏰ Valid Until: ${result.certification.validUntil?.toISOString()}`);
    } else {
      console.log(`❌ NOT CERTIFIED`);
      console.log(`📋 Required Conditions:`);
      result.certification.conditions?.forEach((condition, index) => {
        console.log(`   ${index + 1}. ${condition}`);
      });
    }

    // Display report locations
    if (generateReports) {
      console.log('\n📊 REPORTS GENERATED:');
      console.log(`📄 JSON Report: ${outputDir}/production-readiness-${result.assessmentId}.json`);
      console.log(`🌐 HTML Report: ${outputDir}/production-readiness-${result.assessmentId}.html`);
      if (result.certification.certified) {
        console.log(`🏆 Certificate: ${outputDir}/production-certificate-${result.certification.certificateId}.html`);
      }
    }

    // Exit with appropriate code
    process.exit(result.overallPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Production readiness assessment failed:', error);
    logger.error({ error: error }, 'Production readiness assessment failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: AssessmentConfig = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--database-url':
        config.databaseUrl = value;
        break;
      case '--output-dir':
        config.outputDir = value;
        break;
      case '--minimum-score':
        config.minimumScore = parseInt(value);
        break;
      case '--no-reports':
        config.generateReports = false;
        i--; // No value for this flag
        break;
      case '--help':
        console.log(`
Production Readiness Assessment Tool

Usage: tsx database/scripts/run-production-readiness-assessment.ts [options]

Options:
  --database-url <url>     Database connection URL (default: DATABASE_URL env var)
  --output-dir <dir>       Output directory for reports (default: ./database/integration/reports)
  --minimum-score <score>  Minimum score for certification (default: 85)
  --no-reports            Skip report generation
  --help                  Show this help message

Examples:
  tsx database/scripts/run-production-readiness-assessment.ts
  tsx database/scripts/run-production-readiness-assessment.ts --minimum-score 90
  tsx database/scripts/run-production-readiness-assessment.ts --output-dir ./reports
        `);
        process.exit(0);
        break;
    }
  }

  runProductionReadinessAssessment(config);
}

export { runProductionReadinessAssessment };