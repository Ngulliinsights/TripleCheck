import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';
import { app } from '../../app';
import { Server } from 'http';

describe('Land Verification End-to-End Workflow Tests', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let baseURL: string;

  beforeAll(async () => {
    // Start the server
    server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseURL = `http://localhost:${port}`;

    // Launch browser
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.CI !== 'true' ? 100 : 0
    });

    page = await browser.newPage();
    
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    await browser?.close();
    server?.close();
  });

  describe('Complete Land Verification User Journey', () => {
    it('should allow user to complete full land verification workflow', async () => {
      // Step 1: Navigate to home page
      await page.goto(baseURL);
      await expect(page).toHaveTitle(/TripleCheck/);

      // Step 2: Register new user
      await page.click('text=Register');
      await page.fill('[data-testid="email-input"]', 'e2e-test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="name-input"]', 'E2E Test User');
      await page.click('[data-testid="register-button"]');

      // Wait for successful registration
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });

      // Step 3: Navigate to land verification
      await page.click('text=Land Verification');
      await page.waitForURL('**/land-verification');

      // Step 4: Start new verification
      await page.click('[data-testid="new-verification-button"]');
      await page.waitForURL('**/land-verification/new');

      // Step 5: Fill property details
      await page.fill('[data-testid="property-title"]', 'Test Land Property');
      await page.fill('[data-testid="property-location"]', 'Nairobi, Westlands');
      await page.fill('[data-testid="title-number"]', 'NAIROBI/BLOCK1/123');
      await page.selectOption('[data-testid="property-type"]', 'land');

      // Step 6: Upload documents
      const titleDeedPath = './test-fixtures/sample-title-deed.pdf';
      await page.setInputFiles('[data-testid="title-deed-upload"]', titleDeedPath);
      
      // Wait for document processing
      await page.waitForSelector('[data-testid="document-processed"]', { timeout: 15000 });

      // Step 7: Start verification process
      await page.click('[data-testid="start-verification-button"]');
      await page.waitForURL('**/land-verification/session/*');

      // Step 8: Complete Registry Verification Layer
      await page.click('[data-testid="registry-verification-tab"]');
      await page.waitForSelector('[data-testid="registry-verification-panel"]');
      
      // Verify registry check results are displayed
      await expect(page.locator('[data-testid="ownership-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="title-validity"]')).toBeVisible();
      
      // Mark registry verification as reviewed
      await page.click('[data-testid="approve-registry-verification"]');

      // Step 9: Complete Physical Verification Layer
      await page.click('[data-testid="physical-verification-tab"]');
      await page.waitForSelector('[data-testid="physical-verification-panel"]');
      
      // Input GPS coordinates
      await page.fill('[data-testid="latitude-input"]', '-1.2921');
      await page.fill('[data-testid="longitude-input"]', '36.8219');
      await page.click('[data-testid="validate-coordinates"]');
      
      // Wait for coordinate validation
      await page.waitForSelector('[data-testid="coordinates-validated"]');
      
      // Upload boundary photos
      const boundaryPhotoPath = './test-fixtures/boundary-photo.jpg';
      await page.setInputFiles('[data-testid="boundary-photos-upload"]', boundaryPhotoPath);
      
      // Mark physical verification as complete
      await page.click('[data-testid="complete-physical-verification"]');

      // Step 10: Complete Community Intelligence Layer
      await page.click('[data-testid="community-verification-tab"]');
      await page.waitForSelector('[data-testid="community-verification-panel"]');
      
      // Fill community feedback form
      await page.fill('[data-testid="local-admin-name"]', 'Chief John Doe');
      await page.fill('[data-testid="community-feedback"]', 'Property has been owned by the same family for 10 years. No known disputes.');
      await page.selectOption('[data-testid="feedback-reliability"]', 'high');
      
      // Submit community intelligence
      await page.click('[data-testid="submit-community-feedback"]');
      await page.waitForSelector('[data-testid="community-feedback-submitted"]');

      // Step 11: Review Risk Assessment
      await page.click('[data-testid="risk-assessment-tab"]');
      await page.waitForSelector('[data-testid="risk-assessment-panel"]');
      
      // Wait for risk calculation to complete
      await page.waitForSelector('[data-testid="risk-score"]', { timeout: 10000 });
      
      // Verify risk assessment components are displayed
      await expect(page.locator('[data-testid="overall-risk-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="risk-factors-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
      
      // Check that risk level is reasonable (not critical for a clean test case)
      const riskLevel = await page.textContent('[data-testid="risk-level"]');
      expect(['low', 'medium', 'high']).toContain(riskLevel?.toLowerCase());

      // Step 12: Generate Final Report
      await page.click('[data-testid="generate-report-button"]');
      await page.waitForSelector('[data-testid="report-generated"]', { timeout: 15000 });
      
      // Verify report sections are present
      await expect(page.locator('[data-testid="executive-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="verification-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="risk-analysis"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();

      // Step 13: Download Report
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-report-button"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/land-verification-report.*\.pdf/);

      // Step 14: Set up Monitoring
      await page.click('[data-testid="setup-monitoring-button"]');
      await page.waitForSelector('[data-testid="monitoring-setup-modal"]');
      
      await page.check('[data-testid="monitor-government-changes"]');
      await page.check('[data-testid="monitor-legal-disputes"]');
      await page.selectOption('[data-testid="monitoring-frequency"]', 'monthly');
      
      await page.click('[data-testid="activate-monitoring"]');
      await page.waitForSelector('[data-testid="monitoring-activated"]');

      // Step 15: Verify Integration with Property Listing
      await page.goto(`${baseURL}/properties`);
      await page.waitForSelector('[data-testid="property-listings"]');
      
      // Find the verified property
      const verifiedProperty = page.locator('[data-testid="property-card"]').filter({
        hasText: 'Test Land Property'
      });
      
      await expect(verifiedProperty).toBeVisible();
      await expect(verifiedProperty.locator('[data-testid="land-verification-badge"]')).toBeVisible();
      
      // Click on property to view details
      await verifiedProperty.click();
      await page.waitForURL('**/property/*');
      
      // Verify land verification information is displayed
      await expect(page.locator('[data-testid="land-verification-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="verification-summary"]')).toBeVisible();
    });

    it('should handle verification workflow with high-risk property', async () => {
      // Navigate to new verification
      await page.goto(`${baseURL}/land-verification/new`);

      // Fill high-risk property details
      await page.fill('[data-testid="property-title"]', 'High Risk Test Property');
      await page.fill('[data-testid="property-location"]', 'Nairobi, Industrial Area');
      await page.fill('[data-testid="title-number"]', 'NAIROBI/INDUSTRIAL/456');
      
      // Upload problematic documents
      const problematicDeedPath = './test-fixtures/problematic-title-deed.pdf';
      await page.setInputFiles('[data-testid="title-deed-upload"]', problematicDeedPath);
      
      await page.click('[data-testid="start-verification-button"]');
      await page.waitForURL('**/land-verification/session/*');

      // Complete verification layers with concerning findings
      await page.click('[data-testid="registry-verification-tab"]');
      
      // Should show warnings for problematic findings
      await expect(page.locator('[data-testid="ownership-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="dispute-alert"]')).toBeVisible();

      // Complete all layers
      await page.click('[data-testid="physical-verification-tab"]');
      await page.fill('[data-testid="latitude-input"]', '-1.3000');
      await page.fill('[data-testid="longitude-input"]', '36.8500');
      await page.click('[data-testid="validate-coordinates"]');
      
      // Should show boundary discrepancies
      await page.waitForSelector('[data-testid="boundary-discrepancy-warning"]');
      
      await page.click('[data-testid="community-verification-tab"]');
      await page.fill('[data-testid="community-feedback"]', 'There have been ongoing disputes about this property. Multiple claimants.');
      await page.selectOption('[data-testid="feedback-reliability"]', 'medium');
      await page.click('[data-testid="submit-community-feedback"]');

      // Check risk assessment shows high risk
      await page.click('[data-testid="risk-assessment-tab"]');
      await page.waitForSelector('[data-testid="risk-score"]');
      
      const riskLevel = await page.textContent('[data-testid="risk-level"]');
      expect(riskLevel?.toLowerCase()).toBe('high');
      
      // Verify appropriate warnings and recommendations are shown
      await expect(page.locator('[data-testid="high-risk-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="legal-counsel-recommendation"]')).toBeVisible();
      await expect(page.locator('[data-testid="additional-verification-recommendation"]')).toBeVisible();
    });

    it('should handle expert coordination workflow', async () => {
      await page.goto(`${baseURL}/land-verification/new`);

      // Start verification requiring expert coordination
      await page.fill('[data-testid="property-title"]', 'Complex Property Requiring Experts');
      await page.fill('[data-testid="property-location"]', 'Kiambu, Thika');
      await page.check('[data-testid="require-surveyor"]');
      await page.check('[data-testid="require-legal-counsel"]');
      
      await page.click('[data-testid="start-verification-button"]');
      await page.waitForURL('**/land-verification/session/*');

      // Navigate to expert coordination tab
      await page.click('[data-testid="expert-coordination-tab"]');
      await page.waitForSelector('[data-testid="expert-coordination-panel"]');

      // Request surveyor
      await page.click('[data-testid="request-surveyor-button"]');
      await page.waitForSelector('[data-testid="surveyor-selection-modal"]');
      
      await page.selectOption('[data-testid="surveyor-selection"]', 'licensed-surveyor-1');
      await page.fill('[data-testid="survey-requirements"]', 'Full boundary survey with GPS coordinates');
      await page.click('[data-testid="confirm-surveyor-request"]');
      
      await page.waitForSelector('[data-testid="surveyor-requested"]');

      // Request legal counsel
      await page.click('[data-testid="request-legal-counsel-button"]');
      await page.waitForSelector('[data-testid="legal-counsel-modal"]');
      
      await page.selectOption('[data-testid="legal-counsel-selection"]', 'property-lawyer-1');
      await page.fill('[data-testid="legal-requirements"]', 'Review title deed and check for encumbrances');
      await page.click('[data-testid="confirm-legal-counsel-request"]');
      
      await page.waitForSelector('[data-testid="legal-counsel-requested"]');

      // Verify expert coordination status
      await expect(page.locator('[data-testid="surveyor-status"]')).toHaveText('Requested');
      await expect(page.locator('[data-testid="legal-counsel-status"]')).toHaveText('Requested');
      
      // Mock expert report submission (in real scenario, experts would submit via separate interface)
      await page.click('[data-testid="mock-expert-reports"]'); // Test helper
      
      // Verify expert reports are integrated
      await page.waitForSelector('[data-testid="surveyor-report-received"]');
      await page.waitForSelector('[data-testid="legal-report-received"]');
      
      // Review expert findings
      await page.click('[data-testid="review-surveyor-report"]');
      await expect(page.locator('[data-testid="survey-findings"]')).toBeVisible();
      
      await page.click('[data-testid="review-legal-report"]');
      await expect(page.locator('[data-testid="legal-findings"]')).toBeVisible();
    });

    it('should handle monitoring and alerts workflow', async () => {
      // Assume we have a completed verification session
      await page.goto(`${baseURL}/land-verification/dashboard`);
      await page.waitForSelector('[data-testid="verification-sessions-list"]');

      // Click on a completed session
      await page.click('[data-testid="completed-session"]:first-child');
      
      // Navigate to monitoring tab
      await page.click('[data-testid="monitoring-tab"]');
      await page.waitForSelector('[data-testid="monitoring-panel"]');

      // Verify monitoring is active
      await expect(page.locator('[data-testid="monitoring-status"]')).toHaveText('Active');
      
      // Check monitoring history
      await page.click('[data-testid="monitoring-history-button"]');
      await page.waitForSelector('[data-testid="monitoring-history-modal"]');
      
      await expect(page.locator('[data-testid="monitoring-checks-list"]')).toBeVisible();
      
      // Simulate alert generation (test helper)
      await page.click('[data-testid="simulate-government-change"]');
      await page.waitForSelector('[data-testid="new-alert-notification"]');
      
      // Navigate to alerts
      await page.click('[data-testid="view-alerts-button"]');
      await page.waitForSelector('[data-testid="alerts-list"]');
      
      // Verify alert details
      const alert = page.locator('[data-testid="alert-item"]:first-child');
      await expect(alert.locator('[data-testid="alert-type"]')).toHaveText('Government Designation Change');
      await expect(alert.locator('[data-testid="alert-severity"]')).toBeVisible();
      
      // Acknowledge alert
      await alert.locator('[data-testid="acknowledge-alert"]').click();
      await expect(alert.locator('[data-testid="alert-status"]')).toHaveText('Acknowledged');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      await page.goto(`${baseURL}/land-verification/new`);
      
      // Simulate network failure
      await page.route('**/api/land-verification/**', route => {
        route.abort('failed');
      });
      
      await page.fill('[data-testid="property-title"]', 'Network Test Property');
      await page.click('[data-testid="start-verification-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Restore network and retry
      await page.unroute('**/api/land-verification/**');
      await page.click('[data-testid="retry-button"]');
      
      // Should proceed normally
      await page.waitForURL('**/land-verification/session/*');
    });

    it('should handle invalid document uploads', async () => {
      await page.goto(`${baseURL}/land-verification/new`);
      
      // Try to upload invalid file
      const invalidFilePath = './test-fixtures/invalid-document.txt';
      await page.setInputFiles('[data-testid="title-deed-upload"]', invalidFilePath);
      
      // Should show validation error
      await expect(page.locator('[data-testid="invalid-file-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="start-verification-button"]')).toBeDisabled();
      
      // Upload valid file
      const validFilePath = './test-fixtures/sample-title-deed.pdf';
      await page.setInputFiles('[data-testid="title-deed-upload"]', validFilePath);
      
      // Should clear error and enable button
      await expect(page.locator('[data-testid="invalid-file-error"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="start-verification-button"]')).toBeEnabled();
    });

    it('should handle session timeout gracefully', async () => {
      await page.goto(`${baseURL}/land-verification/new`);
      
      // Start verification
      await page.fill('[data-testid="property-title"]', 'Timeout Test Property');
      await page.click('[data-testid="start-verification-button"]');
      await page.waitForURL('**/land-verification/session/*');
      
      // Simulate session timeout
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        sessionStorage.clear();
      });
      
      // Try to perform action
      await page.click('[data-testid="registry-verification-tab"]');
      
      // Should redirect to login
      await page.waitForURL('**/auth/login');
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
    });
  });

  describe('Accessibility and Usability Tests', () => {
    it('should be accessible to screen readers', async () => {
      await page.goto(`${baseURL}/land-verification`);
      
      // Check for proper ARIA labels
      await expect(page.locator('[aria-label="Land Verification Dashboard"]')).toBeVisible();
      await expect(page.locator('[aria-label="Start New Verification"]')).toBeVisible();
      
      // Check keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'new-verification-button');
      
      await page.keyboard.press('Enter');
      await page.waitForURL('**/land-verification/new');
      
      // Verify form accessibility
      const titleInput = page.locator('[data-testid="property-title"]');
      await expect(titleInput).toHaveAttribute('aria-required', 'true');
      await expect(titleInput).toHaveAttribute('aria-describedby');
    });

    it('should work on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${baseURL}/land-verification`);
      
      // Check mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Start verification on mobile
      await page.click('[data-testid="new-verification-mobile"]');
      await page.waitForURL('**/land-verification/new');
      
      // Verify mobile-optimized form
      await expect(page.locator('[data-testid="mobile-form-container"]')).toBeVisible();
      
      // Test touch interactions
      await page.tap('[data-testid="property-title"]');
      await page.fill('[data-testid="property-title"]', 'Mobile Test Property');
      
      // Verify mobile file upload
      await page.tap('[data-testid="mobile-file-upload"]');
      await expect(page.locator('[data-testid="file-upload-modal"]')).toBeVisible();
    });
  });
});