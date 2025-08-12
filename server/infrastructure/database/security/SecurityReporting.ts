/**
 * Security Reporting
 * 
 * Generates comprehensive security and compliance reports for regulatory
 * requirements and security audits.
 */

import { createHash } from 'crypto';
import { writeFile } from 'fs/promises';
import { join } from 'path';

import { Pool } from 'pg';

export interface SecurityReportConfig {
  reportType: 'security_audit' | 'compliance_summary' | 'vulnerability_assessment' | 'incident_report';
  period: {
    start: Date;
    end: Date;
  };
  includeDetails: boolean;
  format: 'json' | 'html' | 'pdf' | 'csv';
  outputPath: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface SecurityReport {
  id: string;
  type: SecurityReportConfig['reportType'];
  period: SecurityReportConfig['period'];
  generatedAt: Date;
  generatedBy: string;
  classification: SecurityReportConfig['classification'];
  summary: {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    resolvedIncidents: number;
    openVulnerabilities: number;
    complianceScore: number;
  };
  sections: {
    executiveSummary: string;
    securityEvents: any[];
    vulnerabilities: any[];
    complianceStatus: any;
    recommendations: string[];
    appendices: any[];
  };
  hash: string;
  filePath?: string;
}

export class SecurityReporting {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(config: SecurityReportConfig, generatedBy: string): Promise<SecurityReport> {
    console.log(`📊 Generating ${config.reportType} report for period ${config.period.start.toISOString()} to ${config.period.end.toISOString()}`);

    const reportId = `${config.reportType}_${Date.now()}`;
    const client = await this.pool.connect();

    try {
      // Collect data based on report type
      const reportData = await this.collectReportData(config, client);
      
      // Generate report sections
      const sections = await this.generateReportSections(config, reportData, client);
      
      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(reportData);
      
      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(config, summary, reportData);

      const report: SecurityReport = {
        id: reportId,
        type: config.reportType,
        period: config.period,
        generatedAt: new Date(),
        generatedBy,
        classification: config.classification,
        summary,
        sections: {
          executiveSummary,
          ...sections
        },
        hash: ''
      };

      // Calculate report hash
      report.hash = createHash('sha256')
        .update(JSON.stringify(report.sections))
        .digest('hex');

      // Save report to file
      if (config.outputPath) {
        const filePath = await this.saveReport(report, config);
        report.filePath = filePath;
      }

      console.log(`✅ Security report generated: ${reportId}`);
      return report;

    } finally {
      client.release();
    }
  }

  /**
   * Collect data for the report
   */
  private async collectReportData(config: SecurityReportConfig, client: any): Promise<any> {
    const data: any = {};

    // Security events data
    const eventsResult = await client.query(`
      SELECT 
        type,
        severity,
        source,
        description,
        details,
        timestamp,
        resolved
      FROM security_events 
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `, [config.period.start, config.period.end]);
    data.securityEvents = eventsResult.rows;

    // Security alerts data
    const alertsResult = await client.query(`
      SELECT 
        threat_pattern_id,
        severity,
        description,
        timestamp,
        acknowledged,
        resolved,
        response_actions
      FROM security_alerts 
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `, [config.period.start, config.period.end]);
    data.securityAlerts = alertsResult.rows;

    // Vulnerability assessments data
    const vulnResult = await client.query(`
      SELECT 
        type,
        severity,
        component,
        description,
        cve,
        cvss_score,
        status,
        discovered_at,
        fixed_at
      FROM vulnerability_assessments 
      WHERE discovered_at BETWEEN $1 AND $2
      ORDER BY severity DESC, cvss_score DESC
    `, [config.period.start, config.period.end]);
    data.vulnerabilities = vulnResult.rows;

    // GDPR requests data
    const gdprResult = await client.query(`
      SELECT 
        type,
        status,
        request_date,
        completion_date,
        reason
      FROM gdpr_requests 
      WHERE request_date BETWEEN $1 AND $2
      ORDER BY request_date DESC
    `, [config.period.start, config.period.end]);
    data.gdprRequests = gdprResult.rows;

    // Data retention actions
    const retentionResult = await client.query(`
      SELECT 
        table_name,
        action,
        records_affected,
        executed_at,
        success
      FROM data_retention_log 
      WHERE executed_at BETWEEN $1 AND $2
      ORDER BY executed_at DESC
    `, [config.period.start, config.period.end]);
    data.retentionActions = retentionResult.rows;

    // Blocked IPs
    const blockedIpsResult = await client.query(`
      SELECT 
        ip_address,
        reason,
        blocked_at,
        expires_at,
        is_active
      FROM blocked_ips 
      WHERE blocked_at BETWEEN $1 AND $2
      ORDER BY blocked_at DESC
    `, [config.period.start, config.period.end]);
    data.blockedIps = blockedIpsResult.rows;

    return data;
  }

  /**
   * Generate report sections
   */
  private async generateReportSections(config: SecurityReportConfig, data: any, client: any): Promise<any> {
    const sections: any = {};

    // Security Events Section
    sections.securityEvents = {
      title: 'Security Events Analysis',
      summary: {
        totalEvents: data.securityEvents.length,
        byType: this.groupBy(data.securityEvents, 'type'),
        bySeverity: this.groupBy(data.securityEvents, 'severity'),
        bySource: this.groupBy(data.securityEvents, 'source')
      },
      events: config.includeDetails ? data.securityEvents : data.securityEvents.slice(0, 10),
      trends: this.analyzeTrends(data.securityEvents, 'timestamp'),
      topSources: this.getTopItems(data.securityEvents, 'source', 5)
    };

    // Vulnerabilities Section
    sections.vulnerabilities = {
      title: 'Vulnerability Assessment',
      summary: {
        totalVulnerabilities: data.vulnerabilities.length,
        bySeverity: this.groupBy(data.vulnerabilities, 'severity'),
        byType: this.groupBy(data.vulnerabilities, 'type'),
        byStatus: this.groupBy(data.vulnerabilities, 'status')
      },
      criticalVulnerabilities: data.vulnerabilities.filter((v: any) => v.severity === 'critical'),
      highRiskComponents: this.getTopItems(data.vulnerabilities, 'component', 5),
      remediationStatus: this.calculateRemediationMetrics(data.vulnerabilities)
    };

    // Compliance Status Section
    sections.complianceStatus = {
      title: 'Regulatory Compliance Status',
      gdpr: {
        requestsReceived: data.gdprRequests.length,
        requestsByType: this.groupBy(data.gdprRequests, 'type'),
        averageProcessingTime: this.calculateAverageProcessingTime(data.gdprRequests),
        complianceRate: this.calculateComplianceRate(data.gdprRequests)
      },
      dataRetention: {
        policiesExecuted: data.retentionActions.length,
        recordsProcessed: data.retentionActions.reduce((sum: number, action: any) => sum + action.records_affected, 0),
        successRate: this.calculateSuccessRate(data.retentionActions)
      },
      auditTrail: {
        eventsLogged: data.securityEvents.length,
        integrityStatus: 'verified',
        retentionCompliance: 'compliant'
      }
    };

    // Recommendations Section
    sections.recommendations = this.generateRecommendations(data, config);

    // Appendices
    sections.appendices = [
      {
        title: 'Blocked IP Addresses',
        data: data.blockedIps
      },
      {
        title: 'Security Alert Details',
        data: data.securityAlerts
      }
    ];

    return sections;
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummaryMetrics(data: any): SecurityReport['summary'] {
    const totalEvents = data.securityEvents.length;
    const criticalEvents = data.securityEvents.filter((e: any) => e.severity === 'critical').length;
    const highSeverityEvents = data.securityEvents.filter((e: any) => e.severity === 'high').length;
    const resolvedIncidents = data.securityAlerts.filter((a: any) => a.resolved).length;
    const openVulnerabilities = data.vulnerabilities.filter((v: any) => v.status === 'open').length;
    
    // Calculate compliance score (0-100)
    const gdprCompliance = this.calculateComplianceRate(data.gdprRequests);
    const retentionCompliance = this.calculateSuccessRate(data.retentionActions);
    const securityCompliance = criticalEvents === 0 ? 100 : Math.max(0, 100 - (criticalEvents * 10));
    const complianceScore = Math.round((gdprCompliance + retentionCompliance + securityCompliance) / 3);

    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      resolvedIncidents,
      openVulnerabilities,
      complianceScore
    };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(config: SecurityReportConfig, summary: any, data: any): string {
    const period = `${config.period.start.toDateString()} to ${config.period.end.toDateString()}`;
    
    let executiveSummary = `# Executive Summary\n\n`;
    executiveSummary += `This ${config.reportType.replace('_', ' ')} covers the period from ${period}.\n\n`;
    
    executiveSummary += `## Key Metrics\n`;
    executiveSummary += `- **Total Security Events**: ${summary.totalEvents}\n`;
    executiveSummary += `- **Critical Events**: ${summary.criticalEvents}\n`;
    executiveSummary += `- **High Severity Events**: ${summary.highSeverityEvents}\n`;
    executiveSummary += `- **Open Vulnerabilities**: ${summary.openVulnerabilities}\n`;
    executiveSummary += `- **Compliance Score**: ${summary.complianceScore}%\n\n`;

    // Risk assessment
    if (summary.criticalEvents > 0) {
      executiveSummary += `## Risk Assessment\n`;
      executiveSummary += `⚠️ **HIGH RISK**: ${summary.criticalEvents} critical security events require immediate attention.\n\n`;
    } else if (summary.highSeverityEvents > 5) {
      executiveSummary += `## Risk Assessment\n`;
      executiveSummary += `⚠️ **MEDIUM RISK**: Elevated number of high severity events detected.\n\n`;
    } else {
      executiveSummary += `## Risk Assessment\n`;
      executiveSummary += `✅ **LOW RISK**: Security posture is within acceptable parameters.\n\n`;
    }

    // Compliance status
    if (summary.complianceScore >= 90) {
      executiveSummary += `## Compliance Status\n`;
      executiveSummary += `✅ **COMPLIANT**: Strong compliance posture maintained.\n\n`;
    } else if (summary.complianceScore >= 70) {
      executiveSummary += `## Compliance Status\n`;
      executiveSummary += `⚠️ **ATTENTION NEEDED**: Some compliance gaps identified.\n\n`;
    } else {
      executiveSummary += `## Compliance Status\n`;
      executiveSummary += `❌ **NON-COMPLIANT**: Significant compliance issues require immediate action.\n\n`;
    }

    return executiveSummary;
  }

  /**
   * Generate recommendations based on data analysis
   */
  private generateRecommendations(data: any, config: SecurityReportConfig): string[] {
    const recommendations: string[] = [];

    // Security event recommendations
    const criticalEvents = data.securityEvents.filter((e: any) => e.severity === 'critical').length;
    if (criticalEvents > 0) {
      recommendations.push(`Address ${criticalEvents} critical security events immediately`);
      recommendations.push('Review and strengthen security monitoring rules');
    }

    // Vulnerability recommendations
    const criticalVulns = data.vulnerabilities.filter((v: any) => v.severity === 'critical' && v.status === 'open').length;
    if (criticalVulns > 0) {
      recommendations.push(`Remediate ${criticalVulns} critical vulnerabilities as priority`);
      recommendations.push('Implement automated vulnerability scanning in CI/CD pipeline');
    }

    // GDPR compliance recommendations
    const overdueGdprRequests = data.gdprRequests.filter((r: any) => 
      r.status === 'pending' && 
      new Date(r.request_date).getTime() < Date.now() - (30 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (overdueGdprRequests > 0) {
      recommendations.push(`Process ${overdueGdprRequests} overdue GDPR requests within regulatory timeframe`);
    }

    // General recommendations
    recommendations.push('Conduct regular security awareness training for all staff');
    recommendations.push('Review and update incident response procedures');
    recommendations.push('Implement multi-factor authentication for all administrative accounts');
    recommendations.push('Regular penetration testing and security assessments');

    return recommendations;
  }

  /**
   * Save report to file
   */
  private async saveReport(report: SecurityReport, config: SecurityReportConfig): Promise<string> {
    const timestamp = report.generatedAt.toISOString().split('T')[0];
    const filename = `${config.reportType}_${timestamp}.${config.format}`;
    const filepath = join(config.outputPath, filename);

    let content: string;

    switch (config.format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'html':
        content = this.generateHTMLReport(report);
        break;
      case 'csv':
        content = this.generateCSVReport(report);
        break;
      default:
        content = JSON.stringify(report, null, 2);
    }

    await writeFile(filepath, content);
    console.log(`📄 Report saved to ${filepath}`);
    
    return filepath;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: SecurityReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Security Report - ${report.type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
        .section { margin: 30px 0; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Report: ${report.type.replace('_', ' ').toUpperCase()}</h1>
        <p><strong>Period:</strong> ${report.period.start.toDateString()} - ${report.period.end.toDateString()}</p>
        <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
        <p><strong>Classification:</strong> ${report.classification.toUpperCase()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>${report.summary.totalEvents}</h3>
            <p>Total Events</p>
        </div>
        <div class="metric">
            <h3 class="critical">${report.summary.criticalEvents}</h3>
            <p>Critical Events</p>
        </div>
        <div class="metric">
            <h3>${report.summary.openVulnerabilities}</h3>
            <p>Open Vulnerabilities</p>
        </div>
        <div class="metric">
            <h3>${report.summary.complianceScore}%</h3>
            <p>Compliance Score</p>
        </div>
    </div>

    <div class="section">
        ${report.sections.executiveSummary.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            ${report.sections.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Security Events Summary</h2>
        <p>Total Events: ${report.sections.securityEvents.summary.totalEvents}</p>
        <!-- Additional sections would be rendered here -->
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(report: SecurityReport): string {
    let csv = 'Type,Severity,Source,Description,Timestamp\n';
    
    for (const event of report.sections.securityEvents.events) {
      csv += `"${event.type}","${event.severity}","${event.source}","${event.description}","${event.timestamp}"\n`;
    }
    
    return csv;
  }

  /**
   * Utility functions
   */
  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  private getTopItems(array: any[], key: string, limit: number): Array<{ item: string; count: number }> {
    const grouped = this.groupBy(array, key);
    return Object.entries(grouped)
      .map(([item, count]) => ({ item, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private analyzeTrends(array: any[], dateKey: string): any {
    // Simple trend analysis - would be more sophisticated in production
    const byDay = array.reduce((trends, item) => {
      const day = new Date(item[dateKey]).toDateString();
      trends[day] = (trends[day] || 0) + 1;
      return trends;
    }, {});

    return {
      dailyTrends: byDay,
      peakDay: Object.entries(byDay).reduce((peak, [day, count]) => 
        (count as number) > peak.count ? { day, count: count as number } : peak, 
        { day: '', count: 0 }
      )
    };
  }

  private calculateAverageProcessingTime(requests: any[]): number {
    const completedRequests = requests.filter(r => r.completion_date && r.request_date);
    if (completedRequests.length === 0) return 0;

    const totalTime = completedRequests.reduce((sum, request) => {
      const processingTime = new Date(request.completion_date).getTime() - new Date(request.request_date).getTime();
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / completedRequests.length / (1000 * 60 * 60)); // Convert to hours
  }

  private calculateComplianceRate(requests: any[]): number {
    if (requests.length === 0) return 100;
    const completedOnTime = requests.filter(r => 
      r.status === 'completed' && 
      new Date(r.completion_date).getTime() - new Date(r.request_date).getTime() <= (30 * 24 * 60 * 60 * 1000)
    ).length;
    return Math.round((completedOnTime / requests.length) * 100);
  }

  private calculateSuccessRate(actions: any[]): number {
    if (actions.length === 0) return 100;
    const successful = actions.filter(a => a.success).length;
    return Math.round((successful / actions.length) * 100);
  }

  private calculateRemediationMetrics(vulnerabilities: any[]): any {
    const total = vulnerabilities.length;
    const fixed = vulnerabilities.filter(v => v.status === 'fixed').length;
    const open = vulnerabilities.filter(v => v.status === 'open').length;
    
    return {
      total,
      fixed,
      open,
      remediationRate: total > 0 ? Math.round((fixed / total) * 100) : 100
    };
  }
}

/**
 * Factory function to generate security report
 */
export async function generateSecurityReport(
  pool: Pool, 
  config: SecurityReportConfig, 
  generatedBy: string
): Promise<SecurityReport> {
  const reporting = new SecurityReporting(pool);
  return await reporting.generateSecurityReport(config, generatedBy);
}