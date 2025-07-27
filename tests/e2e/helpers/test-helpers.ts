import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helper Functions
 * 
 * Common utilities and helper functions for end-to-end tests
 */

// Test data constants
export const TEST_DATA = {
  USER: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    phone: '+254700123456'
  },
  PROPERTY: {
    title: 'Modern 3-Bedroom Apartment in Nairobi',
    type: 'apartment',
    price: '150000',
    bedrooms: '3',
    bathrooms: '2',
    area: '1200',
    location: 'Westlands, Nairobi',
    description: 'Beautiful modern apartment with stunning city views, located in the heart of Nairobi.'
  },
  REVIEW: {
    rating: 5,
    title: 'Excellent Property and Service',
    comment: 'The property was exactly as described and the verification process gave me confidence in my purchase.'
  }
};

// Navigation helpers
export async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function navigateAndVerify(page: Page, path: string, expectedTitle?: string) {
  await navigateToPage(page, path);
  if (expectedTitle) {
    await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }
}

// Form interaction helpers
export async function fillFormField(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await page.waitForTimeout(100); // Small delay for form validation
}

export async function selectOption(page: Page, selector: string, value: string) {
  await page.selectOption(selector, value);
  await page.waitForTimeout(100);
}

export async function clickAndWait(page: Page, selector: string, waitFor: 'navigation' | 'networkidle' = 'networkidle') {
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

export async function submitFormAndWait(page: Page, formSelector: string = 'form') {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator(formSelector).press('Enter')
  ]);
}

// Authentication helpers
export async function loginUser(page: Page, email: string = TEST_DATA.USER.email, password: string = TEST_DATA.USER.password) {
  await navigateToPage(page, '/auth/login');
  await fillFormField(page, 'input[name="email"]', email);
  await fillFormField(page, 'input[name="password"]', password);
  await clickAndWait(page, 'button:has-text("Login")', 'navigation');
  
  // Verify successful login
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function registerUser(page: Page, userData = TEST_DATA.USER) {
  await navigateToPage(page, '/auth/register');
  
  // Step 1: Basic Information
  await fillFormField(page, 'input[name="name"]', userData.name);
  await fillFormField(page, 'input[name="email"]', userData.email);
  await fillFormField(page, 'input[name="password"]', userData.password);
  await fillFormField(page, 'input[name="confirmPassword"]', userData.password);
  await clickAndWait(page, 'button:has-text("Next")');
  
  // Step 2: Contact Information
  await fillFormField(page, 'input[name="phone"]', userData.phone);
  await selectOption(page, 'select[name="userType"]', 'buyer');
  await clickAndWait(page, 'button:has-text("Next")');
  
  // Step 3: Preferences
  await page.check('input[name="emailNotifications"]');
  await clickAndWait(page, 'button:has-text("Complete Registration")', 'navigation');
  
  // Verify registration success
  await expect(page).toHaveURL(/\/auth\/verify-email|\/dashboard/);
}

export async function logoutUser(page: Page) {
  await clickAndWait(page, '[data-testid="user-menu"]');
  await clickAndWait(page, 'button:has-text("Logout")', 'navigation');
  await expect(page).toHaveURL(/\/|\/auth/);
}

// Property interaction helpers
export async function searchProperties(page: Page, searchTerm: string) {
  await navigateToPage(page, '/properties');
  await fillFormField(page, 'input[placeholder*="Search"]', searchTerm);
  await clickAndWait(page, 'button:has-text("Search")');
  
  // Verify search results
  await expect(page.locator('[data-testid="property-card"]')).toHaveCount({ min: 1 });
}

export async function applyPropertyFilters(page: Page, filters: {
  minPrice?: string;
  maxPrice?: string;
  propertyType?: string;
  bedrooms?: string;
}) {
  if (filters.minPrice) {
    await page.fill('input[name="minPrice"]', filters.minPrice);
  }
  if (filters.maxPrice) {
    await page.fill('input[name="maxPrice"]', filters.maxPrice);
  }
  if (filters.propertyType) {
    await selectOption(page, 'select[name="propertyType"]', filters.propertyType);
  }
  if (filters.bedrooms) {
    await selectOption(page, 'select[name="bedrooms"]', filters.bedrooms);
  }
  
  await clickAndWait(page, 'button:has-text("Apply Filters")');
}

export async function viewPropertyDetails(page: Page, propertyIndex: number = 0) {
  const propertyCard = page.locator('[data-testid="property-card"]').nth(propertyIndex);
  await clickAndWait(propertyCard, 'navigation');
  
  // Verify property details page
  await expect(page).toHaveURL(/\/property\/\d+/);
  await expect(page.locator('h1')).toBeVisible();
}

export async function savePropertyToFavorites(page: Page) {
  await clickAndWait(page, 'button:has-text("Save")');
  await expect(page.locator('text=saved')).toBeVisible();
}

export async function contactPropertyOwner(page: Page, message: string) {
  await clickAndWait(page, 'button:has-text("Contact Owner")');
  
  const contactModal = page.locator('[data-testid="contact-modal"]');
  if (await contactModal.isVisible()) {
    await fillFormField(page, 'textarea[name="message"]', message);
    await clickAndWait(page, 'button:has-text("Send Message")');
    await expect(page.locator('text=sent')).toBeVisible();
  }
}

export async function schedulePropertyViewing(page: Page, date: string, time: string, notes?: string) {
  await clickAndWait(page, 'button:has-text("Schedule Viewing")');
  
  await page.fill('input[type="date"]', date);
  await page.fill('input[type="time"]', time);
  
  if (notes) {
    await fillFormField(page, 'textarea[name="notes"]', notes);
  }
  
  await clickAndWait(page, 'button:has-text("Request Viewing")');
  await expect(page.locator('text=viewing.*scheduled')).toBeVisible();
}

// Property listing helpers
export async function createPropertyListing(page: Page, propertyData = TEST_DATA.PROPERTY) {
  await navigateToPage(page, '/services/list-property');
  
  // Step 1: Basic Details
  await fillFormField(page, 'input[name="title"]', propertyData.title);
  await selectOption(page, 'select[name="type"]', propertyData.type);
  await fillFormField(page, 'input[name="price"]', propertyData.price);
  await selectOption(page, 'select[name="ownershipStatus"]', 'freehold');
  await clickAndWait(page, 'button:has-text("Next")');
  
  // Step 2: Features
  await fillFormField(page, 'input[name="beds"]', propertyData.bedrooms);
  await fillFormField(page, 'input[name="baths"]', propertyData.bathrooms);
  await fillFormField(page, 'input[name="area"]', propertyData.area);
  
  // Select amenities
  await page.check('input[id="swimming-pool"]');
  await page.check('input[id="security"]');
  await page.check('input[id="parking"]');
  
  await clickAndWait(page, 'button:has-text("Next")');
  
  // Step 3: Location and Description
  await fillFormField(page, 'input[name="location"]', propertyData.location);
  await fillFormField(page, 'textarea[name="description"]', propertyData.description);
  await clickAndWait(page, 'button:has-text("Next")');
  
  // Step 4: Documents
  await page.check('input[id="terms"]');
  await clickAndWait(page, 'button:has-text("Submit Property")');
  
  // Verify successful submission
  await expect(page.locator('text=submitted.*successfully')).toBeVisible();
}

// Review helpers
export async function submitPropertyReview(page: Page, reviewData = TEST_DATA.REVIEW) {
  // Scroll to reviews section
  await page.locator('text=Reviews').scrollIntoViewIfNeeded();
  await clickAndWait(page, 'button:has-text("Write Review")');
  
  // Fill review form
  await page.click(`[data-rating="${reviewData.rating}"]`);
  await fillFormField(page, 'input[name="reviewTitle"]', reviewData.title);
  await fillFormField(page, 'textarea[name="reviewComment"]', reviewData.comment);
  
  // Submit review
  await clickAndWait(page, 'button:has-text("Submit Review")');
  await expect(page.locator('text=review.*submitted')).toBeVisible();
}

export async function respondToReview(page: Page, response: string) {
  const reviewToRespond = page.locator('[data-testid="review-item"]').first();
  await reviewToRespond.locator('button:has-text("Respond")').click();
  
  await fillFormField(page, 'textarea[name="response"]', response);
  await clickAndWait(page, 'button:has-text("Submit Response")');
  
  await expect(page.locator('text=response.*submitted')).toBeVisible();
}

// Profile management helpers
export async function updateUserProfile(page: Page, updates: {
  name?: string;
  phone?: string;
  bio?: string;
}) {
  await navigateToPage(page, '/dashboard');
  await clickAndWait(page, 'button:has-text("Settings")');
  await clickAndWait(page, 'button:has-text("Profile")');
  
  if (updates.name) {
    await fillFormField(page, 'input[name="name"]', updates.name);
  }
  if (updates.phone) {
    await fillFormField(page, 'input[name="phone"]', updates.phone);
  }
  if (updates.bio) {
    await fillFormField(page, 'textarea[name="bio"]', updates.bio);
  }
  
  await clickAndWait(page, 'button:has-text("Save Changes")');
  await expect(page.locator('text=updated')).toBeVisible();
}

export async function changeUserPassword(page: Page, currentPassword: string, newPassword: string) {
  await navigateToPage(page, '/dashboard');
  await clickAndWait(page, 'button:has-text("Settings")');
  await clickAndWait(page, 'button:has-text("Security")');
  
  await fillFormField(page, 'input[name="currentPassword"]', currentPassword);
  await fillFormField(page, 'input[name="newPassword"]', newPassword);
  await fillFormField(page, 'input[name="confirmNewPassword"]', newPassword);
  
  await clickAndWait(page, 'button:has-text("Change Password")');
  await expect(page.locator('text=password.*changed')).toBeVisible();
}

// Validation helpers
export async function verifyValidationError(page: Page, expectedError: string) {
  await expect(page.locator(`text=${expectedError}`)).toBeVisible();
}

export async function verifySuccessMessage(page: Page, expectedMessage: string) {
  await expect(page.locator(`text=${expectedMessage}`)).toBeVisible();
}

export async function verifyPageTitle(page: Page, expectedTitle: string) {
  await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
}

export async function verifyElementVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

export async function verifyElementNotVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).not.toBeVisible();
}

// Wait helpers
export async function waitForElement(page: Page, selector: string, timeout: number = 10000) {
  await page.waitForSelector(selector, { timeout });
}

export async function waitForText(page: Page, text: string, timeout: number = 10000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

export async function waitForUrl(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  await page.waitForURL(urlPattern, { timeout });
}

// Error handling helpers
export async function handleNetworkError(page: Page, callback: () => Promise<void>) {
  // Simulate network error
  await page.route('**/api/**', route => route.abort());
  
  try {
    await callback();
  } finally {
    // Restore network
    await page.unroute('**/api/**');
  }
}

export async function verifyErrorHandling(page: Page) {
  await expect(page.locator('text=error|failed|try again')).toBeVisible();
}

// Mobile helpers
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

export async function setTabletViewport(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 });
}

// Accessibility helpers
export async function checkAccessibility(page: Page) {
  // This would integrate with axe-core for accessibility testing
  // For now, just check basic accessibility features
  
  // Check for proper heading structure
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
  expect(headings).toBeGreaterThan(0);
  
  // Check for alt text on images
  const images = page.locator('img');
  const imageCount = await images.count();
  
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
  }
  
  // Check for form labels
  const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"], textarea');
  const inputCount = await inputs.count();
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const id = await input.getAttribute('id');
    if (id) {
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
    }
  }
}

// Performance helpers
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await navigateToPage(page, url);
  const endTime = Date.now();
  return endTime - startTime;
}

export async function verifyPageLoadTime(page: Page, url: string, maxTime: number = 3000) {
  const loadTime = await measurePageLoadTime(page, url);
  expect(loadTime).toBeLessThan(maxTime);
}

// Data cleanup helpers
export async function cleanupTestData(page: Page) {
  // This would clean up any test data created during tests
  // Implementation would depend on the backend API
  console.log('Cleaning up test data...');
}

// Screenshot helpers
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png` });
}

export async function takeFullPageScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-full.png`,
    fullPage: true 
  });
}