"use strict";
/**
 * Unified Lazy-Route System – OPTIMIZED & COMPREHENSIVE
 * ------------------------------------------------
 * Covers every module shown in the project architecture with enhanced
 * TypeScript safety, error handling, and performance optimizations.
 * • All domains (auth, property, trust, user, search, etc.)
 * • All utility pages (legal, help, docs, dev-tools)
 * • All coming-soon placeholders
 * • All solution-specific pages
 * • All admin / monitoring / dev routes
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
exports.preloadContextualRoutes = exports.initializeLazyRoutes = exports.routePerformanceTracker = exports.WorkingRoutes = exports.getRoutesByPriority = exports.isValidRoute = exports.getAvailableRoutes = exports.getRouteComponent = exports.preloadRoutes = exports.LazyRoutes = void 0;
var react_1 = require("react");
var route_performance_1 = require("./route-performance");
/* ---------------------------------- */
/* 1. CONSTANTS                       */
/* ---------------------------------- */
var COMING_SOON_LABEL = 'Coming Soon';
var MAX_RETRY_ATTEMPTS = 2;
var RETRY_DELAY_BASE = 100; // milliseconds
/* ---------------------------------- */
/* 4. ENHANCED UTILITIES              */
/* ---------------------------------- */
/**
 * Checks if an error is related to network issues that might benefit from retry
 * This includes chunk loading errors, network failures, and fetch problems
 */
var isRetryableNetworkError = function (err) {
    return err instanceof Error &&
        /loading chunk|chunkloaderror|fetch|network/i.test(err.message);
};
/**
 * Attempts to import a module with exponential backoff retry logic
 * This helps handle transient network issues during code splitting
 */
function retryImport(importFunction_1, routePath_1) {
    return __awaiter(this, arguments, void 0, function (importFunction, routePath, maxRetries) {
        var _loop_1, attempt, state_1;
        if (maxRetries === void 0) { maxRetries = MAX_RETRY_ATTEMPTS; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (attempt) {
                        var _b, error_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 5]);
                                    _b = {};
                                    return [4 /*yield*/, importFunction()];
                                case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 2:
                                    error_1 = _c.sent();
                                    if (!(attempt < maxRetries && isRetryableNetworkError(error_1))) return [3 /*break*/, 4];
                                    route_performance_1.logger.warn("Retrying load (".concat(attempt + 1, ") for ").concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown route'));
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            return setTimeout(resolve, RETRY_DELAY_BASE * (Math.pow(2, attempt)));
                                        })];
                                case 3:
                                    _c.sent();
                                    return [2 /*return*/, "continue"];
                                case 4: throw error_1;
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 0;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: throw new Error('Maximum retry attempts exceeded');
            }
        });
    });
}
/**
 * Safely extracts a React component from various module export formats
 * Handles default exports, named exports, and direct component exports
 */
function extractComponent(module, routePath) {
    // Handle direct component (rare but possible)
    if (typeof module === 'function') {
        return module;
    }
    // Handle object with default export
    if (module && typeof module === 'object' && 'default' in module) {
        var defaultExport = module.default;
        if (typeof defaultExport === 'function') {
            return defaultExport;
        }
    }
    // Handle named exports - try common component names
    if (module && typeof module === 'object') {
        var moduleObj = module;
        var commonNames = ['Component', 'default', routePath === null || routePath === void 0 ? void 0 : routePath.split('/').pop()];
        for (var _i = 0, commonNames_1 = commonNames; _i < commonNames_1.length; _i++) {
            var name_1 = commonNames_1[_i];
            if (name_1 && typeof moduleObj[name_1] === 'function') {
                return moduleObj[name_1];
            }
        }
    }
    throw new Error("Invalid module at ".concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown', ": no valid React component found"));
}
/**
 * Validates and processes a module after import
 * Ensures we have a valid React component regardless of export format
 */
function validateAndProcessModule(module, routePath) {
    try {
        var component = extractComponent(module, routePath);
        return { default: component };
    }
    catch (error) {
        route_performance_1.logger.error("Module validation failed for ".concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown', ":"), error);
        throw new Error("Invalid module at ".concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown', ": ").concat(error instanceof Error ? error.message : 'unknown error'));
    }
}
/**
 * Main module loading function with retry and validation
 * This is the core function that handles all the complexity of dynamic imports
 */
function loadModuleWithRetry(importFunction, routePath) {
    return __awaiter(this, void 0, void 0, function () {
        var rawModule;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, retryImport(importFunction, routePath)];
                case 1:
                    rawModule = _a.sent();
                    return [2 /*return*/, validateAndProcessModule(rawModule, routePath)];
            }
        });
    });
}
/**
 * Creates a fallback component when the main module fails to load
 * Uses the ComingSoon component as a graceful degradation
 */
function loadFallbackModule(title, description, originalError) {
    return __awaiter(this, void 0, void 0, function () {
        var comingSoonModule, ComingSoonComponent_1, fallbackError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../shared/pages/ComingSoon'); })];
                case 1:
                    comingSoonModule = _a.sent();
                    ComingSoonComponent_1 = extractComponent(comingSoonModule);
                    return [2 /*return*/, {
                            default: function () {
                                var Component = ComingSoonComponent_1;
                                return (<Component title={title} description={description} expectedLaunch={COMING_SOON_LABEL} features={[]}/>);
                            },
                        }];
                case 2:
                    fallbackError_1 = _a.sent();
                    route_performance_1.logger.error('Failed to load fallback component:', fallbackError_1);
                    throw originalError; // Return original error if fallback fails
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Centralized error handling for route loading failures
 * Decides whether to show fallback or throw the error
 */
function handleRouteLoadError(error, routePath, fallbackTitle, fallbackDescription) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            route_performance_1.logger.error("Route load failed: ".concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown'), error);
            if (fallbackTitle && fallbackDescription) {
                return [2 /*return*/, loadFallbackModule(fallbackTitle, fallbackDescription, error)];
            }
            throw error;
        });
    });
}
/* ---------------------------------- */
/* 5. CREATOR FACTORIES               */
/* ---------------------------------- */
/**
 * Creates a lazy-loaded route component with comprehensive error handling
 * This is the main factory function for creating route components
 */
var createLazyRoute = function (importFunction, configuration) {
    if (configuration === void 0) { configuration = {}; }
    var routePath = configuration.routePath, fallbackTitle = configuration.fallbackTitle, fallbackDescription = configuration.fallbackDescription, preloadPriority = configuration.preloadPriority;
    return (0, react_1.lazy)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var startTime, moduleResult, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = route_performance_1.performanceTracker.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    route_performance_1.logger.info("Loading route: ".concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown'));
                    return [4 /*yield*/, loadModuleWithRetry(importFunction, routePath)];
                case 2:
                    moduleResult = _a.sent();
                    (0, route_performance_1.trackRoutePerformance)(startTime, routePath, preloadPriority);
                    route_performance_1.logger.info("Successfully loaded route: ".concat(routePath !== null && routePath !== void 0 ? routePath : 'unknown'));
                    return [2 /*return*/, moduleResult];
                case 3:
                    error_2 = _a.sent();
                    return [2 /*return*/, handleRouteLoadError(error_2, routePath, fallbackTitle, fallbackDescription)];
                case 4: return [2 /*return*/];
            }
        });
    }); });
};
/**
 * Creates a standardized "Coming Soon" route component
 * Used for features that are planned but not yet implemented
 */
var createComingSoonRoute = function (title, description) {
    return (0, react_1.lazy)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var comingSoonModule, ComingSoonComponent_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../shared/pages/ComingSoon'); })];
                case 1:
                    comingSoonModule = _a.sent();
                    ComingSoonComponent_2 = extractComponent(comingSoonModule);
                    return [2 /*return*/, {
                            default: function () {
                                var Component = ComingSoonComponent_2;
                                return (<Component title={title} description={description} expectedLaunch={COMING_SOON_LABEL} features={[]}/>);
                            },
                        }];
                case 2:
                    error_3 = _a.sent();
                    route_performance_1.logger.error('Failed to load ComingSoon component:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
};
/* ---------------------------------- */
/* 6. ROUTE DEFINITIONS               */
/* ---------------------------------- */
exports.LazyRoutes = {
    /* --- Core / Shared Routes --- */
    Home: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Home'); }); }, {
        routePath: '/',
        preloadPriority: 'high',
    }),
    Features: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Features'); }); }, {
        routePath: '/features',
        preloadPriority: 'high',
    }),
    Pricing: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Pricing'); }); }, {
        routePath: '/pricing',
        preloadPriority: 'high',
    }),
    About: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/About'); }); }, {
        routePath: '/about',
        preloadPriority: 'normal',
    }),
    Services: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Services'); }); }, {
        routePath: '/services',
        preloadPriority: 'normal',
    }),
    Solutions: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Solutions'); }); }, {
        routePath: '/solutions',
        preloadPriority: 'normal',
    }),
    Blog: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Blog'); }); }, {
        routePath: '/blog',
        preloadPriority: 'low',
    }),
    BlogPost: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/BlogPost'); }); }, {
        routePath: '/blog/:slug',
        preloadPriority: 'low',
    }),
    BlogTest: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/BlogTest'); }); }, {
        routePath: '/blog-test',
        preloadPriority: 'low',
    }),
    Resources: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Resources'); }); }, {
        routePath: '/resources',
        preloadPriority: 'low',
    }),
    Community: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Community'); }); }, {
        routePath: '/community',
        preloadPriority: 'normal',
    }),
    CommunityAndResources: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/CommunityAndResources'); }); }, { routePath: '/community-resources', preloadPriority: 'normal' }),
    FraudResources: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Fraud-resources'); }); }, { routePath: '/fraud-resources', preloadPriority: 'high' }),
    OurStory: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/OurStory'); }); }, {
        routePath: '/our-story',
        preloadPriority: 'low',
    }),
    Partners: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Partners'); }); }, {
        routePath: '/partners',
        preloadPriority: 'low',
    }),
    PressMedia: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/PressMedia'); }); }, {
        routePath: '/press',
        preloadPriority: 'low',
    }),
    /* --- Authentication Routes --- */
    Login: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../auth/pages/Login'); }); }, {
        routePath: '/auth/login',
        preloadPriority: 'high',
    }),
    Register: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../auth/pages/Register'); }); }, {
        routePath: '/auth/register',
        preloadPriority: 'high',
    }),
    ForgotPassword: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../auth/pages/ForgotPassword'); }); }, { routePath: '/forgot-password', preloadPriority: 'high' }),
    /* --- User Management Routes --- */
    Dashboard: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../user/pages/Dashboard'); }); }, {
        routePath: '/dashboard',
        preloadPriority: 'high',
    }),
    UserProfile: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../user/pages/UserProfile'); }); }, {
        routePath: '/profile',
        preloadPriority: 'normal',
    }),
    UserSettings: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../user/pages/UserSettings'); }); }, {
        routePath: '/settings',
        preloadPriority: 'normal',
    }),
    Team: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../user/pages/Team'); }); }, {
        routePath: '/team',
        preloadPriority: 'low',
    }),
    Tenants: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../user/pages/Tenants'); }); }, {
        routePath: '/tenants',
        preloadPriority: 'normal',
    }),
    Activity: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../user/pages/Activity'); }); }, {
        routePath: '/activity',
        preloadPriority: 'normal',
    }),
    /* --- Property Management Routes --- */
    Properties: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Properties'); }); }, {
        routePath: '/properties',
        preloadPriority: 'high',
    }),
    PropertyDetails: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyDetails'); }); }, { routePath: '/property/:id', preloadPriority: 'high' }),
    PropertyEdit: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyEdit'); }); }, { routePath: '/property/:id/edit', preloadPriority: 'normal' }),
    PropertyCompare: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyCompare'); }); }, { routePath: '/compare', preloadPriority: 'normal' }),
    ListProperty: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/ListProperty'); }); }, {
        routePath: '/list-property',
        preloadPriority: 'normal',
    }),
    PropertyWizard: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyWizard'); }); }, { routePath: '/property/wizard', preloadPriority: 'normal' }),
    // Fixed: Enhanced handling for component exports that might not have default
    PropertyMap: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/components/PropertyMap'); }); }, {
        routePath: '/property/map',
        preloadPriority: 'normal',
        fallbackTitle: 'Property Map',
        fallbackDescription: 'Interactive property mapping feature',
    }),
    PropertyPhotos: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyPhotos'); }); }, { routePath: '/property/photos', preloadPriority: 'low' }),
    PropertyOptimize: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyOptimize'); }); }, { routePath: '/property/optimize', preloadPriority: 'low' }),
    PropertyVerification: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertyVerification'); }); }, { routePath: '/property/verification', preloadPriority: 'normal' }),
    PropertiesResidential: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/PropertiesResidential'); }); }, { routePath: '/properties/residential', preloadPriority: 'normal' }),
    PropertiesCommercial: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/CommercialProperties'); }); }, { routePath: '/properties/commercial', preloadPriority: 'normal' }),
    Lands: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/Lands'); }); }, {
        routePath: '/properties/land',
        preloadPriority: 'normal',
    }),
    LandDetails: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/LandDetails'); }); }, {
        routePath: '/land/:id',
        preloadPriority: 'normal',
    }),
    LandRedirect: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../property/pages/LandRedirect'); }); }, {
        routePath: '/land/:id',
        preloadPriority: 'high',
    }),
    /* --- Land Verification Routes (Kenya) --- */
    LandVerification: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../land-verification/pages/LandVerificationPage'); }); }, { routePath: '/land-verification', preloadPriority: 'normal' }),
    LandVerificationDashboard: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../land-verification/pages/LandVerificationDashboardPage'); }); }, { routePath: '/land-verification/dashboard', preloadPriority: 'normal' }),
    NewLandVerification: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../land-verification/pages/NewVerificationPage'); }); }, { routePath: '/land-verification/new', preloadPriority: 'normal' }),
    /* --- Trust & Fraud Detection Routes --- */
    BasicChecks: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/BasicChecks'); }); }, {
        routePath: '/trust/basic-checks',
        preloadPriority: 'normal',
    }),
    FraudDetection: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/FraudDetection'); }); }, { routePath: '/trust/fraud-detection', preloadPriority: 'normal' }),
    DocumentAuth: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/DocumentAuth'); }); }, {
        routePath: '/trust/document-auth',
        preloadPriority: 'normal',
    }),
    TrustReports: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/Reports'); }); }, {
        routePath: '/trust/reports',
        preloadPriority: 'normal',
    }),
    TrustAlerts: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/Alerts'); }); }, {
        routePath: '/trust/alerts',
        preloadPriority: 'normal',
    }),
    TrustKarma: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/Karma'); }); }, {
        routePath: '/trust/karma',
        preloadPriority: 'low',
    }),
    TrustReputation: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/Reputation'); }); }, { routePath: '/trust/reputation', preloadPriority: 'low' }),
    TrustPoints: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/TrustPoints'); }); }, {
        routePath: '/trust/points',
        preloadPriority: 'low',
    }),
    TrustReviews: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/Reviews'); }); }, {
        routePath: '/trust/reviews',
        preloadPriority: 'normal',
    }),
    FraudProtectionInfo: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../trust/pages/FraudProtectionInfo'); }); }, { routePath: '/trust/fraud-protection', preloadPriority: 'normal' }),
    /* --- Communication Routes --- */
    Inbox: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../communication/pages/Inbox'); }); }, {
        routePath: '/inbox',
        preloadPriority: 'normal',
    }),
    /* --- Search & Discovery Routes --- */
    SearchResults: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../search/pages/SearchResults'); }); }, { routePath: '/search', preloadPriority: 'normal' }),
    /* --- Analytics Routes --- */
    // Fixed: Enhanced handling for component exports that might not have default
    Analytics: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../analytics/components/AnalyticsDashboard'); }); }, {
        routePath: '/analytics',
        preloadPriority: 'normal',
        fallbackTitle: 'Analytics Dashboard',
        fallbackDescription: 'Comprehensive analytics and reporting',
    }),
    /* --- Legal & Support Routes --- */
    Help: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Help'); }); }, {
        routePath: '/help',
        preloadPriority: 'normal',
    }),
    GettingStarted: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/GettingStarted'); }); }, { routePath: '/help/getting-started', preloadPriority: 'normal' }),
    Contact: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Contact'); }); }, {
        routePath: '/contact',
        preloadPriority: 'normal',
    }),
    Privacy: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Privacy'); }); }, {
        routePath: '/privacy',
        preloadPriority: 'low',
    }),
    Terms: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Terms'); }); }, {
        routePath: '/terms',
        preloadPriority: 'low',
    }),
    Cookies: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Cookies'); }); }, {
        routePath: '/cookies',
        preloadPriority: 'low',
    }),
    Security: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Security'); }); }, {
        routePath: '/security',
        preloadPriority: 'low',
    }),
    /* --- Developer & Admin Routes --- */
    DeveloperDashboard: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/DeveloperDashboard'); }); }, { routePath: '/dev', preloadPriority: 'low' }),
    AdminDashboard: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/AdminDashboard'); }); }, { routePath: '/admin', preloadPriority: 'low' }),
    SystemMonitoring: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/SystemMonitoring'); }); }, { routePath: '/monitoring', preloadPriority: 'low' }),
    /* --- Demo & Utility Routes --- */
    MVPDemo: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/MVP-Demo'); }); }, {
        routePath: '/mvp-demo',
        preloadPriority: 'high',
    }),
    Demo: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/Demo'); }); }, {
        routePath: '/demo',
        preloadPriority: 'high',
    }),
    NavigationTest: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/NavigationTest'); }); }, {
        routePath: '/nav-test',
        preloadPriority: 'low',
    }),
    ApiDemo: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/ApiDemo'); }); }, {
        routePath: '/api-demo',
        preloadPriority: 'normal',
    }),
    ContactSales: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/ContactSales'); }); }, { routePath: '/contact-sales', preloadPriority: 'normal' }),
    /* --- Document Management Routes --- */
    DocumentsPage: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/DocumentsPage'); }); }, { routePath: '/documents', preloadPriority: 'normal' }),
    DocumentUpload: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/DocumentUpload'); }); }, { routePath: '/documents/upload', preloadPriority: 'normal' }),
    DocumentViewer: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/DocumentViewer'); }); }, { routePath: '/documents/:id', preloadPriority: 'normal' }),
    /* --- Location Services Routes --- */
    LocationServices: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/LocationServices'); }); }, { routePath: '/location', preloadPriority: 'normal' }),
    /* --- Error & Fallback Routes --- */
    NotFound: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/NotFound'); }); }, {
        routePath: '/404',
        preloadPriority: 'normal',
    }),
    ComingSoon: createComingSoonRoute(COMING_SOON_LABEL, 'This feature is coming soon. Stay tuned for updates!'),
    /* --- Coming-Soon Placeholder Routes --- */
    AdvancedSearch: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../search/pages/AdvancedSearch'); }); }, { routePath: '/advanced-search', preloadPriority: 'normal' }),
    Notifications: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../communication/pages/Notifications'); }); }, { routePath: '/notifications', preloadPriority: 'normal' }),
    MessageCenter: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../communication/pages/MessageCenter'); }); }, { routePath: '/messages', preloadPriority: 'normal' }),
    ExpertCoordination: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/ExpertCoordination'); }); }, { routePath: '/expert-coordination', preloadPriority: 'normal' }),
    PhysicalVerification: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/PhysicalVerification'); }); }, { routePath: '/physical-verification', preloadPriority: 'normal' }),
    CommunityIntelligence: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/CommunityIntelligence'); }); }, { routePath: '/community-intelligence', preloadPriority: 'normal' }),
    FindProfessionals: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/FindProfessionals'); }); }, {
        routePath: '/find-professionals',
        preloadPriority: 'normal',
    }),
    /* --- Help System Coming Soon Routes --- */
    HelpGettingStarted: createComingSoonRoute('Getting Started Guide', 'Comprehensive guide to using TripleCheck effectively.'),
    HelpVerification: createComingSoonRoute('Verification Guide', 'Step-by-step guide to the property verification process.'),
    HelpFAQ: createComingSoonRoute('Frequently Asked Questions', 'Quick answers to the most common questions.'),
    SearchFilters: createComingSoonRoute('Search Filters', 'Customize and save search preferences.'),
    /* --- Solution Segment Routes --- */
    SolutionsBuyers: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/solutions/PropertyBuyers'); }); }, { routePath: '/solutions/buyers', preloadPriority: 'normal' }),
    SolutionsSellers: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/solutions/PropertySellers'); }); }, { routePath: '/solutions/sellers', preloadPriority: 'normal' }),
    SolutionsAgents: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/solutions/RealEstateAgents'); }); }, { routePath: '/solutions/agents', preloadPriority: 'normal' }),
    SolutionsDevelopers: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/solutions/PropertyDevelopers'); }); }, { routePath: '/solutions/developers', preloadPriority: 'normal' }),
    SolutionsLegalExperts: createLazyRoute(function () { return Promise.resolve().then(function () { return require('../shared/pages/solutions/LegalExperts'); }); }, { routePath: '/solutions/legal-experts', preloadPriority: 'normal' }),
};
/**
 * Handles the results of batch preloading operations
 * Provides useful logging in development mode for debugging
 */
var handleBatchResults = function (results, category) {
    if (process.env.NODE_ENV !== 'development')
        return results;
    var failed = results.filter(function (r) { return r.status === 'rejected'; });
    var succeeded = results.filter(function (r) { return r.status === 'fulfilled'; });
    if (failed.length > 0) {
        route_performance_1.logger.warn("".concat(failed.length, "/").concat(results.length, " ").concat(category, " preloads failed"));
        // Log specific failures in development
        failed.forEach(function (result, index) {
            if (result.status === 'rejected') {
                route_performance_1.logger.warn("".concat(category, " preload ").concat(index + 1, " failed:"), result.reason);
            }
        });
    }
    if (succeeded.length > 0) {
        route_performance_1.logger.info("Successfully preloaded ".concat(succeeded.length, " ").concat(category, " routes"));
    }
    return results;
};
/**
 * Comprehensive preloading system organized by feature categories
 * This allows for strategic loading based on user behavior and application state
 */
exports.preloadRoutes = {
    core: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/Home'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Features'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Pricing'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/About'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Properties'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'core'])];
            }
        });
    }); },
    auth: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../auth/pages/Login'); }),
                            Promise.resolve().then(function () { return require('../auth/pages/Register'); }),
                            Promise.resolve().then(function () { return require('../auth/pages/ForgotPassword'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'auth'])];
            }
        });
    }); },
    property: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../property/pages/PropertyDetails'); }),
                            Promise.resolve().then(function () { return require('../property/pages/PropertyCompare'); }),
                            Promise.resolve().then(function () { return require('../property/pages/PropertyEdit'); }),
                            Promise.resolve().then(function () { return require('../property/pages/ListProperty'); }),
                            Promise.resolve().then(function () { return require('../property/components/PropertyMap'); }),
                            Promise.resolve().then(function () { return require('../property/pages/PropertyWizard'); }),
                            Promise.resolve().then(function () { return require('../property/pages/Lands'); }),
                            Promise.resolve().then(function () { return require('../property/pages/LandDetails'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'property'])];
            }
        });
    }); },
    landVerification: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../land-verification/pages/LandVerificationPage'); }),
                            Promise.resolve().then(function () { return require('../land-verification/pages/LandVerificationDashboardPage'); }),
                            Promise.resolve().then(function () { return require('../land-verification/pages/NewVerificationPage'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'landVerification'])];
            }
        });
    }); },
    trust: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../trust/pages/BasicChecks'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/FraudDetection'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/DocumentAuth'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/Reports'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/Alerts'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/Reviews'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/TrustPoints'); }),
                            Promise.resolve().then(function () { return require('../trust/pages/FraudProtectionInfo'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'trust'])];
            }
        });
    }); },
    user: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../user/pages/Dashboard'); }),
                            Promise.resolve().then(function () { return require('../user/pages/Tenants'); }),
                            Promise.resolve().then(function () { return require('../user/pages/Team'); }),
                            Promise.resolve().then(function () { return require('../user/pages/UserProfile'); }),
                            Promise.resolve().then(function () { return require('../user/pages/UserSettings'); }),
                            Promise.resolve().then(function () { return require('../user/pages/Activity'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'user'])];
            }
        });
    }); },
    communication: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../communication/pages/Inbox'); }),
                            Promise.resolve().then(function () { return require('../communication/pages/Notifications'); }),
                            Promise.resolve().then(function () { return require('../communication/pages/MessageCenter'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'communication'])];
            }
        });
    }); },
    search: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../search/pages/SearchResults'); }),
                            Promise.resolve().then(function () { return require('../search/pages/AdvancedSearch'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'search'])];
            }
        });
    }); },
    analytics: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../analytics/components/AnalyticsDashboard'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'analytics'])];
            }
        });
    }); },
    content: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/Blog'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Community'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Resources'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Services'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Solutions'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Help'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/FindProfessionals'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/CommunityAndResources'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'content'])];
            }
        });
    }); },
    legal: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/Help'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Contact'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Privacy'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Terms'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Security'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/Cookies'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'legal'])];
            }
        });
    }); },
    document: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/DocumentsPage'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/DocumentUpload'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/DocumentViewer'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'document'])];
            }
        });
    }); },
    location: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/LocationServices'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'location'])];
            }
        });
    }); },
    ai: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                        // Note: AI test components have been removed
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'ai'])];
            }
        });
    }); },
    developer: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/DeveloperDashboard'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/AdminDashboard'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/SystemMonitoring'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/NavigationTest'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/ApiDemo'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'developer'])];
            }
        });
    }); },
    expert: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = handleBatchResults;
                    return [4 /*yield*/, Promise.allSettled([
                            Promise.resolve().then(function () { return require('../shared/pages/ExpertCoordination'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/PhysicalVerification'); }),
                            Promise.resolve().then(function () { return require('../shared/pages/CommunityIntelligence'); }),
                        ])];
                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 'expert'])];
            }
        });
    }); },
    /**
     * Preloads multiple categories in parallel
     * Useful for loading related functionality together
     */
    preloadMultiple: function (categories) { return __awaiter(void 0, void 0, void 0, function () {
        var validCategories, batchPromises, batchResults, flatResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validCategories = categories.filter(function (category) {
                        return Object.prototype.hasOwnProperty.call(exports.preloadRoutes, category) &&
                            typeof exports.preloadRoutes[category] === 'function';
                    });
                    if (validCategories.length === 0) {
                        route_performance_1.logger.warn('No valid categories provided for preloading');
                        return [2 /*return*/, []];
                    }
                    batchPromises = validCategories.map(function (category) { return __awaiter(void 0, void 0, void 0, function () {
                        var preloadFunction, error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    preloadFunction = exports.preloadRoutes[category];
                                    if (!(typeof preloadFunction === 'function')) return [3 /*break*/, 2];
                                    return [4 /*yield*/, preloadFunction()];
                                case 1: return [2 /*return*/, _a.sent()];
                                case 2: return [2 /*return*/, []];
                                case 3:
                                    error_4 = _a.sent();
                                    route_performance_1.logger.error("Failed to preload category ".concat(category, ":"), error_4);
                                    return [2 /*return*/, []];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(batchPromises)];
                case 1:
                    batchResults = _a.sent();
                    flatResults = batchResults.flat();
                    route_performance_1.logger.info("Preloaded ".concat(validCategories.length, " categories with ").concat(flatResults.length, " total routes"));
                    return [2 /*return*/, flatResults];
            }
        });
    }); },
    /**
     * Preloads routes based on their priority level
     * This enables progressive loading strategies
     */
    preloadByPriority: function (priority) { return __awaiter(void 0, void 0, void 0, function () {
        var priorityMapping, categories;
        return __generator(this, function (_a) {
            priorityMapping = {
                high: [
                    'core',
                    'auth',
                    'property',
                    'landVerification',
                ],
                normal: [
                    'trust',
                    'user',
                    'search',
                    'communication',
                    'document',
                    'location',
                    'expert',
                ],
                low: [
                    'content',
                    'analytics',
                    'legal',
                    'ai',
                    'developer',
                ],
            };
            categories = priorityMapping[priority];
            if (!categories || categories.length === 0) {
                route_performance_1.logger.warn("No categories found for priority level: ".concat(priority));
                return [2 /*return*/, []];
            }
            route_performance_1.logger.info("Preloading ".concat(priority, " priority routes (").concat(categories.length, " categories)"));
            return [2 /*return*/, exports.preloadRoutes.preloadMultiple(categories)];
        });
    }); },
    /**
     * Preloads routes commonly needed after user authentication
     * Optimizes the post-login experience
     */
    preloadUserSession: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.preloadRoutes.preloadMultiple([
                    'user',
                    'property',
                    'trust',
                    'communication',
                ])];
        });
    }); },
    /**
     * Preloads routes for anonymous users
     * Focuses on marketing and informational content
     */
    preloadAnonymous: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.preloadRoutes.preloadMultiple([
                    'core',
                    'content',
                    'legal',
                ])];
        });
    }); },
};
/**
 * Safely retrieves a route component by name
 * Provides better error handling and debugging information
 */
var getRouteComponent = function (name) {
    if (!Object.prototype.hasOwnProperty.call(exports.LazyRoutes, name)) {
        throw new Error("Route \"".concat(name, "\" not found in LazyRoutes"));
    }
    var component = exports.LazyRoutes[name];
    if (!component) {
        throw new Error("Route \"".concat(name, "\" exists but is null or undefined"));
    }
    return component;
};
exports.getRouteComponent = getRouteComponent;
/**
 * Gets all available route names
 * Useful for debugging and dynamic route generation
 */
var getAvailableRoutes = function () {
    return Object.keys(exports.LazyRoutes);
};
exports.getAvailableRoutes = getAvailableRoutes;
/**
 * Checks if a route name exists in the system
 * Useful for validation before attempting to load
 */
var isValidRoute = function (name) {
    return Object.prototype.hasOwnProperty.call(exports.LazyRoutes, name);
};
exports.isValidRoute = isValidRoute;
/**
 * Gets routes filtered by priority level
 * Useful for understanding and optimizing loading strategies
 */
var getRoutesByPriority = function (priority) {
    // This would require storing priority metadata, but for now we can use the preload categories
    var priorityMapping = {
        high: ['Home', 'Features', 'Pricing', 'Login', 'Register', 'Dashboard', 'Properties'],
        normal: ['About', 'Services', 'UserProfile', 'PropertyDetails', 'SearchResults'],
        low: ['Blog', 'Resources', 'Team', 'Analytics', 'DeveloperDashboard'],
    };
    return priorityMapping[priority].filter(exports.isValidRoute);
};
exports.getRoutesByPriority = getRoutesByPriority;
// Backward compatibility export
exports.WorkingRoutes = exports.LazyRoutes;
/**
 * Simple performance tracking for route loading
 * Can be extended with more sophisticated analytics
 */
var RoutePerformanceTracker = /** @class */ (function () {
    function RoutePerformanceTracker() {
        this.metrics = [];
        this.maxMetrics = 100; // Prevent memory leaks
    }
    RoutePerformanceTracker.prototype.recordMetric = function (metric) {
        this.metrics.push(metric);
        // Keep only the most recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    };
    RoutePerformanceTracker.prototype.getAverageLoadTime = function () {
        if (this.metrics.length === 0)
            return 0;
        var total = this.metrics.reduce(function (sum, metric) { return sum + metric.loadTime; }, 0);
        return total / this.metrics.length;
    };
    RoutePerformanceTracker.prototype.getSlowRoutes = function (threshold) {
        if (threshold === void 0) { threshold = 1000; }
        return this.metrics.filter(function (metric) { return metric.loadTime > threshold; });
    };
    RoutePerformanceTracker.prototype.getFailureRate = function () {
        if (this.metrics.length === 0)
            return 0;
        var failures = this.metrics.filter(function (metric) { return !metric.success; }).length;
        return failures / this.metrics.length;
    };
    RoutePerformanceTracker.prototype.getMetricsSummary = function () {
        return {
            totalRoutes: this.metrics.length,
            averageLoadTime: this.getAverageLoadTime(),
            failureRate: this.getFailureRate(),
            slowRoutes: this.getSlowRoutes().length,
        };
    };
    return RoutePerformanceTracker;
}());
exports.routePerformanceTracker = new RoutePerformanceTracker();
/* ---------------------------------- */
/* 10. INITIALIZATION HELPERS        */
/* ---------------------------------- */
/**
 * Initializes the lazy route system with optimal preloading
 * Call this early in your app lifecycle for best performance
 */
var initializeLazyRoutes = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (userAuthenticated, priorityLevel) {
        var error_5;
        if (userAuthenticated === void 0) { userAuthenticated = false; }
        if (priorityLevel === void 0) { priorityLevel = 'high'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    route_performance_1.logger.info('Initializing lazy route system...');
                    if (!userAuthenticated) return [3 /*break*/, 2];
                    return [4 /*yield*/, exports.preloadRoutes.preloadUserSession()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, exports.preloadRoutes.preloadAnonymous()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: 
                // Additionally preload by priority
                return [4 /*yield*/, exports.preloadRoutes.preloadByPriority(priorityLevel)];
                case 5:
                    // Additionally preload by priority
                    _a.sent();
                    route_performance_1.logger.info('Lazy route system initialized successfully');
                    return [3 /*break*/, 7];
                case 6:
                    error_5 = _a.sent();
                    route_performance_1.logger.error('Failed to initialize lazy route system:', error_5);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
};
exports.initializeLazyRoutes = initializeLazyRoutes;
/**
 * Preloads routes based on the current application context
 * Can be called reactively when user state changes
 */
var preloadContextualRoutes = function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticated, userRole, currentSection, categoriesToPreload, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authenticated = context.authenticated, userRole = context.userRole, currentSection = context.currentSection;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                categoriesToPreload = [];
                if (authenticated) {
                    categoriesToPreload.push('user', 'communication');
                }
                if (userRole === 'admin') {
                    categoriesToPreload.push('developer', 'analytics');
                }
                if (currentSection === 'property') {
                    categoriesToPreload.push('property', 'landVerification', 'trust');
                }
                if (!(categoriesToPreload.length > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, exports.preloadRoutes.preloadMultiple(categoriesToPreload)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                route_performance_1.logger.warn('Contextual preloading failed:', error_6);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.preloadContextualRoutes = preloadContextualRoutes;
