/**
 * UI Audit Report HTML Template
 * Generates comprehensive UI audit report in HTML format
 */

interface AuditReport {
  timestamp: Date;
  executionTime: number;
  coverage: {
    coveragePercentage: number;
  };
  summary: {
    criticalIssues: number;
    warnings: number;
    suggestions: number;
    passedChecks: number;
  };
}

export function generateUIAuditReport(report: AuditReport): string {
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
            <div class="metric-value warning">${report.summary.warnings}</div>
            <div>Warnings</div>
        </div>
        <div class="metric">
            <div class="metric-value success">${report.summary.passedChecks}</div>
            <div>Passed Checks</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.suggestions}</div>
            <div>Suggestions</div>
        </div>
    </div>
    
    <div class="section">
        <h2>Audit Details</h2>
        <p>This audit evaluated your UI components for accessibility, performance, and best practices compliance.</p>
    </div>
</body>
</html>`;
}
