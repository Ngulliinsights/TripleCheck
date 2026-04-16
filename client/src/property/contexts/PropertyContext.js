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
exports.usePropertyCompareState = exports.usePropertyCompareAnalysis = exports.usePropertyCompareActions = exports.usePropertyCompare = exports.useFavorites = exports.usePropertyFilters = exports.usePropertyActions = exports.usePropertyState = exports.usePropertyContext = exports.PropertyProvider = void 0;
var react_1 = require("react");
var compare_utils_1 = require("../../local/utils/compare-utils");
var useCompareError_1 = require("../../local/hooks/useCompareError");
// ─── Constants & Helpers ─────────────────────────────────────────────────────
var FAVORITES_STORAGE_KEY = 'propertyFavorites';
var COMPARE_STORAGE_KEY = 'propertyCompare';
var DEFAULT_FILTERS = {};
var DEFAULT_MAX_COMPARE_ITEMS = 3;
var loadFromStorage = function (key, defaultValue) {
    try {
        var saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    }
    catch (_a) {
        console.warn("Failed to load ".concat(key, " from localStorage."));
        return defaultValue;
    }
};
var saveToStorage = function (key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    }
    catch (_a) {
        console.warn("Failed to save ".concat(key, " to localStorage."));
    }
};
var getPropertyId = function (property) {
    return String(property.id);
};
var matchesFilter = function (property, filters) {
    var _a, _b;
    if (filters.query) {
        var query = filters.query.toLowerCase();
        var searchable = "".concat(property.title, " ").concat(property.location).toLowerCase();
        if (!searchable.includes(query))
            return false;
    }
    if (filters.location) {
        var location_1 = typeof property.location === 'string'
            ? property.location
            : (_b = (_a = property.location) === null || _a === void 0 ? void 0 : _a.address) !== null && _b !== void 0 ? _b : '';
        if (!location_1.toLowerCase().includes(filters.location.toLowerCase()))
            return false;
    }
    if (filters.priceRange) {
        var price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
        var _c = filters.priceRange, min = _c.min, max = _c.max;
        if (price < min || price > max)
            return false;
    }
    if (filters.propertyType && property.type !== filters.propertyType)
        return false;
    if (filters.bedrooms !== undefined && property.bedrooms !== filters.bedrooms)
        return false;
    if (filters.bathrooms !== undefined && property.bathrooms !== filters.bathrooms)
        return false;
    if (filters.verified !== undefined) {
        if ((property.verificationStatus === 'verified') !== filters.verified)
            return false;
    }
    return true;
};
/** Extracts numeric prices from a compare list, filtering out invalid values. */
var extractPrices = function (compareList) {
    return compareList
        .map(function (p) { return p.price; })
        .filter(function (price) { return typeof price === 'number' && !isNaN(price); });
};
// ─── Reducer ─────────────────────────────────────────────────────────────────
var initialState = {
    properties: [],
    selectedProperty: null,
    favorites: loadFromStorage(FAVORITES_STORAGE_KEY, []),
    isLoading: false,
    error: null,
    searchFilters: DEFAULT_FILTERS,
    compareList: loadFromStorage(COMPARE_STORAGE_KEY, []),
    maxCompareItems: DEFAULT_MAX_COMPARE_ITEMS,
};
var propertyReducer = function (state, action) {
    switch (action.type) {
        case 'SET_PROPERTIES':
            return __assign(__assign({}, state), { properties: action.payload, isLoading: false, error: null });
        case 'SET_SELECTED_PROPERTY':
            return __assign(__assign({}, state), { selectedProperty: action.payload });
        case 'ADD_TO_FAVORITES': {
            if (state.favorites.includes(action.payload))
                return state;
            var newFavorites = __spreadArray(__spreadArray([], state.favorites, true), [action.payload], false);
            saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
            return __assign(__assign({}, state), { favorites: newFavorites });
        }
        case 'REMOVE_FROM_FAVORITES': {
            var newFavorites = state.favorites.filter(function (id) { return id !== action.payload; });
            saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
            return __assign(__assign({}, state), { favorites: newFavorites });
        }
        case 'SET_SEARCH_FILTERS':
            return __assign(__assign({}, state), { searchFilters: action.payload });
        case 'UPDATE_SEARCH_FILTERS':
            return __assign(__assign({}, state), { searchFilters: __assign(__assign({}, state.searchFilters), action.payload) });
        case 'CLEAR_SEARCH_FILTERS':
            return __assign(__assign({}, state), { searchFilters: DEFAULT_FILTERS });
        case 'SET_LOADING':
            return __assign(__assign({}, state), { isLoading: action.payload });
        case 'SET_ERROR':
            return __assign(__assign({}, state), { error: action.payload, isLoading: false });
        case 'CLEAR_ERROR':
            return __assign(__assign({}, state), { error: null });
        case 'ADD_TO_COMPARE': {
            var normalized = (0, compare_utils_1.normalizePropertyForComparison)(action.payload);
            if (!normalized)
                return state;
            var id_1 = getPropertyId(normalized);
            if (state.compareList.some(function (p) { return getPropertyId(p) === id_1; }) ||
                state.compareList.length >= state.maxCompareItems) {
                return state;
            }
            var newList = __spreadArray(__spreadArray([], state.compareList, true), [normalized], false);
            saveToStorage(COMPARE_STORAGE_KEY, newList);
            return __assign(__assign({}, state), { compareList: newList });
        }
        case 'REMOVE_FROM_COMPARE': {
            var newList = state.compareList.filter(function (p) { return getPropertyId(p) !== action.payload; });
            saveToStorage(COMPARE_STORAGE_KEY, newList);
            return __assign(__assign({}, state), { compareList: newList });
        }
        case 'CLEAR_COMPARE':
            saveToStorage(COMPARE_STORAGE_KEY, []);
            return __assign(__assign({}, state), { compareList: [] });
        case 'REPLACE_IN_COMPARE': {
            var _a = action.payload, oldPropertyId_1 = _a.oldPropertyId, newProperty = _a.newProperty;
            var normalized_1 = (0, compare_utils_1.normalizePropertyForComparison)(newProperty);
            if (!normalized_1)
                return state;
            var newList = state.compareList.map(function (p) {
                return getPropertyId(p) === oldPropertyId_1 ? normalized_1 : p;
            });
            saveToStorage(COMPARE_STORAGE_KEY, newList);
            return __assign(__assign({}, state), { compareList: newList });
        }
        case 'REORDER_COMPARE': {
            var _b = action.payload, fromIndex = _b.fromIndex, toIndex = _b.toIndex;
            var len = state.compareList.length;
            if (fromIndex === toIndex ||
                fromIndex < 0 || fromIndex >= len ||
                toIndex < 0 || toIndex >= len) {
                return state;
            }
            var newList = __spreadArray([], state.compareList, true);
            var moved = newList.splice(fromIndex, 1)[0];
            if (moved)
                newList.splice(toIndex, 0, moved);
            saveToStorage(COMPARE_STORAGE_KEY, newList);
            return __assign(__assign({}, state), { compareList: newList });
        }
        case 'SET_COMPARE_LIST': {
            var normalized = action.payload
                .map(compare_utils_1.normalizePropertyForComparison)
                .filter(function (p) { return p !== null; })
                .slice(0, state.maxCompareItems);
            saveToStorage(COMPARE_STORAGE_KEY, normalized);
            return __assign(__assign({}, state), { compareList: normalized });
        }
        default:
            return state;
    }
};
// ─── Context & Provider ──────────────────────────────────────────────────────
var PropertyContext = (0, react_1.createContext)(undefined);
var PropertyProvider = function (_a) {
    var children = _a.children, _b = _a.maxCompareItems, maxCompareItems = _b === void 0 ? DEFAULT_MAX_COMPARE_ITEMS : _b;
    var _c = (0, react_1.useReducer)(propertyReducer, __assign(__assign({}, initialState), { maxCompareItems: maxCompareItems })), state = _c[0], dispatch = _c[1];
    var handleError = (0, useCompareError_1.useCompareError)().handleError;
    // ── Core actions ────────────────────────────────────────────────────────────
    var setProperties = (0, react_1.useCallback)(function (properties) {
        dispatch({ type: 'SET_PROPERTIES', payload: properties });
    }, []);
    var setSelectedProperty = (0, react_1.useCallback)(function (property) {
        dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property });
    }, []);
    var addToFavorites = (0, react_1.useCallback)(function (propertyId) {
        dispatch({ type: 'ADD_TO_FAVORITES', payload: propertyId });
    }, []);
    var removeFromFavorites = (0, react_1.useCallback)(function (propertyId) {
        dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: propertyId });
    }, []);
    var toggleFavorite = (0, react_1.useCallback)(function (propertyId) {
        dispatch({
            type: state.favorites.includes(propertyId) ? 'REMOVE_FROM_FAVORITES' : 'ADD_TO_FAVORITES',
            payload: propertyId,
        });
    }, [state.favorites]);
    var setSearchFilters = (0, react_1.useCallback)(function (filters) {
        dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters });
    }, []);
    var updateSearchFilters = (0, react_1.useCallback)(function (filters) {
        dispatch({ type: 'UPDATE_SEARCH_FILTERS', payload: filters });
    }, []);
    var clearSearchFilters = (0, react_1.useCallback)(function () {
        dispatch({ type: 'CLEAR_SEARCH_FILTERS' });
    }, []);
    var setLoading = (0, react_1.useCallback)(function (loading) {
        dispatch({ type: 'SET_LOADING', payload: loading });
    }, []);
    var setError = (0, react_1.useCallback)(function (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
    }, []);
    var clearError = (0, react_1.useCallback)(function () {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);
    // ── Comparison actions ──────────────────────────────────────────────────────
    var addToCompare = (0, react_1.useCallback)(function (property) {
        try {
            dispatch({ type: 'ADD_TO_COMPARE', payload: property });
        }
        catch (error) {
            handleError(error, 'addToCompare');
        }
    }, [handleError]);
    var removeFromCompare = (0, react_1.useCallback)(function (propertyId) {
        dispatch({ type: 'REMOVE_FROM_COMPARE', payload: propertyId });
    }, []);
    var clearCompare = (0, react_1.useCallback)(function () {
        dispatch({ type: 'CLEAR_COMPARE' });
    }, []);
    var toggleCompare = (0, react_1.useCallback)(function (property) {
        try {
            var normalized = (0, compare_utils_1.normalizePropertyForComparison)(property);
            if (!normalized) {
                handleError('Invalid property data', 'toggleCompare');
                return;
            }
            var id_2 = getPropertyId(normalized);
            if (state.compareList.some(function (p) { return getPropertyId(p) === id_2; })) {
                dispatch({ type: 'REMOVE_FROM_COMPARE', payload: id_2 });
            }
            else {
                dispatch({ type: 'ADD_TO_COMPARE', payload: normalized });
            }
        }
        catch (error) {
            handleError(error, 'toggleCompare');
        }
    }, [state.compareList, handleError]);
    var isInCompare = (0, react_1.useCallback)(function (propertyId) {
        return state.compareList.some(function (p) { return getPropertyId(p) === propertyId; });
    }, [state.compareList]);
    var replaceInCompare = (0, react_1.useCallback)(function (oldPropertyId, newProperty) {
        try {
            dispatch({ type: 'REPLACE_IN_COMPARE', payload: { oldPropertyId: oldPropertyId, newProperty: newProperty } });
        }
        catch (error) {
            handleError(error, 'replaceInCompare');
        }
    }, [handleError]);
    var reorderCompare = (0, react_1.useCallback)(function (fromIndex, toIndex) {
        dispatch({ type: 'REORDER_COMPARE', payload: { fromIndex: fromIndex, toIndex: toIndex } });
    }, []);
    var addMultipleToCompare = (0, react_1.useCallback)(function (properties) {
        try {
            var normalized = properties
                .map(compare_utils_1.normalizePropertyForComparison)
                .filter(function (p) { return p !== null; });
            var availableSlots = state.maxCompareItems - state.compareList.length;
            var toAdd = normalized
                .filter(function (p) { return !state.compareList.some(function (ex) { return getPropertyId(ex) === getPropertyId(p); }); })
                .slice(0, availableSlots);
            if (toAdd.length > 0) {
                dispatch({ type: 'SET_COMPARE_LIST', payload: __spreadArray(__spreadArray([], state.compareList, true), toAdd, true) });
            }
        }
        catch (error) {
            handleError(error, 'addMultipleToCompare');
        }
    }, [state.compareList, state.maxCompareItems, handleError]);
    var removeMultipleFromCompare = (0, react_1.useCallback)(function (propertyIds) {
        var updated = state.compareList.filter(function (p) { return !propertyIds.includes(getPropertyId(p)); });
        dispatch({ type: 'SET_COMPARE_LIST', payload: updated });
    }, [state.compareList]);
    // ── Comparison utilities ────────────────────────────────────────────────────
    var getCommonFeatures = (0, react_1.useCallback)(function () {
        if (state.compareList.length === 0)
            return [];
        var _a = state.compareList.map(function (p) { return Object.keys(p); }), first = _a[0], rest = _a.slice(1);
        return (first !== null && first !== void 0 ? first : []).filter(function (key) { return rest.every(function (keys) { return keys.includes(key); }); });
    }, [state.compareList]);
    var getDifferentFeatures = (0, react_1.useCallback)(function () {
        if (state.compareList.length === 0)
            return [];
        var common = new Set(getCommonFeatures());
        var different = new Set();
        state.compareList.forEach(function (p) {
            Object.keys(p).forEach(function (key) {
                if (!common.has(key))
                    different.add(key);
            });
        });
        return Array.from(different);
    }, [state.compareList, getCommonFeatures]);
    var getPropertyComparison = (0, react_1.useCallback)(function () {
        if (state.compareList.length === 0)
            return [];
        var commonFeatures = getCommonFeatures();
        return commonFeatures.map(function (feature) {
            var values = state.compareList.map(function (property) {
                var _a;
                return ({
                    propertyId: getPropertyId(property),
                    value: property[feature],
                    propertyName: (_a = property.title) !== null && _a !== void 0 ? _a : "Property ".concat(property.id),
                });
            });
            var uniqueValues = __spreadArray([], new Set(values.map(function (v) { return v.value; })), true);
            return { feature: feature, values: values, allSame: uniqueValues.length === 1, uniqueValues: uniqueValues };
        });
    }, [state.compareList, getCommonFeatures]);
    var getComparePriceRange = (0, react_1.useCallback)(function () {
        var prices = extractPrices(state.compareList);
        if (prices.length === 0)
            return null;
        var min = Math.min.apply(Math, prices);
        var max = Math.max.apply(Math, prices);
        var average = prices.reduce(function (sum, p) { return sum + p; }, 0) / prices.length;
        return { min: min, max: max, average: average };
    }, [state.compareList]);
    var getCompareStats = (0, react_1.useCallback)(function () {
        var _a, _b;
        if (state.compareList.length === 0) {
            return {
                totalProperties: 0,
                averagePrice: 0,
                priceRange: { min: 0, max: 0 },
                commonFeatures: 0,
                uniqueFeatures: 0,
                mostExpensive: null,
                leastExpensive: null,
            };
        }
        var prices = extractPrices(state.compareList);
        var min = prices.length > 0 ? Math.min.apply(Math, prices) : 0;
        var max = prices.length > 0 ? Math.max.apply(Math, prices) : 0;
        var average = prices.length > 0 ? prices.reduce(function (s, p) { return s + p; }, 0) / prices.length : 0;
        return {
            totalProperties: state.compareList.length,
            averagePrice: average,
            priceRange: { min: min, max: max },
            commonFeatures: getCommonFeatures().length,
            uniqueFeatures: getDifferentFeatures().length,
            mostExpensive: (_a = state.compareList.find(function (p) { return p.price === max; })) !== null && _a !== void 0 ? _a : null,
            leastExpensive: (_b = state.compareList.find(function (p) { return p.price === min; })) !== null && _b !== void 0 ? _b : null,
        };
    }, [state.compareList, getCommonFeatures, getDifferentFeatures]);
    // ── Comparison persistence ──────────────────────────────────────────────────
    var exportComparison = (0, react_1.useCallback)(function () {
        return JSON.stringify({
            properties: state.compareList,
            timestamp: new Date().toISOString(),
            version: '1.0',
        });
    }, [state.compareList]);
    var importComparison = (0, react_1.useCallback)(function (data) {
        try {
            var parsed = JSON.parse(data);
            if (!Array.isArray(parsed.properties))
                return false;
            var normalized = parsed.properties
                .map(compare_utils_1.normalizePropertyForComparison)
                .filter(function (p) { return p !== null; });
            if (normalized.length === 0)
                return false;
            dispatch({ type: 'SET_COMPARE_LIST', payload: normalized });
            return true;
        }
        catch (error) {
            handleError(error, 'importComparison');
            return false;
        }
    }, [handleError]);
    var getShareableCompareUrl = (0, react_1.useCallback)(function () {
        var ids = state.compareList.map(getPropertyId).join(',');
        return "".concat(window.location.origin).concat(window.location.pathname, "?compare=").concat(encodeURIComponent(ids));
    }, [state.compareList]);
    // ── Derived state ───────────────────────────────────────────────────────────
    var favoriteProperties = (0, react_1.useMemo)(function () { return state.properties.filter(function (p) { return state.favorites.includes(String(p.id)); }); }, [state.properties, state.favorites]);
    var filteredProperties = (0, react_1.useMemo)(function () { return state.properties.filter(function (p) { return matchesFilter(p, state.searchFilters); }); }, [state.properties, state.searchFilters]);
    var isFavorite = (0, react_1.useCallback)(function (propertyId) { return state.favorites.includes(propertyId); }, [state.favorites]);
    var hasFilters = (0, react_1.useMemo)(function () {
        return Object.entries(state.searchFilters).some(function (_a) {
            var key = _a[0], value = _a[1];
            if (value === undefined || value === null || value === '')
                return false;
            if (key === 'priceRange' && typeof value === 'object') {
                return value.min !== undefined ||
                    value.max !== undefined;
            }
            return true;
        });
    }, [state.searchFilters]);
    var canAddToCompare = state.compareList.length < state.maxCompareItems;
    var compareCount = state.compareList.length;
    var hasComparisons = compareCount > 0;
    var isCompareListFull = compareCount >= state.maxCompareItems;
    var value = (0, react_1.useMemo)(function () { return (__assign(__assign({}, state), { setProperties: setProperties, setSelectedProperty: setSelectedProperty, addToFavorites: addToFavorites, removeFromFavorites: removeFromFavorites, toggleFavorite: toggleFavorite, setSearchFilters: setSearchFilters, updateSearchFilters: updateSearchFilters, clearSearchFilters: clearSearchFilters, setLoading: setLoading, setError: setError, clearError: clearError, addToCompare: addToCompare, removeFromCompare: removeFromCompare, clearCompare: clearCompare, toggleCompare: toggleCompare, isInCompare: isInCompare, canAddToCompare: canAddToCompare, replaceInCompare: replaceInCompare, reorderCompare: reorderCompare, addMultipleToCompare: addMultipleToCompare, removeMultipleFromCompare: removeMultipleFromCompare, getCommonFeatures: getCommonFeatures, getDifferentFeatures: getDifferentFeatures, getPropertyComparison: getPropertyComparison, getCompareStats: getCompareStats, getComparePriceRange: getComparePriceRange, exportComparison: exportComparison, importComparison: importComparison, getShareableCompareUrl: getShareableCompareUrl, favoriteProperties: favoriteProperties, filteredProperties: filteredProperties, isFavorite: isFavorite, hasFilters: hasFilters, totalProperties: state.properties.length, favoriteCount: state.favorites.length, compareCount: compareCount, hasComparisons: hasComparisons, isCompareListFull: isCompareListFull })); }, [
        state,
        setProperties, setSelectedProperty, addToFavorites, removeFromFavorites,
        toggleFavorite, setSearchFilters, updateSearchFilters, clearSearchFilters,
        setLoading, setError, clearError, addToCompare, removeFromCompare, clearCompare,
        toggleCompare, isInCompare, canAddToCompare, replaceInCompare, reorderCompare,
        addMultipleToCompare, removeMultipleFromCompare, getCommonFeatures, getDifferentFeatures,
        getPropertyComparison, getCompareStats, getComparePriceRange, exportComparison,
        importComparison, getShareableCompareUrl, favoriteProperties, filteredProperties,
        isFavorite, hasFilters, compareCount, hasComparisons, isCompareListFull,
    ]);
    return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
};
exports.PropertyProvider = PropertyProvider;
// ─── Hooks ───────────────────────────────────────────────────────────────────
var usePropertyContext = function () {
    var context = (0, react_1.useContext)(PropertyContext);
    if (context === undefined) {
        throw new Error('usePropertyContext must be used within a PropertyProvider');
    }
    return context;
};
exports.usePropertyContext = usePropertyContext;
var usePropertyState = function () {
    var _a = (0, exports.usePropertyContext)(), properties = _a.properties, selectedProperty = _a.selectedProperty, favorites = _a.favorites, isLoading = _a.isLoading, error = _a.error, searchFilters = _a.searchFilters, favoriteProperties = _a.favoriteProperties, filteredProperties = _a.filteredProperties, totalProperties = _a.totalProperties, favoriteCount = _a.favoriteCount, hasFilters = _a.hasFilters;
    return {
        properties: properties,
        selectedProperty: selectedProperty,
        favorites: favorites,
        isLoading: isLoading,
        error: error,
        searchFilters: searchFilters,
        favoriteProperties: favoriteProperties,
        filteredProperties: filteredProperties,
        totalProperties: totalProperties,
        favoriteCount: favoriteCount,
        hasFilters: hasFilters,
        isEmpty: properties.length === 0,
        hasError: error !== null,
        hasFavorites: favorites.length > 0,
        hasSelection: selectedProperty !== null,
    };
};
exports.usePropertyState = usePropertyState;
var usePropertyActions = function () {
    var _a = (0, exports.usePropertyContext)(), setProperties = _a.setProperties, setSelectedProperty = _a.setSelectedProperty, addToFavorites = _a.addToFavorites, removeFromFavorites = _a.removeFromFavorites, toggleFavorite = _a.toggleFavorite, setSearchFilters = _a.setSearchFilters, updateSearchFilters = _a.updateSearchFilters, clearSearchFilters = _a.clearSearchFilters, setLoading = _a.setLoading, setError = _a.setError, clearError = _a.clearError;
    return {
        setProperties: setProperties,
        setSelectedProperty: setSelectedProperty,
        addToFavorites: addToFavorites,
        removeFromFavorites: removeFromFavorites,
        toggleFavorite: toggleFavorite,
        setSearchFilters: setSearchFilters,
        updateSearchFilters: updateSearchFilters,
        clearSearchFilters: clearSearchFilters,
        setLoading: setLoading,
        setError: setError,
        clearError: clearError,
    };
};
exports.usePropertyActions = usePropertyActions;
var usePropertyFilters = function () {
    var _a = (0, exports.usePropertyContext)(), searchFilters = _a.searchFilters, filteredProperties = _a.filteredProperties, setSearchFilters = _a.setSearchFilters, updateSearchFilters = _a.updateSearchFilters, clearSearchFilters = _a.clearSearchFilters, hasFilters = _a.hasFilters;
    return {
        filters: searchFilters,
        filteredProperties: filteredProperties,
        setFilters: setSearchFilters,
        updateFilters: updateSearchFilters,
        clearFilters: clearSearchFilters,
        hasFilters: hasFilters,
        resultCount: filteredProperties.length,
    };
};
exports.usePropertyFilters = usePropertyFilters;
var useFavorites = function () {
    var _a = (0, exports.usePropertyContext)(), favorites = _a.favorites, favoriteProperties = _a.favoriteProperties, favoriteCount = _a.favoriteCount, isFavorite = _a.isFavorite, addToFavorites = _a.addToFavorites, removeFromFavorites = _a.removeFromFavorites, toggleFavorite = _a.toggleFavorite;
    return {
        favorites: favorites,
        favoriteProperties: favoriteProperties,
        favoriteCount: favoriteCount,
        isFavorite: isFavorite,
        addToFavorites: addToFavorites,
        removeFromFavorites: removeFromFavorites,
        toggleFavorite: toggleFavorite,
        hasFavorites: favorites.length > 0,
    };
};
exports.useFavorites = useFavorites;
var usePropertyCompare = function () {
    var _a = (0, exports.usePropertyContext)(), compareList = _a.compareList, addToCompare = _a.addToCompare, removeFromCompare = _a.removeFromCompare, clearCompare = _a.clearCompare, toggleCompare = _a.toggleCompare, isInCompare = _a.isInCompare, canAddToCompare = _a.canAddToCompare, maxCompareItems = _a.maxCompareItems, compareCount = _a.compareCount, hasComparisons = _a.hasComparisons, isCompareListFull = _a.isCompareListFull;
    return {
        selectedProperties: compareList,
        addToCompare: addToCompare,
        removeFromCompare: removeFromCompare,
        clearCompare: clearCompare,
        toggleProperty: toggleCompare,
        isSelected: isInCompare,
        canAddMore: canAddToCompare,
        maxProperties: maxCompareItems,
        count: compareCount,
        hasComparisons: hasComparisons,
        isFull: isCompareListFull,
        isEmpty: compareCount === 0,
    };
};
exports.usePropertyCompare = usePropertyCompare;
var usePropertyCompareActions = function () {
    var _a = (0, exports.usePropertyContext)(), addToCompare = _a.addToCompare, removeFromCompare = _a.removeFromCompare, clearCompare = _a.clearCompare, toggleCompare = _a.toggleCompare, replaceInCompare = _a.replaceInCompare, reorderCompare = _a.reorderCompare, addMultipleToCompare = _a.addMultipleToCompare, removeMultipleFromCompare = _a.removeMultipleFromCompare;
    return {
        addToCompare: addToCompare,
        removeFromCompare: removeFromCompare,
        clearCompare: clearCompare,
        toggleProperty: toggleCompare,
        replaceProperty: replaceInCompare,
        reorderProperties: reorderCompare,
        addMultiple: addMultipleToCompare,
        removeMultiple: removeMultipleFromCompare,
    };
};
exports.usePropertyCompareActions = usePropertyCompareActions;
var usePropertyCompareAnalysis = function () {
    var _a = (0, exports.usePropertyContext)(), getCommonFeatures = _a.getCommonFeatures, getDifferentFeatures = _a.getDifferentFeatures, getPropertyComparison = _a.getPropertyComparison, getCompareStats = _a.getCompareStats, getComparePriceRange = _a.getComparePriceRange;
    return {
        getCommonFeatures: getCommonFeatures,
        getDifferentFeatures: getDifferentFeatures,
        getPropertyComparison: getPropertyComparison,
        getStats: getCompareStats,
        getPriceRange: getComparePriceRange,
    };
};
exports.usePropertyCompareAnalysis = usePropertyCompareAnalysis;
var usePropertyCompareState = function () {
    var _a = (0, exports.usePropertyContext)(), compareList = _a.compareList, canAddToCompare = _a.canAddToCompare, maxCompareItems = _a.maxCompareItems, isInCompare = _a.isInCompare, compareCount = _a.compareCount, hasComparisons = _a.hasComparisons, isCompareListFull = _a.isCompareListFull;
    return {
        selectedProperties: compareList,
        canAddMore: canAddToCompare,
        maxProperties: maxCompareItems,
        isSelected: isInCompare,
        count: compareCount,
        hasComparisons: hasComparisons,
        isFull: isCompareListFull,
        isEmpty: compareCount === 0,
    };
};
exports.usePropertyCompareState = usePropertyCompareState;
