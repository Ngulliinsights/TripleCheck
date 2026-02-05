/**
 * Development Configuration
 * Optimized for fast startup and low resource usage
 */

export const developmentConfig = {
  // Database
  database: {
    skipSeeding: true,
    skipMigrations: false,
    connectionPoolSize: 3,
    connectionTimeout: 5000,
  },
  
  // Logging
  logging: {
    level: 'error', // Reduce log noise
    enableDebug: false,
  },
  
  // Performance
  performance: {
    enableCaching: false,
    skipHealthChecks: true,
    disableAnalytics: true,
  },
  
  // Features to disable in development
  features: {
    aiVerification: false,
    fraudDetection: false,
    communityTrust: false,
    landVerification: false,
  }
};