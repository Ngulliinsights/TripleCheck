"use strict";
/**
 * Utility functions for image gallery operations
 */
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
exports.sortImages = exports.matchesTextQuery = exports.isAdvancedImage = void 0;
var unified_utils_1 = require("../../../utils/images/unified-utils");
var isAdvancedImage = function (img) {
    return "approvalStatus" in img;
};
exports.isAdvancedImage = isAdvancedImage;
var matchesTextQuery = function (img, query) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var normalizedQuery = query.toLowerCase();
    var alt = unified_utils_1.ImageUtils.getAlt(img).toLowerCase();
    var category = (_b = (_a = img.category) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : "";
    if ((0, exports.isAdvancedImage)(img)) {
        var tags = (_d = (_c = img.tags) === null || _c === void 0 ? void 0 : _c.map(function (t) { return t.toLowerCase(); })) !== null && _d !== void 0 ? _d : [];
        var aiTags = (_f = (_e = img.aiTags) === null || _e === void 0 ? void 0 : _e.map(function (t) { return t.toLowerCase(); })) !== null && _f !== void 0 ? _f : [];
        var collections = (_h = (_g = img.collections) === null || _g === void 0 ? void 0 : _g.map(function (c) { return c.toLowerCase(); })) !== null && _h !== void 0 ? _h : [];
        return (alt.includes(normalizedQuery) ||
            category.includes(normalizedQuery) ||
            tags.some(function (tag) { return tag.includes(normalizedQuery); }) ||
            aiTags.some(function (tag) { return tag.includes(normalizedQuery); }) ||
            collections.some(function (collection) { return collection.includes(normalizedQuery); }));
    }
    return alt.includes(normalizedQuery) || category.includes(normalizedQuery);
};
exports.matchesTextQuery = matchesTextQuery;
var sortImages = function (images, sortMode, ascending) {
    if (ascending === void 0) { ascending = true; }
    return __spreadArray([], images, true).sort(function (a, b) {
        var comparison = 0;
        if (sortMode === "name") {
            comparison = unified_utils_1.ImageUtils.getAlt(a).localeCompare(unified_utils_1.ImageUtils.getAlt(b));
        }
        else if (sortMode === "date") {
            var dateA = (0, exports.isAdvancedImage)(a) ? a.uploadDate : undefined;
            var dateB = (0, exports.isAdvancedImage)(b) ? b.uploadDate : undefined;
            comparison = ((dateA === null || dateA === void 0 ? void 0 : dateA.getTime()) || 0) - ((dateB === null || dateB === void 0 ? void 0 : dateB.getTime()) || 0);
        }
        else if (sortMode === "size") {
            var sizeA = (0, exports.isAdvancedImage)(a) ? a.fileSize : 0;
            var sizeB = (0, exports.isAdvancedImage)(b) ? b.fileSize : 0;
            comparison = (sizeA || 0) - (sizeB || 0);
        }
        else if (sortMode === "rating") {
            var ratingA = (0, exports.isAdvancedImage)(a) ? a.rating : 0;
            var ratingB = (0, exports.isAdvancedImage)(b) ? b.rating : 0;
            comparison = (ratingA || 0) - (ratingB || 0);
        }
        else if (sortMode === "usage") {
            var usageA = (0, exports.isAdvancedImage)(a) ? a.usage : 0;
            var usageB = (0, exports.isAdvancedImage)(b) ? b.usage : 0;
            comparison = (usageA || 0) - (usageB || 0);
        }
        return ascending ? comparison : -comparison;
    });
};
exports.sortImages = sortImages;
