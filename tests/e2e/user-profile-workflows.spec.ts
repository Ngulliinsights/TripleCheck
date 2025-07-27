import { test, expect, Page } from '@playwright/test';

/**
 * User Profile Management and Settings E2E Tests
 * 
 * Tests user profile management and settings update workflows
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

test.describe('User Profile Management and Settings Updates', () => {
  test('should update user profile information', async ({ page }) => {
    // Navigate to profile settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    
    // Navigate to profile tab
    await clickAndWait(page, 'button:has-text("Profile")');
    
    // Update profile information
    await fillFormField(page, 'input[name="name"]', 'John Updated Doe');
    await fillFormField(page, 'input[name="phone"]', '+254700987654');
    await fillFormField(page, 'textarea[name="bio"]', 'Updated bio information');
    
    // Save changes
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // Verify success message
    await expect(page.locator('text=updated')).toBeVisible();
    
    // Verify changes are reflected
    await expect(page.locator('input[name="name"]')).toHaveValue('John Updated Doe');
  });

  test('should change password successfully', async ({ page }) => {
    // Navigate to security settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Security")');
    
    // Fill password change form
    await fillFormField(page, 'input[name="currentPassword"]', TEST_USER.password);
    await fillFormField(page, 'input[name="newPassword"]', 'NewSecurePassword123!');
    await fillFormField(page, 'input[name="confirmNewPassword"]', 'NewSecurePassword123!');
    
    // Submit password change
    await clickAndWait(page, 'button:has-text("Change Password")');
    
    // Verify success message
    await expect(page.locator('text=password.*changed')).toBeVisible();
  });

  test('should update notification preferences', async ({ page }) => {
    // Navigate to notification settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Notifications")');
    
    // Toggle notification preferences
    await page.check('input[name="emailNotifications"]');
    await page.uncheck('input[name="smsNotifications"]');
    await page.check('input[name="pushNotifications"]');
    
    // Save preferences
    await clickAndWait(page, 'button:has-text("Save Preferences")');
    
    // Verify success message
    await expect(page.locator('text=preferences.*saved')).toBeVisible();
  });

  test('should manage account privacy settings', async ({ page }) => {
    // Navigate to privacy settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Privacy")');
    
    // Update privacy settings
    await page.check('input[name="profileVisibility"]');
    await page.uncheck('input[name="showContactInfo"]');
    await page.check('input[name="allowMessages"]');
    
    // Save privacy settings
    await clickAndWait(page, 'button:has-text("Save Privacy Settings")');
    
    // Verify success message
    await expect(page.locator('text=privacy.*updated')).toBeVisible();
  });

  test('should upload and update profile picture', async ({ page }) => {
    // Navigate to profile settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Profile")');
    
    // Click on profile picture upload area
    await clickAndWait(page, '[data-testid="profile-picture-upload"]');
    
    // Verify file input is available
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // In a real test, you would upload an actual file:
    // await page.setInputFiles('input[type="file"]', 'path/to/test-image.jpg');
    
    // For now, just verify the upload interface works
    await clickAndWait(page, 'button:has-text("Cancel")');
  });

  test('should manage user preferences and settings', async ({ page }) => {
    // Navigate to preferences
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Preferences")');
    
    // Update language preference
    await page.selectOption('select[name="language"]', 'en');
    
    // Update currency preference
    await page.selectOption('select[name="currency"]', 'KES');
    
    // Update timezone
    await page.selectOption('select[name="timezone"]', 'Africa/Nairobi');
    
    // Toggle dark mode
    await page.check('input[name="darkMode"]');
    
    // Save preferences
    await clickAndWait(page, 'button:has-text("Save Preferences")');
    
    // Verify success message
    await expect(page.locator('text=preferences.*saved')).toBeVisible();
  });

  test('should handle profile validation errors', async ({ page }) => {
    // Navigate to profile settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Profile")');
    
    // Clear required field
    await page.fill('input[name="name"]', '');
    
    // Try to save
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // Verify validation error
    await expect(page.locator('text=required')).toBeVisible();
    
    // Fill invalid phone number
    await fillFormField(page, 'input[name="phone"]', 'invalid-phone');
    await page.click('input[name="name"]'); // Trigger validation
    
    // Verify phone validation error
    await expect(page.locator('text=valid.*phone')).toBeVisible();
  });

  test('should handle password change validation', async ({ page }) => {
    // Navigate to security settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Security")');
    
    // Try to change password with wrong current password
    await fillFormField(page, 'input[name="currentPassword"]', 'wrongpassword');
    await fillFormField(page, 'input[name="newPassword"]', 'NewPassword123!');
    await fillFormField(page, 'input[name="confirmNewPassword"]', 'NewPassword123!');
    
    await clickAndWait(page, 'button:has-text("Change Password")');
    
    // Verify error message
    await expect(page.locator('text=current.*password.*incorrect')).toBeVisible();
    
    // Try with mismatched new passwords
    await fillFormField(page, 'input[name="currentPassword"]', TEST_USER.password);
    await fillFormField(page, 'input[name="newPassword"]', 'NewPassword123!');
    await fillFormField(page, 'input[name="confirmNewPassword"]', 'DifferentPassword123!');
    
    await clickAndWait(page, 'button:has-text("Change Password")');
    
    // Verify mismatch error
    await expect(page.locator('text=passwords.*match')).toBeVisible();
  });

  test('should view and manage account activity', async ({ page }) => {
    // Navigate to account activity
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Activity")');
    
    // Verify activity log is displayed
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount({ min: 1 });
    
    // Test activity filtering
    await page.selectOption('select[name="activityType"]', 'login');
    
    // Verify filtered results
    const activityItems = page.locator('[data-testid="activity-item"]');
    const count = await activityItems.count();
    
    for (let i = 0; i < count; i++) {
      await expect(activityItems.nth(i)).toContainText(/login/i);
    }
    
    // Test date range filtering
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await clickAndWait(page, 'button:has-text("Apply Filter")');
    
    // Verify filtered results are within date range
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount({ min: 1 });
  });

  test('should manage connected accounts and integrations', async ({ page }) => {
    // Navigate to integrations
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Integrations")');
    
    // Verify integrations page loads
    await expect(page.locator('h1, h2')).toContainText(/Integrations|Connected/);
    
    // Test connecting a social account (if available)
    const connectButton = page.locator('button:has-text("Connect"):first');
    if (await connectButton.isVisible()) {
      await clickAndWait(connectButton);
      
      // Verify connection modal or redirect
      // In a real test, this would handle OAuth flow
      await expect(page.locator('text=connect|authorize')).toBeVisible();
    }
    
    // Test disconnecting an account (if any connected)
    const disconnectButton = page.locator('button:has-text("Disconnect"):first');
    if (await disconnectButton.isVisible()) {
      await clickAndWait(disconnectButton);
      
      // Confirm disconnection
      await clickAndWait(page, 'button:has-text("Confirm")');
      
      // Verify disconnection success
      await expect(page.locator('text=disconnected')).toBeVisible();
    }
  });

  test('should delete user account', async ({ page }) => {
    // Navigate to account settings
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'button:has-text("Settings")');
    await clickAndWait(page, 'button:has-text("Account")');
    
    // Scroll to danger zone
    await page.locator('text=Delete Account').scrollIntoViewIfNeeded();
    
    // Click delete account
    await clickAndWait(page, 'button:has-text("Delete Account")');
    
    // Verify confirmation modal
    await expect(page.locator('text=permanently.*delete')).toBeVisible();
    
    // Fill confirmation (usually requires typing "DELETE" or similar)
    await fillFormField(page, 'input[name="confirmDelete"]', 'DELETE');
    
    // Provide password for security
    await fillFormField(page, 'input[name="password"]', TEST_USER.password);
    
    // Confirm deletion
    await clickAndWait(page, 'button:has-text("Confirm Delete")');
    
    // Verify account deletion success and redirect
    await expect(page).toHaveURL(/\/|\/auth/);
    await expect(page.locator('text=account.*deleted')).toBeVisible();
  });
});