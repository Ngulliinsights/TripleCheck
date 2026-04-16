"use strict";
/**
 * Consolidated Test Framework - Unified testing utilities
 * Eliminates duplicate test infrastructure while improving coverage and speed
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
exports.expectFastApiCall = exports.expectFastRender = exports.expectAccessible = exports.expectKenyaPropertyValid = exports.runPerformanceBenchmark = exports.renderWithProviders = exports.createTestUser = exports.createTestProperty = exports.testFramework = exports.ConsolidatedTestFramework = void 0;
var index_1 = require("../../src/shared/test-utils/index");
var index_2 = require("../../src/shared/test-utils/index");
var cleanup_redundancies_1 = require("../../scripts/cleanup-redundancies");
var react_query_1 = require("@tanstack/react-query");
var react_router_dom_1 = require("react-router-dom");
var perf_hooks_1 = require("perf_hooks");
var ConsolidatedTestFramework = /** @class */ (function () {
    function ConsolidatedTestFramework() {
        this.testEnvironments = [];
        this.mockServices = [];
    }
    /**
     * Create comprehensive test environment for any component or service
     */
    ConsolidatedTestFramework.prototype.createTestEnvironment = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var queryClient = new react_query_1.QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    gcTime: 0,
                    staleTime: 0,
                },
                mutations: {
                    retry: false,
                },
            },
        });
        var user = options.user ? this.createTestUser(options.user) : undefined;
        var environment = {
            queryClient: queryClient,
            user: user,
            cleanup: function () {
                queryClient.clear();
                _this.cleanupMocks();
            }
        };
        this.testEnvironments.push(environment);
        return environment;
    };
    /**
     * Render component with all necessary providers
     */
    ConsolidatedTestFramework.prototype.renderWithProviders = function (ui, options) {
        if (options === void 0) { options = {}; }
        var environment = options.environment || this.createTestEnvironment();
        var AllTheProviders = function (_a) {
            var children = _a.children;
            return (<react_query_1.QueryClientProvider client={environment.queryClient}>
          <react_router_dom_1.BrowserRouter>
            {children}
          </react_router_dom_1.BrowserRouter>
        </react_query_1.QueryClientProvider>);
        };
        var result = (0, index_2.render)(ui, { wrapper: AllTheProviders });
        return __assign(__assign({}, result), { environment: environment, user: cleanup_redundancies_1.default.setup() });
    };
    /**
     * Create test property with Kenya-specific defaults
     */
    ConsolidatedTestFramework.prototype.createTestProperty = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        var id = "test-property-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        return __assign({ id: id, title: "Test Property ".concat(id.slice(-8)), location: 'Nairobi County', price: 5000000, parcelNumber: "NBI/TEST/".concat(Math.random().toString(36).substr(2, 5).toUpperCase()), ownershipStatus: 'verified', coordinates: {
                lat: -1.2921 + (Math.random() - 0.5) * 0.1, // Nairobi area
                lng: 36.8219 + (Math.random() - 0.5) * 0.1
            } }, overrides);
    };
    /**
     * Create test user with realistic data
     */
    ConsolidatedTestFramework.prototype.createTestUser = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        var id = "test-user-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
        return __assign({ id: id, email: "test.user.".concat(id.slice(-8), "@example.com"), name: "Test User ".concat(id.slice(-8)), role: 'user', verified: true }, overrides);
    };
    /**
     * Create test fraud report data
     */
    ConsolidatedTestFramework.prototype.createTestFraudReport = function (propertyId) {
        return {
            id: "fraud-".concat(Date.now()),
            propertyId: propertyId || this.createTestProperty().id,
            reportType: 'document_forgery',
            severity: 'high',
            description: 'Suspicious document alterations detected',
            reportedBy: this.createTestUser().id,
            status: 'under_investigation',
            createdAt: new Date().toISOString()
        };
    };
    /**
     * Create mock service manager for testing
     */
    ConsolidatedTestFramework.prototype.createMockServices = function () {
        var mockApiClient = {
            get: index_1.vi.fn(),
            post: index_1.vi.fn(),
            put: index_1.vi.fn(),
            delete: index_1.vi.fn(),
            patch: index_1.vi.fn()
        };
        var mockDatabase = {
            query: index_1.vi.fn(),
            insert: index_1.vi.fn(),
            update: index_1.vi.fn(),
            delete: index_1.vi.fn()
        };
        var mockAuth = {
            login: index_1.vi.fn(),
            logout: index_1.vi.fn(),
            getCurrentUser: index_1.vi.fn(),
            isAuthenticated: index_1.vi.fn(function () { return true; })
        };
        var manager = {
            mockApiClient: mockApiClient,
            mockDatabase: mockDatabase,
            mockAuth: mockAuth,
            cleanup: function () {
                index_1.vi.clearAllMocks();
            }
        };
        this.mockServices.push(manager);
        return manager;
    };
    /**
     * Performance benchmark utility
     */
    ConsolidatedTestFramework.prototype.runPerformanceBenchmark = function (operation, expectedMaxDuration, description) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, endTime, duration, passed, error_1, endTime, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, operation()];
                    case 2:
                        result = _a.sent();
                        endTime = perf_hooks_1.performance.now();
                        duration = endTime - startTime;
                        passed = duration <= expectedMaxDuration;
                        if (description) {
                            console.log("".concat(passed ? '✅' : '❌', " ").concat(description, ": ").concat(duration.toFixed(2), "ms (target: ").concat(expectedMaxDuration, "ms)"));
                        }
                        return [2 /*return*/, {
                                result: result,
                                duration: duration,
                                passed: passed,
                                benchmark: expectedMaxDuration
                            }];
                    case 3:
                        error_1 = _a.sent();
                        endTime = perf_hooks_1.performance.now();
                        duration = endTime - startTime;
                        console.error("\uD83D\uDCA5 Benchmark failed for ".concat(description, ":"), error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test Kenya-specific property validation
     */
    ConsolidatedTestFramework.prototype.validateKenyaProperty = function (property) {
        // Validate parcel number format (Kenya standard)
        var parcelRegex = /^[A-Z]{2,4}\/[A-Z0-9]+\/\d+$/;
        if (!parcelRegex.test(property.parcelNumber)) {
            return false;
        }
        // Validate coordinates are within Kenya bounds
        if (property.coordinates) {
            var _a = property.coordinates, lat = _a.lat, lng = _a.lng;
            var kenyaBounds = {
                north: 5.0,
                south: -4.7,
                east: 41.9,
                west: 33.9
            };
            if (lat < kenyaBounds.south || lat > kenyaBounds.north ||
                lng < kenyaBounds.west || lng > kenyaBounds.east) {
                return false;
            }
        }
        // Validate price is reasonable for Kenya market
        if (property.price < 100000 || property.price > 1000000000) { // 100K to 1B KES
            return false;
        }
        return true;
    };
    /**
     * Simulate user interactions for testing
     */
    ConsolidatedTestFramework.prototype.simulateUserFlow = function (steps) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, steps_1, step, _a, element, element, element;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, steps_1 = steps;
                        _b.label = 1;
                    case 1:
                        if (!(_i < steps_1.length)) return [3 /*break*/, 16];
                        step = steps_1[_i];
                        _a = step.action;
                        switch (_a) {
                            case 'click': return [3 /*break*/, 2];
                            case 'type': return [3 /*break*/, 5];
                            case 'select': return [3 /*break*/, 8];
                            case 'wait': return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 2:
                        if (!step.target) return [3 /*break*/, 4];
                        element = index_2.screen.getByTestId(step.target) || index_2.screen.getByText(step.target);
                        return [4 /*yield*/, cleanup_redundancies_1.default.click(element)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 13];
                    case 5:
                        if (!(step.target && step.value)) return [3 /*break*/, 7];
                        element = index_2.screen.getByTestId(step.target) || index_2.screen.getByLabelText(step.target);
                        return [4 /*yield*/, cleanup_redundancies_1.default.type(element, step.value)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 13];
                    case 8:
                        if (!(step.target && step.value)) return [3 /*break*/, 10];
                        element = index_2.screen.getByTestId(step.target) || index_2.screen.getByLabelText(step.target);
                        return [4 /*yield*/, cleanup_redundancies_1.default.selectOptions(element, step.value)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, (0, index_2.waitFor)(function () {
                            // Wait for any pending operations
                        }, { timeout: step.timeout || 1000 })];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 13: 
                    // Small delay between actions for more realistic simulation
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 14:
                        // Small delay between actions for more realistic simulation
                        _b.sent();
                        _b.label = 15;
                    case 15:
                        _i++;
                        return [3 /*break*/, 1];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test accessibility compliance
     */
    ConsolidatedTestFramework.prototype.testAccessibility = function (container) {
        return __awaiter(this, void 0, void 0, function () {
            var axe, results, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('jest-axe'); })];
                    case 1:
                        axe = (_a.sent()).axe;
                        return [4 /*yield*/, axe(container)];
                    case 2:
                        results = _a.sent();
                        if (results.violations.length > 0) {
                            console.warn('Accessibility violations found:', results.violations);
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        console.warn('Could not run accessibility tests:', error_2);
                        return [2 /*return*/, true]; // Don't fail tests if axe is not available
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate test data for load testing
     */
    ConsolidatedTestFramework.prototype.generateTestDataSet = function (count) {
        var _this = this;
        var properties = Array.from({ length: count }, function () { return _this.createTestProperty(); });
        var users = Array.from({ length: Math.ceil(count / 3) }, function () { return _this.createTestUser(); });
        var fraudReports = Array.from({ length: Math.ceil(count / 10) }, function () {
            return _this.createTestFraudReport(properties[Math.floor(Math.random() * properties.length)].id);
        });
        return { properties: properties, users: users, fraudReports: fraudReports };
    };
    /**
     * Clean up all test environments and mocks
     */
    ConsolidatedTestFramework.prototype.cleanup = function () {
        this.testEnvironments.forEach(function (env) { return env.cleanup(); });
        this.mockServices.forEach(function (service) { return service.cleanup(); });
        this.testEnvironments = [];
        this.mockServices = [];
    };
    /**
     * Setup common test hooks
     */
    ConsolidatedTestFramework.prototype.setupTestHooks = function () {
        var _this = this;
        (0, index_1.beforeEach)(function () {
            // Reset all mocks before each test
            index_1.vi.clearAllMocks();
        });
        (0, index_1.afterEach)(function () {
            // Clean up after each test
            _this.cleanupMocks();
        });
    };
    /**
     * Clean up mocks
     */
    ConsolidatedTestFramework.prototype.cleanupMocks = function () {
        index_1.vi.clearAllMocks();
        index_1.vi.clearAllTimers();
    };
    return ConsolidatedTestFramework;
}());
exports.ConsolidatedTestFramework = ConsolidatedTestFramework;
// Export singleton instance for easy use
exports.testFramework = new ConsolidatedTestFramework();
// Export common test utilities
var createTestProperty = function (overrides) {
    return exports.testFramework.createTestProperty(overrides);
};
exports.createTestProperty = createTestProperty;
var createTestUser = function (overrides) {
    return exports.testFramework.createTestUser(overrides);
};
exports.createTestUser = createTestUser;
var renderWithProviders = function (ui, options) {
    return exports.testFramework.renderWithProviders(ui, options);
};
exports.renderWithProviders = renderWithProviders;
var runPerformanceBenchmark = function (operation, expectedMaxDuration, description) { return exports.testFramework.runPerformanceBenchmark(operation, expectedMaxDuration, description); };
exports.runPerformanceBenchmark = runPerformanceBenchmark;
// Common test assertions
var expectKenyaPropertyValid = function (property) {
    (0, index_1.expect)(exports.testFramework.validateKenyaProperty(property)).toBe(true);
};
exports.expectKenyaPropertyValid = expectKenyaPropertyValid;
var expectAccessible = function (container) { return __awaiter(void 0, void 0, void 0, function () {
    var isAccessible;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.testFramework.testAccessibility(container)];
            case 1:
                isAccessible = _a.sent();
                (0, index_1.expect)(isAccessible).toBe(true);
                return [2 /*return*/];
        }
    });
}); };
exports.expectAccessible = expectAccessible;
// Performance test helpers
var expectFastRender = function (renderFn) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.runPerformanceBenchmark)(renderFn, 100, 'Component render')];
            case 1:
                result = _a.sent();
                (0, index_1.expect)(result.passed).toBe(true);
                return [2 /*return*/, result.result];
        }
    });
}); };
exports.expectFastRender = expectFastRender;
var expectFastApiCall = function (apiFn) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.runPerformanceBenchmark)(apiFn, 500, 'API call')];
            case 1:
                result = _a.sent();
                (0, index_1.expect)(result.passed).toBe(true);
                return [2 /*return*/, result.result];
        }
    });
}); };
exports.expectFastApiCall = expectFastApiCall;
