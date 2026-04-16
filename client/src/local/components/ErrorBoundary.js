"use strict";
/**
 * Error Boundary Components
 * Comprehensive error handling with fallback UI and recovery mechanisms
 */
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
exports.useErrorHandler = exports.GlobalErrorBoundary = exports.PageErrorBoundary = exports.ComponentErrorBoundary = exports.ErrorBoundary = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
var alert_1 = require("./ui/alert");
/**
 * Base Error Boundary Component
 */
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.logError = function (error, errorInfo) {
            var errorData = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                errorId: _this.state.errorId,
                level: _this.props.level || 'component',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            // In production, send to monitoring service
            if (process.env.NODE_ENV === 'production') {
                // Example: Send to Sentry, LogRocket, etc.
                console.error('Error Boundary caught an error:', errorData);
            }
            else {
                console.error('Error Boundary caught an error:', errorData);
            }
        };
        _this.handleRetry = function () {
            _this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                errorId: ''
            });
        };
        _this.handleReload = function () {
            window.location.reload();
        };
        _this.handleGoHome = function () {
            window.location.href = '/';
        };
        _this.handleReportError = function () {
            var _a, _b, _c;
            var errorReport = {
                errorId: _this.state.errorId,
                message: (_a = _this.state.error) === null || _a === void 0 ? void 0 : _a.message,
                stack: (_b = _this.state.error) === null || _b === void 0 ? void 0 : _b.stack,
                componentStack: (_c = _this.state.errorInfo) === null || _c === void 0 ? void 0 : _c.componentStack,
                timestamp: new Date().toISOString()
            };
            // Create mailto link with error details
            var subject = encodeURIComponent("Error Report - ".concat(_this.state.errorId));
            var body = encodeURIComponent("\nError Details:\n".concat(JSON.stringify(errorReport, null, 2), "\n\nPlease describe what you were doing when this error occurred:\n[Your description here]\n    "));
            window.open("mailto:support@example.com?subject=".concat(subject, "&body=").concat(body));
        };
        _this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: ''
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        return {
            hasError: true,
            error: error,
            errorId: "error_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9))
        };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        var _a, _b;
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        // Log error to monitoring service
        this.logError(error, errorInfo);
        // Call custom error handler
        (_b = (_a = this.props).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, errorInfo);
    };
    ErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default fallback UI based on error level
            return this.renderErrorFallback();
        }
        return this.props.children;
    };
    ErrorBoundary.prototype.renderErrorFallback = function () {
        var _a = this.props, _b = _a.level, level = _b === void 0 ? 'component' : _b, _c = _a.showDetails, showDetails = _c === void 0 ? false : _c;
        var _d = this.state, error = _d.error, errorId = _d.errorId;
        if (level === 'component') {
            return (<alert_1.Alert className="border-red-200 bg-red-50">
          <lucide_react_1.AlertTriangle className="h-4 w-4 text-red-600"/>
          <alert_1.AlertDescription className="text-red-800">
            Something went wrong with this component.
            <button_1.Button variant="ghost" size="sm" onClick={this.handleRetry} className="ml-2 h-auto p-1 text-red-600 hover:text-red-800">
              <lucide_react_1.RefreshCw className="h-3 w-3 mr-1"/>
              Try again
            </button_1.Button>
          </alert_1.AlertDescription>
        </alert_1.Alert>);
        }
        if (level === 'page') {
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <card_1.Card className="w-full max-w-md">
            <card_1.CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <lucide_react_1.AlertTriangle className="h-6 w-6 text-red-600"/>
              </div>
              <card_1.CardTitle className="text-red-800">Page Error</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                This page encountered an error and couldn't load properly.
              </p>
              
              {showDetails && error && (<div className="bg-gray-100 p-3 rounded text-sm">
                  <p className="font-medium text-gray-800">Error Details:</p>
                  <p className="text-gray-600 mt-1">{error.message}</p>
                  <p className="text-xs text-gray-500 mt-2">Error ID: {errorId}</p>
                </div>)}

              <div className="flex flex-col gap-2">
                <button_1.Button onClick={this.handleRetry} className="w-full">
                  <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
                  Try Again
                </button_1.Button>
                <button_1.Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <lucide_react_1.Home className="h-4 w-4 mr-2"/>
                  Go Home
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>);
        }
        // Global level error
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <card_1.Card className="w-full max-w-lg">
          <card_1.CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <lucide_react_1.Bug className="h-8 w-8 text-red-600"/>
            </div>
            <card_1.CardTitle className="text-xl text-red-800">Application Error</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              The application encountered an unexpected error. We apologize for the inconvenience.
            </p>
            
            {showDetails && error && (<div className="bg-gray-100 p-4 rounded text-sm">
                <p className="font-medium text-gray-800">Technical Details:</p>
                <p className="text-gray-600 mt-1">{error.message}</p>
                <p className="text-xs text-gray-500 mt-2">Error ID: {errorId}</p>
              </div>)}

            <div className="flex flex-col gap-2">
              <button_1.Button onClick={this.handleReload} className="w-full">
                <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
                Reload Application
              </button_1.Button>
              <button_1.Button onClick={this.handleGoHome} variant="outline" className="w-full">
                <lucide_react_1.Home className="h-4 w-4 mr-2"/>
                Go to Homepage
              </button_1.Button>
              <button_1.Button onClick={this.handleReportError} variant="ghost" className="w-full">
                <lucide_react_1.Mail className="h-4 w-4 mr-2"/>
                Report This Error
              </button_1.Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              If this problem persists, please contact support with Error ID: {errorId}
            </p>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    };
    return ErrorBoundary;
}(react_1.Component));
exports.ErrorBoundary = ErrorBoundary;
/**
 * Component-level Error Boundary
 */
var ComponentErrorBoundary = function (props) { return (<ErrorBoundary {...props} level="component"/>); };
exports.ComponentErrorBoundary = ComponentErrorBoundary;
/**
 * Page-level Error Boundary
 */
var PageErrorBoundary = function (props) { return (<ErrorBoundary {...props} level="page" showDetails={process.env.NODE_ENV === 'development'}/>); };
exports.PageErrorBoundary = PageErrorBoundary;
/**
 * Global Error Boundary
 */
var GlobalErrorBoundary = function (props) { return (<ErrorBoundary {...props} level="global" showDetails={process.env.NODE_ENV === 'development'}/>); };
exports.GlobalErrorBoundary = GlobalErrorBoundary;
/**
 * Hook for programmatic error handling
 */
var useErrorHandler = function () {
    var handleError = react_1.default.useCallback(function (error, context) {
        var errorData = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error handled:', errorData);
        }
        // Send to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error tracking service
            console.error('Production error:', errorData);
        }
    }, []);
    return { handleError: handleError };
};
exports.useErrorHandler = useErrorHandler;
