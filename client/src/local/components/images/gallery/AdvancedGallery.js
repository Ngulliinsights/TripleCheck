"use strict";
/**
 * Advanced Gallery Component
 * Feature-rich gallery with search, collaboration, and batch operations
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
exports.AdvancedGallery = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var constants_1 = require("./constants");
var useImageSearch_1 = require("./useImageSearch");
var SearchInterface_1 = require("./SearchInterface");
var ImageCard_1 = require("./ImageCard");
var BatchOperationsToolbar_1 = require("./BatchOperationsToolbar");
var Lightbox_1 = require("./Lightbox");
exports.AdvancedGallery = (0, react_1.memo)(function (_a) {
    var images = _a.images, _b = _a.className, className = _b === void 0 ? "" : _b, _c = _a.showImageCounter, showImageCounter = _c === void 0 ? false : _c, _d = _a.enableSearch, enableSearch = _d === void 0 ? true : _d, _e = _a.enableFullscreen, enableFullscreen = _e === void 0 ? true : _e, _f = _a.enableCollaboration, enableCollaboration = _f === void 0 ? false : _f, _g = _a.enableWatermark, enableWatermark = _g === void 0 ? false : _g, watermarkConfig = _a.watermarkConfig, _h = _a.userRole, userRole = _h === void 0 ? "viewer" : _h, onImageClick = _a.onImageClick, onBatchOperation = _a.onBatchOperation, onImageUpload = _a.onImageUpload, onImageUpdate = _a.onImageUpdate, onCommentAdd = _a.onCommentAdd, onAnnotationAdd = _a.onAnnotationAdd;
    // Search and filtering state
    var _j = (0, react_1.useState)(""), query = _j[0], setQuery = _j[1];
    var _k = (0, react_1.useState)({
        categories: [],
        approvalStatus: [],
        tags: [],
        users: [],
        collections: [],
    }), selectedFacets = _k[0], setSelectedFacets = _k[1];
    var _l = (0, react_1.useState)("date"), sortMode = _l[0], setSortMode = _l[1];
    var _m = (0, react_1.useState)(false), sortAscending = _m[0], setSortAscending = _m[1];
    var _o = (0, react_1.useState)(false), showFacets = _o[0], setShowFacets = _o[1];
    // View state
    var _p = (0, react_1.useState)("grid"), viewMode = _p[0], setViewMode = _p[1];
    var _q = (0, react_1.useState)(new Set()), selectedImages = _q[0], setSelectedImages = _q[1];
    // Lightbox state
    var _r = (0, react_1.useState)(false), lightboxOpen = _r[0], setLightboxOpen = _r[1];
    var _s = (0, react_1.useState)(0), lightboxIndex = _s[0], setLightboxIndex = _s[1];
    // Search and filter images
    var _t = (0, useImageSearch_1.useImageSearch)(images, query, selectedFacets, sortMode, sortAscending), filtered = _t.filtered, facets = _t.facets, total = _t.total;
    // Facet toggle handler
    var handleFacetToggle = (0, react_1.useCallback)(function (facetType, value) {
        setSelectedFacets(function (prev) {
            var _a;
            var current = prev[facetType];
            var updated = current.includes(value)
                ? current.filter(function (v) { return v !== value; })
                : __spreadArray(__spreadArray([], current, true), [value], false);
            return __assign(__assign({}, prev), (_a = {}, _a[facetType] = updated, _a));
        });
    }, []);
    // Selection handlers
    var handleToggleSelection = (0, react_1.useCallback)(function (id) {
        setSelectedImages(function (prev) {
            var next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            return next;
        });
    }, []);
    var handleClearSelection = (0, react_1.useCallback)(function () {
        setSelectedImages(new Set());
    }, []);
    var handleSelectAll = (0, react_1.useCallback)(function () {
        setSelectedImages(new Set(filtered.map(function (img) { return img.id; })));
    }, [filtered]);
    // Batch operation handler
    var handleBatchOperation = (0, react_1.useCallback)(function (operation) {
        var selectedIds = Array.from(selectedImages);
        onBatchOperation === null || onBatchOperation === void 0 ? void 0 : onBatchOperation(operation, selectedIds);
        setSelectedImages(new Set());
    }, [selectedImages, onBatchOperation]);
    // Image click handler
    var handleImageClick = (0, react_1.useCallback)(function (index) {
        if (enableFullscreen) {
            setLightboxIndex(index);
            setLightboxOpen(true);
        }
        var image = filtered[index];
        if (image) {
            onImageClick === null || onImageClick === void 0 ? void 0 : onImageClick(image, index);
        }
    }, [filtered, enableFullscreen, onImageClick]);
    // File upload handler
    var handleFileUpload = (0, react_1.useCallback)(function (e) {
        var files = e.target.files;
        if (files && onImageUpload) {
            onImageUpload(files);
        }
    }, [onImageUpload]);
    // Keyboard shortcuts
    var handleKeyDown = (0, react_1.useCallback)(function (e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === "a") {
                e.preventDefault();
                handleSelectAll();
            }
        }
    }, [handleSelectAll]);
    react_1.default.useEffect(function () {
        window.addEventListener("keydown", handleKeyDown);
        return function () { return window.removeEventListener("keydown", handleKeyDown); };
    }, [handleKeyDown]);
    if (images.length === 0) {
        return (<div className={"text-center p-12 bg-gray-50 rounded-lg ".concat(className)}>
          <div className="text-gray-400 text-5xl mb-4">📷</div>
          <p className="text-gray-500 text-lg mb-4">No images available</p>
          {onImageUpload && (userRole === "editor" || userRole === "admin") && (<label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
              <lucide_react_1.Upload className="w-5 h-5"/>
              <span>Upload Images</span>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden"/>
            </label>)}
        </div>);
    }
    return (<div className={"space-y-6 ".concat(className)}>
        {/* Search interface */}
        {enableSearch && (<SearchInterface_1.SearchInterface query={query} onQueryChange={setQuery} facets={facets} selectedFacets={selectedFacets} onFacetToggle={handleFacetToggle} sortMode={sortMode} onSortChange={setSortMode} sortAscending={sortAscending} onSortDirectionToggle={function () { return setSortAscending(function (prev) { return !prev; }); }} viewMode={viewMode} onViewModeChange={setViewMode} showFacets={showFacets} onToggleFacets={function () { return setShowFacets(function (prev) { return !prev; }); }}/>)}

        {/* Header with counter and upload */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showImageCounter && (<div className="text-sm text-gray-600">
                {total} image{total !== 1 ? "s" : ""}
                {total !== images.length && " (".concat(images.length, " total)")}
              </div>)}
            {selectedImages.size > 0 && (<button onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-700">
                Select all {filtered.length}
              </button>)}
          </div>

          {onImageUpload && (userRole === "editor" || userRole === "admin") && (<label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
              <lucide_react_1.Upload className="w-4 h-4"/>
              <span>Upload</span>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden"/>
            </label>)}
        </div>

        {/* Image grid */}
        {filtered.length === 0 ? (<div className="text-center p-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No images match your filters</p>
          </div>) : (<div className={constants_1.VIEW_MODES[viewMode].gridClass}>
            {filtered.map(function (image, index) { return (<ImageCard_1.ImageCard key={image.id} image={image} index={index} viewMode={viewMode} isSelected={selectedImages.has(image.id)} enableSelection={true} enableCollaboration={enableCollaboration} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} userRole={userRole} onToggleSelection={handleToggleSelection} onImageClick={handleImageClick} onImageUpdate={onImageUpdate}/>); })}
          </div>)}

        {/* Batch operations toolbar */}
        {onBatchOperation && (<BatchOperationsToolbar_1.BatchOperationsToolbar selectedCount={selectedImages.size} onClearSelection={handleClearSelection} onBatchOperation={handleBatchOperation} userRole={userRole}/>)}

        {/* Lightbox */}
        {enableFullscreen && (<Lightbox_1.Lightbox images={filtered} currentIndex={lightboxIndex} isOpen={lightboxOpen} onClose={function () { return setLightboxOpen(false); }} onNavigate={setLightboxIndex} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} enableCollaboration={enableCollaboration} userRole={userRole} onCommentAdd={onCommentAdd}/>)}
      </div>);
});
exports.AdvancedGallery.displayName = "AdvancedGallery";
