// API service for property data

// Define comprehensive ResidentialFilters interface
// This replaces the problematic import and gives us full type control
export interface ResidentialFilters {
  query?: string;
  location?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean | null;
  parking?: boolean;
  verified?: boolean;
}

// Define ResidentialProperty interface with comprehensive typing
export interface ResidentialProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  parking: boolean;
  verified: boolean;
  // Add other property fields as needed
}

// Generic API response interface with better type safety
export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Error response interface for better error handling
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Share method type for better type safety
export type ShareMethod = 'email' | 'sms' | 'link';

// Share response interface
export interface ShareResponse {
  shareUrl: string;
}

// Custom error class for API-specific errors
export class PropertyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'PropertyApiError';
  }
}

// Base API configuration
const API_CONFIG = {
  baseUrl: '/api',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
} as const;

// Constants to avoid string duplication (fixes sonarjs/no-duplicate-string)
const ERROR_MESSAGES = {
  FAILED_TO_FETCH: 'Failed to fetch residential properties',
  FAILED_TO_ADD_FAVORITE: 'Failed to add property to favorites',
  FAILED_TO_SHARE: 'Failed to share property',
  FAILED_TO_REMOVE_FAVORITE: 'Failed to remove property from favorites',
  UNKNOWN_ERROR: 'Unknown error',
  PARSE_ERROR: 'Failed to parse response as JSON',
} as const;

// Helper function to handle API responses with improved error handling
// Fixed: Eliminated useless assignment and improved exception handling
async function handleApiResponse<T>(response: globalThis.Response): Promise<T> {
  if (!response.ok) {
    // Directly declare the variable with the default value to avoid useless assignment
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      // Try to parse error response as JSON
      const errorData: ApiError = await response.json();
      // Only reassign if we successfully got a message from the API
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      // Properly handle the exception by logging it for debugging purposes
      // This addresses the sonarjs/no-ignored-exceptions rule
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse error response as JSON:', parseError);
      }
      // We keep the default errorMessage that was already set
    }
    
    throw new PropertyApiError(
      errorMessage,
      response.status,
      response.status.toString()
    );
  }
  
  try {
    return await response.json() as T;
  } catch (parseError) {
    // Handle JSON parsing error with proper error context
    const errorMessage = parseError instanceof Error 
      ? `${ERROR_MESSAGES.PARSE_ERROR}: ${parseError.message}`
      : ERROR_MESSAGES.PARSE_ERROR;
    
    throw new PropertyApiError(
      errorMessage,
      response.status
    );
  }
}

// Improved type-safe transformation function
// This ensures we can safely convert unknown values to strings
function safeTransform(value: unknown): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  // Handle null/undefined by returning empty string
  return String(value ?? '');
}

// Helper function to build query parameters with improved type safety
// Fixed: Addressed object injection vulnerability by using a safer approach
function buildQueryParams(filters: ResidentialFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  // Define filter mappings with proper typing and safer object access pattern
  // This approach is more secure than dynamic property access
  const filterMappings = [
    { 
      getValue: () => filters.query,
      paramName: 'search',
      requiresTransform: false
    },
    { 
      getValue: () => filters.location,
      paramName: 'location',
      requiresTransform: false
    },
    { 
      getValue: () => filters.propertyType,
      paramName: 'type',
      requiresTransform: false
    },
    { 
      getValue: () => filters.priceMin,
      paramName: 'priceMin',
      requiresTransform: true
    },
    { 
      getValue: () => filters.priceMax,
      paramName: 'priceMax',
      requiresTransform: true
    },
    { 
      getValue: () => filters.bedrooms,
      paramName: 'bedrooms',
      requiresTransform: true
    },
    { 
      getValue: () => filters.bathrooms,
      paramName: 'bathrooms',
      requiresTransform: true
    },
  ] as const;
  
  // Apply standard mappings with type-safe transformation
  // This eliminates the security vulnerability by avoiding dynamic object property access
  filterMappings.forEach(({ getValue, paramName, requiresTransform }) => {
    const value = getValue();
    if (value != null && value !== '') {
      // Use our type-safe transformation function
      const paramValue = requiresTransform ? safeTransform(value) : String(value);
      params.append(paramName, paramValue);
    }
  });
  
  // Handle boolean filters with explicit type checking
  // This provides better control over boolean parameter handling
  if (filters.furnished !== null && filters.furnished !== undefined) {
    params.append('furnished', filters.furnished.toString());
  }
  
  if (filters.parking === true) {
    params.append('parking', 'true');
  }
  
  if (filters.verified === true) {
    params.append('verified', 'true');
  }
  
  return params;
}

// Helper function to create fetch options with default headers
function createFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
}

// Input validation helper to ensure type safety at runtime
function validatePropertyId(propertyId: string): void {
  if (!propertyId?.trim()) {
    throw new PropertyApiError('Property ID is required and cannot be empty');
  }
}

function validateShareMethod(method: ShareMethod): void {
  const validMethods: ShareMethod[] = ['email', 'sms', 'link'];
  if (!method || !validMethods.includes(method)) {
    throw new PropertyApiError('Share method is required and must be one of: email, sms, link');
  }
}

// Helper function to create consistent error messages
// This reduces code duplication and provides better error handling consistency
function createApiError(baseMessage: string, originalError: unknown): PropertyApiError {
  const errorDetails = originalError instanceof Error ? originalError.message : ERROR_MESSAGES.UNKNOWN_ERROR;
  return new PropertyApiError(`${baseMessage}: ${errorDetails}`);
}

// Main property API service with enhanced error handling and type safety
export const propertyApi = {
  /**
   * Fetch residential properties from the backend with comprehensive filtering
   * @param filters - The filtering criteria for properties
   * @returns Promise resolving to an array of residential properties
   */
  async fetchResidentialProperties(filters: ResidentialFilters): Promise<ResidentialProperty[]> {
    try {
      const queryParams = buildQueryParams(filters);
      const url = `${API_CONFIG.baseUrl}/properties/residential?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        ...createFetchOptions(),
      });
      
      const result = await handleApiResponse<ApiResponse<ResidentialProperty>>(response);
      return result.data;
    } catch (error) {
      // Re-throw PropertyApiError instances, wrap other errors with consistent messaging
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw createApiError(ERROR_MESSAGES.FAILED_TO_FETCH, error);
    }
  },

  /**
   * Add a property to user's favorites
   * @param propertyId - Unique identifier for the property
   * @returns Promise that resolves when the property is added to favorites
   */
  async addToFavorites(propertyId: string): Promise<void> {
    validatePropertyId(propertyId);

    try {
      const url = `${API_CONFIG.baseUrl}/properties/${encodeURIComponent(propertyId)}/favorite`;
      
      const response = await fetch(url, {
        method: 'POST',
        ...createFetchOptions(),
      });
      
      await handleApiResponse<void>(response);
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw createApiError(ERROR_MESSAGES.FAILED_TO_ADD_FAVORITE, error);
    }
  },

  /**
   * Share a property through various methods
   * @param propertyId - Unique identifier for the property
   * @param method - The sharing method (email, sms, or link)
   * @returns Promise resolving to the share URL
   */
  async shareProperty(propertyId: string, method: ShareMethod): Promise<string> {
    validatePropertyId(propertyId);
    validateShareMethod(method);

    try {
      const url = `${API_CONFIG.baseUrl}/properties/${encodeURIComponent(propertyId)}/share`;
      
      const response = await fetch(url, {
        method: 'POST',
        ...createFetchOptions(),
        body: JSON.stringify({ method }),
      });
      
      const result = await handleApiResponse<ShareResponse>(response);
      return result.shareUrl;
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw createApiError(ERROR_MESSAGES.FAILED_TO_SHARE, error);
    }
  },

  /**
   * Remove a property from user's favorites
   * @param propertyId - Unique identifier for the property
   * @returns Promise that resolves when the property is removed from favorites
   */
  async removeFromFavorites(propertyId: string): Promise<void> {
    validatePropertyId(propertyId);

    try {
      const url = `${API_CONFIG.baseUrl}/properties/${encodeURIComponent(propertyId)}/favorite`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        ...createFetchOptions(),
      });
      
      await handleApiResponse<void>(response);
    } catch (error) {
      if (error instanceof PropertyApiError) {
        throw error;
      }
      throw createApiError(ERROR_MESSAGES.FAILED_TO_REMOVE_FAVORITE, error);
    }
  },
} as const;