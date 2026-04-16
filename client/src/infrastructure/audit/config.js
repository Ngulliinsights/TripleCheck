"use strict";
/**
 * UI Audit System Configuration
 *
 * Centralized configuration for the audit system with environment-specific settings
 */
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
exports.ciConfig = exports.productionConfig = exports.developmentConfig = exports.defaultAuditConfig = void 0;
exports.getAuditConfig = getAuditConfig;
exports.validateConfig = validateConfig;
exports.mergeConfig = mergeConfig;
/**
 * Default configuration
 */
exports.defaultAuditConfig = {
    // Scanning Configuration
    componentDirectories: [
        'src/auth/components',
        'src/property/components',
        'src/user/components',
        'src/trust/components',
        'src/search/components',
        'src/communication/components',
        'src/analytics/components',
        'src/land-verification/components',
        'src/shared/components'
    ],
    excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/__tests__/**',
        '**/*.stories.{ts,tsx,js,jsx}'
    ],
    includeTestFiles: false,
    scanDepth: 'deep',
    // API Testing Configuration
    apiTimeout: 5000,
    maxRetries: 3,
    parallelRequests: 4,
    baseURL: process.env.NODE_ENV === 'production'
        ? 'https://your-production-api.com'
        : 'http://localhost:3000',
    // Route Validation Configuration
    routeTimeout: 3000,
    validateExternalLinks: true,
    followRedirects: true,
    // Performance Configuration
    enableCaching: true,
    cacheTimeout: 30,
    maxConcurrentScans: 6,
    // Reporting Configuration
    outputFormats: ['json', 'markdown'],
    reportDirectory: 'reports/audit',
    includeScreenshots: false,
    // Priority Weights
    priorityWeights: {
        critical: 10,
        high: 5,
        medium: 2,
        low: 1
    },
    // Custom Rules
    customRules: [
        {
            id: 'missing-aria-labels',
            name: 'Missing ARIA Labels',
            description: 'Interactive elements should have proper ARIA labels',
            category: 'accessibility',
            severity: 'medium',
            pattern: /button|input|select|textarea/i,
            check: function (element) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, element.props['aria-label'] || element.props['aria-labelledby']];
                });
            }); },
            suggestion: 'Add aria-label or aria-labelledby attributes to improve accessibility'
        },
        {
            id: 'missing-error-boundaries',
            name: 'Missing Error Boundaries',
            description: 'Components should be wrapped in error boundaries',
            category: 'error-handling',
            severity: 'high',
            pattern: /Page|Layout|Route/i,
            check: function (element) { return __awaiter(void 0, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, (_a = element.parentComponents) === null || _a === void 0 ? void 0 : _a.some(function (parent) {
                            return parent.includes('ErrorBoundary');
                        })];
                });
            }); },
            suggestion: 'Wrap components in error boundaries to handle runtime errors gracefully'
        }
    ],
    // Integration Settings
    integrations: {}
};
/**
 * Environment-specific configurations
 */
exports.developmentConfig = {
    apiTimeout: 10000,
    includeTestFiles: true,
    scanDepth: 'exhaustive',
    enableCaching: false,
    outputFormats: ['json', 'markdown'],
    includeScreenshots: true
};
exports.productionConfig = {
    apiTimeout: 3000,
    includeTestFiles: false,
    scanDepth: 'deep',
    enableCaching: true,
    outputFormats: ['json'],
    includeScreenshots: false,
    maxConcurrentScans: 3
};
exports.ciConfig = {
    apiTimeout: 5000,
    includeTestFiles: false,
    scanDepth: 'shallow',
    enableCaching: false,
    outputFormats: ['json'],
    includeScreenshots: false,
    maxConcurrentScans: 2
};
/**
 * Get configuration for current environment
 */
function getAuditConfig() {
    var env = process.env.NODE_ENV || 'development';
    var envConfig = {};
    switch (env) {
        case 'production':
            envConfig = exports.productionConfig;
            break;
        case 'test':
        case 'ci':
            envConfig = exports.ciConfig;
            break;
        case 'development':
        default:
            envConfig = exports.developmentConfig;
            break;
    }
    return __assign(__assign({}, exports.defaultAuditConfig), envConfig);
}
/**
 * Validate configuration
 */
function validateConfig(config) {
    var errors = [];
    if (config.componentDirectories.length === 0) {
        errors.push('At least one component directory must be specified');
    }
    if (config.apiTimeout < 1000) {
        errors.push('API timeout should be at least 1000ms');
    }
    if (config.maxRetries < 0 || config.maxRetries > 10) {
        errors.push('Max retries should be between 0 and 10');
    }
    if (config.parallelRequests < 1 || config.parallelRequests > 20) {
        errors.push('Parallel requests should be between 1 and 20');
    }
    if (config.cacheTimeout < 1) {
        errors.push('Cache timeout should be at least 1 minute');
    }
    return errors;
}
/**
 * Merge user configuration with defaults
 */
function mergeConfig(userConfig) {
    var baseConfig = getAuditConfig();
    return __assign(__assign(__assign({}, baseConfig), userConfig), { priorityWeights: __assign(__assign({}, baseConfig.priorityWeights), userConfig.priorityWeights), integrations: __assign(__assign({}, baseConfig.integrations), userConfig.integrations) });
}
