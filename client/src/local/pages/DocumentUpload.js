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
exports.default = DocumentUpload;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var input_1 = require("../components/ui/input");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var select_1 = require("../components/ui/select");
var textarea_1 = require("../components/ui/textarea");
var label_1 = require("../components/ui/label");
var progress_1 = require("../components/ui/progress");
var use_toast_1 = require("../hooks/use-toast");
var documentTypes = [
    { value: 'title-deed', label: 'Title Deed', icon: lucide_react_1.FileText },
    { value: 'survey-plan', label: 'Survey Plan', icon: lucide_react_1.FileText },
    { value: 'id-copy', label: 'ID Copy', icon: lucide_react_1.User },
    { value: 'passport-copy', label: 'Passport Copy', icon: lucide_react_1.User },
    { value: 'lease-agreement', label: 'Lease Agreement', icon: lucide_react_1.FileText },
    { value: 'sale-agreement', label: 'Sale Agreement', icon: lucide_react_1.FileText },
    { value: 'valuation-report', label: 'Valuation Report', icon: lucide_react_1.FileText },
    { value: 'inspection-report', label: 'Inspection Report', icon: lucide_react_1.FileText },
    { value: 'property-photos', label: 'Property Photos', icon: lucide_react_1.Image },
    { value: 'other', label: 'Other Document', icon: lucide_react_1.FileText }
];
var maxFileSize = 10 * 1024 * 1024; // 10MB
var allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
function DocumentUpload() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var fileInputRef = (0, react_1.useRef)(null);
    var _a = (0, react_1.useState)([]), uploadFiles = _a[0], setUploadFiles = _a[1];
    var _b = (0, react_1.useState)(false), isDragOver = _b[0], setIsDragOver = _b[1];
    var _c = (0, react_1.useState)({
        documentType: '',
        propertyAddress: '',
        description: '',
        tags: [],
        isPublic: false
    }), metadata = _c[0], setMetadata = _c[1];
    var updateMetadata = (0, react_1.useCallback)(function (key, value) {
        setMetadata(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    var generateFileId = function () { return Math.random().toString(36).substr(2, 9); };
    var validateFile = function (file) {
        if (file.size > maxFileSize) {
            return "File size must be less than ".concat(maxFileSize / 1024 / 1024, "MB");
        }
        if (!allowedTypes.includes(file.type)) {
            return 'File type not supported. Please upload PDF, Word, or image files.';
        }
        return null;
    };
    var createFilePreview = function (file) {
        return new Promise(function (resolve) {
            if (file.type.startsWith('image/')) {
                var reader = new FileReader();
                reader.onload = function (e) { var _a; return resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result); };
                reader.readAsDataURL(file);
            }
            else {
                resolve(undefined);
            }
        });
    };
    var processFiles = (0, react_1.useCallback)(function (files) { return __awaiter(_this, void 0, void 0, function () {
        var fileArray, newUploadFiles, _i, fileArray_1, file, validationError, preview, uploadFile, errorFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fileArray = Array.from(files);
                    newUploadFiles = [];
                    _i = 0, fileArray_1 = fileArray;
                    _a.label = 1;
                case 1:
                    if (!(_i < fileArray_1.length)) return [3 /*break*/, 4];
                    file = fileArray_1[_i];
                    validationError = validateFile(file);
                    return [4 /*yield*/, createFilePreview(file)];
                case 2:
                    preview = _a.sent();
                    uploadFile = {
                        id: generateFileId(),
                        file: file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        preview: preview,
                        uploadProgress: 0,
                        status: validationError ? 'error' : 'pending',
                        errorMessage: validationError || undefined
                    };
                    newUploadFiles.push(uploadFile);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    setUploadFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), newUploadFiles, true); });
                    errorFiles = newUploadFiles.filter(function (f) { return f.status === 'error'; });
                    if (errorFiles.length > 0) {
                        toast({
                            title: 'Some files could not be added',
                            description: "".concat(errorFiles.length, " file(s) have validation errors."),
                            variant: 'destructive'
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [toast]);
    var handleFileSelect = (0, react_1.useCallback)(function (e) {
        var files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    }, [processFiles]);
    var handleDragOver = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    var handleDragLeave = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    var handleDrop = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        setIsDragOver(false);
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
    }, [processFiles]);
    var removeFile = (0, react_1.useCallback)(function (fileId) {
        setUploadFiles(function (prev) { return prev.filter(function (f) { return f.id !== fileId; }); });
    }, []);
    var simulateUpload = (0, react_1.useCallback)(function (fileId) { return __awaiter(_this, void 0, void 0, function () {
        var updateProgress, progress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updateProgress = function (progress) {
                        setUploadFiles(function (prev) { return prev.map(function (f) {
                            return f.id === fileId ? __assign(__assign({}, f), { uploadProgress: progress, status: 'uploading' }) : f;
                        }); });
                    };
                    progress = 0;
                    _a.label = 1;
                case 1:
                    if (!(progress <= 100)) return [3 /*break*/, 4];
                    updateProgress(progress);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    progress += 10;
                    return [3 /*break*/, 1];
                case 4:
                    // Mark as completed
                    setUploadFiles(function (prev) { return prev.map(function (f) {
                        return f.id === fileId ? __assign(__assign({}, f), { status: 'completed' }) : f;
                    }); });
                    return [2 /*return*/];
            }
        });
    }); }, []);
    var handleUploadAll = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var pendingFiles, uploadPromises, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!metadata.documentType) {
                        toast({
                            title: 'Document type required',
                            description: 'Please select a document type before uploading.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    pendingFiles = uploadFiles.filter(function (f) { return f.status === 'pending'; });
                    if (pendingFiles.length === 0) {
                        toast({
                            title: 'No files to upload',
                            description: 'Please add some files first.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    uploadPromises = pendingFiles.map(function (file) { return simulateUpload(file.id); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all(uploadPromises)];
                case 2:
                    _a.sent();
                    toast({
                        title: 'Upload completed',
                        description: "".concat(pendingFiles.length, " file(s) uploaded successfully."),
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Upload failed',
                        description: 'Some files failed to upload. Please try again.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [uploadFiles, metadata.documentType, simulateUpload, toast]);
    var handleClearAll = (0, react_1.useCallback)(function () {
        setUploadFiles([]);
    }, []);
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var getFileIcon = function (type) {
        if (type.startsWith('image/'))
            return lucide_react_1.Image;
        return lucide_react_1.FileText;
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'completed':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'error':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
            case 'uploading':
                return <lucide_react_1.Clock className="w-4 h-4 text-blue-500"/>;
            default:
                return <lucide_react_1.Clock className="w-4 h-4 text-gray-500"/>;
        }
    };
    var totalFiles = uploadFiles.length;
    var completedFiles = uploadFiles.filter(function (f) { return f.status === 'completed'; }).length;
    var errorFiles = uploadFiles.filter(function (f) { return f.status === 'error'; }).length;
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Upload className="w-8 h-8 text-green-500"/>
            Document Upload
          </h1>
          <p className="text-muted-foreground">
            Upload and verify property documents with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Drop Zone */}
            <card_1.Card>
              <card_1.CardContent className="p-6">
                <div className={"border-2 border-dashed rounded-lg p-8 text-center transition-colors ".concat(isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50')} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <lucide_react_1.Upload className="w-8 h-8 text-primary"/>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Drop files here or click to browse
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Support for PDF, Word documents, and images up to 10MB
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button_1.Button onClick={function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }}>
                        <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                        Choose Files
                      </button_1.Button>
                      
                      <button_1.Button variant="outline">
                        <lucide_react_1.Camera className="w-4 h-4 mr-2"/>
                        Take Photo
                      </button_1.Button>
                      
                      <button_1.Button variant="outline">
                        <lucide_react_1.Scan className="w-4 h-4 mr-2"/>
                        Scan Document
                      </button_1.Button>
                    </div>

                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden"/>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Upload Progress */}
            {totalFiles > 0 && (<card_1.Card>
                <card_1.CardHeader>
                  <div className="flex items-center justify-between">
                    <card_1.CardTitle>Upload Progress</card_1.CardTitle>
                    <div className="flex items-center gap-2">
                      <badge_1.Badge variant="outline">
                        {completedFiles}/{totalFiles} completed
                      </badge_1.Badge>
                      {errorFiles > 0 && (<badge_1.Badge variant="destructive">
                          {errorFiles} errors
                        </badge_1.Badge>)}
                    </div>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    {uploadFiles.map(function (file) {
                var FileIcon = getFileIcon(file.type);
                return (<div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {file.preview ? (<img src={file.preview} alt={file.name} className="w-10 h-10 object-cover rounded"/>) : (<div className="p-2 bg-muted rounded">
                                <FileIcon className="w-6 h-6"/>
                              </div>)}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{file.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                              
                              {file.status === 'uploading' && (<progress_1.Progress value={file.uploadProgress} className="mt-2"/>)}
                              
                              {file.errorMessage && (<p className="text-sm text-red-600 mt-1">
                                  {file.errorMessage}
                                </p>)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusIcon(file.status)}
                            
                            <button_1.Button size="sm" variant="ghost" onClick={function () { return removeFile(file.id); }}>
                              <lucide_react_1.Trash2 className="w-4 h-4"/>
                            </button_1.Button>
                          </div>
                        </div>);
            })}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button_1.Button onClick={handleUploadAll} disabled={uploadFiles.filter(function (f) { return f.status === 'pending'; }).length === 0}>
                      Upload All Files
                    </button_1.Button>
                    
                    <button_1.Button variant="outline" onClick={handleClearAll}>
                      Clear All
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}
          </div>

          {/* Metadata Form */}
          <div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Document Information</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="document-type">Document Type *</label_1.Label>
                  <select_1.Select value={metadata.documentType} onValueChange={function (value) { return updateMetadata('documentType', value); }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="Select document type"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {documentTypes.map(function (type) { return (<select_1.SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4"/>
                            {type.label}
                          </div>
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                <div>
                  <label_1.Label htmlFor="property-address">Property Address</label_1.Label>
                  <textarea_1.Textarea id="property-address" placeholder="Enter property address (if applicable)" value={metadata.propertyAddress} onChange={function (e) { return updateMetadata('propertyAddress', e.target.value); }} rows={3}/>
                </div>

                <div>
                  <label_1.Label htmlFor="description">Description</label_1.Label>
                  <textarea_1.Textarea id="description" placeholder="Brief description of the document" value={metadata.description} onChange={function (e) { return updateMetadata('description', e.target.value); }} rows={3}/>
                </div>

                <div>
                  <label_1.Label htmlFor="expiry-date">Expiry Date (Optional)</label_1.Label>
                  <input_1.Input id="expiry-date" type="date" value={metadata.expiryDate} onChange={function (e) { return updateMetadata('expiryDate', e.target.value); }}/>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="is-public" checked={metadata.isPublic} onChange={function (e) { return updateMetadata('isPublic', e.target.checked); }}/>
                  <label_1.Label htmlFor="is-public" className="text-sm">
                    Make document publicly viewable
                  </label_1.Label>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Upload Guidelines */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Shield className="w-5 h-5"/>
                  Security & Guidelines
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/>
                  <span>All documents are encrypted and stored securely</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/>
                  <span>AI-powered document verification and fraud detection</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/>
                  <span>Automatic OCR text extraction for searchability</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/>
                  <span>Version control and audit trail maintained</span>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Supported Formats</h4>
                  <p className="text-blue-700 text-xs">
                    PDF, Word (.doc, .docx), Images (.jpg, .png) up to 10MB each
                  </p>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Quick Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Quick Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  View My Documents
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.FileText className="w-4 h-4 mr-2"/>
                  Document Templates
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Shield className="w-4 h-4 mr-2"/>
                  Verification Status
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
