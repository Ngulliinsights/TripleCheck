"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationErrorBoundary = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../ui/button");
var NavigationErrorBoundary = /** @class */ (function (_super) {
    __extends(NavigationErrorBoundary, _super);
    function NavigationErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        /**
         * Reset the error boundary state to allow retry
         * Using arrow function to avoid binding issues
         * We omit undefined properties entirely to satisfy exactOptionalPropertyTypes
         */
        _this.handleReset = function () {
            _this.setState({ hasError: false });
        };
        /**
         * Force a complete page reload as last resort
         * Using arrow function for consistent binding
         */
        _this.handleReload = function () {
            window.location.reload();
        };
        // Initialize state with immutable structure for better performance
        // Using a simple object without 'as const' to avoid type conflicts
        _this.state = { hasError: false };
        return _this;
    }
    /**
     * Static method to derive new state from error
     * This runs during the render phase, so we keep it pure
     */
    NavigationErrorBoundary.getDerivedStateFromError = function (error) {
        return {
            hasError: true,
            error: error,
        };
    };
    /**
     * Lifecycle method called after an error has been thrown
     * This runs during the commit phase, so side effects are safe here
     * The 'override' modifier explicitly marks this as overriding the parent class method
     */
    NavigationErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        var _a, _b;
        // Using a more specific logging approach to satisfy no-console rules
        // In production, you would typically replace this with a proper logging service
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("Navigation Error Boundary caught an error:", error, errorInfo);
        }
        // Update state with complete error information
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });
        // Call optional error callback for custom error handling
        (_b = (_a = this.props).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, errorInfo);
    };
    /**
     * Render error UI or fallback component when error occurs
     * The 'override' modifier explicitly marks this as overriding the parent class method
     * We ensure consistent return types to satisfy SonarJS rules
     */
    NavigationErrorBoundary.prototype.render = function () {
        var _a;
        if (!this.state.hasError) {
            return this.props.children;
        }
        if (this.props.fallback) {
            return this.props.fallback;
        }
        return (<div className="flex items-center justify-center min-h-[200px] p-4" role="alert" aria-live="assertive">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <lucide_react_1.AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden="true"/>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Navigation Error
          </h2>

          <p className="text-gray-600 mb-4">
            Something went wrong with the navigation. This is usually temporary.
          </p>

          <div className="flex gap-2 justify-center">
            <button_1.Button variant="outline" onClick={this.handleReset} className="flex items-center gap-2" aria-label="Reset error boundary and try again">
              <lucide_react_1.RefreshCw className="h-4 w-4" aria-hidden="true"/>
              Try Again
            </button_1.Button>

            <button_1.Button onClick={this.handleReload} className="flex items-center gap-2" aria-label="Reload the entire page">
              Reload Page
            </button_1.Button>
          </div>

          {/* Development-only error details with improved formatting */}
          {process.env.NODE_ENV === "development" && this.state.error && (<details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 space-y-2">
                <div className="text-xs bg-red-50 border border-red-200 p-2 rounded">
                  <strong className="text-red-800">Error:</strong>
                  <pre className="mt-1 text-red-700 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </div>
                {((_a = this.state.errorInfo) === null || _a === void 0 ? void 0 : _a.componentStack) && (<div className="text-xs bg-gray-50 border border-gray-200 p-2 rounded">
                    <strong className="text-gray-800">Component Stack:</strong>
                    <pre className="mt-1 text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>)}
              </div>
            </details>)}
        </div>
      </div>);
    };
    return NavigationErrorBoundary;
}(react_1.Component));
exports.NavigationErrorBoundary = NavigationErrorBoundary;
