import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../shared/test-utils';
import ResidentialProperties from '../../pages/PropertiesResidential';

// Mock the performance monitor
vi.mock('../../utils/performanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    trackRender: vi.fn(),
    trackApiCall: vi.fn(),
  }),
}));

describe('Property Listing Integration', () => {
  it('renders property listing page without crashing', async () => {
    renderWithProviders(<ResidentialProperties />);
    
    // Check that the main heading is rendered
    expect(screen.getByText('Residential Properties')).toBeInTheDocument();
    
    // Check that search functionality is present
    expect(screen.getByPlaceholderText(/Search properties/)).toBeInTheDocument();
    
    // Check that filters are present
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Wait for properties to load (mock data should load quickly)
    await waitFor(() => {
      expect(screen.getByText(/Available Properties/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays property type filters', () => {
    renderWithProviders(<ResidentialProperties />);
    
    // Check that property type filters are rendered
    expect(screen.getByText(/Apartments/)).toBeInTheDocument();
    expect(screen.getByText(/Houses/)).toBeInTheDocument();
    expect(screen.getByText(/Villas/)).toBeInTheDocument();
  });

  it('displays popular areas filters', () => {
    renderWithProviders(<ResidentialProperties />);
    
    // Check that popular areas are rendered
    expect(screen.getByText('Westlands')).toBeInTheDocument();
    expect(screen.getByText('Karen')).toBeInTheDocument();
    expect(screen.getByText('Kilimani')).toBeInTheDocument();
  });
});