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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedImageShowcase = EnhancedImageShowcase;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_zoom_pan_pinch_1 = require("react-zoom-pan-pinch");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var utils_1 = require("@/local/lib/utils");
// ─── Constants ────────────────────────────────────────────────────────────────
var ASPECT_RATIO_CLASSES = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]',
};
function LoadingSpinner(_a) {
    var className = _a.className;
    return (<div aria-label="Loading image" className={(0, utils_1.cn)('w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin', className)}/>);
}
// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * Enhanced Image Showcase Component
 *
 * Provides a polished visual presentation for image collections with:
 * - Main image display with hover actions and cyclic navigation
 * - Thumbnail strip for quick access
 * - Full-screen lightbox with zoom, autoplay, and keyboard navigation
 */
function EnhancedImageShowcase(_a) {
    var _this = this;
    var images = _a.images, title = _a.title, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.maxPreviewImages, maxPreviewImages = _c === void 0 ? 6 : _c, _d = _a.aspectRatio, aspectRatio = _d === void 0 ? 'video' : _d, _e = _a.enableDownload, enableDownload = _e === void 0 ? true : _e, _f = _a.enableShare, enableShare = _f === void 0 ? true : _f, _g = _a.enableZoom, enableZoom = _g === void 0 ? true : _g, _h = _a.enableAutoplay, enableAutoplay = _h === void 0 ? true : _h, _j = _a.autoplayInterval, autoplayInterval = _j === void 0 ? 3000 : _j, _k = _a.showImageCounter, showImageCounter = _k === void 0 ? true : _k, _l = _a.showThumbnails, showThumbnails = _l === void 0 ? true : _l, onImageClick = _a.onImageClick, onDownload = _a.onDownload, onShare = _a.onShare;
    var _m = (0, react_1.useState)(0), currentMainImage = _m[0], setCurrentMainImage = _m[1];
    var _o = (0, react_1.useState)(true), isMainLoading = _o[0], setIsMainLoading = _o[1];
    var _p = (0, react_1.useState)(false), isLightboxOpen = _p[0], setIsLightboxOpen = _p[1];
    var _q = (0, react_1.useState)(0), lightboxIndex = _q[0], setLightboxIndex = _q[1];
    var _r = (0, react_1.useState)(true), isLightboxLoading = _r[0], setIsLightboxLoading = _r[1];
    var _s = (0, react_1.useState)(false), isAutoplay = _s[0], setIsAutoplay = _s[1];
    var _t = (0, react_1.useState)(false), showInfo = _t[0], setShowInfo = _t[1];
    var autoplayTimerRef = (0, react_1.useRef)(null);
    var total = images.length;
    // ── Derived values ──────────────────────────────────────────────────────────
    var visibleThumbnails = (0, react_1.useMemo)(function () { return (showThumbnails ? images.slice(0, maxPreviewImages) : []); }, [showThumbnails, images, maxPreviewImages]);
    var hasMoreImages = total > maxPreviewImages;
    // ── Autoplay ────────────────────────────────────────────────────────────────
    (0, react_1.useEffect)(function () {
        if (!isAutoplay || !isLightboxOpen) {
            if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current);
                autoplayTimerRef.current = null;
            }
            return;
        }
        autoplayTimerRef.current = setInterval(function () {
            setLightboxIndex(function (prev) { return (prev + 1) % total; });
            setIsLightboxLoading(true);
        }, autoplayInterval);
        return function () {
            if (autoplayTimerRef.current)
                clearInterval(autoplayTimerRef.current);
        };
    }, [isAutoplay, isLightboxOpen, total, autoplayInterval]);
    // ── Handlers ────────────────────────────────────────────────────────────────
    var openLightbox = (0, react_1.useCallback)(function (index) {
        onImageClick === null || onImageClick === void 0 ? void 0 : onImageClick(index);
        setLightboxIndex(index);
        setIsLightboxLoading(true);
        setIsLightboxOpen(true);
        setIsAutoplay(false);
    }, [onImageClick]);
    var closeLightbox = (0, react_1.useCallback)(function () {
        setIsLightboxOpen(false);
        setIsAutoplay(false);
        setShowInfo(false);
    }, []);
    var goToMain = (0, react_1.useCallback)(function (index) {
        setCurrentMainImage(index);
        setIsMainLoading(true);
    }, []);
    var prevMain = (0, react_1.useCallback)(function () { return goToMain((currentMainImage - 1 + total) % total); }, [currentMainImage, total, goToMain]);
    var nextMain = (0, react_1.useCallback)(function () { return goToMain((currentMainImage + 1) % total); }, [currentMainImage, total, goToMain]);
    var goToLightbox = (0, react_1.useCallback)(function (index) {
        setLightboxIndex(index);
        setIsLightboxLoading(true);
    }, []);
    var prevLightbox = (0, react_1.useCallback)(function () { return goToLightbox((lightboxIndex - 1 + total) % total); }, [lightboxIndex, total, goToLightbox]);
    var nextLightbox = (0, react_1.useCallback)(function () { return goToLightbox((lightboxIndex + 1) % total); }, [lightboxIndex, total, goToLightbox]);
    var toggleAutoplay = (0, react_1.useCallback)(function () { return setIsAutoplay(function (prev) { return !prev; }); }, []);
    var handleShare = (0, react_1.useCallback)(function (index) { return __awaiter(_this, void 0, void 0, function () {
        var imageUrl, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    imageUrl = images[index];
                    if (onShare) {
                        onShare(index, imageUrl);
                        return [2 /*return*/];
                    }
                    if (!navigator.share) return [3 /*break*/, 5];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.share({
                            title: "".concat(title, " \u2014 Image ").concat(index + 1),
                            text: "Check out this image from ".concat(title),
                            url: window.location.href,
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 8];
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, navigator.clipboard.writeText(window.location.href)];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 8];
                case 7:
                    _b = _c.sent();
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [images, title, onShare]);
    var handleDownload = (0, react_1.useCallback)(function (index) {
        var imageUrl = images[index];
        if (onDownload) {
            onDownload(index, imageUrl);
            return;
        }
        var link = document.createElement('a');
        link.href = imageUrl;
        link.download = "".concat(title.replace(/\s+/g, '-').toLowerCase(), "-image-").concat(index + 1, ".jpg");
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [images, title, onDownload]);
    // ── Keyboard navigation ─────────────────────────────────────────────────────
    // Use refs so the effect never needs to re-register due to handler identity changes
    var prevLightboxRef = (0, react_1.useRef)(prevLightbox);
    var nextLightboxRef = (0, react_1.useRef)(nextLightbox);
    var closeLightboxRef = (0, react_1.useRef)(closeLightbox);
    prevLightboxRef.current = prevLightbox;
    nextLightboxRef.current = nextLightbox;
    closeLightboxRef.current = closeLightbox;
    (0, react_1.useEffect)(function () {
        if (!isLightboxOpen)
            return;
        var handleKeyDown = function (e) {
            switch (e.key) {
                case 'Escape':
                    closeLightboxRef.current();
                    break;
                case 'ArrowLeft':
                    prevLightboxRef.current();
                    break;
                case 'ArrowRight':
                    nextLightboxRef.current();
                    break;
                case ' ':
                    e.preventDefault();
                    setIsAutoplay(function (prev) { return !prev; });
                    break;
                case 'i':
                case 'I':
                    setShowInfo(function (prev) { return !prev; });
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return function () { return document.removeEventListener('keydown', handleKeyDown); };
    }, [isLightboxOpen]); // stable — intentionally no handler deps needed
    // ── Guard ───────────────────────────────────────────────────────────────────
    if (!images || total === 0)
        return null;
    // ── Render ──────────────────────────────────────────────────────────────────
    return (<>
      {/* ── Gallery Card ─────────────────────────────────────────────────── */}
      <card_1.Card className={(0, utils_1.cn)('overflow-hidden', className)}>
        <card_1.CardContent className="p-0">
          {/* Main image */}
          <div className="relative group">
            <div className={(0, utils_1.cn)('relative overflow-hidden bg-gray-100', ASPECT_RATIO_CLASSES[aspectRatio])}>
              {isMainLoading && (<div className="absolute inset-0 bg-gray-200 animate-pulse"/>)}

              <img src={images[currentMainImage]} alt={"".concat(title, " \u2014 Image ").concat(currentMainImage + 1, " of ").concat(total)} className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer" style={{ opacity: isMainLoading ? 0 : 1 }} onLoad={function () { return setIsMainLoading(false); }} onClick={function () { return openLightbox(currentMainImage); }}/>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                <button_1.Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white" onClick={function () { return openLightbox(currentMainImage); }} aria-label="Open fullscreen">
                  <lucide_react_1.Maximize2 className="h-4 w-4"/>
                </button_1.Button>

                {enableDownload && (<button_1.Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white" onClick={function (e) {
                e.stopPropagation();
                handleDownload(currentMainImage);
            }} aria-label="Download image">
                    <lucide_react_1.Download className="h-4 w-4"/>
                  </button_1.Button>)}

                {enableShare && (<button_1.Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white" onClick={function (e) {
                e.stopPropagation();
                handleShare(currentMainImage);
            }} aria-label="Share image">
                    <lucide_react_1.Share2 className="h-4 w-4"/>
                  </button_1.Button>)}
              </div>

              {/* Cyclic navigation arrows */}
              {total > 1 && (<>
                  <button_1.Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white" onClick={function (e) {
                e.stopPropagation();
                prevMain();
            }} aria-label="Previous image">
                    <lucide_react_1.ChevronLeft className="h-4 w-4"/>
                  </button_1.Button>

                  <button_1.Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white" onClick={function (e) {
                e.stopPropagation();
                nextMain();
            }} aria-label="Next image">
                    <lucide_react_1.ChevronRight className="h-4 w-4"/>
                  </button_1.Button>
                </>)}

              {showImageCounter && total > 1 && (<div aria-live="polite" className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium select-none">
                  {currentMainImage + 1} / {total}
                </div>)}
            </div>
          </div>

          {/* Thumbnail strip */}
          {showThumbnails && total > 1 && (<div className="p-4 bg-gray-50">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" role="listbox" aria-label="Image thumbnails">
                {visibleThumbnails.map(function (image, index) { return (<button key={index} role="option" aria-selected={currentMainImage === index} aria-label={"View image ".concat(index + 1)} onClick={function () { return goToMain(index); }} className={(0, utils_1.cn)('relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all', 'hover:ring-2 hover:ring-primary hover:scale-105', currentMainImage === index
                    ? 'ring-2 ring-primary scale-105'
                    : 'opacity-60')}>
                    <img src={image} alt={"Thumbnail ".concat(index + 1)} className="w-full h-full object-cover"/>
                  </button>); })}

                {hasMoreImages && (<button aria-label={"View all ".concat(total, " images")} onClick={function () { return openLightbox(maxPreviewImages); }} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 hover:bg-gray-300 transition-all flex items-center justify-center">
                    <div className="text-center">
                      <lucide_react_1.Grid className="h-5 w-5 mx-auto mb-1"/>
                      <span className="text-xs font-medium">
                        +{total - maxPreviewImages}
                      </span>
                    </div>
                  </button>)}
              </div>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {isLightboxOpen && (<div role="dialog" aria-modal="true" aria-label={"".concat(title, " \u2014 lightbox")} className="fixed inset-0 z-50 bg-black">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={closeLightbox} aria-hidden="true"/>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <h2 className="text-white text-lg font-semibold truncate max-w-md">
                  {title}
                </h2>
                {showImageCounter && (<span aria-live="polite" className="text-white/80 text-sm select-none">
                    {lightboxIndex + 1} / {total}
                  </span>)}
              </div>

              <div className="flex items-center gap-2">
                <button_1.Button variant="ghost" size="icon" className={(0, utils_1.cn)('text-white hover:bg-white/20', showInfo && 'bg-white/20')} onClick={function () { return setShowInfo(function (prev) { return !prev; }); }} aria-pressed={showInfo} title="Toggle info (I)">
                  <lucide_react_1.Info className="h-5 w-5"/>
                </button_1.Button>

                {enableAutoplay && total > 1 && (<button_1.Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleAutoplay} aria-pressed={isAutoplay} title={isAutoplay ? 'Pause (Space)' : 'Play (Space)'}>
                    {isAutoplay ? (<lucide_react_1.Pause className="h-5 w-5"/>) : (<lucide_react_1.Play className="h-5 w-5"/>)}
                  </button_1.Button>)}

                {enableDownload && (<button_1.Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={function () { return handleDownload(lightboxIndex); }} title="Download image">
                    <lucide_react_1.Download className="h-5 w-5"/>
                  </button_1.Button>)}

                {enableShare && (<button_1.Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={function () { return handleShare(lightboxIndex); }} title="Share image">
                    <lucide_react_1.Share2 className="h-5 w-5"/>
                  </button_1.Button>)}

                <button_1.Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={closeLightbox} title="Close (Esc)" aria-label="Close lightbox">
                  <lucide_react_1.X className="h-5 w-5"/>
                </button_1.Button>
              </div>
            </div>
          </div>

          {/* Image area */}
          <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32" onClick={function (e) { return e.stopPropagation(); }} // prevent backdrop click on image area
        >
            {enableZoom ? (<react_zoom_pan_pinch_1.TransformWrapper key={lightboxIndex} // reset zoom on image change
             initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
                {function (_a) {
                    var zoomIn = _a.zoomIn, zoomOut = _a.zoomOut, resetTransform = _a.resetTransform;
                    return (<>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                      <button_1.Button variant="secondary" size="icon" onClick={function () { return zoomIn(); }} className="bg-white/90 hover:bg-white" title="Zoom in" aria-label="Zoom in">
                        <lucide_react_1.ZoomIn className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="secondary" size="icon" onClick={function () { return zoomOut(); }} className="bg-white/90 hover:bg-white" title="Zoom out" aria-label="Zoom out">
                        <lucide_react_1.ZoomOut className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="secondary" size="icon" onClick={function () { return resetTransform(); }} className="bg-white/90 hover:bg-white" title="Reset zoom" aria-label="Reset zoom">
                        <lucide_react_1.RefreshCw className="h-4 w-4"/>
                      </button_1.Button>
                    </div>

                    <react_zoom_pan_pinch_1.TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                      <img src={images[lightboxIndex]} alt={"".concat(title, " \u2014 Image ").concat(lightboxIndex + 1, " of ").concat(total)} className="max-w-full max-h-full object-contain" style={{ opacity: isLightboxLoading ? 0 : 1, transition: 'opacity 0.2s' }} onLoad={function () { return setIsLightboxLoading(false); }}/>
                    </react_zoom_pan_pinch_1.TransformComponent>
                  </>);
                }}
              </react_zoom_pan_pinch_1.TransformWrapper>) : (<img src={images[lightboxIndex]} alt={"".concat(title, " \u2014 Image ").concat(lightboxIndex + 1, " of ").concat(total)} className="max-w-full max-h-full object-contain" style={{ opacity: isLightboxLoading ? 0 : 1, transition: 'opacity 0.2s' }} onLoad={function () { return setIsLightboxLoading(false); }}/>)}
          </div>

          {/* Cyclic navigation arrows */}
          {total > 1 && (<>
              <button_1.Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white" onClick={prevLightbox} title="Previous (←)" aria-label="Previous image">
                <lucide_react_1.ChevronLeft className="h-6 w-6"/>
              </button_1.Button>

              <button_1.Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white" onClick={nextLightbox} title="Next (→)" aria-label="Next image">
                <lucide_react_1.ChevronRight className="h-6 w-6"/>
              </button_1.Button>
            </>)}

          {/* Bottom thumbnail strip */}
          {showThumbnails && total > 1 && (<div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="max-w-4xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent" role="listbox" aria-label="Image thumbnails">
                <div className="flex gap-2 justify-center min-w-max px-2">
                  {images.map(function (image, index) { return (<button key={index} role="option" aria-selected={lightboxIndex === index} aria-label={"View image ".concat(index + 1)} onClick={function () { return goToLightbox(index); }} className={(0, utils_1.cn)('relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all', 'hover:ring-2 hover:ring-white hover:scale-110', lightboxIndex === index
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-60')}>
                      <img src={image} alt={"Thumbnail ".concat(index + 1)} className="w-full h-full object-cover"/>
                    </button>); })}
                </div>
              </div>
            </div>)}

          {/* Info panel */}
          {showInfo && (<aside className="absolute right-4 top-24 z-50 w-80 bg-white rounded-lg shadow-xl p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="font-semibold text-lg mb-3">{title}</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total images</dt>
                  <dd className="font-medium">{total}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Current image</dt>
                  <dd className="font-medium">{lightboxIndex + 1}</dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Keyboard shortcuts</h4>
                <dl className="space-y-1 text-xs text-gray-600">
                  {[
                    ['← / →', 'Navigate'],
                    ['Space', 'Play / Pause'],
                    ['I', 'Toggle info'],
                    ['Esc', 'Close'],
                ].map(function (_a) {
                    var key = _a[0], label = _a[1];
                    return (<div key={key} className="flex justify-between">
                      <dt>
                        <kbd className="font-mono bg-gray-100 px-1 rounded">{key}</kbd>
                      </dt>
                      <dd>{label}</dd>
                    </div>);
                })}
                </dl>
              </div>
            </aside>)}

          {/* Loading indicator */}
          {isLightboxLoading && (<div aria-label="Loading image" className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <LoadingSpinner />
            </div>)}
        </div>)}
    </>);
}
