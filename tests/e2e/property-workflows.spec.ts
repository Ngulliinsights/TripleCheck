import { test, expect, Page } from '@playwright/test';

/**
 * Property Search, Filtering, and Management E2E Tests
 * 
 * Tests property-related workflows including search, filtering, viewing, and management
 */

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

test.describe('Property Search, Filtering, and Booking Workflows', () => {
  test('should perform comprehensive property search with filters', async ({ page }) => {
    // Navigate to properties page
    await navigateToPage(page, '/properties');
    
    // Verify properties page loads
    await expect(page.locator('h1')).toContainText(/Properties|Browse/);
    
    // Perform basic search
    await fillFormField(page, 'input[placeholder*="Search"]', 'Nairobi');
    await clickAndWait(page, 'button:has-text("Search")');
    
    // Verify search results appear
    await expect(page.locator('[data-testid="property-card"]')).toHaveCount({ min: 1 });
    
    // Apply filters
    // Price range filter
    await page.fill('input[name="minPrice"]', '100000');
    await page.fill('input[name="maxPrice"]', '200000');
    
    // Property type filter
    await page.selectOption('select[name="propertyType"]', 'apartment');
    
    // Bedrooms filter
    await page.selectOption('select[name="bedrooms"]', '3');
    
    // Apply filters
    await clickAndWait(page, 'button:has-text("Apply Filters")');
    
    // Verify filtered results
    await page.waitForSelector('[data-testid="property-card"]');
    const propertyCards = page.locator('[data-testid="property-card"]');
    await expect(propertyCards).toHaveCount({ min: 1 });
    
    // Verify filter results contain expected criteria
    const firstProperty = propertyCards.first();
    await expect(firstProperty).toContainText(/apartment/i);
    await expect(firstProperty).toContainText(/3.*bed/i);
  });

  test('should view property details and contact owner', async ({ page }) => {
    // Navigate to properties and select first property
    await navigateToPage(page, '/properties');
    
    // Click on first property card
    await clickAndWait(page, '[data-testid="property-card"]:first-child', 'navigation');
    
    // Verify property details page
    await expect(page).toHaveURL(/\/property\/\d+/);
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify key property information is displayed
    await expect(page.locator('text=Bedrooms')).toBeVisible();
    await expect(page.locator('text=Bathrooms')).toBeVisible();
    await expect(page.locator('text=Price')).toBeVisible();
    
    // Test contact owner functionality
    await clickAndWait(page, 'button:has-text("Contact Owner")');
    
    // Verify contact modal or form appears
    const contactModal = page.locator('[data-testid="contact-modal"]');
    if (await contactModal.isVisible()) {
      await fillFormField(page, 'textarea[name="message"]', 'I am interested in this property. Can we schedule a viewing?');
      await clickAndWait(page, 'button:has-text("Send Message")');
      
      // Verify success message
      await expect(page.locator('text=sent')).toBeVisible();
    }
  });

  test('should save property to favorites and manage saved properties', async ({ page }) => {
    // Navigate to property details
    await navigateToPage(page, '/property/1');
    
    // Save property to favorites
    await clickAndWait(page, 'button:has-text("Save")');
    
    // Verify save confirmation
    await expect(page.locator('text=saved')).toBeVisible();
    
    // Navigate to saved properties
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'a:has-text("Saved Properties")');
    
    // Verify saved property appears in list
    await expect(page.locator('[data-testid="saved-property"]')).toHaveCount({ min: 1 });
    
    // Remove property from favorites
    await clickAndWait(page, 'button:has-text("Remove")');
    
    // Verify removal confirmation
    await expect(page.locator('text=removed')).toBeVisible();
  });

  test('should schedule property viewing', async ({ page }) => {
    // Navigate to property details
    await navigateToPage(page, '/property/1');
    
    // Click schedule viewing button
    await clickAndWait(page, 'button:has-text("Schedule Viewing")');
    
    // Fill viewing form
    await page.fill('input[type="date"]', '2024-12-31');
    await page.fill('input[type="time"]', '14:00');
    await fillFormField(page, 'textarea[name="notes"]', 'I would like to see the property and discuss the terms.');
    
    // Submit viewing request
    await clickAndWait(page, 'button:has-text("Request Viewing")');
    
    // Verify confirmation
    await expect(page.locator('text=viewing.*scheduled')).toBeVisible();
  });

  test('should compare multiple properties', async ({ page }) => {
    // Navigate to properties page
    await navigateToPage(page, '/properties');
    
    // Select multiple properties for comparison
    const propertyCards = page.locator('[data-testid="property-card"]');
    await propertyCards.first().locator('input[type="checkbox"]').check();
    await propertyCards.nth(1).locator('input[type="checkbox"]').check();
    
    // Click compare button
    await clickAndWait(page, 'button:has-text("Compare")');
    
    // Verify comparison page loads
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.locator('h1')).toContainText(/Compare/);
    
    // Verify both properties are displayed
    await expect(page.locator('[data-testid="comparison-property"]')).toHaveCount(2);
    
    // Verify comparison features are shown
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=Bedrooms')).toBeVisible();
    await expect(page.locator('text=Location')).toBeVisible();
  });
});

test.describe('Property Listing Creation and Management Workflows', () => {
  test('should create complete property listing', async ({ page }) => {
    // Navigate to list property page
    await navigateToPage(page, '/services/list-property');
    
    // Verify listing page loads
    await expect(page.locator('h1')).toContainText(/List.*Property/);
    
    // Step 1: Basic Details
    await fillFormField(page, 'input[name="title"]', TEST_PROPERTY.title);
    await page.selectOption('select[name="type"]', TEST_PROPERTY.type);
    await fillFormField(page, 'input[name="price"]', TEST_PROPERTY.price);
    await page.selectOption('select[name="ownershipStatus"]', 'freehold');
    
    // Proceed to next step
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Step 2: Features
    await fillFormField(page, 'input[name="beds"]', TEST_PROPERTY.bedrooms);
    await fillFormField(page, 'input[name="baths"]', TEST_PROPERTY.bathrooms);
    await fillFormField(page, 'input[name="area"]', TEST_PROPERTY.area);
    
    // Select amenities
    await page.check('input[id="swimming-pool"]');
    await page.check('input[id="security"]');
    await page.check('input[id="parking"]');
    
    // Proceed to next step
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Step 3: Location and Description
    await fillFormField(page, 'input[name="location"]', TEST_PROPERTY.location);
    await fillFormField(page, 'textarea[name="description"]', TEST_PROPERTY.description);
    
    // Proceed to next step
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Step 4: Documents
    await page.check('input[id="terms"]');
    
    // Submit property listing
    await clickAndWait(page, 'button:has-text("Submit Property")');
    
    // Verify successful submission
    await expect(page.locator('text=submitted.*successfully')).toBeVisible();
    
    // Verify redirect to dashboard or property management
    await expect(page).toHaveURL(/\/dashboard|\/properties\/my/);
  });

  test('should edit existing property listing', async ({ page }) => {
    // Navigate to my properties
    await navigateToPage(page, '/properties/my');
    
    // Click edit on first property
    await clickAndWait(page, 'button:has-text("Edit"):first', 'navigation');
    
    // Verify edit page loads
    await expect(page).toHaveURL(/\/property\/\d+\/edit/);
    
    // Update property information
    await fillFormField(page, 'input[name="title"]', 'Updated Property Title');
    await fillFormField(page, 'input[name="price"]', '175000');
    
    // Save changes
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // Verify success message
    await expect(page.locator('text=updated.*successfully')).toBeVisible();
  });

  test('should manage property photos', async ({ page }) => {
    // Navigate to property photos management
    await navigateToPage(page, '/property/1/photos');
    
    // Verify photos page loads
    await expect(page.locator('h1, h2')).toContainText(/Photos|Images/);
    
    // Test photo upload interface
    await clickAndWait(page, 'button:has-text("Add Photos")');
    
    // Verify upload interface appears
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Test photo reordering (if implemented)
    const photoItems = page.locator('[data-testid="photo-item"]');
    if (await photoItems.count() > 1) {
      // Simulate drag and drop reordering
      await photoItems.first().hover();
      await page.mouse.down();
      await photoItems.nth(1).hover();
      await page.mouse.up();
    }
    
    // Save photo changes
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // Verify success message
    await expect(page.locator('text=photos.*updated')).toBeVisible();
  });

  test('should delete property listing', async ({ page }) => {
    // Navigate to my properties
    await navigateToPage(page, '/properties/my');
    
    // Click delete on a property
    await clickAndWait(page, 'button:has-text("Delete"):first');
    
    // Confirm deletion in modal
    await clickAndWait(page, 'button:has-text("Confirm Delete")');
    
    // Verify deletion success
    await expect(page.locator('text=deleted.*successfully')).toBeVisible();
    
    // Verify property is removed from list
    await page.reload();
  });

  test('should handle property listing validation errors', async ({ page }) => {
    // Navigate to list property page
    await navigateToPage(page, '/services/list-property');
    
    // Try to proceed without filling required fields
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Verify validation errors appear
    await expect(page.locator('text=required')).toBeVisible();
    
    // Fill invalid price
    await fillFormField(page, 'input[name="price"]', 'invalid-price');
    await page.click('input[name="title"]'); // Trigger validation
    
    // Verify price validation error
    await expect(page.locator('text=valid.*price')).toBeVisible();
    
    // Fill negative values for bedrooms/bathrooms
    await fillFormField(page, 'input[name="beds"]', '-1');
    await page.click('input[name="title"]'); // Trigger validation
    
    // Verify validation error for negative values
    await expect(page.locator('text=positive|greater')).toBeVisible();
  });
});