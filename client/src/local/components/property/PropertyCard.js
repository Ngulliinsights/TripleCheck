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
exports.AdaptivePropertyCard = exports.PropertyCard = void 0;
// Import order: external packages first (alphabetically), then internal imports by path depth
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
// Internal imports: deepest paths first, then utilities, types, and UI components
var contexts_1 = require("../../../property/contexts");
var useComponentPerformance_1 = require("../../hooks/useComponentPerformance");
var utils_1 = require("../../lib/utils");
var images_1 = require("../../types/images");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var dialog_1 = require("../ui/dialog");
// Shared hooks and components
var hooks_1 = require("../../hooks");
var shared_1 = require("./shared");
var PropertyImageManager = (0, react_1.memo)(function (_a) {
    var propertyId = _a.propertyId, currentImages = _a.currentImages, onImagesUpdate = _a.onImagesUpdate, onUploadComplete = _a.onUploadComplete, onUploadError = _a.onUploadError, _b = _a.maxImages, maxImages = _b === void 0 ? 10 : _b, _c = _a.allowedDocumentTypes, allowedDocumentTypes = _c === void 0 ? ["property_photo"] : _c;
    var _d = (0, react_1.useState)(null), selectedFiles = _d[0], setSelectedFiles = _d[1];
    var _e = (0, react_1.useState)(false), isUploading = _e[0], setIsUploading = _e[1];
    var _f = (0, react_1.useState)({}), uploadProgress = _f[0], setUploadProgress = _f[1];
    var handleFileChange = (0, react_1.useCallback)(function (event) {
        if (event.target.files) {
            setSelectedFiles(event.target.files);
        }
    }, []);
    var handleUpload = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var files, _loop_1, _i, files_1, file, error_1, uploadError;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!selectedFiles || selectedFiles.length === 0)
                        return [2 /*return*/];
                    setIsUploading(true);
                    files = Array.from(selectedFiles);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    _loop_1 = function (file) {
                        var fileId, _loop_2, progress, imageUrl, updatedImages;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    fileId = "".concat(propertyId, "-").concat(Date.now(), "-").concat(((_a = window.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues(new Uint32Array(1))[0]) || Math.floor(Math.random() * 1000000));
                                    _loop_2 = function (progress) {
                                        return __generator(this, function (_d) {
                                            switch (_d.label) {
                                                case 0:
                                                    setUploadProgress(function (prev) {
                                                        var _a;
                                                        return (__assign(__assign({}, prev), (_a = {}, _a[fileId] = progress, _a)));
                                                    });
                                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                                                case 1:
                                                    _d.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    progress = 0;
                                    _c.label = 1;
                                case 1:
                                    if (!(progress <= 100)) return [3 /*break*/, 4];
                                    return [5 /*yield**/, _loop_2(progress)];
                                case 2:
                                    _c.sent();
                                    _c.label = 3;
                                case 3:
                                    progress += 20;
                                    return [3 /*break*/, 1];
                                case 4:
                                    imageUrl = URL.createObjectURL(file);
                                    updatedImages = __spreadArray(__spreadArray([], currentImages, true), [imageUrl], false);
                                    onImagesUpdate === null || onImagesUpdate === void 0 ? void 0 : onImagesUpdate(updatedImages);
                                    onUploadComplete === null || onUploadComplete === void 0 ? void 0 : onUploadComplete(fileId);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, files_1 = files;
                    _b.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 5];
                    file = files_1[_i];
                    return [5 /*yield**/, _loop_1(file)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    setSelectedFiles(null);
                    setUploadProgress({});
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _b.sent();
                    uploadError = new images_1.ImageProcessingError(error_1 instanceof Error ? error_1.message : "Upload failed", "UPLOAD_ERROR");
                    onUploadError === null || onUploadError === void 0 ? void 0 : onUploadError(uploadError);
                    return [3 /*break*/, 8];
                case 7:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [
        selectedFiles,
        propertyId,
        currentImages,
        onImagesUpdate,
        onUploadComplete,
        onUploadError,
    ]);
    var canUploadMore = currentImages.length < maxImages;
    return (<div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Property Images</h3>
          <badge_1.Badge variant="secondary">
            {currentImages.length} / {maxImages}
          </badge_1.Badge>
        </div>

        {/* Current Images Grid */}
        {currentImages.length > 0 && (<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentImages.map(function (image, index) { return (<div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img src={image} alt={"Property view ".concat(index + 1)} loading="lazy" className="w-full h-full object-cover"/>
                <div className="absolute top-1 right-1">
                  <badge_1.Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </badge_1.Badge>
                </div>
              </div>); })}
          </div>)}

        {/* Upload Section */}
        {canUploadMore && (<div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <lucide_react_1.Upload className="mx-auto h-8 w-8 text-gray-400 mb-2"/>
              <div className="space-y-2">
                <input type="file" multiple accept="image/*" onChange={handleFileChange} title={"Upload ".concat(allowedDocumentTypes.join(", "), " files")} aria-label={"Upload ".concat(allowedDocumentTypes.join(", "), " files")} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {selectedFiles && selectedFiles.length > 0 && (<div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {selectedFiles.length} file(s) selected
                    </p>
                    <button_1.Button onClick={handleUpload} disabled={isUploading} size="sm" className="w-full">
                      {isUploading ? "Uploading..." : "Upload Images"}
                    </button_1.Button>
                  </div>)}
              </div>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (<div className="mt-4 space-y-2">
                {Object.entries(uploadProgress).map(function (_a) {
                    var fileId = _a[0], progress = _a[1];
                    return (<div key={fileId} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={"bg-blue-600 h-2 rounded-full transition-all duration-300 ".concat(getProgressWidthClass(progress))}/>
                    </div>
                  </div>);
                })}
              </div>)}
          </div>)}

        {!canUploadMore && (<div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Maximum number of images reached ({maxImages})
            </p>
          </div>)}
      </div>);
});
PropertyImageManager.displayName = "PropertyImageManager";
// Helper function to get progress width class
var getProgressWidthClass = function (progress) {
    if (progress >= 100)
        return "w-full";
    if (progress >= 75)
        return "w-3/4";
    if (progress >= 50)
        return "w-1/2";
    if (progress >= 25)
        return "w-1/4";
    if (progress > 0)
        return "w-1/12";
    return "w-0";
};
// Old PropertyImageSection component removed - now using shared component from ./shared
/**
 * Unified PropertyCard component with comprehensive type safety and performance optimization
 *
 * This component demonstrates several important React and TypeScript patterns:
 *
 * 1. Proper import organization following ESLint rules
 * 2. Type-safe optional property handling with exactOptionalPropertyTypes
 * 3. Performance optimization through memoization and conditional rendering
 * 4. Accessible design with proper ARIA labels and keyboard navigation
 * 5. Robust error handling for potentially missing data
 *
 * The component works with normalized property data and gracefully handles
 * missing or malformed information while maintaining full functionality.
 *
 * ViewMode options:
 * - "grid": Standard grid layout with full quick actions
 * - "list": Horizontal list layout with full quick actions
 * - "adaptive": Simplified grid layout without quick actions (replaces AdaptivePropertyCard)
 */
exports.PropertyCard = (0, react_1.memo)(function (_a) {
    var property = _a.property, _b = _a.className, className = _b === void 0 ? "" : _b, onClick = _a.onClick, _c = _a.viewMode, viewMode = _c === void 0 ? "grid" : _c, _d = _a.showQuickActions, showQuickActions = _d === void 0 ? true : _d, _e = _a.isInWishlist, isInWishlist = _e === void 0 ? false : _e, onSave = _a.onSave, onShare = _a.onShare, _f = _a.priority, priority = _f === void 0 ? false : _f, _g = _a.enableImageManagement, enableImageManagement = _g === void 0 ? false : _g, onImagesUpdate = _a.onImagesUpdate, onImageUploadComplete = _a.onImageUploadComplete, onImageUploadError = _a.onImageUploadError, _h = _a.maxImages, maxImages = _h === void 0 ? 10 : _h, _j = _a.allowedDocumentTypes, allowedDocumentTypes = _j === void 0 ? ["property_photo"] : _j;
    // Performance monitoring
    (0, useComponentPerformance_1.usePerformanceMonitor)({ componentName: "PropertyCard" });
    // Handle adaptive mode by defaulting to grid behavior with simplified quick actions
    var effectiveViewMode = viewMode === "adaptive" ? "grid" : viewMode;
    var effectiveShowQuickActions = viewMode === "adaptive" ? false : showQuickActions;
    // Shared hooks for consistent behavior
    var gallery = (0, hooks_1.useImageGallery)({
        property: property,
        images: property.images || [],
        enableNavigation: true,
        enableFullscreen: true,
    });
    var actions = (0, hooks_1.usePropertyCardActions)(property, __assign(__assign(__assign({}, (onSave && { onSave: onSave })), (onShare && { onShare: onShare })), (onClick && { onClick: onClick })));
    var _k = (0, hooks_1.usePropertyFormatting)(property, {
        showUSDConversion: true,
        exchangeRate: 130,
    }), formattedPrice = _k.formattedPrice, locationString = _k.locationString, displayTitle = _k.displayTitle, displayDescription = _k.displayDescription;
    var _l = (0, hooks_1.usePropertyCardState)(), isHovered = _l.isHovered, handleMouseEnter = _l.handleMouseEnter, handleMouseLeave = _l.handleMouseLeave, handleKeyDown = _l.handleKeyDown;
    // Context integration for compare functionality using unified PropertyContext
    var _m = (0, contexts_1.usePropertyCompare)(), selectedProperties = _m.selectedProperties, canAddMore = _m.canAddMore;
    var _o = (0, contexts_1.usePropertyCompareActions)(), addToCompare = _o.addToCompare, removeFromCompare = _o.removeFromCompare;
    var propertyId = String(property.id);
    var isInCompare = selectedProperties.some(function (p) { return p.id === propertyId; });
    // Compare actions using shared hook
    var compareActions = (0, hooks_1.usePropertyCompareActions)({
        property: property,
        isInCompare: isInCompare,
        canAddMore: canAddMore,
        addToCompare: addToCompare,
        removeFromCompare: removeFromCompare,
        locationString: locationString,
    });
    // Image management state
    var _p = (0, react_1.useState)(false), isImageManagerOpen = _p[0], setIsImageManagerOpen = _p[1];
    var _q = (0, react_1.useState)(property.images || []), currentImages = _q[0], setCurrentImages = _q[1];
    // Image management handlers
    var handleOpenImageManager = (0, react_1.useCallback)(function (event) {
        event.stopPropagation();
        setIsImageManagerOpen(true);
    }, []);
    var handleImagesUpdate = (0, react_1.useCallback)(function (images) {
        setCurrentImages(images);
        onImagesUpdate === null || onImagesUpdate === void 0 ? void 0 : onImagesUpdate(propertyId, images);
    }, [propertyId, onImagesUpdate]);
    var handleImageUploadComplete = (0, react_1.useCallback)(function (imageId) {
        onImageUploadComplete === null || onImageUploadComplete === void 0 ? void 0 : onImageUploadComplete(propertyId, imageId);
    }, [propertyId, onImageUploadComplete]);
    var handleImageUploadError = (0, react_1.useCallback)(function (error) {
        onImageUploadError === null || onImageUploadError === void 0 ? void 0 : onImageUploadError(propertyId, error);
    }, [propertyId, onImageUploadError]);
    var isInteractive = Boolean(onClick);
    return (<card_1.Card className={(0, utils_1.cn)("property-card overflow-hidden transition-all duration-300 group", effectiveViewMode === "grid" ?
            "property-card--grid-mode"
            : "property-card--list-mode flex flex-row", isInteractive &&
            "cursor-pointer hover:shadow-lg hover:-translate-y-1", className)} onClick={isInteractive ? actions.handleCardClick : undefined} role={isInteractive ? "button" : undefined} tabIndex={isInteractive ? 0 : undefined} onKeyDown={isInteractive ?
            function (e) { return handleKeyDown(e, function () { return onClick === null || onClick === void 0 ? void 0 : onClick(property); }); }
            : undefined} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} aria-label={isInteractive ? "View property ".concat(displayTitle) : undefined}>
        <shared_1.PropertyImageSection property={property} gallery={gallery} actions={actions} isHovered={isHovered} showQuickActions={effectiveShowQuickActions} isInWishlist={isInWishlist} priority={priority} isInCompare={isInCompare} canAddMore={canAddMore} onCompareClick={compareActions.handleCompareClick} showVerificationBadge={true} showTrustScore={true} showImageCount={true}/>

        <card_1.CardContent className="p-4 space-y-3 flex-1">
          {/* Property title with interactive styling */}
          <h3 className={(0, utils_1.cn)("font-semibold text-lg leading-tight line-clamp-2", isInteractive && "group-hover:text-primary transition-colors")}>
            {displayTitle}
          </h3>

          {/* Use shared PropertyFeatures component */}
          <shared_1.PropertyFeatures property={property} locationString={locationString} variant="compact"/>

          {/* Property description with text truncation for consistent layout */}
          {displayDescription && (<p className="text-gray-600 text-sm line-clamp-2">
              {displayDescription}
            </p>)}

          {/* Price display and trust metrics */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xl font-bold text-primary" aria-label={"Price: ".concat(formattedPrice.primary)}>
              {formattedPrice.primary}
            </p>

            {/* Secondary price and trust score */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {formattedPrice.secondary && (<span>{formattedPrice.secondary}</span>)}
              {property.trustScore &&
            typeof property.trustScore === "number" && (<div className="flex items-center">
                    <lucide_react_1.Star className="w-3 h-3 mr-1 fill-current text-yellow-500"/>
                    <span>{property.trustScore}%</span>
                  </div>)}
            </div>
          </div>
        </card_1.CardContent>

        {/* Image Management Dialog */}
        {enableImageManagement && (<dialog_1.Dialog open={isImageManagerOpen} onOpenChange={setIsImageManagerOpen}>
            <dialog_1.DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <dialog_1.DialogHeader>
                <dialog_1.DialogTitle>
                  Manage Property Images - {property.title}
                </dialog_1.DialogTitle>
              </dialog_1.DialogHeader>
              <PropertyImageManager propertyId={propertyId} currentImages={currentImages} onImagesUpdate={handleImagesUpdate} onUploadComplete={handleImageUploadComplete} onUploadError={handleImageUploadError} maxImages={maxImages} allowedDocumentTypes={allowedDocumentTypes}/>
            </dialog_1.DialogContent>
          </dialog_1.Dialog>)}
      </card_1.Card>);
});
exports.PropertyCard.displayName = "PropertyCard";
/**
 * AdaptivePropertyCard - Backward compatibility alias
 *
 * This is now handled by PropertyCard with viewMode="adaptive"
 * Provides the same simplified interface without quick actions
 */
exports.AdaptivePropertyCard = (0, react_1.memo)(function (_a) {
    var property = _a.property, onClick = _a.onClick, _b = _a.className, className = _b === void 0 ? "" : _b;
    return (<exports.PropertyCard property={property} onClick={onClick} className={className} viewMode="adaptive"/>);
});
exports.AdaptivePropertyCard.displayName = "AdaptivePropertyCard";
exports.default = exports.PropertyCard;
