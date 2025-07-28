import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Property } from '../../shared/types/property';

interface CompareContextType {
  selectedProperties: Property[];
  addToCompare: (property: Property) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isSelected: (propertyId: string) => boolean;
  canAddMore: boolean;
  maxProperties: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

interface CompareProviderProps {
  children: ReactNode;
  maxProperties?: number;
}

export function CompareProvider({ children, maxProperties = 3 }: CompareProviderProps) {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);

  const addToCompare = useCallback((property: Property) => {
    setSelectedProperties(prev => {
      // Don't add if already selected
      if (prev.find(p => p.id === property.id)) {
        return prev;
      }
      
      // Don't add if at max capacity
      if (prev.length >= maxProperties) {
        return prev;
      }
      
      return [...prev, property];
    });
  }, [maxProperties]);

  const removeFromCompare = useCallback((propertyId: string) => {
    setSelectedProperties(prev => prev.filter(p => p.id !== propertyId));
  }, []);

  const clearCompare = useCallback(() => {
    setSelectedProperties([]);
  }, []);

  const isSelected = useCallback((propertyId: string) => {
    return selectedProperties.some(p => p.id === propertyId);
  }, [selectedProperties]);

  const canAddMore = selectedProperties.length < maxProperties;

  const value: CompareContextType = {
    selectedProperties,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isSelected,
    canAddMore,
    maxProperties,
  };

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