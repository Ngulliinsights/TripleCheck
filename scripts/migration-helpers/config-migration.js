"use strict";
/**
 * Configuration Migration Helper
 *
 * Handles migration of existing configuration patterns to core config utilities
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
exports.ConfigMigrationHelper = void 0;
var fs_1 = require("fs");
var ConfigMigrationHelper = /** @class */ (function () {
    function ConfigMigrationHelper() {
    }
    /**
     * Update configuration imports in a file
     */
    ConfigMigrationHelper.updateConfigImports = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, importRegex, matches, lastImport, insertPosition, envMappings, _i, envMappings_1, mapping, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        // Add core config import if file uses process.env
                        if (content.includes('process.env.') && !content.includes('@triplecheck/core/config')) {
                            importRegex = /^import\s+.*?;$/gm;
                            matches = __spreadArray([], content.matchAll(importRegex), true);
                            if (matches.length > 0) {
                                lastImport = matches[matches.length - 1];
                                insertPosition = lastImport.index + lastImport[0].length;
                                updatedContent = updatedContent.slice(0, insertPosition) +
                                    '\nimport { configManager } from \'@triplecheck/core/config\';' +
                                    updatedContent.slice(insertPosition);
                                hasChanges = true;
                            }
                        }
                        envMappings = [
                            {
                                old: /process\.env\.REDIS_URL/g,
                                new: "configManager.config.cache.redisUrl"
                            },
                            {
                                old: /process\.env\.CACHE_TTL/g,
                                new: "configManager.config.cache.defaultTtlSec"
                            },
                            {
                                old: /process\.env\.LOG_LEVEL/g,
                                new: "configManager.config.log.level"
                            },
                            {
                                old: /process\.env\.LOG_PRETTY/g,
                                new: "configManager.config.log.pretty"
                            },
                            {
                                old: /process\.env\.JWT_SECRET/g,
                                new: "configManager.config.security.jwtSecret"
                            },
                            {
                                old: /process\.env\.SESSION_SECRET/g,
                                new: "configManager.config.security.sessionSecret"
                            },
                            {
                                old: /process\.env\.DATABASE_URL/g,
                                new: "configManager.config.database.url"
                            },
                            {
                                old: /process\.env\.RATE_LIMIT_MAX/g,
                                new: "configManager.config.rateLimit.max"
                            },
                            {
                                old: /process\.env\.RATE_LIMIT_WINDOW/g,
                                new: "configManager.config.rateLimit.windowMs"
                            }
                        ];
                        for (_i = 0, envMappings_1 = envMappings; _i < envMappings_1.length; _i++) {
                            mapping = envMappings_1[_i];
                            if (mapping.old.test(content)) {
                                updatedContent = updatedContent.replace(mapping.old, mapping.new);
                                hasChanges = true;
                            }
                        }
                        if (!hasChanges) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs_1.promises.writeFile(filePath, updatedContent)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error updating config imports in ".concat(filePath, ":"), error_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update feature flag usage
     */
    ConfigMigrationHelper.updateFeatureFlags = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, featureFlagUpdates, _i, featureFlagUpdates_1, update, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        featureFlagUpdates = [
                            {
                                old: /process\.env\.FEATURE_([A-Z_]+)/g,
                                new: "configManager.isFeatureEnabled('$1')"
                            },
                            {
                                old: /isFeatureEnabled\('([^']+)'\)/g,
                                new: "configManager.isFeatureEnabled('$1').enabled"
                            }
                        ];
                        for (_i = 0, featureFlagUpdates_1 = featureFlagUpdates; _i < featureFlagUpdates_1.length; _i++) {
                            update = featureFlagUpdates_1[_i];
                            if (update.old.test(content)) {
                                updatedContent = updatedContent.replace(update.old, update.new);
                                hasChanges = true;
                            }
                        }
                        if (!hasChanges) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs_1.promises.writeFile(filePath, updatedContent)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Error updating feature flags in ".concat(filePath, ":"), error_2);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate configuration migration guide
     */
    ConfigMigrationHelper.generateConfigMigrationGuide = function () {
        return "\n# Configuration Migration Guide\n\n## Environment Variables Migration\n\n### Old Pattern:\n```typescript\nconst redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';\nconst cacheTimeout = parseInt(process.env.CACHE_TTL || '300');\nconst logLevel = process.env.LOG_LEVEL || 'info';\n```\n\n### New Pattern:\n```typescript\nimport { configManager } from '@triplecheck/core/config';\n\nconst redisUrl = configManager.config.cache.redisUrl;\nconst cacheTimeout = configManager.config.cache.defaultTtlSec;\nconst logLevel = configManager.config.log.level;\n```\n\n## Feature Flags Migration\n\n### Old Pattern:\n```typescript\nconst enableNewFeature = process.env.FEATURE_NEW_FEATURE === 'true';\n```\n\n### New Pattern:\n```typescript\nimport { configManager } from '@triplecheck/core/config';\n\nconst enableNewFeature = configManager.isFeatureEnabled('NEW_FEATURE').enabled;\n```\n\n## Configuration Validation\n\nThe new configuration system provides automatic validation:\n\n```typescript\n// Configuration is automatically validated on startup\n// Invalid configurations will throw detailed errors\ntry {\n  await configManager.load();\n} catch (error) {\n  console.error('Configuration validation failed:', error);\n}\n```\n\n## Hot Reloading\n\nConfiguration changes are automatically detected in development:\n\n```typescript\nconfigManager.on('config:changed', (newConfig) => {\n  console.log('Configuration updated:', newConfig);\n});\n```\n";
    };
    /**
     * Validate configuration migration
     */
    ConfigMigrationHelper.validateConfigMigration = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, issues, envVarPattern, envVarMatches, knownMigrations, _i, envVarMatches_1, match, envVar, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        issues = [];
                        envVarPattern = /process\.env\.([A-Z_]+)/g;
                        envVarMatches = __spreadArray([], content.matchAll(envVarPattern), true);
                        knownMigrations = [
                            'REDIS_URL', 'CACHE_TTL', 'LOG_LEVEL', 'LOG_PRETTY',
                            'JWT_SECRET', 'SESSION_SECRET', 'DATABASE_URL',
                            'RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW'
                        ];
                        for (_i = 0, envVarMatches_1 = envVarMatches; _i < envVarMatches_1.length; _i++) {
                            match = envVarMatches_1[_i];
                            envVar = match[1];
                            if (knownMigrations.includes(envVar)) {
                                issues.push("Environment variable ".concat(envVar, " should be migrated to configManager"));
                            }
                        }
                        // Check for old feature flag patterns
                        if (content.includes('process.env.FEATURE_')) {
                            issues.push('Feature flags should be migrated to configManager.isFeatureEnabled()');
                        }
                        // Check for missing config import
                        if (envVarMatches.length > 0 && !content.includes('@triplecheck/core/config')) {
                            issues.push('File uses environment variables but missing core config import');
                        }
                        return [2 /*return*/, {
                                isValid: issues.length === 0,
                                issues: issues
                            }];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, {
                                isValid: false,
                                issues: ["Error reading file: ".concat(error_3)]
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create environment variable mapping
     */
    ConfigMigrationHelper.createEnvVarMapping = function () {
        return {
            // Cache configuration
            'REDIS_URL': 'configManager.config.cache.redisUrl',
            'REDIS_HOST': 'configManager.config.cache.redisUrl', // Will need manual conversion
            'REDIS_PORT': 'configManager.config.cache.redisUrl', // Will need manual conversion
            'CACHE_TTL': 'configManager.config.cache.defaultTtlSec',
            'CACHE_TTL_SECONDS': 'configManager.config.cache.defaultTtlSec',
            // Logging configuration
            'LOG_LEVEL': 'configManager.config.log.level',
            'LOG_PRETTY': 'configManager.config.log.pretty',
            'ENABLE_PRETTY_LOGS': 'configManager.config.log.pretty',
            // Security configuration
            'JWT_SECRET': 'configManager.config.security.jwtSecret',
            'JWT_SECRET_KEY': 'configManager.config.security.jwtSecret',
            'SESSION_SECRET': 'configManager.config.security.sessionSecret',
            'SESSION_SECRET_KEY': 'configManager.config.security.sessionSecret',
            // Database configuration
            'DATABASE_URL': 'configManager.config.database.url',
            'DB_URL': 'configManager.config.database.url',
            'DB_MAX_CONNECTIONS': 'configManager.config.database.maxConnections',
            // Rate limiting configuration
            'RATE_LIMIT_MAX': 'configManager.config.rateLimit.max',
            'RATE_LIMIT_REQUESTS': 'configManager.config.rateLimit.max',
            'RATE_LIMIT_WINDOW': 'configManager.config.rateLimit.windowMs',
            'RATE_LIMIT_WINDOW_MS': 'configManager.config.rateLimit.windowMs',
            // Application configuration
            'NODE_ENV': 'configManager.config.app.environment',
            'PORT': 'configManager.config.app.port',
            'HOST': 'configManager.config.app.host'
        };
    };
    /**
     * Update configuration object patterns
     */
    ConfigMigrationHelper.updateConfigObjects = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, configObjectUpdates, _i, configObjectUpdates_1, update, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        configObjectUpdates = [
                            {
                                old: /const\s+config\s*=\s*{\s*redis:\s*{\s*url:\s*process\.env\.REDIS_URL/g,
                                new: "const config = { redis: { url: configManager.config.cache.redisUrl"
                            },
                            {
                                old: /cache:\s*{\s*ttl:\s*process\.env\.CACHE_TTL/g,
                                new: "cache: { ttl: configManager.config.cache.defaultTtlSec"
                            }
                        ];
                        for (_i = 0, configObjectUpdates_1 = configObjectUpdates; _i < configObjectUpdates_1.length; _i++) {
                            update = configObjectUpdates_1[_i];
                            if (update.old.test(content)) {
                                updatedContent = updatedContent.replace(update.old, update.new);
                                hasChanges = true;
                            }
                        }
                        if (!hasChanges) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs_1.promises.writeFile(filePath, updatedContent)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_4 = _a.sent();
                        console.error("Error updating config objects in ".concat(filePath, ":"), error_4);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return ConfigMigrationHelper;
}());
exports.ConfigMigrationHelper = ConfigMigrationHelper;
