import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';

import { useCompareError } from '../../shared/hooks/useCompareError';
import type { CompareProperty, CompareContextType, ComparisonResult, ComparisonStats } from '../../shared/types/compare';
import { 
  normalizePropertyForComparison,
  getCompareUrlParams 
} from '../../shared/utils/compare-utils';

// Using unified types from shared/types/compare.ts

const CompareContext = createContext<CompareContextType | undefined>(undefined);

// Made props readonly as suggested by SonarJS
interface CompareProviderProps {
  readonly children: ReactNode;
  readonly maxProperties?: number;
  readonly persistKey?: string; // For localStorage persistence
  readonly onSelectionChange?: (properties: CompareProperty[]) => void;
  readonly onMaxReached?: () => void;
  readonly onEmptyState?: () => void;
}

export function CompareProvider({ 
  children, 
  maxProperties = 3,
  persistKey,
  onSelectionChange,
  onMaxReached,
  onEmptyState
}: CompareProviderProps) {
  // Core state
  const [selectedProperties, setSelectedProperties] = useState<CompareProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Simplified history for basic undo/redo (disabled to prevent infinite loops)
  const history: CompareProperty[][] = [];
  const historyIndex = -1;
  
  // Use unified error handling
  const { error, setError, clearError, handleError } = useCompareError();

  // Load from localStorage on mount if persistKey is provided
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`compare-${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as unknown[];
          if (Array.isArray(parsed)) {
            const normalizedProperties = parsed
              .map(normalizePropertyForComparison)
              .filter((p): p is CompareProperty => p !== null);
            
            if (normalizedProperties.length > 0) {
              setSelectedProperties(normalizedProperties);
            }
          }
        } catch (error) {
          handleError(error, 'localStorage load');
        }
      }
    }
  }, [persistKey, handleError]);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (persistKey && selectedProperties.length > 0) {
      localStorage.setItem(`compare-${persistKey}`, JSON.stringify(selectedProperties));
    }
  }, [selectedProperties, persistKey]);



  // Trigger callbacks when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedProperties);
    
    if (selectedProperties.length === 0) {
      onEmptyState?.();
    }
  }, [selectedProperties, onSelectionChange, onEmptyState]);



  // Core functionality with enhanced features
  const addToCompare = useCallback((property: CompareProperty) => {
    try {
      const normalizedProperty = normalizePropertyForComparison(property);
      if (!normalizedProperty) {
        handleError('Invalid property data', 'addToCompare');
        return;
      }

      setSelectedProperties(prev => {
        if (prev.find(p => String(p.id) === String(normalizedProperty.id))) return prev;
        
        if (prev.length >= maxProperties) {
          onMaxReached?.();
          return prev;
        }
        
        // Don't call updateWithHistory inside setState - it causes infinite loops
        return [...prev, normalizedProperty];
      });
    } catch (error) {
      handleError(error, 'addToCompare');
    }
  }, [maxProperties, onMaxReached, handleError]);

  const removeFromCompare = useCallback((propertyId: string) => {
    setSelectedProperties(prev => prev.filter(p => String(p.id) !== propertyId));
  }, []);

  const clearCompare = useCallback(() => {
    setSelectedProperties([]);
  }, []);

  // New toggle functionality - adds if not present, removes if present
  const toggleProperty = useCallback((property: CompareProperty) => {
    try {
      const normalizedProperty = normalizePropertyForComparison(property);
      if (!normalizedProperty) {
        handleError('Invalid property data', 'toggleProperty');
        return;
      }

      if (selectedProperties.find(p => String(p.id) === String(normalizedProperty.id))) {
        removeFromCompare(String(normalizedProperty.id));
      } else {
        addToCompare(normalizedProperty);
      }
    } catch (error) {
      handleError(error, 'toggleProperty');
    }
  }, [selectedProperties, addToCompare, removeFromCompare, handleError]);

  // Replace one property with another while maintaining position
  const replaceProperty = useCallback((oldPropertyId: string, newProperty: CompareProperty) => {
    try {
      const normalizedProperty = normalizePropertyForComparison(newProperty);
      if (!normalizedProperty) {
        handleError('Invalid property data', 'replaceProperty');
        return;
      }

      setSelectedProperties(prev => prev.map(p => 
        String(p.id) === oldPropertyId ? normalizedProperty : p
      ));
    } catch (error) {
      handleError(error, 'replaceProperty');
    }
  }, [handleError]);

  // Reorder properties for custom comparison layouts
  const reorderProperties = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setSelectedProperties(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      
      const newProperties = [...prev];
      const [movedProperty] = newProperties.splice(fromIndex, 1);
      if (movedProperty) {
        newProperties.splice(toIndex, 0, movedProperty);
      }
      return newProperties;
    });
  }, []);

  // Bulk operations for power users
  const addMultiple = useCallback((properties: CompareProperty[]) => {
    try {
      const normalizedProperties = properties
        .map(normalizePropertyForComparison)
        .filter((p): p is CompareProperty => p !== null);

      setSelectedProperties(prev => {
        const availableSlots = maxProperties - prev.length;
        const toAdd = normalizedProperties
          .filter(p => !prev.find(existing => String(existing.id) === String(p.id)))
          .slice(0, availableSlots);
        
        if (normalizedProperties.length > availableSlots) {
          onMaxReached?.();
        }
        
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    } catch (error) {
      handleError(error, 'addMultiple');
    }
  }, [maxProperties, onMaxReached, handleError]);

  const removeMultiple = useCallback((propertyIds: string[]) => {
    setSelectedProperties(prev => prev.filter(p => !propertyIds.includes(String(p.id))));
  }, []);

  const replaceAll = useCallback((properties: CompareProperty[]) => {
    try {
      const normalizedProperties = properties
        .map(normalizePropertyForComparison)
        .filter((p): p is CompareProperty => p !== null)
        .slice(0, maxProperties);
      
      setSelectedProperties(normalizedProperties);
    } catch (error) {
      handleError(error, 'replaceAll');
    }
  }, [maxProperties, handleError]);

  // Advanced comparison analysis
  const getCommonFeatures = useCallback((): string[] => {
    if (selectedProperties.length === 0) return [];
    
    // Find features that exist in all selected properties
    const allFeatures = selectedProperties.map(p => Object.keys(p));
    // Added initial value to reduce() to fix SonarJS warning
    return allFeatures.reduce((common, features) => 
      common.filter(feature => features.includes(feature)), 
      allFeatures[0] || []
    );
  }, [selectedProperties]);

  const getDifferentFeatures = useCallback((): string[] => {
    if (selectedProperties.length === 0) return [];
    
    const commonFeatures = getCommonFeatures();
    const allUniqueFeatures = new Set<string>();
    
    selectedProperties.forEach(property => {
      Object.keys(property).forEach(key => {
        if (!commonFeatures.includes(key)) {
          allUniqueFeatures.add(key);
        }
      });
    });
    
    return Array.from(allUniqueFeatures);
  }, [selectedProperties, getCommonFeatures]);

  const getPropertyComparison = useCallback((): ComparisonResult[] => {
    if (selectedProperties.length === 0) return [];
    
    const commonFeatures = getCommonFeatures();
    
    return commonFeatures.map(feature => {
      const values = selectedProperties.map(property => ({
        propertyId: String(property.id),
        value: Object.prototype.hasOwnProperty.call(property, feature) 
          ? (property as unknown as Record<string, unknown>)[feature] 
          : undefined,
        propertyName: property.title || `Property ${property.id}`
      }));
      
      const uniqueValues = [...new Set(values.map(v => v.value))];
      const allSame = uniqueValues.length === 1;
      
      return {
        feature,
        values,
        allSame,
        uniqueValues
      };
    });
  }, [selectedProperties, getCommonFeatures]);

  // Data persistence and sharing
  const exportComparison = useCallback((): string => {
    return JSON.stringify({
      properties: selectedProperties,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
  }, [selectedProperties]);

  const importComparison = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data) as { properties?: unknown[] };
      if (parsed.properties && Array.isArray(parsed.properties)) {
        const normalizedProperties = parsed.properties
          .map(normalizePropertyForComparison)
          .filter((p): p is CompareProperty => p !== null);
        
        if (normalizedProperties.length > 0) {
          setSelectedProperties(normalizedProperties);
          return true;
        }
      }
      return false;
    } catch (error) {
      handleError(error, 'importComparison');
      return false;
    }
  }, [handleError]);

  const getShareableUrl = useCallback((): string => {
    const propertyIds = selectedProperties.map(p => String(p.id)).join(',');
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?compare=${encodeURIComponent(propertyIds)}`;
  }, [selectedProperties]);

  // Statistics and insights
  const getStats = useCallback((): ComparisonStats => {
    if (selectedProperties.length === 0) {
      return {
        totalProperties: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        commonFeatures: 0,
        uniqueFeatures: 0,
        mostExpensive: null,
        leastExpensive: null
      };
    }

    // Type-safe price extraction
    const prices = selectedProperties
      .map(p => p.price)
      .filter((price): price is number => typeof price === 'number' && !isNaN(price));
    
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const mostExpensive = prices.length > 0 ? 
      selectedProperties.find(p => p.price === maxPrice) ?? null : null;
    const leastExpensive = prices.length > 0 ? 
      selectedProperties.find(p => p.price === minPrice) ?? null : null;

    return {
      totalProperties: selectedProperties.length,
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      commonFeatures: getCommonFeatures().length,
      uniqueFeatures: getDifferentFeatures().length,
      mostExpensive,
      leastExpensive
    };
  }, [selectedProperties, getCommonFeatures, getDifferentFeatures]);

  const getPriceRange = useCallback(() => {
    const prices = selectedProperties
      .map(p => p.price)
      .filter((price): price is number => typeof price === 'number' && !isNaN(price));
    
    if (prices.length === 0) return null;
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return { min, max, average };
  }, [selectedProperties]);

  // History management for undo/redo (simplified - no actual functionality to prevent loops)
  const undo = useCallback(() => {
    // Disabled to prevent infinite loops
    console.warn('Undo functionality temporarily disabled');
  }, []);

  const redo = useCallback(() => {
    // Disabled to prevent infinite loops
    console.warn('Redo functionality temporarily disabled');
  }, []);

  // Derived state calculations
  const isSelected = useCallback((propertyId: string) => {
    return selectedProperties.some(p => String(p.id) === propertyId);
  }, [selectedProperties]);

  const getPropertyIndex = useCallback((propertyId: string) => {
    return selectedProperties.findIndex(p => String(p.id) === propertyId);
  }, [selectedProperties]);

  const canAddMore = selectedProperties.length < maxProperties;
  const canUndo = false; // Disabled to prevent infinite loops
  const canRedo = false; // Disabled to prevent infinite loops

  // Compose the complete context value with all functionality
  const value: CompareContextType = useMemo(() => ({
    // Core functionality
    selectedProperties,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isSelected,
    canAddMore,
    maxProperties,
    
    // Enhanced functionality
    toggleProperty,
    replaceProperty,
    reorderProperties,
    getPropertyIndex,
    
    // Bulk operations
    addMultiple,
    removeMultiple,
    replaceAll,
    
    // Comparison utilities
    getCommonFeatures,
    getDifferentFeatures,
    getPropertyComparison,
    
    // Persistence and sharing
    exportComparison,
    importComparison,
    getShareableUrl,
    
    // Statistics and insights
    getStats,
    getPriceRange,
    
    // History and undo
    history,
    canUndo,
    canRedo,
    undo,
    redo,
    
    // State flags
    isLoading,
    error: error?.message || null,
    
    // Event callbacks (now properly typed as optional)
    ...(onSelectionChange && { onSelectionChange }),
    ...(onMaxReached && { onMaxReached }),
    ...(onEmptyState && { onEmptyState })
  }), [
    selectedProperties, addToCompare, removeFromCompare, clearCompare, isSelected, canAddMore, maxProperties,
    toggleProperty, replaceProperty, reorderProperties, getPropertyIndex,
    addMultiple, removeMultiple, replaceAll,
    getCommonFeatures, getDifferentFeatures, getPropertyComparison,
    exportComparison, importComparison, getShareableUrl,
    getStats, getPriceRange,
    history, canUndo, canRedo, undo, redo,
    isLoading, error,
    onSelectionChange, onMaxReached, onEmptyState
  ]);

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}

// Specialized hooks for different use cases
export function useCompareActions() {
  const { 
    addToCompare, 
    removeFromCompare, 
    clearCompare, 
    toggleProperty,
    replaceProperty,
    reorderProperties,
    addMultiple,
    removeMultiple,
    replaceAll,
    undo,
    redo
  } = useCompare();
  
  return {
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleProperty,
    replaceProperty,
    reorderProperties,
    addMultiple,
    removeMultiple,
    replaceAll,
    undo,
    redo
  };
}

export function useCompareAnalysis() {
  const {
    getCommonFeatures,
    getDifferentFeatures,
    getPropertyComparison,
    getStats,
    getPriceRange
  } = useCompare();
  
  return {
    getCommonFeatures,
    getDifferentFeatures,
    getPropertyComparison,
    getStats,
    getPriceRange
  };
}

export function useCompareState() {
  const {
    selectedProperties,
    canAddMore,
    maxProperties,
    isSelected,
    getPropertyIndex,
    canUndo,
    canRedo,
    history
  } = useCompare();
  
  return {
    selectedProperties,
    canAddMore,
    maxProperties,
    isSelected,
    getPropertyIndex,
    canUndo,
    canRedo,
    history,
    isEmpty: selectedProperties.length === 0,
    isFull: selectedProperties.length >= maxProperties,
    count: selectedProperties.length
  };
}