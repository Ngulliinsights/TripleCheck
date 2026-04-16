/**
 * Unified Image Components Configuration
 * Centralizes all image component settings and eliminates scattered configurations
 */

import type { DocumentType } from '../types/images'

export interface ImageComponentConfig {
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
}

// Default configuration
export const defaultImageComponentConfig: ImageComponentConfig = {
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
      chunkSize: 1024 * 1024, // 1MB chunks
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
};

// Property-specific configuration overrides
export const propertyImageConfig: Partial<ImageComponentConfig> = {
  gallery: {
    ...defaultImageComponentConfig.gallery,
    enabledFeatures: {
      ...defaultImageComponentConfig.gallery.enabledFeatures,
      search: false,
      collaboration: false,
      watermark: false,
    },
  },
  property: {
    ...defaultImageComponentConfig.property,
    userRole: 'viewer',
  },
};

// Enterprise configuration overrides
export const enterpriseImageConfig: Partial<ImageComponentConfig> = {
  gallery: {
    ...defaultImageComponentConfig.gallery,
    enabledFeatures: {
      search: true,
      fullscreen: true,
      collaboration: true,
      watermark: true,
      validation: true,
    },
  },
  vault: {
    ...defaultImageComponentConfig.vault,
    workflow: {
      ...defaultImageComponentConfig.vault.workflow,
      enableAuditLogging: true,
    },
  },
};

// Configuration presets for different use cases
export const configPresets = {
  default: defaultImageComponentConfig,
  property: {
    ...defaultImageComponentConfig,
    ...propertyImageConfig,
  },
  enterprise: {
    ...defaultImageComponentConfig,
    ...enterpriseImageConfig,
  },
  simple: {
    ...defaultImageComponentConfig,
    gallery: {
      ...defaultImageComponentConfig.gallery,
      enabledFeatures: {
        search: false,
        fullscreen: true,
        collaboration: false,
        watermark: false,
        validation: false,
      },
    },
    viewer: {
      ...defaultImageComponentConfig.viewer,
      navigation: {
        allowNavigation: true,
        showThumbnails: false,
        enableFullscreen: false,
      },
    },
  },
} as const;

// Utility functions for configuration
export function getConfigForContext(context: keyof typeof configPresets): ImageComponentConfig {
  return configPresets[context];
}

export function mergeConfig(
  base: ImageComponentConfig,
  overrides: Partial<ImageComponentConfig>
): ImageComponentConfig {
  return {
    gallery: { ...base.gallery, ...overrides.gallery },
    vault: { ...base.vault, ...overrides.vault },
    viewer: { ...base.viewer, ...overrides.viewer },
    property: { ...base.property, ...overrides.property },
  };
}

// Export the main configuration (now imports from unified config)
import { imageComponentConfig as unifiedComponentConfig } from './image-system.config'
export const imageComponentConfig = unifiedComponentConfig;