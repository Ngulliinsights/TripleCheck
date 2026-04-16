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
exports.useFilterState = useFilterState;
exports.useResidentialFilterState = useResidentialFilterState;
exports.useCommercialFilterState = useCommercialFilterState;
exports.useLandFilterState = useLandFilterState;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var useDebounce_1 = require("./useDebounce");
/**
 * Generic filter state management hook
 * Provides centralized filter logic with debouncing and URL sync
 */
function useFilterState(options) {
    var defaultFilters = options.defaultFilters, _a = options.debounceMs, debounceMs = _a === void 0 ? 300 : _a, onChange = options.onChange, _b = options.syncWithUrl, syncWithUrl = _b === void 0 ? false : _b, validateFilters = options.validateFilters;
    var _c = (0, react_router_dom_1.useSearchParams)(), searchParams = _c[0], setSearchParams = _c[1];
    // Initialize filters from URL if sync is enabled
    var initialFilters = (0, react_1.useMemo)(function () {
        if (!syncWithUrl) {
            return defaultFilters;
        }
        try {
            var urlFilters = __assign({}, defaultFilters);
            // Parse URL parameters and merge with defaults
            for (var _i = 0, _a = searchParams.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                if (key in defaultFilters) {
                    var defaultValue = defaultFilters[key];
                    // Type-safe parsing based on default value type
                    if (typeof defaultValue === 'boolean') {
                        urlFilters[key] = value === 'true';
                    }
                    else if (typeof defaultValue === 'number') {
                        var numValue = Number(value);
                        if (!isNaN(numValue)) {
                            urlFilters[key] = numValue;
                        }
                    }
                    else {
                        urlFilters[key] = value;
                    }
                }
            }
            return urlFilters;
        }
        catch (error) {
            console.warn('Failed to parse URL filters, using defaults:', error);
            return defaultFilters;
        }
    }, [defaultFilters, searchParams, syncWithUrl]);
    var _d = (0, react_1.useState)(initialFilters), filters = _d[0], setFiltersState = _d[1];
    // Debounced filters for API calls
    var debouncedFilters = (0, useDebounce_1.useDebounce)(filters, debounceMs);
    // Validation
    var validation = (0, react_1.useMemo)(function () {
        if (!validateFilters || !filters) {
            return { isValid: true, errors: {} };
        }
        return validateFilters(filters);
    }, [filters, validateFilters]);
    // Check if any filters are active (different from defaults)
    var hasActiveFilters = (0, react_1.useMemo)(function () {
        if (!filters || typeof filters !== 'object') {
            return false;
        }
        return Object.keys(filters).some(function (key) {
            var filterKey = key;
            var currentValue = filters[filterKey];
            var defaultValue = defaultFilters[filterKey];
            // Handle different types of comparisons
            if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
                return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
            }
            return currentValue !== defaultValue;
        });
    }, [filters, defaultFilters]);
    // Update URL when filters change (if sync is enabled)
    (0, react_1.useEffect)(function () {
        if (!syncWithUrl)
            return;
        var newSearchParams = new URLSearchParams();
        Object.entries(filters).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            var defaultValue = defaultFilters[key];
            // Only add to URL if different from default
            if (value !== defaultValue && value !== null && value !== undefined && value !== '') {
                newSearchParams.set(key, String(value));
            }
        });
        // Update URL without triggering navigation
        setSearchParams(newSearchParams, { replace: true });
    }, [filters, defaultFilters, syncWithUrl, setSearchParams]);
    // Call onChange when debounced filters change
    (0, react_1.useEffect)(function () {
        if (onChange) {
            onChange(debouncedFilters);
        }
    }, [debouncedFilters, onChange]);
    // Set filters function
    var setFilters = (0, react_1.useCallback)(function (newFilters) {
        setFiltersState(function (prev) {
            var updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            return __assign({}, updated);
        });
    }, []);
    // Update single filter
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        setFiltersState(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    // Reset filters to defaults
    var reset = (0, react_1.useCallback)(function () {
        setFiltersState(__assign({}, defaultFilters));
    }, [defaultFilters]);
    return {
        filters: filters,
        setFilters: setFilters,
        updateFilter: updateFilter,
        reset: reset,
        debouncedFilters: debouncedFilters,
        isValid: validation.isValid,
        errors: validation.errors,
        hasActiveFilters: hasActiveFilters,
    };
}
/**
 * Property-specific filter state hooks
 */
function useResidentialFilterState(defaultFilters, options) {
    return useFilterState(__assign(__assign({ defaultFilters: defaultFilters }, options), { validateFilters: function (filters) {
            var errors = {};
            // Validate price range
            if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
                errors.priceMin = 'Minimum price cannot be greater than maximum price';
            }
            // Validate bedrooms/bathrooms
            if (filters.bedrooms && filters.bedrooms < 0) {
                errors.bedrooms = 'Bedrooms must be a positive number';
            }
            if (filters.bathrooms && filters.bathrooms < 0) {
                errors.bathrooms = 'Bathrooms must be a positive number';
            }
            return {
                isValid: Object.keys(errors).length === 0,
                errors: errors,
            };
        } }));
}
function useCommercialFilterState(defaultFilters, options) {
    return useFilterState(__assign(__assign({ defaultFilters: defaultFilters }, options), { validateFilters: function (filters) {
            var errors = {};
            // Validate price range
            if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
                errors.priceMin = 'Minimum price cannot be greater than maximum price';
            }
            // Validate area range
            if (filters.areaMin && filters.areaMax && filters.areaMin > filters.areaMax) {
                errors.areaMin = 'Minimum area cannot be greater than maximum area';
            }
            // Validate floors
            if (filters.floorsMin && filters.floorsMax && filters.floorsMin > filters.floorsMax) {
                errors.floorsMin = 'Minimum floors cannot be greater than maximum floors';
            }
            return {
                isValid: Object.keys(errors).length === 0,
                errors: errors,
            };
        } }));
}
function useLandFilterState(defaultFilters, options) {
    return useFilterState(__assign(__assign({ defaultFilters: defaultFilters }, options), { validateFilters: function (filters) {
            var errors = {};
            // Validate price range
            if (filters.priceMin && filters.priceMax && filters.priceMin > filters.priceMax) {
                errors.priceMin = 'Minimum price cannot be greater than maximum price';
            }
            // Validate size range
            if (filters.sizeMin && filters.sizeMax && filters.sizeMin > filters.sizeMax) {
                errors.sizeMin = 'Minimum size cannot be greater than maximum size';
            }
            // Validate size values are positive
            if (filters.sizeMin && filters.sizeMin < 0) {
                errors.sizeMin = 'Size must be a positive number';
            }
            if (filters.sizeMax && filters.sizeMax < 0) {
                errors.sizeMax = 'Size must be a positive number';
            }
            return {
                isValid: Object.keys(errors).length === 0,
                errors: errors,
            };
        } }));
}
exports.default = useFilterState;
