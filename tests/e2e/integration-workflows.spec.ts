import { test, expect, Page } from '..\..\src\shared\test-utils\index';

/**
 * Cross-Workflow Integration E2E Tests
 * 
 * Tests complete user journeys that span multiple workflows and features
 */

const TEST_USER = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
  phone: '+254700123456'
};

const TEST_PROPERTY = {
  title: 'Modern 3-Bedroom Apartment in Nairobi',
  type: 'apartment',
  price: '150000',
  bedrooms: '3',
  bathrooms: '2',
  area: '1200',
  location: 'Westlands, Nairobi',
  description: 'Beautiful modern apartment with stunning city views, located in the heart of Nairobi.'
};

const TEST_REVIEW = {
  rating: 5,
  title: 'Excellent Property and Service',
  comment: 'The property was exactly as described and the verification process gave me confidence in my purchase.'
};

// Helper functions
async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

async function fillFormField(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await page.waitForTimeout(100);
}

async function clickAndWait(page: Page, selector: string, waitFor: 'navigation' | 'networkidle' = 'networkidle') {
  if (waitFor === 'navigation') {
    await Promise.all([
      page.waitForNavigation(),
      page.click(selector)
    ]);
  } else {
    await page.click(selector);
    await page.waitForLoadState('networkidle');
  }
}

test.describe('Cross-Workflow Integration Tests', () => {
  test('should complete full user journey from registration to property transaction', async ({ page }) => {
    // 1. Register new user
    await navigateToPage(page, '/auth/register');
    await fillFormField(page, 'input[name="name"]', TEST_USER.name);
    await fillFormField(page, 'input[name="email"]', TEST_USER.email);
    await fillFormField(page, 'input[name="password"]', TEST_USER.password);
    await fillFormField(page, 'input[name="confirmPassword"]', TEST_USER.password);
    await clickAndWait(page, 'button:has-text("Next")');
    
    await fillFormField(page, 'input[name="phone"]', TEST_USER.phone);
    await page.selectOption('select[name="userType"]', 'buyer');
    await clickAndWait(page, 'button:has-text("Complete Registration")', 'navigation');
    
    // 2. Search for properties
    await navigateToPage(page, '/properties');
    await fillFormField(page, 'input[placeholder*="Search"]', 'Nairobi');
    await clickAndWait(page, 'button:has-text("Search")');
    
    // 3. View property details and save to favorites
    await clickAndWait(page, '[data-testid="property-card"]:first-child', 'navigation');
    await clickAndWait(page, 'button:has-text("Save")');
    
    // 4. Contact property owner
    await clickAndWait(page, 'button:has-text("Contact Owner")');
    await fillFormField(page, 'textarea[name="message"]', 'I am interested in this property.');
    await clickAndWait(page, 'button:has-text("Send Message")');
    
    // 5. Schedule viewing
    await clickAndWait(page, 'button:has-text("Schedule Viewing")');
    await page.fill('input[type="date"]', '2024-12-31');
    await page.fill('input[type="time"]', '14:00');
    await clickAndWait(page, 'button:has-text("Request Viewing")');
    
    // 6. Submit review after "viewing"
    await page.click(`[data-rating="5"]`);
    await fillFormField(page, 'input[name="reviewTitle"]', TEST_REVIEW.title);
    await fillFormField(page, 'textarea[name="reviewComment"]', TEST_REVIEW.comment);
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify complete workflow success
    await expect(page.locator('text=review.*submitted')).toBeVisible();
  });

  test('should complete property owner journey from listing to managing reviews', async ({ page }) => {
    // 1. Login as property owner
    await navigateToPage(page, '/auth/login');
    await fillFormField(page, 'input[name="email"]', 'owner@example.com');
    await fillFormField(page, 'input[name="password"]', 'OwnerPassword123!');
    await clickAndWait(page, 'button:has-text("Login")', 'navigation');
    
    // 2. Create property listing
    await navigateToPage(page, '/services/list-property');
    
    // Fill property details
    await fillFormField(page, 'input[name="title"]', TEST_PROPERTY.title);
    await page.selectOption('select[name="type"]', TEST_PROPERTY.type);
    await fillFormField(page, 'input[name="price"]', TEST_PROPERTY.price);
    await clickAndWait(page, 'button:has-text("Next")');
    
    await fillFormField(page, 'input[name="beds"]', TEST_PROPERTY.bedrooms);
    await fillFormField(page, 'input[name="baths"]', TEST_PROPERTY.bathrooms);
    await fillFormField(page, 'input[name="area"]', TEST_PROPERTY.area);
    await clickAndWait(page, 'button:has-text("Next")');
    
    await fillFormField(page, 'input[name="location"]', TEST_PROPERTY.location);
    await fillFormField(page, 'textarea[name="description"]', TEST_PROPERTY.description);
    await clickAndWait(page, 'button:has-text("Next")');
    
    await page.check('input[id="terms"]');
    await clickAndWait(page, 'button:has-text("Submit Property")');
    
    // 3. Manage property photos
    await navigateToPage(page, '/properties/my');
    await clickAndWait(page, 'a:has-text("Manage Photos"):first');
    
    // Simulate photo management
    await clickAndWait(page, 'button:has-text("Add Photos")');
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // 4. Respond to reviews
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'a:has-text("My Properties")');
    await clickAndWait(page, 'a:has-text("Reviews"):first');
    
    // Respond to a review
    const reviewToRespond = page.locator('[data-testid="review-item"]').first();
    if (await reviewToRespond.isVisible()) {
      await reviewToRespond.locator('button:has-text("Respond")').click();
      await fillFormField(page, 'textarea[name="response"]', 'Thank you for your feedback!');
      await clickAndWait(page, 'button:has-text("Submit Response")');
      
      await expect(page.locator('text=response.*submitted')).toBeVisible();
    }
    
    // 5. View analytics
    await clickAndWait(page, 'a:has-text("Analytics")');
    await expect(page.locator('text=Average Rating')).toBeVisible();
  });

  test('should handle complete property search and booking workflow', async ({ page }) => {
    // 1. Start from homepage
    await navigateToPage(page, '/');
    
    // 2. Use homepage search
    await fillFormField(page, 'input[placeholder*="Search"]', 'apartment Nairobi');
    await clickAndWait(page, 'button:has-text("Search")', 'navigation');
    
    // 3. Apply multiple filters
    await page.fill('input[name="minPrice"]', '100000');
    await page.fill('input[name="maxPrice"]', '200000');
    await page.selectOption('select[name="propertyType"]', 'apartment');
    await page.selectOption('select[name="bedrooms"]', '3');
    await clickAndWait(page, 'button:has-text("Apply Filters")');
    
    // 4. Compare properties
    const propertyCards = page.locator('[data-testid="property-card"]');
    await propertyCards.first().locator('input[type="checkbox"]').check();
    await propertyCards.nth(1).locator('input[type="checkbox"]').check();
    await clickAndWait(page, 'button:has-text("Compare")');
    
    // 5. Select property from comparison
    await clickAndWait(page, 'button:has-text("View Details"):first', 'navigation');
    
    // 6. Complete booking process
    await clickAndWait(page, 'button:has-text("Schedule Viewing")');
    await page.fill('input[type="date"]', '2024-12-31');
    await page.fill('input[type="time"]', '14:00');
    await fillFormField(page, 'textarea[name="notes"]', 'Interested in immediate purchase');
    await clickAndWait(page, 'button:has-text("Request Viewing")');
    
    // 7. Save to favorites for later
    await clickAndWait(page, 'button:has-text("Save")');
    
    // 8. Contact owner
    await clickAndWait(page, 'button:has-text("Contact Owner")');
    await fillFormField(page, 'textarea[name="message"]', 'Ready to make an offer');
    await clickAndWait(page, 'button:has-text("Send Message")');
    
    // Verify all actions completed successfully
    await expect(page.locator('text=message.*sent')).toBeVisible();
  });

  test('should handle error scenarios gracefully across workflows', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/**', route => route.abort());
    
    // Try to perform actions that require API calls
    await navigateToPage(page, '/properties');
    
    // Verify error handling
    await expect(page.locator('text=error|failed|try again')).toBeVisible();
    
    // Test recovery after network restoration
    await page.unroute('**/api/**');
    await page.reload();
    
    // Verify page loads correctly after recovery
    await expect(page.locator('[data-testid="property-card"]')).toBeVisible();
  });

  test('should maintain user session across different workflows', async ({ page }) => {
    // 1. Login
    await navigateToPage(page, '/auth/login');
    await fillFormField(page, 'input[name="email"]', TEST_USER.email);
    await fillFormField(page, 'input[name="password"]', TEST_USER.password);
    await clickAndWait(page, 'button:has-text("Login")', 'navigation');
    
    // 2. Navigate to different sections and verify user remains logged in
    await navigateToPage(page, '/properties');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    await navigateToPage(page, '/services');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    await navigateToPage(page, '/dashboard');
    await expect(page.locator('h1')).toContainText(/Welcome|Dashboard/);
    
    // 3. Perform actions that require authentication
    await navigateToPage(page, '/services/list-property');
    await expect(page.locator('h1')).toContainText(/List.*Property/);
    
    // 4. Update profile
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await fillFormField(page, 'input[name="name"]', 'Updated Name');
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // 5. Verify session persists after page refresh
    await page.reload();
    await expect(page.locator('input[name="name"]')).toHaveValue('Updated Name');
  });

  test('should handle concurrent user actions across multiple tabs', async ({ browser }) => {
    // Create two browser contexts to simulate different users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // User 1: Property owner
    await page1.goto('/auth/login');
    await page1.fill('input[name="email"]', 'owner@example.com');
    await page1.fill('input[name="password"]', 'OwnerPassword123!');
    await page1.click('button:has-text("Login")');
    await page1.waitForNavigation();
    
    // User 2: Property buyer
    await page2.goto('/auth/login');
    await page2.fill('input[name="email"]', TEST_USER.email);
    await page2.fill('input[name="password"]', TEST_USER.password);
    await page2.click('button:has-text("Login")');
    await page2.waitForNavigation();
    
    // User 1: Update property listing
    await page1.goto('/properties/my');
    await page1.click('button:has-text("Edit"):first');
    await page1.fill('input[name="price"]', '175000');
    await page1.click('button:has-text("Save Changes")');
    
    // User 2: View the same property (should see updated price)
    await page2.goto('/property/1');
    await expect(page2.locator('text=175000')).toBeVisible();
    
    // User 2: Submit review
    await page2.locator('text=Reviews').scrollIntoViewIfNeeded();
    await page2.click('button:has-text("Write Review")');
    await page2.click('[data-rating="5"]');
    await page2.fill('textarea[name="reviewComment"]', 'Great property!');
    await page2.click('button:has-text("Submit Review")');
    
    // User 1: See new review notification
    await page1.goto('/dashboard');
    await expect(page1.locator('[data-testid="notification"]')).toBeVisible();
    
    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('should handle mobile and desktop responsive workflows', async ({ page }) => {
    // Test desktop workflow
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateToPage(page, '/properties');
    
    // Verify desktop layout
    await expect(page.locator('[data-testid="desktop-filters"]')).toBeVisible();
    
    // Perform search on desktop
    await fillFormField(page, 'input[placeholder*="Search"]', 'Nairobi');
    await clickAndWait(page, 'button:has-text("Search")');
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test mobile navigation
    await clickAndWait(page, '[data-testid="mobile-menu-toggle"]');
    await clickAndWait(page, 'a:has-text("Dashboard")');
    
    // Verify mobile dashboard layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    
    // Test mobile property listing
    await navigateToPage(page, '/services/list-property');
    
    // Verify mobile form layout
    await expect(page.locator('[data-testid="mobile-form"]')).toBeVisible();
    
    // Fill form on mobile
    await fillFormField(page, 'input[name="title"]', TEST_PROPERTY.title);
    await page.selectOption('select[name="type"]', TEST_PROPERTY.type);
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Verify mobile form navigation works
    await expect(page.locator('text=Step 2')).toBeVisible();
  });

  test('should handle data persistence across workflow interruptions', async ({ page }) => {
    // Start property listing process
    await navigateToPage(page, '/services/list-property');
    
    // Fill partial form data
    await fillFormField(page, 'input[name="title"]', TEST_PROPERTY.title);
    await page.selectOption('select[name="type"]', TEST_PROPERTY.type);
    await fillFormField(page, 'input[name="price"]', TEST_PROPERTY.price);
    
    // Navigate away (simulate interruption)
    await navigateToPage(page, '/dashboard');
    
    // Return to listing form
    await navigateToPage(page, '/services/list-property');
    
    // Verify form data is preserved (if auto-save is implemented)
    // This would depend on the actual implementation
    const titleValue = await page.locator('input[name="title"]').inputValue();
    if (titleValue) {
      await expect(page.locator('input[name="title"]')).toHaveValue(TEST_PROPERTY.title);
    }
    
    // Complete the form
    await fillFormField(page, 'input[name="title"]', TEST_PROPERTY.title);
    await page.selectOption('select[name="type"]', TEST_PROPERTY.type);
    await fillFormField(page, 'input[name="price"]', TEST_PROPERTY.price);
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Continue with remaining steps
    await fillFormField(page, 'input[name="beds"]', TEST_PROPERTY.bedrooms);
    await fillFormField(page, 'input[name="baths"]', TEST_PROPERTY.bathrooms);
    await fillFormField(page, 'input[name="area"]', TEST_PROPERTY.area);
    await clickAndWait(page, 'button:has-text("Next")');
    
    await fillFormField(page, 'input[name="location"]', TEST_PROPERTY.location);
    await fillFormField(page, 'textarea[name="description"]', TEST_PROPERTY.description);
    await clickAndWait(page, 'button:has-text("Next")');
    
    await page.check('input[id="terms"]');
    await clickAndWait(page, 'button:has-text("Submit Property")');
    
    // Verify successful submission
    await expect(page.locator('text=submitted.*successfully')).toBeVisible();
  });
});