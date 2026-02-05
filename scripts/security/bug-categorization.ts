#!/usr/bin/env tsx

/**
 * Bug Categorization and Prioritization System
 * Analyzes ESLint, security scan, and audit results to categorize and prioritize bugs
 */

import { execSync } from 'child_process';
import fs from '..\cleanup-redundancies';
import path from '..\cleanup-redundancies';

export interface BugReport {
  id: string;
  type: 'security' | 'accessibility' | 'performance' | 'code-quality' | 'dependency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file?: string;
  line?: number;
  column?: number;
  rule?: string;
  fixable: boolean;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10, 10 being highest
}

export interface BugCategorizationReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: Record<BugReport['type'], number>;
  };
  bugs: BugReport[];
  recommendations: string[];
}

class BugCategorizer {
  private bugs: BugReport[] = [];
  private bugIdCounter = 1;

  /**
   * Run comprehensive bug analysis
   */
  async analyzeBugs(): Promise<BugCategorizationReport> {
    console.log('🔍 Running comprehensive bug analysis...');
    
    // Run ESLint analysis
    await this.analyzeESLintResults();
    
    // Run security analysis
    await this.analyzeSecurityResults();
    
    // Run dependency audit
    await this.analyzeDependencyAudit();
    
    // Calculate priorities
    this.calculatePriorities();
    
    // Generate report
    return this.generateReport();
  }

  /**
   * Analyze ESLint results for code quality and accessibility issues
   */
  private async analyzeESLintResults(): Promise<void> {
    try {
      console.log('📋 Analyzing ESLint results...');
      
      const eslintOutput = execSync('npx eslint . --format json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const eslintResults = JSON.parse(eslintOutput);
      
      for (const file of eslintResults) {
        for (const message of file.messages) {
          const bug: BugReport = {
            id: `eslint-${this.bugIdCounter++}`,
            type: this.categorizeESLintRule(message.ruleId),
            severity: this.mapESLintSeverity(message.severity),
            title: `${message.ruleId}: ${message.message}`,
            description: message.message,
            file: file.filePath,
            line: message.line,
            column: message.column,
            rule: message.ruleId,
            fixable: message.fix !== undefined,
            impact: this.getESLintImpact(message.ruleId),
            effort: this.getESLintEffort(message.ruleId),
            priority: 0 // Will be calculated later
          };
          
          this.bugs.push(bug);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze ESLint results:', (error as Error).message);
    }
  }

  /**
   * Analyze Snyk security scan results
   */
  private async analyzeSecurityResults(): Promise<void> {
    try {
      console.log('🔒 Analyzing security scan results...');
      
      const snykOutput = execSync('npx snyk test --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const snykResults = JSON.parse(snykOutput);
      
      if (snykResults.vulnerabilities) {
        for (const vuln of snykResults.vulnerabilities) {
          const bug: BugReport = {
            id: `security-${this.bugIdCounter++}`,
            type: 'security',
            severity: this.mapSnykSeverity(vuln.severity),
            title: `${vuln.title}`,
            description: `${vuln.description}\nCVE: ${vuln.identifiers?.CVE?.[0] || 'N/A'}`,
            file: vuln.from?.[0],
            rule: vuln.id,
            fixable: vuln.isUpgradable || vuln.isPatchable,
            impact: this.getSecurityImpact(vuln.severity),
            effort: vuln.isUpgradable ? 'low' : vuln.isPatchable ? 'medium' : 'high',
            priority: 0
          };
          
          this.bugs.push(bug);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze security results:', (error as Error).message);
    }
  }

  /**
   * Analyze npm audit results for dependency vulnerabilities
   */
  private async analyzeDependencyAudit(): Promise<void> {
    try {
      console.log('📦 Analyzing dependency audit results...');
      
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const auditResults = JSON.parse(auditOutput);
      
      if (auditResults.vulnerabilities) {
        for (const [name, vuln] of Object.entries(auditResults.vulnerabilities as any)) {
          const bug: BugReport = {
            id: `dependency-${this.bugIdCounter++}`,
            type: 'dependency',
            severity: this.mapAuditSeverity(vuln.severity),
            title: `Dependency vulnerability in ${name}`,
            description: `${vuln.via?.[0]?.title || 'Dependency vulnerability'}\nRange: ${vuln.range}`,
            file: name,
            rule: vuln.via?.[0]?.cwe?.[0],
            fixable: vuln.fixAvailable !== false,
            impact: this.getDependencyImpact(vuln.severity),
            effort: vuln.fixAvailable === true ? 'low' : 'medium',
            priority: 0
          };
          
          this.bugs.push(bug);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze dependency audit results:', (error as Error).message);
    }
  }

  /**
   * Calculate priority scores for all bugs
   */
  private calculatePriorities(): void {
    for (const bug of this.bugs) {
      let priority = 0;
      
      // Severity weight (40% of priority)
      const severityWeights = { critical: 10, high: 7, medium: 4, low: 1 };
      priority += severityWeights[bug.severity] * 0.4;
      
      // Type weight (30% of priority)
      const typeWeights = { 
        security: 10, 
        accessibility: 6, 
        performance: 5, 
        'code-quality': 3, 
        dependency: 8 
      };
      priority += typeWeights[bug.type] * 0.3;
      
      // Effort weight (20% of priority - easier fixes get higher priority)
      const effortWeights = { low: 3, medium: 2, high: 1 };
      priority += effortWeights[bug.effort] * 0.2;
      
      // Fixable bonus (10% of priority)
      if (bug.fixable) {
        priority += 1 * 0.1;
      }
      
      bug.priority = Math.round(priority * 10) / 10;
    }
    
    // Sort by priority (highest first)
    this.bugs.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate comprehensive bug report
   */
  private generateReport(): BugCategorizationReport {
    const summary = {
      total: this.bugs.length,
      critical: this.bugs.filter(b => b.severity === 'critical').length,
      high: this.bugs.filter(b => b.severity === 'high').length,
      medium: this.bugs.filter(b => b.severity === 'medium').length,
      low: this.bugs.filter(b => b.severity === 'low').length,
      byType: {
        security: this.bugs.filter(b => b.type === 'security').length,
        accessibility: this.bugs.filter(b => b.type === 'accessibility').length,
        performance: this.bugs.filter(b => b.type === 'performance').length,
        'code-quality': this.bugs.filter(b => b.type === 'code-quality').length,
        dependency: this.bugs.filter(b => b.type === 'dependency').length,
      }
    };

    const recommendations = this.generateRecommendations(summary);

    return {
      summary,
      bugs: this.bugs,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations based on bug analysis
   */
  private generateRecommendations(summary: BugCategorizationReport['summary']): string[] {
    const recommendations: string[] = [];

    if (summary.critical > 0) {
      recommendations.push(`🚨 URGENT: Address ${summary.critical} critical issues immediately`);
    }

    if (summary.byType.security > 0) {
      recommendations.push(`🔒 Security: Review and fix ${summary.byType.security} security vulnerabilities`);
    }

    if (summary.byType.dependency > 0) {
      recommendations.push(`📦 Dependencies: Update ${summary.byType.dependency} vulnerable dependencies`);
    }

    if (summary.byType.accessibility > 0) {
      recommendations.push(`♿ Accessibility: Improve ${summary.byType.accessibility} accessibility issues`);
    }

    if (summary.byType.performance > 0) {
      recommendations.push(`⚡ Performance: Optimize ${summary.byType.performance} performance issues`);
    }

    if (summary.total > 50) {
      recommendations.push('📈 Consider implementing automated fixing for low-effort issues');
    }

    const fixableCount = this.bugs.filter(b => b.fixable).length;
    if (fixableCount > 0) {
      recommendations.push(`🔧 ${fixableCount} issues can be automatically fixed`);
    }

    return recommendations;
  }

  // Helper methods for categorization
  private categorizeESLintRule(ruleId: string): BugReport['type'] {
    if (!ruleId) return 'code-quality';
    
    if (ruleId.startsWith('security/') || ruleId.includes('security')) {
      return 'security';
    }
    if (ruleId.startsWith('jsx-a11y/') || ruleId.includes('a11y')) {
      return 'accessibility';
    }
    if (ruleId.includes('performance') || ruleId.includes('optimize')) {
      return 'performance';
    }
    return 'code-quality';
  }

  private mapESLintSeverity(severity: number): BugReport['severity'] {
    return severity === 2 ? 'high' : 'medium';
  }

  private mapSnykSeverity(severity: string): BugReport['severity'] {
    const mapping: Record<string, BugReport['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[severity] || 'medium';
  }

  private mapAuditSeverity(severity: string): BugReport['severity'] {
    const mapping: Record<string, BugReport['severity']> = {
      critical: 'critical',
      high: 'high',
      moderate: 'medium',
      low: 'low'
    };
    return mapping[severity] || 'medium';
  }

  private getESLintImpact(ruleId: string): string {
    if (!ruleId) return 'Code quality impact';
    
    if (ruleId.startsWith('security/')) {
      return 'Potential security vulnerability';
    }
    if (ruleId.startsWith('jsx-a11y/')) {
      return 'Accessibility barrier for users';
    }
    if (ruleId.includes('performance')) {
      return 'Performance degradation';
    }
    return 'Code maintainability impact';
  }

  private getESLintEffort(ruleId: string): BugReport['effort'] {
    if (!ruleId) return 'medium';
    
    const lowEffortRules = [
      'prefer-const', 'no-var', 'prefer-template', 'no-console'
    ];
    const highEffortRules = [
      'sonarjs/cognitive-complexity', 'jsx-a11y/click-events-have-key-events'
    ];
    
    if (lowEffortRules.some(rule => ruleId.includes(rule))) {
      return 'low';
    }
    if (highEffortRules.some(rule => ruleId.includes(rule))) {
      return 'high';
    }
    return 'medium';
  }

  private getSecurityImpact(severity: string): string {
    const impacts: Record<string, string> = {
      critical: 'Critical security vulnerability - immediate exploitation possible',
      high: 'High security risk - exploitation likely',
      medium: 'Medium security risk - exploitation possible under certain conditions',
      low: 'Low security risk - limited exploitation potential'
    };
    return impacts[severity] || 'Security vulnerability';
  }

  private getDependencyImpact(severity: string): string {
    const impacts: Record<string, string> = {
      critical: 'Critical dependency vulnerability - update immediately',
      high: 'High-risk dependency - update as soon as possible',
      moderate: 'Moderate dependency risk - plan update',
      low: 'Low-risk dependency - update when convenient'
    };
    return impacts[severity] || 'Dependency vulnerability';
  }
}

/**
 * Main execution function
 */
async function main() {
  const categorizer = new BugCategorizer();
  
  try {
    const report = await categorizer.analyzeBugs();
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'reports', 'bug-analysis.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n📊 Bug Analysis Summary:');
    console.log(`Total bugs found: ${report.summary.total}`);
    console.log(`Critical: ${report.summary.critical}`);
    console.log(`High: ${report.summary.high}`);
    console.log(`Medium: ${report.summary.medium}`);
    console.log(`Low: ${report.summary.low}`);
    
    console.log('\n📋 By Type:');
    Object.entries(report.summary.byType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`${type}: ${count}`);
      }
    });
    
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    // Display top 10 priority bugs
    console.log('\n🔥 Top 10 Priority Bugs:');
    report.bugs.slice(0, 10).forEach((bug, index) => {
      console.log(`${index + 1}. [${bug.severity.toUpperCase()}] ${bug.title}`);
      console.log(`   Priority: ${bug.priority} | Type: ${bug.type} | Fixable: ${bug.fixable ? 'Yes' : 'No'}`);
      if (bug.file) {
        console.log(`   File: ${bug.file}${bug.line ? `:${bug.line}` : ''}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error during bug analysis:', error);
    process.exit(1);
  }
}

// Run if called directly
main();

export { BugCategorizer };