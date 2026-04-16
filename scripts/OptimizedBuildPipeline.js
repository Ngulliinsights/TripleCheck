"use strict";
/**
 * Optimized Build Pipeline - Fast, efficient builds with intelligent caching
 * Implements parallel processing and build optimization for Kenya Land Platform
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
exports.OptimizedBuildPipeline = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var crypto_1 = require("crypto");
var perf_hooks_1 = require("perf_hooks");
var OptimizedBuildPipeline = /** @class */ (function () {
    function OptimizedBuildPipeline() {
        this.cacheFile = '.build-cache.json';
        this.cache = {};
        this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
        this.loadCache();
    }
    /**
     * Execute optimized build with parallel processing and caching
     */
    OptimizedBuildPipeline.prototype.executeBuild = function () {
        return __awaiter(this, arguments, void 0, function (buildType) {
            var startTime, tasks, results, overallSuccess, totalDuration, buildResult, error_1, totalDuration;
            var _a;
            if (buildType === void 0) { buildType = 'production'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83D\uDE80 Starting optimized ".concat(buildType, " build..."));
                        startTime = perf_hooks_1.performance.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        tasks = this.getBuildTasks(buildType);
                        return [4 /*yield*/, this.executeTasksInParallel(tasks)];
                    case 2:
                        results = _b.sent();
                        overallSuccess = results.every(function (result) { return result.success; });
                        totalDuration = perf_hooks_1.performance.now() - startTime;
                        // Update cache
                        return [4 /*yield*/, this.saveCache()];
                    case 3:
                        // Update cache
                        _b.sent();
                        buildResult = {
                            success: overallSuccess,
                            duration: totalDuration,
                            output: results.map(function (r) { return r.output; }).join('\n'),
                            error: (_a = results.find(function (r) { return !r.success; })) === null || _a === void 0 ? void 0 : _a.error
                        };
                        if (!overallSuccess) return [3 /*break*/, 5];
                        console.log("\u2705 Build completed successfully in ".concat((totalDuration / 1000).toFixed(2), "s"));
                        return [4 /*yield*/, this.generateBuildReport(buildResult, results)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        console.error("\u274C Build failed after ".concat((totalDuration / 1000).toFixed(2), "s"));
                        _b.label = 6;
                    case 6: return [2 /*return*/, buildResult];
                    case 7:
                        error_1 = _b.sent();
                        totalDuration = perf_hooks_1.performance.now() - startTime;
                        console.error("\uD83D\uDCA5 Build pipeline error:", error_1);
                        return [2 /*return*/, {
                                success: false,
                                duration: totalDuration,
                                output: '',
                                error: error_1 instanceof Error ? error_1.message : String(error_1)
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get build tasks based on build type
     */
    OptimizedBuildPipeline.prototype.getBuildTasks = function (buildType) {
        var commonTasks = [
            {
                name: 'clean',
                command: 'rm',
                args: ['-rf', 'dist', '.vite'],
                dependencies: []
            },
            {
                name: 'type-check',
                command: 'npx',
                args: ['tsc', '--noEmit', '--skipLibCheck'],
                dependencies: []
            }
        ];
        var developmentTasks = __spreadArray(__spreadArray([], commonTasks, true), [
            {
                name: 'vite-build-dev',
                command: 'npx',
                args: ['vite', 'build', '--mode', 'development'],
                dependencies: ['clean', 'type-check']
            }
        ], false);
        var productionTasks = __spreadArray(__spreadArray([], commonTasks, true), [
            {
                name: 'lint',
                command: 'npx',
                args: ['eslint', '.', '--ext', '.ts,.tsx,.js,.jsx', '--max-warnings', '0'],
                dependencies: []
            },
            {
                name: 'vite-build',
                command: 'npx',
                args: ['vite', 'build', '--mode', 'production'],
                dependencies: ['clean', 'type-check', 'lint']
            },
            {
                name: 'bundle-analysis',
                command: 'npx',
                args: ['vite-bundle-analyzer', 'dist/stats.json'],
                dependencies: ['vite-build']
            },
            {
                name: 'security-scan',
                command: 'npm',
                args: ['audit', '--audit-level', 'moderate'],
                dependencies: []
            }
        ], false);
        var testTasks = [
            {
                name: 'test-unit',
                command: 'npx',
                args: ['vitest', 'run', '--coverage'],
                dependencies: ['type-check']
            },
            {
                name: 'test-integration',
                command: 'npx',
                args: ['vitest', 'run', 'tests/integration'],
                dependencies: ['type-check']
            }
        ];
        switch (buildType) {
            case 'development':
                return developmentTasks;
            case 'production':
                return productionTasks;
            case 'test':
                return __spreadArray(__spreadArray([], commonTasks, true), testTasks, true);
            default:
                return productionTasks;
        }
    };
    /**
     * Execute tasks in parallel while respecting dependencies
     */
    OptimizedBuildPipeline.prototype.executeTasksInParallel = function (tasks) {
        return __awaiter(this, void 0, void 0, function () {
            var results, completed, running, canExecute, readyTasks, _i, readyTasks_1, task, promise, _a, taskName, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        results = [];
                        completed = new Set();
                        running = new Map();
                        canExecute = function (task) {
                            var _a, _b;
                            return (_b = (_a = task.dependencies) === null || _a === void 0 ? void 0 : _a.every(function (dep) { return completed.has(dep); })) !== null && _b !== void 0 ? _b : true;
                        };
                        _b.label = 1;
                    case 1:
                        if (!(completed.size < tasks.length)) return [3 /*break*/, 4];
                        readyTasks = tasks.filter(function (task) {
                            return !completed.has(task.name) &&
                                !running.has(task.name) &&
                                canExecute(task);
                        });
                        if (readyTasks.length === 0 && running.size === 0) {
                            throw new Error('Circular dependency detected in build tasks');
                        }
                        // Start ready tasks
                        for (_i = 0, readyTasks_1 = readyTasks; _i < readyTasks_1.length; _i++) {
                            task = readyTasks_1[_i];
                            promise = this.executeTask(task);
                            running.set(task.name, promise);
                        }
                        if (!(running.size > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, Promise.race(Array.from(running.entries()).map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var result;
                                var name = _b[0], promise = _b[1];
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, promise];
                                        case 1:
                                            result = _c.sent();
                                            return [2 /*return*/, [name, result]];
                                    }
                                });
                            }); }))];
                    case 2:
                        _a = _b.sent(), taskName = _a[0], result = _a[1];
                        results.push(result);
                        completed.add(taskName);
                        running.delete(taskName);
                        if (!result.success) {
                            // Cancel remaining tasks on failure
                            console.error("\u274C Task ".concat(taskName, " failed, cancelling remaining tasks"));
                            return [3 /*break*/, 4];
                        }
                        _b.label = 3;
                    case 3: return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Execute a single build task with caching
     */
    OptimizedBuildPipeline.prototype.executeTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var taskHash, cached, startTime, output, duration, result, error_2, duration, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.calculateTaskHash(task)];
                    case 1:
                        taskHash = _a.sent();
                        cached = this.getCachedResult(task.name, taskHash);
                        if (cached) {
                            console.log("\uD83D\uDCE6 Using cached result for ".concat(task.name));
                            return [2 /*return*/, __assign(__assign({}, cached), { cacheHit: true })];
                        }
                        console.log("\uD83D\uDD28 Executing ".concat(task.name, "..."));
                        startTime = perf_hooks_1.performance.now();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.runCommand(task.command, task.args, {
                                cwd: task.cwd || process.cwd(),
                                env: __assign(__assign({}, process.env), task.env)
                            })];
                    case 3:
                        output = _a.sent();
                        duration = perf_hooks_1.performance.now() - startTime;
                        result = {
                            success: true,
                            duration: duration,
                            output: output,
                            cacheHit: false
                        };
                        // Cache successful results
                        this.setCachedResult(task.name, taskHash, result);
                        console.log("\u2705 ".concat(task.name, " completed in ").concat((duration / 1000).toFixed(2), "s"));
                        return [2 /*return*/, result];
                    case 4:
                        error_2 = _a.sent();
                        duration = perf_hooks_1.performance.now() - startTime;
                        errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                        console.error("\u274C ".concat(task.name, " failed after ").concat((duration / 1000).toFixed(2), "s:"), errorMessage);
                        return [2 /*return*/, {
                                success: false,
                                duration: duration,
                                output: '',
                                error: errorMessage,
                                cacheHit: false
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run a command and return its output
     */
    OptimizedBuildPipeline.prototype.runCommand = function (command, args, options) {
        return new Promise(function (resolve, reject) {
            var _a, _b;
            var child = (0, child_process_1.spawn)(command, args, __assign(__assign({}, options), { stdio: ['pipe', 'pipe', 'pipe'] }));
            var stdout = '';
            var stderr = '';
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                stdout += data.toString();
            });
            (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                stderr += data.toString();
            });
            child.on('close', function (code) {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    reject(new Error("Command failed with code ".concat(code, ": ").concat(stderr)));
                }
            });
            child.on('error', function (error) {
                reject(error);
            });
        });
    };
    /**
     * Calculate hash for task to determine if cache is valid
     */
    OptimizedBuildPipeline.prototype.calculateTaskHash = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var hash, relevantFiles, _i, relevantFiles_1, file, content, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hash = (0, crypto_1.createHash)('sha256');
                        // Hash task definition
                        hash.update(JSON.stringify({
                            name: task.name,
                            command: task.command,
                            args: task.args,
                            dependencies: task.dependencies
                        }));
                        return [4 /*yield*/, this.getRelevantFiles(task.name)];
                    case 1:
                        relevantFiles = _a.sent();
                        _i = 0, relevantFiles_1 = relevantFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < relevantFiles_1.length)) return [3 /*break*/, 7];
                        file = relevantFiles_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, fs_1.promises.readFile(file, 'utf-8')];
                    case 4:
                        content = _a.sent();
                        hash.update(content);
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, hash.digest('hex')];
                }
            });
        });
    };
    /**
     * Get files relevant to a task for cache invalidation
     */
    OptimizedBuildPipeline.prototype.getRelevantFiles = function (taskName) {
        return __awaiter(this, void 0, void 0, function () {
            var filePatterns, patterns, files, _i, patterns_1, pattern, glob, matches, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePatterns = {
                            'type-check': ['tsconfig.json', 'src/**/*.ts', 'src/**/*.tsx'],
                            'lint': ['.eslintrc.js', 'eslint.config.js', 'src/**/*.ts', 'src/**/*.tsx'],
                            'vite-build': ['vite.config.ts', 'package.json', 'src/**/*'],
                            'vite-build-dev': ['vite.config.ts', 'package.json', 'src/**/*']
                        };
                        patterns = filePatterns[taskName] || [];
                        files = [];
                        _i = 0, patterns_1 = patterns;
                        _a.label = 1;
                    case 1:
                        if (!(_i < patterns_1.length)) return [3 /*break*/, 7];
                        pattern = patterns_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('glob'); })];
                    case 3:
                        glob = (_a.sent()).glob;
                        return [4 /*yield*/, glob(pattern, { ignore: ['node_modules/**', 'dist/**'] })];
                    case 4:
                        matches = _a.sent();
                        files.push.apply(files, matches);
                        return [3 /*break*/, 6];
                    case 5:
                        error_4 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, files.slice(0, 50)]; // Limit to prevent excessive hashing
                }
            });
        });
    };
    /**
     * Load build cache from disk
     */
    OptimizedBuildPipeline.prototype.loadCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheContent, now, _i, _a, _b, taskName, entry, error_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.readFile(this.cacheFile, 'utf-8')];
                    case 1:
                        cacheContent = _c.sent();
                        this.cache = JSON.parse(cacheContent);
                        now = Date.now();
                        for (_i = 0, _a = Object.entries(this.cache); _i < _a.length; _i++) {
                            _b = _a[_i], taskName = _b[0], entry = _b[1];
                            if (now - entry.timestamp > this.maxCacheAge) {
                                delete this.cache[taskName];
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _c.sent();
                        // Cache file doesn't exist or is invalid, start fresh
                        this.cache = {};
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save build cache to disk
     */
    OptimizedBuildPipeline.prototype.saveCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.warn('Could not save build cache:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cached result if valid
     */
    OptimizedBuildPipeline.prototype.getCachedResult = function (taskName, hash) {
        var cached = this.cache[taskName];
        if (cached && cached.hash === hash) {
            return cached.result;
        }
        return null;
    };
    /**
     * Cache a task result
     */
    OptimizedBuildPipeline.prototype.setCachedResult = function (taskName, hash, result) {
        this.cache[taskName] = {
            hash: hash,
            result: result,
            timestamp: Date.now()
        };
    };
    /**
     * Generate build report
     */
    OptimizedBuildPipeline.prototype.generateBuildReport = function (overallResult, taskResults) {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        report = {
                            timestamp: new Date().toISOString(),
                            success: overallResult.success,
                            totalDuration: overallResult.duration,
                            tasks: taskResults.map(function (result) { return ({
                                duration: result.duration,
                                success: result.success,
                                cacheHit: result.cacheHit || false
                            }); }),
                            cacheHitRate: taskResults.filter(function (r) { return r.cacheHit; }).length / taskResults.length,
                            performance: {
                                totalTime: "".concat((overallResult.duration / 1000).toFixed(2), "s"),
                                averageTaskTime: "".concat((taskResults.reduce(function (sum, r) { return sum + r.duration; }, 0) / taskResults.length / 1000).toFixed(2), "s"),
                                cacheEfficiency: "".concat((taskResults.filter(function (r) { return r.cacheHit; }).length / taskResults.length * 100).toFixed(1), "%")
                            }
                        };
                        return [4 /*yield*/, fs_1.promises.writeFile('build-report.json', JSON.stringify(report, null, 2))];
                    case 1:
                        _a.sent();
                        console.log('\n📊 Build Performance Report:');
                        console.log("   Total Time: ".concat(report.performance.totalTime));
                        console.log("   Cache Hit Rate: ".concat(report.performance.cacheEfficiency));
                        console.log("   Tasks Completed: ".concat(taskResults.length));
                        console.log("   Report saved to: build-report.json");
                        return [2 /*return*/];
                }
            });
        });
    };
    return OptimizedBuildPipeline;
}());
exports.OptimizedBuildPipeline = OptimizedBuildPipeline;
// CLI usage
if (import.meta.url === "file://".concat(process.argv[1])) {
    var buildType = process.argv[2] || 'production';
    var pipeline = new OptimizedBuildPipeline();
    pipeline.executeBuild(buildType)
        .then(function (result) {
        process.exit(result.success ? 0 : 1);
    })
        .catch(function (error) {
        console.error('Build pipeline error:', error);
        process.exit(1);
    });
}
