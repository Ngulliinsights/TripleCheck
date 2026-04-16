"use strict";
/**
 * Search Components Barrel Export
 *
 * Search-related UI components
 *
 * This file provides a centralized export point for all
 * search components to improve import organization.
 *
 * Usage:
 * import { ComponentName } from '@search/components'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchFilters = exports.SearchBar = exports.ConsolidatedSearch = void 0;
// Standard exports
var ConsolidatedSearch_1 = require("./ConsolidatedSearch");
Object.defineProperty(exports, "ConsolidatedSearch", { enumerable: true, get: function () { return ConsolidatedSearch_1.default; } });
var SearchBar_1 = require("./SearchBar");
Object.defineProperty(exports, "SearchBar", { enumerable: true, get: function () { return SearchBar_1.default; } });
var SearchFilters_1 = require("./SearchFilters");
Object.defineProperty(exports, "SearchFilters", { enumerable: true, get: function () { return SearchFilters_1.default; } });
