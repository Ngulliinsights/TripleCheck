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
exports.adaptivePropertyAdapter = exports.landPropertyAdapter = exports.commercialPropertyAdapter = exports.residentialPropertyAdapter = exports.basePropertyAdapter = void 0;
exports.adaptProperties = adaptProperties;
exports.isResidentialProperty = isResidentialProperty;
exports.isCommercialProperty = isCommercialProperty;
exports.isLandProperty = isLandProperty;
exports.validateNormalizedProperty = validateNormalizedProperty;
/**
 * Utility functions to convert legacy Property objects to normalized format
 * These adapters ensure complete type safety and exact compatibility with exactOptionalPropertyTypes
 *
 * Key architectural principles:
 * - Never assign undefined to optional properties - either include them with valid values or omit entirely
 * - Use conditional object construction with explicit type control
 * - Separate required and optional property construction completely
 * - Clean input validation with definitive true/false decisions
 */
// Helper function to normalize location with enhanced type safety
function normalizeLocation(location) {
    return typeof location === 'string' ? location : location.address;
}
// Helper function to normalize price with better error handling
function normalizePrice(price) {
    if (typeof price === 'number')
        return price;
    var parsed = parseFloat(price.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
}
// Helper function to normalize images with fallback handling
function normalizeImages(property) {
    return property.images || property.imageUrls || [];
}
// Helper function to determine property category with improved logic
function determineCategory(property) {
    var type = (property.type || property.propertyType || '').toLowerCase();
    var title = property.title.toLowerCase();
    var description = property.description.toLowerCase();
    // Check for land indicators with more comprehensive patterns
    if (type.includes('land') ||
        title.includes('land') ||
        title.includes('acre') ||
        title.includes('plot') ||
        description.includes('land')) {
        return 'land';
    }
    // Check for commercial indicators with expanded patterns
    var commercialTypes = ['office', 'retail', 'warehouse', 'industrial', 'commercial', 'shop', 'store'];
    if (commercialTypes.some(function (ct) { return type.includes(ct); }) ||
        title.includes('office') ||
        title.includes('commercial') ||
        title.includes('retail') ||
        title.includes('business')) {
        return 'commercial';
    }
    // Default to residential
    return 'residential';
}
// Enhanced helper to safely extract valid values - returns undefined only when we should omit the property
function extractValidNumber(value) {
    if (value === null || value === undefined || value === '')
        return undefined;
    var num = Number(value);
    return isNaN(num) ? undefined : num;
}
function extractValidBoolean(value) {
    if (value === null || value === undefined)
        return undefined;
    return Boolean(value);
}
function extractValidString(value) {
    if (value === null || value === undefined || value === '')
        return undefined;
    return String(value);
}
// Helper to normalize verification status with strict type control
function normalizeVerificationStatus(status) {
    if (status === 'verified' || status === 'pending' || status === 'unverified' || status === 'flagged') {
        return status;
    }
    // Handle the draft -> pending conversion case
    if (status === 'draft') {
        return 'pending';
    }
    // Default to pending for any other case
    return 'pending';
}
// Base adapter for converting Property to NormalizedProperty
var basePropertyAdapter = function (property) {
    var _a;
    // Build the core required properties with strict type control
    var coreProperties = {
        id: String(property.id),
        title: property.title,
        description: property.description,
        price: normalizePrice(property.price),
        location: normalizeLocation(property.location),
        images: normalizeImages(property),
        verified: property.verificationStatus === 'verified',
        type: property.type || property.propertyType || 'unknown',
        category: determineCategory(property),
        features: property.features || {},
        createdAt: property.createdAt ? new Date(property.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: property.updatedAt ? new Date(property.updatedAt).toISOString() : new Date().toISOString(),
        status: property.status || 'available',
        rating: ((_a = property.aiVerificationResults) === null || _a === void 0 ? void 0 : _a.overallScore) || 0,
        verificationStatus: normalizeVerificationStatus(property.verificationStatus),
    };
    // Start with the core properties as our result
    var result = coreProperties;
    // Conditionally add optional properties only when they have definite values
    var views = extractValidNumber(property.viewCount);
    if (views !== undefined) {
        result = __assign(__assign({}, result), { views: views });
    }
    var trustScore = extractValidNumber(property.trustScore);
    if (trustScore !== undefined) {
        result = __assign(__assign({}, result), { trustScore: trustScore });
    }
    if (property.owner) {
        result = __assign(__assign({}, result), { owner: {
                id: property.owner.id,
                name: "".concat(property.owner.firstName || '', " ").concat(property.owner.lastName || '').trim() || property.owner.username,
                email: property.owner.email,
                trustScore: property.owner.trustScore,
                isVerifiedAgent: property.owner.isVerifiedAgent,
            } });
    }
    if (property.coordinates) {
        result = __assign(__assign({}, result), { coordinates: property.coordinates });
    }
    return result;
};
exports.basePropertyAdapter = basePropertyAdapter;
// Residential property adapter with bulletproof optional property handling
var residentialPropertyAdapter = function (property) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var base = (0, exports.basePropertyAdapter)(property);
    // Create the core required features with no undefined values
    var coreFeatures = {
        bedrooms: Number(property.bedrooms || ((_a = property.features) === null || _a === void 0 ? void 0 : _a.bedrooms)) || 0,
        bathrooms: Number(property.bathrooms || ((_b = property.features) === null || _b === void 0 ? void 0 : _b.bathrooms)) || 0,
        squareFeet: Number(property.size || ((_c = property.features) === null || _c === void 0 ? void 0 : _c.squareFeet)) || 0,
        amenities: property.amenities || ((_d = property.features) === null || _d === void 0 ? void 0 : _d.amenities) || [],
        furnished: Boolean((_e = property.features) === null || _e === void 0 ? void 0 : _e.furnished),
        petFriendly: Boolean((_f = property.features) === null || _f === void 0 ? void 0 : _f.petFriendly),
    };
    // Start with existing features (cleaned) plus our core features
    var combinedFeatures = __assign({}, coreFeatures);
    // Conditionally add optional features only when they have valid values
    var parkingSpaces = extractValidNumber((_g = property.features) === null || _g === void 0 ? void 0 : _g.parkingSpaces);
    if (parkingSpaces !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { parkingSpaces: parkingSpaces });
    }
    var yearBuilt = extractValidNumber((_h = property.features) === null || _h === void 0 ? void 0 : _h.yearBuilt);
    if (yearBuilt !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { yearBuilt: yearBuilt });
    }
    var balcony = extractValidBoolean((_j = property.features) === null || _j === void 0 ? void 0 : _j.balcony);
    if (balcony !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { balcony: balcony });
    }
    var garden = extractValidBoolean((_k = property.features) === null || _k === void 0 ? void 0 : _k.garden);
    if (garden !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { garden: garden });
    }
    // Add any additional properties from the original features that aren't explicitly handled
    // but filter out undefined values to maintain exactOptionalPropertyTypes compliance
    var additionalFeatures = Object.fromEntries(Object.entries(property.features || {}).filter(function (_a) {
        var key = _a[0], value = _a[1];
        return !['bedrooms', 'bathrooms', 'squareFeet', 'amenities', 'furnished', 'petFriendly',
            'parkingSpaces', 'yearBuilt', 'balcony', 'garden'].includes(key) &&
            value !== undefined && value !== null && value !== '';
    }));
    combinedFeatures = __assign(__assign({}, combinedFeatures), additionalFeatures);
    return __assign(__assign({}, base), { category: 'residential', type: property.type || 'apartment', features: combinedFeatures });
};
exports.residentialPropertyAdapter = residentialPropertyAdapter;
// Commercial property adapter with comprehensive optional property management
var commercialPropertyAdapter = function (property) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var base = (0, exports.basePropertyAdapter)(property);
    // Build the required features with definitive values
    var coreFeatures = {
        size: Number(property.size || property.area || ((_a = property.features) === null || _a === void 0 ? void 0 : _a.squareFeet)) || 0,
        yearBuilt: Number((_b = property.features) === null || _b === void 0 ? void 0 : _b.yearBuilt) || new Date().getFullYear(),
    };
    // Start with core features
    var combinedFeatures = __assign({}, coreFeatures);
    // Conditionally add each optional feature only when valid
    var occupancyRate = extractValidNumber((_c = property.features) === null || _c === void 0 ? void 0 : _c.occupancyRate);
    if (occupancyRate !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { occupancyRate: occupancyRate });
    }
    var roi = extractValidNumber((_d = property.features) === null || _d === void 0 ? void 0 : _d.roi);
    if (roi !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { roi: roi });
    }
    var parkingSpaces = extractValidNumber((_e = property.features) === null || _e === void 0 ? void 0 : _e.parkingSpaces);
    if (parkingSpaces !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { parkingSpaces: parkingSpaces });
    }
    var floors = extractValidNumber((_f = property.features) === null || _f === void 0 ? void 0 : _f.floors);
    if (floors !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { floors: floors });
    }
    var elevators = extractValidNumber((_g = property.features) === null || _g === void 0 ? void 0 : _g.elevators);
    if (elevators !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { elevators: elevators });
    }
    var airConditioning = extractValidBoolean((_h = property.features) === null || _h === void 0 ? void 0 : _h.airConditioning);
    if (airConditioning !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { airConditioning: airConditioning });
    }
    var security = extractValidBoolean((_j = property.features) === null || _j === void 0 ? void 0 : _j.security);
    if (security !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { security: security });
    }
    var loadingDock = extractValidBoolean((_k = property.features) === null || _k === void 0 ? void 0 : _k.loadingDock);
    if (loadingDock !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { loadingDock: loadingDock });
    }
    // Include additional features while filtering out undefined values
    var additionalFeatures = Object.fromEntries(Object.entries(property.features || {}).filter(function (_a) {
        var key = _a[0], value = _a[1];
        return !['size', 'yearBuilt', 'occupancyRate', 'roi', 'parkingSpaces', 'floors',
            'elevators', 'airConditioning', 'security', 'loadingDock'].includes(key) &&
            value !== undefined && value !== null && value !== '';
    }));
    combinedFeatures = __assign(__assign({}, combinedFeatures), additionalFeatures);
    return __assign(__assign({}, base), { category: 'commercial', type: property.type || 'office', features: combinedFeatures });
};
exports.commercialPropertyAdapter = commercialPropertyAdapter;
// Land property adapter with meticulous optional property handling
var landPropertyAdapter = function (property) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var base = (0, exports.basePropertyAdapter)(property);
    // Build required features with guaranteed values
    var coreFeatures = {
        size: String(((_a = property.features) === null || _a === void 0 ? void 0 : _a.size) || "".concat(property.size || property.area || 0, " sqm")),
        titleDeedStatus: ((_b = property.features) === null || _b === void 0 ? void 0 : _b.titleDeedStatus) || 'available',
    };
    // Start with core features
    var combinedFeatures = __assign({}, coreFeatures);
    // Conditionally add optional string properties
    var soilType = extractValidString((_c = property.features) === null || _c === void 0 ? void 0 : _c.soilType);
    if (soilType !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { soilType: soilType });
    }
    var zoning = extractValidString((_d = property.features) === null || _d === void 0 ? void 0 : _d.zoning);
    if (zoning !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { zoning: zoning });
    }
    var developmentPotential = extractValidString((_e = property.features) === null || _e === void 0 ? void 0 : _e.developmentPotential);
    if (developmentPotential !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { developmentPotential: developmentPotential });
    }
    var topography = extractValidString((_f = property.features) === null || _f === void 0 ? void 0 : _f.topography);
    if (topography !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { topography: topography });
    }
    var drainage = extractValidString((_g = property.features) === null || _g === void 0 ? void 0 : _g.drainage);
    if (drainage !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { drainage: drainage });
    }
    // Conditionally add optional boolean properties
    var waterAccess = extractValidBoolean((_h = property.features) === null || _h === void 0 ? void 0 : _h.waterAccess);
    if (waterAccess !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { waterAccess: waterAccess });
    }
    var roadAccess = extractValidBoolean((_j = property.features) === null || _j === void 0 ? void 0 : _j.roadAccess);
    if (roadAccess !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { roadAccess: roadAccess });
    }
    var electricityAccess = extractValidBoolean((_k = property.features) === null || _k === void 0 ? void 0 : _k.electricityAccess);
    if (electricityAccess !== undefined) {
        combinedFeatures = __assign(__assign({}, combinedFeatures), { electricityAccess: electricityAccess });
    }
    // Include additional features while maintaining type safety
    var additionalFeatures = Object.fromEntries(Object.entries(property.features || {}).filter(function (_a) {
        var key = _a[0], value = _a[1];
        return !['size', 'titleDeedStatus', 'soilType', 'zoning', 'developmentPotential',
            'topography', 'drainage', 'waterAccess', 'roadAccess', 'electricityAccess'].includes(key) &&
            value !== undefined && value !== null && value !== '';
    }));
    combinedFeatures = __assign(__assign({}, combinedFeatures), additionalFeatures);
    // Determine land type from zoning or property type
    var landType = (function () {
        var _a, _b, _c;
        var zoning = (_b = (_a = property.features) === null || _a === void 0 ? void 0 : _a.zoning) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        if (zoning === 'commercial')
            return 'commercial';
        if (zoning === 'industrial')
            return 'industrial';
        if (zoning === 'agricultural' || zoning === 'farming')
            return 'agricultural';
        // Fallback to property type if available
        var propType = (_c = property.type) === null || _c === void 0 ? void 0 : _c.toLowerCase();
        if (propType === 'commercial' || propType === 'industrial' || propType === 'agricultural') {
            return propType;
        }
        // Default to residential
        return 'residential';
    })();
    return __assign(__assign({}, base), { category: 'land', type: landType, features: combinedFeatures });
};
exports.landPropertyAdapter = landPropertyAdapter;
// Adaptive adapter that intelligently chooses the right adapter based on property category
var adaptivePropertyAdapter = function (property) {
    var category = determineCategory(property);
    switch (category) {
        case 'residential':
            return (0, exports.residentialPropertyAdapter)(property);
        case 'commercial':
            return (0, exports.commercialPropertyAdapter)(property);
        case 'land':
            return (0, exports.landPropertyAdapter)(property);
        default:
            return (0, exports.basePropertyAdapter)(property);
    }
};
exports.adaptivePropertyAdapter = adaptivePropertyAdapter;
// Enhanced batch adapter with comprehensive error handling
function adaptProperties(properties, adapter) {
    if (adapter === void 0) { adapter = exports.adaptivePropertyAdapter; }
    return properties
        .filter(function (property) { return property && typeof property === 'object'; }) // Filter out invalid properties
        .map(adapter);
}
// Type guard functions for property categories with enhanced validation
function isResidentialProperty(property) {
    return property.category === 'residential' &&
        typeof property.features.bedrooms === 'number' &&
        typeof property.features.bathrooms === 'number';
}
function isCommercialProperty(property) {
    return property.category === 'commercial' &&
        typeof property.features.size === 'number' &&
        typeof property.features.yearBuilt === 'number';
}
function isLandProperty(property) {
    return property.category === 'land' &&
        typeof property.features.size === 'string';
}
// Enhanced validation function with comprehensive type checking
function validateNormalizedProperty(property) {
    if (typeof property !== 'object' || property === null) {
        return false;
    }
    var prop = property;
    // Check required fields with precise type validation
    var hasRequiredFields = (typeof prop.id === 'string' &&
        typeof prop.title === 'string' &&
        typeof prop.description === 'string' &&
        typeof prop.price === 'number' &&
        typeof prop.location === 'string' &&
        Array.isArray(prop.images) &&
        typeof prop.verified === 'boolean' &&
        typeof prop.type === 'string' &&
        ['residential', 'commercial', 'land'].includes(prop.category) &&
        typeof prop.features === 'object' &&
        typeof prop.createdAt === 'string');
    if (!hasRequiredFields)
        return false;
    // Validate images array contains only strings
    var images = prop.images;
    if (!images.every(function (img) { return typeof img === 'string'; })) {
        return false;
    }
    // Validate verification status is one of the allowed values
    var verificationStatus = prop.verificationStatus;
    if (verificationStatus && !['verified', 'pending', 'unverified', 'flagged'].includes(verificationStatus)) {
        return false;
    }
    // Validate dates are proper ISO strings
    try {
        new Date(prop.createdAt);
        if (prop.updatedAt) {
            new Date(prop.updatedAt);
        }
    }
    catch (_a) {
        return false;
    }
    return true;
}
