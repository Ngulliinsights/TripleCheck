"use strict";
/**
 * Image Engine Component
 * Handles image rendering with watermark and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageEngine = void 0;
var react_1 = require("react");
var LazyImage_1 = require("./LazyImage");
var ValidationService_1 = require("./ValidationService");
exports.ImageEngine = (0, react_1.memo)(function (_a) {
    var image = _a.image, enableWatermark = _a.enableWatermark, watermarkConfig = _a.watermarkConfig, className = _a.className, onError = _a.onError;
    var _b = (0, react_1.useState)("pending"), validationStatus = _b[0], setValidationStatus = _b[1];
    var _c = (0, react_1.useState)(""), imageSrc = _c[0], setImageSrc = _c[1];
    (0, react_1.useEffect)(function () {
        // Determine image source
        if (image.preview) {
            setImageSrc(image.preview);
        }
        else if (image.src) {
            setImageSrc(image.src);
        }
        else if (image.file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var _a;
                if ((_a = e.target) === null || _a === void 0 ? void 0 : _a.result) {
                    setImageSrc(e.target.result);
                }
            };
            reader.readAsDataURL(image.file);
        }
    }, [image]);
    (0, react_1.useEffect)(function () {
        // Validate image if URL is available
        if (image.src) {
            var validator = new ValidationService_1.ImageValidationService();
            validator
                .validateUrl(image.src)
                .then(function (result) {
                setValidationStatus(result.isValid ? "valid" : "invalid");
            })
                .catch(function () {
                setValidationStatus("invalid");
            });
        }
    }, [image.src]);
    var handleError = (0, react_1.useCallback)(function () {
        setValidationStatus("invalid");
        onError === null || onError === void 0 ? void 0 : onError();
    }, [onError]);
    if (!imageSrc) {
        return (<div className={"bg-gray-200 animate-pulse ".concat(className)}>
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Loading...
          </div>
        </div>);
    }
    return (<div className="relative w-full h-full">
        <LazyImage_1.LazyImage src={imageSrc} alt={image.alt || "Image"} className={className} onError={handleError}/>

        {/* Watermark overlay */}
        {enableWatermark && watermarkConfig && (<div className={"absolute pointer-events-none ".concat(getWatermarkPositionClass(watermarkConfig.position))} style={{
                opacity: watermarkConfig.opacity,
                fontSize: watermarkConfig.fontSize || 14,
                color: watermarkConfig.color || "white",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
            }}>
            {watermarkConfig.text}
          </div>)}

        {/* Validation indicator */}
        {validationStatus === "invalid" && (<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Invalid
          </div>)}
      </div>);
});
exports.ImageEngine.displayName = "ImageEngine";
var getWatermarkPositionClass = function (position) {
    switch (position) {
        case "top-left":
            return "top-2 left-2";
        case "top-right":
            return "top-2 right-2";
        case "bottom-left":
            return "bottom-2 left-2";
        case "bottom-right":
            return "bottom-2 right-2";
        case "center":
            return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
        default:
            return "bottom-2 right-2";
    }
};
