/**
 * Basic accessibility test to verify the testing utilities work
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { testA11y, a11yConfigs } from '../accessibility';

describe('Basic Accessibility Tests', () => {
  it('should pass accessibility test for simple button', async () => {
    const { container } = render(<button>Click me</button>);
    await testA11y(container, a11yConfigs.relaxed);
  });

  it('should pass accessibility test for labeled input', async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-input">Test Input</label>
        <input id="test-input" type="text" />
      </div>
    );
    await testA11y(container, a11yConfigs.relaxed);
  });

  it('should pass accessibility test for semantic structure', async () => {
    const { container } = render(
      <div>
        <header>
          <h1>Page Title</h1>
        </header>
        <main>
          <p>Main content</p>
        </main>
        <footer>
          <p>Footer content</p>
        </footer>
      </div>
    );
    await testA11y(container, a11yConfigs.relaxed);
  });

  it('should detect accessibility violations', async () => {
    const { container } = render(
      <div>
        <img src="/test.jpg" /> {/* Missing alt text */}
      </div>
    );
    
    // This should throw due to missing alt text
    await expect(testA11y(container, a11yConfigs.strict)).rejects.toThrow();
  });
});