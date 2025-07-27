import { test, expect, Page } from '@playwright/test';

/**
 * Authentication and User Registration E2E Tests
 * 
 * Tests complete user registration and onboarding workflows
 */

const TEST_USER = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
  phone: '+254700123456'
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

test.describe('User Registration and Onboarding Flow', () => {
  test('should complete full user registration process', async ({ page }) => {
    // Navigate to registration page
    await navigateToPage(page, '/auth/register');
    
    // Verify registration page loads correctly
    await expect(page).toHaveTitle(/Register/);
    await expect(page.locator('h1, h2')).toContainText(/Register|Sign Up|Create Account/);
    
    // Fill out registration form - Step 1: Basic Information
    await fillFormField(page, 'input[name="name"]', TEST_USER.name);
    await fillFormField(page, 'input[name="email"]', TEST_USER.email);
    await fillFormField(page, 'input[name="password"]', TEST_USER.password);
    await fillFormField(page, 'input[name="confirmPassword"]', TEST_USER.password);
    
    // Proceed to next step
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Step 2: Contact Information
    await fillFormField(page, 'input[name="phone"]', TEST_USER.phone);
    
    // Select user type
    await page.selectOption('select[name="userType"]', 'buyer');
    
    // Proceed to next step
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Step 3: Preferences (optional step)
    await page.check('input[name="emailNotifications"]');
    await page.check('input[name="smsNotifications"]');
    
    // Complete registration
    await clickAndWait(page, 'button:has-text("Complete Registration")', 'navigation');
    
    // Verify successful registration
    await expect(page).toHaveURL(/\/auth\/verify-email|\/dashboard/);
    
    // If redirected to email verification, verify the page content
    if (page.url().includes('verify-email')) {
      await expect(page.locator('text=verify')).toBeVisible();
      await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
    }
  });

  test('should handle registration form validation errors', async ({ page }) => {
    await navigateToPage(page, '/auth/register');
    
    // Try to submit empty form
    await clickAndWait(page, 'button:has-text("Next")');
    
    // Verify validation errors appear
    await expect(page.locator('text=required')).toBeVisible();
    
    // Fill invalid email
    await fillFormField(page, 'input[name="email"]', 'invalid-email');
    await page.click('input[name="name"]'); // Trigger validation
    
    // Verify email validation error
    await expect(page.locator('text=valid email')).toBeVisible();
    
    // Fill mismatched passwords
    await fillFormField(page, 'input[name="password"]', 'password1');
    await fillFormField(page, 'input[name="confirmPassword"]', 'password2');
    await page.click('input[name="name"]'); // Trigger validation
    
    // Verify password mismatch error
    await expect(page.locator('text=match')).toBeVisible();
  });

  test('should complete user login process', async ({ page }) => {
    // Navigate to login page
    await navigateToPage(page, '/auth/login');
    
    // Verify login page loads
    await expect(page).toHaveTitle(/Login/);
    await expect(page.locator('h1, h2')).toContainText(/Login|Sign In/);
    
    // Fill login form
    await fillFormField(page, 'input[name="email"]', TEST_USER.email);
    await fillFormField(page, 'input[name="password"]', TEST_USER.password);
    
    // Submit login
    await clickAndWait(page, 'button:has-text("Login")', 'navigation');
    
    // Verify successful login
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Welcome|Dashboard/);
  });

  test('should handle login validation errors', async ({ page }) => {
    await navigateToPage(page, '/auth/login');
    
    // Try to submit empty form
    await clickAndWait(page, 'button:has-text("Login")');
    
    // Verify validation errors
    await expect(page.locator('text=required')).toBeVisible();
    
    // Try invalid credentials
    await fillFormField(page, 'input[name="email"]', 'wrong@email.com');
    await fillFormField(page, 'input[name="password"]', 'wrongpassword');
    await clickAndWait(page, 'button:has-text("Login")');
    
    // Verify error message
    await expect(page.locator('text=invalid|incorrect')).toBeVisible();
  });

  test('should complete user onboarding after registration', async ({ page }) => {
    // Simulate logged-in state
    await page.goto('/dashboard');
    
    // Check if onboarding modal/tour appears for new users
    const onboardingModal = page.locator('[data-testid="onboarding-modal"]');
    if (await onboardingModal.isVisible()) {
      // Complete onboarding steps
      await clickAndWait(page, 'button:has-text("Get Started")');
      
      // Step through onboarding tour
      await clickAndWait(page, 'button:has-text("Next")');
      await clickAndWait(page, 'button:has-text("Next")');
      await clickAndWait(page, 'button:has-text("Finish")');
      
      // Verify onboarding completion
      await expect(onboardingModal).not.toBeVisible();
    }
    
    // Verify dashboard is accessible
    await expect(page.locator('h1')).toContainText(/Welcome|Dashboard/);
  });
});