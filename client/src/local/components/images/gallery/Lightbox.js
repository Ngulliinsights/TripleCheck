"use strict";
/**
 * Lightbox Component
 * Fullscreen image viewer with navigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lightbox = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var ImageEngine_1 = require("./ImageEngine");
var utils_1 = require("./utils");
exports.Lightbox = (0, react_1.memo)(function (_a) {
    var _b;
    var images = _a.images, currentIndex = _a.currentIndex, isOpen = _a.isOpen, onClose = _a.onClose, onNavigate = _a.onNavigate, enableWatermark = _a.enableWatermark, watermarkConfig = _a.watermarkConfig, enableCollaboration = _a.enableCollaboration, userRole = _a.userRole, onCommentAdd = _a.onCommentAdd;
    var _c = (0, react_1.useState)(1), zoom = _c[0], setZoom = _c[1];
    var _d = (0, react_1.useState)(0), rotation = _d[0], setRotation = _d[1];
    var _e = (0, react_1.useState)(false), showComments = _e[0], setShowComments = _e[1];
    var _f = (0, react_1.useState)(""), newComment = _f[0], setNewComment = _f[1];
    var currentImage = images[currentIndex];
    (0, react_1.useEffect)(function () {
        if (!isOpen) {
            setZoom(1);
            setRotation(0);
            setShowComments(false);
        }
    }, [isOpen]);
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (e) {
            if (!isOpen)
                return;
            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowLeft":
                    handlePrevious();
                    break;
                case "ArrowRight":
                    handleNext();
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return function () { return window.removeEventListener("keydown", handleKeyDown); };
    }, [isOpen, currentIndex]);
    var handlePrevious = (0, react_1.useCallback)(function () {
        if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
        }
    }, [currentIndex, onNavigate]);
    var handleNext = (0, react_1.useCallback)(function () {
        if (currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1);
        }
    }, [currentIndex, images.length, onNavigate]);
    var handleZoomIn = (0, react_1.useCallback)(function () {
        setZoom(function (prev) { return Math.min(prev + 0.25, 3); });
    }, []);
    var handleZoomOut = (0, react_1.useCallback)(function () {
        setZoom(function (prev) { return Math.max(prev - 0.25, 0.5); });
    }, []);
    var handleRotate = (0, react_1.useCallback)(function () {
        setRotation(function (prev) { return (prev + 90) % 360; });
    }, []);
    var handleDownload = (0, react_1.useCallback)(function () {
        if (currentImage === null || currentImage === void 0 ? void 0 : currentImage.src) {
            var link = document.createElement("a");
            link.href = currentImage.src;
            link.download = currentImage.alt || "image";
            link.click();
        }
    }, [currentImage]);
    var handleShare = (0, react_1.useCallback)(function () {
        if ((currentImage === null || currentImage === void 0 ? void 0 : currentImage.src) && navigator.share) {
            navigator.share({
                title: currentImage.alt || "Image",
                url: currentImage.src,
            });
        }
    }, [currentImage]);
    var handleAddComment = (0, react_1.useCallback)(function () {
        if (newComment.trim() && currentImage && onCommentAdd) {
            onCommentAdd(currentImage.id, newComment.trim());
            setNewComment("");
        }
    }, [newComment, currentImage, onCommentAdd]);
    if (!isOpen || !currentImage) {
        return null;
    }
    return (<div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            <h3 className="font-medium">{currentImage.alt || "Untitled"}</h3>
            <p className="text-sm text-gray-300">
              {currentIndex + 1} / {images.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toolbar */}
            <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Zoom out">
              <lucide_react_1.ZoomOut className="w-5 h-5"/>
            </button>
            <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Zoom in">
              <lucide_react_1.ZoomIn className="w-5 h-5"/>
            </button>
            <button onClick={handleRotate} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Rotate">
              <lucide_react_1.RotateCw className="w-5 h-5"/>
            </button>
            <button onClick={handleDownload} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Download">
              <lucide_react_1.Download className="w-5 h-5"/>
            </button>
            {navigator.share && (<button onClick={handleShare} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Share">
                <lucide_react_1.Share2 className="w-5 h-5"/>
              </button>)}
            {enableCollaboration && (<button onClick={function () { return setShowComments(!showComments); }} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Comments">
                <lucide_react_1.MessageSquare className="w-5 h-5"/>
              </button>)}
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-lg" title="Close">
              <lucide_react_1.X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Navigation */}
        {currentIndex > 0 && (<button onClick={handlePrevious} className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70">
            <lucide_react_1.ChevronLeft className="w-6 h-6"/>
          </button>)}
        {currentIndex < images.length - 1 && (<button onClick={handleNext} className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70">
            <lucide_react_1.ChevronRight className="w-6 h-6"/>
          </button>)}

        {/* Image */}
        <div className="max-w-7xl max-h-[80vh] transition-transform duration-200" style={{
            transform: "scale(".concat(zoom, ") rotate(").concat(rotation, "deg)"),
        }}>
          <ImageEngine_1.ImageEngine image={currentImage} enableWatermark={enableWatermark} watermarkConfig={watermarkConfig} className="max-w-full max-h-full object-contain"/>
        </div>

        {/* Comments sidebar */}
        {showComments && enableCollaboration && (0, utils_1.isAdvancedImage)(currentImage) && (<div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium mb-4">Comments</h3>

              {/* Existing comments */}
              <div className="space-y-3 mb-4">
                {(_b = currentImage.comments) === null || _b === void 0 ? void 0 : _b.map(function (comment) { return (<div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm">{comment.user}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>); })}
                {(!currentImage.comments || currentImage.comments.length === 0) && (<p className="text-sm text-gray-500">No comments yet</p>)}
              </div>

              {/* Add comment */}
              {(userRole === "editor" || userRole === "admin") && (<div className="space-y-2">
                  <textarea value={newComment} onChange={function (e) { return setNewComment(e.target.value); }} placeholder="Add a comment..." className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3}/>
                  <button onClick={handleAddComment} disabled={!newComment.trim()} className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Add Comment
                  </button>
                </div>)}
            </div>
          </div>)}
      </div>);
});
exports.Lightbox.displayName = "Lightbox";
