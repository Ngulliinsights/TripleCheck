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
exports.BasePropertyFiltersComponent = BasePropertyFiltersComponent;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var HOVER_BG_TRANSPARENT = 'hover:bg-transparent';
var badge_1 = require("../../ui/badge");
var button_1 = require("../../ui/button");
var card_1 = require("../../ui/card");
var input_1 = require("../../ui/input");
var label_1 = require("../../ui/label");
/**
 * Base property filters component
 * Provides common filtering functionality shared across all property types
 */
function BasePropertyFiltersComponent(_a) {
    var filters = _a.filters, onChange = _a.onChange, onReset = _a.onReset, _b = _a.errors, errors = _b === void 0 ? {} : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        var _a;
        onChange(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    }, [filters, onChange]);
    var clearFilter = (0, react_1.useCallback)(function (key) {
        var defaultValues = {
            query: '',
            location: '',
            priceMin: null,
            priceMax: null,
            verified: false,
            category: null,
        };
        updateFilter(key, defaultValues[key]);
    }, [updateFilter]);
    var hasActiveFilters = Object.entries(filters).some(function (_a) {
        var key = _a[0], value = _a[1];
        if (key === 'query' || key === 'location')
            return value !== '';
        if (key === 'priceMin' || key === 'priceMax')
            return value !== null;
        if (key === 'verified')
            return value === true;
        if (key === 'category')
            return value !== null;
        return false;
    });
    return (<card_1.Card className={"".concat(className)}>
      <card_1.CardContent className="p-6 space-y-6">
        {/* Search and Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Query */}
          <div className="space-y-2">
            <label_1.Label htmlFor="search-query" className="flex items-center gap-2">
              <lucide_react_1.Search className="w-4 h-4"/>
              Search Properties
            </label_1.Label>
            <div className="relative">
              <input_1.Input id="search-query" type="text" placeholder="Search by title, description..." value={filters.query} onChange={function (e) { return updateFilter('query', e.target.value); }} className={errors.query ? 'border-red-500' : ''}/>
              {filters.query && (<button_1.Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={function () { return clearFilter('query'); }}>
                  <lucide_react_1.X className="w-3 h-3"/>
                </button_1.Button>)}
            </div>
            {errors.query && (<p className="text-sm text-red-600">{errors.query}</p>)}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label_1.Label htmlFor="location" className="flex items-center gap-2">
              <lucide_react_1.MapPin className="w-4 h-4"/>
              Location
            </label_1.Label>
            <div className="relative">
              <input_1.Input id="location" type="text" placeholder="City, area, or region..." value={filters.location} onChange={function (e) { return updateFilter('location', e.target.value); }} className={errors.location ? 'border-red-500' : ''}/>
              {filters.location && (<button_1.Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={function () { return clearFilter('location'); }}>
                  <lucide_react_1.X className="w-3 h-3"/>
                </button_1.Button>)}
            </div>
            {errors.location && (<p className="text-sm text-red-600">{errors.location}</p>)}
          </div>
        </div>

        {/* Price Range Row */}
        <div className="space-y-2">
          <label_1.Label className="flex items-center gap-2">
            <lucide_react_1.DollarSign className="w-4 h-4"/>
            Price Range (KES)
          </label_1.Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label_1.Label htmlFor="price-min" className="text-sm text-muted-foreground">
                Minimum Price
              </label_1.Label>
              <input_1.Input id="price-min" type="number" placeholder="0" value={filters.priceMin || ''} onChange={function (e) {
            var value = e.target.value;
            updateFilter('priceMin', value ? parseInt(value, 10) : null);
        }} className={errors.priceMin ? 'border-red-500' : ''}/>
              {errors.priceMin && (<p className="text-sm text-red-600">{errors.priceMin}</p>)}
            </div>
            <div className="space-y-1">
              <label_1.Label htmlFor="price-max" className="text-sm text-muted-foreground">
                Maximum Price
              </label_1.Label>
              <input_1.Input id="price-max" type="number" placeholder="No limit" value={filters.priceMax || ''} onChange={function (e) {
            var value = e.target.value;
            updateFilter('priceMax', value ? parseInt(value, 10) : null);
        }} className={errors.priceMax ? 'border-red-500' : ''}/>
              {errors.priceMax && (<p className="text-sm text-red-600">{errors.priceMax}</p>)}
            </div>
          </div>
        </div>

        {/* Verification Filter */}
        <div className="flex items-center space-x-2">
          <input id="verified-only" type="checkbox" checked={filters.verified} onChange={function (e) { return updateFilter('verified', e.target.checked); }} className="rounded border-gray-300 text-primary focus:ring-primary" aria-label="Show only verified properties" title="Show only verified properties"/>
          <label_1.Label htmlFor="verified-only" className="flex items-center gap-2 cursor-pointer">
            <lucide_react_1.Shield className="w-4 h-4"/>
            Show only verified properties
          </label_1.Label>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (<div className="space-y-2">
            <label_1.Label className="text-sm font-medium">Active Filters:</label_1.Label>
            <div className="flex flex-wrap gap-2">
              {filters.query && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                  Search: &ldquo;{filters.query}&rdquo;
                  <button_1.Button variant="ghost" size="sm" className={"h-4 w-4 p-0 ".concat(HOVER_BG_TRANSPARENT)} onClick={function () { return clearFilter('query'); }}>
                    <lucide_react_1.X className="w-3 h-3"/>
                  </button_1.Button>
                </badge_1.Badge>)}
              {filters.location && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                  Location: &ldquo;{filters.location}&rdquo;
                  <button_1.Button variant="ghost" size="sm" className={"h-4 w-4 p-0 ".concat(HOVER_BG_TRANSPARENT)} onClick={function () { return clearFilter('location'); }}>
                    <lucide_react_1.X className="w-3 h-3"/>
                  </button_1.Button>
                </badge_1.Badge>)}
              {(filters.priceMin !== null || filters.priceMax !== null) && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                  Price: {filters.priceMin ? "KES ".concat(filters.priceMin.toLocaleString()) : '0'} - {filters.priceMax ? "KES ".concat(filters.priceMax.toLocaleString()) : '∞'}
                  <button_1.Button variant="ghost" size="sm" className={"h-4 w-4 p-0 ".concat(HOVER_BG_TRANSPARENT)} onClick={function () {
                    updateFilter('priceMin', null);
                    updateFilter('priceMax', null);
                }}>
                    <lucide_react_1.X className="w-3 h-3"/>
                  </button_1.Button>
                </badge_1.Badge>)}
              {filters.verified && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                  Verified Only
                  <button_1.Button variant="ghost" size="sm" className={"h-4 w-4 p-0 ".concat(HOVER_BG_TRANSPARENT)} onClick={function () { return clearFilter('verified'); }}>
                    <lucide_react_1.X className="w-3 h-3"/>
                  </button_1.Button>
                </badge_1.Badge>)}
            </div>
          </div>)}

        {/* Reset Button */}
        {hasActiveFilters && (<div className="flex justify-end">
            <button_1.Button variant="outline" onClick={onReset} size="sm">
              Clear All Filters
            </button_1.Button>
          </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
// Export as default for lazy loading
exports.default = BasePropertyFiltersComponent;
