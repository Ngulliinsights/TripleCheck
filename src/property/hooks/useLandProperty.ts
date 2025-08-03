/**
 * Custom hook for fetching land property details
 * Provides mock data fallback for development and presentation
 */

import { useQuery } from "@tanstack/react-query";

import { fetchMockLandProperty, hasMockLandProperty, type MockLandProperty } from "../services/mock-land-data";

interface UseLandPropertyResult {
  data: MockLandProperty | null;
  isLoading: boolean;
  error: Error | null;
  hasValidData: boolean;
}

/**
 * Hook for fetching land property details with mock data fallback
 */
export function useLandProperty(id: string): UseLandPropertyResult {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["land-property", id],
    queryFn: async () => {
      if (!id || id.trim() === "") {
        throw new Error("Land property ID is required");
      }

      try {
        // For now, always use mock data
        // In production, this would first try the API and fallback to mock data
        if (hasMockLandProperty(id)) {
          const landData = await fetchMockLandProperty(id);
          if (!landData) {
            throw new Error(`Land property with ID ${id} not found`);
          }
          return landData;
        }

        // If no mock data exists, throw an error
        throw new Error(`Land property with ID ${id} not found in mock data`);
      } catch (err) {
        console.error(`Error fetching land property ${id}:`, err);
        throw err;
      }
    },
    enabled: Boolean(id) && id.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    retryDelay: 1000,
  });

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    hasValidData: Boolean(data),
  };
}