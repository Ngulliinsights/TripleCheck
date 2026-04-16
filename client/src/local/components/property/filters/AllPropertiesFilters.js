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
exports.default = AllPropertiesFilters;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../ui/button");
var card_1 = require("../../ui/card");
var label_1 = require("../../ui/label");
var BasePropertyFilters_1 = require("./BasePropertyFilters");
var PROPERTY_CATEGORIES = [
    { value: 'residential', label: 'Residential', icon: lucide_react_1.Home, description: 'Houses, apartments, condos' },
    { value: 'commercial', label: 'Commercial', icon: lucide_react_1.Building2, description: 'Offices, retail, warehouses' },
    { value: 'land', label: 'Land', icon: lucide_react_1.TreePine, description: 'Plots, farms, development land' },
];
/**
 * Generic property filters component for all property types
 * Uses BasePropertyFilters with additional category selection
 */
function AllPropertiesFilters(_a) {
    var filters = _a.filters, onChange = _a.onChange, onReset = _a.onReset, _b = _a.errors, errors = _b === void 0 ? {} : _b, _c = _a.className, className = _c === void 0 ? "" : _c;
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        var _a;
        onChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    }, [filters, onChange]);
    return (<div className={"space-y-6 ".concat(className)}>
      {/* Base Filters */}
      <BasePropertyFilters_1.BasePropertyFiltersComponent filters={filters} onChange={onChange} onReset={onReset} errors={errors}/>

      {/* Category Selection */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Store className="w-5 h-5"/>
            Property Category
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Select Property Type</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PROPERTY_CATEGORIES.map(function (category) {
            var IconComponent = category.icon;
            return (<button_1.Button key={category.value} variant={filters.category === category.value ? 'default' : 'outline'} size="sm" onClick={function () { return updateFilter('category', filters.category === category.value ? null : category.value); }} className="flex flex-col items-center p-4 h-auto">
                    <IconComponent className="w-6 h-6 mb-2"/>
                    <span className="font-medium text-sm">{category.label}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {category.description}
                    </span>
                  </button_1.Button>);
        })}
            </div>
            {filters.category && (<p className="text-sm text-muted-foreground">
                Showing {filters.category} properties only
              </p>)}
          </div>

          {/* Quick All Properties Filters */}
          <div className="space-y-3">
            <label_1.Label className="text-sm font-medium">Quick Filters</label_1.Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('category', 'residential');
            updateFilter('verified', true);
        }} className="flex items-center gap-2 text-xs">
                🏠 Verified Homes
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('category', 'commercial');
            updateFilter('verified', true);
        }} className="flex items-center gap-2 text-xs">
                🏢 Business Properties
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('category', 'land');
            updateFilter('verified', true);
        }} className="flex items-center gap-2 text-xs">
                🌾 Verified Land
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            updateFilter('verified', true);
            updateFilter('priceMax', 10000000);
        }} className="flex items-center gap-2 text-xs">
                💎 Premium Properties
              </button_1.Button>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
