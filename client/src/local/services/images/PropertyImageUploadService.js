"use strict";
/**
 * Property Image Upload Service - Refactored
 *
 * Focused service that handles only upload operations.
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
exports.propertyImageUploadService = exports.PropertyImageUploadService = void 0;
var ImageServiceCore_1 = require("./core/ImageServiceCore");
var unified_utils_1 = require("../../utils/images/unified-utils");
var PropertyImageUploadService = /** @class */ (function (_super) {
    __extends(PropertyImageUploadService, _super);
    function PropertyImageUploadService(dependencies, config) {
        if (dependencies === void 0) { dependencies = {}; }
        var _this = _super.call(this, config, ImageServiceCore_1.ImageServiceRegistry.getInstance().getAuditService()) || this;
        _this.dependencies = dependencies;
        _this.serviceName = 'PropertyImageUploadService';
        _this.version = '2.0.0';
        _this.activeSessions = new Map();
        _this.progressCallbacks = new Map();
        _this.pausedSessions = new Set();
        return _this;
    }
    PropertyImageUploadService.prototype.initiateUpload = function (file, documentType, landVerificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, chunks, sessionMetadata, finalSessionId_1, backendResponse, session, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sessionId = unified_utils_1.ImageUtils.generateUniqueId();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.createFileChunks(file, sessionId)];
                    case 2:
                        chunks = _a.sent();
                        sessionMetadata = __assign(__assign({ sessionId: sessionId, fileName: file.name, fileSize: file.size, fileType: file.type, chunkCount: chunks.length, timestamp: new Date().toISOString() }, (documentType && { documentType: documentType })), (landVerificationId && { landVerificationId: landVerificationId }));
                        finalSessionId_1 = sessionId;
                        if (!this.dependencies.apiClient) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.dependencies.apiClient.createUploadSession(sessionMetadata)];
                    case 3:
                        backendResponse = _a.sent();
                        if (backendResponse.sessionId && backendResponse.sessionId !== sessionId) {
                            finalSessionId_1 = backendResponse.sessionId;
                            chunks.forEach(function (chunk) {
                                chunk.id = chunk.id.replace(sessionId, finalSessionId_1);
                            });
                        }
                        _a.label = 4;
                    case 4:
                        session = {
                            id: finalSessionId_1,
                            imageId: unified_utils_1.ImageUtils.generateUniqueId(),
                            chunks: chunks,
                            status: 'pending',
                            progress: 0,
                            uploadSpeed: 0,
                            startTime: Date.now(),
                        };
                        this.activeSessions.set(finalSessionId_1, session);
                        // Use shared audit logging
                        return [4 /*yield*/, this.logEvent('upload_initiated', {
                                sessionId: finalSessionId_1,
                                fileName: file.name,
                                fileSize: file.size,
                                documentType: documentType,
                                landVerificationId: landVerificationId,
                            })];
                    case 5:
                        // Use shared audit logging
                        _a.sent();
                        return [2 /*return*/, session];
                    case 6:
                        error_1 = _a.sent();
                        throw this.createError("Failed to initiate upload: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'), 'UPLOAD_INITIATION_FAILED', undefined, undefined, true);
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageUploadService.prototype.uploadChunk = function (sessionId, chunk) {
        return __awaiter(this, void 0, void 0, function () {
            var session, startTime, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        session = this.activeSessions.get(sessionId);
                        if (!session) {
                            throw this.createError("Upload session ".concat(sessionId, " not found"), 'SESSION_NOT_FOUND');
                        }
                        if (this.pausedSessions.has(sessionId)) {
                            return [2 /*return*/];
                        }
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        // Use shared retry logic
                        return [4 /*yield*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!this.dependencies.apiClient) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.dependencies.apiClient.uploadChunk(sessionId, chunk)];
                                        case 1:
                                            _a.sent();
                                            return [3 /*break*/, 6];
                                        case 2:
                                            if (!this.dependencies.storageService) return [3 /*break*/, 4];
                                            return [4 /*yield*/, this.dependencies.storageService.uploadChunk(sessionId, chunk)];
                                        case 3:
                                            _a.sent();
                                            return [3 /*break*/, 6];
                                        case 4: return [4 /*yield*/, this.mockChunkUpload(chunk)];
                                        case 5:
                                            _a.sent();
                                            _a.label = 6;
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            }); }, this.config.upload.maxRetries, this.config.upload.retryDelay)];
                    case 2:
                        // Use shared retry logic
                        _a.sent();
                        chunk.uploaded = true;
                        chunk.uploadTime = Date.now() - startTime;
                        this.updateSessionProgress(sessionId);
                        return [4 /*yield*/, this.logEvent('chunk_uploaded', {
                                sessionId: sessionId,
                                chunkIndex: chunk.index,
                                chunkSize: chunk.size,
                                uploadTime: chunk.uploadTime,
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_2 = _a.sent();
                        chunk.retryCount = (chunk.retryCount || 0) + 1;
                        return [4 /*yield*/, this.logEvent('chunk_upload_failed', {
                                sessionId: sessionId,
                                chunkIndex: chunk.index,
                                error: error_2 instanceof Error ? error_2.message : 'Unknown error',
                                retryCount: chunk.retryCount,
                            })];
                    case 5:
                        _a.sent();
                        throw this.createError("Chunk upload failed: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'), 'CHUNK_UPLOAD_FAILED', session.imageId, undefined, false);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    PropertyImageUploadService.prototype.pauseUpload = function (sessionId) {
        this.pausedSessions.add(sessionId);
        var session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = 'paused';
            this.notifyProgress(sessionId);
        }
    };
    PropertyImageUploadService.prototype.resumeUpload = function (sessionId) {
        this.pausedSessions.delete(sessionId);
        var session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = 'uploading';
            this.notifyProgress(sessionId);
        }
    };
    PropertyImageUploadService.prototype.cancelUpload = function (sessionId) {
        var session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = 'cancelled';
            this.activeSessions.delete(sessionId);
            this.progressCallbacks.delete(sessionId);
            this.pausedSessions.delete(sessionId);
            this.logEvent('upload_cancelled', {
                sessionId: sessionId,
                progress: session.progress,
            });
        }
    };
    PropertyImageUploadService.prototype.getUploadProgress = function (sessionId) {
        var session = this.activeSessions.get(sessionId);
        if (!session)
            return null;
        var completedChunks = session.chunks.filter(function (chunk) { return chunk.uploaded; }).length;
        var totalBytes = session.chunks.reduce(function (sum, chunk) { return sum + chunk.size; }, 0);
        var uploadedBytes = session.chunks
            .filter(function (chunk) { return chunk.uploaded; })
            .reduce(function (sum, chunk) { return sum + chunk.size; }, 0);
        return __assign({ sessionId: sessionId, imageId: session.imageId, progress: session.progress, uploadSpeed: session.uploadSpeed, status: session.status, chunksCompleted: completedChunks, totalChunks: session.chunks.length, bytesUploaded: uploadedBytes, totalBytes: totalBytes }, (session.estimatedTimeRemaining !== undefined && { estimatedTimeRemaining: session.estimatedTimeRemaining }));
    };
    PropertyImageUploadService.prototype.onProgressUpdate = function (sessionId, callback) {
        this.progressCallbacks.set(sessionId, callback);
    };
    // Private methods
    PropertyImageUploadService.prototype.updateSessionProgress = function (sessionId) {
        var _a;
        var session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        var completedChunks = session.chunks.filter(function (chunk) { return chunk.uploaded; }).length;
        var totalChunks = session.chunks.length;
        // Use shared progress calculation
        session.progress = this.calculateProgress(completedChunks, totalChunks);
        var currentTime = Date.now();
        var elapsedTime = (currentTime - session.startTime) / 1000;
        var uploadedBytes = session.chunks
            .filter(function (chunk) { return chunk.uploaded; })
            .reduce(function (sum, chunk) { return sum + chunk.size; }, 0);
        // Use shared speed calculation
        session.uploadSpeed = this.calculateSpeed(uploadedBytes, elapsedTime);
        var remainingBytes = session.chunks
            .filter(function (chunk) { return !chunk.uploaded; })
            .reduce(function (sum, chunk) { return sum + chunk.size; }, 0);
        // Use shared ETA calculation
        session.estimatedTimeRemaining = this.calculateETA(remainingBytes, session.uploadSpeed);
        if (completedChunks === totalChunks) {
            session.status = 'completed';
            session.endTime = currentTime;
            (_a = this.dependencies.apiClient) === null || _a === void 0 ? void 0 : _a.completeUpload(sessionId);
        }
        else {
            session.status = 'uploading';
        }
        this.notifyProgress(sessionId);
    };
    PropertyImageUploadService.prototype.notifyProgress = function (sessionId) {
        var callback = this.progressCallbacks.get(sessionId);
        var progress = this.getUploadProgress(sessionId);
        if (callback && progress) {
            callback(progress);
        }
    };
    PropertyImageUploadService.prototype.mockChunkUpload = function (chunk) {
        return __awaiter(this, void 0, void 0, function () {
            var delay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delay = Math.min(chunk.size / 1024, 1000);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                    case 1:
                        _a.sent();
                        if (Math.random() < 0.01) {
                            throw new Error('Simulated network error for testing');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return PropertyImageUploadService;
}(ImageServiceCore_1.ImageServiceCore));
exports.PropertyImageUploadService = PropertyImageUploadService;
// Register service in the registry
exports.propertyImageUploadService = ImageServiceCore_1.ImageServiceRegistry.getInstance().register(new PropertyImageUploadService());
exports.default = PropertyImageUploadService;
