#!/usr/bin/env node

/**
 * Simple Production Readiness Assessment
 * 
 * Basic assessment to validate production readiness
 */

const { Pool } = require('pg');

async function runAssessment() {
  console.log('🚀 Starting Production Readiness Assessment...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const startTime = Date.now();
  const assessmentId = `assessment_${Date.now()}`;
  
  try {
    console.log(`Assessment ID: ${assessmentId}`);
    console.log('Testing database connectivity...');
    
    // Test 1: Database Connectivity
    const client = await pool.connect();
    const connectStart = Date.now();
    await client.query('SELECT 1');
    const connectTime = Date.now() - connectStart;
    client.release();
    
    const connectivityPassed = connectTime < 1000;
    const connectivityScore = connectivityPassed ? 100 : Math.max(0, 100 - (connectTime / 10));
    
    console.log(`✅ Database connectivity: ${Math.round(connectivityScore)}% (${connectTime}ms)`);
    
    // Test 2: Basic Performance
    console.log('Testing basic performance...');
    const perfClient = await pool.connect();
    
    const userCountStart = Date.now();
    const userResult = await perfClient.query('SELECT COUNT(*) FROM users');
    const userCountTime = Date.now() - userCountStart;
    
    const propCountStart = Date.now();
    const propResult = await perfClient.query('SELECT COUNT(*) FROM properties');
    const propCountTime = Date.now() - propCountStart;
    
    perfClient.release();
    
    const avgQueryTime = (userCountTime + propCountTime) / 2;
    const performancePassed = avgQueryTime < 150;
    const performanceScore = Math.max(0, 100 - Math.max(0, avgQueryTime - 50));
    
    console.log(`✅ Query performance: ${Math.round(performanceScore)}% (avg: ${Math.round(avgQueryTime)}ms)`);
    
    // Test 3: Data Integrity
    console.log('Testing data integrity...');
    const dataClient = await pool.connect();
    
    const tablesResult = await dataClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    const requiredTables = ['users', 'properties', 'reviews', 'transactions'];
    const missingTables = requiredTables.filter(t => !tables.includes(t));
    
    const userCount = parseInt(userResult.rows[0].count);
    const propertyCount = parseInt(propResult.rows[0].count);
    const hasData = userCount > 0 && propertyCount > 0;
    
    dataClient.release();
    
    const dataIntegrityPassed = missingTables.length === 0 && hasData;
    const dataIntegrityScore = Math.max(0, 100 - (missingTables.length * 25) - (hasData ? 0 : 50));
    
    console.log(`✅ Data integrity: ${Math.round(dataIntegrityScore)}% (${tables.length} tables, ${userCount} users, ${propertyCount} properties)`);
    
    // Test 4: Basic Security
    console.log('Testing basic security...');
    
    const sslEnabled = process.env.DATABASE_URL?.includes('sslmode=require') || 
                      process.env.DB_SSL === 'true';
    const hasJwtSecret = process.env.JWT_SECRET && 
                        process.env.JWT_SECRET !== 'your-super-secret-jwt-key-for-development-only';
    
    const securityChecks = [
      { name: 'SSL Connection', passed: sslEnabled },
      { name: 'JWT Secret', passed: hasJwtSecret }
    ];
    
    const failedSecurityChecks = securityChecks.filter(c => !c.passed);
    const securityPassed = failedSecurityChecks.length === 0;
    const securityScore = Math.max(0, 100 - (failedSecurityChecks.length * 50));
    
    console.log(`✅ Basic security: ${Math.round(securityScore)}% (${securityChecks.length - failedSecurityChecks.length}/${securityChecks.length} checks passed)`);
    
    // Calculate Overall Results
    const overallScore = Math.round((connectivityScore + performanceScore + dataIntegrityScore + securityScore) / 4);
    const overallPassed = overallScore >= 85 && connectivityPassed && performancePassed && dataIntegrityPassed && securityPassed;
    
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 PRODUCTION READINESS ASSESSMENT RESULTS');
    console.log('='.repeat(50));
    console.log(`Overall Score: ${overallScore}%`);
    console.log(`Status: ${overallPassed ? '✅ CERTIFIED FOR PRODUCTION' : '❌ NOT READY FOR PRODUCTION'}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    
    console.log('\n📋 DETAILED RESULTS:');
    console.log(`${connectivityPassed ? '✅' : '❌'} Database Connectivity: ${Math.round(connectivityScore)}%`);
    console.log(`${performancePassed ? '✅' : '❌'} Query Performance: ${Math.round(performanceScore)}%`);
    console.log(`${dataIntegrityPassed ? '✅' : '❌'} Data Integrity: ${Math.round(dataIntegrityScore)}%`);
    console.log(`${securityPassed ? '✅' : '❌'} Basic Security: ${Math.round(securityScore)}%`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    const recommendations = [];
    
    if (!connectivityPassed) {
      recommendations.push('🔧 Improve database connection performance');
    }
    if (!performancePassed) {
      recommendations.push('🔧 Optimize query performance with indexes');
    }
    if (!dataIntegrityPassed) {
      if (missingTables.length > 0) {
        recommendations.push(`🔧 Create missing tables: ${missingTables.join(', ')}`);
      }
      if (!hasData) {
        recommendations.push('🔧 Generate test data for development and testing');
      }
    }
    if (!securityPassed) {
      failedSecurityChecks.forEach(check => {
        recommendations.push(`🔧 Fix security issue: ${check.name}`);
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ System meets basic production readiness criteria');
      recommendations.push('📋 Proceed with comprehensive testing and deployment');
    }
    
    recommendations.forEach(rec => console.log(`  ${rec}`));
    
    console.log('\n' + '='.repeat(50));
    console.log(overallPassed ? 
      '🎉 System is READY for production deployment!' : 
      '🚨 System is NOT READY for production deployment!'
    );
    console.log('='.repeat(50));
    
    return overallPassed;
    
  } catch (error) {
    console.error('❌ Assessment failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run assessment
runAssessment()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });