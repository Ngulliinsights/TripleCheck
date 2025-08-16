/**
 * Test Configuration for Hook Consolidation Tests
 * 
 * This file provides common test utilities, mocks, and configurations
 * for testing consolidated hooks.
 */

import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import React from 'react';

// Test utilities
export const testUtils = {
  // Create a fresh QueryClient for each test
  createQueryClient: () => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  }),

  // Wait for async operations with timeout
  waitForAsync: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },

  // Create mock API responses
  createMockResponse: (data: any, options: { status?: number; delay?: number } = {}) => ({
    ok: options.status ? options.status < 400 : true,
    status: options.status || 200,
    statusText: options.status === 404 ? 'Not Found' : 'OK',
    json: async () => {
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      return data;
    },
    headers: new Headers(),
  }),

  // Create mock error response
  createMockError: (message: string, status = 500) => ({
    ok: false,
    status,
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
    json: async () => ({ error: message }),
    headers: new Headers(),
  }),
};

// Common mock data
export const mockData = {
  properties: [
    {
      id: '1',
      title: 'Beautiful Apartment in Nairobi',
      description: 'A stunning 2-bedroom apartment with modern amenities',
      price: 150000,
      location: 'Nairobi, Kenya',
      images: ['image1.jpg', 'image2.jpg'],
      bedrooms: 2,
      bathrooms: 2,
      propertyType: 'apartment'
    },
    {
      id: '2',
      title: 'Spacious House in Mombasa',
      description: 'A large family house with garden and swimming pool',
      price: 300000,
      location: 'Mombasa, Kenya',
      images: ['house1.jpg', 'house2.jpg'],
      bedrooms: 4,
      bathrooms: 3,
      propertyType: 'house'
    }
  ],

  user: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+254712345678',
    trustScore: 85,
    isVerified: true,
    role: 'user'
  },

  paginatedResponse: {
    data: [],
    total: 100,
    page: 1,
    limit: 10,
    hasNext: true,
    hasPrev: false
  },

  searchResponse: {
    results: [],
    total: 50,
    query: 'apartment',
    filters: {}
  }
};

// Mock implementations for common hooks
export const mockHookImplementations = {
  useFormValidation: (config: any) => ({
    values: Object.keys(config).reduce((acc, key) => {
      acc[key] = config[key].initialValue;
      return acc;
    }, {} as any),
    errors: {},
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    handleSubmit: vi.fn(),
    setFieldValue: vi.fn(),
    setFieldError: vi.fn(),
    reset: vi.fn(),
    validateForm: vi.fn().mockReturnValue({ isValid: true, errors: {} }),
    validateField: vi.fn().mockReturnValue(true),
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    submitCount: 0,
    fileUpload: {
      uploadFile: vi.fn(),
      uploadProgress: {},
      uploadedFiles: {},
      removeFile: vi.fn(),
      clearFiles: vi.fn()
    }
  }),

  useSafeQuery: (options: any) => ({
    data: options.fallbackData,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
    hasValidData: true,
    originalData: options.fallbackData,
    cancelRequest: vi.fn(),
    activeOperations: [],
    requestStats: { count: 1, lastUsed: Date.now() }
  }),

  useComponentPerformance: (options: any) => ({
    metrics: {
      renderTime: 10.5,
      renderCount: 1,
      memoryUsage: 1024,
      networkRequests: 0
    },
    trackRender: vi.fn(),
    startTiming: vi.fn(),
    endTiming: vi.fn(),
    trackMemory: vi.fn(),
    trackNetworkRequest: vi.fn(),
    withPerformanceMonitor: vi.fn((name, fn) => fn)
  }),

  usePagination: (options: any) => ({
    data: [],
    page: 1,
    setPage: vi.fn(),
    hasNext: false,
    hasPrev: false,
    isLoading: false,
    totalPages: 1,
    totalItems: 0,
    pageSize: options.pageSize || 10,
    loadMore: vi.fn(),
    hasMore: false,
    goToFirstPage: vi.fn(),
    goToLastPage: vi.fn()
  }),

  useAccessibility: () => ({
    trapFocus: vi.fn(),
    restoreFocus: vi.fn(),
    announceLiveRegion: vi.fn(),
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
    keyboardNavigation: {
      isUsingKeyboard: false,
      lastKeyPressed: null
    },
    useKeyboardNavigation: vi.fn()
  })
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock global objects
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock performance API
  Object.defineProperty(global, 'performance', {
    writable: true,
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      memory: {
        usedJSHeapSize: 1024 * 1024, // 1MB
        totalJSHeapSize: 2 * 1024 * 1024, // 2MB
        jsHeapSizeLimit: 4 * 1024 * 1024 // 4MB
      }
    }
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  return {
    localStorageMock,
    cleanup: () => {
      vi.clearAllMocks();
    }
  };
};

// Performance benchmarks for regression testing
export const performanceBenchmarks = {
  hookInitialization: {
    formValidation: 50, // ms
    dataFetching: 30,   // ms
    performanceMonitor: 20, // ms
    pagination: 40,     // ms
    accessibility: 25   // ms
  },
  
  operations: {
    formValidation: 200, // ms for 100 operations
    dataFetching: 100,   // ms for 10 refetches
    pagination: 150      // ms for 20 page changes
  },
  
  memory: {
    formValidation: 1024 * 1024,     // 1MB max growth
    dataFetching: 2 * 1024 * 1024,   // 2MB max growth
    performanceMonitor: 512 * 1024   // 512KB max growth
  }
};

// Test data generators
export const generateTestData = {
  properties: (count: number) => Array.from({ length: count }, (_, i) => ({
    id: `prop-${i + 1}`,
    title: `Property ${i + 1}`,
    description: `Description for property ${i + 1}`,
    price: (i + 1) * 50000,
    location: `Location ${i + 1}`,
    images: [`image${i + 1}.jpg`],
    bedrooms: Math.floor(Math.random() * 5) + 1,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    propertyType: ['apartment', 'house', 'condo'][Math.floor(Math.random() * 3)]
  })),

  users: (count: number) => Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    firstName: `FirstName${i + 1}`,
    lastName: `LastName${i + 1}`,
    email: `user${i + 1}@example.com`,
    phone: `+25471234567${i}`,
    trustScore: Math.floor(Math.random() * 100),
    isVerified: Math.random() > 0.5,
    role: 'user'
  })),

  formData: (fields: string[]) => fields.reduce((acc, field) => {
    acc[field] = `test-${field}-value`;
    return acc;
  }, {} as Record<string, string>)
};

// Export everything for easy importing in tests
export * from './backward-compatibility.test';
export * from './feature-parity.test';
export * from './performance-validation.test';