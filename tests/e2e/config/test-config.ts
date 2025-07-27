/**
 * E2E Test Configuration
 * 
 * Configuration settings for end-to-end tests
 */

export const TEST_CONFIG = {
  // Base URLs for different environments
  BASE_URLS: {
    development: 'http://localhost:3003',
    staging: 'https://staging.triplecheck.com',
    production: 'https://triplecheck.com'
  },

  // Test timeouts
  TIMEOUTS: {
    default: 30000,
    navigation: 10000,
    element: 5000,
    api: 15000
  },

  // Test data
  TEST_USERS: {
    buyer: {
      name: 'John Buyer',
      email: 'buyer@test.com',
      password: 'BuyerPassword123!',
      phone: '+254700123456'
    },
    seller: {
      name: 'Jane Seller',
      email: 'seller@test.com',
      password: 'SellerPassword123!',
      phone: '+254700654321'
    },
    admin: {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'AdminPassword123!',
      phone: '+254700111222'
    }
  },

  // Test properties
  TEST_PROPERTIES: {
    apartment: {
      title: 'Modern 3-Bedroom Apartment in Nairobi',
      type: 'apartment',
      price: '150000',
      bedrooms: '3',
      bathrooms: '2',
      area: '1200',
      location: 'Westlands, Nairobi',
      description: 'Beautiful modern apartment with stunning city views.'
    },
    house: {
      title: 'Spacious 4-Bedroom House in Karen',
      type: 'house',
      price: '350000',
      bedrooms: '4',
      bathrooms: '3',
      area: '2500',
      location: 'Karen, Nairobi',
      description: 'Luxurious family home with large garden and modern amenities.'
    },
    commercial: {
      title: 'Prime Office Space in CBD',
      type: 'commercial',
      price: '500000',
      bedrooms: '0',
      bathrooms: '2',
      area: '1800',
      location: 'Nairobi CBD',
      description: 'Premium office space in the heart of Nairobi business district.'
    }
  },

  // Browser configurations
  BROWSERS: {
    chromium: {
      name: 'chromium',
      viewport: { width: 1920, height: 1080 }
    },
    firefox: {
      name: 'firefox',
      viewport: { width: 1920, height: 1080 }
    },
    webkit: {
      name: 'webkit',
      viewport: { width: 1920, height: 1080 }
    }
  },

  // Mobile devices
  MOBILE_DEVICES: {
    iphone: {
      name: 'iPhone 12',
      viewport: { width: 390, height: 844 }
    },
    android: {
      name: 'Pixel 5',
      viewport: { width: 393, height: 851 }
    },
    tablet: {
      name: 'iPad',
      viewport: { width: 768, height: 1024 }
    }
  },

  // Test selectors
  SELECTORS: {
    // Navigation
    userMenu: '[data-testid="user-menu"]',
    mobileMenu: '[data-testid="mobile-menu"]',
    mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',
    
    // Property cards
    propertyCard: '[data-testid="property-card"]',
    savedProperty: '[data-testid="saved-property"]',
    
    // Forms
    loginForm: '[data-testid="login-form"]',
    registerForm: '[data-testid="register-form"]',
    propertyForm: '[data-testid="property-form"]',
    
    // Modals
    contactModal: '[data-testid="contact-modal"]',
    confirmModal: '[data-testid="confirm-modal"]',
    onboardingModal: '[data-testid="onboarding-modal"]',
    
    // Reviews
    reviewItem: '[data-testid="review-item"]',
    userReviewItem: '[data-testid="user-review-item"]',
    
    // Activity
    activityItem: '[data-testid="activity-item"]',
    
    // Photos
    photoItem: '[data-testid="photo-item"]',
    
    // Filters
    desktopFilters: '[data-testid="desktop-filters"]',
    mobileFilters: '[data-testid="mobile-filters"]',
    
    // Dashboard
    mobileDashboard: '[data-testid="mobile-dashboard"]',
    
    // Forms
    mobileForm: '[data-testid="mobile-form"]',
    
    // Comparison
    comparisonProperty: '[data-testid="comparison-property"]',
    
    // Notifications
    notification: '[data-testid="notification"]',
    
    // Analytics
    analyticsChart: '[data-testid="analytics-chart"]',
    
    // Profile
    profilePictureUpload: '[data-testid="profile-picture-upload"]'
  },

  // API endpoints for mocking
  API_ENDPOINTS: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      logout: '/api/auth/logout'
    },
    properties: {
      list: '/api/properties',
      create: '/api/properties',
      update: '/api/properties/:id',
      delete: '/api/properties/:id'
    },
    reviews: {
      list: '/api/reviews',
      create: '/api/reviews',
      update: '/api/reviews/:id',
      delete: '/api/reviews/:id'
    },
    users: {
      profile: '/api/users/profile',
      update: '/api/users/profile',
      settings: '/api/users/settings'
    }
  },

  // Test patterns
  PATTERNS: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+254\d{9}$/,
    price: /^\d+$/,
    url: /^https?:\/\/.+/
  },

  // Performance thresholds
  PERFORMANCE: {
    pageLoadTime: 3000,
    apiResponseTime: 2000,
    imageLoadTime: 1000
  },

  // Accessibility standards
  ACCESSIBILITY: {
    colorContrastRatio: 4.5,
    minimumTouchTarget: 44,
    maxHeadingLevels: 6
  },

  // Test environment variables
  ENV: {
    CI: process.env.CI === 'true',
    DEBUG: process.env.DEBUG === 'true',
    HEADLESS: process.env.HEADLESS !== 'false',
    SLOW_MO: parseInt(process.env.SLOW_MO || '0'),
    TIMEOUT: parseInt(process.env.TIMEOUT || '30000')
  }
};

// Helper function to get base URL for current environment
export function getBaseUrl(): string {
  const env = process.env.NODE_ENV || 'development';
  return process.env.PLAYWRIGHT_BASE_URL || TEST_CONFIG.BASE_URLS[env as keyof typeof TEST_CONFIG.BASE_URLS] || TEST_CONFIG.BASE_URLS.development;
}

// Helper function to get test user by role
export function getTestUser(role: keyof typeof TEST_CONFIG.TEST_USERS) {
  return TEST_CONFIG.TEST_USERS[role];
}

// Helper function to get test property by type
export function getTestProperty(type: keyof typeof TEST_CONFIG.TEST_PROPERTIES) {
  return TEST_CONFIG.TEST_PROPERTIES[type];
}

// Helper function to check if running in CI
export function isCI(): boolean {
  return TEST_CONFIG.ENV.CI;
}

// Helper function to check if debug mode is enabled
export function isDebugMode(): boolean {
  return TEST_CONFIG.ENV.DEBUG;
}

// Helper function to get timeout for specific operation
export function getTimeout(operation: keyof typeof TEST_CONFIG.TIMEOUTS): number {
  return TEST_CONFIG.TIMEOUTS[operation];
}