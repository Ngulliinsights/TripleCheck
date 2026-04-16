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
exports.default = DocumentAuthentication;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var SUPPORTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
var MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
function DocumentAuthentication() {
    var _this = this;
    var _a, _b, _c, _d;
    var _e = (0, react_1.useState)([]), documents = _e[0], setDocuments = _e[1];
    var _f = (0, react_1.useState)(false), dragActive = _f[0], setDragActive = _f[1];
    var _g = (0, react_1.useState)(null), selectedDocument = _g[0], setSelectedDocument = _g[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var updateDocumentStatus = (0, react_1.useCallback)(function (id, status, progress) {
        setDocuments(function (prev) {
            return prev.map(function (doc) { return (doc.id === id ? __assign(__assign({}, doc), { status: status, progress: progress }) : doc); });
        });
    }, []);
    var mapVerificationStatus = (0, react_1.useCallback)(function (status) {
        if (status === "authentic")
            return "verified";
        if (status === "suspicious")
            return "suspicious";
        return "failed";
    }, []);
    var processDocument = (0, react_1.useCallback)(function (document) { return __awaiter(_this, void 0, void 0, function () {
        var progress, formData, response, errorData, responseData, result_1, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 12, , 13]);
                    // Update status to processing
                    updateDocumentStatus(document.id, "processing", 10);
                    progress = 20;
                    _a.label = 1;
                case 1:
                    if (!(progress <= 80)) return [3 /*break*/, 4];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 2:
                    _a.sent();
                    updateDocumentStatus(document.id, "processing", progress);
                    _a.label = 3;
                case 3:
                    progress += 20;
                    return [3 /*break*/, 1];
                case 4:
                    formData = new FormData();
                    formData.append("document", document.file);
                    formData.append("documentId", document.id);
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 10, , 11]);
                    return [4 /*yield*/, fetch("/api/documents/verify", {
                            method: "POST",
                            body: formData,
                        })];
                case 6:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, response.json()];
                case 7:
                    errorData = _a.sent();
                    throw new Error(errorData.error || "Verification failed");
                case 8: return [4 /*yield*/, response.json()];
                case 9:
                    responseData = _a.sent();
                    if (!responseData.success) {
                        throw new Error(responseData.error || "Verification failed");
                    }
                    result_1 = responseData.data;
                    // Update document with verification result
                    setDocuments(function (prev) {
                        return prev.map(function (doc) {
                            return doc.id === document.id ? __assign(__assign({}, doc), { status: mapVerificationStatus(result_1.status), progress: 100, verificationResult: result_1 }) : doc;
                        });
                    });
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    // Log error for debugging
                    if (process.env.NODE_ENV === "development") {
                    }
                    // Update document with error status
                    setDocuments(function (prev) {
                        return prev.map(function (doc) {
                            return doc.id === document.id ? __assign(__assign({}, doc), { status: "failed", progress: 0, error: error_1 instanceof Error ?
                                    error_1.message
                                    : "Verification failed" }) : doc;
                        });
                    });
                    throw error_1;
                case 11: return [3 /*break*/, 13];
                case 12:
                    error_2 = _a.sent();
                    // Log error for debugging in development
                    if (process.env.NODE_ENV === "development") {
                    }
                    updateDocumentStatus(document.id, "failed", 100);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    }); }, [updateDocumentStatus, mapVerificationStatus]);
    var handleFiles = (0, react_1.useCallback)(function (files) {
        var validFiles = files.filter(function (file) {
            return (SUPPORTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE);
        });
        var newDocuments = validFiles.map(function (file) { return ({
            id: "doc-".concat(Date.now(), "-").concat(Date.now().toString(36)),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            status: "uploading",
            progress: 0,
        }); });
        setDocuments(function (prev) { return __spreadArray(__spreadArray([], prev, true), newDocuments, true); });
        // Start processing each document
        newDocuments.forEach(function (doc) {
            processDocument(doc);
        });
    }, [processDocument]);
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
    var handleDrop = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        var files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, [handleFiles]);
    var handleFileInput = (0, react_1.useCallback)(function (e) {
        if (e.target.files) {
            var files = Array.from(e.target.files);
            handleFiles(files);
        }
    }, [handleFiles]);
    var removeDocument = function (id) {
        setDocuments(function (prev) { return prev.filter(function (doc) { return doc.id !== id; }); });
        if ((selectedDocument === null || selectedDocument === void 0 ? void 0 : selectedDocument.id) === id) {
            setSelectedDocument(null);
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case "uploading":
            case "processing":
                return <lucide_react_1.Loader className="w-5 h-5 animate-spin text-blue-500"/>;
            case "verified":
                return <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500"/>;
            case "suspicious":
                return <lucide_react_1.AlertTriangle className="w-5 h-5 text-yellow-500"/>;
            case "failed":
                return <lucide_react_1.X className="w-5 h-5 text-red-500"/>;
            default:
                return <lucide_react_1.FileText className="w-5 h-5 text-gray-500"/>;
        }
    };
    var getStatusColor = function (status) {
        switch (status) {
            case "verified":
                return "border-green-200 bg-green-50";
            case "suspicious":
                return "border-yellow-200 bg-yellow-50";
            case "failed":
                return "border-red-200 bg-red-50";
            case "processing":
                return "border-blue-200 bg-blue-50";
            default:
                return "border-gray-200 bg-gray-50";
        }
    };
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return "0 Bytes";
        var k = 1024;
        var sizes = ["Bytes", "KB", "MB", "GB"];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(2)), " ").concat(sizes[i]);
    };
    return (<div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <lucide_react_1.Shield className="w-12 h-12 text-primary"/>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Document Authentication
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Advanced AI-powered document verification to detect forgeries,
              alterations, and ensure authenticity. Upload your property
              documents for instant verification.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-trust-verified/10 px-4 py-2 rounded-full">
                <lucide_react_1.Scan className="w-5 h-5 text-trust-verified"/>
                <span className="text-trust-verified font-medium">
                  AI-Powered Analysis
                </span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <lucide_react_1.Camera className="w-5 h-5 text-primary"/>
                <span className="text-primary font-medium">
                  Metadata Verification
                </span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
                <lucide_react_1.FileText className="w-5 h-5 text-secondary"/>
                <span className="text-secondary font-medium">
                  Multi-Format Support
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Area */}
        <section className="mb-12">
          <div className={"border-2 border-dashed rounded-lg p-8 text-center transition-colors ".concat(dragActive ?
            "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50")} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <lucide_react_1.Upload className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Upload Documents for Verification
            </h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop your documents here, or click to browse
            </p>
            <button type="button" onClick={function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Choose Files
            </button>
            <input ref={fileInputRef} type="file" multiple accept={SUPPORTED_TYPES.join(",")} onChange={handleFileInput} className="hidden" aria-label="File upload input"/>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Supported formats: PDF, JPEG, PNG, TIFF, DOC, DOCX</p>
              <p>Maximum file size: 50MB per file</p>
            </div>
          </div>
        </section>

        {/* Document List */}
        {documents.length > 0 && (<section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Document Verification Results
            </h2>
            <div className="grid gap-4">
              {documents.map(function (doc) { return (<div key={doc.id} className={"border rounded-lg p-6 ".concat(getStatusColor(doc.status))}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-white rounded-lg">
                        <lucide_react_1.FileText className="w-6 h-6 text-gray-600"/>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {doc.name}
                          </h3>
                          {getStatusIcon(doc.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            Uploaded {doc.uploadedAt.toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {(doc.status === "uploading" ||
                    doc.status === "processing") && (<div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                {doc.status === "uploading" ?
                        "Uploading..."
                        : "Processing..."}
                              </span>
                              <span>{doc.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "".concat(doc.progress, "%") }} role="progressbar" aria-valuenow={doc.progress} aria-valuemin={0} aria-valuemax={100} aria-label={"Document processing progress: ".concat(doc.progress, "%")}/>
                            </div>
                          </div>)}

                        {/* Verification Results */}
                        {doc.verificationResult && (<div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-medium">
                                  Overall Score:{" "}
                                </span>
                                <span className={"font-bold ".concat(doc.verificationResult.overallScore >= 80 ?
                        "text-green-600"
                        : (doc.verificationResult.overallScore >= 60) ?
                            "text-yellow-600"
                            : "text-red-600")}>
                                  {doc.verificationResult.overallScore}/100
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">
                                  Confidence:{" "}
                                </span>
                                <span>
                                  {Math.round(doc.verificationResult.confidence * 100)}
                                  %
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">
                                  Processing Time:{" "}
                                </span>
                                <span>
                                  {doc.verificationResult.processingTime}ms
                                </span>
                              </div>
                            </div>

                            {/* Verification Checks Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {doc.verificationResult.checks.map(function (check, index) { return (<div key={index} className={"text-xs px-2 py-1 rounded-full text-center ".concat(check.status === "pass" ?
                            "bg-green-100 text-green-800"
                            : check.status === "warning" ?
                                "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800")}>
                                    {check.name}
                                  </div>); })}
                            </div>
                          </div>)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {doc.verificationResult && (<button type="button" onClick={function () { return setSelectedDocument(doc); }} className="p-2 text-gray-500 hover:text-primary transition-colors" title="View Details" aria-label="View document details">
                          <lucide_react_1.Eye className="w-4 h-4"/>
                        </button>)}
                      <button type="button" onClick={function () { return removeDocument(doc.id); }} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Remove" aria-label="Remove document">
                        <lucide_react_1.X className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>); })}
            </div>
          </section>)}

        {/* Detailed Results Modal */}
        {(selectedDocument === null || selectedDocument === void 0 ? void 0 : selectedDocument.verificationResult) && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    Verification Details: {selectedDocument.name}
                  </h2>
                  <button type="button" onClick={function () { return setSelectedDocument(null); }} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Close details modal">
                    <lucide_react_1.X className="w-6 h-6"/>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Overall Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Overall Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <div className={"text-lg font-bold capitalize ".concat((selectedDocument.verificationResult.status ===
                "authentic") ?
                "text-green-600"
                : (selectedDocument.verificationResult.status ===
                    "suspicious") ?
                    "text-yellow-600"
                    : "text-red-600")}>
                        {selectedDocument.verificationResult.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Overall Score
                      </span>
                      <div className="text-lg font-bold">
                        {selectedDocument.verificationResult.overallScore}/100
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Confidence
                      </span>
                      <div className="text-lg font-bold">
                        {Math.round(selectedDocument.verificationResult.confidence * 100)}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Checks */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Verification Checks
                  </h3>
                  <div className="space-y-4">
                    {selectedDocument.verificationResult.checks.map(function (check, index) { return (<div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{check.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Score: {check.score}/100
                              </span>
                              <span className={"px-2 py-1 rounded-full text-xs font-medium ".concat(check.status === "pass" ?
                    "bg-green-100 text-green-800"
                    : check.status === "warning" ?
                        "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800")}>
                                {check.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {check.description}
                          </p>
                          {check.details.length > 0 && (<ul className="text-sm space-y-1">
                              {check.details.map(function (detail, detailIndex) { return (<li key={detailIndex} className="flex items-start gap-2">
                                  <span className="text-muted-foreground">
                                    •
                                  </span>
                                  <span>{detail}</span>
                                </li>); })}
                            </ul>)}
                        </div>); })}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Document Metadata
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">File Size:</span>
                        <span className="ml-2">
                          {formatFileSize(selectedDocument.verificationResult.metadata
                .fileSize)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Hash:</span>
                        <span className="ml-2 font-mono text-xs">
                          {selectedDocument.verificationResult.metadata.hash}
                        </span>
                      </div>
                      {((_a = selectedDocument.verificationResult.metadata) === null || _a === void 0 ? void 0 : _a.author) && (<div>
                          <span className="font-medium">Author:</span>
                          <span className="ml-2">
                            {selectedDocument.verificationResult.metadata
                    .author}
                          </span>
                        </div>)}
                      {((_b = selectedDocument.verificationResult.metadata) === null || _b === void 0 ? void 0 : _b.software) && (<div>
                          <span className="font-medium">Software:</span>
                          <span className="ml-2">
                            {selectedDocument.verificationResult.metadata
                    .software}
                          </span>
                        </div>)}
                      {((_c = selectedDocument.verificationResult.metadata) === null || _c === void 0 ? void 0 : _c.creationDate) && (<div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">
                            {selectedDocument.verificationResult.metadata.creationDate.toLocaleString()}
                          </span>
                        </div>)}
                      {((_d = selectedDocument.verificationResult.metadata) === null || _d === void 0 ? void 0 : _d.modificationDate) && (<div>
                          <span className="font-medium">Modified:</span>
                          <span className="ml-2">
                            {selectedDocument.verificationResult.metadata.modificationDate.toLocaleString()}
                          </span>
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>)}

        {/* How It Works */}
        <section className="mt-16 py-12 bg-muted/30 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How Document Authentication Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI system performs multiple layers of analysis to
              ensure document authenticity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <lucide_react_1.Scan className="w-8 h-8 text-primary"/>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Metadata Analysis
              </h3>
              <p className="text-muted-foreground">
                Examines file creation dates, software signatures, and digital
                fingerprints to detect tampering.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <lucide_react_1.Camera className="w-8 h-8 text-secondary"/>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Visual Inspection
              </h3>
              <p className="text-muted-foreground">
                AI-powered image analysis detects alterations, inconsistencies,
                and signs of digital manipulation.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-accent/10 rounded-full">
                  <lucide_react_1.Shield className="w-8 h-8 text-accent"/>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Authenticity Score
              </h3>
              <p className="text-muted-foreground">
                Combines all analysis results into a comprehensive authenticity
                score with detailed explanations.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>);
}
