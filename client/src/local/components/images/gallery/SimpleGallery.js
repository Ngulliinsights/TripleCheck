"use strict";
/**
 * Simple Gallery Component
 * Basic image gallery without advanced features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleGallery = void 0;
var react_1 = require("react");
var constants_1 = require("./constants");
var ImageCard_1 = require("./ImageCard");
exports.SimpleGallery = (0, react_1.memo)(function (_a) {
    var images = _a.images, className = _a.className, showImageCounter = _a.showImageCounter, wrapInCard = _a.wrapInCard, enableWatermark = _a.enableWatermark, watermarkConfig = _a.watermarkConfig, userRole = _a.userRole, onImageClick = _a.onImageClick, onImageUpdate = _a.onImageUpdate;
    if (images.length === 0) {
        return (<div className={"text-center p-8 bg-gray-50 rounded-lg ".concat(className)}>
          <div className="text-gray-400 text-4xl mb-2">📷</div>
          <p className="text-gray-500">No images available</p>
        </div>);
    }
    var content = (<div className={constants_1.VIEW_MODES.grid.gridClass}>
        {images.map(function (image, index) { return (<ImageCard_1.ImageCard key={image.id} image={image} index={index} viewMode="grid" isSelected={false} enableSelection={false} enableCollaboration={false} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} userRole={userRole} onToggleSelection={function () { }} onImageClick={onImageClick} onImageUpdate={onImageUpdate}/>); })}
      </div>);
    if (wrapInCard) {
        return (<div className={"bg-white rounded-lg shadow-md p-6 ".concat(className)}>
          {showImageCounter && (<div className="mb-4 text-sm text-gray-600">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </div>)}
          {content}
        </div>);
    }
    return <div className={className}>{content}</div>;
});
exports.SimpleGallery.displayName = "SimpleGallery";
