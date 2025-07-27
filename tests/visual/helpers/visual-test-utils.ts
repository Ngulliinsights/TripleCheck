import { Page, expect, Locator } from '@playwright/test';

/**
 * Visual Testing Utilities
 * 
 * Helper functions for visual regression testing with screenshot comparison
 */

export interface VisualTestOptions {
  /** Name for the screenshot file */
  name: string;
  
  /** Whether to take a full page screenshot */
  fullPage?: boolean;
  
  /** Specific element to screenshot */
  element?: Locator;
  
  /** Areas to mask (hide) in the screenshot */
  mask?: Locator[];
  
  /** Custom threshold for this test (0-1) */
  threshold?: number;
  
  /** Animation handling */
  animations?: 'disabled' | 'allow';
  
  /** Wait for specific conditions before screenshot */
  waitFor?: 'networkidle' | 'domcontentloaded' | 'load';
  
  /** Custom clip area */
  clip?: { x: number; y: number; width: number; height: number };
}

export interface ResponsiveTestOptions {
  /** Base name for screenshots */
  baseName: string;
  
  /** Viewports to test */
  viewports: Array<{
    name: string;
    width: number;
    height: number;
  }>;
  
  /** Page URL to test */
  url: string;
  
  /** Additional options */
  options?: Omit<VisualTestOptions, 'name'>;
}

export interface ComponentTestOptions {
  /** Component selector */
  selector: string;
  
  /** Component name for screenshot */
  name: string;
  
  /** Props or states to test */
  states?: Array<{
    name: string;
    setup: (page: Page) => Promise<void>;
  }>;
  
  /** Additional options */
  options?: Omit<VisualTestOptions, 'name' | 'element'>;
}

/**
 * Take a visual screenshot with comparison
 */
export async function takeVisualScreenshot(
  page: Page, 
  options: VisualTestOptions
): Promise<void> {
  // Wait for specified condition
  if (options.waitFor) {
    await page.waitForLoadState(options.waitFor);
  }
  
  // Disable animations if requested
  if (options.animations === 'disabled') {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  }
  
  // Wait a bit for any remaining animations to settle
  await page.waitForTimeout(500);
  
  const screenshotOptions: any = {
    animations: options.animations || 'disabled',
    threshold: options.threshold || 0.2,
  };
  
  if (options.fullPage) {
    screenshotOptions.fullPage = true;
  }
  
  if (options.mask) {
    screenshotOptions.mask = options.mask;
  }
  
  if (options.clip) {
    screenshotOptions.clip = options.clip;
  }
  
  // Take screenshot of specific element or full page
  if (options.element) {
    await expect(options.element).toHaveScreenshot(`${options.name}.png`, screenshotOptions);
  } else {
    await expect(page).toHaveScreenshot(`${options.name}.png`, screenshotOptions);
  }
}

/**
 * Test component across different states
 */
export async function testComponentStates(
  page: Page,
  options: ComponentTestOptions
): Promise<void> {
  const component = page.locator(options.selector);
  
  // Wait for component to be visible
  await expect(component).toBeVisible();
  
  if (options.states && options.states.length > 0) {
    // Test each state
    for (const state of options.states) {
      await state.setup(page);
      await page.waitForTimeout(300); // Allow state to settle
      
      await takeVisualScreenshot(page, {
        name: `${options.name}-${state.name}`,
        element: component,
        ...options.options
      });
    }
  } else {
    // Test default state
    await takeVisualScreenshot(page, {
      name: options.name,
      element: component,
      ...options.options
    });
  }
}

/**
 * Test responsive design across viewports
 */
export async function testResponsiveDesign(
  page: Page,
  options: ResponsiveTestOptions
): Promise<void> {
  for (const viewport of options.viewports) {
    // Set viewport size
    await page.setViewportSize({ 
      width: viewport.width, 
      height: viewport.height 
    });
    
    // Navigate to page
    await page.goto(options.url);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await takeVisualScreenshot(page, {
      name: `${options.baseName}-${viewport.name}`,
      fullPage: true,
      ...options.options
    });
  }
}

/**
 * Test theme switching (light/dark mode)
 */
export async function testThemeSwitching(
  page: Page,
  url: string,
  baseName: string
): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  // Test light theme (default)
  await takeVisualScreenshot(page, {
    name: `${baseName}-light-theme`,
    fullPage: true,
    waitFor: 'networkidle'
  });
  
  // Switch to dark theme if available
  const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Theme")');
  
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(500); // Allow theme transition
    
    await takeVisualScreenshot(page, {
      name: `${baseName}-dark-theme`,
      fullPage: true,
      animations: 'disabled'
    });
  }
}

/**
 * Test form states (empty, filled, error, success)
 */
export async function testFormStates(
  page: Page,
  formSelector: string,
  formName: string
): Promise<void> {
  const form = page.locator(formSelector);
  await expect(form).toBeVisible();
  
  // Empty state
  await takeVisualScreenshot(page, {
    name: `${formName}-empty`,
    element: form
  });
  
  // Filled state
  const inputs = form.locator('input, textarea, select');
  const inputCount = await inputs.count();
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const type = await input.getAttribute('type');
    const tagName = await input.evaluate(el => el.tagName.toLowerCase());
    
    if (type === 'email') {
      await input.fill('test@example.com');
    } else if (type === 'password') {
      await input.fill('password123');
    } else if (type === 'tel') {
      await input.fill('+254700123456');
    } else if (tagName === 'select') {
      const options = input.locator('option');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await input.selectOption({ index: 1 });
      }
    } else if (tagName === 'textarea') {
      await input.fill('This is a test message with some content.');
    } else {
      await input.fill('Test Value');
    }
  }
  
  await takeVisualScreenshot(page, {
    name: `${formName}-filled`,
    element: form
  });
  
  // Try to trigger validation errors
  await form.locator('input').first().fill('');
  const submitButton = form.locator('button[type="submit"], button:has-text("Submit")');
  
  if (await submitButton.isVisible()) {
    await submitButton.click();
    await page.waitForTimeout(500); // Allow validation to show
    
    await takeVisualScreenshot(page, {
      name: `${formName}-validation-errors`,
      element: form
    });
  }
}

/**
 * Test loading states
 */
export async function testLoadingStates(
  page: Page,
  url: string,
  baseName: string
): Promise<void> {
  // Slow down network to capture loading states
  await page.route('**/api/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    route.continue();
  });
  
  await page.goto(url);
  
  // Capture loading state
  const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
  
  if (await loadingIndicator.isVisible()) {
    await takeVisualScreenshot(page, {
      name: `${baseName}-loading`,
      fullPage: true
    });
  }
  
  // Wait for content to load and capture loaded state
  await page.waitForLoadState('networkidle');
  await page.unroute('**/api/**');
  
  await takeVisualScreenshot(page, {
    name: `${baseName}-loaded`,
    fullPage: true
  });
}

/**
 * Test error states
 */
export async function testErrorStates(
  page: Page,
  url: string,
  baseName: string
): Promise<void> {
  // Mock API errors
  await page.route('**/api/**', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' })
    });
  });
  
  await page.goto(url);
  await page.waitForTimeout(2000); // Allow error to show
  
  await takeVisualScreenshot(page, {
    name: `${baseName}-error`,
    fullPage: true
  });
  
  // Restore normal API behavior
  await page.unroute('**/api/**');
}

/**
 * Test empty states
 */
export async function testEmptyStates(
  page: Page,
  url: string,
  baseName: string
): Promise<void> {
  // Mock empty API responses
  await page.route('**/api/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0 })
    });
  });
  
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  await takeVisualScreenshot(page, {
    name: `${baseName}-empty`,
    fullPage: true
  });
  
  // Restore normal API behavior
  await page.unroute('**/api/**');
}

/**
 * Common viewport configurations for responsive testing
 */
export const COMMON_VIEWPORTS = {
  mobile: [
    { name: 'mobile-portrait', width: 375, height: 667 },
    { name: 'mobile-landscape', width: 667, height: 375 },
  ],
  tablet: [
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
  ],
  desktop: [
    { name: 'desktop-small', width: 1366, height: 768 },
    { name: 'desktop-large', width: 1920, height: 1080 },
    { name: 'desktop-wide', width: 2560, height: 1440 },
  ]
};

/**
 * Get all viewports for comprehensive testing
 */
export function getAllViewports() {
  return [
    ...COMMON_VIEWPORTS.mobile,
    ...COMMON_VIEWPORTS.tablet,
    ...COMMON_VIEWPORTS.desktop
  ];
}

/**
 * Mask dynamic content that changes between test runs
 */
export function getMaskSelectors(page: Page) {
  return [
    // Timestamps
    page.locator('[data-testid="timestamp"], .timestamp, time'),
    
    // Counters and dynamic numbers
    page.locator('[data-testid="counter"], .counter'),
    
    // User avatars (if they contain dynamic content)
    page.locator('[data-testid="avatar"] img'),
    
    // Live data indicators
    page.locator('[data-testid="live-indicator"], .live-indicator'),
    
    // Random IDs or generated content
    page.locator('[data-testid="random-id"], .random-content'),
  ];
}