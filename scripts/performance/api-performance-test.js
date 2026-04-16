#!/usr/bin/env tsx
"use strict";
/**
 * API Performance Testing Script
 *
 * Tests the performance improvements made to the similar properties endpoint
 * and other API optimizations.
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
exports.PerformanceTester = void 0;
var cleanup_redundancies_1 = require("../cleanup-redundancies");
var API_BASE = process.env.API_BASE || 'http://localhost:3003/api';
var PerformanceTester = /** @class */ (function () {
    function PerformanceTester() {
        this.results = [];
    }
    PerformanceTester.prototype.testEndpoint = function (endpoint_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, method, body, headers) {
            var startTime, response, responseTime, data, result, error_1, responseTime, result;
            if (method === void 0) { method = 'GET'; }
            if (headers === void 0) { headers = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, (0, cleanup_redundancies_1.default)("".concat(API_BASE).concat(endpoint), {
                                method: method,
                                headers: __assign({ 'Content-Type': 'application/json' }, headers),
                                body: body ? JSON.stringify(body) : undefined,
                            })];
                    case 2:
                        response = _a.sent();
                        responseTime = Date.now() - startTime;
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        result = {
                            endpoint: endpoint,
                            method: method,
                            responseTime: responseTime,
                            status: response.status,
                            success: response.ok,
                            cached: data.cached,
                        };
                        this.results.push(result);
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        responseTime = Date.now() - startTime;
                        result = {
                            endpoint: endpoint,
                            method: method,
                            responseTime: responseTime,
                            status: 0,
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                        };
                        this.results.push(result);
                        return [2 /*return*/, result];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PerformanceTester.prototype.runSimilarPropertiesTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testCases, _i, testCases_1, params, queryString, endpoint, firstRequest, secondRequest, improvement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n🔍 Testing Similar Properties Endpoint Performance...');
                        testCases = [
                            { city: 'Nairobi', minPrice: '50000', maxPrice: '100000', limit: '10' },
                            { city: 'Mombasa', minPrice: '100000', maxPrice: '200000', limit: '5' },
                            { city: 'Nakuru', minPrice: '30000', maxPrice: '80000', limit: '8' },
                            { propertyType: 'apartment', city: 'Nairobi', limit: '10' },
                        ];
                        _i = 0, testCases_1 = testCases;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testCases_1.length)) return [3 /*break*/, 6];
                        params = testCases_1[_i];
                        queryString = new URLSearchParams(params).toString();
                        endpoint = "/properties/similar?".concat(queryString);
                        console.log("Testing: ".concat(endpoint));
                        return [4 /*yield*/, this.testEndpoint(endpoint)];
                    case 2:
                        firstRequest = _a.sent();
                        console.log("  First request: ".concat(firstRequest.responseTime, "ms (cached: ").concat(firstRequest.cached, ")"));
                        // Test second request (should be cached)
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 3:
                        // Test second request (should be cached)
                        _a.sent(); // Small delay
                        return [4 /*yield*/, this.testEndpoint(endpoint)];
                    case 4:
                        secondRequest = _a.sent();
                        console.log("  Second request: ".concat(secondRequest.responseTime, "ms (cached: ").concat(secondRequest.cached, ")"));
                        // Calculate improvement
                        if (firstRequest.success && secondRequest.success) {
                            improvement = ((firstRequest.responseTime - secondRequest.responseTime) / firstRequest.responseTime) * 100;
                            console.log("  Performance improvement: ".concat(improvement.toFixed(1), "%"));
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    PerformanceTester.prototype.runBatchTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, concurrentRequests, startTime, promises, results, totalTime, successfulRequests, averageResponseTime, cachedRequests;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n⚡ Testing Concurrent Requests...');
                        endpoint = '/properties/similar?city=Nairobi&minPrice=50000&maxPrice=100000&limit=10';
                        concurrentRequests = 10;
                        console.log("Making ".concat(concurrentRequests, " concurrent requests to: ").concat(endpoint));
                        startTime = Date.now();
                        promises = Array(concurrentRequests).fill(null).map(function () {
                            return _this.testEndpoint(endpoint);
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        totalTime = Date.now() - startTime;
                        successfulRequests = results.filter(function (r) { return r.success; }).length;
                        averageResponseTime = results.reduce(function (sum, r) { return sum + r.responseTime; }, 0) / results.length;
                        cachedRequests = results.filter(function (r) { return r.cached; }).length;
                        console.log("  Total time: ".concat(totalTime, "ms"));
                        console.log("  Successful requests: ".concat(successfulRequests, "/").concat(concurrentRequests));
                        console.log("  Average response time: ".concat(averageResponseTime.toFixed(1), "ms"));
                        console.log("  Cached responses: ".concat(cachedRequests, "/").concat(concurrentRequests));
                        console.log("  Requests per second: ".concat((concurrentRequests / (totalTime / 1000)).toFixed(1)));
                        return [2 /*return*/];
                }
            });
        });
    };
    PerformanceTester.prototype.runPropertyListingTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testCases, _i, testCases_2, endpoint, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n📋 Testing Property Listings Performance...');
                        testCases = [
                            '/properties?page=1&limit=10',
                            '/properties?page=1&limit=20',
                            '/properties?location=Nairobi&page=1&limit=10',
                            '/properties?priceMin=50000&priceMax=150000&page=1&limit=10',
                        ];
                        _i = 0, testCases_2 = testCases;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testCases_2.length)) return [3 /*break*/, 4];
                        endpoint = testCases_2[_i];
                        console.log("Testing: ".concat(endpoint));
                        return [4 /*yield*/, this.testEndpoint(endpoint)];
                    case 2:
                        result = _a.sent();
                        console.log("  Response time: ".concat(result.responseTime, "ms (status: ").concat(result.status, ")"));
                        if (result.responseTime > 1000) {
                            console.log("  \u26A0\uFE0F  Slow response detected!");
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PerformanceTester.prototype.runPerformanceMonitoringTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (process.env.NODE_ENV !== 'development') {
                            console.log('\n⏭️  Skipping performance monitoring test (not in development mode)');
                            return [2 /*return*/];
                        }
                        console.log('\n📊 Testing Performance Monitoring Endpoint...');
                        endpoint = '/properties/debug/performance?timeWindow=5';
                        return [4 /*yield*/, this.testEndpoint(endpoint)];
                    case 1:
                        result = _a.sent();
                        if (result.success) {
                            console.log("  Performance monitoring endpoint: ".concat(result.responseTime, "ms"));
                            console.log("  Status: ".concat(result.status));
                        }
                        else {
                            console.log("  \u274C Performance monitoring endpoint failed: ".concat(result.error));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PerformanceTester.prototype.generateReport = function () {
        console.log('\n📈 Performance Test Report');
        console.log('='.repeat(50));
        var totalRequests = this.results.length;
        var successfulRequests = this.results.filter(function (r) { return r.success; }).length;
        var failedRequests = totalRequests - successfulRequests;
        var averageResponseTime = this.results.reduce(function (sum, r) { return sum + r.responseTime; }, 0) / totalRequests;
        var slowRequests = this.results.filter(function (r) { return r.responseTime > 1000; }).length;
        var cachedRequests = this.results.filter(function (r) { return r.cached; }).length;
        console.log("Total Requests: ".concat(totalRequests));
        console.log("Successful: ".concat(successfulRequests, " (").concat(((successfulRequests / totalRequests) * 100).toFixed(1), "%)"));
        console.log("Failed: ".concat(failedRequests, " (").concat(((failedRequests / totalRequests) * 100).toFixed(1), "%)"));
        console.log("Average Response Time: ".concat(averageResponseTime.toFixed(1), "ms"));
        console.log("Slow Requests (>1s): ".concat(slowRequests, " (").concat(((slowRequests / totalRequests) * 100).toFixed(1), "%)"));
        console.log("Cached Responses: ".concat(cachedRequests, " (").concat(((cachedRequests / totalRequests) * 100).toFixed(1), "%)"));
        // Response time distribution
        var responseTimes = this.results.map(function (r) { return r.responseTime; }).sort(function (a, b) { return a - b; });
        var p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
        var p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
        var p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
        console.log('\nResponse Time Percentiles:');
        console.log("  P50: ".concat(p50, "ms"));
        console.log("  P95: ".concat(p95, "ms"));
        console.log("  P99: ".concat(p99, "ms"));
        // Slowest endpoints
        var slowestEndpoints = this.results
            .sort(function (a, b) { return b.responseTime - a.responseTime; })
            .slice(0, 5);
        console.log('\nSlowest Endpoints:');
        slowestEndpoints.forEach(function (result, index) {
            console.log("  ".concat(index + 1, ". ").concat(result.endpoint, " - ").concat(result.responseTime, "ms"));
        });
        // Performance recommendations
        console.log('\n💡 Performance Recommendations:');
        if (averageResponseTime > 500) {
            console.log('  - Consider adding more caching layers');
        }
        if (slowRequests > totalRequests * 0.1) {
            console.log('  - Optimize slow queries (>1s response time)');
        }
        if (cachedRequests < totalRequests * 0.3) {
            console.log('  - Increase cache hit ratio for better performance');
        }
        if (failedRequests > 0) {
            console.log('  - Investigate and fix failing endpoints');
        }
    };
    return PerformanceTester;
}());
exports.PerformanceTester = PerformanceTester;
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tester, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting API Performance Tests...');
                    console.log("Testing API at: ".concat(API_BASE));
                    tester = new PerformanceTester();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, tester.runSimilarPropertiesTest()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, tester.runBatchTest()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, tester.runPropertyListingTest()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, tester.runPerformanceMonitoringTest()];
                case 5:
                    _a.sent();
                    tester.generateReport();
                    console.log('\n✅ Performance tests completed successfully!');
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error('\n❌ Performance tests failed:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Run the tests
if (require.main === module) {
    main();
}
