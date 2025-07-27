import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrustScore } from '../types/trust.types';
import { ApiResponse } from '@/shared/types';

// Mock API functions - replace with actual API calls
const trustApi = {
  getTrustScore: async (userId: string): Promise<ApiResponse<TrustScore>> => {
    const response = await fetch(`/api/trust/score/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch trust score');
    return response.json();
  },

  updateTrustScore: async (userId: string, factors: Partial<TrustScore['factors']>): Promise<ApiResponse<TrustScore>> => {
    const response = await fetch(`/api/trust/score/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factors }),
    });
    if (!response.ok) throw new Error('Failed to update trust score');
    return response.json();
  },
};

// Query keys
export const trustKeys = {
  all: ['trust'] as const,
  scores: () => [...trustKeys.all, 'scores'] as const,
  score: (userId: string) => [...trustKeys.scores(), userId] as const,
};

// Get trust score for a user
export function useTrustScore(userId: string) {
  return useQuery({
    queryKey: trustKeys.score(userId),
    queryFn: () => trustApi.getTrustScore(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Update trust score mutation
export function useUpdateTrustScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, factors }: { userId: string; factors: Partial<TrustScore['factors']> }) =>
      trustApi.updateTrustScore(userId, factors),
    onSuccess: (data, variables) => {
      // Update the specific trust score in cache
      queryClient.setQueryData(trustKeys.score(variables.userId), data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: trustKeys.scores() });
    },
  });
}

// Calculate trust level based on score
export function getTrustLevel(score: number): 'low' | 'medium' | 'high' | 'premium' {
  if (score >= 900) return 'premium';
  if (score >= 750) return 'high';
  if (score >= 500) return 'medium';
  return 'low';
}

// Get trust level color
export function getTrustLevelColor(level: string): string {
  switch (level) {
    case 'premium': return 'text-purple-600';
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-red-600';
    default: return 'text-gray-600';
  }
}