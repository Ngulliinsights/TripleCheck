/**
 * Integration test for accessibility hook consolidation
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { useAccessibility, SkipLink } from '../useAccessibility'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test component that uses the consolidated accessibility hook
function TestAccessibilityComponent() {
  const { 
    trapFocus, 
    announceLiveRegion, 
    prefersReducedMotion,
    keyboardNavigation 
  } = useAccessibility();

  return (
    <div>
      <SkipLink href="#main">Skip to main content</SkipLink>
      <button 
        onClick={() => announceLiveRegion('Button clicked')}
        data-testid="announce-button"
      >
        Announce
      </button>
      <div data-testid="preferences">
        Reduced Motion: {prefersReducedMotion.toString()}
        Keyboard Navigation: {keyboardNavigation.toString()}
      </div>
    </div>
  );
}

describe('Accessibility Hook Integration', () => {
  it('should render component with consolidated accessibility features', () => {
    render(<TestAccessibilityComponent />);
    
    // Check that SkipLink is rendered
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    
    // Check that button is rendered
    expect(screen.getByTestId('announce-button')).toBeInTheDocument();
    
    // Check that preferences are displayed
    expect(screen.getByTestId('preferences')).toBeInTheDocument();
    expect(screen.getByText(/Reduced Motion:/)).toBeInTheDocument();
    expect(screen.getByText(/Keyboard Navigation:/)).toBeInTheDocument();
  });

  it('should have all expected accessibility functions available', () => {
    const TestComponent = () => {
      const accessibility = useAccessibility();
      
      // Verify all expected functions are available
      const hasAllFunctions = 
        typeof accessibility.trapFocus === 'function' &&
        typeof accessibility.announceLiveRegion === 'function' &&
        typeof accessibility.restoreFocus === 'function' &&
        typeof accessibility.prefersReducedMotion === 'boolean' &&
        typeof accessibility.prefersHighContrast === 'boolean' &&
        typeof accessibility.prefersLargeText === 'boolean' &&
        typeof accessibility.keyboardNavigation === 'boolean';
      
      return <div data-testid="functions-check">{hasAllFunctions.toString()}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByTestId('functions-check')).toHaveTextContent('true');
  });
});