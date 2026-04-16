"use strict";
/**
 * Property Image Workflow Manager
 * Context-sensitive workflow orchestration for property verification domain
 * Integrates with existing API services and follows project patterns
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
exports.propertyImageWorkflowManager = exports.PropertyImageWorkflowManager = void 0;
var ImageServiceCore_1 = require("./core/ImageServiceCore");
var images_1 = require("../../types/images");
var unified_utils_1 = require("../../utils/images/unified-utils");
var UNKNOWN_ERROR = 'Unknown error';
var PropertyImageWorkflowManager = /** @class */ (function (_super) {
    __extends(PropertyImageWorkflowManager, _super);
    function PropertyImageWorkflowManager(dependencies, config) {
        var _this = _super.call(this, config, ImageServiceCore_1.ImageServiceRegistry.getInstance().getAuditService()) || this;
        _this.dependencies = dependencies;
        _this.serviceName = 'PropertyImageWorkflowManager';
        _this.version = '2.0.0';
        _this.activeWorkflows = new Map();
        _this.workflowCallbacks = new Map();
        return _this;
    }
    PropertyImageWorkflowManager.prototype.startProcessingWorkflow = function (imageId, fileReference, documentType, landVerificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var workflowId, workflow, processingSteps, _i, processingSteps_1, step, currentWorkflow, metadata, error_1, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        workflowId = unified_utils_1.ImageUtils.generateUniqueId();
                        workflow = {
                            imageId: imageId,
                            currentStep: 'validation',
                            completedSteps: [],
                            failedSteps: [],
                            status: 'running',
                            startTime: new Date(),
                        };
                        this.activeWorkflows.set(imageId, workflow);
                        this.notifyStatusUpdate(imageId);
                        // Log workflow start
                        return [4 /*yield*/, ((_a = this.dependencies.auditService) === null || _a === void 0 ? void 0 : _a.logWorkflowEvent('workflow_started', {
                                imageId: imageId,
                                workflowId: workflowId,
                                documentType: documentType,
                                landVerificationId: landVerificationId,
                                fileReference: fileReference,
                            }))];
                    case 1:
                        // Log workflow start
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 14, , 15]);
                        processingSteps = this.determineProcessingSteps(documentType);
                        _i = 0, processingSteps_1 = processingSteps;
                        _c.label = 3;
                    case 3:
                        if (!(_i < processingSteps_1.length)) return [3 /*break*/, 6];
                        step = processingSteps_1[_i];
                        return [4 /*yield*/, this.processImage(imageId, step)];
                    case 4:
                        _c.sent();
                        currentWorkflow = this.activeWorkflows.get(imageId);
                        if (!currentWorkflow || currentWorkflow.status === 'paused') {
                            return [2 /*return*/];
                        }
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (!(landVerificationId && this.dependencies.landVerificationService)) return [3 /*break*/, 13];
                        _c.label = 7;
                    case 7:
                        _c.trys.push([7, 11, , 13]);
                        return [4 /*yield*/, this.getCurrentImageMetadata(imageId)];
                    case 8:
                        metadata = _c.sent();
                        if (!metadata.metadata) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.dependencies.landVerificationService.linkImageToVerification(imageId, landVerificationId, metadata.metadata)];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10: return [3 /*break*/, 13];
                    case 11:
                        error_1 = _c.sent();
                        // Log warning without console
                        return [4 /*yield*/, ((_b = this.dependencies.auditService) === null || _b === void 0 ? void 0 : _b.logWorkflowEvent('land_verification_link_failed', {
                                imageId: imageId,
                                landVerificationId: landVerificationId,
                                error: error_1 instanceof Error ? error_1.message : UNKNOWN_ERROR,
                            }))];
                    case 12:
                        // Log warning without console
                        _c.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        // Mark workflow as completed
                        this.completeWorkflow(imageId, 'completed');
                        return [3 /*break*/, 15];
                    case 14:
                        error_2 = _c.sent();
                        this.completeWorkflow(imageId, 'failed', error_2 instanceof Error ? error_2.message : UNKNOWN_ERROR);
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.processImage = function (imageId, step) {
        return __awaiter(this, void 0, void 0, function () {
            var workflow, failedIndex, error_3;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        workflow = this.activeWorkflows.get(imageId);
                        if (!workflow) {
                            throw new images_1.ImageProcessingError("Workflow for image ".concat(imageId, " not found"), 'WORKFLOW_NOT_FOUND', imageId);
                        }
                        if (workflow.status === 'paused') {
                            return [2 /*return*/]; // Skip processing if paused
                        }
                        workflow.currentStep = step;
                        this.notifyStatusUpdate(imageId);
                        // Log step start
                        return [4 /*yield*/, ((_a = this.dependencies.auditService) === null || _a === void 0 ? void 0 : _a.logWorkflowEvent('step_started', {
                                imageId: imageId,
                                step: step,
                            }))];
                    case 1:
                        // Log step start
                        _f.sent();
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 6, , 9]);
                        return [4 /*yield*/, this.executeProcessingStep(imageId, step)];
                    case 3:
                        _f.sent();
                        // Mark step as completed
                        workflow.completedSteps.push(step);
                        failedIndex = workflow.failedSteps.indexOf(step);
                        if (failedIndex > -1) {
                            workflow.failedSteps.splice(failedIndex, 1);
                        }
                        // Update progress
                        workflow.progress = (workflow.completedSteps.length / images_1.PROCESSING_STEPS_ORDER.length) * 100;
                        // Notify step completion
                        return [4 /*yield*/, ((_b = this.dependencies.notificationService) === null || _b === void 0 ? void 0 : _b.notifyStepComplete(imageId, step, true, {
                                progress: workflow.progress,
                            }))];
                    case 4:
                        // Notify step completion
                        _f.sent();
                        // Log step completion
                        return [4 /*yield*/, ((_c = this.dependencies.auditService) === null || _c === void 0 ? void 0 : _c.logWorkflowEvent('step_completed', {
                                imageId: imageId,
                                step: step,
                                progress: workflow.progress,
                            }))];
                    case 5:
                        // Log step completion
                        _f.sent();
                        return [3 /*break*/, 9];
                    case 6:
                        error_3 = _f.sent();
                        // Mark step as failed
                        if (!workflow.failedSteps.includes(step)) {
                            workflow.failedSteps.push(step);
                        }
                        return [4 /*yield*/, ((_d = this.dependencies.notificationService) === null || _d === void 0 ? void 0 : _d.notifyStepComplete(imageId, step, false, {
                                error: error_3 instanceof Error ? error_3.message : UNKNOWN_ERROR,
                            }))];
                    case 7:
                        _f.sent();
                        // Log step failure
                        return [4 /*yield*/, ((_e = this.dependencies.auditService) === null || _e === void 0 ? void 0 : _e.logWorkflowEvent('step_failed', {
                                imageId: imageId,
                                step: step,
                                error: error_3 instanceof Error ? error_3.message : UNKNOWN_ERROR,
                            }))];
                    case 8:
                        // Log step failure
                        _f.sent();
                        throw new images_1.ImageProcessingError("Failed to process step ".concat(step, " for image ").concat(imageId, ": ").concat(error_3 instanceof Error ? error_3.message : UNKNOWN_ERROR), 'PROCESSING_STEP_FAILED', imageId, step);
                    case 9:
                        this.notifyStatusUpdate(imageId);
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.getWorkflowStatus = function (imageId) {
        return this.activeWorkflows.get(imageId) || null;
    };
    PropertyImageWorkflowManager.prototype.pauseWorkflow = function (imageId) {
        var _a;
        var workflow = this.activeWorkflows.get(imageId);
        if (workflow) {
            workflow.status = 'paused';
            this.notifyStatusUpdate(imageId);
            // Log pause
            (_a = this.dependencies.auditService) === null || _a === void 0 ? void 0 : _a.logWorkflowEvent('workflow_paused', {
                imageId: imageId,
                currentStep: workflow.currentStep,
                progress: workflow.progress,
            });
        }
    };
    PropertyImageWorkflowManager.prototype.resumeWorkflow = function (imageId) {
        var _a;
        var workflow = this.activeWorkflows.get(imageId);
        if (workflow && workflow.status === 'paused') {
            workflow.status = 'running';
            this.notifyStatusUpdate(imageId);
            // Log resume
            (_a = this.dependencies.auditService) === null || _a === void 0 ? void 0 : _a.logWorkflowEvent('workflow_resumed', {
                imageId: imageId,
                currentStep: workflow.currentStep,
                progress: workflow.progress,
            });
            // Continue processing from current step
            this.continueWorkflow(imageId);
        }
    };
    PropertyImageWorkflowManager.prototype.cancelWorkflow = function (imageId) {
        var _a;
        var workflow = this.activeWorkflows.get(imageId);
        if (workflow) {
            // Log cancellation
            (_a = this.dependencies.auditService) === null || _a === void 0 ? void 0 : _a.logWorkflowEvent('workflow_cancelled', {
                imageId: imageId,
                currentStep: workflow.currentStep,
                progress: workflow.progress,
            });
        }
        this.activeWorkflows.delete(imageId);
        this.workflowCallbacks.delete(imageId);
    };
    PropertyImageWorkflowManager.prototype.retryFailedStep = function (imageId, step) {
        return __awaiter(this, void 0, void 0, function () {
            var workflow, failedIndex;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        workflow = this.activeWorkflows.get(imageId);
                        if (!workflow) {
                            throw new images_1.ImageProcessingError("Workflow for image ".concat(imageId, " not found"), 'WORKFLOW_NOT_FOUND', imageId);
                        }
                        failedIndex = workflow.failedSteps.indexOf(step);
                        if (failedIndex > -1) {
                            workflow.failedSteps.splice(failedIndex, 1);
                        }
                        // Log retry
                        return [4 /*yield*/, ((_a = this.dependencies.auditService) === null || _a === void 0 ? void 0 : _a.logWorkflowEvent('step_retry', {
                                imageId: imageId,
                                step: step,
                            }))];
                    case 1:
                        // Log retry
                        _b.sent();
                        // Process the step again
                        return [4 /*yield*/, this.processImage(imageId, step)];
                    case 2:
                        // Process the step again
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Subscribe to workflow status updates
    PropertyImageWorkflowManager.prototype.onStatusUpdate = function (imageId, callback) {
        this.workflowCallbacks.set(imageId, callback);
    };
    PropertyImageWorkflowManager.prototype.determineProcessingSteps = function (documentType) {
        var steps = __spreadArray([], images_1.PROCESSING_STEPS_ORDER, true);
        // Skip document authentication for property photos
        if (documentType === 'property_photo' || !this.config.validation.documentAuthEnabled) {
            steps = steps.filter(function (step) { return step !== 'document_auth'; });
        }
        // Skip fraud detection if disabled
        if (!this.config.validation.fraudDetectionEnabled) {
            steps = steps.filter(function (step) { return step !== 'fraud_detection'; });
        }
        // Skip virus scanning if disabled
        if (!this.config.processing.enableVirusScanning) {
            steps = steps.filter(function (step) { return step !== 'virus_scan'; });
        }
        // Skip compliance check if disabled
        if (!this.config.processing.enableComplianceCheck) {
            steps = steps.filter(function (step) { return step !== 'compliance_check'; });
        }
        return steps;
    };
    PropertyImageWorkflowManager.prototype.executeProcessingStep = function (imageId, step) {
        return __awaiter(this, void 0, void 0, function () {
            var fileReference, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getFileReference(imageId)];
                    case 1:
                        fileReference = _b.sent();
                        _a = step;
                        switch (_a) {
                            case 'validation': return [3 /*break*/, 2];
                            case 'virus_scan': return [3 /*break*/, 4];
                            case 'document_auth': return [3 /*break*/, 6];
                            case 'fraud_detection': return [3 /*break*/, 8];
                            case 'metadata_extraction': return [3 /*break*/, 10];
                            case 'compliance_check': return [3 /*break*/, 12];
                            case 'image_optimization': return [3 /*break*/, 14];
                            case 'thumbnail_generation': return [3 /*break*/, 16];
                        }
                        return [3 /*break*/, 18];
                    case 2: return [4 /*yield*/, this.executeValidation(imageId, fileReference)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 4: return [4 /*yield*/, this.executeVirusScan(imageId, fileReference)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 6: return [4 /*yield*/, this.executeDocumentAuth(imageId, fileReference)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 8: return [4 /*yield*/, this.executeFraudDetection(imageId, fileReference)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 10: return [4 /*yield*/, this.executeMetadataExtraction(imageId, fileReference)];
                    case 11:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 12: return [4 /*yield*/, this.executeComplianceCheck(imageId, fileReference)];
                    case 13:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 14: return [4 /*yield*/, this.executeImageOptimization(imageId, fileReference)];
                    case 15:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 16: return [4 /*yield*/, this.executeThumbnailGeneration(imageId, fileReference)];
                    case 17:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 18: throw new images_1.ImageProcessingError("Unknown processing step: ".concat(step), 'UNKNOWN_STEP', imageId, step);
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeValidation = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dependencies.validationService.validateUrl(fileReference)];
                    case 1:
                        validationResult = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                validationResult: validationResult,
                                status: validationResult.isValid ? 'processing' : 'error',
                            })];
                    case 2:
                        _a.sent();
                        if (!validationResult.isValid) {
                            throw new images_1.ImageProcessingError("Image validation failed: ".concat(validationResult.errors.join(', ')), 'VALIDATION_FAILED', imageId);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeVirusScan = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var scanResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dependencies.metadataService.performVirusScan(fileReference)];
                    case 1:
                        scanResult = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                virusScanResult: scanResult,
                                status: scanResult.clean ? 'processing' : 'error',
                            })];
                    case 2:
                        _a.sent();
                        if (!scanResult.clean) {
                            throw new images_1.ImageProcessingError("Virus scan failed: threats detected - ".concat(scanResult.threats.join(', ')), 'VIRUS_DETECTED', imageId);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeDocumentAuth = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var currentImage, documentType, authResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dependencies.documentAuthService) {
                            return [2 /*return*/]; // Skip if service not available
                        }
                        return [4 /*yield*/, this.getCurrentImageMetadata(imageId)];
                    case 1:
                        currentImage = _a.sent();
                        documentType = currentImage.documentType || 'other_document';
                        return [4 /*yield*/, this.dependencies.documentAuthService.authenticateDocument(fileReference, documentType)];
                    case 2:
                        authResult = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                documentAuthResult: authResult,
                                status: 'processing',
                            })];
                    case 3:
                        _a.sent();
                        if (!authResult.isAuthentic) {
                            throw new images_1.ImageProcessingError("Document authentication failed: ".concat(authResult.anomalies.join(', ')), 'DOCUMENT_AUTH_FAILED', imageId);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeFraudDetection = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var currentImage, fraudScore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dependencies.fraudDetectionService) {
                            return [2 /*return*/]; // Skip if service not available
                        }
                        return [4 /*yield*/, this.getCurrentImageMetadata(imageId)];
                    case 1:
                        currentImage = _a.sent();
                        if (!currentImage.metadata) {
                            throw new images_1.ImageProcessingError('Image metadata not available for fraud detection', 'METADATA_MISSING', imageId);
                        }
                        return [4 /*yield*/, this.dependencies.fraudDetectionService.analyzeImage(fileReference, currentImage.metadata)];
                    case 2:
                        fraudScore = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                fraudDetectionScore: fraudScore,
                                status: 'processing',
                            })];
                    case 3:
                        _a.sent();
                        if (fraudScore > 0.8) {
                            throw new images_1.ImageProcessingError("High fraud risk detected (score: ".concat(Math.round(fraudScore * 100), "%)"), 'HIGH_FRAUD_RISK', imageId);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeMetadataExtraction = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dependencies.metadataService.extractMetadata(fileReference)];
                    case 1:
                        metadata = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                metadata: metadata,
                                status: 'processing',
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeComplianceCheck = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var currentImage, complianceResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentImageMetadata(imageId)];
                    case 1:
                        currentImage = _a.sent();
                        if (!currentImage.metadata) {
                            throw new images_1.ImageProcessingError('Image metadata not available for compliance check', 'METADATA_MISSING', imageId);
                        }
                        return [4 /*yield*/, this.dependencies.metadataService.checkCompliance(fileReference, currentImage.metadata)];
                    case 2:
                        complianceResult = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                complianceFlags: complianceResult.complianceFlags,
                                regulatoryFlags: complianceResult.regulatoryFlags,
                                status: 'processing',
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeImageOptimization = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var optimizedReference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dependencies.storageService) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.dependencies.storageService.optimizeImage(fileReference, this.config.processing.optimizationQuality)];
                    case 1:
                        optimizedReference = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                optimizedReference: optimizedReference,
                                status: 'processing',
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.executeThumbnailGeneration = function (imageId, fileReference) {
        return __awaiter(this, void 0, void 0, function () {
            var thumbnailReferences;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dependencies.storageService) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.dependencies.storageService.generateThumbnails(fileReference, this.config.processing.thumbnailSizes)];
                    case 1:
                        thumbnailReferences = _a.sent();
                        return [4 /*yield*/, this.updateImageMetadata(imageId, {
                                thumbnailReferences: thumbnailReferences,
                                status: 'uploaded', // Final status
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: 
                    // Mark as completed even without thumbnails
                    return [4 /*yield*/, this.updateImageMetadata(imageId, {
                            status: 'uploaded',
                        })];
                    case 4:
                        // Mark as completed even without thumbnails
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.continueWorkflow = function (imageId) {
        return __awaiter(this, void 0, void 0, function () {
            var workflow, currentImage, processingSteps, remainingSteps, _i, remainingSteps_1, step, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workflow = this.activeWorkflows.get(imageId);
                        if (!workflow)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.getCurrentImageMetadata(imageId)];
                    case 2:
                        currentImage = _a.sent();
                        processingSteps = this.determineProcessingSteps(currentImage.documentType);
                        remainingSteps = processingSteps.filter(function (step) { return !workflow.completedSteps.includes(step); });
                        _i = 0, remainingSteps_1 = remainingSteps;
                        _a.label = 3;
                    case 3:
                        if (!(_i < remainingSteps_1.length)) return [3 /*break*/, 6];
                        step = remainingSteps_1[_i];
                        if (workflow.status === 'paused')
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, this.processImage(imageId, step)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (workflow.status === 'running') {
                            this.completeWorkflow(imageId, 'completed');
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _a.sent();
                        this.completeWorkflow(imageId, 'failed', error_4 instanceof Error ? error_4.message : UNKNOWN_ERROR);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.completeWorkflow = function (imageId, status, error) {
        var _this = this;
        var _a, _b;
        var workflow = this.activeWorkflows.get(imageId);
        if (workflow) {
            workflow.status = status;
            workflow.endTime = new Date();
            if (error) {
                workflow.error = error;
            }
            this.notifyStatusUpdate(imageId);
            // Notify completion
            (_a = this.dependencies.notificationService) === null || _a === void 0 ? void 0 : _a.notifyWorkflowComplete(imageId, status === 'completed' ? 'success' : 'failed', {
                totalSteps: workflow.completedSteps.length + workflow.failedSteps.length,
                completedSteps: workflow.completedSteps.length,
                failedSteps: workflow.failedSteps.length,
                duration: workflow.endTime.getTime() - workflow.startTime.getTime(),
            });
            // Log completion
            (_b = this.dependencies.auditService) === null || _b === void 0 ? void 0 : _b.logWorkflowEvent('workflow_completed', {
                imageId: imageId,
                status: status,
                error: error,
                totalSteps: workflow.completedSteps.length + workflow.failedSteps.length,
                completedSteps: workflow.completedSteps.length,
                failedSteps: workflow.failedSteps.length,
                duration: workflow.endTime.getTime() - workflow.startTime.getTime(),
            });
            // Clean up after a delay
            setTimeout(function () {
                _this.activeWorkflows.delete(imageId);
                _this.workflowCallbacks.delete(imageId);
            }, 60000); // Keep for 1 minute for status queries
        }
    };
    PropertyImageWorkflowManager.prototype.notifyStatusUpdate = function (imageId) {
        var callback = this.workflowCallbacks.get(imageId);
        var status = this.activeWorkflows.get(imageId);
        if (callback && status) {
            callback(status);
        }
    };
    PropertyImageWorkflowManager.prototype.getFileReference = function (imageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dependencies.storageService) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.dependencies.storageService.getFileReference(imageId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: 
                    // Fallback for testing/development
                    return [2 /*return*/, "mock://storage/".concat(imageId)];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.updateImageMetadata = function (imageId, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dependencies.storageService) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.dependencies.storageService.updateImageMetadata(imageId, metadata)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageWorkflowManager.prototype.getCurrentImageMetadata = function (imageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real implementation, this would fetch current metadata from storage
                // For now, return a mock object with required fields
                return [2 /*return*/, {
                        id: imageId,
                        file: new File([], 'mock-file.jpg', { type: 'image/jpeg' }),
                        status: 'processing',
                        approvalStatus: 'pending',
                        metadata: {
                            fileSize: 1024 * 1024, // 1MB
                            technicalMetadata: {
                                format: 'jpeg',
                                colorSpace: 'sRGB',
                                bitDepth: 24,
                                compression: 'JPEG',
                                orientation: 1,
                            },
                            createdAt: Date.now(),
                            lastModified: Date.now(),
                        },
                    }];
            });
        });
    };
    return PropertyImageWorkflowManager;
}(ImageServiceCore_1.ImageServiceCore));
exports.PropertyImageWorkflowManager = PropertyImageWorkflowManager;
// Register service in the registry
exports.propertyImageWorkflowManager = ImageServiceCore_1.ImageServiceRegistry.getInstance().register(new PropertyImageWorkflowManager({
    validationService: {
        validateUrl: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, ({ isValid: true, errors: [], warnings: [] })];
        }); }); },
    },
    metadataService: {
        extractMetadata: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
                        fileSize: 1024,
                        technicalMetadata: {
                            format: 'jpeg',
                            colorSpace: 'sRGB',
                            bitDepth: 24,
                            compression: 'JPEG',
                            orientation: 1,
                        },
                        createdAt: Date.now(),
                        lastModified: Date.now(),
                    })];
            });
        }); },
        performVirusScan: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
                        clean: true,
                        threats: [],
                        scanDate: new Date(),
                        scanDuration: 100,
                        engine: 'MockAV',
                        signatureVersion: '1.0.0',
                    })];
            });
        }); },
        checkCompliance: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
                        complianceFlags: [],
                        regulatoryFlags: [],
                    })];
            });
        }); },
    },
}));
exports.default = PropertyImageWorkflowManager;
