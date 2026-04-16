"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebouncedCallback = useDebouncedCallback;
var react_1 = require("react");
/**
 * Creates a debounced version of a callback function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */
function useDebouncedCallback(callback, delay) {
    var timeoutRef = (0, react_1.useRef)();
    return (0, react_1.useCallback)((function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(function () {
            callback.apply(void 0, args);
        }, delay);
    }), [callback, delay]);
}
