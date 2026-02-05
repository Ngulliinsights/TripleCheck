import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RiskFactorAnalysis from '../RiskFactorAnalysis'
import type { RiskFactorWithContext, RiskInteraction } from '@/types/land-verification'

const mockRiskFactors: RiskFactorWithContext[] = [
  {
    id: 1,
    sessionId: 1,
    category: 'ownership',
    severity: 'critical',
    description: 'Critical ownership verification issues',
    impact: 9,
    likelihood: 0.8,
    mitigationStatus: 'none',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    sessionId: 1,
    category: 'legal',
    severity: 'high',
    description: 'High legal complications detected',
    impact: 7,
    likelihood: 0.6,
    mitigationStatus: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    sessionId: 1,
    category: 'physical',
    severity: 'medium',
    description: 'Medium physical verification issues',
    impact: 5,
    likelihood: 0.4,
    mitigationStatus: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    sessionId: 1,
    category: 'community',
    severity: 'low',
    description: 'Low community concerns',
    impact: 3,
    likelihood: 0.2,
    mitigationStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockRiskInteractions: RiskInteraction[] = [
  {
    id: 'interaction-1',
    primaryFactorId: 1,
    secondaryFactorId: 2,
    interactionType: 'amplifies',
    impactMultiplier: 1.5,
    description: 'Ownership issues amplify legal risks',
    confidence: 0.8
  },
  {
    id: 'interaction-2',
    primaryFactorId: 2,
    secondaryFactorId: 3,
    interactionType: 'mitigates',
    impactMultiplier: 0.8,
    description: 'Legal resolution mitigates physical concerns',
    confidence: 0.6
  }
];

const defaultProps = {
  riskFactors: mockRiskFactors,
  riskInteractions: mockRiskInteractions,
  onFactorUpdate: vi.fn()
};

describe('RiskFactorAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the risk factor analysis interface', () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    expect(screen.getByText('Risk Factor Analysis')).toBeInTheDocument();
    expect(screen.getByText('Detailed analysis of individual risk factors and their interactions')).toBeInTheDocument();
  });

  it('displays analytics summary correctly', () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Check high risk count (critical + high)
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Check medium risk count
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Check low risk count
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Check average impact (9+7+5+3)/4 = 6.0
    expect(screen.getByText('6.0/10')).toBeInTheDocument();
  });

  it('filters risk factors by category', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Initially should show all factors
    expect(screen.getByText('Critical ownership verification issues')).toBeInTheDocument();
    expect(screen.getByText('High legal complications detected')).toBeInTheDocument();
    
    // Filter by ownership category
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.click(categorySelect);
    
    await waitFor(() => {
      const ownershipOption = screen.getByText('Ownership');
      fireEvent.click(ownershipOption);
    });
    
    // Should only show ownership factors
    expect(screen.getByText('Critical ownership verification issues')).toBeInTheDocument();
    expect(screen.queryByText('High legal complications detected')).not.toBeInTheDocument();
  });

  it('filters risk factors by severity', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Filter by critical severity
    const severitySelect = screen.getByDisplayValue('All Severities');
    fireEvent.click(severitySelect);
    
    await waitFor(() => {
      const criticalOption = screen.getByText('Critical');
      fireEvent.click(criticalOption);
    });
    
    // Should only show critical factors
    expect(screen.getByText('Critical ownership verification issues')).toBeInTheDocument();
    expect(screen.queryByText('High legal complications detected')).not.toBeInTheDocument();
  });

  it('filters risk factors by mitigation status', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Filter by completed mitigation
    const mitigationSelect = screen.getByDisplayValue('All Status');
    fireEvent.click(mitigationSelect);
    
    await waitFor(() => {
      const completedOption = screen.getByText('Completed');
      fireEvent.click(completedOption);
    });
    
    // Should only show completed factors
    expect(screen.getByText('Low community concerns')).toBeInTheDocument();
    expect(screen.queryByText('Critical ownership verification issues')).not.toBeInTheDocument();
  });

  it('searches risk factors by description', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Search for "legal"
    const searchInput = screen.getByPlaceholderText('Search factors...');
    fireEvent.change(searchInput, { target: { value: 'legal' } });
    
    await waitFor(() => {
      expect(screen.getByText('High legal complications detected')).toBeInTheDocument();
      expect(screen.queryByText('Critical ownership verification issues')).not.toBeInTheDocument();
    });
  });

  it('sorts risk factors correctly', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Change sort to severity
    const sortSelect = screen.getByDisplayValue('Impact');
    fireEvent.click(sortSelect);
    
    await waitFor(() => {
      const severityOption = screen.getByText('Severity');
      fireEvent.click(severityOption);
    });
    
    // Should sort by severity (default desc, so critical first)
    const factorCards = screen.getAllByText(/verification|complications|concerns/);
    expect(factorCards[0]).toHaveTextContent('Critical ownership verification issues');
  });

  it('toggles sort direction', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Click sort direction toggle
    const sortToggle = screen.getByRole('button', { name: /sort/i });
    fireEvent.click(sortToggle);
    
    // Should change from desc to asc
    await waitFor(() => {
      // With ascending impact sort, lowest impact (3) should be first
      expect(screen.getByText('Low community concerns')).toBeInTheDocument();
    });
  });

  it('opens factor detail modal', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Click on a risk factor card
    const ownershipCard = screen.getByText('Critical ownership verification issues');
    fireEvent.click(ownershipCard.closest('.cursor-pointer')!);
    
    await waitFor(() => {
      expect(screen.getByText('Ownership Risk Factor')).toBeInTheDocument();
      expect(screen.getByText('Critical ownership verification issues')).toBeInTheDocument();
    });
  });

  it('closes factor detail modal', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Open modal
    const ownershipCard = screen.getByText('Critical ownership verification issues');
    fireEvent.click(ownershipCard.closest('.cursor-pointer')!);
    
    await waitFor(() => {
      expect(screen.getByText('Ownership Risk Factor')).toBeInTheDocument();
    });
    
    // Close modal
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Ownership Risk Factor')).not.toBeInTheDocument();
    });
  });

  it('updates factor status from modal', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Open modal
    const ownershipCard = screen.getByText('Critical ownership verification issues');
    fireEvent.click(ownershipCard.closest('.cursor-pointer')!);
    
    await waitFor(() => {
      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);
    });
    
    expect(defaultProps.onFactorUpdate).toHaveBeenCalledWith(1, { mitigationStatus: 'planned' });
  });

  it('displays risk interactions', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Switch to interactions tab
    fireEvent.click(screen.getByText('Interactions'));
    
    await waitFor(() => {
      expect(screen.getByText('amplifies')).toBeInTheDocument();
      expect(screen.getByText('mitigates')).toBeInTheDocument();
      expect(screen.getByText('Ownership issues amplify legal risks')).toBeInTheDocument();
    });
  });

  it('shows empty state when no factors match filters', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search factors...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No Risk Factors Found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more results')).toBeInTheDocument();
    });
  });

  it('shows empty state for interactions when none exist', async () => {
    render(<RiskFactorAnalysis {...defaultProps} riskInteractions={[]} />);
    
    // Switch to interactions tab
    fireEvent.click(screen.getByText('Interactions'));
    
    await waitFor(() => {
      expect(screen.getByText('No Risk Interactions')).toBeInTheDocument();
      expect(screen.getByText('No interactions detected between risk factors')).toBeInTheDocument();
    });
  });

  it('displays correct severity colors', () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Check that severity badges have appropriate colors
    const criticalBadge = screen.getByText('critical');
    expect(criticalBadge).toHaveClass('text-red-600');
    
    const highBadge = screen.getByText('high');
    expect(highBadge).toHaveClass('text-orange-600');
    
    const mediumBadge = screen.getByText('medium');
    expect(mediumBadge).toHaveClass('text-yellow-600');
    
    const lowBadge = screen.getByText('low');
    expect(lowBadge).toHaveClass('text-green-600');
  });

  it('displays correct mitigation status colors', () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Check mitigation status badges
    expect(screen.getByText('none')).toHaveClass('text-gray-600');
    expect(screen.getByText('planned')).toHaveClass('text-yellow-600');
    expect(screen.getByText('in progress')).toHaveClass('text-blue-600');
    expect(screen.getByText('completed')).toHaveClass('text-green-600');
  });

  it('shows interaction impact multipliers correctly', async () => {
    render(<RiskFactorAnalysis {...defaultProps} />);
    
    // Switch to interactions tab
    fireEvent.click(screen.getByText('Interactions'));
    
    await waitFor(() => {
      expect(screen.getByText('1.5x')).toBeInTheDocument(); // Amplifies
      expect(screen.getByText('0.8x')).toBeInTheDocument(); // Mitigates
    });
  });

  it('applies custom CSS classes', () => {
    const { container } = render(
      <RiskFactorAnalysis {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty risk factors array', () => {
    render(<RiskFactorAnalysis {...defaultProps} riskFactors={[]} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // High risk count
    expect(screen.getByText('0.0/10')).toBeInTheDocument(); // Average impact
  });
});