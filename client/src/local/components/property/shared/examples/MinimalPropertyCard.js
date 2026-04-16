"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimalPropertyCard = void 0;
var react_1 = require("react");
var card_1 = require("../../../ui/card");
var utils_1 = require("../../../../lib/utils");
var hooks_1 = require("../../../../hooks");
var __1 = require("../");
/**
 * Minimal example showing how to use shared hooks and components
 * This demonstrates the power of the refactored architecture
 */
exports.MinimalPropertyCard = (0, react_1.memo)(function (_a) {
    var property = _a.property, className = _a.className, onClick = _a.onClick, onSave = _a.onSave, onShare = _a.onShare;
    // All the complex logic is now handled by shared hooks
    var gallery = (0, hooks_1.useImageGallery)({
        property: property,
        images: property.images || [],
    });
    var actions = (0, hooks_1.usePropertyCardActions)(property, {
        onSave: onSave,
        onShare: onShare,
        onViewDetails: function () { return onClick === null || onClick === void 0 ? void 0 : onClick(property); },
    });
    var _b = (0, hooks_1.usePropertyFormatting)(property), formattedPrice = _b.formattedPrice, locationString = _b.locationString, displayTitle = _b.displayTitle;
    var _c = (0, hooks_1.usePropertyCardState)(), isHovered = _c.isHovered, handleMouseEnter = _c.handleMouseEnter, handleMouseLeave = _c.handleMouseLeave;
    return (<card_1.Card className={(0, utils_1.cn)("group overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg", className)} onClick={actions.handleCardClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Shared image section handles all the complexity */}
        <__1.PropertyImageSection property={property} gallery={gallery} actions={actions} isHovered={isHovered} showQuickActions={true} isInWishlist={false} isInCompare={false} canAddMore={true} onCompareClick={function () { }} // Simplified for this example
    />

        <card_1.CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg line-clamp-2">
            {displayTitle}
          </h3>

          {/* Shared features component handles display logic */}
          <__1.PropertyFeatures property={property} locationString={locationString} variant="compact"/>

          <div className="text-xl font-bold text-primary">
            {formattedPrice.primary}
          </div>
        </card_1.CardContent>
      </card_1.Card>);
});
exports.MinimalPropertyCard.displayName = "MinimalPropertyCard";
exports.default = exports.MinimalPropertyCard;
