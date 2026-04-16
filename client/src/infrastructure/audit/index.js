"use strict";
/**
 * UI Audit System - Main Entry Point
 *
 * This module provides a unified interface to the UI audit system
 * for discovering and analyzing frontend-backend connectivity issues.
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
exports.AuditReporter = exports.LinkValidator = exports.RouteAnalyzer = exports.UIAuditSystem = void 0;
exports.runCompleteAudit = runCompleteAudit;
exports.runQuickAudit = runQuickAudit;
var UIAuditSystem_1 = require("./UIAuditSystem");
var RouteAnalyzer_js_1 = require("./RouteAnalyzer.js");
var LinkValidator_1 = require("./LinkValidator");
var AuditReporter_1 = require("./AuditReporter");
var UIAuditSystem_js_1 = require("./UIAuditSystem.js");
Object.defineProperty(exports, "UIAuditSystem", { enumerable: true, get: function () { return UIAuditSystem_js_1.UIAuditSystem; } });
var RouteAnalyzer_js_2 = require("./RouteAnalyzer.js");
Object.defineProperty(exports, "RouteAnalyzer", { enumerable: true, get: function () { return RouteAnalyzer_js_2.RouteAnalyzer; } });
var LinkValidator_js_1 = require("./LinkValidator.js");
Object.defineProperty(exports, "LinkValidator", { enumerable: true, get: function () { return LinkValidator_js_1.default; } });
var AuditReporter_js_1 = require("./AuditReporter.js");
Object.defineProperty(exports, "AuditReporter", { enumerable: true, get: function () { return AuditReporter_js_1.AuditReporter; } });
/**
 * Main audit orchestrator function
 *
 * This function runs the complete audit process and generates
 * a comprehensive report of all frontend-backend connectivity issues.
 */
function runCompleteAudit() {
    return __awaiter(this, void 0, void 0, function () {
        var auditSystem, routeAnalyzer, linkValidator, auditReporter, elements, routes, apiConnections, routeAnalysis, linkValidation, report, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting complete UI audit...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    auditSystem = new UIAuditSystem_1.UIAuditSystem({
                        scanDepth: 'deep',
                        includeTestFiles: false,
                        excludePaths: [],
                        componentDirectories: [],
                        apiTimeout: 5000,
                        parallelism: 4,
                        cacheResults: true,
                        cacheDuration: 60,
                        includeAccessibility: true,
                        includePerformance: true,
                        customRules: []
                    });
                    routeAnalyzer = new RouteAnalyzer_js_1.RouteAnalyzer();
                    linkValidator = new LinkValidator_1.default();
                    auditReporter = new AuditReporter_1.AuditReporter();
                    // Step 1: Scan UI components
                    console.log('\n📋 Step 1: Scanning UI components...');
                    return [4 /*yield*/, auditSystem.scanComponents()];
                case 2:
                    elements = _a.sent();
                    console.log("\u2705 Found ".concat(elements.length, " interactive elements"));
                    // Step 2: Validate routes
                    console.log('\n🛣️  Step 2: Validating routes...');
                    return [4 /*yield*/, auditSystem.validateRoutes()];
                case 3:
                    routes = _a.sent();
                    console.log("\u2705 Validated ".concat(routes.length, " routes"));
                    // Step 3: Test API connections
                    console.log('\n🔌 Step 3: Testing API connections...');
                    return [4 /*yield*/, auditSystem.testAPIConnections()];
                case 4:
                    apiConnections = _a.sent();
                    console.log("\u2705 Tested ".concat(apiConnections.length, " API endpoints"));
                    // Step 4: Analyze routing configuration
                    console.log('\n🔍 Step 4: Analyzing routing configuration...');
                    return [4 /*yield*/, routeAnalyzer.analyzeRoutes()];
                case 5:
                    routeAnalysis = _a.sent();
                    console.log("\u2705 Found ".concat(routeAnalysis.mismatches.length, " route mismatches"));
                    // Step 5: Validate all links
                    console.log('\n🔗 Step 5: Validating links...');
                    return [4 /*yield*/, linkValidator.validateAllLinks()];
                case 6:
                    linkValidation = _a.sent();
                    console.log("\u2705 Validated ".concat(linkValidation.linkResults.length, " links"));
                    // Step 6: Generate comprehensive report
                    console.log('\n📊 Step 6: Generating comprehensive report...');
                    return [4 /*yield*/, auditReporter.generateComprehensiveReport(elements, routes, apiConnections, routeAnalysis.mismatches, linkValidation.summary)];
                case 7:
                    report = _a.sent();
                    console.log('\n🎉 Audit completed successfully!');
                    console.log("\uD83D\uDCC4 Report ID: ".concat(report.id));
                    console.log("\u23F1\uFE0F  Total estimated fix time: ".concat(report.summary.estimatedFixTime, " hours"));
                    console.log("\uD83D\uDD34 Critical issues: ".concat(report.summary.criticalIssues));
                    console.log("\uD83D\uDFE1 High priority issues: ".concat(report.summary.highPriorityIssues));
                    return [2 /*return*/, {
                            success: true,
                            report: report
                        }];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Audit failed:', error_1);
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error'
                        }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Quick audit function for development use
 *
 * Runs a simplified audit focusing on the most critical issues.
 */
function runQuickAudit() {
    return __awaiter(this, void 0, void 0, function () {
        var auditSystem, elements, criticalElements, routes, brokenRoutes, apiConnections, brokenAPIs, summary, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('⚡ Starting quick audit...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    auditSystem = new UIAuditSystem_1.UIAuditSystem({
                        scanDepth: 'shallow',
                        includeTestFiles: false,
                        excludePaths: [],
                        componentDirectories: [],
                        apiTimeout: 3000,
                        parallelism: 2,
                        cacheResults: true,
                        cacheDuration: 30,
                        includeAccessibility: false,
                        includePerformance: false,
                        customRules: []
                    });
                    return [4 /*yield*/, auditSystem.scanComponents()];
                case 2:
                    elements = _a.sent();
                    criticalElements = elements.filter(function (e) { return e.priority === 'critical'; });
                    return [4 /*yield*/, auditSystem.validateRoutes()];
                case 3:
                    routes = _a.sent();
                    brokenRoutes = routes.filter(function (r) {
                        return r.status === 'broken' || r.status === '404';
                    });
                    return [4 /*yield*/, auditSystem.testAPIConnections()];
                case 4:
                    apiConnections = _a.sent();
                    brokenAPIs = apiConnections.filter(function (a) { return a.status === 'broken'; });
                    summary = {
                        totalElements: elements.length,
                        criticalElements: criticalElements.length,
                        brokenRoutes: brokenRoutes.length,
                        brokenAPIs: brokenAPIs.length,
                        quickRecommendations: __spreadArray(__spreadArray(__spreadArray([], (brokenAPIs.length > 0 ? ['Fix broken API endpoints immediately'] : []), true), (brokenRoutes.length > 0 ? ['Implement missing routes'] : []), true), (criticalElements.length > 0 ? ['Connect critical UI elements'] : []), true)
                    };
                    console.log('⚡ Quick audit completed!');
                    console.log("\uD83D\uDD0D Scanned ".concat(elements.length, " elements"));
                    console.log("\uD83D\uDD34 Found ".concat(criticalElements.length, " critical issues"));
                    console.log("\uD83D\uDEE3\uFE0F  Found ".concat(brokenRoutes.length, " broken routes"));
                    console.log("\uD83D\uDD0C Found ".concat(brokenAPIs.length, " broken APIs"));
                    return [2 /*return*/, {
                            success: true,
                            summary: summary
                        }];
                case 5:
                    error_2 = _a.sent();
                    console.error('❌ Quick audit failed:', error_2);
                    return [2 /*return*/, {
                            success: false,
                            error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
