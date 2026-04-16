"use strict";
/**
 * Unified Compare Utilities
 *
 * Shared utility functions for all comparison functionality
 * to ensure consistency across components.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompareUrlParams = exports.getCompareUrlParams = exports.normalizePropertyForComparison = exports.safeGetAmenities = exports.compareFeatureValues = exports.comparePropertyValues = exports.getFeatureValue = exports.getPropertyFeatures = exports.isValidCompareProperty = exports.isValidVerificationStatus = exports.getVerificationBadge = exports.getComparePropertyTitle = exports.safeGetPropertyImage = exports.formatCompareLocation = exports.formatComparePrice = exports.DEFAULT_DESCRIPTION = exports.PRICE_DISPLAY_FALLBACK = exports.LOCATION_NOT_SPECIFIED = exports.CURRENCY_CODE = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../components/ui/badge");
// Constants
exports.CURRENCY_CODE = "KES";
exports.LOCATION_NOT_SPECIFIED = "Location not specified";
exports.PRICE_DISPLAY_FALLBACK = "—";
exports.DEFAULT_DESCRIPTION = "No description available";
/**
 * Unified price formatting for all compare components
 */
var formatComparePrice = function (price) {
    if (price == null)
        return exports.PRICE_DISPLAY_FALLBACK;
    try {
        var numericPrice = typeof price === "string" ? parseFloat(price) : price;
        if (typeof numericPrice !== "number" || isNaN(numericPrice) || numericPrice < 0) {
            return exports.PRICE_DISPLAY_FALLBACK;
        }
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: exports.CURRENCY_CODE,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numericPrice);
    }
    catch (error) {
        console.warn("Failed to format price:", error);
        return "".concat(exports.CURRENCY_CODE, " ").concat(price);
    }
};
exports.formatComparePrice = formatComparePrice;
/**
 * Unified location formatting
 */
var formatCompareLocation = function (location) {
    try {
        if (typeof location === "string" && location.trim()) {
            return location.trim();
        }
        if (location && typeof location === "object") {
            var locationObj = location;
            return (locationObj.name ||
                locationObj.address ||
                locationObj.city ||
                exports.LOCATION_NOT_SPECIFIED);
        }
    }
    catch (error) {
        console.warn("Failed to format location:", error);
    }
    return exports.LOCATION_NOT_SPECIFIED;
};
exports.formatCompareLocation = formatCompareLocation;
/**
 * Unified property image handling
 */
var safeGetPropertyImage = function (property) {
    try {
        if (property.images && Array.isArray(property.images) && property.images.length > 0) {
            return property.images[0];
        }
    }
    catch (error) {
        console.warn("Failed to get property image:", error);
    }
    return undefined;
};
exports.safeGetPropertyImage = safeGetPropertyImage;
/**
 * Unified property title handling
 */
var getComparePropertyTitle = function (property) {
    try {
        return (property === null || property === void 0 ? void 0 : property.title) && String(property.title).trim()
            ? String(property.title).trim()
            : "Untitled Property";
    }
    catch (error) {
        console.warn("Failed to get property title:", error);
        return "Untitled Property";
    }
};
exports.getComparePropertyTitle = getComparePropertyTitle;
/**
 * Unified verification badge component
 */
var getVerificationBadge = function (status) {
    var _a;
    try {
        var safeStatus = (0, exports.isValidVerificationStatus)(status) ? status : undefined;
        var config = {
            verified: {
                className: "bg-green-100 text-green-800 border-green-300",
                icon: lucide_react_1.CheckCircle,
                label: "Verified",
            },
            pending: {
                className: "bg-yellow-100 text-yellow-800 border-yellow-300",
                icon: lucide_react_1.AlertCircle,
                label: "Pending",
            },
            unverified: {
                className: "bg-red-100 text-red-800 border-red-300",
                icon: lucide_react_1.XCircle,
                label: "Unverified",
            },
            draft: {
                className: "bg-gray-100 text-gray-800 border-gray-300",
                icon: lucide_react_1.Minus,
                label: "Draft",
            },
        };
        var finalConfig = (_a = config[safeStatus]) !== null && _a !== void 0 ? _a : {
            className: "bg-gray-100 text-gray-800 border-gray-300",
            icon: lucide_react_1.Minus,
            label: "Unknown",
        };
        var Icon = finalConfig.icon;
        return (<badge_1.Badge className={"flex items-center gap-1 ".concat(finalConfig.className)}>
        <Icon className="w-3 h-3"/>
        {finalConfig.label}
      </badge_1.Badge>);
    }
    catch (error) {
        console.warn("Failed to get verification badge:", error);
        return (<badge_1.Badge className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1">
        <lucide_react_1.Minus className="w-3 h-3"/>
        Unknown
      </badge_1.Badge>);
    }
};
exports.getVerificationBadge = getVerificationBadge;
/**
 * Validation helpers
 */
var isValidVerificationStatus = function (status) {
    return (status === undefined ||
        ["verified", "pending", "unverified", "draft"].includes(status));
};
exports.isValidVerificationStatus = isValidVerificationStatus;
var isValidCompareProperty = function (property) {
    return (typeof property === "object" &&
        property !== null &&
        "id" in property &&
        "title" in property &&
        "price" in property);
}; /*
*
 * Property feature accessors
 */
exports.isValidCompareProperty = isValidCompareProperty;
var getPropertyFeatures = function (property) {
    try {
        return (property === null || property === void 0 ? void 0 : property.features) || null;
    }
    catch (error) {
        console.warn("Failed to get property features:", error);
        return null;
    }
};
exports.getPropertyFeatures = getPropertyFeatures;
var getFeatureValue = function (property, feature) {
    try {
        var features = (0, exports.getPropertyFeatures)(property);
        if (!features)
            return undefined;
        var allowedFeatures = [
            "bedrooms",
            "bathrooms",
            "squareFeet",
            "parkingSpaces",
            "yearBuilt",
            "amenities",
        ];
        return allowedFeatures.includes(feature) ? features[feature] : undefined;
    }
    catch (error) {
        console.warn("Failed to get feature value for ".concat(String(feature), ":"), error);
        return undefined;
    }
};
exports.getFeatureValue = getFeatureValue;
/**
 * Property comparison utilities
 */
var comparePropertyValues = function (p1, p2, key) {
    try {
        var v1 = p1 === null || p1 === void 0 ? void 0 : p1[key];
        var v2 = p2 === null || p2 === void 0 ? void 0 : p2[key];
        if (v1 === v2)
            return "equal";
        if (v1 == null || v2 == null)
            return "different";
        if (typeof v1 === "number" && typeof v2 === "number") {
            return v1 > v2 ? "higher" : "lower";
        }
        return "different";
    }
    catch (error) {
        console.warn("Failed to compare property values for key ".concat(String(key), ":"), error);
        return "different";
    }
};
exports.comparePropertyValues = comparePropertyValues;
var compareFeatureValues = function (p1, p2, feature) {
    try {
        var v1 = (0, exports.getFeatureValue)(p1, feature);
        var v2 = (0, exports.getFeatureValue)(p2, feature);
        if (v1 === v2)
            return "equal";
        if (v1 == null || v2 == null)
            return "different";
        if (typeof v1 === "number" && typeof v2 === "number") {
            return v1 > v2 ? "higher" : "lower";
        }
        return "different";
    }
    catch (error) {
        console.warn("Failed to compare feature values for ".concat(String(feature), ":"), error);
        return "different";
    }
};
exports.compareFeatureValues = compareFeatureValues;
/**
 * Safe amenities accessor
 */
var safeGetAmenities = function (amenities) {
    if (Array.isArray(amenities)) {
        return amenities.filter(function (item) { return typeof item === "string"; });
    }
    return [];
};
exports.safeGetAmenities = safeGetAmenities;
/**
 * Property data normalization
 */
var normalizePropertyForComparison = function (property) {
    try {
        if (!(0, exports.isValidCompareProperty)(property)) {
            return null;
        }
        return __assign(__assign({}, property), { id: String(property.id), title: String(property.title || "Untitled Property"), price: typeof property.price === "string" ? parseFloat(property.price) : property.price, description: property.description || exports.DEFAULT_DESCRIPTION });
    }
    catch (error) {
        console.warn("Failed to normalize property for comparison:", error);
        return null;
    }
};
exports.normalizePropertyForComparison = normalizePropertyForComparison;
/**
 * URL parameter utilities for comparison
 */
var getCompareUrlParams = function () {
    var _a;
    try {
        var urlParams = new URLSearchParams(window.location.search);
        return ((_a = urlParams.get("properties")) === null || _a === void 0 ? void 0 : _a.split(",").filter(Boolean)) || [];
    }
    catch (error) {
        console.warn("Failed to parse URL parameters:", error);
        return [];
    }
};
exports.getCompareUrlParams = getCompareUrlParams;
var updateCompareUrlParams = function (propertyIds) {
    try {
        var params = new URLSearchParams(window.location.search);
        if (propertyIds.length > 0) {
            params.set("properties", propertyIds.join(","));
        }
        else {
            params.delete("properties");
        }
        var queryString = params.toString();
        var queryPart = queryString ? "?".concat(queryString) : "";
        var newUrl = "".concat(window.location.pathname).concat(queryPart);
        window.history.replaceState({}, "", newUrl);
    }
    catch (error) {
        console.warn("Failed to update URL parameters:", error);
        // Don't break functionality if URL update fails
    }
};
exports.updateCompareUrlParams = updateCompareUrlParams;
