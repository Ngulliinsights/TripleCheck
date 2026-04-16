#!/usr/bin/env ts-node
"use strict";
/**
 * Core Utilities Migration Runner
 *
 * Orchestrates the complete migration of existing services to core utilities
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
exports.MigrationRunner = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var glob_1 = require("glob");
var migrate_core_utilities_1 = require("./migrate-core-utilities");
var cache_migration_1 = require("./migration-helpers/cache-migration");
var middleware_migration_1 = require("./migration-helpers/middleware-migration");
var config_migration_1 = require("./migration-helpers/config-migration");
var MigrationRunner = /** @class */ (function () {
    function MigrationRunner(options) {
        if (options === void 0) { options = {}; }
        this.results = {
            success: true,
            filesProcessed: 0,
            filesUpdated: 0,
            errors: [],
            warnings: []
        };
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
    }
    MigrationRunner.prototype.runMigration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Starting Core Utilities Migration');
                        console.log("Mode: ".concat(this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'));
                        console.log('');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        // Step 1: Run general migration
                        return [4 /*yield*/, this.runGeneralMigration()];
                    case 2:
                        // Step 1: Run general migration
                        _a.sent();
                        // Step 2: Run specific service migrations
                        return [4 /*yield*/, this.runCacheMigration()];
                    case 3:
                        // Step 2: Run specific service migrations
                        _a.sent();
                        return [4 /*yield*/, this.runMiddlewareMigration()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.runConfigMigration()];
                    case 5:
                        _a.sent();
                        // Step 3: Validate migrations
                        return [4 /*yield*/, this.validateMigrations()];
                    case 6:
                        // Step 3: Validate migrations
                        _a.sent();
                        // Step 4: Generate final report
                        return [4 /*yield*/, this.generateFinalReport()];
                    case 7:
                        // Step 4: Generate final report
                        _a.sent();
                        console.log('✅ Migration completed successfully!');
                        return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        console.error('❌ Migration failed:', error_1);
                        this.results.success = false;
                        this.results.errors.push("Migration failed: ".concat(error_1));
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, this.results];
                }
            });
        });
    };
    MigrationRunner.prototype.runGeneralMigration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var migrator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📦 Running general migration...');
                        migrator = new migrate_core_utilities_1.CoreUtilitiesMigrator(this.dryRun);
                        return [4 /*yield*/, migrator.migrateProject()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, migrator.addCoreImports()];
                    case 2:
                        _a.sent();
                        console.log('✅ General migration completed');
                        return [2 /*return*/];
                }
            });
        });
    };
    MigrationRunner.prototype.runCacheMigration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheFiles, _loop_1, this_1, _i, cacheFiles_1, filePath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🗄️  Running cache service migration...');
                        return [4 /*yield*/, this.findFilesWithPattern([
                                'cacheService',
                                'CacheService',
                                'PropertyCacheService'
                            ])];
                    case 1:
                        cacheFiles = _a.sent();
                        _loop_1 = function (filePath) {
                            var updated, validation, error_2;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 4, , 5]);
                                        this_1.results.filesProcessed++;
                                        updated = false;
                                        return [4 /*yield*/, cache_migration_1.CacheMigrationHelper.updateCacheImports(filePath)];
                                    case 1:
                                        updated = (_c.sent()) || updated;
                                        return [4 /*yield*/, cache_migration_1.CacheMigrationHelper.updateCacheMethodCalls(filePath)];
                                    case 2:
                                        updated = (_c.sent()) || updated;
                                        if (updated) {
                                            this_1.results.filesUpdated++;
                                            if (this_1.verbose) {
                                                console.log("  \u2705 Updated cache usage in ".concat(this_1.getRelativePath(filePath)));
                                            }
                                        }
                                        return [4 /*yield*/, cache_migration_1.CacheMigrationHelper.validateCacheMigration(filePath)];
                                    case 3:
                                        validation = _c.sent();
                                        if (!validation.isValid) {
                                            (_b = this_1.results.warnings).push.apply(_b, validation.issues.map(function (issue) {
                                                return "".concat(_this.getRelativePath(filePath), ": ").concat(issue);
                                            }));
                                        }
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_2 = _c.sent();
                                        this_1.results.errors.push("Cache migration error in ".concat(filePath, ": ").concat(error_2));
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, cacheFiles_1 = cacheFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < cacheFiles_1.length)) return [3 /*break*/, 5];
                        filePath = cacheFiles_1[_i];
                        return [5 /*yield**/, _loop_1(filePath)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log("\u2705 Cache migration completed (".concat(this.results.filesUpdated, " files updated)"));
                        return [2 /*return*/];
                }
            });
        });
    };
    MigrationRunner.prototype.runMiddlewareMigration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var middlewareFiles, _loop_2, this_2, _i, middlewareFiles_1, filePath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔧 Running middleware migration...');
                        return [4 /*yield*/, this.findFilesWithPattern([
                                'requireAuth',
                                'validateRequest',
                                'cacheResponse',
                                'middleware'
                            ])];
                    case 1:
                        middlewareFiles = _a.sent();
                        _loop_2 = function (filePath) {
                            var updated, validation, error_3;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 6, , 7]);
                                        this_2.results.filesProcessed++;
                                        updated = false;
                                        return [4 /*yield*/, middleware_migration_1.MiddlewareMigrationHelper.updateMiddlewareImports(filePath)];
                                    case 1:
                                        updated = (_c.sent()) || updated;
                                        return [4 /*yield*/, middleware_migration_1.MiddlewareMigrationHelper.updateValidationMiddleware(filePath)];
                                    case 2:
                                        updated = (_c.sent()) || updated;
                                        return [4 /*yield*/, middleware_migration_1.MiddlewareMigrationHelper.updateAuthMiddleware(filePath)];
                                    case 3:
                                        updated = (_c.sent()) || updated;
                                        return [4 /*yield*/, middleware_migration_1.MiddlewareMigrationHelper.updateErrorHandlingMiddleware(filePath)];
                                    case 4:
                                        updated = (_c.sent()) || updated;
                                        if (updated) {
                                            this_2.results.filesUpdated++;
                                            if (this_2.verbose) {
                                                console.log("  \u2705 Updated middleware usage in ".concat(this_2.getRelativePath(filePath)));
                                            }
                                        }
                                        return [4 /*yield*/, middleware_migration_1.MiddlewareMigrationHelper.validateMiddlewareMigration(filePath)];
                                    case 5:
                                        validation = _c.sent();
                                        if (!validation.isValid) {
                                            (_b = this_2.results.warnings).push.apply(_b, validation.issues.map(function (issue) {
                                                return "".concat(_this.getRelativePath(filePath), ": ").concat(issue);
                                            }));
                                        }
                                        return [3 /*break*/, 7];
                                    case 6:
                                        error_3 = _c.sent();
                                        this_2.results.errors.push("Middleware migration error in ".concat(filePath, ": ").concat(error_3));
                                        return [3 /*break*/, 7];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, middlewareFiles_1 = middlewareFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < middlewareFiles_1.length)) return [3 /*break*/, 5];
                        filePath = middlewareFiles_1[_i];
                        return [5 /*yield**/, _loop_2(filePath)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log("\u2705 Middleware migration completed");
                        return [2 /*return*/];
                }
            });
        });
    };
    MigrationRunner.prototype.runConfigMigration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configFiles, _loop_3, this_3, _i, configFiles_1, filePath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('⚙️  Running configuration migration...');
                        return [4 /*yield*/, this.findFilesWithPattern([
                                'process.env',
                                'FEATURE_',
                                'config'
                            ])];
                    case 1:
                        configFiles = _a.sent();
                        _loop_3 = function (filePath) {
                            var updated, validation, error_4;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 5, , 6]);
                                        this_3.results.filesProcessed++;
                                        updated = false;
                                        return [4 /*yield*/, config_migration_1.ConfigMigrationHelper.updateConfigImports(filePath)];
                                    case 1:
                                        updated = (_c.sent()) || updated;
                                        return [4 /*yield*/, config_migration_1.ConfigMigrationHelper.updateFeatureFlags(filePath)];
                                    case 2:
                                        updated = (_c.sent()) || updated;
                                        return [4 /*yield*/, config_migration_1.ConfigMigrationHelper.updateConfigObjects(filePath)];
                                    case 3:
                                        updated = (_c.sent()) || updated;
                                        if (updated) {
                                            this_3.results.filesUpdated++;
                                            if (this_3.verbose) {
                                                console.log("  \u2705 Updated configuration usage in ".concat(this_3.getRelativePath(filePath)));
                                            }
                                        }
                                        return [4 /*yield*/, config_migration_1.ConfigMigrationHelper.validateConfigMigration(filePath)];
                                    case 4:
                                        validation = _c.sent();
                                        if (!validation.isValid) {
                                            (_b = this_3.results.warnings).push.apply(_b, validation.issues.map(function (issue) {
                                                return "".concat(_this.getRelativePath(filePath), ": ").concat(issue);
                                            }));
                                        }
                                        return [3 /*break*/, 6];
                                    case 5:
                                        error_4 = _c.sent();
                                        this_3.results.errors.push("Config migration error in ".concat(filePath, ": ").concat(error_4));
                                        return [3 /*break*/, 6];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        };
                        this_3 = this;
                        _i = 0, configFiles_1 = configFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < configFiles_1.length)) return [3 /*break*/, 5];
                        filePath = configFiles_1[_i];
                        return [5 /*yield**/, _loop_3(filePath)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log("\u2705 Configuration migration completed");
                        return [2 /*return*/];
                }
            });
        });
    };
    MigrationRunner.prototype.validateMigrations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allFiles, oldPatterns, _i, allFiles_1, filePath, content, _a, oldPatterns_1, _b, pattern, description, error_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log('🔍 Validating migrations...');
                        return [4 /*yield*/, (0, glob_1.glob)('**/*.{ts,tsx}', {
                                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', 'core/**/*'],
                                absolute: true
                            })];
                    case 1:
                        allFiles = _c.sent();
                        oldPatterns = [
                            { pattern: /src\/shared\/services\/CacheService/g, description: 'Old cache service import' },
                            { pattern: /server\/infrastructure\/cache\/CacheService/g, description: 'Old server cache import' },
                            { pattern: /\.\.\/middleware\/auth\.middleware/g, description: 'Old auth middleware import' },
                            { pattern: /\.\.\/middleware\/validation\.middleware/g, description: 'Old validation middleware import' },
                            { pattern: /process\.env\.REDIS_URL/g, description: 'Unmigrated Redis URL' },
                            { pattern: /process\.env\.CACHE_TTL/g, description: 'Unmigrated cache TTL' }
                        ];
                        _i = 0, allFiles_1 = allFiles;
                        _c.label = 2;
                    case 2:
                        if (!(_i < allFiles_1.length)) return [3 /*break*/, 7];
                        filePath = allFiles_1[_i];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 4:
                        content = _c.sent();
                        for (_a = 0, oldPatterns_1 = oldPatterns; _a < oldPatterns_1.length; _a++) {
                            _b = oldPatterns_1[_a], pattern = _b.pattern, description = _b.description;
                            if (pattern.test(content)) {
                                this.results.warnings.push("".concat(this.getRelativePath(filePath), ": ").concat(description));
                            }
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_5 = _c.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        console.log("\u2705 Validation completed (".concat(this.results.warnings.length, " warnings)"));
                        return [2 /*return*/];
                }
            });
        });
    };
    MigrationRunner.prototype.generateFinalReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var reportPath, report, _i, _a, error, _b, _c, warning;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        reportPath = (0, path_1.join)(process.cwd(), 'migration-final-report.md');
                        report = "# Core Utilities Migration Final Report\n\n";
                        report += "Generated: ".concat(new Date().toISOString(), "\n");
                        report += "Mode: ".concat(this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION', "\n\n");
                        report += "## Summary\n\n";
                        report += "- Files processed: ".concat(this.results.filesProcessed, "\n");
                        report += "- Files updated: ".concat(this.results.filesUpdated, "\n");
                        report += "- Errors: ".concat(this.results.errors.length, "\n");
                        report += "- Warnings: ".concat(this.results.warnings.length, "\n");
                        report += "- Success: ".concat(this.results.success ? '✅' : '❌', "\n\n");
                        if (this.results.errors.length > 0) {
                            report += "## Errors\n\n";
                            for (_i = 0, _a = this.results.errors; _i < _a.length; _i++) {
                                error = _a[_i];
                                report += "- \u274C ".concat(error, "\n");
                            }
                            report += '\n';
                        }
                        if (this.results.warnings.length > 0) {
                            report += "## Warnings\n\n";
                            for (_b = 0, _c = this.results.warnings; _b < _c.length; _b++) {
                                warning = _c[_b];
                                report += "- \u26A0\uFE0F  ".concat(warning, "\n");
                            }
                            report += '\n';
                        }
                        report += "## Next Steps\n\n";
                        if (this.dryRun) {
                            report += "1. Review the warnings and errors above\n";
                            report += "2. Run the migration script without --dry-run to apply changes\n";
                            report += "3. Test the application thoroughly\n";
                            report += "4. Address any remaining warnings manually\n\n";
                        }
                        else {
                            report += "1. Test the application thoroughly\n";
                            report += "2. Address any remaining warnings manually\n";
                            report += "3. Remove legacy adapters once migration is complete\n";
                            report += "4. Update documentation and team knowledge\n\n";
                        }
                        report += "## Migration Guides\n\n";
                        report += "### Cache Service Migration\n";
                        report += cache_migration_1.CacheMigrationHelper.generateCacheConfigMigration();
                        report += "\n### Middleware Migration\n";
                        report += middleware_migration_1.MiddlewareMigrationHelper.generateMiddlewareConfigMigration();
                        report += "\n### Configuration Migration\n";
                        report += config_migration_1.ConfigMigrationHelper.generateConfigMigrationGuide();
                        return [4 /*yield*/, fs_1.promises.writeFile(reportPath, report)];
                    case 1:
                        _d.sent();
                        console.log("\uD83D\uDCCA Final migration report generated: ".concat(reportPath));
                        return [2 /*return*/];
                }
            });
        });
    };
    MigrationRunner.prototype.findFilesWithPattern = function (patterns) {
        return __awaiter(this, void 0, void 0, function () {
            var allFiles, matchingFiles, _i, allFiles_2, filePath, content, _a, patterns_1, pattern, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, glob_1.glob)('**/*.{ts,tsx}', {
                            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', 'core/**/*'],
                            absolute: true
                        })];
                    case 1:
                        allFiles = _b.sent();
                        matchingFiles = [];
                        _i = 0, allFiles_2 = allFiles;
                        _b.label = 2;
                    case 2:
                        if (!(_i < allFiles_2.length)) return [3 /*break*/, 7];
                        filePath = allFiles_2[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 4:
                        content = _b.sent();
                        for (_a = 0, patterns_1 = patterns; _a < patterns_1.length; _a++) {
                            pattern = patterns_1[_a];
                            if (content.includes(pattern)) {
                                matchingFiles.push(filePath);
                                break; // Only add file once
                            }
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_6 = _b.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, matchingFiles];
                }
            });
        });
    };
    MigrationRunner.prototype.getRelativePath = function (filePath) {
        return filePath.replace(process.cwd(), '.');
    };
    return MigrationRunner;
}());
exports.MigrationRunner = MigrationRunner;
// CLI interface
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, dryRun, verbose, help, runner, result, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = process.argv.slice(2);
                    dryRun = args.includes('--dry-run') || args.includes('-d');
                    verbose = args.includes('--verbose') || args.includes('-v');
                    help = args.includes('--help') || args.includes('-h');
                    if (help) {
                        console.log("\nCore Utilities Migration Runner\n\nUsage:\n  npm run run-migration [options]\n\nOptions:\n  --dry-run, -d     Run in dry-run mode (show changes without applying them)\n  --verbose, -v     Show detailed output for each file processed\n  --help, -h        Show this help message\n\nExamples:\n  npm run run-migration --dry-run --verbose    # Preview changes with details\n  npm run run-migration                        # Apply changes\n");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    runner = new MigrationRunner({ dryRun: dryRun, verbose: verbose });
                    return [4 /*yield*/, runner.runMigration()];
                case 2:
                    result = _a.sent();
                    if (!result.success) {
                        process.exit(1);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_7 = _a.sent();
                    console.error('❌ Migration runner failed:', error_7);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
