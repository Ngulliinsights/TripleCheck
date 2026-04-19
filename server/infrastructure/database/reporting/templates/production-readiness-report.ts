/**
 * Production Readiness Assessment Report Template
 * Generates comprehensive assessment results in HTML format
 */

interface CriteriaResult {
  passed: boolean;
  score: number;
  weight: number;
  details: string;
  issues: Array<{
    severity: string;
    message: string;
    recommendation: string;
  }>;
}

interface AssessmentIssue {
  category: string;
  severity: string;
  message: string;
  impact: string;
  recommendation: string;
}

interface CertificationResult {
  certified: boolean;
  certificateId?: string;
  validUntil?: Date;
  conditions?: string[];
}

interface ProductionReadinessResult {
  assessmentId: string;
  overallPassed: boolean;
  overallScore: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  criteriaResults: Record<string, CriteriaResult>;
  issues: AssessmentIssue[];
  recommendations: string[];
  certification: CertificationResult;
}

/**
 * Generate production readiness assessment HTML report
 */
export function generateProductionReadinessReport(result: ProductionReadinessResult): string {
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
</html>`;
}
