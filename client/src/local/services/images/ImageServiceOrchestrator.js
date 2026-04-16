"use strict";
/**
 * Image Service Orchestrator - Practical Implementation
 *
 * Coordinates existing services to eliminate duplication while maintaining
 * compatibility. Uses composition over inheritance for better reliability.
 *
 * Strategic Benefits:
 * - Single entry point for complex workflows
 * - Works with existing proven services
 * - Eliminates duplication through smart coordination
 * - Maintains backward compatibility
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
exports.DefaultImageServiceOrchestrator = void 0;
exports.getImageServiceOrchestrator = getImageServiceOrchestrator;
exports.createImageServiceOrchestrator = createImageServiceOrchestrator;
var PropertyImageUploadService_1 = require("./PropertyImageUploadService");
var PropertyImageValidationService_1 = require("./PropertyImageValidationService");
var PropertyImageWorkflowManager_1 = require("./PropertyImageWorkflowManager");
var ImageMetadataService_1 = require("./ImageMetadataService");
var DefaultImageServiceOrchestrator = /** @class */ (function () {
    function DefaultImageServiceOrchestrator(config) {
        var _this = this;
        // Initialize new consolidated services with optimized configuration
        this.uploadService = new PropertyImageUploadService_1.PropertyImageUploadService({}, config);
        this.validationService = new PropertyImageValidationService_1.PropertyImageValidationService({}, config);
        this.metadataService = new ImageMetadataService_1.ImageMetadataService();
        // Initialize workflow service with proper dependencies
        this.workflowService = new PropertyImageWorkflowManager_1.PropertyImageWorkflowManager({
            validationService: this.validationService,
            metadataService: {
                extractMetadata: function (ref) { return _this.metadataService.extractMetadata(ref); },
                performVirusScan: function (ref) { return _this.metadataService.performVirusScan(ref); },
                checkCompliance: function (ref, metadata) {
                    return _this.metadataService.checkCompliance(ref, metadata);
                },
            },
        }, config);
    }
    // High-level workflow: Complete property image processing
    DefaultImageServiceOrchestrator.prototype.processPropertyImage = function (file, documentType, landVerificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, uploadSession, _i, _a, chunk;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.validationService.validateFile(file, undefined, documentType)];
                    case 1:
                        validation = _b.sent();
                        if (!validation.isValid) {
                            throw new Error("Validation failed: ".concat(validation.errors.join(', ')));
                        }
                        return [4 /*yield*/, this.uploadService.initiateUpload(file, documentType, landVerificationId)];
                    case 2:
                        uploadSession = _b.sent();
                        _i = 0, _a = uploadSession.chunks;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        chunk = _a[_i];
                        return [4 /*yield*/, this.uploadService.uploadChunk(uploadSession.id, chunk)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: 
                    // Step 4: Start processing workflow
                    return [4 /*yield*/, this.workflowService.startProcessingWorkflow(uploadSession.imageId, "uploaded/".concat(uploadSession.imageId), documentType, landVerificationId)];
                    case 7:
                        // Step 4: Start processing workflow
                        _b.sent();
                        // Return the property image object
                        return [2 /*return*/, {
                                id: uploadSession.imageId,
                                file: file,
                                status: 'processing',
                                approvalStatus: 'pending',
                                sessionId: uploadSession.id,
                                documentType: documentType,
                                landVerificationId: landVerificationId,
                                metadata: validation.metadata,
                                validationResult: validation,
                            }];
                }
            });
        });
    };
    // High-level workflow: Validate and upload (without processing)
    DefaultImageServiceOrchestrator.prototype.validateAndUpload = function (file, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, upload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validationService.validateFile(file, undefined, documentType)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.isValid) {
                            return [2 /*return*/, { validation: validation, upload: null }];
                        }
                        return [4 /*yield*/, this.uploadService.initiateUpload(file, documentType)];
                    case 2:
                        upload = _a.sent();
                        return [2 /*return*/, { validation: validation, upload: upload }];
                }
            });
        });
    };
    // Direct service access
    DefaultImageServiceOrchestrator.prototype.getUploadService = function () {
        return this.uploadService;
    };
    DefaultImageServiceOrchestrator.prototype.getValidationService = function () {
        return this.validationService;
    };
    DefaultImageServiceOrchestrator.prototype.getWorkflowService = function () {
        return this.workflowService;
    };
    DefaultImageServiceOrchestrator.prototype.getMetadataService = function () {
        return this.metadataService;
    };
    // Progress tracking methods
    DefaultImageServiceOrchestrator.prototype.getUploadProgress = function (sessionId) {
        return this.uploadService.getUploadProgress(sessionId);
    };
    DefaultImageServiceOrchestrator.prototype.getWorkflowStatus = function (imageId) {
        return this.workflowService.getWorkflowStatus(imageId);
    };
    // Utility methods for monitoring across services (removed duplicates)
    // Batch operations that coordinate multiple services
    DefaultImageServiceOrchestrator.prototype.processBatch = function (files, documentType, onProgress) {
        return __awaiter(this, void 0, void 0, function () {
            var results, completed, _i, files_1, file, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        completed = 0;
                        _i = 0, files_1 = files;
                        _a.label = 1;
                    case 1:
                        if (!(_i < files_1.length)) return [3 /*break*/, 7];
                        file = files_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.processPropertyImage(file, documentType)];
                    case 3:
                        result = _a.sent();
                        results.push(result);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        // Create error result
                        results.push({
                            id: "error_".concat(Date.now()),
                            file: file,
                            status: 'error',
                            approvalStatus: 'pending',
                            validationResult: {
                                isValid: false,
                                errors: [error_1 instanceof Error ? error_1.message : 'Processing failed'],
                                warnings: [],
                            },
                        });
                        return [3 /*break*/, 5];
                    case 5:
                        completed++;
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress(completed, files.length);
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, results];
                }
            });
        });
    };
    return DefaultImageServiceOrchestrator;
}());
exports.DefaultImageServiceOrchestrator = DefaultImageServiceOrchestrator;
// Singleton instance for global use
var orchestratorInstance = null;
function getImageServiceOrchestrator(config) {
    if (!orchestratorInstance) {
        orchestratorInstance = new DefaultImageServiceOrchestrator(config);
    }
    return orchestratorInstance;
}
// Factory function for creating new instances (useful for testing)
function createImageServiceOrchestrator(config) {
    return new DefaultImageServiceOrchestrator(config);
}
exports.default = DefaultImageServiceOrchestrator;
