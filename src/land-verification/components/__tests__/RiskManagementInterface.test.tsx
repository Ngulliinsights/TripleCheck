import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RiskManagementInterface from '../RiskManagementInterface'
import type { RiskAssessmentResponse } from '@/types/land-verification'

// Mock the child components
vi.mock('../RiskProfileVisualization', () => ({
  default: ({ onUpdateWeights, onRecalculateRisk }: any) => (
    <div data-testid="risk-profile-visualization">
      <button onClick={() => onUpdateWeights({ ownership: 0.4 })}>Update Weights</button>
      <button onClick={onRecalculateRisk}>Recalculate</button>
    </div>
  )
}));

vi.mock('../RiskAssessmentDisplay', () => ({
  default: ({ onRefresh, onExportReport }: any) => (
    <div data-testid="risk-assessment-display">
      <button onClick={onRefresh}>Refresh</button>
      <button onClick={() => onExportReport('pdf')}>Export PDF</button>
    </div>
  )
}));

vi.mock('../ScenarioModelingTool', () => ({
  default: ({ onRunScenario }: any) => (
    <div data-testid="scenario-modeling-tool">
      <button onClick={() => onRunScenario({ id: 'test-scenario' })}>Run Scenario</button>
    </div>
  )
}));

vi.mock('../RiskFactorAnalysis', () => ({
  default: () => <div data-testid="risk-factor-analysis">Risk Factor Analysis</div>
}));

vi.mock('../RiskWeightingControls', () => ({
  default: ({ onWeightsChange }: any) => (
    <div data-testid="risk-weighting-controls">
      <button onClick={() => onWeightsChange({ ownership: 0.35 })}>Change Weights</button>
    </div>
  )
}));

vi.mock('../RecommendationEngine', () => ({
  default: () => <div data-testid="recommendation-engine">Recommendation Engine</div>
}));

const mockRiskAssessment: RiskAssessmentResponse = {
  sessionId: 1,
  overallRiskScore: 75,
  riskLevel: 'high',
  confidence: 0.85,
  riskFactors: [
    {
      id: 1,
      sessionId: 1,
      category: 'ownership',
      severity: 'high',
      description: 'Ownership verification issues',
      impact: 8,
      likelihood: 0.7,
      mitigationStatus: 'none',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      sessionId: 1,
      category: 'legal',
      severity: 'medium',
      description: 'Legal complications detected',
      impact: 6,
      likelihood: 0.5,
      mitigationStatus: 'planned',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  riskInteractions: [
    {
      id: 'interaction-1',
      primaryFactorId: 1,
      secondaryFactorId: 2,
      interactionType: 'amplifies',
      impactMultiplier: 1.5,
      description: 'Ownership issues amplify legal risks',
      confidence: 0.8
    }
  ],
  recommendations: [
    {
      id: 'rec-1',
      priority: 'high',
      category: 'immediate_action',
      title: 'Verify ownership documents',
      description: 'Conduct thorough ownership verification',
      actionItems: ['Review title deeds', 'Check ownership history'],
      estimatedCost: 25000,
      estimatedTimeframe: '1-2 weeks'
    }
  ],
  assessmentDate: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
};

const defaultProps = {
  sessionId: 1,
  riskAssessment: mockRiskAssessment,
  onUpdateRiskWeights: vi.fn(),
  onRecalculateRisk: vi.fn(),
  onExportReport: vi.fn(),
  onSaveConfiguration: vi.fn(),
  onShareAnalysis: vi.fn()
};

describe('RiskManagementInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main dashboard with risk summary', () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    expect(screen.getByText('Risk Management Dashboard')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays risk metrics correctly', () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    // Check risk factors count
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Check confidence percentage
    expect(screen.getByText('85%')).toBeInTheDocument();
    
    // Check recommendations count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows critical alert for critical risk level', () => {
    const criticalRiskAssessment = {
      ...mockRiskAssessment,
      riskLevel: 'critical' as const,
      overallRiskScore: 90
    };

    render(
      <RiskManagementInterface 
        {...defaultProps} 
        riskAssessment={criticalRiskAssessment} 
      />
    );
    
    expect(screen.getByText(/Critical Risk Detected/)).toBeInTheDocument();
  });

  it('handles tab navigation correctly', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    // Default tab should be overview
    expect(screen.getByTestId('risk-assessment-display')).toBeInTheDocument();
    
    // Click on analysis tab
    fireEvent.click(screen.getByText('Factor Analysis'));
    await waitFor(() => {
      expect(screen.getByTestId('risk-factor-analysis')).toBeInTheDocument();
    });
    
    // Click on visualization tab
    fireEvent.click(screen.getByText('Visualization'));
    await waitFor(() => {
      expect(screen.getByTestId('risk-profile-visualization')).toBeInTheDocument();
    });
    
    // Click on scenarios tab
    fireEvent.click(screen.getByText('Scenarios'));
    await waitFor(() => {
      expect(screen.getByTestId('scenario-modeling-tool')).toBeInTheDocument();
    });
    
    // Click on recommendations tab
    fireEvent.click(screen.getByText('Actions'));
    await waitFor(() => {
      expect(screen.getByTestId('recommendation-engine')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(defaultProps.onRecalculateRisk).toHaveBeenCalledTimes(1);
    });
  });

  it('handles weight updates', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    // Navigate to analysis tab
    fireEvent.click(screen.getByText('Factor Analysis'));
    
    await waitFor(() => {
      const changeWeightsButton = screen.getByText('Change Weights');
      fireEvent.click(changeWeightsButton);
    });
    
    await waitFor(() => {
      expect(defaultProps.onUpdateRiskWeights).toHaveBeenCalledWith({ ownership: 0.35 });
    });
  });

  it('handles configuration saving', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    const saveConfigButton = screen.getByText('Save Config');
    fireEvent.click(saveConfigButton);
    
    await waitFor(() => {
      expect(defaultProps.onSaveConfiguration).toHaveBeenCalledTimes(1);
    });
  });

  it('handles sharing functionality', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(defaultProps.onShareAnalysis).toHaveBeenCalledTimes(1);
    });
  });

  it('handles export functionality', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    // Test PDF export
    const pdfExportButton = screen.getByText('PDF Report');
    fireEvent.click(pdfExportButton);
    
    await waitFor(() => {
      expect(defaultProps.onExportReport).toHaveBeenCalledWith('pdf');
    });
    
    // Test Excel export
    const excelExportButton = screen.getByText('Excel Analysis');
    fireEvent.click(excelExportButton);
    
    await waitFor(() => {
      expect(defaultProps.onExportReport).toHaveBeenCalledWith('excel');
    });
    
    // Test JSON export
    const jsonExportButton = screen.getByText('Raw Data');
    fireEvent.click(jsonExportButton);
    
    await waitFor(() => {
      expect(defaultProps.onExportReport).toHaveBeenCalledWith('json');
    });
  });

  it('shows loading state during recalculation', async () => {
    const slowRecalculate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <RiskManagementInterface 
        {...defaultProps} 
        onRecalculateRisk={slowRecalculate}
      />
    );
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Should show loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('calculates risk trend correctly', () => {
    const highRiskAssessment = {
      ...mockRiskAssessment,
      riskFactors: [
        ...mockRiskAssessment.riskFactors,
        {
          id: 3,
          sessionId: 1,
          category: 'government' as const,
          severity: 'critical' as const,
          description: 'Critical government risk',
          impact: 9,
          likelihood: 0.8,
          mitigationStatus: 'none' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    render(
      <RiskManagementInterface 
        {...defaultProps} 
        riskAssessment={highRiskAssessment} 
      />
    );
    
    // Should show increasing trend for high risk factors
    expect(screen.getByText('3')).toBeInTheDocument(); // Total factors
  });

  it('handles scenario execution', async () => {
    render(<RiskManagementInterface {...defaultProps} />);
    
    // Navigate to scenarios tab
    fireEvent.click(screen.getByText('Scenarios'));
    
    await waitFor(() => {
      const runScenarioButton = screen.getByText('Run Scenario');
      fireEvent.click(runScenarioButton);
    });
    
    // Scenario should be executed (mocked)
    expect(screen.getByTestId('scenario-modeling-tool')).toBeInTheDocument();
  });

  it('applies custom CSS classes', () => {
    const { container } = render(
      <RiskManagementInterface {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty risk factors gracefully', () => {
    const emptyRiskAssessment = {
      ...mockRiskAssessment,
      riskFactors: [],
      riskInteractions: [],
      recommendations: []
    };

    render(
      <RiskManagementInterface 
        {...defaultProps} 
        riskAssessment={emptyRiskAssessment} 
      />
    );
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Risk factors count
    expect(screen.getByText('0')).toBeInTheDocument(); // Recommendations count
  });
});