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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.AdvancedSearch = AdvancedSearch;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var checkbox_1 = require("../../local/components/ui/checkbox");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var separator_1 = require("../../local/components/ui/separator");
var slider_1 = require("../../local/components/ui/slider");
// Properly typed default filters that match the interface exactly
var DEFAULT_FILTERS = {
    query: "",
    location: "",
    propertyType: [], // Mutable array
    priceRange: [0, 10000000], // Mutable tuple
    squareFeet: [0, 10000], // Mutable tuple
    yearBuilt: [1950, new Date().getFullYear()], // Mutable tuple
    sortBy: "relevance",
    sortOrder: "desc",
    // Optional properties are omitted rather than set to undefined
};
// Property types configuration
var PROPERTY_TYPES = [
    { value: "apartment", label: "Apartment", icon: lucide_react_1.Home },
    { value: "house", label: "House", icon: lucide_react_1.Home },
    { value: "condo", label: "Condo", icon: lucide_react_1.Home },
    { value: "townhouse", label: "Townhouse", icon: lucide_react_1.Home },
    { value: "studio", label: "Studio", icon: lucide_react_1.Home },
];
// Available amenities
var AMENITIES = [
    "Swimming Pool",
    "Gym",
    "Security",
    "Parking",
    "Garden",
    "Balcony",
    "Elevator",
    "Generator",
    "Water Tank",
    "CCTV",
    "Playground",
    "Clubhouse",
    "Laundry",
    "Internet",
    "Air Conditioning",
];
// Location options
var LOCATIONS = [
    "Nairobi CBD",
    "Westlands",
    "Karen",
    "Kilimani",
    // cspell:disable-next-line - These are real locations in Kenya
    "Lavington",
    "Runda",
    // cspell:disable-next-line - These are real locations in Nairobi, Kenya
    "Kileleshwa",
    "Parklands",
    "Kasarani",
    "Embakasi",
    // cspell:disable-next-line - These are real cities in Kenya
    "Mombasa",
    "Nakuru",
    "Kisumu",
    "Eldoret",
    "Thika",
];
// Sorting options
var SORT_OPTIONS = [
    { value: "relevance", label: "Relevance" },
    { value: "price", label: "Price" },
    { value: "date", label: "Date Listed" },
    { value: "size", label: "Size" },
    { value: "trust_score", label: "Trust Score" },
];
function AdvancedSearch(_a) {
    var _this = this;
    var _b, _c, _d;
    var onSearch = _a.onSearch, onReset = _a.onReset, _e = _a.initialFilters, initialFilters = _e === void 0 ? {} : _e, _f = _a.isLoading, isLoading = _f === void 0 ? false : _f, _g = _a.className, className = _g === void 0 ? "" : _g;
    // Initialize state with proper type merging
    var _h = (0, react_1.useState)(function () { return (__assign(__assign({}, DEFAULT_FILTERS), initialFilters)); }), filters = _h[0], setFilters = _h[1];
    var _j = (0, react_1.useState)(false), isExpanded = _j[0], setIsExpanded = _j[1];
    // Get saved searches for quick access
    var savedSearches = (0, react_query_1.useQuery)({
        queryKey: ["/api/searches/saved"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock data with proper typing
                return [2 /*return*/, [
                        {
                            id: 1,
                            name: "Westlands Apartments",
                            filters: {
                                location: "Westlands",
                                propertyType: ["apartment"],
                            },
                        },
                        {
                            id: 2,
                            name: "Family Homes Karen",
                            filters: {
                                location: "Karen",
                                bedrooms: 3,
                                propertyType: ["house"],
                            },
                        },
                    ]];
            });
        }); },
    }).data;
    // Type-safe filter update function
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        setFilters(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    // Enhanced array filter toggle with proper typing
    var toggleArrayFilter = (0, react_1.useCallback)(function (key, value) {
        setFilters(function (prev) {
            var _a;
            var currentArray = prev[key] || [];
            var newArray = currentArray.includes(value) ?
                currentArray.filter(function (item) { return item !== value; })
                : __spreadArray(__spreadArray([], currentArray, true), [value], false);
            return __assign(__assign({}, prev), (_a = {}, _a[key] = newArray, _a));
        });
    }, []);
    // Search handler with proper error handling
    var handleSearch = (0, react_1.useCallback)(function () {
        try {
            onSearch(filters);
        }
        catch (error) {
            console.error("Search failed:", error);
        }
    }, [filters, onSearch]);
    // Reset handler that maintains type safety
    var handleReset = (0, react_1.useCallback)(function () {
        setFilters(__assign({}, DEFAULT_FILTERS));
        onReset();
    }, [onReset]);
    // Optimized filter count calculation
    var appliedFiltersCount = (0, react_1.useMemo)(function () {
        var count = 0;
        // Check each filter condition systematically
        if (filters.query.trim())
            count++;
        if (filters.location)
            count++;
        if (filters.propertyType.length > 0)
            count++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000)
            count++;
        if (filters.bedrooms !== undefined)
            count++;
        if (filters.bathrooms !== undefined)
            count++;
        if (filters.amenities && filters.amenities.length > 0)
            count++;
        if (filters.verificationStatus && filters.verificationStatus.length > 0)
            count++;
        if (filters.furnished !== undefined)
            count++;
        if (filters.petFriendly !== undefined)
            count++;
        if (filters.parkingSpaces !== undefined)
            count++;
        return count;
    }, [filters]);
    // Price formatting utility
    var formatPrice = (0, react_1.useCallback)(function (price) {
        if (price >= 1000000) {
            return "".concat((price / 1000000).toFixed(1), "M");
        }
        if (price >= 1000) {
            return "".concat((price / 1000).toFixed(0), "K");
        }
        return price.toString();
    }, []);
    // Helper function to safely handle select values
    var handleSelectChange = (0, react_1.useCallback)(function (key, value) {
        var numericValue = value ? parseInt(value, 10) : undefined;
        updateFilter(key, numericValue);
    }, [updateFilter]);
    // Helper function for boolean select changes
    var handleBooleanSelectChange = (0, react_1.useCallback)(function (key, value) {
        var booleanValue = value === "" ? undefined : value === "true";
        updateFilter(key, booleanValue);
    }, [updateFilter]);
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Search className="h-5 w-5"/>
            Advanced Search
            {appliedFiltersCount > 0 && (<badge_1.Badge variant="secondary" className="ml-2">
                {appliedFiltersCount} filter
                {appliedFiltersCount !== 1 ? "s" : ""}
              </badge_1.Badge>)}
          </card_1.CardTitle>
          <div className="flex items-center gap-2">
            <button_1.Button variant="outline" size="sm" onClick={function () { return setIsExpanded(!isExpanded); }} aria-expanded={isExpanded} aria-controls="advanced-filters">
              <lucide_react_1.Sliders className="h-4 w-4 mr-2"/>
              {isExpanded ? "Simple" : "Advanced"}
            </button_1.Button>
            {appliedFiltersCount > 0 && (<button_1.Button variant="ghost" size="sm" onClick={handleReset} disabled={isLoading}>
                <lucide_react_1.X className="h-4 w-4 mr-2"/>
                Clear
              </button_1.Button>)}
          </div>
        </div>
      </card_1.CardHeader>

      <card_1.CardContent className="space-y-6">
        {/* Basic Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="search-query">Search Keywords</label_1.Label>
            <div className="relative">
              <lucide_react_1.Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
              <input_1.Input id="search-query" placeholder="Property title, description..." value={filters.query} onChange={function (e) { return updateFilter("query", e.target.value); }} className="pl-9"/>
            </div>
          </div>

          <div className="space-y-2">
            <label_1.Label htmlFor="location">Location</label_1.Label>
            <select_1.Select value={filters.location || ""} onValueChange={function (value) { return updateFilter("location", value); }}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Select location"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="">All Locations</select_1.SelectItem>
                {LOCATIONS.map(function (location) { return (<select_1.SelectItem key={location} value={location}>
                    {location}
                  </select_1.SelectItem>); })}
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          <div className="space-y-2">
            <label_1.Label>Sort By</label_1.Label>
            <div className="flex gap-2">
              <select_1.Select value={filters.sortBy} onValueChange={function (value) { return updateFilter("sortBy", value); }}>
                <select_1.SelectTrigger className="flex-1">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  {SORT_OPTIONS.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>
              <button_1.Button variant="outline" size="sm" onClick={function () {
            return updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
        }} title={"Currently sorting ".concat(filters.sortOrder === "asc" ? "ascending" : "descending")}>
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </button_1.Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Section */}
        {isExpanded && (<div id="advanced-filters">
            <separator_1.Separator />

            {/* Property Type Selection */}
            <div className="space-y-3 mt-6">
              <label_1.Label>Property Type</label_1.Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(function (type) { return (<button_1.Button key={type.value} variant={filters.propertyType.includes(type.value) ?
                    "default"
                    : "outline"} size="sm" onClick={function () {
                    return toggleArrayFilter("propertyType", type.value);
                }} className="flex items-center gap-2">
                    <type.icon className="h-4 w-4"/>
                    {type.label}
                  </button_1.Button>); })}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3">
              <label_1.Label>Price Range (KES)</label_1.Label>
              <div className="px-3">
                <slider_1.Slider value={__spreadArray([], filters.priceRange, true)} // Spread to create mutable array for Slider
         onValueChange={function (value) {
                return updateFilter("priceRange", value);
            }} max={10000000} min={0} step={50000} className="w-full"/>
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>KES {formatPrice(filters.priceRange[0])}</span>
                  <span>KES {formatPrice(filters.priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Room Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label_1.Label>Bedrooms</label_1.Label>
                <select_1.Select value={((_b = filters.bedrooms) === null || _b === void 0 ? void 0 : _b.toString()) || ""} onValueChange={function (value) {
                return handleSelectChange("bedrooms", value);
            }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Any"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">Any</select_1.SelectItem>
                    {[0, 1, 2, 3, 4, 5].map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                        {num === 0 ?
                    "Studio"
                    : "".concat(num, "+ bed").concat(num > 1 ? "s" : "")}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="space-y-2">
                <label_1.Label>Bathrooms</label_1.Label>
                <select_1.Select value={((_c = filters.bathrooms) === null || _c === void 0 ? void 0 : _c.toString()) || ""} onValueChange={function (value) {
                return handleSelectChange("bathrooms", value);
            }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Any"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">Any</select_1.SelectItem>
                    {[1, 2, 3, 4, 5].map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                        {num}+ bath{num > 1 ? "s" : ""}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="space-y-2">
                <label_1.Label>Parking</label_1.Label>
                <select_1.Select value={((_d = filters.parkingSpaces) === null || _d === void 0 ? void 0 : _d.toString()) || ""} onValueChange={function (value) {
                return handleSelectChange("parkingSpaces", value);
            }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Any"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">Any</select_1.SelectItem>
                    {[0, 1, 2, 3, 4].map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                        {num === 0 ?
                    "No parking"
                    : "".concat(num, "+ space").concat(num > 1 ? "s" : "")}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>

            {/* Amenities Selection */}
            <div className="space-y-3">
              <label_1.Label>Amenities</label_1.Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {AMENITIES.map(function (amenity) {
                var _a;
                return (<div key={amenity} className="flex items-center space-x-2">
                    <checkbox_1.Checkbox id={"amenity-".concat(amenity)} checked={((_a = filters.amenities) === null || _a === void 0 ? void 0 : _a.includes(amenity)) || false} onCheckedChange={function () {
                        return toggleArrayFilter("amenities", amenity);
                    }}/>
                    <label_1.Label htmlFor={"amenity-".concat(amenity)} className="text-sm cursor-pointer">
                      {amenity}
                    </label_1.Label>
                  </div>);
            })}
              </div>
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label_1.Label>Furnished</label_1.Label>
                <select_1.Select value={filters.furnished === undefined ?
                ""
                : filters.furnished.toString()} onValueChange={function (value) {
                return handleBooleanSelectChange("furnished", value);
            }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Any"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">Any</select_1.SelectItem>
                    <select_1.SelectItem value="true">Furnished</select_1.SelectItem>
                    <select_1.SelectItem value="false">Unfurnished</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="space-y-2">
                <label_1.Label>Pet Friendly</label_1.Label>
                <select_1.Select value={filters.petFriendly === undefined ?
                ""
                : filters.petFriendly.toString()} onValueChange={function (value) {
                return handleBooleanSelectChange("petFriendly", value);
            }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Any"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="">Any</select_1.SelectItem>
                    <select_1.SelectItem value="true">Pet Friendly</select_1.SelectItem>
                    <select_1.SelectItem value="false">No Pets</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="space-y-2">
                <label_1.Label>Verification Status</label_1.Label>
                <div className="flex flex-wrap gap-2">
                  {["verified", "pending"].map(function (status) {
                var _a;
                return (<button_1.Button key={status} variant={((_a = filters.verificationStatus) === null || _a === void 0 ? void 0 : _a.includes(status)) ?
                        "default"
                        : "outline"} size="sm" onClick={function () {
                        return toggleArrayFilter("verificationStatus", status);
                    }} className="flex items-center gap-2">
                      <lucide_react_1.Shield className="h-4 w-4"/>
                      {status === "verified" ? "Verified" : "Pending"}
                    </button_1.Button>);
            })}
                </div>
              </div>
            </div>
          </div>)}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {savedSearches && savedSearches.length > 0 && (<select_1.Select onValueChange={function (value) {
                var saved = savedSearches.find(function (s) { return s.id.toString() === value; });
                if (saved === null || saved === void 0 ? void 0 : saved.filters) {
                    setFilters(function (prev) { return (__assign(__assign({}, prev), saved.filters)); });
                }
            }}>
                <select_1.SelectTrigger className="w-48">
                  <select_1.SelectValue placeholder="Saved searches"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  {savedSearches.map(function (search) { return (<select_1.SelectItem key={search.id} value={search.id.toString()}>
                      {search.name}
                    </select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>)}
          </div>

          <div className="flex items-center gap-2">
            <button_1.Button variant="outline" onClick={handleReset} disabled={isLoading}>
              Reset
            </button_1.Button>
            <button_1.Button onClick={handleSearch} disabled={isLoading} className="min-w-24">
              {isLoading ?
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>
            : <>
                  <lucide_react_1.Search className="h-4 w-4 mr-2"/>
                  Search
                </>}
            </button_1.Button>
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
exports.default = AdvancedSearch;
