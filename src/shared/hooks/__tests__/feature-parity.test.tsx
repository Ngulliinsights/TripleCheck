/**
 * Feature Parity Tests
 * 
 * These tests ensure that consolidated hooks provide all original features
 * and that enhanced features work correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import consolidated hooks
import { 
  useFormValidation, 
  usePropertyFormValidation, 
  useUserRegistrationValidation,
  createPropertyFormConfig,
  createUserRegistrationFormConfig
} from '../useFormValidation';
import { 
  useSafeQuery, 
  useSafePropertiesQuery, 
  useSafePropertyQuery,
  useSafeOwnerPropertiesQuery,
  useSafePropertyActionsQuery,
  useSafePropertySearchQuery
} from '../useSafeQuery';
import { useComponentPerformance } from '../useComponentPerformance';
import { usePagination } from '../usePagination';
import { useAccessibility } from '../useAccessibility';
import { 
  useConfigurableHook,
  createDataFetchingHook,
  createFormValidationHook
} from '../useConfigurableHook';

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
      