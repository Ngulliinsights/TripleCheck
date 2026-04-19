/**
 * Fraud Detection — data layer
 *
 * Architecture
 * ────────────
 * • Query hooks are top-level exports — composable anywhere without violating
 *   the Rules of Hooks.
 * • useFraudDetection owns mutations only. Components compose it with the
 *   query hooks they need.
 * • Explicit generics are placed on mutationFn signatures (not on useMutation
 *   itself) to avoid the <Type> vs comparison-operator ambiguity in .ts files.
 * • TanStack Query v4 API: isLoading (not isPending), useMutation({mutationFn}).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { useCallback } from "react"

import { apiClient } from "../../local/services/unified-api-client"

// ─── Domain types ──────────────────────────────────────────────────────────────

export type AlertSeverity   = "critical" | "high" | "medium" | "low"
export type AlertStatus     = "active" | "investigating" | "resolved" | "dismissed"
export type ParticipantType = "individual" | "entity" | "professional" | "institution"
export type VerificationStatus = "verified" | "pending" | "failed" | "synthetic"
export type EvidenceType    = "document" | "transaction" | "communication" | "behavioral" | "network"
export type RiskLevel       = "low" | "medium" | "high"
export type ReportPriority  = "low" | "medium" | "high" | "urgent"
export type SystemHealthStatus = "operational" | "degraded" | "down"

export interface ParticipantInfo {
  id: string
  type: ParticipantType
  name: string
  role: string
  riskScore: number
  previousIncidents: number
  verificationStatus: VerificationStatus
  jurisdictions: string[]
  networkConnections: number
}

export interface Evidence {
  id: string
  type: EvidenceType
  source: string
  description: string
  confidence: number
  timestamp: Date
  hash: string
  metadata: Record<string, unknown>
}

export interface RiskFactor {
  category: string
  description: string
  weight: number
  evidence: string[]
}

export interface FraudAlert {
  id: string
  severity: AlertSeverity
  category: string
  subcategories: string[]
  confidence: number
  propertyId?: string
  transactionId?: string
  networkId?: string
  participants: ParticipantInfo[]
  evidence: Evidence[]
  riskFactors: RiskFactor[]
  jurisdiction: string[]
  estimatedLoss?: number
  timeframe: {
    detectedAt: Date
    incidentStart?: Date
    incidentEnd?: Date
  }
  investigationPriority: number
  relatedAlerts: string[]
  status: AlertStatus
  assignedTo?: string
  notes?: string
}

export interface TransactionDocument {
  id: string
  type: string
  url: string
  metadata?: Record<string, unknown>
}

export interface TransactionData {
  id: string
  amount: number
  propertyId: string
  userId: string
  paymentMethod: string
  timestamp: string
  participants?: ParticipantInfo[]
  documents?: TransactionDocument[]
  metadata?: Record<string, unknown>
}

export interface RecentActivityItem {
  id: string
  type: string
  description: string
  timestamp: Date
  severity?: AlertSeverity
}

export interface FraudDashboardData {
  totalAlerts: number
  criticalAlerts: number
  transactionsAnalyzed: number
  lossesPrevented: number
  alertsChange: number
  analysisRate: number
  detectionRate: number
  falsePositiveRate: number
  avgResponseTime: number
  categoryBreakdown: Record<string, number>
  recentActivity: RecentActivityItem[]
}

export interface SystemStatus {
  status: SystemHealthStatus
  uptime: number
  lastProcessed: Date
  mlModelsStatus: Record<string, string>
  dataIntegrationStatus: string
  processingQueue: number
}

export interface NetworkConnection {
  from: string
  to: string
  type: string
  strength: number
  frequency: number
  riskLevel: RiskLevel
}

export interface NetworkAnalysis {
  networkId: string
  participants: ParticipantInfo[]
  connections: NetworkConnection[]
  riskScore: number
  suspiciousPatterns: string[]
  timeframe: { start: Date; end: Date }
}

export interface FeatureImportanceItem {
  feature: string
  importance: number
}

export interface MLAnalytics {
  modelPerformance: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
  }
  featureImportance: FeatureImportanceItem[]
  predictionDistribution: Record<string, number>
  modelVersions: Record<string, string>
  trainingMetrics: {
    lastTraining: Date
    datasetSize: number
    trainingAccuracy: number
  }
}

export interface FraudReport {
  id: string
  alertIds: string[]
  title: string
  description: string
  priority: ReportPriority
  status: string
  createdAt: Date
}

// ─── Filter / payload shapes ───────────────────────────────────────────────────

export interface AlertFilters {
  severity?: AlertSeverity
  category?: string
  status?: AlertStatus
  search?: string
  limit?: number
  offset?: number
}

export interface ReportFilters {
  status?: string
  priority?: ReportPriority
  limit?: number
}

export interface CreateReportPayload {
  alertIds: string[]
  title: string
  description: string
  priority: ReportPriority
}

// Internal mutation variable shape — avoids generic-on-useMutation ambiguity
interface UpdateAlertVariables {
  alertId: string
  updates: Partial<FraudAlert>
}

// ─── Query key factory ─────────────────────────────────────────────────────────

export const fraudKeys = {
  all: ["fraud-detection"] as const,
  dashboard: (userId?: string, timeRange?: string) =>
    [...fraudKeys.all, "dashboard", userId, timeRange] as const,
  alerts: (filters?: AlertFilters) =>
    [...fraudKeys.all, "alerts", filters] as const,
  alert: (id: string) =>
    [...fraudKeys.all, "alert", id] as const,
  systemStatus: () =>
    [...fraudKeys.all, "system-status"] as const,
  networkAnalysis: (opts?: { userId?: string; propertyId?: string; timeRange?: string }) =>
    [...fraudKeys.all, "network-analysis", opts] as const,
  mlAnalytics: (timeRange?: string) =>
    [...fraudKeys.all, "ml-analytics", timeRange] as const,
  reports: (filters?: ReportFilters) =>
    [...fraudKeys.all, "reports", filters] as const,
} as const

// ─── Utility ──────────────────────────────────────────────────────────────────

function buildParams(
  entries: Record<string, string | number | undefined | null>
): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(entries)) {
    if (v != null) p.append(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ""
}

// ─── Query hooks (top-level — composable anywhere) ────────────────────────────

export function useFraudDashboard(
  userId?: string,
  timeRange?: string,
  options?: Partial<UseQueryOptions<FraudDashboardData>>
) {
  return useQuery<FraudDashboardData>({
    queryKey: fraudKeys.dashboard(userId, timeRange),
    queryFn: async () => {
      const qs = buildParams({ userId, timeRange })
      const res = await apiClient.get<FraudDashboardData>(
        `/api/fraud-detection/dashboard${qs}`
      )
      return res.data
    },
    refetchInterval: 30_000,
    ...options,
  })
}

export function useFraudAlerts(
  filters?: AlertFilters,
  options?: Partial<UseQueryOptions<FraudAlert[]>>
) {
  return useQuery<FraudAlert[]>({
    queryKey: fraudKeys.alerts(filters),
    queryFn: async () => {
      const qs = buildParams({
        severity: filters?.severity,
        category: filters?.category,
        status:   filters?.status,
        search:   filters?.search,
        limit:    filters?.limit,
        offset:   filters?.offset,
      })
      const res = await apiClient.get<FraudAlert[]>(
        `/api/fraud-detection/alerts${qs}`
      )
      return res.data
    },
    refetchInterval: 15_000,
    ...options,
  })
}

export function useFraudAlert(
  alertId: string,
  options?: Partial<UseQueryOptions<FraudAlert>>
) {
  return useQuery<FraudAlert>({
    queryKey: fraudKeys.alert(alertId),
    queryFn: async () => {
      const res = await apiClient.get<FraudAlert>(
        `/api/fraud-detection/alerts/${alertId}`
      )
      return res.data
    },
    enabled: Boolean(alertId),
    ...options,
  })
}

export function useSystemStatus(
  options?: Partial<UseQueryOptions<SystemStatus>>
) {
  return useQuery<SystemStatus>({
    queryKey: fraudKeys.systemStatus(),
    queryFn: async () => {
      const res = await apiClient.get<SystemStatus>(
        "/api/fraud-detection/system/status"
      )
      return res.data
    },
    refetchInterval: 60_000,
    ...options,
  })
}

export function useNetworkAnalysis(
  opts?: { userId?: string; propertyId?: string; timeRange?: string },
  options?: Partial<UseQueryOptions<NetworkAnalysis[]>>
) {
  return useQuery<NetworkAnalysis[]>({
    queryKey: fraudKeys.networkAnalysis(opts),
    queryFn: async () => {
      const qs = buildParams({
        userId:     opts?.userId,
        propertyId: opts?.propertyId,
        timeRange:  opts?.timeRange,
      })
      const res = await apiClient.get<NetworkAnalysis[]>(
        `/api/fraud-detection/network-analysis${qs}`
      )
      return res.data
    },
    ...options,
  })
}

export function useMLAnalytics(
  timeRange?: string,
  options?: Partial<UseQueryOptions<MLAnalytics>>
) {
  return useQuery<MLAnalytics>({
    queryKey: fraudKeys.mlAnalytics(timeRange),
    queryFn: async () => {
      const qs = buildParams({ timeRange })
      const res = await apiClient.get<MLAnalytics>(
        `/api/fraud-detection/ml-analytics${qs}`
      )
      return res.data
    },
    ...options,
  })
}

export function useFraudReports(
  filters?: ReportFilters,
  options?: Partial<UseQueryOptions<FraudReport[]>>
) {
  return useQuery<FraudReport[]>({
    queryKey: fraudKeys.reports(filters),
    queryFn: async () => {
      const qs = buildParams({
        status:   filters?.status,
        priority: filters?.priority,
        limit:    filters?.limit,
      })
      const res = await apiClient.get<FraudReport[]>(
        `/api/fraud-detection/reports${qs}`
      )
      return res.data
    },
    ...options,
  })
}

// ─── Mutation hook ────────────────────────────────────────────────────────────

export function useFraudDetection() {
  const qc = useQueryClient()

  // ── Process transaction ────────────────────────────────────────────────────
  // Types on mutationFn — NOT on useMutation<...> — to avoid the
  // less-than operator ambiguity that breaks the parser in .ts files.

  const processTransactionMutation = useMutation({
    mutationFn: async (payload: TransactionData): Promise<FraudAlert[]> => {
      const res = await apiClient.post<FraudAlert[]>(
        "/api/fraud-detection/analyze",
        payload
      )
      return res.data
    },
    onSuccess: (alerts: FraudAlert[]) => {
      qc.invalidateQueries({ queryKey: fraudKeys.dashboard() })
      qc.invalidateQueries({ queryKey: fraudKeys.alerts() })
      for (const alert of alerts) {
        qc.setQueryData(fraudKeys.alert(alert.id), alert)
      }
    },
  })

  // ── Update alert ───────────────────────────────────────────────────────────

  const updateAlertMutation = useMutation({
    mutationFn: async (vars: UpdateAlertVariables): Promise<FraudAlert> => {
      const res = await apiClient.patch<FraudAlert>(
        `/api/fraud-detection/alerts/${vars.alertId}`,
        vars.updates
      )
      return res.data
    },
    onSuccess: (alert: FraudAlert) => {
      qc.setQueryData(fraudKeys.alert(alert.id), alert)
      qc.invalidateQueries({ queryKey: fraudKeys.alerts() })
      qc.invalidateQueries({ queryKey: fraudKeys.dashboard() })
    },
  })

  // ── Create report ──────────────────────────────────────────────────────────

  const createReportMutation = useMutation({
    mutationFn: async (payload: CreateReportPayload): Promise<FraudReport> => {
      const res = await apiClient.post<FraudReport>(
        "/api/fraud-detection/reports",
        payload
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fraudKeys.reports() })
    },
  })

  // ── Public API ─────────────────────────────────────────────────────────────

  const processTransaction = useCallback(
    (payload: TransactionData): Promise<FraudAlert[]> =>
      processTransactionMutation.mutateAsync(payload),
    [processTransactionMutation]
  )

  const updateAlert = useCallback(
    (alertId: string, updates: Partial<FraudAlert>): Promise<FraudAlert> =>
      updateAlertMutation.mutateAsync({ alertId, updates }),
    [updateAlertMutation]
  )

  const createReport = useCallback(
    (payload: CreateReportPayload): Promise<FraudReport> =>
      createReportMutation.mutateAsync(payload),
    [createReportMutation]
  )

  // ── Bulk helpers (bypass wrapper to avoid redundant re-renders) ────────────

  const dismissAlerts = useCallback(
    (alertIds: string[]): Promise<FraudAlert[]> =>
      Promise.all(
        alertIds.map((id) =>
          updateAlertMutation.mutateAsync({ alertId: id, updates: { status: "dismissed" } })
        )
      ),
    [updateAlertMutation]
  )

  const escalateAlerts = useCallback(
    (alertIds: string[]): Promise<FraudAlert[]> =>
      Promise.all(
        alertIds.map((id) =>
          updateAlertMutation.mutateAsync({
            alertId: id,
            updates: { status: "investigating", investigationPriority: 100 },
          })
        )
      ),
    [updateAlertMutation]
  )

  const assignAlerts = useCallback(
    (alertIds: string[], assignee: string): Promise<FraudAlert[]> =>
      Promise.all(
        alertIds.map((id) =>
          updateAlertMutation.mutateAsync({
            alertId: id,
            updates: { status: "investigating", assignedTo: assignee },
          })
        )
      ),
    [updateAlertMutation]
  )

  return {
    // Mutations
    processTransaction,
    updateAlert,
    createReport,
    dismissAlerts,
    escalateAlerts,
    assignAlerts,

    // Granular loading flags (v5: isPending, not isLoading)
    isProcessing:    processTransactionMutation.isPending,
    isUpdating:      updateAlertMutation.isPending,
    isCreatingReport: createReportMutation.isPending,

    // Combined convenience flag
    isLoading:
      processTransactionMutation.isPending ||
      updateAlertMutation.isPending ||
      createReportMutation.isPending,

    // Last error across any mutation
    error:
      processTransactionMutation.error ??
      updateAlertMutation.error ??
      createReportMutation.error,
  }
}

export default useFraudDetection