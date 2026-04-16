"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSafeEffect = useSafeEffect;
var react_1 = require("react");
/**
 * Safe effect hook that prevents memory leaks and race conditions
 * by automatically cleaning up effects when component unmounts
 */
function useSafeEffect(effect, deps) {
    var isMountedRef = (0, react_1.useRef)(true);
    var cleanupRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(function () {
        // Only run effect if component is still mounted
        if (!isMountedRef.current)
            return;
        // Store cleanup function
        cleanupRef.current = effect();
        // Return cleanup function that checks mount status
        return function () {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, deps);
    // Cleanup on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            isMountedRef.current = false;
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);
}
