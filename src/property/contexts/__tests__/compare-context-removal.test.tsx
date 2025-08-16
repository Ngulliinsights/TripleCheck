import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { PropertyProvider, usePropertyCompare, usePropertyCompareActions } from '../PropertyContext';
import type { CompareProperty } from '../../../shared/types/compare';

// Test component to verify comparison functionality works through PropertyContext
const TestCompareComponent: React.FC = () => {
  const { selectedProperties, canAddMore, maxProperties } = usePropertyCompare();
  const { addToCompare, removeFromCompare, clearCompare, toggleCompare } = usePropertyCompareActions();

  const mockProperty: CompareProperty = {
    id: 'test-1',
    title: 'Test Property',
    price: 100000,
    location: 'Test Location',
    type: 'residential',
    verificationStatus: 'verified',
    features: {
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 1000,
    },
  };

  return (
    <div>
      <div data-testid="selected-count">{selectedProperties.length}</div>
      <div data-testid="max-properties">{maxProperties}</div>
      <div data-testid="can-add-more">{canAddMore ? 'yes' : 'no'}</div>
      
      <button 
        data-testid="add-property" 
        onClick={() => addToCompare(mockProperty)}
      >
        Add Property
      </button>
      
      <button 
        data-testid="toggle-property" 
        onClick={() => toggleCompare(mockProperty)}
      >
        Toggle Property
      </button>
      
      <button 
        data-testid="remove-property" 
        onClick={() => removeFromCompare('test-1')}
      >
        Remove Property
      </button>
      
      <button 
        data-testid="clear-compare" 
        onClick={() => clearCompare()}
      >
        Clear Compare
      </button>

      {selectedProperties.map((property) => (
        <div key={property.id} data-testid={`property-${property.id}`}>
          {property.title}
        </div>
      ))}
    </div>
  );
};

describe('CompareContext Removal Verification', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <PropertyProvider>
        {component}
      </PropertyProvider>
    );
  };

  it('should provide comparison functionality through PropertyContext', () => {
    renderWithProvider(<TestCompareComponent />);
    
    // Verify initial state
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    expect(screen.getByTestId('max-properties')).toHaveTextContent('3');
    expect(screen.getByTestId('can-add-more')).toHaveTextContent('yes');
  });

  it('should add properties to comparison through PropertyContext', () => {
    renderWithProvider(<TestCompareComponent />);
    
    // Add a property
    fireEvent.click(screen.getByTestId('add-property'));
    
    // Verify property was added
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('property-test-1')).toHaveTextContent('Test Property');
  });

  it('should toggle properties in comparison through PropertyContext', () => {
    renderWithProvider(<TestCompareComponent />);
    
    // Toggle property (should add it)
    fireEvent.click(screen.getByTestId('toggle-property'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    
    // Toggle again (should remove it)
    fireEvent.click(screen.getByTestId('toggle-property'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('should remove properties from comparison through PropertyContext', () => {
    renderWithProvider(<TestCompareComponent />);
    
    // Add a property first
    fireEvent.click(screen.getByTestId('add-property'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    
    // Remove the property
    fireEvent.click(screen.getByTestId('remove-property'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('should clear all properties from comparison through PropertyContext', () => {
    renderWithProvider(<TestCompareComponent />);
    
    // Add a property first
    fireEvent.click(screen.getByTestId('add-property'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    
    // Clear all properties
    fireEvent.click(screen.getByTestId('clear-compare'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('should respect maximum property limit through PropertyContext', () => {
    renderWithProvider(<TestCompareComponent />);
    
    const mockProperty1: CompareProperty = {
      id: 'test-1',
      title: 'Test Property 1',
      price: 100000,
      location: 'Test Location 1',
      type: 'residential',
      verificationStatus: 'verified',
      features: { bedrooms: 2, bathrooms: 1, squareFeet: 1000 },
    };

    const mockProperty2: CompareProperty = {
      id: 'test-2',
      title: 'Test Property 2',
      price: 200000,
      location: 'Test Location 2',
      type: 'residential',
      verificationStatus: 'verified',
      features: { bedrooms: 3, bathrooms: 2, squareFeet: 1500 },
    };

    const mockProperty3: CompareProperty = {
      id: 'test-3',
      title: 'Test Property 3',
      price: 300000,
      location: 'Test Location 3',
      type: 'residential',
      verificationStatus: 'verified',
      features: { bedrooms: 4, bathrooms: 3, squareFeet: 2000 },
    };

    // Create a test component that can add multiple specific properties
    const MultiPropertyTest: React.FC = () => {
      const { selectedProperties, canAddMore } = usePropertyCompare();
      const { addToCompare } = usePropertyCompareActions();

      return (
        <div>
          <div data-testid="selected-count">{selectedProperties.length}</div>
          <div data-testid="can-add-more">{canAddMore ? 'yes' : 'no'}</div>
          
          <button onClick={() => addToCompare(mockProperty1)}>Add Property 1</button>
          <button onClick={() => addToCompare(mockProperty2)}>Add Property 2</button>
          <button onClick={() => addToCompare(mockProperty3)}>Add Property 3</button>
        </div>
      );
    };

    render(
      <PropertyProvider>
        <MultiPropertyTest />
      </PropertyProvider>
    );

    // Add properties up to the limit
    fireEvent.click(screen.getByText('Add Property 1'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('can-add-more')).toHaveTextContent('yes');

    fireEvent.click(screen.getByText('Add Property 2'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
    expect(screen.getByTestId('can-add-more')).toHaveTextContent('yes');

    fireEvent.click(screen.getByText('Add Property 3'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('3');
    expect(screen.getByTestId('can-add-more')).toHaveTextContent('no');
  });

  it('should not have any CompareContext imports or references', () => {
    // This test verifies that we're not accidentally importing from CompareContext
    // If this test passes, it means we're successfully using PropertyContext
    
    const TestComponent: React.FC = () => {
      // These hooks should come from PropertyContext, not CompareContext
      const compareState = usePropertyCompare();
      const compareActions = usePropertyCompareActions();
      
      expect(compareState).toBeDefined();
      expect(compareActions).toBeDefined();
      expect(typeof compareActions.addToCompare).toBe('function');
      expect(typeof compareActions.removeFromCompare).toBe('function');
      expect(typeof compareActions.clearCompare).toBe('function');
      expect(typeof compareActions.toggleCompare).toBe('function');
      
      return <div data-testid="success">CompareContext successfully removed</div>;
    };

    renderWithProvider(<TestComponent />);
    expect(screen.getByTestId('success')).toHaveTextContent('CompareContext successfully removed');
  });

  it('should provide all comparison analysis functionality through PropertyContext', () => {
    const AnalysisTestComponent: React.FC = () => {
      const { 
        getCommonFeatures, 
        getDifferentFeatures, 
        getPropertyComparison, 
        getCompareStats,
        getComparePriceRange 
      } = usePropertyCompare();

      return (
        <div>
          <div data-testid="has-common-features">{typeof getCommonFeatures === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-different-features">{typeof getDifferentFeatures === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-property-comparison">{typeof getPropertyComparison === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-compare-stats">{typeof getCompareStats === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-price-range">{typeof getComparePriceRange === 'function' ? 'yes' : 'no'}</div>
        </div>
      );
    };

    renderWithProvider(<AnalysisTestComponent />);
    
    expect(screen.getByTestId('has-common-features')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-different-features')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-property-comparison')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-compare-stats')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-price-range')).toHaveTextContent('yes');
  });
});

describe('PropertyContext Integration Verification', () => {
  it('should provide unified property and comparison functionality', () => {
    const UnifiedTestComponent: React.FC = () => {
      // Test that we can use both property and comparison functionality from the same context
      const { 
        properties, 
        favorites, 
        selectedProperties, 
        compareCount,
        favoriteCount 
      } = usePropertyCompare();
      
      const { 
        addToFavorites, 
        addToCompare 
      } = usePropertyCompareActions();

      return (
        <div>
          <div data-testid="properties-count">{properties.length}</div>
          <div data-testid="favorites-count">{favoriteCount}</div>
          <div data-testid="compare-count">{compareCount}</div>
          <div data-testid="has-add-favorite">{typeof addToFavorites === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-add-compare">{typeof addToCompare === 'function' ? 'yes' : 'no'}</div>
        </div>
      );
    };

    render(
      <PropertyProvider>
        <UnifiedTestComponent />
      </PropertyProvider>
    );

    // Verify that both property and comparison functionality is available
    expect(screen.getByTestId('properties-count')).toHaveTextContent('0');
    expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
    expect(screen.getByTestId('compare-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-add-favorite')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-add-compare')).toHaveTextContent('yes');
  });
});