"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.ServerError = exports.NetworkError = exports.ErrorState = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("./button");
var ERROR_CONFIGS = {
    network: {
        icon: lucide_react_1.Wifi,
        title: "Connection Error",
        message: "Please check your internet connection and try again.",
        retryLabel: "Try Again"
    },
    server: {
        icon: lucide_react_1.Server,
        title: "Server Error",
        message: "Our servers are experiencing issues. Please try again later.",
        retryLabel: "Retry"
    },
    timeout: {
        icon: lucide_react_1.RefreshCw,
        title: "Request Timeout",
        message: "The request took too long. Please try again.",
        retryLabel: "Try Again"
    },
    generic: {
        icon: lucide_react_1.AlertCircle,
        title: "Something went wrong",
        message: "An unexpected error occurred. Please try again.",
        retryLabel: "Try Again"
    }
};
exports.ErrorState = (0, react_1.memo)(function (_a) {
    var title = _a.title, message = _a.message, onRetry = _a.onRetry, retryLabel = _a.retryLabel, _b = _a.variant, variant = _b === void 0 ? "generic" : _b, _c = _a.isRetrying, isRetrying = _c === void 0 ? false : _c;
    var config = ERROR_CONFIGS[variant];
    var Icon = config.icon;
    return (<div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-red-500"/>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">
          {title || config.title}
        </h3>
        <p className="text-red-600 mb-4">
          {message || config.message}
        </p>
        {onRetry && (<button_1.Button onClick={onRetry} variant="coral-outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={isRetrying}>
            <lucide_react_1.RefreshCw className={"w-4 h-4 mr-2 ".concat(isRetrying ? 'animate-spin' : '')}/>
            {isRetrying ? 'Retrying...' : (retryLabel || config.retryLabel)}
          </button_1.Button>)}
      </div>
    </div>);
});
exports.ErrorState.displayName = "ErrorState";
// Specific error components for common use cases
exports.NetworkError = (0, react_1.memo)(function (_a) {
    var onRetry = _a.onRetry, isRetrying = _a.isRetrying;
    return (<exports.ErrorState variant="network" {...(onRetry && { onRetry: onRetry })} {...(isRetrying !== undefined && { isRetrying: isRetrying })}/>);
});
exports.ServerError = (0, react_1.memo)(function (_a) {
    var onRetry = _a.onRetry, isRetrying = _a.isRetrying;
    return (<exports.ErrorState variant="server" {...(onRetry && { onRetry: onRetry })} {...(isRetrying !== undefined && { isRetrying: isRetrying })}/>);
});
exports.TimeoutError = (0, react_1.memo)(function (_a) {
    var onRetry = _a.onRetry, isRetrying = _a.isRetrying;
    return (<exports.ErrorState variant="timeout" {...(onRetry && { onRetry: onRetry })} {...(isRetrying !== undefined && { isRetrying: isRetrying })}/>);
});
exports.NetworkError.displayName = "NetworkError";
exports.ServerError.displayName = "ServerError";
exports.TimeoutError.displayName = "TimeoutError";
