"use strict";
/**
 * Loading States and Indicators
 * Comprehensive loading UI components for different scenarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoadingState = exports.TimeoutError = exports.PageLoading = exports.AsyncOperationStatus = exports.NetworkStatus = exports.LoadingCard = exports.Skeleton = exports.LoadingOverlay = exports.LoadingSpinner = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var card_1 = require("./ui/card");
var button_1 = require("./ui/button");
var alert_1 = require("./ui/alert");
var progress_1 = require("./ui/progress");
var LoadingSpinner = function (_a) {
    var _b = _a.size, size = _b === void 0 ? 'md' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    return (<lucide_react_1.Loader2 className={"animate-spin ".concat(sizeClasses[size], " ").concat(className)}/>);
};
exports.LoadingSpinner = LoadingSpinner;
var LoadingOverlay = function (_a) {
    var isLoading = _a.isLoading, children = _a.children, _b = _a.message, message = _b === void 0 ? 'Loading...' : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    return (<div className={"relative ".concat(className)}>
      {children}
      {isLoading && (<div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <exports.LoadingSpinner size="lg"/>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>)}
    </div>);
};
exports.LoadingOverlay = LoadingOverlay;
var Skeleton = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.variant, variant = _c === void 0 ? 'text' : _c, width = _a.width, height = _a.height;
    var baseClasses = 'animate-pulse bg-gray-200';
    var variantClasses = {
        text: 'h-4 rounded',
        rectangular: 'rounded',
        circular: 'rounded-full'
    };
    var style = {};
    if (width)
        style.width = typeof width === 'number' ? "".concat(width, "px") : width;
    if (height)
        style.height = typeof height === 'number' ? "".concat(height, "px") : height;
    return (<div className={"".concat(baseClasses, " ").concat(variantClasses[variant], " ").concat(className)} style={style}/>);
};
exports.Skeleton = Skeleton;
var LoadingCard = function (_a) {
    var _b = _a.title, title = _b === void 0 ? 'Loading' : _b, _c = _a.description, description = _c === void 0 ? 'Please wait while we load your content...' : _c, _d = _a.showProgress, showProgress = _d === void 0 ? false : _d, _e = _a.progress, progress = _e === void 0 ? 0 : _e;
    return (<card_1.Card className="w-full max-w-md mx-auto">
      <card_1.CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <exports.LoadingSpinner size="lg"/>
          <div className="text-center">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          {showProgress && (<div className="w-full">
              <progress_1.Progress value={progress} className="w-full"/>
              <p className="text-xs text-gray-500 mt-1 text-center">{progress}% complete</p>
            </div>)}
        </div>
      </card_1.CardContent>
    </card_1.Card>);
};
exports.LoadingCard = LoadingCard;
var NetworkStatus = function (_a) {
    var isOnline = _a.isOnline, isConnected = _a.isConnected, onRetry = _a.onRetry, _b = _a.className, className = _b === void 0 ? '' : _b;
    if (isOnline && isConnected) {
        return null; // Don't show anything when everything is working
    }
    return (<alert_1.Alert className={"border-orange-200 bg-orange-50 ".concat(className)}>
      <div className="flex items-center gap-2">
        {isOnline ? (<lucide_react_1.Wifi className="h-4 w-4 text-orange-600"/>) : (<lucide_react_1.WifiOff className="h-4 w-4 text-red-600"/>)}
        <alert_1.AlertDescription className="flex-1">
          {!isOnline ? ('You are currently offline. Some features may not be available.') : !isConnected ? ('Connection issues detected. Trying to reconnect...') : null}
        </alert_1.AlertDescription>
        {onRetry && (<button_1.Button variant="ghost" size="sm" onClick={onRetry} className="h-auto p-1">
            Retry
          </button_1.Button>)}
      </div>
    </alert_1.Alert>);
};
exports.NetworkStatus = NetworkStatus;
var AsyncOperationStatus = function (_a) {
    var status = _a.status, error = _a.error, _b = _a.successMessage, successMessage = _b === void 0 ? 'Operation completed successfully' : _b, _c = _a.loadingMessage, loadingMessage = _c === void 0 ? 'Processing...' : _c, onRetry = _a.onRetry, _d = _a.className, className = _d === void 0 ? '' : _d;
    if (status === 'idle') {
        return null;
    }
    if (status === 'loading') {
        return (<div className={"flex items-center gap-2 text-blue-600 ".concat(className)}>
        <exports.LoadingSpinner size="sm"/>
        <span className="text-sm">{loadingMessage}</span>
      </div>);
    }
    if (status === 'success') {
        return (<div className={"flex items-center gap-2 text-green-600 ".concat(className)}>
        <lucide_react_1.CheckCircle className="h-4 w-4"/>
        <span className="text-sm">{successMessage}</span>
      </div>);
    }
    if (status === 'error') {
        return (<alert_1.Alert className={"border-red-200 bg-red-50 ".concat(className)}>
        <lucide_react_1.AlertCircle className="h-4 w-4 text-red-600"/>
        <alert_1.AlertDescription className="text-red-800 flex items-center justify-between">
          <span>{error || 'An error occurred'}</span>
          {onRetry && (<button_1.Button variant="ghost" size="sm" onClick={onRetry} className="h-auto p-1 text-red-600 hover:text-red-800">
              Try Again
            </button_1.Button>)}
        </alert_1.AlertDescription>
      </alert_1.Alert>);
    }
    return null;
};
exports.AsyncOperationStatus = AsyncOperationStatus;
var PageLoading = function (_a) {
    var _b = _a.message, message = _b === void 0 ? 'Loading page...' : _b, _c = _a.showSkeleton, showSkeleton = _c === void 0 ? false : _c;
    if (showSkeleton) {
        return (<div className="space-y-4 p-6">
        <exports.Skeleton className="h-8 w-1/3"/>
        <div className="space-y-2">
          <exports.Skeleton className="h-4 w-full"/>
          <exports.Skeleton className="h-4 w-5/6"/>
          <exports.Skeleton className="h-4 w-4/6"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map(function (_, i) { return (<card_1.Card key={i}>
              <card_1.CardContent className="p-4">
                <exports.Skeleton className="h-6 w-3/4 mb-2"/>
                <exports.Skeleton className="h-4 w-full mb-1"/>
                <exports.Skeleton className="h-4 w-2/3"/>
              </card_1.CardContent>
            </card_1.Card>); })}
        </div>
      </div>);
    }
    return (<div className="min-h-screen flex items-center justify-center">
      <exports.LoadingCard title="Loading" description={message}/>
    </div>);
};
exports.PageLoading = PageLoading;
var TimeoutError = function (_a) {
    var onRetry = _a.onRetry, _b = _a.timeout, timeout = _b === void 0 ? 30 : _b, _c = _a.message, message = _c === void 0 ? 'The request is taking longer than expected' : _c;
    return (<alert_1.Alert className="border-yellow-200 bg-yellow-50">
      <lucide_react_1.Clock className="h-4 w-4 text-yellow-600"/>
      <alert_1.AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{message}</p>
            <p className="text-sm mt-1">
              This usually takes less than {timeout} seconds.
            </p>
          </div>
          <button_1.Button variant="ghost" size="sm" onClick={onRetry} className="text-yellow-600 hover:text-yellow-800">
            Try Again
          </button_1.Button>
        </div>
      </alert_1.AlertDescription>
    </alert_1.Alert>);
};
exports.TimeoutError = TimeoutError;
/**
 * Hook for managing loading states
 */
var useLoadingState = function (initialState) {
    if (initialState === void 0) { initialState = false; }
    var _a = react_1.default.useState(initialState), isLoading = _a[0], setIsLoading = _a[1];
    var _b = react_1.default.useState(null), error = _b[0], setError = _b[1];
    var startLoading = react_1.default.useCallback(function () {
        setIsLoading(true);
        setError(null);
    }, []);
    var stopLoading = react_1.default.useCallback(function () {
        setIsLoading(false);
    }, []);
    var setLoadingError = react_1.default.useCallback(function (errorMessage) {
        setIsLoading(false);
        setError(errorMessage);
    }, []);
    var clearError = react_1.default.useCallback(function () {
        setError(null);
    }, []);
    return {
        isLoading: isLoading,
        error: error,
        startLoading: startLoading,
        stopLoading: stopLoading,
        setLoadingError: setLoadingError,
        clearError: clearError
    };
};
exports.useLoadingState = useLoadingState;
