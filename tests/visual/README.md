# Visual Regression Testing

This directory contains visual regression tests that ensure UI consistency across browsers, viewports, and application states.

## Overview

Visual regression testing captures screenshots of UI components and pages, then compares them against baseline images to detect unintended visual changes. This helps catch:

- Layout regressions
- Styling issues
- Cross-browser inconsistencies
- Responsive design problems
- Animation and transition issues

## Test Structure

```
tests/visual/
├── components.visual.test.ts    # UI component visual tests
├── layouts.visual.test.ts       # Page layout visual tests
├── animations.visual.test.ts    # Animation and transition tests
├── helpers/
│   └── visual-test-utils.ts     # Visual testing utilities
├── visual.config.ts             # Playwright configuration for visual tests
├── screenshots-baseline/        # Baseline screenshots (auto-generated)
└── README.md                    # This file
```

## Running Visual Tests

### Basic Commands

```bash
# Run all visual tests
npm run test:visual

# Update baseline screenshots (when changes are expected)
npm run test:visual:update

# Run tests in headed mode (show browser)
npm run test:visual:headed

# Run tests in debug mode
npm run test:visual:debug
```

### Browser-Specific Tests

```bash
# Test on specific browsers
npm run test:visual:chrome
npm run test:visual:firefox
npm run test:visual:safari

# Test on mobile devices
npm run test:visual:mobile
npm run test:visual:tablet
```

### Test Categories

```bash
# Test specific categories
npm run test:visual:components    # UI components only
npm run test:visual:layouts       # Page layouts only
npm run test:visual:animations    # Animations and transitions
```

### Setup and Maintenance

```bash
# Initial setup (install browsers)
npm run test:visual:setup

# Clean test artifacts
npm run test:visual:clean
```

## Test Configuration

Visual tests are configured in `visual.config.ts` with the following settings:

- **Browsers**: Chrome, Firefox, Safari, Edge
- **Viewports**: Desktop (1920x1080), Tablet (1024x768), Mobile (375x667)
- **Threshold**: 20% pixel difference tolerance
- **Animations**: Disabled by default for consistent screenshots
- **Timeout**: 60 seconds for complex pages

## Writing Visual Tests

### Basic Visual Test

```typescript
import { test } from '@playwright/test';
import { takeVisualScreenshot } from './helpers/visual-test-utils';

test('Component Visual Test', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await takeVisualScreenshot(page, {
    name: 'homepage',
    fullPage: true
  });
});
```

### Component State Testing

```typescript
import { testComponentStates } from './helpers/visual-test-utils';

test('Button States', async ({ page }) => {
  await page.goto('/');
  
  await testComponentStates(page, {
    selector: 'button.primary',
    name: 'primary-button',
    states: [
      {
        name: 'default',
        setup: async () => {}
      },
      {
        name: 'hover',
        setup: async (page) => {
          await page.locator('button.primary').hover();
        }
      }
    ]
  });
});
```

### Responsive Testing

```typescript
import { testResponsiveDesign, COMMON_VIEWPORTS } from './helpers/visual-test-utils';

test('Responsive Layout', async ({ page }) => {
  await testResponsiveDesign(page, {
    baseName: 'homepage-responsive',
    url: '/',
    viewports: COMMON_VIEWPORTS.mobile
  });
});
```

## Best Practices

### 1. Stable Screenshots

- Wait for `networkidle` before taking screenshots
- Disable animations with `animations: 'disabled'`
- Mask dynamic content (timestamps, counters)
- Use consistent test data

### 2. Meaningful Test Names

```typescript
// Good
await takeVisualScreenshot(page, {
  name: 'property-card-hover-state'
});

// Bad
await takeVisualScreenshot(page, {
  name: 'test1'
});
```

### 3. Mask Dynamic Content

```typescript
import { getMaskSelectors } from './helpers/visual-test-utils';

await takeVisualScreenshot(page, {
  name: 'homepage',
  mask: getMaskSelectors(page) // Masks timestamps, counters, etc.
});
```

### 4. Test Multiple States

```typescript
// Test different component states
const states = ['empty', 'loading', 'error', 'success'];
for (const state of states) {
  await setupState(page, state);
  await takeVisualScreenshot(page, {
    name: `form-${state}-state`
  });
}
```

## Handling Test Failures

### 1. Review Visual Diffs

When tests fail, Playwright generates visual diffs showing:
- Expected (baseline) image
- Actual (current) image
- Diff highlighting changes

View the HTML report:
```bash
npx playwright show-report test-results/visual-report
```

### 2. Update Baselines

If changes are intentional, update baselines:
```bash
npm run test:visual:update
```

### 3. Debug Issues

For debugging visual issues:
```bash
# Run in headed mode to see browser
npm run test:visual:headed

# Run in debug mode for step-by-step execution
npm run test:visual:debug

# Run specific test
npm run test:visual -- --test "Button States"
```

## CI/CD Integration

Visual tests can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run Visual Tests
  run: npm run test:visual

- name: Upload Visual Test Results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: visual-test-results
    path: test-results/visual-report/
```

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Usually caused by animations or dynamic content
   - Solution: Disable animations, mask dynamic content

2. **Font Rendering Differences**: Different OS/browsers render fonts differently
   - Solution: Use web fonts, set font loading strategy

3. **Timing Issues**: Screenshots taken before content loads
   - Solution: Wait for `networkidle` or specific elements

4. **Large Diffs**: Small changes causing large visual differences
   - Solution: Adjust threshold, use element-specific screenshots

### Performance Tips

1. **Parallel Execution**: Use multiple workers for faster execution
2. **Selective Testing**: Run only changed components in development
3. **Baseline Management**: Keep baselines in version control
4. **Cleanup**: Regularly clean old test artifacts

## Utilities Reference

### takeVisualScreenshot(page, options)

Main function for taking visual screenshots with comparison.

**Options:**
- `name`: Screenshot filename
- `fullPage`: Take full page screenshot
- `element`: Screenshot specific element
- `mask`: Array of elements to mask
- `threshold`: Custom threshold (0-1)
- `animations`: 'disabled' | 'allow'

### testComponentStates(page, options)

Test component across different states.

**Options:**
- `selector`: Component CSS selector
- `name`: Base name for screenshots
- `states`: Array of state configurations

### testResponsiveDesign(page, options)

Test responsive design across viewports.

**Options:**
- `baseName`: Base name for screenshots
- `url`: Page URL to test
- `viewports`: Array of viewport configurations

### Common Viewport Configurations

```typescript
COMMON_VIEWPORTS = {
  mobile: [
    { name: 'mobile-portrait', width: 375, height: 667 },
    { name: 'mobile-landscape', width: 667, height: 375 }
  ],
  tablet: [
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 }
  ],
  desktop: [
    { name: 'desktop-small', width: 1366, height: 768 },
    { name: 'desktop-large', width: 1920, height: 1080 }
  ]
}
```

## Contributing

When adding new visual tests:

1. Follow naming conventions
2. Add appropriate documentation
3. Test across multiple browsers
4. Include responsive variants
5. Update this README if needed

For questions or issues, refer to the [Playwright Visual Testing Documentation](https://playwright.dev/docs/test-screenshots).