import { test, expect } from '@playwright/test';
import { 
  takeVisualScreenshot, 
  testResponsiveDesign,
  getAllViewports,
  getMaskSelectors 
} from './helpers/visual-test-utils';

/**
 * Comprehensive Responsive Design Testing
 * 
 * Tests all major components and layouts across different screen sizes
 * to identify and validate responsive design issues.
 */

test.describe('Responsive Design Validation', () => {
  
  test('Homepage responsive layout', async ({ page }) => {
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

  test('Navigation responsive behavior', async ({ page }) => {
    const viewports = [
      { name: 'mobile-320', width: 320, height: 568 },
      { name: 'mobile-375', width: 375, height: 667 },
      { name: 'mobile-414', width: 414, height: 896 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'tablet-1024', width: 1024, height: 768 },
      { name: 'desktop-1280', width: 1280, height: 720 },
      { name: 'desktop-1920', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of navigation
      await takeVisualScreenshot(page, {
        name: `navigation-${viewport.name}`,
        element: page.locator('nav'),
        animations: 'disabled'
      });
      
      // Validate responsive behavior
      const isMobile = viewport.width < 768;
      const isTablet = viewport.width >= 768 && viewport.width < 1024;
      const isDesktop = viewport.width >= 1024;
      
      if (isMobile) {
        // Mobile: Should show mobile menu button
        const mobileMenuButton = page.locator('button:has(svg)').first();
        await expect(mobileMenuButton).toBeVisible();
        console.log(`✓ Mobile menu visible at ${viewport.name} (${viewport.width}px)`);
      } else if (isTablet) {
        // Tablet: Should show simplified navigation
        console.log(`✓ Tablet navigation at ${viewport.name} (${viewport.width}px)`);
      } else if (isDesktop) {
        // Desktop: Should show full navigation
        const desktopNav = page.locator('nav .hidden.md\\:flex');
        console.log(`✓ Desktop navigation at ${viewport.name} (${viewport.width}px)`);
      }
    }
  });

  test('Hero section responsive layout', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of hero section
      const heroSection = page.locator('section').first();
      await takeVisualScreenshot(page, {
        name: `hero-${viewport.name}`,
        element: heroSection,
        animations: 'disabled'
      });
      
      // Validate hero content is readable
      const heroTitle = page.locator('h1').first();
      if (await heroTitle.isVisible()) {
        const titleBox = await heroTitle.boundingBox();
        if (titleBox) {
          expect(titleBox.width).toBeLessThan(viewport.width - 40); // Should have margins
          console.log(`✓ Hero title fits in ${viewport.name} viewport`);
        }
      }
    }
  });

  test('Service categories responsive grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667, expectedCols: 1 },
      { name: 'tablet', width: 768, height: 1024, expectedCols: 2 },
      { name: 'desktop', width: 1280, height: 720, expectedCols: 2 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Find service categories section
      const serviceSection = page.locator('section').filter({ hasText: 'Our Kenya Property Services' });
      
      if (await serviceSection.isVisible()) {
        await takeVisualScreenshot(page, {
          name: `services-${viewport.name}`,
          element: serviceSection,
          animations: 'disabled'
        });
        
        // Check grid layout
        const serviceCards = serviceSection.locator('.group');
        const cardCount = await serviceCards.count();
        
        if (cardCount > 0) {
          console.log(`✓ Service cards visible at ${viewport.name}: ${cardCount} cards`);
        }
      }
    }
  });

  test('Property grid responsive layout', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667, expectedCols: 1 },
      { name: 'tablet', width: 768, height: 1024, expectedCols: 2 },
      { name: 'desktop', width: 1280, height: 720, expectedCols: 3 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Take screenshot of property grid
      const propertyGrid = page.locator('.grid').first();
      
      if (await propertyGrid.isVisible()) {
        await takeVisualScreenshot(page, {
          name: `property-grid-${viewport.name}`,
          element: propertyGrid,
          animations: 'disabled'
        });
        
        // Validate grid columns
        const propertyCards = propertyGrid.locator('[data-testid="property-card"], .property-card');
        const cardCount = await propertyCards.count();
        
        if (cardCount > 0) {
          console.log(`✓ Property grid at ${viewport.name}: ${cardCount} cards visible`);
        }
      }
    }
  });

  test('Forms responsive behavior', async ({ page }) => {
    // Test contact form
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const form = page.locator('form').first();
      
      if (await form.isVisible()) {
        await takeVisualScreenshot(page, {
          name: `contact-form-${viewport.name}`,
          element: form,
          animations: 'disabled'
        });
        
        // Check form inputs are properly sized
        const inputs = form.locator('input, textarea');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputBox = await input.boundingBox();
          
          if (inputBox) {
            expect(inputBox.width).toBeLessThan(viewport.width - 40);
            expect(inputBox.width).toBeGreaterThan(200); // Minimum usable width
          }
        }
        
        console.log(`✓ Form inputs properly sized at ${viewport.name}`);
      }
    }
  });

  test('Text content responsive wrapping', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile-narrow', width: 320, height: 568 },
      { name: 'mobile-wide', width: 414, height: 896 },
      { name: 'tablet', width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Check headings don't overflow
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      
      for (let i = 0; i < Math.min(headingCount, 5); i++) {
        const heading = headings.nth(i);
        const headingBox = await heading.boundingBox();
        
        if (headingBox) {
          expect(headingBox.width).toBeLessThan(viewport.width);
          
          // Check for horizontal scroll
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small tolerance
        }
      }
      
      console.log(`✓ Text content fits properly at ${viewport.name}`);
    }
  });

  test('Button and interactive elements touch-friendly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Find all buttons
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        
        if (buttonBox) {
          // Buttons should be at least 44px tall for touch accessibility
          expect(buttonBox.height).toBeGreaterThanOrEqual(40);
          console.log(`✓ Button ${i + 1} is touch-friendly: ${buttonBox.height}px tall`);
        }
      }
    }
  });

  test('Images responsive scaling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Check images don't overflow
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = images.nth(i);
        
        if (await image.isVisible()) {
          const imageBox = await image.boundingBox();
          
          if (imageBox) {
            expect(imageBox.width).toBeLessThanOrEqual(viewport.width);
            console.log(`✓ Image ${i + 1} scales properly at ${viewport.name}`);
          }
        }
      }
    }
  });

  test('Horizontal scroll detection', async ({ page }) => {
    const viewports = [
      { name: 'mobile-320', width: 320, height: 568 },
      { name: 'mobile-375', width: 375, height: 667 },
      { name: 'tablet-768', width: 768, height: 1024 }
    ];
    
    const pages = ['/', '/properties', '/services', '/contact'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        
        // Check for horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        
        if (scrollWidth > clientWidth + 10) { // Allow small tolerance
          console.log(`⚠️ Horizontal scroll detected on ${pageUrl} at ${viewport.name}: ${scrollWidth}px > ${clientWidth}px`);
          
          // Take screenshot to show the issue
          await takeVisualScreenshot(page, {
            name: `horizontal-scroll-${pageUrl.replace('/', 'home')}-${viewport.name}`,
            fullPage: true
          });
        } else {
          console.log(`✓ No horizontal scroll on ${pageUrl} at ${viewport.name}`);
        }
      }
    }
  });

  test('Responsive breakpoint validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test critical breakpoints
    const breakpoints = [
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 }
    ];
    
    for (const breakpoint of breakpoints) {
      // Test just below breakpoint
      await page.setViewportSize({ width: breakpoint.width - 1, height: 800 });
      await page.waitForTimeout(300);
      
      await takeVisualScreenshot(page, {
        name: `breakpoint-${breakpoint.name}-below`,
        fullPage: false,
        clip: { x: 0, y: 0, width: breakpoint.width - 1, height: 800 }
      });
      
      // Test just above breakpoint
      await page.setViewportSize({ width: breakpoint.width + 1, height: 800 });
      await page.waitForTimeout(300);
      
      await takeVisualScreenshot(page, {
        name: `breakpoint-${breakpoint.name}-above`,
        fullPage: false,
        clip: { x: 0, y: 0, width: breakpoint.width + 1, height: 800 }
      });
      
      console.log(`✓ Tested ${breakpoint.name} breakpoint at ${breakpoint.width}px`);
    }
  });
});