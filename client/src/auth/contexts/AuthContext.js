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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthContext = exports.AuthProvider = void 0;
var react_1 = require("react");
var initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};
var authReducer = function (state, action) {
    switch (action.type) {
        case 'AUTH_START':
            return __assign(__assign({}, state), { isLoading: true, error: null });
        case 'AUTH_SUCCESS':
            return __assign(__assign({}, state), { user: action.payload, isAuthenticated: true, isLoading: false, error: null });
        case 'AUTH_FAILURE':
            return __assign(__assign({}, state), { user: null, isAuthenticated: false, isLoading: false, error: action.payload });
        case 'AUTH_LOGOUT':
            return __assign(__assign({}, state), { user: null, isAuthenticated: false, isLoading: false, error: null });
        case 'CLEAR_ERROR':
            return __assign(__assign({}, state), { error: null });
        case 'SET_LOADING':
            return __assign(__assign({}, state), { isLoading: action.payload });
        default:
            return state;
    }
};
var AuthContext = (0, react_1.createContext)(undefined);
var AuthProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useReducer)(authReducer, initialState), state = _b[0], dispatch = _b[1];
    // Check for existing session on mount
    (0, react_1.useEffect)(function () {
        var checkAuthStatus = function () { return __awaiter(void 0, void 0, void 0, function () {
            var token, response, user, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        token = localStorage.getItem('authToken');
                        if (!token) return [3 /*break*/, 5];
                        return [4 /*yield*/, fetch('/api/auth/validate', {
                                headers: {
                                    'Authorization': "Bearer ".concat(token),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        user = _a.sent();
                        dispatch({ type: 'AUTH_SUCCESS', payload: user });
                        return [3 /*break*/, 4];
                    case 3:
                        localStorage.removeItem('authToken');
                        dispatch({ type: 'SET_LOADING', payload: false });
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        dispatch({ type: 'SET_LOADING', payload: false });
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error('Auth check failed:', error_1);
                        localStorage.removeItem('authToken');
                        dispatch({ type: 'SET_LOADING', payload: false });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        checkAuthStatus();
    }, []);
    var login = function (email, password) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, _a, user, token, error_2, message;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dispatch({ type: 'AUTH_START' });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch('/api/auth/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email: email, password: password }),
                        })];
                case 2:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _b.sent();
                    throw new Error(errorData.message || 'Login failed');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    _a = _b.sent(), user = _a.user, token = _a.token;
                    localStorage.setItem('authToken', token);
                    dispatch({ type: 'AUTH_SUCCESS', payload: user });
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _b.sent();
                    message = error_2 instanceof Error ? error_2.message : 'Login failed';
                    dispatch({ type: 'AUTH_FAILURE', payload: message });
                    throw error_2;
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var register = function (userData) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, _a, user, token, error_3, message;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dispatch({ type: 'AUTH_START' });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch('/api/auth/register', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(userData),
                        })];
                case 2:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _b.sent();
                    throw new Error(errorData.message || 'Registration failed');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    _a = _b.sent(), user = _a.user, token = _a.token;
                    localStorage.setItem('authToken', token);
                    dispatch({ type: 'AUTH_SUCCESS', payload: user });
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _b.sent();
                    message = error_3 instanceof Error ? error_3.message : 'Registration failed';
                    dispatch({ type: 'AUTH_FAILURE', payload: message });
                    throw error_3;
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var logout = function () {
        localStorage.removeItem('authToken');
        dispatch({ type: 'AUTH_LOGOUT' });
    };
    var clearError = function () {
        dispatch({ type: 'CLEAR_ERROR' });
    };
    var value = __assign(__assign({}, state), { login: login, register: register, logout: logout, clearError: clearError });
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
exports.AuthProvider = AuthProvider;
var useAuthContext = function () {
    var context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
exports.useAuthContext = useAuthContext;
