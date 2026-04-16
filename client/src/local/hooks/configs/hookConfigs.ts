import { SafeQueryOptions } from '../useSafeQuery'
import { FieldConfig } from '../useFormValidation'

// Base configuration interface for all configurable hooks
export interface BaseHookConfig {
  name: string;
  description: string;
  category: 'data-fetching' | 'form-validation' | 'ui-interaction' | 'performance' | 'utility';
}

// Configuration for data fetching hooks
export interface DataFetchingConfig<T = any> extends BaseHookConfig, Partial<SafeQueryOptions<T>> {
  category: 'data-fetching';
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  validator?: (data: unknown) => T | null;
  fallbackData: T;
}

// Configuration for form validation hooks
export interface FormValidationConfig<T = Record<string, any>> extends BaseHookConfig {
  category: 'form-validation';
  fields: Record<keyof T, FieldConfig<any>>;
  globalValidation?: (formData: T) => string | true;
  onSubmit?: (data: T) => Promise<void> | void;
}

// Configuration for UI interaction hooks
export interface UIInteractionConfig extends BaseHookConfig {
  category: 'ui-interaction';
  debounceMs?: number;
  throttleMs?: number;
  enableKeyboardShortcuts?: boolean;
  enableTouchGestures?: boolean;
}

// Configuration for performance monitoring hooks
export interface PerformanceConfig extends BaseHookConfig {
  category: 'performance';
  trackRenderTime?: boolean;
  trackMemoryUsage?: boolean;
  trackNetworkRequests?: boolean;
  sampleRate?: number; // 0-1, percentage of operations to track
}

// Utility configuration for general-purpose hooks
export interface UtilityConfig extends BaseHookConfig {
  category: 'utility';
  options: Record<string, any>;
}

// Union type for all configurations
export type HookConfig = 
  | DataFetchingConfig
  | FormValidationConfig
  | UIInteractionConfig
  | PerformanceConfig
  | UtilityConfig;

// Configuration presets for common use cases
export const commonDataFetchingConfigs: Record<string, DataFetchingConfig> = {
  // API list fetching with pagination
  paginatedList: {
    name: 'Paginated List',
    description: 'Standard configuration for paginated list data fetching',
    category: 'data-fetching',
    endpoint: '', // To be overridden
    method: 'GET',
    fallbackData: { data: [], total: 0, page: 1, hasNext: false, hasPrev: false },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    debounceMs: 500,
    deduplicate: true,
    validator: (data: unknown) => {
      if (!data || typeof data !== 'object') {
        return { data: [], total: 0, page: 1, hasNext: false, hasPrev: false };
      }
      const response = data as Record<string, unknown>;
      return {
        data: Array.isArray(response.data) ? response.data : [],
        total: typeof response.total === 'number' ? response.total : 0,
        page: typeof response.page === 'number' ? response.page : 1,
        hasNext: Boolean(response.hasNext),
        hasPrev: Boolean(response.hasPrev),
      };
    },
  },

  // Single item fetching
  singleItem: {
    name: 'Single Item',
    description: 'Configuration for fetching a single item by ID',
    category: 'data-fetching',
    endpoint: '', // To be overridden
    method: 'GET',
    fallbackData: null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    deduplicate: true,
    validator: (data: unknown) => data || null,
  },

  // Real-time data fetching
  realTime: {
    name: 'Real-time Data',
    description: 'Configuration for frequently updated data',
    category: 'data-fetching',
    endpoint: '', // To be overridden
    method: 'GET',
    fallbackData: null,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 5,
    debounceMs: 200,
    deduplicate: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Search/filter data fetching
  searchData: {
    name: 'Search Data',
    description: 'Configuration for search and filter operations',
    category: 'data-fetching',
    endpoint: '', // To be overridden
    method: 'GET',
    fallbackData: { results: [], total: 0, query: '' },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    debounceMs: 800, // Longer debounce for search
    deduplicate: true,
    validator: (data: unknown) => {
      if (!data || typeof data !== 'object') {
        return { results: [], total: 0, query: '' };
      }
      const response = data as Record<string, unknown>;
      return {
        results: Array.isArray(response.results) ? response.results : [],
        total: typeof response.total === 'number' ? response.total : 0,
        query: typeof response.query === 'string' ? response.query : '',
      };
    },
  },
};

export const commonUIInteractionConfigs: Record<string, UIInteractionConfig> = {
  // Standard user interaction
  standardInteraction: {
    name: 'Standard Interaction',
    description: 'Default configuration for user interactions',
    category: 'ui-interaction',
    debounceMs: 300,
    enableKeyboardShortcuts: true,
    enableTouchGestures: false,
  },

  // Search input interaction
  searchInput: {
    name: 'Search Input',
    description: 'Configuration for search input interactions',
    category: 'ui-interaction',
    debounceMs: 500,
    enableKeyboardShortcuts: true,
    enableTouchGestures: false,
  },

  // Mobile-optimized interaction
  mobileInteraction: {
    name: 'Mobile Interaction',
    description: 'Configuration optimized for mobile devices',
    category: 'ui-interaction',
    debounceMs: 200,
    throttleMs: 100,
    enableKeyboardShortcuts: false,
    enableTouchGestures: true,
  },

  // High-frequency interaction (like sliders, drag & drop)
  highFrequency: {
    name: 'High Frequency',
    description: 'Configuration for high-frequency interactions',
    category: 'ui-interaction',
    throttleMs: 16, // ~60fps
    enableKeyboardShortcuts: true,
    enableTouchGestures: true,
  },
};

export const commonPerformanceConfigs: Record<string, PerformanceConfig> = {
  // Development monitoring
  development: {
    name: 'Development Monitoring',
    description: 'Comprehensive monitoring for development environment',
    category: 'performance',
    trackRenderTime: true,
    trackMemoryUsage: true,
    trackNetworkRequests: true,
    sampleRate: 1.0, // Track everything in development
  },

  // Production monitoring
  production: {
    name: 'Production Monitoring',
    description: 'Lightweight monitoring for production environment',
    category: 'performance',
    trackRenderTime: true,
    trackMemoryUsage: false,
    trackNetworkRequests: true,
    sampleRate: 0.1, // Sample 10% in production
  },

  // Critical path monitoring
  criticalPath: {
    name: 'Critical Path',
    description: 'Monitoring for critical user paths',
    category: 'performance',
    trackRenderTime: true,
    trackMemoryUsage: true,
    trackNetworkRequests: true,
    sampleRate: 0.5, // Sample 50% for critical paths
  },
};

// Configuration registry
export const hookConfigRegistry = {
  dataFetching: commonDataFetchingConfigs,
  uiInteraction: commonUIInteractionConfigs,
  performance: commonPerformanceConfigs,
} as const;

// Type helpers
export type DataFetchingConfigKey = keyof typeof commonDataFetchingConfigs;
export type UIInteractionConfigKey = keyof typeof commonUIInteractionConfigs;
export type PerformanceConfigKey = keyof typeof commonPerformanceConfigs;

// Helper functions to get configurations
export function getDataFetchingConfig(key: DataFetchingConfigKey): DataFetchingConfig {
  return commonDataFetchingConfigs[key];
}

export function getUIInteractionConfig(key: UIInteractionConfigKey): UIInteractionConfig {
  return commonUIInteractionConfigs[key];
}

export function getPerformanceConfig(key: PerformanceConfigKey): PerformanceConfig {
  return commonPerformanceConfigs[key];
}

// Factory function to create custom configurations
export function createDataFetchingConfig<T = any>(
  baseConfig: DataFetchingConfigKey,
  overrides: Partial<DataFetchingConfig<T>>
): DataFetchingConfig<T> {
  const base = getDataFetchingConfig(baseConfig);
  return {
    ...base,
    ...overrides,
  } as DataFetchingConfig<T>;
}

export function createUIInteractionConfig(
  baseConfig: UIInteractionConfigKey,
  overrides: Partial<UIInteractionConfig>
): UIInteractionConfig {
  const base = getUIInteractionConfig(baseConfig);
  return {
    ...base,
    ...overrides,
  };
}

export function createPerformanceConfig(
  baseConfig: PerformanceConfigKey,
  overrides: Partial<PerformanceConfig>
): PerformanceConfig {
  const base = getPerformanceConfig(baseConfig);
  return {
    ...base,
    ...overrides,
  };
}

// Configuration validation helpers
export function validateHookConfig(config: HookConfig): string[] {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push('Configuration name is required');
  }

  if (!config.description || config.description.trim().length === 0) {
    errors.push('Configuration description is required');
  }

  if (config.category === 'data-fetching') {
    const dataConfig = config as DataFetchingConfig;
    if (!dataConfig.endpoint || dataConfig.endpoint.trim().length === 0) {
      errors.push('Data fetching configuration requires an endpoint');
    }
    if (dataConfig.fallbackData === undefined) {
      errors.push('Data fetching configuration requires fallback data');
    }
  }

  if (config.category === 'form-validation') {
    const formConfig = config as FormValidationConfig;
    if (!formConfig.fields || Object.keys(formConfig.fields).length === 0) {
      errors.push('Form validation configuration requires field definitions');
    }
  }

  if (config.category === 'performance') {
    const perfConfig = config as PerformanceConfig;
    if (perfConfig.sampleRate !== undefined && (perfConfig.sampleRate < 0 || perfConfig.sampleRate > 1)) {
      errors.push('Performance configuration sample rate must be between 0 and 1');
    }
  }

  return errors;
}

// Configuration merger for combining multiple configurations
export function mergeConfigurations<T extends HookConfig>(
  base: T,
  ...overrides: Partial<T>[]
): T {
  return overrides.reduce((merged, override) => ({
    ...merged,
    ...override,
  }), base);
}