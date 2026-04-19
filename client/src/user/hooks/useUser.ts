import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { UserBusinessLogic } from '../services/user-business-logic'
import { User } from '@shared/types/auth.types'
import { ApiResponse } from '@shared/types/api.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityScore {
  score: number
  level: string
  factors: Record<string, number>
  recommendations: string[]
}

interface UserInsights {
  insights: string[]
  recommendations: string[]
  achievements: unknown[]
  goals: unknown[]
}

interface EnrichedUser extends User {
  activityScore: ActivityScore
  insights: UserInsights
}

interface NotificationSummary {
  total: number
  unread: number
  byType: Record<string, number>
}

interface NotificationsPayload {
  notifications: unknown[]
  summary: NotificationSummary
}

interface DashboardSummary {
  totalProperties: number
  activeListings: number
  totalMessages: number
  unreadMessages: number
  trustScore: number
  verificationStatus: string
}

interface DashboardPayload {
  summary: DashboardSummary
  recentActivity: unknown[]
  quickActions: unknown[]
  notifications: unknown[]
}

interface ActivitySummary {
  totalActivities: number
  activityScore: number
  mostActiveDay: string
  activityTrends: unknown[]
}

interface ActivityPayload {
  activities: unknown[]
  summary: ActivitySummary
}

interface PaginationParams {
  page?: number
  limit?: number
}

interface NotificationParams extends PaginationParams {
  type?: string
  unreadOnly?: boolean
}

interface ActivityParams extends PaginationParams {
  type?: string
  dateFrom?: string
  dateTo?: string
}

interface DeleteConfirmation {
  password: string
  reason?: string
}

// ─── Auth token ───────────────────────────────────────────────────────────────

/**
 * Single source of truth for the auth token key.
 * If this key ever changes, update it here only.
 */
const AUTH_TOKEN_KEY = 'auth_token'

function authHeader(): Record<string, string> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

/**
 * Throws a descriptive Error from a non-ok Response.
 * Falls back to HTTP status text if the body can't be parsed.
 */
async function throwOnError(response: Response): Promise<void> {
  if (response.ok) return
  const body = await response.json().catch(() => ({})) as { message?: string }
  throw new Error(body.message ?? `HTTP ${response.status}: ${response.statusText}`)
}

/**
 * Builds a URLSearchParams from an object, omitting undefined values.
 */
function toSearchParams(params: Record<string, unknown>): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      sp.append(key, String(value))
    }
  }
  return sp
}

// ─── API layer ────────────────────────────────────────────────────────────────

const userApi = {
  /**
   * Fetches a user and enriches the response with client-side business logic.
   *
   * NOTE: `mockActivityData` uses hardcoded defaults until the backend exposes
   * a dedicated activity-metrics endpoint. Replace with a real fetch when ready.
   */
  async getUser(userId: string): Promise<ApiResponse<EnrichedUser>> {
    const response = await fetch(`/api/users/${userId}`, { headers: authHeader() })
    await throwOnError(response)

    const data: ApiResponse<User> = await response.json()

    if (!data.data) return data as ApiResponse<EnrichedUser>

    const user = data.data

    // TODO: replace with real activity data from the backend
    const activityData = {
      loginFrequency: 3,
      propertyInteractions: 10,
      messageActivity: 5,
      profileCompleteness: 85,
      accountAge: 30,
      verificationLevel: user.isVerified ? 100 : 50,
    }

    // Return a new object rather than mutating the parsed response
    return {
      ...data,
      data: {
        ...user,
        activityScore: UserBusinessLogic.calculateActivityScore(activityData),
        insights: UserBusinessLogic.generateUserInsights(user, activityData),
      },
    }
  },

  /**
   * Validates updates client-side via business logic before sending to server.
   * Accepts the current user snapshot so callers can pass cached data instead
   * of triggering an extra network round-trip.
   */
  async updateUser(
    userId: string,
    updates: Partial<User>,
    requestingUserId: string,
    currentUser: User
  ): Promise<ApiResponse<User>> {
    const validation = UserBusinessLogic.validateSettingsUpdate(
      currentUser,
      updates,
      requestingUserId
    )

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(validation.allowedUpdates),
    })
    await throwOnError(response)
    return response.json()
  },

  async getUserNotifications(
    userId: string,
    params: NotificationParams = {}
  ): Promise<ApiResponse<NotificationsPayload>> {
    const qs = toSearchParams(params as Record<string, unknown>)
    const response = await fetch(`/api/users/${userId}/notifications?${qs}`, {
      headers: authHeader(),
    })
    await throwOnError(response)
    return response.json()
  },

  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: authHeader(),
    })
    await throwOnError(response)
    return response.json()
  },

  async getUserDashboard(userId: string): Promise<ApiResponse<DashboardPayload>> {
    const response = await fetch(`/api/users/${userId}/dashboard`, { headers: authHeader() })
    await throwOnError(response)
    return response.json()
  },

  async updateUserPreferences(
    userId: string,
    preferences: User['preferences']
  ): Promise<ApiResponse<User>> {
    const validated = UserBusinessLogic.validateUserPreferences(preferences)

    const response = await fetch(`/api/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(validated),
    })
    await throwOnError(response)
    return response.json()
  },

  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<ApiResponse<{ avatarUrl: string }>> {
    const body = new FormData()
    body.append('avatar', file)

    const response = await fetch(`/api/users/${userId}/avatar`, {
      method: 'POST',
      headers: authHeader(),
      body,
    })
    await throwOnError(response)
    return response.json()
  },

  async getUserActivity(
    userId: string,
    params: ActivityParams = {}
  ): Promise<ApiResponse<ActivityPayload>> {
    const qs = toSearchParams(params as Record<string, unknown>)
    const response = await fetch(`/api/users/${userId}/activity?${qs}`, {
      headers: authHeader(),
    })
    await throwOnError(response)
    return response.json()
  },

  async deleteUser(
    userId: string,
    confirmation: DeleteConfirmation
  ): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(confirmation),
    })
    await throwOnError(response)
    return response.json()
  },
}

// ─── Query key factory ────────────────────────────────────────────────────────

/**
 * Centralized key factory. Every hook and manual cache operation must use
 * these keys to keep cache invalidation predictable.
 */
export const userKeys = {
  all: ['users'] as const,
  user: (userId: string) => ['users', userId] as const,
  notifications: (userId: string) => ['users', userId, 'notifications'] as const,
  dashboard: (userId: string) => ['users', userId, 'dashboard'] as const,
  activity: (userId: string) => ['users', userId, 'activity'] as const,
} as const

// ─── Query hooks ──────────────────────────────────────────────────────────────

export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.user(userId),
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 min — enriched data is expensive to recompute
  })
}

export function useUserNotifications(userId: string, params?: NotificationParams) {
  return useQuery({
    queryKey: [...userKeys.notifications(userId), params] as const,
    queryFn: () => userApi.getUserNotifications(userId, params),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 min — notifications change frequently
  })
}

export function useUserDashboard(userId: string) {
  return useQuery({
    queryKey: userKeys.dashboard(userId),
    queryFn: () => userApi.getUserDashboard(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserActivity(userId: string, params?: ActivityParams) {
  return useQuery({
    queryKey: [...userKeys.activity(userId), params] as const,
    queryFn: () => userApi.getUserActivity(userId, params),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      updates,
      requestingUserId,
    }: {
      userId: string
      updates: Partial<User>
      requestingUserId: string
    }) => {
      // Resolve the current user from cache to avoid a redundant network fetch.
      // If absent (e.g. cold load), the mutation will need to refetch — handled
      // by the business-logic service's own fallback.
      const cached = queryClient.getQueryData<ApiResponse<EnrichedUser>>(
        userKeys.user(userId)
      )
      const currentUser = cached?.data ?? ({} as User)
      return userApi.updateUser(userId, updates, requestingUserId, currentUser)
    },
    onSuccess: (data, { userId }) => {
      // Write the updated user back into the cache directly to avoid a refetch
      queryClient.setQueryData(userKeys.user(userId), data)
    },
  })
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      preferences,
    }: {
      userId: string
      preferences: User['preferences']
    }) => userApi.updateUserPreferences(userId, preferences),
    onSuccess: (data, { userId }) => {
      queryClient.setQueryData(userKeys.user(userId), data)
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      userApi.uploadAvatar(userId, file),
    onSuccess: (_data, { userId }) => {
      // Avatar URL lives inside the user object — refresh the full user record
      queryClient.invalidateQueries({ queryKey: userKeys.user(userId) })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) =>
      userApi.markNotificationRead(notificationId),
    onSuccess: (_data, { notificationId: _ }) => {
      // Invalidate all notification queries for all users — we don't have
      // the userId here, so target the shared prefix
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'users' &&
          query.queryKey[2] === 'notifications',
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      confirmation,
    }: {
      userId: string
      confirmation: DeleteConfirmation
    }) => userApi.deleteUser(userId, confirmation),
    onSuccess: (_data, { userId }) => {
      // Evict all cached data for this user after account deletion
      queryClient.removeQueries({ queryKey: userKeys.user(userId) })
    },
  })
}