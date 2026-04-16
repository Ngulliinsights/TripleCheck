"use strict";
/**
 * Custom React hook for Property Image Upload Management - Refactored
 *
 * Updated to use the new ImageServiceOrchestrator for better performance
 * and reduced duplication while maintaining the same API.
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
exports.usePropertyImageUpload = usePropertyImageUpload;
var react_1 = require("react");
var ImageServiceOrchestrator_1 = require("../../services/images/ImageServiceOrchestrator");
var PropertyImageUploadService_1 = require("../../services/images/PropertyImageUploadService");
var images_1 = require("../../types/images");
var unified_utils_1 = require("../../utils/images/unified-utils");
function usePropertyImageUpload(orchestratorOrLegacyCoordinator, legacyWorkflowManager, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    // Support both new orchestrator and legacy services for backward compatibility
    var orchestrator = orchestratorOrLegacyCoordinator instanceof DefaultImageServiceOrchestrator
        ? orchestratorOrLegacyCoordinator
        : (0, ImageServiceOrchestrator_1.getImageServiceOrchestrator)();
    // For legacy compatibility, extract services from orchestrator or use provided ones
    var uploadCoordinator = (orchestratorOrLegacyCoordinator instanceof PropertyImageUploadCoordinator ||
        orchestratorOrLegacyCoordinator instanceof PropertyImageUploadService_1.PropertyImageUploadService)
        ? orchestratorOrLegacyCoordinator
        : orchestrator.getUploadService();
    var workflowManager = legacyWorkflowManager || orchestrator.getWorkflowService();
    var _a = (0, react_1.useState)([]), images = _a[0], setImages = _a[1];
    var _b = (0, react_1.useState)(false), isUploading = _b[0], setIsUploading = _b[1];
    var activeSessionsRef = (0, react_1.useRef)(new Map());
    var imageSessionMapRef = (0, react_1.useRef)(new Map()); // imageId -> sessionId
    var workflowStatusRef = (0, react_1.useRef)(new Map()); // imageId -> workflow status
    var onUploadComplete = options.onUploadComplete, onUploadError = options.onUploadError, onProgressUpdate = options.onProgressUpdate, onWorkflowUpdate = options.onWorkflowUpdate, _c = options.maxConcurrentUploads, maxConcurrentUploads = _c === void 0 ? 3 : _c, landVerificationId = options.landVerificationId, _d = options.defaultDocumentType, defaultDocumentType = _d === void 0 ? 'property_photo' : _d;
    // Update image status in the state
    var updateImageStatus = (0, react_1.useCallback)(function (imageId, updates) {
        setImages(function (prev) { return prev.map(function (img) {
            return img.id === imageId ? __assign(__assign({}, img), updates) : img;
        }); });
    }, []);
    // Add new image to state
    var addImage = (0, react_1.useCallback)(function (image) {
        setImages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [image], false); });
    }, []);
    // Remove image from state
    var removeImage = (0, react_1.useCallback)(function (imageId) {
        setImages(function (prev) { return prev.filter(function (img) { return img.id !== imageId; }); });
        imageSessionMapRef.current.delete(imageId);
        workflowStatusRef.current.delete(imageId);
    }, []);
    // Helper function to map workflow status to image status
    var mapWorkflowStatusToImageStatus = (0, react_1.useCallback)(function (workflowStatus) {
        switch (workflowStatus) {
            case 'running':
                return 'processing';
            case 'completed':
                return 'uploaded';
            case 'failed':
                return 'error';
            case 'paused':
                return 'paused';
            default:
                return 'processing';
        }
    }, []);
    // Upload a single file using orchestrated services
    var uploadFile = (0, react_1.useCallback)(function (file, documentType) { return __awaiter(_this, void 0, void 0, function () {
        var imageId, docType, initialImage, session_1, chunkPromises, error_1, processingError, hasActiveUploads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    imageId = unified_utils_1.ImageUtils.generateUniqueId();
                    docType = documentType || defaultDocumentType;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    initialImage = __assign({ id: imageId, file: file, preview: URL.createObjectURL(file), status: 'pending', progress: 0, uploadSpeed: 0, chunks: [], retryCount: 0, tags: [], aiTags: [], metadata: {
                            fileSize: file.size,
                            technicalMetadata: {
                                format: file.type.split('/')[1] || 'unknown',
                                colorSpace: 'sRGB',
                                bitDepth: 24,
                                compression: 'JPEG',
                                orientation: 1,
                            },
                            createdAt: Date.now(),
                            lastModified: file.lastModified,
                        }, approvalStatus: 'pending', version: 1, storageClass: 'hot', complianceFlags: [], auditTrail: [], assignedTo: [], collections: [], usageStats: {
                            views: 0,
                            downloads: 0,
                            shares: 0,
                        }, startTime: Date.now(), documentType: docType }, (landVerificationId && { landVerificationId: landVerificationId }));
                    addImage(initialImage);
                    setIsUploading(true);
                    return [4 /*yield*/, uploadCoordinator.initiateUpload(file, docType, landVerificationId)];
                case 2:
                    session_1 = _a.sent();
                    activeSessionsRef.current.set(session_1.id, session_1);
                    imageSessionMapRef.current.set(imageId, session_1.id);
                    // Set up progress tracking
                    uploadCoordinator.onProgressUpdate(session_1.id, function (progress) {
                        updateImageStatus(imageId, {
                            progress: progress.progress,
                            uploadSpeed: progress.uploadSpeed,
                            status: progress.status === 'completed' ? 'uploaded' : 'uploading',
                        });
                        onProgressUpdate === null || onProgressUpdate === void 0 ? void 0 : onProgressUpdate(session_1.id, progress);
                        // Start workflow processing when upload is complete
                        if (progress.status === 'completed') {
                            activeSessionsRef.current.delete(session_1.id);
                            updateImageStatus(imageId, { status: 'processing' });
                            // Use orchestrator's workflow service
                            workflowManager.startProcessingWorkflow(imageId, "storage://".concat(imageId), docType, landVerificationId)
                                .then(function () {
                                updateImageStatus(imageId, { status: 'uploaded' });
                                onUploadComplete === null || onUploadComplete === void 0 ? void 0 : onUploadComplete(imageId, docType);
                                return imageId;
                            })
                                .catch(function (error) {
                                updateImageStatus(imageId, { status: 'error' });
                                onUploadError === null || onUploadError === void 0 ? void 0 : onUploadError(error);
                            });
                        }
                    });
                    chunkPromises = session_1.chunks.map(function (chunk) {
                        return uploadCoordinator.uploadChunk(session_1.id, chunk);
                    });
                    return [4 /*yield*/, Promise.all(chunkPromises)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, imageId];
                case 4:
                    error_1 = _a.sent();
                    updateImageStatus(imageId, { status: 'error' });
                    processingError = error_1 instanceof images_1.ImageProcessingError
                        ? error_1
                        : new images_1.ImageProcessingError(error_1 instanceof Error ? error_1.message : 'Upload failed', 'UPLOAD_FAILED', imageId);
                    onUploadError === null || onUploadError === void 0 ? void 0 : onUploadError(processingError);
                    throw processingError;
                case 5:
                    hasActiveUploads = Array.from(activeSessionsRef.current.values())
                        .some(function (session) { return session.status === 'uploading' || session.status === 'pending'; });
                    if (!hasActiveUploads) {
                        setIsUploading(false);
                    }
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [
        uploadCoordinator,
        workflowManager,
        addImage,
        updateImageStatus,
        onUploadComplete,
        onUploadError,
        onProgressUpdate,
        onWorkflowUpdate,
        defaultDocumentType,
        landVerificationId,
        mapWorkflowStatusToImageStatus
    ]);
    // Upload multiple files with concurrency control and document type support
    var uploadFiles = (0, react_1.useCallback)(function (files, documentType) { return __awaiter(_this, void 0, void 0, function () {
        var imageIds, docType, i, batch, batchPromises, batchResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    imageIds = [];
                    docType = documentType || defaultDocumentType;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < files.length)) return [3 /*break*/, 4];
                    batch = files.slice(i, i + maxConcurrentUploads);
                    batchPromises = batch.map(function (file) { return uploadFile(file, docType); });
                    return [4 /*yield*/, Promise.allSettled(batchPromises)];
                case 2:
                    batchResults = _a.sent();
                    batchResults.forEach(function (result) {
                        if (result.status === 'fulfilled') {
                            imageIds.push(result.value);
                        }
                    });
                    _a.label = 3;
                case 3:
                    i += maxConcurrentUploads;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, imageIds];
            }
        });
    }); }, [uploadFile, maxConcurrentUploads, defaultDocumentType]);
    // Pause upload using orchestrator
    var pauseUpload = (0, react_1.useCallback)(function (sessionId) {
        orchestrator.getUploadService().pauseUpload(sessionId);
    }, [orchestrator]);
    // Resume upload using orchestrator
    var resumeUpload = (0, react_1.useCallback)(function (sessionId) {
        orchestrator.getUploadService().resumeUpload(sessionId);
    }, [orchestrator]);
    // Cancel upload using orchestrator
    var cancelUpload = (0, react_1.useCallback)(function (sessionId) {
        var _a;
        var session = activeSessionsRef.current.get(sessionId);
        if (session) {
            // Find and remove the associated image
            var imageId = (_a = Array.from(imageSessionMapRef.current.entries())
                .find(function (_a) {
                var sId = _a[1];
                return sId === sessionId;
            })) === null || _a === void 0 ? void 0 : _a[0];
            if (imageId) {
                // Cancel workflow if active
                orchestrator.getWorkflowService().cancelWorkflow(imageId);
                removeImage(imageId);
            }
        }
        orchestrator.getUploadService().cancelUpload(sessionId);
        activeSessionsRef.current.delete(sessionId);
    }, [orchestrator, removeImage]);
    // Retry failed upload using orchestrator
    var retryUpload = (0, react_1.useCallback)(function (imageId) { return __awaiter(_this, void 0, void 0, function () {
        var image;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    image = images.find(function (img) { return img.id === imageId; });
                    if (!image) {
                        throw new images_1.ImageProcessingError('Image not found', 'IMAGE_NOT_FOUND', imageId);
                    }
                    // Reset image status
                    updateImageStatus(imageId, {
                        status: 'pending',
                        progress: 0,
                        retryCount: (image.retryCount || 0) + 1,
                    });
                    // Start upload again
                    return [4 /*yield*/, uploadFile(image.file, image.documentType)];
                case 1:
                    // Start upload again
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [images, updateImageStatus, uploadFile]);
    // Get upload progress using orchestrator
    var getUploadProgress = (0, react_1.useCallback)(function (sessionId) {
        return orchestrator.getUploadProgress(sessionId);
    }, [orchestrator]);
    // Calculate upload statistics
    var uploadStats = {
        totalFiles: images.length,
        completedFiles: images.filter(function (img) { return img.status === 'uploaded'; }).length,
        failedFiles: images.filter(function (img) { return img.status === 'error'; }).length,
        activeUploads: activeSessionsRef.current.size,
        processingFiles: images.filter(function (img) { return img.status === 'processing'; }).length,
    };
    // Calculate workflow statistics
    var workflowStats = {
        totalWorkflows: workflowStatusRef.current.size,
        completedWorkflows: Array.from(workflowStatusRef.current.values())
            .filter(function (status) { return status.status === 'completed'; }).length,
        failedWorkflows: Array.from(workflowStatusRef.current.values())
            .filter(function (status) { return status.status === 'failed'; }).length,
        activeWorkflows: Array.from(workflowStatusRef.current.values())
            .filter(function (status) { return status.status === 'running'; }).length,
    };
    // Cleanup on unmount using orchestrator
    (0, react_1.useEffect)(function () {
        // Copy refs to variables inside the effect to avoid stale closure issues
        var activeSessions = activeSessionsRef.current;
        var workflowStatuses = workflowStatusRef.current;
        return function () {
            // Cancel all active uploads using orchestrator
            activeSessions.forEach(function (session) {
                orchestrator.getUploadService().cancelUpload(session.id);
            });
            // Cancel all active workflows using orchestrator
            workflowStatuses.forEach(function (_, imageId) {
                orchestrator.getWorkflowService().cancelWorkflow(imageId);
            });
            // Revoke object URLs to prevent memory leaks
            images.forEach(function (image) {
                if (image.preview && image.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(image.preview);
                }
            });
        };
    }, [orchestrator, images]);
    return {
        images: images,
        uploadFile: uploadFile,
        uploadFiles: uploadFiles,
        pauseUpload: pauseUpload,
        resumeUpload: resumeUpload,
        cancelUpload: cancelUpload,
        retryUpload: retryUpload,
        getUploadProgress: getUploadProgress,
        isUploading: isUploading,
        uploadStats: uploadStats,
        workflowStats: workflowStats,
    };
}
