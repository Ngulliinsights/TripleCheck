"use strict";
/**
 * Main Image Gallery Component
 * Refactored to use modular architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var SimpleGallery_1 = require("./SimpleGallery");
var AdvancedGallery_1 = require("./AdvancedGallery");
var ImageGallery = function (props) {
    var images = props.images, _a = props.className, className = _a === void 0 ? "" : _a, _b = props.showImageCounter, showImageCounter = _b === void 0 ? false : _b, _c = props.wrapInCard, wrapInCard = _c === void 0 ? false : _c, _d = props.enableSearch, enableSearch = _d === void 0 ? false : _d, _e = props.enableFullscreen, enableFullscreen = _e === void 0 ? false : _e, _f = props.enableCollaboration, enableCollaboration = _f === void 0 ? false : _f, _g = props.enableWatermark, enableWatermark = _g === void 0 ? false : _g, watermarkConfig = props.watermarkConfig, _h = props.userRole, userRole = _h === void 0 ? "viewer" : _h, onImageClick = props.onImageClick, onBatchOperation = props.onBatchOperation, onImageUpload = props.onImageUpload, onImageUpdate = props.onImageUpdate, onCommentAdd = props.onCommentAdd, onAnnotationAdd = props.onAnnotationAdd;
    var handleSimpleImageClick = (0, react_1.useCallback)(function (index) {
        if (index >= 0 && index < images.length) {
            var image = images[index];
            if (image) {
                onImageClick === null || onImageClick === void 0 ? void 0 : onImageClick(image, index);
            }
        }
    }, [images, onImageClick]);
    // Use simple gallery for basic use cases
    if (!enableSearch && !enableFullscreen && !enableCollaboration) {
        return (<SimpleGallery_1.SimpleGallery images={images} className={className} showImageCounter={showImageCounter} wrapInCard={wrapInCard} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} userRole={userRole} onImageClick={handleSimpleImageClick} onImageUpdate={onImageUpdate}/>);
    }
    // Use advanced gallery for feature-rich use cases
    return (<AdvancedGallery_1.AdvancedGallery images={images} className={className} showImageCounter={showImageCounter} enableSearch={enableSearch} enableFullscreen={enableFullscreen} enableCollaboration={enableCollaboration} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} userRole={userRole} onImageClick={onImageClick} onBatchOperation={onBatchOperation} onImageUpload={onImageUpload} onImageUpdate={onImageUpdate} onCommentAdd={onCommentAdd} onAnnotationAdd={onAnnotationAdd}/>);
};
exports.default = ImageGallery;
