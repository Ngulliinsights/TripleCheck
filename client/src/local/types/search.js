"use strict";
/**
 * Unified Search Types
 * Consolidates all search-related interfaces to eliminate redundancies
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
exports.searchKeys = void 0;
// Search query keys for React Query
exports.searchKeys = {
    all: ['search'],
    results: function (filters, options) {
        return __spreadArray(__spreadArray([], exports.searchKeys.all, true), ['results', filters, options], false);
    },
    suggestions: function (query) {
        return __spreadArray(__spreadArray([], exports.searchKeys.all, true), ['suggestions', query], false);
    },
    locations: function (query) {
        return __spreadArray(__spreadArray([], exports.searchKeys.all, true), ['locations', query], false);
    },
    popular: function () {
        return __spreadArray(__spreadArray([], exports.searchKeys.all, true), ['popular'], false);
    },
    facets: function (filters) {
        return __spreadArray(__spreadArray([], exports.searchKeys.all, true), ['facets', filters], false);
    },
};
