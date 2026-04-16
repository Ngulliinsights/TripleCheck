"use strict";
/**
 * Route Validation Utility
 * Provides comprehensive route validation and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeExists = exports.validateRouteParams = exports.validateRoute = exports.routeValidator = exports.RouteValidator = void 0;
var RouteValidator = /** @class */ (function () {
    function RouteValidator() {
        this.validRoutes = new Set();
        this.routePatterns = new Map();
        this.initializeValidRoutes();
    }
    RouteValidator.getInstance = function () {
        if (!RouteValidator.instance) {
            RouteValidator.instance = new RouteValidator();
        }
        return RouteValidator.instance;
    };
    RouteValidator.prototype.initializeValidRoutes = function () {
        var _this = this;
        // Core application routes
        var routes = [
            '/',
            '/features',
            '/pricing',
            '/auth/login',
            '/auth/register',
            '/dashboard',
            '/team',
            '/tenants',
            '/properties',
            '/properties/my',
            '/properties/residential',
            '/properties/commercial',
            '/properties/land',
            '/property/:id',
            '/property/:id/edit',
            '/property/:id/photos',
            '/property/:id/optimize',
            '/land/:id',
            '/compare',
            '/list-property',
            '/services',
            '/services/list-property',
            '/services/basic-checks',
            '/services/fraud-detection',
            '/services/document-auth',
            '/services/reports',
            '/services/alerts',
            '/services/karma',
            '/services/reputation',
            '/services/trust-points',
            '/services/reviews',
            '/solutions',
            '/solutions/buyers',
            '/solutions/sellers',
            '/solutions/agents',
            '/solutions/developers',
            '/solutions/legal-experts',
            '/land-verification',
            '/land-verification/dashboard',
            '/land-verification/new',
            '/search',
            '/inbox',
            '/help',
            '/help/getting-started',
            '/help/verification-guide',
            '/help/faq',
            '/contact',
            '/resources',
            '/blog',
            '/blog/:id',
            '/community-resources',
            '/community',
            '/fraud-guide',
            '/fraud-resources',
            '/resources/fraud',
            '/about',
            '/static/our-story',
            '/static/partners',
            '/static/press-media',
            '/privacy',
            '/terms',
            '/cookies',
            '/security',
            '/mvp-demo',
            '/dev'
        ];
        routes.forEach(function (route) {
            _this.validRoutes.add(route);
            // Create regex pattern for parameterized routes
            if (route.includes(':')) {
                var pattern = route.replace(/:([^/]+)/g, '([^/]+)');
                _this.routePatterns.set(route, new RegExp("^".concat(pattern, "$")));
            }
        });
    };
    /**
     * Validate a route path
     */
    RouteValidator.prototype.validateRoute = function (path) {
        var errors = [];
        var warnings = [];
        // Check if it's an exact match
        if (this.validRoutes.has(path)) {
            return { isValid: true, errors: errors, warnings: warnings };
        }
        // Check against parameterized routes
        for (var _i = 0, _a = this.routePatterns; _i < _a.length; _i++) {
            var _b = _a[_i], routePattern = _b[0], regex = _b[1];
            if (regex.test(path)) {
                return { isValid: true, errors: errors, warnings: warnings };
            }
        }
        // If no match found, it's invalid
        errors.push("Route '".concat(path, "' is not defined in the application"));
        // Suggest similar routes
        var suggestions = this.findSimilarRoutes(path);
        if (suggestions.length > 0) {
            warnings.push("Did you mean: ".concat(suggestions.join(', '), "?"));
        }
        return { isValid: false, errors: errors, warnings: warnings };
    };
    /**
     * Validate route parameters
     */
    RouteValidator.prototype.validateRouteParams = function (params, requiredParams) {
        var _a;
        if (requiredParams === void 0) { requiredParams = []; }
        var errors = [];
        var warnings = [];
        // Check required parameters
        for (var _i = 0, requiredParams_1 = requiredParams; _i < requiredParams_1.length; _i++) {
            var param = requiredParams_1[_i];
            if (!params[param] || ((_a = params[param]) === null || _a === void 0 ? void 0 : _a.trim()) === '') {
                errors.push("Missing required parameter: ".concat(param));
            }
        }
        // Validate ID format if present
        if (params.id && !/^[a-zA-Z0-9_-]+$/.test(params.id)) {
            errors.push('Invalid ID format. IDs should contain only letters, numbers, underscores, and hyphens.');
        }
        // Check for potentially dangerous parameters
        for (var _b = 0, _c = Object.entries(params); _b < _c.length; _b++) {
            var _d = _c[_b], key = _d[0], value = _d[1];
            if (value && this.containsSuspiciousContent(value)) {
                warnings.push("Parameter '".concat(key, "' contains potentially unsafe content"));
            }
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    };
    /**
     * Find similar routes for suggestions
     */
    RouteValidator.prototype.findSimilarRoutes = function (path) {
        var suggestions = [];
        var pathParts = path.toLowerCase().split('/').filter(Boolean);
        for (var _i = 0, _a = this.validRoutes; _i < _a.length; _i++) {
            var route = _a[_i];
            var routeParts = route.toLowerCase().split('/').filter(Boolean);
            // Calculate similarity score
            var similarity = this.calculateSimilarity(pathParts, routeParts);
            if (similarity > 0.5) {
                suggestions.push(route);
            }
        }
        return suggestions.slice(0, 3); // Return top 3 suggestions
    };
    /**
     * Calculate similarity between two path arrays
     */
    RouteValidator.prototype.calculateSimilarity = function (path1, path2) {
        var maxLength = Math.max(path1.length, path2.length);
        if (maxLength === 0)
            return 1;
        var matches = 0;
        var minLength = Math.min(path1.length, path2.length);
        for (var i = 0; i < minLength; i++) {
            if (path1[i] === path2[i] || this.isParameterMatch(path1[i] || '', path2[i] || '')) {
                matches++;
            }
        }
        return matches / maxLength;
    };
    /**
     * Check if a path segment matches a parameter pattern
     */
    RouteValidator.prototype.isParameterMatch = function (segment1, segment2) {
        return segment1.startsWith(':') || segment2.startsWith(':');
    };
    /**
     * Check for suspicious content in parameters
     */
    RouteValidator.prototype.containsSuspiciousContent = function (value) {
        var suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /\.\./,
            /[<>'"]/
        ];
        return suspiciousPatterns.some(function (pattern) { return pattern.test(value); });
    };
    /**
     * Get all valid routes for debugging
     */
    RouteValidator.prototype.getAllValidRoutes = function () {
        return Array.from(this.validRoutes).sort();
    };
    /**
     * Check if a route exists in the application
     */
    RouteValidator.prototype.routeExists = function (path) {
        return this.validateRoute(path).isValid;
    };
    return RouteValidator;
}());
exports.RouteValidator = RouteValidator;
// Export singleton instance
exports.routeValidator = RouteValidator.getInstance();
// Export utility functions
var validateRoute = function (path) { return exports.routeValidator.validateRoute(path); };
exports.validateRoute = validateRoute;
var validateRouteParams = function (params, requiredParams) {
    return exports.routeValidator.validateRouteParams(params, requiredParams);
};
exports.validateRouteParams = validateRouteParams;
var routeExists = function (path) { return exports.routeValidator.routeExists(path); };
exports.routeExists = routeExists;
