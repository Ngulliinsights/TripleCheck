"use strict";
/**
 * Search Module Index
 * Consolidated exports for the search functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.useSearch = exports.SearchFilters = exports.SearchBar = exports.SearchResults = exports.ConsolidatedSearch = void 0;
// Components
var ConsolidatedSearch_1 = require("./components/ConsolidatedSearch");
Object.defineProperty(exports, "ConsolidatedSearch", { enumerable: true, get: function () { return ConsolidatedSearch_1.default; } });
var SearchResults_1 = require("./pages/SearchResults");
Object.defineProperty(exports, "SearchResults", { enumerable: true, get: function () { return SearchResults_1.default; } });
// Legacy components (deprecated)
var SearchBar_1 = require("./components/SearchBar");
Object.defineProperty(exports, "SearchBar", { enumerable: true, get: function () { return SearchBar_1.default; } });
var SearchFilters_1 = require("./components/SearchFilters");
Object.defineProperty(exports, "SearchFilters", { enumerable: true, get: function () { return SearchFilters_1.default; } });
// Hooks
var useSearch_1 = require("./hooks/useSearch");
Object.defineProperty(exports, "useSearch", { enumerable: true, get: function () { return useSearch_1.useSearch; } });
// Services
var SearchService_1 = require("../local/services/SearchService");
Object.defineProperty(exports, "searchService", { enumerable: true, get: function () { return SearchService_1.searchService; } });
/**
 * Recommended Usage:
 *
 * For new implementations:
 * import { ConsolidatedSearch, useSearch } from '@/search'
 *
 * For search results pages:
 * import { SearchResults } from '@/search'
 *
 * For custom search implementations:
 * import { useSearch, searchService } from '@/search'
 * import type { PropertySearchFilters } from '@/search'
 */ 
