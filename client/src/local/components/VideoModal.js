"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoModal = VideoModal;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("./ui/button");
function VideoModal(_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, videoUrl = _a.videoUrl, _b = _a.title, title = _b === void 0 ? "Demo Video" : _b;
    var modalRef = (0, react_1.useRef)(null);
    // Handle escape key
    (0, react_1.useEffect)(function () {
        var handleEscape = function (event) {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return function () {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    // Handle click outside
    var handleBackdropClick = function (event) {
        if (event.target === modalRef.current) {
            onClose();
        }
    };
    // Convert YouTube URL to embed format
    var getEmbedUrl = function (url) {
        var youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
        var match = url.match(youtubeRegex);
        if (match) {
            return "https://www.youtube.com/embed/".concat(match[1], "?autoplay=1&rel=0");
        }
        // If it's already an embed URL or another video format, return as is
        return url;
    };
    if (!isOpen)
        return null;
    return (<div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative w-full max-w-4xl mx-4 bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button_1.Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <lucide_react_1.X className="w-5 h-5"/>
          </button_1.Button>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          <iframe src={getEmbedUrl(videoUrl)} title={title} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800 text-center">
          <p className="text-sm text-slate-400">
            Learn more about TripleCheck's comprehensive property verification system
          </p>
        </div>
      </div>
    </div>);
}
