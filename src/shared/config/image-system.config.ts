/**
 * Unified Image System Configuration
 * Consolidates image-service.config.ts and image-components.config.ts
 */

import type { DocumentType } from '../types/images';

// Environment detection
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  if (typeof window !== 'undefined') {
    return (window as any).__VITE_ENV__?.[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

const MODE = getEnvVar('MODE', 'development');
const isDevelopment = MODE === "development";
const isProduction = MODE === "production";
const isTest = MODE === "test";

// Unified configuration interface
export interface ImageSystemConfig {
  // Service configuration (from image-service.config.ts)
  service: {
    upload: {
      chunkSize: number;
      maxConcurrentUploads: number;
      maxRetries: number;
      retryDelay: number;
      timeout: number;
    };
    validation: {
      maxFileSize: number;
      allowedFormats: string[];
      requireGeoLocation: boolean;
      documentAuthEnabled: boolean;
      fraudDetectionEnabled: boolean;
    };
    processing: {
      enableAITagging: boolean;
      enableVirusScanning: boolean;
      enableComplianceCheck: boolean;
      thumbnailSizes: number[];
      optimizationQuality: number;
    };
    storage: {
      provider: string;
      bucket?: string;
      region?: string;
      encryption: boolean;
      redundancy: string;
    };
    integrations: {
      documentAuth: {
        enabled: boolean;
        endpoint: string;
        apiKey?: string;
      };
      fraudDetection: {
        enabled: boolean;
        endpoint: string;
        apiKey?: string;
      };
      landVerification: {
        enabled: boolean;
        endpoint: string;
        apiKey?: string;
      };
    };
  };
  
  // Component configuration (from image-components.config.ts)
  components: {
    gallery: {
      defaultViewMode: 'grid' | 'list' | 'masonry';
      enabledFeatures: {
        search: boolean;
        fullscreen: boolean;
        collaboration: boolean;
        watermark: boolean;
        validation: boolean;
      };
      performance: {
        lazyLoading: boolean;
        virtualization: boolean;
        preloadCount: number;
      };
      ui: {
        showImageCounter: boolean;
        showThumbnails: boolean;
        wrapInCard: boolean;
      };
    };
    vault: {
      upload: {
        maxFileSize: number;
        maxFiles: number;
        allowedTypes: string[];
        chunkSize: number;
      };
      workflow: {
        enableWorkflowProgress: boolean;
        enableAuditLogging: boolean;
        maxConcurrentUploads: number;
      };
      features: {
        allowReorder: boolean;
        allowAnnotation: boolean;
        allowPrimaryFlag: boolean;
      };
    };
    viewer: {
      navigation: {
        allowNavigation: boolean;
        showThumbnails: boolean;
        enableFullscreen: boolean;
      };
      ui: {
        showImageCounter: boolean;
        showCaptions: boolean;
      };
      performance: {
        lazyLoading: boolean;
        preloadAdjacent: boolean;
      };
    };
    property: {
      defaultDocumentType: DocumentType;
      allowedDocumentTypes: DocumentType[];
      userRole: 'viewer' | 'editor' | 'admin';
      features: {
        enableSearch: boolean;
        enableCollaboration: boolean;
        enableWatermark: boolean;
      };
    };
  };
}

// Base configuration
const baseConfig: ImageSystemConfig = {
  service: {
    upload: {
      chunkSize: 1024 * 1024, // 1MB chunks
      maxConcurrentUploads: 3,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
    },
    validation: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ["jpg", "jpeg", "png", "webp", "pdf", "tiff", "heic", "avif"],
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
  },
  components: {
    gallery: {
      defaultViewMode: 'grid',
      enabledFeatures: {
        search: true,
        fullscreen: true,
        collaboration: false,
        watermark: false,
        validation: false,
      },
      performance: {
        lazyLoading: true,
        virtualization: true,
        preloadCount: 2,
      },
      ui: {
        showImageCounter: true,
        showThumbnails: true,
        wrapInCard: false,
      },
    },
    vault: {
      upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 20,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        chunkSize: 1024 * 1024,
      },
      workflow: {
        enableWorkflowProgress: true,
        enableAuditLogging: true,
        maxConcurrentUploads: 3,
      },
      features: {
        allowReorder: true,
        allowAnnotation: true,
        allowPrimaryFlag: true,
      },
    },
    viewer: {
      navigation: {
        allowNavigation: true,
        showThumbnails: true,
        enableFullscreen: true,
      },
      ui: {
        showImageCounter: true,
        showCaptions: true,
      },
      performance: {
        lazyLoading: true,
        preloadAdjacent: true,
      },
    },
    property: {
      defaultDocumentType: 'property_photo',
      allowedDocumentTypes: [
        'property_photo',
        'title_deed',
        'survey_plan',
        'valuation_report',
        'identification_document',
        'other_document',
      ],
      userRole: 'viewer',
      features: {
        enableSearch: false,
        enableCollaboration: false,
        enableWatermark: false,
      },
    },
  },
};

// Environment-specific overrides
const environmentConfigs = {
  development: {
    service: {
      upload: {
        maxConcurrentUploads: 2,
        timeout: 60000,
      },
      validation: {
        maxFileSize: 50 * 1024 * 1024,
        documentAuthEnabled: false,
        fraudDetectionEnabled: false,
      },
      processing: {
        enableVirusScanning: false,
        enableComplianceCheck: false,
        optimizationQuality: 70,
      },
      storage: {
        encryption: false,
      },
      integrations: {
        documentAuth: { enabled: false },
        fraudDetection: { enabled: false },
        landVerification: { enabled: false },
      },
    },
  },
  production: {
    service: {
      upload: {
        chunkSize: 2 * 1024 * 1024,
        maxConcurrentUploads: 5,
        timeout: 120000,
      },
      validation: {
        maxFileSize: 200 * 1024 * 1024,
        requireGeoLocation: true,
      },
      processing: {
        optimizationQuality: 90,
      },
      storage: {
        provider: getEnvVar('VITE_STORAGE_PROVIDER') || "aws",
        bucket: getEnvVar('VITE_STORAGE_BUCKET'),
        region: getEnvVar('VITE_STORAGE_REGION'),
        redundancy: "multi-region",
      },
      integrations: {
        documentAuth: {
          endpoint: getEnvVar('VITE_DOCUMENT_AUTH_ENDPOINT') || "/api/v1/document-auth/authenticate",
          apiKey: getEnvVar('VITE_DOCUMENT_AUTH_API_KEY'),
        },
        fraudDetection: {
          endpoint: getEnvVar('VITE_FRAUD_DETECTION_ENDPOINT') || "/api/v1/fraud-detection/analyze",
          apiKey: getEnvVar('VITE_FRAUD_DETECTION_API_KEY'),
        },
        landVerification: {
          endpoint: getEnvVar('VITE_LAND_VERIFICATION_ENDPOINT') || "/api/v1/land-verification/verify",
          apiKey: getEnvVar('VITE_LAND_VERIFICATION_API_KEY'),
        },
      },
    },
  },
  test: {
    service: {
      upload: {
        chunkSize: 512 * 1024,
        maxConcurrentUploads: 1,
        maxRetries: 1,
        retryDelay: 100,
        timeout: 5000,
      },
      validation: {
        maxFileSize: 10 * 1024 * 1024,
        documentAuthEnabled: false,
        fraudDetectionEnabled: false,
      },
      processing: {
        enableAITagging: false,
        enableVirusScanning: false,
        enableComplianceCheck: false,
        thumbnailSizes: [150],
        optimizationQuality: 50,
      },
      storage: {
        encryption: false,
      },
      integrations: {
        documentAuth: { enabled: false },
        fraudDetection: { enabled: false },
        landVerification: { enabled: false },
      },
    },
  },
};

// Deep merge function
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// Create final configuration
function createImageSystemConfig(): ImageSystemConfig {
  let envOverrides = {};
  
  if (isDevelopment) {
    envOverrides = environmentConfigs.development;
  } else if (isProduction) {
    envOverrides = environmentConfigs.production;
  } else if (isTest) {
    envOverrides = environmentConfigs.test;
  }
  
  return deepMerge(baseConfig, envOverrides);
}

// Export the unified configuration
export const imageSystemConfig = createImageSystemConfig();

// Backward compatibility exports
export const imageServiceConfig = imageSystemConfig.service;
export const imageComponentConfig = imageSystemConfig.components;

// Configuration presets
export const configPresets = {
  default: imageSystemConfig.components,
  property: deepMerge(imageSystemConfig.components, {
    gallery: {
      enabledFeatures: {
        search: false,
        collaboration: false,
        watermark: false,
      },
    },
    property: {
      userRole: 'viewer',
    },
  }),
  enterprise: deepMerge(imageSystemConfig.components, {
    gallery: {
      enabledFeatures: {
        search: true,
        fullscreen: true,
        collaboration: true,
        watermark: true,
        validation: true,
      },
    },
    vault: {
      workflow: {
        enableAuditLogging: true,
      },
    },
  }),
  simple: deepMerge(imageSystemConfig.components, {
    gallery: {
      enabledFeatures: {
        search: false,
        fullscreen: true,
        collaboration: false,
        watermark: false,
        validation: false,
      },
    },
    viewer: {
      navigation: {
        showThumbnails: false,
        enableFullscreen: false,
      },
    },
  }),
} as const;

// Utility functions
export function getConfigForContext(context: keyof typeof configPresets) {
  return configPresets[context];
}

export function validateImageSystemConfig(config: ImageSystemConfig): string[] {
  const errors: string[] = [];
  
  // Validate service configuration
  if (config.service.upload.chunkSize <= 0) {
    errors.push("Upload chunk size must be greater than 0");
  }
  
  if (config.service.validation.maxFileSize <= 0) {
    errors.push("Max file size must be greater than 0");
  }
  
  if (config.service.validation.allowedFormats.length === 0) {
    errors.push("At least one file format must be allowed");
  }
  
  // Validate component configuration
  if (config.components.vault.upload.maxFiles <= 0) {
    errors.push("Max files must be greater than 0");
  }
  
  return errors;
}

// Export environment flags
export { isDevelopment, isProduction, isTest };