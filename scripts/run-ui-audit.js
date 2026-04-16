#!/usr/bin/env tsx
"use strict";
/**
 * UI Audit Runner Script
 *
 * Standalone script to run the enhanced UI audit system
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
var EnhancedAuditRunner_1 = require("../src/infrastructure/audit/EnhancedAuditRunner");
var config_1 = require("../src/infrastructure/audit/config");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, auditRunner, args, isQuick, isFocused, focus_1, focusIndex, focusAreas, result, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🚀 Starting UI Audit System...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    config = (0, config_1.getAuditConfig)();
                    auditRunner = new EnhancedAuditRunner_1.EnhancedAuditRunner(config);
                    // Set up progress monitoring
                    auditRunner.on('progress', function (progress) {
                        if (progress.phase) {
                            console.log("\uD83D\uDCCA ".concat(progress.phase, ": ").concat(progress.completed || 0, "/").concat(progress.total || 0));
                        }
                    });
                    auditRunner.on('auditStarted', function () {
                        console.log('🔍 Audit started...');
                    });
                    auditRunner.on('auditCompleted', function (result) {
                        console.log('✅ Audit completed successfully!');
                        console.log("\uD83D\uDCCA Found ".concat(result.coverage.components, " components, ").concat(result.coverage.routes, " routes, ").concat(result.coverage.apis, " APIs"));
                    });
                    auditRunner.on('auditError', function (error) {
                        console.error('❌ Audit failed:', error);
                    });
                    args = process.argv.slice(2);
                    isQuick = args.includes('--quick');
                    isFocused = args.includes('--focused');
                    focusIndex = args.indexOf('--focus');
                    if (focusIndex !== -1 && args[focusIndex + 1]) {
                        focusAreas = ((_a = args[focusIndex + 1]) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
                        focus_1 = focusAreas.filter(function (area) {
                            return ['accessibility', 'performance', 'security', 'connectivity'].includes(area);
                        });
                    }
                    return [4 /*yield*/, auditRunner.runAudit({
                            mode: isQuick ? 'quick' : isFocused ? 'focused' : 'complete',
                            focus: focus_1 || undefined,
                            outputFormats: ['json', 'markdown'],
                            outputPath: 'reports/audit',
                            includeScreenshots: false,
                            parallel: true,
                            continueOnError: true,
                            generateRecommendations: true,
                            notifyOnCompletion: false
                        })];
                case 2:
                    result = _b.sent();
                    if (result.success && result.report) {
                        console.log('\n📊 AUDIT SUMMARY:');
                        console.log("   Total Elements: ".concat(result.report.summary.totalElements));
                        console.log("   Working: ".concat(result.report.summary.workingElements));
                        console.log("   Broken: ".concat(result.report.summary.brokenElements));
                        console.log("   Critical Issues: ".concat(result.report.summary.criticalIssues));
                        console.log("   Estimated Fix Time: ".concat(result.report.summary.estimatedFixTime, " hours"));
                        console.log("   Execution Time: ".concat(result.executionTime, "ms"));
                        if (result.report.recommendations && result.report.recommendations.length > 0) {
                            console.log('\n🎯 TOP PRIORITY ACTIONS:');
                            result.report.recommendations.slice(0, 3).forEach(function (rec, index) {
                                console.log("   ".concat(index + 1, ". ").concat(rec.title, " (").concat(rec.priority, ")"));
                                console.log("      \uD83D\uDCDD ".concat(rec.description));
                                console.log("      \u23F1\uFE0F  ".concat(rec.estimatedEffort, " hours"));
                            });
                        }
                        console.log('\n📋 IMPLEMENTATION PLAN:');
                        console.log('   Phase 1: Critical Fixes (immediate)');
                        console.log('   Phase 2: High Priority Features (1-2 weeks)');
                        console.log('   Phase 3: Performance & Polish (2-4 weeks)');
                        // Exit with appropriate code
                        if (result.report.summary.criticalIssues > 0) {
                            console.log('\n🔴 Critical issues found. Address before deployment.');
                            process.exit(1);
                        }
                        else {
                            console.log('\n✅ No critical issues found.');
                            process.exit(0);
                        }
                    }
                    else {
                        console.error('❌ Audit failed:', result.error);
                        process.exit(2);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    console.error('❌ Fatal error:', error_1);
                    process.exit(2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Handle graceful shutdown
process.on('SIGINT', function () {
    console.log('\n🛑 Audit interrupted by user');
    process.exit(130);
});
process.on('SIGTERM', function () {
    console.log('\n🛑 Audit terminated');
    process.exit(143);
});
// Run the script
main().catch(function (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(2);
});
