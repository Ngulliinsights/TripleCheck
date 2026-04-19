/**
 * Trust Score — data layer
 *
 * Architecture
 * ────────────
 * • useTrustScore and useUpdateTrustScore are top-level exports, consistent
 *   with the project's other data-layer hooks.
 * • Uses apiClient (not raw fetch) for consistency with the rest of the codebase
 *   and for interceptor/auth support.
 * • queryFn unwraps ApiResponse<TrustScore> to the domain type — consumers
 *   receive TrustScore directly and never need to dereference .data.
 * • Pure utility functions (getTrustLevel, getTrustLevelColor) are module-level
 *   exports — no hook overhead, fully tree-shakeable.
 * • TanStack Query v5 API throughout: isPending (not isLoading).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "../../local/services/unified-api-client"
import { trustService } from "../services/TrustService"
import { type TrustScore } from "../types/trust.types"

// ─── Query key factory ─────────────────────────────────────────────────────────

export const trustKeys = {
  all:    ["trust"] as const,
  scores: () => [...trustKeys.all, "scores"] as const,
  score:  (userId: string) => [...trustKeys.scores(), userId] as const,
} as const

// ─── Query hooks ───────────────────────────────────────────────────────────────

/** Fetch and cache the trust score for a given user. */
export function useTrustScore(userId: string) {
  return useQuery<TrustScore>({
    queryKey: trustKeys.score(userId),
    queryFn:  async () => {
      const res = await trustService.getTrustScore(userId)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to retrieve trust score');
      }
      return res.data.trustScore;
    },
    enabled:   Boolean(userId),
    staleTime: 10 * 60 * 1_000, // 10 minutes
  })
}

// ─── Mutation hooks ────────────────────────────────────────────────────────────

/** Partially update the trust-score factors for a user. */
export function useUpdateTrustScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      factors,
    }: {
      userId: string
      factors: Partial<TrustScore["factors"]>
    }): Promise<TrustScore> => {
      const res = await trustService.updateTrustScore(userId, factors)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update trust score');
      }
      return res.data;
    },
    onSuccess: (updatedScore, { userId }) => {
      // Write the fresh value directly so consumers see it immediately.
      queryClient.setQueryData(trustKeys.score(userId), updatedScore)
      // Invalidate the broader scores list in case it's displayed elsewhere.
      queryClient.invalidateQueries({ queryKey: trustKeys.scores() })
    },
  })
}

// ─── Utility functions (pure — no hook dependency) ────────────────────────────

export type TrustLevel = "low" | "medium" | "high" | "premium"

/** Derive a named trust level from a numeric score (0–1000). */
export function getTrustLevel(score: number): TrustLevel {
  if (score >= 900) return "premium"
  if (score >= 750) return "high"
  if (score >= 500) return "medium"
  return "low"
}

/** Map a trust level to its Tailwind text-color class. */
export function getTrustLevelColor(level: TrustLevel): string {
  switch (level) {
    case "premium": return "text-purple-600"
    case "high":    return "text-green-600"
    case "medium":  return "text-yellow-600"
    case "low":     return "text-red-600"
    default:        return "text-gray-600"
  }
}