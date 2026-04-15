#!/usr/bin/env tsx

/**
 * Production Readiness Assessment Runner
 * 
 * Executes comprehensive production readiness assessment and displays results
 */

import { Pool } from 'pg';

// Simple logger for this script
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  }
};

// Simplified ProductionReadinessAssessment for immediate execution
class SimpleProductionAssessment {
  private pool: Pool;
  
  constructor(pool: Pool) {
    this.pool = pool;
  }
  
  async executeAssessment() {
    const startTime = new Date();
    const assessmentId = `assessment_${Date.now()}`;
    
    logger.info(`Starting production readiness assessment: ${assessmentId}`);
    
    try {
      // Test database connectivity
      const connectivityResult = await this.testConnectivity();
      
      // Test basic performance
      const performanceResult = await this.testBasicPerformance();
      
      // Test data integrity
      const dataIntegrityResult = await this.testDataIntegrity();
      
      // Test security basics
      const securityResult = await this.testBasicSecurity();
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const results = {
        connectivity: connectivityResult,
        performance: performanceResult,
        dataIntegrity: dataIntegrityResult,
        security: securityResult
      };
      
      const overallScore = Math.round(
        (connectivityResult.score + performanceResult.score + 
         dataIntegrityResult.score + securityResult.score) / 4
      );
      
      const overallPassed = overallScore >= 85 && 
        Object.values(results).every(r => r.passed);
      
      return {
        assessmentId,
        startTime,
        endTime,
        duration,
        overallPassed,
        overallScore,
        results,
        recommendations: this.generateRecommendations(results, overallScore)
      };
      
    } catch (error) {
      logger.error({ error: error }, 'Assessment failed');
      throw error;
    }
  }
  
  private async testConnectivity() {
    logger.info('Testing database connectivity...');
    
    try {
      const client = await this.pool.connect();
      const startTime = Date.now();
      
      await client.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      client.release();
      
      const passed = responseTime < 1000; // 1 second max
      const score = passed ? 100 : Math.max(0, 100 - (responseTime / 10));
      
      return {
        passed,
        score: Math.round(score),
        details: `Database connection successful in ${responseTime}ms`,
        issues: passed ? [] : [`Slow connection time: ${responseTime}ms`]
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Database connection failed: ${error.message}`,
        issues: [`Connection failure: ${error.message}`]
      };
    }
  }
  
  private async testBasicPerformance() {
    logger.info('Testing basic performance...');
    
    try {
      const client = await this.pool.connect();
      const tests = [];
      
      // Test simple query
      const startTime = Date.now();
      await client.query('SELECT COUNT(*) FROM users');
      const queryTime = Date.now() - startTime;
      tests.push({ name: 'User count query', time: queryTime, target: 100 });
      
      // Test property query
      const propStartTime = Date.now();
      await client.query('SELECT * FROM properties LIMIT 10');
      const propQueryTime = Date.now() - propStartTime;
      tests.push({ name: 'Property query', time: propQueryTime, target: 200 });
      
      client.release();
      
      const failedTests = tests.filter(t => t.time > t.target);
      const avgTime = tests.reduce((sum, t) => sum + t.time, 0) / tests.length;
      
      const passed = failedTests.length === 0 && avgTime < 150;
      const score = Math.max(0, 100 - (failedTests.length * 25) - Math.max(0, avgTime - 50));
      
      return {
        passed,
        score: Math.round(score),
        details: `Average query time: ${Math.round(avgTime)}ms`,
        issues: failedTests.map(t => `${t.name} slow: ${t.time}ms > ${t.target}ms`)
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Performance test failed: ${error.message}`,
        issues: [`Performance test error: ${error.message}`]
      };
    }
  }
  
  private async testDataIntegrity() {
    logger.info('Testing data integrity...');
    
    try {
      const client = await this.pool.connect();
      
      // Check for required tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const tables = tablesResult.rows.map(r => r.table_name);
      const requiredTables = ['users', 'properties', 'reviews', 'transactions'];
      const missingTables = requiredTables.filter(t => !tables.includes(t));
      
      // Check for data
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      const propertyCount = await client.query('SELECT COUNT(*) FROM properties');
      
      client.release();
      
      const hasData = parseInt(userCount.rows[0].count) > 0 && 
                     parseInt(propertyCount.rows[0].count) > 0;
      
      const passed = missingTables.length === 0 && hasData;
      const score = Math.max(0, 100 - (missingTables.length * 25) - (hasData ? 0 : 50));
      
      return {
        passed,
        score: Math.round(score),
        details: `Found ${tables.length} tables with ${userCount.rows[0].count} users and ${propertyCount.rows[0].count} properties`,
        issues: [
          ...missingTables.map(t => `Missing required table: ${t}`),
          ...(hasData ? [] : ['No test data found'])
        ]
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Data integrity test failed: ${error.message}`,
        issues: [`Data integrity error: ${error.message}`]
      };
    }
  }
  
  private async testBasicSecurity() {
    logger.info('Testing basic security...');
    
    try {
      // Check SSL connection
      const sslEnabled = process.env.DATABASE_URL?.includes('sslmode=require') || 
                        process.env.DB_SSL === 'true';
      
      // Check environment variables
      const hasSecrets = process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-jwt-key-for-development-only';
      
      const securityChecks = [
        { name: 'SSL Connection', passed: sslEnabled },
        { name: 'JWT Secret', passed: hasSecrets }
      ];
      
      const failedChecks = securityChecks.filter(c => !c.passed);
      const passed = failedChecks.length === 0;
      const score = Math.max(0, 100 - (failedChecks.length * 50));
      
      return {
        passed,
        score: Math.round(score),
        details: `${securityChecks.length - failedChecks.length}/${securityChecks.length} security checks passed`,
        issues: failedChecks.map(c => `Security check failed: ${c.name}`)
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: `Security test failed: ${error.message}`,
        issues: [`Security test error: ${error.message}`]
      };
    }
  }
  
  private generateRecommendations(results: any, overallScore: number) {
    const recommendations = [];
    
    if (overallScore < 85) {
      recommendations.push('🚨 Overall score below production threshold (85%)');
    }
    
    Object.entries(results).forEach(([category, result]: [string, any]) => {
      if (!result.passed) {
        recommendations.push(`🔧 Fix ${category} issues before production deployment`);
      }
      
      result.issues.forEach((issue: string) => {
        recommendations.push(`• ${issue}`);
      });
    });
    
    if (recommendations.length === 0) {
      recommendations.push('✅ System meets basic production readiness criteria');
      recommendations.push('📋 Proceed with comprehensive testing and deployment');
    }
    
    return recommendations;
  }
}

async function runProductionAssessment() {
  console.log('🚀 Starting Production Readiness Assessment...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const assessment = new SimpleProductionAssessment(pool);
    const result = await assessment.executeAssessment();
    
    console.log('📊 PRODUCTION READINESS ASSESSMENT RESULTS');
    console.log('='.repeat(50));
    console.log(`Assessment ID: ${result.assessmentId}`);
    console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
    console.log(`Overall Score: ${result.overallScore}%`);
    console.log(`Status: ${result.overallPassed ? '✅ CERTIFIED' : '❌ NOT CERTIFIED'}`);
    
    console.log('\n📋 TEST RESULTS:');
    console.log('-'.repeat(30));
    
    Object.entries(result.results).forEach(([name, testResult]: [string, any]) => {
      const status = testResult.passed ? '✅' : '❌';
      console.log(`${status} ${name.toUpperCase()}: ${testResult.score}%`);
      console.log(`   ${testResult.details}`);
      
      if (testResult.issues.length > 0) {
        testResult.issues.forEach((issue: string) => {
          console.log(`   🔸 ${issue}`);
        });
      }
      console.log('');
    });
    
    console.log('💡 RECOMMENDATIONS:');
    console.log('-'.repeat(20));
    result.recommendations.forEach((rec: string) => {
      console.log(`• ${rec}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(result.overallPassed ? 
      '🎉 System is READY for production deployment!' : 
      '🚨 System is NOT READY for production deployment!'
    );
    
    return result.overallPassed;
    
  } catch (error) {
    console.error('❌ Production readiness assessment failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionAssessment()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runProductionAssessment };