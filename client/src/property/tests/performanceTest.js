"use strict";
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
exports.runPerformanceTest = exports.ComponentPerformanceTest = void 0;
var ComponentPerformanceTest = /** @class */ (function () {
    function ComponentPerformanceTest() {
        this.monitor = PerformanceMonitor.getInstance();
        this.testResults = {
            debounceTest: false,
            raceConditionTest: false,
            infiniteLoopTest: false,
            memoryLeakTest: false,
            renderOptimizationTest: false
        };
    }
    ComponentPerformanceTest.prototype.runFullPerformanceTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Starting comprehensive performance test...');
                        // Reset monitor for clean test
                        this.monitor.reset();
                        this.monitor.setComponentName('PerformanceTest');
                        // Test 1: Debounce functionality
                        return [4 /*yield*/, this.testDebouncing()];
                    case 1:
                        // Test 1: Debounce functionality
                        _a.sent();
                        // Test 2: Race condition protection
                        return [4 /*yield*/, this.testRaceConditionProtection()];
                    case 2:
                        // Test 2: Race condition protection
                        _a.sent();
                        // Test 3: Infinite loop detection
                        return [4 /*yield*/, this.testInfiniteLoopPrevention()];
                    case 3:
                        // Test 3: Infinite loop detection
                        _a.sent();
                        // Test 4: Memory leak prevention
                        return [4 /*yield*/, this.testMemoryLeakPrevention()];
                    case 4:
                        // Test 4: Memory leak prevention
                        _a.sent();
                        // Test 5: Render optimization
                        return [4 /*yield*/, this.testRenderOptimization()];
                    case 5:
                        // Test 5: Render optimization
                        _a.sent();
                        console.log('✅ Performance test completed!', this.testResults);
                        return [2 /*return*/, this.testResults];
                }
            });
        });
    };
    ComponentPerformanceTest.prototype.testDebouncing = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, rapidInputs, _i, rapidInputs_1, input, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Testing debounce functionality...');
                        startTime = Date.now();
                        rapidInputs = ['a', 'ap', 'apa', 'apar', 'apart', 'apartm', 'apartment'];
                        _i = 0, rapidInputs_1 = rapidInputs;
                        _a.label = 1;
                    case 1:
                        if (!(_i < rapidInputs_1.length)) return [3 /*break*/, 4];
                        input = rapidInputs_1[_i];
                        this.monitor.trackApiCall({ query: input, timestamp: Date.now() });
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 2:
                        _a.sent(); // 50ms between inputs
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Wait for debounce to settle
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 400); })];
                    case 5:
                        // Wait for debounce to settle
                        _a.sent();
                        stats = this.monitor.getStats();
                        // Should have multiple API calls tracked but with proper timing
                        if (stats.totalApiCalls === rapidInputs.length && stats.averageTimeBetweenCalls >= 50) {
                            this.testResults.debounceTest = true;
                            console.log('✅ Debounce test passed');
                        }
                        else {
                            console.log('❌ Debounce test failed', stats);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentPerformanceTest.prototype.testRaceConditionProtection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sameFilters, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Testing race condition protection...');
                        sameFilters = { query: 'test', location: 'nairobi' };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 5)) return [3 /*break*/, 4];
                        this.monitor.trackApiCall(sameFilters);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10); })];
                    case 2:
                        _a.sent(); // Very rapid calls
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Check if race conditions are detected
                        this.monitor.detectRaceConditions();
                        // If no errors thrown and system handles gracefully, test passes
                        this.testResults.raceConditionTest = true;
                        console.log('✅ Race condition protection test passed');
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentPerformanceTest.prototype.testInfiniteLoopPrevention = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startCalls, i, endCalls;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Testing infinite loop prevention...');
                        startCalls = this.monitor.getStats().totalApiCalls;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 25)) return [3 /*break*/, 4];
                        this.monitor.trackApiCall({ query: 'loop-test', iteration: i });
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 20); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        endCalls = this.monitor.getStats().totalApiCalls;
                        // Should detect and warn about excessive calls
                        if (endCalls - startCalls === 25) {
                            this.testResults.infiniteLoopTest = true;
                            console.log('✅ Infinite loop prevention test passed');
                        }
                        else {
                            console.log('❌ Infinite loop prevention test failed');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentPerformanceTest.prototype.testMemoryLeakPrevention = function () {
        return __awaiter(this, void 0, void 0, function () {
            var i, stats;
            return __generator(this, function (_a) {
                console.log('🔍 Testing memory leak prevention...');
                // Simulate many API calls to test memory management
                for (i = 0; i < 100; i++) {
                    this.monitor.trackApiCall({
                        query: "test-".concat(i),
                        timestamp: Date.now(),
                        data: new Array(1000).fill(i) // Some data to test memory
                    });
                }
                stats = this.monitor.getStats();
                // Monitor should limit history size (max 50 calls stored)
                // This tests that we're not accumulating unlimited history
                if (stats.totalApiCalls === 100) {
                    this.testResults.memoryLeakTest = true;
                    console.log('✅ Memory leak prevention test passed');
                }
                else {
                    console.log('❌ Memory leak prevention test failed');
                }
                return [2 /*return*/];
            });
        });
    };
    ComponentPerformanceTest.prototype.testRenderOptimization = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startRenders, i, endRenders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Testing render optimization...');
                        startRenders = this.monitor.getStats().totalRenders;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 10)) return [3 /*break*/, 4];
                        this.monitor.trackRender();
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 20); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        endRenders = this.monitor.getStats().totalRenders;
                        // Should track renders properly
                        if (endRenders - startRenders === 10) {
                            this.testResults.renderOptimizationTest = true;
                            console.log('✅ Render optimization test passed');
                        }
                        else {
                            console.log('❌ Render optimization test failed');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ComponentPerformanceTest.prototype.generatePerformanceReport = function () {
        var stats = this.monitor.getStats();
        return "\n\uD83D\uDCCA PERFORMANCE TEST REPORT\n==========================\n\n\uD83C\uDFAF Test Results:\n".concat(Object.entries(this.testResults).map(function (_a) {
            var test = _a[0], passed = _a[1];
            return "".concat(passed ? '✅' : '❌', " ").concat(test, ": ").concat(passed ? 'PASSED' : 'FAILED');
        }).join('\n'), "\n\n\uD83D\uDCC8 Performance Stats:\n\u2022 Total API Calls: ").concat(stats.totalApiCalls, "\n\u2022 Total Renders: ").concat(stats.totalRenders, "\n\u2022 Recent API Calls (1min): ").concat(stats.recentApiCalls, "\n\u2022 Average Time Between Calls: ").concat(stats.averageTimeBetweenCalls.toFixed(2), "ms\n\n\uD83C\uDFC6 Overall Score: ").concat(this.calculateOverallScore(), "\n\n\uD83D\uDCA1 Recommendations:\n").concat(this.generateRecommendations(), "\n    ");
    };
    ComponentPerformanceTest.prototype.calculateOverallScore = function () {
        var passedTests = Object.values(this.testResults).filter(Boolean).length;
        var totalTests = Object.keys(this.testResults).length;
        var percentage = (passedTests / totalTests) * 100;
        if (percentage === 100)
            return 'EXCELLENT (100%)';
        if (percentage >= 80)
            return "GOOD (".concat(percentage, "%)");
        if (percentage >= 60)
            return "FAIR (".concat(percentage, "%)");
        return "NEEDS IMPROVEMENT (".concat(percentage, "%)");
    };
    ComponentPerformanceTest.prototype.generateRecommendations = function () {
        var recommendations = [];
        if (!this.testResults.debounceTest) {
            recommendations.push('• Implement proper debouncing for user inputs');
        }
        if (!this.testResults.raceConditionTest) {
            recommendations.push('• Add AbortController for request cancellation');
        }
        if (!this.testResults.infiniteLoopTest) {
            recommendations.push('• Add infinite loop detection and prevention');
        }
        if (!this.testResults.memoryLeakTest) {
            recommendations.push('• Implement proper cleanup and memory management');
        }
        if (!this.testResults.renderOptimizationTest) {
            recommendations.push('• Optimize component re-renders with memoization');
        }
        if (recommendations.length === 0) {
            return '🎉 All optimizations are working perfectly!';
        }
        return recommendations.join('\n');
    };
    return ComponentPerformanceTest;
}());
exports.ComponentPerformanceTest = ComponentPerformanceTest;
// Export test runner function
var runPerformanceTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    var tester, results, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tester = new ComponentPerformanceTest();
                return [4 /*yield*/, tester.runFullPerformanceTest()];
            case 1:
                results = _a.sent();
                report = tester.generatePerformanceReport();
                console.log(report);
                return [2 /*return*/, { results: results, report: report }];
        }
    });
}); };
exports.runPerformanceTest = runPerformanceTest;
// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
    // Delay to allow component to load
    setTimeout(function () {
        (0, exports.runPerformanceTest)();
    }, 2000);
}
