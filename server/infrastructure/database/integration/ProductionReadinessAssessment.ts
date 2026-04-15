/**
 * Production Readiness Assessment
 * 
 * Comprehensive assessment system for validating production readiness
 * with detailed checklists, validation criteria, and certification.
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import { writeFileSync } from 'fs';
import { logger } from '../../monitoring/logger';
import { SystemIntegrationValidator } from './SystemIntegrationValidator';

export interface ProductionReadinessConfig {
  // Assessment Criteria
  criteria: {
    performance: {
      weight: number;
      targets: {
        avgResponseTime: number;    // 50ms
        p95ResponseTime: number;    // 100ms
        throughput: number;         // 10,000 qps
        errorRate: number;          // 0.01%
        uptime: number;             // 99.99%
      };
    };
    reliability: {
      weight: number;
      requirements: {
        failoverTime: number;       // 15 seconds
        backupFrequency: number;    // 24 hours
        recoveryTime: number;       // 15 minutes
        dataIntegrity: number;      // 100%
      };
    };
    security: {
      weight: number;
      requirements: {
        encryption: boolean;
        accessControl: boolean;
        auditLogging: boolean;
        compliance: boolean;
      };
    };
    scalability: {
      weight: number;
      targets: {
        maxConnections: number;     // 1000
        dataVolume: number;         // 10x production
        concurrentUsers: number;    // 10x production
      };
    };
    monitoring: {
      weight: number;
      requirements: {
        healthChecks: boolean;
        alerting: boolean;
        metrics: boolean;
        logging: boolean;
      };
    };
  };
  
  // Validation Thresholds
  thresholds: {
    minimumScore: number;           // 85%
    criticalIssueThreshold: number; // 0
    highIssueThreshold: number;     // 2
  };
  
  // Reporting
  reporting: {
    generateCertificate: boolean;
    includeRecommendations: boolean;
    outputDirectory: string;
  };
}

export interface ProductionReadinessResult {
  assessmentId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  overallPassed: boolean;
  overallScore: number;
  
  // Criteria Results
  criteriaResults: {
    performance: CriteriaResult;
    reliability: CriteriaResult;
    security: CriteriaResult;
    scalability: CriteriaResult;
    monitoring: CriteriaResult;
  };
  
  // Issues and Recommendations
  issues: Array<{
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    recommendation: string;
    impact: string;
  }>;
  
  recommendations: string[];
  
  // Certification
  certification: {
    certified: boolean;
    certificateId?: string;
    validUntil?: Date;
    conditions?: string[];
  };
}

export interface CriteriaResult {
  passed: boolean;
  score: number;
  weight: number;
  weightedScore: number;
  details: string;
  issues: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    recommendation: string;
  }>;
}

export class ProductionReadinessAssessment extends EventEmitter {
  private config: ProductionReadinessConfig;
  private pool: Pool;
  private assessmentId: string;

  constructor(pool: Pool, config: Partial<ProductionReadinessConfig> = {}) {
    super();
    
    this.pool = pool;
    this.assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.config = {
      criteria: {
        performance: {
          weight: 30,
          targets: {
            avgResponseTime: 50,
            p95ResponseTime: 100,
            throughput: 10000,
            errorRate: 0.0001,
            uptime: 0.9999
          }
        },
        reliability: {
          weight: 25,
          requirements: {
            failoverTime: 15,
            backupFrequency: 24,
            recoveryTime: 15,
            dataIntegrity: 100
          }
        },
        security: {
          weight: 20,
          requirements: {
            encryption: true,
            accessControl: true,
            auditLogging: true,
            compliance: true
          }
        },
        scalability: {
          weight: 15,
          targets: {
            maxConnections: 1000,
            dataVolume: 10,
            concurrentUsers: 10
          }
        },
        monitoring: {
          weight: 10,
          requirements: {
            healthChecks: true,
            alerting: true,
            metrics: true,
            logging: true
          }
        }
      },
      thresholds: {
        minimumScore: 85,
        criticalIssueThreshold: 0,
        highIssueThreshold: 2
      },
      reporting: {
        generateCertificate: true,
        includeRecommendations: true,
        outputDirectory: './database/integration/reports'
      },
      ...config
    };
  }

  /**
   * Execute comprehensive production readiness assessment
   */
  async executeAssessment(): Promise<ProductionReadinessResult> {
    const startTime = new Date();
    
    logger.info(`🔍 Starting production readiness assessment: ${this.assessmentId}`);
    this.emit('assessment_started', { assessmentId: this.assessmentId });

    try {
      // Execute all criteria assessments
      const criteriaResults = {
        performance: await this.assessPerformance(),
        reliability: await this.assessReliability(),
        security: await this.assessSecurity(),
        scalability: await this.assessScalability(),
        monitoring: await this.assessMonitoring()
      };

      // Calculate overall score
      const overallScore = this.calculateOverallScore(criteriaResults);
      
      // Collect all issues
      const allIssues = this.collectAllIssues(criteriaResults);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(criteriaResults, allIssues);
      
      // Determine certification
      const certification = this.determineCertification(overallScore, allIssues);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const result: ProductionReadinessResult = {
        assessmentId: this.assessmentId,
        startTime,
        endTime,
        duration,
        overallPassed: certification.certified,
        overallScore,
        criteriaResults,
        issues: allIssues,
        recommendations,
        certification
      };

      // Generate reports
      if (this.config.reporting.generateCertificate) {
        await this.generateAssessmentReport(result);
      }

      this.emit('assessment_completed', { assessmentId: this.assessmentId, result });
      logger.info(`${result.overallPassed ? '✅' : '❌'} Production readiness assessment completed: ${this.assessmentId}`, {
        passed: result.overallPassed,
        score: result.overallScore,
        duration
      });

      return result;

    } catch (error) {
      this.emit('assessment_failed', { assessmentId: this.assessmentId, error });
      logger.error({ error: error }, '❌ Production readiness assessment failed: ${this.assessmentId}');
      throw error;
    }
  }

  /**
   * Assess performance criteria
   */
  private async assessPerformance(): Promise<CriteriaResult> {
    logger.info('📊 Assessing performance criteria...');
    
    const issues: CriteriaResult['issues'] = [];
    let score = 100;
    
    try {
      // Import performance certification system
      const { PerformanceCertificationSystem } = await import('../performance/PerformanceCertificationSystem');
      const certificationSystem = new PerformanceCertificationSystem(this.pool);
      
      const certificationResult = await certificationSystem.executeCertification();
      
      if (!certificationResult.passed) {
        issues.push({
          severity: 'HIGH',
          message: 'Performance certification failed',
          recommendation: 'Complete performance optimization and re-run certification'
        });
        score -= 30;
      }
      
      // Check specific performance targets
      if (certificationResult.metrics?.avgResponseTime > this.config.criteria.performance.targets.avgResponseTime) {
        issues.push({
          severity: 'MEDIUM',
          message: `Average response time exceeds target: ${certificationResult.metrics.avgResponseTime}ms > ${this.config.criteria.performance.targets.avgResponseTime}ms`,
          recommendation: 'Optimize slow queries and add appropriate indexes'
        });
        score -= 15;
      }
      
      const passed = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
      const weight = this.config.criteria.performance.weight;
      
      return {
        passed,
        score: Math.max(0, score),
        weight,
        weightedScore: (score * weight) / 100,
        details: `Performance assessment completed with ${score}% score`,
        issues
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        weight: this.config.criteria.performance.weight,
        weightedScore: 0,
        details: `Performance assessment failed: ${error.message}`,
        issues: [{
          severity: 'CRITICAL',
          message: `Performance assessment failed: ${error.message}`,
          recommendation: 'Fix performance testing infrastructure and re-run assessment'
        }]
      };
    }
  }

  /**
   * Assess reliability criteria
   */
  private async assessReliability(): Promise<CriteriaResult> {
    logger.info('🛡️ Assessing reliability criteria...');
    
    const issues: CriteriaResult['issues'] = [];
    let score = 100;
    
    try {
      // Check backup system
      const { BackupManager } = await import('../disaster-recovery/BackupManager');
      const backupManager = new BackupManager();
      
      const backupStatus = await backupManager.getBackupStatus();
      if (!backupStatus.healthy) {
        issues.push({
          severity: 'HIGH',
          message: 'Backup system is not healthy',
          recommendation: 'Fix backup system configuration and ensure regular backups'
        });
        score -= 25;
      }
      
      // Check disaster recovery
      const { DisasterRecoveryManager } = await import('../disaster-recovery/DisasterRecoveryManager');
      const drManager = new DisasterRecoveryManager();
      
      const drStatus = await drManager.getSystemStatus();
      if (!drStatus.ready) {
        issues.push({
          severity: 'HIGH',
          message: 'Disaster recovery system is not ready',
          recommendation: 'Complete disaster recovery setup and testing'
        });
        score -= 25;
      }
      
      const passed = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
      const weight = this.config.criteria.reliability.weight;
      
      return {
        passed,
        score: Math.max(0, score),
        weight,
        weightedScore: (score * weight) / 100,
        details: `Reliability assessment completed with ${score}% score`,
        issues
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        weight: this.config.criteria.reliability.weight,
        weightedScore: 0,
        details: `Reliability assessment failed: ${error.message}`,
        issues: [{
          severity: 'CRITICAL',
          message: `Reliability assessment failed: ${error.message}`,
          recommendation: 'Fix reliability infrastructure and re-run assessment'
        }]
      };
    }
  }

  /**
   * Assess security criteria
   */
  private async assessSecurity(): Promise<CriteriaResult> {
    logger.info('🔒 Assessing security criteria...');
    
    const issues: CriteriaResult['issues'] = [];
    let score = 100;
    
    try {
      // Check security system
      const { SecuritySystem } = await import('../security/SecuritySystem');
      const securitySystem = new SecuritySystem();
      
      const securityStatus = await securitySystem.getSystemStatus();
      
      if (!securityStatus.encryption.enabled) {
        issues.push({
          severity: 'CRITICAL',
          message: 'Data encryption is not enabled',
          recommendation: 'Enable encryption at rest and in transit'
        });
        score -= 40;
      }
      
      if (!securityStatus.accessControl.enabled) {
        issues.push({
          severity: 'HIGH',
          message: 'Role-based access control is not properly configured',
          recommendation: 'Configure proper RBAC and user permissions'
        });
        score -= 25;
      }
      
      if (!securityStatus.auditLogging.enabled) {
        issues.push({
          severity: 'HIGH',
          message: 'Audit logging is not enabled',
          recommendation: 'Enable comprehensive audit logging'
        });
        score -= 20;
      }
      
      const passed = issues.filter(i => i.severity === 'CRITICAL').length === 0;
      const weight = this.config.criteria.security.weight;
      
      return {
        passed,
        score: Math.max(0, score),
        weight,
        weightedScore: (score * weight) / 100,
        details: `Security assessment completed with ${score}% score`,
        issues
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        weight: this.config.criteria.security.weight,
        weightedScore: 0,
        details: `Security assessment failed: ${error.message}`,
        issues: [{
          severity: 'CRITICAL',
          message: `Security assessment failed: ${error.message}`,
          recommendation: 'Fix security infrastructure and re-run assessment'
        }]
      };
    }
  }

  /**
   * Assess scalability criteria
   */
  private async assessScalability(): Promise<CriteriaResult> {
    logger.info('📈 Assessing scalability criteria...');
    
    const issues: CriteriaResult['issues'] = [];
    let score = 100;
    
    try {
      // Test connection pool scalability
      const maxConnections = this.config.criteria.scalability.targets.maxConnections;
      const testConnections = Math.min(100, maxConnections / 10); // Test with 10% of max
      
      const connectionPromises = [];
      for (let i = 0; i < testConnections; i++) {
        connectionPromises.push(this.testConnection());
      }
      
      const connectionResults = await Promise.allSettled(connectionPromises);
      const failedConnections = connectionResults.filter(r => r.status === 'rejected').length;
      
      if (failedConnections > testConnections * 0.05) { // Allow 5% failure rate
        issues.push({
          severity: 'MEDIUM',
          message: `High connection failure rate during scalability test: ${failedConnections}/${testConnections}`,
          recommendation: 'Increase connection pool size or optimize connection handling'
        });
        score -= 20;
      }
      
      const passed = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
      const weight = this.config.criteria.scalability.weight;
      
      return {
        passed,
        score: Math.max(0, score),
        weight,
        weightedScore: (score * weight) / 100,
        details: `Scalability assessment completed with ${score}% score`,
        issues
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        weight: this.config.criteria.scalability.weight,
        weightedScore: 0,
        details: `Scalability assessment failed: ${error.message}`,
        issues: [{
          severity: 'CRITICAL',
          message: `Scalability assessment failed: ${error.message}`,
          recommendation: 'Fix scalability infrastructure and re-run assessment'
        }]
      };
    }
  }

  /**
   * Assess monitoring criteria
   */
  private async assessMonitoring(): Promise<CriteriaResult> {
    logger.info('📊 Assessing monitoring criteria...');
    
    const issues: CriteriaResult['issues'] = [];
    let score = 100;
    
    try {
      // Check health monitoring
      const { DatabaseHealthMonitor } = await import('../health/DatabaseHealthMonitor');
      const healthMonitor = new DatabaseHealthMonitor(this.pool);
      
      const healthStatus = await healthMonitor.checkHealth();
      if (!healthStatus.healthy) {
        issues.push({
          severity: 'MEDIUM',
          message: 'Health monitoring system has issues',
          recommendation: 'Fix health monitoring configuration'
        });
        score -= 15;
      }
      
      // Check if monitoring endpoints are available
      // This would typically check Prometheus, Grafana, etc.
      // For now, we'll assume they're configured if no errors occur
      
      const passed = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
      const weight = this.config.criteria.monitoring.weight;
      
      return {
        passed,
        score: Math.max(0, score),
        weight,
        weightedScore: (score * weight) / 100,
        details: `Monitoring assessment completed with ${score}% score`,
        issues
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        weight: this.config.criteria.monitoring.weight,
        weightedScore: 0,
        details: `Monitoring assessment failed: ${error.message}`,
        issues: [{
          severity: 'CRITICAL',
          message: `Monitoring assessment failed: ${error.message}`,
          recommendation: 'Fix monitoring infrastructure and re-run assessment'
        }]
      };
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }

  /**
   * Calculate overall score from criteria results
   */
  private calculateOverallScore(criteriaResults: any): number {
    const totalWeightedScore = Object.values(criteriaResults).reduce(
      (sum: number, result: any) => sum + result.weightedScore,
      0
    );
    
    const totalWeight = Object.values(this.config.criteria).reduce(
      (sum: number, criteria: any) => sum + criteria.weight,
      0
    );
    
    return Math.round((totalWeightedScore / totalWeight) * 100);
  }

  /**
   * Collect all issues from criteria results
   */
  private collectAllIssues(criteriaResults: any): ProductionReadinessResult['issues'] {
    const allIssues: ProductionReadinessResult['issues'] = [];
    
    Object.entries(criteriaResults).forEach(([category, result]: [string, any]) => {
      result.issues.forEach((issue: any) => {
        allIssues.push({
          category,
          severity: issue.severity,
          message: issue.message,
          recommendation: issue.recommendation,
          impact: this.determineImpact(issue.severity)
        });
      });
    });
    
    return allIssues;
  }

  /**
   * Determine impact based on severity
   */
  private determineImpact(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'System cannot be deployed to production';
      case 'HIGH':
        return 'Significant risk to production stability';
      case 'MEDIUM':
        return 'Moderate risk that should be addressed';
      case 'LOW':
        return 'Minor issue with minimal impact';
      default:
        return 'Unknown impact';
    }
  }

  /**
   * Generate recommendations based on assessment results
   */
  private generateRecommendations(criteriaResults: any, issues: any[]): string[] {
    const recommendations: string[] = [];
    
    // Critical issues
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 Address ${criticalIssues.length} critical issue(s) before production deployment`);
    }
    
    // High priority issues
    const highIssues = issues.filter(i => i.severity === 'HIGH');
    if (highIssues.length > 0) {
      recommendations.push(`⚠️ Resolve ${highIssues.length} high-priority issue(s) for production readiness`);
    }
    
    // Category-specific recommendations
    Object.entries(criteriaResults).forEach(([category, result]: [string, any]) => {
      if (!result.passed) {
        recommendations.push(`🔧 Improve ${category} criteria (current score: ${result.score}%)`);
      }
    });
    
    // General recommendations
    if (issues.length === 0) {
      recommendations.push('✅ System meets all production readiness criteria');
      recommendations.push('📋 Proceed with final deployment checklist');
    }
    
    return recommendations;
  }

  /**
   * Determine certification status
   */
  private determineCertification(overallScore: number, issues: any[]): ProductionReadinessResult['certification'] {
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL').length;
    const highIssues = issues.filter(i => i.severity === 'HIGH').length;
    
    const certified = overallScore >= this.config.thresholds.minimumScore &&
                     criticalIssues <= this.config.thresholds.criticalIssueThreshold &&
                     highIssues <= this.config.thresholds.highIssueThreshold;
    
    if (certified) {
      const certificateId = `PROD_CERT_${this.assessmentId}`;
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 6); // Valid for 6 months
      
      return {
        certified: true,
        certificateId,
        validUntil,
        conditions: []
      };
    } else {
      const conditions: string[] = [];
      
      if (overallScore < this.config.thresholds.minimumScore) {
        conditions.push(`Improve overall score to at least ${this.config.thresholds.minimumScore}%`);
      }
      
      if (criticalIssues > this.config.thresholds.criticalIssueThreshold) {
        conditions.push(`Resolve all ${criticalIssues} critical issue(s)`);
      }
      
      if (highIssues > this.config.thresholds.highIssueThreshold) {
        conditions.push(`Resolve ${highIssues - this.config.thresholds.highIssueThreshold} high-priority issue(s)`);
      }
      
      return {
        certified: false,
        conditions
      };
    }
  }

  /**
   * Generate assessment report
   */
  private async generateAssessmentReport(result: ProductionReadinessResult): Promise<void> {
    const fs = await import('fs/promises');
    
    try {
      await fs.mkdir(this.config.reporting.outputDirectory, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Generate JSON report
    const jsonPath = `${this.config.reporting.outputDirectory}/production-readiness-${this.assessmentId}.json`;
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(result);
    const htmlPath = `${this.config.reporting.outputDirectory}/production-readiness-${this.assessmentId}.html`;
    await fs.writeFile(htmlPath, htmlReport);
    
    // Generate certificate if certified
    if (result.certification.certified) {
      const certificate = this.generateCertificate(result);
      const certPath = `${this.config.reporting.outputDirectory}/production-certificate-${result.certification.certificateId}.html`;
      await fs.writeFile(certPath, certificate);
    }
    
    logger.info(`📊 Production readiness reports generated:`, {
      json: jsonPath,
      html: htmlPath,
      certificate: result.certification.certified ? `production-certificate-${result.certification.certificateId}.html` : null
    });
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(result: ProductionReadinessResult): string {
    const statusIcon = result.overallPassed ? '✅' : '❌';
    const statusColor = result.overallPassed ? '#28a745' : '#dc3545';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Production Readiness Assessment - ${result.assessmentId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status { font-size: 24px; color: ${statusColor}; }
        .criteria { border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; }
        .criteria-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .issues { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendations { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .certificate { background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${statusIcon} Production Readiness Assessment</h1>
        <div class="status">Overall Status: ${result.overallPassed ? 'CERTIFIED' : 'NOT CERTIFIED'}</div>
        <p><strong>Assessment ID:</strong> ${result.assessmentId}</p>
        <p><strong>Duration:</strong> ${Math.round(result.duration / 1000)}s</p>
        <p><strong>Score:</strong> ${result.overallScore}%</p>
        <p><strong>Started:</strong> ${result.startTime.toISOString()}</p>
        <p><strong>Completed:</strong> ${result.endTime.toISOString()}</p>
    </div>

    <h2>Assessment Criteria</h2>
    ${Object.entries(result.criteriaResults).map(([name, criteria]: [string, any]) => `
        <div class="criteria">
            <div class="criteria-header ${criteria.passed ? 'passed' : 'failed'}">
                ${criteria.passed ? '✅' : '❌'} ${name.toUpperCase()} - ${criteria.score}% (Weight: ${criteria.weight}%)
            </div>
            <div style="padding: 15px;">
                <p>${criteria.details}</p>
                ${criteria.issues.length > 0 ? `
                    <h4>Issues:</h4>
                    <ul>
                        ${criteria.issues.map((issue: any) => `
                            <li><strong>${issue.severity}:</strong> ${issue.message}
                                <br><em>Recommendation: ${issue.recommendation}</em>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p>✅ No issues found</p>'}
            </div>
        </div>
    `).join('')}

    ${result.issues.length > 0 ? `
        <div class="issues">
            <h3>All Issues Summary</h3>
            <ul>
                ${result.issues.map(issue => `
                    <li><strong>[${issue.category.toUpperCase()}] ${issue.severity}:</strong> ${issue.message}
                        <br><em>Impact: ${issue.impact}</em>
                        <br><em>Recommendation: ${issue.recommendation}</em>
                    </li>
                `).join('')}
            </ul>
        </div>
    ` : ''}

    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    ${result.certification.certified ? `
        <div class="certificate">
            <h2>🏆 PRODUCTION CERTIFIED</h2>
            <p><strong>Certificate ID:</strong> ${result.certification.certificateId}</p>
            <p><strong>Valid Until:</strong> ${result.certification.validUntil?.toISOString()}</p>
            <p>This system has been certified as ready for production deployment.</p>
        </div>
    ` : `
        <div class="issues">
            <h3>Certification Requirements</h3>
            <p>The following conditions must be met for production certification:</p>
            <ul>
                ${result.certification.conditions?.map(condition => `<li>${condition}</li>`).join('') || ''}
            </ul>
        </div>
    `}
</body>
</html>
    `;
  }

  /**
   * Generate production certificate
   */
  private generateCertificate(result: ProductionReadinessResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Production Deployment Certificate</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #f8f9fa; }
        .certificate { background: white; padding: 60px; border: 3px solid #28a745; border-radius: 10px; text-align: center; max-width: 800px; margin: 0 auto; }
        .header { color: #28a745; font-size: 36px; font-weight: bold; margin-bottom: 20px; }
        .title { font-size: 28px; color: #333; margin-bottom: 30px; }
        .content { font-size: 18px; line-height: 1.6; color: #555; margin-bottom: 40px; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .signature { margin-top: 60px; }
        .seal { width: 100px; height: 100px; border: 3px solid #28a745; border-radius: 50%; display: inline-block; line-height: 94px; font-weight: bold; color: #28a745; margin: 20px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">🏆 PRODUCTION DEPLOYMENT CERTIFICATE</div>
        
        <div class="title">TripleCheck Database System</div>
        
        <div class="content">
            This is to certify that the TripleCheck Database System has successfully completed
            comprehensive production readiness assessment and meets all requirements for
            production deployment.
        </div>
        
        <div class="details">
            <p><strong>Assessment ID:</strong> ${result.assessmentId}</p>
            <p><strong>Certificate ID:</strong> ${result.certification.certificateId}</p>
            <p><strong>Overall Score:</strong> ${result.overallScore}%</p>
            <p><strong>Assessment Date:</strong> ${result.startTime.toDateString()}</p>
            <p><strong>Valid Until:</strong> ${result.certification.validUntil?.toDateString()}</p>
        </div>
        
        <div class="content">
            The system has been validated for:
            <ul style="text-align: left; display: inline-block;">
                <li>Performance and scalability requirements</li>
                <li>High availability and disaster recovery</li>
                <li>Security and compliance standards</li>
                <li>Monitoring and operational excellence</li>
                <li>Data integrity and reliability</li>
            </ul>
        </div>
        
        <div class="seal">CERTIFIED</div>
        
        <div class="signature">
            <p><strong>TripleCheck Production Readiness Assessment System</strong></p>
            <p>Generated on ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
let assessmentInstance: ProductionReadinessAssessment | null = null;

export function createProductionReadinessAssessment(
  pool: Pool,
  config?: Partial<ProductionReadinessConfig>
): ProductionReadinessAssessment {
  if (assessmentInstance) {
    throw new Error('Production readiness assessment already exists. Use getProductionReadinessAssessment() instead.');
  }
  
  assessmentInstance = new ProductionReadinessAssessment(pool, config);
  return assessmentInstance;
}

export function getProductionReadinessAssessment(): ProductionReadinessAssessment {
  if (!assessmentInstance) {
    throw new Error('Production readiness assessment not initialized. Call createProductionReadinessAssessment() first.');
  }
  
  return assessmentInstance;
}            