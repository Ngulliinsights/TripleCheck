#!/usr/bin/env tsx
"use strict";
/**
 * TRIPLECHECK HEALTH CHECK SCRIPT
 * ===============================
 *
 * Comprehensive health check for deployment monitoring
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
exports.HealthChecker = void 0;
var perf_hooks_1 = require("perf_hooks");
var HealthChecker = /** @class */ (function () {
    function HealthChecker() {
        this.startTime = perf_hooks_1.performance.now();
    }
    /**
     * Run comprehensive health check
     */
    HealthChecker.prototype.check = function () {
        return __awaiter(this, void 0, void 0, function () {
            var checks, overallStatus, responseTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.checkDatabase(),
                            this.checkFilesystem(),
                            this.checkMemory(),
                            this.checkDependencies()
                        ])];
                    case 1:
                        checks = _a.sent();
                        overallStatus = this.determineOverallStatus(checks);
                        responseTime = perf_hooks_1.performance.now() - this.startTime;
                        return [2 /*return*/, {
                                status: overallStatus,
                                timestamp: new Date().toISOString(),
                                uptime: process.uptime(),
                                version: this.getVersion(),
                                environment: process.env.NODE_ENV || 'development',
                                checks: {
                                    database: checks[0],
                                    filesystem: checks[1],
                                    memory: checks[2],
                                    dependencies: checks[3]
                                },
                                metrics: {
                                    responseTime: responseTime,
                                    memoryUsage: process.memoryUsage(),
                                    cpuUsage: process.cpuUsage()
                                }
                            }];
                }
            });
        });
    };
    /**
     * Check database connectivity
     */
    HealthChecker.prototype.checkDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, url;
            return __generator(this, function (_a) {
                startTime = perf_hooks_1.performance.now();
                try {
                    // Check if DATABASE_URL is configured
                    if (!process.env.DATABASE_URL) {
                        return [2 /*return*/, {
                                status: 'fail',
                                message: 'Database URL not configured',
                                responseTime: perf_hooks_1.performance.now() - startTime
                            }];
                    }
                    url = new URL(process.env.DATABASE_URL);
                    if (!url.hostname || !url.port) {
                        return [2 /*return*/, {
                                status: 'fail',
                                message: 'Invalid database URL format',
                                responseTime: perf_hooks_1.performance.now() - startTime
                            }];
                    }
                    return [2 /*return*/, {
                            status: 'pass',
                            message: 'Database configuration valid',
                            responseTime: perf_hooks_1.performance.now() - startTime
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            status: 'fail',
                            message: "Database check failed: ".concat(error.message),
                            responseTime: perf_hooks_1.performance.now() - startTime
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check filesystem access
     */
    HealthChecker.prototype.checkFilesystem = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, fs, uploadsDir, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                    case 2:
                        fs = _b.sent();
                        // Check if we can read the current directory
                        return [4 /*yield*/, fs.access('.', fs.constants.R_OK)];
                    case 3:
                        // Check if we can read the current directory
                        _b.sent();
                        uploadsDir = process.env.UPLOAD_DIR || './uploads';
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 8]);
                        return [4 /*yield*/, fs.access(uploadsDir, fs.constants.W_OK)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        _a = _b.sent();
                        return [4 /*yield*/, fs.mkdir(uploadsDir, { recursive: true })];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, {
                            status: 'pass',
                            message: 'Filesystem access OK',
                            responseTime: perf_hooks_1.performance.now() - startTime
                        }];
                    case 9:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                status: 'fail',
                                message: "Filesystem check failed: ".concat(error_1.message),
                                responseTime: perf_hooks_1.performance.now() - startTime
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check memory usage
     */
    HealthChecker.prototype.checkMemory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, memUsage, totalMemory, usedMemory, memoryUsagePercent, status_1, message;
            return __generator(this, function (_a) {
                startTime = perf_hooks_1.performance.now();
                try {
                    memUsage = process.memoryUsage();
                    totalMemory = memUsage.heapTotal;
                    usedMemory = memUsage.heapUsed;
                    memoryUsagePercent = (usedMemory / totalMemory) * 100;
                    status_1 = 'pass';
                    message = "Memory usage: ".concat(memoryUsagePercent.toFixed(1), "%");
                    if (memoryUsagePercent > 90) {
                        status_1 = 'fail';
                        message += ' (Critical)';
                    }
                    else if (memoryUsagePercent > 75) {
                        status_1 = 'warn';
                        message += ' (High)';
                    }
                    return [2 /*return*/, {
                            status: status_1,
                            message: message,
                            responseTime: perf_hooks_1.performance.now() - startTime
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            status: 'fail',
                            message: "Memory check failed: ".concat(error.message),
                            responseTime: perf_hooks_1.performance.now() - startTime
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check critical dependencies
     */
    HealthChecker.prototype.checkDependencies = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, criticalDeps, _i, criticalDeps_1, dep, error_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = perf_hooks_1.performance.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        criticalDeps = [
                            'react',
                            'react-dom',
                            'express',
                            'drizzle-orm'
                        ];
                        _i = 0, criticalDeps_1 = criticalDeps;
                        _a.label = 2;
                    case 2:
                        if (!(_i < criticalDeps_1.length)) return [3 /*break*/, 7];
                        dep = criticalDeps_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, Promise.resolve("".concat(dep)).then(function (s) { return require(s); })];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                status: 'fail',
                                message: "Critical dependency missing: ".concat(dep),
                                responseTime: perf_hooks_1.performance.now() - startTime
                            }];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, {
                            status: 'pass',
                            message: 'All critical dependencies available',
                            responseTime: perf_hooks_1.performance.now() - startTime
                        }];
                    case 8:
                        error_3 = _a.sent();
                        return [2 /*return*/, {
                                status: 'fail',
                                message: "Dependency check failed: ".concat(error_3.message),
                                responseTime: perf_hooks_1.performance.now() - startTime
                            }];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Determine overall health status
     */
    HealthChecker.prototype.determineOverallStatus = function (checks) {
        var hasFailures = checks.some(function (check) { return check.status === 'fail'; });
        var hasWarnings = checks.some(function (check) { return check.status === 'warn'; });
        if (hasFailures)
            return 'unhealthy';
        if (hasWarnings)
            return 'degraded';
        return 'healthy';
    };
    /**
     * Get application version
     */
    HealthChecker.prototype.getVersion = function () {
        try {
            var fs = require('fs');
            var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version || '1.0.0';
        }
        catch (_a) {
            return '1.0.0';
        }
    };
    return HealthChecker;
}());
exports.HealthChecker = HealthChecker;
/**
 * CLI Interface
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, format, checker, result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = process.argv.slice(2);
                    format = args[0] || 'json';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    checker = new HealthChecker();
                    return [4 /*yield*/, checker.check()];
                case 2:
                    result = _a.sent();
                    if (format === 'json') {
                        console.log(JSON.stringify(result, null, 2));
                    }
                    else if (format === 'summary') {
                        console.log("Status: ".concat(result.status.toUpperCase()));
                        console.log("Environment: ".concat(result.environment));
                        console.log("Uptime: ".concat(Math.floor(result.uptime), "s"));
                        console.log("Response Time: ".concat(result.metrics.responseTime.toFixed(2), "ms"));
                        console.log('\nChecks:');
                        Object.entries(result.checks).forEach(function (_a) {
                            var name = _a[0], check = _a[1];
                            var icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
                            console.log("  ".concat(icon, " ").concat(name, ": ").concat(check.message));
                        });
                    }
                    // Exit with appropriate code
                    process.exit(result.status === 'unhealthy' ? 1 : 0);
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error('Health check failed:', error_4.message);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (import.meta.url === "file://".concat(process.argv[1])) {
    main().catch(console.error);
}
