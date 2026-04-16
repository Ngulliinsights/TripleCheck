"use strict";
/**
 * Cache Service Migration Helper
 *
 * Handles migration of existing cache service usage to core cache utilities
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
exports.CacheMigrationHelper = void 0;
var fs_1 = require("fs");
var migration_1 = require("../../core/src/utils/migration");
var CacheMigrationHelper = /** @class */ (function () {
    function CacheMigrationHelper() {
    }
    /**
     * Update cache service imports in a file
     */
    CacheMigrationHelper.updateCacheImports = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, importMappings, _i, importMappings_1, mapping, instantiationMappings, _a, instantiationMappings_1, mapping, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _b.sent();
                        updatedContent = content;
                        hasChanges = false;
                        importMappings = [
                            {
                                old: /import\s*{\s*cacheService\s*}\s*from\s*["']\.\.\/\.\.\/src\/shared\/services\/CacheService["']/g,
                                new: "import { cacheService } from '..\..\server\cache\CacheService'"
                            },
                            {
                                old: /import\s*{\s*cacheService\s*as\s*enhancedCache\s*}\s*from\s*["']\.\.\/services\/CacheService["']/g,
                                new: "import { cacheService as enhancedCache } from '..\..\server\cache\CacheService'"
                            },
                            {
                                old: /import\s*{\s*CacheService\s*}\s*from\s*["']\.\.\/infrastructure\/cache["']/g,
                                new: "import { CacheService } from '..\..\server\cache\CacheService'"
                            },
                            {
                                old: /import\s*{\s*PropertyCacheService\s*}\s*from\s*["']\.\.\/infrastructure\/cache\/PropertyCacheService["']/g,
                                new: "import { PropertyCacheService } from '..\..\server\infrastructure\cache\PropertyCacheService'"
                            }
                        ];
                        // Apply import mappings
                        for (_i = 0, importMappings_1 = importMappings; _i < importMappings_1.length; _i++) {
                            mapping = importMappings_1[_i];
                            if (mapping.old.test(content)) {
                                updatedContent = updatedContent.replace(mapping.old, mapping.new);
                                hasChanges = true;
                            }
                        }
                        instantiationMappings = [
                            {
                                old: /new CacheService\(\)/g,
                                new: "cacheService"
                            },
                            {
                                old: /CacheService\.getInstance\(\)/g,
                                new: "cacheService"
                            }
                        ];
                        for (_a = 0, instantiationMappings_1 = instantiationMappings; _a < instantiationMappings_1.length; _a++) {
                            mapping = instantiationMappings_1[_a];
                            if (mapping.old.test(updatedContent)) {
                                updatedContent = updatedContent.replace(mapping.old, mapping.new);
                                hasChanges = true;
                            }
                        }
                        if (!hasChanges) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs_1.promises.writeFile(filePath, updatedContent)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_1 = _b.sent();
                        console.error("Error updating cache imports in ".concat(filePath, ":"), error_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create legacy adapter for gradual migration
     */
    CacheMigrationHelper.createLegacyAdapter = function (coreCache) {
        return new migration_1.LegacyCacheAdapter(coreCache);
    };
    /**
     * Update cache method calls to use new API
     */
    CacheMigrationHelper.updateCacheMethodCalls = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, methodMappings, _i, methodMappings_1, mapping, setCallRegex, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        methodMappings = [
                            {
                                old: /\.has\(/g,
                                new: ".exists("
                            },
                            {
                                old: /\.clear\(\)/g,
                                new: ".flush()"
                            },
                            {
                                old: /\.getStats\(\)/g,
                                new: ".getMetrics()"
                            }
                        ];
                        for (_i = 0, methodMappings_1 = methodMappings; _i < methodMappings_1.length; _i++) {
                            mapping = methodMappings_1[_i];
                            if (mapping.old.test(content)) {
                                updatedContent = updatedContent.replace(mapping.old, mapping.new);
                                hasChanges = true;
                            }
                        }
                        setCallRegex = /\.set\(([^,]+),\s*([^,]+),\s*{\s*ttl:\s*([^}]+)\s*}\)/g;
                        if (setCallRegex.test(content)) {
                            updatedContent = updatedContent.replace(setCallRegex, '.set($1, $2, $3)');
                            hasChanges = true;
                        }
                        if (!hasChanges) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs_1.promises.writeFile(filePath, updatedContent)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Error updating cache method calls in ".concat(filePath, ":"), error_2);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate cache configuration migration
     */
    CacheMigrationHelper.generateCacheConfigMigration = function () {
        return "\n// Cache Configuration Migration\n// Old configuration pattern:\n/*\nconst cacheConfig = {\n  maxSize: 50 * 1024 * 1024,\n  defaultTTL: 5 * 60 * 1000,\n  enableCompression: true\n};\n*/\n\n// New configuration pattern:\nimport { configManager } from '@triplecheck/core/config';\n\nconst cacheConfig = {\n  maxMemoryMB: configManager.config.cache.maxMemoryMB,\n  defaultTtlSec: configManager.config.cache.defaultTtlSec,\n  compressionThreshold: configManager.config.cache.compressionThreshold\n};\n";
    };
    /**
     * Validate cache migration
     */
    CacheMigrationHelper.validateCacheMigration = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, issues, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        issues = [];
                        // Check for old import patterns
                        if (content.includes('src/shared/services/CacheService')) {
                            issues.push('Still using old cache service import path');
                        }
                        if (content.includes('server/infrastructure/cache/CacheService')) {
                            issues.push('Still using old server cache service import path');
                        }
                        // Check for old method calls
                        if (content.includes('.has(') && !content.includes('.exists(')) {
                            issues.push('Using deprecated .has() method instead of .exists()');
                        }
                        if (content.includes('.clear()') && !content.includes('.flush()')) {
                            issues.push('Using deprecated .clear() method instead of .flush()');
                        }
                        // Check for old instantiation patterns
                        if (content.includes('new CacheService()')) {
                            issues.push('Still instantiating CacheService directly');
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
    return CacheMigrationHelper;
}());
exports.CacheMigrationHelper = CacheMigrationHelper;
