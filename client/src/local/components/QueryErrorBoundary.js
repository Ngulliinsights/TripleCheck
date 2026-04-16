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
exports.QueryErrorBoundary = QueryErrorBoundary;
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
function QueryErrorFallback(_a) {
    var error = _a.error, resetErrorBoundary = _a.resetErrorBoundary;
    return (<card_1.Card className="max-w-md mx-auto mt-8">
      <card_1.CardHeader>
        <card_1.CardTitle className="flex items-center gap-2 text-red-600">
          <lucide_react_1.AlertTriangle className="w-5 h-5"/>
          Something went wrong
        </card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred while loading data."}
        </p>
        <div className="flex gap-2">
          <button_1.Button onClick={resetErrorBoundary} className="flex items-center gap-2">
            <lucide_react_1.RefreshCw className="w-4 h-4"/>
            Try again
          </button_1.Button>
          <button_1.Button variant="outline" onClick={function () { return window.location.reload(); }}>
            Reload page
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
/**
 * Custom Error Boundary that works with React Query
 * Provides customizable fallback UI and reset functionality
 */
var QueryErrorBoundaryClass = /** @class */ (function (_super) {
    __extends(QueryErrorBoundaryClass, _super);
    function QueryErrorBoundaryClass(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { hasError: false };
        return _this;
    }
    QueryErrorBoundaryClass.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    QueryErrorBoundaryClass.prototype.componentDidCatch = function (error, errorInfo) {
        // eslint-disable-next-line no-console
        console.error('Query Error Boundary caught an error:', error, errorInfo);
    };
    QueryErrorBoundaryClass.prototype.componentDidUpdate = function (prevProps) {
        var resetErrorBoundary = this.props.resetErrorBoundary;
        var hasError = this.state.hasError;
        if (hasError && prevProps.resetErrorBoundary !== resetErrorBoundary) {
            this.setState({ hasError: false });
        }
    };
    QueryErrorBoundaryClass.prototype.render = function () {
        var _a = this.state, hasError = _a.hasError, error = _a.error;
        var _b = this.props, children = _b.children, _c = _b.fallback, Fallback = _c === void 0 ? QueryErrorFallback : _c, resetErrorBoundary = _b.resetErrorBoundary;
        if (hasError && error) {
            return <Fallback error={error} resetErrorBoundary={resetErrorBoundary}/>;
        }
        return children;
    };
    return QueryErrorBoundaryClass;
}(react_1.Component));
/**
 * Error boundary specifically designed for React Query errors
 * Prevents race conditions and provides graceful error handling
 */
function QueryErrorBoundary(_a) {
    var children = _a.children, fallback = _a.fallback;
    return (<react_query_1.QueryErrorResetBoundary>
      {function (_a) {
            var reset = _a.reset;
            return (<QueryErrorBoundaryClass fallback={fallback} resetErrorBoundary={reset}>
          {children}
        </QueryErrorBoundaryClass>);
        }}
    </react_query_1.QueryErrorResetBoundary>);
}
