#!/usr/bin/env tsx
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
exports.DeploymentTester = void 0;
var perf_hooks_1 = require("perf_hooks");
var DeploymentTester = /** @class */ (function () {
    function DeploymentTester(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = apiKey;
    }
    DeploymentTester.prototype.runAllTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testSuites, _a, overallPassed, totalDuration;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('🧪 Starting deployment tests...');
                        return [4 /*yield*/, this.runHealthCheckTests()];
                    case 1:
                        _a = [
                            _b.sent()
                        ];
                        return [4 /*yield*/, this.runAPIEndpointTests()];
                    case 2:
                        _a = _a.concat([
                            _b.sent()
                        ]);
                        return [4 /*yield*/, this.runDatabaseTests()];
                    case 3:
                        _a = _a.concat([
                            _b.sent()
                        ]);
                        return [4 /*yield*/, this.runExternalIntegrationTests()];
                    case 4:
                        _a = _a.concat([
                            _b.sent()
                        ]);
                        return [4 /*yield*/, this.runPerformanceTests()];
                    case 5:
                        _a = _a.concat([
                            _b.sent()
                        ]);
                        return [4 /*yield*/, this.runSecurityTests()];
                    case 6:
                        _a = _a.concat([
                            _b.sent()
                        ]);
                        return [4 /*yield*/, this.runMonitoringTests()];
                    case 7:
                        testSuites = _a.concat([
                            _b.sent()
                        ]);
                        overallPassed = testSuites.every(function (suite) { return suite.passed; });
                        totalDuration = testSuites.reduce(function (sum, suite) { return sum + suite.duration; }, 0);
                        console.log('\n📊 Deployment Test Summary:');
                        console.log("Overall Status: ".concat(overallPassed ? '✅ PASSED' : '❌ FAILED'));
                        console.log("Total Duration: ".concat(totalDuration.toFixed(2), "ms"));
                        testSuites.forEach(function (suite) {
                            var status = suite.passed ? '✅' : '❌';
                            var failedCount = suite.tests.filter(function (t) { return !t.passed; }).length;
                            console.log("".concat(status, " ").concat(suite.name, ": ").concat(suite.tests.length - failedCount, "/").concat(suite.tests.length, " passed"));
                        });
                        return [2 /*return*/, testSuites];
                }
            });
        });
    };
    DeploymentTester.prototype.runHealthCheckTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, _a, _b, _c, _d, _e, _f;
            var _this = this;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        // Test main health endpoint
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('Health Check Endpoint', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, health;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/health')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Health check failed with status ".concat(response.status));
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            health = _a.sent();
                                            if (health.status !== 'healthy' && health.status !== 'degraded') {
                                                throw new Error("Unhealthy status: ".concat(health.status));
                                            }
                                            return [2 /*return*/, { status: health.status, checks: health.checks }];
                                    }
                                });
                            }); })];
                    case 1:
                        // Test main health endpoint
                        _b.apply(_a, [_g.sent()]);
                        // Test readiness endpoint
                        _d = (_c = tests).push;
                        return [4 /*yield*/, this.runTest('Readiness Check', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, readiness;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/ready')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Readiness check failed with status ".concat(response.status));
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            readiness = _a.sent();
                                            return [2 /*return*/, { status: readiness.status }];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test readiness endpoint
                        _d.apply(_c, [_g.sent()]);
                        // Test liveness endpoint
                        _f = (_e = tests).push;
                        return [4 /*yield*/, this.runTest('Liveness Check', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, liveness;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/live')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Liveness check failed with status ".concat(response.status));
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            liveness = _a.sent();
                                            return [2 /*return*/, { status: liveness.status, uptime: liveness.uptime }];
                                    }
                                });
                            }); })];
                    case 3:
                        // Test liveness endpoint
                        _f.apply(_e, [_g.sent()]);
                        return [2 /*return*/, {
                                name: 'Health Check Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runAPIEndpointTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, endpoints, _loop_1, this_1, _i, endpoints_1, endpoint, _a, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        endpoints = [
                            { path: '/api/land-verification/health', method: 'GET' },
                            { path: '/api/government-integration/health', method: 'GET' },
                            { path: '/api/risk-assessment/health', method: 'GET' },
                            { path: '/api/community-intelligence/health', method: 'GET' },
                            { path: '/api/monitoring/health', method: 'GET' }
                        ];
                        _loop_1 = function (endpoint) {
                            var _d, _e;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        _e = (_d = tests).push;
                                        return [4 /*yield*/, this_1.runTest("".concat(endpoint.method, " ").concat(endpoint.path), function () { return __awaiter(_this, void 0, void 0, function () {
                                                var response;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, this.makeRequest(endpoint.path, {
                                                                method: endpoint.method
                                                            })];
                                                        case 1:
                                                            response = _a.sent();
                                                            if (!response.ok) {
                                                                throw new Error("Endpoint failed with status ".concat(response.status));
                                                            }
                                                            return [2 /*return*/, { status: response.status }];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        _e.apply(_d, [_f.sent()]);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, endpoints_1 = endpoints;
                        _c.label = 1;
                    case 1:
                        if (!(_i < endpoints_1.length)) return [3 /*break*/, 4];
                        endpoint = endpoints_1[_i];
                        return [5 /*yield**/, _loop_1(endpoint)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Test API authentication
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('API Authentication', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/api/land-verification/sessions', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': this.apiKey ? "Bearer ".concat(this.apiKey) : ''
                                                },
                                                body: JSON.stringify({
                                                    propertyId: 'test-property-id',
                                                    userId: 'test-user-id'
                                                })
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            // Should return 401 without proper auth, or 200/201 with proper auth
                                            if (response.status === 401 && !this.apiKey) {
                                                return [2 /*return*/, { message: 'Authentication properly required' }];
                                            }
                                            else if (response.ok && this.apiKey) {
                                                return [2 /*return*/, { message: 'Authentication successful' }];
                                            }
                                            else {
                                                throw new Error("Unexpected authentication response: ".concat(response.status));
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 5:
                        // Test API authentication
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/, {
                                name: 'API Endpoint Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runDatabaseTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, _a, _b, _c, _d;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        // Test database connectivity through health endpoint
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('Database Connectivity', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, health;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/health')];
                                        case 1:
                                            response = _a.sent();
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            health = _a.sent();
                                            if (health.checks.database.status !== 'pass') {
                                                throw new Error("Database check failed: ".concat(health.checks.database.message));
                                            }
                                            return [2 /*return*/, {
                                                    responseTime: health.checks.database.responseTime,
                                                    message: health.checks.database.message
                                                }];
                                    }
                                });
                            }); })];
                    case 1:
                        // Test database connectivity through health endpoint
                        _b.apply(_a, [_e.sent()]);
                        // Test Redis connectivity
                        _d = (_c = tests).push;
                        return [4 /*yield*/, this.runTest('Redis Connectivity', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, health;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/health')];
                                        case 1:
                                            response = _a.sent();
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            health = _a.sent();
                                            if (health.checks.redis.status !== 'pass') {
                                                throw new Error("Redis check failed: ".concat(health.checks.redis.message));
                                            }
                                            return [2 /*return*/, {
                                                    responseTime: health.checks.redis.responseTime,
                                                    message: health.checks.redis.message
                                                }];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test Redis connectivity
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                name: 'Database Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runExternalIntegrationTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, _a, _b, _c, _d;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        // Test external API connectivity through health endpoint
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('External API Connectivity', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, health, externalAPIs;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/health')];
                                        case 1:
                                            response = _a.sent();
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            health = _a.sent();
                                            externalAPIs = health.checks.externalAPIs;
                                            if (externalAPIs.status === 'fail') {
                                                throw new Error("External API check failed: ".concat(externalAPIs.message));
                                            }
                                            return [2 /*return*/, {
                                                    status: externalAPIs.status,
                                                    message: externalAPIs.message,
                                                    details: externalAPIs.details
                                                }];
                                    }
                                });
                            }); })];
                    case 1:
                        // Test external API connectivity through health endpoint
                        _b.apply(_a, [_e.sent()]);
                        // Test government integration service
                        _d = (_c = tests).push;
                        return [4 /*yield*/, this.runTest('Government Integration Service', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/api/government-integration/health')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Government integration service unhealthy: ".concat(response.status));
                                            }
                                            return [2 /*return*/, { status: 'healthy' }];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test government integration service
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                name: 'External Integration Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runPerformanceTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, _a, _b, _c, _d;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        // Test response time for health endpoint
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('Health Endpoint Response Time', function () { return __awaiter(_this, void 0, void 0, function () {
                                var testStartTime, response, responseTime;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            testStartTime = perf_hooks_1.performance.now();
                                            return [4 /*yield*/, this.makeRequest('/health')];
                                        case 1:
                                            response = _a.sent();
                                            responseTime = perf_hooks_1.performance.now() - testStartTime;
                                            if (!response.ok) {
                                                throw new Error("Health endpoint failed: ".concat(response.status));
                                            }
                                            if (responseTime > 5000) { // 5 seconds
                                                throw new Error("Health endpoint too slow: ".concat(responseTime.toFixed(2), "ms"));
                                            }
                                            return [2 /*return*/, { responseTime: "".concat(responseTime.toFixed(2), "ms") }];
                                    }
                                });
                            }); })];
                    case 1:
                        // Test response time for health endpoint
                        _b.apply(_a, [_e.sent()]);
                        // Test concurrent requests
                        _d = (_c = tests).push;
                        return [4 /*yield*/, this.runTest('Concurrent Request Handling', function () { return __awaiter(_this, void 0, void 0, function () {
                                var concurrentRequests, promises, testStartTime, responses, totalTime, failedRequests;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            concurrentRequests = 10;
                                            promises = Array(concurrentRequests).fill(0).map(function () {
                                                return _this.makeRequest('/live');
                                            });
                                            testStartTime = perf_hooks_1.performance.now();
                                            return [4 /*yield*/, Promise.all(promises)];
                                        case 1:
                                            responses = _a.sent();
                                            totalTime = perf_hooks_1.performance.now() - testStartTime;
                                            failedRequests = responses.filter(function (r) { return !r.ok; }).length;
                                            if (failedRequests > 0) {
                                                throw new Error("".concat(failedRequests, "/").concat(concurrentRequests, " concurrent requests failed"));
                                            }
                                            return [2 /*return*/, {
                                                    concurrentRequests: concurrentRequests,
                                                    totalTime: "".concat(totalTime.toFixed(2), "ms"),
                                                    averageTime: "".concat((totalTime / concurrentRequests).toFixed(2), "ms")
                                                }];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test concurrent requests
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                name: 'Performance Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runSecurityTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, _a, _b, _c, _d, _e, _f;
            var _this = this;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        // Test HTTPS enforcement (if applicable)
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('HTTPS Security', function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    if (!this.baseUrl.startsWith('https://')) {
                                        return [2 /*return*/, { message: 'HTTP endpoint - HTTPS not enforced (development only)' }];
                                    }
                                    return [2 /*return*/, { message: 'HTTPS properly configured' }];
                                });
                            }); })];
                    case 1:
                        // Test HTTPS enforcement (if applicable)
                        _b.apply(_a, [_g.sent()]);
                        // Test unauthorized access
                        _d = (_c = tests).push;
                        return [4 /*yield*/, this.runTest('Unauthorized Access Protection', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/api/land-verification/sessions', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ propertyId: 'test', userId: 'test' })
                                            })];
                                        case 1:
                                            response = _a.sent();
                                            if (response.status !== 401 && response.status !== 403) {
                                                throw new Error("Expected 401/403 for unauthorized access, got ".concat(response.status));
                                            }
                                            return [2 /*return*/, { message: 'Unauthorized access properly blocked' }];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test unauthorized access
                        _d.apply(_c, [_g.sent()]);
                        // Test SQL injection protection (basic test)
                        _f = (_e = tests).push;
                        return [4 /*yield*/, this.runTest('SQL Injection Protection', function () { return __awaiter(_this, void 0, void 0, function () {
                                var maliciousInput, response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            maliciousInput = "'; DROP TABLE users; --";
                                            return [4 /*yield*/, this.makeRequest("/api/land-verification/sessions?propertyId=".concat(encodeURIComponent(maliciousInput)))];
                                        case 1:
                                            response = _a.sent();
                                            // Should not return 500 (internal server error) which might indicate SQL injection vulnerability
                                            if (response.status === 500) {
                                                throw new Error('Potential SQL injection vulnerability detected');
                                            }
                                            return [2 /*return*/, { message: 'SQL injection protection appears to be working' }];
                                    }
                                });
                            }); })];
                    case 3:
                        // Test SQL injection protection (basic test)
                        _f.apply(_e, [_g.sent()]);
                        return [2 /*return*/, {
                                name: 'Security Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runMonitoringTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, tests, _a, _b, _c, _d, _e, _f;
            var _this = this;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        tests = [];
                        // Test metrics endpoint
                        _b = (_a = tests).push;
                        return [4 /*yield*/, this.runTest('Metrics Endpoint', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, metrics;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/metrics')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Metrics endpoint failed: ".concat(response.status));
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            metrics = _a.sent();
                                            return [2 /*return*/, {
                                                    timestamp: metrics.timestamp,
                                                    hasMetrics: Object.keys(metrics.metrics || {}).length > 0
                                                }];
                                    }
                                });
                            }); })];
                    case 1:
                        // Test metrics endpoint
                        _b.apply(_a, [_g.sent()]);
                        // Test Prometheus metrics
                        _d = (_c = tests).push;
                        return [4 /*yield*/, this.runTest('Prometheus Metrics', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, metricsText;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/metrics/prometheus')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Prometheus metrics endpoint failed: ".concat(response.status));
                                            }
                                            return [4 /*yield*/, response.text()];
                                        case 2:
                                            metricsText = _a.sent();
                                            return [2 /*return*/, {
                                                    hasMetrics: metricsText.length > 0,
                                                    format: 'prometheus'
                                                }];
                                    }
                                });
                            }); })];
                    case 2:
                        // Test Prometheus metrics
                        _d.apply(_c, [_g.sent()]);
                        // Test alerting endpoint
                        _f = (_e = tests).push;
                        return [4 /*yield*/, this.runTest('Alerting System', function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, alerts;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.makeRequest('/alerts')];
                                        case 1:
                                            response = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Alerting endpoint failed: ".concat(response.status));
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            alerts = _a.sent();
                                            return [2 /*return*/, {
                                                    alertCount: alerts.count,
                                                    timestamp: alerts.timestamp
                                                }];
                                    }
                                });
                            }); })];
                    case 3:
                        // Test alerting endpoint
                        _f.apply(_e, [_g.sent()]);
                        return [2 /*return*/, {
                                name: 'Monitoring Tests',
                                tests: tests,
                                passed: tests.every(function (t) { return t.passed; }),
                                duration: perf_hooks_1.performance.now() - startTime
                            }];
                }
            });
        });
    };
    DeploymentTester.prototype.runTest = function (name, testFn) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, details, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, testFn()];
                    case 2:
                        details = _a.sent();
                        return [2 /*return*/, {
                                name: name,
                                passed: true,
                                duration: perf_hooks_1.performance.now() - startTime,
                                details: details
                            }];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, {
                                name: name,
                                passed: false,
                                duration: perf_hooks_1.performance.now() - startTime,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DeploymentTester.prototype.makeRequest = function (path_1) {
        return __awaiter(this, arguments, void 0, function (path, options) {
            var url, defaultOptions;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                url = "".concat(this.baseUrl).concat(path);
                defaultOptions = {
                    timeout: 10000, // 10 second timeout
                    headers: __assign({ 'User-Agent': 'DeploymentTester/1.0' }, options.headers)
                };
                return [2 /*return*/, fetch(url, __assign(__assign({}, defaultOptions), options))];
            });
        });
    };
    return DeploymentTester;
}());
exports.DeploymentTester = DeploymentTester;
// CLI interface
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrl, apiKey, tester, results, overallPassed, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    baseUrl = process.argv[2] || 'http://localhost:3000';
                    apiKey = process.env.API_KEY;
                    console.log("\uD83C\uDFAF Testing deployment at: ".concat(baseUrl));
                    if (apiKey) {
                        console.log('🔑 Using API key for authenticated tests');
                    }
                    tester = new DeploymentTester(baseUrl, apiKey);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, tester.runAllTests()];
                case 2:
                    results = _a.sent();
                    overallPassed = results.every(function (suite) { return suite.passed; });
                    // Output detailed results
                    console.log('\n📋 Detailed Results:');
                    results.forEach(function (suite) {
                        console.log("\n".concat(suite.name, ":"));
                        suite.tests.forEach(function (test) {
                            var status = test.passed ? '✅' : '❌';
                            var duration = test.duration.toFixed(2);
                            console.log("  ".concat(status, " ").concat(test.name, " (").concat(duration, "ms)"));
                            if (!test.passed && test.error) {
                                console.log("    Error: ".concat(test.error));
                            }
                            if (test.details) {
                                console.log("    Details: ".concat(JSON.stringify(test.details, null, 2)));
                            }
                        });
                    });
                    process.exit(overallPassed ? 0 : 1);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('❌ Deployment tests failed:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main();
}
