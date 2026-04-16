"use strict";
/**
 * Image search and filtering hook
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useImageSearch = void 0;
var react_1 = require("react");
var utils_1 = require("./utils");
var matchesFacetFilter = function (img, facetType, values) {
    if (values.length === 0)
        return true;
    if (facetType === "categories") {
        return img.category ? values.includes(img.category) : false;
    }
    if (facetType === "approvalStatus") {
        return (0, utils_1.isAdvancedImage)(img) && img.approvalStatus
            ? values.includes(img.approvalStatus)
            : false;
    }
    if (facetType === "tags") {
        return (0, utils_1.isAdvancedImage)(img) && img.tags
            ? img.tags.some(function (tag) { return values.includes(tag); })
            : false;
    }
    if (facetType === "users") {
        return (0, utils_1.isAdvancedImage)(img) && img.assignedTo
            ? img.assignedTo.some(function (user) { return values.includes(user); })
            : false;
    }
    if (facetType === "collections") {
        return (0, utils_1.isAdvancedImage)(img) && img.collections
            ? img.collections.some(function (collection) { return values.includes(collection); })
            : false;
    }
    return true;
};
var buildFacetCounts = function (images) {
    var facets = {
        categories: new Map(),
        tags: new Map(),
        approvalStatus: new Map(),
        users: new Map(),
        collections: new Map(),
    };
    images.forEach(function (img) {
        var _a, _b, _c;
        if (img.category) {
            var count = facets.categories.get(img.category) || 0;
            facets.categories.set(img.category, count + 1);
        }
        if ((0, utils_1.isAdvancedImage)(img)) {
            if (img.approvalStatus) {
                var count = facets.approvalStatus.get(img.approvalStatus) || 0;
                facets.approvalStatus.set(img.approvalStatus, count + 1);
            }
            (_a = img.tags) === null || _a === void 0 ? void 0 : _a.forEach(function (tag) {
                var count = facets.tags.get(tag) || 0;
                facets.tags.set(tag, count + 1);
            });
            (_b = img.assignedTo) === null || _b === void 0 ? void 0 : _b.forEach(function (user) {
                var count = facets.users.get(user) || 0;
                facets.users.set(user, count + 1);
            });
            (_c = img.collections) === null || _c === void 0 ? void 0 : _c.forEach(function (collection) {
                var count = facets.collections.get(collection) || 0;
                facets.collections.set(collection, count + 1);
            });
        }
    });
    return facets;
};
var useImageSearch = function (images, query, selectedFacets, sortMode, sortAscending) {
    return (0, react_1.useMemo)(function () {
        var filtered = images;
        // Apply text search
        if (query.trim()) {
            filtered = filtered.filter(function (img) { return (0, utils_1.matchesTextQuery)(img, query); });
        }
        // Apply facet filters
        Object.entries(selectedFacets).forEach(function (_a) {
            var facetType = _a[0], values = _a[1];
            if (values.length > 0) {
                filtered = filtered.filter(function (img) {
                    return matchesFacetFilter(img, facetType, values);
                });
            }
        });
        // Apply sorting
        filtered = (0, utils_1.sortImages)(filtered, sortMode, sortAscending);
        // Build facet counts from all images (not just filtered)
        var facets = buildFacetCounts(images);
        return {
            filtered: filtered,
            facets: facets,
            total: filtered.length,
        };
    }, [images, query, selectedFacets, sortMode, sortAscending]);
};
exports.useImageSearch = useImageSearch;
