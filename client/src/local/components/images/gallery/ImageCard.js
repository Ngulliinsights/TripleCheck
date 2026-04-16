"use strict";
/**
 * Image Card Component
 * Displays individual images in grid or list view
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCard = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var ImageEngine_1 = require("./ImageEngine");
var utils_1 = require("./utils");
exports.ImageCard = (0, react_1.memo)(function (_a) {
    var image = _a.image, index = _a.index, viewMode = _a.viewMode, isSelected = _a.isSelected, enableSelection = _a.enableSelection, enableCollaboration = _a.enableCollaboration, enableWatermark = _a.enableWatermark, watermarkConfig = _a.watermarkConfig, userRole = _a.userRole, onToggleSelection = _a.onToggleSelection, onImageClick = _a.onImageClick, onImageUpdate = _a.onImageUpdate;
    var _b = (0, react_1.useState)(false), imageError = _b[0], setImageError = _b[1];
    var handleClick = (0, react_1.useCallback)(function () {
        onImageClick(index);
    }, [index, onImageClick]);
    var handleSelectionToggle = (0, react_1.useCallback)(function (e) {
        e.stopPropagation();
        onToggleSelection(image.id);
    }, [image.id, onToggleSelection]);
    var handleRatingChange = (0, react_1.useCallback)(function (rating) {
        if ((0, utils_1.isAdvancedImage)(image) && onImageUpdate) {
            onImageUpdate(image.id, { rating: rating });
        }
    }, [image, onImageUpdate]);
    var renderGridView = function () { return (<div className={"relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all ".concat(isSelected ? "ring-4 ring-blue-500" : "")} onClick={handleClick}>
        {enableSelection && (<div className="absolute top-2 left-2 z-10" onClick={handleSelectionToggle}>
            <div className={"w-6 h-6 rounded border-2 flex items-center justify-center ".concat(isSelected
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300")}>
              {isSelected && <lucide_react_1.Check className="w-4 h-4 text-white"/>}
            </div>
          </div>)}

        <div className="aspect-square bg-gray-100">
          {imageError ? (<div className="w-full h-full flex items-center justify-center text-gray-400">
              <lucide_react_1.AlertCircle className="w-12 h-12"/>
            </div>) : (<ImageEngine_1.ImageEngine image={image} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} className="w-full h-full object-cover" onError={function () { return setImageError(true); }}/>)}
        </div>

        {/* Overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-sm font-medium truncate">{image.alt || "Untitled"}</p>
            {(0, utils_1.isAdvancedImage)(image) && (<div className="flex items-center gap-2 mt-1 text-xs">
                {image.rating !== undefined && (<div className="flex items-center gap-1">
                    <lucide_react_1.Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
                    <span>{image.rating.toFixed(1)}</span>
                  </div>)}
                {image.usage !== undefined && (<div className="flex items-center gap-1">
                    <lucide_react_1.Eye className="w-3 h-3"/>
                    <span>{image.usage}</span>
                  </div>)}
              </div>)}
          </div>
        </div>

        {/* Status badge */}
        {image.status && image.status !== "completed" && (<div className="absolute top-2 right-2">
            <span className={"px-2 py-1 text-xs rounded-full ".concat(image.status === "uploading"
                ? "bg-blue-500 text-white"
                : image.status === "error"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white")}>
              {image.status}
            </span>
          </div>)}

        {/* Approval status for advanced images */}
        {(0, utils_1.isAdvancedImage)(image) && enableCollaboration && (<div className="absolute top-2 right-2">
            <span className={"px-2 py-1 text-xs rounded-full ".concat(image.approvalStatus === "approved"
                ? "bg-green-500 text-white"
                : image.approvalStatus === "rejected"
                    ? "bg-red-500 text-white"
                    : image.approvalStatus === "needs_revision"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-500 text-white")}>
              {image.approvalStatus}
            </span>
          </div>)}
      </div>); };
    var renderListView = function () { return (<div className={"flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ".concat(isSelected ? "bg-blue-50 ring-2 ring-blue-500" : "bg-white")} onClick={handleClick}>
        {enableSelection && (<div onClick={handleSelectionToggle}>
            <div className={"w-5 h-5 rounded border-2 flex items-center justify-center ".concat(isSelected
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300")}>
              {isSelected && <lucide_react_1.Check className="w-3 h-3 text-white"/>}
            </div>
          </div>)}

        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
          {imageError ? (<div className="w-full h-full flex items-center justify-center text-gray-400">
              <lucide_react_1.AlertCircle className="w-6 h-6"/>
            </div>) : (<ImageEngine_1.ImageEngine image={image} enableWatermark={false} className="w-full h-full object-cover" onError={function () { return setImageError(true); }}/>)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{image.alt || "Untitled"}</p>
          {(0, utils_1.isAdvancedImage)(image) && (<div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {image.uploadDate && (<div className="flex items-center gap-1">
                  <lucide_react_1.Calendar className="w-3 h-3"/>
                  <span>{new Date(image.uploadDate).toLocaleDateString()}</span>
                </div>)}
              {image.fileSize && (<div className="flex items-center gap-1">
                  <lucide_react_1.FileImage className="w-3 h-3"/>
                  <span>{(image.fileSize / 1024).toFixed(0)} KB</span>
                </div>)}
              {image.rating !== undefined && (<div className="flex items-center gap-1">
                  <lucide_react_1.Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
                  <span>{image.rating.toFixed(1)}</span>
                </div>)}
            </div>)}
        </div>

        {(0, utils_1.isAdvancedImage)(image) && enableCollaboration && (<div>
            <span className={"px-2 py-1 text-xs rounded-full ".concat(image.approvalStatus === "approved"
                ? "bg-green-100 text-green-800"
                : image.approvalStatus === "rejected"
                    ? "bg-red-100 text-red-800"
                    : image.approvalStatus === "needs_revision"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800")}>
              {image.approvalStatus}
            </span>
          </div>)}
      </div>); };
    return viewMode === "list" ? renderListView() : renderGridView();
});
exports.ImageCard.displayName = "ImageCard";
