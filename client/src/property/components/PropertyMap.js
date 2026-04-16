"use strict";
/**
 * Enhanced PropertyMap Component
 *
 * Strategic consolidation of PropertyMap component and page functionality
 * Combines the best of both implementations for maximum flexibility
 */
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyMap = void 0;
exports.PropertyMapEmbedded = PropertyMapEmbedded;
exports.PropertyMapPage = PropertyMapPage;
var react_1 = require("react");
var js_api_loader_1 = require("@googlemaps/js-api-loader");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var select_1 = require("../../local/components/ui/select");
var slider_1 = require("../../local/components/ui/slider");
var skeleton_1 = require("../../local/components/ui/skeleton");
var use_toast_1 = require("../../local/hooks/use-toast");
var formatters_1 = require("../../local/utils/formatters");
/* ---------- CONSTANTS ---------- */
var GOOGLE_KEY = (_a = import.meta.env.VITE_GOOGLE_MAPS_API_KEY) !== null && _a !== void 0 ? _a : "";
var DEFAULT_FILTERS = {
    priceRange: [0, 100000000],
    propertyType: 'all',
    bedrooms: 'any',
    verifiedOnly: false,
    searchRadius: 10
};
// Default zoom levels for different modes
var DEFAULT_ZOOM = {
    embedded: 15,
    'full-page': 12
};
/* ---------- MAIN COMPONENT ---------- */
function PropertyMapComponent(_a) {
    var _b;
    var location = _a.location, _c = _a.nearbyProperties, nearbyProperties = _c === void 0 ? [] : _c, _d = _a.height, height = _d === void 0 ? "400px" : _d, _e = _a.className, className = _e === void 0 ? "" : _e, _f = _a.interactive, interactive = _f === void 0 ? true : _f, _g = _a.mode, mode = _g === void 0 ? 'embedded' : _g, _h = _a.showFilters, showFilters = _h === void 0 ? false : _h, _j = _a.showSearch, showSearch = _j === void 0 ? false : _j, _k = _a.showNearbyPlaces, showNearbyPlaces = _k === void 0 ? true : _k, _l = _a.enableFullscreen, enableFullscreen = _l === void 0 ? false : _l, _m = _a.properties, properties = _m === void 0 ? [] : _m, onLocationChange = _a.onLocationChange, onPropertySelect = _a.onPropertySelect, onFiltersChange = _a.onFiltersChange;
    var toast = (0, use_toast_1.useToast)().toast;
    // Map state
    var mapRef = (0, react_1.useRef)(null);
    var mapInstanceRef = (0, react_1.useRef)(null);
    var markersRef = (0, react_1.useRef)([]);
    var _o = (0, react_1.useState)(false), isLoaded = _o[0], setIsLoaded = _o[1];
    var _p = (0, react_1.useState)(null), error = _p[0], setError = _p[1];
    var _q = (0, react_1.useState)([]), nearbyPlaces = _q[0], setNearbyPlaces = _q[1];
    var _r = (0, react_1.useState)("roadmap"), mapType = _r[0], setMapType = _r[1];
    // Enhanced state (from page version)
    var _s = (0, react_1.useState)(DEFAULT_FILTERS), filters = _s[0], setFilters = _s[1];
    var _t = (0, react_1.useState)(null), selectedProperty = _t[0], setSelectedProperty = _t[1];
    var _u = (0, react_1.useState)(''), searchLocation = _u[0], setSearchLocation = _u[1];
    var _v = (0, react_1.useState)({ lat: location.lat, lng: location.lng }), mapCenter = _v[0], setMapCenter = _v[1];
    var _w = (0, react_1.useState)(false), isFullscreen = _w[0], setIsFullscreen = _w[1];
    var _x = (0, react_1.useState)(showFilters), showFiltersPanel = _x[0], setShowFiltersPanel = _x[1];
    // Determine which properties to display based on mode and filters
    var displayProperties = (0, react_1.useMemo)(function () {
        if (mode === 'full-page' && properties.length > 0) {
            // Apply filtering logic for full-page mode
            return properties.filter(function (property) {
                // Price range filter
                if (property.price && (property.price < filters.priceRange[0] || property.price > filters.priceRange[1])) {
                    return false;
                }
                // Property type filter
                if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
                    return false;
                }
                // Bedroom filter
                if (filters.bedrooms !== 'any') {
                    var minBedrooms = parseInt(filters.bedrooms);
                    if (!property.bedrooms || property.bedrooms < minBedrooms) {
                        return false;
                    }
                }
                // Verification filter
                if (filters.verifiedOnly && !property.verified) {
                    return false;
                }
                return true;
            });
        }
        // For embedded mode, show the main location plus nearby properties
        return __spreadArray([location], nearbyProperties, true);
    }, [mode, properties, location, nearbyProperties, filters]);
    /* ---------- Google Maps Loading ---------- */
    (0, react_1.useEffect)(function () {
        if (!GOOGLE_KEY) {
            setError("Google Maps API key not configured");
            return;
        }
        var isMounted = true;
        var loader = new js_api_loader_1.Loader({ apiKey: GOOGLE_KEY, libraries: ["places"] });
        loader
            .importLibrary("maps")
            .then(function () {
            if (isMounted) {
                setIsLoaded(true);
            }
            return undefined;
        })
            .catch(function (err) {
            if (isMounted) {
                console.error("Google Maps loading error:", err);
                setError("Failed to load Google Maps");
            }
            throw err;
        });
        return function () {
            isMounted = false;
        };
    }, []);
    /* ---------- Map Initialization and Updates ---------- */
    (0, react_1.useEffect)(function () {
        if (!isLoaded || !mapRef.current)
            return;
        // Clear existing markers to prevent memory leaks
        markersRef.current.forEach(function (marker) { return marker.setMap(null); });
        markersRef.current = [];
        // Initialize the map with appropriate settings
        var map = new window.google.maps.Map(mapRef.current, {
            center: mapCenter,
            zoom: DEFAULT_ZOOM[mode],
            mapTypeId: mapType,
            gestureHandling: interactive ? "auto" : "none",
            zoomControl: interactive,
            streetViewControl: interactive,
            fullscreenControl: interactive && !enableFullscreen, // Hide if we have custom fullscreen
            mapTypeControl: false,
        });
        mapInstanceRef.current = map;
        // Add markers for all display properties
        displayProperties.forEach(function (property, index) {
            var _a;
            var isMainProperty = index === 0 && mode === 'embedded';
            // Create custom marker icons
            var marker = new window.google.maps.Marker({
                position: { lat: property.lat, lng: property.lng },
                map: map,
                title: property.title || property.address,
                icon: {
                    url: "data:image/svg+xml;charset=UTF-8,".concat(encodeURIComponent(isMainProperty ?
                        '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="#14B8A6" stroke="white" stroke-width="2"/><path d="M16 8L20 14H12L16 8Z" fill="white"/><circle cx="16" cy="20" r="2" fill="white"/></svg>' :
                        '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>')),
                    scaledSize: new window.google.maps.Size(isMainProperty ? 32 : 24, isMainProperty ? 32 : 24),
                    anchor: new window.google.maps.Point(isMainProperty ? 16 : 12, isMainProperty ? 32 : 24),
                },
            });
            // Add click listeners based on mode
            if (mode === 'full-page') {
                // For full-page mode, handle property selection
                marker.addListener("click", function () {
                    var newSelection = (selectedProperty === null || selectedProperty === void 0 ? void 0 : selectedProperty.id) === property.id ? null : property;
                    setSelectedProperty(newSelection);
                    onPropertySelect === null || onPropertySelect === void 0 ? void 0 : onPropertySelect(newSelection);
                });
            }
            else {
                // For embedded mode, show info windows
                var infoWindow_1 = new window.google.maps.InfoWindow({
                    content: "\n            <div class=\"p-2 max-w-[200px]\">\n              <h3 class=\"text-sm font-bold mb-1\">".concat((_a = property.title) !== null && _a !== void 0 ? _a : "Property", "</h3>\n              <p class=\"text-xs text-gray-600 mb-1\">").concat(property.address, "</p>\n              ").concat(property.price ? "<p class=\"text-xs font-bold text-teal-700\">KES ".concat(property.price.toLocaleString(), "</p>") : "", "\n              ").concat(property.verified ? '<span class="text-xs bg-green-200 text-green-800 px-1 rounded">✓ Verified</span>' : "", "\n            </div>\n          "),
                });
                marker.addListener("click", function () { return infoWindow_1.open(map, marker); });
            }
            markersRef.current.push(marker);
        });
        // Load nearby places for embedded mode
        if (showNearbyPlaces && mode === 'embedded') {
            loadNearbyPlaces(map, mapCenter);
        }
        // Cleanup function
        return function () {
            markersRef.current.forEach(function (marker) { return marker.setMap(null); });
            markersRef.current = [];
        };
    }, [isLoaded, mapCenter, mapType, interactive, displayProperties, mode, selectedProperty, showNearbyPlaces]);
    /* ---------- Nearby Places Loading ---------- */
    var processPlaceResults = (0, react_1.useCallback)(function (results, type, icon, center) {
        if (!results)
            return;
        var newPlaces = results
            .slice(0, 2) // Limit to 2 places per category
            .map(function (place) {
            var _a, _b;
            if (!((_a = place.geometry) === null || _a === void 0 ? void 0 : _a.location) || !place.name)
                return null;
            var distanceKm = calculateDistance(center, {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            });
            return {
                name: place.name,
                type: type,
                distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
                rating: (_b = place.rating) !== null && _b !== void 0 ? _b : 0,
                icon: icon,
            };
        })
            .filter(function (place) { return place !== null; });
        setNearbyPlaces(function (prev) {
            var combined = __spreadArray(__spreadArray([], prev, true), newPlaces, true);
            var sorted = __spreadArray([], combined, true).sort(function (a, b) { return a.distance - b.distance; });
            return sorted.slice(0, 10); // Keep only top 10 closest places
        });
    }, []);
    var loadNearbyPlaces = (0, react_1.useCallback)(function (map, center) {
        var _a, _b;
        if (!((_b = (_a = window.google) === null || _a === void 0 ? void 0 : _a.maps) === null || _b === void 0 ? void 0 : _b.places))
            return;
        var service = new window.google.maps.places.PlacesService(map);
        var placeTypes = [
            { type: "school", icon: lucide_react_1.School },
            { type: "hospital", icon: lucide_react_1.Hospital },
            { type: "shopping_mall", icon: lucide_react_1.ShoppingCart },
            { type: "restaurant", icon: lucide_react_1.Utensils },
            { type: "bus_station", icon: lucide_react_1.Bus },
        ];
        // Search for each type of place
        placeTypes.forEach(function (_a) {
            var type = _a.type, icon = _a.icon;
            service.nearbySearch({
                location: center,
                radius: 2000, // 2km radius
                type: type,
            }, function (results, status) {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    processPlaceResults(results, type, icon, center);
                }
            });
        });
    }, [processPlaceResults]);
    /* ---------- Helper Functions ---------- */
    /**
     * Calculate distance between two geographic points using Haversine formula
     */
    var calculateDistance = function (pointA, pointB) {
        var earthRadiusKm = 6371; // Earth's radius in kilometers
        var toRadians = function (degrees) { return (degrees * Math.PI) / 180; };
        var deltaLat = toRadians(pointB.lat - pointA.lat);
        var deltaLng = toRadians(pointB.lng - pointA.lng);
        var haversineValue = Math.pow(Math.sin(deltaLat / 2), 2) +
            Math.cos(toRadians(pointA.lat)) * Math.cos(toRadians(pointB.lat)) * Math.pow(Math.sin(deltaLng / 2), 2);
        return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineValue));
    };
    /* ---------- Map Control Functions ---------- */
    var zoomIn = function () {
        var _a;
        if (!mapInstanceRef.current)
            return;
        var currentZoom = (_a = mapInstanceRef.current.getZoom()) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM[mode];
        mapInstanceRef.current.setZoom(currentZoom + 1);
    };
    var zoomOut = function () {
        var _a;
        if (!mapInstanceRef.current)
            return;
        var currentZoom = (_a = mapInstanceRef.current.getZoom()) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM[mode];
        mapInstanceRef.current.setZoom(Math.max(1, currentZoom - 1)); // Prevent zoom below 1
    };
    var resetView = function () {
        if (!mapInstanceRef.current)
            return;
        mapInstanceRef.current.setCenter(mapCenter);
        mapInstanceRef.current.setZoom(DEFAULT_ZOOM[mode]);
    };
    var toggleMapType = function () {
        setMapType(function (currentType) {
            return currentType === "roadmap" ? "satellite" : "roadmap";
        });
    };
    /* ---------- Filter Management ---------- */
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        var _a;
        var newFilters = __assign(__assign({}, filters), (_a = {}, _a[key] = value, _a));
        setFilters(newFilters);
        onFiltersChange === null || onFiltersChange === void 0 ? void 0 : onFiltersChange(newFilters);
    }, [filters, onFiltersChange]);
    var handleLocationSearch = (0, react_1.useCallback)(function () {
        if (!searchLocation.trim())
            return;
        toast({
            title: 'Location search',
            description: "Searching for properties near \"".concat(searchLocation, "\""),
        });
        // Here you would typically integrate with a geocoding service
    }, [searchLocation, toast]);
    /* ---------- Error State Rendering ---------- */
    if (error) {
        return (<card_1.Card className={className}>
        <card_1.CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <lucide_react_1.MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
            <p className="text-gray-600">{error}</p>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    /* ---------- Main Render Logic ---------- */
    var mapHeight = mode === 'full-page' ? 'h-[calc(100vh-200px)]' : "h-[".concat(height, "]");
    return (<div className={"".concat(isFullscreen ? 'fixed inset-0 z-50' : '', " ").concat(className)}>
      <div className={"".concat(mode === 'full-page' ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'space-y-4', " h-full")}>
        
        {/* Filters Sidebar (full-page mode only) */}
        {mode === 'full-page' && showFiltersPanel && (<div className="lg:col-span-1 space-y-4 overflow-y-auto">
            {/* Location Search */}
            {showSearch && (<card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Location</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input_1.Input placeholder="Enter location..." value={searchLocation} onChange={function (e) { return setSearchLocation(e.target.value); }}/>
                    <button_1.Button onClick={handleLocationSearch}>
                      <lucide_react_1.Search className="w-4 h-4"/>
                    </button_1.Button>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Search Radius: {filters.searchRadius}km
                    </label>
                    <slider_1.Slider value={[filters.searchRadius]} onValueChange={function (value) { return updateFilter('searchRadius', value[0]); }} max={50} min={1} step={1} className="w-full"/>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}

            {/* Price Filter */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Price Range</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="px-2">
                  <slider_1.Slider value={filters.priceRange} onValueChange={function (value) { return updateFilter('priceRange', value); }} max={100000000} min={0} step={1000000} className="w-full"/>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>KES {filters.priceRange[0].toLocaleString()}</span>
                  <span>KES {filters.priceRange[1].toLocaleString()}</span>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Property Type Filter */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Property Type</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <select_1.Select value={filters.propertyType} onValueChange={function (value) { return updateFilter('propertyType', value); }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue />
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="all">All Types</select_1.SelectItem>
                    <select_1.SelectItem value="apartment">Apartment</select_1.SelectItem>
                    <select_1.SelectItem value="house">House</select_1.SelectItem>
                    <select_1.SelectItem value="villa">Villa</select_1.SelectItem>
                    <select_1.SelectItem value="townhouse">Townhouse</select_1.SelectItem>
                    <select_1.SelectItem value="land">Land</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </card_1.CardContent>
            </card_1.Card>

            {/* Results Summary */}
            <card_1.Card>
              <card_1.CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {displayProperties.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Properties found
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {/* Map Container */}
        <div className={"".concat(mode === 'full-page' && showFiltersPanel ? 'lg:col-span-3' : 'lg:col-span-4', " relative")}>
          <card_1.Card className="h-full">
            <card_1.CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.MapPin className="w-5 h-5"/>
                  {mode === 'full-page' ? 'Property Locations' : 'Property Location'}
                </card_1.CardTitle>
                <div className="flex items-center gap-2">
                  {mode === 'full-page' && (<button_1.Button variant="ghost" size="sm" onClick={function () { return setShowFiltersPanel(!showFiltersPanel); }}>
                      <lucide_react_1.Filter className="w-4 h-4"/>
                    </button_1.Button>)}
                  {interactive && (<>
                      <button_1.Button variant="outline" size="sm" onClick={toggleMapType}>
                        <lucide_react_1.Layers className="h-4 w-4"/>
                      </button_1.Button>
                      <button_1.Button variant="outline" size="sm" onClick={function () { return window.open("https://www.google.com/maps/search/?api=1&query=".concat(mapCenter.lat, ",").concat(mapCenter.lng), "_blank"); }}>
                        <lucide_react_1.Navigation className="h-4 w-4"/>
                      </button_1.Button>
                    </>)}
                  {enableFullscreen && (<button_1.Button variant="ghost" size="sm" onClick={function () { return setIsFullscreen(!isFullscreen); }}>
                      {isFullscreen ? (<lucide_react_1.Minimize2 className="w-4 h-4"/>) : (<lucide_react_1.Maximize2 className="w-4 h-4"/>)}
                    </button_1.Button>)}
                </div>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent className="p-0 h-[calc(100%-80px)]">
              <div className="relative h-full">
                {!isLoaded ? (<skeleton_1.Skeleton className={"w-full ".concat(mapHeight)}/>) : (<div ref={mapRef} className={"w-full rounded-b-lg ".concat(mapHeight)}/>)}

                {/* Map Controls */}
                {interactive && isLoaded && (<div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button_1.Button variant="secondary" size="sm" onClick={zoomIn} className="w-8 h-8 p-0">
                      <lucide_react_1.ZoomIn className="h-4 w-4"/>
                    </button_1.Button>
                    <button_1.Button variant="secondary" size="sm" onClick={zoomOut} className="w-8 h-8 p-0">
                      <lucide_react_1.ZoomOut className="h-4 w-4"/>
                    </button_1.Button>
                    <button_1.Button variant="secondary" size="sm" onClick={resetView} className="w-8 h-8 p-0">
                      <lucide_react_1.RotateCcw className="h-4 w-4"/>
                    </button_1.Button>
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Property Details Popup (full-page mode) */}
          {mode === 'full-page' && selectedProperty && (<div className="absolute bottom-4 left-4 right-4 z-30">
              <card_1.Card className="shadow-lg">
                <card_1.CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {((_b = selectedProperty.images) === null || _b === void 0 ? void 0 : _b[0]) && (<img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-20 h-20 object-cover rounded-lg"/>)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {selectedProperty.title}
                        </h3>
                        <button_1.Button variant="ghost" size="sm" onClick={function () { return setSelectedProperty(null); }}>
                          ×
                        </button_1.Button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {selectedProperty.bedrooms && (<div className="flex items-center gap-1">
                            <lucide_react_1.Bed className="w-4 h-4"/>
                            <span>{selectedProperty.bedrooms}</span>
                          </div>)}
                        {selectedProperty.bathrooms && (<div className="flex items-center gap-1">
                            <lucide_react_1.Bath className="w-4 h-4"/>
                            <span>{selectedProperty.bathrooms}</span>
                          </div>)}
                        {selectedProperty.area && (<div className="flex items-center gap-1">
                            <lucide_react_1.Square className="w-4 h-4"/>
                            <span>{selectedProperty.area} sqm</span>
                          </div>)}
                      </div>

                      <div className="flex items-center justify-between">
                        {selectedProperty.price && (<div className="text-xl font-bold text-primary">
                            {(0, formatters_1.formatPrice)(selectedProperty.price)}
                          </div>)}
                        <div className="flex items-center gap-2">
                          {selectedProperty.verified && (<badge_1.Badge className="bg-green-100 text-green-800">
                              Verified
                            </badge_1.Badge>)}
                          {selectedProperty.status && (<badge_1.Badge variant="outline" className="capitalize">
                              {selectedProperty.status}
                            </badge_1.Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button_1.Button className="flex-1" onClick={function () { return selectedProperty.id && window.open("/property/".concat(selectedProperty.id), '_blank'); }}>
                      View Details
                    </button_1.Button>
                    <button_1.Button variant="outline">
                      Contact Owner
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </div>)}
        </div>
      </div>

      {/* Nearby Places (embedded mode only) */}
      {mode === 'embedded' && showNearbyPlaces && nearbyPlaces.length > 0 && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-lg">Nearby Places</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearbyPlaces.map(function (place, index) { return (<div key={"".concat(place.name, "-").concat(index)} className="flex items-center gap-3 p-2 rounded-lg border">
                  <place.icon className="h-5 w-5 text-gray-600"/>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{place.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{place.distance} km</span>
                      {place.rating && (<badge_1.Badge className="text-xs">⭐ {place.rating}</badge_1.Badge>)}
                    </div>
                  </div>
                </div>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
/* ---------- EXPORTS ---------- */
// Main export - renamed to avoid conflicts
exports.PropertyMap = PropertyMapComponent;
// Convenience wrappers for specific use cases
function PropertyMapEmbedded(props) {
    return <PropertyMapComponent {...props} mode="embedded"/>;
}
function PropertyMapPage(props) {
    return (<PropertyMapComponent {...props} mode="full-page" showFilters={true} showSearch={true} enableFullscreen={true}/>);
}
