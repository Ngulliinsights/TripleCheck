/**
 * CMS Configuration
 * Easy setup for different headless CMS providers with enhanced type safety and validation
 */

import { CMSConfig } from "@/services/cms";

// Enhanced type definitions for better intellisense and validation
type CMSProvider =
  | "strapi"
  | "contentful"
  | "sanity"
  | "ghost"
  | "directus"
  | "local";

// Base configuration that all providers must implement
interface BaseCMSConfig {
  readonly provider: CMSProvider;
  readonly apiUrl: string;
}

// Provider-specific configuration extensions
interface StrapiConfig extends BaseCMSConfig {
  readonly provider: "strapi";
  readonly apiKey?: string;
  readonly endpoints?: {
    readonly content: string;
    readonly auth: string;
    readonly upload: string;
  };
}

interface ContentfulConfig extends BaseCMSConfig {
  readonly provider: "contentful";
  readonly apiKey: string;
  readonly spaceId: string;
  readonly environment?: string;
  readonly previewMode?: boolean;
}

interface SanityConfig extends BaseCMSConfig {
  readonly provider: "sanity";
  readonly projectId: string;
  readonly dataset?: string;
  readonly apiVersion?: string;
  readonly useCdn?: boolean;
  readonly perspective?: "published" | "previewDrafts";
}

interface GhostConfig extends BaseCMSConfig {
  readonly provider: "ghost";
  readonly apiKey: string;
  readonly version?: string;
  readonly ghostPath?: string;
}

interface DirectusConfig extends BaseCMSConfig {
  readonly provider: "directus";
  readonly apiKey?: string;
  readonly collection?: string;
  readonly graphql?: boolean;
}

interface LocalConfig extends BaseCMSConfig {
  readonly provider: "local";
  readonly mockData?: boolean;
  readonly dataPath?: string;
}

// Union type for all possible configurations
type CMSProviderConfig =
  | StrapiConfig
  | ContentfulConfig
  | SanityConfig
  | GhostConfig
  | DirectusConfig
  | LocalConfig;

// Legacy compatibility interface - this maintains backward compatibility
interface EnvironmentConfig {
  readonly provider: CMSProvider;
  readonly apiUrl: string;
  readonly apiKey?: string;
  readonly spaceId?: string;
  readonly projectId?: string;
  readonly dataset?: string;
}

// Type-safe environment variable parsing with fallbacks
const getEnvProvider = (): CMSProvider => {
  const provider = process.env.VITE_CMS_PROVIDER?.toLowerCase();
  const validProviders: CMSProvider[] = [
    "strapi",
    "contentful",
    "sanity",
    "ghost",
    "directus",
    "local",
  ];

  if (provider && validProviders.includes(provider as CMSProvider)) {
    return provider as CMSProvider;
  }

  // Fallback to local development setup
  return "local";
};

// Enhanced configuration with better validation and defaults
export const cmsConfig: CMSConfig = {
  // Provider selection with runtime validation
  provider: getEnvProvider(),

  // API Configuration with provider-specific intelligent defaults
  apiUrl:
    process.env.VITE_CMS_API_URL ||
    (() => {
      const provider = getEnvProvider();
      switch (provider) {
        case "strapi":
          return "http://localhost:1337";
        case "contentful":
          return "https://cdn.contentful.com";
        case "ghost":
          return "https://your-ghost-site.com";
        case "directus":
          return "https://your-directus-instance.com";
        case "sanity":
          return process.env.VITE_SANITY_PROJECT_ID ?
              `https://${process.env.VITE_SANITY_PROJECT_ID}.api.sanity.io`
            : "https://your-project-id.api.sanity.io";
        default:
          return "http://localhost:3000";
      }
    })(),

  // API Key with validation
  apiKey: process.env.VITE_CMS_API_KEY || undefined,

  // Provider-specific configurations
  spaceId: process.env.VITE_CONTENTFUL_SPACE_ID || undefined,
  projectId: process.env.VITE_SANITY_PROJECT_ID || undefined,
  dataset: process.env.VITE_SANITY_DATASET || "production",
};

// Enhanced CMS Provider Templates with better type safety
export const cmsTemplates = {
  strapi: {
    provider: "strapi" as const,
    apiUrl: "http://localhost:1337",
    apiKey: "your-strapi-api-key",
    // Strapi-specific defaults
    endpoints: {
      content: "/api",
      auth: "/api/auth",
      upload: "/api/upload",
    },
  },

  contentful: {
    provider: "contentful" as const,
    apiUrl: "https://cdn.contentful.com",
    apiKey: "your-contentful-delivery-api-key",
    spaceId: "your-contentful-space-id",
    // Contentful-specific configuration
    environment: "master",
    previewMode: false,
  },

  sanity: {
    provider: "sanity" as const,
    apiUrl: "https://your-project-id.api.sanity.io",
    projectId: "your-sanity-project-id",
    dataset: "production",
    // Sanity-specific options
    apiVersion: "2023-05-03",
    useCdn: true,
    perspective: "published" as const,
  },

  ghost: {
    provider: "ghost" as const,
    apiUrl: "https://your-ghost-site.com",
    apiKey: "your-ghost-content-api-key",
    // Ghost-specific configuration
    version: "v5.0",
    ghostPath: "/ghost/api/content",
  },

  directus: {
    provider: "directus" as const,
    apiUrl: "https://your-directus-instance.com",
    apiKey: "your-directus-api-key",
    // Directus-specific settings
    collection: "items",
    graphql: false,
  },

  local: {
    provider: "local" as const,
    apiUrl: "http://localhost:3000",
    // Local development configuration
    mockData: true,
    dataPath: "./mock-data",
  },
} as const;

// Enhanced setup functions with validation and better error handling
export const setupStrapi = (
  apiUrl: string,
  apiKey?: string,
  options?: Partial<typeof cmsTemplates.strapi>
): CMSConfig => {
  if (!apiUrl || !apiUrl.startsWith("http")) {
    throw new Error("Valid API URL is required for Strapi setup");
  }

  return {
    ...cmsTemplates.strapi,
    ...options,
    apiUrl,
    apiKey,
  };
};

export const setupContentful = (
  spaceId: string,
  apiKey: string,
  options?: Partial<typeof cmsTemplates.contentful>
): CMSConfig => {
  if (!spaceId || !apiKey) {
    throw new Error(
      "Both spaceId and apiKey are required for Contentful setup"
    );
  }

  return {
    ...cmsTemplates.contentful,
    ...options,
    spaceId,
    apiKey,
  };
};

export const setupSanity = (
  projectId: string,
  dataset = "production",
  options?: Partial<typeof cmsTemplates.sanity>
): CMSConfig => {
  if (!projectId) {
    throw new Error("Project ID is required for Sanity setup");
  }

  return {
    ...cmsTemplates.sanity,
    ...options,
    apiUrl: `https://${projectId}.api.sanity.io`,
    projectId,
    dataset,
  };
};

export const setupGhost = (
  apiUrl: string,
  apiKey: string,
  options?: Partial<typeof cmsTemplates.ghost>
): CMSConfig => {
  if (!apiUrl || !apiKey) {
    throw new Error("Both API URL and API key are required for Ghost setup");
  }

  return {
    ...cmsTemplates.ghost,
    ...options,
    apiUrl,
    apiKey,
  };
};

export const setupDirectus = (
  apiUrl: string,
  apiKey?: string,
  options?: Partial<typeof cmsTemplates.directus>
): CMSConfig => {
  if (!apiUrl) {
    throw new Error("API URL is required for Directus setup");
  }

  return {
    ...cmsTemplates.directus,
    ...options,
    apiUrl,
    apiKey,
  };
};

// Configuration validation utility
export const validateConfig = (config: CMSConfig): boolean => {
  const { provider, apiUrl, apiKey, spaceId, projectId } = config;

  // Basic validation
  if (!provider || !apiUrl) {
    console.warn("CMS Config: Provider and API URL are required");
    return false;
  }

  // Provider-specific validation
  switch (provider) {
    case "contentful":
      if (!spaceId || !apiKey) {
        console.warn("CMS Config: Contentful requires both spaceId and apiKey");
        return false;
      }
      break;
    case "sanity":
      if (!projectId) {
        console.warn("CMS Config: Sanity requires projectId");
        return false;
      }
      break;
    case "ghost":
    case "directus":
      if (!apiKey) {
        console.warn(`CMS Config: ${provider} typically requires an API key`);
        return false;
      }
      break;
  }

  return true;
};

// Type-safe property access helpers
const getTemplateProperty = <
  T extends keyof (typeof cmsTemplates)[CMSProvider],
>(
  provider: CMSProvider,
  property: T
): any => {
  const template = cmsTemplates[provider] as any;
  return template?.[property];
};

// Development helper for quick provider switching with proper type safety
export const switchProvider = (newProvider: CMSProvider): CMSConfig => {
  const template = cmsTemplates[newProvider];

  if (!template) {
    throw new Error(`Unsupported CMS provider: ${newProvider}`);
  }

  // Build configuration with provider-specific logic
  const baseConfig = { ...template };

  // Apply environment overrides only for providers that support them
  if (process.env.VITE_CMS_API_KEY) {
    // Check if the provider template has an apiKey property
    if ("apiKey" in template) {
      (baseConfig as any).apiKey = process.env.VITE_CMS_API_KEY;
    }
  }

  if (process.env.VITE_CONTENTFUL_SPACE_ID && newProvider === "contentful") {
    (baseConfig as any).spaceId = process.env.VITE_CONTENTFUL_SPACE_ID;
  }

  if (process.env.VITE_SANITY_PROJECT_ID && newProvider === "sanity") {
    (baseConfig as any).projectId = process.env.VITE_SANITY_PROJECT_ID;
    (baseConfig as any).apiUrl =
      `https://${process.env.VITE_SANITY_PROJECT_ID}.api.sanity.io`;
  }

  return baseConfig;
};

// Export configuration with validation
const validatedConfig =
  validateConfig(cmsConfig) ? cmsConfig : cmsTemplates.local;

export default validatedConfig;
