"use strict";
/**
 * Image Service Core - Shared Foundation Layer
 *
 * This core layer eliminates duplication by providing shared functionality
 * that all image services can use, while maintaining separation of concerns.
 *
 * Strategic Benefits:
 * - Eliminates duplicate code across services
 * - Provides consistent error handling and logging
 * - Centralizes common operations like file processing
 * - Maintains service boundaries for better maintainability
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
exports.ImageServiceRegistry = exports.DefaultAuditService = exports.ImageServiceCore = void 0;
var image_system_config_1 = require("../../../config/image-system.config");
var images_1 = require("../../../types/images");
var unified_utils_1 = require("../../../utils/images/unified-utils");
// Core shared functionality
var ImageServiceCore = /** @class */ (function () {
    function ImageServiceCore(config, auditService) {
        this.config = config || image_system_config_1.imageServiceConfig;
        this.auditService = auditService;
    }
    // Shared configuration management
    ImageServiceCore.prototype.updateConfig = function (config) {
        this.config = __assign(__assign({}, this.config), config);
    };
    ImageServiceCore.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    // Shared audit logging
    ImageServiceCore.prototype.logEvent = function (event, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.auditService) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.auditService.log(this.serviceName, event, metadata)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Shared error handling
    ImageServiceCore.prototype.createError = function (message, code, imageId, step, retryable) {
        if (retryable === void 0) { retryable = false; }
        return new images_1.ImageProcessingError(message, code, imageId, step, retryable);
    };
    // Shared file processing utilities
    ImageServiceCore.prototype.createFileChunks = function (file, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, chunkSize, totalChunks, i, start, end, chunkData, chunk;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chunks = [];
                        chunkSize = this.config.upload.chunkSize;
                        totalChunks = Math.ceil(file.size / chunkSize);
                        i = 0;
                        _b.label = 1;
                    case 1:
                        if (!(i < totalChunks)) return [3 /*break*/, 4];
                        start = i * chunkSize;
                        end = Math.min(start + chunkSize, file.size);
                        chunkData = file.slice(start, end);
                        _a = {
                            id: "".concat(sessionId, "-chunk-").concat(i),
                            index: i,
                            data: chunkData,
                            size: chunkData.size
                        };
                        return [4 /*yield*/, unified_utils_1.ImageUtils.calculateHash(chunkData)];
                    case 2:
                        chunk = (_a.hash = _b.sent(),
                            _a.uploaded = false,
                            _a.retryCount = 0,
                            _a);
                        chunks.push(chunk);
                        _b.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, chunks];
                }
            });
        });
    };
    // Shared metadata extraction helpers
    ImageServiceCore.prototype.extractBasicMetadata = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        fileSize: file.size,
                        technicalMetadata: {
                            format: unified_utils_1.ImageUtils.getFileExtension(file.name),
                            colorSpace: 'sRGB',
                            bitDepth: 24,
                            compression: 'JPEG',
                            orientation: 1,
                        },
                        createdAt: Date.now(),
                        lastModified: file.lastModified,
                    }];
            });
        });
    };
    // Shared validation helpers
    ImageServiceCore.prototype.validateFileSize = function (fileSize) {
        return fileSize > 0 && fileSize <= this.config.validation.maxFileSize;
    };
    ImageServiceCore.prototype.validateFileFormat = function (fileName) {
        var extension = unified_utils_1.ImageUtils.getFileExtension(fileName);
        return this.config.validation.allowedFormats.includes(extension);
    };
    // Shared retry logic
    ImageServiceCore.prototype.withRetry = function (operation_1) {
        return __awaiter(this, arguments, void 0, function (operation, maxRetries, delay) {
            var lastError, _loop_1, attempt, state_1;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (delay === void 0) { delay = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var _b, error_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 4]);
                                        _b = {};
                                        return [4 /*yield*/, operation()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_1 = _c.sent();
                                        lastError = error_1 instanceof Error ? error_1 : new Error('Unknown error');
                                        if (attempt === maxRetries) {
                                            return [2 /*return*/, "break"];
                                        }
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay * Math.pow(2, attempt)); })];
                                    case 3:
                                        _c.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        if (state_1 === "break")
                            return [3 /*break*/, 4];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError;
                }
            });
        });
    };
    // Shared progress tracking
    ImageServiceCore.prototype.calculateProgress = function (completed, total) {
        return total > 0 ? (completed / total) * 100 : 0;
    };
    ImageServiceCore.prototype.calculateSpeed = function (bytes, timeInSeconds) {
        return timeInSeconds > 0 ? bytes / timeInSeconds : 0;
    };
    ImageServiceCore.prototype.calculateETA = function (remainingBytes, speed) {
        return speed > 0 ? remainingBytes / speed : undefined;
    };
    return ImageServiceCore;
}());
exports.ImageServiceCore = ImageServiceCore;
// Default audit service implementation
var DefaultAuditService = /** @class */ (function () {
    function DefaultAuditService() {
    }
    DefaultAuditService.prototype.log = function (serviceName, event, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In development, log to console
                if (process.env.NODE_ENV === 'development') {
                    console.log("[".concat(serviceName, "] ").concat(event, ":"), metadata);
                }
                return [2 /*return*/];
            });
        });
    };
    return DefaultAuditService;
}());
exports.DefaultAuditService = DefaultAuditService;
// Service registry for dependency injection
var ImageServiceRegistry = /** @class */ (function () {
    function ImageServiceRegistry() {
        this.services = new Map();
        this.auditService = new DefaultAuditService();
    }
    ImageServiceRegistry.getInstance = function () {
        if (!ImageServiceRegistry.instance) {
            ImageServiceRegistry.instance = new ImageServiceRegistry();
        }
        return ImageServiceRegistry.instance;
    };
    ImageServiceRegistry.prototype.register = function (service) {
        this.services.set(service.serviceName, service);
        return service;
    };
    ImageServiceRegistry.prototype.get = function (serviceName) {
        return this.services.get(serviceName);
    };
    ImageServiceRegistry.prototype.getAuditService = function () {
        return this.auditService;
    };
    ImageServiceRegistry.prototype.setAuditService = function (auditService) {
        this.auditService = auditService;
    };
    // Get all services of a specific type
    ImageServiceRegistry.prototype.getServicesByType = function (predicate) {
        return Array.from(this.services.values()).filter(predicate);
    };
    // Check if a service is registered
    ImageServiceRegistry.prototype.has = function (serviceName) {
        return this.services.has(serviceName);
    };
    // Get all registered service names
    ImageServiceRegistry.prototype.getRegisteredServiceNames = function () {
        return Array.from(this.services.keys());
    };
    return ImageServiceRegistry;
}());
exports.ImageServiceRegistry = ImageServiceRegistry;
exports.default = ImageServiceCore;
