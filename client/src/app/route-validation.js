"use strict";
/**
 * Route Parameter Validation Utilities
 *
 * Responsibilities:
 * - Route parameter validation logic with comprehensive type safety
 * - Parameter wrapper component creation with error boundaries
 * - Route validation error handling with user-friendly messaging
 * - Generic factory pattern for reusable parameter validation
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useValidatedParams = exports.hasRequiredParams = exports.hasValidParam = exports.LandDetailsWrapper = exports.BlogPostWrapper = exports.PropertyEditWrapper = exports.PropertyDetailsWrapper = exports.createParameterWrapper = exports.ParameterValidationError = exports.validateRouteParams = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var card_1 = require("../local/components/ui/card");
var route_validator_1 = require("../local/utils/route-validator");
var error_boundary_1 = require("./error-boundary");
/**
 * Validates route parameters against required parameter list
 * Uses the shared route validator for consistent validation logic
 * Returns immutable validation result to prevent accidental mutations
 */
var validateRouteParams = function (params, requiredParams) {
    if (requiredParams === void 0) { requiredParams = []; }
    // Convert readonly array to mutable array for the validator (internal implementation detail)
    var validation = route_validator_1.routeValidator.validateRouteParams(params, __spreadArray([], requiredParams, true));
    // Return frozen result to ensure immutability at the boundary
    return Object.freeze({
        isValid: validation.isValid,
        errors: Object.freeze(__spreadArray([], validation.errors, true)),
    });
};
exports.validateRouteParams = validateRouteParams;
/**
 * Reusable component for displaying parameter validation errors
 * Wrapped in ErrorBoundary to handle any rendering issues gracefully
 * Uses consistent UI components for professional error presentation
 */
exports.ParameterValidationError = react_1.default.memo(function (_a) {
    var title = _a.title, description = _a.description, errors = _a.errors;
    return (<error_boundary_1.ErrorBoundary>
    <div className="flex items-center justify-center min-h-[400px]">
      <card_1.Card className="max-w-md mx-auto">
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2 text-red-600">
            <lucide_react_1.AlertTriangle className="h-5 w-5"/>
            {title}
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {errors.length > 0 && (<ul className="text-sm text-red-600 space-y-1">
              {errors.map(function (error, index) { return (<li key={"validation-error-".concat(index)}>• {error}</li>); })}
            </ul>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>
  </error_boundary_1.ErrorBoundary>);
});
// Display name for better debugging experience
exports.ParameterValidationError.displayName = 'ParameterValidationError';
/**
 * Generic factory function for creating parameter validation wrappers
 * This is a higher-order component pattern that promotes code reuse
 * while maintaining type safety and consistent error handling
 */
var createParameterWrapper = function (requiredParams, errorConfig) {
    /**
     * The actual wrapper component returned by the factory
     * Enhanced with better generic constraints for type safety
     */
    var ParameterWrapper = function (_a) {
        var Component = _a.component;
        // Extract parameters using React Router's hook with proper typing
        var params = (0, react_router_dom_1.useParams)();
        // Convert to our RouteParams interface for consistency
        var routeParams = params;
        // Perform validation using our centralized validation logic
        var validation = (0, exports.validateRouteParams)(routeParams, requiredParams);
        // Early return pattern for error cases - improves readability
        if (!validation.isValid) {
            return (<exports.ParameterValidationError title={errorConfig.title} description={errorConfig.description} errors={validation.errors}/>);
        }
        // Success path: render the component with validated parameters
        // Each prop is explicitly defined for better type checking
        return (<error_boundary_1.ErrorBoundary>
        <Component id={routeParams.id} params={routeParams} isLoading={false} error={null}/>
      </error_boundary_1.ErrorBoundary>);
    };
    // Set display name for better debugging and React DevTools experience
    ParameterWrapper.displayName = "ParameterWrapper(".concat(requiredParams.join(','), ")");
    return ParameterWrapper;
};
exports.createParameterWrapper = createParameterWrapper;
/**
 * Pre-configured wrapper factories for common use cases
 * These provide consistent error messaging across the application
 * while leveraging the generic factory pattern above
 */
exports.PropertyDetailsWrapper = (0, exports.createParameterWrapper)(["id"], // 'as const' ensures readonly tuple type
{
    title: "Invalid Route Parameters",
    description: "The URL parameters are invalid or missing:",
});
exports.PropertyEditWrapper = (0, exports.createParameterWrapper)(["id"], {
    title: "Invalid Property ID",
    description: "Cannot edit property with invalid parameters:",
});
exports.BlogPostWrapper = (0, exports.createParameterWrapper)(["id"], {
    title: "Blog Post Not Found",
    description: "The blog post ID is invalid or missing:",
});
exports.LandDetailsWrapper = (0, exports.createParameterWrapper)(["id"], {
    title: "Invalid Land ID",
    description: "Cannot display land details with invalid parameters:",
});
/**
 * Safe parameter access utility that addresses object injection concerns
 * Uses branded types and proper validation to ensure type safety
 */
var getParamValue = function (params, paramName) {
    // Validate parameter name to prevent injection
    if (typeof paramName !== 'string' || paramName.trim().length === 0) {
        return undefined;
    }
    // Use Object.prototype.hasOwnProperty for safer access
    if (Object.prototype.hasOwnProperty.call(params, paramName)) {
        var value = params[paramName];
        return typeof value === 'string' ? value : undefined;
    }
    return undefined;
};
/**
 * Utility function for checking if a parameter exists and is valid
 * Enhanced with safer parameter access to address security concerns
 */
var hasValidParam = function (params, paramName) {
    var value = getParamValue(params, paramName);
    return typeof value === 'string' && value.trim().length > 0;
};
exports.hasValidParam = hasValidParam;
/**
 * Type guard for checking if route parameters contain required fields
 * Provides compile-time safety when accessing parameter values
 * Enhanced with better error handling and parameter validation
 */
var hasRequiredParams = function (params, requiredParams) {
    // Validate input parameters first
    if (!params || typeof params !== 'object') {
        return false;
    }
    if (!Array.isArray(requiredParams) || requiredParams.length === 0) {
        return true; // No requirements means validation passes
    }
    // Check each required parameter with safe access
    return requiredParams.every(function (param) {
        if (typeof param !== 'string') {
            return false;
        }
        return (0, exports.hasValidParam)(params, param);
    });
};
exports.hasRequiredParams = hasRequiredParams;
/**
 * Enhanced parameter extraction hook with comprehensive error handling
 * Provides a centralized way to safely extract and validate route parameters
 */
var useValidatedParams = function (requiredParams) {
    var params = (0, react_router_dom_1.useParams)();
    var routeParams = params;
    var validation = (0, exports.validateRouteParams)(routeParams, requiredParams);
    // Safely extract validated parameters
    var extractedParams = {};
    if (validation.isValid) {
        for (var _i = 0, requiredParams_1 = requiredParams; _i < requiredParams_1.length; _i++) {
            var paramName = requiredParams_1[_i];
            var value = getParamValue(routeParams, paramName);
            if (value !== undefined) {
                // Safe assignment using proper object access
                extractedParams[paramName] = value;
            }
        }
    }
    return Object.freeze(__assign(__assign({}, validation), { params: routeParams, extractedParams: Object.freeze(extractedParams) }));
};
exports.useValidatedParams = useValidatedParams;
