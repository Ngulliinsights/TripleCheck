"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyImageSection = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../ui/badge");
var utils_1 = require("../../../lib/utils");
var QuickActionsOverlay_1 = require("./QuickActionsOverlay");
var VERIFICATION_CONFIG = {
    verified: {
        label: 'Verified',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Icon: lucide_react_1.CheckCircle,
    },
    pending: {
        label: 'Verification Pending',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        Icon: lucide_react_1.Clock,
    },
    unverified: {
        label: 'Unverified',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        Icon: lucide_react_1.Eye,
    },
    flagged: {
        label: 'Flagged',
        color: 'bg-red-50 text-red-700 border-red-200',
        Icon: lucide_react_1.AlertTriangle,
    },
};
var FALLBACK_STATUS = 'pending';
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
/**
 * Shared PropertyImageSection.
 * Renders the image, overlaid badges, and quick-action buttons for a property card.
 * Used by both PropertyCard and EnhancedLandCard.
 */
exports.PropertyImageSection = (0, react_1.memo)(function (_a) {
    var _b, _c;
    var property = _a.property, gallery = _a.gallery, actions = _a.actions, isHovered = _a.isHovered, showQuickActions = _a.showQuickActions, isInWishlist = _a.isInWishlist, _d = _a.priority, priority = _d === void 0 ? false : _d, className = _a.className, isInCompare = _a.isInCompare, canAddMore = _a.canAddMore, onCompareClick = _a.onCompareClick, _e = _a.showVerificationBadge, showVerificationBadge = _e === void 0 ? true : _e, _f = _a.showTrustScore, showTrustScore = _f === void 0 ? true : _f, _g = _a.showImageCount, showImageCount = _g === void 0 ? true : _g;
    var statusConfig = VERIFICATION_CONFIG[(_b = property.verificationStatus) !== null && _b !== void 0 ? _b : FALLBACK_STATUS];
    var StatusIcon = statusConfig.Icon;
    var propertyLabel = (_c = property.type) !== null && _c !== void 0 ? _c : property.category;
    return (<div className={(0, utils_1.cn)('relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-video', className)}>
        {/* Main image — wrapped in a button for keyboard / screen-reader accessibility */}
        <button type="button" className="relative w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset" onClick={actions.handleViewDetails} aria-label={"View details for ".concat(property.title)}>
          <img src={gallery.currentImage} alt={"".concat(property.title, " \u2014 ").concat(propertyLabel, " property")} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105" loading={priority ? 'eager' : 'lazy'}/>
        </button>

        {/* Dark gradient revealed on hover */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"/>

        {/* Top-left: verification + type badges */}
        {showVerificationBadge && (<div className="absolute top-2 left-2 z-10 space-y-1 pointer-events-none">
            <badge_1.Badge className={(0, utils_1.cn)('flex items-center gap-1 text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0', statusConfig.color)}>
              <StatusIcon className="w-3 h-3"/>
              {/* Full label on sm+, first word on xs */}
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">{statusConfig.label.split(' ')[0]}</span>
            </badge_1.Badge>

            <badge_1.Badge className="flex items-center text-xs font-medium bg-white/95 backdrop-blur-md shadow-sm border-0 bg-blue-50 text-blue-700">
              <span className="capitalize">{propertyLabel}</span>
            </badge_1.Badge>
          </div>)}

        {/* Top-right: trust score */}
        {showTrustScore && property.trustScore != null && (<div className="absolute top-2 right-2 z-10 pointer-events-none">
            <badge_1.Badge className="bg-white/95 backdrop-blur-md shadow-sm border-0 text-primary text-xs">
              <lucide_react_1.Star className="w-3 h-3 mr-1 fill-current"/>
              {property.trustScore}%
            </badge_1.Badge>
          </div>)}

        {/* Bottom-left: image count */}
        {showImageCount && gallery.hasMultipleImages && (<div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 pointer-events-none">
            <lucide_react_1.Camera className="w-3 h-3"/>
            {gallery.imageCount}
          </div>)}

        {/* Quick actions (wishlist, share, gallery, compare) */}
        {showQuickActions && (<QuickActionsOverlay_1.QuickActionsOverlay actions={actions} isInWishlist={isInWishlist} gallery={gallery} isInCompare={isInCompare} canAddMore={canAddMore} onCompareClick={onCompareClick}/>)}

        {/* Gallery hint on hover */}
        {gallery.hasMultipleImages && isHovered && (<div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <lucide_react_1.Eye className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
          </div>)}
      </div>);
});
exports.PropertyImageSection.displayName = 'PropertyImageSection';
exports.default = exports.PropertyImageSection;
