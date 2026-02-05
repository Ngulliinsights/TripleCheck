import { test, expect } from '..\..\src\shared\test-utils\index';
import { takeVisualScreenshot } from './helpers/visual-test-utils';

/**
 * Visual Testing Setup and Verification
 * 
 * Basic tests to verify visual testing framework is working correctly
 */

test.describe('Visual Testing Setup', () => {
  
  test('Visual testing framework is working', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/TripleCheck|Home/i);
    
    // Take a basic screenshot to verify visual testing works
    await takeVisualScreenshot(page, {
      name: 'setup-verification',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });
  });

  test('Screenshot comparison is working', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of a specific element
    const header = page.locator('header, nav, [data-testid="navigation"]').first();
    
    if (await header.isVisible()) {
      await takeVisualScreenshot(page, {
        name: 'header-element',
        element: header
      });
    } else {
      // Fallback to body if no header found
      await takeVisualScreenshot(page, {
        name: 'page-body',
        element: page.locator('body'),
        clip: { x: 0, y: 0, width: 1200, height: 400 }
      });
    }
  });

  test('Multiple viewport sizes work', async ({ page }) => {
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await takeVisualScreenshot(page, {
        name: `viewport-${viewport.name}`,
        fullPage: false,
        clip: { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 800) }
      });
    }
  });

  test('Animation disabling works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test with animations disabled (default)
    await takeVisualScreenshot(page, {
      name: 'animations-disabled',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 },
      animations: 'disabled'
    });
    
    // Test with animations allowed
    await takeVisualScreenshot(page, {
      name: 'animations-allowed',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 },
      animations: 'allow'
    });
  });

  test('Element masking works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create some elements to mask (timestamps, dynamic content)
    const maskElements = [
      page.locator('time, [data-testid="timestamp"]'),
      page.locator('.timestamp, .live-indicator')
    ];
    
    await takeVisualScreenshot(page, {
      name: 'with-masking',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 },
      mask: maskElements
    });
  });

  test('Error handling works', async ({ page }) => {
    // Test with a non-existent page
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    // Should capture 404 page or error state
    await takeVisualScreenshot(page, {
      name: 'error-page-404',
      fullPage: true
    });
  });

  test('Form elements are captured correctly', async ({ page }) => {
    // Try to find a page with forms
    const formPages = ['/contact', '/auth/login', '/auth/register'];
    
    for (const formPage of formPages) {
      try {
        await page.goto(formPage);
        await page.waitForLoadState('networkidle');
        
        const form = page.locator('form').first();
        if (await form.isVisible()) {
          await takeVisualScreenshot(page, {
            name: `form-${formPage.replace(/\//g, '-')}`,
            element: form
          });
          break; // Found a form, no need to check other pages
        }
      } catch (error) {
        // Page might not exist, continue to next
        continue;
      }
    }
  });

  test('Button states can be captured', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const button = page.locator('button, [role="button"]').first();
    
    if (await button.isVisible()) {
      // Normal state
      await takeVisualScreenshot(page, {
        name: 'button-normal',
        element: button
      });
      
      // Hover state
      await button.hover();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'button-hover',
        element: button,
        animations: 'disabled'
      });
      
      // Focus state
      await button.focus();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'button-focus',
        element: button,
        animations: 'disabled'
      });
    }
  });

  test('Loading states can be captured', async ({ page }) => {
    // Slow down network to capture loading states
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    await page.goto('/properties');
    
    // Try to capture loading state
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
    
    if (await loadingIndicator.isVisible()) {
      await takeVisualScreenshot(page, {
        name: 'loading-state',
        element: loadingIndicator
      });
    }
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.unroute('**/api/**');
    
    // Capture loaded state
    await takeVisualScreenshot(page, {
      name: 'loaded-state',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
  });
});