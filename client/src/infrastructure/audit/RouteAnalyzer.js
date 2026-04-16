"use strict";
/**
 * Route Analyzer - Analyzes routing configuration and identifies missing routes
 *
 * This component analyzes the React Router configuration and identifies
 * routes that are referenced in the UI but not properly implemented.
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
exports.routeAnalyzer = exports.RouteAnalyzer = void 0;
/**
 * Route Analyzer class
 */
var RouteAnalyzer = /** @class */ (function () {
    function RouteAnalyzer() {
        this.definedRoutes = new Map();
        this.routeReferences = new Map();
        this.routeMismatches = [];
    }
    /**
     * Analyze the routing configuration
     */
    RouteAnalyzer.prototype.analyzeRoutes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var validationResults, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Starting route analysis...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        // Step 1: Parse router configuration
                        return [4 /*yield*/, this.parseRouterConfiguration()];
                    case 2:
                        // Step 1: Parse router configuration
                        _a.sent();
                        // Step 2: Find all route references in components
                        return [4 /*yield*/, this.findRouteReferences()];
                    case 3:
                        // Step 2: Find all route references in components
                        _a.sent();
                        // Step 3: Compare defined routes with references
                        return [4 /*yield*/, this.compareRoutesAndReferences()];
                    case 4:
                        // Step 3: Compare defined routes with references
                        _a.sent();
                        return [4 /*yield*/, this.validateAllRoutes()];
                    case 5:
                        validationResults = _a.sent();
                        console.log('✅ Route analysis complete');
                        return [2 /*return*/, {
                                definedRoutes: Array.from(this.definedRoutes.values()),
                                routeReferences: Array.from(this.routeReferences.values()),
                                mismatches: this.routeMismatches,
                                validationResults: validationResults
                            }];
                    case 6:
                        error_1 = _a.sent();
                        console.error('❌ Route analysis failed:', error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse the router configuration from router.tsx and lazy-routes.tsx
     */
    RouteAnalyzer.prototype.parseRouterConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mockRoutes, _i, mockRoutes_1, route;
            return __generator(this, function (_a) {
                console.log('📋 Parsing router configuration...');
                mockRoutes = this.getMockRouterConfiguration();
                for (_i = 0, mockRoutes_1 = mockRoutes; _i < mockRoutes_1.length; _i++) {
                    route = mockRoutes_1[_i];
                    this.definedRoutes.set(route.path, route);
                }
                console.log("Found ".concat(this.definedRoutes.size, " defined routes"));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get mock router configuration (replace with real parsing)
     */
    RouteAnalyzer.prototype.getMockRouterConfiguration = function () {
        return [
            { path: '/', component: 'Home', lazy: true },
            { path: '/dashboard', component: 'Dashboard', lazy: true },
            { path: '/properties', component: 'Properties', lazy: true },
            { path: '/property/:id', component: 'PropertyDetails', lazy: true },
            { path: '/login', component: 'Login', lazy: true },
            { path: '/register', component: 'Register', lazy: true },
            { path: '/profile', component: 'UserProfile', lazy: true },
            { path: '/trust/basic-checks', component: 'BasicChecks', lazy: true },
            { path: '/trust/fraud-detection', component: 'FraudDetection', lazy: true },
            { path: '/land-verification', component: 'LandVerification', lazy: true },
            { path: '/search', component: 'SearchResults', lazy: true },
            { path: '/inbox', component: 'Inbox', lazy: true },
            // Note: /notifications and /settings are missing - this will be detected
        ];
    };
    /**
     * Find all route references in component files
     */
    RouteAnalyzer.prototype.findRouteReferences = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mockReferences, _i, mockReferences_1, reference;
            return __generator(this, function (_a) {
                console.log('🔍 Finding route references in components...');
                mockReferences = this.getMockRouteReferences();
                for (_i = 0, mockReferences_1 = mockReferences; _i < mockReferences_1.length; _i++) {
                    reference = mockReferences_1[_i];
                    this.routeReferences.set(reference.path, reference);
                }
                console.log("Found ".concat(this.routeReferences.size, " route references"));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get mock route references (replace with real file scanning)
     */
    RouteAnalyzer.prototype.getMockRouteReferences = function () {
        return [
            {
                path: '/dashboard',
                referencedIn: ['Navigation.tsx', 'Home.tsx'],
                lineNumbers: [45, 123],
                isNavigationTarget: true,
                isLinkTarget: true
            },
            {
                path: '/properties',
                referencedIn: ['Navigation.tsx', 'Dashboard.tsx'],
                lineNumbers: [52, 587],
                isNavigationTarget: true,
                isLinkTarget: true
            },
            {
                path: '/notifications',
                referencedIn: ['Dashboard.tsx', 'UserProfile.tsx'],
                lineNumbers: [471, 89],
                isNavigationTarget: true,
                isLinkTarget: false
            },
            {
                path: '/settings',
                referencedIn: ['Dashboard.tsx', 'Navigation.tsx'],
                lineNumbers: [478, 67],
                isNavigationTarget: true,
                isLinkTarget: true
            },
            {
                path: '/activity',
                referencedIn: ['Dashboard.tsx'],
                lineNumbers: [537],
                isNavigationTarget: true,
                isLinkTarget: false
            },
            {
                path: '/property/photos',
                referencedIn: ['Dashboard.tsx'],
                lineNumbers: [561],
                isNavigationTarget: true,
                isLinkTarget: false
            },
            {
                path: '/trust/basic-checks',
                referencedIn: ['Dashboard.tsx', 'Services.tsx'],
                lineNumbers: [569, 234],
                isNavigationTarget: true,
                isLinkTarget: true
            },
            {
                path: '/inbox',
                referencedIn: ['Dashboard.tsx', 'Navigation.tsx'],
                lineNumbers: [577, 78],
                isNavigationTarget: true,
                isLinkTarget: true
            }
        ];
    };
    /**
     * Compare defined routes with references to find mismatches
     */
    RouteAnalyzer.prototype.compareRoutesAndReferences = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, path, reference, _c, _d, _e, path, route, componentExists;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log('🔍 Comparing routes and references...');
                        // Find referenced routes that are not defined
                        for (_i = 0, _a = Array.from(this.routeReferences); _i < _a.length; _i++) {
                            _b = _a[_i], path = _b[0], reference = _b[1];
                            if (!this.definedRoutes.has(path) && !this.isParameterizedRoute(path)) {
                                this.routeMismatches.push({
                                    path: path,
                                    issue: 'missing_route',
                                    severity: reference.isNavigationTarget ? 'high' : 'medium',
                                    description: "Route \"".concat(path, "\" is referenced in ").concat(reference.referencedIn.join(', '), " but not defined in router"),
                                    suggestedFix: "Add route definition for \"".concat(path, "\" in router configuration")
                                });
                            }
                        }
                        _c = 0, _d = Array.from(this.definedRoutes);
                        _f.label = 1;
                    case 1:
                        if (!(_c < _d.length)) return [3 /*break*/, 4];
                        _e = _d[_c], path = _e[0], route = _e[1];
                        if (!(route.lazy && route.component)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.checkComponentExists(route.component)];
                    case 2:
                        componentExists = _f.sent();
                        if (!componentExists) {
                            this.routeMismatches.push({
                                path: path,
                                issue: 'missing_component',
                                severity: 'critical',
                                description: "Route \"".concat(path, "\" references component \"").concat(route.component, "\" which doesn't exist"),
                                suggestedFix: "Create component \"".concat(route.component, "\" or fix the component reference")
                            });
                        }
                        _f.label = 3;
                    case 3:
                        _c++;
                        return [3 /*break*/, 1];
                    case 4:
                        console.log("Found ".concat(this.routeMismatches.length, " route mismatches"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a path matches a parameterized route
     */
    RouteAnalyzer.prototype.isParameterizedRoute = function (path) {
        for (var _i = 0, _a = Array.from(this.definedRoutes.keys()); _i < _a.length; _i++) {
            var definedPath = _a[_i];
            if (this.matchesParameterizedPath(path, definedPath)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Check if a path matches a parameterized route pattern
     */
    RouteAnalyzer.prototype.matchesParameterizedPath = function (path, pattern) {
        // Simple pattern matching for :param style routes
        var patternRegex = pattern.replace(/:[\w]+/g, '[^/]+');
        var regex = new RegExp("^".concat(patternRegex, "$"));
        return regex.test(path);
    };
    /**
     * Check if a component exists (mock implementation)
     */
    RouteAnalyzer.prototype.checkComponentExists = function (componentName) {
        return __awaiter(this, void 0, void 0, function () {
            var missingComponents;
            return __generator(this, function (_a) {
                missingComponents = ['NotificationPage', 'SettingsPage', 'ActivityPage'];
                return [2 /*return*/, !missingComponents.includes(componentName)];
            });
        });
    };
    /**
     * Validate all routes by attempting to load them
     */
    RouteAnalyzer.prototype.validateAllRoutes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, _a, _b, path, route, result, _c, _d, _e, path, reference;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log('🔍 Validating all routes...');
                        results = [];
                        _i = 0, _a = Array.from(this.definedRoutes);
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], path = _b[0], route = _b[1];
                        return [4 /*yield*/, this.validateSingleRoute(path, route)];
                    case 2:
                        result = _f.sent();
                        results.push(result);
                        _f.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Also validate referenced routes that aren't defined
                        for (_c = 0, _d = Array.from(this.routeReferences); _c < _d.length; _c++) {
                            _e = _d[_c], path = _e[0], reference = _e[1];
                            if (!this.definedRoutes.has(path) && !this.isParameterizedRoute(path)) {
                                results.push({
                                    path: path,
                                    status: '404'
                                });
                            }
                        }
                        console.log("Validated ".concat(results.length, " routes"));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Validate a single route
     */
    RouteAnalyzer.prototype.validateSingleRoute = function (path, route) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, componentExists, lazyLoadWorks, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!route.component) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.checkComponentExists(route.component)];
                    case 2:
                        componentExists = _a.sent();
                        if (!componentExists) {
                            return [2 /*return*/, {
                                    path: path,
                                    status: 'broken',
                                    component: route.component || 'Unknown',
                                    errorMessage: "Component ".concat(route.component, " not found"),
                                    responseTime: Date.now() - startTime
                                }];
                        }
                        _a.label = 3;
                    case 3:
                        if (!route.lazy) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.checkLazyLoading(route.component || path)];
                    case 4:
                        lazyLoadWorks = _a.sent();
                        if (!lazyLoadWorks) {
                            return [2 /*return*/, {
                                    path: path,
                                    status: 'broken',
                                    component: route.component || 'Unknown',
                                    errorMessage: 'Lazy loading failed',
                                    responseTime: Date.now() - startTime
                                }];
                        }
                        _a.label = 5;
                    case 5: return [2 /*return*/, {
                            path: path,
                            status: 'working',
                            component: route.component || 'Unknown',
                            responseTime: Date.now() - startTime
                        }];
                    case 6:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                path: path,
                                status: 'broken',
                                component: route.component || 'Unknown',
                                errorMessage: error_2 instanceof Error ? error_2.message : 'Unknown error',
                                responseTime: Date.now() - startTime
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if lazy loading works for a component
     */
    RouteAnalyzer.prototype.checkLazyLoading = function (componentName) {
        return __awaiter(this, void 0, void 0, function () {
            var failingLazyLoads;
            return __generator(this, function (_a) {
                failingLazyLoads = ['NotificationPage', 'SettingsPage'];
                return [2 /*return*/, !failingLazyLoads.includes(componentName)];
            });
        });
    };
    /**
     * Get route analysis summary
     */
    RouteAnalyzer.prototype.getAnalysisSummary = function () {
        var missingRoutes = this.routeMismatches.filter(function (m) { return m.issue === 'missing_route'; }).length;
        var brokenRoutes = this.routeMismatches.filter(function (m) { return m.issue === 'missing_component' || m.issue === 'broken_lazy_load'; }).length;
        var criticalIssues = this.routeMismatches.filter(function (m) { return m.severity === 'critical'; }).length;
        return {
            totalDefinedRoutes: this.definedRoutes.size,
            totalReferencedRoutes: this.routeReferences.size,
            missingRoutes: missingRoutes,
            brokenRoutes: brokenRoutes,
            criticalIssues: criticalIssues
        };
    };
    /**
     * Get detailed mismatch report
     */
    RouteAnalyzer.prototype.getMismatchReport = function () {
        return this.routeMismatches.sort(function (a, b) {
            var severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    };
    return RouteAnalyzer;
}());
exports.RouteAnalyzer = RouteAnalyzer;
// Export singleton instance
exports.routeAnalyzer = new RouteAnalyzer();
