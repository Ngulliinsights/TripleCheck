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
exports.ResidentialFiltersComponent = ResidentialFiltersComponent;
exports.ResidentialFilters = ResidentialFiltersComponent;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../ui/badge");
var button_1 = require("../../ui/button");
var card_1 = require("../../ui/card");
var label_1 = require("../../ui/label");
var BasePropertyFilters_1 = require("./BasePropertyFilters");
var PROPERTY_TYPES = [
    { value: "apartment", label: "Apartment", icon: "🏢" },
    { value: "house", label: "House", icon: "🏠" },
    { value: "duplex", label: "Duplex", icon: "🏘️" },
    { value: "penthouse", label: "Penthouse", icon: "🏙️" },
    { value: "studio", label: "Studio", icon: "🏠" },
    { value: "townhouse", label: "Townhouse", icon: "🏘️" },
    { value: "villa", label: "Villa", icon: "🏛️" },
];
var POPULAR_AMENITIES = [
    "Swimming Pool",
    "Gym",
    "Parking",
    "Security",
    "Garden",
    "Balcony",
    "Elevator",
    "Generator",
    "Water Tank",
    "Internet",
    "Air Conditioning",
    "Fireplace",
];
/**
 * Residential property filters component
 * Extends base filters with residential-specific options
 */
function ResidentialFiltersComponent(_a) {
    var filters = _a.filters, onChange = _a.onChange, onReset = _a.onReset, _b = _a.errors, errors = _b === void 0 ? {} : _b;
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        var _a;
        onChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    }, [filters, onChange]);
    var toggleAmenity = (0, react_1.useCallback)(function (amenity) {
        var currentAmenities = filters.amenities || [];
        var newAmenities = currentAmenities.includes(amenity) ?
            currentAmenities.filter(function (a) { return a !== amenity; })
            : __spreadArray(__spreadArray([], currentAmenities, true), [amenity], false);
        updateFilter("amenities", newAmenities);
    }, [filters.amenities, updateFilter]);
    var clearAmenities = (0, react_1.useCallback)(function () {
        updateFilter("amenities", []);
    }, [updateFilter]);
    return (<div className="space-y-6">
      {/* Base Filters */}
      <BasePropertyFilters_1.BasePropertyFiltersComponent filters={filters} onChange={function (baseFilters) {
            return onChange(__assign(__assign(__assign({}, filters), baseFilters), { category: "residential" }));
        }} onReset={onReset} errors={errors}/>

      {/* Residential-Specific Filters */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Home className="w-5 h-5"/>
            Residential Filters
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          {/* Property Type */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Property Type</label_1.Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map(function (type) { return (<button_1.Button key={type.value} variant={filters.propertyType === type.value ? "default" : "outline"} size="sm" onClick={function () {
                return updateFilter("propertyType", filters.propertyType === type.value ? "" : type.value);
            }} className="justify-start">
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button_1.Button>); })}
            </div>
          </div>

          {/* Bedrooms and Bathrooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bedrooms */}
            <div className="space-y-3">
              <label_1.Label className="flex items-center gap-2">
                <lucide_react_1.Bed className="w-4 h-4"/>
                Minimum Bedrooms
              </label_1.Label>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(function (num) { return (<button_1.Button key={num} variant={filters.bedrooms === num ? "default" : "outline"} size="sm" onClick={function () {
                return updateFilter("bedrooms", filters.bedrooms === num ? null : num);
            }} className="aspect-square">
                    {num}
                  </button_1.Button>); })}
              </div>
              {filters.bedrooms && (<p className="text-sm text-muted-foreground">
                  Showing properties with {filters.bedrooms}+ bedrooms
                </p>)}
            </div>

            {/* Bathrooms */}
            <div className="space-y-3">
              <label_1.Label className="flex items-center gap-2">
                <lucide_react_1.Bath className="w-4 h-4"/>
                Minimum Bathrooms
              </label_1.Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(function (num) { return (<button_1.Button key={num} variant={filters.bathrooms === num ? "default" : "outline"} size="sm" onClick={function () {
                return updateFilter("bathrooms", filters.bathrooms === num ? null : num);
            }} className="aspect-square">
                    {num}
                  </button_1.Button>); })}
              </div>
              {filters.bathrooms && (<p className="text-sm text-muted-foreground">
                  Showing properties with {filters.bathrooms}+ bathrooms
                </p>)}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label_1.Label className="flex items-center gap-2">
                <lucide_react_1.Star className="w-4 h-4"/>
                Amenities
              </label_1.Label>
              {filters.amenities && filters.amenities.length > 0 && (<button_1.Button variant="ghost" size="sm" onClick={clearAmenities} className="text-muted-foreground">
                  Clear all
                </button_1.Button>)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {POPULAR_AMENITIES.map(function (amenity) {
            var _a;
            var isSelected = ((_a = filters.amenities) === null || _a === void 0 ? void 0 : _a.includes(amenity)) || false;
            return (<button_1.Button key={amenity} variant={isSelected ? "default" : "outline"} size="sm" onClick={function () { return toggleAmenity(amenity); }} className="justify-start text-xs">
                    {amenity}
                  </button_1.Button>);
        })}
            </div>
            {filters.amenities && filters.amenities.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {filters.amenities.map(function (amenity) { return (<badge_1.Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </badge_1.Badge>); })}
              </div>)}
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <label_1.Label className="text-sm font-medium">
              Additional Preferences
            </label_1.Label>
            <div className="space-y-3">
              {/* Furnished */}
              <div className="flex items-center space-x-2">
                <input id="furnished" type="checkbox" checked={filters.furnished === true} onChange={function (e) {
            return updateFilter("furnished", e.target.checked ? true : undefined);
        }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Furnished properties only" title="Furnished properties only"/>
                <label_1.Label htmlFor="furnished" className="flex items-center gap-2 cursor-pointer">
                  <lucide_react_1.Heart className="w-4 h-4"/>
                  Furnished properties only
                </label_1.Label>
              </div>

              {/* Pet Friendly */}
              <div className="flex items-center space-x-2">
                <input id="pet-friendly" type="checkbox" checked={filters.petFriendly === true} onChange={function (e) {
            return updateFilter("petFriendly", e.target.checked ? true : undefined);
        }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Pet-friendly properties only" title="Pet-friendly properties only"/>
                <label_1.Label htmlFor="pet-friendly" className="flex items-center gap-2 cursor-pointer">
                  <lucide_react_1.PawPrint className="w-4 h-4"/>
                  Pet-friendly properties only
                </label_1.Label>
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
// Export as default for lazy loading
exports.default = ResidentialFiltersComponent;
