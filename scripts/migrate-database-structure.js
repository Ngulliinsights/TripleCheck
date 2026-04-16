#!/usr/bin/env tsx
"use strict";
/**
 * Database Structure Migration Script
 *
 * Migrates database/ directory to server/infrastructure/database/
 * with proper conflict resolution and validation.
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
exports.DatabaseMigrator = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
var projectRoot = (0, path_1.join)(__dirname, '..');
var DatabaseMigrator = /** @class */ (function () {
    function DatabaseMigrator(config) {
        if (config === void 0) { config = {}; }
        this.errors = [];
        this.warnings = [];
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.config = __assign({ sourceDir: (0, path_1.join)(projectRoot, 'database'), targetDir: (0, path_1.join)(projectRoot, 'server/infrastructure/database'), backupDir: (0, path_1.join)(projectRoot, "database_migration_backup_".concat(timestamp)), dryRun: false, skipBackup: false }, config);
    }
    DatabaseMigrator.prototype.migrate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Starting Database Structure Migration');
                        console.log("Source: ".concat(this.config.sourceDir));
                        console.log("Target: ".concat(this.config.targetDir));
                        console.log("Dry Run: ".concat(this.config.dryRun));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 13]);
                        // Phase 1: Pre-migration validation
                        return [4 /*yield*/, this.validatePreConditions()];
                    case 2:
                        // Phase 1: Pre-migration validation
                        _a.sent();
                        if (!!this.config.skipBackup) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createBackups()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: 
                    // Phase 3: Migrate directory structure
                    return [4 /*yield*/, this.migrateDirectoryStructure()];
                    case 5:
                        // Phase 3: Migrate directory structure
                        _a.sent();
                        // Phase 4: Update configuration files
                        return [4 /*yield*/, this.updateConfigurationFiles()];
                    case 6:
                        // Phase 4: Update configuration files
                        _a.sent();
                        // Phase 5: Update package.json scripts
                        return [4 /*yield*/, this.updatePackageScripts()];
                    case 7:
                        // Phase 5: Update package.json scripts
                        _a.sent();
                        // Phase 6: Update import statements
                        return [4 /*yield*/, this.updateImportStatements()];
                    case 8:
                        // Phase 6: Update import statements
                        _a.sent();
                        // Phase 7: Post-migration validation
                        return [4 /*yield*/, this.validatePostMigration()];
                    case 9:
                        // Phase 7: Post-migration validation
                        _a.sent();
                        console.log('✅ Migration completed successfully!');
                        this.printSummary();
                        return [2 /*return*/, true];
                    case 10:
                        error_1 = _a.sent();
                        console.error('❌ Migration failed:', error_1);
                        this.errors.push(error_1 instanceof Error ? error_1.message : String(error_1));
                        if (!!this.config.dryRun) return [3 /*break*/, 12];
                        console.log('🔄 Attempting rollback...');
                        return [4 /*yield*/, this.rollback()];
                    case 11:
                        _a.sent();
                        _a.label = 12;
                    case 12: return [2 /*return*/, false];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseMigrator.prototype.validatePreConditions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gitStatus, packageJson, databaseScripts;
            return __generator(this, function (_a) {
                console.log('📋 Validating pre-conditions...');
                // Check if source directory exists
                if (!(0, fs_1.existsSync)(this.config.sourceDir)) {
                    throw new Error("Source directory does not exist: ".concat(this.config.sourceDir));
                }
                // Check if target directory exists
                if (!(0, fs_1.existsSync)(this.config.targetDir)) {
                    this.warnings.push("Target directory does not exist, will be created: ".concat(this.config.targetDir));
                }
                // Check for uncommitted changes
                try {
                    gitStatus = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf8' });
                    if (gitStatus.trim()) {
                        this.warnings.push('Uncommitted changes detected. Consider committing before migration.');
                    }
                }
                catch (error) {
                    this.warnings.push('Could not check git status. Ensure you have a clean working directory.');
                }
                packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(projectRoot, 'package.json'), 'utf8'));
                databaseScripts = Object.entries(packageJson.scripts || {})
                    .filter(function (_a) {
                    var script = _a[1];
                    return typeof script === 'string' && script.includes('database/');
                })
                    .length;
                console.log("\uD83D\uDCCA Found ".concat(databaseScripts, " npm scripts referencing database/"));
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.createBackups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var drizzleConfig;
            return __generator(this, function (_a) {
                console.log('💾 Creating backups...');
                if (!this.config.dryRun) {
                    // Backup source directory
                    (0, child_process_1.execSync)("cp -r \"".concat(this.config.sourceDir, "\" \"").concat(this.config.backupDir, "_source\""));
                    // Backup target directory if it exists
                    if ((0, fs_1.existsSync)(this.config.targetDir)) {
                        (0, child_process_1.execSync)("cp -r \"".concat(this.config.targetDir, "\" \"").concat(this.config.backupDir, "_target\""));
                    }
                    // Backup package.json
                    (0, child_process_1.execSync)("cp \"".concat((0, path_1.join)(projectRoot, 'package.json'), "\" \"").concat(this.config.backupDir, "_package.json\""));
                    drizzleConfig = (0, path_1.join)(projectRoot, 'drizzle.config.ts');
                    if ((0, fs_1.existsSync)(drizzleConfig)) {
                        (0, child_process_1.execSync)("cp \"".concat(drizzleConfig, "\" \"").concat(this.config.backupDir, "_drizzle.config.ts\""));
                    }
                }
                console.log('✅ Backups created');
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.migrateDirectoryStructure = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('📁 Migrating directory structure...');
                if (!this.config.dryRun) {
                    // Ensure target directory exists
                    (0, fs_1.mkdirSync)(this.config.targetDir, { recursive: true });
                    // Use rsync for intelligent merging
                    try {
                        (0, child_process_1.execSync)("rsync -av \"".concat(this.config.sourceDir, "/\" \"").concat(this.config.targetDir, "/\" --exclude=\"*.md\" --exclude=\"README*\""));
                    }
                    catch (error) {
                        // Fallback to manual copy if rsync fails
                        this.copyDirectoryRecursive(this.config.sourceDir, this.config.targetDir);
                    }
                }
                console.log('✅ Directory structure migrated');
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.copyDirectoryRecursive = function (src, dest) {
        if (!(0, fs_1.existsSync)(dest)) {
            (0, fs_1.mkdirSync)(dest, { recursive: true });
        }
        var items = (0, fs_1.readdirSync)(src);
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var srcPath = (0, path_1.join)(src, item);
            var destPath = (0, path_1.join)(dest, item);
            if ((0, fs_1.statSync)(srcPath).isDirectory()) {
                this.copyDirectoryRecursive(srcPath, destPath);
            }
            else {
                // Skip README files and markdown docs
                if (!item.toLowerCase().includes('readme') && !item.endsWith('.md')) {
                    (0, child_process_1.execSync)("cp \"".concat(srcPath, "\" \"").concat(destPath, "\""));
                }
            }
        }
    };
    DatabaseMigrator.prototype.updateConfigurationFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var drizzleConfigPath, content, tsconfigFiles, _i, tsconfigFiles_1, configFile, configPath, content, originalContent;
            return __generator(this, function (_a) {
                console.log('⚙️ Updating configuration files...');
                drizzleConfigPath = (0, path_1.join)(projectRoot, 'drizzle.config.ts');
                if ((0, fs_1.existsSync)(drizzleConfigPath)) {
                    content = (0, fs_1.readFileSync)(drizzleConfigPath, 'utf8');
                    content = content.replace(/out: "\.\/database\/migrations"/g, 'out: "./server/infrastructure/database/migrations"');
                    content = content.replace(/schema: "\.\/database\/schemas\/core\/index\.ts"/g, 'schema: "./server/infrastructure/database/schemas/core/index.ts"');
                    if (!this.config.dryRun) {
                        (0, fs_1.writeFileSync)(drizzleConfigPath, content);
                    }
                    console.log('  ✅ Updated drizzle.config.ts');
                }
                tsconfigFiles = ['tsconfig.json', 'tsconfig.dev.json', 'tsconfig.infrastructure.json'];
                for (_i = 0, tsconfigFiles_1 = tsconfigFiles; _i < tsconfigFiles_1.length; _i++) {
                    configFile = tsconfigFiles_1[_i];
                    configPath = (0, path_1.join)(projectRoot, configFile);
                    if ((0, fs_1.existsSync)(configPath)) {
                        content = (0, fs_1.readFileSync)(configPath, 'utf8');
                        originalContent = content;
                        content = content.replace(/"database\/\*"/g, '"server/infrastructure/database/*"');
                        if (content !== originalContent && !this.config.dryRun) {
                            (0, fs_1.writeFileSync)(configPath, content);
                            console.log("  \u2705 Updated ".concat(configFile));
                        }
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.updatePackageScripts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var packageJsonPath, packageJson, updatedCount, _i, _a, _b, scriptName, scriptCommand, updatedCommand;
            return __generator(this, function (_c) {
                console.log('📦 Updating package.json scripts...');
                packageJsonPath = (0, path_1.join)(projectRoot, 'package.json');
                packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf8'));
                updatedCount = 0;
                // Update scripts that reference database/
                for (_i = 0, _a = Object.entries(packageJson.scripts || {}); _i < _a.length; _i++) {
                    _b = _a[_i], scriptName = _b[0], scriptCommand = _b[1];
                    if (typeof scriptCommand === 'string' && scriptCommand.includes('database/')) {
                        updatedCommand = scriptCommand.replace(/database\//g, 'server/infrastructure/database/');
                        packageJson.scripts[scriptName] = updatedCommand;
                        updatedCount++;
                        console.log("  \uD83D\uDCDD Updated script: ".concat(scriptName));
                    }
                }
                if (updatedCount > 0 && !this.config.dryRun) {
                    (0, fs_1.writeFileSync)(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
                }
                console.log("\u2705 Updated ".concat(updatedCount, " npm scripts"));
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.updateImportStatements = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileExtensions, filesToUpdate, findFiles, updatedFiles, _i, filesToUpdate_1, filePath, content, originalContent;
            return __generator(this, function (_a) {
                console.log('🔄 Updating import statements...');
                fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];
                filesToUpdate = [];
                findFiles = function (dir) {
                    if (dir.includes('node_modules') || dir.includes('.git'))
                        return;
                    var items = (0, fs_1.readdirSync)(dir);
                    var _loop_1 = function (item) {
                        var fullPath = (0, path_1.join)(dir, item);
                        var stat = (0, fs_1.statSync)(fullPath);
                        if (stat.isDirectory()) {
                            findFiles(fullPath);
                        }
                        else if (fileExtensions.some(function (ext) { return item.endsWith(ext); })) {
                            filesToUpdate.push(fullPath);
                        }
                    };
                    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
                        var item = items_2[_i];
                        _loop_1(item);
                    }
                };
                findFiles(projectRoot);
                updatedFiles = 0;
                for (_i = 0, filesToUpdate_1 = filesToUpdate; _i < filesToUpdate_1.length; _i++) {
                    filePath = filesToUpdate_1[_i];
                    content = (0, fs_1.readFileSync)(filePath, 'utf8');
                    originalContent = content;
                    // Update import statements
                    content = content.replace(/from ['"]database\//g, 'from ', server / infrastructure / database / ');
                    content = content.replace(/import\(['"]database\//g, 'import("server/infrastructure/database/');
                    // Update require statements
                    content = content.replace(/require\(['"]database\//g, 'require("server/infrastructure/database/');
                    if (content !== originalContent) {
                        if (!this.config.dryRun) {
                            (0, fs_1.writeFileSync)(filePath, content);
                        }
                        updatedFiles++;
                    }
                }
                console.log("\u2705 Updated imports in ".concat(updatedFiles, " files"));
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.validatePostMigration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var targetContents;
            return __generator(this, function (_a) {
                console.log('🔍 Validating post-migration state...');
                if (this.config.dryRun) {
                    console.log('⏭️ Skipping validation in dry-run mode');
                    return [2 /*return*/];
                }
                // Check if target directory exists and has content
                if (!(0, fs_1.existsSync)(this.config.targetDir)) {
                    throw new Error('Target directory was not created');
                }
                targetContents = (0, fs_1.readdirSync)(this.config.targetDir);
                if (targetContents.length === 0) {
                    throw new Error('Target directory is empty');
                }
                // Test database connection
                try {
                    (0, child_process_1.execSync)('npm run db:test-connection', { stdio: 'pipe' });
                    console.log('  ✅ Database connection test passed');
                }
                catch (error) {
                    this.warnings.push('Database connection test failed - may need manual verification');
                }
                // Test TypeScript compilation
                try {
                    (0, child_process_1.execSync)('npm run check', { stdio: 'pipe' });
                    console.log('  ✅ TypeScript compilation passed');
                }
                catch (error) {
                    this.warnings.push('TypeScript compilation issues detected');
                }
                console.log('✅ Post-migration validation completed');
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.rollback = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🔄 Rolling back changes...');
                try {
                    // Restore from backups
                    if ((0, fs_1.existsSync)("".concat(this.config.backupDir, "_source"))) {
                        (0, child_process_1.execSync)("rm -rf \"".concat(this.config.sourceDir, "\""));
                        (0, child_process_1.execSync)("cp -r \"".concat(this.config.backupDir, "_source\" \"").concat(this.config.sourceDir, "\""));
                    }
                    if ((0, fs_1.existsSync)("".concat(this.config.backupDir, "_package.json"))) {
                        (0, child_process_1.execSync)("cp \"".concat(this.config.backupDir, "_package.json\" \"").concat((0, path_1.join)(projectRoot, 'package.json'), "\""));
                    }
                    if ((0, fs_1.existsSync)("".concat(this.config.backupDir, "_drizzle.config.ts"))) {
                        (0, child_process_1.execSync)("cp \"".concat(this.config.backupDir, "_drizzle.config.ts\" \"").concat((0, path_1.join)(projectRoot, 'drizzle.config.ts'), "\""));
                    }
                    console.log('✅ Rollback completed');
                }
                catch (error) {
                    console.error('❌ Rollback failed:', error);
                    console.log('🚨 Manual recovery required!');
                }
                return [2 /*return*/];
            });
        });
    };
    DatabaseMigrator.prototype.printSummary = function () {
        console.log('\n📊 Migration Summary:');
        console.log("Errors: ".concat(this.errors.length));
        console.log("Warnings: ".concat(this.warnings.length));
        if (this.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.warnings.forEach(function (warning) { return console.log("  - ".concat(warning)); });
        }
        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(function (error) { return console.log("  - ".concat(error)); });
        }
        console.log('\n📋 Next Steps:');
        console.log('1. Test database connection: npm run db:test-connection');
        console.log('2. Run migrations: npm run db:migrate');
        console.log('3. Test build: npm run build');
        console.log('4. Run tests: npm test');
        console.log('5. Update team documentation');
        if (!this.config.dryRun) {
            console.log("\n\uD83D\uDCBE Backups created at: ".concat(this.config.backupDir, "_*"));
            console.log('Remove backups after confirming everything works correctly.');
        }
    };
    return DatabaseMigrator;
}());
exports.DatabaseMigrator = DatabaseMigrator;
// CLI Interface
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, dryRun, skipBackup, migrator, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = process.argv.slice(2);
                    dryRun = args.includes('--dry-run');
                    skipBackup = args.includes('--skip-backup');
                    if (args.includes('--help')) {
                        console.log("\nDatabase Structure Migration Tool\n\nUsage: tsx scripts/migrate-database-structure.ts [options]\n\nOptions:\n  --dry-run      Simulate migration without making changes\n  --skip-backup  Skip creating backups (not recommended)\n  --help         Show this help message\n\nExamples:\n  tsx scripts/migrate-database-structure.ts --dry-run\n  tsx scripts/migrate-database-structure.ts\n");
                        process.exit(0);
                    }
                    migrator = new DatabaseMigrator({ dryRun: dryRun, skipBackup: skipBackup });
                    return [4 /*yield*/, migrator.migrate()];
                case 1:
                    success = _a.sent();
                    process.exit(success ? 0 : 1);
                    return [2 /*return*/];
            }
        });
    });
}
if (import.meta.url === "file://".concat(process.argv[1])) {
    main().catch(console.error);
}
