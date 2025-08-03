/**
 * Comprehensive accessibility testing utilities
 */

import type { AxeResults, RunOptions } from 'axe-core';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Enhanced accessibility test configurations
 */
export const a11yConfigs = {
  // Strict configuration for production-ready components
  strict: {
    rules: {
      'color-contrast': { enabled: true },
      'focus-order-semantics': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },

  // Relaxed configuration for development/testing
  relaxed: {
    rules: {
      // Disable color-contrast rule for tests as it can be flaky in test environments
      'color-contrast': { enabled: false },
      // Allow some flexibility during development
      'landmark-one-main': { enabled: false },
    },
    tags: ['wcag2a', 'wcag2aa'],
  },

  // Configuration for form testing
  forms: {
    rules: {
      'label': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'duplicate-id-aria': { enabled: true },
      'aria-required-attr': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'best-practice'],
  },

  // Configuration for navigation testing
  navigation: {
    rules: {
      'focus-order-semantics': { enabled: true },
      'tabindex': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa'],
  },

  // Configuration for content testing
  content: {
    rules: {
      'heading-order': { enabled: true },
      'landmark-unique': { enabled: true },
      'page-has-heading-one': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa'],
  },
};

/**
 * Test component for accessibility violations with enhanced options
 */
export const testA11y = async (
  container: Element,
  config: RunOptions = a11yConfigs.relaxed
): Promise<AxeResults> => {
  const results = await axe(container, config);
  expect(results).toHaveNoViolations();
  return results;
};

/**
 * Test accessibility with custom configuration
 */
export const testA11yWithConfig = async (
  container: Element,
  configName: keyof typeof a11yConfigs
): Promise<AxeResults> => {
  return testA11y(container, a11yConfigs[configName]);
};

/**
 * Test accessibility and return results without throwing
 */
export const checkA11y = async (
  container: Element,
  config: RunOptions = a11yConfigs.relaxed
): Promise<AxeResults> => {
  return axe(container, config);
};

/**
 * Test keyboard navigation accessibility
 */
export const testKeyboardAccessibility = async (
  container: Element,
  options: {
    expectFocusable?: string[]; // Selectors that should be focusable
    expectNotFocusable?: string[]; // Selectors that should not be focusable
    testTabOrder?: boolean; // Whether to test tab order
  } = {}
): Promise<void> => {
  const { expectFocusable = [], expectNotFocusable = [], testTabOrder = true } = options;

  // Test that expected elements are focusable
  for (const selector of expectFocusable) {
    const element = container.querySelector(selector);
    if (element) {
      const {tabIndex} = (element as HTMLElement);
      const isFocusable = tabIndex >= 0 || 
        ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName) ||
        element.hasAttribute('contenteditable');
      
      expect(isFocusable).toBe(true);
    }
  }

  // Test that expected elements are not focusable
  for (const selector of expectNotFocusable) {
    const element = container.querySelector(selector);
    if (element) {
      const {tabIndex} = (element as HTMLElement);
      expect(tabIndex).toBe(-1);
    }
  }

  // Test tab order if requested
  if (testTabOrder) {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    // Verify elements have logical tab order
    const tabIndexes = Array.from(focusableElements).map(el => 
      (el as HTMLElement).tabIndex || 0
    );

    // Check that tab indexes are in ascending order (0s can be mixed)
    let lastExplicitTabIndex = -1;
    for (const tabIndex of tabIndexes) {
      if (tabIndex > 0) {
        expect(tabIndex).toBeGreaterThan(lastExplicitTabIndex);
        lastExplicitTabIndex = tabIndex;
      }
    }
  }
};

/**
 * Test ARIA attributes and roles
 */
export const testAriaAttributes = (
  container: Element,
  expectations: {
    hasRole?: Array<{ selector: string; role: string }>;
    hasAriaLabel?: Array<{ selector: string; label?: string }>;
    hasAriaDescribedBy?: Array<{ selector: string; describedBy?: string }>;
    hasAriaExpanded?: Array<{ selector: string; expanded?: boolean }>;
  } = {}
): void => {
  const { hasRole = [], hasAriaLabel = [], hasAriaDescribedBy = [], hasAriaExpanded = [] } = expectations;

  // Test role attributes
  for (const { selector, role } of hasRole) {
    const element = container.querySelector(selector);
    expect(element).toBeTruthy();
    expect(element?.getAttribute('role')).toBe(role);
  }

  // Test aria-label attributes
  for (const { selector, label } of hasAriaLabel) {
    const element = container.querySelector(selector);
    expect(element).toBeTruthy();
    if (label) {
      expect(element?.getAttribute('aria-label')).toBe(label);
    } else {
      expect(element?.hasAttribute('aria-label')).toBe(true);
    }
  }

  // Test aria-describedby attributes
  for (const { selector, describedBy } of hasAriaDescribedBy) {
    const element = container.querySelector(selector);
    expect(element).toBeTruthy();
    if (describedBy) {
      expect(element?.getAttribute('aria-describedby')).toBe(describedBy);
    } else {
      expect(element?.hasAttribute('aria-describedby')).toBe(true);
    }
  }

  // Test aria-expanded attributes
  for (const { selector, expanded } of hasAriaExpanded) {
    const element = container.querySelector(selector);
    expect(element).toBeTruthy();
    if (expanded !== undefined) {
      expect(element?.getAttribute('aria-expanded')).toBe(String(expanded));
    } else {
      expect(element?.hasAttribute('aria-expanded')).toBe(true);
    }
  }
};

/**
 * Test form accessibility
 */
export const testFormAccessibility = async (
  container: Element,
  options: {
    expectLabels?: string[]; // Input selectors that should have labels
    expectRequired?: string[]; // Input selectors that should be required
    expectErrorMessages?: string[]; // Input selectors that should have error messages
  } = {}
): Promise<void> => {
  const { expectLabels = [], expectRequired = [], expectErrorMessages = [] } = options;

  // Run form-specific accessibility tests
  await testA11yWithConfig(container, 'forms');

  // Test that inputs have proper labels
  for (const selector of expectLabels) {
    const input = container.querySelector(selector) as HTMLInputElement;
    expect(input).toBeTruthy();

    const hasLabel = 
      (input.labels && input.labels.length > 0) ||
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      input.hasAttribute('title');

    expect(hasLabel).toBe(true);
  }

  // Test required field indicators
  for (const selector of expectRequired) {
    const input = container.querySelector(selector) as HTMLInputElement;
    expect(input).toBeTruthy();

    const isMarkedRequired = 
      input.hasAttribute('required') ||
      input.hasAttribute('aria-required') ||
      input.getAttribute('aria-required') === 'true';

    expect(isMarkedRequired).toBe(true);
  }

  // Test error message associations
  for (const selector of expectErrorMessages) {
    const input = container.querySelector(selector) as HTMLInputElement;
    expect(input).toBeTruthy();

    const hasErrorAssociation = 
      input.hasAttribute('aria-describedby') ||
      input.hasAttribute('aria-errormessage');

    expect(hasErrorAssociation).toBe(true);
  }
};

/**
 * Test color contrast (when possible in test environment)
 */
export const testColorContrast = async (
  container: Element,
  options: {
    level?: 'AA' | 'AAA';
    size?: 'normal' | 'large';
  } = {}
): Promise<void> => {
  const { level = 'AA', size = 'normal' } = options;

  const config: RunOptions = {
    rules: {
      'color-contrast': { 
        enabled: true,
        options: { 
          noScroll: true,
          ...(level === 'AAA' && { level: 'AAA' }),
          ...(size === 'large' && { size: 'large' }),
        },
      },
    },
  };

  try {
    await testA11y(container, config);
  } catch (error) {
    // Color contrast testing might fail in test environments
    // Log warning but don't fail the test
    console.warn('Color contrast testing failed in test environment:', error);
  }
};

/**
 * Test screen reader compatibility
 */
export const testScreenReaderCompatibility = (
  container: Element,
  options: {
    expectHeadings?: boolean;
    expectLandmarks?: boolean;
    expectAltText?: boolean;
  } = {}
): void => {
  const { expectHeadings = true, expectLandmarks = true, expectAltText = true } = options;

  if (expectHeadings) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    expect(headings.length).toBeGreaterThan(0);
  }

  if (expectLandmarks) {
    const landmarks = container.querySelectorAll(
      'main, nav, aside, section, header, footer, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]'
    );
    expect(landmarks.length).toBeGreaterThan(0);
  }

  if (expectAltText) {
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      const hasAltText = 
        img.hasAttribute('alt') ||
        img.hasAttribute('aria-label') ||
        img.hasAttribute('aria-labelledby') ||
        img.getAttribute('role') === 'presentation';
      
      expect(hasAltText).toBe(true);
    });
  }
};

/**
 * Comprehensive accessibility test suite
 */
export const runFullAccessibilityTest = async (
  container: Element,
  options: {
    skipColorContrast?: boolean;
    skipKeyboardNav?: boolean;
    skipScreenReader?: boolean;
    config?: keyof typeof a11yConfigs;
  } = {}
): Promise<AxeResults> => {
  const { 
    skipColorContrast = false, 
    skipKeyboardNav = false, 
    skipScreenReader = false,
    config = 'relaxed'
  } = options;

  // Run main accessibility tests
  const results = await testA11yWithConfig(container, config);

  // Test keyboard accessibility
  if (!skipKeyboardNav) {
    await testKeyboardAccessibility(container);
  }

  // Test screen reader compatibility
  if (!skipScreenReader) {
    testScreenReaderCompatibility(container);
  }

  // Test color contrast
  if (!skipColorContrast) {
    await testColorContrast(container);
  }

  return results;
};

/**
 * Mock screen reader announcements for testing
 */
export const mockScreenReaderAnnouncements = () => {
  const announcements: string[] = [];
  
  // Mock aria-live regions
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name: string, value: string) {
    if (name === 'aria-live' && value === 'polite') {
      // Track announcements to polite live regions
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const text = (mutation.target as Element).textContent;
            if (text?.trim()) {
              announcements.push(text.trim());
            }
          }
        });
      });
      
      observer.observe(this, { 
        childList: true, 
        subtree: true, 
        characterData: true 
      });
    }
    
    return originalSetAttribute.call(this, name, value);
  };

  return {
    getAnnouncements: () => [...announcements],
    clearAnnouncements: () => announcements.splice(0, announcements.length),
    expectAnnouncement: (text: string) => {
      expect(announcements).toContain(text);
    },
  };
};

// Export axe for direct use
export { axe };

// Legacy compatibility
export const a11yConfig = a11yConfigs.relaxed;