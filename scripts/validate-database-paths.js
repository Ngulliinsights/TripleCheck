#!/usr/bin/env tsx
"use strict";
/**
 * Database Path Validation Script
 *
 * Validates that all database-related paths in package.json and configuration files
 * point to the correct location: server/infrastructure/database/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabasePathValidator = void 0;
var fs_1 = require("fs");
var DatabasePathValidator = /** @class */ (function () {
    function DatabasePathValidator() {
        this.results = [];
    }
    DatabasePathValidator.prototype.validate = function () {
        console.log('🔍 Validating database paths...\n');
        this.validatePackageJsonScripts();
        this.validateConfigFiles();
        this.printResults();
    };
    DatabasePathValidator.prototype.validatePackageJsonScripts = function () {
        var packageJson = JSON.parse((0, fs_1.readFileSync)('package.json', 'utf8'));
        var scripts = packageJson.scripts || {};
        var databaseScripts = Object.entries(scripts).filter(function (_a) {
            var key = _a[0], value = _a[1];
            return key.includes('db:') ||
                key.includes('migrate') ||
                key.includes('seed') ||
                key.includes('security') ||
                key.includes('data:') ||
                (typeof value === 'string' && value.includes('database'));
        });
        for (var _i = 0, databaseScripts_1 = databaseScripts; _i < databaseScripts_1.length; _i++) {
            var _a = databaseScripts_1[_i], scriptName = _a[0], scriptValue = _a[1];
            this.validateScript(scriptName, scriptValue);
        }
    };
    DatabasePathValidator.prototype.validateScript = function (scriptName, scriptValue) {
        // Extract file path from script command
        var match = scriptValue.match(/tsx\s+([^\s]+)/);
        if (!match) {
            this.results.push({
                file: 'package.json',
                script: scriptName,
                path: scriptValue,
                exists: false,
                status: 'warning',
                message: 'Could not extract file path from script'
            });
            return;
        }
        var filePath = match[1];
        var exists = (0, fs_1.existsSync)(filePath);
        var status = 'valid';
        var message;
        if (!exists) {
            status = 'invalid';
            message = 'File does not exist';
        }
        else if (filePath.includes('database/') && !filePath.includes('server/infrastructure/database/')) {
            status = 'invalid';
            message = 'Using deprecated database path - should use server/infrastructure/database/';
        }
        else if (!filePath.includes('server/infrastructure/database/') &&
            (scriptName.includes('db:') || scriptName.includes('migrate') || scriptName.includes('seed'))) {
            status = 'warning';
            message = 'Database-related script not using standard path';
        }
        this.results.push({
            file: 'package.json',
            script: scriptName,
            path: filePath,
            exists: exists,
            status: status,
            message: message
        });
    };
    DatabasePathValidator.prototype.validateConfigFiles = function () {
        var configFiles = [
            'drizzle.config.ts',
            'server/infrastructure/database/schemas/consolidated'
        ];
        for (var _i = 0, configFiles_1 = configFiles; _i < configFiles_1.length; _i++) {
            var configFile = configFiles_1[_i];
            if ((0, fs_1.existsSync)(configFile)) {
                this.validateConfigFile(configFile);
            }
        }
    };
    DatabasePathValidator.prototype.validateConfigFile = function (filePath) {
        var content = (0, fs_1.readFileSync)(filePath, 'utf8');
        // Check for deprecated database paths
        var deprecatedPatterns = [
            /\.\/database\//g,
            /database\/schemas/g,
            /database\/migrations/g
        ];
        var correctPatterns = [
            /server\/infrastructure\/database/g
        ];
        var hasDeprecated = false;
        var hasCorrect = false;
        for (var _i = 0, deprecatedPatterns_1 = deprecatedPatterns; _i < deprecatedPatterns_1.length; _i++) {
            var pattern = deprecatedPatterns_1[_i];
            if (pattern.test(content)) {
                hasDeprecated = true;
                break;
            }
        }
        for (var _a = 0, correctPatterns_1 = correctPatterns; _a < correctPatterns_1.length; _a++) {
            var pattern = correctPatterns_1[_a];
            if (pattern.test(content)) {
                hasCorrect = true;
                break;
            }
        }
        var status = 'valid';
        var message;
        if (hasDeprecated && !hasCorrect) {
            status = 'invalid';
            message = 'Contains deprecated database paths';
        }
        else if (hasDeprecated && hasCorrect) {
            status = 'warning';
            message = 'Contains both deprecated and correct paths';
        }
        else if (filePath === 'server/infrastructure/database/schemas/consolidated') {
            status = 'warning';
            message = 'This file is deprecated and should be removed after migration';
        }
        this.results.push({
            file: filePath,
            script: 'config',
            path: filePath,
            exists: true,
            status: status,
            message: message
        });
    };
    DatabasePathValidator.prototype.printResults = function () {
        console.log('📊 Validation Results:');
        console.log('='.repeat(60));
        var validCount = this.results.filter(function (r) { return r.status === 'valid'; }).length;
        var invalidCount = this.results.filter(function (r) { return r.status === 'invalid'; }).length;
        var warningCount = this.results.filter(function (r) { return r.status === 'warning'; }).length;
        console.log("\u2705 Valid: ".concat(validCount));
        console.log("\u274C Invalid: ".concat(invalidCount));
        console.log("\u26A0\uFE0F  Warnings: ".concat(warningCount));
        console.log("\uD83D\uDCC1 Total checked: ".concat(this.results.length, "\n"));
        // Show invalid results
        var invalidResults = this.results.filter(function (r) { return r.status === 'invalid'; });
        if (invalidResults.length > 0) {
            console.log('❌ Invalid Paths:');
            invalidResults.forEach(function (result) {
                console.log("   ".concat(result.file, ":").concat(result.script));
                console.log("     Path: ".concat(result.path));
                console.log("     Issue: ".concat(result.message, "\n"));
            });
        }
        // Show warnings
        var warningResults = this.results.filter(function (r) { return r.status === 'warning'; });
        if (warningResults.length > 0) {
            console.log('⚠️  Warnings:');
            warningResults.forEach(function (result) {
                console.log("   ".concat(result.file, ":").concat(result.script));
                console.log("     Path: ".concat(result.path));
                console.log("     Note: ".concat(result.message, "\n"));
            });
        }
        // Summary
        if (invalidCount === 0 && warningCount === 0) {
            console.log('🎉 All database paths are valid!');
        }
        else if (invalidCount === 0) {
            console.log('✅ No invalid paths found. Review warnings above.');
        }
        else {
            console.log('🔧 Please fix the invalid paths above.');
            console.log('\n💡 Quick fixes:');
            console.log('   1. Run: npm run migrate:schema-imports');
            console.log('   2. Update package.json scripts to use server/infrastructure/database/');
            console.log('   3. Update drizzle.config.ts paths');
        }
    };
    return DatabasePathValidator;
}());
exports.DatabasePathValidator = DatabasePathValidator;
// Run validation
if (require.main === module) {
    var validator = new DatabasePathValidator();
    validator.validate();
}
