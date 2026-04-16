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
exports.CommercialFilters = CommercialFiltersComponent;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../ui/badge");
var button_1 = require("../../ui/button");
var card_1 = require("../../ui/card");
var input_1 = require("../../ui/input");
var label_1 = require("../../ui/label");
var BasePropertyFilters_1 = require("./BasePropertyFilters");
var COMMERCIAL_TYPES = [
    { value: 'office', label: 'Office Space', icon: '🏢', description: 'Corporate offices and co-working' },
    { value: 'retail', label: 'Retail', icon: '🏪', description: 'Shops and shopping centers' },
    { value: 'warehouse', label: 'Warehouse', icon: '🏭', description: 'Storage and distribution' },
    { value: 'restaurant', label: 'Restaurant', icon: '🍽️', description: 'Food service establishments' },
    { value: 'hotel', label: 'Hotel', icon: '🏨', description: 'Hospitality and lodging' },
    { value: 'medical', label: 'Medical', icon: '🏥', description: 'Healthcare facilities' },
];
var FLOOR_RANGES = [
    { min: '', max: '1', label: 'Ground Floor Only' },
    { min: '1', max: '5', label: '1-5 Floors' },
    { min: '5', max: '10', label: '5-10 Floors' },
    { min: '10', max: '20', label: '10-20 Floors' },
    { min: '20', max: '', label: '20+ Floors' },
];
var AREA_RANGES = [
    { min: '', max: '100', label: 'Under 100 sqm' },
    { min: '100', max: '500', label: '100-500 sqm' },
    { min: '500', max: '1000', label: '500-1000 sqm' },
    { min: '1000', max: '5000', label: '1000-5000 sqm' },
    { min: '5000', max: '', label: '5000+ sqm' },
];
var BUSINESS_ZONES = [
    { value: 'cbd', label: 'CBD', description: 'Central Business District' },
    { value: 'westlands', label: 'Westlands', description: 'Commercial hub' },
    { value: 'upperhill', label: 'Upper Hill', description: 'Financial district' },
    { value: 'industrial', label: 'Industrial Area', description: 'Manufacturing zone' },
    { value: 'karen', label: 'Karen', description: 'Suburban commercial' },
    { value: 'kilimani', label: 'Kilimani', description: 'Mixed-use area' },
];
var ERROR_BORDER_CLASS = 'border-red-500';
/**
 * Commercial property filters component
 * Extends base filters with commercial-specific options
 */
function CommercialFiltersComponent(_a) {
    var filters = _a.filters, onChange = _a.onChange, onReset = _a.onReset, _b = _a.errors, errors = _b === void 0 ? {} : _b;
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        var _a;
        onChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    }, [filters, onChange]);
    var setAreaRange = (0, react_1.useCallback)(function (min, max) {
        updateFilter('areaMin', min);
        updateFilter('areaMax', max);
    }, [updateFilter]);
    var setFloorRange = (0, react_1.useCallback)(function (min, max) {
        updateFilter('floorsMin', min);
        updateFilter('floorsMax', max);
    }, [updateFilter]);
    var toggleAmenity = (0, react_1.useCallback)(function (amenity) {
        updateFilter(amenity, !filters[amenity]);
    }, [filters, updateFilter]);
    return (<div className="space-y-6">
      {/* Base Filters */}
      <BasePropertyFilters_1.BasePropertyFiltersComponent filters={filters} onChange={function (baseFilters) { return onChange(__assign(__assign(__assign({}, filters), baseFilters), { category: "commercial" })); }} onReset={onReset} errors={errors}/>

      {/* Commercial-Specific Filters */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Building className="w-5 h-5"/>
            Commercial Filters
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          {/* Commercial Type */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Commercial Type</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMMERCIAL_TYPES.map(function (type) { return (<button_1.Button key={type.value} variant={filters.commercialType === type.value ? 'default' : 'outline'} size="sm" onClick={function () { return updateFilter('commercialType', filters.commercialType === type.value ? '' : type.value); }} className="flex flex-col items-center p-4 h-auto">
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {type.description}
                  </span>
                </button_1.Button>); })}
            </div>
          </div>

          {/* Business Zones */}
          <div className="space-y-3">
            <label_1.Label className="flex items-center gap-2">
              <lucide_react_1.MapPin className="w-4 h-4"/>
              Business Zones
            </label_1.Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BUSINESS_ZONES.map(function (zone) { return (<button_1.Button key={zone.value} variant={filters.businessZone === zone.value ? 'default' : 'outline'} size="sm" onClick={function () { return updateFilter('businessZone', filters.businessZone === zone.value ? '' : zone.value); }} className="flex flex-col text-xs p-3">
                  <span className="font-medium">{zone.label}</span>
                  <span className="text-muted-foreground">{zone.description}</span>
                </button_1.Button>); })}
            </div>
          </div>

          {/* Floor Area */}
          <div className="space-y-3">
            <label_1.Label className="flex items-center gap-2">
              <lucide_react_1.Calculator className="w-4 h-4"/>
              Floor Area (sqm)
            </label_1.Label>
            
            {/* Quick Area Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AREA_RANGES.map(function (range, index) { return (<button_1.Button key={index} variant={filters.areaMin === range.min && filters.areaMax === range.max ? 'default' : 'outline'} size="sm" onClick={function () { return setAreaRange(range.min, range.max); }} className="text-xs">
                  {range.label}
                </button_1.Button>); })}
            </div>

            {/* Custom Area Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label_1.Label htmlFor="area-min" className="text-sm text-muted-foreground">
                  Minimum Area (sqm)
                </label_1.Label>
                <input_1.Input id="area-min" type="text" placeholder="0" value={filters.areaMin} onChange={function (e) { return updateFilter('areaMin', e.target.value); }} className={errors.areaMin ? ERROR_BORDER_CLASS : ''}/>
                {errors.areaMin && (<p className="text-sm text-red-600">{errors.areaMin}</p>)}
              </div>
              <div className="space-y-1">
                <label_1.Label htmlFor="area-max" className="text-sm text-muted-foreground">
                  Maximum Area (sqm)
                </label_1.Label>
                <input_1.Input id="area-max" type="text" placeholder="No limit" value={filters.areaMax} onChange={function (e) { return updateFilter('areaMax', e.target.value); }} className={errors.areaMax ? ERROR_BORDER_CLASS : ''}/>
                {errors.areaMax && (<p className="text-sm text-red-600">{errors.areaMax}</p>)}
              </div>
            </div>
          </div>

          {/* Number of Floors */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Number of Floors</label_1.Label>
            
            {/* Quick Floor Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {FLOOR_RANGES.map(function (range, index) { return (<button_1.Button key={index} variant={filters.floorsMin === range.min && filters.floorsMax === range.max ? 'default' : 'outline'} size="sm" onClick={function () { return setFloorRange(range.min, range.max); }} className="text-xs">
                  {range.label}
                </button_1.Button>); })}
            </div>

            {/* Custom Floor Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label_1.Label htmlFor="floors-min" className="text-sm text-muted-foreground">
                  Minimum Floors
                </label_1.Label>
                <input_1.Input id="floors-min" type="text" placeholder="1" value={filters.floorsMin} onChange={function (e) { return updateFilter('floorsMin', e.target.value); }} className={errors.floorsMin ? ERROR_BORDER_CLASS : ''}/>
                {errors.floorsMin && (<p className="text-sm text-red-600">{errors.floorsMin}</p>)}
              </div>
              <div className="space-y-1">
                <label_1.Label htmlFor="floors-max" className="text-sm text-muted-foreground">
                  Maximum Floors
                </label_1.Label>
                <input_1.Input id="floors-max" type="text" placeholder="No limit" value={filters.floorsMax} onChange={function (e) { return updateFilter('floorsMax', e.target.value); }} className={errors.floorsMax ? ERROR_BORDER_CLASS : ''}/>
                {errors.floorsMax && (<p className="text-sm text-red-600">{errors.floorsMax}</p>)}
              </div>
            </div>
          </div>

          {/* Commercial Amenities */}
          <div className="space-y-4">
            <label_1.Label className="text-sm font-medium">Commercial Amenities</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Parking */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="parking" type="checkbox" checked={filters.parking} onChange={function () { return toggleAmenity('parking'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Parking available" title="Parking available"/>
                <label_1.Label htmlFor="parking" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Car className="w-4 h-4 text-blue-500"/>
                  <div>
                    <div className="font-medium">Parking</div>
                    <div className="text-xs text-muted-foreground">Dedicated parking spaces</div>
                  </div>
                </label_1.Label>
              </div>

              {/* Elevator */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="elevator" type="checkbox" checked={filters.elevator} onChange={function () { return toggleAmenity('elevator'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Elevator available" title="Elevator available"/>
                <label_1.Label htmlFor="elevator" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Users className="w-4 h-4 text-gray-600"/>
                  <div>
                    <div className="font-medium">Elevator</div>
                    <div className="text-xs text-muted-foreground">Lift access available</div>
                  </div>
                </label_1.Label>
              </div>

              {/* Air Conditioning */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="air-conditioning" type="checkbox" checked={filters.airConditioning} onChange={function () { return toggleAmenity('airConditioning'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Air conditioning available" title="Air conditioning available"/>
                <label_1.Label htmlFor="air-conditioning" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Zap className="w-4 h-4 text-cyan-500"/>
                  <div>
                    <div className="font-medium">A/C</div>
                    <div className="text-xs text-muted-foreground">Climate control</div>
                  </div>
                </label_1.Label>
              </div>

              {/* Security */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="security" type="checkbox" checked={filters.security} onChange={function () { return toggleAmenity('security'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Security available" title="Security available"/>
                <label_1.Label htmlFor="security" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Shield className="w-4 h-4 text-red-500"/>
                  <div>
                    <div className="font-medium">Security</div>
                    <div className="text-xs text-muted-foreground">24/7 security service</div>
                  </div>
                </label_1.Label>
              </div>

              {/* WiFi */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="wifi" type="checkbox" checked={filters.wifi} onChange={function () { return toggleAmenity('wifi'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="WiFi available" title="WiFi available"/>
                <label_1.Label htmlFor="wifi" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Wifi className="w-4 h-4 text-purple-500"/>
                  <div>
                    <div className="font-medium">WiFi</div>
                    <div className="text-xs text-muted-foreground">High-speed internet</div>
                  </div>
                </label_1.Label>
              </div>

              {/* Generator */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="generator" type="checkbox" checked={filters.generator} onChange={function () { return toggleAmenity('generator'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Generator available" title="Generator available"/>
                <label_1.Label htmlFor="generator" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Zap className="w-4 h-4 text-yellow-500"/>
                  <div>
                    <div className="font-medium">Generator</div>
                    <div className="text-xs text-muted-foreground">Backup power supply</div>
                  </div>
                </label_1.Label>
              </div>
            </div>
          </div>

          {/* Quick Commercial Filters */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Quick Filters</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('commercialType', 'office');
            updateFilter('businessZone', 'cbd');
            updateFilter('parking', true);
            updateFilter('elevator', true);
            setAreaRange('100', '500');
        }} className="flex items-center gap-2 text-xs">
                🏢 CBD Office
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('commercialType', 'retail');
            updateFilter('parking', true);
            updateFilter('security', true);
            setAreaRange('50', '200');
        }} className="flex items-center gap-2 text-xs">
                🏪 Retail Space
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('commercialType', 'warehouse');
            updateFilter('businessZone', 'industrial');
            setAreaRange('1000', '5000');
        }} className="flex items-center gap-2 text-xs">
                🏭 Warehouse
              </button_1.Button>
            </div>
          </div>

          {/* Active Amenities Display */}
          {(filters.parking || filters.elevator || filters.airConditioning ||
            filters.security || filters.wifi || filters.generator) && (<div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <lucide_react_1.Building className="w-4 h-4"/>
                Selected Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {filters.parking && (<badge_1.Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                    <lucide_react_1.Car className="w-3 h-3"/>
                    Parking
                  </badge_1.Badge>)}
                {filters.elevator && (<badge_1.Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                    <lucide_react_1.Users className="w-3 h-3"/>
                    Elevator
                  </badge_1.Badge>)}
                {filters.airConditioning && (<badge_1.Badge className="bg-cyan-100 text-cyan-800 flex items-center gap-1">
                    <lucide_react_1.Zap className="w-3 h-3"/>
                    A/C
                  </badge_1.Badge>)}
                {filters.security && (<badge_1.Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                    <lucide_react_1.Shield className="w-3 h-3"/>
                    Security
                  </badge_1.Badge>)}
                {filters.wifi && (<badge_1.Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                    <lucide_react_1.Wifi className="w-3 h-3"/>
                    WiFi
                  </badge_1.Badge>)}
                {filters.generator && (<badge_1.Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <lucide_react_1.Zap className="w-3 h-3"/>
                    Generator
                  </badge_1.Badge>)}
              </div>
            </div>)}

          {/* Commercial Property Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <lucide_react_1.Building className="w-4 h-4"/>
              Commercial Property Features
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <lucide_react_1.Shield className="w-3 h-3"/>
                Business License Verified
              </div>
              <div className="flex items-center gap-2">
                <lucide_react_1.Car className="w-3 h-3"/>
                Parking Assessment
              </div>
              <div className="flex items-center gap-2">
                <lucide_react_1.Users className="w-3 h-3"/>
                Accessibility Compliance
              </div>
              <div className="flex items-center gap-2">
                <lucide_react_1.Zap className="w-3 h-3"/>
                Utility Infrastructure
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = CommercialFiltersComponent;
