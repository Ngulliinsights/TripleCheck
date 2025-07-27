import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-End Testing Configuration
 * Tests complete user workflows across Chrome, Firefox, Safari, and Edge with various viewport sizes
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['line']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'chromium-tablet',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 }
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'firefox-tablet',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1024, height: 768 }
      },
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'webkit-tablet',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1024, height: 768 }
      },
    },

    {
      name: 'edge-desktop',
      use: { 
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    {
      name: 'mobile-samsung',
      use: { ...devices['Galaxy S9+'] },
    },

    /* Test against branded browsers. */
    {
      name: 'microsoft-edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'google-chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  /* Global test timeout */
  timeout: 30 * 1000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000,
  },
  
  /* Output directory for test results */
  outputDir: 'test-results/',
});