"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptedFeaturesStep = AdaptedFeaturesStep;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var input_1 = require("../../../../local/components/ui/input");
var label_1 = require("../../../../local/components/ui/label");
var RESIDENTIAL_TYPES = ['apartment', 'house', 'villa', 'townhouse'];
var PROPERTY_FEATURES = [
    'Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony',
    'Security', 'Generator', 'Water Supply', 'Internet', 'Furnished'
];
function AdaptedFeaturesStep(_a) {
    var data = _a.data, onUpdate = _a.onUpdate, onValidation = _a.onValidation, propertyType = _a.propertyType;
    var isResidential = RESIDENTIAL_TYPES.includes(propertyType);
    // Validate step whenever data changes
    (0, react_1.useEffect)(function () {
        var isValid = data.area > 0 && data.price > 0;
        if (isResidential) {
            isValid = isValid && (data.bedrooms || 0) > 0 && (data.bathrooms || 0) > 0;
        }
        onValidation === null || onValidation === void 0 ? void 0 : onValidation(isValid);
    }, [data.area, data.price, data.bedrooms, data.bathrooms, isResidential, onValidation]);
    // Handle feature changes
    var handleFeatureChange = (0, react_1.useCallback)(function (feature, checked) {
        var currentFeatures = data.features || [];
        var currentAmenities = data.amenities || [];
        if (checked) {
            // Add to both arrays for compatibility
            onUpdate({
                features: __spreadArray(__spreadArray([], currentFeatures.filter(function (f) { return f !== feature; }), true), [feature], false),
                amenities: __spreadArray(__spreadArray([], currentAmenities.filter(function (f) { return f !== feature; }), true), [feature], false)
            });
        }
        else {
            // Remove from both arrays
            onUpdate({
                features: currentFeatures.filter(function (f) { return f !== feature; }),
                amenities: currentAmenities.filter(function (f) { return f !== feature; })
            });
        }
    }, [data.features, data.amenities, onUpdate]);
    return (<div className="space-y-6">
      <div className="space-y-2">
        <label_1.Label htmlFor="price">Price (KSH) *</label_1.Label>
        <div className="relative">
          <lucide_react_1.DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input_1.Input id="price" type="number" placeholder="e.g., 15000000" value={data.price || ''} onChange={function (e) { return onUpdate({
            price: Number(e.target.value) || 0
        }); }} className="pl-10"/>
        </div>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="area">Size/Area *</label_1.Label>
        <input_1.Input id="area" placeholder="e.g., 150 (sqm) or 2 (acres)" value={data.area || ''} onChange={function (e) {
            var value = e.target.value;
            var numericValue = parseFloat(value) || 0;
            onUpdate({ area: numericValue });
        }}/>
      </div>

      {isResidential && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="bedrooms">Bedrooms *</label_1.Label>
            <input_1.Input id="bedrooms" type="number" placeholder="e.g., 3" value={data.bedrooms || ''} onChange={function (e) { return onUpdate({ bedrooms: Number(e.target.value) || 0 }); }}/>
          </div>

          <div className="space-y-2">
            <label_1.Label htmlFor="bathrooms">Bathrooms *</label_1.Label>
            <input_1.Input id="bathrooms" type="number" placeholder="e.g., 2" value={data.bathrooms || ''} onChange={function (e) { return onUpdate({ bathrooms: Number(e.target.value) || 0 }); }}/>
          </div>
        </div>)}

      <div className="space-y-2">
        <label_1.Label>Features & Amenities</label_1.Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PROPERTY_FEATURES.map(function (feature) {
            var isChecked = (data.features || []).includes(feature) || (data.amenities || []).includes(feature);
            return (<label key={feature} className="flex items-center space-x-2">
                <input type="checkbox" checked={isChecked} onChange={function (e) { return handleFeatureChange(feature, e.target.checked); }} className="rounded border-gray-300"/>
                <span className="text-sm">{feature}</span>
              </label>);
        })}
        </div>
      </div>
    </div>);
}
