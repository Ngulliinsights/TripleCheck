"use strict";
/**
 * Property Image Validation Service - Refactored
 *
 * Focused service that handles only validation operations.
 * Uses shared core to eliminate duplication while maintaining clear boundaries.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.propertyImageValidationService = exports.PropertyImageValidationService = void 0;
var ImageServiceCore_1 = require("./core/ImageServiceCore");
var images_1 = require("../../types/images");
var unified_utils_1 = require("../../utils/images/unified-utils");
var PropertyImageValidationService = /** @class */ (function (_super) {
    __extends(PropertyImageValidationService, _super);
    function PropertyImageValidationService(dependencies, config) {
        if (dependencies === void 0) { dependencies = {}; }
        var _this = _super.call(this, config, ImageServiceCore_1.ImageServiceRegistry.getInstance().getAuditService()) || this;
        _this.dependencies = dependencies;
        _this.serviceName = 'PropertyImageValidationService';
        _this.version = '2.0.0';
        return _this;
    }
    PropertyImageValidationService.prototype.validateFile = function (file, options, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var validationOptions, result, metadata, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validationOptions = options || this.getValidationProfile(documentType || 'other_document');
                        result = {
                            isValid: true,
                            errors: [],
                            warnings: [],
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 8]);
                        return [4 /*yield*/, this.logEvent('validation_started', {
                                fileName: file.name,
                                fileSize: file.size,
                                documentType: documentType || 'unknown',
                            })];
                    case 2:
                        _a.sent();
                        // Use shared validation helpers
                        if (!this.validateFileSize(file.size)) {
                            result.isValid = false;
                            result.errors.push("File size (".concat(unified_utils_1.ImageUtils.formatFileSize(file.size), ") exceeds maximum allowed size (").concat(unified_utils_1.ImageUtils.formatFileSize(this.config.validation.maxFileSize), ")"));
                        }
                        if (!this.validateFileFormat(file.name)) {
                            result.isValid = false;
                            result.errors.push("File format '".concat(unified_utils_1.ImageUtils.getFileExtension(file.name), "' is not allowed. Allowed formats: ").concat(this.config.validation.allowedFormats.join(', ')));
                        }
                        // MIME type validation
                        if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
                            result.isValid = false;
                            result.errors.push('File is not a valid image or PDF document');
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, this.extractImageMetadata(file)];
                    case 3:
                        metadata = _a.sent();
                        result.metadata = metadata;
                        // Perform advanced validations
                        return [4 /*yield*/, this.performAdvancedValidations(file, metadata, result, documentType)];
                    case 4:
                        // Perform advanced validations
                        _a.sent();
                        return [4 /*yield*/, this.logEvent('validation_completed', {
                                fileName: file.name,
                                isValid: result.isValid,
                                errorCount: result.errors.length,
                                warningCount: result.warnings.length,
                                documentType: documentType || 'unknown',
                            })];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, result];
                    case 6:
                        error_1 = _a.sent();
                        result.isValid = false;
                        result.errors.push("Validation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                        return [4 /*yield*/, this.logEvent('validation_error', {
                                fileName: file.name,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                                documentType: documentType || 'unknown',
                            })];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, result];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageValidationService.prototype.validateUrl = function (url, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                result = {
                    isValid: true,
                    errors: [],
                    warnings: [],
                };
                if (!url) {
                    result.isValid = false;
                    result.errors.push('No URL provided');
                    return [2 /*return*/, result];
                }
                try {
                    new URL(url);
                }
                catch (_b) {
                    result.isValid = false;
                    result.errors.push('Invalid URL format');
                    return [2 /*return*/, result];
                }
                // URL validation implementation would go here
                return [2 /*return*/, result];
            });
        });
    };
    PropertyImageValidationService.prototype.validateBatch = function (files, options, onProgress) {
        return __awaiter(this, void 0, void 0, function () {
            var results, progressTracker, concurrencyLimit, batches, i, _i, batches_1, batch, batchPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = {};
                        progressTracker = { completed: 0 };
                        concurrencyLimit = 3;
                        batches = [];
                        for (i = 0; i < files.length; i += concurrencyLimit) {
                            batches.push(files.slice(i, i + concurrencyLimit));
                        }
                        _i = 0, batches_1 = batches;
                        _a.label = 1;
                    case 1:
                        if (!(_i < batches_1.length)) return [3 /*break*/, 4];
                        batch = batches_1[_i];
                        batchPromises = batch.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var result, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, this.validateFile(file, options)];
                                    case 1:
                                        result = _a.sent();
                                        results[file.name] = result;
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _a.sent();
                                        results[file.name] = {
                                            isValid: false,
                                            errors: [error_2 instanceof Error ? error_2.message : 'Validation failed'],
                                            warnings: [],
                                        };
                                        return [3 /*break*/, 3];
                                    case 3:
                                        progressTracker.completed++;
                                        onProgress === null || onProgress === void 0 ? void 0 : onProgress(progressTracker.completed, files.length);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(batchPromises)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    PropertyImageValidationService.prototype.getValidationProfile = function (documentType) {
        var profile = images_1.DOCUMENT_VALIDATION_PROFILES[documentType];
        return profile || images_1.DOCUMENT_VALIDATION_PROFILES.other_document;
    };
    // Private methods
    PropertyImageValidationService.prototype.extractImageMetadata = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var basicMetadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.extractBasicMetadata(file)];
                    case 1:
                        basicMetadata = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                if (file.type.startsWith('application/pdf')) {
                                    resolve(__assign(__assign({}, basicMetadata), { technicalMetadata: {
                                            format: 'pdf',
                                            colorSpace: 'sRGB',
                                            bitDepth: 24,
                                            compression: 'PDF',
                                            orientation: 1,
                                        } }));
                                    return;
                                }
                                if (typeof window === 'undefined' || typeof Image === 'undefined') {
                                    reject(new Error('Image metadata extraction not supported in this environment'));
                                    return;
                                }
                                var img = new Image();
                                img.onload = function () {
                                    try {
                                        var metadata = __assign(__assign({}, basicMetadata), { dimensions: {
                                                width: img.naturalWidth,
                                                height: img.naturalHeight,
                                            }, technicalMetadata: {
                                                format: unified_utils_1.ImageUtils.getFileExtension(file.name).toLowerCase(),
                                                colorSpace: 'sRGB',
                                                bitDepth: 24,
                                                compression: 'JPEG',
                                                orientation: 1,
                                            } });
                                        resolve(metadata);
                                    }
                                    catch (error) {
                                        reject(error);
                                    }
                                };
                                img.onerror = function () {
                                    reject(new Error('Failed to load image - file may be corrupted'));
                                };
                                var objectUrl = URL.createObjectURL(file);
                                img.src = objectUrl;
                                setTimeout(function () {
                                    URL.revokeObjectURL(objectUrl);
                                }, 5000);
                            })];
                }
            });
        });
    };
    PropertyImageValidationService.prototype.performAdvancedValidations = function (file, metadata, result, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var authResult, error_3, fraudScore, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.config.validation.documentAuthEnabled &&
                            this.dependencies.documentAuthService &&
                            documentType &&
                            documentType !== 'property_photo')) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.dependencies.documentAuthService.authenticateDocument(file, documentType)];
                    case 2:
                        authResult = _a.sent();
                        result.documentAuthResult = authResult;
                        if (!authResult.isAuthentic) {
                            result.isValid = false;
                            result.errors.push("Document authentication failed: ".concat(authResult.anomalies.join(', ')));
                        }
                        else if (authResult.confidence < 0.8) {
                            result.warnings.push("Document authentication confidence is low (".concat(Math.round(authResult.confidence * 100), "%)"));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        result.warnings.push("Document authentication service unavailable: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'));
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(this.config.validation.fraudDetectionEnabled &&
                            this.dependencies.fraudDetectionService)) return [3 /*break*/, 8];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.dependencies.fraudDetectionService.analyzeFraudRisk(file, metadata)];
                    case 6:
                        fraudScore = _a.sent();
                        result.fraudRiskScore = fraudScore;
                        if (fraudScore > 0.8) {
                            result.isValid = false;
                            result.errors.push("High fraud risk detected (score: ".concat(Math.round(fraudScore * 100), "%)"));
                        }
                        else if (fraudScore > 0.5) {
                            result.warnings.push("Moderate fraud risk detected (score: ".concat(Math.round(fraudScore * 100), "%)"));
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _a.sent();
                        result.warnings.push("Fraud detection service unavailable: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error'));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return PropertyImageValidationService;
}(ImageServiceCore_1.ImageServiceCore));
exports.PropertyImageValidationService = PropertyImageValidationService;
// Register service in the registry
exports.propertyImageValidationService = ImageServiceCore_1.ImageServiceRegistry.getInstance().register(new PropertyImageValidationService());
exports.default = PropertyImageValidationService;
