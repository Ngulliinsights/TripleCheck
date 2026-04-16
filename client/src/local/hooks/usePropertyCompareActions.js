"use strict";
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
exports.usePropertyCompareActions = usePropertyCompareActions;
var react_1 = require("react");
/**
 * Enhanced shared hook for managing property comparison actions
 * Handles adding/removing properties from comparison with error handling and analytics
 * Used by PropertyCard, EnhancedLandCard, and other property components
 *
 * @param options - Configuration options for comparison actions
 * @returns Comparison action handlers and state
 */
function usePropertyCompareActions(_a) {
    var property = _a.property, isInCompare = _a.isInCompare, canAddMore = _a.canAddMore, addToCompare = _a.addToCompare, removeFromCompare = _a.removeFromCompare, locationString = _a.locationString;
    var handleCompareClick = (0, react_1.useCallback)(function (event) {
        event.stopPropagation();
        try {
            if (isInCompare) {
                removeFromCompare(property.id);
                // Analytics tracking
                if (process.env.NODE_ENV === 'development') {
                    console.log('Property removed from comparison:', property.id);
                }
            }
            else if (canAddMore) {
                // Create compare-compatible property object with validation
                var compareProperty = {
                    id: property.id,
                    title: property.title || 'Untitled Property',
                    price: typeof property.price === "string" ? parseFloat(property.price) || 0 : property.price || 0,
                    location: locationString || 'Location not specified',
                    description: property.description || "",
                    images: Array.isArray(property.images) ? __spreadArray([], property.images, true) : [],
                    features: property.features || {},
                    verificationStatus: property.verificationStatus || 'pending',
                    trustScore: Math.max(0, Math.min(100, property.trustScore || 0)), // Clamp between 0-100
                    type: mapPropertyTypeForComparison(property),
                };
                addToCompare(compareProperty);
                // Analytics tracking
                if (process.env.NODE_ENV === 'development') {
                    console.log('Property added to comparison:', property.id);
                }
            }
            else {
                // Handle case where comparison limit is reached
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Cannot add more properties to comparison - limit reached');
                }
            }
        }
        catch (error) {
            console.error('Error handling comparison action:', error);
            // Could emit error event or show user notification here
        }
    }, [
        isInCompare,
        canAddMore,
        addToCompare,
        removeFromCompare,
        property,
        locationString,
    ]);
    return {
        handleCompareClick: handleCompareClick,
        isInCompare: isInCompare,
        canAddMore: canAddMore,
        isComparisonAvailable: Boolean((property === null || property === void 0 ? void 0 : property.id) && (isInCompare || canAddMore)),
    };
}
/**
 * Maps various property types to comparison-compatible types with validation
 * Ensures consistent type mapping across the comparison system
 *
 * @param property - The property to map type for
 * @returns Standardized property type for comparison
 */
function mapPropertyTypeForComparison(property) {
    var type = property.type || property.category;
    // Validate and normalize property type
    if (typeof type === 'string') {
        var normalizedType = type.toLowerCase().trim();
        if (normalizedType === "commercial" || normalizedType === "office" || normalizedType === "retail") {
            return "commercial";
        }
    }
    // Default to residential for land, residential, and other types
    // This ensures all properties can be compared even with unknown types
    return "residential";
}
exports.default = usePropertyCompareActions;
