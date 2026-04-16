"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeMobileNav = exports.SafeEnhancedNavigation = void 0;
exports.SafeNavigation = SafeNavigation;
var react_1 = require("react");
var NavigationErrorBoundary_1 = require("./NavigationErrorBoundary");
// Safe loading fallback component
var NavigationLoadingFallback = function () { return (<div className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"/>
          <div className="hidden lg:flex space-x-6">
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"/>
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"/>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-64 h-10 bg-gray-200 rounded animate-pulse"/>
          <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"/>
        </div>
      </div>
    </div>
  </div>); };
// Safe navigation fallback when navigation fails
var NavigationFallback = function () { return (<div className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-gray-200">
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
            TripleCheck
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/properties" className="text-gray-700 hover:text-gray-900 transition-colors">
            Properties
          </a>
          <a href="/services/basic-checks" className="text-gray-700 hover:text-gray-900 transition-colors">
            Verify
          </a>
          <a href="/auth/login" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors">
            Login
          </a>
        </div>
      </div>
    </div>
  </div>); };
/**
 * SafeNavigation wrapper component that provides error boundaries and loading states
 * for navigation components to prevent crashes from affecting the entire application
 */
function SafeNavigation(_a) {
    var children = _a.children, fallback = _a.fallback, loadingFallback = _a.loadingFallback;
    return (<NavigationErrorBoundary_1.NavigationErrorBoundary fallback={fallback || <NavigationFallback />} onError={function (error, errorInfo) {
            // Log navigation errors for debugging
            if (process.env.NODE_ENV === 'development') {
                console.error('Navigation component error:', error, errorInfo);
            }
            // In production, you might want to send this to an error tracking service
            // errorTrackingService.captureException(error, { extra: errorInfo });
        }}>
      <react_1.Suspense fallback={loadingFallback || <NavigationLoadingFallback />}>
        {children}
      </react_1.Suspense>
    </NavigationErrorBoundary_1.NavigationErrorBoundary>);
}
// Export individual safe navigation components
var SafeEnhancedNavigation = function (_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (<SafeNavigation {...props}>
    {children}
  </SafeNavigation>);
};
exports.SafeEnhancedNavigation = SafeEnhancedNavigation;
var SafeMobileNav = function (_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (<SafeNavigation {...props}>
    {children}
  </SafeNavigation>);
};
exports.SafeMobileNav = SafeMobileNav;
