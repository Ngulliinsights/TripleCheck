"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyFeatures = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../ui/badge");
var utils_1 = require("../../../lib/utils");
// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function LocationRow(_a) {
    var locationString = _a.locationString;
    return (<div className="flex items-start text-gray-600">
      <lucide_react_1.MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500"/>
      <span className="text-sm leading-relaxed">{locationString}</span>
    </div>);
}
/** Horizontal row of bed / bath / area chips — used by standard & compact variants. */
function FeaturePills(_a) {
    var bedrooms = _a.bedrooms, bathrooms = _a.bathrooms, squareFeet = _a.squareFeet;
    return (<div className="flex items-center gap-4 text-sm text-gray-600">
      {bedrooms != null && (<div className="flex items-center" title={"".concat(bedrooms, " bedroom").concat(bedrooms !== 1 ? 's' : '')}>
          <lucide_react_1.Bed className="w-4 h-4 mr-1.5 text-gray-500"/>
          <span>{bedrooms}</span>
        </div>)}
      {bathrooms != null && (<div className="flex items-center" title={"".concat(bathrooms, " bathroom").concat(bathrooms !== 1 ? 's' : '')}>
          <lucide_react_1.Bath className="w-4 h-4 mr-1.5 text-gray-500"/>
          <span>{bathrooms}</span>
        </div>)}
      {squareFeet != null && (<div className="flex items-center" title={"".concat(squareFeet, " square feet")}>
          <lucide_react_1.Square className="w-4 h-4 mr-1.5 text-gray-500"/>
          <span>{squareFeet} sq ft</span>
        </div>)}
    </div>);
}
// ---------------------------------------------------------------------------
// Land variant
// ---------------------------------------------------------------------------
function LandFeatures(_a) {
    var _b, _c;
    var property = _a.property, locationString = _a.locationString, className = _a.className;
    var features = property.features;
    return (<div className={(0, utils_1.cn)('space-y-3', className)}>
      <div className="flex items-center text-muted-foreground">
        <lucide_react_1.MapPin className="w-4 h-4 mr-2 text-primary flex-shrink-0"/>
        <span className="text-sm line-clamp-1 font-medium">{locationString}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Size:</span>
          <span className="font-medium text-foreground">{(_b = features === null || features === void 0 ? void 0 : features.size) !== null && _b !== void 0 ? _b : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium text-foreground capitalize">
            {(_c = property.type) !== null && _c !== void 0 ? _c : property.category}
          </span>
        </div>
        {(features === null || features === void 0 ? void 0 : features.bedrooms) != null && (<div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <lucide_react_1.Bed className="w-3 h-3 mr-1"/>
              Beds:
            </span>
            <span className="font-medium text-foreground">{features.bedrooms}</span>
          </div>)}
        {(features === null || features === void 0 ? void 0 : features.bathrooms) != null && (<div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <lucide_react_1.Bath className="w-3 h-3 mr-1"/>
              Baths:
            </span>
            <span className="font-medium text-foreground">{features.bathrooms}</span>
          </div>)}
      </div>

      {features && (<div className="flex flex-wrap gap-2">
          {features.waterAccess && (<badge_1.Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              💧 Water Access
            </badge_1.Badge>)}
          {features.roadAccess && (<badge_1.Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
              🛣️ Road Access
            </badge_1.Badge>)}
          {features.electricityAccess && (<badge_1.Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
              ⚡ Electricity
            </badge_1.Badge>)}
        </div>)}
    </div>);
}
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
/**
 * Shared PropertyFeatures component.
 * Renders property features in a consistent format across PropertyCard and EnhancedLandCard.
 */
exports.PropertyFeatures = (0, react_1.memo)(function (_a) {
    var property = _a.property, locationString = _a.locationString, _b = _a.variant, variant = _b === void 0 ? 'standard' : _b, className = _a.className;
    if (variant === 'land') {
        return (<LandFeatures property={property} locationString={locationString} className={className}/>);
    }
    // 'standard' and 'compact' share the same layout — compact simply omits no extra data,
    // so a single implementation covers both.  The distinction is purely semantic for callers.
    var features = property.features;
    return (<div className={(0, utils_1.cn)('space-y-2', className)}>
        <LocationRow locationString={locationString}/>
        {features && (<FeaturePills bedrooms={features.bedrooms} bathrooms={features.bathrooms} squareFeet={features.squareFeet}/>)}
      </div>);
});
exports.PropertyFeatures.displayName = 'PropertyFeatures';
exports.default = exports.PropertyFeatures;
