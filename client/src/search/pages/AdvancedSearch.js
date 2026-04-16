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
exports.default = AdvancedSearch;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var checkbox_1 = require("../../local/components/ui/checkbox");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var slider_1 = require("../../local/components/ui/slider");
var property_1 = require("../../local/components/property");
var use_toast_1 = require("../../local/hooks/use-toast");
// Comprehensive default filters with all required properties properly initialized
var defaultFilters = {
    query: "",
    location: "",
    propertyType: [], // Properly initialized as empty array
    priceRange: [0, 100000000],
    // Optional fields are omitted to satisfy exactOptionalPropertyTypes
    areaMin: 0,
    areaMax: 10000,
    areaRange: [0, 10000],
    amenities: [], // Properly initialized as empty array
    verificationStatus: [], // Properly initialized as empty array
    listingAge: null,
    sortBy: "relevance",
};
// Property type configurations with icons for better UX
var propertyTypes = [
    { id: "apartment", label: "Apartment", icon: "🏢" },
    { id: "house", label: "House", icon: "🏠" },
    { id: "villa", label: "Villa", icon: "🏡" },
    { id: "townhouse", label: "Townhouse", icon: "🏘️" },
    { id: "land", label: "Land", icon: "🌍" },
    { id: "commercial", label: "Commercial", icon: "🏢" },
];
// Amenity configurations with mixed icon types (components and emojis)
var amenities = [
    { id: "parking", label: "Parking", icon: lucide_react_1.Car },
    { id: "wifi", label: "WiFi", icon: lucide_react_1.Wifi },
    { id: "security", label: "24/7 Security", icon: lucide_react_1.Shield },
    { id: "gym", label: "Gym", icon: "💪" },
    { id: "pool", label: "Swimming Pool", icon: "🏊" },
    { id: "garden", label: "Garden", icon: "🌳" },
    { id: "balcony", label: "Balcony", icon: "🏞️" },
    { id: "furnished", label: "Furnished", icon: "🛋️" },
];
// Verification status configurations with proper styling
var verificationStatuses = [
    { id: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
    {
        id: "pending",
        label: "Pending Verification",
        color: "bg-yellow-100 text-yellow-800",
    },
    { id: "unverified", label: "Unverified", color: "bg-gray-100 text-gray-800" },
];
// Sort options for organizing search results
var sortOptions = [
    { id: "relevance", label: "Most Relevant" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
    { id: "newest", label: "Newest First" },
    { id: "oldest", label: "Oldest First" },
    { id: "area-large", label: "Largest Area" },
    { id: "area-small", label: "Smallest Area" },
];
// Mock search results for demonstration - in real app, this would come from API
var mockResults = [
    {
        id: "1",
        title: "Modern 3BR Apartment in Westlands",
        description: "Spacious apartment with modern amenities",
        price: 15000000,
        location: "Westlands, Nairobi",
        // cspell:disable-next-line - Image filename from Unsplash
        images: ["/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg"],
        verified: true,
        type: "apartment",
        category: "residential",
        features: {
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200,
        },
        createdAt: new Date().toISOString(),
        status: "available",
        verificationStatus: "verified",
    },
    {
        id: "2",
        title: "Luxury Villa in Karen",
        description: "Beautiful villa with garden and pool",
        price: 45000000,
        location: "Karen, Nairobi",
        // cspell:disable-next-line - Image filename from Unsplash
        images: ["/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg"],
        verified: true,
        type: "villa",
        category: "residential",
        features: {
            bedrooms: 5,
            bathrooms: 4,
            squareFeet: 3500,
        },
        createdAt: new Date().toISOString(),
        status: "available",
        verificationStatus: "verified",
    },
];
function AdvancedSearch() {
    var _this = this;
    var _a, _b, _c, _d, _e;
    var toast = (0, use_toast_1.useToast)().toast;
    var _f = (0, react_1.useState)(defaultFilters), filters = _f[0], setFilters = _f[1];
    var _g = (0, react_1.useState)([]), results = _g[0], setResults = _g[1];
    var _h = (0, react_1.useState)(false), isSearching = _h[0], setIsSearching = _h[1];
    var _j = (0, react_1.useState)(false), showSaveDialog = _j[0], setShowSaveDialog = _j[1];
    var _k = (0, react_1.useState)([]), savedSearches = _k[0], setSavedSearches = _k[1];
    // Generic update function with proper typing and type safety
    // This function ensures we can only update properties that exist on AdvancedSearchFilters
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        setFilters(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    // Specialized helper function for toggling array values with complete type safety
    // This prevents runtime errors when working with array-based filters
    var toggleArrayFilter = (0, react_1.useCallback)(function (key, value) {
        setFilters(function (prev) {
            var _a;
            var currentValue = prev[key];
            var currentArray;
            // Handle the case where propertyType might be a string or string[]
            if (key === "propertyType") {
                currentArray =
                    Array.isArray(currentValue) ? currentValue
                        : currentValue ? [currentValue]
                            : [];
            }
            else {
                currentArray = currentValue || [];
            }
            var newArray = currentArray.includes(value) ?
                currentArray.filter(function (item) { return item !== value; })
                : __spreadArray(__spreadArray([], currentArray, true), [value], false);
            return __assign(__assign({}, prev), (_a = {}, _a[key] = newArray, _a));
        });
    }, []);
    // Enhanced search function with comprehensive filtering logic
    var handleSearch = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var filteredResults, queryLower_1, locationLower_1, propertyTypeArray;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setIsSearching(true);
                    // Simulate API call delay for realistic user experience
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Simulate API call delay for realistic user experience
                    _c.sent();
                    filteredResults = mockResults;
                    // Text-based filtering with proper null/undefined checks and trimming
                    if ((_a = filters.query) === null || _a === void 0 ? void 0 : _a.trim()) {
                        queryLower_1 = filters.query.toLowerCase();
                        filteredResults = filteredResults.filter(function (property) {
                            return property.title.toLowerCase().includes(queryLower_1) ||
                                property.description.toLowerCase().includes(queryLower_1);
                        });
                    }
                    if ((_b = filters.location) === null || _b === void 0 ? void 0 : _b.trim()) {
                        locationLower_1 = filters.location.toLowerCase();
                        filteredResults = filteredResults.filter(function (property) {
                            return property.location.toLowerCase().includes(locationLower_1);
                        });
                    }
                    propertyTypeArray = Array.isArray(filters.propertyType) ? filters.propertyType
                        : filters.propertyType ? [filters.propertyType]
                            : [];
                    if (propertyTypeArray.length > 0) {
                        filteredResults = filteredResults.filter(function (property) {
                            return propertyTypeArray.includes(property.type);
                        });
                    }
                    // Numerical filtering with proper undefined/null checks
                    if (filters.bedrooms !== undefined && filters.bedrooms !== null) {
                        filteredResults = filteredResults.filter(function (property) { var _a; return ((_a = property.features) === null || _a === void 0 ? void 0 : _a.bedrooms) === filters.bedrooms; });
                    }
                    if (filters.bathrooms !== undefined && filters.bathrooms !== null) {
                        filteredResults = filteredResults.filter(function (property) { var _a; return ((_a = property.features) === null || _a === void 0 ? void 0 : _a.bathrooms) === filters.bathrooms; });
                    }
                    // Price range filtering with proper bounds checking
                    filteredResults = filteredResults.filter(function (property) {
                        return property.price >= filters.priceRange[0] &&
                            property.price <= filters.priceRange[1];
                    });
                    // Verification status filtering with fallback for missing status
                    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
                        filteredResults = filteredResults.filter(function (property) {
                            return filters.verificationStatus.includes(property.verificationStatus || "unverified");
                        });
                    }
                    setResults(filteredResults);
                    setIsSearching(false);
                    // Provide user feedback with result count
                    toast({
                        title: "Search completed",
                        description: "Found ".concat(filteredResults.length, " properties matching your criteria."),
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [filters, toast]);
    // Reset function that restores all filters to default state
    var handleReset = (0, react_1.useCallback)(function () {
        setFilters(defaultFilters);
        setResults([]);
        toast({
            title: "Filters reset",
            description: "All search filters have been cleared.",
        });
    }, [toast]);
    // Enhanced save search function with comprehensive validation
    var handleSaveSearch = (0, react_1.useCallback)(function () {
        var _a;
        // Validate search name with proper trimming
        if (!((_a = filters.savedSearchName) === null || _a === void 0 ? void 0 : _a.trim())) {
            toast({
                title: "Please enter a name",
                description: "Give your saved search a name to continue.",
                variant: "destructive",
            });
            return;
        }
        // Check for duplicate search names
        if (savedSearches.some(function (search) {
            return search.name.toLowerCase() ===
                filters.savedSearchName.trim().toLowerCase();
        })) {
            toast({
                title: "Name already exists",
                description: "Please choose a different name for this search.",
                variant: "destructive",
            });
            return;
        }
        // Create new saved search with proper data structure
        var newSavedSearch = {
            id: Date.now().toString(),
            name: filters.savedSearchName.trim(),
            filters: __assign({}, filters), // Deep copy to avoid reference issues
            createdAt: new Date(),
            alertsEnabled: true,
        };
        setSavedSearches(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newSavedSearch], false); });
        setShowSaveDialog(false);
        updateFilter("savedSearchName", "");
        toast({
            title: "Search saved",
            description: "\"".concat(newSavedSearch.name, "\" has been saved to your searches."),
        });
    }, [filters, savedSearches, toast, updateFilter]);
    // Function to load a previously saved search
    var loadSavedSearch = (0, react_1.useCallback)(function (savedSearch) {
        setFilters(__assign({}, savedSearch.filters)); // Create new object to trigger re-render
        toast({
            title: "Search loaded",
            description: "Loaded \"".concat(savedSearch.name, "\" search criteria."),
        });
    }, [toast]);
    // Optimized calculation of active filters count using useMemo for performance
    var activeFiltersCount = (0, react_1.useMemo)(function () {
        var _a, _b;
        var count = 0;
        // Count text-based filters
        if ((_a = filters.query) === null || _a === void 0 ? void 0 : _a.trim())
            count++;
        if ((_b = filters.location) === null || _b === void 0 ? void 0 : _b.trim())
            count++;
        // Count array-based filters
        if (filters.propertyType && filters.propertyType.length > 0)
            count++;
        if (filters.amenities && filters.amenities.length > 0)
            count++;
        if (filters.verificationStatus && filters.verificationStatus.length > 0)
            count++;
        // Count numerical filters
        if (filters.bedrooms !== undefined && filters.bedrooms !== null)
            count++;
        if (filters.bathrooms !== undefined && filters.bathrooms !== null)
            count++;
        // Count other filters
        if (filters.listingAge !== null)
            count++;
        // Count price range only if it's different from default
        if (filters.priceRange[0] !== defaultFilters.priceRange[0] ||
            filters.priceRange[1] !== defaultFilters.priceRange[1])
            count++;
        return count;
    }, [filters]);
    // Helper function to remove individual filter badges
    var removeFilter = (0, react_1.useCallback)(function (filterType, value) {
        switch (filterType) {
            case "query":
                updateFilter("query", "");
                break;
            case "location":
                updateFilter("location", "");
                break;
            case "bedrooms":
                updateFilter("bedrooms", undefined);
                break;
            case "bathrooms":
                updateFilter("bathrooms", undefined);
                break;
            case "propertyType":
                if (value)
                    toggleArrayFilter("propertyType", value);
                break;
            case "amenities":
                if (value)
                    toggleArrayFilter("amenities", value);
                break;
            case "verificationStatus":
                if (value)
                    toggleArrayFilter("verificationStatus", value);
                break;
        }
    }, [updateFilter, toggleArrayFilter]);
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Search className="w-8 h-8"/>
            Advanced Search
          </h1>
          <p className="text-muted-foreground">
            Find your perfect property with detailed search filters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Saved Searches Section */}
            {savedSearches.length > 0 && (<card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Saved Searches</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-2">
                  {savedSearches.map(function (savedSearch) { return (<div key={savedSearch.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors" onClick={function () { return loadSavedSearch(savedSearch); }}>
                      <span className="text-sm font-medium truncate">
                        {savedSearch.name}
                      </span>
                      <badge_1.Badge variant="outline" className="text-xs ml-2">
                        {savedSearch.alertsEnabled ? "Alerts On" : "Alerts Off"}
                      </badge_1.Badge>
                    </div>); })}
                </card_1.CardContent>
              </card_1.Card>)}

            {/* Basic Search Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Basic Search</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="query">Keywords</label_1.Label>
                  <input_1.Input id="query" placeholder="e.g., modern apartment, villa..." value={filters.query || ""} onChange={function (e) { return updateFilter("query", e.target.value); }}/>
                </div>

                <div>
                  <label_1.Label htmlFor="location">Location</label_1.Label>
                  <input_1.Input id="location" placeholder="e.g., Westlands, Karen, Nairobi..." value={filters.location || ""} onChange={function (e) { return updateFilter("location", e.target.value); }}/>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Property Type Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Property Type</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map(function (type) { return (<div key={type.id} className="flex items-center space-x-2">
                      <checkbox_1.Checkbox id={type.id} checked={(Array.isArray(filters.propertyType) ?
                filters.propertyType
                : filters.propertyType ? [filters.propertyType]
                    : []).includes(type.id)} onCheckedChange={function () {
                return toggleArrayFilter("propertyType", type.id);
            }}/>
                      <label_1.Label htmlFor={type.id} className="text-sm cursor-pointer">
                        {type.icon} {type.label}
                      </label_1.Label>
                    </div>); })}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Price Range Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Price Range (KES)</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="px-2">
                  <slider_1.Slider value={filters.priceRange} onValueChange={function (value) {
            return updateFilter("priceRange", value);
        }} max={100000000} min={0} step={1000000} className="w-full"/>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>KES {filters.priceRange[0].toLocaleString()}</span>
                  <span>KES {filters.priceRange[1].toLocaleString()}</span>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Bedrooms & Bathrooms Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Rooms</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label>Bedrooms</label_1.Label>
                  <select_1.Select value={((_a = filters.bedrooms) === null || _a === void 0 ? void 0 : _a.toString()) || ""} onValueChange={function (value) {
            return updateFilter("bedrooms", value ? parseInt(value) : undefined);
        }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      {[1, 2, 3, 4, 5, 6].map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                          {num}+ Bedrooms
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                <div>
                  <label_1.Label>Bathrooms</label_1.Label>
                  <select_1.Select value={((_b = filters.bathrooms) === null || _b === void 0 ? void 0 : _b.toString()) || ""} onValueChange={function (value) {
            return updateFilter("bathrooms", value ? parseInt(value) : undefined);
        }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="Any"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="">Any</select_1.SelectItem>
                      {[1, 2, 3, 4, 5].map(function (num) { return (<select_1.SelectItem key={num} value={num.toString()}>
                          {num}+ Bathrooms
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Amenities Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Amenities</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-2">
                  {amenities.map(function (amenity) {
            var _a;
            return (<div key={amenity.id} className="flex items-center space-x-2">
                      <checkbox_1.Checkbox id={amenity.id} checked={((_a = filters.amenities) === null || _a === void 0 ? void 0 : _a.includes(amenity.id)) || false} onCheckedChange={function () {
                    return toggleArrayFilter("amenities", amenity.id);
                }}/>
                      <label_1.Label htmlFor={amenity.id} className="text-sm flex items-center gap-2 cursor-pointer">
                        {typeof amenity.icon === "string" ?
                    <span>{amenity.icon}</span>
                    : <amenity.icon className="w-4 h-4"/>}
                        {amenity.label}
                      </label_1.Label>
                    </div>);
        })}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Verification Status Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Verification Status</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-2">
                  {verificationStatuses.map(function (status) {
            var _a;
            return (<div key={status.id} className="flex items-center space-x-2">
                      <checkbox_1.Checkbox id={status.id} checked={((_a = filters.verificationStatus) === null || _a === void 0 ? void 0 : _a.includes(status.id)) ||
                    false} onCheckedChange={function () {
                    return toggleArrayFilter("verificationStatus", status.id);
                }}/>
                      <label_1.Label htmlFor={status.id} className="text-sm cursor-pointer">
                        <badge_1.Badge className={status.color}>{status.label}</badge_1.Badge>
                      </label_1.Label>
                    </div>);
        })}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button_1.Button onClick={handleSearch} className="w-full" disabled={isSearching}>
                <lucide_react_1.Search className="w-4 h-4 mr-2"/>
                {isSearching ? "Searching..." : "Search Properties"}
              </button_1.Button>

              <button_1.Button variant="outline" onClick={handleReset} className="w-full" disabled={isSearching}>
                <lucide_react_1.RotateCcw className="w-4 h-4 mr-2"/>
                Reset Filters
              </button_1.Button>

              <button_1.Button variant="ghost" onClick={function () { return setShowSaveDialog(true); }} className="w-full">
                <lucide_react_1.Save className="w-4 h-4 mr-2"/>
                Save Search
              </button_1.Button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Search Results {results.length > 0 && "(".concat(results.length, ")")}
                </h2>
                {activeFiltersCount > 0 && (<p className="text-sm text-muted-foreground">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} applied
                  </p>)}
              </div>

              <div className="flex items-center gap-2">
                <label_1.Label htmlFor="sort">Sort by:</label_1.Label>
                <select_1.Select value={filters.sortBy} onValueChange={function (value) { return updateFilter("sortBy", value); }}>
                  <select_1.SelectTrigger className="w-48">
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {sortOptions.map(function (option) { return (<select_1.SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (<div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {((_c = filters.query) === null || _c === void 0 ? void 0 : _c.trim()) && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                      "{filters.query}"
                      <lucide_react_1.X className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded" onClick={function () { return removeFilter("query"); }}/>
                    </badge_1.Badge>)}
                  {((_d = filters.location) === null || _d === void 0 ? void 0 : _d.trim()) && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                      <lucide_react_1.MapPin className="w-3 h-3"/>
                      {filters.location}
                      <lucide_react_1.X className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded" onClick={function () { return removeFilter("location"); }}/>
                    </badge_1.Badge>)}
                  {(Array.isArray(filters.propertyType) ? filters.propertyType
                : filters.propertyType ? [filters.propertyType]
                    : []).map(function (type) {
                var _a;
                return (<badge_1.Badge key={type} variant="secondary" className="flex items-center gap-1">
                      <lucide_react_1.Home className="w-3 h-3"/>
                      {(_a = propertyTypes.find(function (pt) { return pt.id === type; })) === null || _a === void 0 ? void 0 : _a.label}
                      <lucide_react_1.X className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded" onClick={function () { return removeFilter("propertyType", type); }}/>
                    </badge_1.Badge>);
            })}
                  {filters.bedrooms !== undefined &&
                filters.bedrooms !== null && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                        <lucide_react_1.Bed className="w-3 h-3"/>
                        {filters.bedrooms}+ Bedrooms
                        <lucide_react_1.X className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded" onClick={function () { return removeFilter("bedrooms"); }}/>
                      </badge_1.Badge>)}
                  {filters.bathrooms !== undefined &&
                filters.bathrooms !== null && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                        <lucide_react_1.Bath className="w-3 h-3"/>
                        {filters.bathrooms}+ Bathrooms
                        <lucide_react_1.X className="w-3 h-3 cursor-pointer hover:bg-secondary-foreground/20 rounded" onClick={function () { return removeFilter("bathrooms"); }}/>
                      </badge_1.Badge>)}
                </div>
              </div>)}

            {/* Results Grid or Empty State */}
            {results.length === 0 ?
            <card_1.Card>
                <card_1.CardContent className="py-12 text-center">
                  <lucide_react_1.Search className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                  <h3 className="font-semibold mb-2">
                    {isSearching ? "Searching..." : "No properties found"}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {isSearching ?
                    "Please wait while we search for properties matching your criteria."
                    : "Try adjusting your search filters or search criteria to find more properties."}
                  </p>
                  {!isSearching && activeFiltersCount > 0 && (<button_1.Button variant="outline" onClick={handleReset} className="mt-4">
                      Clear All Filters
                    </button_1.Button>)}
                </card_1.CardContent>
              </card_1.Card>
            : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map(function (property) { return (<property_1.PropertyCard key={property.id} property={property}/>); })}
              </div>}
          </div>
        </div>

        {/* Save Search Modal Dialog */}
        {showSaveDialog && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <card_1.Card className="w-full max-w-md mx-4">
              <card_1.CardHeader>
                <card_1.CardTitle>Save Search</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="search-name">Search Name</label_1.Label>
                  <input_1.Input id="search-name" placeholder="e.g., 3BR Apartments in Westlands" value={filters.savedSearchName || ""} onChange={function (e) {
                return updateFilter("savedSearchName", e.target.value);
            }} onKeyDown={function (e) {
                if (e.key === "Enter") {
                    handleSaveSearch();
                }
                else if (e.key === "Escape") {
                    setShowSaveDialog(false);
                }
            }}/>
                </div>
                <div className="flex items-center space-x-2">
                  <checkbox_1.Checkbox id="enable-alerts" defaultChecked/>
                  <label_1.Label htmlFor="enable-alerts" className="text-sm cursor-pointer">
                    Enable email alerts for new matching properties
                  </label_1.Label>
                </div>
                <div className="flex gap-2">
                  <button_1.Button onClick={handleSaveSearch} className="flex-1" disabled={!((_e = filters.savedSearchName) === null || _e === void 0 ? void 0 : _e.trim())}>
                    Save Search
                  </button_1.Button>
                  <button_1.Button variant="outline" onClick={function () {
                setShowSaveDialog(false);
                updateFilter("savedSearchName", "");
            }} className="flex-1">
                    Cancel
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}
      </div>
    </div>);
}
