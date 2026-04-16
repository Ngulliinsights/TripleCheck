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
exports.useTrustContext = exports.TrustProvider = void 0;
var react_1 = require("react");
var initialState = {
    trustScore: null,
    fraudAlerts: [],
    verificationStatus: {},
    isLoading: false,
    error: null,
};
var trustReducer = function (state, action) {
    var _a;
    switch (action.type) {
        case 'UPDATE_TRUST_SCORE':
            return __assign(__assign({}, state), { trustScore: action.payload, isLoading: false, error: null });
        case 'ADD_FRAUD_ALERT':
            return __assign(__assign({}, state), { fraudAlerts: __spreadArray(__spreadArray([], state.fraudAlerts, true), [action.payload], false) });
        case 'RESOLVE_FRAUD_ALERT':
            return __assign(__assign({}, state), { fraudAlerts: state.fraudAlerts.map(function (alert) {
                    return alert.id === action.payload
                        ? __assign(__assign({}, alert), { resolved: true }) : alert;
                }) });
        case 'UPDATE_VERIFICATION_STATUS':
            return __assign(__assign({}, state), { verificationStatus: __assign(__assign({}, state.verificationStatus), (_a = {}, _a[action.payload.propertyId] = action.payload.status, _a)) });
        case 'SET_LOADING':
            return __assign(__assign({}, state), { isLoading: action.payload });
        case 'SET_ERROR':
            return __assign(__assign({}, state), { error: action.payload, isLoading: false });
        case 'CLEAR_ERROR':
            return __assign(__assign({}, state), { error: null });
        default:
            return state;
    }
};
var TrustContext = (0, react_1.createContext)(undefined);
var TrustProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useReducer)(trustReducer, initialState), state = _b[0], dispatch = _b[1];
    var updateTrustScore = function (score) {
        dispatch({ type: 'UPDATE_TRUST_SCORE', payload: score });
    };
    var addFraudAlert = function (alert) {
        dispatch({ type: 'ADD_FRAUD_ALERT', payload: alert });
    };
    var resolveFraudAlert = function (alertId) {
        dispatch({ type: 'RESOLVE_FRAUD_ALERT', payload: alertId });
    };
    var updateVerificationStatus = function (propertyId, status) {
        dispatch({
            type: 'UPDATE_VERIFICATION_STATUS',
            payload: { propertyId: propertyId, status: status }
        });
    };
    var setLoading = function (loading) {
        dispatch({ type: 'SET_LOADING', payload: loading });
    };
    var setError = function (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
    };
    var clearError = function () {
        dispatch({ type: 'CLEAR_ERROR' });
    };
    var value = __assign(__assign({}, state), { updateTrustScore: updateTrustScore, addFraudAlert: addFraudAlert, resolveFraudAlert: resolveFraudAlert, updateVerificationStatus: updateVerificationStatus, setLoading: setLoading, setError: setError, clearError: clearError });
    return (<TrustContext.Provider value={value}>
      {children}
    </TrustContext.Provider>);
};
exports.TrustProvider = TrustProvider;
var useTrustContext = function () {
    var context = (0, react_1.useContext)(TrustContext);
    if (context === undefined) {
        throw new Error('useTrustContext must be used within a TrustProvider');
    }
    return context;
};
exports.useTrustContext = useTrustContext;
