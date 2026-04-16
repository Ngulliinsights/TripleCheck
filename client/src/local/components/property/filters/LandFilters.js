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
exports.default = LandFilters;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../ui/button");
var card_1 = require("../../ui/card");
var input_1 = require("../../ui/input");
var label_1 = require("../../ui/label");
var BasePropertyFilters_1 = require("./BasePropertyFilters");
var LAND_TYPES = [
    { value: 'residential', label: 'Residential', icon: '🏠', description: 'For housing development' },
    { value: 'commercial', label: 'Commercial', icon: '🏢', description: 'For business use' },
    { value: 'agricultural', label: 'Agricultural', icon: '🌾', description: 'For farming' },
    { value: 'industrial', label: 'Industrial', icon: '🏭', description: 'For manufacturing' },
];
var SIZE_RANGES = [
    { min: '', max: '1', label: 'Under 1 acre' },
    { min: '1', max: '5', label: '1-5 acres' },
    { min: '5', max: '10', label: '5-10 acres' },
    { min: '10', max: '50', label: '10-50 acres' },
    { min: '50', max: '', label: '50+ acres' },
];
/**
 * Land-specific property filters component
 * Extends BasePropertyFilters with land-specific options
 */
function LandFilters(_a) {
    var filters = _a.filters, onChange = _a.onChange, onReset = _a.onReset, _b = _a.errors, errors = _b === void 0 ? {} : _b, _c = _a.className, className = _c === void 0 ? "" : _c;
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        var _a;
        onChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    }, [filters, onChange]);
    var setSizeRange = (0, react_1.useCallback)(function (min, max) {
        updateFilter('sizeMin', min);
        updateFilter('sizeMax', max);
    }, [updateFilter]);
    var toggleAccess = (0, react_1.useCallback)(function (accessType) {
        updateFilter(accessType, !filters[accessType]);
    }, [filters, updateFilter]);
    return (<div className={"space-y-6 ".concat(className)}>
      {/* Base Filters */}
      <BasePropertyFilters_1.BasePropertyFiltersComponent filters={filters} onChange={function (baseFilters) { return onChange(__assign(__assign(__assign({}, filters), baseFilters), { category: "land" })); }} onReset={onReset} errors={errors}/>

      {/* Land-Specific Filters */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.TreePine className="w-5 h-5"/>
            Land Filters
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-6">
          {/* Land Type */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Land Type</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {LAND_TYPES.map(function (type) { return (<button_1.Button key={type.value} variant={filters.landType === type.value ? 'default' : 'outline'} size="sm" onClick={function () { return updateFilter('landType', filters.landType === type.value ? '' : type.value); }} className="flex flex-col items-center p-4 h-auto">
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {type.description}
                  </span>
                </button_1.Button>); })}
            </div>
          </div>

          {/* Land Size */}
          <div className="space-y-3">
            <label_1.Label className="flex items-center gap-2">
              <lucide_react_1.Ruler className="w-4 h-4"/>
              Land Size (acres)
            </label_1.Label>
            
            {/* Quick Size Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SIZE_RANGES.map(function (range, index) { return (<button_1.Button key={index} variant={filters.sizeMin === range.min && filters.sizeMax === range.max ? 'default' : 'outline'} size="sm" onClick={function () { return setSizeRange(range.min, range.max); }} className="text-xs">
                  {range.label}
                </button_1.Button>); })}
            </div>

            {/* Custom Size Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label_1.Label htmlFor="sizeMin" className="text-sm text-muted-foreground">
                  Minimum Size (acres)
                </label_1.Label>
                <input_1.Input id="sizeMin" type="text" placeholder="0" value={filters.sizeMin || ''} onChange={function (e) { return updateFilter('sizeMin', e.target.value); }} className={errors.sizeMin ? 'border-red-500' : ''}/>
                {errors.sizeMin && (<p className="text-sm text-red-600">{errors.sizeMin}</p>)}
              </div>
              <div className="space-y-1">
                <label_1.Label htmlFor="sizeMax" className="text-sm text-muted-foreground">
                  Maximum Size (acres)
                </label_1.Label>
                <input_1.Input id="sizeMax" type="text" placeholder="No limit" value={filters.sizeMax || ''} onChange={function (e) { return updateFilter('sizeMax', e.target.value); }} className={errors.sizeMax ? 'border-red-500' : ''}/>
                {errors.sizeMax && (<p className="text-sm text-red-600">{errors.sizeMax}</p>)}
              </div>
            </div>
          </div>

          {/* Access Requirements */}
          <div className="space-y-4">
            <label_1.Label className="text-sm font-medium">Access Requirements</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Water Access */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="waterAccess" type="checkbox" checked={filters.waterAccess || false} onChange={function () { return toggleAccess('waterAccess'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Water access available" title="Water access available"/>
                <label_1.Label htmlFor="waterAccess" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Droplets className="w-4 h-4 text-blue-500"/>
                  <div>
                    <div className="font-medium">Water Access</div>
                    <div className="text-xs text-muted-foreground">Municipal or borehole water</div>
                  </div>
                </label_1.Label>
              </div>

              {/* Road Access */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="roadAccess" type="checkbox" checked={filters.roadAccess || false} onChange={function () { return toggleAccess('roadAccess'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Road access available" title="Road access available"/>
                <label_1.Label htmlFor="roadAccess" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Car className="w-4 h-4 text-gray-600"/>
                  <div>
                    <div className="font-medium">Road Access</div>
                    <div className="text-xs text-muted-foreground">All-weather road access</div>
                  </div>
                </label_1.Label>
              </div>

              {/* Electricity Access */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input id="electricityAccess" type="checkbox" checked={filters.electricityAccess || false} onChange={function () { return toggleAccess('electricityAccess'); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Electricity access available" title="Electricity access available"/>
                <label_1.Label htmlFor="electricityAccess" className="flex items-center gap-2 cursor-pointer flex-1">
                  <lucide_react_1.Zap className="w-4 h-4 text-yellow-500"/>
                  <div>
                    <div className="font-medium">Electricity</div>
                    <div className="text-xs text-muted-foreground">Grid connection available</div>
                  </div>
                </label_1.Label>
              </div>
            </div>
          </div>

          {/* Quick Land Filters */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Quick Filters</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('landType', 'residential');
            setSizeRange('', '5');
            updateFilter('waterAccess', true);
            updateFilter('roadAccess', true);
        }} className="flex items-center gap-2 text-xs">
                🏠 Residential Plot
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('landType', 'agricultural');
            setSizeRange('5', '50');
            updateFilter('waterAccess', true);
        }} className="flex items-center gap-2 text-xs">
                🌾 Farm Land
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('landType', 'commercial');
            setSizeRange('1', '10');
            updateFilter('roadAccess', true);
            updateFilter('electricityAccess', true);
        }} className="flex items-center gap-2 text-xs">
                🏢 Commercial Plot
              </button_1.Button>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
