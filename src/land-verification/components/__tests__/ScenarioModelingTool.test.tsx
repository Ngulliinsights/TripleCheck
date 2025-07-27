import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ScenarioModelingTool from '../ScenarioModelingTool';
import type { RiskFactorWithContext } from '@/types/land-verification';

const mockRiskFactors: RiskFactorWithContext[] = [
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
];

const mockScenarioResult = {
  scenarioId: 'test-scenario',
  projectedRiskScore: 65,
  impactAnalysis: {
    riskChange: -10,
    affectedFactors: 2,
    confidenceLevel: 0.8
  },
  recommendations: [
    {
      id: 'rec-1',
      priority: 'high' as const,
      category: 'mitigation' as const,
      title: 'Test recommendation',
      description: 'Test description',
      actionItems: ['Action 1', 'Action 2']
    }
  ]
};

const defaultProps = {
  baselineRiskFactors: mockRiskFactors,
  onRunScenario: vi.fn().mockResolvedValue(mockScenarioResult),
  onSaveScenario: vi.fn()
};

describe('ScenarioModelingTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the scenario modeling interface', () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    expect(screen.getByText('Scenario Modeling & What-If Analysis')).toBeInTheDocument();
    expect(screen.getByText('Baseline Risk Score')).toBeInTheDocument();
  });

  it('calculates baseline risk score correctly', () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Baseline should be calculated from risk factors
    // (8 + 6) / 2 * 10 = 70
    expect(screen.getByText('70/100')).toBeInTheDocument();
  });

  it('allows scenario configuration', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Enter scenario name
    const nameInput = screen.getByPlaceholderText('Enter scenario name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });
    
    // Enter description
    const descriptionInput = screen.getByPlaceholderText('Describe the scenario and its key assumptions');
    fireEvent.change(descriptionInput, { target: { value: 'Test scenario description' } });
    
    expect(nameInput).toHaveValue('Test Scenario');
    expect(descriptionInput).toHaveValue('Test scenario description');
  });

  it('allows adding risk factor modifications', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Click on the select to add modification
    const addModificationSelect = screen.getByText('Add modification');
    fireEvent.click(addModificationSelect);
    
    // Select a risk factor
    await waitFor(() => {
      const ownershipOption = screen.getByText('ownership - high');
      fireEvent.click(ownershipOption);
    });
    
    // Should add a modification card
    await waitFor(() => {
      expect(screen.getByText('ownership')).toBeInTheDocument();
    });
  });

  it('allows adding and removing assumptions', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Add an assumption
    const assumptionInput = screen.getByPlaceholderText('Add an assumption about this scenario');
    fireEvent.change(assumptionInput, { target: { value: 'Test assumption' } });
    
    const addButton = screen.getByRole('button', { name: /plus/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test assumption')).toBeInTheDocument();
    });
  });

  it('loads predefined scenarios', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Navigate to templates tab
    fireEvent.click(screen.getByText('Templates'));
    
    await waitFor(() => {
      expect(screen.getByText('Full Mitigation Implementation')).toBeInTheDocument();
      expect(screen.getByText('Worst Case Scenario')).toBeInTheDocument();
      expect(screen.getByText('Partial Risk Resolution')).toBeInTheDocument();
    });
    
    // Load a template
    const loadButtons = screen.getAllByText('Load Template');
    fireEvent.click(loadButtons[0]);
    
    // Should switch back to builder tab with loaded scenario
    await waitFor(() => {
      expect(screen.getByDisplayValue('Full Mitigation Implementation')).toBeInTheDocument();
    });
  });

  it('runs scenario analysis', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Configure scenario
    const nameInput = screen.getByPlaceholderText('Enter scenario name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });
    
    // Run scenario
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(defaultProps.onRunScenario).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Scenario'
        })
      );
    });
    
    // Should navigate to results tab
    await waitFor(() => {
      expect(screen.getByText('Risk Reduced')).toBeInTheDocument();
    });
  });

  it('displays scenario results', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Configure and run scenario
    const nameInput = screen.getByPlaceholderText('Enter scenario name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });
    
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      // Should show results
      expect(screen.getByText('65')).toBeInTheDocument(); // Projected score
      expect(screen.getByText('10.0')).toBeInTheDocument(); // Risk change
      expect(screen.getByText('80%')).toBeInTheDocument(); // Confidence
    });
  });

  it('prevents running scenario without name', async () => {
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<ScenarioModelingTool {...defaultProps} />);
    
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    expect(alertSpy).toHaveBeenCalledWith('Please provide a scenario name');
    expect(defaultProps.onRunScenario).not.toHaveBeenCalled();
    
    alertSpy.mockRestore();
  });

  it('handles scenario saving', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Configure scenario
    const nameInput = screen.getByPlaceholderText('Enter scenario name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });
    
    // Save scenario
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(defaultProps.onSaveScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Scenario'
      })
    );
  });

  it('resets scenario configuration', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Configure scenario
    const nameInput = screen.getByPlaceholderText('Enter scenario name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });
    
    // Reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // Should clear the form
    expect(nameInput).toHaveValue('');
  });

  it('shows loading state during scenario execution', async () => {
    const slowRunScenario = vi.fn(() => new Promise(resolve => setTimeout(() => resolve(mockScenarioResult), 100)));
    
    render(<ScenarioModelingTool {...defaultProps} onRunScenario={slowRunScenario} />);
    
    // Configure scenario
    const nameInput = screen.getByPlaceholderText('Enter scenario name');
    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });
    
    // Run scenario
    const runButton = screen.getByText('Run Scenario Analysis');
    fireEvent.click(runButton);
    
    // Should show loading state
    expect(screen.getByText('Running Analysis...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Run Scenario Analysis')).toBeInTheDocument();
    });
  });

  it('handles modification updates', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Add a modification first
    const addModificationSelect = screen.getByText('Add modification');
    fireEvent.click(addModificationSelect);
    
    await waitFor(() => {
      const ownershipOption = screen.getByText('ownership - high');
      fireEvent.click(ownershipOption);
    });
    
    // Should be able to update the modification
    await waitFor(() => {
      expect(screen.getByText('ownership')).toBeInTheDocument();
    });
  });

  it('handles timeframe selection', async () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Click on timeframe select
    const timeframeSelect = screen.getByDisplayValue('90 Days');
    fireEvent.click(timeframeSelect);
    
    // Select different timeframe
    await waitFor(() => {
      const oneYearOption = screen.getByText('1 Year');
      fireEvent.click(oneYearOption);
    });
    
    expect(screen.getByDisplayValue('1 Year')).toBeInTheDocument();
  });

  it('shows empty state for results when no scenarios run', () => {
    render(<ScenarioModelingTool {...defaultProps} />);
    
    // Navigate to results tab
    fireEvent.click(screen.getByText('Results'));
    
    expect(screen.getByText('No Scenario Results Yet')).toBeInTheDocument();
    expect(screen.getByText('Create and run scenarios to see projected risk analysis results')).toBeInTheDocument();
  });

  it('applies custom CSS classes', () => {
    const { container } = render(
      <ScenarioModelingTool {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});