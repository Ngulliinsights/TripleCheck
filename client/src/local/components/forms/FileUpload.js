"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = FileUpload;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var useFormValidation_1 = require("../../hooks/useFormValidation");
var utils_1 = require("../../lib/utils");
var button_1 = require("../ui/button");
var progress_1 = require("../ui/progress");
function FileUpload(_a) {
    var name = _a.name, _b = _a.label, label = _b === void 0 ? 'Upload Files' : _b, _c = _a.accept, accept = _c === void 0 ? 'image/*,application/pdf' : _c, _d = _a.multiple, multiple = _d === void 0 ? false : _d, _e = _a.maxSize, maxSize = _e === void 0 ? 10 * 1024 * 1024 : _e, // 10MB
    _f = _a.maxFiles, // 10MB
    maxFiles = _f === void 0 ? 5 : _f, _g = _a.disabled, disabled = _g === void 0 ? false : _g, error = _a.error, _h = _a.touched, touched = _h === void 0 ? false : _h, onFilesChange = _a.onFilesChange, onError = _a.onError, className = _a.className, _j = _a.required, required = _j === void 0 ? false : _j, props = __rest(_a, ["name", "label", "accept", "multiple", "maxSize", "maxFiles", "disabled", "error", "touched", "onFilesChange", "onError", "className", "required"]);
    var fileInputRef = (0, react_1.useRef)(null);
    var _k = (0, react_1.useState)(false), dragActive = _k[0], setDragActive = _k[1];
    var _l = (0, useFormValidation_1.useFileUpload)({
        maxSize: maxSize,
        allowedTypes: accept.split(',').map(function (type) { return type.trim(); }),
        multiple: multiple,
        onError: function (err) {
            onError === null || onError === void 0 ? void 0 : onError(err);
        }
    }), files = _l.files, uploading = _l.uploading, progress = _l.progress, uploadError = _l.error, handleFileSelect = _l.handleFileSelect, handleDrop = _l.handleDrop, handleDragOver = _l.handleDragOver, removeFile = _l.removeFile, clearFiles = _l.clearFiles;
    // Notify parent of file changes
    react_1.default.useEffect(function () {
        onFilesChange === null || onFilesChange === void 0 ? void 0 : onFilesChange(files);
    }, [files, onFilesChange]);
    var handleDragEnter = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setDragActive(true);
        }
    }, [disabled]);
    var handleDragLeave = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);
    var handleDropWithState = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (!disabled) {
            handleDrop(e);
        }
    }, [disabled, handleDrop]);
    var openFileDialog = (0, react_1.useCallback)(function () {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(2)), " ").concat(sizes[i]);
    };
    var getFileIcon = function (file) {
        if (file.type.startsWith('image/')) {
            return <lucide_react_1.Image className="w-4 h-4"/>;
        }
        return <lucide_react_1.FileText className="w-4 h-4"/>;
    };
    var hasError = touched && (!!error || !!uploadError);
    var errorMessage = error || uploadError;
    return (<div className={(0, utils_1.cn)('space-y-4', className)}>
      {label && (<label className={(0, utils_1.cn)('block text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
          {label}
        </label>)}

      {/* Drop Zone */}
      <div className={(0, utils_1.cn)('relative border-2 border-dashed rounded-lg p-6 transition-colors', dragActive && !disabled && 'border-primary bg-primary/5', !dragActive && !disabled && 'border-gray-300 hover:border-gray-400', disabled && 'border-gray-200 bg-gray-50 cursor-not-allowed', hasError && 'border-red-300 bg-red-50')} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDropWithState}>
        <input ref={fileInputRef} type="file" name={name} accept={accept} multiple={multiple} disabled={disabled} onChange={handleFileSelect} className="hidden" aria-describedby={hasError ? "".concat(name, "-error") : undefined} {...props}/>

        <div className="text-center">
          <lucide_react_1.Upload className={(0, utils_1.cn)('mx-auto h-12 w-12 mb-4', disabled ? 'text-gray-400' : 'text-gray-500')}/>
          
          <div className="space-y-2">
            <p className={(0, utils_1.cn)('text-sm', disabled ? 'text-gray-400' : 'text-gray-600')}>
              {dragActive ? 'Drop files here' : 'Drag and drop files here, or'}
            </p>
            
            <button_1.Button type="button" variant="outline" size="sm" onClick={openFileDialog} disabled={disabled}>
              Browse Files
            </button_1.Button>
          </div>

          <div className={(0, utils_1.cn)('mt-2 text-xs', disabled ? 'text-gray-400' : 'text-gray-500')}>
            <p>
              {accept.includes('image') && 'Images, '}
              {accept.includes('pdf') && 'PDF, '}
              up to {formatFileSize(maxSize)} each
            </p>
            {multiple && <p>Maximum {maxFiles} files</p>}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (<div className="space-y-2">
          <h4 className="text-sm font-medium">
            Selected Files ({files.length}{multiple ? "/".concat(maxFiles) : ''})
          </h4>
          
          <div className="space-y-2">
            {files.map(function (file, index) { return (<div key={"".concat(file.name, "-").concat(index)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploading && (<div className="flex items-center space-x-2">
                      <progress_1.Progress value={progress} className="w-16 h-2"/>
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>)}
                  
                  {!uploading && (<button_1.Button type="button" variant="ghost" size="sm" onClick={function () { return removeFile(index); }} disabled={disabled} className="h-8 w-8 p-0 text-gray-500 hover:text-red-500" aria-label={"Remove ".concat(file.name)}>
                      <lucide_react_1.X className="h-4 w-4"/>
                    </button_1.Button>)}
                </div>
              </div>); })}
          </div>

          {files.length > 0 && !uploading && (<div className="flex justify-between items-center pt-2">
              <button_1.Button type="button" variant="outline" size="sm" onClick={clearFiles} disabled={disabled}>
                Clear All
              </button_1.Button>
              
              <div className="text-xs text-gray-500">
                Total: {formatFileSize(files.reduce(function (sum, file) { return sum + file.size; }, 0))}
              </div>
            </div>)}
        </div>)}

      {/* Error Message */}
      {hasError && (<div id={"".concat(name, "-error")} className="flex items-center space-x-2 text-sm text-red-600" role="alert" aria-live="polite">
          <lucide_react_1.AlertCircle className="h-4 w-4"/>
          <span>{errorMessage}</span>
        </div>)}

      {/* Success Message */}
      {files.length > 0 && !hasError && !uploading && (<div className="flex items-center space-x-2 text-sm text-green-600">
          <lucide_react_1.CheckCircle className="h-4 w-4"/>
          <span>
            {files.length} file{files.length !== 1 ? 's' : ''} ready for upload
          </span>
        </div>)}
    </div>);
}
exports.default = FileUpload;
