"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandCard = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var images_1 = require("../../local/components/images");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var utils_1 = require("../../local/lib/utils");
var contexts_1 = require("../contexts");
var hooks_1 = require("../../local/hooks");
var shared_1 = require("../../local/components/property/shared");
// ─── Formatters (cached at module level to avoid per-render instantiation) ───
var currencyFormatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});
var shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
});
var longDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
});
var formatCurrency = function (amount) {
    return currencyFormatter.format(amount);
};
var formatDate = function (date, includeYear) {
    if (includeYear === void 0) { includeYear = false; }
    var d = typeof date === "string" ? new Date(date) : date;
    return includeYear ? longDateFormatter.format(d) : shortDateFormatter.format(d);
};
// ─── Stable config (defined outside component to avoid recreating per render) ─
var ACCESS_FEATURES = [
    {
        key: "waterAccess",
        label: "Water Access",
        emoji: "💧",
        colorClass: "bg-blue-50 text-blue-700",
    },
    {
        key: "roadAccess",
        label: "Road Access",
        emoji: "🛣️",
        colorClass: "bg-gray-50 text-gray-700",
    },
    {
        key: "electricityAccess",
        label: "Electricity",
        emoji: "⚡",
        colorClass: "bg-yellow-50 text-yellow-700",
    },
];
// ─── Sub-components ───────────────────────────────────────────────────────────
var StatusIndicators = (0, react_1.memo)(function (_a) {
    var property = _a.property;
    if (!property.isNew && !property.isFeatured)
        return null;
    return (<div className="absolute top-0 left-0 z-20 flex flex-col gap-1">
        {property.isNew && (<div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
            NEW
          </div>)}
        {property.isFeatured && (<div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
            FEATURED
          </div>)}
      </div>);
});
StatusIndicators.displayName = "StatusIndicators";
var LandAccessFeatures = (0, react_1.memo)(function (_a) {
    var features = _a.features;
    if (!features)
        return null;
    var available = ACCESS_FEATURES.filter(function (_a) {
        var key = _a.key;
        return features[key];
    });
    if (available.length === 0)
        return null;
    return (<div className="flex flex-wrap gap-2">
        {available.map(function (_a) {
            var key = _a.key, label = _a.label, emoji = _a.emoji, colorClass = _a.colorClass;
            return (<badge_1.Badge key={key} variant="outline" className={(0, utils_1.cn)("text-xs", colorClass)}>
            <span role="img" aria-label={label.toLowerCase()}>
              {emoji}
            </span>{" "}
            {label}
          </badge_1.Badge>);
        })}
      </div>);
});
LandAccessFeatures.displayName = "LandAccessFeatures";
var PriceSection = (0, react_1.memo)(function (_a) {
    var _b, _c, _d;
    var property = _a.property, formattedPrice = _a.formattedPrice;
    var titleDeedStatus = (_d = (_b = property.titleDeedStatus) !== null && _b !== void 0 ? _b : (_c = property.features) === null || _c === void 0 ? void 0 : _c.titleDeedStatus) !== null && _d !== void 0 ? _d : "available";
    return (<div className="space-y-1 flex-1">
      {formattedPrice.hasDiscount && property.originalPrice != null && (<div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground line-through">
            {formatCurrency(property.originalPrice)}
          </span>
          <badge_1.Badge variant="destructive" className="text-xs">
            -{formattedPrice.discountPercentage}%
          </badge_1.Badge>
        </div>)}
      <div className="text-xl sm:text-2xl font-bold text-primary">
        {formattedPrice.primary}
      </div>
      <div className="text-xs text-muted-foreground">{formattedPrice.secondary}</div>
      <div className="text-xs text-muted-foreground">
        Title:{" "}
        <span className="capitalize font-medium text-foreground">
          {titleDeedStatus}
        </span>
      </div>
    </div>);
});
PriceSection.displayName = "PriceSection";
// ─── Main Component ───────────────────────────────────────────────────────────
exports.LandCard = (0, react_1.memo)(function (_a) {
    var _b;
    var property = _a.property, className = _a.className, _c = _a.showQuickActions, showQuickActions = _c === void 0 ? true : _c, _d = _a.isInWishlist, isInWishlist = _d === void 0 ? false : _d, _e = _a.viewMode, viewMode = _e === void 0 ? "grid" : _e, onSave = _a.onSave, onShare = _a.onShare, onViewDetails = _a.onViewDetails, onVerify = _a.onVerify, _f = _a.showGallery, showGallery = _f === void 0 ? false : _f, onClick = _a.onClick;
    var extendedProperty = property;
    var gallery = (0, hooks_1.useImageGallery)({
        property: property,
        images: (_b = property.images) !== null && _b !== void 0 ? _b : [],
        enableNavigation: true,
        enableFullscreen: true,
    });
    // Merge onViewDetails and onClick so the hook always has a single handler
    var actions = (0, hooks_1.usePropertyCardActions)(property, {
        onSave: onSave,
        onShare: onShare,
        onViewDetails: onViewDetails !== null && onViewDetails !== void 0 ? onViewDetails : (onClick ? function () { return onClick(property); } : undefined),
        onVerify: onVerify,
    });
    var _g = (0, hooks_1.usePropertyFormatting)(property, __assign(__assign({}, (extendedProperty.originalPrice != null && {
        originalPrice: extendedProperty.originalPrice,
    })), { showUSDConversion: true, exchangeRate: 130 })), formattedPrice = _g.formattedPrice, locationString = _g.locationString, displayTitle = _g.displayTitle, displayDescription = _g.displayDescription;
    var _h = (0, hooks_1.usePropertyCardState)(), isHovered = _h.isHovered, handleMouseEnter = _h.handleMouseEnter, handleMouseLeave = _h.handleMouseLeave, handleKeyDown = _h.handleKeyDown;
    var _j = (0, contexts_1.usePropertyCompare)(), selectedProperties = _j.selectedProperties, canAddMore = _j.canAddMore;
    var _k = (0, contexts_1.usePropertyCompareActions)(), addToCompare = _k.addToCompare, removeFromCompare = _k.removeFromCompare;
    var isInCompare = (0, react_1.useMemo)(function () { return selectedProperties.some(function (p) { return p.id === property.id; }); }, [selectedProperties, property.id]);
    var compareActions = (0, hooks_1.usePropertyCompareActions)({
        property: property,
        isInCompare: isInCompare,
        canAddMore: canAddMore,
        addToCompare: addToCompare,
        removeFromCompare: removeFromCompare,
        locationString: locationString,
    });
    var handleCardClick = (0, react_1.useCallback)(function (e) {
        if (e.target.closest("button, a"))
            return;
        onClick === null || onClick === void 0 ? void 0 : onClick(property);
    }, [onClick, property]);
    var handleCardKeyDown = (0, react_1.useCallback)(function (e) {
        handleKeyDown(e, function () { return onClick === null || onClick === void 0 ? void 0 : onClick(property); });
    }, [handleKeyDown, onClick, property]);
    // cn() is a trivial string join — no useMemo needed here
    var cardClasses = (0, utils_1.cn)("group relative bg-card rounded-xl overflow-hidden shadow-sm", "hover:shadow-lg transition-all duration-300 border border-gray-100", "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2", "w-full max-w-sm mx-auto sm:max-w-none md:hover:-translate-y-2", viewMode === "list" && "sm:flex sm:flex-row sm:max-w-4xl", className);
    var imageContainerClasses = (0, utils_1.cn)("relative overflow-hidden", viewMode === "grid"
        ? "aspect-[4/3] w-full"
        : "sm:w-80 sm:h-60 aspect-[4/3] sm:aspect-auto");
    return (<>
        <card_1.Card className={cardClasses} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onKeyDown={handleCardKeyDown} onClick={handleCardClick} tabIndex={onClick ? 0 : undefined} role={onClick ? "button" : undefined} aria-label={onClick ? "View details for ".concat(displayTitle) : undefined}>
          <StatusIndicators property={extendedProperty}/>

          <div className={imageContainerClasses}>
            <shared_1.PropertyImageSection property={property} gallery={gallery} actions={actions} isHovered={isHovered} showQuickActions={showQuickActions} isInWishlist={isInWishlist} priority={false} isInCompare={isInCompare} canAddMore={canAddMore} onCompareClick={compareActions.handleCompareClick} showVerificationBadge showTrustScore showImageCount/>
          </div>

          <card_1.CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1">
            {/* Title and date */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <button_1.Button variant="ghost" className="font-bold text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1 mr-2 text-left p-0 h-auto justify-start" onClick={actions.handleViewDetails} type="button" aria-label={"View details for ".concat(displayTitle)}>
                  {displayTitle}
                </button_1.Button>
                {extendedProperty.dateAdded && (<div className="flex items-center text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded-full shrink-0">
                    <lucide_react_1.Calendar className="w-3 h-3 mr-1" aria-hidden/>
                    <time dateTime={extendedProperty.dateAdded.toISOString()}>
                      {formatDate(extendedProperty.dateAdded)}
                    </time>
                  </div>)}
              </div>

              <div className="flex items-center text-muted-foreground">
                <lucide_react_1.MapPin className="w-4 h-4 mr-2 text-primary shrink-0" aria-hidden/>
                <span className="text-sm line-clamp-1 font-medium">{locationString}</span>
              </div>
            </div>

            {displayDescription && (<p className="text-muted-foreground text-sm line-clamp-2">
                {displayDescription}
              </p>)}

            <shared_1.PropertyFeatures property={property} locationString={locationString} variant="land"/>

            <LandAccessFeatures features={property.features}/>

            {/* Price and primary actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
              <PriceSection property={extendedProperty} formattedPrice={formattedPrice}/>

              <div className="flex gap-2 shrink-0">
                <button_1.Button variant="outline" size="sm" onClick={actions.handleVerify} className="flex items-center gap-1 text-xs sm:text-sm" aria-label="Verify property">
                  <lucide_react_1.Shield className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden/>
                  <span className="hidden sm:inline">Verify</span>
                  <span className="sm:hidden">✓</span>
                </button_1.Button>
                <button_1.Button size="sm" onClick={actions.handleViewDetails} className="flex items-center gap-1 text-xs sm:text-sm" aria-label={"View details for ".concat(displayTitle)}>
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">View</span>
                  <lucide_react_1.ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden/>
                </button_1.Button>
              </div>
            </div>

            {/* Compare and last-verified */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-2 sm:gap-0">
              <button_1.Button size="sm" variant={isInCompare ? "default" : "outline"} onClick={compareActions.handleCompareClick} disabled={!canAddMore && !isInCompare} className="flex items-center gap-1 w-full sm:w-auto text-xs sm:text-sm" aria-label={isInCompare
            ? "Remove from comparison"
            : canAddMore
                ? "Add to comparison"
                : "Comparison list is full"}>
                {isInCompare ? (<>
                    <lucide_react_1.CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden/>
                    <span className="hidden sm:inline">In Comparison</span>
                    <span className="sm:hidden">Added</span>
                  </>) : (<>
                    <lucide_react_1.Square className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden/>
                    Compare
                  </>)}
              </button_1.Button>

              {extendedProperty.lastVerified && (<div className="text-xs text-muted-foreground text-center sm:text-right">
                  Last verified:{" "}
                  <time dateTime={new Date(extendedProperty.lastVerified).toISOString()}>
                    {formatDate(extendedProperty.lastVerified, true)}
                  </time>
                </div>)}
            </div>

            {/* View count */}
            {extendedProperty.viewCount != null && (<div className="flex items-center text-xs text-muted-foreground pt-2 border-t border-gray-50">
                <lucide_react_1.Eye className="w-3 h-3 mr-1" aria-hidden/>
                <span>
                  Viewed {extendedProperty.viewCount.toLocaleString()} times
                </span>
              </div>)}
          </card_1.CardContent>
        </card_1.Card>

        {showGallery && gallery.showGallery && (<images_1.ImageGallery images={gallery.galleryImages} enableSearch={false} enableFullscreen showImageCounter onImageClick={function (_, index) {
                if (typeof index === "number")
                    gallery.navigateToImage(index);
            }}/>)}
      </>);
});
exports.LandCard.displayName = "LandCard";
exports.default = exports.LandCard;
