import { test } from '..\..\src\shared\test-utils\index';
import { 
  takeVisualScreenshot, 
  testComponentStates, 
  testFormStates,
  getMaskSelectors,
  COMMON_VIEWPORTS
} from './helpers/visual-test-utils';

/**
 * Visual Regression Tests for UI Components
 * 
 * Tests visual consistency of major UI components across browsers and states
 */

test.describe('UI Components Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with components or use Storybook if available
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Navigation Component', async ({ page }) => {
    const navigation = page.locator('nav, [data-testid="navigation"]');
    
    await testComponentStates(page, {
      selector: 'nav, [data-testid="navigation"]',
      name: 'navigation',
      states: [
        {
          name: 'default',
          setup: async () => {
            // Default state - no additional setup needed
          }
        },
        {
          name: 'mobile-menu-open',
          setup: async (page) => {
            // Open mobile menu if it exists
            const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button:has-text("Menu")');
            if (await mobileMenuButton.isVisible()) {
              await mobileMenuButton.click();
              await page.waitForTimeout(300);
            }
          }
        }
      ],
      options: {
        mask: getMaskSelectors(page)
      }
    });
  });

  test('Hero Section', async ({ page }) => {
    await testComponentStates(page, {
      selector: '[data-testid="hero"], .hero, main section:first-child',
      name: 'hero-section',
      options: {
        fullPage: false,
        mask: getMaskSelectors(page)
      }
    });
  });

  test('Property Card Component', async ({ page }) => {
    // Navigate to properties page to see property cards
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    
    if (await propertyCard.isVisible()) {
      await testComponentStates(page, {
        selector: '[data-testid="property-card"]',
        name: 'property-card',
        states: [
          {
            name: 'default',
            setup: async () => {}
          },
          {
            name: 'hover',
            setup: async (page) => {
              await propertyCard.hover();
              await page.waitForTimeout(200);
            }
          }
        ]
      });
    }
  });

  test('Button Components', async ({ page }) => {
    // Test different button variants if they exist
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Primary button
      const primaryButton = page.locator('button.primary, .btn-primary, button[data-variant="primary"]').first();
      if (await primaryButton.isVisible()) {
        await testComponentStates(page, {
          selector: 'button.primary, .btn-primary, button[data-variant="primary"]',
          name: 'button-primary',
          states: [
            {
              name: 'default',
              setup: async () => {}
            },
            {
              name: 'hover',
              setup: async (page) => {
                await primaryButton.hover();
                await page.waitForTimeout(200);
              }
            },
            {
              name: 'focus',
              setup: async (page) => {
                await primaryButton.focus();
                await page.waitForTimeout(200);
              }
            }
          ]
        });
      }
      
      // Secondary button
      const secondaryButton = page.locator('button.secondary, .btn-secondary, button[data-variant="secondary"]').first();
      if (await secondaryButton.isVisible()) {
        await testComponentStates(page, {
          selector: 'button.secondary, .btn-secondary, button[data-variant="secondary"]',
          name: 'button-secondary'
        });
      }
    }
  });

  test('Form Components', async ({ page }) => {
    // Test contact form if available
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const contactForm = page.locator('form, [data-testid="contact-form"]');
    if (await contactForm.isVisible()) {
      await testFormStates(page, 'form, [data-testid="contact-form"]', 'contact-form');
    }
    
    // Test search form
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const searchForm = page.locator('[data-testid="search-form"], form:has(input[placeholder*="Search"])');
    if (await searchForm.isVisible()) {
      await testFormStates(page, '[data-testid="search-form"], form:has(input[placeholder*="Search"])', 'search-form');
    }
  });

  test('Footer Component', async ({ page }) => {
    await testComponentStates(page, {
      selector: 'footer, [data-testid="footer"]',
      name: 'footer',
      options: {
        mask: getMaskSelectors(page)
      }
    });
  });

  test('Loading Components', async ({ page }) => {
    // Test loading states by intercepting API calls
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    await page.goto('/properties');
    
    // Capture loading spinner if visible
    const loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    if (await loadingSpinner.isVisible()) {
      await takeVisualScreenshot(page, {
        name: 'loading-spinner',
        element: loadingSpinner
      });
    }
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.unroute('**/api/**');
  });

  test('Modal Components', async ({ page }) => {
    // Try to open a modal (login modal, contact modal, etc.)
    const modalTriggers = page.locator('button:has-text("Login"), button:has-text("Contact"), button:has-text("Sign Up")');
    const triggerCount = await modalTriggers.count();
    
    if (triggerCount > 0) {
      await modalTriggers.first().click();
      await page.waitForTimeout(500); // Allow modal animation
      
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
      if (await modal.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'modal-component',
          element: modal,
          animations: 'disabled'
        });
      }
    }
  });

  test('Dropdown Components', async ({ page }) => {
    // Test dropdown menus
    const dropdownTriggers = page.locator('[data-testid="dropdown-trigger"], button:has([data-testid="chevron-down"])');
    const triggerCount = await dropdownTriggers.count();
    
    if (triggerCount > 0) {
      // Closed state
      await takeVisualScreenshot(page, {
        name: 'dropdown-closed',
        element: dropdownTriggers.first()
      });
      
      // Open state
      await dropdownTriggers.first().click();
      await page.waitForTimeout(300);
      
      const dropdown = page.locator('[data-testid="dropdown-menu"], .dropdown-menu');
      if (await dropdown.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'dropdown-open',
          element: dropdown.first()
        });
      }
    }
  });

  test('Card Components', async ({ page }) => {
    // Test various card components
    const cards = page.locator('.card, [data-testid="card"], .property-card, .service-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      await testComponentStates(page, {
        selector: '.card, [data-testid="card"], .property-card, .service-card',
        name: 'card-component',
        states: [
          {
            name: 'default',
            setup: async () => {}
          },
          {
            name: 'hover',
            setup: async (page) => {
              await cards.first().hover();
              await page.waitForTimeout(200);
            }
          }
        ]
      });
    }
  });

  test('Input Components', async ({ page }) => {
    // Navigate to a page with form inputs
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const textInput = page.locator('input[type="text"]').first();
    if (await textInput.isVisible()) {
      await testComponentStates(page, {
        selector: 'input[type="text"]',
        name: 'text-input',
        states: [
          {
            name: 'empty',
            setup: async () => {}
          },
          {
            name: 'filled',
            setup: async (page) => {
              await textInput.fill('Sample text');
            }
          },
          {
            name: 'focus',
            setup: async (page) => {
              await textInput.focus();
              await page.waitForTimeout(200);
            }
          }
        ]
      });
    }
    
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await testComponentStates(page, {
        selector: 'input[type="email"]',
        name: 'email-input',
        states: [
          {
            name: 'empty',
            setup: async () => {}
          },
          {
            name: 'valid',
            setup: async (page) => {
              await emailInput.fill('test@example.com');
            }
          },
          {
            name: 'invalid',
            setup: async (page) => {
              await emailInput.fill('invalid-email');
              await emailInput.blur();
              await page.waitForTimeout(300);
            }
          }
        ]
      });
    }
  });

  test('Pagination Component', async ({ page }) => {
    // Navigate to a page with pagination
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    if (await pagination.isVisible()) {
      await takeVisualScreenshot(page, {
        name: 'pagination-component',
        element: pagination
      });
    }
  });

  test('Breadcrumb Component', async ({ page }) => {
    // Navigate to a deep page to see breadcrumbs
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    // Try to click on a property to get to a detail page
    const propertyLink = page.locator('[data-testid="property-card"] a, .property-card a').first();
    if (await propertyLink.isVisible()) {
      await propertyLink.click();
      await page.waitForLoadState('networkidle');
      
      const breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
      if (await breadcrumb.isVisible()) {
        await takeVisualScreenshot(page, {
          name: 'breadcrumb-component',
          element: breadcrumb
        });
      }
    }
  });

  test('Alert Components', async ({ page }) => {
    // Test different alert types if they exist
    const alerts = page.locator('.alert, [role="alert"], [data-testid="alert"]');
    const alertCount = await alerts.count();
    
    if (alertCount > 0) {
      for (let i = 0; i < Math.min(alertCount, 3); i++) {
        const alert = alerts.nth(i);
        const alertClass = await alert.getAttribute('class') || '';
        const alertType = alertClass.includes('error') ? 'error' : 
                         alertClass.includes('warning') ? 'warning' :
                         alertClass.includes('success') ? 'success' : 'info';
        
        await takeVisualScreenshot(page, {
          name: `alert-${alertType}`,
          element: alert
        });
      }
    }
  });
});

test.describe('Component Responsive Tests', () => {
  
  test('Navigation Responsive Behavior', async ({ page }) => {
    const viewports = [
      ...COMMON_VIEWPORTS.mobile,
      ...COMMON_VIEWPORTS.tablet,
      ...COMMON_VIEWPORTS.desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const navigation = page.locator('nav, [data-testid="navigation"]');
      if (await navigation.isVisible()) {
        await takeVisualScreenshot(page, {
          name: `navigation-${viewport.name}`,
          element: navigation,
          mask: getMaskSelectors(page)
        });
      }
    }
  });

  test('Property Card Responsive Layout', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      const propertyGrid = page.locator('[data-testid="property-grid"], .property-grid, .properties-container');
      if (await propertyGrid.isVisible()) {
        await takeVisualScreenshot(page, {
          name: `property-grid-${viewport.name}`,
          element: propertyGrid
        });
      }
    }
  });

  test('Form Responsive Layout', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1366, height: 768 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const form = page.locator('form, [data-testid="contact-form"]');
      if (await form.isVisible()) {
        await takeVisualScreenshot(page, {
          name: `contact-form-${viewport.name}`,
          element: form
        });
      }
    }
  });
});