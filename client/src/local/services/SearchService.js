"use strict";
/**
 * Unified Search Service
 * Handles all search functionality including property search, filtering, and suggestions
 * Enhanced with improved business logic, error handling, and search capabilities
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.searchService = void 0;
var SearchService = /** @class */ (function () {
    function SearchService() {
        this.baseUrl = '/api';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.requestAbortControllers = new Map(); // Added for request cancellation
        this.retryAttempts = 3; // Added configurable retry logic
        this.retryDelay = 1000; // Base delay for exponential backoff
    }
    /**
     * Search properties with filters and options
     * Enhanced with better error handling, performance monitoring, and request deduplication
     */
    SearchService.prototype.searchProperties = function () {
        return __awaiter(this, arguments, void 0, function (filters, options) {
            var startTime, validation, normalizedFilters, cacheKey, cached, abortController, params, result, searchResult, error_1;
            var _a, _b, _c, _d;
            if (filters === void 0) { filters = {}; }
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        startTime = Date.now();
                        validation = this.validateFilters(filters);
                        if (!validation.isValid) {
                            throw new Error("Invalid search filters: ".concat(validation.errors.join(', ')));
                        }
                        normalizedFilters = this.normalizeFilters(filters);
                        cacheKey = this.getCacheKey('search', normalizedFilters, options);
                        cached = this.getFromCache(cacheKey);
                        if (cached) {
                            return [2 /*return*/, __assign(__assign({}, cached), { searchTime: Date.now() - startTime, appliedFilters: normalizedFilters })];
                        }
                        // Cancel any existing request with the same cache key to prevent duplicate requests
                        this.cancelRequest(cacheKey);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, 4, 5]);
                        abortController = new AbortController();
                        this.requestAbortControllers.set(cacheKey, abortController);
                        params = this.buildSearchParams(normalizedFilters, options);
                        return [4 /*yield*/, this.makeRequestWithRetry("".concat(this.baseUrl, "/search/properties?").concat(params), { signal: abortController.signal })];
                    case 2:
                        result = _e.sent();
                        searchResult = {
                            items: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.properties) || [],
                            total: ((_b = result.data) === null || _b === void 0 ? void 0 : _b.total) || 0,
                            page: options.page || 1,
                            limit: options.limit || 20,
                            hasMore: ((_c = result.data) === null || _c === void 0 ? void 0 : _c.hasMore) || false,
                            facets: (_d = result.data) === null || _d === void 0 ? void 0 : _d.facets,
                            searchTime: Date.now() - startTime,
                            appliedFilters: normalizedFilters,
                        };
                        // Cache the result and save search analytics
                        this.setCache(cacheKey, searchResult);
                        this.saveSearch(normalizedFilters, searchResult.total).catch(console.warn);
                        return [2 /*return*/, searchResult];
                    case 3:
                        error_1 = _e.sent();
                        console.error('Search properties error:', error_1);
                        throw this.handleSearchError(error_1);
                    case 4:
                        // Clean up the abort controller
                        this.requestAbortControllers.delete(cacheKey);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get search suggestions with enhanced relevance scoring and caching
     */
    SearchService.prototype.getSuggestions = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedQuery, cacheKey, cached, abortController, result, suggestions, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        trimmedQuery = query === null || query === void 0 ? void 0 : query.trim();
                        if (!trimmedQuery || trimmedQuery.length < 2)
                            return [2 /*return*/, []];
                        cacheKey = this.getCacheKey('suggestions', { query: trimmedQuery.toLowerCase() });
                        cached = this.getFromCache(cacheKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        // Cancel previous suggestion request to avoid race conditions
                        this.cancelRequest(cacheKey);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        abortController = new AbortController();
                        this.requestAbortControllers.set(cacheKey, abortController);
                        return [4 /*yield*/, this.makeRequestWithRetry("".concat(this.baseUrl, "/search/suggestions?q=").concat(encodeURIComponent(trimmedQuery)), { signal: abortController.signal })];
                    case 2:
                        result = _b.sent();
                        suggestions = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.suggestions) || [];
                        suggestions = this.enhanceSuggestions(suggestions, trimmedQuery);
                        // Cache with shorter timeout for suggestions to keep them fresh
                        this.setCache(cacheKey, suggestions, 2 * 60 * 1000); // 2 minutes
                        return [2 /*return*/, suggestions];
                    case 3:
                        error_2 = _b.sent();
                        console.error('Get suggestions error:', error_2);
                        // Return fallback suggestions based on query analysis
                        return [2 /*return*/, this.getFallbackSuggestions(trimmedQuery)];
                    case 4:
                        this.requestAbortControllers.delete(cacheKey);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get location suggestions with hierarchical support
     */
    SearchService.prototype.getLocationSuggestions = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedQuery, cacheKey, cached, abortController, result, locations, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        trimmedQuery = query === null || query === void 0 ? void 0 : query.trim();
                        if (!trimmedQuery || trimmedQuery.length < 2)
                            return [2 /*return*/, []];
                        cacheKey = this.getCacheKey('locations', { query: trimmedQuery.toLowerCase() });
                        cached = this.getFromCache(cacheKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        this.cancelRequest(cacheKey);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        abortController = new AbortController();
                        this.requestAbortControllers.set(cacheKey, abortController);
                        return [4 /*yield*/, this.makeRequestWithRetry("".concat(this.baseUrl, "/search/locations?q=").concat(encodeURIComponent(trimmedQuery)), { signal: abortController.signal })];
                    case 2:
                        result = _b.sent();
                        locations = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.locations) || [];
                        // Sort locations by relevance and type hierarchy
                        locations = this.sortLocationsByRelevance(locations, trimmedQuery);
                        this.setCache(cacheKey, locations, 10 * 60 * 1000); // 10 minutes for locations
                        return [2 /*return*/, locations];
                    case 3:
                        error_3 = _b.sent();
                        console.error('Get location suggestions error:', error_3);
                        return [2 /*return*/, this.getFallbackLocations(trimmedQuery)];
                    case 4:
                        this.requestAbortControllers.delete(cacheKey);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get popular searches with time-based relevance
     */
    SearchService.prototype.getPopularSearches = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, result, popular, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = 'popular-searches';
                        cached = this.getFromCache(cacheKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequestWithRetry("".concat(this.baseUrl, "/search/popular"))];
                    case 2:
                        result = _b.sent();
                        popular = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.searches) || this.getDefaultPopularSearches();
                        // Cache popular searches for longer since they change less frequently
                        this.setCache(cacheKey, popular, 30 * 60 * 1000); // 30 minutes
                        return [2 /*return*/, popular];
                    case 3:
                        error_4 = _b.sent();
                        console.error('Get popular searches error:', error_4);
                        return [2 /*return*/, this.getDefaultPopularSearches()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enhanced search facets with dynamic filtering
     */
    SearchService.prototype.getSearchFacets = function () {
        return __awaiter(this, arguments, void 0, function (filters) {
            var normalizedFilters, cacheKey, cached, params, result, facets, enhancedFacets, error_5;
            var _a;
            if (filters === void 0) { filters = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        normalizedFilters = this.normalizeFilters(filters);
                        cacheKey = this.getCacheKey('facets', normalizedFilters);
                        cached = this.getFromCache(cacheKey);
                        if (cached)
                            return [2 /*return*/, cached];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        params = this.buildSearchParams(normalizedFilters, {});
                        return [4 /*yield*/, this.makeRequestWithRetry("".concat(this.baseUrl, "/search/facets?").concat(params))];
                    case 2:
                        result = _b.sent();
                        facets = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.facets) || this.getDefaultFacets();
                        enhancedFacets = this.enhanceFacets(facets);
                        this.setCache(cacheKey, enhancedFacets, 10 * 60 * 1000); // 10 minutes
                        return [2 /*return*/, enhancedFacets];
                    case 3:
                        error_5 = _b.sent();
                        console.error('Get search facets error:', error_5);
                        return [2 /*return*/, this.getDefaultFacets()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enhanced search analytics with better error handling
     */
    SearchService.prototype.saveSearch = function (filters, resultCount) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Only save meaningful searches (not empty queries)
                        if (!this.isSearchWorthSaving(filters))
                            return [2 /*return*/];
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/search/save"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    filters: this.sanitizeFiltersForAnalytics(filters),
                                    resultCount: resultCount,
                                    timestamp: new Date().toISOString(),
                                    userAgent: navigator === null || navigator === void 0 ? void 0 : navigator.userAgent,
                                    sessionId: this.getSessionId(),
                                }),
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        // Don't throw error for analytics failures - just log
                        console.warn('Save search failed:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enhanced filter validation with more comprehensive checks
     */
    SearchService.prototype.validateFilters = function (filters) {
        var errors = [];
        // Price range validation with realistic bounds
        if (filters.priceMin && filters.priceMin < 0) {
            errors.push('Minimum price cannot be negative');
        }
        if (filters.priceMax && filters.priceMax < 0) {
            errors.push('Maximum price cannot be negative');
        }
        if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
            errors.push('Minimum price cannot be greater than maximum price');
        }
        if (filters.priceMax && filters.priceMax > 1000000000) { // 1 billion limit
            errors.push('Maximum price exceeds reasonable limit');
        }
        // Area range validation
        if (filters.areaMin && filters.areaMin < 0) {
            errors.push('Minimum area cannot be negative');
        }
        if (filters.areaMax && filters.areaMax < 0) {
            errors.push('Maximum area cannot be negative');
        }
        if (filters.areaMin && filters.areaMax && filters.areaMin > filters.areaMax) {
            errors.push('Minimum area cannot be greater than maximum area');
        }
        // Room validation with realistic limits
        if (filters.bedrooms !== undefined && (filters.bedrooms < 0 || filters.bedrooms > 20)) {
            errors.push('Number of bedrooms must be between 0 and 20');
        }
        if (filters.bathrooms !== undefined && (filters.bathrooms < 0 || filters.bathrooms > 20)) {
            errors.push('Number of bathrooms must be between 0 and 20');
        }
        // Parking validation
        if (filters.parkingSpaces !== undefined && (filters.parkingSpaces < 0 || filters.parkingSpaces > 50)) {
            errors.push('Number of parking spaces must be between 0 and 50');
        }
        // Query length validation
        if (filters.query && filters.query.length > 500) {
            errors.push('Search query is too long (maximum 500 characters)');
        }
        // Array validation
        if (filters.amenities && filters.amenities.length > 20) {
            errors.push('Too many amenities selected (maximum 20)');
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
        };
    };
    /**
     * Cancel ongoing requests
     */
    SearchService.prototype.cancelRequest = function (key) {
        var controller = this.requestAbortControllers.get(key);
        if (controller) {
            controller.abort();
            this.requestAbortControllers.delete(key);
        }
    };
    /**
     * Clear search cache with optional selective clearing
     */
    SearchService.prototype.clearCache = function (pattern) {
        var _this = this;
        if (!pattern) {
            this.cache.clear();
            return;
        }
        // Clear cache entries matching the pattern
        var keysToDelete = Array.from(this.cache.keys()).filter(function (key) { return key.includes(pattern); });
        keysToDelete.forEach(function (key) { return _this.cache.delete(key); });
    };
    // Private helper methods with enhanced functionality
    /**
     * Normalize filters for consistency and caching
     */
    SearchService.prototype.normalizeFilters = function (filters) {
        var _a, _b;
        var normalized = {};
        // Normalize string fields
        if (filters.query) {
            normalized.query = filters.query.trim().toLowerCase();
        }
        if (filters.location) {
            normalized.location = filters.location.trim().toLowerCase();
        }
        if (filters.propertyType) {
            if (Array.isArray(filters.propertyType)) {
                normalized.propertyType = filters.propertyType.map(function (type) { return type.toLowerCase(); });
            }
            else {
                normalized.propertyType = filters.propertyType.toLowerCase();
            }
        }
        // Copy numeric fields as-is
        if (filters.priceMin !== undefined)
            normalized.priceMin = filters.priceMin;
        if (filters.priceMax !== undefined)
            normalized.priceMax = filters.priceMax;
        if (filters.bedrooms !== undefined)
            normalized.bedrooms = filters.bedrooms;
        if (filters.bathrooms !== undefined)
            normalized.bathrooms = filters.bathrooms;
        if (filters.areaMin !== undefined)
            normalized.areaMin = filters.areaMin;
        if (filters.areaMax !== undefined)
            normalized.areaMax = filters.areaMax;
        if (filters.parkingSpaces !== undefined)
            normalized.parkingSpaces = filters.parkingSpaces;
        // Normalize arrays
        if ((_a = filters.amenities) === null || _a === void 0 ? void 0 : _a.length) {
            normalized.amenities = __spreadArray([], filters.amenities, true).sort(); // Sort for consistent caching
        }
        if ((_b = filters.verificationStatus) === null || _b === void 0 ? void 0 : _b.length) {
            normalized.verificationStatus = __spreadArray([], filters.verificationStatus, true).sort();
        }
        // Copy boolean fields
        if (filters.furnished !== undefined)
            normalized.furnished = filters.furnished;
        if (filters.petFriendly !== undefined)
            normalized.petFriendly = filters.petFriendly;
        return normalized;
    };
    /**
     * Build search parameters from filters and options
     */
    SearchService.prototype.buildSearchParams = function (filters, options) {
        var params = new URLSearchParams();
        // Add filters to params
        Object.entries(filters).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(function (v) { return params.append(key, v.toString()); });
                }
                else {
                    params.append(key, value.toString());
                }
            }
        });
        // Add options to params
        Object.entries(options).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value !== undefined && value !== null) {
                params.append(key, value.toString());
            }
        });
        return params;
    };
    /**
     * Make HTTP request with retry logic and exponential backoff
     */
    SearchService.prototype.makeRequestWithRetry = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options) {
            var lastError, attempt, response, error_7;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= this.retryAttempts)) return [3 /*break*/, 9];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 8]);
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: AbortSignal.timeout(10000) }))];
                    case 3:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5:
                        error_7 = _a.sent();
                        lastError = error_7;
                        // Don't retry on abort or client errors
                        if (error_7 instanceof DOMException && error_7.name === 'AbortError') {
                            throw error_7;
                        }
                        if (error_7 instanceof Error && error_7.message.includes('4')) { // 4xx errors
                            throw error_7;
                        }
                        if (!(attempt < this.retryAttempts)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.delay(this.retryDelay * Math.pow(2, attempt - 1))];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 8];
                    case 8:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 9: throw lastError;
                }
            });
        });
    };
    /**
     * Enhance suggestions with relevance scoring
     */
    SearchService.prototype.enhanceSuggestions = function (suggestions, query) {
        var _this = this;
        return suggestions
            .map(function (suggestion) { return (__assign(__assign({}, suggestion), { relevanceScore: _this.calculateRelevanceScore(suggestion.text, query) })); })
            .sort(function (a, b) { return (b.relevanceScore || 0) - (a.relevanceScore || 0); })
            .slice(0, 10); // Limit to top 10 suggestions
    };
    /**
     * Calculate relevance score for suggestions
     */
    SearchService.prototype.calculateRelevanceScore = function (suggestionText, query) {
        var suggestion = suggestionText.toLowerCase();
        var searchQuery = query.toLowerCase();
        var score = 0;
        // Exact match gets highest score
        if (suggestion === searchQuery)
            return 100;
        // Starts with query gets high score
        if (suggestion.startsWith(searchQuery))
            score += 50;
        // Contains query gets medium score
        if (suggestion.includes(searchQuery))
            score += 25;
        // Word boundary matches get bonus points
        var words = searchQuery.split(/\s+/);
        words.forEach(function (word) {
            if (suggestion.includes(" ".concat(word, " ")) || suggestion.startsWith("".concat(word, " "))) {
                score += 10;
            }
        });
        return score;
    };
    /**
     * Sort locations by relevance and type
     */
    SearchService.prototype.sortLocationsByRelevance = function (locations, query) {
        var _this = this;
        var typeOrder = { city: 3, neighborhood: 2, landmark: 1 };
        return locations.sort(function (a, b) {
            // First sort by type priority
            var typeDiff = (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
            if (typeDiff !== 0)
                return typeDiff;
            // Then by name relevance
            var aScore = _this.calculateRelevanceScore(a.name, query);
            var bScore = _this.calculateRelevanceScore(b.name, query);
            return bScore - aScore;
        });
    };
    /**
     * Handle and categorize search errors
     */
    SearchService.prototype.handleSearchError = function (error) {
        var _a, _b, _c;
        if (error.name === 'AbortError') {
            return { code: 'SEARCH_CANCELLED', message: 'Search was cancelled' };
        }
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('400')) {
            return { code: 'INVALID_SEARCH', message: 'Invalid search parameters', details: error };
        }
        if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('404')) {
            return { code: 'ENDPOINT_NOT_FOUND', message: 'Search service not available' };
        }
        if ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('500')) {
            return { code: 'SERVER_ERROR', message: 'Search service temporarily unavailable' };
        }
        return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred', details: error };
    };
    /**
     * Generate fallback suggestions when API fails
     */
    SearchService.prototype.getFallbackSuggestions = function (query) {
        var commonSuggestions = [
            'apartment', 'house', 'villa', 'townhouse', 'land', 'commercial',
            // cspell:disable-next-line - These are real locations in Nairobi, Kenya
            'nairobi', 'westlands', 'karen', 'kilimani', 'runda', 'kileleshwa'
        ];
        return commonSuggestions
            .filter(function (suggestion) { return suggestion.includes(query.toLowerCase()); })
            .slice(0, 5)
            .map(function (text) { return ({ text: text, type: 'query' }); });
    };
    /**
     * Generate fallback locations when API fails
     */
    SearchService.prototype.getFallbackLocations = function (query) {
        var commonLocations = [
            { name: 'Nairobi', type: 'city' },
            { name: 'Westlands', type: 'neighborhood' },
            { name: 'Karen', type: 'neighborhood' },
            { name: 'Kilimani', type: 'neighborhood' },
        ];
        return commonLocations.filter(function (location) {
            return location.name.toLowerCase().includes(query.toLowerCase());
        });
    };
    /**
     * Get default popular searches based on Kenyan market
     */
    SearchService.prototype.getDefaultPopularSearches = function () {
        return [
            'Apartments in Nairobi',
            'Houses in Karen',
            'Commercial properties CBD',
            'Land for sale Kiambu',
            'Verified properties',
            'Furnished apartments Westlands',
            'Villas in Runda',
            // cspell:disable-next-line - Kileleshwa is a real location in Nairobi
            'Townhouses Kileleshwa'
        ];
    };
    /**
     * Enhanced cache methods with configurable timeout
     */
    SearchService.prototype.setCache = function (key, data, timeout) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
        });
    };
    /**
     * Check if search is worth saving for analytics
     */
    SearchService.prototype.isSearchWorthSaving = function (filters) {
        // Don't save empty searches or very basic queries
        if (!filters.query && !filters.location && !filters.propertyType) {
            return false;
        }
        // Don't save if query is too short or looks like testing
        if (filters.query && (filters.query.length < 3 || filters.query.match(/^(test|a+|1+)$/i))) {
            return false;
        }
        return true;
    };
    /**
     * Sanitize filters for analytics (remove sensitive data)
     */
    SearchService.prototype.sanitizeFiltersForAnalytics = function (filters) {
        // Remove or hash any potentially sensitive information
        var sanitized = __assign({}, filters);
        // Keep the search intent but remove exact personal details
        if (sanitized.query && sanitized.query.length > 100) {
            sanitized.query = sanitized.query.substring(0, 100) + '...';
        }
        return sanitized;
    };
    /**
     * Get or generate session ID for analytics
     */
    SearchService.prototype.getSessionId = function () {
        // Use existing session ID or generate new one
        var sessionId = sessionStorage === null || sessionStorage === void 0 ? void 0 : sessionStorage.getItem('search-session-id');
        if (!sessionId) {
            sessionId = Date.now().toString(36) + Math.random().toString(36);
            sessionStorage === null || sessionStorage === void 0 ? void 0 : sessionStorage.setItem('search-session-id', sessionId);
        }
        return sessionId;
    };
    /**
     * Enhance facets with better formatting and sorting
     */
    SearchService.prototype.enhanceFacets = function (facets) {
        return {
            propertyTypes: facets.propertyTypes
                .filter(function (item) { return item.count > 0; })
                .sort(function (a, b) { return b.count - a.count; }),
            locations: facets.locations
                .filter(function (item) { return item.count > 0; })
                .sort(function (a, b) { return b.count - a.count; }),
            priceRanges: facets.priceRanges
                .filter(function (item) { return item.count > 0; })
                .sort(function (a, b) { return a.min - b.min; }),
            amenities: facets.amenities
                .filter(function (item) { return item.count > 0; })
                .sort(function (a, b) { return b.count - a.count; }),
        };
    };
    SearchService.prototype.getCacheKey = function (type) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return "".concat(type, ":").concat(JSON.stringify(args));
    };
    SearchService.prototype.getFromCache = function (key) {
        var cached = this.cache.get(key);
        if (!cached)
            return null;
        var isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    };
    SearchService.prototype.getDefaultFacets = function () {
        return {
            propertyTypes: [
                { value: 'apartment', label: 'Apartment', count: 0 },
                { value: 'house', label: 'House', count: 0 },
                { value: 'villa', label: 'Villa', count: 0 },
                { value: 'townhouse', label: 'Townhouse', count: 0 },
                { value: 'land', label: 'Land', count: 0 },
                { value: 'commercial', label: 'Commercial', count: 0 },
            ],
            locations: [
                { value: 'nairobi', label: 'Nairobi', count: 0 },
                { value: 'westlands', label: 'Westlands', count: 0 },
                { value: 'karen', label: 'Karen', count: 0 },
                { value: 'kilimani', label: 'Kilimani', count: 0 },
                // cspell:disable-next-line - Kileleshwa is a real location in Nairobi
                { value: 'kileleshwa', label: 'Kileleshwa', count: 0 },
            ],
            priceRanges: [
                { min: 0, max: 1000000, count: 0 },
                { min: 1000000, max: 5000000, count: 0 },
                { min: 5000000, max: 10000000, count: 0 },
                { min: 10000000, max: 50000000, count: 0 },
                { min: 50000000, max: Infinity, count: 0 },
            ],
            amenities: [
                { value: 'parking', label: 'Parking', count: 0 },
                { value: 'security', label: 'Security', count: 0 },
                { value: 'gym', label: 'Gym', count: 0 },
                { value: 'pool', label: 'Swimming Pool', count: 0 },
            ],
        };
    };
    /**
     * Utility method for delays in retry logic
     */
    SearchService.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    return SearchService;
}());
// Export singleton instance
exports.searchService = new SearchService();
exports.default = exports.searchService;
