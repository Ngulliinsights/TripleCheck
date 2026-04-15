#!/usr/bin/env tsx

/**
 * Integration CLI
 * 
 * Comprehensive command-line interface for system integration and production validation
 * Task 5.1 & 5.2: Execute comprehensive system integration and finalize operational excellence
 */

import { Command } from '..\..\..\..\src\shared\components\ui\command';
import { Pool } from 'pg';
import { logger } from '../../monitoring/logger';
import { IntegrationTestRunner } from './integration-test-runner';
import { ProductionReadinessAssessment } from './ProductionReadinessAssessment';
import { SystemIntegrationValidator } from './SystemIntegrationValidator';

const program = new Command();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck'
});

program
  .name('integration-cli')
  .description('TripleCheck Database Integration and Production Readiness CLI')
  .version('1.0.0');

/**
 * Integration Testing Commands
 */
program
  .command('test')
  .description('Execute comprehensive integration test suite')
  .option('--suite <suite>', 'Run specific test suite')
  .option('--timeout <timeout>', 'Set test timeout in milliseconds', '1800000')
  .option('--report-format <format>', 'Report format (json|html|both)', 'both')
  .action(async (options) => {
    try {
      logger.info('🚀 Starting integration test suite...');
      
      const runner = new IntegrationTestRunner(pool, {
        timeout: parseInt(options.timeout),
        reportFormat: options.reportFormat
      });
      
      const report = await runner.executeIntegrationTests();
      
      console.log('\n' + '='.repeat(80));
      console.log('🧪 INTEGRATION TEST RESULTS');
      console.log('='.repeat(80));
      console.log(`Status: ${report.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Score: ${report.overallScore}%`);
      console.log(`Duration: ${Math.round(report.duration / 1000)}s`);
      console.log(`Test ID: ${report.testId}`);
      
      console.log('\n📋 Test Suite Results:');
      report.suites.forEach(suite => {
        console.log(`  ${suite.passed ? '✅' : '❌'} ${suite.name}: ${suite.score}% (${suite.tests.length} tests)`);
      });
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
      console.log('\n📋 Next Steps:');
      report.nextSteps.forEach(step => console.log(`  - ${step}`));
      
      if (!report.overallPassed) {
        process.exit(1);
      }
      
    } catch (error) {
      logger.error({ error: error }, '❌ Integration test suite failed:');
      process.exit(1);
    }
  });

/**
 * Production Readiness Assessment Commands
 */
program
  .command('assess')
  .description('Execute production readiness assessment')
  .option('--generate-certificate', 'Generate production certificate if passed')
  .option('--minimum-score <score>', 'Minimum score for certification', '85')
  .option('--output-dir <dir>', 'Output directory for reports', './database/integration/reports')
  .action(async (options) => {
    try {
      logger.info('🔍 Starting production readiness assessment...');
      
      const assessment = new ProductionReadinessAssessment(pool, {
        thresholds: {
          minimumScore: parseInt(options.minimumScore),
          criticalIssueThreshold: 0,
          highIssueThreshold: 2
        },
        reporting: {
          generateCertificate: options.generateCertificate,
          includeRecommendations: true,
          outputDirectory: options.outputDir
        }
      });
      
      const result = await assessment.executeAssessment();
      
      console.log('\n' + '='.repeat(80));
      console.log('🏆 PRODUCTION READINESS ASSESSMENT');
      console.log('='.repeat(80));
      console.log(`Status: ${result.overallPassed ? '✅ CERTIFIED' : '❌ NOT CERTIFIED'}`);
      console.log(`Score: ${result.overallScore}%`);
      console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(`Assessment ID: ${result.assessmentId}`);
      
      console.log('\n📊 Criteria Results:');
      Object.entries(result.criteriaResults).forEach(([name, criteria]: [string, any]) => {
        console.log(`  ${criteria.passed ? '✅' : '❌'} ${name.toUpperCase()}: ${criteria.score}% (Weight: ${criteria.weight}%)`);
      });
      
      if (result.issues.length > 0) {
        console.log('\n⚠️ Issues Found:');
        result.issues.forEach(issue => {
          console.log(`  [${issue.severity}] ${issue.category}: ${issue.message}`);
        });
      }
      
      if (result.certification.certified) {
        console.log('\n🎉 SYSTEM CERTIFIED FOR PRODUCTION!');
        console.log(`Certificate ID: ${result.certification.certificateId}`);
        console.log(`Valid Until: ${result.certification.validUntil?.toISOString()}`);
      } else {
        console.log('\n❌ CERTIFICATION REQUIREMENTS NOT MET');
        console.log('Conditions for certification:');
        result.certification.conditions?.forEach(condition => {
          console.log(`  - ${condition}`);
        });
      }
      
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
      
      if (!result.overallPassed) {
        process.exit(1);
      }
      
    } catch (error) {
      logger.error({ error: error }, '❌ Production readiness assessment failed:');
      process.exit(1);
    }
  });

/**
 * Full Validation Command
 */
program
  .command('validate')
  .description('Execute full system validation (integration tests + production assessment)')
  .option('--skip-tests', 'Skip integration tests')
  .option('--skip-assessment', 'Skip production readiness assessment')
  .option('--generate-certificate', 'Generate production certificate if all validations pass')
  .action(async (options) => {
    try {
      logger.info('🚀 Starting full system validation...');
      
      let integrationPassed = true;
      let assessmentPassed = true;
      let integrationReport: any = null;
      let assessmentResult: any = null;
      
      // Execute integration tests
      if (!options.skipTests) {
        console.log('\n' + '='.repeat(80));
        console.log('Phase 1: Integration Testing');
        console.log('='.repeat(80));
        
        const runner = new IntegrationTestRunner(pool);
        integrationReport = await runner.executeIntegrationTests();
        integrationPassed = integrationReport.overallPassed;
        
        console.log(`Integration Tests: ${integrationPassed ? '✅ PASSED' : '❌ FAILED'} (${integrationReport.overallScore}%)`);
      }
      
      // Execute production readiness assessment
      if (!options.skipAssessment) {
        console.log('\n' + '='.repeat(80));
        console.log('Phase 2: Production Readiness Assessment');
        console.log('='.repeat(80));
        
        const assessment = new ProductionReadinessAssessment(pool, {
          reporting: {
            generateCertificate: options.generateCertificate && integrationPassed,
            includeRecommendations: true,
            outputDirectory: './database/integration/reports'
          }
        });
        
        assessmentResult = await assessment.executeAssessment();
        assessmentPassed = assessmentResult.overallPassed;
        
        console.log(`Production Assessment: ${assessmentPassed ? '✅ CERTIFIED' : '❌ NOT CERTIFIED'} (${assessmentResult.overallScore}%)`);
      }
      
      // Final results
      const overallPassed = integrationPassed && assessmentPassed;
      
      console.log('\n' + '='.repeat(80));
      console.log('🏁 FINAL VALIDATION RESULTS');
      console.log('='.repeat(80));
      console.log(`Overall Status: ${overallPassed ? '✅ SYSTEM READY FOR PRODUCTION' : '❌ SYSTEM NOT READY'}`);
      
      if (integrationReport) {
        console.log(`Integration Score: ${integrationReport.overallScore}%`);
      }
      
      if (assessmentResult) {
        console.log(`Assessment Score: ${assessmentResult.overallScore}%`);
        
        if (assessmentResult.certification.certified) {
          console.log(`🎉 Production Certificate: ${assessmentResult.certification.certificateId}`);
        }
      }
      
      if (overallPassed) {
        console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT!');
        console.log('Next steps:');
        console.log('  1. Review production deployment checklist');
        console.log('  2. Schedule deployment window');
        console.log('  3. Execute blue-green deployment');
        console.log('  4. Monitor system health post-deployment');
      } else {
        console.log('\n❌ SYSTEM NOT READY FOR PRODUCTION');
        console.log('Required actions:');
        
        if (integrationReport && !integrationPassed) {
          console.log('  - Address integration test failures');
          integrationReport.recommendations.forEach((rec: string) => console.log(`    • ${rec}`));
        }
        
        if (assessmentResult && !assessmentPassed) {
          console.log('  - Meet production readiness requirements');
          assessmentResult.recommendations.forEach((rec: string) => console.log(`    • ${rec}`));
        }
      }
      
      if (!overallPassed) {
        process.exit(1);
      }
      
    } catch (error) {
      logger.error({ error: error }, '❌ Full system validation failed:');
      process.exit(1);
    }
  });

/**
 * System Health Check Command
 */
program
  .command('health')
  .description('Check system health and readiness')
  .option('--detailed', 'Show detailed health information')
  .action(async (options) => {
    try {
      logger.info('🔍 Checking system health...');
      
      const validator = new SystemIntegrationValidator(pool);
      const result = await validator.executeIntegrationValidation();
      
      console.log('\n' + '='.repeat(80));
      console.log('🏥 SYSTEM HEALTH CHECK');
      console.log('='.repeat(80));
      console.log(`Overall Health: ${result.overallPassed ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
      console.log(`Health Score: ${result.overallScore}%`);
      
      console.log('\n🔗 Integration Points:');
      result.integrationHealth.forEach(integration => {
        console.log(`  ${integration.healthy ? '✅' : '❌'} ${integration.name}: ${integration.responseTime}ms`);
        if (!integration.healthy && integration.issues.length > 0) {
          integration.issues.forEach(issue => console.log(`    ⚠️ ${issue}`));
        }
      });
      
      if (options.detailed) {
        console.log('\n📋 Scenario Results:');
        result.scenarios.forEach(scenario => {
          console.log(`  ${scenario.passed ? '✅' : '❌'} ${scenario.name}: ${scenario.score}%`);
          if (scenario.issues.length > 0) {
            scenario.issues.forEach(issue => {
              console.log(`    [${issue.severity}] ${issue.message}`);
            });
          }
        });
      }
      
      if (!result.overallPassed) {
        console.log('\n⚠️ Health Issues Detected:');
        result.finalAssessment.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
        
        console.log('\n💡 Recommendations:');
        result.finalAssessment.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
    } catch (error) {
      logger.error({ error: error }, '❌ System health check failed:');
      process.exit(1);
    }
  });

/**
 * Generate Reports Command
 */
program
  .command('report')
  .description('Generate comprehensive system reports')
  .option('--type <type>', 'Report type (integration|assessment|health|all)', 'all')
  .option('--format <format>', 'Report format (json|html|both)', 'both')
  .option('--output-dir <dir>', 'Output directory', './database/integration/reports')
  .action(async (options) => {
    try {
      logger.info('📊 Generating system reports...');
      
      const reportTypes = options.type === 'all' 
        ? ['integration', 'assessment', 'health'] 
        : [options.type];
      
      for (const reportType of reportTypes) {
        console.log(`\n📋 Generating ${reportType} report...`);
        
        switch (reportType) {
          case 'integration':
            const runner = new IntegrationTestRunner(pool);
            await runner.executeIntegrationTests();
            break;
            
          case 'assessment':
            const assessment = new ProductionReadinessAssessment(pool, {
              reporting: {
                generateCertificate: true,
                includeRecommendations: true,
                outputDirectory: options.outputDir
              }
            });
            await assessment.executeAssessment();
            break;
            
          case 'health':
            const validator = new SystemIntegrationValidator(pool);
            await validator.executeIntegrationValidation();
            break;
        }
      }
      
      console.log(`\n✅ Reports generated in: ${options.outputDir}`);
      
    } catch (error) {
      logger.error({ error: error }, '❌ Report generation failed:');
      process.exit(1);
    }
  });

/**
 * Cleanup Command
 */
program
  .command('cleanup')
  .description('Cleanup test data and temporary files')
  .option('--confirm', 'Confirm cleanup operation')
  .action(async (options) => {
    if (!options.confirm) {
      console.log('⚠️ This will cleanup test data and temporary files.');
      console.log('Use --confirm flag to proceed.');
      return;
    }
    
    try {
      logger.info('🧹 Cleaning up test data and temporary files...');
      
      // Cleanup test data
      const client = await pool.connect();
      try {
        await client.query('DELETE FROM users WHERE email LIKE \'%@test.com\'');
        await client.query('DELETE FROM properties WHERE title LIKE \'Test Property%\'');
        console.log('✅ Test data cleaned up');
      } finally {
        client.release();
      }
      
      // Cleanup temporary files
      const fs = await import('fs/promises');
      try {
        await fs.rmdir('./database/integration/reports/temp', { recursive: true });
        console.log('✅ Temporary files cleaned up');
      } catch (error) {
        // Directory might not exist
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      logger.error({ error: error }, '❌ Cleanup failed:');
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Handle no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}