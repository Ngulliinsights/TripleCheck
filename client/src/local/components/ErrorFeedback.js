"use strict";
/**
 * Error Feedback Components
 * User-friendly error messages and recovery actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorDetails = exports.FormError = exports.ApiError = exports.NetworkError = exports.ErrorMessage = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("./ui/button");
var alert_1 = require("./ui/alert");
var card_1 = require("./ui/card");
var badge_1 = require("./ui/badge");
// ============================================================================
// Constants
// ============================================================================
var TYPE_STYLES = {
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
};
var ICON_COLORS = {
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
};
// ============================================================================
// Error Message Component
// ============================================================================
exports.ErrorMessage = react_1.default.memo(function (_a) {
    var title = _a.title, message = _a.message, _b = _a.type, type = _b === void 0 ? "error" : _b, _c = _a.actions, actions = _c === void 0 ? [] : _c, _d = _a.className, className = _d === void 0 ? "" : _d;
    return (<alert_1.Alert className={"".concat(TYPE_STYLES[type], " ").concat(className)}>
        <lucide_react_1.AlertTriangle className={"h-4 w-4 ".concat(ICON_COLORS[type])}/>
        <alert_1.AlertDescription>
          <div className="flex flex-col gap-2">
            {title && <p className="font-medium">{title}</p>}
            <p>{message}</p>
            {actions.length > 0 && (<div className="flex gap-2 mt-2">
                {actions.map(function (action, index) { return (<button_1.Button key={index} size="sm" onClick={action.onClick} className="h-auto py-1 px-2" {...(action.variant && { "data-variant": action.variant })}>
                    {action.label}
                  </button_1.Button>); })}
              </div>)}
          </div>
        </alert_1.AlertDescription>
      </alert_1.Alert>);
});
exports.ErrorMessage.displayName = "ErrorMessage";
// ============================================================================
// Network Error Component
// ============================================================================
exports.NetworkError = react_1.default.memo(function (_a) {
    var isOnline = _a.isOnline, onRetry = _a.onRetry, _b = _a.className, className = _b === void 0 ? "" : _b;
    if (isOnline)
        return null;
    var actions = react_1.default.useMemo(function () { return (onRetry ? [{ label: "Retry", onClick: onRetry }] : []); }, [onRetry]);
    return (<exports.ErrorMessage title="Connection Lost" message="You're currently offline. Please check your internet connection." type="warning" actions={actions} className={className}/>);
});
exports.NetworkError.displayName = "NetworkError";
// ============================================================================
// API Error Component
// ============================================================================
var getErrorMessage = function (error) {
    var _a, _b, _c;
    if (typeof error === "object" && error !== null) {
        var err = error;
        if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            return "The requested resource was not found.";
        }
        if (((_b = err.response) === null || _b === void 0 ? void 0 : _b.status) === 500) {
            return "Server error. Please try again later.";
        }
        if (((_c = err.response) === null || _c === void 0 ? void 0 : _c.status) === 403) {
            return "You don't have permission to access this resource.";
        }
        if (err.message) {
            return err.message;
        }
    }
    return "An unexpected error occurred.";
};
exports.ApiError = react_1.default.memo(function (_a) {
    var error = _a.error, onRetry = _a.onRetry, onGoHome = _a.onGoHome, _b = _a.className, className = _b === void 0 ? "" : _b;
    var actions = react_1.default.useMemo(function () {
        var actionList = [];
        if (onRetry) {
            actionList.push({ label: "Try Again", onClick: onRetry });
        }
        if (onGoHome) {
            actionList.push({
                label: "Go Home",
                onClick: onGoHome,
                variant: "outline",
            });
        }
        return actionList;
    }, [onRetry, onGoHome]);
    var errorMessage = react_1.default.useMemo(function () { return getErrorMessage(error); }, [error]);
    return (<exports.ErrorMessage title="Request Failed" message={errorMessage} type="error" actions={actions} className={className}/>);
});
exports.ApiError.displayName = "ApiError";
// ============================================================================
// Form Error Component
// ============================================================================
exports.FormError = react_1.default.memo(function (_a) {
    var errors = _a.errors, generalError = _a.generalError, onClear = _a.onClear, _b = _a.className, className = _b === void 0 ? "" : _b;
    var hasErrors = Object.keys(errors).length > 0 || generalError;
    var clearAction = react_1.default.useMemo(function () { return (onClear ? [{ label: "Clear", onClick: onClear }] : []); }, [onClear]);
    if (!hasErrors)
        return null;
    return (<div className={"space-y-2 ".concat(className)}>
        {generalError && (<exports.ErrorMessage message={generalError} type="error" actions={clearAction}/>)}
        {Object.entries(errors).map(function (_a) {
            var field = _a[0], message = _a[1];
            return (<exports.ErrorMessage key={field} title={"".concat(field.charAt(0).toUpperCase() + field.slice(1), " Error")} message={message} type="error"/>);
        })}
      </div>);
});
exports.FormError.displayName = "FormError";
// ============================================================================
// Error Details Component
// ============================================================================
exports.ErrorDetails = react_1.default.memo(function (_a) {
    var error = _a.error, errorId = _a.errorId, _b = _a.showDetails, showDetails = _b === void 0 ? false : _b, onCopyDetails = _a.onCopyDetails, _c = _a.className, className = _c === void 0 ? "" : _c;
    var _d = react_1.default.useState(false), copied = _d[0], setCopied = _d[1];
    var handleCopy = react_1.default.useCallback(function () {
        var details = {
            message: error.message,
            stack: error.stack,
            errorId: errorId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
        };
        navigator.clipboard
            .writeText(JSON.stringify(details, null, 2))
            .then(function () {
            setCopied(true);
            setTimeout(function () { return setCopied(false); }, 2000);
            onCopyDetails === null || onCopyDetails === void 0 ? void 0 : onCopyDetails();
        })
            .catch(function (err) {
            console.error("Failed to copy error details:", err);
        });
    }, [error, errorId, onCopyDetails]);
    var currentTime = react_1.default.useMemo(function () { return new Date().toLocaleString(); }, [showDetails]);
    if (!showDetails)
        return null;
    return (<card_1.Card className={"border-red-200 ".concat(className)}>
        <card_1.CardHeader className="pb-2">
          <card_1.CardTitle className="text-sm text-red-800 flex items-center justify-between">
            Error Details
            <button_1.Button size="sm" onClick={handleCopy} className="h-auto p-1" aria-label={copied ? "Copied to clipboard" : "Copy error details"}>
              {copied ? (<lucide_react_1.Check className="h-3 w-3" aria-hidden="true"/>) : (<lucide_react_1.Copy className="h-3 w-3" aria-hidden="true"/>)}
            </button_1.Button>
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium">Message:</span>
              <p className="text-gray-600 mt-1 break-words">{error.message}</p>
            </div>
            {errorId && (<div>
                <span className="font-medium">Error ID:</span>
                <badge_1.Badge className="ml-2 text-xs border border-gray-300">
                  {errorId}
                </badge_1.Badge>
              </div>)}
            <div>
              <span className="font-medium">Time:</span>
              <p className="text-gray-600 mt-1">{currentTime}</p>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
});
exports.ErrorDetails.displayName = "ErrorDetails";
