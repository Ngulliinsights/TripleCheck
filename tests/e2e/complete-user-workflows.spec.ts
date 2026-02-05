import { test, expect, Page } from '..\..\src\shared\test-utils\index';

/**
 * Complete End-to-End User Workflow Tests
 * 
 * This test suite covers complete user journeys through the application,
 * testing real user scenarios from start to finish.
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

// Helper functions for common actions
async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

async function fillFormField(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await page.waitForTimeout(100); // Small delay for form validation
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

test.describe('Complete User Journey Tests', () => {
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
    await page.click(`[data-rating="${TEST_REVIEW.rating}"]`);
    await fillFormField(page, 'input[name="reviewTitle"]', TEST_REVIEW.title);
    await fillFormField(page, 'textarea[name="reviewComment"]', TEST_REVIEW.comment);
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify complete workflow success
    await expect(page.locator('text=review.*submitted')).toBeVisible();
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
});