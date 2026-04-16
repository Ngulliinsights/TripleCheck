"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.ReviewDataSchema = exports.UserDataSchema = exports.PropertyDataSchema = void 0;
exports.safeParseJSON = safeParseJSON;
exports.safeParseProperty = safeParseProperty;
exports.safeParseUser = safeParseUser;
exports.safeParseReview = safeParseReview;
exports.safeParsePropertyArray = safeParsePropertyArray;
exports.safeParseUserArray = safeParseUserArray;
exports.safeParseReviewArray = safeParseReviewArray;
exports.validateImageUrl = validateImageUrl;
exports.validateImageUrls = validateImageUrls;
exports.formatPrice = formatPrice;
exports.truncateText = truncateText;
exports.calculateAverageRating = calculateAverageRating;
var zod_1 = require("zod");
// Safe data parsing utilities
function safeParseJSON(jsonString, fallback) {
    if (!jsonString)
        return fallback;
    try {
        var parsed = JSON.parse(jsonString);
        return parsed !== null && parsed !== void 0 ? parsed : fallback;
    }
    catch (error) {
        console.warn('Failed to parse JSON:', error);
        return fallback;
    }
}
// Property data validation with fallbacks
exports.PropertyDataSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(2000),
    location: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().int().min(0),
    imageUrls: zod_1.z.array(zod_1.z.string().url()).min(1),
    features: zod_1.z.object({
        bedrooms: zod_1.z.number().int().min(0).max(20).default(0),
        bathrooms: zod_1.z.number().min(0).max(20).default(0),
        squareFeet: zod_1.z.number().int().min(1).max(100000).default(1000),
        parkingSpaces: zod_1.z.number().int().min(0).max(20).default(0),
        yearBuilt: zod_1.z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
        amenities: zod_1.z.array(zod_1.z.string()).default([]),
        propertyType: zod_1.z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio']).optional(),
        petFriendly: zod_1.z.boolean().default(false),
        furnished: zod_1.z.boolean().default(false)
    }).default({}),
    verificationStatus: zod_1.z.enum(['pending', 'verified', 'rejected']).default('pending'),
    createdAt: zod_1.z.string().datetime().optional(),
    updatedAt: zod_1.z.string().datetime().optional()
});
// User data validation
exports.UserDataSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
    username: zod_1.z.string().min(1).max(30),
    trustScore: zod_1.z.number().int().min(0).max(1000).default(0),
    isVerifiedAgent: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.string().datetime().optional(),
    updatedAt: zod_1.z.string().datetime().optional()
});
// Review data validation
exports.ReviewDataSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
    propertyId: zod_1.z.number().int().positive(),
    userId: zod_1.z.number().int().positive(),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(1).max(1000),
    createdAt: zod_1.z.string().datetime().optional(),
    updatedAt: zod_1.z.string().datetime().optional()
});
// Safe data parsing functions
function safeParseProperty(data) {
    try {
        return exports.PropertyDataSchema.parse(data);
    }
    catch (error) {
        console.warn('Invalid property data:', error);
        return null;
    }
}
function safeParseUser(data) {
    try {
        return exports.UserDataSchema.parse(data);
    }
    catch (error) {
        console.warn('Invalid user data:', error);
        return null;
    }
}
function safeParseReview(data) {
    try {
        return exports.ReviewDataSchema.parse(data);
    }
    catch (error) {
        console.warn('Invalid review data:', error);
        return null;
    }
}
// Array parsing with filtering of invalid items
function safeParsePropertyArray(data) {
    if (!Array.isArray(data))
        return [];
    return data
        .map(function (item) { return safeParseProperty(item); })
        .filter(function (item) { return item !== null; });
}
function safeParseUserArray(data) {
    if (!Array.isArray(data))
        return [];
    return data
        .map(function (item) { return safeParseUser(item); })
        .filter(function (item) { return item !== null; });
}
function safeParseReviewArray(data) {
    if (!Array.isArray(data))
        return [];
    return data
        .map(function (item) { return safeParseReview(item); })
        .filter(function (item) { return item !== null; });
}
// Image URL validation and fallback
function validateImageUrl(url) {
    try {
        new URL(url);
        return url;
    }
    catch (_a) {
        return '/placeholder-property.jpg'; // Fallback image
    }
}
function validateImageUrls(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
        return ['/placeholder-property.jpg'];
    }
    var validUrls = urls.map(validateImageUrl);
    return validUrls.length > 0 ? validUrls : ['/placeholder-property.jpg'];
}
// Price formatting with safety
function formatPrice(price) {
    var numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (typeof numPrice !== 'number' || isNaN(numPrice) || numPrice < 0) {
        return 'Price on request';
    }
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numPrice);
}
// Safe string truncation
function truncateText(text, maxLength) {
    if (!text || typeof text !== 'string')
        return '';
    if (text.length <= maxLength)
        return text;
    return "".concat(text.substring(0, maxLength - 3), "...");
}
// Date formatting with fallback
var date_utils_1 = require("../../local/utils/date-utils");
// Re-export for backward compatibility
exports.formatDate = date_utils_1.formatKenyaDate;
// Rating calculation with safety
function calculateAverageRating(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0)
        return 0;
    var validRatings = reviews
        .map(function (review) { return review.rating; })
        .filter(function (rating) { return typeof rating === 'number' && rating >= 1 && rating <= 5; });
    if (validRatings.length === 0)
        return 0;
    var sum = validRatings.reduce(function (acc, rating) { return acc + rating; }, 0);
    return Math.round((sum / validRatings.length) * 10) / 10; // Round to 1 decimal
}
