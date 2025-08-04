import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';

import { Property } from '../../shared/types/property';

// Enhanced interface with much more functionality
interface CompareContextType {
  // Core state management
  selectedProperties: Property[];
  addToCompare: (property: Property) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isSelected: (propertyId: string) => boolean;
  canAddMore: boolean;
  maxProperties: number;
  
  // Enhanced functionality
  toggleProperty: (property: Property) => void;
  replaceProperty: (oldPropertyId: string, newProperty: Property) => void;
  reorderProperties: (fromIndex: number, toIndex: number) => void;
  getPropertyIndex: (propertyId: string) => number;
  
  // Bulk operations
  addMultiple: (properties: Property[]) => void;
  removeMultiple: (propertyIds: string[]) => void;
  replaceAll: (properties: Property[]) => void;
  
  // Comparison utilities
  getCommonFeatures: () => string[];
  getDifferentFeatures: () => string[];
  getPropertyComparison: () => PropertyComparisonResult[];
  
  // Persistence and sharing
  exportComparison: () => string;
  importComparison: (data: string) => boolean;
  getShareableUrl: () => string;
  
  // Statistics and insights
  getStats: () => ComparisonStats;
  getPriceRange: () => { min: number; max: number; average: number } | null;
  
  // History and undo
  history: Property[][];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // Event callbacks - Made optional to match usage
  onSelectionChange?: (properties: Property[]) => void;
  onMaxReached?: () => void;
  onEmptyState?: () => void;
}

// Enhanced type definitions for comparison results
interface PropertyComparisonResult {
  feature: string;
  values: { propertyId: string; value: unknown; propertyName: string }[];
  allSame: boolean;
  uniqueValues: unknown[];
}

interface ComparisonStats {
  totalProperties: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  commonFeatures: number;
  uniqueFeatures: number;
  mostExpensive: Property | null;
  leastExpensive: Property | null;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

// Made props readonly as suggested by SonarJS
interface CompareProviderProps {
  readonly children: ReactNode;
  readonly maxProperties?: number;
  readonly persistKey?: string; // For localStorage persistence
  readonly onSelectionChange?: (properties: Property[]) => void;
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
  // Core state with history tracking for undo/redo
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [history, setHistory] = useState<Property[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load from localStorage on mount if persistKey is provided
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`compare-${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Property[];
          if (Array.isArray(parsed)) {
            setSelectedProperties(parsed);
            setHistory([parsed]);
            setHistoryIndex(0);
          }
        } catch (error) {
          // Using a more specific error message and avoiding console.warn in production
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to load saved comparison:', error);
          }
        }
      }
    }
  }, [persistKey]);

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

  // Helper function to update history for undo/redo functionality
  const updateWithHistory = useCallback((newProperties: Property[]) => {
    setSelectedProperties(newProperties);
    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newProperties);
      // Keep only last 20 states to prevent memory issues
      return newHistory.slice(-20);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  // Core functionality with enhanced features
  const addToCompare = useCallback((property: Property) => {
    setSelectedProperties(prev => {
      if (prev.find(p => String(p.id) === String(property.id))) return prev;
      
      if (prev.length >= maxProperties) {
        onMaxReached?.();
        return prev;
      }
      
      const newProperties = [...prev, property];
      updateWithHistory(newProperties);
      return newProperties;
    });
  }, [maxProperties, onMaxReached, updateWithHistory]);

  const removeFromCompare = useCallback((propertyId: string) => {
    const newProperties = selectedProperties.filter(p => String(p.id) !== propertyId);
    updateWithHistory(newProperties);
  }, [selectedProperties, updateWithHistory]);

  const clearCompare = useCallback(() => {
    updateWithHistory([]);
  }, [updateWithHistory]);

  // New toggle functionality - adds if not present, removes if present
  const toggleProperty = useCallback((property: Property) => {
    if (selectedProperties.find(p => String(p.id) === String(property.id))) {
      removeFromCompare(String(property.id));
    } else {
      addToCompare(property);
    }
  }, [selectedProperties, addToCompare, removeFromCompare]);

  // Replace one property with another while maintaining position
  const replaceProperty = useCallback((oldPropertyId: string, newProperty: Property) => {
    const newProperties = selectedProperties.map(p => 
      String(p.id) === oldPropertyId ? newProperty : p
    );
    updateWithHistory(newProperties);
  }, [selectedProperties, updateWithHistory]);

  // Reorder properties for custom comparison layouts
  const reorderProperties = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= selectedProperties.length) return;
    if (toIndex < 0 || toIndex >= selectedProperties.length) return;
    
    const newProperties = [...selectedProperties];
    const [movedProperty] = newProperties.splice(fromIndex, 1);
    if (movedProperty) {
      newProperties.splice(toIndex, 0, movedProperty);
      updateWithHistory(newProperties);
    }
  }, [selectedProperties, updateWithHistory]);

  // Bulk operations for power users
  const addMultiple = useCallback((properties: Property[]) => {
    const availableSlots = maxProperties - selectedProperties.length;
    const toAdd = properties
      .filter(p => !selectedProperties.find(existing => String(existing.id) === String(p.id)))
      .slice(0, availableSlots);
    
    if (toAdd.length > 0) {
      const newProperties = [...selectedProperties, ...toAdd];
      updateWithHistory(newProperties);
    }
    
    if (properties.length > availableSlots) {
      onMaxReached?.();
    }
  }, [selectedProperties, maxProperties, updateWithHistory, onMaxReached]);

  const removeMultiple = useCallback((propertyIds: string[]) => {
    const newProperties = selectedProperties.filter(p => !propertyIds.includes(String(p.id)));
    updateWithHistory(newProperties);
  }, [selectedProperties, updateWithHistory]);

  const replaceAll = useCallback((properties: Property[]) => {
    const limitedProperties = properties.slice(0, maxProperties);
    updateWithHistory(limitedProperties);
  }, [maxProperties, updateWithHistory]);

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

  const getPropertyComparison = useCallback((): PropertyComparisonResult[] => {
    if (selectedProperties.length === 0) return [];
    
    const commonFeatures = getCommonFeatures();
    
    return commonFeatures.map(feature => {
      const values = selectedProperties.map(property => ({
        propertyId: String(property.id), // Ensure propertyId is always a string
        value: Object.prototype.hasOwnProperty.call(property, feature) 
          ? (property as unknown as Record<string, unknown>)[feature] 
          : undefined,
        propertyName: String(
          (property as unknown as Record<string, unknown>).name || 
          (property as unknown as Record<string, unknown>).title || 
          `Property ${property.id}`
        )
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
      const parsed = JSON.parse(data) as { properties?: Property[] };
      if (parsed.properties && Array.isArray(parsed.properties)) {
        replaceAll(parsed.properties);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [replaceAll]);

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

    // Type-safe price extraction with proper type conversion
    const prices = selectedProperties
      .map(p => (p as unknown as Record<string, unknown>).price)
      .filter((price): price is number => typeof price === 'number');
    
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const mostExpensive = prices.length > 0 ? 
      selectedProperties.find(p => (p as unknown as Record<string, unknown>).price === maxPrice) ?? null : null;
    const leastExpensive = prices.length > 0 ? 
      selectedProperties.find(p => (p as unknown as Record<string, unknown>).price === minPrice) ?? null : null;

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
      .map(p => (p as unknown as Record<string, unknown>).price)
      .filter((price): price is number => typeof price === 'number');
    
    if (prices.length === 0) return null;
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return { min, max, average };
  }, [selectedProperties]);

  // History management for undo/redo
  const undo = useCallback(() => {
    if (historyIndex > 0 && historyIndex <= history.length) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (newIndex >= 0 && newIndex < history.length) {
        const previousState = history[newIndex];
        if (previousState) {
          setSelectedProperties(previousState);
        }
      }
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && historyIndex >= 0) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (newIndex >= 0 && newIndex < history.length) {
        const nextState = history[newIndex];
        if (nextState) {
          setSelectedProperties(nextState);
        }
      }
    }
  }, [history, historyIndex]);

  // Derived state calculations
  const isSelected = useCallback((propertyId: string) => {
    return selectedProperties.some(p => String(p.id) === propertyId);
  }, [selectedProperties]);

  const getPropertyIndex = useCallback((propertyId: string) => {
    return selectedProperties.findIndex(p => String(p.id) === propertyId);
  }, [selectedProperties]);

  const canAddMore = selectedProperties.length < maxProperties;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
    
    // Event callbacks (now properly typed as optional)
    onSelectionChange: onSelectionChange || undefined,
    onMaxReached: onMaxReached || undefined,
    onEmptyState: onEmptyState || undefined
  }), [
    selectedProperties, addToCompare, removeFromCompare, clearCompare, isSelected, canAddMore, maxProperties,
    toggleProperty, replaceProperty, reorderProperties, getPropertyIndex,
    addMultiple, removeMultiple, replaceAll,
    getCommonFeatures, getDifferentFeatures, getPropertyComparison,
    exportComparison, importComparison, getShareableUrl,
    getStats, getPriceRange,
    history, canUndo, canRedo, undo, redo,
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