"use strict";
/**
 * Middleware Migration Helper
 *
 * Handles migration of existing middleware usage to core middleware utilities
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
exports.MiddlewareMigrationHelper = void 0;
var fs_1 = require("fs");
var MiddlewareMigrationHelper = /** @class */ (function () {
    function MiddlewareMigrationHelper() {
    }
    /**
     * Update middleware imports in a file
     */
    MiddlewareMigrationHelper.updateMiddlewareImports = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, importMappings, _i, importMappings_1, mapping, usageUpdates, _a, usageUpdates_1, update, error_1;
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
                                old: /import\s*{\s*requireAuth\s*,\s*AuthenticatedRequest\s*}\s*from\s*["']\.\.\/middleware\/auth\.middleware["']/g,
                                new: "import { requireAuth, AuthenticatedRequest } from '..\..\server\middleware\auth.middleware'"
                            },
                            {
                                old: /import\s*{\s*validateRequest\s*}\s*from\s*["']\.\.\/middleware\/validation\.middleware["']/g,
                                new: "import { validateRequest } from '..\..\server\land-verification\middleware\validation.middleware'"
                            },
                            {
                                old: /import\s*{\s*cacheResponse\s*}\s*from\s*["']\.\.\/middleware\/cache\.middleware["']/g,
                                new: "import { cacheResponse } from '..\..\server\middleware\cache.middleware'"
                            },
                            {
                                old: /import\s*{\s*rateLimitMiddleware\s*}\s*from\s*["']\.\.\/middleware\/rate-limiting\.middleware["']/g,
                                new: "import { rateLimitMiddleware } from '@triplecheck/core/middleware'"
                            },
                            {
                                old: /import\s*{\s*errorHandlerMiddleware\s*}\s*from\s*["']\.\.\/middleware\/error["']/g,
                                new: "import { errorHandlerMiddleware } from '@triplecheck/core/middleware'"
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
                        usageUpdates = [
                            {
                                old: /app\.use\(requireAuth\)/g,
                                new: "app.use(requireAuth)"
                            },
                            {
                                old: /router\.use\(requireAuth\)/g,
                                new: "router.use(requireAuth)"
                            }
                        ];
                        for (_a = 0, usageUpdates_1 = usageUpdates; _a < usageUpdates_1.length; _a++) {
                            update = usageUpdates_1[_a];
                            if (update.old.test(updatedContent)) {
                                updatedContent = updatedContent.replace(update.old, update.new);
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
                        console.error("Error updating middleware imports in ".concat(filePath, ":"), error_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update validation middleware usage
     */
    MiddlewareMigrationHelper.updateValidationMiddleware = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, validationUpdates, _i, validationUpdates_1, update, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        validationUpdates = [
                            {
                                old: /validateRequest\(\{\s*body:\s*([^}]+)\s*\}\)/g,
                                new: "validateRequest({ body: $1 })"
                            },
                            {
                                old: /validateRequest\(\{\s*query:\s*([^}]+)\s*\}\)/g,
                                new: "validateRequest({ query: $1 })"
                            },
                            {
                                old: /validateRequest\(\{\s*params:\s*([^}]+)\s*\}\)/g,
                                new: "validateRequest({ params: $1 })"
                            }
                        ];
                        for (_i = 0, validationUpdates_1 = validationUpdates; _i < validationUpdates_1.length; _i++) {
                            update = validationUpdates_1[_i];
                            if (update.old.test(content)) {
                                updatedContent = updatedContent.replace(update.old, update.new);
                                hasChanges = true;
                            }
                        }
                        // Update validation schema imports
                        if (content.includes('CommonValidationSchemas')) {
                            updatedContent = updatedContent.replace(/import\s*{\s*CommonValidationSchemas\s*}\s*from\s*["'][^"']+["']/g, "import { CommonValidationSchemas } from '..\..\server\middleware\validation.middleware'");
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
                        console.error("Error updating validation middleware in ".concat(filePath, ":"), error_2);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update auth middleware usage
     */
    MiddlewareMigrationHelper.updateAuthMiddleware = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, authUpdates, _i, authUpdates_1, update, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        authUpdates = [
                            {
                                old: /requireRole\(\['([^']+)'\]\)/g,
                                new: "requireRole('$1')"
                            },
                            {
                                old: /requireRole\(\[([^\]]+)\]\)/g,
                                new: "requireRole([$1])"
                            }
                        ];
                        for (_i = 0, authUpdates_1 = authUpdates; _i < authUpdates_1.length; _i++) {
                            update = authUpdates_1[_i];
                            if (update.old.test(content)) {
                                updatedContent = updatedContent.replace(update.old, update.new);
                                hasChanges = true;
                            }
                        }
                        // Update session management calls
                        if (content.includes('SessionManager.')) {
                            updatedContent = updatedContent.replace(/import\s*{\s*SessionManager\s*}\s*from\s*["'][^"']+["']/g, "import { SessionManager } from '..\..\server\middleware\auth.middleware'");
                            hasChanges = true;
                        }
                        if (!hasChanges) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs_1.promises.writeFile(filePath, updatedContent)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error updating auth middleware in ".concat(filePath, ":"), error_3);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate middleware configuration migration
     */
    MiddlewareMigrationHelper.generateMiddlewareConfigMigration = function () {
        return "\n// Middleware Configuration Migration\n// Old middleware setup pattern:\n/*\napp.use(requireAuth);\napp.use(validateRequest({ body: userSchema }));\napp.use(cacheResponse({ ttl: 300 }));\n*/\n\n// New middleware setup pattern:\nimport { \n  requireAuth, \n  validateRequest, \n  cacheResponse,\n  createMiddlewareChain \n} from '....serverland-verificationmiddleware\validation.middleware';\n\n// Individual middleware usage (same as before)\napp.use(requireAuth);\napp.use(validateRequest({ body: userSchema }));\napp.use(cacheResponse({ ttl: 300 }));\n\n// Or use middleware chain for better organization\nconst authChain = createMiddlewareChain([\n  requireAuth,\n  validateRequest({ body: userSchema }),\n  cacheResponse({ ttl: 300 })\n]);\n\napp.use('/api/protected', authChain);\n";
    };
    /**
     * Validate middleware migration
     */
    MiddlewareMigrationHelper.validateMiddlewareMigration = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, issues, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        issues = [];
                        // Check for old import patterns
                        if (content.includes('../middleware/auth.middleware')) {
                            issues.push('Still using old auth middleware import path');
                        }
                        if (content.includes('../middleware/validation.middleware')) {
                            issues.push('Still using old validation middleware import path');
                        }
                        if (content.includes('../middleware/cache.middleware')) {
                            issues.push('Still using old cache middleware import path');
                        }
                        // Check for deprecated patterns
                        if (content.includes('validateBody(') || content.includes('validateQuery(')) {
                            issues.push('Using deprecated validation methods instead of validateRequest');
                        }
                        // Check for missing core imports
                        if (content.includes('requireAuth') && !content.includes('@triplecheck/core/middleware')) {
                            issues.push('Using requireAuth without core middleware import');
                        }
                        return [2 /*return*/, {
                                isValid: issues.length === 0,
                                issues: issues
                            }];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, {
                                isValid: false,
                                issues: ["Error reading file: ".concat(error_4)]
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update error handling middleware
     */
    MiddlewareMigrationHelper.updateErrorHandlingMiddleware = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var content, updatedContent, hasChanges, errorHandlingUpdates, _i, errorHandlingUpdates_1, update, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                    case 1:
                        content = _a.sent();
                        updatedContent = content;
                        hasChanges = false;
                        errorHandlingUpdates = [
                            {
                                old: /import\s*{\s*asyncHandler\s*}\s*from\s*["']\.\.\/middleware\/error["']/g,
                                new: "import { asyncHandler } from '..\..\server\middleware\error'"
                            },
                            {
                                old: /import\s*{\s*errorHandler\s*}\s*from\s*["']\.\.\/middleware\/error["']/g,
                                new: "import { errorHandler } from '..\..\server\middleware\error'"
                            }
                        ];
                        for (_i = 0, errorHandlingUpdates_1 = errorHandlingUpdates; _i < errorHandlingUpdates_1.length; _i++) {
                            update = errorHandlingUpdates_1[_i];
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
                        error_5 = _a.sent();
                        console.error("Error updating error handling middleware in ".concat(filePath, ":"), error_5);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return MiddlewareMigrationHelper;
}());
exports.MiddlewareMigrationHelper = MiddlewareMigrationHelper;
