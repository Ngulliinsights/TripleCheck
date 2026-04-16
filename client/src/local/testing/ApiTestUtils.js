"use strict";
/**
 * API Testing Utilities
 * Utilities for testing API endpoints and integrations
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
exports.IntegrationTestRunner = exports.LoadTester = exports.createApiTestScenarios = exports.MockApiServer = exports.ApiTester = void 0;
var index_1 = require("../test-utils/index");
var ApiTester = /** @class */ (function () {
    function ApiTester(config) {
        if (config === void 0) { config = {}; }
        this.config = {
            baseUrl: config.baseUrl || 'http://localhost:3000/api',
            timeout: config.timeout || 5000,
            retries: config.retries || 3,
            headers: __assign({ 'Content-Type': 'application/json' }, config.headers),
        };
    }
    /**
     * Test API endpoint
     */
    ApiTester.prototype.testEndpoint = function (method_1, endpoint_1, data_1) {
        return __awaiter(this, arguments, void 0, function (method, endpoint, data, expectedStatus) {
            var startTime, url, response, responseTime, responseData, error_1, responseTime;
            if (expectedStatus === void 0) { expectedStatus = 200; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        url = "".concat(this.config.baseUrl).concat(endpoint);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(url, {
                                method: method.toUpperCase(),
                                headers: this.config.headers,
                                body: data ? JSON.stringify(data) : undefined,
                                signal: AbortSignal.timeout(this.config.timeout),
                            })];
                    case 2:
                        response = _a.sent();
                        responseTime = Date.now() - startTime;
                        return [4 /*yield*/, response.json().catch(function () { return null; })];
                    case 3:
                        responseData = _a.sent();
                        return [2 /*return*/, {
                                success: response.status === expectedStatus,
                                status: response.status,
                                data: responseData,
                                responseTime: responseTime,
                                error: response.ok ? undefined : response.statusText,
                            }];
                    case 4:
                        error_1 = _a.sent();
                        responseTime = Date.now() - startTime;
                        return [2 /*return*/, {
                                success: false,
                                status: 0,
                                responseTime: responseTime,
                                error: error_1.message,
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test multiple endpoints
     */
    ApiTester.prototype.testEndpoints = function (tests) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, tests_1, test, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = {};
                        _i = 0, tests_1 = tests;
                        _c.label = 1;
                    case 1:
                        if (!(_i < tests_1.length)) return [3 /*break*/, 4];
                        test = tests_1[_i];
                        _a = results;
                        _b = test.name;
                        return [4 /*yield*/, this.testEndpoint(test.method, test.endpoint, test.data, test.expectedStatus)];
                    case 2:
                        _a[_b] = _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Test endpoint with retries
     */
    ApiTester.prototype.testEndpointWithRetries = function (method_1, endpoint_1, data_1) {
        return __awaiter(this, arguments, void 0, function (method, endpoint, data, expectedStatus) {
            var lastResult, _loop_1, this_1, attempt, state_1;
            if (expectedStatus === void 0) { expectedStatus = 200; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastResult = null;
                        _loop_1 = function (attempt) {
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, this_1.testEndpoint(method, endpoint, data, expectedStatus)];
                                    case 1:
                                        lastResult = _b.sent();
                                        if (lastResult.success) {
                                            return [2 /*return*/, { value: lastResult }];
                                        }
                                        if (!(attempt < this_1.config.retries)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000 * attempt); })];
                                    case 2:
                                        _b.sent();
                                        _b.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= this.config.retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, lastResult];
                }
            });
        });
    };
    /**
     * Test endpoint performance
     */
    ApiTester.prototype.testEndpointPerformance = function (method_1, endpoint_1) {
        return __awaiter(this, arguments, void 0, function (method, endpoint, iterations, data) {
            var results, i, result, responseTimes, successCount;
            if (iterations === void 0) { iterations = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < iterations)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.testEndpoint(method, endpoint, data)];
                    case 2:
                        result = _a.sent();
                        results.push(result);
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        responseTimes = results.map(function (r) { return r.responseTime; });
                        successCount = results.filter(function (r) { return r.success; }).length;
                        return [2 /*return*/, {
                                averageResponseTime: responseTimes.reduce(function (a, b) { return a + b; }, 0) / responseTimes.length,
                                minResponseTime: Math.min.apply(Math, responseTimes),
                                maxResponseTime: Math.max.apply(Math, responseTimes),
                                successRate: (successCount / results.length) * 100,
                                results: results,
                            }];
                }
            });
        });
    };
    return ApiTester;
}());
exports.ApiTester = ApiTester;
/**
 * Mock API server for testing
 */
var MockApiServer = /** @class */ (function () {
    function MockApiServer() {
        this.routes = new Map();
        this.middleware = [];
    }
    /**
     * Add route handler
     */
    MockApiServer.prototype.addRoute = function (method, path, handler) {
        var key = "".concat(method.toUpperCase(), " ").concat(path);
        this.routes.set(key, handler);
    };
    /**
     * Add middleware
     */
    MockApiServer.prototype.addMiddleware = function (middleware) {
        this.middleware.push(middleware);
    };
    /**
     * Mock fetch to use this server
     */
    MockApiServer.prototype.mockFetch = function () {
        var _this = this;
        global.fetch = index_1.vi.fn().mockImplementation(function (url_1) {
            var args_1 = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args_1[_i - 1] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([url_1], args_1, true), void 0, function (url, options) {
                var method, path, key, req, res, _loop_2, _a, _b, mw, state_2, handler, _c, error_2;
                var _this = this;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            method = options.method || 'GET';
                            path = new URL(url).pathname;
                            key = "".concat(method.toUpperCase(), " ").concat(path);
                            req = {
                                method: method,
                                url: url,
                                path: path,
                                headers: options.headers || {},
                                body: options.body ? JSON.parse(options.body) : null,
                            };
                            res = {
                                status: 200,
                                statusText: 'OK',
                                headers: {},
                                data: null,
                            };
                            _loop_2 = function (mw) {
                                var nextCalled = false;
                                mw(req, res, function () { nextCalled = true; });
                                if (!nextCalled)
                                    return "break";
                            };
                            // Run middleware
                            for (_a = 0, _b = this.middleware; _a < _b.length; _a++) {
                                mw = _b[_a];
                                state_2 = _loop_2(mw);
                                if (state_2 === "break")
                                    break;
                            }
                            handler = this.routes.get(key);
                            if (!handler) return [3 /*break*/, 5];
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            _c = res;
                            return [4 /*yield*/, handler(req)];
                        case 2:
                            _c.data = _d.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            error_2 = _d.sent();
                            res.status = 500;
                            res.statusText = 'Internal Server Error';
                            res.data = { error: error_2.message };
                            return [3 /*break*/, 4];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            res.status = 404;
                            res.statusText = 'Not Found';
                            res.data = { error: 'Route not found' };
                            _d.label = 6;
                        case 6: 
                        // Return mock response
                        return [2 /*return*/, {
                                ok: res.status >= 200 && res.status < 300,
                                status: res.status,
                                statusText: res.statusText,
                                headers: new Headers(res.headers),
                                json: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    return [2 /*return*/, res.data];
                                }); }); },
                                text: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    return [2 /*return*/, JSON.stringify(res.data)];
                                }); }); },
                            }];
                    }
                });
            });
        });
    };
    /**
     * Reset all routes and middleware
     */
    MockApiServer.prototype.reset = function () {
        this.routes.clear();
        this.middleware = [];
    };
    return MockApiServer;
}());
exports.MockApiServer = MockApiServer;
/**
 * API test scenarios
 */
var createApiTestScenarios = function () {
    var scenarios = {
        // Authentication tests
        auth: [
            {
                name: 'login_success',
                method: 'POST',
                endpoint: '/auth/login',
                data: { email: 'test@example.com', password: 'password123' },
                expectedStatus: 200,
            },
            {
                name: 'login_invalid_credentials',
                method: 'POST',
                endpoint: '/auth/login',
                data: { email: 'test@example.com', password: 'wrongpassword' },
                expectedStatus: 401,
            },
            {
                name: 'refresh_token',
                method: 'POST',
                endpoint: '/auth/refresh',
                data: { refreshToken: 'valid-refresh-token' },
                expectedStatus: 200,
            },
        ],
        // User management tests
        users: [
            {
                name: 'get_user_profile',
                method: 'GET',
                endpoint: '/users/profile',
                expectedStatus: 200,
            },
            {
                name: 'update_user_profile',
                method: 'PUT',
                endpoint: '/users/profile',
                data: { firstName: 'John', lastName: 'Doe' },
                expectedStatus: 200,
            },
            {
                name: 'change_password',
                method: 'POST',
                endpoint: '/users/change-password',
                data: { currentPassword: 'old', newPassword: 'new' },
                expectedStatus: 200,
            },
        ],
        // Property tests
        properties: [
            {
                name: 'get_properties',
                method: 'GET',
                endpoint: '/properties',
                expectedStatus: 200,
            },
            {
                name: 'get_property_by_id',
                method: 'GET',
                endpoint: '/properties/123',
                expectedStatus: 200,
            },
            {
                name: 'create_property',
                method: 'POST',
                endpoint: '/properties',
                data: {
                    title: 'Test Property',
                    price: 100000,
                    address: '123 Test St',
                },
                expectedStatus: 201,
            },
            {
                name: 'search_properties',
                method: 'GET',
                endpoint: '/properties/search?q=test&minPrice=50000&maxPrice=200000',
                expectedStatus: 200,
            },
        ],
        // Messaging tests
        messaging: [
            {
                name: 'get_threads',
                method: 'GET',
                endpoint: '/messaging/threads',
                expectedStatus: 200,
            },
            {
                name: 'create_thread',
                method: 'POST',
                endpoint: '/messaging/threads',
                data: {
                    participantIds: ['user-456'],
                    subject: 'Test Thread',
                    threadType: 'direct_message',
                },
                expectedStatus: 201,
            },
            {
                name: 'send_message',
                method: 'POST',
                endpoint: '/messaging/threads/123/messages',
                data: {
                    content: 'Hello, this is a test message',
                    messageType: 'text',
                },
                expectedStatus: 201,
            },
        ],
        // Health check tests
        health: [
            {
                name: 'health_check',
                method: 'GET',
                endpoint: '/health',
                expectedStatus: 200,
            },
            {
                name: 'auth_health',
                method: 'GET',
                endpoint: '/auth/health',
                expectedStatus: 200,
            },
            {
                name: 'database_health',
                method: 'GET',
                endpoint: '/health/database',
                expectedStatus: 200,
            },
        ],
    };
    return scenarios;
};
exports.createApiTestScenarios = createApiTestScenarios;
/**
 * Load testing utilities
 */
var LoadTester = /** @class */ (function () {
    function LoadTester(concurrency, duration) {
        if (concurrency === void 0) { concurrency = 10; }
        if (duration === void 0) { duration = 30000; }
        this.concurrency = concurrency;
        this.duration = duration;
    }
    /**
     * Run load test on endpoint
     */
    LoadTester.prototype.runLoadTest = function (method, endpoint, data) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, endTime, results, errors, makeRequest, promises, totalTime, successfulRequests, averageResponseTime;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        endTime = startTime + this.duration;
                        results = [];
                        errors = [];
                        makeRequest = function () { return __awaiter(_this, void 0, void 0, function () {
                            var apiTester, result, error_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(Date.now() < endTime)) return [3 /*break*/, 5];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        apiTester = new ApiTester();
                                        return [4 /*yield*/, apiTester.testEndpoint(method, endpoint, data)];
                                    case 2:
                                        result = _a.sent();
                                        results.push(result);
                                        if (!result.success && result.error) {
                                            errors.push(result.error);
                                        }
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_3 = _a.sent();
                                        errors.push(error_3.message);
                                        return [3 /*break*/, 4];
                                    case 4: return [3 /*break*/, 0];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); };
                        promises = Array.from({ length: this.concurrency }, function () { return makeRequest(); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        totalTime = Date.now() - startTime;
                        successfulRequests = results.filter(function (r) { return r.success; }).length;
                        averageResponseTime = results.length > 0
                            ? results.reduce(function (sum, r) { return sum + r.responseTime; }, 0) / results.length
                            : 0;
                        return [2 /*return*/, {
                                totalRequests: results.length,
                                successfulRequests: successfulRequests,
                                failedRequests: results.length - successfulRequests,
                                averageResponseTime: averageResponseTime,
                                requestsPerSecond: (results.length / totalTime) * 1000,
                                errors: __spreadArray([], new Set(errors), true), // Remove duplicates
                            }];
                }
            });
        });
    };
    return LoadTester;
}());
exports.LoadTester = LoadTester;
/**
 * Integration test runner
 */
var IntegrationTestRunner = /** @class */ (function () {
    function IntegrationTestRunner(config) {
        this.apiTester = new ApiTester(config);
        this.mockServer = new MockApiServer();
    }
    /**
     * Run integration test suite
     */
    IntegrationTestRunner.prototype.runTestSuite = function (suiteName, tests) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, tests_2, test, startTime, passed, error, err_1, teardownError_1, passedTests;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = [];
                        _i = 0, tests_2 = tests;
                        _c.label = 1;
                    case 1:
                        if (!(_i < tests_2.length)) return [3 /*break*/, 12];
                        test = tests_2[_i];
                        startTime = Date.now();
                        passed = false;
                        error = void 0;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, 6, 10]);
                        return [4 /*yield*/, ((_a = test.setup) === null || _a === void 0 ? void 0 : _a.call(test))];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, test.test()];
                    case 4:
                        _c.sent();
                        passed = true;
                        return [3 /*break*/, 10];
                    case 5:
                        err_1 = _c.sent();
                        error = err_1.message;
                        return [3 /*break*/, 10];
                    case 6:
                        _c.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, ((_b = test.teardown) === null || _b === void 0 ? void 0 : _b.call(test))];
                    case 7:
                        _c.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        teardownError_1 = _c.sent();
                        console.warn('Teardown error:', teardownError_1);
                        return [3 /*break*/, 9];
                    case 9: return [7 /*endfinally*/];
                    case 10:
                        results.push({
                            name: test.name,
                            passed: passed,
                            error: error,
                            duration: Date.now() - startTime,
                        });
                        _c.label = 11;
                    case 11:
                        _i++;
                        return [3 /*break*/, 1];
                    case 12:
                        passedTests = results.filter(function (r) { return r.passed; }).length;
                        return [2 /*return*/, {
                                suiteName: suiteName,
                                totalTests: results.length,
                                passedTests: passedTests,
                                failedTests: results.length - passedTests,
                                results: results,
                            }];
                }
            });
        });
    };
    IntegrationTestRunner.prototype.getMockServer = function () {
        return this.mockServer;
    };
    IntegrationTestRunner.prototype.getApiTester = function () {
        return this.apiTester;
    };
    return IntegrationTestRunner;
}());
exports.IntegrationTestRunner = IntegrationTestRunner;
