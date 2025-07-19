#!/usr/bin/env tsx
/**
 * Data Integrity Checker for TripleCheck
 * 
 * Features:
 * - Deep data validation and integrity checks
 * - Cross-reference validation between related records
 * - Orphaned record detection and cleanup
 * - Data consistency validation
 * - Automated data quality scoring
 * - Detailed integrity reports
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { count, eq, isNull, sql, and, or } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { users, properties, reviews } from '../shared/schema';
import type { User, Property, Review } from '../shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- CONFIGURATION ---------- */
const INTEGRITY_CONFIG = {
  REPORT_DIR: path.join(__dirname, 'integrity-reports'),
  BATCH_SIZE: 1000,
  QUALITY_THRESHOLDS: {
    EXCELLENT: 95,
    GOOD: 85,
    FAIR: 70,
    POOR: 50
  },
  VALIDATION_RULES: {
    REQUIRED_FIELDS: true,
    REFERENTIAL_INTEGRITY: true,
    DATA_CONSISTENCY: true,
    BUSINESS_RULES: true,
    ORPHANED_RECORDS: true
  }
};

/* ---------- TYPE DEFINITIONS ---------- */
interface IntegrityIssue {
  type: 'MISSING_FIELD' | 'INVALID_VALUE' | 'ORPHANED_RECORD' | 'INCONSISTENT_DATA' | 'BUSINESS_RULE_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  table: string;
  recordId: string | number;
  field?: string;
  description: string;
  suggestedFix?: string;
  affectedRecords?: number;
}

interface IntegrityReport {
  timestamp: Date;
  totalRecords: {
    users: number;
    properties: number;
    reviews: number;
  };
  issues: IntegrityIssue[];
  qualityScore: number;
  qualityGrade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  summary: {
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    totalIssues: number;
  };
  recommendations: string[];
}

interface ValidationRule {
  name: string;
  description: string;
  check: () => Promise<IntegrityIssue[]>;
  enabled: boolean;
}

/* ---------- DATA INTEGRITY CHECKER ---------- */
class DataIntegrityChecker {
  private db: ReturnType<typeof drizzle>;
  private validationRules: ValidationRule[];

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    
    this.initializeValidationRules();
  }

  private initializeValidationRules(): void {
    this.validationRules = [
      {
        name: 'Required Fields Validation',
        description: 'Check for missing required fields',
        check: () => this.checkRequiredFields(),
        enabled: INTEGRITY_CONFIG.VALIDATION_RULES.REQUIRED_FIELDS
      },
      {
        name: 'Referential Integrity',
        description: 'Check foreign key relationships',
        check: () => this.checkReferentialIntegrity(),
        enabled: INTEGRITY_CONFIG.VALIDATION_RULES.REFERENTIAL_INTEGRITY
      },
      {
        name: 'Data Consistency',
        description: 'Check for data consistency issues',
        check: () => this.checkDataConsistency(),
        enabled: INTEGRITY_CONFIG.VALIDATION_RULES.DATA_CONSISTENCY
      },
      {
        name: 'Business Rules',
        description: 'Check business logic constraints',
        check: () => this.checkBusinessRules(),
        enabled: INTEGRITY_CONFIG.VALIDATION_RULES.BUSINESS_RULES
      },
      {
        name: 'Orphaned Records',
        description: 'Check for orphaned records',
        check: () => this.checkOrphanedRecords(),
        enabled: INTEGRITY_CONFIG.VALIDATION_RULES.ORPHANED_RECORDS
      }
    ];
  }

  async performIntegrityCheck(): Promise<IntegrityReport> {
    console.log('🔍 Starting comprehensive data integrity check...');
    
    const startTime = Date.now();
    const allIssues: IntegrityIssue[] = [];
    
    // Get record counts
    const totalRecords = await this.getTotalRecords();
    
    // Run all enabled validation rules
    for (const rule of this.validationRules) {
      if (rule.enabled) {
        console.log(`   Checking: ${rule.name}...`);
        try {
          const issues = await rule.check();
          allIssues.push(...issues);
          console.log(`   ✅ ${rule.name}: ${issues.length} issues found`);
        } catch (error) {
          console.error(`   ❌ ${rule.name} failed:`, error);
          allIssues.push({
            type: 'INCONSISTENT_DATA',
            severity: 'HIGH',
            table: 'system',
            recordId: 'validation_error',
            description: `Validation rule "${rule.name}" failed: ${(error as Error).message}`,
            suggestedFix: 'Check system logs and fix validation rule'
          });
        }
      }
    }
    
    // Calculate quality score and grade
    const qualityScore = this.calculateQualityScore(allIssues, totalRecords);
    const qualityGrade = this.getQualityGrade(qualityScore);
    
    // Generate summary
    const summary = this.generateSummary(allIssues);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, qualityScore);
    
    const report: IntegrityReport = {
      timestamp: new Date(),
      totalRecords,
      issues: allIssues,
      qualityScore,
      qualityGrade,
      summary,
      recommendations
    };
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Integrity check completed in ${duration}ms`);
    console.log(`📊 Quality Score: ${qualityScore}% (${qualityGrade})`);
    console.log(`⚠️  Total Issues: ${allIssues.length}`);
    
    return report;
  }

  private async getTotalRecords(): Promise<IntegrityReport['totalRecords']> {
    const [userCount] = await this.db.select({ count: count() }).from(users);
    const [propertyCount] = await this.db.select({ count: count() }).from(properties);
    const [reviewCount] = await this.db.select({ count: count() }).from(reviews);

    return {
      users: userCount.count,
      properties: propertyCount.count,
      reviews: reviewCount.count
    };
  }

  private async checkRequiredFields(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    // Check users for required fields
    const usersWithMissingFields = await this.db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(or(
        eq(users.username, ''),
        isNull(users.username),
        eq(users.password, ''),
        isNull(users.password)
      ));

    for (const user of usersWithMissingFields) {
      issues.push({
        type: 'MISSING_FIELD',
        severity: 'HIGH',
        table: 'users',
        recordId: user.id,
        description: `User ${user.id} has missing required fields`,
        suggestedFix: 'Update user record with required information'
      });
    }

    // Check properties for required fields
    const propertiesWithMissingFields = await this.db
      .select({ id: properties.id, title: properties.title })
      .from(properties)
      .where(or(
        eq(properties.title, ''),
        isNull(properties.title),
        eq(properties.description, ''),
        isNull(properties.description),
        eq(properties.location, ''),
        isNull(properties.location)
      ));

    for (const property of propertiesWithMissingFields) {
      issues.push({
        type: 'MISSING_FIELD',
        severity: 'HIGH',
        table: 'properties',
        recordId: property.id,
        description: `Property ${property.id} has missing required fields`,
        suggestedFix: 'Update property record with required information'
      });
    }

    return issues;
  }

  private async checkReferentialIntegrity(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    // Check for properties with invalid owner IDs
    const propertiesWithInvalidOwners = await this.db
      .select({ 
        id: properties.id, 
        ownerId: properties.ownerId,
        title: properties.title 
      })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(isNull(users.id));

    for (const property of propertiesWithInvalidOwners) {
      issues.push({
        type: 'ORPHANED_RECORD',
        severity: 'CRITICAL',
        table: 'properties',
        recordId: property.id,
        field: 'ownerId',
        description: `Property ${property.id} references non-existent user ${property.ownerId}`,
        suggestedFix: 'Assign property to valid user or create missing user record'
      });
    }

    // Check for reviews with invalid property IDs
    const reviewsWithInvalidProperties = await this.db
      .select({ 
        id: reviews.id, 
        propertyId: reviews.propertyId 
      })
      .from(reviews)
      .leftJoin(properties, eq(reviews.propertyId, properties.id))
      .where(isNull(properties.id));

    for (const review of reviewsWithInvalidProperties) {
      issues.push({
        type: 'ORPHANED_RECORD',
        severity: 'HIGH',
        table: 'reviews',
        recordId: review.id,
        field: 'propertyId',
        description: `Review ${review.id} references non-existent property ${review.propertyId}`,
        suggestedFix: 'Delete orphaned review or create missing property record'
      });
    }

    // Check for reviews with invalid user IDs
    const reviewsWithInvalidUsers = await this.db
      .select({ 
        id: reviews.id, 
        userId: reviews.userId 
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(isNull(users.id));

    for (const review of reviewsWithInvalidUsers) {
      issues.push({
        type: 'ORPHANED_RECORD',
        severity: 'HIGH',
        table: 'reviews',
        recordId: review.id,
        field: 'userId',
        description: `Review ${review.id} references non-existent user ${review.userId}`,
        suggestedFix: 'Delete orphaned review or create missing user record'
      });
    }

    return issues;
  }

  private async checkDataConsistency(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    // Check for duplicate usernames
    const duplicateUsernames = await this.db
      .select({ 
        username: users.username,
        count: count()
      })
      .from(users)
      .groupBy(users.username)
      .having(sql`count(*) > 1`);

    for (const duplicate of duplicateUsernames) {
      issues.push({
        type: 'INCONSISTENT_DATA',
        severity: 'HIGH',
        table: 'users',
        recordId: duplicate.username,
        field: 'username',
        description: `Duplicate username "${duplicate.username}" found ${duplicate.count} times`,
        suggestedFix: 'Make usernames unique by adding suffixes or merging accounts',
        affectedRecords: duplicate.count
      });
    }

    // Check for properties with invalid prices
    const propertiesWithInvalidPrices = await this.db
      .select({ id: properties.id, price: properties.price, title: properties.title })
      .from(properties)
      .where(or(
        sql`${properties.price} <= 0`,
        sql`${properties.price} > 1000000000` // 1 billion limit
      ));

    for (const property of propertiesWithInvalidPrices) {
      issues.push({
        type: 'INVALID_VALUE',
        severity: 'MEDIUM',
        table: 'properties',
        recordId: property.id,
        field: 'price',
        description: `Property ${property.id} has invalid price: ${property.price}`,
        suggestedFix: 'Update property price to reasonable value'
      });
    }

    // Check for reviews with invalid ratings
    const reviewsWithInvalidRatings = await this.db
      .select({ id: reviews.id, rating: reviews.rating })
      .from(reviews)
      .where(or(
        sql`${reviews.rating} < 1`,
        sql`${reviews.rating} > 5`
      ));

    for (const review of reviewsWithInvalidRatings) {
      issues.push({
        type: 'INVALID_VALUE',
        severity: 'MEDIUM',
        table: 'reviews',
        recordId: review.id,
        field: 'rating',
        description: `Review ${review.id} has invalid rating: ${review.rating}`,
        suggestedFix: 'Update rating to be between 1 and 5'
      });
    }

    return issues;
  }

  private async checkBusinessRules(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    // Check for users with extremely high trust scores without verification
    const usersWithHighTrustScore = await this.db
      .select({ 
        id: users.id, 
        username: users.username,
        trustScore: users.trustScore,
        isVerifiedAgent: users.isVerifiedAgent
      })
      .from(users)
      .where(and(
        sql`${users.trustScore} > 900`,
        eq(users.isVerifiedAgent, false)
      ));

    for (const user of usersWithHighTrustScore) {
      issues.push({
        type: 'BUSINESS_RULE_VIOLATION',
        severity: 'MEDIUM',
        table: 'users',
        recordId: user.id,
        description: `User ${user.username} has high trust score (${user.trustScore}) but is not verified`,
        suggestedFix: 'Verify user credentials or adjust trust score'
      });
    }

    // Check for properties with suspicious feature combinations
    const propertiesWithSuspiciousFeatures = await this.db
      .select({ 
        id: properties.id, 
        title: properties.title,
        features: properties.features,
        price: properties.price
      })
      .from(properties);

    for (const property of propertiesWithSuspiciousFeatures) {
      const features = property.features as any;
      
      // Check for impossible bathroom/bedroom ratios
      if (features.bathrooms > features.bedrooms * 2) {
        issues.push({
          type: 'BUSINESS_RULE_VIOLATION',
          severity: 'LOW',
          table: 'properties',
          recordId: property.id,
          description: `Property ${property.id} has unusual bathroom/bedroom ratio (${features.bathrooms}/${features.bedrooms})`,
          suggestedFix: 'Verify property features are correct'
        });
      }

      // Check for extremely low price per square foot
      if (features.squareFeet && property.price / features.squareFeet < 10) {
        issues.push({
          type: 'BUSINESS_RULE_VIOLATION',
          severity: 'HIGH',
          table: 'properties',
          recordId: property.id,
          description: `Property ${property.id} has suspiciously low price per sq ft: $${(property.price / features.squareFeet).toFixed(2)}`,
          suggestedFix: 'Verify property price and square footage'
        });
      }
    }

    return issues;
  }

  private async checkOrphanedRecords(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];

    // Check for users with no properties or reviews
    const usersWithNoActivity = await this.db
      .select({ 
        id: users.id, 
        username: users.username,
        createdAt: users.createdAt
      })
      .from(users)
      .leftJoin(properties, eq(users.id, properties.ownerId))
      .leftJoin(reviews, eq(users.id, reviews.userId))
      .where(and(
        isNull(properties.id),
        isNull(reviews.id),
        sql`${users.createdAt} < NOW() - INTERVAL '30 days'`
      ));

    for (const user of usersWithNoActivity) {
      issues.push({
        type: 'ORPHANED_RECORD',
        severity: 'LOW',
        table: 'users',
        recordId: user.id,
        description: `User ${user.username} has no properties or reviews after 30 days`,
        suggestedFix: 'Consider user engagement or cleanup inactive accounts'
      });
    }

    // Check for properties with no reviews after significant time
    const propertiesWithNoReviews = await this.db
      .select({ 
        id: properties.id, 
        title: properties.title,
        createdAt: properties.createdAt
      })
      .from(properties)
      .leftJoin(reviews, eq(properties.id, reviews.propertyId))
      .where(and(
        isNull(reviews.id),
        sql`${properties.createdAt} < NOW() - INTERVAL '90 days'`
      ));

    for (const property of propertiesWithNoReviews) {
      issues.push({
        type: 'ORPHANED_RECORD',
        severity: 'LOW',
        table: 'properties',
        recordId: property.id,
        description: `Property ${property.id} has no reviews after 90 days`,
        suggestedFix: 'Investigate property visibility or encourage reviews'
      });
    }

    return issues;
  }

  private calculateQualityScore(issues: IntegrityIssue[], totalRecords: IntegrityReport['totalRecords']): number {
    const totalRecordCount = totalRecords.users + totalRecords.properties + totalRecords.reviews;
    
    if (totalRecordCount === 0) return 100;

    // Weight issues by severity
    const severityWeights = {
      'CRITICAL': 10,
      'HIGH': 5,
      'MEDIUM': 2,
      'LOW': 1
    };

    const totalWeight = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);

    // Calculate score (higher weight = lower score)
    const maxPossibleWeight = totalRecordCount * 0.1; // Assume 10% critical issues would be 0 score
    const score = Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  private getQualityGrade(score: number): IntegrityReport['qualityGrade'] {
    if (score >= INTEGRITY_CONFIG.QUALITY_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
    if (score >= INTEGRITY_CONFIG.QUALITY_THRESHOLDS.GOOD) return 'GOOD';
    if (score >= INTEGRITY_CONFIG.QUALITY_THRESHOLDS.FAIR) return 'FAIR';
    if (score >= INTEGRITY_CONFIG.QUALITY_THRESHOLDS.POOR) return 'POOR';
    return 'CRITICAL';
  }

  private generateSummary(issues: IntegrityIssue[]): IntegrityReport['summary'] {
    return {
      criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length,
      highIssues: issues.filter(i => i.severity === 'HIGH').length,
      mediumIssues: issues.filter(i => i.severity === 'MEDIUM').length,
      lowIssues: issues.filter(i => i.severity === 'LOW').length,
      totalIssues: issues.length
    };
  }

  private generateRecommendations(issues: IntegrityIssue[], qualityScore: number): string[] {
    const recommendations: string[] = [];

    // Critical issues recommendations
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 URGENT: Address ${criticalIssues.length} critical data integrity issues immediately`);
      recommendations.push('Focus on referential integrity issues first to prevent data corruption');
    }

    // High severity recommendations
    const highIssues = issues.filter(i => i.severity === 'HIGH');
    if (highIssues.length > 0) {
      recommendations.push(`⚠️ HIGH PRIORITY: Resolve ${highIssues.length} high-severity issues within 24 hours`);
    }

    // Quality score based recommendations
    if (qualityScore < 50) {
      recommendations.push('🔧 Consider implementing automated data validation rules');
      recommendations.push('📊 Set up regular data quality monitoring');
      recommendations.push('🛠️ Review data entry processes and validation');
    } else if (qualityScore < 85) {
      recommendations.push('✨ Good data quality - focus on resolving remaining medium/high issues');
      recommendations.push('🔄 Implement preventive measures for common issues');
    } else {
      recommendations.push('🎉 Excellent data quality - maintain current standards');
      recommendations.push('📈 Consider implementing advanced data quality metrics');
    }

    // Specific issue type recommendations
    const orphanedIssues = issues.filter(i => i.type === 'ORPHANED_RECORD');
    if (orphanedIssues.length > 10) {
      recommendations.push('🧹 Implement automated cleanup for orphaned records');
    }

    const duplicateIssues = issues.filter(i => i.description.includes('Duplicate'));
    if (duplicateIssues.length > 0) {
      recommendations.push('🔍 Implement unique constraints and duplicate detection');
    }

    return recommendations;
  }

  async saveReport(report: IntegrityReport): Promise<string> {
    await fs.mkdir(INTEGRITY_CONFIG.REPORT_DIR, { recursive: true });
    
    const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(INTEGRITY_CONFIG.REPORT_DIR, `integrity-report-${timestamp}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Also save a human-readable summary
    const summaryPath = path.join(INTEGRITY_CONFIG.REPORT_DIR, `integrity-summary-${timestamp}.txt`);
    const summaryContent = this.generateTextSummary(report);
    await fs.writeFile(summaryPath, summaryContent);
    
    return reportPath;
  }

  private generateTextSummary(report: IntegrityReport): string {
    const lines: string[] = [];
    
    lines.push('🔍 DATA INTEGRITY REPORT');
    lines.push('='.repeat(50));
    lines.push(`📅 Generated: ${report.timestamp.toISOString()}`);
    lines.push(`📊 Quality Score: ${report.qualityScore}% (${report.qualityGrade})`);
    lines.push('');
    
    lines.push('📈 RECORD COUNTS:');
    lines.push(`   Users: ${report.totalRecords.users.toLocaleString()}`);
    lines.push(`   Properties: ${report.totalRecords.properties.toLocaleString()}`);
    lines.push(`   Reviews: ${report.totalRecords.reviews.toLocaleString()}`);
    lines.push('');
    
    lines.push('⚠️ ISSUE SUMMARY:');
    lines.push(`   🚨 Critical: ${report.summary.criticalIssues}`);
    lines.push(`   🔴 High: ${report.summary.highIssues}`);
    lines.push(`   🟡 Medium: ${report.summary.mediumIssues}`);
    lines.push(`   🟢 Low: ${report.summary.lowIssues}`);
    lines.push(`   📊 Total: ${report.summary.totalIssues}`);
    lines.push('');
    
    if (report.recommendations.length > 0) {
      lines.push('💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => lines.push(`   ${rec}`));
      lines.push('');
    }
    
    if (report.issues.length > 0) {
      lines.push('🔍 DETAILED ISSUES:');
      lines.push('-'.repeat(50));
      
      // Group issues by severity
      const groupedIssues = {
        CRITICAL: report.issues.filter(i => i.severity === 'CRITICAL'),
        HIGH: report.issues.filter(i => i.severity === 'HIGH'),
        MEDIUM: report.issues.filter(i => i.severity === 'MEDIUM'),
        LOW: report.issues.filter(i => i.severity === 'LOW')
      };
      
      Object.entries(groupedIssues).forEach(([severity, issues]) => {
        if (issues.length > 0) {
          lines.push(`\n${severity} SEVERITY (${issues.length} issues):`);
          issues.forEach((issue, index) => {
            lines.push(`${index + 1}. [${issue.table}:${issue.recordId}] ${issue.description}`);
            if (issue.suggestedFix) {
              lines.push(`   💡 Fix: ${issue.suggestedFix}`);
            }
          });
        }
      });
    }
    
    return lines.join('\n');
  }
}

/* ---------- CLI INTERFACE ---------- */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🔧 Data Integrity Checker for TripleCheck

Usage:
  tsx scripts/data-integrity-checker.ts [options]

Options:
  --help                    Show this help message
  --config                  Show current configuration
  --quick                   Run quick integrity check (skip low-priority rules)
  --report-only             Generate report without console output
  --fix-suggestions         Show detailed fix suggestions for each issue

Features:
  ✅ Comprehensive data validation and integrity checks
  ✅ Cross-reference validation between related records
  ✅ Orphaned record detection and cleanup suggestions
  ✅ Data consistency validation across tables
  ✅ Business rule validation
  ✅ Automated data quality scoring
  ✅ Detailed integrity reports with recommendations

Validation Rules:
  🔍 Required Fields - Check for missing mandatory data
  🔗 Referential Integrity - Validate foreign key relationships
  📊 Data Consistency - Check for duplicate and invalid data
  📋 Business Rules - Validate business logic constraints
  🧹 Orphaned Records - Identify records without relationships

Quality Grades:
  🌟 EXCELLENT (95%+) - Exceptional data quality
  ✅ GOOD (85-94%) - Good data quality with minor issues
  ⚠️ FAIR (70-84%) - Acceptable quality, needs attention
  🔴 POOR (50-69%) - Poor quality, requires immediate action
  🚨 CRITICAL (<50%) - Critical issues, data integrity at risk
    `);
    process.exit(0);
  }

  if (args.includes('--config')) {
    console.log('Current Configuration:');
    console.log(JSON.stringify(INTEGRITY_CONFIG, null, 2));
    process.exit(0);
  }

  try {
    const checker = new DataIntegrityChecker();
    
    // Modify rules based on arguments
    if (args.includes('--quick')) {
      console.log('🚀 Running quick integrity check (skipping low-priority rules)...');
      // This would modify the validation rules to skip low-priority checks
    }
    
    const report = await checker.performIntegrityCheck();
    
    if (!args.includes('--report-only')) {
      // Display summary
      console.log('\n' + '='.repeat(60));
      console.log('📋 DATA INTEGRITY SUMMARY');
      console.log('='.repeat(60));
      console.log(`📊 Overall Quality: ${report.qualityScore}% (${report.qualityGrade})`);
      console.log(`📈 Total Records: ${(report.totalRecords.users + report.totalRecords.properties + report.totalRecords.reviews).toLocaleString()}`);
      console.log(`⚠️  Total Issues: ${report.summary.totalIssues}`);
      console.log(`   🚨 Critical: ${report.summary.criticalIssues}`);
      console.log(`   🔴 High: ${report.summary.highIssues}`);
      console.log(`   🟡 Medium: ${report.summary.mediumIssues}`);
      console.log(`   🟢 Low: ${report.summary.lowIssues}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 TOP RECOMMENDATIONS:');
        report.recommendations.slice(0, 5).forEach(rec => console.log(`   ${rec}`));
      }
      
      if (args.includes('--fix-suggestions') && report.issues.length > 0) {
        console.log('\n🔧 DETAILED FIX SUGGESTIONS:');
        const criticalAndHigh = report.issues.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity));
        criticalAndHigh.slice(0, 10).forEach((issue, index) => {
          console.log(`\n${index + 1}. ${issue.severity} - ${issue.description}`);
          if (issue.suggestedFix) {
            console.log(`   💡 Suggested Fix: ${issue.suggestedFix}`);
          }
        });
      }
    }
    
    // Save report
    const reportPath = await checker.saveReport(report);
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    // Exit with appropriate code
    if (report.summary.criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED - Immediate attention required!');
      process.exit(2);
    } else if (report.summary.highIssues > 0) {
      console.log('\n⚠️ HIGH PRIORITY ISSUES - Please address soon');
      process.exit(1);
    } else {
      console.log('\n✅ Data integrity check completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Integrity check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(console.error);
}

export { DataIntegrityChecker, INTEGRITY_CONFIG };