"use strict";
/**
 * Authentication Token Service
 * Manages JWT tokens, refresh logic, and secure storage
 */
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
exports.authTokenService = void 0;
var AuthTokenService = /** @class */ (function () {
    function AuthTokenService() {
        this.accessToken = null;
        this.refreshToken = null;
        this.refreshTimer = null;
        this.tokenCallbacks = new Map();
        this.loadTokensFromStorage();
        this.setupAutoRefresh();
    }
    AuthTokenService.getInstance = function () {
        if (!AuthTokenService.instance) {
            AuthTokenService.instance = new AuthTokenService();
        }
        return AuthTokenService.instance;
    };
    /**
     * Set authentication tokens
     */
    AuthTokenService.prototype.setTokens = function (tokenPair) {
        this.accessToken = tokenPair.accessToken;
        this.refreshToken = tokenPair.refreshToken;
        // Store in secure storage
        this.storeTokensSecurely(tokenPair);
        // Setup auto-refresh
        this.setupAutoRefresh();
        // Notify callbacks
        this.notifyTokenCallbacks(this.accessToken);
    };
    /**
     * Get current access token
     */
    AuthTokenService.prototype.getAccessToken = function () {
        if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
            return this.accessToken;
        }
        return null;
    };
    /**
     * Get refresh token
     */
    AuthTokenService.prototype.getRefreshToken = function () {
        return this.refreshToken;
    };
    /**
     * Clear all tokens
     */
    AuthTokenService.prototype.clearTokens = function () {
        this.accessToken = null;
        this.refreshToken = null;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.clearTokenStorage();
        this.notifyTokenCallbacks(null);
    };
    /**
     * Refresh access token
     */
    AuthTokenService.prototype.refreshAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, tokenPair, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.refreshToken) {
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch('/api/auth/refresh', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    refreshToken: this.refreshToken
                                })
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Token refresh failed');
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        tokenPair = _a.sent();
                        this.setTokens(tokenPair);
                        return [2 /*return*/, true];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Token refresh failed:', error_1);
                        this.clearTokens();
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if token is expired
     */
    AuthTokenService.prototype.isTokenExpired = function (token) {
        try {
            var payload = this.decodeToken(token);
            var currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        }
        catch (_a) {
            return true;
        }
    };
    /**
     * Decode JWT token
     */
    AuthTokenService.prototype.decodeToken = function (token) {
        var parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        var payload = parts[1];
        var decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    };
    /**
     * Get token payload
     */
    AuthTokenService.prototype.getTokenPayload = function () {
        var token = this.getAccessToken();
        if (!token)
            return null;
        try {
            return this.decodeToken(token);
        }
        catch (_a) {
            return null;
        }
    };
    /**
     * Check if user has permission
     */
    AuthTokenService.prototype.hasPermission = function (permission) {
        var payload = this.getTokenPayload();
        return (payload === null || payload === void 0 ? void 0 : payload.permissions.includes(permission)) || false;
    };
    /**
     * Check if user has role
     */
    AuthTokenService.prototype.hasRole = function (role) {
        var payload = this.getTokenPayload();
        return (payload === null || payload === void 0 ? void 0 : payload.role) === role;
    };
    /**
     * Get user ID from token
     */
    AuthTokenService.prototype.getUserId = function () {
        var payload = this.getTokenPayload();
        return (payload === null || payload === void 0 ? void 0 : payload.userId) || null;
    };
    /**
     * Get user email from token
     */
    AuthTokenService.prototype.getUserEmail = function () {
        var payload = this.getTokenPayload();
        return (payload === null || payload === void 0 ? void 0 : payload.email) || null;
    };
    /**
     * Subscribe to token changes
     */
    AuthTokenService.prototype.onTokenChange = function (id, callback) {
        this.tokenCallbacks.set(id, callback);
    };
    /**
     * Unsubscribe from token changes
     */
    AuthTokenService.prototype.offTokenChange = function (id) {
        this.tokenCallbacks.delete(id);
    };
    /**
     * Setup automatic token refresh
     */
    AuthTokenService.prototype.setupAutoRefresh = function () {
        var _this = this;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        if (!this.accessToken)
            return;
        try {
            var payload = this.decodeToken(this.accessToken);
            var currentTime = Math.floor(Date.now() / 1000);
            var timeUntilExpiry = payload.exp - currentTime;
            // Refresh 5 minutes before expiry
            var refreshTime = Math.max(timeUntilExpiry - 300, 60) * 1000;
            this.refreshTimer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.refreshAccessToken()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }, refreshTime);
        }
        catch (error) {
            console.error('Failed to setup auto-refresh:', error);
        }
    };
    /**
     * Store tokens securely
     */
    AuthTokenService.prototype.storeTokensSecurely = function (tokenPair) {
        try {
            // Use sessionStorage for access token (more secure)
            sessionStorage.setItem('accessToken', tokenPair.accessToken);
            // Use localStorage for refresh token (persists across sessions)
            localStorage.setItem('refreshToken', tokenPair.refreshToken);
            // Store expiry time
            localStorage.setItem('tokenExpiry', (Date.now() + tokenPair.expiresIn * 1000).toString());
        }
        catch (error) {
            console.error('Failed to store tokens:', error);
        }
    };
    /**
     * Load tokens from storage
     */
    AuthTokenService.prototype.loadTokensFromStorage = function () {
        try {
            var accessToken = sessionStorage.getItem('accessToken');
            var refreshToken = localStorage.getItem('refreshToken');
            var tokenExpiry = localStorage.getItem('tokenExpiry');
            if (accessToken && !this.isTokenExpired(accessToken)) {
                this.accessToken = accessToken;
            }
            if (refreshToken) {
                this.refreshToken = refreshToken;
            }
            // Check if tokens are expired
            if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
                this.clearTokens();
            }
        }
        catch (error) {
            console.error('Failed to load tokens from storage:', error);
            this.clearTokens();
        }
    };
    /**
     * Clear token storage
     */
    AuthTokenService.prototype.clearTokenStorage = function () {
        try {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('tokenExpiry');
        }
        catch (error) {
            console.error('Failed to clear token storage:', error);
        }
    };
    /**
     * Notify token change callbacks
     */
    AuthTokenService.prototype.notifyTokenCallbacks = function (token) {
        this.tokenCallbacks.forEach(function (callback) {
            try {
                callback(token);
            }
            catch (error) {
                console.error('Error in token callback:', error);
            }
        });
    };
    /**
     * Create authorization header
     */
    AuthTokenService.prototype.getAuthHeader = function () {
        var token = this.getAccessToken();
        return token ? { Authorization: "Bearer ".concat(token) } : {};
    };
    /**
     * Validate token format
     */
    AuthTokenService.prototype.isValidTokenFormat = function (token) {
        try {
            var parts = token.split('.');
            if (parts.length !== 3)
                return false;
            // Try to decode payload
            this.decodeToken(token);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    return AuthTokenService;
}());
exports.authTokenService = AuthTokenService.getInstance();
exports.default = exports.authTokenService;
