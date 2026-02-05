import { renderHook } from '@testing-library/react'
import { usePropertyFormatting } from '../usePropertyFormatting'
import type { NormalizedProperty } from '../../types/property'

// Mock property for testing
const mockProperty: NormalizedProperty = {
  id: 'test-property-1',
  title: 'Test Property',
  price: 1000000,
  location: 'Nairobi, Kenya',
  description: 'A beautiful test property',
  images: [],
  type: 'residential',
  category: 'residential',
  features: {},
  verificationStatus: 'pending',
  trustScore: 85,
};

describe('usePropertyFormatting', () => {
  it('should format price correctly', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty)
    );

    expect(result.current.formattedPrice.primary).toBe('KES 1,000,000');
    expect(result.current.formattedPrice.secondary).toBe('~$7,692');
    expect(result.current.formattedPrice.hasDiscount).toBe(false);
    expect(result.current.formattedPrice.discountPercentage).toBe(0);
  });

  it('should handle string price', () => {
    const propertyWithStringPrice = {
      ...mockProperty,
      price: '1500000' as any,
    };

    const { result } = renderHook(() =>
      usePropertyFormatting(propertyWithStringPrice)
    );

    expect(result.current.formattedPrice.primary).toBe('KES 1,500,000');
    expect(result.current.formattedPrice.secondary).toBe('~$11,538');
  });

  it('should handle invalid price', () => {
    const propertyWithInvalidPrice = {
      ...mockProperty,
      price: 'invalid' as any,
    };

    const { result } = renderHook(() =>
      usePropertyFormatting(propertyWithInvalidPrice)
    );

    expect(result.current.formattedPrice.primary).toBe('Price on request');
    expect(result.current.formattedPrice.secondary).toBeUndefined();
  });

  it('should calculate discount correctly', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty, {
        originalPrice: 1200000,
      })
    );

    expect(result.current.formattedPrice.hasDiscount).toBe(true);
    expect(result.current.formattedPrice.discountPercentage).toBe(17); // (1200000 - 1000000) / 1200000 * 100
    expect(result.current.formattedPrice.originalPrice).toBe(1200000);
  });

  it('should handle no discount when original price is lower', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty, {
        originalPrice: 800000,
      })
    );

    expect(result.current.formattedPrice.hasDiscount).toBe(false);
    expect(result.current.formattedPrice.discountPercentage).toBe(0);
  });

  it('should format location string correctly', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty)
    );

    expect(result.current.locationString).toBe('Nairobi, Kenya');
  });

  it('should handle object location', () => {
    const propertyWithObjectLocation = {
      ...mockProperty,
      location: { address: 'Westlands, Nairobi' },
    };

    const { result } = renderHook(() =>
      usePropertyFormatting(propertyWithObjectLocation)
    );

    expect(result.current.locationString).toBe('Westlands, Nairobi');
  });

  it('should handle missing location', () => {
    const propertyWithoutLocation = {
      ...mockProperty,
      location: undefined as any,
    };

    const { result } = renderHook(() =>
      usePropertyFormatting(propertyWithoutLocation)
    );

    expect(result.current.locationString).toBe('Location not specified');
  });

  it('should format title correctly', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty)
    );

    expect(result.current.displayTitle).toBe('Test Property');
  });

  it('should handle missing title', () => {
    const propertyWithoutTitle = {
      ...mockProperty,
      title: undefined as any,
    };

    const { result } = renderHook(() =>
      usePropertyFormatting(propertyWithoutTitle)
    );

    expect(result.current.displayTitle).toBe('Untitled Property');
  });

  it('should format description correctly', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty)
    );

    expect(result.current.displayDescription).toBe('A beautiful test property');
  });

  it('should handle missing description', () => {
    const propertyWithoutDescription = {
      ...mockProperty,
      description: undefined,
    };

    const { result } = renderHook(() =>
      usePropertyFormatting(propertyWithoutDescription)
    );

    expect(result.current.displayDescription).toBe('');
  });

  it('should disable USD conversion when requested', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty, {
        showUSDConversion: false,
      })
    );

    expect(result.current.formattedPrice.secondary).toBeUndefined();
  });

  it('should use custom exchange rate', () => {
    const { result } = renderHook(() =>
      usePropertyFormatting(mockProperty, {
        exchangeRate: 100, // Custom rate
      })
    );

    expect(result.current.formattedPrice.secondary).toBe('~$10,000');
  });
});