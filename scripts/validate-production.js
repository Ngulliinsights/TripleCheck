#!/usr/bin/env tsx
"use strict";
/**
 * TRIPLECHECK PRODUCTION VALIDATION SCRIPT
 * ========================================
 *
 * Validates that the application is ready for production deployment
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
exports.ProductionValidator = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var ProductionValidator = /** @class */ (function () {
    function ProductionValidator() {
        this.results = [];
        this.rootDir = process.cwd();
    }
    /**
     * Run all production validation checks
     */
    ProductionValidator.prototype.validate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hasErrors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔍 Validating production readiness...\n');
                        // Run all validation categories
                        return [4 /*yield*/, this.validateEnvironment()];
                    case 1:
                        // Run all validation categories
                        _a.sent();
                        return [4 /*yield*/, this.validateSecurity()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.validatePerformance()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.validateBuild()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.validateDependencies()];
                    case 5:
                        _a.sent();
                        // Display results
                        this.displayResults();
                        hasErrors = this.results.some(function (r) { return !r.passed && r.severity === 'error'; });
                        return [2 /*return*/, !hasErrors];
                }
            });
        });
    };
    /**
     * Validate environment configuration
     */
    ProductionValidator.prototype.validateEnvironment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var category, requiredEnvVars, _i, requiredEnvVars_1, envVar, value, jwtSecret, isStrong, dbUrl, url, isSecure;
            return __generator(this, function (_a) {
                category = 'Environment';
                // Check NODE_ENV
                this.addResult({
                    category: category,
                    test: 'NODE_ENV set to production',
                    passed: process.env.NODE_ENV === 'production',
                    message: process.env.NODE_ENV === 'production'
                        ? 'NODE_ENV correctly set to production'
                        : 'NODE_ENV should be set to production',
                    severity: 'error'
                });
                requiredEnvVars = [
                    'DATABASE_URL',
                    'JWT_SECRET',
                    'FRONTEND_URL'
                ];
                for (_i = 0, requiredEnvVars_1 = requiredEnvVars; _i < requiredEnvVars_1.length; _i++) {
                    envVar = requiredEnvVars_1[_i];
                    value = process.env[envVar];
                    this.addResult({
                        category: category,
                        test: "".concat(envVar, " configured"),
                        passed: !!value && value.length > 0,
                        message: value
                            ? "".concat(envVar, " is configured")
                            : "".concat(envVar, " is missing or empty"),
                        severity: 'error'
                    });
                }
                jwtSecret = process.env.JWT_SECRET;
                if (jwtSecret) {
                    isStrong = jwtSecret.length >= 32 && !/^(test|dev|demo|secret|password|123)/.test(jwtSecret.toLowerCase());
                    this.addResult({
                        category: category,
                        test: 'JWT secret strength',
                        passed: isStrong,
                        message: isStrong
                            ? 'JWT secret appears to be strong'
                            : 'JWT secret should be at least 32 characters and not use common words',
                        severity: 'error'
                    });
                }
                dbUrl = process.env.DATABASE_URL;
                if (dbUrl) {
                    try {
                        url = new URL(dbUrl);
                        isSecure = url.protocol === 'postgresql:' && dbUrl.includes('sslmode=require');
                        this.addResult({
                            category: category,
                            test: 'Database SSL configuration',
                            passed: isSecure,
                            message: isSecure
                                ? 'Database connection uses SSL'
                                : 'Database should use SSL in production (sslmode=require)',
                            severity: 'warning'
                        });
                    }
                    catch (_b) {
                        this.addResult({
                            category: category,
                            test: 'Database URL format',
                            passed: false,
                            message: 'DATABASE_URL format is invalid',
                            severity: 'error'
                        });
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate security configuration
     */
    ProductionValidator.prototype.validateSecurity = function () {
        return __awaiter(this, void 0, void 0, function () {
            var category, demoPwd, corsOrigin, frontendUrl, sessionSecret, isStrong, enableDemo;
            return __generator(this, function (_a) {
                category = 'Security';
                demoPwd = process.env.VITE_DEMO_USER_PASSWORD;
                this.addResult({
                    category: category,
                    test: 'Demo passwords removed',
                    passed: !demoPwd || demoPwd === '',
                    message: demoPwd
                        ? 'Demo passwords should be removed in production'
                        : 'No demo passwords found',
                    severity: 'warning'
                });
                corsOrigin = process.env.CORS_ORIGIN;
                frontendUrl = process.env.FRONTEND_URL;
                this.addResult({
                    category: category,
                    test: 'CORS configuration',
                    passed: !!corsOrigin && corsOrigin !== '*',
                    message: corsOrigin && corsOrigin !== '*'
                        ? 'CORS is properly configured'
                        : 'CORS should be configured with specific origins, not wildcard',
                    severity: 'warning'
                });
                sessionSecret = process.env.SESSION_SECRET;
                if (sessionSecret) {
                    isStrong = sessionSecret.length >= 32;
                    this.addResult({
                        category: category,
                        test: 'Session secret strength',
                        passed: isStrong,
                        message: isStrong
                            ? 'Session secret is sufficiently long'
                            : 'Session secret should be at least 32 characters',
                        severity: 'warning'
                    });
                }
                enableDemo = process.env.ENABLE_DEMO_DATA;
                this.addResult({
                    category: category,
                    test: 'Demo data disabled',
                    passed: enableDemo !== 'true',
                    message: enableDemo === 'true'
                        ? 'Demo data should be disabled in production'
                        : 'Demo data is properly disabled',
                    severity: 'warning'
                });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate performance configuration
     */
    ProductionValidator.prototype.validatePerformance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var category, buildExists, jsFiles, hasSourceMaps, bundleSize, sizeMatch, size, unit, isReasonable, enableCaching;
            return __generator(this, function (_a) {
                category = 'Performance';
                buildExists = (0, fs_1.existsSync)((0, path_1.join)(this.rootDir, 'dist/public'));
                this.addResult({
                    category: category,
                    test: 'Production build exists',
                    passed: buildExists,
                    message: buildExists
                        ? 'Production build found'
                        : 'Production build not found - run npm run build',
                    severity: 'error'
                });
                if (buildExists) {
                    // Check for source maps in production
                    try {
                        jsFiles = (0, child_process_1.execSync)('find dist/public -name "*.js.map" 2>/dev/null || true', { encoding: 'utf8' });
                        hasSourceMaps = jsFiles.trim().length > 0;
                        this.addResult({
                            category: category,
                            test: 'Source maps removed',
                            passed: !hasSourceMaps,
                            message: hasSourceMaps
                                ? 'Source maps found in production build - consider removing for security'
                                : 'No source maps in production build',
                            severity: 'warning'
                        });
                    }
                    catch (_b) {
                        // Skip this check if find command fails
                    }
                    // Check bundle size
                    try {
                        bundleSize = (0, child_process_1.execSync)('du -sh dist/public 2>/dev/null || echo "0M"', { encoding: 'utf8' });
                        sizeMatch = bundleSize.match(/^(\d+(?:\.\d+)?)[MG]/);
                        if (sizeMatch) {
                            size = parseFloat(sizeMatch[1]);
                            unit = bundleSize.includes('G') ? 'G' : 'M';
                            isReasonable = unit === 'M' && size < 50;
                            this.addResult({
                                category: category,
                                test: 'Bundle size reasonable',
                                passed: isReasonable,
                                message: isReasonable
                                    ? "Bundle size is reasonable: ".concat(bundleSize.trim())
                                    : "Bundle size may be too large: ".concat(bundleSize.trim()),
                                severity: 'warning'
                            });
                        }
                    }
                    catch (_c) {
                        // Skip bundle size check if it fails
                    }
                }
                enableCaching = process.env.ENABLE_CACHING !== 'false';
                this.addResult({
                    category: category,
                    test: 'Caching enabled',
                    passed: enableCaching,
                    message: enableCaching
                        ? 'Caching is enabled'
                        : 'Consider enabling caching for better performance',
                    severity: 'info'
                });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate build configuration
     */
    ProductionValidator.prototype.validateBuild = function () {
        return __awaiter(this, void 0, void 0, function () {
            var category, tsconfigExists;
            return __generator(this, function (_a) {
                category = 'Build';
                tsconfigExists = (0, fs_1.existsSync)((0, path_1.join)(this.rootDir, 'tsconfig.json'));
                this.addResult({
                    category: category,
                    test: 'TypeScript configuration',
                    passed: tsconfigExists,
                    message: tsconfigExists
                        ? 'TypeScript configuration found'
                        : 'TypeScript configuration missing',
                    severity: 'error'
                });
                // Run TypeScript check
                try {
                    (0, child_process_1.execSync)('npm run check', { stdio: 'pipe' });
                    this.addResult({
                        category: category,
                        test: 'TypeScript compilation',
                        passed: true,
                        message: 'TypeScript compilation successful',
                        severity: 'error'
                    });
                }
                catch (_b) {
                    this.addResult({
                        category: category,
                        test: 'TypeScript compilation',
                        passed: false,
                        message: 'TypeScript compilation failed - fix type errors',
                        severity: 'error'
                    });
                }
                // Check for linting errors
                try {
                    (0, child_process_1.execSync)('npm run lint', { stdio: 'pipe' });
                    this.addResult({
                        category: category,
                        test: 'Linting',
                        passed: true,
                        message: 'No linting errors found',
                        severity: 'warning'
                    });
                }
                catch (_c) {
                    this.addResult({
                        category: category,
                        test: 'Linting',
                        passed: false,
                        message: 'Linting errors found - consider fixing',
                        severity: 'warning'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate dependencies
     */
    ProductionValidator.prototype.validateDependencies = function () {
        return __awaiter(this, void 0, void 0, function () {
            var category, packageJson, nodeVersion, hasProductionScripts;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                category = 'Dependencies';
                // Check for security vulnerabilities
                try {
                    (0, child_process_1.execSync)('npm audit --audit-level moderate', { stdio: 'pipe' });
                    this.addResult({
                        category: category,
                        test: 'Security vulnerabilities',
                        passed: true,
                        message: 'No moderate or high security vulnerabilities found',
                        severity: 'warning'
                    });
                }
                catch (_e) {
                    this.addResult({
                        category: category,
                        test: 'Security vulnerabilities',
                        passed: false,
                        message: 'Security vulnerabilities found - run npm audit fix',
                        severity: 'warning'
                    });
                }
                // Check package.json
                try {
                    packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(this.rootDir, 'package.json'), 'utf8'));
                    nodeVersion = (_a = packageJson.engines) === null || _a === void 0 ? void 0 : _a.node;
                    this.addResult({
                        category: category,
                        test: 'Node.js version specified',
                        passed: !!nodeVersion,
                        message: nodeVersion
                            ? "Node.js version requirement: ".concat(nodeVersion)
                            : 'Consider specifying Node.js version in package.json engines',
                        severity: 'info'
                    });
                    hasProductionScripts = !!(((_b = packageJson.scripts) === null || _b === void 0 ? void 0 : _b.build) && ((_c = packageJson.scripts) === null || _c === void 0 ? void 0 : _c.start));
                    this.addResult({
                        category: category,
                        test: 'Production scripts',
                        passed: hasProductionScripts,
                        message: hasProductionScripts
                            ? 'Build and start scripts are configured'
                            : 'Missing build or start scripts',
                        severity: 'error'
                    });
                }
                catch (_f) {
                    this.addResult({
                        category: category,
                        test: 'Package.json validation',
                        passed: false,
                        message: 'Could not read or parse package.json',
                        severity: 'error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Add validation result
     */
    ProductionValidator.prototype.addResult = function (result) {
        this.results.push(result);
    };
    /**
     * Display validation results
     */
    ProductionValidator.prototype.displayResults = function () {
        var categories = __spreadArray([], new Set(this.results.map(function (r) { return r.category; })), true);
        var _loop_1 = function (category) {
            console.log("\n\uD83D\uDCCB ".concat(category));
            console.log('─'.repeat(50));
            var categoryResults = this_1.results.filter(function (r) { return r.category === category; });
            for (var _a = 0, categoryResults_1 = categoryResults; _a < categoryResults_1.length; _a++) {
                var result = categoryResults_1[_a];
                var icon = result.passed ? '✅' :
                    result.severity === 'error' ? '❌' :
                        result.severity === 'warning' ? '⚠️' : 'ℹ️';
                console.log("".concat(icon, " ").concat(result.test, ": ").concat(result.message));
            }
        };
        var this_1 = this;
        for (var _i = 0, categories_1 = categories; _i < categories_1.length; _i++) {
            var category = categories_1[_i];
            _loop_1(category);
        }
        // Summary
        var errors = this.results.filter(function (r) { return !r.passed && r.severity === 'error'; }).length;
        var warnings = this.results.filter(function (r) { return !r.passed && r.severity === 'warning'; }).length;
        var passed = this.results.filter(function (r) { return r.passed; }).length;
        var total = this.results.length;
        console.log('\n📊 Summary');
        console.log('─'.repeat(50));
        console.log("\u2705 Passed: ".concat(passed, "/").concat(total));
        console.log("\u26A0\uFE0F  Warnings: ".concat(warnings));
        console.log("\u274C Errors: ".concat(errors));
        if (errors === 0) {
            console.log('\n🎉 Production validation passed! Ready for deployment.');
        }
        else {
            console.log('\n🚨 Production validation failed! Fix errors before deployment.');
        }
    };
    return ProductionValidator;
}());
exports.ProductionValidator = ProductionValidator;
/**
 * CLI Interface
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var validator, isValid, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    validator = new ProductionValidator();
                    return [4 /*yield*/, validator.validate()];
                case 1:
                    isValid = _a.sent();
                    process.exit(isValid ? 0 : 1);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Validation failed:', error_1.message);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (import.meta.url === "file://".concat(process.argv[1])) {
    main().catch(console.error);
}
