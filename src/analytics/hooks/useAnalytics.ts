import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiResponse } from '../../shared/types'

// Analytics types
export interface AnalyticsMetrics {
  totalUsers: number;
  totalProperties: number;
  totalVerifications: number;
  totalMessages: number;
  userGrowth: number;
  propertyGrowth: number;
  verificationRate: number;
  responseRate: number;
}

export interface TimeSeriesData {
  date: string;
  users: number;
  properties: number;
  verifications: number;
  messages: number;
}

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'month';
  metrics?: string[];
}

// Mock API functions - replace with actual API calls
const analyticsApi = {
  getMetrics: async (filter?: AnalyticsFilter): Promise<ApiResponse<AnalyticsMetrics>> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.granularity) params.append('granularity', filter.granularity);
    
    const response = await fetch(`/api/analytics/metrics?${params}`);
    if (!response.ok) throw new Error('Failed to fetch analytics metrics');
    return response.json();
  },

  getTimeSeries: async (filter?: AnalyticsFilter): Promise<ApiResponse<TimeSeriesData[]>> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.granularity) params.append('granularity', filter.granularity);
    
    const response = await fetch(`/api/analytics/timeseries?${params}`);
    if (!response.ok) throw new Error('Failed to fetch time series data');
    return response.json();
  },

  getUserAnalytics: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`/api/analytics/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user analytics');
    return response.json();
  },

  getPropertyAnalytics: async (propertyId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`/api/analytics/properties/${propertyId}`);
    if (!response.ok) throw new Error('Failed to fetch property analytics');
    return response.json();
  },

  trackEvent: async (event: {
    name: string;
    properties?: Record<string, any>;
    userId?: string;
  }): Promise<ApiResponse<void>> => {
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to track event');
    return response.json();
  },
};

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  metrics: (filter?: AnalyticsFilter) => [...analyticsKeys.all, 'metrics', filter] as const,
  timeSeries: (filter?: AnalyticsFilter) => [...analyticsKeys.all, 'timeseries', filter] as const,
  userAnalytics: (userId: string) => [...analyticsKeys.all, 'user', userId] as const,
  propertyAnalytics: (propertyId: string) => [...analyticsKeys.all, 'property', propertyId] as const,
};

// Get analytics metrics
export function useAnalyticsMetrics(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: analyticsKeys.metrics(filter),
    queryFn: () => analyticsApi.getMetrics(filter),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get time series data
export function useAnalyticsTimeSeries(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: analyticsKeys.timeSeries(filter),
    queryFn: () => analyticsApi.getTimeSeries(filter),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get user analytics
export function useUserAnalytics(userId: string) {
  return useQuery({
    queryKey: analyticsKeys.userAnalytics(userId),
    queryFn: () => analyticsApi.getUserAnalytics(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get property analytics
export function usePropertyAnalytics(propertyId: string) {
  return useQuery({
    queryKey: analyticsKeys.propertyAnalytics(propertyId),
    queryFn: () => analyticsApi.getPropertyAnalytics(propertyId),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Track event mutation
export function useTrackEvent() {
  return useMutation({
    mutationFn: analyticsApi.trackEvent,
    // No need to invalidate queries for event tracking
  });
}

// Custom hook for easy event tracking
export function useEventTracker() {
  const trackEventMutation = useTrackEvent();

  const trackEvent = (name: string, properties?: Record<string, any>, userId?: string) => {
    trackEventMutation.mutate({ name, properties, userId });
  };

  return { trackEvent, isTracking: trackEventMutation.isPending };
}