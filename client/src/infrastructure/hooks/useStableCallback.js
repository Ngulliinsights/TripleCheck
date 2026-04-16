"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStableCallback = useStableCallback;
var react_1 = require("react");
/**
 * Stable callback hook that prevents unnecessary re-renders
 * by maintaining a stable reference while keeping the latest callback
 */
function useStableCallback(callback) {
    var callbackRef = (0, react_1.useRef)(callback);
    // Update the ref with the latest callback
    (0, react_1.useEffect)(function () {
        callbackRef.current = callback;
    }, [callback]);
    // Return a stable callback that calls the latest version
    return (0, react_1.useCallback)((function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return callbackRef.current.apply(callbackRef, args);
    }), []);
}
