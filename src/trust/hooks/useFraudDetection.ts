import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { FraudAlert } from '../types/trust.types';

import { ApiResponse } from '@/shared/types';

// Mock API functions - replace with actual API calls
const fraudApi = {
  getFraudAlerts: async (userId?: string): Promise<ApiResponse<FraudAlert[]>> => {
    const url = userId ? `/api/trust/fraud-alerts?userId=${userId}` : '/api/trust/fraud-alerts';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch fraud alerts');
    return response.json();
  },

  reportFraud: async (alert: Omit<FraudAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<FraudAlert>> => {
    const response = await fetch('/api/trust/fraud-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    if (!response.ok) throw new Error('Failed to report fraud');
    return response.json();
  },

  updateAlertStatus: async (alertId: string, status: FraudAlert['status']): Promise<ApiResponse<FraudAlert>> => {
    const response = await fetch(`/api/trust/fraud-alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update alert status');
    return response.json();
  },
};

// Query keys
export const fraudKeys = {
  all: ['fraud'] as const,
  alerts: () => [...fraudKeys.all, 'alerts'] as const,
  userAlerts: (userId: string) => [...fraudKeys.alerts(), 'user', userId] as const,
};

// Get fraud alerts
export function useFraudAlerts(userId?: string) {
  return useQuery({
    queryKey: userId ? fraudKeys.userAlerts(userId) : fraudKeys.alerts(),
    queryFn: () => fraudApi.getFraudAlerts(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Report fraud mutation
export function useReportFraud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fraudApi.reportFraud,
    onSuccess: () => {
      // Invalidate fraud alerts to refetch
      queryClient.invalidateQueries({ queryKey: fraudKeys.alerts() });
    },
  });
}

// Update alert status mutation
export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: FraudAlert['status'] }) =>
      fraudApi.updateAlertStatus(alertId, status),
    onSuccess: () => {
      // Invalidate fraud alerts to refetch
      queryClient.invalidateQueries({ queryKey: fraudKeys.alerts() });
    },
  });
}

// Get severity color
export function getSeverityColor(severity: FraudAlert['severity']): string {
  switch (severity) {
    case 'critical': return 'text-red-700 bg-red-50';
    case 'high': return 'text-red-600 bg-red-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}