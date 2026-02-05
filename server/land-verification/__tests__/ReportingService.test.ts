import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportingService } from '../ReportingService';
import type { ReportGenerationRequest, ExecutiveSummary } from '../ReportingService';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('ReportingService', () => {
  let reportingService: ReportingService;

  beforeEach(() => {
    reportingService = new ReportingService();
  });

  describe('Template Management', () => {
    it('initializes with default templates', () => {
      const templates = reportingService.getAvailableTemplates();
      
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.id)).toContain('comprehensive-buyer');
      expect(templates.map(t => t.id)).toContain('legal-documentation');
      expect(templates.map(t => t.id)).toContain('executive-summary');
    });

    it('returns specific template by ID', () => {
      const template = reportingService.getTemplate('comprehensive-buyer');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Comprehensive Buyer Report');
      expect(template?.audience).toBe('buyer');
      expect(template?.sections).toHaveLength(6);
    });

    it('returns undefined for non-existent template', () => {
      const template = reportingService.getTemplate('non-existent');
      
      expect(template).toBeUndefined();
    });

    it('templates have required sections in correct order', () => {
      const template = reportingService.getTemplate('comprehensive-buyer');
      
      expect(template?.sections).toBeDefined();
      const sections = template!.sections.sort((a, b) => a.order - b.order);
      
      expect(sections[0].id).toBe('executive-summary');
      expect(sections[0].required).toBe(true);
      expect(sections[1].id).toBe('property-overview');
      expect(sections[1].required).toBe(true);
    });
  });

  describe('Report Generation', () => {
    const mockRequest: ReportGenerationRequest = {
      sessionId: 'session-123',
      templateId: 'comprehensive-buyer',
      format: 'pdf',
      includeConfidential: false,
      customSections: ['executive-summary', 'property-overview'],
      audience: 'Property buyer'
    };

    it('generates report successfully with valid request', async () => {
      const report = await reportingService.generateReport(mockRequest);
      
      expect(report).toBeDefined();
      expect(report.sessionId).toBe(mockRequest.sessionId);
      expect(report.templateId).toBe(mockRequest.templateId);
      expect(report.format).toBe(mockRequest.format);
      expect(report.metadata.audience).toBe('buyer');
      expect(report.metadata.confidentialityLevel).toBe('restricted');
    });

    it('throws error for invalid template ID', async () => {
      const invalidRequest = {
        ...mockRequest,
        templateId: 'invalid-template'
      };

      await expect(reportingService.generateReport(invalidRequest))
        .rejects
        .toThrow('Report template not found: invalid-template');
    });

    it('generates HTML report with proper formatting', async () => {
      const htmlRequest = {
        ...mockRequest,
        format: 'html' as const
      };

      const report = await reportingService.generateReport(htmlRequest);
      
      expect(report.format).toBe('html');
      expect(report.content).toContain('<!DOCTYPE html>');
      expect(report.content).toContain('<title>Comprehensive Buyer Report</title>');
      expect(report.content).toContain('<body>');
    });

    it('generates JSON report with structured data', async () => {
      const jsonRequest = {
        ...mockRequest,
        format: 'json' as const
      };

      const report = await reportingService.generateReport(jsonRequest);
      
      expect(report.format).toBe('json');
      
      const parsedContent = JSON.parse(report.content as string);
      expect(parsedContent.template).toBe('comprehensive-buyer');
      expect(parsedContent.generatedAt).toBeDefined();
      expect(parsedContent.sections).toBeDefined();
    });

    it('includes confidential information when requested', async () => {
      const confidentialRequest = {
        ...mockRequest,
        includeConfidential: true
      };

      const report = await reportingService.generateReport(confidentialRequest);
      
      expect(report.metadata.confidentialityLevel).toBe('confidential');
    });

    it('respects custom sections selection', async () => {
      const customRequest = {
        ...mockRequest,
        customSections: ['executive-summary']
      };

      const report = await reportingService.generateReport(customRequest);
      
      // Content should only include selected sections
      expect(report.content).toContain('Executive Summary');
      // Should not contain other sections that weren't selected
      expect(report.content).not.toContain('Expert Findings');
    });
  });

  describe('Executive Summary Generation', () => {
    it('generates executive summary with all required fields', async () => {
      const summary = await reportingService.generateExecutiveSummary('session-123');
      
      expect(summary).toBeDefined();
      expect(summary.propertyId).toBeDefined();
      expect(summary.overallRiskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(summary.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallRiskScore).toBeLessThanOrEqual(100);
      expect(summary.keyFindings).toBeInstanceOf(Array);
      expect(summary.criticalIssues).toBeInstanceOf(Array);
      expect(summary.recommendations).toBeInstanceOf(Array);
      expect(summary.verificationCompleteness).toBeGreaterThanOrEqual(0);
      expect(summary.verificationCompleteness).toBeLessThanOrEqual(100);
      expect(summary.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(summary.confidenceLevel).toBeLessThanOrEqual(1);
      expect(summary.nextSteps).toBeInstanceOf(Array);
    });

    it('provides meaningful key findings', async () => {
      const summary = await reportingService.generateExecutiveSummary('session-123');
      
      expect(summary.keyFindings.length).toBeGreaterThan(0);
      expect(summary.keyFindings[0]).toContain('Property ownership verified');
    });

    it('identifies critical issues when present', async () => {
      const summary = await reportingService.generateExecutiveSummary('session-123');
      
      expect(summary.criticalIssues).toBeInstanceOf(Array);
      // Critical issues array can be empty if no issues are found
      if (summary.criticalIssues.length > 0) {
        expect(summary.criticalIssues[0]).toContain('government designation');
      }
    });

    it('provides actionable recommendations', async () => {
      const summary = await reportingService.generateExecutiveSummary('session-123');
      
      expect(summary.recommendations.length).toBeGreaterThan(0);
      expect(summary.recommendations[0]).toContain('boundary survey');
    });

    it('generates logical next steps', async () => {
      const summary = await reportingService.generateExecutiveSummary('session-123');
      
      expect(summary.nextSteps.length).toBeGreaterThan(0);
      expect(summary.nextSteps[0]).toContain('verification');
    });
  });

  describe('Expert Reports Compilation', () => {
    it('compiles expert reports into unified document', async () => {
      const compiledReport = await reportingService.compileExpertReports('session-123');
      
      expect(compiledReport).toBeDefined();
      expect(compiledReport).toContain('# Expert Reports Compilation');
    });

    it('handles empty expert assignments gracefully', async () => {
      const compiledReport = await reportingService.compileExpertReports('session-empty');
      
      expect(compiledReport).toContain('No expert reports available');
    });

    it('includes expert consensus analysis', async () => {
      const compiledReport = await reportingService.compileExpertReports('session-123');
      
      expect(compiledReport).toContain('Expert Consensus Analysis');
      expect(compiledReport).toContain('Areas of agreement');
      expect(compiledReport).toContain('Areas of disagreement');
      expect(compiledReport).toContain('Recommended resolution');
    });
  });

  describe('Section Content Generation', () => {
    describe('Summary Sections', () => {
      it('generates risk assessment summary with proper metrics', () => {
        const mockData = {
          riskAssessment: {
            riskLevel: 'medium',
            overallRiskScore: 65,
            confidence: 0.8
          }
        };

        const content = (reportingService as any).generateRiskSummary(
          { title: 'Risk Summary', dataSource: 'risk-assessment' },
          mockData,
          { includeConfidential: false }
        );

        expect(content).toContain('Risk Summary');
        expect(content).toContain('MEDIUM');
        expect(content).toContain('65/100');
        expect(content).toContain('80%');
      });

      it('generates metrics summary with verification progress', () => {
        const mockData = {
          riskAssessment: { overallRiskScore: 50, riskLevel: 'medium' },
          expertAssignments: [{ id: '1' }, { id: '2' }]
        };

        const content = (reportingService as any).generateMetricsSummary(
          { title: 'Metrics', dataSource: 'metrics' },
          mockData,
          { includeConfidential: false }
        );

        expect(content).toContain('Verification Metrics');
        expect(content).toContain('50/100');
        expect(content).toContain('Medium');
        expect(content).toContain('2');
      });
    });

    describe('Legal Sections', () => {
      it('generates legal analysis with proper legal formatting', () => {
        const content = (reportingService as any).generateLegalAnalysis(
          { title: 'Legal Analysis', dataSource: 'legal-analysis' },
          {},
          { includeConfidential: false }
        );

        expect(content).toContain('Legal Framework');
        expect(content).toContain('Land Registration Act, 2012');
        expect(content).toContain('Title Analysis');
        expect(content).toContain('Compliance Review');
        expect(content).toContain('Legal Risks');
      });

      it('generates legal risk assessment with risk categories', () => {
        const content = (reportingService as any).generateLegalRiskAssessment(
          { title: 'Legal Risk Assessment', dataSource: 'legal-risks' },
          {},
          { includeConfidential: false }
        );

        expect(content).toContain('Risk Categories');
        expect(content).toContain('Title Risks');
        expect(content).toContain('Encumbrance Risks');
        expect(content).toContain('Regulatory Risks');
        expect(content).toContain('Litigation Risks');
        expect(content).toContain('Overall Legal Risk');
      });
    });

    describe('Table Sections', () => {
      it('generates ownership chain table with proper structure', () => {
        const content = (reportingService as any).generateOwnershipChain(
          { title: 'Ownership Chain', dataSource: 'ownership-history' },
          {},
          { includeConfidential: false }
        );

        expect(content).toContain('Transfer Date');
        expect(content).toContain('From Owner');
        expect(content).toContain('To Owner');
        expect(content).toContain('Transfer Type');
        expect(content).toContain('Chain Analysis');
        expect(content).toContain('Complete Chain');
      });

      it('generates legal instruments table with encumbrances', () => {
        const content = (reportingService as any).generateLegalInstruments(
          { title: 'Legal Instruments', dataSource: 'legal-instruments' },
          {},
          { includeConfidential: false }
        );

        expect(content).toContain('Instrument Type');
        expect(content).toContain('Registration Date');
        expect(content).toContain('Beneficiary');
        expect(content).toContain('Mortgage');
        expect(content).toContain('Instrument Analysis');
      });
    });

    describe('Chart Sections', () => {
      it('generates risk visualization with ASCII charts', () => {
        const mockData = {
          riskAssessment: {
            riskLevel: 'medium',
            overallRiskScore: 50,
            confidence: 0.8
          }
        };

        const content = (reportingService as any).generateRiskVisualization(
          { title: 'Risk Visualization', dataSource: 'risk-factors' },
          mockData,
          { includeConfidential: false }
        );

        expect(content).toContain('Risk Score Distribution');
        expect(content).toContain('50/100');
        expect(content).toContain('MEDIUM');
        expect(content).toContain('Ownership:');
        expect(content).toContain('Legal:');
        expect(content).toContain('Physical:');
        expect(content).toContain('Government:');
        expect(content).toContain('Community:');
      });

      it('generates risk overview with dashboard format', () => {
        const mockData = {
          riskAssessment: {
            overallRiskScore: 65,
            confidence: 0.85
          },
          expertAssignments: [{ id: '1' }]
        };

        const content = (reportingService as any).generateRiskOverview(
          { title: 'Risk Overview', dataSource: 'risk-summary' },
          mockData,
          { includeConfidential: false }
        );

        expect(content).toContain('RISK OVERVIEW');
        expect(content).toContain('MEDIUM (65/100)');
        expect(content).toContain('85%');
        expect(content).toContain('Key Risk Indicators');
        expect(content).toContain('Title Clarity');
        expect(content).toContain('Legal Disputes');
      });
    });

    describe('Recommendations Section', () => {
      it('generates comprehensive recommendations with priorities', () => {
        const mockData = {
          riskAssessment: { riskLevel: 'medium' }
        };

        const content = (reportingService as any).generateRecommendationsSection(
          { title: 'Recommendations', dataSource: 'recommendations' },
          mockData,
          { includeConfidential: false }
        );

        expect(content).toContain('Recommended Actions');
        expect(content).toContain('Risk Mitigation Strategies');
        expect(content).toContain('Next Steps');
        expect(content).toContain('boundary survey');
        expect(content).toContain('legal counsel');
      });

      it('includes critical actions when critical issues exist', () => {
        const mockData = {
          riskAssessment: { riskLevel: 'high' }
        };

        const content = (reportingService as any).generateRecommendationsSection(
          { title: 'Recommendations', dataSource: 'recommendations' },
          mockData,
          { includeConfidential: false }
        );

        expect(content).toContain('Critical Actions Required');
        expect(content).toContain('Priority: High');
        expect(content).toContain('Timeline: Immediate');
      });
    });
  });

  describe('HTML Template Generation', () => {
    it('wraps content in proper HTML structure', () => {
      const template = reportingService.getTemplate('comprehensive-buyer')!;
      const content = '## Test Content\n\nThis is test content.';
      
      const htmlContent = (reportingService as any).wrapInHtmlTemplate(content, template);
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<title>Comprehensive Buyer Report</title>');
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('<body>');
      expect(htmlContent).toContain('Test Content');
      expect(htmlContent).toContain('</body>');
      expect(htmlContent).toContain('</html>');
    });

    it('includes proper CSS styling for reports', () => {
      const template = reportingService.getTemplate('legal-documentation')!;
      const content = 'Test content';
      
      const htmlContent = (reportingService as any).wrapInHtmlTemplate(content, template);
      
      expect(htmlContent).toContain('font-family: Arial, sans-serif');
      expect(htmlContent).toContain('color: #2563eb');
      expect(htmlContent).toContain('.risk-high');
      expect(htmlContent).toContain('.risk-medium');
      expect(htmlContent).toContain('.risk-low');
      expect(htmlContent).toContain('border-collapse: collapse');
    });
  });

  describe('Data Analysis Methods', () => {
    it('extracts meaningful key findings', () => {
      const mockData = {};
      const findings = (reportingService as any).extractKeyFindings(mockData);
      
      expect(findings).toBeInstanceOf(Array);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0]).toContain('Property ownership verified');
    });

    it('identifies critical issues appropriately', () => {
      const mockData = {};
      const issues = (reportingService as any).extractCriticalIssues(mockData);
      
      expect(issues).toBeInstanceOf(Array);
      if (issues.length > 0) {
        expect(issues[0]).toContain('government designation');
      }
    });

    it('generates actionable recommendations', () => {
      const mockData = {};
      const recommendations = (reportingService as any).extractTopRecommendations(mockData);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('boundary survey');
    });

    it('calculates verification completeness percentage', () => {
      const mockData = {};
      const completeness = (reportingService as any).calculateCompleteness(mockData);
      
      expect(completeness).toBeGreaterThanOrEqual(0);
      expect(completeness).toBeLessThanOrEqual(100);
      expect(typeof completeness).toBe('number');
    });

    it('generates logical next steps', () => {
      const mockData = {};
      const nextSteps = (reportingService as any).generateNextSteps(mockData);
      
      expect(nextSteps).toBeInstanceOf(Array);
      expect(nextSteps.length).toBeGreaterThan(0);
      expect(nextSteps[0]).toContain('verification');
    });
  });

  describe('Expert Report Formatting', () => {
    it('formats individual expert reports correctly', () => {
      const mockAssignment = {
        expertType: 'surveyor',
        expertId: 'expert-123',
        completedAt: new Date('2024-01-15'),
        status: 'completed'
      };

      const formatted = (reportingService as any).formatExpertReport(mockAssignment);
      
      expect(formatted).toContain('## Expert Report: surveyor');
      expect(formatted).toContain('**Expert:** expert-123');
      expect(formatted).toContain('**Status:** completed');
      expect(formatted).toContain('### Findings');
      expect(formatted).toContain('### Recommendations');
    });

    it('analyzes expert consensus properly', () => {
      const mockAssignments = [
        { expertType: 'surveyor', status: 'completed' },
        { expertType: 'lawyer', status: 'completed' }
      ];

      const analysis = (reportingService as any).analyzeExpertConsensus(mockAssignments);
      
      expect(analysis).toContain('## Expert Consensus Analysis');
      expect(analysis).toContain('Based on 2 expert reports');
      expect(analysis).toContain('Areas of agreement');
      expect(analysis).toContain('Areas of disagreement');
      expect(analysis).toContain('Recommended resolution');
    });
  });

  describe('Error Handling', () => {
    it('handles missing data gracefully', async () => {
      const request: ReportGenerationRequest = {
        sessionId: 'non-existent-session',
        templateId: 'comprehensive-buyer',
        format: 'pdf',
        includeConfidential: false
      };

      // Should not throw error, but handle missing data gracefully
      const report = await reportingService.generateReport(request);
      expect(report).toBeDefined();
      expect(report.content).toBeDefined();
    });

    it('provides fallback content for missing sections', async () => {
      const request: ReportGenerationRequest = {
        sessionId: 'session-123',
        templateId: 'comprehensive-buyer',
        format: 'pdf',
        includeConfidential: false,
        customSections: ['non-existent-section']
      };

      const report = await reportingService.generateReport(request);
      expect(report.content).toBeDefined();
      // Should still generate report even with invalid custom sections
    });
  });

  describe('Requirements Compliance', () => {
    it('generates reports that maintain consistency with platform communication (Requirement 9.6)', async () => {
      const request: ReportGenerationRequest = {
        sessionId: 'session-123',
        templateId: 'comprehensive-buyer',
        format: 'html',
        includeConfidential: false
      };

      const report = await reportingService.generateReport(request);
      
      // Check for consistent styling and structure
      expect(report.content).toContain('font-family: Arial, sans-serif');
      expect(report.content).toContain('color: #2563eb'); // Consistent color scheme
      expect(report.metadata.audience).toBe('buyer');
    });

    it('provides context and explanations for verification findings (Requirement 10.5)', async () => {
      const summary = await reportingService.generateExecutiveSummary('session-123');
      
      // Check that summary provides context for findings
      expect(summary.keyFindings.length).toBeGreaterThan(0);
      expect(summary.keyFindings[0]).toMatch(/Property ownership verified/);
      
      // Check that explanations are provided for risk levels
      expect(summary.overallRiskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(summary.confidenceLevel).toBeGreaterThan(0);
    });

    it('connects users with professional resources and support (Requirement 10.6)', async () => {
      const compiledReport = await reportingService.compileExpertReports('session-123');
      
      // Check that expert reports provide professional insights
      expect(compiledReport).toContain('Expert Reports Compilation');
      expect(compiledReport).toContain('Expert Consensus Analysis');
      
      // Check that recommendations include professional consultation
      const summary = await reportingService.generateExecutiveSummary('session-123');
      expect(summary.recommendations.some(rec => 
        rec.includes('legal counsel') || rec.includes('expert') || rec.includes('professional')
      )).toBe(true);
    });
  });
});