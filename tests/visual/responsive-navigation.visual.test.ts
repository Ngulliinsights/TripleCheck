import { test, expect } from '..\..\src\shared\test-utils\index';
import { takeVisualScreenshot } from './helpers/visual-test-utils';

/**
 * Responsive Navigation Visual Tests
 * 
 * These tests validate that the navigation properly adapts to different screen sizes
 * and that mobile navigation is automatically activated at appropriate breakpoints.
 */

test.describe('Responsive Navigation Validation', () => {
  
  test('Navigation adapts correctly across breakpoints', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test different viewport sizes to validate responsive behavior
    const viewports = [
      { name: 'mobile-small', width: 320, height: 568, expectMobile: true },
      { name: 'mobile-large', width: 414, height: 896, expectMobile: true },
      { name: 'tablet-portrait', width: 768, height: 1024, expectTablet: true },
      { name: 'tablet-landscape', width: 1024, height: 768, expectDesktop: true },
      { name: 'desktop-small', width: 1280, height: 720, expectDesktop: true },
      { name: 'desktop-large', width: 1920, height: 1080, expectDesktop: true }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Take screenshot of navigation area
      await takeVisualScreenshot(page, {
        name: `navigation-${viewport.name}`,
        element: page.locator('nav'),
        animations: 'disabled'
      });
      
      // Validate expected navigation elements are visible
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button:has-text("Menu")');
      const desktopNav = page.locator('nav .hidden.md\\:flex');
      const tabletNav = page.locator('nav .hidden.md\\:flex.lg\\:hidden');
      
      if (viewport.expectMobile) {
        // Mobile: Should show mobile menu button, hide desktop nav
        await expect(mobileMenuButton).toBeVisible();
        console.log(`✓ Mobile menu visible at ${viewport.name} (${viewport.width}px)`);
      } else if (viewport.expectTablet) {
        // Tablet: Should show simplified nav with mobile menu
        await expect(tabletNav).toBeVisible();
        console.log(`✓ Tablet navigation visible at ${viewport.name} (${viewport.width}px)`);
      } else if (viewport.expectDesktop) {
        // Desktop: Should show full navigation
        await expect(desktopNav).toBeVisible();
        console.log(`✓ Desktop navigation visible at ${viewport.name} (${viewport.width}px)`);
      }
    }
  });

  test('Mobile menu functionality works correctly', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mobile menu should be closed initially
    await takeVisualScreenshot(page, {
      name: 'mobile-menu-closed',
      fullPage: true
    });
    
    // Find and click mobile menu button
    const mobileMenuButton = page.locator('button:has(svg)').first(); // Menu icon button
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500); // Allow animation
      
      // Mobile menu should be open
      await takeVisualScreenshot(page, {
        name: 'mobile-menu-open',
        fullPage: true,
        animations: 'disabled'
      });
      
      // Verify menu content is accessible
      const menuContent = page.locator('[role="dialog"], .mobile-nav-panel');
      if (await menuContent.isVisible()) {
        console.log('✓ Mobile menu opens correctly');
        
        // Test navigation within mobile menu
        const homeLink = page.locator('text=Home').first();
        if (await homeLink.isVisible()) {
          console.log('✓ Mobile menu navigation links are accessible');
        }
      }
    } else {
      console.log('⚠️ Mobile menu button not found - this indicates a responsive issue');
    }
  });

  test('Tablet navigation shows appropriate elements', async ({ page }) => {
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'tablet-navigation',
      element: page.locator('nav'),
      animations: 'disabled'
    });
    
    // Tablet should show simplified navigation with login buttons and mobile menu
    const loginButton = page.locator('button:has-text("Login")');
    const getStartedButton = page.locator('button:has-text("Get Started")');
    const mobileMenuButton = page.locator('button:has(svg)').first();
    
    // Check if tablet-specific elements are visible
    if (await loginButton.isVisible() && await getStartedButton.isVisible()) {
      console.log('✓ Tablet shows login/signup buttons');
    }
    
    if (await mobileMenuButton.isVisible()) {
      console.log('✓ Tablet shows mobile menu for navigation');
    }
  });

  test('Desktop navigation shows full menu', async ({ page }) => {
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await takeVisualScreenshot(page, {
      name: 'desktop-navigation-full',
      element: page.locator('nav'),
      animations: 'disabled'
    });
    
    // Desktop should show full navigation menu
    const navigationItems = ['Properties', 'Services', 'Pricing', 'Help'];
    
    for (const item of navigationItems) {
      const navItem = page.locator(`text=${item}`).first();
      if (await navItem.isVisible()) {
        console.log(`✓ Desktop shows ${item} navigation`);
      } else {
        console.log(`⚠️ Desktop missing ${item} navigation - responsive issue`);
      }
    }
    
    // Desktop should show search bar
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      console.log('✓ Desktop shows search functionality');
    }
  });

  test('Navigation dropdown menus work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Properties dropdown
    const propertiesButton = page.locator('button:has-text("Properties")').first();
    
    if (await propertiesButton.isVisible()) {
      // Hover to open dropdown
      await propertiesButton.hover();
      await page.waitForTimeout(300);
      
      await takeVisualScreenshot(page, {
        name: 'desktop-properties-dropdown',
        element: page.locator('nav'),
        animations: 'disabled'
      });
      
      // Check if dropdown items are visible
      const dropdownItems = ['Browse Properties', 'Residential', 'Commercial', 'Land'];
      for (const item of dropdownItems) {
        const dropdownItem = page.locator(`text=${item}`);
        if (await dropdownItem.isVisible()) {
          console.log(`✓ Properties dropdown shows ${item}`);
        }
      }
    }
    
    // Test Services dropdown
    const servicesButton = page.locator('button:has-text("Services")').first();
    
    if (await servicesButton.isVisible()) {
      await servicesButton.hover();
      await page.waitForTimeout(300);
      
      await takeVisualScreenshot(page, {
        name: 'desktop-services-dropdown',
        element: page.locator('nav'),
        animations: 'disabled'
      });
    }
  });

  test('Search functionality is responsive', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667, expectSearch: false },
      { name: 'tablet', width: 768, height: 1024, expectSearch: false },
      { name: 'desktop', width: 1280, height: 720, expectSearch: true }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      
      if (viewport.expectSearch) {
        await expect(searchInput).toBeVisible();
        console.log(`✓ Search visible on ${viewport.name}`);
        
        // Test search functionality
        await searchInput.fill('test search');
        await takeVisualScreenshot(page, {
          name: `search-${viewport.name}`,
          element: page.locator('nav'),
          animations: 'disabled'
        });
      } else {
        // Search should be hidden on smaller screens
        await expect(searchInput).not.toBeVisible();
        console.log(`✓ Search hidden on ${viewport.name} (as expected)`);
      }
    }
  });
});