"use strict";
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
exports.DocumentUploadInterface = DocumentUploadInterface;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var use_toast_1 = require("../../local/hooks/use-toast");
var useDocumentAuthentication_1 = require("../hooks/useDocumentAuthentication");
var DocumentVerificationResults_1 = require("./DocumentVerificationResults");
// Define constants to avoid string duplication and improve maintainability
var DEFAULT_MAX_FILE_SIZE = 10; // 10MB
var PDF_MIME_TYPE = "application/pdf";
var DEFAULT_ACCEPTED_TYPES = [
    PDF_MIME_TYPE,
    "image/jpeg",
    "image/png",
    "image/tiff",
];
var PROGRESS_UPDATE_INTERVAL = 300; // milliseconds
var PROGRESS_INCREMENT_MIN = 5; // minimum progress increment percentage
var PROGRESS_INCREMENT_MAX = 20; // maximum progress increment percentage
// Define status constants to avoid string duplication - using uppercase to match expected types
var FILE_STATUS = {
    COMPLETED: "COMPLETED",
    PROCESSING: "PROCESSING",
    PENDING: "PENDING",
};
var VERIFICATION_STATUS = {
    AUTHENTIC: "authentic",
    SUSPICIOUS: "suspicious",
    FORGED: "forged",
};
var ACCEPTED_DOCUMENT_TYPES = [
    {
        type: PDF_MIME_TYPE,
        name: "PDF Documents",
        icon: lucide_react_1.FileText,
        description: "Title deeds, agreements, certificates",
    },
    {
        type: "image/jpeg",
        name: "JPEG Images",
        icon: lucide_react_1.Image,
        description: "Scanned documents, photos",
    },
    {
        type: "image/png",
        name: "PNG Images",
        icon: lucide_react_1.Image,
        description: "High-quality scans",
    },
    {
        type: "image/tiff",
        name: "TIFF Images",
        icon: lucide_react_1.Image,
        description: "Professional scans",
    },
];
var DOCUMENT_CATEGORIES = [
    {
        id: "title_deed",
        name: "Title Deed",
        icon: "📜",
        description: "Official land ownership document",
    },
    {
        id: "sale_agreement",
        name: "Sale Agreement",
        icon: "📋",
        description: "Property purchase agreement",
    },
    {
        id: "survey_plan",
        name: "Survey Plan",
        icon: "🗺️",
        description: "Land survey and boundaries",
    },
    {
        id: "compliance_certificate",
        name: "Compliance Certificate",
        icon: "✅",
        description: "Government compliance document",
    },
    {
        id: "other",
        name: "Other Document",
        icon: "📄",
        description: "Other land-related document",
    },
];
function DocumentUploadInterface(_a) {
    var _this = this;
    var onVerificationComplete = _a.onVerificationComplete, _b = _a.maxFileSize, maxFileSize = _b === void 0 ? DEFAULT_MAX_FILE_SIZE : _b, _c = _a.acceptedTypes, acceptedTypes = _c === void 0 ? DEFAULT_ACCEPTED_TYPES : _c, _d = _a.showResults, showResults = _d === void 0 ? true : _d;
    var toast = (0, use_toast_1.useToast)().toast;
    var _e = (0, react_1.useState)(false), dragActive = _e[0], setDragActive = _e[1];
    var _f = (0, react_1.useState)([]), uploadedFiles = _f[0], setUploadedFiles = _f[1];
    var _g = (0, react_1.useState)(new Map()), uploadProgress = _g[0], setUploadProgress = _g[1];
    var _h = (0, react_1.useState)(new Map()), verificationResults = _h[0], setVerificationResults = _h[1];
    var _j = (0, react_1.useState)(""), selectedCategory = _j[0], setSelectedCategory = _j[1];
    var _k = (0, useDocumentAuthentication_1.useDocumentAuthentication)(), verifyDocument = _k.verifyDocument, formatFileSize = _k.formatFileSize;
    // Create a stable file ID generator using useMemo to ensure consistent tracking
    // This approach is more secure and prevents potential object injection vulnerabilities
    var generateFileId = (0, react_1.useCallback)(function (file, timestamp) {
        var time = timestamp || Date.now();
        // Sanitize filename to prevent potential security issues by using a whitelist approach
        var sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        return "".concat(sanitizedName, "_").concat(time, "_").concat(file.size);
    }, []);
    // Secure random number generation helper
    var getSecureRandomValue = (0, react_1.useCallback)(function () {
        var _a;
        if ((_a = window === null || window === void 0 ? void 0 : window.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues) {
            var array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            var randomValue = array[0];
            if (randomValue !== undefined) {
                return randomValue / (0xffffffff + 1);
            }
        }
        // Fallback to Math.random - this is acceptable for progress simulation in UI
        // This is safe for non-cryptographic purposes like progress bar animation
        return Math.random();
    }, []);
    // Safe object access helpers to prevent object injection vulnerabilities
    var getProgressSafely = (0, react_1.useCallback)(function (fileId) {
        var _a;
        return (_a = uploadProgress.get(fileId)) !== null && _a !== void 0 ? _a : 0;
    }, [uploadProgress]);
    var getVerificationResultSafely = (0, react_1.useCallback)(function (fileId) {
        return verificationResults.get(fileId);
    }, [verificationResults]);
    var handleDrag = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        }
        else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);
    // Enhanced verification with better progress tracking and error handling
    var handleVerifyDocument = (0, react_1.useCallback)(function (file) { return __awaiter(_this, void 0, void 0, function () {
        var timestamp, fileId, progressInterval_1, result_1, isSuccessful, error_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    timestamp = Date.now();
                    fileId = generateFileId(file, timestamp);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Initialize progress tracking using Map for better security and performance
                    setUploadProgress(function (prev) { return new Map(prev).set(fileId, 0); });
                    progressInterval_1 = setInterval(function () {
                        setUploadProgress(function (prev) {
                            var _a;
                            var currentProgress = (_a = prev.get(fileId)) !== null && _a !== void 0 ? _a : 0;
                            if (currentProgress >= 90) {
                                clearInterval(progressInterval_1);
                                return prev;
                            }
                            var randomValue = getSecureRandomValue();
                            var increment = randomValue * (PROGRESS_INCREMENT_MAX - PROGRESS_INCREMENT_MIN) +
                                PROGRESS_INCREMENT_MIN;
                            return new Map(prev).set(fileId, Math.min(currentProgress + increment, 90));
                        });
                    }, PROGRESS_UPDATE_INTERVAL);
                    return [4 /*yield*/, verifyDocument(file)];
                case 2:
                    result_1 = _a.sent();
                    // Clear the interval and complete progress
                    clearInterval(progressInterval_1);
                    setUploadProgress(function (prev) { return new Map(prev).set(fileId, 100); });
                    setVerificationResults(function (prev) { return new Map(prev).set(fileId, result_1.id); });
                    // Notify parent component if callback provided
                    if (onVerificationComplete) {
                        onVerificationComplete(result_1);
                    }
                    isSuccessful = result_1.status === VERIFICATION_STATUS.AUTHENTIC;
                    toast({
                        title: "Verification Complete",
                        description: "".concat(file.name, " has been analyzed. Status: ").concat(result_1.status.charAt(0).toUpperCase() + result_1.status.slice(1)),
                        variant: isSuccessful ? "default" : "destructive",
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    // Clean up progress on error using Map operations for better security
                    setUploadProgress(function (prev) {
                        var newMap = new Map(prev);
                        newMap.delete(fileId);
                        return newMap;
                    });
                    errorMessage = error_1 instanceof Error ? error_1.message : "Failed to verify document";
                    toast({
                        title: "Verification Failed",
                        description: "Could not verify ".concat(file.name, ": ").concat(errorMessage),
                        variant: "destructive",
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [
        verifyDocument,
        onVerificationComplete,
        toast,
        generateFileId,
        getSecureRandomValue,
    ]);
    // Improved file handling with better validation and error handling
    var handleFiles = (0, react_1.useCallback)(function (files) {
        var validFiles = files.filter(function (file) {
            // Check file type with more specific validation
            if (!acceptedTypes.includes(file.type)) {
                toast({
                    title: "Invalid File Type",
                    description: "".concat(file.name, " is not a supported file type. Please upload ").concat(acceptedTypes.join(", "), "."),
                    variant: "destructive",
                });
                return false;
            }
            // Check file size with proper byte calculation
            var maxSizeInBytes = maxFileSize * 1024 * 1024;
            if (file.size > maxSizeInBytes) {
                toast({
                    title: "File Too Large",
                    description: "".concat(file.name, " (").concat(formatFileSize(file.size), ") exceeds the ").concat(maxFileSize, "MB limit."),
                    variant: "destructive",
                });
                return false;
            }
            // Additional validation: check for empty files
            if (file.size === 0) {
                toast({
                    title: "Empty File",
                    description: "".concat(file.name, " appears to be empty and cannot be processed."),
                    variant: "destructive",
                });
                return false;
            }
            return true;
        });
        if (validFiles.length > 0) {
            setUploadedFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), validFiles, true); });
            // Start verification for each valid file
            validFiles.forEach(function (file) {
                handleVerifyDocument(file);
            });
        }
    }, [acceptedTypes, maxFileSize, formatFileSize, toast, handleVerifyDocument]);
    var handleDrop = (0, react_1.useCallback)(function (e) {
        var _a;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (((_a = e.dataTransfer.files) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, [handleFiles]);
    var handleFileInput = (0, react_1.useCallback)(function (e) {
        var _a;
        if ((_a = e.target.files) === null || _a === void 0 ? void 0 : _a.length) {
            handleFiles(Array.from(e.target.files));
        }
    }, [handleFiles]);
    // Improved file removal with proper cleanup using Map operations
    var removeFile = (0, react_1.useCallback)(function (index) {
        // Safely access array element to prevent potential security issues
        if (index < 0 || index >= uploadedFiles.length)
            return;
        var fileToRemove = uploadedFiles[index];
        if (!fileToRemove)
            return;
        var fileId = generateFileId(fileToRemove);
        setUploadedFiles(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
        // Clean up associated state using Map operations for better security
        setUploadProgress(function (prev) {
            var newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
        });
        setVerificationResults(function (prev) {
            var newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
        });
    }, [uploadedFiles, generateFileId]);
    // Utility functions for file status and icons with safer parameter handling
    var getFileIcon = (0, react_1.useCallback)(function (file) {
        if (file.type.startsWith("image/"))
            return lucide_react_1.Image;
        if (file.type === PDF_MIME_TYPE)
            return lucide_react_1.FileText;
        return lucide_react_1.File;
    }, []);
    var getFileStatus = (0, react_1.useCallback)(function (file) {
        var fileId = generateFileId(file);
        var progress = getProgressSafely(fileId);
        var resultId = getVerificationResultSafely(fileId);
        if (resultId)
            return FILE_STATUS.COMPLETED;
        if (progress > 0)
            return FILE_STATUS.PROCESSING;
        return FILE_STATUS.PENDING;
    }, [generateFileId, getProgressSafely, getVerificationResultSafely]);
    // Memoize verification results array for better performance
    var verificationResultsArray = (0, react_1.useMemo)(function () {
        return Array.from(verificationResults.values());
    }, [verificationResults]);
    return (<div className="space-y-6">
      {/* Document Category Selection */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center space-x-2">
            <lucide_react_1.Shield className="h-5 w-5"/>
            <span>Document Category</span>
          </card_1.CardTitle>
          <card_1.CardDescription>
            Select the type of document you&apos;re uploading for optimized
            verification
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DOCUMENT_CATEGORIES.map(function (category) { return (<card_1.Card key={category.id} className={"cursor-pointer transition-all duration-200 hover:shadow-md ".concat(selectedCategory === category.id ?
                "ring-2 ring-blue-500 bg-blue-50"
                : "")} onClick={function () { return setSelectedCategory(category.id); }}>
                <card_1.CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-semibold text-sm mb-1">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {category.description}
                  </p>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Upload Area */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center space-x-2">
            <lucide_react_1.Upload className="h-5 w-5"/>
            <span>Upload Documents</span>
          </card_1.CardTitle>
          <card_1.CardDescription>
            Drag and drop your documents or click to browse. Maximum file size:{" "}
            {maxFileSize}MB
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className={"relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ".concat(dragActive ?
            "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400")} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <input type="file" multiple accept={acceptedTypes.join(",")} onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Upload documents" title="Click to select files or drag and drop"/>

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <lucide_react_1.Upload className="h-8 w-8 text-blue-600"/>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your documents here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse your files
                </p>

                <div className="flex justify-center space-x-4">
                  <button_1.Button variant="outline" size="sm" type="button">
                    <lucide_react_1.Camera className="h-4 w-4 mr-2"/>
                    Take Photo
                  </button_1.Button>
                  <button_1.Button variant="outline" size="sm" type="button">
                    <lucide_react_1.Scan className="h-4 w-4 mr-2"/>
                    Scan Document
                  </button_1.Button>
                </div>
              </div>
            </div>
          </div>

          {/* Accepted File Types */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Accepted File Types:
            </h4>
            <div className="flex flex-wrap gap-2">
              {ACCEPTED_DOCUMENT_TYPES.map(function (docType) {
            var Icon = docType.icon;
            return (<div key={docType.type} className="flex items-center space-x-2 text-xs text-gray-600">
                    <Icon className="h-3 w-3"/>
                    <span>{docType.name}</span>
                  </div>);
        })}
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Uploaded Documents</card_1.CardTitle>
            <card_1.CardDescription>
              Track the verification progress of your uploaded documents
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              <framer_motion_1.AnimatePresence>
                {uploadedFiles.map(function (file, index) {
                var FileIcon = getFileIcon(file);
                var status = getFileStatus(file);
                var fileId = generateFileId(file);
                var progress = getProgressSafely(fileId);
                var resultId = getVerificationResultSafely(fileId);
                return (<framer_motion_1.motion.div key={"".concat(fileId, "-").concat(index)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                      <card_1.Card className="border-l-4 border-l-blue-500">
                        <card_1.CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileIcon className="h-5 w-5 text-blue-600"/>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {file.name}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span>{file.type}</span>
                                  <span>
                                    {new Date(file.lastModified).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {status === FILE_STATUS.COMPLETED && (<badge_1.Badge variant="default" className="flex items-center space-x-1">
                                  <lucide_react_1.CheckCircle className="h-3 w-3"/>
                                  <span>Verified</span>
                                </badge_1.Badge>)}

                              {status === FILE_STATUS.PROCESSING && (<badge_1.Badge variant="secondary" className="flex items-center space-x-1">
                                  <lucide_react_1.Clock className="h-3 w-3 animate-spin"/>
                                  <span>Processing</span>
                                </badge_1.Badge>)}

                              {status === FILE_STATUS.PENDING && (<badge_1.Badge variant="outline">Pending</badge_1.Badge>)}

                              <button_1.Button variant="ghost" size="sm" onClick={function () { return removeFile(index); }} className="h-6 w-6 p-0" aria-label={"Remove ".concat(file.name)} type="button">
                                <lucide_react_1.X className="h-4 w-4"/>
                              </button_1.Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {status === FILE_STATUS.PROCESSING && (<div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Analyzing document...</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <progress_1.Progress value={progress} className="h-2"/>
                            </div>)}

                          {/* Verification Results Preview */}
                          {status === FILE_STATUS.COMPLETED && resultId && (<div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Verification completed
                                </span>
                                <button_1.Button variant="outline" size="sm" type="button" onClick={function () {
                            // Scroll to results section
                            var resultsElement = document.getElementById("results-".concat(resultId));
                            if (resultsElement) {
                                resultsElement.scrollIntoView({
                                    behavior: "smooth",
                                });
                            }
                        }}>
                                  <lucide_react_1.Eye className="h-4 w-4 mr-1"/>
                                  View Results
                                </button_1.Button>
                              </div>
                            </div>)}
                        </card_1.CardContent>
                      </card_1.Card>
                    </framer_motion_1.motion.div>);
            })}
              </framer_motion_1.AnimatePresence>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Security Notice */}
      <alert_1.Alert>
        <lucide_react_1.Shield className="h-4 w-4"/>
        <alert_1.AlertTitle>Security & Privacy</alert_1.AlertTitle>
        <alert_1.AlertDescription>
          Your documents are processed securely and are automatically deleted
          after verification. We use advanced encryption and do not store your
          sensitive documents permanently.
        </alert_1.AlertDescription>
      </alert_1.Alert>

      {/* Verification Results */}
      {showResults &&
            verificationResultsArray.map(function (resultId) { return (<div key={resultId} id={"results-".concat(resultId)}>
            <DocumentVerificationResults_1.DocumentVerificationResults documentId={resultId} onRecommendationAction={function (action, recommendation) {
                    toast({
                        title: "Action Taken",
                        description: "".concat(action, " for recommendation: ").concat(recommendation),
                    });
                }}/>
          </div>); })}
    </div>);
}
exports.default = DocumentUploadInterface;
