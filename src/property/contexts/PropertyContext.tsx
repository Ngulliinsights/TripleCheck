import React, { createContext, useContext, useReducer, ReactNode, useMemo, useCallback, useEffect } from 'react';

import type { Property } from '../../shared/types/property';
import type {
  CompareProperty,
  ComparisonResult,
  ComparisonStats,
} from '../../shared/types/compare';
import { normalizePropertyForComparison } from '../../shared/utils/compare-utils';
import { useCompareError } from '../../shared/hooks/useCompareError';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  searchFilters: PropertyFilters;
  // Comparison state
  compareList: CompareProperty[];
  maxCompareItems: number;
}

export interface PropertyFilters {
  query?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
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
  
  // Advanced comparison actions
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
  // Comparison actions
  | { type: 'ADD_TO_COMPARE'; payload: CompareProperty }
  | { type: 'REMOVE_FROM_COMPARE'; payload: string }
  | { type: 'CLEAR_COMPARE' }
  | { type: 'REPLACE_IN_COMPARE'; payload: { oldPropertyId: string; newProperty: CompareProperty } }
  | { type: 'REORDER_COMPARE'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_COMPARE_LIST'; payload: CompareProperty[] };

const FAVORITES_STORAGE_KEY = 'propertyFavorites';
const COMPARE_STORAGE_KEY = 'propertyCompare';
const DEFAULT_FILTERS: PropertyFilters = {};
const DEFAULT_MAX_COMPARE_ITEMS = 3;

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

// Helper function to safely convert property ID to string
const getPropertyId = (property: CompareProperty | { id: unknown }): string => {
  return String(property.id);
};

const matchesFilter = (property: Property, filters: PropertyFilters): boolean => {
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const searchableText = `${property.title} ${property.location}`.toLowerCase();
    if (!searchableText.includes(query)) return false;
  }
  
  if (filters.location) {
    const location = typeof property.location === 'string' 
      ? property.location 
      : property.location?.address || '';
    if (!location.toLowerCase().includes(filters.location.toLowerCase())) return false;
  }
  
  if (filters.priceRange) {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    const { min, max } = filters.priceRange;
    if ((min !== undefined && price < min) || (max !== undefined && price > max)) return false;
  }
  
  if (filters.propertyType && property.type !== filters.propertyType) return false;
  if (filters.bedrooms !== undefined && property.bedrooms !== filters.bedrooms) return false;
  if (filters.bathrooms !== undefined && property.bathrooms !== filters.bathrooms) return false;
  if (filters.verified !== undefined) {
    const isVerified = property.verificationStatus === 'verified';
    if (isVerified !== filters.verified) return false;
  }
  
  return true;
};

const initialState: PropertyState = {
  properties: [],
  selectedProperty: null,
  favorites: loadFromStorage(FAVORITES_STORAGE_KEY, []),
  isLoading: false,
  error: null,
  searchFilters: DEFAULT_FILTERS,
  compareList: loadFromStorage(COMPARE_STORAGE_KEY, []),
  maxCompareItems: DEFAULT_MAX_COMPARE_ITEMS,
};

const propertyReducer = (state: PropertyState, action: PropertyAction): PropertyState => {
  switch (action.type) {
    case 'SET_PROPERTIES':
      return {
        ...state,
        properties: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_SELECTED_PROPERTY':
      return {
        ...state,
        selectedProperty: action.payload,
      };
    case 'ADD_TO_FAVORITES': {
      const newFavorites = state.favorites.includes(action.payload) 
        ? state.favorites 
        : [...state.favorites, action.payload];
      saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
      return {
        ...state,
        favorites: newFavorites,
      };
    }
    case 'REMOVE_FROM_FAVORITES': {
      const newFavorites = state.favorites.filter(id => id !== action.payload);
      saveToStorage(FAVORITES_STORAGE_KEY, newFavorites);
      return {
        ...state,
        favorites: newFavorites,
      };
    }
    case 'SET_SEARCH_FILTERS':
      return {
        ...state,
        searchFilters: action.payload,
      };
    case 'UPDATE_SEARCH_FILTERS':
      return {
        ...state,
        searchFilters: { ...state.searchFilters, ...action.payload },
      };
    case 'CLEAR_SEARCH_FILTERS':
      return {
        ...state,
        searchFilters: DEFAULT_FILTERS,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'ADD_TO_COMPARE': {
      const normalizedProperty = normalizePropertyForComparison(action.payload);
      if (!normalizedProperty) return state;
      
      const propertyId = getPropertyId(normalizedProperty);
      const isAlreadyInCompare = state.compareList.some(p => getPropertyId(p) === propertyId);
      
      if (isAlreadyInCompare || state.compareList.length >= state.maxCompareItems) {
        return state;
      }
      
      const newCompareList = [...state.compareList, normalizedProperty];
      saveToStorage(COMPARE_STORAGE_KEY, newCompareList);
      return {
        ...state,
        compareList: newCompareList,
      };
    }
    case 'REMOVE_FROM_COMPARE': {
      const newCompareList = state.compareList.filter(p => getPropertyId(p) !== action.payload);
      saveToStorage(COMPARE_STORAGE_KEY, newCompareList);
      return {
        ...state,
        compareList: newCompareList,
      };
    }
    case 'CLEAR_COMPARE':
      saveToStorage(COMPARE_STORAGE_KEY, []);
      return {
        ...state,
        compareList: [],
      };
    case 'REPLACE_IN_COMPARE': {
      const { oldPropertyId, newProperty } = action.payload;
      const normalizedProperty = normalizePropertyForComparison(newProperty);
      if (!normalizedProperty) return state;
      
      const newCompareList = state.compareList.map(p => 
        getPropertyId(p) === oldPropertyId ? normalizedProperty : p
      );
      saveToStorage(COMPARE_STORAGE_KEY, newCompareList);
      return {
        ...state,
        compareList: newCompareList,
      };
    }
    case 'REORDER_COMPARE': {
      const { fromIndex, toIndex } = action.payload;
      if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= state.compareList.length ||
          toIndex < 0 || toIndex >= state.compareList.length) {
        return state;
      }
      
      const newCompareList = [...state.compareList];
      const [movedProperty] = newCompareList.splice(fromIndex, 1);
      if (movedProperty) {
        newCompareList.splice(toIndex, 0, movedProperty);
      }
      
      saveToStorage(COMPARE_STORAGE_KEY, newCompareList);
      return {
        ...state,
        compareList: newCompareList,
      };
    }
    case 'SET_COMPARE_LIST': {
      const normalizedProperties = action.payload
        .map(normalizePropertyForComparison)
        .filter((p): p is CompareProperty => p !== null)
        .slice(0, state.maxCompareItems);
      
      saveToStorage(COMPARE_STORAGE_KEY, normalizedProperties);
      return {
        ...state,
        compareList: normalizedProperties,
      };
    }
    default:
      return state;
  }
};

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

interface PropertyProviderProps {
  children: ReactNode;
  maxCompareItems?: number;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ 
  children, 
  maxCompareItems = DEFAULT_MAX_COMPARE_ITEMS 
}) => {
  const [state, dispatch] = useReducer(propertyReducer, {
    ...initialState,
    maxCompareItems,
  });

  // Use unified error handling for comparison functionality
  const { error: compareError, handleError } = useCompareError();

  // Actions
  const setProperties = useCallback((properties: Property[]): void => {
    dispatch({ type: 'SET_PROPERTIES', payload: properties });
  }, []);

  const setSelectedProperty = useCallback((property: Property | null): void => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property });
  }, []);

  const addToFavorites = useCallback((propertyId: string): void => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: propertyId });
  }, []);

  const removeFromFavorites = useCallback((propertyId: string): void => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: propertyId });
  }, []);

  const toggleFavorite = useCallback((propertyId: string): void => {
    if (state.favorites.includes(propertyId)) {
      removeFromFavorites(propertyId);
    } else {
      addToFavorites(propertyId);
    }
  }, [state.favorites, addToFavorites, removeFromFavorites]);

  const setSearchFilters = useCallback((filters: PropertyFilters): void => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters });
  }, []);

  const updateSearchFilters = useCallback((filters: Partial<PropertyFilters>): void => {
    dispatch({ type: 'UPDATE_SEARCH_FILTERS', payload: filters });
  }, []);

  const clearSearchFilters = useCallback((): void => {
    dispatch({ type: 'CLEAR_SEARCH_FILTERS' });
  }, []);

  const setLoading = useCallback((loading: boolean): void => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null): void => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Comparison actions
  const addToCompare = useCallback((property: CompareProperty): void => {
    try {
      dispatch({ type: 'ADD_TO_COMPARE', payload: property });
    } catch (error) {
      handleError(error, 'addToCompare');
    }
  }, [handleError]);

  const removeFromCompare = useCallback((propertyId: string): void => {
    dispatch({ type: 'REMOVE_FROM_COMPARE', payload: propertyId });
  }, []);

  const clearCompare = useCallback((): void => {
    dispatch({ type: 'CLEAR_COMPARE' });
  }, []);

  const toggleCompare = useCallback((property: CompareProperty): void => {
    try {
      const normalizedProperty = normalizePropertyForComparison(property);
      if (!normalizedProperty) {
        handleError('Invalid property data', 'toggleCompare');
        return;
      }

      const propertyId = getPropertyId(normalizedProperty);
      const isInCompare = state.compareList.some(p => getPropertyId(p) === propertyId);
      
      if (isInCompare) {
        removeFromCompare(propertyId);
      } else {
        addToCompare(normalizedProperty);
      }
    } catch (error) {
      handleError(error, 'toggleCompare');
    }
  }, [state.compareList, addToCompare, removeFromCompare, handleError]);

  const isInCompare = useCallback((propertyId: string): boolean => {
    return state.compareList.some(p => getPropertyId(p) === propertyId);
  }, [state.compareList]);

  const replaceInCompare = useCallback((oldPropertyId: string, newProperty: CompareProperty): void => {
    try {
      dispatch({ type: 'REPLACE_IN_COMPARE', payload: { oldPropertyId, newProperty } });
    } catch (error) {
      handleError(error, 'replaceInCompare');
    }
  }, [handleError]);

  const reorderCompare = useCallback((fromIndex: number, toIndex: number): void => {
    dispatch({ type: 'REORDER_COMPARE', payload: { fromIndex, toIndex } });
  }, []);

  const addMultipleToCompare = useCallback((properties: CompareProperty[]): void => {
    try {
      const normalizedProperties = properties
        .map(normalizePropertyForComparison)
        .filter((p): p is CompareProperty => p !== null);

      const availableSlots = state.maxCompareItems - state.compareList.length;
      const newProperties = normalizedProperties
        .filter(p => !state.compareList.some(existing => getPropertyId(existing) === getPropertyId(p)))
        .slice(0, availableSlots);

      if (newProperties.length > 0) {
        const updatedCompareList = [...state.compareList, ...newProperties];
        dispatch({ type: 'SET_COMPARE_LIST', payload: updatedCompareList });
      }
    } catch (error) {
      handleError(error, 'addMultipleToCompare');
    }
  }, [state.compareList, state.maxCompareItems, handleError]);

  const removeMultipleFromCompare = useCallback((propertyIds: string[]): void => {
    const updatedCompareList = state.compareList.filter(p => !propertyIds.includes(getPropertyId(p)));
    dispatch({ type: 'SET_COMPARE_LIST', payload: updatedCompareList });
  }, [state.compareList]);

  // Comparison utility functions
  const getCommonFeatures = useCallback((): string[] => {
    if (state.compareList.length === 0) return [];

    const allFeatures = state.compareList.map((p) => Object.keys(p));
    return allFeatures.reduce(
      (common, features) => common.filter((feature) => features.includes(feature)),
      allFeatures[0] || []
    );
  }, [state.compareList]);

  const getDifferentFeatures = useCallback((): string[] => {
    if (state.compareList.length === 0) return [];

    const commonFeatures = getCommonFeatures();
    const allUniqueFeatures = new Set<string>();

    state.compareList.forEach((property) => {
      Object.keys(property).forEach((key) => {
        if (!commonFeatures.includes(key)) {
          allUniqueFeatures.add(key);
        }
      });
    });

    return Array.from(allUniqueFeatures);
  }, [state.compareList, getCommonFeatures]);

  const getPropertyComparison = useCallback((): ComparisonResult[] => {
    if (state.compareList.length === 0) return [];

    const commonFeatures = getCommonFeatures();

    return commonFeatures.map((feature) => {
      const values = state.compareList.map((property) => ({
        propertyId: getPropertyId(property),
        value:
          feature in property ?
            Object.getOwnPropertyDescriptor(
              property as unknown as Record<string, unknown>,
              feature
            )?.value
          : undefined,
        propertyName: property.title || `Property ${property.id}`,
      }));

      const uniqueValues = [...new Set(values.map((v) => v.value))];
      const allSame = uniqueValues.length === 1;

      return {
        feature,
        values,
        allSame,
        uniqueValues,
      };
    });
  }, [state.compareList, getCommonFeatures]);

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

    const prices = state.compareList
      .map((p) => p.price)
      .filter((price): price is number => typeof price === "number" && !isNaN(price));

    const averagePrice =
      prices.length > 0 ?
        prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const mostExpensive =
      prices.length > 0 ?
        (state.compareList.find((p) => p.price === maxPrice) ?? null)
      : null;
    const leastExpensive =
      prices.length > 0 ?
        (state.compareList.find((p) => p.price === minPrice) ?? null)
      : null;

    return {
      totalProperties: state.compareList.length,
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      commonFeatures: getCommonFeatures().length,
      uniqueFeatures: getDifferentFeatures().length,
      mostExpensive,
      leastExpensive,
    };
  }, [state.compareList, getCommonFeatures, getDifferentFeatures]);

  const getComparePriceRange = useCallback(() => {
    const prices = state.compareList
      .map((p) => p.price)
      .filter((price): price is number => typeof price === "number" && !isNaN(price));

    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { min, max, average };
  }, [state.compareList]);

  // Comparison persistence functions
  const exportComparison = useCallback((): string => {
    return JSON.stringify({
      properties: state.compareList,
      timestamp: new Date().toISOString(),
      version: "1.0",
    });
  }, [state.compareList]);

  const importComparison = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data) as { properties?: unknown[] };
      if (parsed.properties && Array.isArray(parsed.properties)) {
        const normalizedProperties = parsed.properties
          .map(normalizePropertyForComparison)
          .filter((p): p is CompareProperty => p !== null);

        if (normalizedProperties.length > 0) {
          dispatch({ type: 'SET_COMPARE_LIST', payload: normalizedProperties });
          return true;
        }
      }
      return false;
    } catch (error) {
      handleError(error, 'importComparison');
      return false;
    }
  }, [handleError]);

  const getShareableCompareUrl = useCallback((): string => {
    const propertyIds = state.compareList
      .map((p) => getPropertyId(p))
      .join(",");
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?compare=${encodeURIComponent(propertyIds)}`;
  }, [state.compareList]);

  // Derived state
  const favoriteProperties = useMemo(() => {
    return state.properties.filter(property => state.favorites.includes(String(property.id)));
  }, [state.properties, state.favorites]);

  const filteredProperties = useMemo(() => {
    return state.properties.filter(property => matchesFilter(property, state.searchFilters));
  }, [state.properties, state.searchFilters]);

  const isFavorite = useCallback((propertyId: string): boolean => {
    return state.favorites.includes(propertyId);
  }, [state.favorites]);

  const hasFilters = useMemo(() => {
    return Object.entries(state.searchFilters).some(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (key === 'priceRange' && typeof value === 'object') {
        return value.min !== undefined || value.max !== undefined;
      }
      return true;
    });
  }, [state.searchFilters]);

  // Comparison derived state
  const canAddToCompare = state.compareList.length < state.maxCompareItems;
  const compareCount = state.compareList.length;
  const hasComparisons = compareCount > 0;
  const isCompareListFull = compareCount >= state.maxCompareItems;

  const value: PropertyContextType = useMemo(() => ({
    ...state,
    // Core actions
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
    // Comparison actions
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
    // Comparison utilities
    getCommonFeatures,
    getDifferentFeatures,
    getPropertyComparison,
    getCompareStats,
    getComparePriceRange,
    // Comparison persistence
    exportComparison,
    importComparison,
    getShareableCompareUrl,
    // Derived state
    favoriteProperties,
    filteredProperties,
    isFavorite,
    hasFilters,
    totalProperties: state.properties.length,
    favoriteCount: state.favorites.length,
    compareCount,
    hasComparisons,
    isCompareListFull,
  }), [
    state, setProperties, setSelectedProperty, addToFavorites, removeFromFavorites, 
    toggleFavorite, setSearchFilters, updateSearchFilters, clearSearchFilters,
    setLoading, setError, clearError, addToCompare, removeFromCompare, clearCompare,
    toggleCompare, isInCompare, canAddToCompare, replaceInCompare, reorderCompare,
    addMultipleToCompare, removeMultipleFromCompare, getCommonFeatures, getDifferentFeatures,
    getPropertyComparison, getCompareStats, getComparePriceRange, exportComparison,
    importComparison, getShareableCompareUrl, favoriteProperties, filteredProperties, 
    isFavorite, hasFilters, compareCount, hasComparisons, isCompareListFull
  ]);

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const usePropertyContext = (): PropertyContextType => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
};

// Specialized hooks for different concerns
export const usePropertyState = () => {
  const {
    properties, selectedProperty, favorites, isLoading, error, searchFilters,
    favoriteProperties, filteredProperties, totalProperties, favoriteCount, hasFilters
  } = usePropertyContext();

  return {
    properties, selectedProperty, favorites, isLoading, error, searchFilters,
    favoriteProperties, filteredProperties, totalProperties, favoriteCount, hasFilters,
    isEmpty: properties.length === 0,
    hasError: error !== null,
    hasFavorites: favorites.length > 0,
    hasSelection: selectedProperty !== null
  };
};

export const usePropertyActions = () => {
  const {
    setProperties, setSelectedProperty, addToFavorites, removeFromFavorites, toggleFavorite,
    setSearchFilters, updateSearchFilters, clearSearchFilters, setLoading, setError, clearError
  } = usePropertyContext();

  return {
    setProperties, setSelectedProperty, addToFavorites, removeFromFavorites, toggleFavorite,
    setSearchFilters, updateSearchFilters, clearSearchFilters, setLoading, setError, clearError
  };
};

export const usePropertyFilters = () => {
  const {
    searchFilters, filteredProperties, setSearchFilters, updateSearchFilters, clearSearchFilters, hasFilters
  } = usePropertyContext();

  return {
    filters: searchFilters,
    filteredProperties,
    setFilters: setSearchFilters,
    updateFilters: updateSearchFilters,
    clearFilters: clearSearchFilters,
    hasFilters,
    resultCount: filteredProperties.length
  };
};

export const useFavorites = () => {
  const {
    favorites, favoriteProperties, favoriteCount, isFavorite, addToFavorites, removeFromFavorites, toggleFavorite
  } = usePropertyContext();

  return {
    favorites, favoriteProperties, favoriteCount, isFavorite, addToFavorites, removeFromFavorites, toggleFavorite,
    hasFavorites: favorites.length > 0
  };
};

// Comparison hooks for backward compatibility and specialized use cases
export const usePropertyCompare = () => {
  const {
    compareList, addToCompare, removeFromCompare, clearCompare, toggleCompare, isInCompare,
    canAddToCompare, maxCompareItems, compareCount, hasComparisons, isCompareListFull
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
    isEmpty: compareCount === 0
  };
};

export const usePropertyCompareActions = () => {
  const {
    addToCompare, removeFromCompare, clearCompare, toggleCompare, replaceInCompare,
    reorderCompare, addMultipleToCompare, removeMultipleFromCompare
  } = usePropertyContext();

  return {
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleProperty: toggleCompare,
    replaceProperty: replaceInCompare,
    reorderProperties: reorderCompare,
    addMultiple: addMultipleToCompare,
    removeMultiple: removeMultipleFromCompare
  };
};

export const usePropertyCompareAnalysis = () => {
  const {
    getCommonFeatures, getDifferentFeatures, getPropertyComparison, getCompareStats, getComparePriceRange
  } = usePropertyContext();

  return {
    getCommonFeatures,
    getDifferentFeatures,
    getPropertyComparison,
    getStats: getCompareStats,
    getPriceRange: getComparePriceRange
  };
};

export const usePropertyCompareState = () => {
  const {
    compareList, canAddToCompare, maxCompareItems, isInCompare, compareCount, hasComparisons, isCompareListFull
  } = usePropertyContext();

  return {
    selectedProperties: compareList,
    canAddMore: canAddToCompare,
    maxProperties: maxCompareItems,
    isSelected: isInCompare,
    count: compareCount,
    hasComparisons,
    isFull: isCompareListFull,
    isEmpty: compareCount === 0
  };
};