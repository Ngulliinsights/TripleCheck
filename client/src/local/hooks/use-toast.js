"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.reducer = void 0;
exports.useToast = useToast;
exports.toast = toast;
var React = require("react");
var TOAST_LIMIT = 1;
var TOAST_REMOVE_DELAY = 1000000;
var actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST",
};
var count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
var toastTimeouts = new Map();
var addToRemoveQueue = function (toastId) {
    if (toastTimeouts.has(toastId)) {
        return;
    }
    var timeout = setTimeout(function () {
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId,
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
var clearToastTimeout = function (toastId) {
    var timeout = toastTimeouts.get(toastId);
    if (timeout) {
        clearTimeout(timeout);
        toastTimeouts.delete(toastId);
    }
};
var reducer = function (state, action) {
    switch (action.type) {
        case "ADD_TOAST":
            return __assign(__assign({}, state), { toasts: __spreadArray([action.toast], state.toasts, true).slice(0, TOAST_LIMIT) });
        case "UPDATE_TOAST":
            return __assign(__assign({}, state), { toasts: state.toasts.map(function (t) {
                    return t.id === action.toast.id ? __assign(__assign({}, t), action.toast) : t;
                }) });
        case "DISMISS_TOAST": {
            var toastId_1 = action.toastId;
            if (toastId_1) {
                addToRemoveQueue(toastId_1);
            }
            else {
                state.toasts.forEach(function (toast) {
                    addToRemoveQueue(toast.id);
                });
            }
            return __assign(__assign({}, state), { toasts: state.toasts.map(function (t) {
                    return t.id === toastId_1 || toastId_1 === undefined
                        ? __assign(__assign({}, t), { open: false }) : t;
                }) });
        }
        case "REMOVE_TOAST": {
            if (action.toastId === undefined) {
                // Clear all timeouts when removing all toasts
                toastTimeouts.forEach(function (timeout) { return clearTimeout(timeout); });
                toastTimeouts.clear();
                return __assign(__assign({}, state), { toasts: [] });
            }
            // Clear specific timeout when removing individual toast
            clearToastTimeout(action.toastId);
            return __assign(__assign({}, state), { toasts: state.toasts.filter(function (t) { return t.id !== action.toastId; }) });
        }
        default:
            return state;
    }
};
exports.reducer = reducer;
var listeners = [];
var memoryState = { toasts: [] };
function dispatch(action) {
    memoryState = (0, exports.reducer)(memoryState, action);
    listeners.forEach(function (listener) {
        listener(memoryState);
    });
}
function toast(props) {
    var id = genId();
    var update = function (updateProps) {
        return dispatch({
            type: "UPDATE_TOAST",
            toast: __assign(__assign({}, updateProps), { id: id }),
        });
    };
    var dismiss = function () { return dispatch({
        type: "DISMISS_TOAST",
        toastId: id
    }); };
    dispatch({
        type: "ADD_TOAST",
        toast: __assign(__assign({}, props), { id: id, open: true, onOpenChange: function (open) {
                if (!open)
                    dismiss();
            } }),
    });
    return {
        id: id,
        dismiss: dismiss,
        update: update,
    };
}
function useToast() {
    var _a = React.useState(memoryState), state = _a[0], setState = _a[1];
    React.useEffect(function () {
        listeners.push(setState);
        return function () {
            var index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []); // Removed state dependency to prevent unnecessary re-runs
    var dismiss = React.useCallback(function (toastId) {
        dispatch(__assign({ type: "DISMISS_TOAST" }, (toastId && { toastId: toastId })));
    }, []);
    return __assign(__assign({}, state), { toast: toast, dismiss: dismiss });
}
// Cleanup function for when the module is unloaded
var cleanup = function () {
    toastTimeouts.forEach(function (timeout) { return clearTimeout(timeout); });
    toastTimeouts.clear();
    listeners.length = 0;
    memoryState = { toasts: [] };
};
exports.cleanup = cleanup;
