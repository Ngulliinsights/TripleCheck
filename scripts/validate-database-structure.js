#!/usr/bin/env tsx
"use strict";
/**
 * Database Structure Validation Script
 *
 * Validates database directory structure and identifies issues
 * before and after migration.
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
exports.DatabaseStructureValidator = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
var projectRoot = (0, path_1.join)(__dirname, '..');
var DatabaseStructureValidator = /** @class */ (function () {
    function DatabaseStructureValidator() {
        this.results = [];
    }
    DatabaseStructureValidator.prototype.validate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hasErrors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Database Structure Validation');
                        console.log('================================\n');
                        // Check directory structure
                        this.validateDirectoryStructure();
                        // Check configuration files
                        this.validateConfigurationFiles();
                        // Check package.json scripts
                        this.validatePackageScripts();
                        // Check for import/require statements
                        this.validateImportStatements();
                        // Check database connectivity
                        return [4 /*yield*/, this.validateDatabaseConnectivity()];
                    case 1:
                        // Check database connectivity
                        _a.sent();
                        // Check for conflicts
                        this.validateForConflicts();
                        // Print results
                        this.printResults();
                        hasErrors = this.results.some(function (r) { return r.status === 'fail'; });
                        return [2 /*return*/, !hasErrors];
                }
            });
        });
    };
    DatabaseStructureValidator.prototype.validateDirectoryStructure = function () {
        console.log('📁 Checking directory structure...');
        var rootDatabaseExists = (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'database'));
        var serverDatabaseExists = (0, fs_1.existsSync)((0, path_1.join)(projectRoot, 'server/infrastructure/database'));
        if (rootDatabaseExists && serverDatabaseExists) {
            this.results.push({
                category: 'Directory Structure',
                status: 'warning',
                message: 'Both root database/ and server/infrastructure/database/ exist',
                details: ['This indicates a duplication that should be resolved']
            });
        }
        else if (rootDatabaseExists && !serverDatabaseExists) {
            this.results.push({
                category: 'Directory Structure',
                status: 'pass',
                message: 'Root database/ directory exists (pre-migration state)',
                details: ['Ready for migration to server/infrastructure/database/']
            });
        }
        else if (!rootDatabaseExists && serverDatabaseExists) {
            this.results.push({
                category: 'Directory Structure',
                status: 'pass',
                message: 'Database consolidated to server/infrastructure/database/',
                details: ['Post-migration state detected']
            });
        }
        else {
            this.results.push({
                category: 'Directory Structure',
                status: 'fail',
                message: 'No database directory found',
                details: ['Neither database/ nor server/infrastructure/database/ exists']
            });
        }
        // Check for expected subdirectories
        var expectedDirs = ['migrations', 'schemas', 'seeds', 'scripts', 'config'];
        var databaseDir = rootDatabaseExists ?
            (0, path_1.join)(projectRoot, 'database') :
            (0, path_1.join)(projectRoot, 'server/infrastructure/database');
        if ((0, fs_1.existsSync)(databaseDir)) {
            var missingDirs = expectedDirs.filter(function (dir) { return !(0, fs_1.existsSync)((0, path_1.join)(databaseDir, dir)); });
            if (missingDirs.length === 0) {
                this.results.push({
                    category: 'Directory Structure',
                    status: 'pass',
                    message: 'All expected subdirectories present',
                    details: expectedDirs
                });
            }
            else {
                this.results.push({
                    category: 'Directory Structure',
                    status: 'warning',
                    message: 'Some expected subdirectories missing',
                    details: ["Missing: ".concat(missingDirs.join(', '))]
                });
            }
        }
    };
    DatabaseStructureValidator.prototype.validateConfigurationFiles = function () {
        console.log('⚙️ Checking configuration files...');
        // Check drizzle.config.ts
        var drizzleConfigPath = (0, path_1.join)(projectRoot, 'drizzle.config.ts');
        if ((0, fs_1.existsSync)(drizzleConfigPath)) {
            var content = (0, fs_1.readFileSync)(drizzleConfigPath, 'utf8');
            if (content.includes('./database/migrations')) {
                this.results.push({
                    category: 'Configuration',
                    status: 'warning',
                    message: 'drizzle.config.ts points to old database/ path',
                    details: ['Should be updated to server/infrastructure/database/migrations']
                });
            }
            else if (content.includes('./server/infrastructure/database/migrations')) {
                this.results.push({
                    category: 'Configuration',
                    status: 'pass',
                    message: 'drizzle.config.ts uses correct path',
                    details: ['Points to server/infrastructure/database/migrations']
                });
            }
            else {
                this.results.push({
                    category: 'Configuration',
                    status: 'warning',
                    message: 'drizzle.config.ts migration path unclear',
                    details: ['Could not determine migration path configuration']
                });
            }
            if (content.includes('./database/schemas')) {
                this.results.push({
                    category: 'Configuration',
                    status: 'warning',
                    message: 'drizzle.config.ts schema points to old database/ path',
                    details: ['Should be updated to server/infrastructure/database/schemas']
                });
            }
            else if (content.includes('./server/infrastructure/database/schemas')) {
                this.results.push({
                    category: 'Configuration',
                    status: 'pass',
                    message: 'drizzle.config.ts schema uses correct path'
                });
            }
        }
        else {
            this.results.push({
                category: 'Configuration',
                status: 'fail',
                message: 'drizzle.config.ts not found',
                details: ['Required for database operations']
            });
        }
        // Check tsconfig files for path mappings
        var tsconfigFiles = ['tsconfig.json', 'tsconfig.dev.json', 'tsconfig.infrastructure.json'];
        for (var _i = 0, tsconfigFiles_1 = tsconfigFiles; _i < tsconfigFiles_1.length; _i++) {
            var configFile = tsconfigFiles_1[_i];
            var configPath = (0, path_1.join)(projectRoot, configFile);
            if ((0, fs_1.existsSync)(configPath)) {
                var content = (0, fs_1.readFileSync)(configPath, 'utf8');
                if (content.includes('"database/*"')) {
                    this.results.push({
                        category: 'Configuration',
                        status: 'warning',
                        message: "".concat(configFile, " has old database path mapping"),
                        details: ['Should be updated to server/infrastructure/database/*']
                    });
                }
            }
        }
    };
    DatabaseStructureValidator.prototype.validatePackageScripts = function () {
        console.log('📦 Checking package.json scripts...');
        var packageJsonPath = (0, path_1.join)(projectRoot, 'package.json');
        if (!(0, fs_1.existsSync)(packageJsonPath)) {
            this.results.push({
                category: 'Package Scripts',
                status: 'fail',
                message: 'package.json not found'
            });
            return;
        }
        var packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf8'));
        var scripts = packageJson.scripts || {};
        var oldPathScripts = [];
        var newPathScripts = [];
        for (var _i = 0, _a = Object.entries(scripts); _i < _a.length; _i++) {
            var _b = _a[_i], scriptName = _b[0], scriptCommand = _b[1];
            if (typeof scriptCommand === 'string') {
                if (scriptCommand.includes('database/')) {
                    oldPathScripts.push(scriptName);
                }
                else if (scriptCommand.includes('server/infrastructure/database/')) {
                    newPathScripts.push(scriptName);
                }
            }
        }
        if (oldPathScripts.length > 0) {
            this.results.push({
                category: 'Package Scripts',
                status: 'warning',
                message: "".concat(oldPathScripts.length, " scripts reference old database/ path"),
                details: oldPathScripts.slice(0, 5).concat(oldPathScripts.length > 5 ? ["... and ".concat(oldPathScripts.length - 5, " more")] : [])
            });
        }
        if (newPathScripts.length > 0) {
            this.results.push({
                category: 'Package Scripts',
                status: 'pass',
                message: "".concat(newPathScripts.length, " scripts use correct server/infrastructure/database/ path"),
                details: ["Examples: ".concat(newPathScripts.slice(0, 3).join(', '))]
            });
        }
        if (oldPathScripts.length === 0 && newPathScripts.length === 0) {
            this.results.push({
                category: 'Package Scripts',
                status: 'pass',
                message: 'No database path references found in scripts'
            });
        }
    };
    DatabaseStructureValidator.prototype.validateImportStatements = function () {
        console.log('🔄 Checking import/require statements...');
        var fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];
        var filesWithOldImports = [];
        var filesWithNewImports = [];
        var checkFile = function (filePath) {
            try {
                var content = (0, fs_1.readFileSync)(filePath, 'utf8');
                var relativePath = filePath.replace(projectRoot, '').replace(/^\//, '');
                if (content.match(/from ['"]database\//g) || content.match(/require\(['"]database\//g)) {
                    filesWithOldImports.push(relativePath);
                }
                if (content.match(/from ['"]server\/infrastructure\/database\//g) ||
                    content.match(/require\(['"]server\/infrastructure\/database\//g)) {
                    filesWithNewImports.push(relativePath);
                }
            }
            catch (error) {
                // Skip files that can't be read
            }
        };
        var scanDirectory = function (dir) {
            if (dir.includes('node_modules') || dir.includes('.git'))
                return;
            try {
                var items = (0, fs_1.readdirSync)(dir);
                var _loop_1 = function (item) {
                    var fullPath = (0, path_1.join)(dir, item);
                    var stat = (0, fs_1.statSync)(fullPath);
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath);
                    }
                    else if (fileExtensions.some(function (ext) { return item.endsWith(ext); })) {
                        checkFile(fullPath);
                    }
                };
                for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                    var item = items_1[_i];
                    _loop_1(item);
                }
            }
            catch (error) {
                // Skip directories that can't be read
            }
        };
        scanDirectory(projectRoot);
        if (filesWithOldImports.length > 0) {
            this.results.push({
                category: 'Import Statements',
                status: 'warning',
                message: "".concat(filesWithOldImports.length, " files have old database/ imports"),
                details: filesWithOldImports.slice(0, 5).concat(filesWithOldImports.length > 5 ? ["... and ".concat(filesWithOldImports.length - 5, " more")] : [])
            });
        }
        if (filesWithNewImports.length > 0) {
            this.results.push({
                category: 'Import Statements',
                status: 'pass',
                message: "".concat(filesWithNewImports.length, " files use correct server/infrastructure/database/ imports")
            });
        }
        if (filesWithOldImports.length === 0 && filesWithNewImports.length === 0) {
            this.results.push({
                category: 'Import Statements',
                status: 'pass',
                message: 'No database imports found (or all imports are relative)'
            });
        }
    };
    DatabaseStructureValidator.prototype.validateDatabaseConnectivity = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🔌 Checking database connectivity...');
                try {
                    // Try to run database test connection script
                    (0, child_process_1.execSync)('npm run db:test-connection', { stdio: 'pipe', timeout: 10000 });
                    this.results.push({
                        category: 'Database Connectivity',
                        status: 'pass',
                        message: 'Database connection test passed'
                    });
                }
                catch (error) {
                    this.results.push({
                        category: 'Database Connectivity',
                        status: 'warning',
                        message: 'Database connection test failed',
                        details: ['This may be expected if database is not set up or credentials are missing']
                    });
                }
                // Check if DATABASE_URL is configured
                if (process.env.DATABASE_URL) {
                    this.results.push({
                        category: 'Database Connectivity',
                        status: 'pass',
                        message: 'DATABASE_URL environment variable is set'
                    });
                }
                else {
                    this.results.push({
                        category: 'Database Connectivity',
                        status: 'warning',
                        message: 'DATABASE_URL environment variable not set',
                        details: ['Required for database operations']
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    DatabaseStructureValidator.prototype.validateForConflicts = function () {
        console.log('⚠️ Checking for conflicts...');
        var rootDbPath = (0, path_1.join)(projectRoot, 'database');
        var serverDbPath = (0, path_1.join)(projectRoot, 'server/infrastructure/database');
        if ((0, fs_1.existsSync)(rootDbPath) && (0, fs_1.existsSync)(serverDbPath)) {
            // Check for file conflicts
            var conflicts_1 = [];
            var checkConflicts_1 = function (subPath) {
                if (subPath === void 0) { subPath = ''; }
                var rootSubPath = (0, path_1.join)(rootDbPath, subPath);
                var serverSubPath = (0, path_1.join)(serverDbPath, subPath);
                if ((0, fs_1.existsSync)(rootSubPath) && (0, fs_1.existsSync)(serverSubPath)) {
                    try {
                        var rootItems = (0, fs_1.readdirSync)(rootSubPath);
                        var serverItems_1 = (0, fs_1.readdirSync)(serverSubPath);
                        var commonItems = rootItems.filter(function (item) { return serverItems_1.includes(item); });
                        for (var _i = 0, commonItems_1 = commonItems; _i < commonItems_1.length; _i++) {
                            var item = commonItems_1[_i];
                            var rootItemPath = (0, path_1.join)(rootSubPath, item);
                            var serverItemPath = (0, path_1.join)(serverSubPath, item);
                            if ((0, fs_1.statSync)(rootItemPath).isFile() && (0, fs_1.statSync)(serverItemPath).isFile()) {
                                conflicts_1.push((0, path_1.join)(subPath, item));
                            }
                            else if ((0, fs_1.statSync)(rootItemPath).isDirectory() && (0, fs_1.statSync)(serverItemPath).isDirectory()) {
                                checkConflicts_1((0, path_1.join)(subPath, item));
                            }
                        }
                    }
                    catch (error) {
                        // Skip if can't read directory
                    }
                }
            };
            checkConflicts_1();
            if (conflicts_1.length > 0) {
                this.results.push({
                    category: 'Conflicts',
                    status: 'warning',
                    message: "".concat(conflicts_1.length, " file conflicts detected between database directories"),
                    details: conflicts_1.slice(0, 10).concat(conflicts_1.length > 10 ? ["... and ".concat(conflicts_1.length - 10, " more")] : [])
                });
            }
            else {
                this.results.push({
                    category: 'Conflicts',
                    status: 'pass',
                    message: 'No file conflicts detected between database directories'
                });
            }
        }
        else {
            this.results.push({
                category: 'Conflicts',
                status: 'pass',
                message: 'No directory duplication detected'
            });
        }
    };
    DatabaseStructureValidator.prototype.printResults = function () {
        console.log('\n📊 Validation Results');
        console.log('====================\n');
        var categories = __spreadArray([], new Set(this.results.map(function (r) { return r.category; })), true);
        var _loop_2 = function (category) {
            console.log("\n".concat(category, ":"));
            var categoryResults = this_1.results.filter(function (r) { return r.category === category; });
            for (var _a = 0, categoryResults_1 = categoryResults; _a < categoryResults_1.length; _a++) {
                var result = categoryResults_1[_a];
                var icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
                console.log("  ".concat(icon, " ").concat(result.message));
                if (result.details) {
                    result.details.forEach(function (detail) {
                        console.log("     ".concat(detail));
                    });
                }
            }
        };
        var this_1 = this;
        for (var _i = 0, categories_1 = categories; _i < categories_1.length; _i++) {
            var category = categories_1[_i];
            _loop_2(category);
        }
        // Summary
        var passCount = this.results.filter(function (r) { return r.status === 'pass'; }).length;
        var warningCount = this.results.filter(function (r) { return r.status === 'warning'; }).length;
        var failCount = this.results.filter(function (r) { return r.status === 'fail'; }).length;
        console.log('\n📈 Summary:');
        console.log("  \u2705 Passed: ".concat(passCount));
        console.log("  \u26A0\uFE0F Warnings: ".concat(warningCount));
        console.log("  \u274C Failed: ".concat(failCount));
        if (failCount > 0) {
            console.log('\n🚨 Action Required: Fix failed validations before proceeding');
        }
        else if (warningCount > 0) {
            console.log('\n💡 Recommendations: Address warnings for optimal setup');
        }
        else {
            console.log('\n🎉 All validations passed!');
        }
    };
    return DatabaseStructureValidator;
}());
exports.DatabaseStructureValidator = DatabaseStructureValidator;
// CLI Interface
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var validator, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validator = new DatabaseStructureValidator();
                    return [4 /*yield*/, validator.validate()];
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
