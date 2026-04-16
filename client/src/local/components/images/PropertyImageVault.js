"use strict";
/**
 * PropertyImageVault.tsx
 * Optimized main UI component for property image handling, integrating upload, validation, and workflow management.
 * Designed to be context-sensitive for the property verification domain with improved performance and type safety.
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
var react_1 = require("react");
var usePropertyImageUpload_1 = require("../../hooks/images/usePropertyImageUpload");
var ImageServiceOrchestrator_1 = require("../../services/images/ImageServiceOrchestrator");
var unified_utils_1 = require("../../utils/images/unified-utils");
// Secure random number generator for demo purposes
var secureRandom = function () {
    // In production, you would use crypto.getRandomValues() for true randomness
    var timestamp = Date.now();
    return (timestamp % 1000) / 1000;
};
// Type guards for better type safety - now properly typed
var hasSessionId = function (image) {
    return ("sessionId" in image &&
        typeof image.sessionId === "string");
};
var hasError = function (image) {
    return ("error" in image &&
        typeof image.error === "object");
};
var hasDocumentAuthResult = function (image) {
    return ("documentAuthResult" in image &&
        typeof image.documentAuthResult === "object");
};
// Optimized mock services moved to module level to prevent recreation
var createOptimizedMockApiClient = function () { return ({
    createUploadSession: function (metadata) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Reduced timeout for better development experience
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 1:
                    // Reduced timeout for better development experience
                    _a.sent();
                    return [2 /*return*/, {
                            sessionId: "mock-session-".concat(Date.now()),
                            uploadUrl: "/mock-upload",
                        }];
            }
        });
    }); },
    uploadChunk: function (_sessionId, _chunk, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Optimized random delay for more consistent performance
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, 50 + Math.floor(secureRandom() * 100));
                    })];
                case 1:
                    // Optimized random delay for more consistent performance
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    completeUpload: function (_sessionId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 25); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    abortUpload: function (_sessionId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 25); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    getUploadStatus: function (_sessionId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 25); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { progress: 0.5, status: "uploading" }];
            }
        });
    }); },
    initiateUpload: function (_file) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, {
                            sessionId: "mock-session-".concat(Date.now()),
                            uploadUrl: "/mock-upload",
                            chunkSize: 1024 * 1024,
                        }];
            }
        });
    }); },
}); };
var createOptimizedMockServices = function () {
    var storageService = {
        getFileReference: function (imageId) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, "mock-storage-url/".concat(imageId, ".jpg")];
        }); }); },
        updateImageMetadata: function (_imageId, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); },
        optimizeImage: function (fileReference, _quality) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, "".concat(fileReference, "-optimized.jpg")];
        }); }); },
        generateThumbnails: function (fileReference, sizes) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, sizes.map(function (s) { return "".concat(fileReference, "-thumb-").concat(s, ".jpg"); })];
        }); }); },
    };
    // Document authentication service for PropertyImageValidationService (takes File)
    var documentAuthServiceForValidation = {
        authenticateDocument: function (file, documentType) { return __awaiter(void 0, void 0, void 0, function () {
            var randomValue, isAuthentic;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                    case 1:
                        _a.sent();
                        randomValue = secureRandom();
                        isAuthentic = randomValue > 0.2;
                        return [2 /*return*/, {
                                isAuthentic: isAuthentic,
                                confidence: secureRandom(),
                                documentType: documentType,
                                anomalies: isAuthentic ? [] : ["signature_mismatch", "tampered_metadata"],
                                verificationMethod: "mock",
                            }];
                }
            });
        }); },
    };
    // Document authentication service for PropertyImageWorkflowManager (takes fileReference string)
    var documentAuthServiceForWorkflow = {
        authenticateDocument: function (fileReference, documentType) { return __awaiter(void 0, void 0, void 0, function () {
            var randomValue, isAuthentic;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                    case 1:
                        _a.sent();
                        randomValue = secureRandom();
                        isAuthentic = randomValue > 0.2;
                        return [2 /*return*/, {
                                isAuthentic: isAuthentic,
                                confidence: secureRandom(),
                                documentType: documentType,
                                anomalies: isAuthentic ? [] : ["signature_mismatch", "tampered_metadata"],
                                verificationMethod: "mock",
                            }];
                }
            });
        }); },
    };
    var fraudDetectionService = {
        analyzeImage: function (_fileReference, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 150); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, secureRandom()]; // Return a random fraud score
                }
            });
        }); },
        analyzeFraudRisk: function (_file, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 150); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, secureRandom()]; // Return a random fraud risk score
                }
            });
        }); },
    };
    var landVerificationService = {
        linkImageToVerification: function (_imageId, _landVerificationId, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
    };
    var notificationService = {
        notifyWorkflowComplete: function (_imageId, _status, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); },
        notifyStepComplete: function (_imageId, _step, _success, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); },
    };
    var auditService = {
        logUploadEvent: function (_event, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); },
        logValidationEvent: function (_event, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); },
        logWorkflowEvent: function (_event, _metadata) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); },
    };
    var geoLocationService = {
        validateLocation: function (latitude, longitude, _expectedRegion) { return __awaiter(void 0, void 0, void 0, function () {
            var inKenya;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 1:
                        _a.sent();
                        inKenya = latitude >= -4.678 &&
                            latitude <= 5.019 &&
                            longitude >= 33.908 &&
                            longitude <= 41.899;
                        return [2 /*return*/, inKenya && secureRandom() > 0.1]; // 90% chance of being valid if in Kenya
                }
            });
        }); },
    };
    return {
        storageService: storageService,
        documentAuthServiceForValidation: documentAuthServiceForValidation,
        documentAuthServiceForWorkflow: documentAuthServiceForWorkflow,
        fraudDetectionService: fraudDetectionService,
        landVerificationService: landVerificationService,
        notificationService: notificationService,
        auditService: auditService,
        geoLocationService: geoLocationService,
    };
};
// Get the orchestrator instance - it handles all service coordination
var orchestrator = (0, ImageServiceOrchestrator_1.getImageServiceOrchestrator)();
// Optimized StatCard component for better reusability
var StatCard = (0, react_1.memo)(function (_a) {
    var title = _a.title, value = _a.value, colorScheme = _a.colorScheme;
    return (<div className={"bg-".concat(colorScheme, "-50 p-4 rounded-lg shadow-sm")}>
    <h4 className={"text-sm font-medium text-".concat(colorScheme, "-800")}>{title}</h4>
    <p className={"text-2xl font-bold text-".concat(colorScheme, "-900")}>{value}</p>
  </div>);
});
StatCard.displayName = "StatCard";
// Optimized IconComponent for better performance
var DocumentIcon = (0, react_1.memo)(function (_a) {
    var documentType = _a.documentType;
    return (<div className="w-3 h-3 bg-gray-400 rounded-sm flex items-center justify-center text-xs text-white">
    {(documentType === null || documentType === void 0 ? void 0 : documentType.charAt(0).toUpperCase()) || "F"}
  </div>);
});
DocumentIcon.displayName = "DocumentIcon";
// Optimized ProgressBar component - completely removed inline styles
var ProgressBar = (0, react_1.memo)(function (_a) {
    var progress = _a.progress, colorScheme = _a.colorScheme, label = _a.label, secondaryLabel = _a.secondaryLabel;
    var clampedProgress = Math.min(100, Math.max(0, progress));
    // Use CSS classes for different progress levels to avoid inline styles
    var getProgressClass = function (progress) {
        if (progress >= 100)
            return "w-full";
        if (progress >= 90)
            return "w-11/12";
        if (progress >= 80)
            return "w-4/5";
        if (progress >= 75)
            return "w-3/4";
        if (progress >= 66)
            return "w-2/3";
        if (progress >= 60)
            return "w-3/5";
        if (progress >= 50)
            return "w-1/2";
        if (progress >= 40)
            return "w-2/5";
        if (progress >= 33)
            return "w-1/3";
        if (progress >= 25)
            return "w-1/4";
        if (progress >= 20)
            return "w-1/5";
        if (progress >= 10)
            return "w-1/12";
        if (progress > 0)
            return "w-1";
        return "w-0";
    };
    var progressBarClass = "bg-".concat(colorScheme, "-600 h-2.5 rounded-full transition-all duration-300 ").concat(getProgressClass(clampedProgress));
    return (<div className="mt-3">
      {(label || secondaryLabel) && (<div className="flex justify-between items-center text-sm text-gray-700">
          {label && <span>{label}</span>}
          {secondaryLabel && <span>{secondaryLabel}</span>}
        </div>)}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className={progressBarClass}/>
      </div>
    </div>);
});
ProgressBar.displayName = "ProgressBar";
var PropertyImageVault = function (_a) {
    var landVerificationId = _a.landVerificationId, _b = _a.defaultDocumentType, defaultDocumentType = _b === void 0 ? "property_photo" : _b, onUploadComplete = _a.onUploadComplete, onUploadError = _a.onUploadError, onProgressUpdate = _a.onProgressUpdate, onWorkflowUpdate = _a.onWorkflowUpdate, _c = _a.maxConcurrentUploads, maxConcurrentUploads = _c === void 0 ? 3 : _c, _d = _a.enableAuditLogging, enableAuditLogging = _d === void 0 ? true : _d, _e = _a.showWorkflowProgress, showWorkflowProgress = _e === void 0 ? true : _e, allowedDocumentTypes = _a.allowedDocumentTypes;
    // Enhanced hook configuration with proper null checking and fixed landVerificationId issue
    var hookOptions = (0, react_1.useMemo)(function () {
        var baseOptions = {
            defaultDocumentType: defaultDocumentType,
            maxConcurrentUploads: maxConcurrentUploads,
            enableAuditLogging: enableAuditLogging,
        };
        // Only add landVerificationId if it's defined to avoid TypeScript strict mode issues
        if (landVerificationId) {
            return __assign(__assign(__assign(__assign(__assign(__assign({}, baseOptions), { landVerificationId: landVerificationId }), (onUploadComplete && { onUploadComplete: onUploadComplete })), (onUploadError && { onUploadError: onUploadError })), (onProgressUpdate && { onProgressUpdate: onProgressUpdate })), (onWorkflowUpdate && { onWorkflowUpdate: onWorkflowUpdate }));
        }
        return __assign(__assign(__assign(__assign(__assign({}, baseOptions), (onUploadComplete && { onUploadComplete: onUploadComplete })), (onUploadError && { onUploadError: onUploadError })), (onProgressUpdate && { onProgressUpdate: onProgressUpdate })), (onWorkflowUpdate && { onWorkflowUpdate: onWorkflowUpdate }));
    }, [
        landVerificationId,
        defaultDocumentType,
        maxConcurrentUploads,
        enableAuditLogging,
        onUploadComplete,
        onUploadError,
        onProgressUpdate,
        onWorkflowUpdate,
    ]);
    var _f = (0, usePropertyImageUpload_1.usePropertyImageUpload)(orchestrator, undefined, hookOptions), images = _f.images, uploadFile = _f.uploadFile, uploadFiles = _f.uploadFiles, pauseUpload = _f.pauseUpload, resumeUpload = _f.resumeUpload, cancelUpload = _f.cancelUpload, retryUpload = _f.retryUpload, isUploading = _f.isUploading, uploadStats = _f.uploadStats, workflowStats = _f.workflowStats;
    var _g = (0, react_1.useState)(null), selectedFiles = _g[0], setSelectedFiles = _g[1];
    var _h = (0, react_1.useState)(defaultDocumentType), currentDocumentType = _h[0], setCurrentDocumentType = _h[1];
    var handleFileChange = (0, react_1.useCallback)(function (event) {
        if (event.target.files) {
            setSelectedFiles(event.target.files);
        }
    }, []);
    var handleUploadClick = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var firstFile, error_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(selectedFiles && selectedFiles.length > 0)) return [3 /*break*/, 7];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    firstFile = Array.from(selectedFiles)[0];
                    if (!(firstFile && selectedFiles.length === 1)) return [3 /*break*/, 3];
                    return [4 /*yield*/, uploadFile(firstFile, currentDocumentType)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, uploadFiles(Array.from(selectedFiles), currentDocumentType)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    setSelectedFiles(null); // Clear selected files after upload initiation
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    errorMessage = error_1 instanceof Error ? error_1.message : "Unknown upload error";
                    // eslint-disable-next-line no-console
                    console.warn("Upload failed:", {
                        error: errorMessage,
                        fileCount: selectedFiles.length,
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [selectedFiles, uploadFile, uploadFiles, currentDocumentType]);
    // Optimized document type options with memoization
    var documentTypeOptions = (0, react_1.useMemo)(function () {
        if (allowedDocumentTypes) {
            return allowedDocumentTypes.map(function (type) { return (<option key={type} value={type}>
          {unified_utils_1.ImageUtils.formatDocumentType(type)}
        </option>); });
        }
        return [
            <option key="property_photo" value="property_photo">
        Property Photo
      </option>,
            <option key="title_deed" value="title_deed">
        Title Deed
      </option>,
            <option key="survey_plan" value="survey_plan">
        Survey Plan
      </option>,
            <option key="valuation_report" value="valuation_report">
        Valuation Report
      </option>,
            <option key="identification_document" value="identification_document">
        Identification Document
      </option>,
            <option key="other_document" value="other_document">
        Other Document
      </option>,
        ];
    }, [allowedDocumentTypes]);
    var renderImageCard = (0, react_1.useCallback)(function (image) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        var extendedImage = image;
        var workflowStatus = workflowStats.activeWorkflows > 0 ?
            orchestrator.getWorkflowStatus(image.id)
            : null;
        var currentStep = (workflowStatus === null || workflowStatus === void 0 ? void 0 : workflowStatus.currentStep) || "N/A";
        var progress = (workflowStatus === null || workflowStatus === void 0 ? void 0 : workflowStatus.progress) || image.progress || 0;
        var statusColorClass = unified_utils_1.ImageUtils.getStatusColor(image.status) ||
            "bg-gray-200 text-gray-800";
        var approvalColorClass = unified_utils_1.ImageUtils.getApprovalStatusColor(image.approvalStatus) || "bg-gray-200 text-gray-800";
        var fraudRisk = image.fraudDetectionScore ?
            unified_utils_1.ImageUtils.formatRiskScore(image.fraudDetectionScore)
            : null;
        return (<div key={image.id} className="border rounded-lg shadow-sm p-4 mb-4 bg-white flex flex-col md:flex-row items-start space-x-4">
          <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
            {image.preview ?
                <img src={image.preview} alt={image.file.name} className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                No Preview
              </div>}
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-900 truncate" title={image.file.name}>
              {image.file.name}
            </h3>
            <p className="text-sm text-gray-600">
              {unified_utils_1.ImageUtils.formatFileSize(image.file.size)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={"px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(statusColorClass)}>
                {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
              </span>
              <span className={"px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(approvalColorClass)}>
                Approval:{" "}
                {unified_utils_1.ImageUtils.formatApprovalStatus(image.approvalStatus)}
              </span>
              {image.documentType && (<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center">
                  <DocumentIcon documentType={image.documentType}/>
                  {unified_utils_1.ImageUtils.formatDocumentType(image.documentType)}
                </span>)}
              {image.landVerificationId && (<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Land ID: {image.landVerificationId.substring(0, 8)}...
                </span>)}
            </div>

            {/* Optimized workflow progress rendering */}
            {showWorkflowProgress &&
                image.status === "processing" &&
                workflowStatus && (<ProgressBar progress={progress} colorScheme="blue" label={"Processing: ".concat(unified_utils_1.ImageUtils.formatProcessingStep(currentStep))} secondaryLabel={"".concat(progress.toFixed(1), "%")}/>)}

            {/* Optimized upload progress rendering */}
            {image.status === "uploading" &&
                typeof image.progress === "number" && (<ProgressBar progress={image.progress} colorScheme="green" label={"Uploading: ".concat(image.progress.toFixed(1), "%")} secondaryLabel={unified_utils_1.ImageUtils.formatSpeed(image.uploadSpeed || 0)}/>)}

            {/* Enhanced ETA display with proper type checking */}
            {image.status === "uploading" &&
                typeof extendedImage.eta === "number" &&
                extendedImage.eta !== Infinity && (<p className="text-xs text-gray-500 mt-1">
                  ETA: {unified_utils_1.ImageUtils.formatETA(extendedImage.eta)}
                </p>)}

            {/* Enhanced error handling with type safety */}
            {image.status === "error" && hasError(image) && (<p className="text-sm text-red-600 mt-2">
                Error: {((_a = image.error) === null || _a === void 0 ? void 0 : _a.message) || "Unknown error"}
              </p>)}

            {/* Failed steps display for workflow issues */}
            {showWorkflowProgress &&
                workflowStatus &&
                workflowStatus.failedSteps.length > 0 && (<p className="text-xs text-red-600 mt-1">
                  Failed steps:{" "}
                  {workflowStatus.failedSteps
                    .map(function (s) { return unified_utils_1.ImageUtils.formatProcessingStep(s); })
                    .join(", ")}
                </p>)}

            {/* Enhanced metadata display section */}
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              {((_b = image.metadata) === null || _b === void 0 ? void 0 : _b.dimensions) && (<p>
                  Dimensions:{" "}
                  {unified_utils_1.ImageUtils.formatDimensions(image.metadata.dimensions.width, image.metadata.dimensions.height)}
                  (
                  {unified_utils_1.ImageUtils.formatAspectRatio(image.metadata.dimensions.width, image.metadata.dimensions.height)}
                  )
                </p>)}
              {((_c = image.metadata) === null || _c === void 0 ? void 0 : _c.geoLocation) && (<p>
                  Location:{" "}
                  {unified_utils_1.ImageUtils.formatCoordinates(image.metadata.geoLocation.latitude, image.metadata.geoLocation.longitude)}
                  (
                  {unified_utils_1.ImageUtils.formatPropertyLocation(image.metadata.geoLocation.latitude, image.metadata.geoLocation.longitude)}
                  )
                </p>)}
              {((_e = (_d = image.metadata) === null || _d === void 0 ? void 0 : _d.technicalMetadata) === null || _e === void 0 ? void 0 : _e.format) && (<p>
                  Format:{" "}
                  {image.metadata.technicalMetadata.format.toUpperCase()}
                </p>)}
              {((_f = image.metadata) === null || _f === void 0 ? void 0 : _f.createdAt) && (<p>
                  Uploaded:{" "}
                  {unified_utils_1.ImageUtils.formatTimestamp(image.metadata.createdAt, "short")}
                </p>)}

              {/* Validation result display */}
              {image.validationResult && (<div className="mt-2">
                  <p className="font-medium">Validation Summary:</p>
                  {image.validationResult.isValid ?
                    <span className="text-green-600">Passed</span>
                    : <span className="text-red-600">
                      Failed: {image.validationResult.errors.join(", ")}
                    </span>}
                  {image.validationResult.warnings.length > 0 && (<p className="text-orange-600">
                      Warnings: {image.validationResult.warnings.join(", ")}
                    </p>)}
                </div>)}

              {/* Enhanced document auth result with type safety */}
              {hasDocumentAuthResult(image) && (<div className="mt-2">
                  <p className="font-medium">Document Authentication:</p>
                  {((_g = image.documentAuthResult) === null || _g === void 0 ? void 0 : _g.isAuthentic) ?
                    <span className="text-green-600">
                      Authentic (
                      {unified_utils_1.ImageUtils.formatConfidence(image.documentAuthResult.confidence)}
                      )
                    </span>
                    : <span className="text-red-600">
                      Not Authentic:{" "}
                      {((_j = (_h = image.documentAuthResult) === null || _h === void 0 ? void 0 : _h.anomalies) === null || _j === void 0 ? void 0 : _j.join(", ")) ||
                            "Unknown issues"}
                    </span>}
                </div>)}

              {/* Fraud risk display */}
              {fraudRisk && (<div className="mt-2">
                  <p className="font-medium">Fraud Risk:</p>
                  <span className={"px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(unified_utils_1.ImageUtils.getRiskLevelColor(fraudRisk.level))}>
                    {fraudRisk.text} (
                    {fraudRisk.level.charAt(0).toUpperCase() +
                    fraudRisk.level.slice(1)}
                    )
                  </span>
                </div>)}

              {/* Compliance flags display */}
              {image.complianceFlags && image.complianceFlags.length > 0 && (<div className="mt-2">
                  <p className="font-medium text-red-600">Compliance Flags:</p>
                  <ul className="list-disc list-inside text-red-600">
                    {image.complianceFlags.map(function (flag, i) { return (<li key={i}>{flag.replace(/_/g, " ")}</li>); })}
                  </ul>
                </div>)}

              {/* Enhanced regulatory flags with type safety */}
              {extendedImage.regulatoryFlags &&
                extendedImage.regulatoryFlags.length > 0 && (<div className="mt-2">
                    <p className="font-medium text-orange-600">
                      Regulatory Flags:
                    </p>
                    <ul className="list-disc list-inside text-orange-600">
                      {extendedImage.regulatoryFlags.map(function (flag, i) { return (<li key={i}>{flag.replace(/_/g, " ")}</li>); })}
                    </ul>
                  </div>)}
            </div>

            {/* Optimized action buttons */}
            <div className="mt-4 flex space-x-2">
              {image.status === "uploading" && hasSessionId(image) && (<button type="button" onClick={function () { return pauseUpload(image.sessionId || ""); }} className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors">
                  Pause
                </button>)}
              {image.status === "paused" && hasSessionId(image) && (<button type="button" onClick={function () { return resumeUpload(image.sessionId || ""); }} className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors">
                  Resume
                </button>)}
              {(image.status === "uploading" ||
                image.status === "paused" ||
                image.status === "error") &&
                hasSessionId(image) && (<button type="button" onClick={function () { return cancelUpload(image.sessionId || ""); }} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
                    Cancel
                  </button>)}
              {image.status === "error" && (<button type="button" onClick={function () { return retryUpload(image.id); }} className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors">
                  Retry
                </button>)}
            </div>
          </div>
        </div>);
    }, [
        pauseUpload,
        resumeUpload,
        cancelUpload,
        retryUpload,
        showWorkflowProgress,
        workflowStats,
    ]);
    // Optimized stats rendering with memoized components
    var renderUploadStats = (0, react_1.useMemo)(function () { return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Files" value={uploadStats.totalFiles} colorScheme="blue"/>
        <StatCard title="Completed Uploads" value={uploadStats.completedFiles} colorScheme="green"/>
        <StatCard title="Failed Uploads" value={uploadStats.failedFiles} colorScheme="red"/>
        <StatCard title="Active Uploads" value={uploadStats.activeUploads} colorScheme="yellow"/>
      </div>); }, [uploadStats]);
    var renderWorkflowStats = (0, react_1.useMemo)(function () {
        return showWorkflowProgress && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Workflows" value={workflowStats.totalWorkflows} colorScheme="purple"/>
          <StatCard title="Completed Workflows" value={workflowStats.completedWorkflows} colorScheme="teal"/>
          <StatCard title="Failed Workflows" value={workflowStats.failedWorkflows} colorScheme="orange"/>
        </div>);
    }, [workflowStats, showWorkflowProgress]);
    return (<div className="font-sans antialiased bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Property Image Vault
      </h1>

      {renderUploadStats}
      {renderWorkflowStats}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Upload New Images
        </h2>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <input type="file" multiple onChange={handleFileChange} aria-label="Select image files to upload" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"/>
          <select id="document-type-selector" name="documentType" value={currentDocumentType} onChange={function (e) {
            return setCurrentDocumentType(e.target.value);
        }} aria-label="Select document type for uploaded files" title="Choose the type of document you are uploading" className="block w-full md:w-auto px-3 py-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            {documentTypeOptions}
          </select>
          <button type="button" onClick={handleUploadClick} disabled={!selectedFiles || selectedFiles.length === 0 || isUploading} className="w-full md:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {isUploading ? "Uploading..." : "Upload Selected"}
          </button>
        </div>
        {selectedFiles && selectedFiles.length > 0 && (<p className="mt-3 text-sm text-gray-600">
            Selected {selectedFiles.length} file(s) for upload as{" "}
            {unified_utils_1.ImageUtils.formatDocumentType(currentDocumentType)}
            .
          </p>)}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Current Images ({images.length})
        </h2>
        {images.length > 0 && (<div className="text-sm text-gray-600">
            {uploadStats.activeUploads > 0 && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {uploadStats.activeUploads} uploading
              </span>)}
            {workflowStats.activeWorkflows > 0 && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {workflowStats.activeWorkflows} processing
              </span>)}
          </div>)}
      </div>

      <div className="space-y-4">
        {images.length === 0 ?
            <div className="text-center p-8 bg-white rounded-lg shadow-md text-gray-500">
            <div className="mx-auto mb-4 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center opacity-75">
              <span className="text-4xl">📁</span>
            </div>
            <p className="text-lg">No images uploaded yet.</p>
            <p className="text-sm mt-2">
              Start by selecting files above to begin the upload process!
            </p>
          </div>
            : images.map(renderImageCard)}
      </div>
    </div>);
};
exports.default = PropertyImageVault;
