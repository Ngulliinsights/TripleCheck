"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickActionsOverlay = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../ui/button");
var tooltip_1 = require("../../ui/tooltip");
var utils_1 = require("../../../lib/utils");
function ActionButton(_a) {
    var tooltip = _a.tooltip, onClick = _a.onClick, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.variant, variant = _c === void 0 ? 'secondary' : _c, className = _a.className, children = _a.children;
    return (<tooltip_1.Tooltip>
      <tooltip_1.TooltipTrigger asChild>
        <button_1.Button type="button" size="icon" variant={variant} onClick={onClick} disabled={disabled} className={(0, utils_1.cn)('bg-white/95 backdrop-blur-md shadow-sm border-0', 'w-8 h-8 sm:w-10 sm:h-10', 'transition-all duration-200 md:hover:scale-110', className)}>
          {children}
        </button_1.Button>
      </tooltip_1.TooltipTrigger>
      <tooltip_1.TooltipContent>
        <p>{tooltip}</p>
      </tooltip_1.TooltipContent>
    </tooltip_1.Tooltip>);
}
var ICON_SIZE = 'w-3 h-3 sm:w-4 sm:h-4';
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
/**
 * Shared QuickActionsOverlay.
 * Renders wishlist, share, gallery, and compare buttons on property card hover.
 * Used by both PropertyCard and EnhancedLandCard.
 */
exports.QuickActionsOverlay = (0, react_1.memo)(function (_a) {
    var actions = _a.actions, isInWishlist = _a.isInWishlist, gallery = _a.gallery, isInCompare = _a.isInCompare, canAddMore = _a.canAddMore, onCompareClick = _a.onCompareClick, className = _a.className;
    var compareDisabled = !canAddMore && !isInCompare;
    return (
    // A single TooltipProvider wraps all tooltips — mounting one per button is wasteful
    <tooltip_1.TooltipProvider>
        <div className={(0, utils_1.cn)('absolute bottom-2 right-2 flex space-x-1', 'opacity-0 group-hover:opacity-100 md:opacity-100', 'transition-all duration-300', className)}>
          {/* Wishlist */}
          <ActionButton tooltip={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'} onClick={actions.handleSave} className={isInWishlist ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}>
            <lucide_react_1.Heart className={(0, utils_1.cn)(ICON_SIZE, isInWishlist && 'fill-current')}/>
          </ActionButton>

          {/* Share */}
          <ActionButton tooltip="Share property" onClick={actions.handleShare} className="text-gray-600 hover:text-blue-500">
            <lucide_react_1.Share2 className={ICON_SIZE}/>
          </ActionButton>

          {/* Gallery — only shown when multiple images exist */}
          {gallery.hasMultipleImages && (<ActionButton tooltip="View gallery" onClick={function (e) {
                e.stopPropagation();
                gallery.openGallery();
            }} className="text-gray-600 hover:text-purple-500">
              <lucide_react_1.Maximize2 className={ICON_SIZE}/>
            </ActionButton>)}

          {/* Compare */}
          <ActionButton tooltip={isInCompare ? 'Remove from comparison' : 'Add to comparison'} onClick={onCompareClick} disabled={compareDisabled} variant={isInCompare ? 'default' : 'secondary'} className={(0, utils_1.cn)(compareDisabled && 'opacity-50 cursor-not-allowed')}>
            {isInCompare ? <lucide_react_1.Check className={ICON_SIZE}/> : <lucide_react_1.Plus className={ICON_SIZE}/>}
          </ActionButton>
        </div>
      </tooltip_1.TooltipProvider>);
});
exports.QuickActionsOverlay.displayName = 'QuickActionsOverlay';
exports.default = exports.QuickActionsOverlay;
