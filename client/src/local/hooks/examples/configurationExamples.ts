/**
 * Examples of how to use configuration-based hooks
 * These examples demonstrate the power and flexibility of the new configuration system
 */

import {
  useConfigurableHook,
  createDataFetchingHook,
  createFormValidationHook,
  useComposedHooks,
  getPropertyPreset,
  getFormPreset,
  createDataFetchingConfig
} from '../index'
import { Property } from '@shared/types/property'

// Example 1: Using preset configurations
export function usePropertyListingWithPreset(searchParams?: Record<string, unknown>) {
  const config = getPropertyPreset('propertyListing');
  return useConfigurableHook(config, searchParams);
}

// Example 2: Creating a custom data fetching hook with configuration
const customPropertySearchConfig = createDataFetchingConfig<Property[]>('searchData', {
  name: 'Custom Property Search',
  description: 'Customized property search with specific business rules',
  endpoint: '/api/properties/advanced-search',
  debounceMs: 1000, // Longer debounce for complex searches
  staleTime: 2 * 60 * 1000, // 2 minutes cache
  validator: (data: unknown): Property[] => {
    if (!Array.isArray(data)) return [];

    // Custom validation logic for advanced search results
    return data.filter((item): item is Property => {
      if (!item || typeof item !== "object") return false;
      const obj = item as Record<string, unknown>;

      // Additional validation for advanced search
      return (
        (typeof obj.id === "string" || typeof obj.id === "number") &&
        obj.id != null &&
        typeof obj.title === "string" &&
        obj.title.length > 0 &&
        typeof obj.price === "number" &&
        obj.price > 0 &&
        Array.isArray(obj.images) &&
        obj.images.length > 0 // Advanced search requires images
      );
    });
  },
});

export const useCustomPropertySearch = createDataFetchingHook(customPropertySearchConfig);

// Example 3: Creating a specialized form validation hook
const propertyInquiryFormConfig = {
  name: 'Property Inquiry Form',
  description: 'Form for inquiring about a specific property',
  category: 'form-validation' as const,
  fields: {
    propertyId: {
      initialValue: '',
      rules: {
        required: 'Property ID is required',
      },
    },
    inquirerName: {
      initialValue: '',
      rules: {
        required: 'Your name is required',
        minLength: { value: 2, message: 'Name must be at least 2 characters' },
      },
      validateOnBlur: true,
    },
    inquirerEmail: {
      initialValue: '',
      rules: {
        required: 'Email is required',
        email: 'Please enter a valid email address',
      },
      validateOnBlur: true,
    },
    inquirerPhone: {
      initialValue: '',
      rules: {
        pattern: {
          value: /^(\+254|0)[17]\d{8}$/,
          message: 'Please enter a valid Kenyan phone number',
        },
      },
      validateOnBlur: true,
    },
    inquiryType: {
      initialValue: 'viewing',
      rules: {
        required: 'Please select inquiry type',
        custom: (value) => {
          const validTypes = ['viewing', 'purchase', 'rent', 'information'];
          return validTypes.includes(value) || 'Please select a valid inquiry type';
        },
      },
    },
    message: {
      initialValue: '',
      rules: {
        required: 'Please provide your inquiry details',
        minLength: { value: 20, message: 'Please provide more details (at least 20 characters)' },
        maxLength: { value: 1000, message: 'Message is too long (maximum 1000 characters)' },
      },
      validateOnBlur: true,
    },
    preferredContactTime: {
      initialValue: 'anytime',
      rules: {
        custom: (value) => {
          const validTimes = ['morning', 'afternoon', 'evening', 'anytime'];
          return validTimes.includes(value) || 'Please select a valid contact time';
        },
      },
    },
  },
  globalValidation: (formData: any) => {
    // Business rule: Purchase inquiries require phone number
    if (formData.inquiryType === 'purchase' && !formData.inquirerPhone) {
      return 'Phone number is required for purchase inquiries';
    }

    // Business rule: Viewing requests should specify preferred time
    if (formData.inquiryType === 'viewing' && formData.preferredContactTime === 'anytime') {
      return 'Please specify your preferred contact time for viewing requests';
    }

    return true;
  },
};

export const usePropertyInquiryForm = createFormValidationHook(propertyInquiryFormConfig);

// Example 4: Composing multiple hooks for a complete page
export function usePropertyDetailsPage(propertyId: string) {
  const configs = {
    propertyDetails: getPropertyPreset('propertyDetails'),
    similarProperties: getPropertyPreset('similarProperties'),
    inquiryForm: propertyInquiryFormConfig,
  };

  const args = {
    propertyDetails: { id: propertyId },
    similarProperties: { excludeId: propertyId, limit: 4 },
    inquiryForm: { propertyId },
  };

  return useComposedHooks(configs, args);
}

// Example 5: Dynamic configuration based on user preferences
export function useAdaptivePropertySearch(userPreferences?: {
  searchSpeed?: 'fast' | 'thorough';
  cacheStrategy?: 'aggressive' | 'conservative';
  dataQuality?: 'basic' | 'detailed';
}) {
  const baseConfig = getPropertyPreset('propertySearch');

  // Adapt configuration based on user preferences
  const adaptedConfig = {
    ...baseConfig,
    // Adjust debounce based on search speed preference
    debounceMs: userPreferences?.searchSpeed === 'fast' ? 300 : 800,

    // Adjust cache strategy
    staleTime: userPreferences?.cacheStrategy === 'aggressive' ?
      5 * 60 * 1000 : // 5 minutes for aggressive caching
      30 * 1000,      // 30 seconds for conservative caching

    // Adjust validation based on data quality preference
    validator: userPreferences?.dataQuality === 'detailed' ?
      (data: unknown): Property[] => {
        if (!Array.isArray(data)) return [];
        return data.filter((item): item is Property => {
          if (!item || typeof item !== "object") return false;
          const obj = item as Record<string, unknown>;

          // Detailed validation requires more fields
          return (
            (typeof obj.id === "string" || typeof obj.id === "number") &&
            obj.id != null &&
            typeof obj.title === "string" &&
            obj.title.length > 0 &&
            typeof obj.description === "string" &&
            obj.description.length > 50 && // Detailed requires longer descriptions
            typeof obj.price === "number" &&
            obj.price > 0 &&
            Array.isArray(obj.images) &&
            obj.images.length > 2 // Detailed requires multiple images
          );
        });
      } :
      baseConfig.validator, // Use basic validation for 'basic' quality
  };

  return useConfigurableHook(adaptedConfig);
}

// Example 6: A/B testing with different configurations
export function usePropertySearchABTest(variant: 'A' | 'B', searchParams?: Record<string, unknown>) {
  const configA = createDataFetchingConfig('searchData', {
    name: 'Property Search Variant A',
    description: 'Conservative search configuration',
    endpoint: '/api/properties/search',
    debounceMs: 800,
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  const configB = createDataFetchingConfig('searchData', {
    name: 'Property Search Variant B',
    description: 'Aggressive search configuration',
    endpoint: '/api/properties/search',
    debounceMs: 400,
    staleTime: 30 * 1000,
    retry: 5,
    refetchOnWindowFocus: true,
  });

  const config = variant === 'A' ? configA : configB;
  return useConfigurableHook(config, searchParams);
}

// Example 7: Environment-specific configurations
export function useEnvironmentAwarePropertyFetching(
  endpoint: string,
  params?: Record<string, unknown>
) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  const config = createDataFetchingConfig('paginatedList', {
    name: 'Environment Aware Property Fetching',
    description: 'Configuration that adapts to the current environment',
    endpoint,

    // Development: More aggressive caching and detailed logging
    staleTime: isDevelopment ? 10 * 60 * 1000 : 2 * 60 * 1000,
    retry: isDevelopment ? 1 : 3, // Fail fast in development
    debounceMs: isDevelopment ? 200 : 500, // Faster feedback in development

    // Production: More conservative settings
    gcTime: isProduction ? 30 * 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: !isProduction, // Only refetch on focus in development

    // Custom validator with environment-specific behavior
    validator: (data: unknown): Property[] => {
      if (!Array.isArray(data)) return [];

      const properties = data.filter((item): item is Property => {
        if (!item || typeof item !== "object") return false;
        const obj = item as Record<string, unknown>;
        return (
          (typeof obj.id === "string" || typeof obj.id === "number") &&
          obj.id != null &&
          typeof obj.title === "string" &&
          obj.title.length > 0
        );
      });

      // In development, log validation results
      if (isDevelopment) {
        console.log(`[Property Fetching] Validated ${properties.length} properties from ${data.length} items`);
      }

      return properties;
    },
  });

  return useConfigurableHook(config, params);
}

// Example 8: Configuration inheritance and extension
export function useExtendedPropertyForm(
  baseFormType: 'property' | 'rental' | 'commercial',
  customFields?: Record<string, any>
) {
  const baseConfig = getFormPreset('propertyForm');

  // Extend base configuration with type-specific fields
  const typeSpecificFields = {
    rental: {
      leaseDuration: {
        initialValue: '12',
        rules: {
          required: 'Lease duration is required',
          custom: (value: string) => {
            const months = parseInt(value);
            return (months >= 1 && months <= 60) || 'Lease duration must be between 1 and 60 months';
          },
        },
      },
      securityDeposit: {
        initialValue: '',
        rules: {
          required: 'Security deposit amount is required',
          custom: (value: string) => {
            const amount = Number(value);
            return (!isNaN(amount) && amount > 0) || 'Security deposit must be a positive number';
          },
        },
      },
    },
    commercial: {
      businessType: {
        initialValue: '',
        rules: {
          required: 'Intended business type is required',
          minLength: { value: 5, message: 'Please provide more details about the business type' },
        },
      },
      parkingSpaces: {
        initialValue: 0,
        rules: {
          required: 'Number of parking spaces is required',
          min: { value: 0, message: 'Parking spaces cannot be negative' },
        },
      },
    },
  };

  const extendedConfig = {
    ...baseConfig,
    fields: {
      ...baseConfig.fields,
      ...(typeSpecificFields[baseFormType as keyof typeof typeSpecificFields] || {}),
      ...customFields,
    },
  };

  return useConfigurableHook(extendedConfig);
}

// Export all examples for documentation and testing
export const configurationExamples = {
  usePropertyListingWithPreset,
  useCustomPropertySearch,
  usePropertyInquiryForm,
  usePropertyDetailsPage,
  useAdaptivePropertySearch,
  usePropertySearchABTest,
  useEnvironmentAwarePropertyFetching,
  useExtendedPropertyForm,
};