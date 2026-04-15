/**
 * Route Parameter Validation Utilities
 * 
 * Responsibilities:
 * - Route parameter validation logic with comprehensive type safety
 * - Parameter wrapper component creation with error boundaries
 * - Route validation error handling with user-friendly messaging
 * - Generic factory pattern for reusable parameter validation
 */

import { AlertTriangle } from "lucide-react"
import React from "react"
import { useParams } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "../shared/components/ui/card"
import { routeValidator } from "../shared/utils/route-validator"

import { ErrorBoundary } from "./error-boundary"

// Enhanced interface for route parameters with strict readonly constraints
export interface RouteParams {
  readonly id?: string;
  readonly [key: string]: string | undefined;
}

// Enhanced component props interface - fully compatible with LazyComponent pattern
export interface ComponentWithParams extends Record<string, unknown> {
  readonly id?: string | undefined;
  readonly params?: RouteParams;
  readonly isLoading?: boolean;
  readonly error?: Error | null;
}

// Validation result interface for better type safety and immutability
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

// Configuration interface for error display customization
export interface ErrorConfig {
  readonly title: string;
  readonly description: string;
}



/**
 * Validates route parameters against required parameter list
 * Uses the shared route validator for consistent validation logic
 * Returns immutable validation result to prevent accidental mutations
 */
export const validateRouteParams = (
  params: RouteParams,
  requiredParams: readonly string[] = []
): ValidationResult => {
  // Convert readonly array to mutable array for the validator (internal implementation detail)
  const validation = routeValidator.validateRouteParams(params, [...requiredParams]);
  
  // Return frozen result to ensure immutability at the boundary
  return Object.freeze({
    isValid: validation.isValid,
    errors: Object.freeze([...validation.errors]),
  });
};

/**
 * Reusable component for displaying parameter validation errors
 * Wrapped in ErrorBoundary to handle any rendering issues gracefully
 * Uses consistent UI components for professional error presentation
 */
export const ParameterValidationError: React.FC<{
  readonly title: string;
  readonly description: string;
  readonly errors: readonly string[];
}> = React.memo(({ title, description, errors }) => (
  <ErrorBoundary>
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {errors.length > 0 && (
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <li key={`validation-error-${index}`}>• {error}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  </ErrorBoundary>
));

// Display name for better debugging experience
ParameterValidationError.displayName = 'ParameterValidationError';

/**
 * Generic factory function for creating parameter validation wrappers
 * This is a higher-order component pattern that promotes code reuse
 * while maintaining type safety and consistent error handling
 */
export const createParameterWrapper = <T extends readonly string[]>(
  requiredParams: T,
  errorConfig: ErrorConfig
) => {
  /**
   * The actual wrapper component returned by the factory
   * Enhanced with better generic constraints for type safety
   */
  const ParameterWrapper: React.FC<{
    readonly component: React.ComponentType<ComponentWithParams>;
  }> = ({ component: Component }) => {
    // Extract parameters using React Router's hook with proper typing
    const params = useParams<Record<string, string | undefined>>();

    // Convert to our RouteParams interface for consistency
    const routeParams: RouteParams = params;

    // Perform validation using our centralized validation logic
    const validation = validateRouteParams(routeParams, requiredParams);

    // Early return pattern for error cases - improves readability
    if (!validation.isValid) {
      return (
        <ParameterValidationError
          title={errorConfig.title}
          description={errorConfig.description}
          errors={validation.errors}
        />
      );
    }

    // Success path: render the component with validated parameters
    // Each prop is explicitly defined for better type checking
    return (
      <ErrorBoundary>
        <Component
          id={routeParams.id}
          params={routeParams}
          isLoading={false}
          error={null}
        />
      </ErrorBoundary>
    );
  };

  // Set display name for better debugging and React DevTools experience
  ParameterWrapper.displayName = `ParameterWrapper(${requiredParams.join(',')})`;

  return ParameterWrapper;
};

/**
 * Pre-configured wrapper factories for common use cases
 * These provide consistent error messaging across the application
 * while leveraging the generic factory pattern above
 */

export const PropertyDetailsWrapper = createParameterWrapper(
  ["id"] as const, // 'as const' ensures readonly tuple type
  {
    title: "Invalid Route Parameters",
    description: "The URL parameters are invalid or missing:",
  }
);

export const PropertyEditWrapper = createParameterWrapper(
  ["id"] as const,
  {
    title: "Invalid Property ID", 
    description: "Cannot edit property with invalid parameters:",
  }
);

export const BlogPostWrapper = createParameterWrapper(
  ["id"] as const,
  {
    title: "Blog Post Not Found",
    description: "The blog post ID is invalid or missing:",
  }
);

export const LandDetailsWrapper = createParameterWrapper(
  ["id"] as const,
  {
    title: "Invalid Land ID",
    description: "Cannot display land details with invalid parameters:",
  }
);

/**
 * Safe parameter access utility that addresses object injection concerns
 * Uses branded types and proper validation to ensure type safety
 */
const getParamValue = (params: RouteParams, paramName: string): string | undefined => {
  // Validate parameter name to prevent injection
  if (typeof paramName !== 'string' || paramName.trim().length === 0) {
    return undefined;
  }
  
  // Use Object.prototype.hasOwnProperty for safer access
  if (Object.prototype.hasOwnProperty.call(params, paramName)) {
    const value = params[paramName as keyof RouteParams];
    return typeof value === 'string' ? value : undefined;
  }
  
  return undefined;
};

/**
 * Utility function for checking if a parameter exists and is valid
 * Enhanced with safer parameter access to address security concerns
 */
export const hasValidParam = (
  params: RouteParams, 
  paramName: string
): params is RouteParams & Record<typeof paramName, string> => {
  const value = getParamValue(params, paramName);
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Type guard for checking if route parameters contain required fields
 * Provides compile-time safety when accessing parameter values
 * Enhanced with better error handling and parameter validation
 */
export const hasRequiredParams = <T extends readonly string[]>(
  params: RouteParams,
  requiredParams: T
): params is RouteParams & Record<T[number], string> => {
  // Validate input parameters first
  if (!params || typeof params !== 'object') {
    return false;
  }
  
  if (!Array.isArray(requiredParams) || requiredParams.length === 0) {
    return true; // No requirements means validation passes
  }
  
  // Check each required parameter with safe access
  return requiredParams.every(param => {
    if (typeof param !== 'string') {
      return false;
    }
    return hasValidParam(params, param);
  });
};

/**
 * Enhanced parameter extraction hook with comprehensive error handling
 * Provides a centralized way to safely extract and validate route parameters
 */
export const useValidatedParams = <T extends readonly string[]>(
  requiredParams: T
): ValidationResult & { 
  params: RouteParams; 
  extractedParams: Partial<Record<T[number], string>> 
} => {
  const params = useParams<Record<string, string | undefined>>();
  const routeParams: RouteParams = params;
  
  const validation = validateRouteParams(routeParams, requiredParams);
  
  // Safely extract validated parameters
  const extractedParams: Partial<Record<T[number], string>> = {};
  
  if (validation.isValid) {
    for (const paramName of requiredParams) {
      const value = getParamValue(routeParams, paramName);
      if (value !== undefined) {
        // Safe assignment using proper object access
        extractedParams[paramName as T[number]] = value;
      }
    }
  }
  
  return Object.freeze({
    ...validation,
    params: routeParams,
    extractedParams: Object.freeze(extractedParams)
  });
};