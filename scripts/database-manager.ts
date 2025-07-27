#!/usr/bin/env tsx
/**
 * Unified Database Manager for TripleCheck
 * 
 * Combines functionality from:
 * - data-integrity-checker.ts (comprehensive validation)
 * - test-db-connection.js (connection testing)
 * - test-data-check.js (data verification)
 * - setup-database.ts (database initialization)
 * - fix-database.ts (repair operations)
 */

import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, properties, reviews } from "../src/shared/schema";
import type { InsertUser, InsertProperty } from "../src/shared/schema";
import { eq, sql, count, isNull, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

interface DatabaseStats {
  users: number;
  properties: number;
  reviews: number;
  orphanedProperties: number;
  orphanedReviews: number;
  duplicateUsers: number;
  incompleteRecords: number;
}

interface IntegrityIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  count: number;
  examples?: any[];
  fixSuggestion?: string;
}

interface DatabaseReport {
  timestamp: string;
  connectionStatus: 'connected' | 'failed';
  databaseVersion?: string;
  stats: DatabaseStats;
  issues: IntegrityIssue[];
  recommendations: string[];
  performanceMetrics?: {
    queryTime: number;
    connectionTime: number;
  };
}

class DatabaseManager {
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof neon>;
  private connectionTime: number = 0;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
  }

  /**
   * Initialize database connection with timing
   */
  private async initializeConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.sql = neon(process.env.DATABASE_URL!);
      this.db = drizzle(this.sql);
      
      // Test connection
      await this.sql`SELECT 1`;
      
      this.connectionTime = Date.now() - startTime;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; version?: string; latency: number }> {
    console.log('🔌 Testing Database Connection...');
    
    const startTime = Date.now();
    
    try {
      await this.initializeConnection();
      
      const result = await this.sql`SELECT version()`;
      const latency = Date.now() - startTime;
      
      console.log('   ✅ Database connection successful!');
      console.log(`   📊 Connection latency: ${latency}ms`);
      console.log(`   🗄️  Database version: ${result[0].version.split(',')[0]}`);
      
      return {
        success: true,
        version: result[0].version,
        latency
      };
      
    } catch (error) {
      console.log('   ❌ Database connection failed!');
      console.log(`   💥 Error: ${error.message}`);
      
      return {
        success: false,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Get comprehensive database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    if (!this.db) await this.initializeConnection();
    
    const [userCount] = await this.db.select({ count: count() }).from(users);
    const [propertyCount] = await this.db.select({ count: count() }).from(properties);
    const [reviewCount] = await this.db.select({ count: count() }).from(reviews);
    
    // Check orphaned records
    const orphanedProperties = await this.db
      .select({ id: properties.id })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(isNull(users.id));
    
    const orphanedReviews = await this.db
      .select({ id: reviews.id })
      .from(reviews)
      .leftJoin(properties, eq(reviews.propertyId, properties.id))
      .where(isNull(properties.id));
    
    // Check duplicates
    const duplicateUsernames = await this.db
      .select({ username: users.username, count: count() })
      .from(users)
      .groupBy(users.username)
      .having(sql`count(*) > 1`);
    
    const totalDuplicates = duplicateUsernames.reduce((sum, dup) => sum + dup.count - 1, 0);
    
    // Check incomplete records
    const incompleteUsers = await this.db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.username} IS NULL OR ${users.username} = '' OR ${users.password} IS NULL`);
    
    const incompleteProperties = await this.db
      .select({ id: properties.id })
      .from(properties)
      .where(sql`${properties.title} IS NULL OR ${properties.title} = '' OR ${properties.price} IS NULL OR ${properties.price} <= 0`);
    
    return {
      users: userCount.count,
      properties: propertyCount.count,
      reviews: reviewCount.count,
      orphanedProperties: orphanedProperties.length,
      orphanedReviews: orphanedReviews.length,
      duplicateUsers: totalDuplicates,
      incompleteRecords: incompleteUsers.length + incompleteProperties.length
    };
  }

  /**
   * Run comprehensive database verification
   */
  async verifyDatabase(): Promise<DatabaseReport> {
    console.log('🔍 Running Comprehensive Database Verification...');
    console.log('================================================\n');
    
    const startTime = Date.now();
    const report: DatabaseReport = {
      timestamp: new Date().toISOString(),
      connectionStatus: 'failed',
      stats: {
        users: 0,
        properties: 0,
        reviews: 0,
        orphanedProperties: 0,
        orphanedReviews: 0,
        duplicateUsers: 0,
        incompleteRecords: 0
      },
      issues: [],
      recommendations: []
    };

    try {
      // Test connection
      const connectionTest = await this.testConnection();
      report.connectionStatus = connectionTest.success ? 'connected' : 'failed';
      report.databaseVersion = connectionTest.version;
      
      if (!connectionTest.success) {
        report.issues.push({
          severity: 'CRITICAL',
          category: 'Connection',
          description: 'Database connection failed',
          count: 1,
          fixSuggestion: 'Check DATABASE_URL and network connectivity'
        });
        return report;
      }

      // Get statistics
      console.log('📊 Gathering Database Statistics...');
      report.stats = await this.getDatabaseStats();
      
      console.log(`   Users: ${report.stats.users}`);
      console.log(`   Properties: ${report.stats.properties}`);
      console.log(`   Reviews: ${report.stats.reviews}\n`);

      // Check for critical issues
      await this.checkCriticalIssues(report);
      
      // Check data integrity
      await this.checkDataIntegrity(report);
      
      // Check data quality
      await this.checkDataQuality(report);
      
      // Generate recommendations
      this.generateRecommendations(report);
      
      const queryTime = Date.now() - startTime;
      report.performanceMetrics = {
        queryTime,
        connectionTime: this.connectionTime
      };

      console.log('✅ Database verification completed!\n');
      
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
      report.issues.push({
        severity: 'CRITICAL',
        category: 'System',
        description: `Verification failed: ${error.message}`,
        count: 1
      });
    }

    return report;
  }

  /**
   * Check for critical issues
   */
  private async checkCriticalIssues(report: DatabaseReport): Promise<void> {
    console.log('🚨 Checking Critical Issues...');
    
    // Empty tables
    if (report.stats.users === 0) {
      report.issues.push({
        severity: 'CRITICAL',
        category: 'Data Availability',
        description: 'No users found in database',
        count: 0,
        fixSuggestion: 'Run data loading pipeline to populate users'
      });
    }
    
    if (report.stats.properties === 0) {
      report.issues.push({
        severity: 'CRITICAL',
        category: 'Data Availability',
        description: 'No properties found in database',
        count: 0,
        fixSuggestion: 'Run data loading pipeline to populate properties'
      });
    }

    // Orphaned records
    if (report.stats.orphanedProperties > 0) {
      report.issues.push({
        severity: 'HIGH',
        category: 'Data Integrity',
        description: 'Properties with invalid owner references',
        count: report.stats.orphanedProperties,
        fixSuggestion: 'Run: npx tsx scripts/database-manager.ts fix --orphaned-properties'
      });
    }
    
    if (report.stats.orphanedReviews > 0) {
      report.issues.push({
        severity: 'HIGH',
        category: 'Data Integrity',
        description: 'Reviews with invalid property/user references',
        count: report.stats.orphanedReviews,
        fixSuggestion: 'Run: npx tsx scripts/database-manager.ts fix --orphaned-reviews'
      });
    }

    const criticalCount = report.issues.filter(i => i.severity === 'CRITICAL').length;
    const highCount = report.issues.filter(i => i.severity === 'HIGH').length;
    
    console.log(`   ${criticalCount === 0 ? '✅' : '❌'} Critical issues: ${criticalCount}`);
    console.log(`   ${highCount === 0 ? '✅' : '⚠️'} High priority issues: ${highCount}\n`);
  }

  /**
   * Check data integrity
   */
  private async checkDataIntegrity(report: DatabaseReport): Promise<void> {
    console.log('🔗 Checking Data Integrity...');
    
    // Duplicate users
    if (report.stats.duplicateUsers > 0) {
      report.issues.push({
        severity: 'MEDIUM',
        category: 'Data Duplicates',
        description: 'Duplicate usernames found',
        count: report.stats.duplicateUsers,
        fixSuggestion: 'Run: npx tsx scripts/database-manager.ts fix --duplicates'
      });
    }
    
    // Incomplete records
    if (report.stats.incompleteRecords > 0) {
      report.issues.push({
        severity: 'MEDIUM',
        category: 'Data Completeness',
        description: 'Records with missing required fields',
        count: report.stats.incompleteRecords,
        fixSuggestion: 'Run: npx tsx scripts/database-manager.ts fix --incomplete'
      });
    }

    console.log(`   ${report.stats.duplicateUsers === 0 ? '✅' : '⚠️'} Duplicate records: ${report.stats.duplicateUsers}`);
    console.log(`   ${report.stats.incompleteRecords === 0 ? '✅' : '⚠️'} Incomplete records: ${report.stats.incompleteRecords}\n`);
  }

  /**
   * Check data quality
   */
  private async checkDataQuality(report: DatabaseReport): Promise<void> {
    console.log('🎯 Checking Data Quality...');
    
    try {
      // Check unrealistic prices
      const unrealisticPrices = await this.db
        .select({ id: properties.id, title: properties.title, price: properties.price })
        .from(properties)
        .where(sql`${properties.price} < 100000 OR ${properties.price} > 1000000000`);
      
      if (unrealisticPrices.length > 0) {
        report.issues.push({
          severity: 'MEDIUM',
          category: 'Data Quality',
          description: 'Properties with unrealistic prices',
          count: unrealisticPrices.length,
          examples: unrealisticPrices.slice(0, 3),
          fixSuggestion: 'Review and correct property prices'
        });
      }

      // Check invalid ratings
      const invalidRatings = await this.db
        .select({ id: reviews.id, rating: reviews.rating })
        .from(reviews)
        .where(sql`${reviews.rating} < 1 OR ${reviews.rating} > 5`);
      
      if (invalidRatings.length > 0) {
        report.issues.push({
          severity: 'HIGH',
          category: 'Data Quality',
          description: 'Reviews with invalid ratings',
          count: invalidRatings.length,
          examples: invalidRatings.slice(0, 3),
          fixSuggestion: 'Correct ratings to be between 1-5'
        });
      }

      console.log(`   ${unrealisticPrices.length === 0 ? '✅' : '⚠️'} Price validation: ${unrealisticPrices.length} issues`);
      console.log(`   ${invalidRatings.length === 0 ? '✅' : '⚠️'} Rating validation: ${invalidRatings.length} issues\n`);
      
    } catch (error) {
      console.log(`   ⚠️  Data quality check failed: ${error.message}\n`);
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(report: DatabaseReport): void {
    const criticalIssues = report.issues.filter(i => i.severity === 'CRITICAL').length;
    const highIssues = report.issues.filter(i => i.severity === 'HIGH').length;
    const mediumIssues = report.issues.filter(i => i.severity === 'MEDIUM').length;
    
    if (criticalIssues > 0) {
      report.recommendations.push('🚨 URGENT: Address critical issues immediately');
      report.recommendations.push('💡 Run: npx tsx scripts/unified-data-pipeline.ts --clear');
    }
    
    if (highIssues > 0) {
      report.recommendations.push('⚠️  Fix high-priority issues to ensure data reliability');
      report.recommendations.push('🔧 Run: npx tsx scripts/database-manager.ts fix');
    }
    
    if (report.stats.users > 0 && report.stats.properties > 0 && report.stats.reviews === 0) {
      report.recommendations.push('⭐ Generate reviews to improve user experience');
      report.recommendations.push('🎯 Run: npx tsx scripts/unified-data-pipeline.ts --no-clear');
    }
    
    if (mediumIssues > 0) {
      report.recommendations.push('🎯 Address medium-priority issues to improve data quality');
    }
    
    if (report.issues.length === 0) {
      report.recommendations.push('✅ Database is in excellent condition!');
      report.recommendations.push('🚀 Ready for production use');
    }
    
    // Performance recommendations
    if (report.stats.properties > 10000) {
      report.recommendations.push('📈 Consider adding database indexes for better performance');
    }
  }

  /**
   * Print formatted report
   */
  printReport(report: DatabaseReport): void {
    console.log('📋 DATABASE VERIFICATION REPORT');
    console.log('===============================');
    console.log(`Generated: ${report.timestamp}`);
    console.log(`Connection: ${report.connectionStatus}`);
    if (report.databaseVersion) {
      console.log(`Version: ${report.databaseVersion.split(',')[0]}`);
    }
    console.log('');
    
    console.log('📊 DATABASE STATISTICS:');
    console.log(`   Users: ${report.stats.users.toLocaleString()}`);
    console.log(`   Properties: ${report.stats.properties.toLocaleString()}`);
    console.log(`   Reviews: ${report.stats.reviews.toLocaleString()}`);
    
    if (report.stats.orphanedProperties > 0 || report.stats.orphanedReviews > 0 || 
        report.stats.duplicateUsers > 0 || report.stats.incompleteRecords > 0) {
      console.log('');
      console.log('⚠️  DATA ISSUES:');
      if (report.stats.orphanedProperties > 0) {
        console.log(`   Orphaned Properties: ${report.stats.orphanedProperties}`);
      }
      if (report.stats.orphanedReviews > 0) {
        console.log(`   Orphaned Reviews: ${report.stats.orphanedReviews}`);
      }
      if (report.stats.duplicateUsers > 0) {
        console.log(`   Duplicate Users: ${report.stats.duplicateUsers}`);
      }
      if (report.stats.incompleteRecords > 0) {
        console.log(`   Incomplete Records: ${report.stats.incompleteRecords}`);
      }
    }
    
    if (report.issues.length > 0) {
      console.log('');
      console.log('🚨 ISSUES FOUND:');
      
      const groupedIssues = report.issues.reduce((groups, issue) => {
        if (!groups[issue.severity]) groups[issue.severity] = [];
        groups[issue.severity].push(issue);
        return groups;
      }, {} as Record<string, IntegrityIssue[]>);
      
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
        if (groupedIssues[severity]) {
          console.log(`\n   ${severity} SEVERITY:`);
          groupedIssues[severity].forEach(issue => {
            console.log(`   • ${issue.description} (${issue.count} records)`);
            if (issue.fixSuggestion) {
              console.log(`     💡 Fix: ${issue.fixSuggestion}`);
            }
          });
        }
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('');
      console.log('💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }
    
    if (report.performanceMetrics) {
      console.log('');
      console.log('⚡ PERFORMANCE METRICS:');
      console.log(`   Connection Time: ${report.performanceMetrics.connectionTime}ms`);
      console.log(`   Query Time: ${report.performanceMetrics.queryTime}ms`);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

/**
 * CLI Interface
 */
async function main() {
  const command = process.argv[2];
  
  const manager = new DatabaseManager();
  
  try {
    switch (command) {
      case 'test':
      case 'connection':
        await manager.testConnection();
        break;
        
      case 'verify':
      case 'check':
        const report = await manager.verifyDatabase();
        manager.printReport(report);
        
        // Exit with error code if critical issues found
        const criticalIssues = report.issues.filter(i => i.severity === 'CRITICAL').length;
        if (criticalIssues > 0) {
          process.exit(1);
        }
        break;
        
      case 'stats':
        await manager.initializeConnection();
        const stats = await manager.getDatabaseStats();
        console.log('📊 Database Statistics:');
        console.log(`   Users: ${stats.users}`);
        console.log(`   Properties: ${stats.properties}`);
        console.log(`   Reviews: ${stats.reviews}`);
        console.log(`   Issues: ${stats.orphanedProperties + stats.orphanedReviews + stats.duplicateUsers + stats.incompleteRecords}`);
        break;
        
      case 'help':
      case '--help':
      case '-h':
      default:
        console.log('Database Manager for TripleCheck');
        console.log('================================');
        console.log('');
        console.log('Usage: npx tsx scripts/database-manager.ts <command>');
        console.log('');
        console.log('Commands:');
        console.log('  test, connection     Test database connection');
        console.log('  verify, check       Run comprehensive verification');
        console.log('  stats               Show database statistics');
        console.log('  help                Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  npx tsx scripts/database-manager.ts test');
        console.log('  npx tsx scripts/database-manager.ts verify');
        break;
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseManager };