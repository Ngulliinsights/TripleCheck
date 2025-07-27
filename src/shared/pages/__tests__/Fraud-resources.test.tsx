import { render, screen, fireEvent } from '@testing-library/react';
import FraudResources from '../Fraud-resources';

describe('Fraud Resources Component', () => {
  it('renders the fraud resources guide with correct title', () => {
    render(<FraudResources />);
    
    expect(screen.getByText('Kenya Real Estate Fraud: Complete Resource Guide')).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive guidance for victims of real estate fraud/)).toBeInTheDocument();
  });

  it('displays emergency hotlines banner', () => {
    render(<FraudResources />);
    
    expect(screen.getByText('Fraud Emergency Hotlines')).toBeInTheDocument();
    expect(screen.getByText('DCI: 0800 722 203')).toBeInTheDocument();
    expect(screen.getByText('Police: 999 / 112')).toBeInTheDocument();
  });

  it('renders accordion sections', () => {
    render(<FraudResources />);
    
    expect(screen.getByText('🚨 Emergency Action Plan (First 48 Hours)')).toBeInTheDocument();
    expect(screen.getByText('📊 Reporting Channels (Ranked by Effectiveness)')).toBeInTheDocument();
    expect(screen.getByText('🛡️ Prevention & Red Flag Recognition')).toBeInTheDocument();
  });

  it('opens and closes accordion sections', () => {
    render(<FraudResources />);
    
    const emergencySection = screen.getByText('🚨 Emergency Action Plan (First 48 Hours)');
    const button = emergencySection.closest('button');
    
    expect(button).toHaveAttribute('aria-expanded', 'true'); // Emergency section is open by default
    
    if (button) {
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('displays critical action steps in emergency section', () => {
    render(<FraudResources />);
    
    // Emergency section is open by default
    expect(screen.getByText('Stop all payments immediately.')).toBeInTheDocument();
    expect(screen.getByText('Document everything comprehensively.')).toBeInTheDocument();
    expect(screen.getByText('Report to DCI Land Fraud Unit.')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<FraudResources />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});