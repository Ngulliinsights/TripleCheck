"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSafeState = useSafeState;
var react_1 = require("react");
/**
 * Safe state hook that prevents state updates after component unmount
 * to avoid memory leaks and React warnings
 */
function useSafeState(initialState) {
    var _a = (0, react_1.useState)(initialState), state = _a[0], setState = _a[1];
    var isMountedRef = (0, react_1.useRef)(true);
    // Safe setState that only updates if component is mounted
    var safeSetState = (0, react_1.useCallback)(function (value) {
        if (isMountedRef.current) {
            setState(value);
        }
    }, []);
    // Set up cleanup effect
    (0, react_1.useEffect)(function () {
        return function () {
            isMountedRef.current = false;
        };
    }, []);
    return [state, safeSetState];
}
