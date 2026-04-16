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
exports.useFileUpload = useFileUpload;
var react_1 = require("react");
function useFileUpload(options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var _a = options.maxSize, maxSize = _a === void 0 ? 10 * 1024 * 1024 : _a, // 10MB
    _b = options.allowedTypes, // 10MB
    allowedTypes = _b === void 0 ? ['image/*', 'application/pdf'] : _b, _c = options.multiple, multiple = _c === void 0 ? false : _c, onUpload = options.onUpload, onError = options.onError;
    var _d = (0, react_1.useState)([]), files = _d[0], setFiles = _d[1];
    var _e = (0, react_1.useState)(false), uploading = _e[0], setUploading = _e[1];
    var _f = (0, react_1.useState)(0), progress = _f[0], setProgress = _f[1];
    var _g = (0, react_1.useState)(null), error = _g[0], setError = _g[1];
    var validateFile = (0, react_1.useCallback)(function (file) {
        if (file.size > maxSize) {
            return "File size must be less than ".concat((maxSize / 1024 / 1024).toFixed(1), "MB");
        }
        var isAllowedType = allowedTypes.some(function (type) {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });
        if (!isAllowedType) {
            return "File type not allowed. Allowed types: ".concat(allowedTypes.join(', '));
        }
        return null;
    }, [maxSize, allowedTypes]);
    var addFiles = (0, react_1.useCallback)(function (newFiles) {
        var fileArray = Array.from(newFiles);
        var validFiles = [];
        for (var _i = 0, fileArray_1 = fileArray; _i < fileArray_1.length; _i++) {
            var file = fileArray_1[_i];
            var validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                onError === null || onError === void 0 ? void 0 : onError(validationError);
                return;
            }
            validFiles.push(file);
        }
        setFiles(function (prev) { return multiple ? __spreadArray(__spreadArray([], prev, true), validFiles, true) : validFiles; });
        setError(null);
    }, [validateFile, multiple, onError]);
    var handleFileSelect = (0, react_1.useCallback)(function (e) {
        if (e.target.files) {
            addFiles(e.target.files);
        }
    }, [addFiles]);
    var handleDrop = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files);
        }
    }, [addFiles]);
    var handleDragOver = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
    }, []);
    var removeFile = (0, react_1.useCallback)(function (index) {
        setFiles(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    }, []);
    var clearFiles = (0, react_1.useCallback)(function () {
        setFiles([]);
        setError(null);
        setProgress(0);
    }, []);
    var upload = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var progressInterval_1, uploadError_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!onUpload || files.length === 0)
                        return [2 /*return*/];
                    setUploading(true);
                    setProgress(0);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    progressInterval_1 = setInterval(function () {
                        setProgress(function (prev) {
                            if (prev >= 90) {
                                clearInterval(progressInterval_1);
                                return 90;
                            }
                            return prev + 10;
                        });
                    }, 200);
                    return [4 /*yield*/, onUpload(files)];
                case 2:
                    _a.sent();
                    clearInterval(progressInterval_1);
                    setProgress(100);
                    // Clear files after successful upload
                    setTimeout(function () {
                        clearFiles();
                    }, 1000);
                    return [3 /*break*/, 5];
                case 3:
                    uploadError_1 = _a.sent();
                    errorMessage = uploadError_1 instanceof Error ? uploadError_1.message : 'Upload failed';
                    setError(errorMessage);
                    onError === null || onError === void 0 ? void 0 : onError(errorMessage);
                    return [3 /*break*/, 5];
                case 4:
                    setUploading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [files, onUpload, onError, clearFiles]);
    return {
        files: files,
        uploading: uploading,
        progress: progress,
        error: error,
        handleFileSelect: handleFileSelect,
        handleDrop: handleDrop,
        handleDragOver: handleDragOver,
        removeFile: removeFile,
        clearFiles: clearFiles,
        upload: upload
    };
}
