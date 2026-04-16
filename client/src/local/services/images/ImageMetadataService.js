"use strict";
/**
 * Image Metadata & Compliance Service
 * Centralizes operations related to extracting, validating, and managing image metadata,
 * as well as performing compliance and security scans
 *
 * Integrates with configuration system and shared utilities
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
exports.imageMetadataService = exports.ImageMetadataService = void 0;
var ImageServiceCore_1 = require("./core/ImageServiceCore");
var images_1 = require("../../types/images");
var UNKNOWN_ERROR = 'Unknown error';
// Crypto-based random number generation utility
var getSecureRandom = function () {
    var _a;
    if ((_a = window === null || window === void 0 ? void 0 : window.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues) {
        var array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        var value = array[0];
        return value !== undefined ? value / (0xFFFFFFFF + 1) : 0.5;
    }
    // Fallback for non-browser environments or when crypto is unavailable
    // Using a deterministic fallback for testing environments
    return 0.5;
};
// Development logging utility
var devLog = {
    warn: function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn.apply(console, __spreadArray([message], args, false));
        }
    }
};
var ImageMetadataService = /** @class */ (function (_super) {
    __extends(ImageMetadataService, _super);
    function ImageMetadataService(aiVisionAPI, virusScanAPI, complianceEngine, config) {
        var _this = _super.call(this, config, ImageServiceCore_1.ImageServiceRegistry.getInstance().getAuditService()) || this;
        _this.aiVisionAPI = aiVisionAPI;
        _this.virusScanAPI = virusScanAPI;
        _this.complianceEngine = complianceEngine;
        _this.serviceName = 'ImageMetadataService';
        _this.version = '2.0.0';
        // Validate configuration on initialization
        if (!_this.config.processing.enableAITagging && aiVisionAPI) {
            // Log warning about configuration mismatch
            devLog.warn('AI Vision API provided but AI tagging is disabled in configuration');
        }
        return _this;
    }
    ImageMetadataService.prototype.extractMetadata = function (fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var basicMetadata, aiEnhancedMetadata, aiData, error_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.extractBasicMetadata(fileReference)];
                    case 1:
                        basicMetadata = _a.sent();
                        aiEnhancedMetadata = {};
                        if (!this.aiVisionAPI) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.aiVisionAPI.analyzeImage(fileReference)];
                    case 3:
                        aiData = _a.sent();
                        aiEnhancedMetadata = {
                            faces: aiData.faces,
                            objects: aiData.objects,
                            dominantColors: aiData.dominantColors,
                        };
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        // AI vision analysis failed - continue without AI metadata
                        devLog.warn('AI vision analysis failed, continuing without AI metadata:', error_1 instanceof Error ? error_1.message : UNKNOWN_ERROR);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, __assign(__assign({}, basicMetadata), aiEnhancedMetadata)];
                    case 6:
                        error_2 = _a.sent();
                        throw new images_1.ImageProcessingError("Failed to extract metadata: ".concat(error_2 instanceof Error ? error_2.message : UNKNOWN_ERROR), 'METADATA_EXTRACTION_FAILED');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    ImageMetadataService.prototype.performVirusScan = function (fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var scanStart, scanData, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scanStart = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!this.virusScanAPI) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.virusScanAPI.scanFile(fileReference)];
                    case 2:
                        scanData = _a.sent();
                        return [2 /*return*/, {
                                clean: scanData.clean,
                                threats: scanData.threats,
                                scanDate: new Date(),
                                scanDuration: scanData.scanDuration,
                                engine: 'EnterpriseAV-2024',
                                signatureVersion: '2024.1.0',
                            }];
                    case 3: 
                    // Mock implementation for development/testing
                    return [2 /*return*/, this.mockVirusScan(scanStart)];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        throw new images_1.ImageProcessingError("Virus scan failed: ".concat(error_3 instanceof Error ? error_3.message : UNKNOWN_ERROR), 'VIRUS_SCAN_FAILED');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ImageMetadataService.prototype.checkCompliance = function (fileReference, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var fileInfo, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.complianceEngine) return [3 /*break*/, 2];
                        fileInfo = this.extractFileInfoFromReference(fileReference);
                        return [4 /*yield*/, this.complianceEngine.checkCompliance(metadata, fileInfo)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: 
                    // Mock implementation for development/testing
                    return [2 /*return*/, this.mockComplianceCheck(metadata)];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        throw new images_1.ImageProcessingError("Compliance check failed: ".concat(error_4 instanceof Error ? error_4.message : UNKNOWN_ERROR), 'COMPLIANCE_CHECK_FAILED');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ImageMetadataService.prototype.extractAITags = function (fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var aiData, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.aiVisionAPI) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.aiVisionAPI.analyzeImage(fileReference)];
                    case 1:
                        aiData = _a.sent();
                        return [2 /*return*/, aiData.tags.map(function (tag) { return ({
                                label: tag.label,
                                confidence: tag.confidence,
                                source: 'vision',
                                timestamp: new Date(),
                            }); })];
                    case 2: 
                    // Mock implementation for development/testing
                    return [2 /*return*/, this.mockAITags()];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        // AI tag extraction failed - return empty array
                        devLog.warn('AI tag extraction failed:', error_5 instanceof Error ? error_5.message : UNKNOWN_ERROR);
                        return [2 /*return*/, []]; // Return empty array instead of throwing, as AI tags are optional
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Set external service dependencies (for dependency injection)
    ImageMetadataService.prototype.setAIVisionAPI = function (api) {
        this.aiVisionAPI = api;
    };
    ImageMetadataService.prototype.setVirusScanAPI = function (api) {
        this.virusScanAPI = api;
    };
    ImageMetadataService.prototype.setComplianceEngine = function (engine) {
        this.complianceEngine = engine;
    };
    ImageMetadataService.prototype.extractBasicMetadata = function (_fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real implementation, this would extract EXIF data and other metadata
                // For now, we'll simulate basic metadata extraction
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve({
                                fileSize: 1024 * 1024, // 1MB default
                                technicalMetadata: {
                                    format: 'jpeg', // Would be extracted from actual file
                                    colorSpace: 'sRGB',
                                    bitDepth: 24,
                                    compression: 'JPEG',
                                    orientation: 1,
                                },
                                createdAt: Date.now(),
                                lastModified: Date.now(),
                            });
                        }, 100); // Simulate processing time
                    })];
            });
        });
    };
    ImageMetadataService.prototype.mockVirusScan = function (scanStart) {
        var scanDuration = Date.now() - scanStart;
        var randomValue = getSecureRandom();
        var clean = randomValue > 0.02; // 98% clean rate
        var threatRandomValue = getSecureRandom();
        var threats = clean ? [] : [
            'suspicious-metadata',
            'potential-malware',
            'embedded-script',
            'steganography-detected',
        ].slice(0, Math.floor(threatRandomValue * 2) + 1);
        return {
            clean: clean,
            threats: threats,
            scanDate: new Date(),
            scanDuration: scanDuration,
            engine: 'MockAV-2024',
            signatureVersion: '2024.1.0',
        };
    };
    ImageMetadataService.prototype.mockComplianceCheck = function (metadata) {
        var complianceFlags = [];
        var regulatoryFlags = [];
        // Mock compliance rules
        if (metadata.fileSize > 100 * 1024 * 1024) {
            complianceFlags.push('large-file-review');
        }
        if (metadata.fileSize > 1000 * 1024 * 1024) {
            regulatoryFlags.push('regulatory-review-required');
        }
        var randomValue = getSecureRandom();
        if (randomValue > 0.95) {
            complianceFlags.push('manual-review-required');
        }
        if (metadata.technicalMetadata.format === 'heic') {
            regulatoryFlags.push('format-compatibility-check');
        }
        return {
            complianceFlags: complianceFlags,
            regulatoryFlags: regulatoryFlags,
        };
    };
    ImageMetadataService.prototype.mockAITags = function () {
        var possibleTags = [
            { label: 'landscape', confidence: 0.92, source: 'vision' },
            { label: 'portrait', confidence: 0.88, source: 'vision' },
            { label: 'outdoor', confidence: 0.85, source: 'vision' },
            { label: 'indoor', confidence: 0.79, source: 'vision' },
            { label: 'nature', confidence: 0.83, source: 'content' },
            { label: 'urban', confidence: 0.76, source: 'content' },
            { label: 'architecture', confidence: 0.81, source: 'vision' },
            { label: 'people', confidence: 0.89, source: 'vision' },
            { label: 'property', confidence: 0.94, source: 'metadata' },
            { label: 'real_estate', confidence: 0.91, source: 'metadata' },
            { label: 'commercial', confidence: 0.87, source: 'content' },
            { label: 'residential', confidence: 0.93, source: 'content' },
        ];
        var shuffledTags = __spreadArray([], possibleTags, true).sort(function () { return getSecureRandom() - 0.5; });
        var selectionRandomValue = getSecureRandom();
        var selectedTags = shuffledTags.slice(0, Math.floor(selectionRandomValue * 4) + 3);
        return selectedTags.map(function (tag) { return (__assign(__assign({}, tag), { timestamp: new Date() })); });
    };
    ImageMetadataService.prototype.extractFileInfoFromReference = function (fileReference) {
        // Mock implementation - in reality, this would query the storage service
        return {
            name: fileReference.split('/').pop() || 'unknown',
            size: Math.floor(getSecureRandom() * 10 * 1024 * 1024), // Random size up to 10MB
        };
    };
    return ImageMetadataService;
}(ImageServiceCore_1.ImageServiceCore));
exports.ImageMetadataService = ImageMetadataService;
// Register service in the registry
exports.imageMetadataService = ImageServiceCore_1.ImageServiceRegistry.getInstance().register(new ImageMetadataService());
exports.default = ImageMetadataService;
