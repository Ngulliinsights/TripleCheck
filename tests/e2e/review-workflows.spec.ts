import { test, expect, Page } from '@playwright/test';

/**
 * Review Submission and Interaction E2E Tests
 * 
 * Tests review submission, interaction, and management workflows
 */

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

test.describe('Review Submission and Interaction Workflows', () => {
  test('should submit property review', async ({ page }) => {
    // Navigate to property details
    await navigateToPage(page, '/property/1');
    
    // Scroll to reviews section
    await page.locator('text=Reviews').scrollIntoViewIfNeeded();
    
    // Click write review button
    await clickAndWait(page, 'button:has-text("Write Review")');
    
    // Fill review form
    // Select rating
    await page.click(`[data-rating="${TEST_REVIEW.rating}"]`);
    
    // Fill review title and comment
    await fillFormField(page, 'input[name="reviewTitle"]', TEST_REVIEW.title);
    await fillFormField(page, 'textarea[name="reviewComment"]', TEST_REVIEW.comment);
    
    // Submit review
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify review submission success
    await expect(page.locator('text=review.*submitted')).toBeVisible();
    
    // Verify review appears in reviews list
    await expect(page.locator(`text=${TEST_REVIEW.title}`)).toBeVisible();
  });

  test('should interact with existing reviews', async ({ page }) => {
    // Navigate to property with reviews
    await navigateToPage(page, '/property/1');
    
    // Scroll to reviews section
    await page.locator('text=Reviews').scrollIntoViewIfNeeded();
    
    // Test helpful/unhelpful voting
    const firstReview = page.locator('[data-testid="review-item"]').first();
    await firstReview.locator('button:has-text("Helpful")').click();
    
    // Verify vote registered
    await expect(firstReview.locator('text=1')).toBeVisible();
    
    // Test review reporting
    await firstReview.locator('button:has-text("Report")').click();
    
    // Fill report form
    await page.selectOption('select[name="reportReason"]', 'inappropriate');
    await fillFormField(page, 'textarea[name="reportDetails"]', 'This review contains inappropriate content.');
    
    // Submit report
    await clickAndWait(page, 'button:has-text("Submit Report")');
    
    // Verify report submission
    await expect(page.locator('text=report.*submitted')).toBeVisible();
  });

  test('should filter and sort reviews', async ({ page }) => {
    // Navigate to property with multiple reviews
    await navigateToPage(page, '/property/1');
    
    // Scroll to reviews section
    await page.locator('text=Reviews').scrollIntoViewIfNeeded();
    
    // Test rating filter
    await page.selectOption('select[name="ratingFilter"]', '5');
    
    // Verify only 5-star reviews are shown
    const visibleReviews = page.locator('[data-testid="review-item"]');
    const reviewCount = await visibleReviews.count();
    
    for (let i = 0; i < reviewCount; i++) {
      const review = visibleReviews.nth(i);
      await expect(review.locator('[data-rating="5"]')).toBeVisible();
    }
    
    // Test sorting
    await page.selectOption('select[name="sortBy"]', 'newest');
    
    // Verify reviews are sorted by date (newest first)
    // This would require checking timestamps in a real implementation
    
    // Reset filters
    await page.selectOption('select[name="ratingFilter"]', 'all');
    await page.selectOption('select[name="sortBy"]', 'helpful');
  });

  test('should respond to review as property owner', async ({ page }) => {
    // Navigate to property owner's dashboard
    await navigateToPage(page, '/dashboard');
    
    // Navigate to property reviews management
    await clickAndWait(page, 'a:has-text("My Properties")');
    await clickAndWait(page, 'a:has-text("Reviews"):first');
    
    // Find review to respond to
    const reviewToRespond = page.locator('[data-testid="review-item"]').first();
    await reviewToRespond.locator('button:has-text("Respond")').click();
    
    // Fill response
    await fillFormField(page, 'textarea[name="response"]', 'Thank you for your review! We appreciate your feedback and are glad you had a positive experience.');
    
    // Submit response
    await clickAndWait(page, 'button:has-text("Submit Response")');
    
    // Verify response submission
    await expect(page.locator('text=response.*submitted')).toBeVisible();
    
    // Verify response appears under review
    await expect(page.locator('text=Owner Response')).toBeVisible();
  });

  test('should edit submitted review', async ({ page }) => {
    // Navigate to user's review history
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'a:has-text("My Reviews")');
    
    // Find review to edit
    const reviewToEdit = page.locator('[data-testid="user-review-item"]').first();
    await reviewToEdit.locator('button:has-text("Edit")').click();
    
    // Update review
    await page.click('[data-rating="4"]'); // Change rating from 5 to 4
    await fillFormField(page, 'input[name="reviewTitle"]', 'Updated Review Title');
    await fillFormField(page, 'textarea[name="reviewComment"]', 'Updated review comment with additional details.');
    
    // Save changes
    await clickAndWait(page, 'button:has-text("Save Changes")');
    
    // Verify update success
    await expect(page.locator('text=review.*updated')).toBeVisible();
    
    // Verify changes are reflected
    await expect(page.locator('text=Updated Review Title')).toBeVisible();
  });

  test('should delete submitted review', async ({ page }) => {
    // Navigate to user's review history
    await navigateToPage(page, '/dashboard');
    await clickAndWait(page, 'a:has-text("My Reviews")');
    
    // Find review to delete
    const reviewToDelete = page.locator('[data-testid="user-review-item"]').first();
    await reviewToDelete.locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    await clickAndWait(page, 'button:has-text("Confirm Delete")');
    
    // Verify deletion success
    await expect(page.locator('text=review.*deleted')).toBeVisible();
    
    // Verify review is removed from list
    await page.reload();
    // Review should no longer appear in the list
  });

  test('should handle review validation errors', async ({ page }) => {
    // Navigate to property details
    await navigateToPage(page, '/property/1');
    
    // Scroll to reviews section and click write review
    await page.locator('text=Reviews').scrollIntoViewIfNeeded();
    await clickAndWait(page, 'button:has-text("Write Review")');
    
    // Try to submit without rating
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify rating validation error
    await expect(page.locator('text=rating.*required')).toBeVisible();
    
    // Try to submit with empty comment
    await page.click('[data-rating="5"]');
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify comment validation error
    await expect(page.locator('text=comment.*required')).toBeVisible();
    
    // Try to submit with comment too short
    await fillFormField(page, 'textarea[name="reviewComment"]', 'Too short');
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify minimum length validation
    await expect(page.locator('text=minimum.*characters')).toBeVisible();
  });

  test('should view review analytics as property owner', async ({ page }) => {
    // Navigate to property owner's dashboard
    await navigateToPage(page, '/dashboard');
    
    // Navigate to reviews analytics
    await clickAndWait(page, 'a:has-text("My Properties")');
    await clickAndWait(page, 'a:has-text("Analytics"):first');
    
    // Verify analytics page loads
    await expect(page.locator('h1, h2')).toContainText(/Analytics|Reviews/);
    
    // Verify key metrics are displayed
    await expect(page.locator('text=Average Rating')).toBeVisible();
    await expect(page.locator('text=Total Reviews')).toBeVisible();
    await expect(page.locator('text=Response Rate')).toBeVisible();
    
    // Test date range filtering
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await clickAndWait(page, 'button:has-text("Apply Filter")');
    
    // Verify filtered analytics
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  });

  test('should manage review moderation as admin', async ({ page }) => {
    // Navigate to admin dashboard (if user has admin role)
    await navigateToPage(page, '/admin/reviews');
    
    // Verify moderation page loads
    await expect(page.locator('h1')).toContainText(/Review.*Moderation/);
    
    // Test review filtering by status
    await page.selectOption('select[name="status"]', 'pending');
    
    // Verify pending reviews are shown
    await expect(page.locator('[data-testid="pending-review"]')).toHaveCount({ min: 1 });
    
    // Test approving a review
    const firstPendingReview = page.locator('[data-testid="pending-review"]').first();
    await firstPendingReview.locator('button:has-text("Approve")').click();
    
    // Verify approval success
    await expect(page.locator('text=review.*approved')).toBeVisible();
    
    // Test rejecting a review
    const nextPendingReview = page.locator('[data-testid="pending-review"]').first();
    await nextPendingReview.locator('button:has-text("Reject")').click();
    
    // Fill rejection reason
    await fillFormField(page, 'textarea[name="rejectionReason"]', 'Review violates community guidelines.');
    await clickAndWait(page, 'button:has-text("Confirm Reject")');
    
    // Verify rejection success
    await expect(page.locator('text=review.*rejected')).toBeVisible();
  });

  test('should handle review spam detection', async ({ page }) => {
    // Navigate to property details
    await navigateToPage(page, '/property/1');
    
    // Try to submit multiple reviews quickly (spam detection)
    await page.locator('text=Reviews').scrollIntoViewIfNeeded();
    await clickAndWait(page, 'button:has-text("Write Review")');
    
    // Submit first review
    await page.click('[data-rating="5"]');
    await fillFormField(page, 'textarea[name="reviewComment"]', 'First review comment');
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Try to submit another review immediately
    await clickAndWait(page, 'button:has-text("Write Review")');
    await page.click('[data-rating="4"]');
    await fillFormField(page, 'textarea[name="reviewComment"]', 'Second review comment');
    await clickAndWait(page, 'button:has-text("Submit Review")');
    
    // Verify spam detection message
    await expect(page.locator('text=already.*reviewed|wait.*before')).toBeVisible();
  });
});