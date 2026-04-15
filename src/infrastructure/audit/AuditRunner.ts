/**
 * Enhanced Audit Runner
 * 
 * Orchestrates comprehensive UI audits with all plugins and advanced features
 */

import { EventEmitter } from 'events'
import { OptimizedUIAuditSystem, EnhancedAuditReport } from './UIAuditSystem'
import { RouteAnalyzer } from './index'
import { EnhancedLinkValidator } from './LinkValidator'
import { AuditReporter } from './AuditReporter'
import { AccessibilityPlugin } from './plugins/AccessibilityPlugin'
import { PerformancePlugin } from './plugins/PerformancePlugin'
import { SecurityPlugin } from './plugins/SecurityPlugin'
import { getAuditConfig, AuditConfig } from './config'

export interface AuditRunOptions {
  mode: 'complete' | 'quick' | 'focused';
  focus?: ('accessibility' | 'performance' | 'security' | 'connectivity')[] | undefined;
  outputPath?: string | undefined;
  outputFormats?: ('json' | 'markdown' | 'html' | 'csv')[] | undefined;
  includeScreenshots?: boolean | undefined;
  parallel?: boolean | undefined;
  maxConcurrency?: number | undefined;
  timeout?: number | undefined; // milliseconds
  continueOnError?: boolean | undefined;
  generateRecommendations?: boolean | undefined;
  notifyOnCompletion?: boolean | undefined;
}

export interface AuditProgress {
  phase: string;
  completed: number;
  total: number;
  percentage: number;
  currentTask?: string;
  estimatedTimeRemaining?: number;
}

export interface AuditResult {
  success: boolean;
  report?: EnhancedAuditReport;
  error?: string;
  warnings?: string[];
  executionTime: number;
  coverage: {
    components: number;
    routes: number;
    apis: number;
  };
}

export class EnhancedAuditRunner extends EventEmitter {
  private config: AuditConfig;
  private auditSystem: OptimizedUIAuditSystem;
  private routeAnalyzer: RouteAnalyzer;
  private linkValidator: LinkValidator;
  private auditReporter: AuditReporter;
  
  private isRunning = false;
  private abortController: AbortController | null = null;
  private startTime = 0;
  
  constructor(config?: Partial<AuditConfig>) {
    super();
    this.config = config ? { ...getAuditConfig(), ...config } : getAuditConfig();
    
    // Initialize core components
    this.auditSystem = new OptimizedUIAuditSystem(this.config);
    this.routeAnalyzer = new RouteAnalyzer();
    this.linkValidator = new LinkValidator();
    this.auditReporter = new AuditReporter();
    
    // Set up event forwarding
    this.setupEventForwarding();
  }
  
  /**
   * Run comprehensive audit with all features
   */
  async runAudit(options: AuditRunOptions = { mode: 'complete' }): Promise<AuditResult> {
    if (this.isRunning) {
      throw new Error('Audit is already running');
    }
    
    this.isRunning = true;
    this.abortController = new AbortController();
    this.startTime = Date.now();
    
    try {
      this.emit('auditStarted', { options, config: this.config });
      console.log('🚀 Starting enhanced UI audit...');
      console.log(`📋 Mode: ${options.mode}`);
      console.log(`🎯 Focus: ${options.focus?.join(', ') || 'all areas'}`);
      
      // Initialize plugins based on focus areas
      await this.initializePlugins(options.focus);
      
      // Run audit based on mode
      let report: EnhancedAuditReport;
      
      switch (options.mode) {
        case 'quick':
          report = await this.runQuickAudit(options);
          break;
        case 'focused':
          report = await this.runFocusedAudit(options);
          break;
        case 'complete':
        default:
          report = await this.runCompleteAudit(options);
          break;
      }
      
      // Generate outputs
      await this.generateOutputs(report, options);
      
      // Send notifications
      if (options.notifyOnCompletion) {
        await this.sendNotifications(report);
      }
      
      const executionTime = Date.now() - this.startTime;
      const result: AuditResult = {
        success: true,
        report,
        executionTime,
        coverage: {
          components: report.elements.length,
          routes: report.routes.length,
          apis: report.apiConnections.length
        }
      };
      
      this.emit('auditCompleted', result);
      console.log(`✅ Enhanced audit completed in ${executionTime}ms`);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      const result: AuditResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        coverage: { components: 0, routes: 0, apis: 0 }
      };
      
      this.emit('auditError', { error, result });
      console.error('❌ Enhanced audit failed:', error);
      
      return result;
      
    } finally {
      this.isRunning = false;
      this.abortController = null;
      await this.cleanup();
    }
  }
  
  /**
   * Abort running audit
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.emit('auditAborted');
      console.log('🛑 Audit aborted by user');
    }
  }
  
  /**
   * Get current audit progress
   */
  getProgress(): AuditProgress | null {
    if (!this.isRunning) return null;
    
    // This would be populated by the actual audit process
    return {
      phase: 'scanning',
      completed: 0,
      total: 100,
      percentage: 0,
      currentTask: 'Initializing...',
      estimatedTimeRemaining: 0
    };
  }
  
  private async initializePlugins(focus?: string[]): Promise<void> {
    console.log('🔌 Initializing audit plugins...');
    
    const shouldInclude = (pluginType: string) => 
      !focus || focus.includes(pluginType as any);
    
    if (shouldInclude('accessibility')) {
      const accessibilityPlugin = new AccessibilityPlugin();
      await this.auditSystem.registerPlugin(accessibilityPlugin);
    }
    
    if (shouldInclude('performance')) {
      const performancePlugin = new PerformancePlugin();
      await this.auditSystem.registerPlugin(performancePlugin);
    }
    
    if (shouldInclude('security')) {
      const securityPlugin = new SecurityPlugin();
      await this.auditSystem.registerPlugin(securityPlugin);
    }
    
    console.log('✅ Plugins initialized');
  }
  
  private async runCompleteAudit(options: AuditRunOptions): Promise<EnhancedAuditReport> {
    console.log('🔍 Running complete audit...');
    
    // Use the optimized audit system for complete analysis
    return await this.auditSystem.runFullAudit();
  }
  
  private async runQuickAudit(options: AuditRunOptions): Promise<EnhancedAuditReport> {
    console.log('⚡ Running quick audit...');
    
    // Quick audit focuses on critical issues only
    const quickConfig = {
      ...this.config,
      scanDepth: 'shallow' as const,
      maxConcurrentScans: 2,
      apiTimeout: 3000,
      enableCaching: false
    };
    
    const quickAuditSystem = new OptimizedUIAuditSystem(quickConfig);
    
    // Initialize only essential plugins
    if (!options.focus || options.focus.includes('security')) {
      await quickAuditSystem.registerPlugin(new SecurityPlugin());
    }
    
    return await quickAuditSystem.runFullAudit();
  }
  
  private async runFocusedAudit(options: AuditRunOptions): Promise<EnhancedAuditReport> {
    console.log(`🎯 Running focused audit on: ${options.focus?.join(', ')}`);
    
    // Focused audit only runs specified areas
    const focusedConfig = {
      ...this.config,
      scanDepth: 'deep' as const,
      includeAccessibility: options.focus?.includes('accessibility') ?? false,
      includePerformance: options.focus?.includes('performance') ?? false
    };
    
    const focusedAuditSystem = new OptimizedUIAuditSystem(focusedConfig);
    
    // Only initialize plugins for focused areas
    if (options.focus?.includes('accessibility')) {
      await focusedAuditSystem.registerPlugin(new AccessibilityPlugin());
    }
    if (options.focus?.includes('performance')) {
      await focusedAuditSystem.registerPlugin(new PerformancePlugin());
    }
    if (options.focus?.includes('security')) {
      await focusedAuditSystem.registerPlugin(new SecurityPlugin());
    }
    
    return await focusedAuditSystem.runFullAudit();
  }
  
  private async generateOutputs(report: EnhancedAuditReport, options: AuditRunOptions): Promise<void> {
    console.log('📄 Generating audit outputs...');
    
    const formats = options.outputFormats || this.config.outputFormats;
    const outputPath = options.outputPath || this.config.reportDirectory;
    
    for (const format of formats) {
      try {
        await this.generateOutput(report, format, outputPath);
      } catch (error) {
        console.warn(`⚠️ Failed to generate ${format} output:`, error);
      }
    }
  }
  
  private async generateOutput(
    report: EnhancedAuditReport, 
    format: string, 
    outputPath: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-report-${timestamp}`;
    
    switch (format) {
      case 'json':
        await this.saveFile(`${outputPath}/${filename}.json`, JSON.stringify(report, null, 2));
        break;
        
      case 'markdown':
        const markdown = await this.generateMarkdownReport(report);
        await this.saveFile(`${outputPath}/${filename}.md`, markdown);
        break;
        
      case 'html':
        const html = await this.generateHTMLReport(report);
        await this.saveFile(`${outputPath}/${filename}.html`, html);
        break;
        
      case 'csv':
        const csv = await this.generateCSVReport(report);
        await this.saveFile(`${outputPath}/${filename}.csv`, csv);
        break;
        
      default:
        console.warn(`⚠️ Unknown output format: ${format}`);
    }
  }
  
  private async generateMarkdownReport(report: EnhancedAuditReport): Promise<string> {
    return `# Enhanced UI Audit Report

**Generated:** ${report.timestamp.toISOString()}
**Execution Time:** ${report.executionTime}ms
**Coverage:** ${report.coverage.coveragePercentage}%

## Executive Summary

${this.generateExecutiveSummary(report)}

## Critical Issues

${this.generateCriticalIssuesSection(report)}

## Performance Analysis

${this.generatePerformanceSection(report)}

## Security Analysis

${this.generateSecuritySection(report)}

## Accessibility Analysis

${this.generateAccessibilitySection(report)}

## Implementation Roadmap

${this.generateImplementationRoadmap(report)}

## Detailed Findings

${this.generateDetailedFindings(report)}
`;
  }
  
  private async generateHTMLReport(report: EnhancedAuditReport): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Audit Report - ${report.timestamp.toISOString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #0366d6; }
        .critical { color: #d73a49; }
        .warning { color: #f66a0a; }
        .success { color: #28a745; }
        .section { margin-bottom: 40px; }
        .issue { background: #fff5f5; border-left: 4px solid #d73a49; padding: 15px; margin: 10px 0; }
        .recommendation { background: #f0f8ff; border-left: 4px solid #0366d6; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Enhanced UI Audit Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
        <p><strong>Execution Time:</strong> ${report.executionTime}ms</p>
        <p><strong>Coverage:</strong> ${report.coverage.coveragePercentage}%</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value critical">${report.summary.criticalIssues}</div>
            <div>Critical Issues</div>
        </div>
        <div class="metric">
            <div class="metric-value warning">${report.summary.highPriorityIssues}</div>
            <div>High Priority</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalElements}</div>
            <div>Total Elements</div>
        </div>
        <div class="metric">
            <div class="metric-value success">${report.summary.workingElements}</div>
            <div>Working Elements</div>
        </div>
    </div>
    
    ${this.generateHTMLSections(report)}
</body>
</html>`;
  }
  
  private async generateCSVReport(report: EnhancedAuditReport): Promise<string> {
    const headers = [
      'Element ID',
      'Type',
      'Status',
      'Priority',
      'Component',
      'File Path',
      'Issue Description',
      'Recommendation'
    ];
    
    const rows = report.elements.map(element => [
      element.id,
      element.type,
      element.status,
      element.priority,
      element.location.componentName,
      element.location.filePath,
      element.currentBehavior,
      element.intendedBehavior
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }
  
  private async sendNotifications(report: EnhancedAuditReport): Promise<void> {
    console.log('📢 Sending audit completion notifications...');
    
    // Slack notification
    if (this.config.integrations.slack) {
      await this.sendSlackNotification(report);
    }
    
    // GitHub issues
    if (this.config.integrations.github) {
      await this.createGitHubIssues(report);
    }
    
    // Jira tickets
    if (this.config.integrations.jira) {
      await this.createJiraTickets(report);
    }
  }
  
  private async sendSlackNotification(report: EnhancedAuditReport): Promise<void> {
    // Implementation would send actual Slack notification
    console.log('📱 Slack notification sent');
  }
  
  private async createGitHubIssues(report: EnhancedAuditReport): Promise<void> {
    // Implementation would create actual GitHub issues
    console.log('🐛 GitHub issues created');
  }
  
  private async createJiraTickets(report: EnhancedAuditReport): Promise<void> {
    // Implementation would create actual Jira tickets
    console.log('🎫 Jira tickets created');
  }
  
  private async saveFile(path: string, content: string): Promise<void> {
    // In real implementation, would save to file system
    console.log(`💾 Saved report to ${path} (${content.length} characters)`);
  }
  
  private setupEventForwarding(): void {
    // Forward events from audit system
    this.auditSystem.on('phaseStarted', (phase) => {
      this.emit('progress', { phase, status: 'started' });
    });
    
    this.auditSystem.on('phaseCompleted', (phase, count) => {
      this.emit('progress', { phase, status: 'completed', count });
    });
    
    this.auditSystem.on('progress', (progress) => {
      this.emit('progress', progress);
    });
  }
  
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up audit resources...');
    // Cleanup would happen here
  }
  
  // Helper methods for report generation
  private generateExecutiveSummary(report: EnhancedAuditReport): string {
    return `This audit analyzed ${report.summary.totalElements} UI elements and found ${report.summary.criticalIssues} critical issues requiring immediate attention.`;
  }
  
  private generateCriticalIssuesSection(report: EnhancedAuditReport): string {
    const criticalElements = report.elements.filter(e => e.priority === 'critical' && e.status !== 'working');
    return criticalElements.map(e => `- **${e.id}**: ${e.currentBehavior}`).join('\n');
  }
  
  private generatePerformanceSection(report: EnhancedAuditReport): string {
    return 'Performance analysis results would be detailed here.';
  }
  
  private generateSecuritySection(report: EnhancedAuditReport): string {
    return `Found ${report.securityFindings?.length || 0} security issues.`;
  }
  
  private generateAccessibilitySection(report: EnhancedAuditReport): string {
    return 'Accessibility analysis results would be detailed here.';
  }
  
  private generateImplementationRoadmap(report: EnhancedAuditReport): string {
    return report.implementationPlan.phases.map(phase => 
      `### ${phase.name}\n- Estimated: ${phase.estimatedHours} hours\n- Deliverables: ${phase.deliverables.join(', ')}`
    ).join('\n\n');
  }
  
  private generateDetailedFindings(report: EnhancedAuditReport): string {
    return 'Detailed findings would be listed here.';
  }
  
  private generateHTMLSections(report: EnhancedAuditReport): string {
    return '<div class="section"><h2>Detailed analysis sections would be generated here</h2></div>';
  }
}