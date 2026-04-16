"use strict";
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
exports.default = DocumentAuth;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var progress_1 = require("../../local/components/ui/progress");
var use_toast_1 = require("../../local/hooks/use-toast");
// Constants moved to top level to prevent re-creation on each render
var FILE_CONSTRAINTS = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ],
};
var PROGRESS_CONFIG = {
    interval: 500,
    maxProgress: 90,
    incrementRange: 15,
};
// Status configuration with better type safety
var STATUS_CONFIG = {
    authentic: {
        color: "text-green-600 bg-green-50 border-green-200",
        icon: lucide_react_1.CheckCircle,
        iconColor: "text-green-600",
    },
    suspicious: {
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: lucide_react_1.AlertTriangle,
        iconColor: "text-yellow-600",
    },
    forged: {
        color: "text-red-600 bg-red-50 border-red-200",
        icon: lucide_react_1.AlertCircle,
        iconColor: "text-red-600",
    },
    processing: {
        color: "text-gray-600 bg-gray-50 border-gray-200",
        icon: lucide_react_1.Clock,
        iconColor: "text-gray-600",
    },
};
function DocumentAuth() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    // State management with better typing
    var _a = (0, react_1.useState)([]), documents = _a[0], setDocuments = _a[1];
    var _b = (0, react_1.useState)(false), isVerifying = _b[0], setIsVerifying = _b[1];
    var _c = (0, react_1.useState)(0), progress = _c[0], setProgress = _c[1];
    var _d = (0, react_1.useState)([]), results = _d[0], setResults = _d[1];
    // Ref for file input with proper typing
    var fileInputRef = (0, react_1.useRef)(null);
    // Drag state for visual feedback
    var _e = (0, react_1.useState)(false), isDragOver = _e[0], setIsDragOver = _e[1];
    // Memoized utility functions to prevent unnecessary re-renders
    var generateId = (0, react_1.useCallback)(function () {
        return "doc-".concat(Date.now(), "-").concat(performance.now().toString(36));
    }, []);
    // Enhanced file validation with better error handling
    var validateFile = (0, react_1.useCallback)(function (file) {
        if (file.size > FILE_CONSTRAINTS.maxSize) {
            toast({
                title: "File too large",
                description: "".concat(file.name, " exceeds ").concat(FILE_CONSTRAINTS.maxSize / 1024 / 1024, "MB limit"),
                variant: "destructive",
            });
            return false;
        }
        if (!FILE_CONSTRAINTS.allowedTypes.includes(file.type)) {
            toast({
                title: "Invalid file type",
                description: "".concat(file.name, " is not a supported format (").concat(FILE_CONSTRAINTS.allowedTypes.join(", "), ")"),
                variant: "destructive",
            });
            return false;
        }
        return true;
    }, [toast]);
    // Optimized document addition with better error handling
    var addDocuments = (0, react_1.useCallback)(function (fileList) {
        var validFiles = [];
        Array.from(fileList).forEach(function (file) {
            if (validateFile(file)) {
                var docFile_1 = {
                    file: file,
                    id: generateId(),
                };
                // Generate preview for images with proper error handling
                if (file.type.startsWith("image/")) {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        var target = event.target;
                        var result = target === null || target === void 0 ? void 0 : target.result;
                        if (typeof result === "string") {
                            setDocuments(function (prev) {
                                return prev.map(function (doc) {
                                    return doc.id === docFile_1.id ? __assign(__assign({}, doc), { preview: result }) : doc;
                                });
                            });
                        }
                    };
                    reader.onerror = function () {
                        // Failed to generate preview - silently handle
                    };
                    reader.readAsDataURL(file);
                }
                validFiles.push(docFile_1);
            }
        });
        if (validFiles.length > 0) {
            setDocuments(function (prev) { return __spreadArray(__spreadArray([], prev, true), validFiles, true); });
        }
    }, [validateFile, generateId]);
    // Memoized remove function to prevent unnecessary re-renders
    var removeDocument = (0, react_1.useCallback)(function (id) {
        setDocuments(function (prev) { return prev.filter(function (doc) { return doc.id !== id; }); });
        setResults(function (prev) { return prev.filter(function (result) { return result.id !== id; }); });
    }, []);
    // Enhanced drag and drop handlers with visual feedback
    var handleDrop = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        var files = event.dataTransfer.files;
        if (files && files.length > 0) {
            addDocuments(files);
        }
    }, [addDocuments]);
    var handleDragOver = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        event.stopPropagation();
    }, []);
    var handleDragEnter = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
    }, []);
    var handleDragLeave = (0, react_1.useCallback)(function (event) {
        event.preventDefault();
        event.stopPropagation();
        // Only set drag over to false if we're leaving the drop zone entirely
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragOver(false);
        }
    }, []);
    // File upload handler with input reset
    var handleFileUpload = (0, react_1.useCallback)(function (event) {
        var files = event.target.files;
        if (files && files.length > 0) {
            addDocuments(files);
        }
        // Reset input value to allow re-uploading same file
        event.target.value = "";
    }, [addDocuments]);
    // Enhanced verification mutation with better error handling
    var verifyDocumentsMutation = (0, react_query_1.useMutation)({
        mutationFn: function (documentsToVerify) { return __awaiter(_this, void 0, void 0, function () {
            var formData, response, errorData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formData = new FormData();
                        documentsToVerify.forEach(function (doc, index) {
                            formData.append("documents", doc.file);
                            formData.append("documentId_".concat(index), doc.id);
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch("/api/document-auth/verify", {
                                method: "POST",
                                body: formData,
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response
                                .json()
                                .catch(function () { return ({ message: "Network error" }); })];
                    case 3:
                        errorData = _a.sent();
                        throw new Error(errorData.message || "Server error: ".concat(response.status));
                    case 4: return [2 /*return*/, response.json()];
                    case 5:
                        error_1 = _a.sent();
                        // Log error in development mode only
                        if (import.meta.env.MODE === "development") {
                            // eslint-disable-next-line no-console
                            console.error("Document verification failed:", error_1);
                        }
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (data) {
            var _a = data.results, verificationResults = _a === void 0 ? [] : _a;
            setResults(verificationResults);
            setProgress(100);
            setIsVerifying(false);
            var authenticCount = verificationResults.filter(function (result) { return result.verified; }).length;
            var totalCount = verificationResults.length;
            toast({
                title: "Verification Complete",
                description: "".concat(authenticCount, " of ").concat(totalCount, " documents verified as authentic"),
                variant: authenticCount === totalCount ? "default" : "destructive",
            });
        },
        onError: function (error) {
            setIsVerifying(false);
            setProgress(0);
            toast({
                title: "Verification Failed",
                description: error.message || "There was an error verifying your documents",
                variant: "destructive",
            });
        },
    });
    // Enhanced verification process with proper cleanup
    var startVerification = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var progressInterval, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (documents.length === 0) {
                        toast({
                            title: "No documents",
                            description: "Please upload documents to verify",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setIsVerifying(true);
                    setProgress(0);
                    setResults([]);
                    progressInterval = setInterval(function () {
                        setProgress(function (prev) {
                            var increment = ((performance.now() % 100) / 100) * PROGRESS_CONFIG.incrementRange;
                            var newProgress = prev + increment;
                            if (newProgress >= PROGRESS_CONFIG.maxProgress) {
                                clearInterval(progressInterval);
                                return PROGRESS_CONFIG.maxProgress;
                            }
                            return newProgress;
                        });
                    }, PROGRESS_CONFIG.interval);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, verifyDocumentsMutation.mutateAsync(documents)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    clearInterval(progressInterval);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [documents, toast, verifyDocumentsMutation]);
    // Memoized status utilities to prevent recalculation
    var getStatusConfig = (0, react_1.useCallback)(function (status) {
        switch (status) {
            case "authentic":
                return STATUS_CONFIG.authentic;
            case "suspicious":
                return STATUS_CONFIG.suspicious;
            case "forged":
                return STATUS_CONFIG.forged;
            case "processing":
                return STATUS_CONFIG.processing;
            default:
                return STATUS_CONFIG.processing;
        }
    }, []);
    // Memoized file size formatter
    var formatFileSize = (0, react_1.useMemo)(function () {
        return function (bytes) {
            return (bytes / 1024 / 1024).toFixed(2);
        };
    }, []);
    // Helper function to get upload area classes
    var getUploadAreaClasses = (0, react_1.useCallback)(function (isLarge) {
        var baseClasses = isLarge ?
            "relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer min-h-[200px] flex flex-col items-center justify-center p-8 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            : "border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
        if (isDragOver) {
            return "".concat(baseClasses, " border-primary bg-primary/5 ").concat(isLarge ? "scale-[1.02] shadow-lg" : "");
        }
        if (isVerifying) {
            return "".concat(baseClasses, " border-gray-200 bg-gray-50 cursor-not-allowed");
        }
        return "".concat(baseClasses, " border-gray-300 hover:border-primary/70 hover:bg-primary/5 ").concat(isLarge ? "hover:shadow-md" : "");
    }, [isDragOver, isVerifying]);
    // Helper function to handle upload click
    var handleUploadClick = (0, react_1.useCallback)(function () {
        if (!isVerifying && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [isVerifying]);
    // Helper function to handle keyboard events
    var handleUploadKeyDown = (0, react_1.useCallback)(function (e) {
        var _a;
        if ((e.key === "Enter" || e.key === " ") && !isVerifying) {
            e.preventDefault();
            (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
        }
    }, [isVerifying]);
    return (<div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <lucide_react_1.Shield className="w-5 h-5 text-primary"/>
            <h1 className="text-lg font-semibold">Document Authentication</h1>
          </div>
        </div>
      </header>

      {/* Chat-like Interface */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Welcome Message */}
        {documents.length === 0 && results.length === 0 && !isVerifying && (<div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <lucide_react_1.Shield className="w-8 h-8 text-primary"/>
              </div>
              <h2 className="text-2xl font-bold mb-4">
                Verify Your Documents with AI
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Upload your documents and I'll analyze them for
                authenticity using advanced AI detection.
              </p>

              {/* Quick Start Examples */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 border rounded-lg text-left">
                  <lucide_react_1.FileText className="w-6 h-6 text-primary mb-2"/>
                  <p className="font-medium text-sm">Title Deeds</p>
                  <p className="text-xs text-muted-foreground">
                    Verify land ownership documents
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-left">
                  <lucide_react_1.FileText className="w-6 h-6 text-primary mb-2"/>
                  <p className="font-medium text-sm">Contracts</p>
                  <p className="text-xs text-muted-foreground">
                    Check legal agreements
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-left">
                  <lucide_react_1.FileText className="w-6 h-6 text-primary mb-2"/>
                  <p className="font-medium text-sm">Certificates</p>
                  <p className="text-xs text-muted-foreground">
                    Validate official documents
                  </p>
                </div>
              </div>
            </div>
          </div>)}

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Document Messages */}
          {documents.map(function (doc) { return (<div key={doc.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">You</span>
              </div>
              <div className="flex-1">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <lucide_react_1.FileText className="w-4 h-4 text-blue-600"/>
                    <span className="font-medium text-sm">{doc.file.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file.size)} MB • {doc.file.type}
                  </p>
                  <button_1.Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs" onClick={function () { return removeDocument(doc.id); }} disabled={isVerifying}>
                    <lucide_react_1.X className="w-3 h-3 mr-1"/>
                    Remove
                  </button_1.Button>
                </div>
              </div>
            </div>); })}

          {/* Processing Message */}
          {isVerifying && (<div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <lucide_react_1.Shield className="w-4 h-4 text-primary"/>
              </div>
              <div className="flex-1">
                <div className="bg-card border rounded-lg p-4 max-w-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <lucide_react_1.Zap className="w-4 h-4 text-primary animate-pulse"/>
                    <span className="font-medium">
                      Analyzing your documents...
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Running AI verification checks</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <progress_1.Progress value={progress} className="h-2"/>
                  </div>
                </div>
              </div>
            </div>)}

          {/* Results Messages */}
          {results.map(function (result) {
            var statusConfig = getStatusConfig(result.status);
            var StatusIcon = statusConfig.icon;
            return (<div key={result.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <lucide_react_1.Shield className="w-4 h-4 text-primary"/>
                </div>
                <div className="flex-1">
                  <div className="bg-card border rounded-lg p-4 max-w-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <StatusIcon className={"w-5 h-5 ".concat(statusConfig.iconColor)}/>
                      <span className="font-medium">{result.filename}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {result.confidence}% confidence
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm">
                        <span className="font-medium">Document Type:</span>{" "}
                        {result.documentType}
                      </p>

                      {/* Verification Checks */}
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(result.checks).map(function (_a) {
                    var check = _a[0], data = _a[1];
                    return (<div key={check} className="flex items-center gap-2 text-sm">
                            {data.passed ?
                            <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>
                            : <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>}
                            <span className="capitalize">
                              {check}: {data.score}%
                            </span>
                          </div>);
                })}
                      </div>

                      {/* Issues */}
                      {result.issues.length > 0 && (<div>
                          <p className="font-medium text-sm mb-2 text-red-600">
                            Issues Found:
                          </p>
                          <ul className="text-sm space-y-1">
                            {result.issues.map(function (issue, idx) { return (<li key={idx} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{issue}</span>
                              </li>); })}
                          </ul>
                        </div>)}

                      {/* Recommendations */}
                      {result.recommendations.length > 0 && (<div>
                          <p className="font-medium text-sm mb-2 text-blue-600">
                            Recommendations:
                          </p>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map(function (rec, idx) { return (<li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>); })}
                          </ul>
                        </div>)}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Processed in {result.processingTime}ms
                        </span>
                        <button_1.Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <lucide_react_1.Download className="w-3 h-3 mr-1"/>
                          Download Report
                        </button_1.Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>);
        })}
        </div>

        {/* Large Upload Area */}
        <div className="border-t bg-card/50 backdrop-blur-sm p-6">
          <div className="max-w-4xl mx-auto">
            {documents.length === 0 ?
            // Large prominent upload area when no documents
            <div role="button" tabIndex={0} aria-label="Upload documents by clicking or dragging files here" className={getUploadAreaClasses(true)} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleUploadClick} onKeyDown={handleUploadKeyDown}>
                  <div className="text-center space-y-4">
                    <div className={"\n                      w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors\n                      ".concat(isDragOver ? "bg-primary/20" : ("bg-primary/10 group-hover:bg-primary/20"), "\n                    ")}>
                      <lucide_react_1.Upload className={"\n                        w-8 h-8 transition-colors\n                        ".concat(isDragOver ? "text-primary" : "text-primary/70", "\n                      ")}/>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {isDragOver ?
                    "Drop your documents here"
                    : "Upload Documents to Verify"}
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        {isDragOver ?
                    "Release to upload your files"
                    : "Drag and drop files here, or click to browse"}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                      <span className="px-3 py-1 bg-background rounded-full border">
                        PDF
                      </span>
                      <span className="px-3 py-1 bg-background rounded-full border">
                        JPG
                      </span>
                      <span className="px-3 py-1 bg-background rounded-full border">
                        PNG
                      </span>
                      <span className="px-3 py-1 bg-background rounded-full border">
                        Max 10MB
                      </span>
                    </div>

                    <button_1.Button size="lg" className="mt-4" disabled={isVerifying} onClick={function (e) {
                    var _a;
                    e.stopPropagation();
                    (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
                }}>
                      <lucide_react_1.Plus className="w-5 h-5 mr-2"/>
                      Choose Files
                    </button_1.Button>
                  </div>

                  <input_1.Input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload}/>
                </div>
            // Compact upload area when documents exist
            : <div className="space-y-4">
                  <div role="button" tabIndex={0} aria-label="Add more documents by clicking or dragging files here" className={getUploadAreaClasses(false)} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleUploadClick} onKeyDown={handleUploadKeyDown}>
                    <div className="flex items-center justify-center gap-3 py-2">
                      <lucide_react_1.Upload className="w-5 h-5 text-primary"/>
                      <span className="font-medium">
                        {isDragOver ?
                    "Drop more documents here"
                    : "Add more documents"}
                      </span>
                      <button_1.Button variant="outline" size="sm" disabled={isVerifying} onClick={function (e) {
                    var _a;
                    e.stopPropagation();
                    (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
                }}>
                        Browse
                      </button_1.Button>
                    </div>
                    <input_1.Input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload}/>
                  </div>

                  <div className="flex justify-center">
                    <button_1.Button onClick={startVerification} disabled={isVerifying} size="lg" className="px-8">
                      {isVerifying ?
                    <>
                          <lucide_react_1.Zap className="w-5 h-5 mr-2 animate-pulse"/>
                          Analyzing {documents.length} document
                          {documents.length > 1 ? "s" : ""}...
                        </>
                    : <>
                          <lucide_react_1.Send className="w-5 h-5 mr-2"/>
                          Verify {documents.length} Document
                          {documents.length > 1 ? "s" : ""}
                        </>}
                    </button_1.Button>
                  </div>
                </div>}
          </div>
        </div>
      </main>
    </div>);
}
