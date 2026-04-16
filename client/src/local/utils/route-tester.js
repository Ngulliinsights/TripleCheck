"use strict";
/**
 * Route Validation and Testing System
 * Provides automated testing for all application routes
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
exports.routeTester = exports.RouteTester = void 0;
var route_validator_1 = require("./route-validator");
var RouteTester = /** @class */ (function () {
    function RouteTester() {
        this.testResults = [];
    }
    RouteTester.getInstance = function () {
        if (!RouteTester.instance) {
            RouteTester.instance = new RouteTester();
        }
        return RouteTester.instance;
    };
    /**
     * Test all application routes
     */
    RouteTester.prototype.testAllRoutes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, routes, results, _i, routes_1, route, result, status_1, executionTime, passedRoutes, failedRoutes, testSuite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        routes = route_validator_1.routeValidator.getAllValidRoutes();
                        results = [];
                        console.log("\uD83E\uDDEA Testing ".concat(routes.length, " application routes..."));
                        _i = 0, routes_1 = routes;
                        _a.label = 1;
                    case 1:
                        if (!(_i < routes_1.length)) return [3 /*break*/, 4];
                        route = routes_1[_i];
                        return [4 /*yield*/, this.testRoute(route)];
                    case 2:
                        result = _a.sent();
                        results.push(result);
                        // Log progress
                        if (process.env.NODE_ENV === "development") {
                            status_1 = result.isValid && result.componentExists ? '✅' : '❌';
                            // eslint-disable-next-line no-console
                            console.log("".concat(status_1, " ").concat(route, " ").concat(result.error ? "- ".concat(result.error) : ''));
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        executionTime = Date.now() - startTime;
                        passedRoutes = results.filter(function (r) { return r.isValid && r.componentExists; }).length;
                        failedRoutes = results.length - passedRoutes;
                        testSuite = {
                            totalRoutes: routes.length,
                            passedRoutes: passedRoutes,
                            failedRoutes: failedRoutes,
                            results: results,
                            executionTime: executionTime,
                        };
                        this.testResults = results;
                        this.logTestSummary(testSuite);
                        return [2 /*return*/, testSuite];
                }
            });
        });
    };
    /**
     * Test a specific route
     */
    RouteTester.prototype.testRoute = function (route) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, validation, testRoute, _a, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        result = {
                            route: route,
                            isValid: false,
                            componentExists: false,
                            warnings: [],
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        validation = route_validator_1.routeValidator.validateRoute(route);
                        result.isValid = validation.isValid;
                        result.warnings = validation.warnings;
                        if (!validation.isValid) {
                            result.error = validation.errors.join(', ');
                            return [2 /*return*/, result];
                        }
                        if (!route.includes(':')) return [3 /*break*/, 3];
                        testRoute = route.replace(/:id/g, 'test-id').replace(/:([^/]+)/g, 'test-param');
                        _a = result;
                        return [4 /*yield*/, this.testComponentLoading(testRoute)];
                    case 2:
                        _a.componentExists = _c.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        _b = result;
                        return [4 /*yield*/, this.testComponentLoading(route)];
                    case 4:
                        _b.componentExists = _c.sent();
                        _c.label = 5;
                    case 5:
                        result.loadTime = Date.now() - startTime;
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _c.sent();
                        result.error = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        result.componentExists = false;
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Test component loading for a route
     */
    RouteTester.prototype.testComponentLoading = function (route) {
        return __awaiter(this, void 0, void 0, function () {
            var testUrl, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        testUrl = "".concat(window.location.origin).concat(route);
                        return [4 /*yield*/, fetch(testUrl, {
                                method: 'HEAD',
                                signal: AbortSignal.timeout(5000) // 5 second timeout
                            })];
                    case 1:
                        response = _a.sent();
                        // Consider 200, 404 (handled by React Router), and 304 as valid
                        return [2 /*return*/, response.status === 200 || response.status === 404 || response.status === 304];
                    case 2:
                        error_2 = _a.sent();
                        // Network errors or timeouts indicate potential issues
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test route parameters validation
     */
    RouteTester.prototype.testRouteParameters = function () {
        var parameterizedRoutes = route_validator_1.routeValidator.getAllValidRoutes().filter(function (route) { return route.includes(':'); });
        var results = [];
        for (var _i = 0, parameterizedRoutes_1 = parameterizedRoutes; _i < parameterizedRoutes_1.length; _i++) {
            var route = parameterizedRoutes_1[_i];
            var paramTests = [];
            // Test valid parameters
            if (route.includes(':id')) {
                var validParams = { id: 'valid-id-123' };
                var validation = route_validator_1.routeValidator.validateRouteParams(validParams, ['id']);
                paramTests.push({
                    params: validParams,
                    isValid: validation.isValid,
                    errors: validation.errors,
                });
                // Test invalid parameters
                var invalidParams = { id: '<script>alert("xss")</script>' };
                var invalidValidation = route_validator_1.routeValidator.validateRouteParams(invalidParams, ['id']);
                paramTests.push({
                    params: invalidParams,
                    isValid: invalidValidation.isValid,
                    errors: invalidValidation.errors,
                });
                // Test missing parameters
                var missingValidation = route_validator_1.routeValidator.validateRouteParams({}, ['id']);
                paramTests.push({
                    params: {},
                    isValid: missingValidation.isValid,
                    errors: missingValidation.errors,
                });
            }
            results.push({ route: route, paramTests: paramTests });
        }
        return results;
    };
    /**
     * Test route performance
     */
    RouteTester.prototype.testRoutePerformance = function (routes) {
        return __awaiter(this, void 0, void 0, function () {
            var testRoutes, results, _loop_1, _i, testRoutes_1, route;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testRoutes = routes || route_validator_1.routeValidator.getAllValidRoutes().slice(0, 10);
                        results = [];
                        _loop_1 = function (route) {
                            var startTime, testUrl, controller_1, timeoutId, loadTime, error_3, loadTime;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        startTime = Date.now();
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        testUrl = "".concat(window.location.origin).concat(route);
                                        controller_1 = new AbortController();
                                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 10000);
                                        return [4 /*yield*/, fetch(testUrl, {
                                                method: 'HEAD',
                                                signal: controller_1.signal
                                            })];
                                    case 2:
                                        _b.sent();
                                        clearTimeout(timeoutId);
                                        loadTime = Date.now() - startTime;
                                        results.push({
                                            route: route,
                                            loadTime: loadTime,
                                            status: loadTime < 1000 ? 'fast' : loadTime < 3000 ? 'slow' : 'timeout'
                                        });
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_3 = _b.sent();
                                        loadTime = Date.now() - startTime;
                                        results.push({
                                            route: route,
                                            loadTime: loadTime,
                                            status: 'timeout'
                                        });
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, testRoutes_1 = testRoutes;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testRoutes_1.length)) return [3 /*break*/, 4];
                        route = testRoutes_1[_i];
                        return [5 /*yield**/, _loop_1(route)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Generate a comprehensive route test report
     */
    RouteTester.prototype.generateTestReport = function () {
        if (this.testResults.length === 0) {
            return "No test results available. Run testAllRoutes() first.";
        }
        var passed = this.testResults.filter(function (r) { return r.isValid && r.componentExists; });
        var failed = this.testResults.filter(function (r) { return !r.isValid || !r.componentExists; });
        var warnings = this.testResults.filter(function (r) { return r.warnings.length > 0; });
        var report = "# Route Test Report\n\n";
        report += "Generated: ".concat(new Date().toISOString(), "\n\n");
        report += "## Summary\n";
        report += "- Total Routes: ".concat(this.testResults.length, "\n");
        report += "- Passed: ".concat(passed.length, "\n");
        report += "- Failed: ".concat(failed.length, "\n");
        report += "- Success Rate: ".concat(((passed.length / this.testResults.length) * 100).toFixed(1), "%\n\n");
        if (failed.length > 0) {
            report += "## Failed Routes\n";
            failed.forEach(function (result) {
                report += "- **".concat(result.route, "**: ").concat(result.error || 'Component loading failed', "\n");
            });
            report += "\n";
        }
        if (warnings.length > 0) {
            report += "## Routes with Warnings\n";
            warnings.forEach(function (result) {
                report += "- **".concat(result.route, "**: ").concat(result.warnings.join(', '), "\n");
            });
            report += "\n";
        }
        report += "## Performance Analysis\n";
        var avgLoadTime = this.testResults
            .filter(function (r) { return r.loadTime !== undefined; })
            .reduce(function (sum, r) { return sum + (r.loadTime || 0); }, 0) / this.testResults.length;
        report += "- Average Load Time: ".concat(avgLoadTime.toFixed(0), "ms\n");
        var slowRoutes = this.testResults
            .filter(function (r) { return r.loadTime && r.loadTime > 2000; })
            .sort(function (a, b) { return (b.loadTime || 0) - (a.loadTime || 0); });
        if (slowRoutes.length > 0) {
            report += "- Slow Routes (>2s):\n";
            slowRoutes.slice(0, 5).forEach(function (result) {
                report += "  - ".concat(result.route, ": ").concat(result.loadTime, "ms\n");
            });
        }
        return report;
    };
    /**
     * Log test summary to console
     */
    RouteTester.prototype.logTestSummary = function (testSuite) {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log('\n📊 Route Test Summary:');
            // eslint-disable-next-line no-console
            console.log("\u2705 Passed: ".concat(testSuite.passedRoutes, "/").concat(testSuite.totalRoutes));
            // eslint-disable-next-line no-console
            console.log("\u274C Failed: ".concat(testSuite.failedRoutes, "/").concat(testSuite.totalRoutes));
            // eslint-disable-next-line no-console
            console.log("\u23F1\uFE0F  Execution Time: ".concat(testSuite.executionTime, "ms"));
            if (testSuite.failedRoutes > 0) {
                // eslint-disable-next-line no-console
                console.log('\n❌ Failed Routes:');
                testSuite.results
                    .filter(function (r) { return !r.isValid || !r.componentExists; })
                    .forEach(function (result) {
                    // eslint-disable-next-line no-console
                    console.log("  - ".concat(result.route, ": ").concat(result.error || 'Component loading failed'));
                });
            }
        }
    };
    /**
     * Get test results
     */
    RouteTester.prototype.getTestResults = function () {
        return this.testResults;
    };
    /**
     * Clear test results
     */
    RouteTester.prototype.clearTestResults = function () {
        this.testResults = [];
    };
    return RouteTester;
}());
exports.RouteTester = RouteTester;
// Export singleton instance
exports.routeTester = RouteTester.getInstance();
// Development utilities
if (process.env.NODE_ENV === "development") {
    // Make route tester available globally for debugging
    window.routeTester = exports.routeTester;
    // Auto-run route tests on page load (with delay to avoid blocking)
    setTimeout(function () {
        exports.routeTester.testAllRoutes().catch(function (error) {
            // eslint-disable-next-line no-console
            console.warn('Route testing failed:', error);
        });
    }, 5000); // Wait 5 seconds after page load
}
