import { test } from '..\..\src\shared\test-utils\index';
import { takeVisualScreenshot, getMaskSelectors } from './helpers/visual-test-utils';

/**
 * Visual Regression Tests for Animations and Transitions
 * 
 * Tests visual consistency of animations, transitions, and interactive states
 */

test.describe('Animation and Transition Visual Tests', () => {
  
  test('Page Transition Animations', async ({ page }) => {
    // Start from homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture initial state
    await takeVisualScreenshot(page, {
      name: 'page-transition-start',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
    
    // Navigate to another page and capture transition
    const navigationLink = page.locator('a[href="/properties"], a:has-text("Properties")').first();
    if (await navigationLink.isVisible()) {
      await navigationLink.click();
      
      // Capture during transition (if any loading state exists)
      await page.waitForTimeout(100);
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, .page-transition');
      if (await loadingIndicator.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'page-transition-loading',
          fullPage: true
        });
      }
      
      // Capture final state
      await page.waitForLoadState('networkidle');
      await takeVisualScreenshot(page, {
        name: 'page-transition-end',
        fullPage: true,
        mask: getMaskSelectors(page)
      });
    }
  });

  test('Modal Animation States', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find modal triggers
    const modalTriggers = page.locator('button:has-text("Login"), button:has-text("Contact"), button:has-text("Sign Up")');
    const triggerCount = await modalTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = modalTriggers.first();
      
      // Before modal opens
      await takeVisualScreenshot(page, {
        name: 'modal-before-open',
        fullPage: true
      });
      
      // Click to open modal
      await trigger.click();
      
      // Capture during animation (early state)
      await page.waitForTimeout(100);
      await takeVisualScreenshot(page, {
        name: 'modal-opening',
        fullPage: true,
        animations: 'allow'
      });
      
      // Capture fully opened modal
      await page.waitForTimeout(500);
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
      if (await modal.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'modal-fully-open',
          fullPage: true,
          animations: 'disabled'
        });
        
        // Test modal close animation
        const closeButton = modal.locator('button:has-text("Close"), [data-testid="close-modal"], .modal-close');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          
          // Capture during close animation
          await page.waitForTimeout(100);
          await takeVisualScreenshot(page, {
            name: 'modal-closing',
            fullPage: true,
            animations: 'allow'
          });
          
          // Capture after modal is closed
          await page.waitForTimeout(500);
          await takeVisualScreenshot(page, {
            name: 'modal-closed',
            fullPage: true
          });
        }
      }
    }
  });

  test('Dropdown Animation States', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find dropdown triggers
    const dropdownTriggers = page.locator('[data-testid="dropdown-trigger"], .dropdown-trigger, button:has([data-testid="chevron-down"])');
    const triggerCount = await dropdownTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = dropdownTriggers.first();
      
      // Closed state
      await takeVisualScreenshot(page, {
        name: 'dropdown-closed',
        element: trigger
      });
      
      // Click to open
      await trigger.click();
      
      // Capture during opening animation
      await page.waitForTimeout(50);
      await takeVisualScreenshot(page, {
        name: 'dropdown-opening',
        element: page.locator('[data-testid="dropdown-menu"], .dropdown-menu').first(),
        animations: 'allow'
      });
      
      // Fully opened state
      await page.waitForTimeout(300);
      const dropdown = page.locator('[data-testid="dropdown-menu"], .dropdown-menu').first();
      if (await dropdown.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'dropdown-open',
          element: dropdown,
          animations: 'disabled'
        });
      }
    }
  });

  test('Button Hover and Click Animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const button = buttons.first();
      
      // Normal state
      await takeVisualScreenshot(page, {
        name: 'button-animation-normal',
        element: button
      });
      
      // Hover state (with potential animation)
      await button.hover();
      await page.waitForTimeout(200); // Allow hover animation to complete
      
      await takeVisualScreenshot(page, {
        name: 'button-animation-hover',
        element: button,
        animations: 'disabled'
      });
      
      // Active/pressed state
      await page.mouse.down();
      await page.waitForTimeout(100);
      
      await takeVisualScreenshot(page, {
        name: 'button-animation-active',
        element: button,
        animations: 'disabled'
      });
      
      await page.mouse.up();
      
      // Focus state
      await button.focus();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'button-animation-focus',
        element: button,
        animations: 'disabled'
      });
    }
  });

  test('Card Hover Animations', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const cards = page.locator('[data-testid="property-card"], .property-card, .card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const card = cards.first();
      
      // Normal state
      await takeVisualScreenshot(page, {
        name: 'card-animation-normal',
        element: card
      });
      
      // Hover state with animation
      await card.hover();
      await page.waitForTimeout(300); // Allow hover animation
      
      await takeVisualScreenshot(page, {
        name: 'card-animation-hover',
        element: card,
        animations: 'disabled'
      });
      
      // Test focus state if card is focusable
      if (await card.locator('a, button').count() > 0) {
        await card.locator('a, button').first().focus();
        await page.waitForTimeout(200);
        
        await takeVisualScreenshot(page, {
          name: 'card-animation-focus',
          element: card,
          animations: 'disabled'
        });
      }
    }
  });

  test('Form Input Animations', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const input = inputs.first();
      
      // Empty state
      await takeVisualScreenshot(page, {
        name: 'input-animation-empty',
        element: input
      });
      
      // Focus state (may have animation)
      await input.focus();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'input-animation-focus',
        element: input,
        animations: 'disabled'
      });
      
      // Typing state
      await input.type('Test input');
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'input-animation-filled',
        element: input,
        animations: 'disabled'
      });
      
      // Blur state
      await input.blur();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'input-animation-blur',
        element: input,
        animations: 'disabled'
      });
    }
  });

  test('Navigation Menu Animations', async ({ page }) => {
    // Test on mobile viewport to see mobile menu animations
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button:has-text("Menu"), .mobile-menu-button');
    
    if (await mobileMenuButton.isVisible()) {
      // Menu closed
      await takeVisualScreenshot(page, {
        name: 'mobile-menu-closed',
        fullPage: true
      });
      
      // Click to open menu
      await mobileMenuButton.click();
      
      // Capture during opening animation
      await page.waitForTimeout(100);
      await takeVisualScreenshot(page, {
        name: 'mobile-menu-opening',
        fullPage: true,
        animations: 'allow'
      });
      
      // Menu fully open
      await page.waitForTimeout(400);
      await takeVisualScreenshot(page, {
        name: 'mobile-menu-open',
        fullPage: true,
        animations: 'disabled'
      });
      
      // Close menu
      const closeButton = page.locator('[data-testid="close-menu"], button:has-text("Close")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await mobileMenuButton.click();
      }
      
      // Capture during closing animation
      await page.waitForTimeout(100);
      await takeVisualScreenshot(page, {
        name: 'mobile-menu-closing',
        fullPage: true,
        animations: 'allow'
      });
    }
  });

  test('Loading Spinner Animations', async ({ page }) => {
    // Slow down API calls to capture loading states
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/properties');
    
    // Capture loading spinner
    const loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    if (await loadingSpinner.isVisible()) {
      // Capture spinner in motion (allow animations)
      await takeVisualScreenshot(page, {
        name: 'loading-spinner-animated',
        element: loadingSpinner,
        animations: 'allow'
      });
      
      // Capture spinner static (disabled animations)
      await takeVisualScreenshot(page, {
        name: 'loading-spinner-static',
        element: loadingSpinner,
        animations: 'disabled'
      });
    }
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    await page.unroute('**/api/**');
    
    // Capture loaded state
    await takeVisualScreenshot(page, {
      name: 'content-loaded',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
  });

  test('Scroll Animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture initial state (top of page)
    await takeVisualScreenshot(page, {
      name: 'scroll-animation-top',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    
    // Scroll down to trigger any scroll animations
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500); // Allow scroll animations
    
    await takeVisualScreenshot(page, {
      name: 'scroll-animation-middle',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      animations: 'disabled'
    });
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    await takeVisualScreenshot(page, {
      name: 'scroll-animation-bottom',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      animations: 'disabled'
    });
  });

  test('Tab Animation States', async ({ page }) => {
    // Look for tab components
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const tabs = page.locator('[role="tab"], .tab, [data-testid="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      // First tab active
      await takeVisualScreenshot(page, {
        name: 'tabs-first-active',
        element: page.locator('[role="tablist"], .tabs, [data-testid="tabs"]').first()
      });
      
      // Click second tab
      await tabs.nth(1).click();
      await page.waitForTimeout(300); // Allow tab transition
      
      await takeVisualScreenshot(page, {
        name: 'tabs-second-active',
        element: page.locator('[role="tablist"], .tabs, [data-testid="tabs"]').first(),
        animations: 'disabled'
      });
      
      // Test tab content transition if visible
      const tabPanels = page.locator('[role="tabpanel"], .tab-panel, [data-testid="tab-panel"]');
      if (await tabPanels.count() > 0) {
        await takeVisualScreenshot(page, {
          name: 'tab-content-transition',
          element: tabPanels.first(),
          animations: 'disabled'
        });
      }
    }
  });

  test('Tooltip Animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for elements that might have tooltips
    const tooltipTriggers = page.locator('[title], [data-tooltip], [aria-describedby]');
    const triggerCount = await tooltipTriggers.count();
    
    if (triggerCount > 0) {
      const trigger = tooltipTriggers.first();
      
      // Before hover
      await takeVisualScreenshot(page, {
        name: 'tooltip-before-hover',
        element: trigger
      });
      
      // Hover to show tooltip
      await trigger.hover();
      await page.waitForTimeout(300); // Allow tooltip animation
      
      // Look for tooltip element
      const tooltip = page.locator('[role="tooltip"], .tooltip, [data-testid="tooltip"]');
      if (await tooltip.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'tooltip-visible',
          element: tooltip,
          animations: 'disabled'
        });
      } else {
        // Capture area around trigger in case tooltip is positioned nearby
        await takeVisualScreenshot(page, {
          name: 'tooltip-area',
          clip: { x: 0, y: 0, width: 400, height: 300 },
          animations: 'disabled'
        });
      }
    }
  });
});