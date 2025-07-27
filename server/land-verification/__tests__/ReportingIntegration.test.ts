import { describe, it, expect, beforeEach } from 'vitest';
import { ReportingService } from '../ReportingService';

describe('Reporting Portal Integration', () => {
  let reportingService: ReportingService;

  beforeEach(() => {
    reportingService = new ReportingService();
  });

  it('demonstrates complete reporting workflow', async () => {
    const sessionId = 'demo-session-123';

    // 1. Get available templates
    const templates = reportingService.getAvailableTemplates();
    expect(templates.length).toBeGreaterThan(0);
    
    const buyerTemplate = templates.find(t => t.id === 'comprehensive-buyer');
    expect(buyerTemplate).toBeDefined();
    expect(buyerTemplate?.audience).toBe('buyer');

    // 2. Generate executive summary
    const executiveSummary = await reportingService.generateExecutiveSummary(sessionId);
    expect(executiveSummary.propertyId).toBeDefined();
    expect(executiveSummary.overallRiskLevel).toMatch(/^(low|medium|high|critical)$/);
    expect(executiveSummary.keyFindings.length).toBeGreaterThan(0);
    expect(executiveSummary.recommendations.length).toBeGreaterThan(0);

    // 3. Compile expert reports
    const expertReports = await reportingService.compileExpertReports(sessionId);
    expect(expertReports).toContain('Expert Reports Compilation');
    expect(expertReports).toContain('Expert Consensus Analysis');

    // 4. Generate comprehensive report
    const reportRequest = {
      sessionId,
      templateId: 'comprehensive-buyer',
      format: 'pdf' as const,
      includeConfidential: false,
      audience: 'Property buyer'
    };

    const report = await reportingService.generateReport(reportRequest);
    expect(report.sessionId).toBe(sessionId);
    expect(report.templateId).toBe('comprehensive-buyer');
    expect(report.format).toBe('pdf');
    expect(report.metadata.audience).toBe('buyer');
    expect(report.metadata.confidentialityLevel).toBe('restricted');

    // 5. Generate HTML report for preview
    const htmlRequest = {
      ...reportRequest,
      format: 'html' as const
    };

    const htmlReport = await reportingService.generateReport(htmlRequest);
    expect(htmlReport.format).toBe('html');
    expect(htmlReport.content).toContain('<!DOCTYPE html>');
    expect(htmlReport.content).toContain('Comprehensive Buyer Report');

    // 6. Generate legal documentation report
    const legalRequest = {
      sessionId,
      templateId: 'legal-documentation',
      format: 'pdf' as const,
      includeConfidential: true,
      audience: 'Legal counsel'
    };

    const legalReport = await reportingService.generateReport(legalRequest);
    expect(legalReport.templateId).toBe('legal-documentation');
    expect(legalReport.metadata.confidentialityLevel).toBe('confidential');
    expect(legalReport.content).toContain('Legal Summary');
    expect(legalReport.content).toContain('Chain of Ownership');

    console.log('✅ Reporting Portal Integration Test Complete');
    console.log(`📊 Generated ${templates.length} template types`);
    console.log(`📋 Executive summary with ${executiveSummary.keyFindings.length} key findings`);
    console.log(`👥 Expert reports compilation completed`);
    console.log(`📄 Generated comprehensive buyer report (${report.metadata.fileSize} bytes)`);
    console.log(`🌐 Generated HTML preview report`);
    console.log(`⚖️ Generated legal documentation report`);
  });

  it('demonstrates requirements compliance', async () => {
    const sessionId = 'compliance-test-123';

    // Requirement 9.6: Maintain consistency with existing platform communication tools
    const templates = reportingService.getAvailableTemplates();
    const buyerTemplate = templates.find(t => t.id === 'comprehensive-buyer');
    
    expect(buyerTemplate?.sections.some(s => s.type === 'summary')).toBe(true);
    expect(buyerTemplate?.sections.some(s => s.type === 'recommendations')).toBe(true);

    const htmlReport = await reportingService.generateReport({
      sessionId,
      templateId: 'comprehensive-buyer',
      format: 'html',
      includeConfidential: false
    });

    // Check for consistent styling
    expect(htmlReport.content).toContain('font-family: Arial, sans-serif');
    expect(htmlReport.content).toContain('color: #2563eb');

    // Requirement 10.5: Provide context and explanations for verification findings
    const executiveSummary = await reportingService.generateExecutiveSummary(sessionId);
    
    expect(executiveSummary.keyFindings.length).toBeGreaterThan(0);
    expect(executiveSummary.keyFindings[0]).toContain('Property ownership verified');
    expect(executiveSummary.confidenceLevel).toBeGreaterThan(0);
    expect(executiveSummary.verificationCompleteness).toBeGreaterThanOrEqual(0);

    // Requirement 10.6: Connect users with appropriate professional resources and support
    const expertReports = await reportingService.compileExpertReports(sessionId);
    
    expect(expertReports).toContain('Expert Reports Compilation');
    expect(expertReports).toContain('Expert Consensus Analysis');
    
    expect(executiveSummary.recommendations.some(rec => 
      rec.includes('legal counsel') || rec.includes('expert') || rec.includes('professional')
    )).toBe(true);

    console.log('✅ Requirements Compliance Verified');
    console.log('  - 9.6: Platform communication consistency ✓');
    console.log('  - 10.5: Context and explanations provided ✓');
    console.log('  - 10.6: Professional resources connected ✓');
  });

  it('demonstrates error handling and resilience', async () => {
    // Test with non-existent template
    try {
      await reportingService.generateReport({
        sessionId: 'test-session',
        templateId: 'non-existent-template',
        format: 'pdf',
        includeConfidential: false
      });
      expect.fail('Should have thrown error for non-existent template');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Report template not found');
    }

    // Test with missing session data (should handle gracefully)
    const report = await reportingService.generateReport({
      sessionId: 'non-existent-session',
      templateId: 'comprehensive-buyer',
      format: 'pdf',
      includeConfidential: false
    });

    expect(report).toBeDefined();
    expect(report.content).toBeDefined();

    console.log('✅ Error Handling Verified');
    console.log('  - Invalid template handling ✓');
    console.log('  - Missing data graceful handling ✓');
  });
});