import { Property } from '../../types/property'
import {
  createPropertyFormConfig,
  createUserRegistrationFormConfig,
  createContactFormConfig,
  createProfileUpdateFormConfig
} from '../configs/formValidationConfigs'
import {
  createDataFetchingConfig,
  createUIInteractionConfig,
  createPerformanceConfig
} from '../configs/hookConfigs'

// Property-related presets
export const propertyHookPresets = {
  // Property listing with search and filters
  propertyListing: createDataFetchingConfig<Property[]>('paginatedList', {
    name: 'Property Listing',
    description: 'Optimized configuration for property listings with search and filtering',
    endpoint: '/api/properties',
    context: 'property-listing',
    staleTime: 2 * 60 * 1000, // 2 minutes - properties change frequently
    debounceMs: 500, // Good balance for search responsiveness
    validator: (data: unknown): Property[] => {
      if (!Array.isArray(data)) {
        // Handle API response format that might wrap data
        if (data && typeof data === "object" && "data" in data) {
          const wrappedData = (data as { data: unknown }).data;
          if (Array.isArray(wrappedData)) {
            return wrappedData.filter((item): item is Property => {
              if (!item || typeof item !== "object") return false;
              const obj = item as Record<string, unknown>;
              return (
                (typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0
              );
            });
          }
        }
        return [];
      }

      return data.filter((item): item is Property => {
        if (!item || typeof item !== "object") return false;
        const obj = item as Record<string, unknown>;
        return (
          (typeof obj.id === "string" || typeof obj.id === "number") &&
          obj.id != null &&
          typeof obj.title === "string" &&
          obj.title.length > 0
        );
      });
    },
  }),

  // Single property details
  propertyDetails: createDataFetchingConfig<Property | null>('singleItem', {
    name: 'Property Details',
    description: 'Configuration for fetching detailed property information',
    endpoint: '/api/properties', // Will be extended with ID
    context: 'property-details',
    staleTime: 10 * 60 * 1000, // 10 minutes - details don't change often
    validator: (data: unknown): Property | null => {
      if (!data || typeof data !== "object") return null;

      const property = data as Record<string, unknown>;
      return {
        ...property,
        id: (property.id as string) || "",
        title: (property.title as string) || "Untitled Property",
        description: (property.description as string) || "No description available",
        price: typeof property.price === "number" ? property.price : 0,
        location: (property.location as string) || "",
        images: Array.isArray(property.images) ? property.images : [],
      } as Property;
    },
  }),

  // Property search with advanced filtering
  propertySearch: createDataFetchingConfig('searchData', {
    name: 'Property Search',
    description: 'Advanced property search with filtering and sorting',
    endpoint: '/api/properties/search',
    context: 'property-search',
    debounceMs: 800, // Longer debounce for search to reduce API calls
    staleTime: 30 * 1000, // 30 seconds - search results can change quickly
  }),

  // Property favorites
  propertyFavorites: createDataFetchingConfig<Property[]>('paginatedList', {
    name: 'Property Favorites',
    description: 'User favorite properties with real-time updates',
    endpoint: '/api/properties/favorites',
    context: 'property-favorites',
    staleTime: 1 * 60 * 1000, // 1 minute - favorites can change quickly
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  }),

  // Similar properties
  similarProperties: createDataFetchingConfig<Property[]>('paginatedList', {
    name: 'Similar Properties',
    description: 'Properties similar to the current one',
    endpoint: '/api/properties/similar', // Will be extended with property ID
    context: 'similar-properties',
    staleTime: 15 * 60 * 1000, // 15 minutes - similarity doesn't change often
    retry: 2, // Fewer retries for non-critical data
  }),
};

// Constants
const FORM_VALIDATION_CATEGORY = 'form-validation' as const;

// Form data interface for better type safety
interface PropertyFormData {
  bedrooms: number;
  bathrooms: number;
  price: number;
  description: string;
}

interface UserRegistrationFormData {
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
}

// Form validation presets
export const formValidationPresets = {
  // Property listing form
  propertyForm: {
    name: 'Property Form',
    description: 'Complete property listing form with validation',
    category: FORM_VALIDATION_CATEGORY,
    fields: createPropertyFormConfig(),
    globalValidation: (formData: Record<string, unknown>): string | true => {
      const typedData = formData as unknown as PropertyFormData;
      // Cross-field validation
      if (typedData.bedrooms > 0 && typedData.bathrooms === 0) {
        return 'Properties with bedrooms should have at least one bathroom';
      }

      if (typedData.price > 50000000 && !typedData.description?.toLowerCase().includes('luxury')) {
        return 'High-value properties should mention luxury features in description';
      }

      return true;
    },
  },

  // User registration form
  userRegistration: {
    name: 'User Registration',
    description: 'User registration form with comprehensive validation',
    category: FORM_VALIDATION_CATEGORY,
    fields: createUserRegistrationFormConfig(),
    globalValidation: (formData: Record<string, unknown>): string | true => {
      const typedData = formData as unknown as UserRegistrationFormData;
      // Ensure password and confirm password match (additional check)
      if (typedData.password !== typedData.confirmPassword) {
        return 'Password confirmation does not match';
      }

      // Check if email and phone are from the same region (example business rule)
      if (typedData.email?.endsWith('.ke') && !typedData.phone?.startsWith('+254')) {
        return 'Kenyan email addresses should use Kenyan phone numbers';
      }

      return true;
    },
  },

  // Contact form
  contactForm: {
    name: 'Contact Form',
    description: 'Simple contact form for inquiries',
    category: FORM_VALIDATION_CATEGORY,
    fields: createContactFormConfig(),
  },

  // Profile update form
  profileUpdate: {
    name: 'Profile Update',
    description: 'User profile update form',
    category: FORM_VALIDATION_CATEGORY,
    fields: createProfileUpdateFormConfig(),
  },
};

// UI interaction presets
export const uiInteractionPresets = {
  // Property search interface
  propertySearchUI: createUIInteractionConfig('searchInput', {
    name: 'Property Search UI',
    description: 'Optimized for property search interactions',
    debounceMs: 500, // Balance between responsiveness and API calls
    enableKeyboardShortcuts: true, // Enable Ctrl+K for search, etc.
  }),

  // Property map interface
  propertyMapUI: createUIInteractionConfig('highFrequency', {
    name: 'Property Map UI',
    description: 'High-performance interactions for map interface',
    throttleMs: 100, // Smooth map interactions
    enableTouchGestures: true, // Important for mobile map usage
  }),

  // Property form interface
  propertyFormUI: createUIInteractionConfig('searchInput', {
    name: 'Property Form UI',
    description: 'Standard form interaction patterns',
    debounceMs: 300, // Quick feedback for form validation
  }),

  // Mobile property browsing
  mobilePropertyUI: createUIInteractionConfig('mobileInteraction', {
    name: 'Mobile Property UI',
    description: 'Mobile-optimized property browsing',
    enableTouchGestures: true,
    debounceMs: 200, // Faster response on mobile
  }),
};

// Performance monitoring presets
export const performancePresets = {
  // Property listing performance
  propertyListingPerf: createPerformanceConfig('production', {
    name: 'Property Listing Performance',
    description: 'Monitor property listing performance',
    trackRenderTime: true,
    trackNetworkRequests: true,
    sampleRate: 0.2, // 20% sampling for high-traffic pages
  }),

  // Property details performance
  propertyDetailsPerf: createPerformanceConfig('production', {
    name: 'Property Details Performance',
    description: 'Monitor property details page performance',
    trackRenderTime: true,
    trackMemoryUsage: true, // Important for image-heavy pages
    trackNetworkRequests: true,
    sampleRate: 0.5, // Higher sampling for important pages
  }),

  // Search performance
  searchPerformance: createPerformanceConfig('criticalPath', {
    name: 'Search Performance',
    description: 'Monitor search functionality performance',
    trackRenderTime: true,
    trackNetworkRequests: true,
    sampleRate: 0.8, // High sampling for critical search functionality
  }),

  // Development performance
  developmentPerf: createPerformanceConfig('development', {
    name: 'Development Performance',
    description: 'Comprehensive performance monitoring for development',
    trackRenderTime: true,
    trackMemoryUsage: true,
    trackNetworkRequests: true,
    sampleRate: 1.0, // Track everything in development
  }),
};

// Composite presets that combine multiple configurations
export const compositePresets = {
  // Complete property listing page
  propertyListingPage: {
    dataFetching: propertyHookPresets.propertyListing,
    uiInteraction: uiInteractionPresets.propertySearchUI,
    performance: performancePresets.propertyListingPerf,
  },

  // Complete property details page
  propertyDetailsPage: {
    dataFetching: propertyHookPresets.propertyDetails,
    similarProperties: propertyHookPresets.similarProperties,
    uiInteraction: uiInteractionPresets.propertySearchUI,
    performance: performancePresets.propertyDetailsPerf,
  },

  // Complete property form page
  propertyFormPage: {
    formValidation: formValidationPresets.propertyForm,
    uiInteraction: uiInteractionPresets.propertyFormUI,
    performance: performancePresets.developmentPerf,
  },

  // Complete user registration page
  userRegistrationPage: {
    formValidation: formValidationPresets.userRegistration,
    uiInteraction: uiInteractionPresets.propertyFormUI,
    performance: performancePresets.developmentPerf,
  },
};

// Export all presets
export const hookPresets = {
  property: propertyHookPresets,
  forms: formValidationPresets,
  ui: uiInteractionPresets,
  performance: performancePresets,
  composite: compositePresets,
} as const;

// Type helpers for preset keys
export type PropertyPresetKey = keyof typeof propertyHookPresets;
export type FormPresetKey = keyof typeof formValidationPresets;
export type UIPresetKey = keyof typeof uiInteractionPresets;
export type PerformancePresetKey = keyof typeof performancePresets;
export type CompositePresetKey = keyof typeof compositePresets;

// Helper functions to get presets with safe property access
export function getPropertyPreset(key: PropertyPresetKey) {
  const presets = propertyHookPresets as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}

export function getFormPreset(key: FormPresetKey) {
  const presets = formValidationPresets as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}

export function getUIPreset(key: UIPresetKey) {
  const presets = uiInteractionPresets as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}

export function getPerformancePreset(key: PerformancePresetKey) {
  const presets = performancePresets as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}

export function getCompositePreset(key: CompositePresetKey) {
  const presets = compositePresets as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}