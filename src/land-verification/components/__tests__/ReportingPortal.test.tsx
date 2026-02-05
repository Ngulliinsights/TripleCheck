import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ReportingPortal } from '../ReportingPortal'

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock fetch globally
global.fetch = vi.fn();

const mockTemplates = [
  {
    id: 'comprehensive-buyer',
    name: 'Comprehensive Buyer Report',
    description: 'Complete verification report for property buyers',
    audience: 'buyer',
    format: 'pdf',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        type: 'summary',
        required: true,
        order: 1,
        dataSource: 'risk-assessment',
        template: 'executive-summary'
      },
      {
        id: 'property-overview',
        title: 'Property Overview',
        type: 'detailed',
        required: true,
        order: 2,
        dataSource: 'property-data',
        template: 'property-overview'
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        type: 'recommendations',
        required: false,
        order: 3,
        dataSource: 'recommendations',
        template: 'action-items'
      }
    ]
  },
  {
    id: 'legal-documentation',
    name: 'Legal Documentation Report',
    description: 'Formal legal report for court proceedings or legal counsel',
    audience: 'legal',
    format: 'pdf',
    sections: [
      {
        id: 'legal-summary',
        title: 'Legal Summary',
        type: 'legal',
        required: true,
        order: 1,
        dataSource: 'legal-analysis',
        template: 'legal-summary'
      }
    ]
  }
];

const mockExecutiveSummary = {
  propertyId: 'prop-123',
  overallRiskLevel: 'medium' as const,
  overallRiskScore: 65,
  keyFindings: [
    'Property ownership verified through government registry',
    'No active legal disputes found',
    'Physical boundaries match survey records'
  ],
  criticalIssues: [
    'Potential government designation conflict detected'
  ],
  recommendations: [
    'Conduct additional boundary survey',
    'Obtain legal counsel for government designation review'
  ],
  verificationCompleteness: 85,
  confidenceLevel: 0.8,
  nextSteps: [
    'Complete physical verification layer',
    'Schedule expert consultation'
  ]
};

const mockExpertReports = `# Expert Reports Compilation

## Expert Report: Surveyor
**Expert:** surveyor-123
**Completion Date:** 2024-01-15
**Status:** completed

### Findings
Property boundaries are clearly marked and match official survey records.

### Recommendations
No immediate action required for boundary verification.

## Expert Consensus Analysis
Based on 1 expert reports, the following consensus emerges:
- Areas of agreement: Boundary verification is accurate
- Areas of disagreement: None identified
- Recommended resolution: Proceed with confidence`;

const mockGeneratedReport = {
  id: 'report-123',
  sessionId: 'session-456',
  templateId: 'comprehensive-buyer',
  format: 'pdf' as const,
  content: 'Mock report content',
  metadata: {
    generatedAt: new Date('2024-01-15T10:00:00Z'),
    generatedBy: 'user-123',
    audience: 'buyer',
    fileSize: 1024,
    confidentialityLevel: 'restricted' as const
  },
  downloadUrl: 'https://example.com/download/report-123'
};

describe('ReportingPortal', () => {
  const defaultProps = {
    sessionId: 'session-123',
    session: {
      id: 'session-123',
      propertyId: 'prop-123',
      status: 'in_progress'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/report-templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { templates: mockTemplates }
          })
        });
      }
      
      if (url.includes('/executive-summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { summary: mockExecutiveSummary }
          })
        });
      }
      
      if (url.includes('/expert-reports')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { compiledReport: mockExpertReports }
          })
        });
      }
      
      return Promise.resolve({
        ok: false,
        status: 404
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the reporting portal with all tabs', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      expect(screen.getByText('Reporting Portal')).toBeInTheDocument();
      expect(screen.getByText('Generate comprehensive verification reports and summaries')).toBeInTheDocument();
      
      // Check all tabs are present
      expect(screen.getByRole('tab', { name: 'Generate Report' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Executive Summary' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Expert Reports' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Report History' })).toBeInTheDocument();
    });

    it('displays help button with correct link', () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const helpButton = screen.getByRole('button', { name: /help/i });
      expect(helpButton).toBeInTheDocument();
    });
  });

  describe('Template Loading and Selection', () => {
    it('loads and displays report templates on mount', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/land-verification/report-templates');
      });
      
      // Check if template selection is available
      const templateSelect = screen.getByRole('combobox');
      expect(templateSelect).toBeInTheDocument();
    });

    it('displays template details when a template is selected', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      // Simulate template selection
      const templateSelect = screen.getByRole('combobox');
      fireEvent.click(templateSelect);
      
      // The template options should be available in the dropdown
      await waitFor(() => {
        expect(screen.getByText('Comprehensive Buyer Report')).toBeInTheDocument();
      });
    });

    it('shows template sections with required/optional indicators', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      // Select a template to show sections
      const templateSelect = screen.getByRole('combobox');
      fireEvent.click(templateSelect);
      
      await waitFor(() => {
        const buyerReportOption = screen.getByText('Comprehensive Buyer Report');
        fireEvent.click(buyerReportOption);
      });
      
      // Check for section checkboxes and required indicators
      await waitFor(() => {
        expect(screen.getByText('Executive Summary')).toBeInTheDocument();
        expect(screen.getByText('Property Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Report Generation', () => {
    it('generates a report when form is properly filled', async () => {
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/report-templates')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { templates: mockTemplates }
            })
          });
        }
        
        if (url.includes('/reports') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { report: mockGeneratedReport }
            })
          });
        }
        
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(<ReportingPortal {...defaultProps} />);
      
      // Wait for templates to load and select one
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const templateSelect = screen.getByRole('combobox');
      fireEvent.click(templateSelect);
      
      await waitFor(() => {
        const buyerReportOption = screen.getByText('Comprehensive Buyer Report');
        fireEvent.click(buyerReportOption);
      });
      
      // Click generate report button
      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/land-verification/sessions/${defaultProps.sessionId}/reports`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('comprehensive-buyer')
          })
        );
      });
      
      // Check success toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Report generated successfully',
          variant: 'default'
        });
      });
    });

    it('shows error when no template is selected', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);
      
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Please select a report template',
        variant: 'destructive'
      });
    });

    it('handles report generation errors gracefully', async () => {
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/report-templates')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { templates: mockTemplates }
            })
          });
        }
        
        if (url.includes('/reports') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 500
          });
        }
        
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(<ReportingPortal {...defaultProps} />);
      
      // Select template and generate report
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const templateSelect = screen.getByRole('combobox');
      fireEvent.click(templateSelect);
      
      await waitFor(() => {
        const buyerReportOption = screen.getByText('Comprehensive Buyer Report');
        fireEvent.click(buyerReportOption);
      });
      
      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to generate report',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Executive Summary Tab', () => {
    it('loads and displays executive summary', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      // Switch to executive summary tab
      const summaryTab = screen.getByRole('tab', { name: 'Executive Summary' });
      fireEvent.click(summaryTab);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/land-verification/sessions/${defaultProps.sessionId}/executive-summary`
        );
      });
      
      // Check summary content is displayed
      await waitFor(() => {
        expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
        expect(screen.getByText('65/100')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument(); // Confidence level
      });
      
      // Check key findings
      expect(screen.getByText('Property ownership verified through government registry')).toBeInTheDocument();
      
      // Check critical issues
      expect(screen.getByText('Potential government designation conflict detected')).toBeInTheDocument();
      
      // Check recommendations
      expect(screen.getByText('Conduct additional boundary survey')).toBeInTheDocument();
      
      // Check next steps
      expect(screen.getByText('Complete physical verification layer')).toBeInTheDocument();
    });

    it('shows loading state while fetching executive summary', async () => {
      // Mock delayed response
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/executive-summary')) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: { summary: mockExecutiveSummary }
                })
              });
            }, 100);
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(<ReportingPortal {...defaultProps} />);
      
      const summaryTab = screen.getByRole('tab', { name: 'Executive Summary' });
      fireEvent.click(summaryTab);
      
      // Check loading state
      expect(screen.getByText('Loading executive summary...')).toBeInTheDocument();
      
      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
      });
    });

    it('handles executive summary loading errors', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/executive-summary')) {
          return Promise.resolve({
            ok: false,
            status: 500
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(<ReportingPortal {...defaultProps} />);
      
      const summaryTab = screen.getByRole('tab', { name: 'Executive Summary' });
      fireEvent.click(summaryTab);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load executive summary',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Expert Reports Tab', () => {
    it('loads and displays expert reports', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const expertTab = screen.getByRole('tab', { name: 'Expert Reports' });
      fireEvent.click(expertTab);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/land-verification/sessions/${defaultProps.sessionId}/expert-reports`
        );
      });
      
      // Check expert reports content
      await waitFor(() => {
        expect(screen.getByText(/Expert Reports Compilation/)).toBeInTheDocument();
        expect(screen.getByText(/Expert Report: Surveyor/)).toBeInTheDocument();
      });
      
      // Check download and copy buttons
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('allows downloading expert reports', async () => {
      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockClick = vi.fn();
      
      Object.defineProperty(document, 'createElement', {
        value: vi.fn(() => ({
          href: '',
          download: '',
          click: mockClick
        }))
      });
      
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild
      });
      
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild
      });

      render(<ReportingPortal {...defaultProps} />);
      
      const expertTab = screen.getByRole('tab', { name: 'Expert Reports' });
      fireEvent.click(expertTab);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });
      
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('allows copying expert reports to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve())
        }
      });

      render(<ReportingPortal {...defaultProps} />);
      
      const expertTab = screen.getByRole('tab', { name: 'Expert Reports' });
      fireEvent.click(expertTab);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockExpertReports);
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Copied',
          description: 'Expert reports copied to clipboard',
          variant: 'default'
        });
      });
    });
  });

  describe('Report History Tab', () => {
    it('shows empty state when no reports are generated', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const historyTab = screen.getByRole('tab', { name: 'Report History' });
      fireEvent.click(historyTab);
      
      expect(screen.getByText('No reports have been generated yet.')).toBeInTheDocument();
      expect(screen.getByText('Use the "Generate Report" tab to create your first report.')).toBeInTheDocument();
    });

    it('displays generated reports in history', async () => {
      const onReportGenerated = vi.fn();
      
      render(<ReportingPortal {...defaultProps} onReportGenerated={onReportGenerated} />);
      
      // First generate a report to populate history
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (url.includes('/report-templates')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { templates: mockTemplates }
            })
          });
        }
        
        if (url.includes('/reports') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { report: mockGeneratedReport }
            })
          });
        }
        
        return Promise.resolve({ ok: false, status: 404 });
      });
      
      // Generate a report first
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      const templateSelect = screen.getByRole('combobox');
      fireEvent.click(templateSelect);
      
      await waitFor(() => {
        const buyerReportOption = screen.getByText('Comprehensive Buyer Report');
        fireEvent.click(buyerReportOption);
      });
      
      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(onReportGenerated).toHaveBeenCalledWith(mockGeneratedReport);
      });
      
      // Now check history tab
      const historyTab = screen.getByRole('tab', { name: 'Report History' });
      fireEvent.click(historyTab);
      
      // Should show the generated report
      expect(screen.getByText('Comprehensive Buyer Report')).toBeInTheDocument();
      expect(screen.getByText('Format: PDF')).toBeInTheDocument();
      expect(screen.getByText('Size: 1.0 KB')).toBeInTheDocument();
      expect(screen.getByText('restricted')).toBeInTheDocument();
    });
  });

  describe('Configuration Options', () => {
    it('allows changing output format', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const formatSelect = screen.getByDisplayValue('PDF Document');
      fireEvent.click(formatSelect);
      
      const htmlOption = screen.getByText('HTML Report');
      fireEvent.click(htmlOption);
      
      expect(screen.getByDisplayValue('HTML Report')).toBeInTheDocument();
    });

    it('allows setting target audience', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const audienceInput = screen.getByPlaceholderText('e.g., Property buyer, Legal team');
      fireEvent.change(audienceInput, { target: { value: 'Legal team' } });
      
      expect(audienceInput).toHaveValue('Legal team');
    });

    it('allows toggling confidential information inclusion', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const confidentialCheckbox = screen.getByLabelText('Include confidential information');
      fireEvent.click(confidentialCheckbox);
      
      expect(confidentialCheckbox).toBeChecked();
    });
  });

  describe('Requirements Compliance', () => {
    it('maintains consistency with existing platform communication tools (Requirement 9.6)', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      // Check that the component uses consistent UI components and patterns
      expect(screen.getByText('Reporting Portal')).toBeInTheDocument();
      
      // Check for consistent button styling and behavior
      const helpButton = screen.getByRole('button', { name: /help/i });
      expect(helpButton).toHaveClass('border'); // Outline variant
      
      // Check for consistent card layout
      const cards = screen.getAllByRole('region');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('provides context and explanations for verification findings (Requirement 10.5)', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      // Switch to executive summary to check explanations
      const summaryTab = screen.getByRole('tab', { name: 'Executive Summary' });
      fireEvent.click(summaryTab);
      
      await waitFor(() => {
        // Check for contextual information
        expect(screen.getByText('Risk Score')).toBeInTheDocument();
        expect(screen.getByText('Verification Complete')).toBeInTheDocument();
        expect(screen.getByText('Confidence Level')).toBeInTheDocument();
        
        // Check for explanatory sections
        expect(screen.getByText('Key Findings')).toBeInTheDocument();
        expect(screen.getByText('Critical Issues')).toBeInTheDocument();
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Next Steps')).toBeInTheDocument();
      });
    });

    it('connects users with appropriate professional resources and support (Requirement 10.6)', async () => {
      render(<ReportingPortal {...defaultProps} />);
      
      // Check for help button that connects to professional resources
      const helpButton = screen.getByRole('button', { name: /help/i });
      expect(helpButton).toBeInTheDocument();
      
      // Check expert reports tab provides professional insights
      const expertTab = screen.getByRole('tab', { name: 'Expert Reports' });
      fireEvent.click(expertTab);
      
      await waitFor(() => {
        expect(screen.getByText('Expert Reports Compilation')).toBeInTheDocument();
      });
      
      // Check that recommendations include professional assistance
      const summaryTab = screen.getByRole('tab', { name: 'Executive Summary' });
      fireEvent.click(summaryTab);
      
      await waitFor(() => {
        expect(screen.getByText('Obtain legal counsel for government designation review')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ReportingPortal {...defaultProps} />);
      
      // Check for proper tab roles
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      
      // Check for proper form labels
      expect(screen.getByLabelText('Select Template')).toBeInTheDocument();
      expect(screen.getByLabelText('Output Format')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Audience')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<ReportingPortal {...defaultProps} />);
      
      const firstTab = screen.getByRole('tab', { name: 'Generate Report' });
      const secondTab = screen.getByRole('tab', { name: 'Executive Summary' });
      
      // Test tab navigation
      firstTab.focus();
      expect(document.activeElement).toBe(firstTab);
      
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(secondTab);
    });
  });
});