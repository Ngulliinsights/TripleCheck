export const appConfig = {
  name: 'TripleCheck',
  version: '1.0.0',
  description: 'Secure Real Estate Verification Platform',
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || '/api',
    timeout: 30000,
    retries: 3,
  },

  // Feature flags
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
    enableTrustScore: true,
    enableFraudDetection: true,
    enableDocumentAuth: true,
  },

  // UI Configuration
  ui: {
    theme: 'light',
    itemsPerPage: 12,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Cache configuration
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },
} as const;