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
exports.FileUploadField = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../ui/button");
var label_1 = require("../ui/label");
var progress_1 = require("../ui/progress");
var cn_1 = require("../../utils/cn");
var FileUploadField = function (_a) {
    var label = _a.label, name = _a.name, accept = _a.accept, _b = _a.multiple, multiple = _b === void 0 ? false : _b, _c = _a.maxSize, maxSize = _c === void 0 ? 10 * 1024 * 1024 : _c, // 10MB default
    _d = _a.maxFiles, // 10MB default
    maxFiles = _d === void 0 ? 5 : _d, _e = _a.value, value = _e === void 0 ? [] : _e, onChange = _a.onChange, error = _a.error, touched = _a.touched, _f = _a.required, required = _f === void 0 ? false : _f, _g = _a.disabled, disabled = _g === void 0 ? false : _g, className = _a.className, helpText = _a.helpText, _h = _a.showProgress, showProgress = _h === void 0 ? false : _h, onUpload = _a.onUpload;
    var _j = (0, react_1.useState)(false), dragActive = _j[0], setDragActive = _j[1];
    var _k = (0, react_1.useState)([]), filesWithProgress = _k[0], setFilesWithProgress = _k[1];
    var _l = (0, react_1.useState)(false), isUploading = _l[0], setIsUploading = _l[1];
    var hasError = touched && error;
    var fieldId = "field-".concat(name);
    var errorId = "".concat(fieldId, "-error");
    var helpId = "".concat(fieldId, "-help");
    // Validate file
    var validateFile = (0, react_1.useCallback)(function (file) {
        if (file.size > maxSize) {
            return "File size must be less than ".concat(Math.round(maxSize / 1024 / 1024), "MB");
        }
        return null;
    }, [maxSize]);
    // Handle file selection
    var handleFiles = (0, react_1.useCallback)(function (newFiles) {
        var fileArray = Array.from(newFiles);
        var validFiles = [];
        var errors = [];
        // Validate each file
        fileArray.forEach(function (file) {
            var error = validateFile(file);
            if (error) {
                errors.push("".concat(file.name, ": ").concat(error));
            }
            else {
                validFiles.push(file);
            }
        });
        // Check total file count
        var totalFiles = value.length + validFiles.length;
        if (totalFiles > maxFiles) {
            errors.push("Maximum ".concat(maxFiles, " files allowed"));
            return;
        }
        // Update files
        if (validFiles.length > 0) {
            var updatedFiles = multiple ? __spreadArray(__spreadArray([], value, true), validFiles, true) : validFiles;
            onChange(updatedFiles);
            // Initialize progress tracking
            if (showProgress) {
                var newFilesWithProgress_1 = validFiles.map(function (file) { return ({
                    file: file,
                    progress: 0,
                    status: 'pending',
                }); });
                setFilesWithProgress(function (prev) { return __spreadArray(__spreadArray([], prev, true), newFilesWithProgress_1, true); });
            }
        }
        // Show errors if any
        if (errors.length > 0) {
            console.error('File validation errors:', errors);
        }
    }, [value, onChange, multiple, maxFiles, validateFile, showProgress]);
    // Handle drag events
    var handleDrag = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        }
        else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);
    // Handle drop
    var handleDrop = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (disabled)
            return;
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    }, [disabled, handleFiles]);
    // Handle input change
    var handleInputChange = (0, react_1.useCallback)(function (e) {
        var files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    }, [handleFiles]);
    // Remove file
    var removeFile = (0, react_1.useCallback)(function (index) {
        var updatedFiles = value.filter(function (_, i) { return i !== index; });
        onChange(updatedFiles);
        // Remove from progress tracking
        if (showProgress) {
            setFilesWithProgress(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
        }
    }, [value, onChange, showProgress]);
    // Upload files
    var handleUpload = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _loop_1, progress, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!onUpload || value.length === 0)
                        return [2 /*return*/];
                    setIsUploading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 9]);
                    if (!showProgress) return [3 /*break*/, 5];
                    setFilesWithProgress(function (prev) {
                        return prev.map(function (item) { return (__assign(__assign({}, item), { status: 'uploading' })); });
                    });
                    _loop_1 = function (progress) {
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                case 1:
                                    _b.sent();
                                    setFilesWithProgress(function (prev) {
                                        return prev.map(function (item) { return (__assign(__assign({}, item), { progress: progress })); });
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    progress = 0;
                    _a.label = 2;
                case 2:
                    if (!(progress <= 100)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(progress)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    progress += 10;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, onUpload(value)];
                case 6:
                    _a.sent();
                    // Mark as success
                    if (showProgress) {
                        setFilesWithProgress(function (prev) {
                            return prev.map(function (item) { return (__assign(__assign({}, item), { status: 'success', progress: 100 })); });
                        });
                    }
                    return [3 /*break*/, 9];
                case 7:
                    error_1 = _a.sent();
                    // Mark as error
                    if (showProgress) {
                        setFilesWithProgress(function (prev) {
                            return prev.map(function (item) { return (__assign(__assign({}, item), { status: 'error', error: error_1 instanceof Error ? error_1.message : 'Upload failed' })); });
                        });
                    }
                    return [3 /*break*/, 9];
                case 8:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); }, [onUpload, value, showProgress]);
    // Format file size
    var formatFileSize = (0, react_1.useCallback)(function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);
    return (<div className={(0, cn_1.cn)('space-y-2', className)}>
      <label_1.Label htmlFor={fieldId} className={(0, cn_1.cn)('text-sm font-medium leading-none', hasError && 'text-red-600', disabled && 'opacity-50')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label_1.Label>

      {/* Drop zone */}
      <div className={(0, cn_1.cn)('relative border-2 border-dashed rounded-lg p-6 transition-colors', dragActive && 'border-primary bg-primary/5', hasError && 'border-red-500', disabled && 'opacity-50 cursor-not-allowed', !disabled && 'hover:border-primary/50 cursor-pointer')} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        <input id={fieldId} name={name} type="file" accept={accept} multiple={multiple} onChange={handleInputChange} disabled={disabled} required={required} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" aria-describedby={(0, cn_1.cn)(hasError && errorId, helpText && helpId).trim() || undefined}/>

        <div className="text-center">
          <lucide_react_1.Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {accept && "Accepted formats: ".concat(accept)}
            {maxSize && " \u2022 Max size: ".concat(Math.round(maxSize / 1024 / 1024), "MB")}
            {multiple && " \u2022 Max files: ".concat(maxFiles)}
          </div>
        </div>
      </div>

      {/* File list */}
      {value.length > 0 && (<div className="space-y-2">
          {value.map(function (file, index) {
                var fileWithProgress = filesWithProgress[index];
                var status = (fileWithProgress === null || fileWithProgress === void 0 ? void 0 : fileWithProgress.status) || 'pending';
                var progress = (fileWithProgress === null || fileWithProgress === void 0 ? void 0 : fileWithProgress.progress) || 0;
                return (<div key={"".concat(file.name, "-").concat(index)} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <lucide_react_1.File className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {showProgress && status === 'uploading' && (<progress_1.Progress value={progress} className="mt-1 h-1"/>)}
                    {(fileWithProgress === null || fileWithProgress === void 0 ? void 0 : fileWithProgress.error) && (<p className="text-xs text-red-600 mt-1">
                        {fileWithProgress.error}
                      </p>)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status icon */}
                  {status === 'uploading' && (<lucide_react_1.Loader2 className="h-4 w-4 animate-spin text-blue-500"/>)}
                  {status === 'success' && (<lucide_react_1.CheckCircle className="h-4 w-4 text-green-500"/>)}
                  {status === 'error' && (<lucide_react_1.AlertCircle className="h-4 w-4 text-red-500"/>)}

                  {/* Remove button */}
                  <button_1.Button type="button" variant="ghost" size="sm" onClick={function () { return removeFile(index); }} disabled={disabled || isUploading} className="h-6 w-6 p-0">
                    <lucide_react_1.X className="h-3 w-3"/>
                  </button_1.Button>
                </div>
              </div>);
            })}
        </div>)}

      {/* Upload button */}
      {onUpload && value.length > 0 && (<button_1.Button type="button" onClick={handleUpload} disabled={disabled || isUploading} className="w-full">
          {isUploading ? (<>
              <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
              Uploading...
            </>) : (<>
              <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
              Upload {value.length} file{value.length !== 1 ? 's' : ''}
            </>)}
        </button_1.Button>)}

      {/* Help text */}
      {helpText && !hasError && (<p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>)}

      {/* Error message */}
      {hasError && (<p id={errorId} className="text-xs text-red-600 flex items-center gap-1" role="alert" aria-live="polite">
          <lucide_react_1.AlertCircle className="h-3 w-3 flex-shrink-0"/>
          {error}
        </p>)}
    </div>);
};
exports.FileUploadField = FileUploadField;
exports.default = exports.FileUploadField;
