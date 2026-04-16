import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback, useEffect } from 'react'

import type { Property } from "@shared/types/property"
import type {
  CompareProperty,
  ComparisonResult,
  ComparisonStats,
} from '../../local/types/compare'
import { normalizePropertyForComparison } from '../../local/utils/compare-utils'
import { useCompareError } from '../../local/hooks/useCompareError'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  searchFilters: PropertyFilters;
  compareList: CompareProperty[];
  maxCompareItems: number;
}

export interface PropertyFilters {
  query?: string;
  location?: string;
  priceRange?: { min: number; max: number };
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}

interface PropertyContextType extends PropertyState {
  // Core actions
  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  addToFavorites: (propertyId: string) => void;
  removeFromFavorites: (propertyId: string) => void;
  toggleFavorite: (propertyId: string) => void;
  setSearchFilters: (filters: PropertyFilters) => void;
  updateSearchFilters: (filters: Partial<PropertyFilters>) => void;
  clearSearchFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Comparison actions
  addToCompare: (property: CompareProperty) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  toggleCompare: (property: CompareProperty) => void;
  isInCompare: (propertyId: string) => boolean;
  canAddToCompare: boolean;
  replaceInCompare: (oldPropertyId: string, newProperty: CompareProperty) => void;
  reorderCompare: (fromIndex: number, toIndex: number) => void;
  addMultipleToCompare: (properties: CompareProperty[]) => void;
  removeMultipleFromCompare: (propertyIds: string[]) => void;

  // Comparison utilities
  getCommonFeatures: () => string[];
  getDifferentFeatures: () => string[];
  getPropertyComparison: () => ComparisonResult[];
  getCompareStats: () => ComparisonStats;
  getComparePriceRange: () => { min: number; max: number; average: number } | null;

  // Comparison persistence
  exportComparison: () => string;
  importComparison: (data: string) => boolean;
  getShareableCompareUrl: () => string;

  // Derived state
  favoriteProperties: Property[];
  filteredProperties: Property[];
  isFavorite: (propertyId: string) => boolean;
  hasFilters: boolean;
  totalProperties: number;
  favoriteCount: number;
  compareCount: number;
  hasComparisons: boolean;
  isCompareListFull: boolean;
}

type PropertyAction =
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'SET_SELECTED_PROPERTY'; payload: Property | null }
  | { type: 'ADD_TO_FAVORITES'; payload: string }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string }
  | { type: 'SET_SEARCH_FILTERS'; payload: PropertyFilters }
  | { type: 'UPDATE_SEARCH_FILTERS'; payload: Partial<PropertyFilters> }
  | { type: 'CLEAR_SEARCH_FILTERS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TO_COMPARE'; payload: CompareProperty }
  | { type: 'REMOVE_FROM_COMPARE'; payload: string }
  | { type: 'CLEAR_COMPARE' }
  | { type: 'REPLACE_IN_COMPARE'; payload: { oldPropertyId: string; newProperty: CompareProperty } }
  | { type: 'REORDER_COMPARE'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_COMPARE_LIST'; payload: CompareProperty[] };

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const FAVORITES_STORAGE_KEY = 'propertyFavorites';
const COMPARE_STORAGE_KEY = 'propertyCompare';
const DEFAULT_FILTERS: PropertyFilters = {};
const DEFAULT_MAX_COMPARE_ITEMS = 3;

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : defaultValue;
  } catch {
    console.warn(`Failed to load ${key} from localStorage.`);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn(`Failed to save ${key} to localStorage.`);
  }
};

const getPropertyId = (property: CompareProperty | { id: unknown }): string =>
  String(property.id);

const matchesFilter = (property: Property, filters: PropertyFilters): boolean => {
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const searchable = `${property.title} ${property.location}`.toLowerCase();
    if (!searchable.includes(query)) return false;
  }

  if (filters.location) {
    const location =
      typeof property.location === 'string'
        ? property.location
        : property.location?.address ?? '';
    if (!location.toLowerCase().includes(filters.location.toLowerCase())) return false;
  }

  if (filters.priceRange) {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    const { min, max } = filters.priceRange;
    if (price < min || price > max) return false;
  }

  if (filters.propertyType && property.type !== filters.propertyType) return false;
  if (filters.bedrooms !== undefined && property.bedrooms !== filters.bedrooms) return false;
  if (filters.bathrooms !== undefined && property.bathrooms !== filters.bathrooms) return false;
  if (filters.verified !== undefined) {
    if ((property.verificationStatus === 'verified') !== filters.verified) return false;
  }

  return true;
};

/** Extracts numeric prices from a compare list, filtering out invalid values. */
const extractPrices = (compareList: CompareProperty[]): number[] =>
  compareList
    .map((p) => p.price)
    .filter((price): price is number => typeof price === 'number' && !isNaN(price));

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: PropertyState = {
  properties: [],
  selectedProperty: null,
  favorites: loadFromStorage<string[]>(FAVORITES_STORAGE_KEY, []),
  isLoading: false,
  error: null,
  searchFilters: DEFAULT_FILTERS,
  compareList: loadFromStorage<CompareProperty[]>(COMPARE_STORAGE_KEY, []),
  maxCompareItems: DEFAULT_MAX_COMPARE_ITEMS,
};

const propertyReducer = (state: PropertyState, action: PropertyAction): PropertyState => {
  switch (action.type) {
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload, isLoading: false, error: null };

    case 'SET_SELECTED_PROPERTY':
      return { ...state, selectedProperty: action.payload };

    case 'ADD_TO_FAVORITES': {
      if (state.favorites.includes(action.payload)) return state;
      const newFavorites = [...state.favorites, action.payload];
      saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
      return { ...state, favorites: newFavorites };
    }

    case 'REMOVE_FROM_FAVORITES': {
      const newFavorites = state.favorites.filter((id) => id !== action.payload);
      saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
      return { ...state, favorites: newFavorites };
    }

    case 'SET_SEARCH_FILTERS':
      return { ...state, searchFilters: action.payload };

    case 'UPDATE_SEARCH_FILTERS':
      return { ...state, searchFilters: { ...state.searchFilters, ...action.payload } };

    case 'CLEAR_SEARCH_FILTERS':
      return { ...state, searchFilters: DEFAULT_FILTERS };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ADD_TO_COMPARE': {
      const normalized = normalizePropertyForComparison(action.payload);
      if (!normalized) return state;
      const id = getPropertyId(normalized);
      if (
        state.compareList.some((p) => getPropertyId(p) === id) ||
        state.compareList.length >= state.maxCompareItems
      ) {
        return state;
      }
      const newList = [...state.compareList, normalized];
      saveToStorage(COMPARE_STORAGE_KEY, newList);
      return { ...state, compareList: newList };
    }

    case 'REMOVE_FROM_COMPARE': {
      const newList = state.compareList.filter((p) => getPropertyId(p) !== action.payload);
      saveToStorage(COMPARE_STORAGE_KEY, newList);
      return { ...state, compareList: newList };
    }

    case 'CLEAR_COMPARE':
      saveToStorage(COMPARE_STORAGE_KEY, []);
      return { ...state, compareList: [] };

    case 'REPLACE_IN_COMPARE': {
      const { oldPropertyId, newProperty } = action.payload;
      const normalized = normalizePropertyForComparison(newProperty);
      if (!normalized) return state;
      const newList = state.compareList.map((p) =>
        getPropertyId(p) === oldPropertyId ? normalized : p
      );
      saveToStorage(COMPARE_STORAGE_KEY, newList);
      return { ...state, compareList: newList };
    }

    case 'REORDER_COMPARE': {
      const { fromIndex, toIndex } = action.payload;
      const len = state.compareList.length;
      if (
        fromIndex === toIndex ||
        fromIndex < 0 || fromIndex >= len ||
        toIndex < 0 || toIndex >= len
      ) {
        return state;
      }
      const newList = [...state.compareList];
      const [moved] = newList.splice(fromIndex, 1);
      if (moved) newList.splice(toIndex, 0, moved);
      saveToStorage(COMPARE_STORAGE_KEY, newList);
      return { ...state, compareList: newList };
    }

    case 'SET_COMPARE_LIST': {
      const normalized = action.payload
        .map(normalizePropertyForComparison)
        .filter((p): p is CompareProperty => p !== null)
        .slice(0, state.maxCompareItems);
      saveToStorage(COMPARE_STORAGE_KEY, normalized);
      return { ...state, compareList: normalized };
    }

    default:
      return state;
  }
};

// ─── Context & Provider ──────────────────────────────────────────────────────

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

interface PropertyProviderProps {
  children: ReactNode;
  maxCompareItems?: number;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({
  children,
  maxCompareItems = DEFAULT_MAX_COMPARE_ITEMS,
}) => {
  const [state, dispatch] = useReducer(propertyReducer, {
    ...initialState,
    maxCompareItems,
  });

  const { handleError } = useCompareError();

  // ── Core actions ────────────────────────────────────────────────────────────

  const setProperties = useCallback((properties: Property[]) => {
    dispatch({ type: 'SET_PROPERTIES', payload: properties });
  }, []);

  const setSelectedProperty = useCallback((property: Property | null) => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property });
  }, []);

  const addToFavorites = useCallback((propertyId: string) => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: propertyId });
  }, []);

  const removeFromFavorites = useCallback((propertyId: string) => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: propertyId });
  }, []);

  const toggleFavorite = useCallback(
    (propertyId: string) => {
      dispatch({
        type: state.favorites.includes(propertyId) ? 'REMOVE_FROM_FAVORITES' : 'ADD_TO_FAVORITES',
        payload: propertyId,
      });
    },
    [state.favorites]
  );

  const setSearchFilters = useCallback((filters: PropertyFilters) => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters });
  }, []);

  const updateSearchFilters = useCallback((filters: Partial<PropertyFilters>) => {
    dispatch({ type: 'UPDATE_SEARCH_FILTERS', payload: filters });
  }, []);

  const clearSearchFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH_FILTERS' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ── Comparison actions ──────────────────────────────────────────────────────

  const addToCompare = useCallback(
    (property: CompareProperty) => {
      try {
        dispatch({ type: 'ADD_TO_COMPARE', payload: property });
      } catch (error) {
        handleError(error, 'addToCompare');
      }
    },
    [handleError]
  );

  const removeFromCompare = useCallback((propertyId: string) => {
    dispatch({ type: 'REMOVE_FROM_COMPARE', payload: propertyId });
  }, []);

  const clearCompare = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPARE' });
  }, []);

  const toggleCompare = useCallback(
    (property: CompareProperty) => {
      try {
        const normalized = normalizePropertyForComparison(property);
        if (!normalized) {
          handleError('Invalid property data', 'toggleCompare');
          return;
        }
        const id = getPropertyId(normalized);
        if (state.compareList.some((p) => getPropertyId(p) === id)) {
          dispatch({ type: 'REMOVE_FROM_COMPARE', payload: id });
        } else {
          dispatch({ type: 'ADD_TO_COMPARE', payload: normalized });
        }
      } catch (error) {
        handleError(error, 'toggleCompare');
      }
    },
    [state.compareList, handleError]
  );

  const isInCompare = useCallback(
    (propertyId: string) =>
      state.compareList.some((p) => getPropertyId(p) === propertyId),
    [state.compareList]
  );

  const replaceInCompare = useCallback(
    (oldPropertyId: string, newProperty: CompareProperty) => {
      try {
        dispatch({ type: 'REPLACE_IN_COMPARE', payload: { oldPropertyId, newProperty } });
      } catch (error) {
        handleError(error, 'replaceInCompare');
      }
    },
    [handleError]
  );

  const reorderCompare = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_COMPARE', payload: { fromIndex, toIndex } });
  }, []);

  const addMultipleToCompare = useCallback(
    (properties: CompareProperty[]) => {
      try {
        const normalized = properties
          .map(normalizePropertyForComparison)
          .filter((p): p is CompareProperty => p !== null);

        const availableSlots = state.maxCompareItems - state.compareList.length;
        const toAdd = normalized
          .filter((p) => !state.compareList.some((ex) => getPropertyId(ex) === getPropertyId(p)))
          .slice(0, availableSlots);

        if (toAdd.length > 0) {
          dispatch({ type: 'SET_COMPARE_LIST', payload: [...state.compareList, ...toAdd] });
        }
      } catch (error) {
        handleError(error, 'addMultipleToCompare');
      }
    },
    [state.compareList, state.maxCompareItems, handleError]
  );

  const removeMultipleFromCompare = useCallback(
    (propertyIds: string[]) => {
      const updated = state.compareList.filter((p) => !propertyIds.includes(getPropertyId(p)));
      dispatch({ type: 'SET_COMPARE_LIST', payload: updated });
    },
    [state.compareList]
  );

  // ── Comparison utilities ────────────────────────────────────────────────────

  const getCommonFeatures = useCallback((): string[] => {
    if (state.compareList.length === 0) return [];
    const [first, ...rest] = state.compareList.map((p) => Object.keys(p));
    return (first ?? []).filter((key) => rest.every((keys) => keys.includes(key)));
  }, [state.compareList]);

  const getDifferentFeatures = useCallback((): string[] => {
    if (state.compareList.length === 0) return [];
    const common = new Set(getCommonFeatures());
    const different = new Set<string>();
    state.compareList.forEach((p) => {
      Object.keys(p).forEach((key) => {
        if (!common.has(key)) different.add(key);
      });
    });
    return Array.from(different);
  }, [state.compareList, getCommonFeatures]);

  const getPropertyComparison = useCallback((): ComparisonResult[] => {
    if (state.compareList.length === 0) return [];
    const commonFeatures = getCommonFeatures();
    return commonFeatures.map((feature) => {
      const values = state.compareList.map((property) => ({
        propertyId: getPropertyId(property),
        value: (property as unknown as Record<string, unknown>)[feature],
        propertyName: property.title ?? `Property ${property.id}`,
      }));
      const uniqueValues = [...new Set(values.map((v) => v.value))];
      return { feature, values, allSame: uniqueValues.length === 1, uniqueValues };
    });
  }, [state.compareList, getCommonFeatures]);

  const getComparePriceRange = useCallback(() => {
    const prices = extractPrices(state.compareList);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    return { min, max, average };
  }, [state.compareList]);

  const getCompareStats = useCallback((): ComparisonStats => {
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

    const prices = extractPrices(state.compareList);
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const average = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;

    return {
      totalProperties: state.compareList.length,
      averagePrice: average,
      priceRange: { min, max },
      commonFeatures: getCommonFeatures().length,
      uniqueFeatures: getDifferentFeatures().length,
      mostExpensive: state.compareList.find((p) => p.price === max) ?? null,
      leastExpensive: state.compareList.find((p) => p.price === min) ?? null,
    };
  }, [state.compareList, getCommonFeatures, getDifferentFeatures]);

  // ── Comparison persistence ──────────────────────────────────────────────────

  const exportComparison = useCallback(
    () =>
      JSON.stringify({
        properties: state.compareList,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }),
    [state.compareList]
  );

  const importComparison = useCallback(
    (data: string): boolean => {
      try {
        const parsed = JSON.parse(data) as { properties?: unknown[] };
        if (!Array.isArray(parsed.properties)) return false;
        const normalized = parsed.properties
          .map(normalizePropertyForComparison)
          .filter((p): p is CompareProperty => p !== null);
        if (normalized.length === 0) return false;
        dispatch({ type: 'SET_COMPARE_LIST', payload: normalized });
        return true;
      } catch (error) {
        handleError(error, 'importComparison');
        return false;
      }
    },
    [handleError]
  );

  const getShareableCompareUrl = useCallback((): string => {
    const ids = state.compareList.map(getPropertyId).join(',');
    return `${window.location.origin}${window.location.pathname}?compare=${encodeURIComponent(ids)}`;
  }, [state.compareList]);

  // ── Derived state ───────────────────────────────────────────────────────────

  const favoriteProperties = useMemo(
    () => state.properties.filter((p) => state.favorites.includes(String(p.id))),
    [state.properties, state.favorites]
  );

  const filteredProperties = useMemo(
    () => state.properties.filter((p) => matchesFilter(p, state.searchFilters)),
    [state.properties, state.searchFilters]
  );

  const isFavorite = useCallback(
    (propertyId: string) => state.favorites.includes(propertyId),
    [state.favorites]
  );

  const hasFilters = useMemo(
    () =>
      Object.entries(state.searchFilters).some(([key, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (key === 'priceRange' && typeof value === 'object') {
          return (value as { min?: number; max?: number }).min !== undefined ||
            (value as { min?: number; max?: number }).max !== undefined;
        }
        return true;
      }),
    [state.searchFilters]
  );

  const canAddToCompare = state.compareList.length < state.maxCompareItems;
  const compareCount = state.compareList.length;
  const hasComparisons = compareCount > 0;
  const isCompareListFull = compareCount >= state.maxCompareItems;

  const value: PropertyContextType = useMemo(
    () => ({
      ...state,
      setProperties,
      setSelectedProperty,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      setSearchFilters,
      updateSearchFilters,
      clearSearchFilters,
      setLoading,
      setError,
      clearError,
      addToCompare,
      removeFromCompare,
      clearCompare,
      toggleCompare,
      isInCompare,
      canAddToCompare,
      replaceInCompare,
      reorderCompare,
      addMultipleToCompare,
      removeMultipleFromCompare,
      getCommonFeatures,
      getDifferentFeatures,
      getPropertyComparison,
      getCompareStats,
      getComparePriceRange,
      exportComparison,
      importComparison,
      getShareableCompareUrl,
      favoriteProperties,
      filteredProperties,
      isFavorite,
      hasFilters,
      totalProperties: state.properties.length,
      favoriteCount: state.favorites.length,
      compareCount,
      hasComparisons,
      isCompareListFull,
    }),
    [
      state,
      setProperties, setSelectedProperty, addToFavorites, removeFromFavorites,
      toggleFavorite, setSearchFilters, updateSearchFilters, clearSearchFilters,
      setLoading, setError, clearError, addToCompare, removeFromCompare, clearCompare,
      toggleCompare, isInCompare, canAddToCompare, replaceInCompare, reorderCompare,
      addMultipleToCompare, removeMultipleFromCompare, getCommonFeatures, getDifferentFeatures,
      getPropertyComparison, getCompareStats, getComparePriceRange, exportComparison,
      importComparison, getShareableCompareUrl, favoriteProperties, filteredProperties,
      isFavorite, hasFilters, compareCount, hasComparisons, isCompareListFull,
    ]
  );

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const usePropertyContext = (): PropertyContextType => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
};

export const usePropertyState = () => {
  const {
    properties, selectedProperty, favorites, isLoading, error, searchFilters,
    favoriteProperties, filteredProperties, totalProperties, favoriteCount, hasFilters,
  } = usePropertyContext();

  return {
    properties, selectedProperty, favorites, isLoading, error, searchFilters,
    favoriteProperties, filteredProperties, totalProperties, favoriteCount, hasFilters,
    isEmpty: properties.length === 0,
    hasError: error !== null,
    hasFavorites: favorites.length > 0,
    hasSelection: selectedProperty !== null,
  };
};

export const usePropertyActions = () => {
  const {
    setProperties, setSelectedProperty, addToFavorites, removeFromFavorites, toggleFavorite,
    setSearchFilters, updateSearchFilters, clearSearchFilters, setLoading, setError, clearError,
  } = usePropertyContext();

  return {
    setProperties, setSelectedProperty, addToFavorites, removeFromFavorites, toggleFavorite,
    setSearchFilters, updateSearchFilters, clearSearchFilters, setLoading, setError, clearError,
  };
};

export const usePropertyFilters = () => {
  const {
    searchFilters, filteredProperties, setSearchFilters, updateSearchFilters,
    clearSearchFilters, hasFilters,
  } = usePropertyContext();

  return {
    filters: searchFilters,
    filteredProperties,
    setFilters: setSearchFilters,
    updateFilters: updateSearchFilters,
    clearFilters: clearSearchFilters,
    hasFilters,
    resultCount: filteredProperties.length,
  };
};

export const useFavorites = () => {
  const {
    favorites, favoriteProperties, favoriteCount, isFavorite,
    addToFavorites, removeFromFavorites, toggleFavorite,
  } = usePropertyContext();

  return {
    favorites, favoriteProperties, favoriteCount, isFavorite,
    addToFavorites, removeFromFavorites, toggleFavorite,
    hasFavorites: favorites.length > 0,
  };
};

export const usePropertyCompare = () => {
  const {
    compareList, addToCompare, removeFromCompare, clearCompare, toggleCompare,
    isInCompare, canAddToCompare, maxCompareItems, compareCount, hasComparisons, isCompareListFull,
  } = usePropertyContext();

  return {
    selectedProperties: compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleProperty: toggleCompare,
    isSelected: isInCompare,
    canAddMore: canAddToCompare,
    maxProperties: maxCompareItems,
    count: compareCount,
    hasComparisons,
    isFull: isCompareListFull,
    isEmpty: compareCount === 0,
  };
};

export const usePropertyCompareActions = () => {
  const {
    addToCompare, removeFromCompare, clearCompare, toggleCompare, replaceInCompare,
    reorderCompare, addMultipleToCompare, removeMultipleFromCompare,
  } = usePropertyContext();

  return {
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleProperty: toggleCompare,
    replaceProperty: replaceInCompare,
    reorderProperties: reorderCompare,
    addMultiple: addMultipleToCompare,
    removeMultiple: removeMultipleFromCompare,
  };
};

export const usePropertyCompareAnalysis = () => {
  const {
    getCommonFeatures, getDifferentFeatures, getPropertyComparison,
    getCompareStats, getComparePriceRange,
  } = usePropertyContext();

  return {
    getCommonFeatures,
    getDifferentFeatures,
    getPropertyComparison,
    getStats: getCompareStats,
    getPriceRange: getComparePriceRange,
  };
};

export const usePropertyCompareState = () => {
  const {
    compareList, canAddToCompare, maxCompareItems, isInCompare,
    compareCount, hasComparisons, isCompareListFull,
  } = usePropertyContext();

  return {
    selectedProperties: compareList,
    canAddMore: canAddToCompare,
    maxProperties: maxCompareItems,
    isSelected: isInCompare,
    count: compareCount,
    hasComparisons,
    isFull: isCompareListFull,
    isEmpty: compareCount === 0,
  };
};