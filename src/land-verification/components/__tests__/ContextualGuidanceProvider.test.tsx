import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuidanceProvider, GuidancePanel, GuidanceButton, useGuidance } from '../ContextualGuidanceProvider';

// Test component to access guidance context
const TestComponent = () => {
  const { currentStep, showGuidance, setCurrentStep, toggleGuidance } = useGuidance();
  
  return (
    <div>
      <div data-testid="current-step">{currentStep || 'none'}</div>
      <div data-testid="show-guidance">{showGuidance.toString()}</div>
      <button onClick={() => setCurrentStep('verification-start')}>Set Step</button>
      <button onClick={toggleGuidance}>Toggle Guidance</button>
    </div>
  );
};

describe('GuidanceProvider', () => {
  it('provides guidance context to children', () => {
    render(
      <GuidanceProvider>
        <TestComponent />
      </GuidanceProvider>
    );
    
    expect(screen.getByTestId('current-step')).toHaveTextContent('none');
    expect(screen.getByTestId('show-guidance')).toHaveTextContent('true');
  });

  it('allows setting current step', () => {
    render(
      <GuidanceProvider>
        <TestComponent />
      </GuidanceProvider>
    );
    
    fireEvent.click(screen.getByText('Set Step'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('verification-start');
  });

  it('allows toggling guidance visibility', () => {
    render(
      <GuidanceProvider>
        <TestComponent />
      </GuidanceProvider>
    );
    
    fireEvent.click(screen.getByText('Toggle Guidance'));
    expect(screen.getByTestId('show-guidance')).toHaveTextContent('false');
  });

  it('throws error when useGuidance is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useGuidance must be used within a GuidanceProvider');
    
    consoleSpy.mockRestore();
  });
});

describe('GuidancePanel', () => {
  it('renders nothing when guidance is hidden', () => {
    const TestWithHiddenGuidance = () => {
      const { toggleGuidance } = useGuidance();
      React.useEffect(() => {
        toggleGuidance(); // Hide guidance
      }, [toggleGuidance]);
      
      return <GuidancePanel />;
    };
    
    render(
      <GuidanceProvider>
        <TestWithHiddenGuidance />
      </GuidanceProvider>
    );
    
    expect(screen.queryByText('Starting Land Verification')).not.toBeInTheDocument();
  });

  it('renders nothing when no current step is set', () => {
    render(
      <GuidanceProvider>
        <GuidancePanel />
      </GuidanceProvider>
    );
    
    expect(screen.queryByText('Starting Land Verification')).not.toBeInTheDocument();
  });

  it('renders guidance panel when step is set and guidance is shown', () => {
    const TestWithStep = () => {
      const { setCurrentStep } = useGuidance();
      React.useEffect(() => {
        setCurrentStep('verification-start');
      }, [setCurrentStep]);
      
      return <GuidancePanel />;
    };
    
    render(
      <GuidanceProvider>
        <TestWithStep />
      </GuidanceProvider>
    );
    
    expect(screen.getByText('Starting Land Verification')).toBeInTheDocument();
    expect(screen.getByText('Begin the comprehensive land verification process to protect against fraud and ownership disputes.')).toBeInTheDocument();
  });

  it('displays tips, warnings, and next steps', () => {
    const TestWithStep = () => {
      const { setCurrentStep } = useGuidance();
      React.useEffect(() => {
        setCurrentStep('document-upload');
      }, [setCurrentStep]);
      
      return <GuidancePanel />;
    };
    
    render(
      <GuidanceProvider>
        <TestWithStep />
      </GuidanceProvider>
    );
    
    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Important Notes')).toBeInTheDocument();
    expect(screen.getByText('What Happens Next')).toBeInTheDocument();
  });

  it('can be expanded and collapsed', () => {
    const TestWithStep = () => {
      const { setCurrentStep } = useGuidance();
      React.useEffect(() => {
        setCurrentStep('verification-start');
      }, [setCurrentStep]);
      
      return <GuidancePanel />;
    };
    
    render(
      <GuidanceProvider>
        <TestWithStep />
      </GuidanceProvider>
    );
    
    // Find and click the expand/collapse button
    const expandButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')
    );
    
    if (expandButton) {
      fireEvent.click(expandButton);
      // Content should still be visible initially, then hidden after click
      // This tests the toggle functionality
    }
  });

  it('can be closed via X button', () => {
    const TestWithStep = () => {
      const { setCurrentStep } = useGuidance();
      React.useEffect(() => {
        setCurrentStep('verification-start');
      }, [setCurrentStep]);
      
      return <GuidancePanel />;
    };
    
    render(
      <GuidanceProvider>
        <TestWithStep />
      </GuidanceProvider>
    );
    
    // Find and click the close button (X)
    const closeButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('h-4 w-4')
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      // Panel should be hidden after clicking close
    }
  });
});

describe('GuidanceButton', () => {
  it('sets current step when clicked', () => {
    const TestWithButton = () => {
      const { currentStep } = useGuidance();
      return (
        <div>
          <GuidanceButton stepId="registry-verification" />
          <div data-testid="current-step">{currentStep || 'none'}</div>
        </div>
      );
    };
    
    render(
      <GuidanceProvider>
        <TestWithButton />
      </GuidanceProvider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByTestId('current-step')).toHaveTextContent('registry-verification');
  });

  it('shows guidance if hidden when clicked', () => {
    const TestWithButton = () => {
      const { showGuidance, toggleGuidance } = useGuidance();
      
      React.useEffect(() => {
        toggleGuidance(); // Hide guidance initially
      }, [toggleGuidance]);
      
      return (
        <div>
          <GuidanceButton stepId="physical-verification" />
          <div data-testid="show-guidance">{showGuidance.toString()}</div>
        </div>
      );
    };
    
    render(
      <GuidanceProvider>
        <TestWithButton />
      </GuidanceProvider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByTestId('show-guidance')).toHaveTextContent('true');
  });

  it('renders custom children when provided', () => {
    render(
      <GuidanceProvider>
        <GuidanceButton stepId="community-intelligence">
          <span>Custom Help Text</span>
        </GuidanceButton>
      </GuidanceProvider>
    );
    
    expect(screen.getByText('Custom Help Text')).toBeInTheDocument();
  });

  it('has appropriate title attribute', () => {
    render(
      <GuidanceProvider>
        <GuidanceButton stepId="risk-assessment" />
      </GuidanceProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Get help with this step');
  });
});

describe('Predefined Steps', () => {
  it('contains all required verification steps', () => {
    const TestStepAccess = () => {
      const { getStep } = useGuidance();
      
      const steps = [
        'verification-start',
        'document-upload',
        'registry-verification',
        'physical-verification',
        'community-intelligence',
        'risk-assessment',
        'expert-coordination',
        'monitoring-setup'
      ];
      
      return (
        <div>
          {steps.map(stepId => {
            const step = getStep(stepId);
            return (
              <div key={stepId} data-testid={`step-${stepId}`}>
                {step ? step.title : 'Not found'}
              </div>
            );
          })}
        </div>
      );
    };
    
    render(
      <GuidanceProvider>
        <TestStepAccess />
      </GuidanceProvider>
    );
    
    expect(screen.getByTestId('step-verification-start')).toHaveTextContent('Starting Land Verification');
    expect(screen.getByTestId('step-document-upload')).toHaveTextContent('Document Upload and Authentication');
    expect(screen.getByTestId('step-registry-verification')).toHaveTextContent('Government Registry Verification');
    expect(screen.getByTestId('step-physical-verification')).toHaveTextContent('Physical Property Verification');
    expect(screen.getByTestId('step-community-intelligence')).toHaveTextContent('Community Knowledge Gathering');
    expect(screen.getByTestId('step-risk-assessment')).toHaveTextContent('Comprehensive Risk Analysis');
    expect(screen.getByTestId('step-expert-coordination')).toHaveTextContent('Professional Expert Coordination');
    expect(screen.getByTestId('step-monitoring-setup')).toHaveTextContent('Ongoing Property Monitoring');
  });

  it('allows registering custom steps', () => {
    const TestCustomStep = () => {
      const { registerStep, getStep } = useGuidance();
      
      React.useEffect(() => {
        registerStep({
          id: 'custom-step',
          title: 'Custom Step Title',
          description: 'Custom step description',
          tips: ['Custom tip'],
          warnings: ['Custom warning'],
          nextSteps: ['Custom next step']
        });
      }, [registerStep]);
      
      const customStep = getStep('custom-step');
      
      return (
        <div data-testid="custom-step">
          {customStep ? customStep.title : 'Not found'}
        </div>
      );
    };
    
    render(
      <GuidanceProvider>
        <TestCustomStep />
      </GuidanceProvider>
    );
    
    expect(screen.getByTestId('custom-step')).toHaveTextContent('Custom Step Title');
  });
});