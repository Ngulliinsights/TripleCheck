"use strict";
/**
 * Lazy loading image component for performance optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyImage = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
exports.LazyImage = (0, react_1.memo)(function (_a) {
    var src = _a.src, alt = _a.alt, className = _a.className, onLoad = _a.onLoad, onError = _a.onError;
    var _b = (0, react_1.useState)(false), isLoaded = _b[0], setIsLoaded = _b[1];
    var _c = (0, react_1.useState)(false), hasError = _c[0], setHasError = _c[1];
    var imgRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var img = imgRef.current;
        if (!img)
            return;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var image = entry.target;
                    if (image.dataset.src) {
                        image.src = image.dataset.src;
                        image.removeAttribute("data-src");
                        observer.unobserve(image);
                    }
                }
            });
        }, { threshold: 0.1 });
        observer.observe(img);
        return function () { return observer.disconnect(); };
    }, []);
    var handleLoad = (0, react_1.useCallback)(function () {
        setIsLoaded(true);
        onLoad === null || onLoad === void 0 ? void 0 : onLoad();
    }, [onLoad]);
    var handleError = (0, react_1.useCallback)(function () {
        setHasError(true);
        onError === null || onError === void 0 ? void 0 : onError();
    }, [onError]);
    return (<div className="relative">
        {!isLoaded && !hasError && (<div className="absolute inset-0 bg-gray-200 animate-pulse rounded"/>)}
        {hasError ? (<div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <lucide_react_1.FileImage className="w-8 h-8"/>
          </div>) : (<img ref={imgRef} data-src={src} alt={alt} className={className} onLoad={handleLoad} onError={handleError} loading="lazy"/>)}
      </div>);
});
exports.LazyImage.displayName = "LazyImage";
