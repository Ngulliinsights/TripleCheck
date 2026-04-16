"use strict";
/**
 * Unified Error Handling Hook for Compare Components
 *
 * Provides consistent error handling across all comparison functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCompareError = useCompareError;
var react_1 = require("react");
function useCompareError() {
    var _a = (0, react_1.useState)(null), error = _a[0], setError = _a[1];
    var clearError = (0, react_1.useCallback)(function () {
        setError(null);
    }, []);
    var handleError = (0, react_1.useCallback)(function (error, context) {
        var errorMessage = error instanceof Error ? error.message : String(error);
        setError({
            message: errorMessage,
            context: context,
            timestamp: new Date(),
            originalError: error,
        });
        // Log error for debugging
        console.error("Compare Error".concat(context ? " (".concat(context, ")") : '', ":"), error);
    }, []);
    return {
        error: error,
        setError: setError,
        clearError: clearError,
        handleError: handleError,
    };
}
