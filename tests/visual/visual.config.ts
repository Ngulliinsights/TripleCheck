import { defineConfig, devices } from '..\..\scripts\generate-test-chunks';

/**
 * Visual Regression Testing Configuration
 * 
 * Dedicated configuration for visual regression tests with screenshot comparison
 * across different browsers and viewport sizes.
 */
export default defineConfig({
  testDir: './tests/visual',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'test-results/visual-report' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    ['line']
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Always take screenshots for visual tests */
    screenshot: 'only-on-failure',
    
    /* Disable video for visual tests to save space */
    video: 'off',
    
    /* Visual comparison settings */
    expect: {
      // Threshold for pixel differences (0-1, where 0.2 = 20% difference allowed)
      threshold: 0.2,
      
      // Animation handling
      toHaveScreenshot: {
        // Disable animations for consistent screenshots
        animations: 'disabled',
        
        // Wait for fonts to load
        fonts: 'ready',
        
        // Clip to visible area
        clip: { x: 0, y: 0, width: 1920, height: 1080 },
        
        // Mask dynamic content
        mask: [
          // Mask timestamps, counters, or other dynamic content
          // Will be added per test as needed
        ]
      }
    }
  },

  /* Configure projects for visual testing across browsers and viewports */
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
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
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Tablet viewports
    {
      name: 'chromium-tablet',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 }
      },
    },
    
    {
      name: 'firefox-tablet',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1024, height: 768 }
      },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
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
  timeout: 60 * 1000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 15 * 1000,
  },
  
  /* Output directory for test results */
  outputDir: 'test-results/visual/',
});