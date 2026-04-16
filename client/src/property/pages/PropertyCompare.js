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
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var useCompareError_1 = require("../../local/hooks/useCompareError");
var compare_utils_1 = require("../../local/utils/compare-utils");
var contexts_1 = require("../contexts");
// Constants to avoid duplicate strings
var PROPERTY_TYPE_RESIDENTIAL = "residential";
var PROPERTY_TYPE_COMMERCIAL = "commercial";
// Sample properties with more realistic data
var sampleProperties = [
    {
        id: "1",
        title: "Modern Apartment in Westlands",
        price: 15000000,
        location: "Westlands, Nairobi",
        description: "A beautiful modern apartment with stunning city views.",
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"],
        bedrooms: 3,
        bathrooms: 2,
        area: 1200,
        amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
        verificationStatus: "verified",
        type: PROPERTY_TYPE_RESIDENTIAL,
        features: {
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200,
            parkingSpaces: 2,
            yearBuilt: 2020,
            amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
        },
        listingDate: "2024-01-15",
    },
    {
        id: "2",
        title: "Spacious Villa in Karen",
        price: 45000000,
        location: "Karen, Nairobi",
        description: "Luxury villa with large gardens and premium finishes.",
        images: [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
        ],
        bedrooms: 5,
        bathrooms: 4,
        area: 3500,
        amenities: [
            "Garden",
            "Swimming Pool",
            "Staff Quarters",
            "Solar Power",
            "CCTV",
        ],
        verificationStatus: "verified",
        type: PROPERTY_TYPE_RESIDENTIAL,
        features: {
            bedrooms: 5,
            bathrooms: 4,
            squareFeet: 3500,
            parkingSpaces: 4,
            yearBuilt: 2018,
            amenities: [
                "Garden",
                "Swimming Pool",
                "Staff Quarters",
                "Solar Power",
                "CCTV",
            ],
        },
        listingDate: "2024-01-10",
    },
    {
        id: "3",
        title: "Cozy Townhouse in Kilimani",
        price: 8500000,
        location: "Kilimani, Nairobi",
        description: "Perfect starter home in a quiet neighborhood.",
        images: [
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
        ],
        bedrooms: 2,
        bathrooms: 2,
        area: 900,
        amenities: ["Security", "Water Backup", "Fiber Internet"],
        verificationStatus: "pending",
        type: PROPERTY_TYPE_RESIDENTIAL,
        features: {
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 900,
            parkingSpaces: 1,
            yearBuilt: 2015,
            amenities: ["Security", "Water Backup", "Fiber Internet"],
        },
        listingDate: "2024-01-20",
    },
    {
        id: "4",
        title: "Executive Office Space in Upper Hill",
        price: 28000000,
        location: "Upper Hill, Nairobi",
        description: "Premium office space in the business district.",
        images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
        ],
        bedrooms: 0, // Office space has no bedrooms
        bathrooms: 3,
        area: 1800,
        amenities: [
            "Rooftop Terrace",
            "Concierge",
            "Business Center",
            "High Speed Internet",
        ],
        verificationStatus: "verified",
        type: PROPERTY_TYPE_COMMERCIAL,
        features: {
            bedrooms: 0,
            bathrooms: 3,
            squareFeet: 1800,
            parkingSpaces: 6,
            yearBuilt: 2019,
            amenities: [
                "Rooftop Terrace",
                "Concierge",
                "Business Center",
                "High Speed Internet",
            ],
        },
        listingDate: "2024-01-05",
    },
];
var PropertyCompareInner = function (_a) {
    var _b, _c;
    var _d = _a.properties, properties = _d === void 0 ? sampleProperties : _d, onComparisonChange = _a.onComparisonChange, onSelectionLimitReached = _a.onSelectionLimitReached, _e = _a.showAdvancedStats, showAdvancedStats = _e === void 0 ? true : _e, _f = _a.allowMixedTypes, allowMixedTypes = _f === void 0 ? false : _f;
    // Use unified PropertyContext for comparison functionality
    var _g = (0, contexts_1.usePropertyCompare)(), selectedProperties = _g.selectedProperties, maxProperties = _g.maxProperties, isSelected = _g.isSelected, canAddMore = _g.canAddMore;
    var _h = (0, contexts_1.usePropertyCompareActions)(), toggleProperty = _h.toggleProperty, removeFromCompare = _h.removeFromCompare, clearCompare = _h.clearCompare, replaceProperty = _h.replaceProperty;
    var searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    var _j = (0, useCompareError_1.useCompareError)(), error = _j.error, handleError = _j.handleError, clearError = _j.clearError;
    // Local UI state only
    var _k = (0, react_1.useState)(false), showReplacementDialog = _k[0], setShowReplacementDialog = _k[1];
    var _l = (0, react_1.useState)(null), pendingProperty = _l[0], setPendingProperty = _l[1];
    var _m = (0, react_1.useState)([]), validationWarnings = _m[0], setValidationWarnings = _m[1];
    // Convert CompareProperty back to Property format for display
    var displayProperties = (0, react_1.useMemo)(function () {
        return selectedProperties.map(function (p) {
            var _a, _b, _c, _d, _e, _f, _g;
            return (__assign(__assign({}, p), { bedrooms: ((_a = p.features) === null || _a === void 0 ? void 0 : _a.bedrooms) || 0, bathrooms: ((_b = p.features) === null || _b === void 0 ? void 0 : _b.bathrooms) || 0, area: ((_c = p.features) === null || _c === void 0 ? void 0 : _c.squareFeet) || 0, size: ((_d = p.features) === null || _d === void 0 ? void 0 : _d.squareFeet) || 0, amenities: ((_e = p.features) === null || _e === void 0 ? void 0 : _e.amenities) || [], verificationStatus: p.verificationStatus || "unverified", type: p.type || PROPERTY_TYPE_RESIDENTIAL, images: p.images || [], features: __assign(__assign({}, p.features), { parkingSpaces: ((_f = p.features) === null || _f === void 0 ? void 0 : _f.parkingSpaces) || 0, yearBuilt: ((_g = p.features) === null || _g === void 0 ? void 0 : _g.yearBuilt) || new Date().getFullYear() }) }));
        });
    }, [selectedProperties]);
    // Load properties from URL params on mount
    (0, react_1.useEffect)(function () {
        var _a;
        var propertyIds = ((_a = searchParams.get("properties")) === null || _a === void 0 ? void 0 : _a.split(",").filter(Boolean)) || [];
        if (propertyIds.length > 0) {
            var urlProperties = properties.filter(function (p) {
                return propertyIds.includes(String(p.id));
            });
            if (urlProperties.length > 0) {
                // Convert to CompareProperty format and add to unified context
                urlProperties.forEach(function (property) {
                    var _a, _b, _c, _d;
                    var compareProperty = (0, compare_utils_1.normalizePropertyForComparison)(__assign(__assign({}, property), { features: {
                            bedrooms: property.bedrooms,
                            bathrooms: property.bathrooms,
                            squareFeet: property.area || ((_a = property.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 0,
                            parkingSpaces: ((_b = property.features) === null || _b === void 0 ? void 0 : _b.parkingSpaces) || 0,
                            yearBuilt: ((_c = property.features) === null || _c === void 0 ? void 0 : _c.yearBuilt) || new Date().getFullYear(),
                            amenities: property.amenities || ((_d = property.features) === null || _d === void 0 ? void 0 : _d.amenities) || [],
                        } }));
                    if (compareProperty && !isSelected(String(property.id))) {
                        toggleProperty(compareProperty);
                    }
                });
            }
        }
    }, [searchParams, properties, isSelected, toggleProperty]);
    // Comprehensive property validation
    var validateProperty = (0, react_1.useCallback)(function (property) {
        var _a, _b;
        var warnings = [];
        var errors = [];
        // Check for missing or invalid required fields
        var price = typeof property.price === "string" ?
            parseFloat(property.price)
            : property.price;
        if (!price || price <= 0) {
            errors.push("".concat(property.title, ": Invalid or missing price"));
        }
        var squareFeet = property.area || ((_a = property.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 0;
        if (!squareFeet || squareFeet <= 0) {
            errors.push("".concat(property.title, ": Invalid or missing square footage"));
        }
        if ((property.bedrooms || 0) < 0) {
            errors.push("".concat(property.title, ": Invalid bedroom count"));
        }
        if ((property.bathrooms || 0) <= 0) {
            errors.push("".concat(property.title, ": Invalid bathroom count"));
        }
        // Business logic warnings
        if (property.verificationStatus !== "verified") {
            warnings.push("".concat(property.title, ": Property is not verified"));
        }
        var yearBuilt = ((_b = property.features) === null || _b === void 0 ? void 0 : _b.yearBuilt) || new Date().getFullYear();
        if (yearBuilt < 1900 || yearBuilt > new Date().getFullYear()) {
            warnings.push("".concat(property.title, ": Unusual year built (").concat(yearBuilt, ")"));
        }
        if (price && squareFeet && price / squareFeet > 25000) {
            warnings.push("".concat(property.title, ": Price per sq ft seems high (KES ").concat(Math.round(price / squareFeet).toLocaleString(), ")"));
        }
        return {
            isValid: errors.length === 0,
            warnings: warnings,
            errors: errors,
        };
    }, []);
    // Validate properties on load and selection
    var validatedProperties = (0, react_1.useMemo)(function () {
        return properties.filter(function (property) {
            var validation = validateProperty(property);
            return validation.isValid;
        });
    }, [properties, validateProperty]);
    // Unified property selection handler using PropertyContext
    var handlePropertySelection = (0, react_1.useCallback)(function (property, validation) {
        var _a, _b, _c, _d;
        var compareProperty = (0, compare_utils_1.normalizePropertyForComparison)(__assign(__assign({}, property), { features: {
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                squareFeet: property.area || property.size || 0,
                parkingSpaces: ((_a = property.features) === null || _a === void 0 ? void 0 : _a.parkingSpaces) || 0,
                yearBuilt: ((_b = property.features) === null || _b === void 0 ? void 0 : _b.yearBuilt) || new Date().getFullYear(),
                amenities: property.amenities || ((_c = property.features) === null || _c === void 0 ? void 0 : _c.amenities) || [],
            } }));
        if (!compareProperty) {
            handleError("Failed to normalize property data", "handlePropertySelect");
            return;
        }
        // Check for mixed property types if not allowed
        if (!allowMixedTypes && displayProperties.length > 0) {
            var existingType = (_d = displayProperties[0]) === null || _d === void 0 ? void 0 : _d.type;
            if (property.type !== existingType) {
                setValidationWarnings([
                    "Cannot compare ".concat(property.type, " properties with ").concat(existingType, " properties. Clear selection or enable mixed type comparison."),
                ]);
                return;
            }
        }
        // Handle selection limit
        if (!canAddMore && !isSelected(String(property.id))) {
            setPendingProperty(property);
            setShowReplacementDialog(true);
            onSelectionLimitReached === null || onSelectionLimitReached === void 0 ? void 0 : onSelectionLimitReached(property);
            return;
        }
        // Toggle property in unified context
        toggleProperty(compareProperty);
        setValidationWarnings(validation.warnings);
        // Notify parent component of changes
        var updatedProperties = isSelected(String(property.id)) ?
            displayProperties.filter(function (p) { return p.id !== property.id; })
            : __spreadArray(__spreadArray([], displayProperties, true), [property], false);
        onComparisonChange === null || onComparisonChange === void 0 ? void 0 : onComparisonChange(updatedProperties);
    }, [
        allowMixedTypes,
        displayProperties,
        canAddMore,
        isSelected,
        toggleProperty,
        onComparisonChange,
        onSelectionLimitReached,
        handleError,
    ]);
    // Enhanced selection logic with proper business rules
    var handlePropertySelect = (0, react_1.useCallback)(function (property) {
        try {
            clearError();
            var validation = validateProperty(property);
            if (!validation.isValid) {
                setValidationWarnings(validation.errors);
                return;
            }
            handlePropertySelection(property, validation);
        }
        catch (error) {
            handleError(error, "handlePropertySelect");
        }
    }, [clearError, validateProperty, handlePropertySelection, handleError]);
    // Handle property replacement
    var handleReplaceProperty = (0, react_1.useCallback)(function (indexToReplace) {
        var _a, _b, _c, _d;
        if (!pendingProperty ||
            indexToReplace < 0 ||
            indexToReplace >= selectedProperties.length)
            return;
        var propertyAtIndex = selectedProperties[indexToReplace];
        var oldPropertyId = propertyAtIndex === null || propertyAtIndex === void 0 ? void 0 : propertyAtIndex.id;
        if (oldPropertyId && pendingProperty) {
            var compareProperty = (0, compare_utils_1.normalizePropertyForComparison)(__assign(__assign({}, pendingProperty), { features: {
                    bedrooms: pendingProperty.bedrooms,
                    bathrooms: pendingProperty.bathrooms,
                    squareFeet: pendingProperty.area || ((_a = pendingProperty.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 0,
                    parkingSpaces: ((_b = pendingProperty.features) === null || _b === void 0 ? void 0 : _b.parkingSpaces) || 0,
                    yearBuilt: ((_c = pendingProperty.features) === null || _c === void 0 ? void 0 : _c.yearBuilt) || new Date().getFullYear(),
                    amenities: pendingProperty.amenities ||
                        ((_d = pendingProperty.features) === null || _d === void 0 ? void 0 : _d.amenities) ||
                        [],
                } }));
            if (compareProperty) {
                replaceProperty(oldPropertyId, compareProperty);
                setPendingProperty(null);
                setShowReplacementDialog(false);
                onComparisonChange === null || onComparisonChange === void 0 ? void 0 : onComparisonChange(displayProperties.map(function (p, i) {
                    return i === indexToReplace ? pendingProperty : p;
                }));
            }
        }
    }, [selectedProperties, pendingProperty, onComparisonChange, replaceProperty, displayProperties]);
    // Enhanced statistics with business insights
    var statistics = (0, react_1.useMemo)(function () {
        if (selectedProperties.length < 2)
            return null;
        var prices = selectedProperties.map(function (p) { return p.price; });
        var avgPrice = prices.reduce(function (a, b) { return a + b; }, 0) / prices.length;
        var minPrice = Math.min.apply(Math, prices);
        var maxPrice = Math.max.apply(Math, prices);
        var avgBedrooms = selectedProperties.reduce(function (sum, p) { var _a; return sum + (((_a = p.features) === null || _a === void 0 ? void 0 : _a.bedrooms) || 0); }, 0) / selectedProperties.length;
        var avgSquareFeet = selectedProperties.reduce(function (sum, p) { var _a; return sum + (((_a = p.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 0); }, 0) / selectedProperties.length;
        // Advanced calculations
        var pricePerSquareFoot = selectedProperties.map(function (p) { var _a; return p.price / (((_a = p.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 1); });
        // Find best value (lowest price per square foot)
        var bestValueIndex = pricePerSquareFoot.indexOf(Math.min.apply(Math, pricePerSquareFoot));
        var bestValueProperty = bestValueIndex >= 0 && bestValueIndex < selectedProperties.length ?
            selectedProperties[bestValueIndex] : null;
        var bestValue = (bestValueProperty === null || bestValueProperty === void 0 ? void 0 : bestValueProperty.id) || null;
        // Find newest property
        var newestIndex = selectedProperties.reduce(function (newest, current, index) {
            var _a, _b;
            var newestPropertyAtIndex = selectedProperties[newest];
            var currentYear = ((_a = current.features) === null || _a === void 0 ? void 0 : _a.yearBuilt) || 0;
            var newestYear = ((_b = newestPropertyAtIndex === null || newestPropertyAtIndex === void 0 ? void 0 : newestPropertyAtIndex.features) === null || _b === void 0 ? void 0 : _b.yearBuilt) || 0;
            return newestPropertyAtIndex && currentYear > newestYear ? index : newest;
        }, 0);
        var newestPropertyAtIndex = newestIndex >= 0 && newestIndex < selectedProperties.length ?
            selectedProperties[newestIndex] : null;
        var newestProperty = (newestPropertyAtIndex === null || newestPropertyAtIndex === void 0 ? void 0 : newestPropertyAtIndex.id) || null;
        // Find most spacious per price
        var spaciousPerPriceValues = selectedProperties.map(function (p) { var _a; return (((_a = p.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 0) / p.price; });
        var mostSpaciousIndex = spaciousPerPriceValues.indexOf(Math.max.apply(Math, spaciousPerPriceValues));
        var mostSpaciousPropertyAtIndex = mostSpaciousIndex >= 0 && mostSpaciousIndex < selectedProperties.length ?
            selectedProperties[mostSpaciousIndex] : null;
        var mostSpaciousPerPrice = (mostSpaciousPropertyAtIndex === null || mostSpaciousPropertyAtIndex === void 0 ? void 0 : mostSpaciousPropertyAtIndex.id) || null;
        // Verification score (percentage of verified properties)
        var verifiedCount = selectedProperties.filter(function (p) { return p.verificationStatus === "verified"; }).length;
        var verificationScore = (verifiedCount / selectedProperties.length) * 100;
        // Generate warnings
        var warnings = [];
        if (verificationScore < 50) {
            warnings.push("More than half of selected properties are not verified");
        }
        if (maxPrice / minPrice > 5) {
            warnings.push("Large price variation detected - ensure properties are comparable");
        }
        var typeVariety = new Set(selectedProperties.map(function (p) { return p.type; })).size;
        if (typeVariety > 1) {
            warnings.push("Comparing different property types - results may not be meaningful");
        }
        return {
            basic: {
                averagePrice: avgPrice,
                priceRange: { min: minPrice, max: maxPrice },
                averageBedrooms: Math.round(avgBedrooms * 10) / 10,
                averageSquareFeet: Math.round(avgSquareFeet),
            },
            advanced: {
                pricePerSquareFoot: pricePerSquareFoot.map(function (p) { return Math.round(p); }),
                bestValue: bestValue,
                newestProperty: newestProperty,
                mostSpaciousPerPrice: mostSpaciousPerPrice,
                verificationScore: Math.round(verificationScore),
            },
            warnings: warnings,
        };
    }, [selectedProperties]);
    // Status styling helper
    var getStatusStyle = function (status) {
        var styles = {
            verified: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            unverified: "bg-gray-100 text-gray-800",
        };
        var validStatuses = ["verified", "pending", "unverified"];
        var safeStatus = validStatuses.includes(status) ?
            status
            : "unverified";
        return styles[safeStatus];
    };
    // Property highlight helper
    var getPropertyHighlight = function (propertyId) {
        if (!statistics)
            return null;
        var highlights = [];
        if (statistics.advanced.bestValue === propertyId)
            highlights.push("Best Value");
        if (statistics.advanced.newestProperty === propertyId)
            highlights.push("Newest");
        if (statistics.advanced.mostSpaciousPerPrice === propertyId)
            highlights.push("Most Space/Price");
        return highlights;
    };
    return (<div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Enhanced Property Comparison Tool
        </h1>
        <p className="text-lg text-gray-600">
          Compare up to {maxProperties} properties with advanced analytics and
          validation
        </p>
      </div>

      {/* Error Display */}
      {error && (<div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <lucide_react_1.AlertTriangle className="w-5 h-5 text-red-600"/>
            <h3 className="font-medium text-red-800">Error</h3>
          </div>
          <p className="text-sm text-red-700">{error.message}</p>
          <button onClick={clearError} className="mt-2 text-sm text-red-600 hover:text-red-800 underline">
            Dismiss
          </button>
        </div>)}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <lucide_react_1.AlertTriangle className="w-5 h-5 text-yellow-600"/>
            <h3 className="font-medium text-yellow-800">Validation Warnings</h3>
          </div>
          <div className="space-y-1">
            {validationWarnings.map(function (warning, index) { return (<p key={index} className="text-sm text-yellow-700">
                {warning}
              </p>); })}
          </div>
        </div>)}

      {/* Property Selection Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Available Properties
          </h2>
          <div className="text-sm text-gray-600">
            {validatedProperties.length} properties available (
            {properties.length - validatedProperties.length} filtered out)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validatedProperties.map(function (property) {
            var _a, _b, _c, _d, _e;
            var isSelected = selectedProperties.some(function (p) { return p.id === String(property.id); });
            var highlights = getPropertyHighlight(String(property.id));
            var price = typeof property.price === "string" ?
                parseFloat(property.price)
                : property.price;
            var sqFt = property.area || ((_a = property.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 1;
            var pricePerSqFt = Math.round(price / sqFt);
            return (<div key={property.id} className={"border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ".concat(isSelected ?
                    "border-blue-500 bg-blue-50 shadow-lg transform scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md")} onClick={function () { return handlePropertySelect(property); }} onKeyDown={function (e) {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePropertySelect(property);
                    }
                }} role="button" tabIndex={0} aria-label={"".concat(isSelected ? "Remove" : "Add", " ").concat(property.title, " ").concat(isSelected ? "from" : "to", " comparison")}>
                {/* Property Image */}
                <div className="h-48 bg-gray-100 overflow-hidden relative">
                  {((_b = property.images) === null || _b === void 0 ? void 0 : _b[0]) ?
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center">
                      <lucide_react_1.Home className="w-12 h-12 text-gray-400"/>
                    </div>}

                  {/* Selection indicator */}
                  {isSelected && (<div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      ✓
                    </div>)}

                  {/* Highlights */}
                  {highlights && highlights.length > 0 && (<div className="absolute top-3 left-3 space-y-1">
                      {highlights.map(function (highlight) { return (<div key={highlight} className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                          {highlight}
                        </div>); })}
                    </div>)}

                  {/* Verification Status */}
                  <div className="absolute bottom-3 left-3">
                    {(0, compare_utils_1.getVerificationBadge)(property.verificationStatus)}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {typeof property.location === "string" ?
                    property.location
                    : property.location.address}
                  </p>

                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {(0, compare_utils_1.formatComparePrice)(typeof property.price === "string" ?
                    parseFloat(property.price)
                    : property.price)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {(0, compare_utils_1.formatComparePrice)(pricePerSqFt)}/sq ft
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>{property.bedrooms || "N/A"} bed</div>
                    <div>{property.bathrooms || 0} bath</div>
                    <div>
                      {(property.area ||
                    ((_c = property.features) === null || _c === void 0 ? void 0 : _c.squareFeet) ||
                    0).toLocaleString()}{" "}
                      sq ft
                    </div>
                    <div>{((_d = property.features) === null || _d === void 0 ? void 0 : _d.parkingSpaces) || 0} parking</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Built {((_e = property.features) === null || _e === void 0 ? void 0 : _e.yearBuilt) || "N/A"}
                    </div>
                    <react_router_dom_1.Link to={"/property/".concat(String(property.id))} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors" onClick={function (e) { return e.stopPropagation(); }}>
                      <lucide_react_1.ExternalLink className="w-3 h-3 mr-1"/>
                      Details
                    </react_router_dom_1.Link>
                  </div>
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Replacement Dialog */}
      {showReplacementDialog && pendingProperty && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Replace Property</h3>
            <p className="text-gray-600 mb-4">
              You&apos;ve reached the maximum of {maxProperties} properties.
              Which property would you like to replace with &quot;
              {pendingProperty.title}&quot;?
            </p>

            <div className="space-y-2 mb-6">
              {selectedProperties.map(function (property, index) { return (<button key={property.id} onClick={function () { return handleReplaceProperty(index); }} className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors">
                  <div className="font-medium">{property.title}</div>
                  <div className="text-sm text-gray-600">
                    {typeof property.location === "string" ?
                    property.location
                    : property.location.address}
                  </div>
                </button>); })}
            </div>

            <div className="flex gap-3">
              <button onClick={function () {
                setShowReplacementDialog(false);
                setPendingProperty(null);
            }} className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>)}

      {/* Enhanced Statistics */}
      {statistics && (<div className="space-y-6">
          {/* Comparison Warnings */}
          {statistics.warnings.length > 0 && (<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <lucide_react_1.AlertTriangle className="w-5 h-5 text-amber-600"/>
                <h3 className="font-medium text-amber-800">
                  Comparison Insights
                </h3>
              </div>
              <div className="space-y-1">
                {statistics.warnings.map(function (warning, index) { return (<p key={index} className="text-sm text-amber-700">
                    {warning}
                  </p>); })}
              </div>
            </div>)}

          {/* Basic Statistics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <lucide_react_1.BarChart3 className="w-6 h-6 text-blue-600"/>
              <h3 className="text-xl font-semibold text-gray-900">
                Comparison Statistics
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(0, compare_utils_1.formatComparePrice)(statistics.basic.averagePrice)}
                </div>
                <div className="text-sm text-gray-600">Average Price</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-green-600">
                  {(0, compare_utils_1.formatComparePrice)(statistics.basic.priceRange.min)} -{" "}
                  {(0, compare_utils_1.formatComparePrice)(statistics.basic.priceRange.max)}
                </div>
                <div className="text-sm text-gray-600">Price Range</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.basic.averageBedrooms}
                </div>
                <div className="text-sm text-gray-600">Avg Bedrooms</div>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.basic.averageSquareFeet.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Avg Square Feet</div>
              </div>
            </div>

            {/* Advanced Statistics */}
            {showAdvancedStats && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <lucide_react_1.TrendingUp className="w-5 h-5 text-green-600"/>
                    <div className="text-lg font-bold text-green-600">
                      {statistics.advanced.verificationScore}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Verified Properties
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <lucide_react_1.DollarSign className="w-5 h-5 text-blue-600"/>
                    <div className="text-lg font-bold text-blue-600">
                      KES{" "}
                      {Math.round(statistics.advanced.pricePerSquareFoot.reduce(function (a, b) { return a + b; }, 0) / statistics.advanced.pricePerSquareFoot.length).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Avg Price/Sq Ft</div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <lucide_react_1.Maximize className="w-5 h-5 text-purple-600"/>
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round(((statistics.basic.priceRange.max -
                    statistics.basic.priceRange.min) /
                    statistics.basic.priceRange.min) *
                    100)}
                      %
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Price Variation</div>
                </div>
              </div>)}
          </div>

          {/* Enhanced Comparison Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-900">
                Detailed Comparison
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Feature
                    </th>
                    {selectedProperties.map(function (property) {
                var highlights = getPropertyHighlight(property.id);
                return (<th key={property.id} className="text-left p-4 font-semibold text-gray-900 min-w-48">
                          <div className="truncate">{property.title}</div>
                          <div className="text-xs text-gray-600 font-normal">
                            {typeof property.location === "string" ?
                        property.location
                        : property.location.address}
                          </div>
                          {highlights && highlights.length > 0 && (<div className="mt-1 space-y-1">
                              {highlights.map(function (highlight) { return (<div key={highlight} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                  {highlight}
                                </div>); })}
                            </div>)}
                        </th>);
            })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Price</td>
                    {selectedProperties.map(function (property) { return (<td key={property.id} className="p-4 text-2xl font-bold text-blue-600">
                        KES {property.price.toLocaleString()}
                      </td>); })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Price per Sq Ft
                    </td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg font-semibold text-green-600">
                        KES{" "}
                        {Math.round(property.price / (((_a = property.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 1)).toLocaleString()}
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Bedrooms</td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg">
                        {((_a = property.features) === null || _a === void 0 ? void 0 : _a.bedrooms) || "N/A"}
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Bathrooms</td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg">
                        {((_a = property.features) === null || _a === void 0 ? void 0 : _a.bathrooms) || 0}
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Square Feet
                    </td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg">
                        {(((_a = property.features) === null || _a === void 0 ? void 0 : _a.squareFeet) || 0).toLocaleString()}
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Parking Spaces
                    </td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg">
                        {((_a = property.features) === null || _a === void 0 ? void 0 : _a.parkingSpaces) || 0}
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Year Built
                    </td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg">
                        {((_a = property.features) === null || _a === void 0 ? void 0 : _a.yearBuilt) || "N/A"}
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Property Age
                    </td>
                    {selectedProperties.map(function (property) {
                var _a;
                return (<td key={property.id} className="p-4 text-lg">
                        {((_a = property.features) === null || _a === void 0 ? void 0 : _a.yearBuilt) ?
                        new Date().getFullYear() - property.features.yearBuilt
                        : "N/A"}{" "}
                        years
                      </td>);
            })}
                  </tr>

                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      Verification Status
                    </td>
                    {selectedProperties.map(function (property) { return (<td key={property.id} className="p-4">
                        <span className={"px-2 py-1 rounded text-sm font-medium ".concat(getStatusStyle(property.verificationStatus || "unverified"))}>
                          {property.verificationStatus || "unverified"}
                        </span>
                      </td>); })}
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900 align-top">
                      Amenities
                    </td>
                    {selectedProperties.map(function (property) {
                var _a, _b;
                return (<td key={property.id} className="p-4">
                        <div className="space-y-1">
                          {(((_a = property.features) === null || _a === void 0 ? void 0 : _a.amenities) || []).length > 0 ?
                        (((_b = property.features) === null || _b === void 0 ? void 0 : _b.amenities) || []).map(function (amenity) { return (<div key={amenity} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                                  {amenity}
                                </div>); })
                        : <span className="text-gray-400 text-sm">
                              None listed
                            </span>}
                        </div>
                      </td>);
            })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {/* Selected Properties Summary */}
      {selectedProperties.length > 0 && (<div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              Selected for Comparison ({selectedProperties.length})
            </h3>
            <div className="flex gap-3">
              <button type="button" onClick={function () {
                // Export functionality would be implemented here
                // const exportData = {
                //   properties: selectedProperties,
                //   statistics: statistics,
                //   exportDate: new Date().toISOString(),
                // };
                window.alert("Export functionality would be implemented here");
            }} className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors">
                Export Comparison
              </button>
              <button type="button" onClick={function () {
                clearCompare();
                setValidationWarnings([]);
                onComparisonChange === null || onComparisonChange === void 0 ? void 0 : onComparisonChange([]);
            }} className="text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors">
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {selectedProperties.map(function (property) {
                var _a, _b;
                return (<div key={property.id} className="bg-white border rounded-lg p-3 flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {((_a = property.images) === null || _a === void 0 ? void 0 : _a[0]) ?
                        <img src={property.images[0]} alt="" className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center">
                      <lucide_react_1.Home className="w-6 h-6 text-gray-400"/>
                    </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {property.title}
                  </div>
                  <div className="text-gray-600 text-xs truncate">
                    {typeof property.location === "string" ?
                        property.location
                        : property.location.address}
                  </div>
                  <div className="text-blue-600 text-xs font-medium">
                    KES{" "}
                    {Math.round(property.price / (((_b = property.features) === null || _b === void 0 ? void 0 : _b.squareFeet) || 1)).toLocaleString()}
                    /sq ft
                  </div>
                </div>
                <button type="button" onClick={function (e) {
                        e.stopPropagation();
                        removeFromCompare(property.id);
                        onComparisonChange === null || onComparisonChange === void 0 ? void 0 : onComparisonChange(displayProperties.filter(function (p) { return p.id !== property.id; }));
                    }} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0" aria-label={"Remove ".concat(property.title, " from comparison")}>
                  <lucide_react_1.X className="w-4 h-4"/>
                </button>
              </div>);
            })}
          </div>

          {/* Quick Actions */}
          {selectedProperties.length >= 2 && (<div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2 text-sm">
                <div className="text-gray-600">Quick insights:</div>
                {(statistics === null || statistics === void 0 ? void 0 : statistics.advanced.bestValue) && (<span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    Best value:{" "}
                    {(_b = selectedProperties.find(function (p) { return p.id === statistics.advanced.bestValue; })) === null || _b === void 0 ? void 0 : _b.title}
                  </span>)}
                {(statistics === null || statistics === void 0 ? void 0 : statistics.advanced.newestProperty) && (<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Newest:{" "}
                    {(_c = selectedProperties.find(function (p) { return p.id == statistics.advanced.newestProperty; })) === null || _c === void 0 ? void 0 : _c.title}
                  </span>)}
                {statistics &&
                    statistics.advanced.verificationScore === 100 && (<span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      All properties verified ✓
                    </span>)}
              </div>
            </div>)}
        </div>)}

      {/* Enhanced Empty State */}
      {selectedProperties.length === 0 && (<div className="text-center py-16 bg-gray-50 rounded-lg">
          <lucide_react_1.Home className="w-20 h-20 text-gray-300 mx-auto mb-6"/>
          <h3 className="text-2xl font-medium text-gray-900 mb-3">
            No Properties Selected
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Click on properties above to add them to your comparison. You can
            compare up to {maxProperties} properties at once
            {!allowMixedTypes && " of the same type"}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Side-by-side comparison</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Property validation</span>
            </div>
          </div>
        </div>)}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Properties are automatically validated for data quality.
          {!allowMixedTypes &&
            " Only properties of the same type can be compared together."}{" "}
          Verified properties are recommended for accurate comparisons.
        </p>
      </div>
    </div>);
};
// Main component export
var PropertyCompare = function (props) {
    return <PropertyCompareInner {...props}/>;
};
exports.default = PropertyCompare;
