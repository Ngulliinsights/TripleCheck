import React, { createContext, useContext, useReducer, ReactNode } from 'react';

import { Property } from '../types/property.types';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  searchFilters: PropertyFilters;
}

interface PropertyFilters {
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
  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  addToFavorites: (propertyId: string) => void;
  removeFromFavorites: (propertyId: string) => void;
  setSearchFilters: (filters: PropertyFilters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type PropertyAction =
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'SET_SELECTED_PROPERTY'; payload: Property | null }
  | { type: 'ADD_TO_FAVORITES'; payload: string }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string }
  | { type: 'SET_SEARCH_FILTERS'; payload: PropertyFilters }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: PropertyState = {
  properties: [],
  selectedProperty: null,
  favorites: JSON.parse(localStorage.getItem('propertyFavorites') || '[]'),
  isLoading: false,
  error: null,
  searchFilters: {},
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
      const newFavorites = [...state.favorites, action.payload];
      localStorage.setItem('propertyFavorites', JSON.stringify(newFavorites));
      return {
        ...state,
        favorites: newFavorites,
      };
    }
    case 'REMOVE_FROM_FAVORITES': {
      const newFavorites = state.favorites.filter(id => id !== action.payload);
      localStorage.setItem('propertyFavorites', JSON.stringify(newFavorites));
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
    default:
      return state;
  }
};

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

interface PropertyProviderProps {
  children: ReactNode;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(propertyReducer, initialState);

  const setProperties = (properties: Property[]): void => {
    dispatch({ type: 'SET_PROPERTIES', payload: properties });
  };

  const setSelectedProperty = (property: Property | null): void => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property });
  };

  const addToFavorites = (propertyId: string): void => {
    if (!state.favorites.includes(propertyId)) {
      dispatch({ type: 'ADD_TO_FAVORITES', payload: propertyId });
    }
  };

  const removeFromFavorites = (propertyId: string): void => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: propertyId });
  };

  const setSearchFilters = (filters: PropertyFilters): void => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters });
  };

  const setLoading = (loading: boolean): void => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null): void => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: PropertyContextType = {
    ...state,
    setProperties,
    setSelectedProperty,
    addToFavorites,
    removeFromFavorites,
    setSearchFilters,
    setLoading,
    setError,
    clearError,
  };

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