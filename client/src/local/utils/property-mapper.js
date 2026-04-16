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
exports.normalizeProperty = void 0;
/**
 * Normalizes property data to ensure consistent structure
 */
var normalizeProperty = function (property, category) {
    var _a, _b, _c, _d, _e, _f;
    if (category === void 0) { category = 'residential'; }
    var prop = property;
    var result = {
        id: String(prop.id),
        title: prop.title || 'Untitled Property',
        description: prop.description || '',
        price: Number(prop.price) || 0,
        location: typeof prop.location === 'string' ? prop.location : ((_a = prop.location) === null || _a === void 0 ? void 0 : _a.address) || 'Location not specified',
        images: prop.images || prop.imageUrls || [],
        verified: prop.verificationStatus === 'verified' || false,
        type: prop.type || category,
        category: category,
        features: __assign({ bedrooms: prop.bedrooms || ((_b = prop.features) === null || _b === void 0 ? void 0 : _b.bedrooms), bathrooms: prop.bathrooms || ((_c = prop.features) === null || _c === void 0 ? void 0 : _c.bathrooms), squareFeet: prop.squareFeet || ((_d = prop.features) === null || _d === void 0 ? void 0 : _d.squareFeet), area: prop.area || ((_e = prop.features) === null || _e === void 0 ? void 0 : _e.area), propertyType: prop.propertyType || ((_f = prop.features) === null || _f === void 0 ? void 0 : _f.propertyType) || category }, prop.features),
        status: prop.status || 'available',
        createdAt: prop.createdAt || new Date().toISOString(),
    };
    // Add optional properties only if they have valid values
    if (prop.updatedAt) {
        result.updatedAt = prop.updatedAt;
    }
    if (prop.rating !== undefined) {
        result.rating = prop.rating;
    }
    if (prop.viewCount !== undefined) {
        result.views = prop.viewCount;
    }
    if (prop.trustScore !== undefined) {
        result.trustScore = prop.trustScore;
    }
    if (prop.verificationStatus) {
        result.verificationStatus = prop.verificationStatus;
    }
    if (prop.owner) {
        var owner = {
            id: String(prop.owner.id),
            name: prop.owner.name || "".concat(prop.owner.firstName || '', " ").concat(prop.owner.lastName || '').trim() || 'Unknown Owner',
            trustScore: prop.owner.trustScore || 0,
            isVerifiedAgent: prop.owner.isVerifiedAgent || false,
        };
        if (prop.owner.email) {
            owner.email = prop.owner.email;
        }
        if (prop.owner.phone) {
            owner.phone = prop.owner.phone;
        }
        if (prop.owner.profileImageUrl) {
            owner.avatar = prop.owner.profileImageUrl;
        }
        result.owner = owner;
    }
    if (prop.coordinates) {
        result.coordinates = prop.coordinates;
    }
    return result;
};
exports.normalizeProperty = normalizeProperty;
