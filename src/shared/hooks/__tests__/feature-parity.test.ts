/**
 * Feature Parity Tests
 * 
 * These tests ensure that consolidated hooks provide all original features
 * and that enhanced features work correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Import consolidated hooks
import { 
  useFormValidation, 
  usePropertyFormValidation, 
  useUserRegistrationValidation,
  createPropertyFormConfig,
  createUserRegistrationFormConfig
} from '../useFormValidation'
import { 
  useSafeQuery, 
  useSafePropertiesQuery, 
  useSafePropertyQuery,
  useSafeOwnerPropertiesQuery,
  useSafePropertyActionsQuery,
  useSafePropertySearchQuery
} from '../useSafeQuery'
import { useComponentPerformance } from '../useComponentPerformance'
import { usePagination } from '../usePagination'
import { useAccessibility } from '../useAccessibility'
import { 
  useConfigurableHook,
  createDataFetchingHook,
  createFormValidationHook
} from '../useConfigurableHook'

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Feature Parity Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      headers: new Headers(),
      status: 200,
      statusText: 'OK'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Validation Feature Parity', () => {
    it('should provide all original useForm features', () => {
      const { result } = renderHook(() => 
        useFormValidation({
          name: {
            initialValue: '',
            rules: { required: 'Name is required' }
          },
          email: {
            initialValue: '',
            rules: { email: 'Invalid email' }
          }
        })
      );

      // Original features
      expect(result.current.values).toEqual({ name: '', email: '' });
      expect(result.current.errors).toEqual({});
      expect(result.current.handleChange).toBeTypeOf('function');
      expect(result.current.handleSubmit).toBeTypeOf('function');
      expect(result.current.isValid).toBeTypeOf('boolean');
      expect(result.current.reset).toBeTypeOf('function');
      expect(result.current.setFieldValue).toBeTypeOf('function');
      expect(result.current.setFieldError).toBeTypeOf('function');
    });

    it('should provide enhanced form features', () => {
      const { result } = renderHook(() => 
        useFormValidation({
          name: {
            initialValue: '',
            rules: { required: 'Name is required' }
          }
        })
      );

      // Enhanced features
      expect(result.current.isDirty).toBeTypeOf('boolean');
      expect(result.current.isSubmitting).toBeTypeOf('boolean');
      expect(result.current.submitCount).toBeTypeOf('number');
      expect(result.current.validateForm).toBeTypeOf('function');
      expect(result.current.validateField).toBeTypeOf('function');
      
      // File upload integration
      expect(result.current.fileUpload).toBeTypeOf('object');
      expect(result.current.fileUpload.uploadFile).toBeTypeOf('function');
      expect(result.current.fileUpload.uploadProgress).toBeTypeOf('object');
      expect(result.current.fileUpload.uploadedFiles).toBeTypeOf('object');
    });

    it('should handle complex validation rules', async () => {
      const { result } = renderHook(() => 
        useFormValidation({
          password: {
            initialValue: '',
            rules: {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              custom: (value) => {
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumbers = /\d/.test(value);
                return (hasUpperCase && hasLowerCase && hasNumbers) || 'Password must contain uppercase, lowercase, and numbers';
              }
            },
            validateOnChange: true
          }
        })
      );

      // Test weak password
      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: 'weak' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await waitFor(() => {
        expect(result.current.errors.password).toBeTruthy();
      });

      // Test strong password
      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: 'StrongPass123' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await waitFor(() => {
        expect(result.current.errors.password).toBeFalsy();
      });
    });

    it('should handle async validation', async () => {
      const mockAsyncValidator = vi.fn().mockResolvedValue(true);

      const { result } = renderHook(() => 
        useFormValidation({
          email: {
            initialValue: '',
            rules: {
              required: 'Email is required',
              asyncValidator: mockAsyncValidator
            },
            validateOnBlur: true,
            debounceMs: 100
          }
        })
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Trigger blur to start async validation
      act(() => {
        result.current.handleBlur({
          target: { name: 'email' }
        } as React.FocusEvent<HTMLInputElement>);
      });

      await waitFor(() => {
        expect(mockAsyncValidator).toHaveBeenCalledWith('test@example.com', result.current.values);
      });
    });

    it('should provide property-specific form validation', () => {
      const { result } = renderHook(() => usePropertyFormValidation());

      // Check property-specific fields
      expect(result.current.values).toHaveProperty('title');
      expect(result.current.values).toHaveProperty('description');
      expect(result.current.values).toHaveProperty('price');
      expect(result.current.values).toHaveProperty('location');
      expect(result.current.values).toHaveProperty('bedrooms');
      expect(result.current.values).toHaveProperty('bathrooms');
      expect(result.current.values).toHaveProperty('propertyType');
      expect(result.current.values).toHaveProperty('contactEmail');
      expect(result.current.values).toHaveProperty('contactPhone');
    });

    it('should provide user registration form validation', () => {
      const { result } = renderHook(() => useUserRegistrationValidation());

      // Check user registration fields
      expect(result.current.values).toHaveProperty('firstName');
      expect(result.current.values).toHaveProperty('lastName');
      expect(result.current.values).toHaveProperty('email');
      expect(result.current.values).toHaveProperty('password');
      expect(result.current.values).toHaveProperty('confirmPassword');
      expect(result.current.values).toHaveProperty('phone');
      expect(result.current.values).toHaveProperty('agreeToTerms');
    });
  });

  describe('Data Fetching Feature Parity', () => {
    it('should provide all original data fetching features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      // Original features
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBeTypeOf('boolean');
      expect(result.current.error).toBeDefined();
      expect(result.current.refetch).toBeTypeOf('function');
      expect(result.current.isError).toBeTypeOf('boolean');
      expect(result.current.isSuccess).toBeTypeOf('boolean');
    });

    it('should provide enhanced data fetching features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      // Enhanced features
      expect(result.current.hasValidData).toBeTypeOf('boolean');
      expect(result.current.originalData).toBeDefined();
      expect(result.current.cancelRequest).toBeTypeOf('function');
      expect(result.current.activeOperations).toBeTypeOf('object');
      expect(result.current.requestStats).toBeDefined();
    });

    it('should handle request deduplication', async () => {
      const wrapper = createWrapper();
      
      // Make multiple identical requests
      const { result: result1 } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );
      
      const { result: result2 } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Both should have the same data (deduplicated)
      expect(result1.current.data).toEqual(result2.current.data);
    });

    it('should handle circuit breaker pattern', async () => {
      // Mock multiple failures
      (global.fetch as any).mockRejectedValue(new Error('Network Error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'test' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have fallback data and error
      expect(result.current.data).toEqual([]);
      expect(result.current.hasValidData).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should provide property-specific query features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertyQuery('123'), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Property-specific features
      expect(result.current.data).toBeDefined();
      expect(result.current.hasValidData).toBeTypeOf('boolean');
    });

    it('should provide owner properties query features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafeOwnerPropertiesQuery('owner123'), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should provide property search query features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertySearchQuery({ query: 'apartment', location: 'Nairobi' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveProperty('data');
      expect(result.current.data).toHaveProperty('total');
      expect(result.current.data).toHaveProperty('hasNext');
      expect(result.current.data).toHaveProperty('hasPrev');
    });
  });

  describe('Performance Monitoring Feature Parity', () => {
    it('should provide all original performance monitoring features', () => {
      const { result } = renderHook(() => 
        useComponentPerformance({
          componentName: 'TestComponent'
        })
      );

      // Original features
      expect(result.current.metrics).toBeTypeOf('object');
      expect(result.current.metrics.renderTime).toBeTypeOf('number');
      expect(result.current.metrics.renderCount).toBeTypeOf('number');
    });

    it('should provide enhanced performance monitoring features', () => {
      const { result } = renderHook(() => 
        useComponentPerformance({
          componentName: 'TestComponent',
          trackRenderTime: true,
          trackMemoryUsage: true,
          trackNetworkRequests: true
        })
      );

      // Enhanced features
      expect(result.current.startTiming).toBeTypeOf('function');
      expect(result.current.endTiming).toBeTypeOf('function');
      expect(result.current.trackRender).toBeTypeOf('function');
      expect(result.current.trackMemory).toBeTypeOf('function');
      expect(result.current.trackNetworkRequest).toBeTypeOf('function');
      expect(result.current.withPerformanceMonitor).toBeTypeOf('function');
    });

    it('should track render performance', () => {
      const { result, rerender } = renderHook(() => 
        useComponentPerformance({
          componentName: 'TestComponent',
          trackRenderTime: true
        })
      );

      const initialRenderCount = result.current.metrics.renderCount;

      // Trigger re-render
      rerender();

      expect(result.current.metrics.renderCount).toBe(initialRenderCount + 1);
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
    });

    it('should provide performance monitoring wrapper', () => {
      const { result } = renderHook(() => 
        useComponentPerformance({
          componentName: 'TestComponent'
        })
      );

      const mockOperation = vi.fn(() => 'result');
      const wrappedOperation = result.current.withPerformanceMonitor('testOp', mockOperation);

      const operationResult = wrappedOperation();

      expect(mockOperation).toHaveBeenCalled();
      expect(operationResult).toBe('result');
    });
  });

  describe('Pagination Feature Parity', () => {
    it('should provide all original paginated query features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'paginated'
        }), 
        { wrapper }
      );

      // Original features
      expect(result.current.data).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.setPage).toBeTypeOf('function');
      expect(result.current.hasNext).toBeTypeOf('boolean');
      expect(result.current.hasPrev).toBeTypeOf('boolean');
      expect(result.current.isLoading).toBeTypeOf('boolean');
    });

    it('should provide all original infinite scroll features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'infinite'
        }), 
        { wrapper }
      );

      // Original features
      expect(result.current.data).toEqual([]);
      expect(result.current.loadMore).toBeTypeOf('function');
      expect(result.current.hasMore).toBeTypeOf('boolean');
      expect(result.current.isLoading).toBeTypeOf('boolean');
    });

    it('should provide enhanced pagination features', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'paginated',
          pageSize: 10
        }), 
        { wrapper }
      );

      // Enhanced features
      expect(result.current.totalPages).toBeTypeOf('number');
      expect(result.current.totalItems).toBeTypeOf('number');
      expect(result.current.pageSize).toBe(10);
      expect(result.current.goToFirstPage).toBeTypeOf('function');
      expect(result.current.goToLastPage).toBeTypeOf('function');
    });

    it('should handle page navigation', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'paginated'
        }), 
        { wrapper }
      );

      expect(result.current.page).toBe(1);

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should handle infinite scroll loading', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        usePagination({
          endpoint: '/api/properties',
          mode: 'infinite'
        }), 
        { wrapper }
      );

      const initialDataLength = result.current.data.length;

      act(() => {
        result.current.loadMore();
      });

      // Should trigger loading state
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Accessibility Feature Parity', () => {
    it('should provide all original accessibility features', () => {
      const { result } = renderHook(() => useAccessibility());

      // Original features
      expect(result.current.trapFocus).toBeTypeOf('function');
      expect(result.current.announceLiveRegion).toBeTypeOf('function');
    });

    it('should provide enhanced accessibility features', () => {
      const { result } = renderHook(() => useAccessibility());

      // Enhanced features
      expect(result.current.restoreFocus).toBeTypeOf('function');
      expect(result.current.prefersReducedMotion).toBeTypeOf('boolean');
      expect(result.current.prefersHighContrast).toBeTypeOf('boolean');
      expect(result.current.prefersLargeText).toBeTypeOf('boolean');
      expect(result.current.keyboardNavigation).toBeTypeOf('object');
      expect(result.current.useKeyboardNavigation).toBeTypeOf('function');
    });

    it('should handle focus management', () => {
      const { result } = renderHook(() => useAccessibility());

      // Mock DOM elements
      const mockElement = document.createElement('div');
      const mockButton = document.createElement('button');
      mockElement.appendChild(mockButton);
      document.body.appendChild(mockElement);

      // Test focus trapping
      act(() => {
        result.current.trapFocus(mockElement);
      });

      // Test focus restoration
      act(() => {
        result.current.restoreFocus();
      });

      // Cleanup
      document.body.removeChild(mockElement);
    });

    it('should detect user preferences', () => {
      const { result } = renderHook(() => useAccessibility());

      // These would be based on actual media queries in a real environment
      expect(typeof result.current.prefersReducedMotion).toBe('boolean');
      expect(typeof result.current.prefersHighContrast).toBe('boolean');
      expect(typeof result.current.prefersLargeText).toBe('boolean');
    });
  });

  describe('Configuration-Based Features', () => {
    it('should provide configurable hook creation', () => {
      const config = {
        name: 'Test Hook',
        category: 'data-fetching' as const,
        endpoint: '/api/test',
        fallbackData: [],
      };

      const { result } = renderHook(() => useConfigurableHook(config));

      expect(result.current).toBeDefined();
    });

    it('should create data fetching hooks from configuration', () => {
      const config = {
        name: 'Custom Data Hook',
        category: 'data-fetching' as const,
        endpoint: '/api/custom',
        fallbackData: [],
        staleTime: 5000,
      };

      const useCustomHook = createDataFetchingHook(config);
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCustomHook(), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('should create form validation hooks from configuration', () => {
      const config = {
        name: 'Custom Form',
        category: 'form-validation' as const,
        fields: {
          customField: {
            initialValue: '',
            rules: { required: 'Field is required' }
          }
        }
      };

      const useCustomForm = createFormValidationHook(config);
      const { result } = renderHook(() => useCustomForm());

      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('errors');
      expect(result.current.values).toHaveProperty('customField');
    });

    it('should support configuration inheritance', () => {
      const baseConfig = createPropertyFormConfig();
      const extendedConfig = {
        ...baseConfig,
        customField: {
          initialValue: 'custom',
          rules: { required: 'Custom field is required' }
        }
      };

      const { result } = renderHook(() => useFormValidation(extendedConfig));

      // Should have all base fields plus custom field
      expect(result.current.values).toHaveProperty('title'); // Base field
      expect(result.current.values).toHaveProperty('customField'); // Extended field
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should provide comprehensive error information', async () => {
      // Mock API error with detailed response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          error: 'Validation failed',
          details: { field: 'Invalid value' }
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'invalid' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.hasValidData).toBe(false);
      expect(result.current.data).toEqual([]); // Fallback data
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock timeout
      (global.fetch as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => 
        useSafePropertiesQuery({ query: 'test' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 2000 });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Performance Optimizations', () => {
    it('should implement request deduplication', async () => {
      let fetchCallCount = 0;
      (global.fetch as any).mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [] }),
          headers: new Headers(),
          status: 200,
          statusText: 'OK'
        });
      });

      const wrapper = createWrapper();
      
      // Make multiple identical requests simultaneously
      const { result: result1 } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );
      
      const { result: result2 } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Should only make one fetch call due to deduplication
      expect(fetchCallCount).toBe(1);
    });

    it('should implement intelligent caching', async () => {
      const wrapper = createWrapper();
      const { result, rerender } = renderHook(() => 
        useSafePropertiesQuery({ query: 'apartment' }), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rerender should use cached data
      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });
});