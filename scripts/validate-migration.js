#!/usr/bin/env tsx
"use strict";
/**
 * Standalone Migration Validation Script
 *
 * Runs comprehensive validation of the core utilities migration
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
var path_1 = require("path");
var fs_1 = require("fs");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var corePath, validateMigration, report, performanceResults, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Core Utilities Migration Validation');
                    console.log('=====================================\n');
                    corePath = (0, path_1.resolve)(process.cwd(), 'core');
                    if (!(0, fs_1.existsSync)(corePath)) {
                        console.error('❌ Core module directory not found at:', corePath);
                        process.exit(1);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../core/src/validation/migration-validator'); })];
                case 2:
                    validateMigration = (_a.sent()).validateMigration;
                    return [4 /*yield*/, validateMigration()];
                case 3:
                    report = _a.sent();
                    // Display results
                    console.log('\n📊 Validation Results:');
                    console.log('======================');
                    report.summary.forEach(function (line) { return console.log(line); });
                    console.log('\n📈 Category Breakdown:');
                    console.log('=====================');
                    Object.entries(report.categories).forEach(function (_a) {
                        var category = _a[0], results = _a[1];
                        var passed = results.filter(function (r) { return r.success; }).length;
                        var total = results.length;
                        var status = passed === total ? '✅' : '⚠️';
                        console.log("".concat(status, " ").concat(category.toUpperCase(), ": ").concat(passed, "/").concat(total, " passed"));
                        // Show failed tests
                        var failed = results.filter(function (r) { return !r.success; });
                        if (failed.length > 0) {
                            failed.forEach(function (result) {
                                console.log("   \u274C ".concat(result.test, ": ").concat(result.message));
                            });
                        }
                    });
                    if (report.recommendations.length > 0) {
                        console.log('\n💡 Recommendations:');
                        console.log('==================');
                        report.recommendations.forEach(function (rec) { return console.log("\u2022 ".concat(rec)); });
                    }
                    // Performance summary
                    console.log('\n⚡ Performance Summary:');
                    console.log('=====================');
                    console.log("Total validation time: ".concat((report.overall.duration / 1000).toFixed(2), "s"));
                    performanceResults = report.categories.performance;
                    performanceResults.forEach(function (result) {
                        if (result.success && result.details) {
                            console.log("\u2022 ".concat(result.test, ": ").concat(JSON.stringify(result.details)));
                        }
                    });
                    // Exit with appropriate code
                    if (report.overall.success) {
                        console.log('\n🎉 Migration validation completed successfully!');
                        console.log('The core utilities migration is complete and functional.');
                        process.exit(0);
                    }
                    else {
                        console.log('\n⚠️  Migration validation completed with issues.');
                        console.log("".concat(report.overall.failed, " out of ").concat(report.overall.totalTests, " tests failed."));
                        console.log('Please address the issues before considering the migration complete.');
                        process.exit(1);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('❌ Validation failed with error:', error_1);
                    console.error('\nThis may indicate a serious issue with the migration.');
                    console.error('Please check the core module structure and dependencies.');
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Handle unhandled rejections
process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Run the validation
main().catch(function (error) {
    console.error('Fatal error:', error);
    process.exit(1);
});
