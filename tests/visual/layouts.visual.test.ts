import { test } from '@playwright/test';
import { 
  takeVisualScreenshot, 
  testResponsiveDesign,
  testThemeSwitching,
  testLoadingStates,
  testErrorStates,
  testEmptyStates,
  getMaskSelectors,
  getAllViewports
} from './helpers/visual-test-utils';

/**
 * Visual Regression Tests for Page Layouts
 * 
 * Tests visual consistency of major page layouts across browsers and viewports
 */

test.describe('Page Layout Visual Tests', () => {
  
  test('Homepage Layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Full page screenshot
    await takeVisualScreenshot(page, {
      name: 'homepage-full',
      fullPage: true,
      mask: getMaskSelectors(page),
      waitFor: 'networkidle'
    });
    
    // Above the fold
    await takeVisualScreenshot(page, {
      name: 'homepage-above-fold',
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      mask: getMaskSelectors(page)
    });
  });

  test('Properties Listing Page', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'properties-listing',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
  });

  test('Property Details Page', async ({ page }) => {
    // Navigate to properties and click on first property
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const firstProperty = page.locator('[data-testid="property-card"] a, .property-card a').first();
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      await page.waitForLoadState('networkidle');
      
      await takeVisualScreenshot(page, {
        name: 'property-details',
        fullPage: true,
        mask: getMaskSelectors(page)
      });
    }
  });

  test('Services Page Layout', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'services-page',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
  });

  test('About Page Layout', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'about-page',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
  });

  test('Contact Page Layout', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'contact-page',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
  });

  test('Blog Page Layout', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'blog-page',
      fullPage: true,
      mask: getMaskSelectors(page)
    });
  });

  test('Authentication Pages', async ({ page }) => {
    // Login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'login-page',
      fullPage: true
    });
    
    // Register page
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'register-page',
      fullPage: true
    });
  });

  test('Dashboard Layout', async ({ page }) => {
    // This would require authentication - skip if not authenticated
    try {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check if we're redirected to login (not authenticated)
      if (page.url().includes('/auth/login')) {
        console.log('Skipping dashboard test - authentication required');
        return;
      }
      
      await takeVisualScreenshot(page, {
        name: 'dashboard-layout',
        fullPage: true,
        mask: getMaskSelectors(page)
      });
    } catch (error) {
      console.log('Skipping dashboard test - page not accessible');
    }
  });

  test('404 Error Page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: '404-error-page',
      fullPage: true
    });
  });
});

test.describe('Responsive Layout Tests', () => {
  
  test('Homepage Responsive Design', async ({ page }) => {
    await testResponsiveDesign(page, {
      baseName: 'homepage-responsive',
      url: '/',
      viewports: getAllViewports(),
      options: {
        mask: getMaskSelectors(page),
        waitFor: 'networkidle'
      }
    });
  });

  test('Properties Page Responsive Design', async ({ page }) => {
    await testResponsiveDesign(page, {
      baseName: 'properties-responsive',
      url: '/properties',
      viewports: [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1366, height: 768 },
        { name: 'wide', width: 1920, height: 1080 }
      ],
      options: {
        mask: getMaskSelectors(page)
      }
    });
  });

  test('Contact Form Responsive Design', async ({ page }) => {
    await testResponsiveDesign(page, {
      baseName: 'contact-responsive',
      url: '/contact',
      viewports: [
        { name: 'mobile-portrait', width: 375, height: 667 },
        { name: 'mobile-landscape', width: 667, height: 375 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1366, height: 768 }
      ]
    });
  });

  test('Navigation Responsive Behavior', async ({ page }) => {
    const viewports = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile-medium', width: 375, height: 667 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-small', width: 1366, height: 768 },
      { name: 'desktop-large', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test navigation in collapsed state
      await takeVisualScreenshot(page, {
        name: `navigation-${viewport.name}`,
        element: page.locator('nav, [data-testid="navigation"]'),
        mask: getMaskSelectors(page)
      });
      
      // Test mobile menu if it exists
      if (viewport.width < 768) {
        const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button:has-text("Menu")');
        if (await mobileMenuButton.isVisible()) {
          await mobileMenuButton.click();
          await page.waitForTimeout(300);
          
          await takeVisualScreenshot(page, {
            name: `navigation-mobile-menu-${viewport.name}`,
            fullPage: true,
            mask: getMaskSelectors(page)
          });
        }
      }
    }
  });
});

test.describe('Theme and State Tests', () => {
  
  test('Light/Dark Theme Switching', async ({ page }) => {
    const pages = [
      { url: '/', name: 'homepage' },
      { url: '/properties', name: 'properties' },
      { url: '/contact', name: 'contact' },
      { url: '/about', name: 'about' }
    ];
    
    for (const pageInfo of pages) {
      await testThemeSwitching(page, pageInfo.url, pageInfo.name);
    }
  });

  test('Loading States', async ({ page }) => {
    const pages = [
      { url: '/properties', name: 'properties-loading' },
      { url: '/services', name: 'services-loading' }
    ];
    
    for (const pageInfo of pages) {
      await testLoadingStates(page, pageInfo.url, pageInfo.name);
    }
  });

  test('Error States', async ({ page }) => {
    const pages = [
      { url: '/properties', name: 'properties-error' },
      { url: '/services', name: 'services-error' }
    ];
    
    for (const pageInfo of pages) {
      await testErrorStates(page, pageInfo.url, pageInfo.name);
    }
  });

  test('Empty States', async ({ page }) => {
    const pages = [
      { url: '/properties', name: 'properties-empty' },
      { url: '/dashboard', name: 'dashboard-empty' }
    ];
    
    for (const pageInfo of pages) {
      await testEmptyStates(page, pageInfo.url, pageInfo.name);
    }
  });
});

test.describe('Interactive State Tests', () => {
  
  test('Form Interaction States', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const form = page.locator('form, [data-testid="contact-form"]');
    if (await form.isVisible()) {
      // Empty form
      await takeVisualScreenshot(page, {
        name: 'contact-form-empty',
        element: form
      });
      
      // Partially filled form
      const nameInput = form.locator('input[name="name"], input[placeholder*="name" i]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('John Doe');
        await takeVisualScreenshot(page, {
          name: 'contact-form-partial',
          element: form
        });
      }
      
      // Fully filled form
      const emailInput = form.locator('input[name="email"], input[type="email"]');
      const messageInput = form.locator('textarea[name="message"], textarea');
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('john.doe@example.com');
      }
      if (await messageInput.isVisible()) {
        await messageInput.fill('This is a test message for visual regression testing.');
      }
      
      await takeVisualScreenshot(page, {
        name: 'contact-form-filled',
        element: form
      });
      
      // Form validation errors (try submitting empty required fields)
      await nameInput.fill('');
      const submitButton = form.locator('button[type="submit"], button:has-text("Submit")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        await takeVisualScreenshot(page, {
          name: 'contact-form-validation-errors',
          element: form
        });
      }
    }
  });

  test('Search and Filter States', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    // Default state
    await takeVisualScreenshot(page, {
      name: 'properties-search-default',
      element: page.locator('[data-testid="search-section"], .search-section, .filters-section')
    });
    
    // With search term
    const searchInput = page.locator('input[placeholder*="Search" i], input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Nairobi apartment');
      await page.waitForTimeout(300);
      
      await takeVisualScreenshot(page, {
        name: 'properties-search-with-term',
        element: page.locator('[data-testid="search-section"], .search-section, .filters-section')
      });
    }
    
    // With filters applied
    const priceFilter = page.locator('select[name="priceRange"], input[name="minPrice"]');
    if (await priceFilter.isVisible()) {
      if (await priceFilter.getAttribute('type') === 'text') {
        await priceFilter.fill('100000');
      } else {
        await priceFilter.selectOption({ index: 1 });
      }
      
      await page.waitForTimeout(300);
      
      await takeVisualScreenshot(page, {
        name: 'properties-search-with-filters',
        element: page.locator('[data-testid="search-section"], .search-section, .filters-section')
      });
    }
  });

  test('Hover and Focus States', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test button hover states
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      // Normal state
      await takeVisualScreenshot(page, {
        name: 'button-normal',
        element: firstButton
      });
      
      // Hover state
      await firstButton.hover();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'button-hover',
        element: firstButton
      });
      
      // Focus state
      await firstButton.focus();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'button-focus',
        element: firstButton
      });
    }
    
    // Test link hover states
    const links = page.locator('a:not([role="button"])');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      const firstLink = links.first();
      
      await firstLink.hover();
      await page.waitForTimeout(200);
      
      await takeVisualScreenshot(page, {
        name: 'link-hover',
        element: firstLink
      });
    }
  });
});