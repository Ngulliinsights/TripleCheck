# Accessibility Testing Guide

This guide provides comprehensive instructions for implementing and maintaining accessibility testing in the application.

## Overview

Our accessibility testing strategy follows the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards and includes:

- **Automated testing** with axe-core
- **Keyboard navigation testing**
- **Screen reader compatibility testing**
- **ARIA attributes validation**
- **Focus management testing**
- **Color contrast validation**
- **Form accessibility testing**

## Testing Utilities

### Core Functions

#### `testA11y(container, config?)`
Runs automated accessibility tests using axe-core.

```typescript
import { testA11y, a11yConfigs } from '../test-utils/accessibility';

// Basic usage
await testA11y(container);

// With specific configuration
await testA11y(container, a11yConfigs.strict);
```

#### `testKeyboardAccessibility(container, options)`
Tests keyboard navigation and focus management.

```typescript
await testKeyboardAccessibility(container, {
  expectFocusable: ['button', 'a', 'input'],
  expectNotFocusable: ['[tabindex="-1"]'],
  testTabOrder: true
});
```

#### `testAriaAttributes(container, expectations)`
Validates ARIA attributes and roles.

```typescript
testAriaAttributes(container, {
  hasRole: [{ selector: 'button', role: 'menuitem' }],
  hasAriaLabel: [{ selector: 'button', label: 'Close dialog' }],
  hasAriaExpanded: [{ selector: 'button', expanded: false }]
});
```

#### `testFormAccessibility(container, options)`
Tests form accessibility including labels and error associations.

```typescript
await testFormAccessibility(container, {
  expectLabels: ['#email', '#password'],
  expectRequired: ['#email'],
  expectErrorMessages: ['#email-error']
});
```

#### `testScreenReaderCompatibility(container, options)`
Tests screen reader compatibility including headings and landmarks.

```typescript
testScreenReaderCompatibility(container, {
  expectHeadings: true,
  expectLandmarks: true,
  expectAltText: true
});
```

#### `runFullAccessibilityTest(container, options)`
Runs comprehensive accessibility test suite.

```typescript
await runFullAccessibilityTest(container, {
  skipColorContrast: true, // Skip in test environment
  skipKeyboardNav: false,
  skipScreenReader: false,
  config: 'strict'
});
```

## Configuration Options

### Available Configurations

- **`strict`**: Production-ready components with full WCAG compliance
- **`relaxed`**: Development/testing with some flexibility
- **`forms`**: Specialized for form components
- **`navigation`**: Specialized for navigation components
- **`content`**: Specialized for content components

### Custom Configuration

```typescript
const customConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'keyboard-navigation': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
};

await testA11y(container, customConfig);
```

## Testing Patterns

### Component Testing Pattern

```typescript
describe('Component Accessibility', () => {
  it('passes automated accessibility tests', async () => {
    const { container } = render(<Component />);
    await testA11y(container, a11yConfigs.strict);
  });

  it('supports keyboard navigation', async () => {
    const { container } = render(<Component />);
    await testKeyboardAccessibility(container, {
      expectFocusable: ['button', 'a'],
      testTabOrder: true
    });
  });

  it('has proper ARIA attributes', () => {
    const { container } = render(<Component />);
    testAriaAttributes(container, {
      hasRole: [{ selector: 'button', role: 'button' }],
      hasAriaLabel: [{ selector: 'button' }]
    });
  });

  it('supports screen readers', () => {
    const { container } = render(<Component />);
    testScreenReaderCompatibility(container);
  });
});
```

### Form Testing Pattern

```typescript
describe('Form Accessibility', () => {
  it('has proper form structure', async () => {
    const { container } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
        <button type="submit">Submit</button>
      </form>
    );

    await testFormAccessibility(container, {
      expectLabels: ['#email'],
      expectRequired: ['#email']
    });
  });
});
```

### Navigation Testing Pattern

```typescript
describe('Navigation Accessibility', () => {
  it('has proper navigation structure', async () => {
    const { container } = render(
      <nav role="navigation" aria-label="Main navigation">
        <ul>
          <li><a href="/home">Home</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
    );

    await testA11y(container, a11yConfigs.navigation);
    
    testAriaAttributes(container, {
      hasRole: [{ selector: 'nav', role: 'navigation' }],
      hasAriaLabel: [{ selector: 'nav', label: 'Main navigation' }]
    });
  });
});
```

## Best Practices

### 1. Semantic HTML

Use semantic HTML elements whenever possible:

```typescript
// Good
<button onClick={handleClick}>Click me</button>
<nav role="navigation">...</nav>
<main>...</main>

// Avoid
<div onClick={handleClick}>Click me</div>
<div className="navigation">...</div>
<div className="main-content">...</div>
```

### 2. Proper Labels

Ensure all interactive elements have accessible names:

```typescript
// Good
<button aria-label="Close dialog">×</button>
<input aria-label="Search" placeholder="Search..." />

// Good - with visible label
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### 3. ARIA Attributes

Use ARIA attributes to enhance accessibility:

```typescript
// Dropdown menu
<button 
  aria-haspopup="menu"
  aria-expanded={isOpen}
  aria-controls="menu-items"
>
  Menu
</button>
<ul id="menu-items" role="menu" hidden={!isOpen}>
  <li role="menuitem">Item 1</li>
</ul>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### 4. Focus Management

Manage focus properly in interactive components:

```typescript
// Modal focus trap
useEffect(() => {
  if (isOpen) {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();
  }
}, [isOpen]);
```

### 5. Keyboard Support

Implement proper keyboard support:

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      handleActivate();
      break;
    case 'Escape':
      handleClose();
      break;
    case 'ArrowDown':
      handleNextItem();
      break;
    case 'ArrowUp':
      handlePreviousItem();
      break;
  }
};
```

## Common Issues and Solutions

### 1. Missing Alt Text

**Issue**: Images without alt attributes
**Solution**: Always provide alt text or use `alt=""` for decorative images

```typescript
// Content images
<img src="/photo.jpg" alt="Description of the photo" />

// Decorative images
<img src="/decoration.jpg" alt="" role="presentation" />
```

### 2. Unlabeled Form Controls

**Issue**: Form inputs without labels
**Solution**: Use explicit labels or aria-label

```typescript
// Explicit label
<label htmlFor="search">Search</label>
<input id="search" type="search" />

// ARIA label
<input type="search" aria-label="Search products" />
```

### 3. Poor Focus Indicators

**Issue**: Invisible or poor focus indicators
**Solution**: Ensure focus indicators are visible and meet contrast requirements

```css
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### 4. Missing Heading Hierarchy

**Issue**: Skipped heading levels or missing headings
**Solution**: Use proper heading hierarchy

```typescript
// Good
<h1>Page Title</h1>
<section>
  <h2>Section Title</h2>
  <h3>Subsection Title</h3>
</section>

// Avoid skipping levels
<h1>Page Title</h1>
<h3>Subsection Title</h3> // Skip h2
```

### 5. Inaccessible Custom Components

**Issue**: Custom components that don't follow accessibility patterns
**Solution**: Implement proper ARIA patterns

```typescript
// Custom dropdown
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
  <input aria-autocomplete="list" aria-controls="options" />
  <ul id="options" role="listbox">
    <li role="option">Option 1</li>
  </ul>
</div>
```

## Testing in CI/CD

### GitHub Actions Integration

```yaml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:accessibility
      - run: npm run test:e2e:accessibility
```

### Test Scripts

Add these scripts to package.json:

```json
{
  "scripts": {
    "test:accessibility": "vitest run --testNamePattern='accessibility'",
    "test:a11y:watch": "vitest --testNamePattern='accessibility' --watch",
    "test:a11y:coverage": "vitest run --testNamePattern='accessibility' --coverage"
  }
}
```

## Reporting and Monitoring

### Test Results

The accessibility tests provide detailed reports including:

- Number of violations found
- Severity levels (critical, serious, moderate, minor)
- Specific elements that failed
- Suggested fixes

### Continuous Monitoring

Set up continuous monitoring with:

1. **Automated tests in CI/CD**
2. **Regular accessibility audits**
3. **User testing with assistive technologies**
4. **Performance monitoring for accessibility features**

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [axe-core](https://github.com/dequelabs/axe-core)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [Testing Library](https://testing-library.com/docs/guide-accessibility/)

### Browser Extensions
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- **NVDA** (Windows, free)
- **JAWS** (Windows, commercial)
- **VoiceOver** (macOS/iOS, built-in)
- **TalkBack** (Android, built-in)

## Troubleshooting

### Common Test Failures

1. **Color contrast failures**: Often occur in test environments - skip with `skipColorContrast: true`
2. **Missing labels**: Ensure all form controls have associated labels
3. **Focus management**: Verify tab order and focus trapping in modals
4. **ARIA attributes**: Check that ARIA attributes are correctly implemented

### Performance Issues

If tests are slow:
1. Use more specific selectors in `testKeyboardAccessibility`
2. Skip unnecessary tests with configuration options
3. Use `a11yConfigs.relaxed` for development testing

### False Positives

Some violations may be false positives:
1. Review the specific violation details
2. Consider if the pattern is actually accessible
3. Use custom axe rules if needed
4. Document exceptions with comments

## Contributing

When adding new accessibility tests:

1. Follow the established patterns
2. Include comprehensive test coverage
3. Document any custom configurations
4. Test with actual assistive technologies when possible
5. Update this guide with new patterns or utilities