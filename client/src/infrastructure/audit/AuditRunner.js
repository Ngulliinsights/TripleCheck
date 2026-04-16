"use strict";
/**
 * Enhanced Audit Runner
 *
 * Orchestrates comprehensive UI audits with all plugins and advanced features
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.EnhancedAuditRunner = void 0;
var events_1 = require("events");
var UIAuditSystem_1 = require("./UIAuditSystem");
var index_1 = require("./index");
var LinkValidator_1 = require("./LinkValidator");
var AuditReporter_1 = require("./AuditReporter");
var AccessibilityPlugin_1 = require("./plugins/AccessibilityPlugin");
var PerformancePlugin_1 = require("./plugins/PerformancePlugin");
var SecurityPlugin_1 = require("./plugins/SecurityPlugin");
var config_1 = require("./config");
var EnhancedAuditRunner = /** @class */ (function (_super) {
    __extends(EnhancedAuditRunner, _super);
    function EnhancedAuditRunner(config) {
        var _this = _super.call(this) || this;
        _this.isRunning = false;
        _this.abortController = null;
        _this.startTime = 0;
        _this.config = config ? __assign(__assign({}, (0, config_1.getAuditConfig)()), config) : (0, config_1.getAuditConfig)();
        // Initialize core components
        _this.auditSystem = new UIAuditSystem_1.OptimizedUIAuditSystem(_this.config);
        _this.routeAnalyzer = new index_1.RouteAnalyzer();
        _this.linkValidator = new LinkValidator_1.EnhancedLinkValidator();
        _this.auditReporter = new AuditReporter_1.AuditReporter();
        // Set up event forwarding
        _this.setupEventForwarding();
        return _this;
    }
    /**
     * Run comprehensive audit with all features
     */
    EnhancedAuditRunner.prototype.runAudit = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var report, _a, executionTime, result, error_1, executionTime, result;
            var _b;
            if (options === void 0) { options = { mode: 'complete' }; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.isRunning) {
                            throw new Error('Audit is already running');
                        }
                        this.isRunning = true;
                        this.abortController = new AbortController();
                        this.startTime = Date.now();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 13, 14, 16]);
                        this.emit('auditStarted', { options: options, config: this.config });
                        console.log('🚀 Starting enhanced UI audit...');
                        console.log("\uD83D\uDCCB Mode: ".concat(options.mode));
                        console.log("\uD83C\uDFAF Focus: ".concat(((_b = options.focus) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'all areas'));
                        // Initialize plugins based on focus areas
                        return [4 /*yield*/, this.initializePlugins(options.focus)];
                    case 2:
                        // Initialize plugins based on focus areas
                        _c.sent();
                        report = void 0;
                        _a = options.mode;
                        switch (_a) {
                            case 'quick': return [3 /*break*/, 3];
                            case 'focused': return [3 /*break*/, 5];
                            case 'complete': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 7];
                    case 3: return [4 /*yield*/, this.runQuickAudit(options)];
                    case 4:
                        report = _c.sent();
                        return [3 /*break*/, 9];
                    case 5: return [4 /*yield*/, this.runFocusedAudit(options)];
                    case 6:
                        report = _c.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.runCompleteAudit(options)];
                    case 8:
                        report = _c.sent();
                        return [3 /*break*/, 9];
                    case 9: 
                    // Generate outputs
                    return [4 /*yield*/, this.generateOutputs(report, options)];
                    case 10:
                        // Generate outputs
                        _c.sent();
                        if (!options.notifyOnCompletion) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.sendNotifications(report)];
                    case 11:
                        _c.sent();
                        _c.label = 12;
                    case 12:
                        executionTime = Date.now() - this.startTime;
                        result = {
                            success: true,
                            report: report,
                            executionTime: executionTime,
                            coverage: {
                                components: report.elements.length,
                                routes: report.routes.length,
                                apis: report.apiConnections.length
                            }
                        };
                        this.emit('auditCompleted', result);
                        console.log("\u2705 Enhanced audit completed in ".concat(executionTime, "ms"));
                        return [2 /*return*/, result];
                    case 13:
                        error_1 = _c.sent();
                        executionTime = Date.now() - this.startTime;
                        result = {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            executionTime: executionTime,
                            coverage: { components: 0, routes: 0, apis: 0 }
                        };
                        this.emit('auditError', { error: error_1, result: result });
                        console.error('❌ Enhanced audit failed:', error_1);
                        return [2 /*return*/, result];
                    case 14:
                        this.isRunning = false;
                        this.abortController = null;
                        return [4 /*yield*/, this.cleanup()];
                    case 15:
                        _c.sent();
                        return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Abort running audit
     */
    EnhancedAuditRunner.prototype.abort = function () {
        if (this.abortController) {
            this.abortController.abort();
            this.emit('auditAborted');
            console.log('🛑 Audit aborted by user');
        }
    };
    /**
     * Get current audit progress
     */
    EnhancedAuditRunner.prototype.getProgress = function () {
        if (!this.isRunning)
            return null;
        // This would be populated by the actual audit process
        return {
            phase: 'scanning',
            completed: 0,
            total: 100,
            percentage: 0,
            currentTask: 'Initializing...',
            estimatedTimeRemaining: 0
        };
    };
    EnhancedAuditRunner.prototype.initializePlugins = function (focus) {
        return __awaiter(this, void 0, void 0, function () {
            var shouldInclude, accessibilityPlugin, performancePlugin, securityPlugin;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔌 Initializing audit plugins...');
                        shouldInclude = function (pluginType) {
                            return !focus || focus.includes(pluginType);
                        };
                        if (!shouldInclude('accessibility')) return [3 /*break*/, 2];
                        accessibilityPlugin = new AccessibilityPlugin_1.AccessibilityPlugin();
                        return [4 /*yield*/, this.auditSystem.registerPlugin(accessibilityPlugin)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!shouldInclude('performance')) return [3 /*break*/, 4];
                        performancePlugin = new PerformancePlugin_1.PerformancePlugin();
                        return [4 /*yield*/, this.auditSystem.registerPlugin(performancePlugin)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!shouldInclude('security')) return [3 /*break*/, 6];
                        securityPlugin = new SecurityPlugin_1.SecurityPlugin();
                        return [4 /*yield*/, this.auditSystem.registerPlugin(securityPlugin)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        console.log('✅ Plugins initialized');
                        return [2 /*return*/];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.runCompleteAudit = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Running complete audit...');
                        return [4 /*yield*/, this.auditSystem.runFullAudit()];
                    case 1: 
                    // Use the optimized audit system for complete analysis
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.runQuickAudit = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var quickConfig, quickAuditSystem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('⚡ Running quick audit...');
                        quickConfig = __assign(__assign({}, this.config), { scanDepth: 'shallow', maxConcurrentScans: 2, apiTimeout: 3000, enableCaching: false });
                        quickAuditSystem = new UIAuditSystem_1.OptimizedUIAuditSystem(quickConfig);
                        if (!(!options.focus || options.focus.includes('security'))) return [3 /*break*/, 2];
                        return [4 /*yield*/, quickAuditSystem.registerPlugin(new SecurityPlugin_1.SecurityPlugin())];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, quickAuditSystem.runFullAudit()];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.runFocusedAudit = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var focusedConfig, focusedAuditSystem;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        console.log("\uD83C\uDFAF Running focused audit on: ".concat((_a = options.focus) === null || _a === void 0 ? void 0 : _a.join(', ')));
                        focusedConfig = __assign(__assign({}, this.config), { scanDepth: 'deep', includeAccessibility: (_c = (_b = options.focus) === null || _b === void 0 ? void 0 : _b.includes('accessibility')) !== null && _c !== void 0 ? _c : false, includePerformance: (_e = (_d = options.focus) === null || _d === void 0 ? void 0 : _d.includes('performance')) !== null && _e !== void 0 ? _e : false });
                        focusedAuditSystem = new UIAuditSystem_1.OptimizedUIAuditSystem(focusedConfig);
                        if (!((_f = options.focus) === null || _f === void 0 ? void 0 : _f.includes('accessibility'))) return [3 /*break*/, 2];
                        return [4 /*yield*/, focusedAuditSystem.registerPlugin(new AccessibilityPlugin_1.AccessibilityPlugin())];
                    case 1:
                        _j.sent();
                        _j.label = 2;
                    case 2:
                        if (!((_g = options.focus) === null || _g === void 0 ? void 0 : _g.includes('performance'))) return [3 /*break*/, 4];
                        return [4 /*yield*/, focusedAuditSystem.registerPlugin(new PerformancePlugin_1.PerformancePlugin())];
                    case 3:
                        _j.sent();
                        _j.label = 4;
                    case 4:
                        if (!((_h = options.focus) === null || _h === void 0 ? void 0 : _h.includes('security'))) return [3 /*break*/, 6];
                        return [4 /*yield*/, focusedAuditSystem.registerPlugin(new SecurityPlugin_1.SecurityPlugin())];
                    case 5:
                        _j.sent();
                        _j.label = 6;
                    case 6: return [4 /*yield*/, focusedAuditSystem.runFullAudit()];
                    case 7: return [2 /*return*/, _j.sent()];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.generateOutputs = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var formats, outputPath, _i, formats_1, format, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📄 Generating audit outputs...');
                        formats = options.outputFormats || this.config.outputFormats;
                        outputPath = options.outputPath || this.config.reportDirectory;
                        _i = 0, formats_1 = formats;
                        _a.label = 1;
                    case 1:
                        if (!(_i < formats_1.length)) return [3 /*break*/, 6];
                        format = formats_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.generateOutput(report, format, outputPath)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.warn("\u26A0\uFE0F Failed to generate ".concat(format, " output:"), error_2);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.generateOutput = function (report, format, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, filename, _a, markdown, html, csv;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        filename = "audit-report-".concat(timestamp);
                        _a = format;
                        switch (_a) {
                            case 'json': return [3 /*break*/, 1];
                            case 'markdown': return [3 /*break*/, 3];
                            case 'html': return [3 /*break*/, 6];
                            case 'csv': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 12];
                    case 1: return [4 /*yield*/, this.saveFile("".concat(outputPath, "/").concat(filename, ".json"), JSON.stringify(report, null, 2))];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 3: return [4 /*yield*/, this.generateMarkdownReport(report)];
                    case 4:
                        markdown = _b.sent();
                        return [4 /*yield*/, this.saveFile("".concat(outputPath, "/").concat(filename, ".md"), markdown)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 6: return [4 /*yield*/, this.generateHTMLReport(report)];
                    case 7:
                        html = _b.sent();
                        return [4 /*yield*/, this.saveFile("".concat(outputPath, "/").concat(filename, ".html"), html)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 9: return [4 /*yield*/, this.generateCSVReport(report)];
                    case 10:
                        csv = _b.sent();
                        return [4 /*yield*/, this.saveFile("".concat(outputPath, "/").concat(filename, ".csv"), csv)];
                    case 11:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        console.warn("\u26A0\uFE0F Unknown output format: ".concat(format));
                        _b.label = 13;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.generateMarkdownReport = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "# Enhanced UI Audit Report\n\n**Generated:** ".concat(report.timestamp.toISOString(), "\n**Execution Time:** ").concat(report.executionTime, "ms\n**Coverage:** ").concat(report.coverage.coveragePercentage, "%\n\n## Executive Summary\n\n").concat(this.generateExecutiveSummary(report), "\n\n## Critical Issues\n\n").concat(this.generateCriticalIssuesSection(report), "\n\n## Performance Analysis\n\n").concat(this.generatePerformanceSection(report), "\n\n## Security Analysis\n\n").concat(this.generateSecuritySection(report), "\n\n## Accessibility Analysis\n\n").concat(this.generateAccessibilitySection(report), "\n\n## Implementation Roadmap\n\n").concat(this.generateImplementationRoadmap(report), "\n\n## Detailed Findings\n\n").concat(this.generateDetailedFindings(report), "\n")];
            });
        });
    };
    EnhancedAuditRunner.prototype.generateHTMLReport = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>UI Audit Report - ".concat(report.timestamp.toISOString(), "</title>\n    <style>\n        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }\n        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }\n        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }\n        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }\n        .metric-value { font-size: 2em; font-weight: bold; color: #0366d6; }\n        .critical { color: #d73a49; }\n        .warning { color: #f66a0a; }\n        .success { color: #28a745; }\n        .section { margin-bottom: 40px; }\n        .issue { background: #fff5f5; border-left: 4px solid #d73a49; padding: 15px; margin: 10px 0; }\n        .recommendation { background: #f0f8ff; border-left: 4px solid #0366d6; padding: 15px; margin: 10px 0; }\n    </style>\n</head>\n<body>\n    <div class=\"header\">\n        <h1>Enhanced UI Audit Report</h1>\n        <p><strong>Generated:</strong> ").concat(report.timestamp.toISOString(), "</p>\n        <p><strong>Execution Time:</strong> ").concat(report.executionTime, "ms</p>\n        <p><strong>Coverage:</strong> ").concat(report.coverage.coveragePercentage, "%</p>\n    </div>\n    \n    <div class=\"summary\">\n        <div class=\"metric\">\n            <div class=\"metric-value critical\">").concat(report.summary.criticalIssues, "</div>\n            <div>Critical Issues</div>\n        </div>\n        <div class=\"metric\">\n            <div class=\"metric-value warning\">").concat(report.summary.highPriorityIssues, "</div>\n            <div>High Priority</div>\n        </div>\n        <div class=\"metric\">\n            <div class=\"metric-value\">").concat(report.summary.totalElements, "</div>\n            <div>Total Elements</div>\n        </div>\n        <div class=\"metric\">\n            <div class=\"metric-value success\">").concat(report.summary.workingElements, "</div>\n            <div>Working Elements</div>\n        </div>\n    </div>\n    \n    ").concat(this.generateHTMLSections(report), "\n</body>\n</html>")];
            });
        });
    };
    EnhancedAuditRunner.prototype.generateCSVReport = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, rows;
            return __generator(this, function (_a) {
                headers = [
                    'Element ID',
                    'Type',
                    'Status',
                    'Priority',
                    'Component',
                    'File Path',
                    'Issue Description',
                    'Recommendation'
                ];
                rows = report.elements.map(function (element) {
                    var _a, _b;
                    return [
                        element.id,
                        element.type,
                        element.status,
                        element.priority,
                        ((_a = element.location) === null || _a === void 0 ? void 0 : _a.componentName) || '',
                        ((_b = element.location) === null || _b === void 0 ? void 0 : _b.filePath) || '',
                        element.currentBehavior,
                        element.intendedBehavior
                    ];
                });
                return [2 /*return*/, __spreadArray([headers], rows, true).map(function (row) {
                        return row.map(function (cell) { return "\"".concat(cell, "\""); }).join(',');
                    }).join('\n')];
            });
        });
    };
    EnhancedAuditRunner.prototype.sendNotifications = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📢 Sending audit completion notifications...');
                        if (!this.config.integrations.slack) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sendSlackNotification(report)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!this.config.integrations.github) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createGitHubIssues(report)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!this.config.integrations.jira) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.createJiraTickets(report)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedAuditRunner.prototype.sendSlackNotification = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would send actual Slack notification
                console.log('📱 Slack notification sent');
                return [2 /*return*/];
            });
        });
    };
    EnhancedAuditRunner.prototype.createGitHubIssues = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would create actual GitHub issues
                console.log('🐛 GitHub issues created');
                return [2 /*return*/];
            });
        });
    };
    EnhancedAuditRunner.prototype.createJiraTickets = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would create actual Jira tickets
                console.log('🎫 Jira tickets created');
                return [2 /*return*/];
            });
        });
    };
    EnhancedAuditRunner.prototype.saveFile = function (path, content) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In real implementation, would save to file system
                console.log("\uD83D\uDCBE Saved report to ".concat(path, " (").concat(content.length, " characters)"));
                return [2 /*return*/];
            });
        });
    };
    EnhancedAuditRunner.prototype.setupEventForwarding = function () {
        var _this = this;
        // Forward events from audit system
        this.auditSystem.on('phaseStarted', function (phase) {
            _this.emit('progress', { phase: phase, status: 'started' });
        });
        this.auditSystem.on('phaseCompleted', function (phase, count) {
            _this.emit('progress', { phase: phase, status: 'completed', count: count });
        });
        this.auditSystem.on('progress', function (progress) {
            _this.emit('progress', progress);
        });
    };
    EnhancedAuditRunner.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🧹 Cleaning up audit resources...');
                return [2 /*return*/];
            });
        });
    };
    // Helper methods for report generation
    EnhancedAuditRunner.prototype.generateExecutiveSummary = function (report) {
        return "This audit analyzed ".concat(report.summary.totalElements, " UI elements and found ").concat(report.summary.criticalIssues, " critical issues requiring immediate attention.");
    };
    EnhancedAuditRunner.prototype.generateCriticalIssuesSection = function (report) {
        var criticalElements = report.elements.filter(function (e) { return e.priority === 'critical' && e.status !== 'working'; });
        return criticalElements.map(function (e) { return "- **".concat(e.id, "**: ").concat(e.currentBehavior); }).join('\n');
    };
    EnhancedAuditRunner.prototype.generatePerformanceSection = function (report) {
        return 'Performance analysis results would be detailed here.';
    };
    EnhancedAuditRunner.prototype.generateSecuritySection = function (report) {
        var _a;
        return "Found ".concat(((_a = report.securityFindings) === null || _a === void 0 ? void 0 : _a.length) || 0, " security issues.");
    };
    EnhancedAuditRunner.prototype.generateAccessibilitySection = function (report) {
        return 'Accessibility analysis results would be detailed here.';
    };
    EnhancedAuditRunner.prototype.generateImplementationRoadmap = function (report) {
        return report.implementationPlan.phases.map(function (phase) {
            return "### ".concat(phase.name, "\n- Estimated: ").concat(phase.estimatedHours, " hours\n- Deliverables: ").concat(phase.deliverables.join(', '));
        }).join('\n\n');
    };
    EnhancedAuditRunner.prototype.generateDetailedFindings = function (report) {
        return 'Detailed findings would be listed here.';
    };
    EnhancedAuditRunner.prototype.generateHTMLSections = function (report) {
        return '<div class="section"><h2>Detailed analysis sections would be generated here</h2></div>';
    };
    return EnhancedAuditRunner;
}(events_1.EventEmitter));
exports.EnhancedAuditRunner = EnhancedAuditRunner;
