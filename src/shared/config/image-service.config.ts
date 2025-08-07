/**
 * Image Service Configuration
 * Centralized configuration following project conventions
 * Integrates with existing config pattern in config/ directory
 */

import type { ImageServiceConfig } from "../types/images";

// Environment-based configuration
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  if (typeof window !== 'undefined') {
    // Browser environment - use Vite's import.meta.env if available
    return (window as any).__VITE_ENV__?.[key] || defaultValue;
  }
  // Node environment - use process.env
  return process.env[key] || defaultValue;
};

const MODE = getEnvVar('MODE', 'development');
const isDevelopment = MODE === "development";
const isProduction = MODE === "production";
const isTest = MODE === "test";

// Base configuration
const baseConfig: ImageServiceConfig = {
  upload: {
    chunkSize: 1024 * 1024, // 1MB chunks
    maxConcurrentUploads: 3,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 30000, // 30 seconds
  },
  validation: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "pdf",
      "tiff",
      "heic",
      "avif",
    ],
    requireGeoLocation: false,
    documentAuthEnabled: true,
    fraudDetectionEnabled: true,
  },
  processing: {
    enableAITagging: true,
    enableVirusScanning: true,
    enableComplianceCheck: true,
    thumbnailSizes: [150, 300, 600, 1200],
    optimizationQuality: 85,
  },
  storage: {
    provider: "local",
    encryption: true,
    redundancy: "single",
  },
  integrations: {
    documentAuth: {
      enabled: true,
      endpoint: "/api/v1/document-auth/authenticate",
    },
    fraudDetection: {
      enabled: true,
      endpoint: "/api/v1/fraud-detection/analyze",
    },
    landVerification: {
      enabled: true,
      endpoint: "/api/v1/land-verification/verify",
    },
  },
};

// Development configuration
const developmentConfig: Partial<ImageServiceConfig> = {
  upload: {
    ...baseConfig.upload,
    maxConcurrentUploads: 2, // Reduced for development
    timeout: 60000, // Longer timeout for debugging
  },
  validation: {
    ...baseConfig.validation,
    maxFileSize: 50 * 1024 * 1024, // 50MB for development
    documentAuthEnabled: false, // Disabled for faster development
    fraudDetectionEnabled: false,
  },
  processing: {
    ...baseConfig.processing,
    enableVirusScanning: false, // Disabled for development
    enableComplianceCheck: false,
    optimizationQuality: 70, // Lower quality for faster processing
  },
  storage: {
    ...baseConfig.storage,
    provider: "local",
    encryption: false, // Disabled for development
  },
  integrations: {
    documentAuth: {
      enabled: false,
      endpoint: "http://localhost:3001/api/v1/document-auth/authenticate",
    },
    fraudDetection: {
      enabled: false,
      endpoint: "http://localhost:3001/api/v1/fraud-detection/analyze",
    },
    landVerification: {
      enabled: false,
      endpoint: "http://localhost:3001/api/v1/land-verification/verify",
    },
  },
};

// Production configuration
const productionConfig: Partial<ImageServiceConfig> = {
  upload: {
    ...baseConfig.upload,
    chunkSize: 2 * 1024 * 1024, // 2MB chunks for better performance
    maxConcurrentUploads: 5,
    timeout: 120000, // 2 minutes for large files
  },
  validation: {
    ...baseConfig.validation,
    maxFileSize: 200 * 1024 * 1024, // 200MB for production
    requireGeoLocation: true, // Required in production for property photos
  },
  processing: {
    ...baseConfig.processing,
    optimizationQuality: 90, // Higher quality for production
  },
  storage: {
    ...baseConfig.storage,
    provider: getEnvVar('VITE_STORAGE_PROVIDER') || "aws",
    bucket: getEnvVar('VITE_STORAGE_BUCKET'),
    region: getEnvVar('VITE_STORAGE_REGION'),
    redundancy: "multi-region",
  },
  integrations: {
    documentAuth: {
      enabled: true,
      endpoint:
        getEnvVar('VITE_DOCUMENT_AUTH_ENDPOINT') ||
        "/api/v1/document-auth/authenticate",
      apiKey: getEnvVar('VITE_DOCUMENT_AUTH_API_KEY'),
    },
    fraudDetection: {
      enabled: true,
      endpoint:
        getEnvVar('VITE_FRAUD_DETECTION_ENDPOINT') ||
        "/api/v1/fraud-detection/analyze",
      apiKey: getEnvVar('VITE_FRAUD_DETECTION_API_KEY'),
    },
    landVerification: {
      enabled: true,
      endpoint:
        getEnvVar('VITE_LAND_VERIFICATION_ENDPOINT') ||
        "/api/v1/land-verification/verify",
      apiKey: getEnvVar('VITE_LAND_VERIFICATION_API_KEY'),
    },
  },
};

// Test configuration
const testConfig: Partial<ImageServiceConfig> = {
  upload: {
    ...baseConfig.upload,
    chunkSize: 512 * 1024, // 512KB for faster tests
    maxConcurrentUploads: 1,
    maxRetries: 1,
    retryDelay: 100,
    timeout: 5000, // 5 seconds for tests
  },
  validation: {
    ...baseConfig.validation,
    maxFileSize: 10 * 1024 * 1024, // 10MB for tests
    documentAuthEnabled: false,
    fraudDetectionEnabled: false,
  },
  processing: {
    ...baseConfig.processing,
    enableAITagging: false,
    enableVirusScanning: false,
    enableComplianceCheck: false,
    thumbnailSizes: [150], // Only one size for tests
    optimizationQuality: 50,
  },
  storage: {
    ...baseConfig.storage,
    provider: "local",
    encryption: false,
  },
  integrations: {
    documentAuth: {
      enabled: false,
      endpoint: "http://localhost:3001/api/v1/document-auth/authenticate",
    },
    fraudDetection: {
      enabled: false,
      endpoint: "http://localhost:3001/api/v1/fraud-detection/analyze",
    },
    landVerification: {
      enabled: false,
      endpoint: "http://localhost:3001/api/v1/land-verification/verify",
    },
  },
};

// Merge configurations based on environment
function createConfig(): ImageServiceConfig {
  let envConfig: Partial<ImageServiceConfig> = {};

  if (isDevelopment) {
    envConfig = developmentConfig;
  } else if (isProduction) {
    envConfig = productionConfig;
  } else if (isTest) {
    envConfig = testConfig;
  }

  return {
    upload: { ...baseConfig.upload, ...envConfig.upload },
    validation: { ...baseConfig.validation, ...envConfig.validation },
    processing: { ...baseConfig.processing, ...envConfig.processing },
    storage: { ...baseConfig.storage, ...envConfig.storage },
    integrations: {
      documentAuth: {
        ...baseConfig.integrations.documentAuth,
        ...envConfig.integrations?.documentAuth,
      },
      fraudDetection: {
        ...baseConfig.integrations.fraudDetection,
        ...envConfig.integrations?.fraudDetection,
      },
      landVerification: {
        ...baseConfig.integrations.landVerification,
        ...envConfig.integrations?.landVerification,
      },
    },
  };
}

// Export the configuration
export const imageServiceConfig = createConfig();

// Configuration validation
export function validateConfig(config: ImageServiceConfig): string[] {
  const errors: string[] = [];

  // Validate upload configuration
  if (config.upload.chunkSize <= 0) {
    errors.push("Upload chunk size must be greater than 0");
  }
  if (config.upload.maxConcurrentUploads <= 0) {
    errors.push("Max concurrent uploads must be greater than 0");
  }
  if (config.upload.maxRetries < 0) {
    errors.push("Max retries must be non-negative");
  }

  // Validate validation configuration
  if (config.validation.maxFileSize <= 0) {
    errors.push("Max file size must be greater than 0");
  }
  if (config.validation.allowedFormats.length === 0) {
    errors.push("At least one file format must be allowed");
  }

  // Validate processing configuration
  if (config.processing.thumbnailSizes.length === 0) {
    errors.push("At least one thumbnail size must be specified");
  }
  if (
    config.processing.optimizationQuality < 1 ||
    config.processing.optimizationQuality > 100
  ) {
    errors.push("Optimization quality must be between 1 and 100");
  }

  // Validate storage configuration
  const validProviders = ["local", "aws", "gcp", "azure"];
  if (!validProviders.includes(config.storage.provider)) {
    errors.push(
      `Storage provider must be one of: ${validProviders.join(", ")}`
    );
  }

  // Validate integration endpoints
  if (
    config.integrations.documentAuth.enabled &&
    !config.integrations.documentAuth.endpoint
  ) {
    errors.push(
      "Document auth endpoint is required when document auth is enabled"
    );
  }
  if (
    config.integrations.fraudDetection.enabled &&
    !config.integrations.fraudDetection.endpoint
  ) {
    errors.push(
      "Fraud detection endpoint is required when fraud detection is enabled"
    );
  }
  if (
    config.integrations.landVerification.enabled &&
    !config.integrations.landVerification.endpoint
  ) {
    errors.push(
      "Land verification endpoint is required when land verification is enabled"
    );
  }

  return errors;
}

// Validate the current configuration
const configErrors = validateConfig(imageServiceConfig);
if (configErrors.length > 0 && !isTest) {
  // Log configuration warnings in development
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console.warn("Image service configuration warnings:", configErrors);
  }
}

// Export configuration utilities
export { createConfig, isDevelopment, isProduction, isTest };

// Export environment-specific configurations for testing
export { developmentConfig, productionConfig, testConfig };
