import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '../SearchBar'

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search bar with all elements', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    // Check main search input
    expect(screen.getByPlaceholderText(/Search properties/)).toBeInTheDocument();
    
    // Check location input
    expect(screen.getByPlaceholderText(/Location/)).toBeInTheDocument();
    
    // Check property type selector
    expect(screen.getByText('Property Type')).toBeInTheDocument();
    
    // Check price range selector
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    
    // Check search button
    expect(screen.getByText('Search Properties')).toBeInTheDocument();
    
    // Check clear button
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls onSearch when search button is clicked', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search properties/);
    const searchButton = screen.getByText('Search Properties');
    
    // Enter search query
    fireEvent.change(searchInput, { target: { value: 'luxury apartment' } });
    
    // Click search button
    fireEvent.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('luxury apartment');
  });

  it('calls onSearch when Enter key is pressed', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search properties/);
    
    // Enter search query
    fireEvent.change(searchInput, { target: { value: 'house in Karen' } });
    
    // Press Enter key - need to trigger on the input that has the handler
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockOnSearch).toHaveBeenCalledWith('house in Karen');
  });

  it('combines multiple search criteria', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search properties/);
    const locationInput = screen.getByPlaceholderText(/Location/);
    const searchButton = screen.getByText('Search Properties');
    
    // Enter search criteria
    fireEvent.change(searchInput, { target: { value: '3 bedroom' } });
    fireEvent.change(locationInput, { target: { value: 'Westlands' } });
    
    // Click search button
    fireEvent.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('3 bedroom Westlands');
  });

  it('clears all search fields when clear button is clicked', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search properties/) as HTMLInputElement;
    const locationInput = screen.getByPlaceholderText(/Location/) as HTMLInputElement;
    const clearButton = screen.getByText('Clear');
    
    // Enter some data
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.change(locationInput, { target: { value: 'test location' } });
    
    // Verify data is entered
    expect(searchInput.value).toBe('test search');
    expect(locationInput.value).toBe('test location');
    
    // Click clear button
    fireEvent.click(clearButton);
    
    // Verify fields are cleared
    expect(searchInput.value).toBe('');
    expect(locationInput.value).toBe('');
  });

  it('shows search preview when criteria are entered', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search properties/);
    
    // Enter search query
    fireEvent.change(searchInput, { target: { value: 'apartment' } });
    
    // Check that search preview is shown
    expect(screen.getByText(/Search terms:/)).toBeInTheDocument();
    expect(screen.getByText(/apartment/)).toBeInTheDocument();
  });
});